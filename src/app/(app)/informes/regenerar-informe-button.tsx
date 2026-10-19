"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { regenerarInformeAction, type InformeActionState } from "./actions";

const initialState: InformeActionState = { ok: false };

export function RegenerarInformeButton({
  semanaInicio,
}: {
  semanaInicio: string;
}) {
  const [state, formAction] = useActionState(regenerarInformeAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="semanaInicio" value={semanaInicio} />
      <SubmitButton variant="secondary" pendingText="Recalculando…">
        <RefreshCw className="h-3.5 w-3.5" />
        Volver a calcular
      </SubmitButton>
      {state.ok && (
        <span className="text-sm text-positive">Informe actualizado.</span>
      )}
      {state.error && (
        <span className="text-sm text-negative">{state.error}</span>
      )}
    </form>
  );
}
