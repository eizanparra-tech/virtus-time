"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  cambiarActivoSocioAction,
  cambiarRolSocioAction,
  type SocioActionState,
} from "./actions";

const initialState: SocioActionState = { ok: false };

export function SocioControls({
  socio,
}: {
  socio: { id: string; rol: string; activo: boolean };
}) {
  const [activoState, activoAction] = useActionState(
    cambiarActivoSocioAction,
    initialState
  );
  const [rolState, rolAction] = useActionState(
    cambiarRolSocioAction,
    initialState
  );
  const error = activoState.error || rolState.error;

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex items-center justify-between gap-2">
        <form action={rolAction}>
          <input type="hidden" name="profileId" value={socio.id} />
          <Select
            name="rol"
            defaultValue={socio.rol}
            className="h-8 w-32 text-xs"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            <option value="socio">Socio</option>
            <option value="admin">Admin</option>
          </Select>
        </form>

        <form action={activoAction}>
          <input type="hidden" name="profileId" value={socio.id} />
          <input
            type="hidden"
            name="activo"
            value={(!socio.activo).toString()}
          />
          <SubmitButton
            variant={socio.activo ? "secondary" : "primary"}
            size="sm"
            pendingText="…"
          >
            {socio.activo ? "Desactivar" : "Activar"}
          </SubmitButton>
        </form>
      </div>
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
