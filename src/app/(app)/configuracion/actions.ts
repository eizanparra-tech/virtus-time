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
