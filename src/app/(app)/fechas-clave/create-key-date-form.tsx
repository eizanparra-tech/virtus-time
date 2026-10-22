"use client";

import { useActionState } from "react";
import { Label, Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { crearFechaClaveAction, type FechaClaveActionState } from "./actions";

interface ProyectoOpcion {
  id: string;
  nombre: string;
}

const initialState: FechaClaveActionState = { ok: false };

export function CreateKeyDateForm({
  proyectos,
  fechaPorDefecto,
}: {
  proyectos: ProyectoOpcion[];
  fechaPorDefecto?: string;
}) {
  const [state, formAction] = useActionState(
    crearFechaClaveAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div
        key={state.ok ? state.resetKey : "initial"}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div>
          <Label htmlFor="titulo">Título</Label>
          <Input
            id="titulo"
            name="titulo"
            required
            placeholder="Ej. Entrega al cliente"
          />
        </div>
        <div>
          <Label htmlFor="fecha">Fecha</Label>
          <Input
            id="fecha"
            name="fecha"
            type="date"
            required
            defaultValue={fechaPorDefecto}
          />
        </div>
        <div>
          <Label htmlFor="project_id">Proyecto (opcional)</Label>
          <Select id="project_id" name="project_id" defaultValue="">
            <option value="">Sin proyecto relacionado</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="descripcion">Descripción (opcional)</Label>
          <Textarea
            id="descripcion"
            name="descripcion"
            placeholder="Algún detalle más, si hace falta."
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Creando…">Añadir fecha clave</SubmitButton>
        {state.ok && (
          <span className="text-sm text-positive">Fecha clave añadida.</span>
        )}
        {state.error && (
          <span className="text-sm text-negative">{state.error}</span>
        )}
      </div>
    </form>
  );
}
