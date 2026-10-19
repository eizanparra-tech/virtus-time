import { FolderKanban } from "lucide-react";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { todayMadrid } from "@/lib/dates";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { TimerCard, type ActiveEntryView } from "./timer-card";
import { ManualEntryForm } from "./manual-entry-form";

export default async function CronometroPage() {
  const profile = await requireProfile();
  const db = createDbClient();

  const [{ data: todosProyectos }, { data: activeRow }] = await Promise.all([
    db
      .from("projects")
      .select("id, nombre, color, estado")
      .order("nombre"),
    db
      .from("time_entries")
      .select("id, descripcion, duracion_segundos, running_since, project_id")
      .eq("user_id", profile.id)
      .is("hora_fin", null)
      .maybeSingle(),
  ]);

  const todos = todosProyectos ?? [];
  const proyectosActivos = todos.filter((p) => p.estado === "activo");
  const proyectoPorId = new Map(todos.map((p) => [p.id, p]));

  const activeEntry: ActiveEntryView | null = activeRow
    ? {
        id: activeRow.id,
        descripcion: activeRow.descripcion,
        duracionSegundos: activeRow.duracion_segundos,
        runningSince: activeRow.running_since,
        proyecto: proyectoPorId.get(activeRow.project_id) ?? {
          id: activeRow.project_id,
          nombre: "Proyecto",
          color: "#0b1e3d",
        },
      }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cronómetro"
        description="Elige un proyecto, escribe en qué estás trabajando e inicia el cronómetro. También puedes añadir horas manualmente."
      />

      {todos.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <FolderKanban className="h-8 w-8 text-ink-muted" />
          <p className="text-sm text-ink-secondary">
            Todavía no hay proyectos. Pide a un administrador que cree uno en
            Proyectos.
          </p>
        </Card>
      ) : (
        <>
          <TimerCard proyectos={proyectosActivos} activeEntry={activeEntry} />
          <ManualEntryForm proyectos={proyectosActivos} today={todayMadrid()} />
        </>
      )}
    </div>
  );
}
