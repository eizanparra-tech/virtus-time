import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function EstadisticasPage() {
  return (
    <div>
      <PageHeader title="Estadísticas" />
      <ComingSoon
        icon={BarChart3}
        fase="Fase 4"
        titulo="Estadísticas individuales y generales"
        descripcion="Gráficos de horas por proyecto, por socio, evolución semanal y comparativas con filtros por fecha, proyecto y socio."
      />
    </div>
  );
}
