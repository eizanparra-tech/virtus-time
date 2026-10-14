import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El proxy (src/proxy.ts) ya protege estas rutas, pero comprobamos aquí
  // también por si este layout se alcanza de alguna otra forma.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // El perfil se crea automáticamente al registrarse (trigger de la base
    // de datos). Si no existe, algo falló: mejor cerrar sesión que dejar a
    // la persona atrapada en una app a medio cargar.
    redirect("/login");
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
