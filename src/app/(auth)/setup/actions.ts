"use server";

import { redirect } from "next/navigation";
import { createDbClient } from "@/lib/supabase/db";
import { createSessionCookie } from "@/lib/session";

export async function bootstrapAdminAction(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();

  if (!nombre) {
    redirect(`/setup?error=${encodeURIComponent("Escribe al menos tu nombre.")}`);
  }

  const db = createDbClient();

  // Comprobación de seguridad: esto solo puede ejecutarse una vez. Si
  // alguien ya completó el asistente inicial, no se permite crear otro
  // perfil "de fábrica" por aquí, aunque conozca la URL de /setup.
  const { data: settings } = await db
    .from("app_settings")
    .select("setup_completed")
    .eq("id", true)
    .single();

  if (settings?.setup_completed) {
    redirect("/login");
  }

  const { data: profile, error } = await db
    .from("profiles")
    .insert({ nombre, apellidos, rol: "admin" })
    .select()
    .single();

  if (error || !profile) {
    redirect(
      `/setup?error=${encodeURIComponent("No se ha podido crear el perfil. Inténtalo de nuevo.")}`
    );
  }

  await db.from("app_settings").update({ setup_completed: true }).eq("id", true);
  await createSessionCookie(profile.id);
  redirect("/inicio");
}
