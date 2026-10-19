"use server";

import { revalidatePath } from "next/cache";
import { createDbClient } from "@/lib/supabase/db";
import { requireProfile } from "@/lib/session";
import { todayMadrid, fechaManualComoHoraInicio } from "@/lib/dates";
import type { Profile } from "@/types/database.types";

export interface RegistroActionState {
  ok: boolean;
  error?: string;
}

async function registrarHistorial(
  db: ReturnType<typeof createDbClient>,
  entryId: string,
  changedBy: string,
  cambios: { campo: string; antes: string | null; despues: string | null }[]
) {
  const filas = cambios
    .filter((c) => c.antes !== c.despues)
    .map((c) => ({
      time_entry_id: entryId,
      changed_by: changedBy,
      campo: c.campo,
      valor_anterior: c.antes,
      valor_nuevo: c.despues,
    }));

  if (filas.length > 0) {
    await db.from("time_entry_history").insert(filas);
  }
}

/**
 * Solo se pueden editar/borrar registros ya finalizados (el cronómetro
 * activo se gestiona desde /cronometro). Un socio normal solo puede tocar
 * los suyos; un administrador puede corregir el de cualquiera (p.ej. desde
 * el Calendario, vista de empresa), para eso recibe el perfil completo y
 * no solo su id.
 */
async function cargarRegistroEditable(
  profile: Profile,
  entryId: string
) {
  const db = createDbClient();
  let query = db
    .from("time_entries")
    .select("*")
    .eq("id", entryId)
    .not("hora_fin", "is", null);

  if (profile.rol !== "admin") {
    query = query.eq("user_id", profile.id);
  }

  const { data: entry } = await query.maybeSingle();
  return { db, entry };
}

export async function actualizarRegistroAction(
  _prev: RegistroActionState,
  formData: FormData
): Promise<RegistroActionState> {
  const profile = await requireProfile();
  const entryId = String(formData.get("entryId") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "");
  const horas = Number(formData.get("horas") ?? 0);
  const minutos = Number(formData.get("minutos") ?? 0);

  if (!descripcion) {
    return { ok: false, error: "La descripción no puede quedar vacía." };
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

  const { db, entry } = await cargarRegistroEditable(profile, entryId);
  if (!entry) {
    return { ok: false, error: "Ese registro no existe o no se puede editar." };
  }

  // Si la fecha no cambia, se conserva la hora de inicio real; si cambia, se
  // recalcula una hora de inicio nominal para ese día (ver fechaManualComoHoraInicio).
  const horaInicio =
    fecha === entry.fecha ? entry.hora_inicio : fechaManualComoHoraInicio(fecha);
  const horaFin = new Date(
    new Date(horaInicio).getTime() + totalSegundos * 1000
  ).toISOString();

  const { error } = await db
    .from("time_entries")
    .update({
      descripcion,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      duracion_segundos: totalSegundos,
    })
    .eq("id", entry.id);

  if (error) {
    return { ok: false, error: "No se ha podido guardar el cambio." };
  }

  await registrarHistorial(db, entry.id, profile.id, [
    { campo: "descripcion", antes: entry.descripcion, despues: descripcion },
    { campo: "fecha", antes: entry.fecha, despues: fecha },
    {
      campo: "duracion_segundos",
      antes: String(entry.duracion_segundos),
      despues: String(totalSegundos),
    },
  ]);

  revalidatePath("/registros");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  return { ok: true };
}

export async function borrarRegistroAction(
  _prev: RegistroActionState,
  formData: FormData
): Promise<RegistroActionState> {
  const profile = await requireProfile();
  const entryId = String(formData.get("entryId") ?? "");

  const { db, entry } = await cargarRegistroEditable(profile, entryId);
  if (!entry) {
    return { ok: false, error: "Ese registro no existe o no se puede borrar." };
  }

  const { error } = await db.from("time_entries").delete().eq("id", entry.id);

  if (error) {
    return { ok: false, error: "No se ha podido borrar el registro." };
  }

  revalidatePath("/registros");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  return { ok: true };
}
