"use client";

import { useActionState } from "react";
import { Label, Input, Textarea, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { PROJECT_COLORS } from "@/lib/project-colors";
import {
  actualizarProyectoAction,
  type ProjectDetailActionState,
} from "./actions";
import type { Project } from "@/types/database.types";

const initialState: ProjectDetailActionState = { ok: false };

const ESTADOS: { value: Project["estado"]; label: string }[] = [
  { value: "activo", label: "Activo" },
  { value: "pausado", label: "Pausado" },
  { value: "finalizado", label: "Finalizado" },
  { value: "archivado", label: "Archivado" },
];

export function ProjectEditForm({ project }: { project: Project }) {
  const [state, formAction] = useActionState(
    actualizarProyectoAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={project.id} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={project.nombre}
            required
          />
        </div>
        <div>
          <Label htmlFor="estado">Estado</Label>
          <Select id="estado" name="estado" defaultValue={project.estado}>
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="facturable"
          name="facturable"
          type="checkbox"
          defaultChecked={project.facturable}
          className="h-4 w-4 rounded border-border text-brand focus-visible:ring-2 focus-visible:ring-info"
        />
        <Label htmlFor="facturable" className="mb-0">
          Facturable
        </Label>
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          defaultValue={project.descripcion ?? ""}
          rows={2}
        />
      </div>

      <div>
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((color) => (
            <label key={color} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={color}
                defaultChecked={color === project.color}
                className="peer sr-only"
              />
              <span
                className="block h-8 w-8 rounded-full border-2 border-surface ring-offset-2 ring-offset-surface transition-shadow peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-info"
                style={{ backgroundColor: color }}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Guardando…">Guardar cambios</SubmitButton>
        {state.ok && (
          <span className="text-sm text-positive">Guardado.</span>
        )}
        {state.error && (
          <span className="text-sm text-negative">{state.error}</span>
        )}
      </div>
    </form>
  );
}
