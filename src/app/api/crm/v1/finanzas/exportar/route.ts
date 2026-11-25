import { exportarCsv } from "@/lib/crm/finanzas";
import { api, requerir } from "@/lib/crm/guardia";
import { consulta } from "@/lib/crm/http";

/** CSV del mes para el contador: `;`, coma decimal, UTF-8 con BOM. */
export const GET = api(async (request) => {
  const a = await requerir(request, "finanzas:leer");
  const { nombre, csv } = await exportarCsv(a, { mes: consulta(request).texto("mes") });
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nombre}"`, "Cache-Control": "no-store" } });
});
