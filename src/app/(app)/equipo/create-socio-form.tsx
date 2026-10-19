"use client";

import { useActionState } from "react";
import { Label, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { crearSocioAction, type SocioActionState } from "./actions";

const initialState: SocioActionState = { ok: false };

export function CreateSocioForm() {
  const [state, formAction] = useActionState(crearSocioAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div key={state.ok ? state.resetKey : "initial"} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" required placeholder="Nombre" />
          </div>
          <div>
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input id="apellidos" name="apellidos" placeholder="Apellidos" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">Correo electrónico (opcional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="No es obligatorio"
            />
          </div>
          <div>
            <Label htmlFor="rol">Rol</Label>
            <Select id="rol" name="rol" defaultValue="socio">
              <option value="socio">Socio</option>
              <option value="admin">Administrador</option>
            </Select>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Creando…">Crear socio</SubmitButton>
        {state.ok && (
          <span className="text-sm text-positive">Socio creado.</span>
        )}
        {state.error && (
          <span className="text-sm text-negative">{state.error}</span>
        )}
      </div>
    </form>
  );
}
