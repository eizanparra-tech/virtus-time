import {
  TimerIcon,
  ListChecks,
  FolderKanban,
  BarChart3,
  FileBarChart,
  CalendarDays,
} from "lucide-react";
import { requireProfile } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

const ROADMAP = [
  {
    icon: TimerIcon,
    fase: "Fase 2",
    titulo: "Cronómetro y registro manual",
    detalle: "Iniciar, pausar y finalizar el tiempo, con descripción libre de la actividad.",
  },
  {
    icon: FolderKanban,
    fase: "Fase 3",
    titulo: "Proyectos, tareas y socios",
    detalle: "Crear y gestionar proyectos, tareas e invitaciones desde la propia web.",
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

  return (
    <div>
      <PageHeader
        title={`Hola, ${profile?.nombre ?? ""}`}
        description="Bienvenido/a a VIRTUS TIME. La cuenta, la base de datos y el acceso ya están funcionando: esto es la Fase 1 completa."
      />

      <Card className="mb-8 flex flex-col gap-4 border-dashed p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-positive-soft text-positive">
            <ListChecks className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">Fase 1 funcionando</p>
            <p className="text-sm text-ink-secondary">
              Inicio de sesión, base de datos y navegación listos para los 16 socios.
            </p>
          </div>
        </div>
        {profile?.rol === "admin" && (
          <span className="shrink-0 rounded-sm bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            Sesión de administrador
          </span>
        )}
      </Card>

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
