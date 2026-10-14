import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createDbClient } from "@/lib/supabase/db";
import type { Profile } from "@/types/database.types";

// =============================================================================
// Sesión de VIRTUS TIME, sin contraseñas.
//
// Al elegir su nombre en /login, cada socio recibe una cookie firmada con su
// id de perfil (no se puede falsificar sin conocer SESSION_SECRET, que solo
// existe en el servidor). Esa cookie es toda la "sesión": no hay usuarios ni
// contraseñas en Supabase Auth.
// =============================================================================

const COOKIE_NAME = "vt_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 días

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "Falta SESSION_SECRET en las variables de entorno del servidor (o es demasiado corta). Genera una con: openssl rand -hex 32"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionCookie(profileId: string) {
  const token = await new SignJWT({ profileId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Lee la cookie de sesión y devuelve el id de perfil, o null si no hay sesión válida. */
export async function getSessionProfileId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.profileId === "string" ? payload.profileId : null;
  } catch {
    return null;
  }
}

/**
 * Para Server Components / Server Actions / Route Handlers: carga el perfil
 * completo de la persona que ha iniciado sesión. Si no hay sesión válida (o
 * el perfil se desactivó), redirige a /login.
 */
export async function requireProfile(): Promise<Profile> {
  const profileId = await getSessionProfileId();
  if (!profileId) {
    redirect("/login");
  }

  const db = createDbClient();
  const { data: profile } = await db
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (!profile || !profile.activo) {
    await clearSessionCookie();
    redirect("/login");
  }

  return profile;
}

/** Igual que requireProfile(), pero además exige que el perfil sea administrador. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.rol !== "admin") {
    redirect("/dashboard");
  }
  return profile;
}
