import { Flag } from "lucide-react";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { todayMadrid } from "@/lib/dates";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { CreateKeyDateForm } from "./create-key-date-form";
import { KeyDateRow, type FechaClaveView } from "./key-date-row";

export default async function FechasClavePage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha: fechaPorDefecto } = await searchParams;
  const profile = await requireProfile();
  const db = createDbClient();
  const hoy = todayMadrid();

  const [{ data: proyectos }, { data: fechasData }] = await Promise.all([
    db.from("projects").select("id, nombre, color").order("nombre"),
    db
      .from("key_dates")
      .select("id, titulo, descripcion, fecha, project_id, created_by")
      .order("fecha", { ascending: true }),
  ]);

  const listaProyectos = proyectos ?? [];
  const proyectoPorId = new Map(listaProyectos.map((p) => [p.id, p]));
  const fechas = fechasData ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fechas clave"
        description="Avisos sueltos sobre una fecha importante (una entrega, una reunión, un hito), visibles para toda la empresa en el calendario."
      />

      <Card className="p-5">
        <h2 className="mb-4 font-display text-base font-semibold text-ink">
          Nueva fecha clave
        </h2>
        <CreateKeyDateForm
          proyectos={listaProyectos}
          fechaPorDefecto={fechaPorDefecto}
        />
      </Card>

      {fechas.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Flag className="h-8 w-8 text-ink-muted" />
          <p className="text-sm text-ink-secondary">
            Todavía no hay ninguna fecha clave creada.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {fechas.map((f) => {
            const view: FechaClaveView = {
              id: f.id,
              titulo: f.titulo,
              descripcion: f.descripcion,
              fecha: f.fecha,
              proyecto: f.project_id
                ? {
                    nombre:
                      proyectoPorId.get(f.project_id)?.nombre ??
                      "Proyecto eliminado",
                    color: proyectoPorId.get(f.project_id)?.color ?? "#8893a3",
                  }
                : null,
            };
            return (
              <KeyDateRow
                key={f.id}
                fechaClave={view}
                esHoy={f.fecha === hoy}
                esPasada={f.fecha < hoy}
                puedeBorrar={
                  profile.rol === "admin" || f.created_by === profile.id
                }
              />
            );
          })}
        </Card>
      )}
    </div>
  );
}
