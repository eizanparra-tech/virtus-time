"use client";

import { useActionState } from "react";
import { Flag } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { cn, formatFecha } from "@/lib/utils";
import { borrarFechaClaveAction, type FechaClaveActionState } from "./actions";

export interface FechaClaveView {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  proyecto: { nombre: string; color: string } | null;
}

const initialState: FechaClaveActionState = { ok: false };

export function KeyDateRow({
  fechaClave,
  esHoy,
  esPasada,
  puedeBorrar,
}: {
  fechaClave: FechaClaveView;
  esHoy: boolean;
  esPasada: boolean;
  puedeBorrar: boolean;
}) {
  const [state, deleteAction] = useActionState(
    borrarFechaClaveAction,
    initialState
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between",
        esPasada && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            esHoy ? "bg-brand text-ink-on-brand" : "bg-brand/5 text-brand"
          )}
        >
          <Flag className="h-3.5 w-3.5" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-ink">
              {fechaClave.titulo}
            </p>
            {esHoy && <Badge tone="accent">Hoy</Badge>}
            {esPasada && <Badge tone="neutral">Pasada</Badge>}
          </div>
          <p className="mt-0.5 text-xs capitalize text-ink-muted">
            {formatFecha(fechaClave.fecha)}
          </p>
          {fechaClave.descripcion && (
            <p className="mt-1 text-sm text-ink-secondary">
              {fechaClave.descripcion}
            </p>
          )}
          {fechaClave.proyecto && (
            <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-ink-secondary">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: fechaClave.proyecto.color }}
              />
              {fechaClave.proyecto.nombre}
            </span>
          )}
        </div>
      </div>

      {puedeBorrar && (
        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (
              !window.confirm("¿Borrar esta fecha clave? No se puede deshacer.")
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={fechaClave.id} />
          <SubmitButton variant="ghost" size="sm" pendingText="…">
            Borrar
          </SubmitButton>
        </form>
      )}
      {state.error && <p className="text-xs text-negative">{state.error}</p>}
    </div>
  );
}
