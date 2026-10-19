import { todayMadrid, semanaDe, addDias } from "@/lib/dates";
import { generarInformeSemanal } from "@/lib/informes";

// =============================================================================
// Tarea programada (Vercel Cron, ver vercel.json): cada lunes de madrugada
// genera el informe de la semana que acaba de terminar.
//
// Vercel llama a esta ruta con el header "Authorization: Bearer <CRON_SECRET>".
// Cualquier otra petición (sin ese header, o con uno distinto) se rechaza.
//
// Qué semana se genera NO depende de a qué hora exacta llega esta llamada:
// se calcula siempre a partir de la fecha de hoy en Madrid, así que aunque
// Vercel la dispare unos minutos antes o después (por el cambio de hora,
// o por cualquier retraso), el resultado es el mismo informe correcto.
// =============================================================================

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const hoy = todayMadrid();
  const estaSemana = semanaDe(hoy);
  const semanaPasada = semanaDe(addDias(estaSemana.inicio, -1));

  const resultado = await generarInformeSemanal(semanaPasada.inicio);

  if (!resultado.ok) {
    return Response.json({ error: resultado.error }, { status: 500 });
  }

  return Response.json({
    ok: true,
    reportId: resultado.reportId,
    semana: semanaPasada,
  });
}
