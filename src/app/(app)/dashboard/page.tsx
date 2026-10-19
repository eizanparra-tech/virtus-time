import Link from "next/link";
import {
  TimerIcon,
  ListChecks,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  FileBarChart,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { todayMadrid, semanaDe } from "@/lib/dates";
import { formatDuracionCorta } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

const ACCESOS_RAPIDOS = [
  {
    href: "/cronometro",
    icon: TimerIcon,
    titulo: "Cronómetro",
    detalle: "Inicia o continúa tu registro de hoy.",
  },
  {
    href: "/registros",
    icon: ListChecks,
    titulo: "Mis registros",
    detalle: "Revisa o corrige tus horas.",
  },
  {
    href: "/proyectos",
    icon: FolderKanban,
    titulo: "Proyectos",
    detalle: "Consulta y gestiona los proyectos.",
  },
  {
    href: "/tareas",
    icon: CheckSquare,
    titulo: "Tareas",
    detalle: "Qué hay pendiente en cada proyecto.",
  },
  {
    href: "/equipo",
    icon: Users,
    titulo: "Equipo",
    detalle: "Los socios de VIRTUS COMPANY.",
  },
  {
    href: "/estadisticas",
    icon: BarChart3,
    titulo: "Estadísticas",
    detalle: "Horas por proyecto, por socio y su evolución.",
  },
  {
    href: "/informes",
    icon: FileBarChart,
    titulo: "Informes semanales",
    detalle: "El análisis automático de cada semana, con conclusiones de IA.",
  },
  {
    href: "/calendario",
    icon: CalendarDays,
    titulo: "Calendario",
    detalle: "El tiempo registrado día a día, con exportación a CSV y Excel.",
  },
];


export default async function DashboardPage() {
  const profile = await requireProfile();
  const db = createDbClient();

  const hoy = todayMadrid();
  const { inicio, fin } = semanaDe(hoy);

  const [{ data: entradasSemana }, { data: activo }] = await Promise.all([
    db
      .from("time_entries")
      .select("duracion_segundos")
      .eq("user_id", profile.id)
      .not("hora_fin", "is", null)
      .gte("fecha", inicio)
      .lte("fecha", fin),
    db
      .from("time_entries")
      .select("id")
      .eq("user_id", profile.id)
      .is("hora_fin", null)
      .maybeSingle(),
  ]);

  const segundosSemana = (entradasSemana ?? []).reduce(
    (acc, e) => acc + e.duracion_segundos,
    0
  );

  return (
    <div>
      <PageHeader
        title={`Hola, ${profile?.nombre ?? ""}`}
        description="Cronómetro, proyectos, tareas, equipo, estadísticas, informes semanales y calendario ya funcionan de verdad: esto es la Fase 7, la última del plan inicial."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-[1.2fr_1fr]">
        <Link href="/estadisticas">
          <Card className="flex h-full flex-col justify-center gap-1 p-6 transition-colors hover:border-brand/40">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Esta semana
            </p>
            <p className="font-display text-3xl font-semibold tabular-nums text-ink">
              {formatDuracionCorta(segundosSemana)}
            </p>
            <p className="text-sm text-ink-secondary">
              {activo
                ? "Tienes un cronómetro activo en este momento."
                : "Sin cronómetro activo ahora mismo."}
            </p>
          </Card>
        </Link>
        <Card className="flex flex-col justify-center gap-2 p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            Fases 1 a 7 funcionando
          </div>
          <p className="text-sm text-ink-secondary">
            Cronómetro, proyectos, tareas, equipo, estadísticas, informes
            semanales y calendario reales, listos para los 16 socios.
          </p>
          {profile?.rol === "admin" && (
            <span className="mt-1 inline-flex w-fit shrink-0 rounded-sm bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              Sesión de administrador
            </span>
          )}
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Accesos rápidos
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {ACCESOS_RAPIDOS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="group flex h-full items-start gap-3 p-5 transition-colors hover:border-brand/40">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand/5 text-brand">
                <item.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-semibold text-ink">
                  {item.titulo}
                </p>
                <p className="mt-1 text-sm text-ink-secondary">
                  {item.detalle}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" />
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Qué sigue
      </h2>
      <Link href="/equipo">
        <Card className="flex items-center gap-3 p-5 transition-colors hover:border-brand/40">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand/5 text-brand">
            <Users className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-ink">
              Pruébalo con el equipo
            </p>
            <p className="mt-1 text-sm text-ink-secondary">
              Añade a los 16 socios desde Equipo y que cada uno use el
              cronómetro un día cualquiera: es la mejor prueba real.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted" />
        </Card>
      </Link>
    </div>
  );
}
