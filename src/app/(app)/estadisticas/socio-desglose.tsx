"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { BarrasHoras, type BarraItem } from "./charts";
import { formatDuracionCorta } from "@/lib/utils";

/**
 * "Horas por socio", pero al pinchar en una barra se despliega debajo el
 * desglose de ESE socio: en qué proyectos ha repartido su tiempo durante el
 * mismo periodo que se esté viendo arriba (esta semana, este mes...).
 */
export function HorasPorSocio({
  data,
  desglose,
}: {
  data: BarraItem[];
  desglose: Record<string, BarraItem[]>;
}) {
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const socio = seleccionado ? data.find((d) => d.id === seleccionado) : null;
  const detalle = seleccionado ? desglose[seleccionado] ?? [] : [];

  function alPinchar(id: string) {
    setSeleccionado((actual) => (actual === id ? null : id));
  }

  return (
    <div className="space-y-3">
      <BarrasHoras data={data} onBarClick={alPinchar} seleccionado={seleccionado} />

      {socio && (
        <div className="rounded-sm border border-border bg-surface-sunken/50 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
              En qué ha empleado el tiempo {socio.label}
            </p>
            <p className="text-sm tabular-nums text-ink-secondary">
              {formatDuracionCorta(socio.segundos)}
            </p>
          </div>
          {detalle.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Sin proyectos registrados en este periodo.
            </p>
          ) : (
            <BarrasHoras data={detalle} />
          )}
        </div>
      )}
    </div>
  );
}
