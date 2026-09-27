import { datosAjustes, kpisInicio, porAtender, tablaPublicaciones } from "@/lib/social/consultas";
import { filtrarPublicaciones } from "@/lib/social/filtrar-publicaciones";
import { recomendaciones } from "@/lib/social/recomendaciones";
import { panelAbierto } from "@/lib/social/sesion";
import { Atencion } from "./atencion";
import { FiltrosPublicaciones } from "./filtros-publicaciones";
import { ListaRecomendaciones } from "./lista-recomendaciones";
import { TablaPublicaciones } from "./tabla-publicaciones";
import { Kpi } from "./ui/kpi";

export const dynamic = "force-dynamic";

export default async function InicioPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  if (!(await panelAbierto())) return null;
  const { f } = await searchParams;
  const [k, filas, atender, ajustes] = await Promise.all([kpisInicio(), tablaPublicaciones(), porAtender(), datosAjustes()]);
  const recs = recomendaciones(filas, ajustes.minutosDesdeCiclo, k.automatizadas > 0);

  return (
    <main className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 py-7 md:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[28px] font-extrabold tracking-tight">Inicio</h1>
        {ajustes.simulacion && <span className="rounded-full bg-[#FFF7E0] px-3 py-1 text-xs font-semibold text-[#8A4B0B]">Modo simulación</span>}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi etiqueta="Publicaciones automatizadas" valor={`${k.automatizadas} de ${k.publicaciones}`} />
        <Kpi etiqueta="Comentarios (30 días)" valor={k.comentarios} />
        <Kpi etiqueta="Por atender" valor={atender.length} aviso={atender.length > 0} />
        <Kpi etiqueta="Leads con negocio" valor={k.leads} destacado />
        <Kpi etiqueta="Formularios desde Instagram" valor={k.formularios} />
      </div>
      <FiltrosPublicaciones filas={filas} actual={f ?? "todas"} base="/social" />
      <TablaPublicaciones filas={filtrarPublicaciones(filas, f ?? "todas")} />
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Atencion items={atender} />
        <ListaRecomendaciones items={recs} />
      </div>
    </main>
  );
}
