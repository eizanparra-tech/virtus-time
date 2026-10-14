import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ProyectosPage() {
  return (
    <div>
      <PageHeader title="Proyectos" />
      <ComingSoon
        icon={FolderKanban}
        fase="Fase 3"
        titulo="Gestión de proyectos"
        descripcion="Aquí podrás crear proyectos, asignar socios participantes y consultar las horas totales, semanales y mensuales de cada uno."
      />
    </div>
  );
}
