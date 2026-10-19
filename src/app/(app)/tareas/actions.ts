"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@/lib/supabase/db";
import { requireProfile } from "@/lib/session";

export interface TareaActionState {
  ok: boolean;
  error?: string;
  resetKey?: number;
}

const ESTADOS_VALIDOS = ["pendiente", "en_proceso", "completada"] as const;

export async function crearTareaAction(
  _prev: TareaActionState,
  formData: FormData
): Promise<TareaActionState> {
  const profile = await requireProfile();

  const projectId = String(formData.get("project_id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const responsableId = String(formData.get("responsable_id") ?? "");
  const fechaLimite = String(formData.get("fecha_limite") ?? "");

  if (!projectId) {
    return { ok: false, error: "Elige un proyecto." };
  }
  if (!titulo) {
    return { ok: false, error: "Escribe un título para la tarea." };
  }

  const db = createDbClient();
  const { data: project } = await db
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return { ok: false, error: "Ese proyecto ya no existe." };
  }

  const { error } = await db.from("tasks").insert({
    project_id: projectId,
    titulo,
    responsable_id: responsableId || null,
    fecha_limite: fechaLimite || null,
    created_by: profile.id,
  });

  if (error) {
    return { ok: false, error: "No se ha podido crear la tarea." };
  }

  revalidatePath("/tareas");
  revalidatePath("/proyectos");
  return { ok: true, resetKey: Date.now() };
}

export async function actualizarTareaAction(
  _prev: TareaActionState,
  formData: FormData
): Promise<TareaActionState> {
  await requireProfile();

  const taskId = String(formData.get("taskId") ?? "");
  const estado = String(formData.get("estado") ?? "");
  const responsableId = String(formData.get("responsable_id") ?? "");
  const fechaLimite = String(formData.get("fecha_limite") ?? "");

  if (!ESTADOS_VALIDOS.includes(estado as (typeof ESTADOS_VALIDOS)[number])) {
    return { ok: false, error: "Estado no válido." };
  }

  const db = createDbClient();
  const { error } = await db
    .from("tasks")
    .update({
      estado: estado as (typeof ESTADOS_VALIDOS)[number],
      responsable_id: responsableId || null,
      fecha_limite: fechaLimite || null,
    })
    .eq("id", taskId);

  if (error) {
    return { ok: false, error: "No se ha podido actualizar la tarea." };
  }

  revalidatePath("/tareas");
  return { ok: true };
}

export async function borrarTareaAction(
  _prev: TareaActionState,
  formData: FormData
): Promise<TareaActionState> {
  const profile = await requireProfile();
  const taskId = String(formData.get("taskId") ?? "");

  const db = createDbClient();
  const { data: tarea } = await db
    .from("tasks")
    .select("id, created_by")
    .eq("id", taskId)
    .maybeSingle();

  if (!tarea) {
    return { ok: false, error: "Esa tarea ya no existe." };
  }

  const puedeBorrar = profile.rol === "admin" || tarea.created_by === profile.id;
  if (!puedeBorrar) {
    return {
      ok: false,
      error: "Solo un administrador o quien la creó puede borrarla.",
    };
  }

  const { error } = await db.from("tasks").delete().eq("id", taskId);
  if (error) {
    return { ok: false, error: "No se ha podido borrar la tarea." };
  }

  revalidatePath("/tareas");
  return { ok: true };
}
