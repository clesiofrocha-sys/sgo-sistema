import { eq, sql } from "drizzle-orm";
import { tarefas, tarefaImpactosDeRisco } from "../drizzle/schema";

export function calcularDiasEntre(dataInicio: Date, dataTermino: Date): number {
  const comecar = new Date(dataInicio).getTime();
  const fim = new Date(dataTermino).getTime();
  const tempoDiferenca = Math.abs(fim - comecar);
  return Math.ceil(tempoDiferenca / (1000 * 60 * 60 * 24));
}

export async function processoProjetoRiscoCascata(db: any, idProjeto: number): Promise<void> {
  const todasAsTarefas = await db
    .select()
    .from(tarefas)
    .where(eq(tarefas.idDoProjeto, idProjeto));

  const incidentesConcluidos = todasAsTarefas.filter(
    (t: any) => t.tipo === "incidência" && t.status === "concluído"
  );

  const idsDeTarefa = todasAsTarefas.map((t: any) => t.id);
  if (idsDeTarefa.length > 0) {
    await db
      .delete(TarefaImpactosDeRisco)
      .where(sql`${TarefaImpactosDeRisco.idDaTarefa} IN (${idsDeTarefa.join(",")})`);
  }

  if (incidentesConcluidos.length === 0) {
    return;
  }
}
