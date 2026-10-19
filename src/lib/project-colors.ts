// Paleta de colores para proyectos. Son los mismos valores que las variables
// --color-project-1..8 definidas en globals.css (se repiten aquí como
// cadenas literales porque los componentes los usan en estilos inline, que
// no pueden leer variables CSS personalizadas de Tailwind directamente).
export const PROJECT_COLORS = [
  "#0b1e3d",
  "#b8863d",
  "#2f6fb8",
  "#1e8f6f",
  "#8a4f9e",
  "#c24444",
  "#2a9d9d",
  "#c97b3d",
] as const;

/** Elige un color de la paleta siguiendo el orden, a partir de cuántos proyectos ya existen. */
export function nextProjectColor(existingCount: number): string {
  return PROJECT_COLORS[existingCount % PROJECT_COLORS.length];
}
