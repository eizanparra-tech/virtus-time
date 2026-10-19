export type Periodo = "dia" | "semana" | "mes";
export type VistaCalendario = "mio" | "empresa";

/** Construye la URL de /calendario preservando periodo, fecha y vista. */
export function hrefCalendario(
  periodo: Periodo,
  fecha: string,
  vista: VistaCalendario
): string {
  const params = new URLSearchParams();
  if (periodo !== "mes") params.set("periodo", periodo);
  params.set("fecha", fecha);
  if (vista !== "mio") params.set("vista", vista);
  return `/calendario?${params.toString()}`;
}
