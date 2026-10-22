import { redirect } from "next/navigation";
import { createDbClient } from "@/lib/supabase/db";
import { iniciales } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { selectProfileAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo, error } = await searchParams;
  const db = createDbClient();

  const { data: settings } = await db
    .from("app_settings")
    .select("setup_completed")
    .eq("id", true)
    .single();

  if (!settings?.setup_completed) {
    redirect("/setup");
  }

  const { data: socios } = await db
    .from("profiles")
    .select("id, nombre, apellidos, rol")
    .eq("activo", true)
    .order("nombre");

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-ink">
        ¿Quién eres?
      </h1>
      <p className="mt-1 mb-6 text-sm text-ink-secondary">
        Toca tu nombre para entrar. No hace falta contraseña.
      </p>

      {error && <p className="mb-4 text-sm text-negative">{error}</p>}

      {!socios || socios.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Todavía no hay ningún perfil creado.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {socios.map((socio) => (
            <form key={socio.id} action={selectProfileAction}>
              <input type="hidden" name="profileId" value={socio.id} />
              <input
                type="hidden"
                name="redirectTo"
                value={redirectTo || "/inicio"}
              />
              <button
                type="submit"
                className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-md border border-border p-3.5 text-center transition-colors hover:border-brand hover:bg-surface-sunken"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-base font-semibold text-ink-on-brand">
                  {iniciales(socio.nombre, socio.apellidos ?? "")}
                </span>
                <span className="w-full truncate text-sm font-medium text-ink">
                  {socio.nombre}
                </span>
                {socio.rol === "admin" && (
                  <Badge tone="accent" className="pointer-events-none">
                    Admin
                  </Badge>
                )}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
