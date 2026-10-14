"use client";

import { useActionState } from "react";
import { Label, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfileAction, type UpdateProfileState } from "./actions";
import type { Profile } from "@/types/database.types";

const initialState: UpdateProfileState = { ok: false };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={profile.nombre}
            required
          />
        </div>
        <div>
          <Label htmlFor="apellidos">Apellidos</Label>
          <Input
            id="apellidos"
            name="apellidos"
            defaultValue={profile.apellidos}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" value={profile.email} disabled />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
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
