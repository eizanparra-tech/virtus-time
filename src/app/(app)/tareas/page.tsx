import Link from "next/link";
import { CheckSquare, X } from "lucide-react";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { CreateTaskForm } from "./create-task-form";
import { TaskRow, type TareaView } from "./task-row";

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: filtroProyecto } = await searchParams;
  const profile = await requireProfile();
  const db = createDbClient();

  let tareasQuery = db
    .from("tasks")
    .select(
      "id, project_id, titulo, estado, responsable_id, fecha_limite, created_by"
    )
    .order("fecha_limite", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filtroProyecto) {
    tareasQuery = tareasQuery.eq("project_id", filtroProyecto);
  }

  const [{ data: proyectos }, { data: socios }, { data: tareasData }] =
    await Promise.all([
      db.from("projects").select("id, nombre, color").order("nombre"),
      db
        .from("profiles")
        .select("id, nombre, apellidos")
        .eq("activo", true)
        .order("nombre"),
      tareasQuery,
    ]);

  const listaProyectos = proyectos ?? [];
  const listaSocios = socios ?? [];
  const tareas = tareasData ?? [];

  const proyectoActivo = listaProyectos.find((p) => p.id === filtroProyecto);
  const proyectoPorId = new Map(listaProyectos.map((p) => [p.id, p]));

  const grupos = new Map<string, TareaView[]>();
  for (const t of tareas) {
    const view: TareaView = {
      id: t.id,
      titulo: t.titulo,
      estado: t.estado,
      responsableId: t.responsable_id,
      fechaLimite: t.fecha_limite,
      createdBy: t.created_by,
    };
    const grupo = grupos.get(t.project_id) ?? [];
    grupo.push(view);
    grupos.set(t.project_id, grupo);
  }

  const gruposOrdenados = Array.from(grupos.entries()).sort((a, b) => {
    const na = proyectoPorId.get(a[0])?.nombre ?? "";
    const nb = proyectoPorId.get(b[0])?.nombre ?? "";
    return na.localeCompare(nb, "es");
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tareas"
        description="Tareas organizadas por proyecto, con responsable y fecha límite opcionales."
      />

      {proyectoActivo && (
        <div className="flex items-center gap-2 text-sm text-ink-secondary">
          Mostrando solo:
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: proyectoActivo.color }}
          />
          <span className="font-medium text-ink">{proyectoActivo.nombre}</span>
          <Link
            href="/tareas"
            className="inline-flex items-center gap-1 text-ink-muted hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
            Quitar filtro
          </Link>
        </div>
      )}

      {listaProyectos.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <CheckSquare className="h-8 w-8 text-ink-muted" />
          <p className="text-sm text-ink-secondary">
            Primero necesitas al menos un proyecto. Créalo en Proyectos.
          </p>
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-ink">
              Nueva tarea
            </h2>
            <CreateTaskForm
              proyectos={listaProyectos}
              socios={listaSocios}
              proyectoPorDefecto={filtroProyecto}
            />
          </Card>

          {gruposOrdenados.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <CheckSquare className="h-8 w-8 text-ink-muted" />
              <p className="text-sm text-ink-secondary">
                {proyectoActivo
                  ? "Este proyecto todavía no tiene tareas."
                  : "Todavía no hay ninguna tarea creada."}
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              {gruposOrdenados.map(([projectId, tareasProyecto]) => {
                const proyecto = proyectoPorId.get(projectId);
                return (
                  <div key={projectId}>
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: proyecto?.color ?? "#0b1e3d",
                        }}
                      />
                      <h2 className="text-sm font-semibold text-ink-secondary">
                        {proyecto?.nombre ?? "Proyecto eliminado"}
                      </h2>
                    </div>
                    <Card className="divide-y divide-border">
                      {tareasProyecto.map((tarea) => (
                        <TaskRow
                          key={tarea.id}
                          tarea={tarea}
                          socios={listaSocios}
                          puedeBorrar={
                            profile.rol === "admin" ||
                            tarea.createdBy === profile.id
                          }
                        />
                      ))}
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
