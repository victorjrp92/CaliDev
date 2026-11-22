import { fecha, fechaHora } from "@/lib/crm/formato";
import type { ClavePublica } from "@/lib/crm/usuarios";
import { RevocarClave } from "./revocar-clave";

/** Una clave vigente: nombre, prefijo, de quién, alcances y último uso. */
export function FilaClave({ c, conDueno }: { c: ClavePublica; conDueno: boolean }) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p><span className="fuerte">{c.nombre}</span> <span className="mono text-[var(--texto-2)]">{c.prefijo}…</span></p>
        <p className="nota">
          {conDueno ? `${c.usuario} · ` : ""}{c.alcances.length ? c.alcances.join(" ") : "todo lo de su rol"} · {c.ultimo_uso_at ? `usada ${fechaHora(c.ultimo_uso_at)}` : "sin usar"}{c.expira_at ? ` · vence ${fecha(c.expira_at)}` : ""}
        </p>
      </div>
      <RevocarClave id={c.id} nombre={c.nombre} />
    </li>
  );
}
