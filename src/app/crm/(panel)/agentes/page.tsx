import type { Metadata } from "next";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { listarClaves, listarUsuarios } from "@/lib/crm/usuarios";
import { BarraSeccion } from "../barra-seccion";
import { Cuerpo } from "../cuerpo";
import { Seccion } from "../seccion";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { FilaClave } from "./fila-clave";
import { FilaUsuario } from "./fila-usuario";
import { NuevaClave } from "./nueva-clave";
import { NuevoUsuario } from "./nuevo-usuario";
import { Sincronizar } from "./sincronizar";

export const metadata: Metadata = { title: "Agentes" };

type Props = { searchParams: Promise<{ vista?: string; nuevo?: string }> };

/** Los agentes que trabajan en el CRM, las personas del equipo y las claves con que entran. */
export default async function AgentesPagina({ searchParams }: Props) {
  const a = await actorDePagina();
  if (!tiene(a, "claves:propias")) return <><BarraSeccion titulo="Agentes" /><Cuerpo><SinPermiso que="los agentes" /></Cuerpo></>;
  const sp = await searchParams;
  const gestionar = tiene(a, "usuarios:gestionar");
  const clavesAjenas = tiene(a, "claves:gestionar");
  const vista = !gestionar ? "claves" : sp.vista === "equipo" || sp.vista === "claves" ? sp.vista : "agentes";
  const nuevo = sp.nuevo === "1";
  const [usuarios, claves] = await Promise.all([
    gestionar || clavesAjenas ? listarUsuarios() : Promise.resolve([]),
    listarClaves(clavesAjenas ? undefined : a.usuario.id),
  ]);
  const agentes = usuarios.filter((u) => u.tipo !== "humano");
  const equipo = usuarios.filter((u) => u.tipo === "humano");
  const vigentes = claves.filter((c) => !c.revocada_at);

  const href = (v: string) => (v === "agentes" ? "/crm/agentes" : `/crm/agentes?vista=${v}`);
  const ACCION = { agentes: "Nuevo agente", equipo: "Invitar persona", claves: "Nueva clave" } as const;

  return (
    <>
      <BarraSeccion
        titulo="Agentes"
        subtitulo={vista === "claves" ? "Para la terminal (calidev login) y para los agentes. Cada uso queda en el registro con el nombre de la clave." : undefined}
        segmentos={gestionar ? [
          { href: href("agentes"), etiqueta: "Agentes", cuenta: agentes.length, activo: vista === "agentes" },
          { href: href("equipo"), etiqueta: "Equipo", cuenta: equipo.length, activo: vista === "equipo" },
          { href: href("claves"), etiqueta: "Claves", cuenta: vigentes.length, activo: vista === "claves" },
        ] : undefined}
        accion={{ href: `${href(vista)}${vista === "agentes" ? "?" : "&"}nuevo=1`, etiqueta: ACCION[vista] }}
      />
      <Cuerpo>
        {nuevo && vista !== "claves" && <div className="bloque px-[18px] py-4"><NuevoUsuario key={vista} tipoInicial={vista === "agentes" ? "agente" : "humano"} /></div>}
        {nuevo && vista === "claves" && (
          <div className="bloque px-[18px] py-4">
            <NuevaClave yo={a.usuario.id} usuarios={clavesAjenas ? usuarios.filter((u) => u.activo).map((u) => ({ id: u.id, nombre: u.nombre })) : null} />
          </div>
        )}

        {vista === "agentes" && (
          <>
            {agentes.length ? <ul className="bloque divide-y divide-[var(--linea)]">{agentes.map((u) => <FilaUsuario key={u.id} u={u} yo={a.usuario.id} />)}</ul> : <Vacio>Todavía no hay agentes.</Vacio>}
            {tiene(a, "sistema:sincronizar") && (
              <Seccion titulo="Sincronización" className="mt-4">
                <div className="panel flex flex-col gap-3 px-[18px] py-4">
                  <p className="max-w-prose text-[14px] text-[var(--texto-2)]">Leads, citas, contactos e Instagram entran solos al CRM cada 5 minutos mientras alguien lo usa. Esto lo fuerza ahora; correrlo dos veces no duplica.</p>
                  <Sincronizar />
                </div>
              </Seccion>
            )}
          </>
        )}

        {vista === "equipo" && (equipo.length
          ? <ul className="bloque divide-y divide-[var(--linea)]">{equipo.map((u) => <FilaUsuario key={u.id} u={u} yo={a.usuario.id} />)}</ul>
          : <Vacio>Nadie más en el equipo.</Vacio>)}

        {vista === "claves" && (vigentes.length
          ? <ul className="bloque divide-y divide-[var(--linea)]">{vigentes.map((c) => <FilaClave key={c.id} c={c} conDueno={clavesAjenas} />)}</ul>
          : <Vacio>Ninguna clave vigente.</Vacio>)}
      </Cuerpo>
    </>
  );
}
