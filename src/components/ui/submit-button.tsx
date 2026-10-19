"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

/**
 * Botón de envío que muestra automáticamente un estado "pendiente" mientras
 * su formulario (Server Action) está en marcha, usando useFormStatus. Así
 * cada botón de acción (pausar, reanudar, finalizar...) no necesita manejar
 * su propio estado de carga a mano.
 */
export function SubmitButton({
  children,
  pendingText,
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? pendingText ?? "Guardando…" : children}
    </Button>
  );
}
