import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function RegistrosPage() {
  return (
    <div>
      <PageHeader title="Mis registros" />
      <ComingSoon
        icon={ListChecks}
        fase="Fase 2"
        titulo="Historial de tus registros"
        descripcion="Aquí aparecerá el listado cronológico de todo lo que has registrado, con opción de editar o corregir tus propios registros."
      />
    </div>
  );
}
