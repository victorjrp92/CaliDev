"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ItemAtender } from "@/lib/social/consultas";
import { TipoJev } from "../ui/tipo";

/** Un caso por atender con su borrador editable. Los mensajes directos se responden desde Chats. */
export function ItemPorAtender({ i }: { i: ItemAtender }) {
  const router = useRouter();
  const [texto, setTexto] = useState(i.borrador ?? "");
  const [estado, setEstado] = useState<"" | "enviando" | "error">("");

  async function accion(nombre: "aprobar" | "descartar" | "reintentar") {
    setEstado("enviando");
    const r = await fetch(`/api/social/comentarios/${i.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: nombre, texto }),
    });
    setEstado(r.ok ? "" : "error");
    if (r.ok) router.refresh();
  }

  return (
    <article className="flex flex-col gap-2.5 rounded-2xl border border-[#E3E6E0] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <b>@{i.usuario}</b>
        {i.clase === "mensaje" ? (
          <span className="rounded-md bg-[#E9F3FF] px-2 py-0.5 text-xs font-semibold text-[#1F4E8C]">Mensaje directo</span>
        ) : i.estado === "alerta" ? (
          <span className="rounded-md bg-[#FBE4DE] px-2 py-0.5 text-xs font-semibold text-[#8F2E1B]">Ofensa o spam · no se respondió</span>
        ) : i.estado === "error" ? (
          <span className="rounded-md bg-[#FBE4DE] px-2 py-0.5 text-xs font-semibold text-[#8F2E1B]">Error al publicar</span>
        ) : (
          <TipoJev tipo={i.tipo} confianza={i.confianza} />
        )}
        {i.publicacion && <span className="text-xs text-[#55635C]">en {i.publicacion}</span>}
        <span className="ml-auto text-xs text-[#55635C]">{i.cuando}</span>
      </div>
      <p className="text-[16px]">«{i.texto}»</p>
      {i.error && <p className="text-xs text-[#8F2E1B]">{i.error}</p>}

      {i.clase === "mensaje" ? (
        <Link href={`/social/chats?p=${i.igsid}`} className="w-fit rounded-xl bg-[var(--verde)] px-4 py-2.5 text-sm font-semibold text-white">
          Responder en Chats
        </Link>
      ) : i.estado === "alerta" ? (
        <button onClick={() => accion("descartar")} className="w-fit cursor-pointer rounded-xl border border-[#D5DAD2] px-4 py-2.5 text-sm">
          Entendido
        </button>
      ) : (
        <>
          <label htmlFor={`r-${i.id}`} className="text-xs text-[#55635C]">Respuesta propuesta · puedes editarla</label>
          <textarea
            id={`r-${i.id}`}
            value={texto}
            maxLength={300}
            onChange={(e) => setTexto(e.target.value)}
            className="min-h-[70px] w-full rounded-xl border border-[#D5DAD2] px-3 py-2.5 text-[15px]"
          />
          <div className="flex flex-wrap gap-2">
            <button
              disabled={estado === "enviando" || !texto.trim()}
              onClick={() => accion(i.estado === "error" ? "reintentar" : "aprobar")}
              className="min-h-11 cursor-pointer rounded-xl bg-[var(--verde)] px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {estado === "enviando" ? "Publicando…" : "Responder en Instagram"}
            </button>
            <button onClick={() => accion("descartar")} className="min-h-11 cursor-pointer rounded-xl border border-[#D5DAD2] px-4 text-sm">
              Descartar
            </button>
            {estado === "error" && <span role="alert" className="self-center text-sm text-[#B42318]">No se pudo publicar. Revisa Ajustes → Eventos.</span>}
          </div>
        </>
      )}
    </article>
  );
}
