"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  generarInformeSemanaPasadaAction,
  type InformeActionState,
} from "./actions";

const initialState: InformeActionState = { ok: false };

export function GenerarInformeButton() {
  const [state, formAction] = useActionState(
    generarInformeSemanaPasadaAction,
    initialState
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <SubmitButton pendingText="Generando…">
        Generar informe de la semana pasada
      </SubmitButton>
      {state.error && (
        <span className="text-sm text-negative">{state.error}</span>
      )}
    </form>
  );
}
