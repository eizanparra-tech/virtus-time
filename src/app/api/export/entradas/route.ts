import ExcelJS from "exceljs";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { semanaDe, mesDe } from "@/lib/dates";
import { formatFecha } from "@/lib/utils";

// =============================================================================
// Exportación de los registros de tiempo que se ven en /calendario, en el
// mismo rango (día, semana o mes) y con el mismo alcance (mío o empresa)
// que la vista actual. Dos formatos: CSV (por defecto) o Excel (?formato=xlsx).
// =============================================================================

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

function escaparCsv(valor: string): string {
  if (/[",\n;]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function horasDecimal(segundos: number): string {
  return (segundos / 3600).toFixed(2);
}

export async function GET(request: Request) {
  const profile = await requireProfile();
  const esAdmin = profile.rol === "admin";

  const url = new URL(request.url);
  const periodo = url.searchParams.get("periodo");
  const fechaParam = url.searchParams.get("fecha");
  const formato = url.searchParams.get("formato") === "xlsx" ? "xlsx" : "csv";
  // Un socio normal nunca puede exportar los datos de toda la empresa,
  // aunque manipule la URL a mano.
  const vistaEmpresa = esAdmin && url.searchParams.get("vista") === "empresa";

  const fecha = fechaParam && FECHA_RE.test(fechaParam) ? fechaParam : null;
  if (!fecha) {
    return Response.json({ error: "Falta la fecha." }, { status: 400 });
  }

  let rangoInicio: string;
  let rangoFin: string;
  if (periodo === "semana") {
    const { inicio, fin } = semanaDe(fecha);
    rangoInicio = inicio;
    rangoFin = fin;
  } else if (periodo === "mes") {
    const { inicio, fin } = mesDe(fecha);
    rangoInicio = inicio;
    rangoFin = fin;
  } else {
    rangoInicio = fecha;
    rangoFin = fecha;
  }

  const db = createDbClient();
  let entradasQuery = db
    .from("time_entries")
    .select("user_id, project_id, descripcion, fecha, duracion_segundos")
    .not("hora_fin", "is", null)
    .gte("fecha", rangoInicio)
    .lte("fecha", rangoFin)
    .order("fecha", { ascending: true });

  if (!vistaEmpresa) {
    entradasQuery = entradasQuery.eq("user_id", profile.id);
  }

  const [{ data: entradas }, { data: proyectos }, { data: socios }] =
    await Promise.all([
      entradasQuery,
      db.from("projects").select("id, nombre"),
      vistaEmpresa
        ? db.from("profiles").select("id, nombre, apellidos")
        : Promise.resolve({ data: null }),
    ]);

  const proyectoPorId = new Map((proyectos ?? []).map((p) => [p.id, p.nombre]));
  const socioPorId = new Map(
    (socios ?? []).map((s) => [s.id, `${s.nombre} ${s.apellidos}`.trim()])
  );

  const filas = (entradas ?? []).map((e) => ({
    fecha: e.fecha,
    socio: vistaEmpresa ? socioPorId.get(e.user_id) ?? "Socio eliminado" : null,
    proyecto: proyectoPorId.get(e.project_id) ?? "Proyecto eliminado",
    descripcion: e.descripcion,
    horas: horasDecimal(e.duracion_segundos),
  }));

  const sufijoRango =
    rangoInicio === rangoFin ? rangoInicio : `${rangoInicio}_a_${rangoFin}`;
  const nombreArchivo = `virtus-time_registros_${sufijoRango}`;

  if (formato === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet("Registros");

    const columnas = [
      { header: "Fecha", key: "fecha", width: 14 },
      ...(vistaEmpresa ? [{ header: "Socio", key: "socio", width: 26 }] : []),
      { header: "Proyecto", key: "proyecto", width: 24 },
      { header: "Descripción", key: "descripcion", width: 48 },
      { header: "Horas", key: "horas", width: 10 },
    ];
    hoja.columns = columnas;
    hoja.getRow(1).font = { bold: true };

    for (const fila of filas) {
      hoja.addRow(fila);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivo}.xlsx"`,
      },
    });
  }

  const cabecera = [
    "Fecha",
    ...(vistaEmpresa ? ["Socio"] : []),
    "Proyecto",
    "Descripción",
    "Horas",
  ];
  const lineas = [cabecera.join(";")];
  for (const fila of filas) {
    lineas.push(
      [
        formatFecha(fila.fecha),
        ...(vistaEmpresa ? [escaparCsv(fila.socio ?? "")] : []),
        escaparCsv(fila.proyecto),
        escaparCsv(fila.descripcion),
        fila.horas,
      ].join(";")
    );
  }
  // BOM UTF-8 para que Excel abra bien los acentos al hacer doble clic.
  const csv = "﻿" + lineas.join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}.csv"`,
    },
  });
}
