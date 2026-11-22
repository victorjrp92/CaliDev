import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listarAuditoria } from "@/lib/crm/auditoria";
import { contratoCrm } from "@/lib/crm/contratos";
import { fecha, fechaHora } from "@/lib/crm/formato";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { Registro } from "../../auditoria/registro";
import { BarraSeccion } from "../../barra-seccion";
import { Cuerpo } from "../../cuerpo";
import { Seccion } from "../../seccion";
import { SinPermiso } from "../../sin-permiso";
import { Vacio } from "../../vacio";
import { EstadoContrato } from "../estado-contrato";
import { BorrarContrato } from "./borrar-contrato";
import { CopiarEnlace } from "./copiar-enlace";
import { EnviarEnlace } from "./enviar-enlace";

export const metadata: Metadata = { title: "Contrato" };

const enlaceTexto = "font-medium text-[var(--acento-texto)] underline-offset-4 hover:underline";

export default async function ContratoPagina({ params }: { params: Promise<{ id: string }> }) {
  const a = await actorDePagina();
  const volver = { href: "/crm/contratos", etiqueta: "Contratos" };
  if (!tiene(a, "contratos:leer")) return <><BarraSeccion titulo="Contrato" volver={volver} /><Cuerpo><SinPermiso que="los contratos" /></Cuerpo></>;
  const id = Number((await params).id);
  const c = Number.isInteger(id) && id > 0 ? await contratoCrm(a, id).catch(() => null) : null;
  if (!c) notFound();
  const auditoria = tiene(a, "auditoria:leer") ? await listarAuditoria({ entidad: "contrato", id: String(id), limite: 50 }) : null;
  const directo = tiene(a, "contrato:enviar");
  const pendientes = c.firmantes.filter((f) => !f.firmado_at && f.rol !== "calidev")
    .map((f) => ({ id: f.id, etiqueta: f.etiqueta, correo: f.correo ?? c.persona_correo }));
  const calidev = c.firmantes.find((f) => f.rol === "calidev");
  const nadieFirmo = c.firmantes.every((f) => !f.firmado_at);
  const datos: [string, React.ReactNode][] = [
    ["Contacto", c.persona_id ? <Link href={`/crm/contactos/${c.persona_id}`} className={enlaceTexto}>{c.persona}</Link> : "—"],
    ["Empresa", c.empresa ?? "—"],
    ["Oportunidad", c.oportunidad_id ? <Link href={`/crm/ventas/${c.oportunidad_id}`} className={enlaceTexto}>{c.oportunidad}</Link> : "—"],
    ["Creado", fecha(c.created_at)],
    ["Huella", <span key="h" className="mono text-[13px]" title={c.huella}>{c.huella.slice(0, 12)}…</span>],
  ];

  return (
    <>
      <BarraSeccion volver={volver} titulo={<span className="inline-flex flex-wrap items-center gap-3">{c.titulo} <EstadoContrato c={c} /></span>}
        subtitulo={c.estado === "firmado" ? "Firmado por todas las partes." : calidev && !calidev.firmado_at ? "CaliDev firma primero; después se envía el enlace a la clienta." : undefined} />
      <Cuerpo>
        <dl className="bloque grid grid-cols-2 gap-x-6 gap-y-4 px-[18px] py-4 sm:grid-cols-3">
          {datos.map(([k, v]) => (
            <div key={k} className="flex min-w-0 flex-col gap-0.5"><dt className="nota">{k}</dt><dd className="truncate text-[15px]">{v}</dd></div>
          ))}
        </dl>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-8">
            <Seccion titulo="Firmas" cuenta={c.firmantes.length}>
              <ol className="bloque flex flex-col divide-y divide-[var(--linea)]">
                {c.firmantes.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <span className="flex min-w-0 flex-col">
                      <span className="fuerte">{f.etiqueta}{f.nombre ? ` · ${f.nombre}` : ""}</span>
                      <span className="nota">
                        {f.firmado_at ? `Firmó ${fechaHora(f.firmado_at)}` : f.abierto_at ? `Lo abrió ${fechaHora(f.abierto_at)}, sin firmar` : "No lo ha abierto"}
                        {f.codigo_enviado_at && !f.firmado_at ? ` · pidió código ${fechaHora(f.codigo_enviado_at)}` : ""}
                      </span>
                    </span>
                    {f.firmado_at ? <span className="chip" data-tono="verde">Firmó</span> : f.enlace && (
                      <span className="flex items-center gap-2">
                        {f.rol === "calidev" && <a href={f.enlace} target="_blank" rel="noopener noreferrer" className="boton-chico">Firmar ahora</a>}
                        <CopiarEnlace enlace={f.enlace} />
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </Seccion>
            {pendientes.length > 0 && (
              <Seccion titulo={c.envios.length ? "Reenviar enlace" : "Enviar enlace"}>
                <div className="bloque px-[18px] py-4">
                  <EnviarEnlace contratoId={c.id} pendientes={pendientes} directo={directo} yaEnviado={c.envios.some((e) => e.ok)} />
                </div>
              </Seccion>
            )}
            {c.firmantes[0]?.enlace && (
              <p className="px-1 text-[14px]"><a href={c.firmantes[0].enlace} target="_blank" rel="noopener noreferrer" className={enlaceTexto}>Ver el contrato tal como se firma</a></p>
            )}
          </div>
          <div className="flex flex-col gap-8">
            <Seccion titulo="Envíos" cuenta={c.envios.length}>
              {c.envios.length ? (
                <ol className="bloque flex flex-col divide-y divide-[var(--linea)]">
                  {c.envios.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
                      <span className="flex min-w-0 flex-col"><span className="truncate font-medium">{e.correo}</span><span className="nota">{fechaHora(e.at)} · {e.enviado_por ?? "sistema"}</span></span>
                      <span className="chip" data-tono={e.ok ? "verde" : "alerta"}>{e.ok ? "Salió" : "Falló"}</span>
                    </li>
                  ))}
                </ol>
              ) : <Vacio>Todavía no se ha enviado el enlace por correo.</Vacio>}
            </Seccion>
            {auditoria && <Registro filas={auditoria} />}
            {nadieFirmo && tiene(a, "contratos:escribir") && <BorrarContrato id={c.id} volver={c.oportunidad_id ? `/crm/ventas/${c.oportunidad_id}` : "/crm/contratos"} />}
          </div>
        </div>
      </Cuerpo>
    </>
  );
}
