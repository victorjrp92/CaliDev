import Link from "next/link";
import { conversacionesEspontaneas, fichaPersona, mensajesDe, personasTodas } from "@/lib/social/consultas";
import { fechaHora } from "@/lib/social/fecha";
import { ventanaAbierta } from "@/lib/social/reglas";
import { panelAbierto } from "@/lib/social/sesion";
import { Actualizar } from "./actualizar";
import { Burbujas } from "./burbujas";
import { Editor } from "./editor";
import { FichaPersona } from "./ficha";
import { ListaChats, type ItemChat } from "./lista";

export const dynamic = "force-dynamic";

/**
 * Bandeja de chats. Lee SOLO de la base (la copia de la bandeja se refresca
 * desde el reloj cada 10 min y con «Actualizar»): así carga en menos de un
 * segundo en vez de los 8-9 s que costaba consultar Instagram en cada carga.
 */
export default async function ChatsPage({ searchParams }: { searchParams: Promise<{ p?: string; f?: string }> }) {
  if (!(await panelAbierto())) return null;
  const { p, f } = await searchParams;
  const [personas, espontaneas] = await Promise.all([personasTodas(), conversacionesEspontaneas()]);
  const items: ItemChat[] = [
    ...personas.map((x) => ({ igsid: x.igsid, usuario: x.usuario, ultimo: x.ultimo, ultimoTexto: x.ultimoTexto,
      publicacion: x.publicacion, paso: x.paso, rama: x.rama, espontaneo: false })),
    ...espontaneas.map((x) => ({ ...x, publicacion: null, paso: null, rama: null, espontaneo: true })),
  ].sort((a, b) => b.ultimo.localeCompare(a.ultimo));

  const actual = p && /^\d+$/.test(p) ? p : null;
  const [conv, ficha] = actual ? await Promise.all([mensajesDe(actual), fichaPersona(actual)]) : [null, null];
  const abierta = !!conv?.ultimoDeElla && ventanaAbierta(conv.ultimoDeElla);
  const usuario = items.find((i) => i.igsid === actual)?.usuario;

  return (
    <main className="flex h-[calc(100vh-5rem)] md:h-screen">
      <section className={`w-full shrink-0 border-r border-[#E3E6E0] bg-white md:w-[340px] ${actual ? "hidden md:block" : ""}`}>
        <div className="flex items-center justify-between px-4 pt-5">
          <h1 className="text-[24px] font-extrabold tracking-tight">Chats</h1>
          <Actualizar desde={null} />
        </div>
        <ListaChats items={items} actual={actual} filtro={f ?? "necesitan"} />
      </section>
      {actual && conv ? (
        <>
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-3 border-b border-[#E3E6E0] bg-white px-4 py-3">
              <Link href={`/social/chats?f=${f ?? "necesitan"}`} className="md:hidden">← Volver</Link>
              <b>@{usuario}</b>
              {!abierta && <span className="rounded-md bg-[#FBE4DE] px-2 py-0.5 text-xs text-[#8F2E1B]">Ventana de 24 h cerrada</span>}
              <span className="ml-auto"><Actualizar igsid={actual} desde={conv.sincronizado ? fechaHora(conv.sincronizado) : null} /></span>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#FAFAF7]"><Burbujas mensajes={conv.mensajes} /></div>
            <Editor igsid={actual} ventanaAbierta={abierta} puedeTarjeta={!!ficha} />
          </section>
          <aside className="hidden w-[300px] shrink-0 border-l border-[#E3E6E0] bg-white xl:block">
            {ficha ? <FichaPersona f={ficha} /> : <p className="p-5 text-sm text-[#55635C]">Mensaje directo espontáneo: esta persona no entró por un comentario automatizado. El agente no le responde solo.</p>}
          </aside>
        </>
      ) : (
        <section className="hidden flex-1 place-items-center text-sm text-[#55635C] md:grid">Elige una conversación.</section>
      )}
    </main>
  );
}
