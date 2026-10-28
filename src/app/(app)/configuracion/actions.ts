"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@/lib/supabase/db";
import { requireProfile } from "@/lib/session";

export interface UpdateProfileState {
  ok: boolean;
  error?: string;
}

export async function updateProfileAction(
  _prev: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!nombre) {
    return { ok: false, error: "El nombre no puede estar vacío." };
  }

  const profile = await requireProfile();
  const db = createDbClient();

  const { error } = await db
    .from("profiles")
    .update({ nombre, apellidos, email: email || null })
    .eq("id", profile.id);

  if (error) {
    return { ok: false, error: "No se ha podido guardar. Inténtalo de nuevo." };
  }

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  return { ok: true };
}

export interface UpdateTarifaState {
  ok: boolean;
  error?: string;
}

export async function actualizarTarifaAction(
  _prev: UpdateTarifaState,
  formData: FormData
): Promise<UpdateTarifaState> {
  const profile = await requireProfile();
  if (profile.rol !== "admin") {
    return { ok: false, error: "Solo un administrador puede cambiar la tarifa." };
  }

  const costeHoraEur = Number(formData.get("coste_hora_eur") ?? NaN);
  if (!Number.isFinite(costeHoraEur) || costeHoraEur < 0) {
    return { ok: false, error: "Indica un coste por hora válido." };
  }
  if (costeHoraEur > 10000) {
    return { ok: false, error: "Ese coste por hora parece demasiado alto." };
  }

  const db = createDbClient();
  const { error } = await db
    .from("app_settings")
    .update({ coste_hora_eur: Math.round(costeHoraEur * 100) / 100 })
    .eq("id", true);

  if (error) {
    return { ok: false, error: "No se ha podido guardar la tarifa." };
  }

  revalidatePath("/configuracion");
  revalidatePath("/estadisticas");
  revalidatePath("/proyectos");
  return { ok: true };
}
