import { ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDuracionCorta } from "@/lib/utils";
import type { VistaCalendario } from "./href";

export interface EntradaDia {
  id: string;
  descripcion: string;
  duracionSegundos: number;
  proyecto: { nombre: string; color: string };
}

export interface GrupoSocio {
  socioId: string;
  nombre: string;
  entradas: EntradaDia[];
}

function ListaEntradas({ entradas }: { entradas: EntradaDia[] }) {
  return (
    <Card className="divide-y divide-border">
      {entradas.map((e) => (
        <div key={e.id} className="flex items-start gap-3 p-4">
          <span
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: e.proyecto.color }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {e.proyecto.nombre}
            </p>
            <p className="mt-0.5 text-sm text-ink">{e.descripcion}</p>
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums text-ink">
            {formatDuracionCorta(e.duracionSegundos)}
          </span>
        </div>
      ))}
    </Card>
  );
}

export function DayView({
  vista,
  entradas,
  grupos,
}: {
  vista: VistaCalendario;
  entradas: EntradaDia[];
  grupos: GrupoSocio[];
}) {
  const sinActividad =
    vista === "mio" ? entradas.length === 0 : grupos.length === 0;

  if (sinActividad) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <ListChecks className="h-8 w-8 text-ink-muted" />
        <p className="text-sm text-ink-secondary">
          {vista === "mio"
            ? "No registraste nada este día."
            : "Nadie registró nada este día."}
        </p>
      </Card>
    );
  }

  if (vista === "mio") {
    return <ListaEntradas entradas={entradas} />;
  }

  return (
    <div className="space-y-4">
      {grupos.map((grupo) => {
        const total = grupo.entradas.reduce(
          (acc, e) => acc + e.duracionSegundos,
          0
        );
        return (
          <div key={grupo.socioId}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-ink-secondary">
                {grupo.nombre}
              </h2>
              <span className="text-sm font-medium text-ink-muted">
                {formatDuracionCorta(total)}
              </span>
            </div>
            <ListaEntradas entradas={grupo.entradas} />
          </div>
        );
      })}
    </div>
  );
}
