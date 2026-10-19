import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { formatDuracionCorta, formatFecha } from "@/lib/utils";

// =============================================================================
// Exporta a PDF un informe semanal ya generado (/informes/[id]), con los
// mismos números reales que se ven en la página: horas por proyecto, horas
// por socio, y el resumen (de IA, o la nota si no lo hay).
// =============================================================================

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

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGEN = 56;
const ANCHO_UTIL = PAGE_WIDTH - MARGEN * 2;
const AZUL_VIRTUS = rgb(0.043, 0.118, 0.239); // #0b1e3d
const GRIS = rgb(0.4, 0.42, 0.46);

function envolverTexto(font: PDFFont, texto: string, tamano: number, anchoMax: number): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && font.widthOfTextAtSize(prueba, tamano) > anchoMax) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireProfile();
  const { id } = await params;

  const db = createDbClient();
  const { data: informe } = await db
    .from("weekly_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!informe) {
    return Response.json({ error: "Ese informe no existe." }, { status: 404 });
  }
  if (informe.status !== "completado") {
    return Response.json(
      { error: "Este informe todavía no está completo." },
      { status: 409 }
    );
  }

  const resumen = informe.resumen_general as unknown as ResumenGeneral;
  const conclusiones = informe.conclusiones as unknown as Conclusiones;
  const porProyecto = [...(resumen.por_proyecto ?? [])].sort(
    (a, b) => b.segundos - a.segundos
  );
  const porSocio = [...(resumen.por_socio ?? [])].sort(
    (a, b) => b.segundos - a.segundos
  );

  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page: PDFPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGEN;

  function nuevaPaginaSiHaceFalta(altura: number) {
    if (y - altura < MARGEN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGEN;
    }
  }

  function linea(
    texto: string,
    opts: { tamano?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; espacio?: number } = {}
  ) {
    const tamano = opts.tamano ?? 10.5;
    nuevaPaginaSiHaceFalta(tamano + 6);
    page.drawText(texto, {
      x: MARGEN,
      y,
      size: tamano,
      font: opts.font ?? fontRegular,
      color: opts.color ?? AZUL_VIRTUS,
    });
    y -= (opts.espacio ?? tamano + 7);
  }

  function parrafo(texto: string, opts: { tamano?: number; font?: PDFFont } = {}) {
    const tamano = opts.tamano ?? 10.5;
    const font = opts.font ?? fontRegular;
    for (const l of envolverTexto(font, texto, tamano, ANCHO_UTIL)) {
      linea(l, { tamano, font, espacio: tamano + 5 });
    }
  }

  function espacio(altura: number) {
    y -= altura;
  }

  // --- Cabecera ---
  linea("VIRTUS TIME", { tamano: 11, font: fontBold, color: GRIS, espacio: 16 });
  linea("Informe semanal", { tamano: 20, font: fontBold, espacio: 26 });
  linea(
    `Semana del ${formatFecha(informe.semana_inicio)} al ${formatFecha(informe.semana_fin)}`,
    { tamano: 12, color: GRIS, espacio: 22 }
  );

  linea(`Total registrado: ${formatDuracionCorta(resumen.total_segundos)}`, {
    tamano: 13,
    font: fontBold,
    espacio: 18,
  });
  linea(
    `${resumen.total_socios_con_actividad} de ${resumen.total_socios} socios registraron algo, en ${resumen.total_proyectos_con_actividad} proyecto${resumen.total_proyectos_con_actividad === 1 ? "" : "s"}.`,
    { tamano: 10.5, color: GRIS, espacio: 22 }
  );

  // --- Horas por proyecto ---
  linea("Horas por proyecto", { tamano: 13, font: fontBold, espacio: 18 });
  if (porProyecto.length === 0) {
    linea("Ningún proyecto tuvo actividad esta semana.", { color: GRIS });
  } else {
    for (const p of porProyecto) {
      linea(`${p.nombre}  —  ${formatDuracionCorta(p.segundos)}`);
    }
  }
  espacio(10);

  // --- Horas por socio ---
  linea("Horas por socio", { tamano: 13, font: fontBold, espacio: 18 });
  if (porSocio.length === 0) {
    linea("Nadie registró horas esta semana.", { color: GRIS });
  } else {
    for (const s of porSocio) {
      linea(
        `${s.nombre}  —  ${formatDuracionCorta(s.segundos)}  ·  ${s.dias_con_actividad} día${s.dias_con_actividad === 1 ? "" : "s"}`
      );
    }
  }
  if (resumen.socios_sin_actividad.length > 0) {
    espacio(4);
    parrafo(`Sin ninguna hora registrada: ${resumen.socios_sin_actividad.join(", ")}.`, {
      tamano: 9.5,
      font: fontItalic,
    });
  }
  espacio(10);

  // --- Resumen ---
  linea("Resumen de la semana", { tamano: 13, font: fontBold, espacio: 18 });
  if (conclusiones.general) {
    parrafo(conclusiones.general, { tamano: 10.5 });
  } else {
    parrafo(conclusiones.nota ?? "No se generó un resumen para esta semana.", {
      tamano: 10.5,
      font: fontItalic,
    });
  }

  // --- Pie ---
  nuevaPaginaSiHaceFalta(30);
  espacio(10);
  linea(
    `Generado a partir de los registros reales de VIRTUS COMPANY. Exportado el ${formatFecha(
      new Date().toISOString().slice(0, 10)
    )}.`,
    { tamano: 8.5, color: GRIS, font: fontItalic }
  );

  const bytes = await doc.save();

  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="virtus-time_informe_${informe.semana_inicio}.pdf"`,
    },
  });
}
