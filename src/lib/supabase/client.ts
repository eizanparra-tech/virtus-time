"use client";

// Cliente de Supabase para usar en Componentes de Cliente (botones, formularios
// interactivos, el cronómetro, etc). Usa la clave pública "anon": es segura de
// exponer en el navegador porque toda la protección real la hace RLS en la base
// de datos (ver supabase/migrations/0001_init.sql).

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
