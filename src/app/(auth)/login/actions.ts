"use server";

import { redirect } from "next/navigation";
import { createDbClient } from "@/lib/supabase/db";
import { createSessionCookie } from "@/lib/session";

export async function selectProfileAction(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");
  const destino = redirectTo.startsWith("/") ? redirectTo : "/dashboard";

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
