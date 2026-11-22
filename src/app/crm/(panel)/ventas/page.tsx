import type { Metadata } from "next";
import { ETAPAS_ABIERTAS, ETAPAS_CERRADAS, NOMBRE_ETAPA } from "@/lib/crm/etapas";
import { paraInputFecha, plata } from "@/lib/crm/formato";
import { listarOportunidades } from "@/lib/crm/oportunidades";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { buscarPersonas } from "@/lib/crm/personas";
import { BarraSeccion } from "../barra-seccion";
import { Cuerpo } from "../cuerpo";
import { Seccion } from "../seccion";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { ColumnaEtapa } from "./columna-etapa";
import { FilaOportunidad } from "./fila-oportunidad";
import { NuevaOportunidad } from "./nueva-oportunidad";

export const metadata: Metadata = { title: "Ventas" };

type Props = { searchParams: Promise<{ vista?: string; nueva?: string; persona?: string }> };

const t = (v: string | Date | null) => (v ? new Date(v).getTime() : Number.POSITIVE_INFINITY);

/** Pipeline: las abiertas por etapa, de izquierda a derecha; la lista por próximo paso; las cerradas aparte. */
export default async function Ventas({ searchParams }: Props) {
  const a = await actorDePagina();
  if (!tiene(a, "ventas:leer")) return <><BarraSeccion titulo="Ventas" /><Cuerpo><SinPermiso que="las ventas" /></Cuerpo></>;
  const sp = await searchParams;
  const vista = sp.vista === "cerradas" || sp.vista === "lista" ? sp.vista : "pipeline";
  const ahora = new Date();
  const escribir = tiene(a, "ventas:escribir");
  const todas = await listarOportunidades({ limite: 1000 });
  const personaInicial = Number(sp.persona) || null;
  const abierta = sp.nueva === "1" || !!personaInicial;
  const personas = escribir && abierta && tiene(a, "contactos:leer") ? await buscarPersonas(null, 200) : [];

  const abiertas = todas.filter((o) => ETAPAS_ABIERTAS.includes(o.etapa));
  const fin = todas.filter((o) => ETAPAS_CERRADAS.includes(o.etapa));
  const enJuego = abiertas.filter((o) => o.moneda === "COP").reduce((s, o) => s + Number(o.valor_arranque ?? 0), 0);
  const href = (v: string) => (v === "pipeline" ? "/crm/ventas" : `/crm/ventas?vista=${v}`);

  return (
    <>
      <BarraSeccion
        titulo="Ventas"
        subtitulo={`${abiertas.length} abiertas${enJuego > 0 ? ` · ${plata(enJuego)} de arranque cotizado` : ""}`}
        segmentos={[
          { href: href("pipeline"), etiqueta: "Pipeline", activo: vista === "pipeline" },
          { href: href("lista"), etiqueta: "Lista", cuenta: abiertas.length, activo: vista === "lista" },
          { href: href("cerradas"), etiqueta: "Cerradas", cuenta: fin.length, activo: vista === "cerradas" },
        ]}
        accion={escribir ? { href: `${href(vista)}${vista === "pipeline" ? "?" : "&"}nueva=1`, etiqueta: "Nueva oportunidad" } : undefined}
      />
      <Cuerpo>
        {escribir && abierta && (
          <NuevaOportunidad personas={personas.map((p) => ({ id: p.id, nombre: p.nombre, empresa: p.empresa }))} personaInicial={personaInicial}
            fechaInicial={paraInputFecha(new Date(ahora.getTime() + 2 * 864e5))} precio={tiene(a, "precio:fijar")} abierta />
        )}

        {vista === "cerradas" ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {ETAPAS_CERRADAS.map((e) => {
              const ops = fin.filter((o) => o.etapa === e);
              return (
                <Seccion key={e} titulo={NOMBRE_ETAPA[e]} cuenta={ops.length}>
                  {ops.length ? <div className="bloque divide-y divide-[var(--linea)]">{ops.map((o) => <FilaOportunidad key={o.id} o={o} conEtapa={false} ahora={ahora} />)}</div> : <Vacio>Ninguna.</Vacio>}
                </Seccion>
              );
            })}
          </div>
        ) : vista === "lista" ? (
          abiertas.length ? (
            <div className="bloque divide-y divide-[var(--linea)]">
              {[...abiertas].sort((x, y) => t(x.proximo_paso_at) - t(y.proximo_paso_at)).map((o) => <FilaOportunidad key={o.id} o={o} ahora={ahora} />)}
            </div>
          ) : <Vacio>No hay oportunidades abiertas.</Vacio>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-7 md:px-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-start">
              {ETAPAS_ABIERTAS.map((e) => <ColumnaEtapa key={e} etapa={e} ops={abiertas.filter((o) => o.etapa === e)} ahora={ahora} />)}
            </div>
          </div>
        )}
      </Cuerpo>
    </>
  );
}
