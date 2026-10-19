import { ListChecks } from "lucide-react";
import { requireProfile } from "@/lib/session";
import { createDbClient } from "@/lib/supabase/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { RegistroRow, type RegistroView } from "./registro-row";
import { formatFecha, formatDuracionCorta } from "@/lib/utils";

export default async function RegistrosPage() {
  const profile = await requireProfile();
  const db = createDbClient();

  const [{ data: entradas }, { data: proyectos }] = await Promise.all([
    db
      .from("time_entries")
      .select(
        "id, descripcion, fecha, duracion_segundos, es_manual, project_id, hora_inicio"
      )
      .eq("user_id", profile.id)
      .not("hora_fin", "is", null)
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: false }),
    db.from("projects").select("id, nombre, color"),
  ]);

  const proyectoPorId = new Map((proyectos ?? []).map((p) => [p.id, p]));
  const lista = entradas ?? [];

  const grupos = new Map<string, RegistroView[]>();
  for (const e of lista) {
    const proyecto = proyectoPorId.get(e.project_id) ?? {
      nombre: "Proyecto eliminado",
      color: "#8a4f9e",
    };
    const view: RegistroView = {
      id: e.id,
      descripcion: e.descripcion,
      fecha: e.fecha,
      duracionSegundos: e.duracion_segundos,
      esManual: e.es_manual,
      proyecto,
    };
    const grupo = grupos.get(e.fecha) ?? [];
    grupo.push(view);
    grupos.set(e.fecha, grupo);
  }

  const dias = Array.from(grupos.entries());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis registros"
        description="Todo lo que has registrado, por día. Puedes corregir la descripción, la fecha o la duración de cualquier registro."
      />

      {dias.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <ListChecks className="h-8 w-8 text-ink-muted" />
          <p className="text-sm text-ink-secondary">
            Todavía no has registrado ninguna hora. Ve al Cronómetro para
            empezar.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {dias.map(([fecha, registros]) => {
            const totalDia = registros.reduce(
              (acc, r) => acc + r.duracionSegundos,
              0
            );
            return (
              <div key={fecha}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold capitalize text-ink-secondary">
                    {formatFecha(fecha)}
                  </h2>
                  <span className="text-sm font-medium text-ink-muted">
                    {formatDuracionCorta(totalDia)}
                  </span>
                </div>
                <Card className="divide-y divide-border">
                  {registros.map((registro) => (
                    <RegistroRow key={registro.id} registro={registro} />
                  ))}
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
