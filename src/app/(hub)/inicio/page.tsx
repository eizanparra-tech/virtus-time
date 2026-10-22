import Link from "next/link";
import { TimerIcon, CalendarDays, LogOut } from "lucide-react";
import { requireProfile } from "@/lib/session";
import { iniciales } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { signOutAction } from "@/app/(app)/actions";

const MODOS = [
  {
    href: "/dashboard",
    icon: TimerIcon,
    titulo: "Reloj",
    descripcion:
      "Cronómetro, registros, proyectos, equipo, estadísticas e informes semanales.",
  },
  {
    href: "/calendario",
    icon: CalendarDays,
    titulo: "Calendario",
    descripcion:
      "El calendario, las tareas de cada proyecto y las fechas clave de la empresa.",
  },
];

export default async function InicioPage() {
  const profile = await requireProfile();

  return (
    <div className="text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-lg font-semibold text-ink-on-brand">
        {iniciales(profile.nombre, profile.apellidos)}
      </span>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Hola, {profile.nombre}
      </h1>
      <p className="mt-1 mb-8 text-sm text-ink-secondary">¿Qué quieres abrir?</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODOS.map((modo) => (
          <Link key={modo.href} href={modo.href} className="group">
            <div className="flex h-full flex-col items-center gap-3 rounded-lg border border-border bg-surface p-7 text-center shadow-float transition-all duration-150 group-hover:-translate-y-0.5 group-hover:border-brand/40 sm:p-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/5 text-brand">
                <modo.icon className="h-7 w-7" />
              </span>
              <p className="font-display text-lg font-semibold text-ink">
                {modo.titulo}
              </p>
              <p className="text-sm text-ink-secondary">{modo.descripcion}</p>
            </div>
          </Link>
        ))}
      </div>

      {profile.rol === "admin" && (
        <div className="mt-6">
          <Badge tone="accent">Administrador</Badge>
        </div>
      )}

      <form action={signOutAction} className="mt-8">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cambiar de perfil
        </button>
      </form>
    </div>
  );
}
