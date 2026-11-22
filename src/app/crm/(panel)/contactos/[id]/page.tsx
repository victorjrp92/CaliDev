import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listarAuditoria } from "@/lib/crm/auditoria";
import { fechaHora } from "@/lib/crm/formato";
import { notasDe } from "@/lib/crm/notas";
import { listarOportunidades } from "@/lib/crm/oportunidades";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { lineaDeTiempo, personaPorId } from "@/lib/crm/personas";
import { Registro } from "../../auditoria/registro";
import { BarraSeccion } from "../../barra-seccion";
import { Cuerpo } from "../../cuerpo";
import { ListaNotas } from "../../notas/lista-notas";
import { Seccion } from "../../seccion";
import { SinPermiso } from "../../sin-permiso";
import { Vacio } from "../../vacio";
import { FilaOportunidad } from "../../ventas/fila-oportunidad";
import { EditarPersona } from "./editar-persona";

export const metadata: Metadata = { title: "Persona" };

const recortar = (t: string, max = 160) => (t.length > max ? `${t.slice(0, max).trimEnd()}…` : t);

export default async function PersonaPagina({ params }: { params: Promise<{ id: string }> }) {
  const a = await actorDePagina();
  if (!tiene(a, "contactos:leer")) return <><BarraSeccion titulo="Persona" volver={{ href: "/crm/contactos", etiqueta: "Contactos" }} /><Cuerpo><SinPermiso que="los contactos" /></Cuerpo></>;
  const id = Number((await params).id);
  const p = Number.isInteger(id) && id > 0 ? await personaPorId(id) : null;
  if (!p) notFound();
  const ahora = new Date();
  const [oportunidades, notas, hitos, auditoria] = await Promise.all([
    tiene(a, "ventas:leer") ? listarOportunidades({ personaId: id, limite: 100 }) : Promise.resolve(null),
    tiene(a, "notas:leer") ? notasDe("persona", id) : Promise.resolve(null),
    lineaDeTiempo(id, 100),
    tiene(a, "auditoria:leer") ? listarAuditoria({ entidad: "persona", id: String(id), limite: 100 }) : Promise.resolve(null),
  ]);
  const datos: [string, React.ReactNode][] = [
    ["Correo", p.correo ? <a href={`mailto:${p.correo}`} className="text-[var(--acento-texto)] underline-offset-4 hover:underline">{p.correo}</a> : "—"],
    ["WhatsApp", p.whatsapp ? `+${p.whatsapp}` : "—"],
    ["Instagram", p.usuario_ig ? `@${p.usuario_ig.replace(/^@/, "")}` : "—"],
    ["Origen", p.origen ?? "—"],
  ];

  return (
    <>
      <BarraSeccion volver={{ href: "/crm/contactos", etiqueta: "Contactos" }} titulo={<span className="break-words">{p.nombre}</span>} subtitulo={p.empresa ?? undefined} />
      <Cuerpo>
      <dl className="bloque grid grid-cols-1 gap-x-6 gap-y-4 px-[18px] py-4 sm:grid-cols-4">
        {datos.map(([k, v]) => (
          <div key={k} className="flex min-w-0 flex-col gap-0.5"><dt className="nota">{k}</dt><dd className="cifra break-words text-[15px]">{v}</dd></div>
        ))}
      </dl>
      {p.notas && <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-[var(--texto-2)]">{p.notas}</p>}

      {tiene(a, "contactos:escribir") && (
        <details className="bloque px-4 py-3">
          <summary className="cursor-pointer select-none font-semibold text-[var(--acento-texto)]">Editar datos</summary>
          <div className="mt-4">
            <EditarPersona id={p.id} inicial={{ nombre: p.nombre, empresa: p.empresa ?? "", correo: p.correo ?? "", whatsapp: p.whatsapp ?? "", usuario_ig: p.usuario_ig ?? "", origen: p.origen ?? "", notas: p.notas ?? "" }} />
          </div>
        </details>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex min-w-0 flex-col gap-8">
          <Seccion
            titulo="Oportunidades"
            cuenta={oportunidades?.length}
            accion={oportunidades !== null ? <Link href={`/crm/ventas?persona=${p.id}`} className="text-[13.5px] font-medium text-[var(--acento-texto)] underline-offset-4 hover:underline">Nueva oportunidad</Link> : null}
          >
            {oportunidades === null ? <SinPermiso que="las ventas" /> : oportunidades.length ? (
              <div className="bloque divide-y divide-[var(--linea)]">{oportunidades.map((o) => <FilaOportunidad key={o.id} o={o} ahora={ahora} />)}</div>
            ) : <Vacio>Sin oportunidades todavía.</Vacio>}
          </Seccion>
          <Seccion titulo="Notas" cuenta={notas?.length}>
            {notas === null ? <SinPermiso que="las notas" /> : <ListaNotas notas={notas} entidad="persona" id={p.id} escribir={tiene(a, "notas:escribir")} />}
          </Seccion>
        </div>
        <div className="flex min-w-0 flex-col gap-8">
          <Seccion titulo="Línea de tiempo" cuenta={hitos.length}>
            {hitos.length ? (
              <ol className="bloque flex flex-col divide-y divide-[var(--linea)]">
                {hitos.map((h, i) => (
                  <li key={`${h.entidad}-${h.entidad_id}-${h.at}-${i}`} className="min-w-0 px-4 py-2.5 text-[14px]">
                    <span className="font-medium">{h.titulo}</span>
                    <span className="nota block">{fechaHora(h.at)}</span>
                    {h.detalle && <span className="mt-0.5 block break-words text-[13.5px] text-[var(--texto-2)]">{recortar(h.detalle)}</span>}
                  </li>
                ))}
              </ol>
            ) : <Vacio>Todavía no ha pasado nada con esta persona.</Vacio>}
          </Seccion>
          {auditoria && <Registro filas={auditoria} />}
        </div>
      </div>
      </Cuerpo>
    </>
  );
}
