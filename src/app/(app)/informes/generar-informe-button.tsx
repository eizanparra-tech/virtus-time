"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ButtonProps } from "@/components/ui/button";
import { type InformeActionState } from "./actions";

const initialState: InformeActionState = { ok: false };

export function GenerarInformeButton({
  action,
  label,
  pendingLabel = "Generando…",
  variant,
}: {
  action: (
    prev: InformeActionState,
    formData: FormData
  ) => Promise<InformeActionState>;
  label: string;
  pendingLabel?: string;
  variant?: ButtonProps["variant"];
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <SubmitButton variant={variant} pendingText={pendingLabel}>
        {label}
      </SubmitButton>
      {state.error && (
        <span className="text-sm text-negative">{state.error}</span>
      )}
    </form>
  );
}
