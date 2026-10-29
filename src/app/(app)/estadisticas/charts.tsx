"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type BarRectangleItem,
} from "recharts";
import { formatDuracionCorta } from "@/lib/utils";

const EJE_ESTILO = {
  fontSize: 12,
  fill: "var(--color-ink-muted)",
  fontFamily: "var(--font-sans)",
};

function horasTick(segundos: number) {
  const horas = segundos / 3600;
  return horas % 1 === 0 ? `${horas}h` : `${horas.toFixed(1)}h`;
}

function TooltipHoras({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number; payload?: { label?: string } }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const segundos = payload[0]?.value ?? 0;
  const etiqueta = payload[0]?.payload?.label ?? label;
  return (
    <div className="rounded-sm border border-border bg-surface px-3 py-2 text-xs shadow-float-sm">
      <p className="font-medium text-ink">{etiqueta}</p>
      <p className="text-ink-secondary">{formatDuracionCorta(segundos)}</p>
    </div>
  );
}

export interface BarraItem {
  id: string;
  label: string;
  segundos: number;
  color: string;
}

/** Barras horizontales: horas por proyecto, o por socio. */
export function BarrasHoras({
  data,
  onBarClick,
  seleccionado,
}: {
  data: BarraItem[];
  /** Si se indica, cada barra se puede pinchar y pasa a mostrar su id aquí. */
  onBarClick?: (id: string) => void;
  /** Id de la barra actualmente seleccionada (atenúa las demás). */
  seleccionado?: string | null;
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        Sin horas registradas en este periodo.
      </p>
    );
  }

  const altura = Math.max(120, data.length * 44);

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
      >
        <CartesianGrid
          horizontal={false}
          stroke="var(--color-border)"
        />
        <XAxis
          type="number"
          tickFormatter={horasTick}
          tick={EJE_ESTILO}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={EJE_ESTILO}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<TooltipHoras />} cursor={{ fill: "var(--color-surface-sunken)" }} />
        <Bar
          dataKey="segundos"
          radius={[0, 4, 4, 0]}
          maxBarSize={22}
          onClick={
            onBarClick
              ? (item: BarRectangleItem) => {
                  const id = (item.payload as BarraItem | undefined)?.id;
                  if (id) onBarClick(id);
                }
              : undefined
          }
          style={onBarClick ? { cursor: "pointer" } : undefined}
        >
          {data.map((item) => (
            <Cell
              key={item.id}
              fill={item.color}
              fillOpacity={
                !seleccionado || seleccionado === item.id ? 1 : 0.35
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface PuntoSerie {
  label: string;
  segundos: number;
}

/** Línea de evolución en el tiempo (días o semanas). */
export function EvolucionHoras({ data }: { data: PuntoSerie[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          tick={EJE_ESTILO}
          axisLine={false}
          tickLine={false}
          interval={data.length > 14 ? Math.ceil(data.length / 10) : 0}
        />
        <YAxis
          tickFormatter={horasTick}
          tick={EJE_ESTILO}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<TooltipHoras />} />
        <Line
          type="monotone"
          dataKey="segundos"
          stroke="var(--color-brand)"
          strokeWidth={2}
          dot={data.length <= 14}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
