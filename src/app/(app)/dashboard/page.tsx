import Link from "next/link";
import {
  TimerIcon,
  ListChecks,
  FolderKanban,
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
    detalle: "Consulta los proyectos disponibles.",
  },
];

const ROADMAP = [
  {
    icon: FolderKanban,
    fase: "Fase 3",
    titulo: "Proyectos, tareas y socios",
    detalle:
      "Asignar socios a cada proyecto, gestionar tareas e invitaciones desde la propia web.",
  },
  {
    icon: BarChart3,
    fase: "Fase 4",
    titulo: "Dashboards y estadísticas",
    detalle: "Horas por proyecto, por socio, evolución semanal y comparativas.",
  },
  {
    icon: FileBarChart,
    fase: "Fase 5",
    titulo: "Informes automáticos",
    detalle: "Cada lunes, análisis de la semana con conclusiones basadas en datos reales.",
  },
  {
    icon: CalendarDays,
    fase: "Fase 6",
    titulo: "Histórico, calendario y exportaciones",
    detalle: "Calendario interactivo, comparar semanas y exportar a PDF, CSV o Excel.",
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
        description="El cronómetro, el registro manual y tus registros ya funcionan de verdad: esto es la Fase 2 completa."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-[1.2fr_1fr]">
        <Card className="flex flex-col justify-center gap-1 p-6">
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
        <Card className="flex flex-col justify-center gap-2 p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            Fase 1 y 2 funcionando
          </div>
          <p className="text-sm text-ink-secondary">
            Inicio de sesión, base de datos, cronómetro y registro manual
            listos para los 16 socios.
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
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        Próximos pasos
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROADMAP.map((item) => (
          <Card key={item.titulo} className="p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/5 text-brand">
              <item.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-accent">
              {item.fase}
            </p>
            <p className="mt-1 font-display text-base font-semibold text-ink">
              {item.titulo}
            </p>
            <p className="mt-1.5 text-sm text-ink-secondary">{item.detalle}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
