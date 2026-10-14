import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
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
        Crea la cuenta del primer administrador de VIRTUS COMPANY. Desde ahí
        podrás invitar al resto de socios.
      </p>
      <SetupForm />
    </div>
  );
}
