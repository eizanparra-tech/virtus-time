"use client";

import { useActionState } from "react";
import { Label, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createProjectAction, type CreateProjectState } from "./actions";
import { PROJECT_COLORS } from "@/lib/project-colors";

const initialState: CreateProjectState = { ok: false };

export function CreateProjectForm({ defaultColor }: { defaultColor: string }) {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      {/* La key cambia tras cada creación con éxito, para que los campos
          (no controlados) se vacíen solos sin necesitar JavaScript extra. */}
      <div key={state.ok ? state.resetKey : "initial"} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="nombre">Nombre del proyecto</Label>
            <Input
              id="nombre"
              name="nombre"
              required
              placeholder="Ej. Web corporativa"
            />
          </div>
          <div>
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Input
              id="descripcion"
              name="descripcion"
              placeholder="Para qué es este proyecto"
            />
          </div>
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
                  defaultChecked={color === defaultColor}
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
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear proyecto"}
        </Button>
        {state.ok && (
          <span className="text-sm text-positive">Proyecto creado.</span>
        )}
        {state.error && (
          <span className="text-sm text-negative">{state.error}</span>
        )}
      </div>
    </form>
  );
}
