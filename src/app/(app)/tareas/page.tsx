import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function TareasPage() {
  return (
    <div>
      <PageHeader title="Tareas" />
      <ComingSoon
        icon={CheckSquare}
        fase="Fase 3"
        titulo="Tareas organizadas por proyecto"
        descripcion="Aquí se podrán crear tareas con responsable, fecha y estado, de forma independiente a la descripción libre de cada registro de tiempo."
      />
    </div>
  );
}
