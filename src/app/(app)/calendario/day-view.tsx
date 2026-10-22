import Link from "next/link";
import { ListChecks, CheckSquare, Flag, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuracionCorta } from "@/lib/utils";
import { RegistroRow, type RegistroView } from "../registros/registro-row";
import type { VistaCalendario } from "./href";
import type { TaskStatus } from "@/types/database.types";

export interface GrupoSocio {
  socioId: string;
  nombre: string;
  entradas: RegistroView[];
}

export interface TareaDiaView {
  id: string;
  titulo: string;
  estado: TaskStatus;
  proyecto: { nombre: string; color: string };
}

export interface FechaClaveDiaView {
  id: string;
  titulo: string;
  descripcion: string | null;
  proyecto: { nombre: string; color: string } | null;
}

const ESTADO_LABEL: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completada: "Completada",
};

function ListaEntradas({ entradas }: { entradas: RegistroView[] }) {
  return (
    <Card className="divide-y divide-border">
      {entradas.map((e) => (
        <RegistroRow key={e.id} registro={e} />
      ))}
    </Card>
  );
}

function SeccionFechasClave({
  fecha,
  fechasClave,
}: {
  fecha: string;
  fechasClave: FechaClaveDiaView[];
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink-secondary">
          <Flag className="h-3.5 w-3.5 text-accent" />
          Fechas clave
        </h2>
        <Link
          href={`/fechas-clave?fecha=${fecha}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          <Plus className="h-3 w-3" />
          Añadir
        </Link>
      </div>
      {fechasClave.length === 0 ? (
        <p className="text-sm text-ink-muted">Ninguna este día.</p>
      ) : (
        <ul className="space-y-2.5">
          {fechasClave.map((f) => (
            <li key={f.id} className="text-sm text-ink">
              <span className="font-medium">{f.titulo}</span>
              {f.proyecto && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-ink-secondary">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: f.proyecto.color }}
                  />
                  {f.proyecto.nombre}
                </span>
              )}
              {f.descripcion && (
                <p className="mt-0.5 text-xs text-ink-secondary">
                  {f.descripcion}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SeccionTareas({ tareas }: { tareas: TareaDiaView[] }) {
  if (tareas.length === 0) return null;

  return (
    <Card className="p-4">
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-secondary">
        <CheckSquare className="h-3.5 w-3.5 text-warning" />
        Tareas que vencen
      </h2>
      <ul className="space-y-2">
        {tareas.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="flex items-center gap-2 text-ink">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: t.proyecto.color }}
              />
              {t.titulo}
            </span>
            <Badge tone={t.estado === "completada" ? "positive" : "neutral"}>
              {ESTADO_LABEL[t.estado]}
            </Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function DayView({
  vista,
  entradas,
  grupos,
  tareas,
  fechasClave,
  fecha,
}: {
  vista: VistaCalendario;
  entradas: RegistroView[];
  grupos: GrupoSocio[];
  tareas: TareaDiaView[];
  fechasClave: FechaClaveDiaView[];
  fecha: string;
}) {
  const sinActividad =
    vista === "mio" ? entradas.length === 0 : grupos.length === 0;

  return (
    <div className="space-y-4">
      <SeccionFechasClave fecha={fecha} fechasClave={fechasClave} />
      <SeccionTareas tareas={tareas} />

      {sinActividad ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <ListChecks className="h-8 w-8 text-ink-muted" />
          <p className="text-sm text-ink-secondary">
            {vista === "mio"
              ? "No registraste nada este día."
              : "Nadie registró nada este día."}
          </p>
        </Card>
      ) : vista === "mio" ? (
        <ListaEntradas entradas={entradas} />
      ) : (
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
      )}
    </div>
  );
}
