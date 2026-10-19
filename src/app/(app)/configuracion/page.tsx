import { Settings2 } from "lucide-react";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ComingSoon } from "@/components/layout/coming-soon";
import { ProfileForm } from "./profile-form";

export default async function ConfiguracionPage() {
  const profile = await requireProfile();

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Mi perfil</CardTitle>
            <CardDescription>
              Este nombre es el que ve el resto del equipo en Equipo e informes.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      {profile.rol === "admin" ? (
        <ComingSoon
          icon={Settings2}
          fase="Fase 7"
          titulo="Panel de administración avanzado"
          descripcion="Crear y desactivar socios, asignarlos a proyectos, archivar proyectos y gestionar tareas ya se puede hacer desde Equipo, Proyectos y Tareas. Aquí llegará más adelante corregir los registros de cualquier socio (no solo los propios) y consultar el estado de los informes automáticos."
        />
      ) : null}
    </div>
  );
}
