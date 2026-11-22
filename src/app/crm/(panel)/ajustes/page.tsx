import type { Metadata } from "next";
import { fecha, fechaHora } from "@/lib/crm/formato";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { listarClaves, listarUsuarios } from "@/lib/crm/usuarios";
import { Seccion } from "../seccion";
import { SinPermiso } from "../sin-permiso";
import { Vacio } from "../vacio";
import { AccionesUsuario } from "./acciones-usuario";
import { NuevaClave } from "./nueva-clave";
import { NuevoUsuario } from "./nuevo-usuario";
import { RevocarClave } from "./revocar-clave";
import { Sincronizar } from "./sincronizar";

export const metadata: Metadata = { title: "Ajustes" };

const NOMBRE_ROL: Record<string, string> = { dueno: "Dueño", socia: "Socia", agente: "Agente", sistema: "Sistema" };

export default async function AjustesPagina() {
  const a = await actorDePagina();
  if (!tiene(a, "claves:propias")) return <SinPermiso que="los ajustes" />;
  const gestionar = tiene(a, "usuarios:gestionar");
  const clavesAjenas = tiene(a, "claves:gestionar");
  const [usuarios, claves] = await Promise.all([
    gestionar || clavesAjenas ? listarUsuarios() : Promise.resolve(null),
    listarClaves(clavesAjenas ? undefined : a.usuario.id),
  ]);
  const vigentes = claves.filter((c) => !c.revocada_at);

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-[26px] font-extrabold tracking-tight md:text-[32px]">Ajustes</h1>

      {gestionar && usuarios && (
        <Seccion titulo="Usuarios" cuenta={usuarios.length}>
          <ul className="flex flex-col divide-y divide-[var(--linea-tinta)] rounded-2xl border border-[var(--linea-tinta)] bg-white">
            {usuarios.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {u.nombre}
                    <span className="chip">{NOMBRE_ROL[u.rol] ?? u.rol}</span>
                    {!u.activo && <span className="chip" data-tono="alerta">desactivado</span>}
                    {u.invitacion_pendiente && <span className="chip" data-tono="lima">invitación sin aceptar</span>}
                  </p>
                  <p className="truncate text-[13.5px] text-[#5F6B64]">{u.correo}</p>
                </div>
                <AccionesUsuario id={u.id} activo={u.activo} humano={u.tipo === "humano"} yo={u.id === a.usuario.id} />
              </li>
            ))}
          </ul>
          <details className="bloque px-4 py-3">
            <summary className="cursor-pointer select-none font-semibold text-[var(--verde)]">Nuevo usuario</summary>
            <div className="mt-4"><NuevoUsuario /></div>
          </details>
        </Seccion>
      )}

      <Seccion titulo={clavesAjenas ? "Claves de acceso" : "Mis claves"} cuenta={vigentes.length}>
        <p className="max-w-prose text-[14.5px] text-[#46554D]">Para la terminal (<code className="mono">calidev login</code>) y para los agentes. Cada uso queda en el registro con el nombre de la clave.</p>
        {vigentes.length ? (
          <ul className="flex flex-col divide-y divide-[var(--linea-tinta)] rounded-2xl border border-[var(--linea-tinta)] bg-white">
            {vigentes.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{c.nombre} <span className="mono font-normal !normal-case text-[#5F6B64]">{c.prefijo}…</span></p>
                  <p className="text-[13px] text-[#5F6B64]">
                    {clavesAjenas ? `${c.usuario} · ` : ""}{c.alcances.join(" ")} · {c.ultimo_uso_at ? `usada ${fechaHora(c.ultimo_uso_at)}` : "sin usar"}{c.expira_at ? ` · vence ${fecha(c.expira_at)}` : ""}
                  </p>
                </div>
                <RevocarClave id={c.id} nombre={c.nombre} />
              </li>
            ))}
          </ul>
        ) : <Vacio>Ninguna clave vigente.</Vacio>}
        <details className="bloque px-4 py-3">
          <summary className="cursor-pointer select-none font-semibold text-[var(--verde)]">Nueva clave</summary>
          <div className="mt-4">
            <NuevaClave yo={a.usuario.id} usuarios={clavesAjenas && usuarios ? usuarios.filter((u) => u.activo).map((u) => ({ id: u.id, nombre: u.nombre })) : null} />
          </div>
        </details>
      </Seccion>

      {tiene(a, "sistema:sincronizar") && (
        <Seccion titulo="Sincronización">
          <p className="max-w-prose text-[14.5px] text-[#46554D]">Leads, citas, contactos e Instagram entran solos al CRM cada 5 minutos mientras alguien lo usa. Esto lo fuerza ahora; correrlo dos veces no duplica.</p>
          <Sincronizar />
        </Seccion>
      )}
    </div>
  );
}
