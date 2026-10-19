import "server-only";
import { createDbClient } from "@/lib/supabase/db";
import { addDias } from "@/lib/dates";

// =============================================================================
// Generación de informes semanales (Fase 5).
//
// Esta función es el único lugar donde se calcula un informe: la llaman
// tanto la tarea programada de los lunes (src/app/api/cron/informes-semanales)
// como el botón manual de un administrador (src/app/(app)/informes/actions.ts).
//
// El resumen numérico (resumen_general, horas por proyecto, horas por socio)
// se calcula siempre a partir de time_entries reales. El texto de
// "conclusiones" lo escribe la IA, pero solo a partir de esos mismos
// números agregados — nunca se le pide que invente nada que no esté en
// los datos, y si no hay ANTHROPIC_API_KEY configurada, el informe se
// guarda igualmente (con los números reales) sin ese texto.
// =============================================================================

export interface ResultadoInforme {
  ok: boolean;
  error?: string;
  reportId?: string;
}

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

const ANTHROPIC_MODEL = "claude-haiku-5-5";

export async function generarInformeSemanal(
  semanaInicio: string
): Promise<ResultadoInforme> {
  const semanaFin = addDias(semanaInicio, 6);
  const db = createDbClient();

  const { data: existente } = await db
    .from("weekly_reports")
    .select("id, generated_at")
    .eq("semana_inicio", semanaInicio)
    .maybeSingle();

  let reportId = existente?.id;
  const esRegeneracion = Boolean(existente?.generated_at);

  if (!reportId) {
    const { data: nuevo, error } = await db
      .from("weekly_reports")
      .insert({
        semana_inicio: semanaInicio,
        semana_fin: semanaFin,
        status: "generando",
      })
      .select("id")
      .single();

    if (error || !nuevo) {
      return { ok: false, error: "No se ha podido crear el informe." };
    }
    reportId = nuevo.id;
  } else {
    await db
      .from("weekly_reports")
      .update({ status: "generando" })
      .eq("id", reportId);
  }

  try {
    const { data: entradas } = await db
      .from("time_entries")
      .select("user_id, project_id, duracion_segundos, fecha")
      .not("hora_fin", "is", null)
      .gte("fecha", semanaInicio)
      .lte("fecha", semanaFin);

    const [{ data: proyectos }, { data: socios }] = await Promise.all([
      db.from("projects").select("id, nombre"),
      db.from("profiles").select("id, nombre, apellidos").eq("activo", true),
    ]);

    const filas = entradas ?? [];
    const listaSocios = socios ?? [];
    const proyectoPorId = new Map((proyectos ?? []).map((p) => [p.id, p]));

    const segundosPorProyecto = new Map<string, number>();
    const porSocioAcumulado = new Map<
      string,
      { segundos: number; dias: Set<string> }
    >();

    for (const f of filas) {
      segundosPorProyecto.set(
        f.project_id,
        (segundosPorProyecto.get(f.project_id) ?? 0) + f.duracion_segundos
      );

      const actual =
        porSocioAcumulado.get(f.user_id) ?? { segundos: 0, dias: new Set<string>() };
      actual.segundos += f.duracion_segundos;
      actual.dias.add(f.fecha);
      porSocioAcumulado.set(f.user_id, actual);
    }

    const totalSegundos = filas.reduce((acc, f) => acc + f.duracion_segundos, 0);

    const porProyecto: PorProyecto[] = Array.from(
      segundosPorProyecto.entries()
    ).map(([projectId, segundos]) => ({
      project_id: projectId,
      nombre: proyectoPorId.get(projectId)?.nombre ?? "Proyecto eliminado",
      segundos,
    }));

    const porSocio: PorSocio[] = Array.from(porSocioAcumulado.entries()).map(
      ([userId, v]) => {
        const socio = listaSocios.find((s) => s.id === userId);
        return {
          user_id: userId,
          nombre: socio ? `${socio.nombre} ${socio.apellidos}`.trim() : "Socio eliminado",
          segundos: v.segundos,
          dias_con_actividad: v.dias.size,
        };
      }
    );

    const sociosSinActividad = listaSocios
      .filter((s) => !porSocioAcumulado.has(s.id))
      .map((s) => `${s.nombre} ${s.apellidos}`.trim());

    const resumenGeneral: ResumenGeneral = {
      total_segundos: totalSegundos,
      total_proyectos_con_actividad: porProyecto.length,
      total_socios_con_actividad: porSocio.length,
      total_socios: listaSocios.length,
      por_proyecto: porProyecto,
      por_socio: porSocio,
      socios_sin_actividad: sociosSinActividad,
    };

    const conclusiones = await generarConclusionesIA(
      resumenGeneral,
      semanaInicio,
      semanaFin
    );

    const ahora = new Date().toISOString();
    await db
      .from("weekly_reports")
      .update({
        status: "completado",
        resumen_general: resumenGeneral as unknown as Record<string, unknown>,
        conclusiones,
        generated_at: esRegeneracion ? existente?.generated_at ?? ahora : ahora,
        regenerated_at: esRegeneracion ? ahora : null,
      })
      .eq("id", reportId);

    if (porProyecto.length > 0) {
      await db.from("weekly_project_reports").upsert(
        porProyecto.map((p) => ({
          report_id: reportId!,
          project_id: p.project_id,
          horas_totales: Math.round((p.segundos / 3600) * 100) / 100,
          datos: { segundos: p.segundos },
        })),
        { onConflict: "report_id,project_id" }
      );
    }

    if (porSocio.length > 0) {
      await db.from("weekly_member_reports").upsert(
        porSocio.map((s) => ({
          report_id: reportId!,
          user_id: s.user_id,
          horas_totales: Math.round((s.segundos / 3600) * 100) / 100,
          dias_con_actividad: s.dias_con_actividad,
          datos: { segundos: s.segundos },
        })),
        { onConflict: "report_id,user_id" }
      );
    }

    return { ok: true, reportId };
  } catch {
    await db.from("weekly_reports").update({ status: "error" }).eq("id", reportId);
    return { ok: false, error: "Ha fallado la generación del informe." };
  }
}

async function generarConclusionesIA(
  resumen: ResumenGeneral,
  semanaInicio: string,
  semanaFin: string
): Promise<Record<string, unknown>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      general: null,
      nota:
        "Añade ANTHROPIC_API_KEY en las variables de entorno de Vercel para activar el resumen automático.",
    };
  }

  if (resumen.total_segundos === 0) {
    return {
      general: null,
      nota: "Nadie registró horas esta semana, así que no hay nada que resumir.",
    };
  }

  const prompt = `Estos son los datos REALES y agregados de registro de horas de VIRTUS COMPANY para la semana del ${semanaInicio} al ${semanaFin} (lunes a domingo):

${JSON.stringify(resumen, null, 2)}

Escribe un resumen breve (3 a 5 frases, en español, en prosa, sin listas ni markdown) que describa objetivamente los patrones visibles en estos números: qué proyecto o proyectos concentraron más horas, si algún socio no registró actividad, y cualquier otro patrón claro en los datos.

No inventes causas ni motivos que no estén en los datos. No juzgues si el resultado es bueno o malo. No asumas nada sobre por qué alguien trabajó más o menos horas de lo esperado. Limítate a los hechos que muestran los números. Responde solo con el texto del resumen, sin introducción.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      return {
        general: null,
        nota: `La IA no ha podido generar el resumen (error ${res.status}).`,
      };
    }

    const data = await res.json();
    const bloque = Array.isArray(data?.content) ? data.content[0] : null;
    const texto = typeof bloque?.text === "string" ? bloque.text.trim() : "";

    return { general: texto || null };
  } catch {
    return {
      general: null,
      nota: "La IA no ha podido generar el resumen (fallo de red).",
    };
  }
}
