import Link from "next/link";
import { FileBarChart } from "lucide-react";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { formatFecha, formatFechaHora } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "./profile-form";
import type { ReportStatus } from "@/types/database.types";

const ESTADO_LABEL: Record<ReportStatus, string> = {
  generando: "Generando…",
  completado: "Completado",
  error: "Error",
};

const ESTADO_TONE: Record<ReportStatus, "positive" | "warning" | "negative"> = {
  generando: "warning",
  completado: "positive",
  error: "negative",
};

export default async function ConfiguracionPage() {
  const profile = await requireProfile();
  const esAdmin = profile.rol === "admin";

  const { data: ultimoInforme } = esAdmin
    ? await createDbClient()
        .from("weekly_reports")
        .select("id, semana_inicio, semana_fin, status, generated_at, regenerated_at")
        .order("semana_inicio", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

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

      {esAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileBarChart className="h-4 w-4 text-brand" />
              <div>
                <CardTitle>Informes automáticos</CardTitle>
                <CardDescription>
                  Cada lunes de madrugada (hora de Madrid) se genera solo el
                  informe de la semana que acaba de terminar.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!ultimoInforme ? (
              <p className="text-sm text-ink-muted">
                Todavía no se ha generado ningún informe semanal.
              </p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink">
                      Semana del {formatFecha(ultimoInforme.semana_inicio)} al{" "}
                      {formatFecha(ultimoInforme.semana_fin)}
                    </p>
                    <Badge tone={ESTADO_TONE[ultimoInforme.status]}>
                      {ESTADO_LABEL[ultimoInforme.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-secondary">
                    {ultimoInforme.regenerated_at
                      ? `Recalculado el ${formatFechaHora(ultimoInforme.regenerated_at)}.`
                      : ultimoInforme.generated_at
                        ? `Generado el ${formatFechaHora(ultimoInforme.generated_at)}.`
                        : "Todavía generándose."}
                  </p>
                </div>
                <Link
                  href={`/informes/${ultimoInforme.id}`}
                  className="shrink-0 text-sm font-medium text-brand hover:underline"
                >
                  Ver informe
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
