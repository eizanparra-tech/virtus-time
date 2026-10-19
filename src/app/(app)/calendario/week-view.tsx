import Link from "next/link";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatDuracionCorta, formatDiaCorto } from "@/lib/utils";
import { hrefCalendario, type VistaCalendario } from "./href";

export interface ProyectoDia {
  id: string;
  nombre: string;
  color: string;
  segundos: number;
}

export interface DiaSemana {
  fecha: string;
  esHoy: boolean;
  segundos: number;
  proyectos: ProyectoDia[];
}

export function WeekView({
  dias,
  vista,
  totalSemana,
  totalAnterior,
}: {
  dias: DiaSemana[];
  vista: VistaCalendario;
  totalSemana: number;
  totalAnterior: number;
}) {
  const cambioPct =
    totalAnterior > 0
      ? Math.round(((totalSemana - totalAnterior) / totalAnterior) * 100)
      : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {dias.map((dia) => (
          <Link key={dia.fecha} href={hrefCalendario("dia", dia.fecha, vista)}>
            <Card
              className={cn(
                "flex flex-col gap-2 p-4 transition-colors hover:border-brand/40 sm:flex-row sm:items-center sm:justify-between",
                dia.esHoy && "border-brand/50"
              )}
            >
              <div className="flex items-center gap-2 sm:w-28 sm:shrink-0">
                <span
                  className={cn(
                    "text-sm font-medium",
                    dia.esHoy ? "text-brand" : "text-ink"
                  )}
                >
                  {formatDiaCorto(dia.fecha)} {Number(dia.fecha.slice(-2))}
                </span>
              </div>

              {dia.proyectos.length === 0 ? (
                <p className="flex-1 text-sm text-ink-muted">Sin registros.</p>
              ) : (
                <div className="flex flex-1 flex-wrap gap-2">
                  {dia.proyectos.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 rounded-sm bg-surface-sunken px-2 py-1 text-xs text-ink-secondary"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.nombre} · {formatDuracionCorta(p.segundos)}
                    </span>
                  ))}
                </div>
              )}

              <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                {formatDuracionCorta(dia.segundos)}
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-2 p-4">
        <p className="text-sm text-ink-secondary">
          Esta semana:{" "}
          <span className="font-medium text-ink">
            {formatDuracionCorta(totalSemana)}
          </span>{" "}
          · Semana anterior:{" "}
          <span className="font-medium text-ink">
            {formatDuracionCorta(totalAnterior)}
          </span>
        </p>
        <div className="flex items-center gap-1.5 text-sm text-ink-secondary">
          {cambioPct === null ? (
            <>
              <Minus className="h-3.5 w-3.5 text-ink-muted" />
              Sin datos de la semana anterior para comparar.
            </>
          ) : cambioPct === 0 ? (
            <>
              <Minus className="h-3.5 w-3.5 text-ink-muted" />
              Igual que la semana anterior.
            </>
          ) : cambioPct > 0 ? (
            <>
              <TrendingUp className="h-3.5 w-3.5 text-ink-muted" />
              {cambioPct}% más que la semana anterior.
            </>
          ) : (
            <>
              <TrendingDown className="h-3.5 w-3.5 text-ink-muted" />
              {Math.abs(cambioPct)}% menos que la semana anterior.
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
