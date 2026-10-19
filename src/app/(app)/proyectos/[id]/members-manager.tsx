"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { iniciales } from "@/lib/utils";
import {
  anadirMiembroAction,
  quitarMiembroAction,
  type ProjectDetailActionState,
} from "./actions";

export interface SocioOpcion {
  id: string;
  nombre: string;
  apellidos: string;
  rol: string;
  activo: boolean;
}

const initialState: ProjectDetailActionState = { ok: false };

export function MembersManager({
  projectId,
  miembros,
  disponibles,
}: {
  projectId: string;
  miembros: SocioOpcion[];
  disponibles: SocioOpcion[];
}) {
  const [addState, addAction] = useActionState(
    anadirMiembroAction,
    initialState
  );
  const [removeState, removeAction] = useActionState(
    quitarMiembroAction,
    initialState
  );
  const error = addState.error || removeState.error;

  return (
    <div className="space-y-4">
      {miembros.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Todavía no hay socios asignados.
        </p>
      ) : (
        <ul className="space-y-2">
          {miembros.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-ink-on-brand">
                {iniciales(m.nombre, m.apellidos)}
              </span>
              <span className="flex-1 truncate text-sm text-ink">
                {m.nombre} {m.apellidos}
              </span>
              {m.rol === "admin" && <Badge tone="accent">Admin</Badge>}
              {!m.activo && <Badge tone="negative">Inactivo</Badge>}
              <form action={removeAction}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="userId" value={m.id} />
                <SubmitButton variant="ghost" size="sm" pendingText="…">
                  Quitar
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}

      {disponibles.length > 0 && (
        <form
          action={addAction}
          className="flex items-center gap-2 border-t border-border pt-3"
        >
          <input type="hidden" name="projectId" value={projectId} />
          <Select name="userId" defaultValue="" className="flex-1">
            <option value="" disabled>
              Elige un socio para añadir
            </option>
            {disponibles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} {s.apellidos}
              </option>
            ))}
          </Select>
          <SubmitButton variant="secondary" pendingText="Añadiendo…">
            Añadir
          </SubmitButton>
        </form>
      )}

      {error && <p className="text-sm text-negative">{error}</p>}
    </div>
  );
}
