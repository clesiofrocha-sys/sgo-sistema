import { z } from "zod";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { eq } from "drizzle-orm";
import {
  tasks,
  taskParticipants,
  taskRiskImpacts,
  risks,
  teamMembers,
} from "../drizzle/schema";
import { processProjectRiskCascade } from "./riskCascade";

const t = initTRPC.create({
  transformer: superjson,
});

export const publicProcedure = t.procedure;
export const router = t.router;

export const appRouter = router({
  getDashboardMetrics: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = ctx.db;

      const projectTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, input.projectId));

      const projectRisks = await db
        .select()
        .from(risks)
        .where(eq(risks.projectId, input.projectId));

      const now = new Date();
      const totalTasks = projectTasks.length;

      const delayedTasks = projectTasks.filter(
        (t) => t.status !== "completed" && new Date(t.endDate) < now
      ).length;

      const criticalRisks = projectRisks.filter((r) => r.criticality >= 15).length;

      const totalProgress = projectTasks.reduce((acc, t) => acc + (t.progress || 0), 0);
      const overallProgress = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;

      const completedIncidences = projectTasks.filter(
        (t) => t.type === "incidence" && t.status === "completed"
      );

      const daysLostByRisks = completedIncidences.reduce((acc, inc) => {
        const start = new Date(inc.startDate).getTime();
        const end = new Date(inc.endDate).getTime();
        const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
        return acc + diffDays;
      }, 0);

      return {
        totalTasks,
        delayedTasks,
        criticalRisks,
        overallProgress,
        daysLostByRisks,
      };
    }),

  getTasks: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = ctx.db;

      const result = await db
        .select({
          task: tasks,
          responsibleName: teamMembers.name,
        })
        .from(tasks)
        .leftJoin(teamMembers, eq(tasks.responsibleId, teamMembers.id))
        .where(eq(tasks.projectId, input.projectId));

      const impacts = await db.select().from(taskRiskImpacts);

      return result.map(({ task, responsibleName }) => ({
        ...task,
        responsibleName: responsibleName || "Não atribuído",
        riskImpacts: impacts.filter((i) => i.taskId === task.id),
      }));
    }),

  createTask: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        responsibleId: z.number().nullable().optional(),
        startDate: z.date(),
        endDate: z.date(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
        progress: z.number().min(0).max(100),
        type: z.enum([
          "task",
          "delivery_doc",
          "delivery_dev",
          "convocation",
          "meeting",
          "incidence",
        ]),
        seiNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;
      const [newTask] = await db.insert(tasks).values(input);

      if (input.type === "incidence" && input.status === "completed") {
        await processProjectRiskCascade(db, input.projectId);
      }

      return newTask;
    }),

  updateTaskStatus: publicProcedure
    .input(
      z.object({
        taskId: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;

      const [targetTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, input.taskId));

      if (!targetTask) throw new Error("Tarefa não encontrada.");

      await db
        .update(tasks)
        .set({ status: input.status })
        .where(eq(tasks.id, input.taskId));

      if (targetTask.type === "incidence") {
        await processProjectRiskCascade(db, targetTask.projectId);
      }

      return { success: true };
    }),

  getParticipantByRegistration: publicProcedure
    .input(z.object({ registration: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = ctx.db;

      const [existingParticipant] = await db
        .select()
        .from(taskParticipants)
        .where(eq(taskParticipants.registration, input.registration))
        .limit(1);

      return existingParticipant || null;
    }),

  getRisks: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(risks)
        .where(eq(risks.projectId, input.projectId));
    }),

  createRisk: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        description: z.string().min(1),
        probability: z.number().min(1).max(5),
        impact: z.number().min(1).max(5),
        mitigation: z.string().optional(),
        status: z.enum(["open", "mitigated", "closed"]).default("open"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const criticality = input.probability * input.impact;

      return ctx.db.insert(risks).values({
        ...input,
        criticality,
      });
    }),
});

export type AppRouter = typeof appRouter;