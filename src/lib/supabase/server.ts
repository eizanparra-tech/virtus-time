import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

// Cliente de Supabase para usar en Server Components, Server Actions y Route
// Handlers. Lee y escribe la sesión del usuario a través de las cookies de
// Next.js. En Next.js 16 `cookies()` es asíncrono, así que esta función
// también lo es: siempre hay que hacer `await createClient()`.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` fue llamado desde un Server Component (no desde una
            // Server Action o Route Handler). Next.js no permite escribir
            // cookies ahí. Se puede ignorar con seguridad si el proxy
            // (src/proxy.ts) ya se encarga de refrescar la sesión.
          }
        },
      },
    }
  );
}
