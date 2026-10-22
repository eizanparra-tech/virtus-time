import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  TimerIcon,
  ListChecks,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  FileBarChart,
  CalendarDays,
  Settings,
  Flag,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export type Modo = "reloj" | "calendario";

// Fase 8: la aplicación se divide en dos modos que se eligen desde /inicio.
// "Reloj" es la aplicación original (cronómetro, registros, proyectos,
// equipo, estadísticas, informes, configuración). "Calendario" agrupa el
// calendario, las tareas y las fechas clave: todo lo que tiene que ver con
// "qué hay que hacer y cuándo" en vez de "cuánto tiempo se ha dedicado".
export const NAV_ITEMS_RELOJ: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cronometro", label: "Cronómetro", icon: TimerIcon },
  { href: "/registros", label: "Mis registros", icon: ListChecks },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/equipo", label: "Equipo", icon: Users },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/informes", label: "Informes semanales", icon: FileBarChart },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export const NAV_ITEMS_CALENDARIO: NavItem[] = [
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/tareas", label: "Tareas", icon: CheckSquare },
  { href: "/fechas-clave", label: "Fechas clave", icon: Flag },
];

/** Para no repetir el mismo "pathname === href || pathname.startsWith(href + '/')" en varios sitios. */
function coincideAlgunItem(pathname: string, items: NavItem[]): boolean {
  return items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
}

/** Deduce el modo activo a partir de la ruta actual, para el menú lateral. */
export function modoDeRuta(pathname: string): Modo {
  return coincideAlgunItem(pathname, NAV_ITEMS_CALENDARIO) ? "calendario" : "reloj";
}
