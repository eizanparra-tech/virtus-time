import Link from "next/link";
import { cn, formatDuracionCorta } from "@/lib/utils";
import { hrefCalendario, type VistaCalendario } from "./href";

export interface DiaCelda {
  fecha: string;
  enMes: boolean;
  esHoy: boolean;
  segundos: number;
  proyectos: { id: string; color: string; segundos: number }[];
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function MonthGrid({
  dias,
  vista,
}: {
  dias: DiaCelda[];
  vista: VistaCalendario;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-t-md border border-b-0 border-border bg-border text-center text-xs font-medium uppercase tracking-wide text-ink-muted">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="bg-surface py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-md border border-border bg-border">
        {dias.map((dia) => (
          <Link
            key={dia.fecha}
            href={hrefCalendario("dia", dia.fecha, vista)}
            className={cn(
              "flex min-h-[84px] flex-col gap-1.5 bg-surface p-2 transition-colors hover:bg-surface-sunken sm:min-h-[104px] sm:p-2.5",
              !dia.enMes && "bg-surface-sunken/50"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                dia.esHoy
                  ? "bg-brand text-ink-on-brand"
                  : dia.enMes
                    ? "text-ink"
                    : "text-ink-muted"
              )}
            >
              {Number(dia.fecha.slice(-2))}
            </span>

            {dia.segundos > 0 && (
              <>
                <span className="text-xs font-medium tabular-nums text-ink-secondary">
                  {formatDuracionCorta(dia.segundos)}
                </span>
                <div className="mt-auto flex h-1 overflow-hidden rounded-full bg-surface-sunken">
                  {dia.proyectos.map((p) => (
                    <span
                      key={p.id}
                      style={{
                        backgroundColor: p.color,
                        width: `${(p.segundos / dia.segundos) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
