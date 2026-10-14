import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ComingSoon({
  icon: Icon,
  titulo,
  fase,
  descripcion,
}: {
  icon: LucideIcon;
  titulo: string;
  fase: string;
  descripcion: string;
}) {
  return (
    <Card className="flex flex-col items-start gap-4 p-8 sm:p-10">
      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand/5 text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          {fase}
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink">
          {titulo}
        </h2>
        <p className="mt-2 max-w-md text-sm text-ink-secondary">
          {descripcion}
        </p>
      </div>
    </Card>
  );
}
