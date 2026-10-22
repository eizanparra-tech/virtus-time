import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet } from "lucide-react";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { todayMadrid, semanaDe, addDias, mesDe, addMeses } from "@/lib/dates";
import { cn, formatMesAnio, formatFecha } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { hrefCalendario, type Periodo, type VistaCalendario } from "./href";
import { MonthGrid, type DiaCelda } from "./month-grid";
import { WeekView, type DiaSemana } from "./week-view";
import {
  DayView,
  type GrupoSocio,
  type TareaDiaView,
  type FechaClaveDiaView,
} from "./day-view";
import type { RegistroView } from "../registros/registro-row";

const PERIODO_TABS: { value: Periodo; label: string }[] = [
  { value: "dia", label: "Día" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
];

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; fecha?: string; vista?: string }>;
}) {
  const { periodo: periodoParam, fecha: fechaParam, vista: vistaParam } =
    await searchParams;
  const profile = await requireProfile();
  const esAdmin = profile.rol === "admin";

  const periodo: Periodo =
    periodoParam === "dia" || periodoParam === "semana" ? periodoParam : "mes";
  const vista: VistaCalendario =
    esAdmin && vistaParam === "empresa" ? "empresa" : "mio";

  const hoy = todayMadrid();
  const fechaBruta = fechaParam && FECHA_RE.test(fechaParam) ? fechaParam : hoy;

  // Ancla normalizada: día 1 del mes, lunes de la semana, o el propio día.
  const fecha =
    periodo === "mes"
      ? mesDe(fechaBruta).inicio
      : periodo === "semana"
        ? semanaDe(fechaBruta).inicio
        : fechaBruta;

  const fechaHoyAncla =
    periodo === "mes"
      ? mesDe(hoy).inicio
      : periodo === "semana"
        ? semanaDe(hoy).inicio
        : hoy;

  let fechaAnterior: string;
  let fechaSiguiente: string;
  if (periodo === "mes") {
    fechaAnterior = addMeses(fecha, -1);
    fechaSiguiente = addMeses(fecha, 1);
  } else if (periodo === "semana") {
    fechaAnterior = addDias(fecha, -7);
    fechaSiguiente = addDias(fecha, 7);
  } else {
    fechaAnterior = addDias(fecha, -1);
    fechaSiguiente = addDias(fecha, 1);
  }

  // Rango de consulta según el período.
  let rangoInicio: string;
  let rangoFin: string;
  let anteriorInicio: string | null = null;
  let anteriorFin: string | null = null;

  if (periodo === "dia") {
    rangoInicio = fecha;
    rangoFin = fecha;
  } else if (periodo === "semana") {
    const { inicio, fin } = semanaDe(fecha);
    rangoInicio = inicio;
    rangoFin = fin;
    anteriorFin = addDias(inicio, -1);
    anteriorInicio = addDias(anteriorFin, -6);
  } else {
    const { inicio, fin } = mesDe(fecha);
    // La rejilla cubre semanas completas (lunes-domingo) alrededor del mes.
    rangoInicio = semanaDe(inicio).inicio;
    rangoFin = semanaDe(fin).fin;
  }

  const consultaInicio = anteriorInicio ?? rangoInicio;
  const consultaFin = rangoFin;

  const db = createDbClient();
  const [{ data: proyectos }, { data: socios }] = await Promise.all([
    db.from("projects").select("id, nombre, color"),
    db.from("profiles").select("id, nombre, apellidos").eq("activo", true),
  ]);
  const proyectoPorId = new Map((proyectos ?? []).map((p) => [p.id, p]));
  const socioPorId = new Map((socios ?? []).map((s) => [s.id, s]));

  let entradasQuery = db
    .from("time_entries")
    .select(
      "id, user_id, project_id, descripcion, fecha, duracion_segundos, es_manual"
    )
    .not("hora_fin", "is", null)
    .gte("fecha", consultaInicio)
    .lte("fecha", consultaFin);

  if (vista === "mio") {
    entradasQuery = entradasQuery.eq("user_id", profile.id);
  }

  // Fase 8: además de las horas registradas, el calendario también muestra
  // las tareas con fecha límite (filtradas igual que las horas: solo las
  // mías, salvo que se esté viendo "toda la empresa") y las fechas clave
  // (siempre de toda la empresa: no son de una persona, son un aviso para
  // todos).
  let tareasQuery = db
    .from("tasks")
    .select("id, project_id, titulo, estado, responsable_id, fecha_limite")
    .not("fecha_limite", "is", null)
    .gte("fecha_limite", consultaInicio)
    .lte("fecha_limite", consultaFin);

  if (vista === "mio") {
    tareasQuery = tareasQuery.eq("responsable_id", profile.id);
  }

  const keyDatesQuery = db
    .from("key_dates")
    .select("id, titulo, descripcion, fecha, project_id")
    .gte("fecha", consultaInicio)
    .lte("fecha", consultaFin);

  const [
    { data: entradasRaw },
    { data: tareasRaw },
    { data: fechasClaveRaw },
  ] = await Promise.all([entradasQuery, tareasQuery, keyDatesQuery]);
  const todas = entradasRaw ?? [];

  const tareasPorDia = new Map<
    string,
    {
      id: string;
      titulo: string;
      estado: TareaDiaView["estado"];
      projectId: string;
    }[]
  >();
  for (const t of tareasRaw ?? []) {
    if (!t.fecha_limite) continue;
    const lista = tareasPorDia.get(t.fecha_limite) ?? [];
    lista.push({
      id: t.id,
      titulo: t.titulo,
      estado: t.estado,
      projectId: t.project_id,
    });
    tareasPorDia.set(t.fecha_limite, lista);
  }

  const fechasClavePorDia = new Map<
    string,
    { id: string; titulo: string; descripcion: string | null; projectId: string | null }[]
  >();
  for (const f of fechasClaveRaw ?? []) {
    const lista = fechasClavePorDia.get(f.fecha) ?? [];
    lista.push({
      id: f.id,
      titulo: f.titulo,
      descripcion: f.descripcion,
      projectId: f.project_id,
    });
    fechasClavePorDia.set(f.fecha, lista);
  }

  // Agregados por día: segundos totales y desglose por proyecto, para la
  // rejilla del mes y la vista semana.
  const porDia = new Map<
    string,
    { segundos: number; porProyecto: Map<string, number> }
  >();
  for (const e of todas) {
    const actual = porDia.get(e.fecha) ?? {
      segundos: 0,
      porProyecto: new Map<string, number>(),
    };
    actual.segundos += e.duracion_segundos;
    actual.porProyecto.set(
      e.project_id,
      (actual.porProyecto.get(e.project_id) ?? 0) + e.duracion_segundos
    );
    porDia.set(e.fecha, actual);
  }

  const mesActualPrefijo = fecha.slice(0, 7);

  const diasMes: DiaCelda[] = [];
  const diasSemana: DiaSemana[] = [];
  let totalSemana = 0;
  let totalAnterior = 0;
  let entradasDelDia: RegistroView[] = [];
  let gruposDelDia: GrupoSocio[] = [];
  let tareasDelDia: TareaDiaView[] = [];
  let fechasClaveDelDia: FechaClaveDiaView[] = [];

  if (periodo === "mes") {
    let cursor = rangoInicio;
    while (cursor <= rangoFin) {
      const agregado = porDia.get(cursor);
      const proyectosDia = Array.from(agregado?.porProyecto.entries() ?? [])
        .map(([id, segundos]) => ({
          id,
          color: proyectoPorId.get(id)?.color ?? "#8893a3",
          segundos,
        }))
        .sort((a, b) => b.segundos - a.segundos);

      diasMes.push({
        fecha: cursor,
        enMes: cursor.slice(0, 7) === mesActualPrefijo,
        esHoy: cursor === hoy,
        segundos: agregado?.segundos ?? 0,
        proyectos: proyectosDia,
        tareasVencen: (tareasPorDia.get(cursor) ?? []).length,
        fechasClave: (fechasClavePorDia.get(cursor) ?? []).length,
      });
      cursor = addDias(cursor, 1);
    }
  } else if (periodo === "semana") {
    let cursor = rangoInicio;
    while (cursor <= rangoFin) {
      const agregado = porDia.get(cursor);
      const proyectosDia = Array.from(agregado?.porProyecto.entries() ?? [])
        .map(([id, segundos]) => ({
          id,
          nombre: proyectoPorId.get(id)?.nombre ?? "Proyecto eliminado",
          color: proyectoPorId.get(id)?.color ?? "#8893a3",
          segundos,
        }))
        .sort((a, b) => b.segundos - a.segundos);

      diasSemana.push({
        fecha: cursor,
        esHoy: cursor === hoy,
        segundos: agregado?.segundos ?? 0,
        proyectos: proyectosDia,
        tareas: (tareasPorDia.get(cursor) ?? []).map((t) => ({
          id: t.id,
          titulo: t.titulo,
        })),
        fechasClave: (fechasClavePorDia.get(cursor) ?? []).map((f) => ({
          id: f.id,
          titulo: f.titulo,
        })),
      });
      totalSemana += agregado?.segundos ?? 0;
      cursor = addDias(cursor, 1);
    }

    if (anteriorInicio && anteriorFin) {
      for (const e of todas) {
        if (e.fecha >= anteriorInicio && e.fecha <= anteriorFin) {
          totalAnterior += e.duracion_segundos;
        }
      }
    }
  } else {
    const entradasHoy = todas.filter((e) => e.fecha === fecha);
    const aRegistroView = (e: (typeof entradasHoy)[number]): RegistroView => ({
      id: e.id,
      descripcion: e.descripcion,
      fecha: e.fecha,
      duracionSegundos: e.duracion_segundos,
      esManual: e.es_manual,
      proyecto: {
        nombre: proyectoPorId.get(e.project_id)?.nombre ?? "Proyecto eliminado",
        color: proyectoPorId.get(e.project_id)?.color ?? "#8893a3",
      },
    });

    entradasDelDia = entradasHoy
      .map(aRegistroView)
      .sort((a, b) => b.duracionSegundos - a.duracionSegundos);

    if (vista === "empresa") {
      const porSocio = new Map<string, RegistroView[]>();
      for (const e of entradasHoy) {
        const lista = porSocio.get(e.user_id) ?? [];
        lista.push(aRegistroView(e));
        porSocio.set(e.user_id, lista);
      }
      gruposDelDia = Array.from(porSocio.entries())
        .map(([socioId, lista]) => {
          const socio = socioPorId.get(socioId);
          return {
            socioId,
            nombre: socio
              ? `${socio.nombre} ${socio.apellidos}`.trim()
              : "Socio eliminado",
            entradas: lista.sort(
              (a, b) => b.duracionSegundos - a.duracionSegundos
            ),
          };
        })
        .sort(
          (a, b) =>
            b.entradas.reduce((acc, e) => acc + e.duracionSegundos, 0) -
            a.entradas.reduce((acc, e) => acc + e.duracionSegundos, 0)
        );
    }

    tareasDelDia = (tareasPorDia.get(fecha) ?? []).map((t) => ({
      id: t.id,
      titulo: t.titulo,
      estado: t.estado,
      proyecto: {
        nombre: proyectoPorId.get(t.projectId)?.nombre ?? "Proyecto eliminado",
        color: proyectoPorId.get(t.projectId)?.color ?? "#8893a3",
      },
    }));

    fechasClaveDelDia = (fechasClavePorDia.get(fecha) ?? []).map((f) => ({
      id: f.id,
      titulo: f.titulo,
      descripcion: f.descripcion,
      proyecto: f.projectId
        ? {
            nombre:
              proyectoPorId.get(f.projectId)?.nombre ?? "Proyecto eliminado",
            color: proyectoPorId.get(f.projectId)?.color ?? "#8893a3",
          }
        : null,
    }));
  }

  const tituloPeriodo =
    periodo === "mes"
      ? formatMesAnio(fecha)
      : periodo === "semana"
        ? `Semana del ${formatFecha(rangoInicio)} al ${formatFecha(rangoFin)}`
        : formatFecha(fecha);

  const exportHref = `/api/export/entradas?periodo=${periodo}&fecha=${fecha}${
    vista === "empresa" ? "&vista=empresa" : ""
  }`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendario"
        description="El tiempo registrado, las tareas con fecha límite y las fechas clave, día a día."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-sm border border-border bg-surface p-1">
          {PERIODO_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={hrefCalendario(tab.value, hoy, vista)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                periodo === tab.value
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
              href={hrefCalendario(periodo, fecha, "mio")}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                vista === "mio"
                  ? "bg-brand text-ink-on-brand"
                  : "text-ink-secondary hover:bg-surface-sunken"
              )}
            >
              Mi calendario
            </Link>
            <Link
              href={hrefCalendario(periodo, fecha, "empresa")}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link
            href={hrefCalendario(periodo, fechaAnterior, vista)}
            aria-label="Anterior"
            className="rounded-sm p-1.5 text-ink-secondary hover:bg-surface-sunken"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <p className="min-w-[11rem] text-center font-display text-base font-semibold capitalize text-ink">
            {tituloPeriodo}
          </p>
          <Link
            href={hrefCalendario(periodo, fechaSiguiente, vista)}
            aria-label="Siguiente"
            className="rounded-sm p-1.5 text-ink-secondary hover:bg-surface-sunken"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          {fecha !== fechaHoyAncla && (
            <Link
              href={hrefCalendario(periodo, hoy, vista)}
              className="ml-1 rounded-sm px-2 py-1 text-sm font-medium text-brand hover:underline"
            >
              Hoy
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <a
            href={exportHref}
            className="inline-flex items-center gap-1.5 text-ink-secondary hover:text-ink"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </a>
          <a
            href={`${exportHref}&formato=xlsx`}
            className="inline-flex items-center gap-1.5 text-ink-secondary hover:text-ink"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </a>
        </div>
      </div>

      {periodo === "mes" && <MonthGrid dias={diasMes} vista={vista} />}

      {periodo === "semana" && (
        <WeekView
          dias={diasSemana}
          vista={vista}
          totalSemana={totalSemana}
          totalAnterior={totalAnterior}
        />
      )}

      {periodo === "dia" && (
        <DayView
          vista={vista}
          entradas={entradasDelDia}
          grupos={gruposDelDia}
          tareas={tareasDelDia}
          fechasClave={fechasClaveDelDia}
          fecha={fecha}
        />
      )}
    </div>
  );
}
