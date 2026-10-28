import Link from "next/link";
import { FolderKanban, Users } from "lucide-react";
import { createDbClient } from "@/lib/supabase/db";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateProjectForm } from "./create-project-form";
import { nextProjectColor } from "@/lib/project-colors";
import type { ProjectStatus } from "@/types/database.types";

const ESTADO_LABEL: Record<ProjectStatus, string> = {
  activo: "Activo",
  pausado: "Pausado",
  finalizado: "Finalizado",
  archivado: "Archivado",
};

const ESTADO_TONE: Record<
  ProjectStatus,
  "positive" | "warning" | "neutral"
> = {
  activo: "positive",
  pausado: "warning",
  finalizado: "neutral",
  archivado: "neutral",
};

export default async function ProyectosPage() {
  const profile = await requireProfile();
  const db = createDbClient();
  const [{ data: proyectos }, { data: miembros }] = await Promise.all([
    db
      .from("projects")
      .select("id, nombre, descripcion, color, estado, facturable, created_at")
      .order("created_at", { ascending: true }),
    db.from("project_members").select("project_id"),
  ]);

  const lista = proyectos ?? [];

  const miembrosPorProyecto = new Map<string, number>();
  for (const m of miembros ?? []) {
    miembrosPorProyecto.set(
      m.project_id,
      (miembrosPorProyecto.get(m.project_id) ?? 0) + 1
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proyectos"
        description="Proyectos de VIRTUS COMPANY disponibles para registrar horas. Entra en cada uno para asignar socios, cambiar su estado o ver sus tareas."
      />

      {profile.rol === "admin" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Nuevo proyecto</CardTitle>
              <CardDescription>
                Cualquier socio podrá registrar horas en los proyectos
                activos desde el cronómetro.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CreateProjectForm defaultColor={nextProjectColor(lista.length)} />
          </CardContent>
        </Card>
      )}

      {lista.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <FolderKanban className="h-8 w-8 text-ink-muted" />
          <p className="text-sm text-ink-secondary">
            {profile.rol === "admin"
              ? "Todavía no hay proyectos. Crea el primero arriba."
              : "Todavía no hay proyectos creados. Pide a un administrador que cree el primero."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((proyecto) => (
            <Link key={proyecto.id} href={`/proyectos/${proyecto.id}`}>
              <Card className="h-full p-4 transition-colors hover:border-brand/40">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: proyecto.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium text-ink">
                        {proyecto.nombre}
                      </p>
                      <Badge tone={ESTADO_TONE[proyecto.estado]}>
                        {ESTADO_LABEL[proyecto.estado]}
                      </Badge>
                    </div>
                    {proyecto.descripcion && (
                      <p className="mt-1 text-sm text-ink-muted">
                        {proyecto.descripcion}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-ink-muted">
                      <Users className="h-3.5 w-3.5" />
                      {miembrosPorProyecto.get(proyecto.id) ?? 0} socio
                      {(miembrosPorProyecto.get(proyecto.id) ?? 0) === 1
                        ? ""
                        : "s"}
                      {!proyecto.facturable && <span>· No facturable</span>}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
