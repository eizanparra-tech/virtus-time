"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Label, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { bootstrapAdminAction, type BootstrapState } from "./actions";

const initialState: BootstrapState = { ok: false };

export function SetupForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    bootstrapAdminAction,
    initialState
  );

  // Una vez la cuenta de administrador existe en el servidor, iniciamos
  // sesión desde el navegador para que se guarde la cookie de sesión.
  useEffect(() => {
    if (!state.ok) return;

    const form = document.getElementById("setup-form") as HTMLFormElement | null;
    const email = (form?.elements.namedItem("email") as HTMLInputElement)?.value;
    const password = (form?.elements.namedItem("password") as HTMLInputElement)
      ?.value;
    if (!email || !password) return;

    (async () => {
      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email, password });
      router.push("/dashboard");
      router.refresh();
    })();
  }, [state.ok, router]);

  return (
    <form id="setup-form" action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" autoComplete="given-name" required />
        </div>
        <div>
          <Label htmlFor="apellidos">Apellidos</Label>
          <Input id="apellidos" name="apellidos" autoComplete="family-name" />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div>
          <Label htmlFor="passwordConfirm">Repite la contraseña</Label>
          <Input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-negative">{state.error}</p>}
      {state.ok && (
        <p className="text-sm text-positive">
          Cuenta creada. Entrando en VIRTUS TIME…
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending || state.ok}>
        {pending ? "Creando cuenta…" : "Crear cuenta de administrador"}
      </Button>
    </form>
  );
}
