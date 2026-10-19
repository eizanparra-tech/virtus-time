"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@/lib/supabase/db";
import { requireProfile } from "@/lib/session";
import { todayMadrid, fechaManualComoHoraInicio } from "@/lib/dates";

// =============================================================================
// Server Actions del cronómetro y del registro manual.
//
// La duración real de un registro vive en la base de datos, no en el
// navegador: duracion_segundos guarda los segundos ya acumulados y
// running_since (si no es null) marca desde cuándo sigue corriendo desde la
// última vez que se reanudó. El cliente solo calcula, para mostrarlo,
// duracion_segundos + (ahora - running_since); nunca "inventa" el tiempo.
//
// Solo puede existir un registro con hora_fin = null por socio (lo impone el
// índice único de la base de datos), así que como mucho hay un cronómetro
// activo (en marcha o en pausa) por persona.
// =============================================================================

export interface StartTimerState {
  ok: boolean;
  error?: string;
}

export async function iniciarCronometroAction(
  _prev: StartTimerState,
  formData: FormData
): Promise<StartTimerState> {
  const profile = await requireProfile();
  const projectId = String(formData.get("project_id") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  if (!projectId) {
    return { ok: false, error: "Elige un proyecto." };
  }
  if (!descripcion) {
    return { ok: false, error: "Escribe en qué vas a trabajar antes de iniciar." };
  }

  const db = createDbClient();
  const { data: project } = await db
    .from("projects")
    .select("id, estado")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.estado !== "activo") {
    return { ok: false, error: "Ese proyecto no está disponible." };
  }

  const ahora = new Date().toISOString();
  const { error } = await db.from("time_entries").insert({
    user_id: profile.id,
    project_id: projectId,
    descripcion,
    estado: "en_proceso",
    fecha: todayMadrid(),
    hora_inicio: ahora,
    running_since: ahora,
    duracion_segundos: 0,
    es_manual: false,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Ya tienes un cronómetro en marcha. Finalízalo antes de iniciar otro.",
      };
    }
    return { ok: false, error: "No se ha podido iniciar el cronómetro." };
  }

  revalidatePath("/cronometro");
  return { ok: true };
}

export interface TimerActionState {
  ok: boolean;
  error?: string;
}

async function cargarEntradaActivaPropia(profileId: string, entryId: string) {
  const db = createDbClient();
  const { data: entry } = await db
    .from("time_entries")
    .select("*")
    .eq("id", entryId)
    .eq("user_id", profileId)
    .is("hora_fin", null)
    .maybeSingle();
  return { db, entry };
}

export async function pausarCronometroAction(
  _prev: TimerActionState,
  formData: FormData
): Promise<TimerActionState> {
  const profile = await requireProfile();
  const entryId = String(formData.get("entryId") ?? "");
  const { db, entry } = await cargarEntradaActivaPropia(profile.id, entryId);

  if (!entry || !entry.running_since) {
    return { ok: false, error: "No hay un cronómetro en marcha para pausar." };
  }

  const transcurrido = Math.max(
    0,
    Math.floor((Date.now() - new Date(entry.running_since).getTime()) / 1000)
  );

  const { error } = await db
    .from("time_entries")
    .update({
      duracion_segundos: entry.duracion_segundos + transcurrido,
      running_since: null,
    })
    .eq("id", entry.id);

  if (error) return { ok: false, error: "No se ha podido pausar." };

  revalidatePath("/cronometro");
  return { ok: true };
}

export async function reanudarCronometroAction(
  _prev: TimerActionState,
  formData: FormData
): Promise<TimerActionState> {
  const profile = await requireProfile();
  const entryId = String(formData.get("entryId") ?? "");
  const { db, entry } = await cargarEntradaActivaPropia(profile.id, entryId);

  if (!entry || entry.running_since) {
    return { ok: false, error: "No hay un cronómetro en pausa para reanudar." };
  }

  const { error } = await db
    .from("time_entries")
    .update({ running_since: new Date().toISOString() })
    .eq("id", entry.id);

  if (error) return { ok: false, error: "No se ha podido reanudar." };

  revalidatePath("/cronometro");
  return { ok: true };
}

export async function finalizarCronometroAction(
  _prev: TimerActionState,
  formData: FormData
): Promise<TimerActionState> {
  const profile = await requireProfile();
  const entryId = String(formData.get("entryId") ?? "");
  const { db, entry } = await cargarEntradaActivaPropia(profile.id, entryId);

  if (!entry) {
    return { ok: false, error: "No hay un cronómetro activo para finalizar." };
  }

  let duracionFinal = entry.duracion_segundos;
  if (entry.running_since) {
    duracionFinal += Math.max(
      0,
      Math.floor((Date.now() - new Date(entry.running_since).getTime()) / 1000)
    );
  }
  // Evita un registro de 0 segundos si alguien finaliza en el mismo instante que inicia.
  duracionFinal = Math.max(duracionFinal, 1);

  const { error } = await db
    .from("time_entries")
    .update({
      duracion_segundos: duracionFinal,
      running_since: null,
      hora_fin: new Date().toISOString(),
      estado: "finalizada",
    })
    .eq("id", entry.id);

  if (error) return { ok: false, error: "No se ha podido finalizar." };

  revalidatePath("/cronometro");
  revalidatePath("/registros");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function actualizarDescripcionAction(
  _prev: TimerActionState,
  formData: FormData
): Promise<TimerActionState> {
  const profile = await requireProfile();
  const entryId = String(formData.get("entryId") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  if (!descripcion) {
    return { ok: false, error: "La descripción no puede quedar vacía." };
  }

  const { db, entry } = await cargarEntradaActivaPropia(profile.id, entryId);
  if (!entry) {
    return { ok: false, error: "No hay un cronómetro activo." };
  }

  const { error } = await db
    .from("time_entries")
    .update({ descripcion })
    .eq("id", entry.id);

  if (error) return { ok: false, error: "No se ha podido guardar la descripción." };

  revalidatePath("/cronometro");
  return { ok: true };
}

export interface ManualEntryState {
  ok: boolean;
  error?: string;
  resetKey?: number;
}

export async function crearRegistroManualAction(
  _prev: ManualEntryState,
  formData: FormData
): Promise<ManualEntryState> {
  const profile = await requireProfile();
  const projectId = String(formData.get("project_id") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "");
  const horas = Number(formData.get("horas") ?? 0);
  const minutos = Number(formData.get("minutos") ?? 0);

  if (!projectId) {
    return { ok: false, error: "Elige un proyecto." };
  }
  if (!descripcion) {
    return { ok: false, error: "Describe en qué has trabajado." };
  }
  if (!fecha || Number.isNaN(Date.parse(fecha))) {
    return { ok: false, error: "Indica una fecha válida." };
  }
  if (fecha > todayMadrid()) {
    return { ok: false, error: "No puedes registrar horas en el futuro." };
  }

  const totalSegundos =
    Math.round(Number.isFinite(horas) ? horas : 0) * 3600 +
    Math.round(Number.isFinite(minutos) ? minutos : 0) * 60;

  if (totalSegundos <= 0) {
    return { ok: false, error: "Indica una duración mayor que cero." };
  }
  if (totalSegundos > 24 * 3600) {
    return { ok: false, error: "Un registro no puede durar más de 24 horas." };
  }

  const db = createDbClient();
  const { data: project } = await db
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return { ok: false, error: "Ese proyecto ya no existe." };
  }

  const horaInicio = fechaManualComoHoraInicio(fecha);
  const horaFin = new Date(
    new Date(horaInicio).getTime() + totalSegundos * 1000
  ).toISOString();

  const { error } = await db.from("time_entries").insert({
    user_id: profile.id,
    project_id: projectId,
    descripcion,
    estado: "finalizada",
    fecha,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    duracion_segundos: totalSegundos,
    running_since: null,
    es_manual: true,
  });

  if (error) {
    return { ok: false, error: "No se ha podido guardar el registro." };
  }

  revalidatePath("/cronometro");
  revalidatePath("/registros");
  revalidatePath("/dashboard");
  return { ok: true, resetKey: Date.now() };
}
