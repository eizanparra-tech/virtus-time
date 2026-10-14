import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Cliente de Supabase con la "service role key": permite saltarse las
// políticas RLS. SOLO se puede usar en código de servidor (Route Handlers,
// Server Actions, tareas programadas) y NUNCA debe llegar al navegador.
//
// Se usa para operaciones administrativas reales como invitar socios por
// correo (auth.admin.inviteUserByEmail) o generar los informes semanales.
//
// El paquete "server-only" hace que, si algún día alguien importa este
// archivo por error desde un Componente de Cliente, el build falle con un
// mensaje claro en vez de filtrar la clave secreta al navegador.
export function createAdminClient() {
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
