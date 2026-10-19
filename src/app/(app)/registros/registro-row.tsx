"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label, Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDuracionCorta } from "@/lib/utils";
import {
  actualizarRegistroAction,
  borrarRegistroAction,
  type RegistroActionState,
} from "./actions";

export interface RegistroView {
  id: string;
  descripcion: string;
  fecha: string;
  duracionSegundos: number;
  esManual: boolean;
  proyecto: { nombre: string; color: string };
}

const initialState: RegistroActionState = { ok: false };

export function RegistroRow({ registro }: { registro: RegistroView }) {
  const [editing, setEditing] = useState(false);
  const [deleteState, deleteAction] = useActionState(
    borrarRegistroAction,
    initialState
  );

  if (editing) {
    return (
      <EditRegistroForm
        registro={registro}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3 p-4">
      <span
        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: registro.proyecto.color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            {registro.proyecto.nombre}
          </p>
          {registro.esManual && <Badge tone="info">Manual</Badge>}
        </div>
        <p className="mt-0.5 text-sm text-ink">{registro.descripcion}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-medium tabular-nums text-ink">
          {formatDuracionCorta(registro.duracionSegundos)}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-ink-muted transition-colors hover:text-ink"
          aria-label="Editar registro"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (
              !window.confirm("¿Borrar este registro? No se puede deshacer.")
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="entryId" value={registro.id} />
          <button
            type="submit"
            className="text-ink-muted transition-colors hover:text-negative"
            aria-label="Borrar registro"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      </div>
      {deleteState.error && (
        <p className="w-full text-sm text-negative">{deleteState.error}</p>
      )}
    </div>
  );
}

function EditRegistroForm({
  registro,
  onCancel,
}: {
  registro: RegistroView;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState(
    actualizarRegistroAction,
    initialState
  );
  const horasIniciales = Math.floor(registro.duracionSegundos / 3600);
  const minutosIniciales = Math.round((registro.duracionSegundos % 3600) / 60);

  return (
    <form action={formAction} className="space-y-3 bg-surface-sunken/60 p-4">
      <input type="hidden" name="entryId" value={registro.id} />
      <div>
        <Label htmlFor={`descripcion-${registro.id}`}>Descripción</Label>
        <Textarea
          id={`descripcion-${registro.id}`}
          name="descripcion"
          defaultValue={registro.descripcion}
          required
          rows={2}
        />
      </div>
      <div className="grid grid-cols-3 gap-3 sm:w-80">
        <div>
          <Label htmlFor={`fecha-${registro.id}`}>Fecha</Label>
          <Input
            id={`fecha-${registro.id}`}
            name="fecha"
            type="date"
            defaultValue={registro.fecha}
            required
          />
        </div>
        <div>
          <Label htmlFor={`horas-${registro.id}`}>Horas</Label>
          <Input
            id={`horas-${registro.id}`}
            name="horas"
            type="number"
            min={0}
            max={23}
            defaultValue={horasIniciales}
          />
        </div>
        <div>
          <Label htmlFor={`minutos-${registro.id}`}>Minutos</Label>
          <Input
            id={`minutos-${registro.id}`}
            name="minutos"
            type="number"
            min={0}
            max={59}
            defaultValue={minutosIniciales}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton size="sm" pendingText="Guardando…">
          Guardar
        </SubmitButton>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
          Cancelar
        </button>
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
