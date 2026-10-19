"use client";

import { useActionState, useEffect, useState } from "react";
import { Pause, Play, Square, TimerIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label, Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDuracion } from "@/lib/utils";
import {
  iniciarCronometroAction,
  pausarCronometroAction,
  reanudarCronometroAction,
  finalizarCronometroAction,
  actualizarDescripcionAction,
  type StartTimerState,
  type TimerActionState,
} from "./actions";

interface ProyectoOpcion {
  id: string;
  nombre: string;
  color: string;
}

export interface ActiveEntryView {
  id: string;
  descripcion: string;
  duracionSegundos: number;
  runningSince: string | null;
  proyecto: { id: string; nombre: string; color: string };
}

const startInitialState: StartTimerState = { ok: false };
const actionInitialState: TimerActionState = { ok: false };

/**
 * Segundos acumulados "en vivo": duracion_segundos + lo transcurrido desde
 * running_since, una marca de tiempo real que viene del servidor (nunca un
 * contador inventado por el navegador). "now" solo se actualiza dentro del
 * propio intervalo (nunca leyendo Date.now() durante el renderizado), así
 * que el primer segundo tras montar o reanudar se muestra la base sin más.
 */
function useElapsedSeconds(baseDuracion: number, runningSince: string | null) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!runningSince) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [runningSince]);

  if (!runningSince || now === 0) return baseDuracion;
  const transcurrido = Math.max(
    0,
    Math.floor((now - new Date(runningSince).getTime()) / 1000)
  );
  return baseDuracion + transcurrido;
}

export function TimerCard({
  proyectos,
  activeEntry,
}: {
  proyectos: ProyectoOpcion[];
  activeEntry: ActiveEntryView | null;
}) {
  if (activeEntry) {
    return <ActiveTimer entry={activeEntry} />;
  }

  if (proyectos.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-ink-secondary">
        No hay proyectos activos para iniciar un cronómetro.
      </Card>
    );
  }

  return <StartTimerForm proyectos={proyectos} />;
}

function StartTimerForm({ proyectos }: { proyectos: ProyectoOpcion[] }) {
  const [state, formAction] = useActionState(
    iniciarCronometroAction,
    startInitialState
  );

  return (
    <Card className="p-5">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
          <div>
            <Label htmlFor="project_id">Proyecto</Label>
            <Select id="project_id" name="project_id" required defaultValue="">
              <option value="" disabled>
                Elige un proyecto
              </option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="descripcion">¿En qué estás trabajando?</Label>
            <Input
              id="descripcion"
              name="descripcion"
              required
              placeholder="Ej. Revisión de contratos del Q4"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SubmitButton size="lg" pendingText="Iniciando…">
            <Play className="h-4 w-4" />
            Iniciar cronómetro
          </SubmitButton>
          {state.error && (
            <span className="text-sm text-negative">{state.error}</span>
          )}
        </div>
      </form>
    </Card>
  );
}

function ActiveTimer({ entry }: { entry: ActiveEntryView }) {
  const segundos = useElapsedSeconds(entry.duracionSegundos, entry.runningSince);
  const enMarcha = Boolean(entry.runningSince);

  const [descState, descAction] = useActionState(
    actualizarDescripcionAction,
    actionInitialState
  );
  const [pausarState, pausarAction] = useActionState(
    pausarCronometroAction,
    actionInitialState
  );
  const [reanudarState, reanudarAction] = useActionState(
    reanudarCronometroAction,
    actionInitialState
  );
  const [finalizarState, finalizarAction] = useActionState(
    finalizarCronometroAction,
    actionInitialState
  );

  const errorAccion = pausarState.error || reanudarState.error || finalizarState.error;

  return (
    <Card className="overflow-hidden border-brand/30">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${entry.proyecto.color}1a`,
                color: entry.proyecto.color,
              }}
            >
              <TimerIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {entry.proyecto.nombre} · {enMarcha ? "En marcha" : "En pausa"}
              </p>
              <p className="font-display text-3xl font-semibold tabular-nums text-ink">
                {formatDuracion(segundos)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {enMarcha ? (
              <form action={pausarAction}>
                <input type="hidden" name="entryId" value={entry.id} />
                <SubmitButton variant="secondary" pendingText="Pausando…">
                  <Pause className="h-4 w-4" />
                  Pausar
                </SubmitButton>
              </form>
            ) : (
              <form action={reanudarAction}>
                <input type="hidden" name="entryId" value={entry.id} />
                <SubmitButton variant="secondary" pendingText="Reanudando…">
                  <Play className="h-4 w-4" />
                  Reanudar
                </SubmitButton>
              </form>
            )}
            <form action={finalizarAction}>
              <input type="hidden" name="entryId" value={entry.id} />
              <SubmitButton variant="accent" pendingText="Finalizando…">
                <Square className="h-4 w-4" />
                Finalizar
              </SubmitButton>
            </form>
          </div>
        </div>
        {errorAccion && <p className="text-sm text-negative">{errorAccion}</p>}
      </div>

      <div className="border-t border-border bg-surface-sunken/50 p-5">
        <form
          action={descAction}
          className="flex flex-col gap-3 sm:flex-row sm:items-start"
        >
          <input type="hidden" name="entryId" value={entry.id} />
          <Textarea
            name="descripcion"
            defaultValue={entry.descripcion}
            required
            className="sm:flex-1"
            rows={2}
          />
          <div className="flex items-center gap-3">
            <SubmitButton variant="secondary" pendingText="Guardando…">
              Guardar descripción
            </SubmitButton>
            {descState.ok && (
              <span className="text-sm text-positive">Guardado.</span>
            )}
            {descState.error && (
              <span className="text-sm text-negative">{descState.error}</span>
            )}
          </div>
        </form>
      </div>
    </Card>
  );
}
