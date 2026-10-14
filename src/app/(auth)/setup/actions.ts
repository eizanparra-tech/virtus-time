"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface BootstrapState {
  ok: boolean;
  error?: string;
}

export async function bootstrapAdminAction(
  _prev: BootstrapState,
  formData: FormData
): Promise<BootstrapState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!nombre || !email || !password) {
    return { ok: false, error: "Rellena todos los campos obligatorios." };
  }
  if (password.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== passwordConfirm) {
    return { ok: false, error: "Las contraseñas no coinciden." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error:
        "Faltan variables de entorno de Supabase en el servidor (revisa .env.local).",
    };
  }

  // Comprobación de seguridad: esta acción solo puede ejecutarse una vez.
  // Si alguien ya completó el asistente inicial, no se permite crear otro
  // administrador por aquí, aunque conozca la URL de /setup.
  const { data: settings, error: settingsError } = await admin
    .from("app_settings")
    .select("setup_completed")
    .eq("id", true)
    .single();

  if (settingsError) {
    return { ok: false, error: "No se ha podido comprobar la configuración inicial." };
  }
  if (settings.setup_completed) {
    return { ok: false, error: "La configuración inicial ya se completó anteriormente." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, apellidos },
  });

  if (createError || !created.user) {
    const mensaje =
      createError?.message?.includes("already been registered") ||
      createError?.code === "email_exists"
        ? "Ya existe una cuenta con ese correo."
        : "No se ha podido crear la cuenta. Inténtalo de nuevo.";
    return { ok: false, error: mensaje };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ rol: "admin" })
    .eq("id", created.user.id);

  if (profileError) {
    return {
      ok: false,
      error: "La cuenta se creó, pero no se pudo asignar el rol de administrador. Contacta con soporte.",
    };
  }

  const { error: finishError } = await admin
    .from("app_settings")
    .update({ setup_completed: true })
    .eq("id", true);

  if (finishError) {
    return {
      ok: false,
      error: "La cuenta se creó, pero no se pudo cerrar el asistente de configuración.",
    };
  }

  return { ok: true };
}
