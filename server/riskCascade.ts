import { eq, sql } from "drizzle-orm";
import { tasks, taskRiskImpacts } from "../drizzle/schema";

export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function processProjectRiskCascade(db: any, projectId: number): Promise<void> {
  const allProjectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const completedIncidences = allProjectTasks.filter(
    (t: any) => t.type === "incidence" && t.status === "completed"
  );

  const taskIds = allProjectTasks.map((t: any) => t.id);
  if (taskIds.length > 0) {
    await db
      .delete(taskRiskImpacts)
      .where(sql`${taskRiskImpacts.taskId} IN (${taskIds.join(",")})`);
  }

  if (completedIncidences.length === 0) {
    return;
  }

  for (const incidence of completedIncidences) {
    const delayDays = calculateDaysBetween(incidence.startDate, incidence.endDate);
    if (delayDays <= 0) continue;

    for (const task of allProjectTasks) {
      if (task.id === incidence.id) continue;

      await db.insert(taskRiskImpacts).values({
        taskId: task.id,
        incidenceId: incidence.id,
        delayDays: delayDays,
      });

      if (task.type === "delivery_dev") {
        const currentEndDate = new Date(task.endDate);
        const newEndDate = new Date(currentEndDate.setDate(currentEndDate.getDate() + delayDays));

        await db
          .update(tasks)
          .set({ endDate: newEndDate })
          .where(eq(tasks.id, task.id));
      }
    }
  }
}