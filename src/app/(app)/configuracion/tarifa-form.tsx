"use client";

import { useActionState } from "react";
import { Label, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actualizarTarifaAction, type UpdateTarifaState } from "./actions";

const initialState: UpdateTarifaState = { ok: false };

export function TarifaForm({ costeHoraEur }: { costeHoraEur: number }) {
  const [state, formAction, pending] = useActionState(
    actualizarTarifaAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="max-w-[180px]">
        <Label htmlFor="coste_hora_eur">Coste por hora (€)</Label>
        <Input
          id="coste_hora_eur"
          name="coste_hora_eur"
          type="number"
          step="0.01"
          min="0"
          defaultValue={costeHoraEur}
          required
        />
      </div>

      <div className="flex items-center gap-3 pb-0.5">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar tarifa"}
        </Button>
        {state.ok && <span className="text-sm text-positive">Guardado.</span>}
        {state.error && (
          <span className="text-sm text-negative">{state.error}</span>
        )}
      </div>
    </form>
  );
}
