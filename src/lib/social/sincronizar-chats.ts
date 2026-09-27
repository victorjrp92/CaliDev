import { sql } from "@/lib/db";
import { ajuste, fijarAjuste } from "./db";
import { guardarMensaje } from "./datos";
import * as ig from "./instagram";
import { fechaIg } from "./reglas";

/**
 * Copia de la bandeja de Instagram en la base, para que Chats cargue sin
 * llamar a Composio (3-5 s por llamada). La lista de conversaciones se
 * refresca cada 10 min desde el reloj y a mano con «Actualizar»; los mensajes
 * de una conversación solo se traen si Instagram dice que cambió.
 */
const CUENTA = "calidevdev";
const CADA_MS = 10 * 60_000;

export async function sincronizarBandeja(forzar = false, topeConversaciones = 6) {
  const ultimo = await ajuste("chats_sync");
  if (!forzar && ultimo && Date.now() - Date.parse(ultimo) < CADA_MS) return { saltado: true };
  const convs = await ig.conversaciones(25);
  const { rows } = await sql`SELECT igsid, actualizado_ig FROM social_conversaciones`;
  const previo = new Map(rows.map((r) => [r.igsid as string, r.actualizado_ig ? new Date(r.actualizado_ig).getTime() : 0]));
  let traidas = 0;
  for (const c of convs) {
    const otra = c.participants?.data.find((u) => u.username !== CUENTA);
    if (!otra) continue;
    await sql`
      INSERT INTO social_conversaciones (igsid, conversation_id, usuario, actualizado_ig, sincronizado)
      VALUES (${otra.id}, ${c.id}, ${otra.username}, ${c.updated_time}, NOW())
      ON CONFLICT (igsid) DO UPDATE SET conversation_id = EXCLUDED.conversation_id, usuario = EXCLUDED.usuario,
        actualizado_ig = EXCLUDED.actualizado_ig, sincronizado = NOW()`;
    const cambio = fechaIg(c.updated_time) > (previo.get(otra.id) ?? 0);
    if (cambio && traidas < topeConversaciones) {
      await sincronizarMensajes(otra.id, c.id);
      traidas++;
    }
  }
  await fijarAjuste("chats_sync", new Date().toISOString());
  return { conversaciones: convs.length, traidas };
}

/** Trae los últimos mensajes de una conversación y guarda los que faltan. */
export async function sincronizarMensajes(igsid: string, conversationId?: string) {
  if (!conversationId) {
    const { rows } = await sql`SELECT conversation_id FROM social_conversaciones WHERE igsid = ${igsid}`;
    conversationId = rows[0]?.conversation_id;
    if (!conversationId) {
      const r = await ig.conversaciones(25);
      const c = r.find((x) => x.participants?.data.some((u) => u.id === igsid));
      if (!c) return 0;
      conversationId = c.id;
      const otra = c.participants!.data.find((u) => u.id === igsid)!;
      await sql`INSERT INTO social_conversaciones (igsid, conversation_id, usuario, actualizado_ig)
        VALUES (${igsid}, ${c.id}, ${otra.username}, ${c.updated_time}) ON CONFLICT (igsid) DO NOTHING`;
    }
  }
  const ms = await ig.mensajes(conversationId, 30);
  const { rows } = await sql`SELECT id FROM social_mensajes WHERE igsid = ${igsid}`;
  const vistos = new Set(rows.map((r) => r.id as string));
  let nuevos = 0;
  for (const m of ms) {
    if (vistos.has(m.id)) continue;
    const nuestro = m.from?.username === CUENTA;
    let origen: "agente" | "victor" | "persona" = nuestro ? "agente" : "persona";
    if (nuestro && m.message) {
      // Un mensaje que Victor mandó desde el panel se guardó con id provisional: se reemplaza por el real.
      const { rowCount } = await sql`DELETE FROM social_mensajes WHERE igsid = ${igsid} AND id LIKE 'victor-%'
        AND texto = ${m.message} AND ts > NOW() - INTERVAL '1 day'`;
      if ((rowCount ?? 0) > 0) origen = "victor";
    }
    await guardarMensaje({ id: m.id, igsid, texto: m.message ?? null, nuestro, ts: m.created_time, origen });
    nuevos++;
  }
  await sql`UPDATE social_conversaciones SET mensajes_hasta = NOW() WHERE igsid = ${igsid}`;
  return nuevos;
}
