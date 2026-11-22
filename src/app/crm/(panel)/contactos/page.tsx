import type { Metadata } from "next";
import Link from "next/link";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { buscarPersonas, type Persona } from "@/lib/crm/personas";
import { BarraSeccion } from "../barra-seccion";
import { Cuerpo } from "../cuerpo";
import { Seccion } from "../seccion";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { FilaPersona } from "./fila-persona";
import { NuevaPersona } from "./nueva-persona";

export const metadata: Metadata = { title: "Contactos" };

type Props = { searchParams: Promise<{ q?: string; vista?: string; nueva?: string }> };

/** Personas del CRM: las más recientes o las que coinciden con `?q=`, sueltas o agrupadas por empresa. */
export default async function Contactos({ searchParams }: Props) {
  const a = await actorDePagina();
  if (!tiene(a, "contactos:leer")) return <><BarraSeccion titulo="Contactos" /><Cuerpo><SinPermiso que="los contactos" /></Cuerpo></>;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const vista = sp.vista === "empresas" ? "empresas" : "personas";
  const personas = await buscarPersonas(q || null, 200);
  const escribir = tiene(a, "contactos:escribir");

  const conQ = (extra: Record<string, string>) => {
    const u = new URLSearchParams({ ...(q ? { q } : {}), ...extra });
    const s = u.toString();
    return `/crm/contactos${s ? `?${s}` : ""}`;
  };
  const grupos = new Map<string, Persona[]>();
  for (const p of personas) {
    const k = p.empresa ?? "Sin empresa";
    grupos.set(k, [...(grupos.get(k) ?? []), p]);
  }
  const empresas = [...grupos.entries()].sort(([x], [y]) => (x === "Sin empresa" ? 1 : y === "Sin empresa" ? -1 : x.localeCompare(y, "es")));
  const nEmpresas = empresas.filter(([k]) => k !== "Sin empresa").length;

  return (
    <>
      <BarraSeccion
        titulo="Contactos"
        subtitulo={q ? `Resultados para «${q}»` : undefined}
        segmentos={[
          { href: conQ({}), etiqueta: "Personas", cuenta: personas.length, activo: vista === "personas" },
          { href: conQ({ vista: "empresas" }), etiqueta: "Empresas", cuenta: nEmpresas, activo: vista === "empresas" },
        ]}
        accion={escribir ? { href: conQ({ ...(vista === "empresas" ? { vista } : {}), nueva: "1" }), etiqueta: "Nuevo contacto" } : undefined}
      />
      <Cuerpo>
        <form method="get" role="search" className="flex flex-wrap gap-2">
          {vista === "empresas" && <input type="hidden" name="vista" value="empresas" />}
          <input type="search" name="q" defaultValue={q} aria-label="Buscar contactos" placeholder="Nombre, correo, WhatsApp, Instagram o empresa" className="campo min-w-0 flex-1" />
          <button type="submit" className="boton-secundario">Buscar</button>
          {q && <Link href={vista === "empresas" ? "/crm/contactos?vista=empresas" : "/crm/contactos"} className="boton-secundario">Limpiar</Link>}
        </form>

        {escribir && sp.nueva === "1" && <NuevaPersona abierta />}

        {!personas.length ? (
          <Vacio>{q ? `Nadie coincide con «${q}».` : "Todavía no hay personas."}</Vacio>
        ) : vista === "empresas" ? (
          <div className="flex flex-col gap-6">
            {empresas.map(([empresa, ps]) => (
              <Seccion key={empresa} titulo={empresa} cuenta={ps.length}>
                <div className="bloque divide-y divide-[var(--linea)]">{ps.map((p) => <FilaPersona key={p.id} p={p} conEmpresa={false} />)}</div>
              </Seccion>
            ))}
          </div>
        ) : (
          <div className="bloque divide-y divide-[var(--linea)]">{personas.map((p) => <FilaPersona key={p.id} p={p} />)}</div>
        )}
      </Cuerpo>
    </>
  );
}
