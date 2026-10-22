"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@/lib/supabase/db";
import { requireProfile } from "@/lib/session";

export interface FechaClaveActionState {
  ok: boolean;
  error?: string;
  resetKey?: number;
}

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function crearFechaClaveAction(
  _prev: FechaClaveActionState,
  formData: FormData
): Promise<FechaClaveActionState> {
  const profile = await requireProfile();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  if (!titulo) {
    return { ok: false, error: "Escribe un título." };
  }
  if (!FECHA_RE.test(fecha)) {
    return { ok: false, error: "Elige una fecha válida." };
  }

  const db = createDbClient();

  if (projectId) {
    const { data: project } = await db
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();
    if (!project) {
      return { ok: false, error: "Ese proyecto ya no existe." };
    }
  }

  const { error } = await db.from("key_dates").insert({
    titulo,
    fecha,
    project_id: projectId || null,
    descripcion: descripcion || null,
    created_by: profile.id,
  });

  if (error) {
    return { ok: false, error: "No se ha podido crear la fecha clave." };
  }

  revalidatePath("/fechas-clave");
  revalidatePath("/calendario");
  return { ok: true, resetKey: Date.now() };
}

export async function borrarFechaClaveAction(
  _prev: FechaClaveActionState,
  formData: FormData
): Promise<FechaClaveActionState> {
  const profile = await requireProfile();
  const id = String(formData.get("id") ?? "");

  const db = createDbClient();
  const { data: fechaClave } = await db
    .from("key_dates")
    .select("id, created_by")
    .eq("id", id)
    .maybeSingle();

  if (!fechaClave) {
    return { ok: false, error: "Esa fecha clave ya no existe." };
  }

  const puedeBorrar =
    profile.rol === "admin" || fechaClave.created_by === profile.id;
  if (!puedeBorrar) {
    return {
      ok: false,
      error: "Solo un administrador o quien la creó puede borrarla.",
    };
  }

  const { error } = await db.from("key_dates").delete().eq("id", id);
  if (error) {
    return { ok: false, error: "No se ha podido borrar la fecha clave." };
  }

  revalidatePath("/fechas-clave");
  revalidatePath("/calendario");
  return { ok: true };
}
