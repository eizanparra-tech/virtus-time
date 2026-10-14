import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// VIRTUS TIME no usa Supabase Auth: se entra eligiendo un perfil, sin
// contraseña (ver src/lib/session.ts). Por eso TODO el acceso a la base de
// datos se hace desde aquí, con la "service role key", que tiene permiso
// para leer y escribir sin pasar por Row Level Security.
//
// Esto SOLO se puede importar desde código de servidor (Server Components,
// Server Actions, Route Handlers, tareas programadas) y nunca debe llegar
// al navegador: por eso el paquete "server-only" hace fallar el build si
// alguien lo importa por error desde un Componente de Cliente.
//
// Cada función de servidor que llama a createDbClient() es responsable de
// comprobar primero, con getSession()/requireProfile() (src/lib/session.ts),
// que la persona puede hacer lo que está pidiendo.
export function createDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
