"use client";

import { useActionState } from "react";
import { PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label, Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { crearRegistroManualAction, type ManualEntryState } from "./actions";

interface ProyectoOpcion {
  id: string;
  nombre: string;
}

const initialState: ManualEntryState = { ok: false };

export function ManualEntryForm({
  proyectos,
  today,
}: {
  proyectos: ProyectoOpcion[];
  today: string;
}) {
  const [state, formAction] = useActionState(
    crearRegistroManualAction,
    initialState
  );

  if (proyectos.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <PlusCircle className="h-4 w-4 text-ink-muted" />
        <h2 className="font-display text-base font-semibold text-ink">
          Añadir horas manualmente
        </h2>
      </div>
      <form action={formAction} className="space-y-4">
        <div
          key={state.ok ? state.resetKey : "initial"}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="manual_project_id">Proyecto</Label>
              <Select
                id="manual_project_id"
                name="project_id"
                required
                defaultValue=""
              >
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
              <Label htmlFor="manual_fecha">Fecha</Label>
              <Input
                id="manual_fecha"
                name="fecha"
                type="date"
                required
                defaultValue={today}
                max={today}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="manual_descripcion">¿En qué trabajaste?</Label>
            <Textarea
              id="manual_descripcion"
              name="descripcion"
              required
              rows={2}
              placeholder="Describe la actividad realizada"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:w-64">
            <div>
              <Label htmlFor="manual_horas">Horas</Label>
              <Input
                id="manual_horas"
                name="horas"
                type="number"
                min={0}
                max={23}
                defaultValue={0}
              />
            </div>
            <div>
              <Label htmlFor="manual_minutos">Minutos</Label>
              <Input
                id="manual_minutos"
                name="minutos"
                type="number"
                min={0}
                max={59}
                step={5}
                defaultValue={0}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SubmitButton variant="secondary" pendingText="Guardando…">
            Añadir registro
          </SubmitButton>
          {state.ok && (
            <span className="text-sm text-positive">Registro guardado.</span>
          )}
          {state.error && (
            <span className="text-sm text-negative">{state.error}</span>
          )}
        </div>
      </form>
    </Card>
  );
}
