import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El proxy (src/proxy.ts) ya comprueba que exista la cookie de sesión;
  // aquí cargamos el perfil completo y redirigimos a /login si, por lo que
  // sea (perfil borrado o desactivado), ya no es válido.
  const profile = await requireProfile();

  return <AppShell profile={profile}>{children}</AppShell>;
}
