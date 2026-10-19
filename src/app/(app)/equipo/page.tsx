import { Users } from "lucide-react";
import { createDbClient } from "@/lib/supabase/db";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { iniciales } from "@/lib/utils";
import { CreateSocioForm } from "./create-socio-form";
import { SocioControls } from "./socio-controls";

export default async function EquipoPage() {
  const profile = await requireProfile();
  const db = createDbClient();
  const { data: socios } = await db
    .from("profiles")
    .select("id, nombre, apellidos, email, rol, activo")
    .order("nombre");

  const lista = socios ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo"
        description="Socios con una cuenta creada en VIRTUS TIME."
      />

      {profile.rol === "admin" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Añadir socio</CardTitle>
              <CardDescription>
                En cuanto lo crees podrá entrar eligiendo su nombre en la
                pantalla de inicio, sin contraseña.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CreateSocioForm />
          </CardContent>
        </Card>
      )}

      {lista.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Users className="h-8 w-8 text-ink-muted" />
          <p className="text-sm text-ink-secondary">
            Todavía no hay socios registrados.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((socio) => (
            <Card key={socio.id} className="p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-ink-on-brand">
                  {iniciales(socio.nombre, socio.apellidos ?? "")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {socio.nombre} {socio.apellidos}
                  </p>
                  <p className="truncate text-xs text-ink-muted">
                    {socio.email}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge tone={socio.rol === "admin" ? "accent" : "neutral"}>
                    {socio.rol === "admin" ? "Admin" : "Socio"}
                  </Badge>
                  {!socio.activo && <Badge tone="negative">Inactivo</Badge>}
                </div>
              </div>

              {profile.rol === "admin" && socio.id !== profile.id && (
                <SocioControls socio={socio} />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
