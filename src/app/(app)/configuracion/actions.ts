"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  if (!nombre) {
    return { ok: false, error: "El nombre no puede estar vacío." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  // RLS (profiles_update_self) solo permite a cada socio actualizar su
  // propia fila, así que este update es seguro aunque se llame con la
  // sesión normal del usuario.
  const { error } = await supabase
    .from("profiles")
    .update({ nombre, apellidos })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: "No se ha podido guardar. Inténtalo de nuevo." };
  }

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  return { ok: true };
}
