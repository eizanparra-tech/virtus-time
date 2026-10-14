import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Rutas que cualquiera puede visitar sin haber elegido un perfil todavía.
const PUBLIC_PATHS = ["/login", "/setup"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("vt_session")?.value;
  if (!token) return false;

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

// Sustituye al antiguo "middleware.ts" (ver src/lib/session.ts para el
// porqué: VIRTUS TIME no usa contraseñas, solo una cookie firmada). Aquí
// solo comprobamos que la cookie existe y es válida; cargar el perfil
// completo se hace dentro de cada página con requireProfile().
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = await hasValidSession(request);

  if (!authenticated && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (authenticated && (pathname === "/login" || pathname === "/setup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
