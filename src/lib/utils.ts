import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea segundos como "HH:MM:SS" (o "H:MM:SS" si pasa de 99h, sin recortar). */
export function formatDuracion(segundosTotales: number): string {
  const segundos = Math.max(0, Math.floor(segundosTotales));
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Formatea segundos de forma legible y corta, p.ej. "2h 15min". */
export function formatDuracionCorta(segundosTotales: number): string {
  const segundos = Math.max(0, Math.floor(segundosTotales));
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (h === 0 && m === 0) return "0 min";
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function formatFecha(fechaISO: string): string {
  return new Date(`${fechaISO}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** "Octubre 2026", a partir de cualquier fecha YYYY-MM-DD de ese mes. */
export function formatMesAnio(fechaISO: string): string {
  const texto = new Date(`${fechaISO}T00:00:00`).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "19 oct, 23:15", a partir de un timestamp ISO completo (con hora). */
export function formatFechaHora(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "14:05" (24 horas, Europe/Madrid), para mostrar una hora o rellenar un <input type="time">. */
export function horaInputValue(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoTimestamp));
}

/** "Lun", "Mar"... a partir de una fecha YYYY-MM-DD. */
export function formatDiaCorto(fechaISO: string): string {
  const texto = new Date(`${fechaISO}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "short",
  });
  const limpio = texto.replace(".", "");
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

/**
 * Comprueba que una ruta de redirección es realmente interna a la
 * aplicación, no una forma disfrazada de salir a otro sitio. "/foo" es
 * segura; "//evil.com" o "/\evil.com" son, para el navegador, URLs
 * absolutas a otro dominio (el "esquema relativo" //), aunque empiecen
 * por una barra. Se usa al volver de /login con un redirectTo que viene
 * de la URL, y por tanto no es de fiar.
 */
export function esRutaInternaSegura(ruta: string): boolean {
  return (
    ruta.startsWith("/") && !ruta.startsWith("//") && !ruta.startsWith("/\\")
  );
}

export function iniciales(nombre: string, apellidos: string): string {
  const n = nombre.trim().charAt(0) ?? "";
  const a = apellidos.trim().charAt(0) ?? "";
  return `${n}${a}`.toUpperCase() || "?";
}
