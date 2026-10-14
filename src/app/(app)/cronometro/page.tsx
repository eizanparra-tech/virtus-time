import { TimerIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function CronometroPage() {
  return (
    <div>
      <PageHeader title="Cronómetro" />
      <ComingSoon
        icon={TimerIcon}
        fase="Fase 2"
        titulo="Cronómetro y registro de tiempo"
        descripcion="Aquí podrás elegir un proyecto, escribir libremente en qué estás trabajando e iniciar, pausar o finalizar el cronómetro. También podrás añadir horas manualmente."
      />
    </div>
  );
}
