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
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cronometro", label: "Cronómetro", icon: TimerIcon },
  { href: "/registros", label: "Mis registros", icon: ListChecks },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/tareas", label: "Tareas", icon: CheckSquare },
  { href: "/equipo", label: "Equipo", icon: Users },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/informes", label: "Informes semanales", icon: FileBarChart },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];
