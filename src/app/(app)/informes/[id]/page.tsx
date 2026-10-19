import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Info, Download } from "lucide-react";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { formatDuracionCorta, formatFecha } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { RegenerarInformeButton } from "../regenerar-informe-button";
import type { ReportStatus } from "@/types/database.types";

interface PorProyecto {
  project_id: string;
  nombre: string;
  segundos: number;
}

interface PorSocio {
  user_id: string;
  nombre: string;
  segundos: number;
  dias_con_actividad: number;
}

interface ResumenGeneral {
  total_segundos: number;
  total_proyectos_con_actividad: number;
  total_socios_con_actividad: number;
  total_socios: number;
  por_proyecto: PorProyecto[];
  por_socio: PorSocio[];
  socios_sin_actividad: string[];
}

interface Conclusiones {
  general?: string | null;
  nota?: string;
}

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

export default async function InformeDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const db = createDbClient();

  const { data: informe } = await db
    .from("weekly_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!informe) {
    notFound();
  }

  const resumen = informe.resumen_general as unknown as ResumenGeneral;
  const conclusiones = informe.conclusiones as unknown as Conclusiones;

  const porProyecto = [...(resumen?.por_proyecto ?? [])].sort(
    (a, b) => b.segundos - a.segundos
  );
  const porSocio = [...(resumen?.por_socio ?? [])].sort(
    (a, b) => b.segundos - a.segundos
  );

  return (
    <div className="space-y-6">
      <Link
        href="/informes"
        className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Informes semanales
      </Link>

      <PageHeader
        title={`Semana del ${formatFecha(informe.semana_inicio)} al ${formatFecha(informe.semana_fin)}`}
        action={
          <div className="flex items-center gap-3">
            <Badge tone={ESTADO_TONE[informe.status]}>
              {ESTADO_LABEL[informe.status]}
            </Badge>
            {informe.status === "completado" && (
              <a
                href={`/api/export/informes/${informe.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar a PDF
              </a>
            )}
            {profile.rol === "admin" && informe.status !== "generando" && (
              <RegenerarInformeButton semanaInicio={informe.semana_inicio} />
            )}
          </div>
        }
      />

      {informe.status === "generando" && (
        <Card className="p-6 text-center text-sm text-ink-secondary">
          Este informe se está generando ahora mismo. Vuelve a entrar en unos
          segundos.
        </Card>
      )}

      {informe.status === "error" && (
        <Card className="p-6 text-center text-sm text-negative">
          La generación de este informe falló. Un administrador puede volver
          a intentarlo con el botón de arriba.
        </Card>
      )}

      {informe.status === "completado" && (
        <>
          <Card className="flex flex-col justify-center gap-1 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Total registrado en la semana
            </p>
            <p className="font-display text-3xl font-semibold tabular-nums text-ink">
              {formatDuracionCorta(resumen.total_segundos)}
            </p>
            <p className="text-sm text-ink-secondary">
              {resumen.total_socios_con_actividad} de {resumen.total_socios}{" "}
              socios registraron algo, en {resumen.total_proyectos_con_actividad}{" "}
              proyecto{resumen.total_proyectos_con_actividad === 1 ? "" : "s"}.
            </p>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <div>
                  <CardTitle>Resumen de la semana</CardTitle>
                  <CardDescription>
                    Escrito por IA a partir únicamente de los números de esta
                    página; nunca inventa causas ni valoraciones.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {conclusiones?.general ? (
                <p className="text-sm leading-relaxed text-ink-secondary">
                  {conclusiones.general}
                </p>
              ) : (
                <div className="flex items-start gap-2 text-sm text-ink-muted">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    {conclusiones?.nota ??
                      "No se ha generado un resumen para esta semana."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Horas por proyecto</CardTitle>
                <CardDescription>Suma de horas finalizadas en la semana.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {porProyecto.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Ningún proyecto tuvo actividad esta semana.
                </p>
              ) : (
                <ul className="space-y-2">
                  {porProyecto.map((p) => (
                    <li
                      key={p.project_id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-ink">{p.nombre}</span>
                      <span className="tabular-nums text-ink-secondary">
                        {formatDuracionCorta(p.segundos)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Horas por socio</CardTitle>
                <CardDescription>
                  Horas y días con actividad de cada socio en la semana.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {porSocio.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Nadie registró horas esta semana.
                </p>
              ) : (
                <ul className="space-y-2">
                  {porSocio.map((s) => (
                    <li
                      key={s.user_id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-ink">{s.nombre}</span>
                      <span className="tabular-nums text-ink-secondary">
                        {formatDuracionCorta(s.segundos)} · {s.dias_con_actividad}{" "}
                        día{s.dias_con_actividad === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {resumen.socios_sin_actividad.length > 0 && (
                <p className="border-t border-border pt-3 text-sm text-ink-muted">
                  Sin ninguna hora registrada: {resumen.socios_sin_actividad.join(", ")}.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
