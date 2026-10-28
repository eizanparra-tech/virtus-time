"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@/lib/supabase/db";
import { requireAdmin } from "@/lib/session";

export interface ProjectDetailActionState {
  ok: boolean;
  error?: string;
}

const ESTADOS_VALIDOS = ["activo", "pausado", "finalizado", "archivado"] as const;

export async function actualizarProyectoAction(
  _prev: ProjectDetailActionState,
  formData: FormData
): Promise<ProjectDetailActionState> {
  await requireAdmin();

  const projectId = String(formData.get("projectId") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const color = String(formData.get("color") ?? "");
  const estado = String(formData.get("estado") ?? "");
  const facturable = formData.get("facturable") === "on";

  if (!nombre) {
    return { ok: false, error: "El nombre no puede estar vacío." };
  }
  if (!ESTADOS_VALIDOS.includes(estado as (typeof ESTADOS_VALIDOS)[number])) {
    return { ok: false, error: "Estado no válido." };
  }

  const db = createDbClient();
  const { error } = await db
    .from("projects")
    .update({
      nombre,
      descripcion: descripcion || null,
      // Si por lo que sea no llega ningún color marcado, se deja el actual.
      ...(color ? { color } : {}),
      estado: estado as (typeof ESTADOS_VALIDOS)[number],
      facturable,
    })
    .eq("id", projectId);

  if (error) {
    return { ok: false, error: "No se ha podido guardar el proyecto." };
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  revalidatePath("/cronometro");
  return { ok: true };
}

export async function anadirMiembroAction(
  _prev: ProjectDetailActionState,
  formData: FormData
): Promise<ProjectDetailActionState> {
  await requireAdmin();

  const projectId = String(formData.get("projectId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return { ok: false, error: "Elige un socio." };
  }

  const db = createDbClient();
  const { error } = await db
    .from("project_members")
    .insert({ project_id: projectId, user_id: userId });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ese socio ya está en el proyecto." };
    }
    return { ok: false, error: "No se ha podido añadir al socio." };
  }

  revalidatePath(`/proyectos/${projectId}`);
  return { ok: true };
}

export async function quitarMiembroAction(
  _prev: ProjectDetailActionState,
  formData: FormData
): Promise<ProjectDetailActionState> {
  await requireAdmin();

  const projectId = String(formData.get("projectId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  const db = createDbClient();
  const { error } = await db
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: "No se ha podido quitar al socio." };
  }

  revalidatePath(`/proyectos/${projectId}`);
  return { ok: true };
}
