import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { todayMadrid } from "@/lib/dates";
import { formatDuracionCorta, formatFecha } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { GenerarInformeButton } from "./generar-informe-button";
import {
  generarInformeSemanaActualAction,
  generarInformeSemanaPasadaAction,
} from "./actions";
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

export default async function InformesPage() {
  const profile = await requireProfile();
  const db = createDbClient();

  const { data: informes } = await db
    .from("weekly_reports")
    .select("id, semana_inicio, semana_fin, status, resumen_general")
    .order("semana_inicio", { ascending: false });

  const lista = informes ?? [];
  const hoy = todayMadrid();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informes semanales"
        description="Cada lunes de madrugada se genera automáticamente el informe de la semana que acaba de terminar: horas reales por proyecto y por socio, más un resumen escrito a partir de esos mismos números. Un administrador también puede sacar el de la semana en curso cualquier otro día, con los datos que haya hasta el momento."
        action={
          profile.rol === "admin" ? (
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <GenerarInformeButton
                action={generarInformeSemanaActualAction}
                label="Informe de esta semana (en curso)"
                variant="secondary"
              />
              <GenerarInformeButton
                action={generarInformeSemanaPasadaAction}
                label="Informe de la semana pasada"
              />
            </div>
          ) : undefined
        }
      />

      {lista.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-secondary">
            Todavía no hay ningún informe generado.
            {profile.rol === "admin"
              ? " Puedes generar el de esta semana o el de la semana pasada con los botones de arriba, o esperar al próximo lunes."
              : " El primero aparecerá tras el próximo lunes."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {lista.map((informe) => {
            const resumen = informe.resumen_general as {
              total_segundos?: number;
              total_socios_con_actividad?: number;
              total_socios?: number;
            };
            return (
              <Link key={informe.id} href={`/informes/${informe.id}`}>
                <Card className="flex flex-col gap-3 p-5 transition-colors hover:border-brand/40 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-base font-semibold text-ink">
                        Semana del {formatFecha(informe.semana_inicio)} al{" "}
                        {formatFecha(informe.semana_fin)}
                      </p>
                      <Badge tone={ESTADO_TONE[informe.status]}>
                        {ESTADO_LABEL[informe.status]}
                      </Badge>
                      {informe.semana_fin > hoy && (
                        <Badge tone="info">Semana en curso</Badge>
                      )}
                    </div>
                    {informe.status === "completado" && (
                      <p className="mt-1 text-sm text-ink-secondary">
                        {formatDuracionCorta(resumen?.total_segundos ?? 0)} registradas
                        {typeof resumen?.total_socios_con_actividad === "number" && (
                          <>
                            {" · "}
                            {resumen.total_socios_con_actividad}/{resumen.total_socios}{" "}
                            socios con actividad
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
