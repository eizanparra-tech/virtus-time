import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { todayMadrid, semanaDe, addDias } from "@/lib/dates";
import { formatDuracionCorta, formatEuros, cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { PROJECT_COLORS } from "@/lib/project-colors";
import { BarrasHoras, EvolucionHoras, type BarraItem, type PuntoSerie } from "./charts";
import { HorasPorSocio } from "./socio-desglose";

type Rango = "semana" | "mes" | "todo";
type Vista = "mio" | "empresa";

interface Ventana {
  inicio: string;
  fin: string;
  compareInicio: string;
  compareFin: string;
  bucket: "dia" | "semana";
}

function calcularVentana(rango: Rango, hoy: string): Ventana {
  if (rango === "semana") {
    const { inicio, fin } = semanaDe(hoy);
    const compareFin = addDias(inicio, -1);
    const compareInicio = addDias(compareFin, -6);
    return { inicio, fin, compareInicio, compareFin, bucket: "dia" };
  }

  if (rango === "mes") {
    const fin = hoy;
    const inicio = addDias(hoy, -29);
    const compareFin = addDias(inicio, -1);
    const compareInicio = addDias(compareFin, -29);
    return { inicio, fin, compareInicio, compareFin, bucket: "dia" };
  }

  // "todo": últimas 12 semanas completas, terminando con la semana actual.
  const semanaActual = semanaDe(hoy);
  const inicio = addDias(semanaActual.inicio, -7 * 11);
  const compareFin = addDias(inicio, -1);
  const compareInicio = addDias(compareFin, -7 * 11);
  return { inicio, fin: semanaActual.fin, compareInicio, compareFin, bucket: "semana" };
}

function etiquetaFecha(fechaISO: string): string {
  return new Date(`${fechaISO}T00:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

function construirSerie(
  ventana: Ventana,
  filas: { fecha: string; duracion_segundos: number }[]
): PuntoSerie[] {
  const porFecha = new Map<string, number>();
  for (const f of filas) {
    porFecha.set(f.fecha, (porFecha.get(f.fecha) ?? 0) + f.duracion_segundos);
  }

  const puntos: PuntoSerie[] = [];
  const paso = ventana.bucket === "dia" ? 1 : 7;
  let cursor = ventana.inicio;

  while (cursor <= ventana.fin) {
    const finBucket = addDias(cursor, paso - 1);
    let segundos = 0;
    for (const [fecha, s] of porFecha) {
      if (fecha >= cursor && fecha <= finBucket) segundos += s;
    }
    puntos.push({ label: etiquetaFecha(cursor), segundos });
    cursor = addDias(cursor, paso);
  }

  return puntos;
}

function hrefCon(rango: Rango, vista: Vista) {
  const params = new URLSearchParams();
  if (rango !== "semana") params.set("rango", rango);
  if (vista !== "mio") params.set("vista", vista);
  const qs = params.toString();
  return `/estadisticas${qs ? `?${qs}` : ""}`;
}

const RANGO_TABS: { value: Rango; label: string }[] = [
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "todo", label: "Últimas 12 semanas" },
];

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string; vista?: string }>;
}) {
  const { rango: rangoParam, vista: vistaParam } = await searchParams;
  const profile = await requireProfile();
  const esAdmin = profile.rol === "admin";

  const rango: Rango =
    rangoParam === "mes" || rangoParam === "todo" ? rangoParam : "semana";
  const vista: Vista = esAdmin && vistaParam === "empresa" ? "empresa" : "mio";

  const hoy = todayMadrid();
  const ventana = calcularVentana(rango, hoy);

  const db = createDbClient();
  let entradasQuery = db
    .from("time_entries")
    .select("user_id, project_id, fecha, duracion_segundos")
    .not("hora_fin", "is", null)
    .gte("fecha", ventana.compareInicio)
    .lte("fecha", ventana.fin);

  if (vista === "mio") {
    entradasQuery = entradasQuery.eq("user_id", profile.id);
  }

  const [{ data: entradas }, { data: proyectos }, { data: socios }, { data: ajustes }] =
    await Promise.all([
      entradasQuery,
      db.from("projects").select("id, nombre, color, facturable"),
      db.from("profiles").select("id, nombre, apellidos").eq("activo", true),
      db.from("app_settings").select("coste_hora_eur").eq("id", true).maybeSingle(),
    ]);

  const costeHoraEur = ajustes?.coste_hora_eur ?? null;

  const filas = entradas ?? [];
  const proyectoPorId = new Map((proyectos ?? []).map((p) => [p.id, p]));
  const socioPorId = new Map((socios ?? []).map((s) => [s.id, s]));

  const actuales = filas.filter(
    (f) => f.fecha >= ventana.inicio && f.fecha <= ventana.fin
  );
  const anteriores = filas.filter(
    (f) => f.fecha >= ventana.compareInicio && f.fecha <= ventana.compareFin
  );

  const totalActual = actuales.reduce((acc, f) => acc + f.duracion_segundos, 0);
  const totalAnterior = anteriores.reduce(
    (acc, f) => acc + f.duracion_segundos,
    0
  );
  const cambioPct =
    totalAnterior > 0
      ? Math.round(((totalActual - totalAnterior) / totalAnterior) * 100)
      : null;

  const segundosFacturables = actuales.reduce(
    (acc, f) => acc + (proyectoPorId.get(f.project_id)?.facturable !== false ? f.duracion_segundos : 0),
    0
  );
  const segundosNoFacturables = totalActual - segundosFacturables;

  const segundosPorProyecto = new Map<string, number>();
  for (const f of actuales) {
    segundosPorProyecto.set(
      f.project_id,
      (segundosPorProyecto.get(f.project_id) ?? 0) + f.duracion_segundos
    );
  }
  const datosPorProyecto: BarraItem[] = Array.from(
    segundosPorProyecto.entries()
  )
    .map(([projectId, segundos]) => {
      const proyecto = proyectoPorId.get(projectId);
      return {
        id: projectId,
        label: proyecto?.nombre ?? "Proyecto eliminado",
        segundos,
        color: proyecto?.color ?? "#8893a3",
      };
    })
    .sort((a, b) => b.segundos - a.segundos);

  let datosPorSocio: BarraItem[] = [];
  let sociosConActividad = 0;
  const desglosePorSocio: Record<string, BarraItem[]> = {};
  if (vista === "empresa") {
    const segundosPorSocio = new Map<string, number>();
    const segundosPorSocioProyecto = new Map<string, Map<string, number>>();
    for (const f of actuales) {
      segundosPorSocio.set(
        f.user_id,
        (segundosPorSocio.get(f.user_id) ?? 0) + f.duracion_segundos
      );

      if (!segundosPorSocioProyecto.has(f.user_id)) {
        segundosPorSocioProyecto.set(f.user_id, new Map());
      }
      const porProyectoDeSocio = segundosPorSocioProyecto.get(f.user_id)!;
      porProyectoDeSocio.set(
        f.project_id,
        (porProyectoDeSocio.get(f.project_id) ?? 0) + f.duracion_segundos
      );
    }
    sociosConActividad = segundosPorSocio.size;
    datosPorSocio = Array.from(segundosPorSocio.entries())
      .map(([userId, segundos], i) => {
        const socio = socioPorId.get(userId);
        return {
          id: userId,
          label: socio ? `${socio.nombre} ${socio.apellidos}`.trim() : "Socio eliminado",
          segundos,
          color: PROJECT_COLORS[i % PROJECT_COLORS.length],
        };
      })
      .sort((a, b) => b.segundos - a.segundos)
      .slice(0, 12);

    // Desglose por proyecto de cada socio, para expandir al pinchar en su barra.
    for (const [userId, porProyectoDeSocio] of segundosPorSocioProyecto) {
      desglosePorSocio[userId] = Array.from(porProyectoDeSocio.entries())
        .map(([projectId, segundos]) => {
          const proyecto = proyectoPorId.get(projectId);
          return {
            id: projectId,
            label: proyecto?.nombre ?? "Proyecto eliminado",
            segundos,
            color: proyecto?.color ?? "#8893a3",
          };
        })
        .sort((a, b) => b.segundos - a.segundos);
    }
  }

  const serie = construirSerie(ventana, actuales);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estadísticas"
        description="Datos reales a partir de los registros de tiempo. Nada aquí se estima ni se inventa."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-sm border border-border bg-surface p-1">
          {RANGO_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={hrefCon(tab.value, vista)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                rango === tab.value
                  ? "bg-brand text-ink-on-brand"
                  : "text-ink-secondary hover:bg-surface-sunken"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {esAdmin && (
          <div className="inline-flex rounded-sm border border-border bg-surface p-1">
            <Link
              href={hrefCon(rango, "mio")}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                vista === "mio"
                  ? "bg-brand text-ink-on-brand"
                  : "text-ink-secondary hover:bg-surface-sunken"
              )}
            >
              Mis estadísticas
            </Link>
            <Link
              href={hrefCon(rango, "empresa")}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                vista === "empresa"
                  ? "bg-brand text-ink-on-brand"
                  : "text-ink-secondary hover:bg-surface-sunken"
              )}
            >
              Toda la empresa
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex flex-col justify-center gap-1 p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Total del periodo
          </p>
          <p className="font-display text-3xl font-semibold tabular-nums text-ink">
            {formatDuracionCorta(totalActual)}
          </p>
          {costeHoraEur !== null && (
            <>
              <p className="text-sm text-ink-secondary">
                ≈ {formatEuros((totalActual / 3600) * costeHoraEur)} a {formatEuros(costeHoraEur)}/h
              </p>
              <p className="text-xs text-ink-muted">
                Facturable: {formatDuracionCorta(segundosFacturables)} (
                {formatEuros((segundosFacturables / 3600) * costeHoraEur)}) · No
                facturable: {formatDuracionCorta(segundosNoFacturables)} (
                {formatEuros((segundosNoFacturables / 3600) * costeHoraEur)})
              </p>
            </>
          )}
          <div className="flex items-center gap-1.5 text-sm text-ink-secondary">
            {cambioPct === null ? (
              <>
                <Minus className="h-3.5 w-3.5 text-ink-muted" />
                Sin datos del periodo anterior para comparar.
              </>
            ) : cambioPct === 0 ? (
              <>
                <Minus className="h-3.5 w-3.5 text-ink-muted" />
                Igual que el periodo anterior.
              </>
            ) : cambioPct > 0 ? (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-ink-muted" />
                {cambioPct}% más que el periodo anterior.
              </>
            ) : (
              <>
                <TrendingDown className="h-3.5 w-3.5 text-ink-muted" />
                {Math.abs(cambioPct)}% menos que el periodo anterior.
              </>
            )}
          </div>
        </Card>

        {vista === "empresa" ? (
          <Card className="flex flex-col justify-center gap-1 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Socios con actividad
            </p>
            <p className="font-display text-3xl font-semibold tabular-nums text-ink">
              {sociosConActividad} / {socios?.length ?? 0}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-ink-secondary">
              <Users className="h-3.5 w-3.5 text-ink-muted" />
              Han registrado algo en este periodo.
            </div>
          </Card>
        ) : (
          <Card className="flex flex-col justify-center gap-1 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Proyectos con actividad
            </p>
            <p className="font-display text-3xl font-semibold tabular-nums text-ink">
              {datosPorProyecto.length}
            </p>
            <p className="text-sm text-ink-secondary">En este periodo.</p>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              {vista === "empresa" ? "Horas por proyecto (empresa)" : "Mis horas por proyecto"}
            </CardTitle>
            <CardDescription>
              Suma de horas registradas y finalizadas en el periodo elegido.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <BarrasHoras data={datosPorProyecto} />
        </CardContent>
      </Card>

      {vista === "empresa" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Horas por socio</CardTitle>
              <CardDescription>
                Los 12 socios con más horas registradas en el periodo. Pincha
                en una barra para ver en qué proyectos ha repartido ese
                tiempo.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <HorasPorSocio data={datosPorSocio} desglose={desglosePorSocio} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Evolución</CardTitle>
            <CardDescription>
              {ventana.bucket === "dia"
                ? "Horas registradas cada día."
                : "Horas registradas cada semana."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <EvolucionHoras data={serie} />
        </CardContent>
      </Card>
    </div>
  );
}
