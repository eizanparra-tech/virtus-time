"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@/lib/supabase/db";
import { requireAdmin } from "@/lib/session";

export interface SocioActionState {
  ok: boolean;
  error?: string;
  resetKey?: number;
}

export async function crearSocioAction(
  _prev: SocioActionState,
  formData: FormData
): Promise<SocioActionState> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const rol = String(formData.get("rol") ?? "socio");

  if (!nombre) {
    return { ok: false, error: "El nombre no puede estar vacío." };
  }
  if (rol !== "admin" && rol !== "socio") {
    return { ok: false, error: "Rol no válido." };
  }

  const db = createDbClient();

  const { data: existente } = await db
    .from("profiles")
    .select("id")
    .ilike("nombre", nombre)
    .ilike("apellidos", apellidos)
    .maybeSingle();

  if (existente) {
    return { ok: false, error: "Ya existe un socio con ese nombre y apellidos." };
  }

  const { error } = await db.from("profiles").insert({
    nombre,
    apellidos,
    email: email || null,
    rol: rol as "admin" | "socio",
  });

  if (error) {
    return { ok: false, error: "No se ha podido crear el socio. Inténtalo de nuevo." };
  }

  revalidatePath("/equipo");
  revalidatePath("/login");
  return { ok: true, resetKey: Date.now() };
}

/** Cuenta cuántos administradores activos quedarían si se excluye a `excluirId`. */
async function quedanAdminsActivos(
  db: ReturnType<typeof createDbClient>,
  excluirId: string
): Promise<boolean> {
  const { count } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("rol", "admin")
    .eq("activo", true)
    .neq("id", excluirId);

  return Boolean(count && count > 0);
}

export async function cambiarActivoSocioAction(
  _prev: SocioActionState,
  formData: FormData
): Promise<SocioActionState> {
  await requireAdmin();

  const profileId = String(formData.get("profileId") ?? "");
  const nuevoActivo = String(formData.get("activo") ?? "") === "true";

  const db = createDbClient();
  const { data: target } = await db
    .from("profiles")
    .select("id, rol")
    .eq("id", profileId)
    .maybeSingle();

  if (!target) {
    return { ok: false, error: "Ese socio no existe." };
  }

  if (!nuevoActivo && target.rol === "admin") {
    const quedan = await quedanAdminsActivos(db, target.id);
    if (!quedan) {
      return {
        ok: false,
        error: "No puedes desactivar al último administrador activo.",
      };
    }
  }

  const { error } = await db
    .from("profiles")
    .update({ activo: nuevoActivo })
    .eq("id", target.id);

  if (error) {
    return { ok: false, error: "No se ha podido actualizar." };
  }

  revalidatePath("/equipo");
  revalidatePath("/login");
  return { ok: true };
}

export async function cambiarRolSocioAction(
  _prev: SocioActionState,
  formData: FormData
): Promise<SocioActionState> {
  await requireAdmin();

  const profileId = String(formData.get("profileId") ?? "");
  const nuevoRol = String(formData.get("rol") ?? "");

  if (nuevoRol !== "admin" && nuevoRol !== "socio") {
    return { ok: false, error: "Rol no válido." };
  }

  const db = createDbClient();
  const { data: target } = await db
    .from("profiles")
    .select("id, rol")
    .eq("id", profileId)
    .maybeSingle();

  if (!target) {
    return { ok: false, error: "Ese socio no existe." };
  }

  if (target.rol === "admin" && nuevoRol === "socio") {
    const quedan = await quedanAdminsActivos(db, target.id);
    if (!quedan) {
      return {
        ok: false,
        error: "No puedes quitar el rol de administrador al último administrador.",
      };
    }
  }

  const { error } = await db
    .from("profiles")
    .update({ rol: nuevoRol as "admin" | "socio" })
    .eq("id", target.id);

  if (error) {
    return { ok: false, error: "No se ha podido actualizar el rol." };
  }

  revalidatePath("/equipo");
  return { ok: true };
}
