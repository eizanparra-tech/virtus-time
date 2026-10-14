import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function CalendarioPage() {
  return (
    <div>
      <PageHeader title="Calendario" />
      <ComingSoon
        icon={CalendarDays}
        fase="Fase 6"
        titulo="Calendario interactivo"
        descripcion="Vista diaria, semanal y mensual del tiempo registrado, con un color distinto para cada proyecto."
      />
    </div>
  );
}
