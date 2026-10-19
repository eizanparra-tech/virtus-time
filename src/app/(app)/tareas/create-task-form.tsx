"use client";

import { useActionState } from "react";
import { Label, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { crearTareaAction, type TareaActionState } from "./actions";

interface ProyectoOpcion {
  id: string;
  nombre: string;
}

interface SocioOpcion {
  id: string;
  nombre: string;
  apellidos: string;
}

const initialState: TareaActionState = { ok: false };

export function CreateTaskForm({
  proyectos,
  socios,
  proyectoPorDefecto,
}: {
  proyectos: ProyectoOpcion[];
  socios: SocioOpcion[];
  proyectoPorDefecto?: string;
}) {
  const [state, formAction] = useActionState(crearTareaAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div
        key={state.ok ? state.resetKey : "initial"}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div>
          <Label htmlFor="project_id">Proyecto</Label>
          <Select
            id="project_id"
            name="project_id"
            required
            defaultValue={proyectoPorDefecto ?? ""}
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
          <Label htmlFor="titulo">Título</Label>
          <Input
            id="titulo"
            name="titulo"
            required
            placeholder="Ej. Preparar la presentación"
          />
        </div>
        <div>
          <Label htmlFor="responsable_id">Responsable (opcional)</Label>
          <Select id="responsable_id" name="responsable_id" defaultValue="">
            <option value="">Sin responsable</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} {s.apellidos}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="fecha_limite">Fecha límite (opcional)</Label>
          <Input id="fecha_limite" name="fecha_limite" type="date" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Creando…">Crear tarea</SubmitButton>
        {state.ok && (
          <span className="text-sm text-positive">Tarea creada.</span>
        )}
        {state.error && (
          <span className="text-sm text-negative">{state.error}</span>
        )}
      </div>
    </form>
  );
}
