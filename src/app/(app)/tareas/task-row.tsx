"use client";

import { useActionState } from "react";
import { Select, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  actualizarTareaAction,
  borrarTareaAction,
  type TareaActionState,
} from "./actions";
import type { TaskStatus } from "@/types/database.types";

export interface TareaView {
  id: string;
  titulo: string;
  estado: TaskStatus;
  responsableId: string | null;
  fechaLimite: string | null;
  createdBy: string | null;
}

interface SocioOpcion {
  id: string;
  nombre: string;
  apellidos: string;
}

const initialState: TareaActionState = { ok: false };

export function TaskRow({
  tarea,
  socios,
  puedeBorrar,
}: {
  tarea: TareaView;
  socios: SocioOpcion[];
  puedeBorrar: boolean;
}) {
  const [updateState, updateAction] = useActionState(
    actualizarTareaAction,
    initialState
  );
  const [deleteState, deleteAction] = useActionState(
    borrarTareaAction,
    initialState
  );
  const error = updateState.error || deleteState.error;

  return (
    <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-3">
      <form
        action={updateAction}
        className="flex flex-1 flex-wrap items-center gap-2"
      >
        <input type="hidden" name="taskId" value={tarea.id} />
        <p className="min-w-[10rem] flex-1 text-sm text-ink">
          {tarea.titulo}
        </p>

        <Select
          name="estado"
          defaultValue={tarea.estado}
          className="h-8 w-36 text-xs"
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        >
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En proceso</option>
          <option value="completada">Completada</option>
        </Select>

        <Select
          name="responsable_id"
          defaultValue={tarea.responsableId ?? ""}
          className="h-8 w-40 text-xs"
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        >
          <option value="">Sin responsable</option>
          {socios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} {s.apellidos}
            </option>
          ))}
        </Select>

        <Input
          type="date"
          name="fecha_limite"
          defaultValue={tarea.fechaLimite ?? ""}
          className="h-8 w-36 text-xs"
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
      </form>

      {puedeBorrar && (
        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (!window.confirm("¿Borrar esta tarea? No se puede deshacer.")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="taskId" value={tarea.id} />
          <SubmitButton variant="ghost" size="sm" pendingText="…">
            Borrar
          </SubmitButton>
        </form>
      )}
      {error && <p className="w-full text-xs text-negative">{error}</p>}
    </div>
  );
}
