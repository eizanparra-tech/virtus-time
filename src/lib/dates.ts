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

/** La fecha (YYYY-MM-DD) en Europe/Madrid en la que cae un instante dado. */
export function fechaMadridDe(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoTimestamp));
}

/**
 * Convierte una hora "de pared" en Europe/Madrid (la que alguien escribe en
 * un campo de hora, como "14:05") en el instante UTC real que le
 * corresponde, teniendo en cuenta el cambio de hora de verano/invierno.
 *
 * El servidor (Vercel) no está en la zona horaria de Madrid, así que no
 * basta con `new Date("${fecha}T${hora}:00")`. Se calcula en dos pasos: se
 * prueba esa hora como si fuera UTC, se mira qué hora marcaría eso en
 * Madrid, y se corrige la diferencia con la zona real.
 */
export function madridHoraAUtc(fecha: string, horaMinuto: string): string {
  const [horas, minutos] = horaMinuto.split(":").map(Number);
  const [y, m, d] = fecha.split("-").map(Number);
  const intento = Date.UTC(y, m - 1, d, horas, minutos, 0);

  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: MADRID_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(intento));

  const valor = (tipo: string) =>
    Number(partes.find((p) => p.type === tipo)?.value ?? "0");

  const comoSiFueraUtc = Date.UTC(
    valor("year"),
    valor("month") - 1,
    valor("day"),
    valor("hour"),
    valor("minute"),
    valor("second")
  );

  const diferencia = intento - comoSiFueraUtc;
  return new Date(intento + diferencia).toISOString();
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

/** Suma (o resta, con un número negativo) días de calendario a una fecha YYYY-MM-DD. */
export function addDias(fechaISO: string, dias: number): string {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + dias);
  return dt.toISOString().slice(0, 10);
}

/** Primer y último día (YYYY-MM-DD) del mes que contiene la fecha dada. */
export function mesDe(fechaISO: string): { inicio: string; fin: string } {
  const [y, m] = fechaISO.split("-").map(Number);
  const inicio = `${y}-${String(m).padStart(2, "0")}-01`;
  // El día 0 del mes siguiente es el último día de este mes.
  const ultimoDia = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const fin = `${y}-${String(m).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
  return { inicio, fin };
}

/**
 * Suma (o resta) meses completos al día 1 del mes de la fecha dada; siempre
 * devuelve un día 1, para usarla como ancla de navegación mes a mes sin
 * problemas de "31 de enero + 1 mes" (evita desbordar a marzo).
 */
export function addMeses(fechaISO: string, meses: number): string {
  const [y, m] = fechaISO.split("-").map(Number);
  const total = y * 12 + (m - 1) + meses;
  const nuevoAnio = Math.floor(total / 12);
  const nuevoMes = ((total % 12) + 12) % 12;
  return `${nuevoAnio}-${String(nuevoMes + 1).padStart(2, "0")}-01`;
}
