import type { Usuario } from "@/lib/crm/actor";
import { NOMBRE_ROL } from "../nombre-rol";
import { AccionesUsuario } from "./acciones-usuario";

/** Una persona o un agente: nombre, rol, estado y sus acciones. */
export function FilaUsuario({ u, yo }: { u: Usuario & { invitacion_pendiente: boolean }; yo: number }) {
  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="fuerte">{u.nombre}</span>
          <span className="chip">{NOMBRE_ROL[u.rol] ?? u.rol}</span>
          {!u.activo && <span className="chip" data-tono="alerta">desactivado</span>}
          {u.invitacion_pendiente && <span className="chip" data-tono="lima">invitación sin aceptar</span>}
        </p>
        <p className="nota truncate">{u.correo}</p>
      </div>
      <AccionesUsuario id={u.id} activo={u.activo} humano={u.tipo === "humano"} yo={u.id === yo} />
    </li>
  );
}
