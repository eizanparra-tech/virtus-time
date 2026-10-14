import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("setup_completed")
    .eq("id", true)
    .single();

  if (!settings?.setup_completed) {
    redirect("/setup");
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-ink">
        Inicia sesión
      </h1>
      <p className="mt-1 mb-6 text-sm text-ink-secondary">
        Accede con el correo y la contraseña de tu cuenta de socio.
      </p>
      <LoginForm redirectTo={redirectTo || "/dashboard"} />
    </div>
  );
}
