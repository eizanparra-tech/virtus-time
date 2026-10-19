import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckSquare } from "lucide-react";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectEditForm } from "./project-edit-form";
import { MembersManager } from "./members-manager";
import type { ProjectStatus } from "@/types/database.types";

const ESTADO_LABEL: Record<ProjectStatus, string> = {
  activo: "Activo",
  pausado: "Pausado",
  finalizado: "Finalizado",
  archivado: "Archivado",
};

const ESTADO_TONE: Record<ProjectStatus, "positive" | "warning" | "neutral"> = {
  activo: "positive",
  pausado: "warning",
  finalizado: "neutral",
  archivado: "neutral",
};

export default async function ProyectoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const db = createDbClient();

  const { data: project } = await db
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  const [{ data: miembrosRows }, { data: todosSocios }, { count: tareasCount }] =
    await Promise.all([
      db.from("project_members").select("user_id").eq("project_id", id),
      db
        .from("profiles")
        .select("id, nombre, apellidos, rol, activo")
        .order("nombre"),
      db
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("project_id", id),
    ]);

  const idsMiembros = new Set((miembrosRows ?? []).map((m) => m.user_id));
  const socios = todosSocios ?? [];
  const miembros = socios.filter((s) => idsMiembros.has(s.id));
  const disponibles = socios.filter((s) => !idsMiembros.has(s.id) && s.activo);

  return (
    <div className="space-y-6">
      <Link
        href="/proyectos"
        className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Proyectos
      </Link>

      <PageHeader
        title={project.nombre}
        description={project.descripcion ?? undefined}
        action={
          <Badge tone={ESTADO_TONE[project.estado]}>
            {ESTADO_LABEL[project.estado]}
          </Badge>
        }
      />

      {profile.rol === "admin" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Editar proyecto</CardTitle>
              <CardDescription>
                Solo los administradores pueden cambiar estos datos.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ProjectEditForm project={project} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Socios asignados</CardTitle>
            <CardDescription>
              {profile.rol === "admin"
                ? "Quiénes participan en este proyecto. Cualquier socio activo puede seguir registrando horas aunque no esté en esta lista."
                : "Quiénes participan en este proyecto."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {profile.rol === "admin" ? (
            <MembersManager
              projectId={project.id}
              miembros={miembros}
              disponibles={disponibles}
            />
          ) : miembros.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Todavía no hay socios asignados.
            </p>
          ) : (
            <ul className="space-y-2">
              {miembros.map((m) => (
                <li key={m.id} className="text-sm text-ink">
                  {m.nombre} {m.apellidos}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/5 text-brand">
            <CheckSquare className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">
              {tareasCount ?? 0} tarea{tareasCount === 1 ? "" : "s"}
            </p>
            <p className="text-sm text-ink-secondary">
              Gestiona las tareas de este proyecto
            </p>
          </div>
        </div>
        <Link
          href={`/tareas?project=${project.id}`}
          className="text-sm font-medium text-brand hover:underline"
        >
          Ver tareas
        </Link>
      </Card>
    </div>
  );
}
