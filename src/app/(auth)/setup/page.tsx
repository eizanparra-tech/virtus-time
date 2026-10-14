import { redirect } from "next/navigation";
import { createDbClient } from "@/lib/supabase/db";
import { Label, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { bootstrapAdminAction } from "./actions";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const db = createDbClient();

  const { data: settings } = await db
    .from("app_settings")
    .select("setup_completed")
    .eq("id", true)
    .single();

  if (settings?.setup_completed) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-ink">
        Configuración inicial
      </h1>
      <p className="mt-1 mb-6 text-sm text-ink-secondary">
        Crea tu perfil para empezar. Quedará como el primer administrador de
        VIRTUS COMPANY y podrás añadir al resto de socios desde la propia web.
      </p>

      <form action={bootstrapAdminAction} className="space-y-4">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" autoFocus required />
        </div>
        <div>
          <Label htmlFor="apellidos">Apellidos</Label>
          <Input id="apellidos" name="apellidos" />
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <Button type="submit" className="w-full">
          Crear mi perfil
        </Button>
      </form>
    </div>
  );
}
