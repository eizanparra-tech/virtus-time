import { Settings2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ComingSoon } from "@/components/layout/coming-soon";
import { ProfileForm } from "./profile-form";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Mi perfil</CardTitle>
            <CardDescription>
              Estos datos los ve el resto del equipo en Equipo e informes.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {profile && <ProfileForm profile={profile} />}
        </CardContent>
      </Card>

      {profile?.rol === "admin" ? (
        <ComingSoon
          icon={Settings2}
          fase="Fase 3 y 7"
          titulo="Panel de administración"
          descripcion="Invitar y desactivar socios, archivar proyectos, corregir registros con historial de cambios y consultar el estado de los informes automáticos."
        />
      ) : null}
    </div>
  );
}
