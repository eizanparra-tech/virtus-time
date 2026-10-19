import "server-only";

const MADRID_TZ = "Europe/Madrid";

/** La fecha de hoy (YYYY-MM-DD) en la zona horaria Europe/Madrid, no en UTC del servidor. */
export function todayMadrid(): string {
  // en-CA produce el formato YYYY-MM-DD directamente.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Convierte una fecha (YYYY-MM-DD) + duración en segundos a una hora de fin ficticia, solo para cumplir la restricción de la base de datos en registros manuales. */
export function fechaManualComoHoraInicio(fecha: string): string {
  return new Date(`${fecha}T09:00:00`).toISOString();
}

/**
 * Lunes y domingo (YYYY-MM-DD) de la semana que contiene la fecha dada.
 * Se trata como una fecha de calendario pura (sin hora ni zona horaria),
 * así que sirve igual para agrupar estadísticas que para los informes
 * semanales de la Fase 5.
 */
export function semanaDe(fechaISO: string): { inicio: string; fin: string } {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const diaSemana = base.getUTCDay(); // 0 = domingo ... 6 = sábado
  const offsetALunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const lunes = new Date(base);
  lunes.setUTCDate(base.getUTCDate() + offsetALunes);
  const domingo = new Date(lunes);
  domingo.setUTCDate(lunes.getUTCDate() + 6);

  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);
  return { inicio: fmt(lunes), fin: fmt(domingo) };
}
