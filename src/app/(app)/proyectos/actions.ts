"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@/lib/supabase/db";
import { requireAdmin } from "@/lib/session";
import { PROJECT_COLORS, nextProjectColor } from "@/lib/project-colors";

export interface CreateProjectState {
  ok: boolean;
  error?: string;
  resetKey?: number;
}

const COLOR_SET: readonly string[] = PROJECT_COLORS;

export async function createProjectAction(
  _prev: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  // Defensa en profundidad: el formulario solo se muestra a administradores,
  // pero por si alguien envía la petición directamente.
  const profile = await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const colorInput = String(formData.get("color") ?? "");

  if (!nombre) {
    return { ok: false, error: "El nombre del proyecto no puede estar vacío." };
  }

  const db = createDbClient();

  const { data: existente } = await db
    .from("projects")
    .select("id")
    .ilike("nombre", nombre)
    .maybeSingle();

  if (existente) {
    return { ok: false, error: "Ya existe un proyecto con ese nombre." };
  }

  const { count } = await db
    .from("projects")
    .select("id", { count: "exact", head: true });

  const color = COLOR_SET.includes(colorInput) ? colorInput : nextProjectColor(count ?? 0);

  const { error } = await db.from("projects").insert({
    nombre,
    descripcion: descripcion || null,
    color,
    created_by: profile.id,
  });

  if (error) {
    return { ok: false, error: "No se ha podido crear el proyecto. Inténtalo de nuevo." };
  }

  revalidatePath("/proyectos");
  revalidatePath("/cronometro");
  revalidatePath("/dashboard");
  return { ok: true, resetKey: Date.now() };
}
