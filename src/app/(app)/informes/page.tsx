import { FileBarChart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function InformesPage() {
  return (
    <div>
      <PageHeader title="Informes semanales" />
      <ComingSoon
        icon={FileBarChart}
        fase="Fase 5"
        titulo="Informes automáticos de cada domingo"
        descripcion="Cada lunes a las 00:10 se generará el análisis de la semana: resumen general, por proyecto, por socio y conclusiones basadas en los datos reales registrados."
      />
    </div>
  );
}
