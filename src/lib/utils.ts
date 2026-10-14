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

export function iniciales(nombre: string, apellidos: string): string {
  const n = nombre.trim().charAt(0) ?? "";
  const a = apellidos.trim().charAt(0) ?? "";
  return `${n}${a}`.toUpperCase() || "?";
}
