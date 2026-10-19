"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { generarInformeSemanal } from "@/lib/informes";
import { todayMadrid, semanaDe, addDias } from "@/lib/dates";

export interface InformeActionState {
  ok: boolean;
  error?: string;
}

/** Botón manual: genera (o regenera) el informe de la última semana completa. */
export async function generarInformeSemanaPasadaAction(
  _prev: InformeActionState,
  _formData: FormData
): Promise<InformeActionState> {
  await requireAdmin();

  const hoy = todayMadrid();
  const estaSemana = semanaDe(hoy);
  const semanaPasada = semanaDe(addDias(estaSemana.inicio, -1));

  const resultado = await generarInformeSemanal(semanaPasada.inicio);
  if (!resultado.ok) {
    return { ok: false, error: resultado.error ?? "No se ha podido generar el informe." };
  }

  revalidatePath("/informes");
  return { ok: true };
}

/** Vuelve a calcular un informe ya existente (por si algo cambió después). */
export async function regenerarInformeAction(
  _prev: InformeActionState,
  formData: FormData
): Promise<InformeActionState> {
  await requireAdmin();

  const semanaInicio = String(formData.get("semanaInicio") ?? "");
  if (!semanaInicio) {
    return { ok: false, error: "Falta la semana a regenerar." };
  }

  const resultado = await generarInformeSemanal(semanaInicio);
  if (!resultado.ok) {
    return { ok: false, error: resultado.error ?? "No se ha podido regenerar el informe." };
  }

  revalidatePath("/informes");
  if (resultado.reportId) {
    revalidatePath(`/informes/${resultado.reportId}`);
  }
  return { ok: true };
}
