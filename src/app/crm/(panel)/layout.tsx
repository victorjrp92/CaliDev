import { after } from "next/server";
import { sql } from "@/lib/db";
import { actorDePagina, tiene } from "@/lib/crm/pagina";
import { sincronizarSiToca } from "@/lib/crm/sincronizar";
import { MenuLateral } from "./menu-lateral";
import { NOMBRE_ROL } from "./nombre-rol";

export const dynamic = "force-dynamic";

/**
 * Todo lo que va dentro del CRM pide sesión (se comprueba aquí, en el servidor).
 * Después de responder, trae al CRM lo nuevo de los formularios públicos y de
 * Instagram si pasaron 5 minutos desde la última vez.
 */
export default async function Panel({ children }: { children: React.ReactNode }) {
  const a = await actorDePagina();
  after(() => sincronizarSiToca(null, 300).catch((e) => console.error("[crm] sincronizar:", e)));
  const pendientes = tiene(a, "aprobaciones:leer")
    ? Number((await sql<{ n: string | number }>`SELECT COUNT(*) AS n FROM crm_aprobaciones WHERE estado = 'pendiente'`).rows[0]?.n ?? 0)
    : 0;
  return (
    <div className="marco">
      <MenuLateral nombre={a.usuario.nombre} rol={NOMBRE_ROL[a.usuario.rol] ?? a.usuario.rol} pendientes={pendientes} agentes={tiene(a, "claves:propias")} />
      <main className="principal">{children}</main>
    </div>
  );
}
