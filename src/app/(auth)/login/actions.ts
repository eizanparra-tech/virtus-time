"use server";

import { redirect } from "next/navigation";
import { createDbClient } from "@/lib/supabase/db";
import { createSessionCookie } from "@/lib/session";
import { esRutaInternaSegura } from "@/lib/utils";

export async function selectProfileAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/inicio");
  const destino = esRutaInternaSegura(redirectTo) ? redirectTo : "/inicio";

  const db = createDbClient();
  const { data: profile } = await db
    .from("profiles")
    .select("id, activo")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile || !profile.activo) {
    redirect(
      `/login?error=${encodeURIComponent("Ese perfil ya no está disponible. Avisa a un administrador.")}`
    );
  }

  await createSessionCookie(profileId);
  redirect(destino);
}
