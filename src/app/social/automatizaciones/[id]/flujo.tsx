"use client";

import type { Textos } from "@/lib/social/tipos";

/**
 * El flujo de mensajes dibujado como diagrama (pregunta → 3 ramas), con cada
 * texto editable en su sitio. Los botones llevan contador: Meta corta en 20.
 */
function Campo({ etiqueta, valor, onCambio, max, filas = 2 }: { etiqueta: string; valor: string; onCambio: (v: string) => void; max: number; filas?: number }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[#55635C]">
      <span className="flex justify-between">{etiqueta}<span>{valor.length}/{max}</span></span>
      {filas > 1 ? (
        <textarea value={valor} maxLength={max} rows={filas} onChange={(e) => onCambio(e.target.value)} className="rounded-lg border border-[#D5DAD2] px-2.5 py-2 text-sm text-[var(--tinta)]" />
      ) : (
        <input value={valor} maxLength={max} onChange={(e) => onCambio(e.target.value)} className="rounded-lg border border-[#D5DAD2] px-2.5 py-2 text-sm text-[var(--tinta)]" />
      )}
    </label>
  );
}

export function Flujo({ t, onCambio }: { t: Textos; onCambio: (t: Textos) => void }) {
  const set = <K extends keyof Textos>(k: K, v: Textos[K]) => onCambio({ ...t, [k]: v });
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md rounded-2xl border-2 border-[var(--verde)] bg-[#F7FBEF] p-3.5">
        <p className="mb-2 text-[11px] font-bold tracking-wide text-[var(--verde)]">MENSAJE PRIVADO · AL COMENTAR</p>
        <Campo etiqueta="Pregunta" valor={t.pregunta} onCambio={(v) => set("pregunta", v)} max={600} />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Campo etiqueta="Botón 1" valor={t.botonSi} onCambio={(v) => set("botonSi", v)} max={20} filas={1} />
          <Campo etiqueta="Botón 2" valor={t.botonNo} onCambio={(v) => set("botonNo", v)} max={20} filas={1} />
          <Campo etiqueta="Botón 3" valor={t.botonAliado} onCambio={(v) => set("botonAliado", v)} max={20} filas={1} />
        </div>
      </div>
      <div className="h-5 w-0.5 bg-[#8C9A93]" />
      <div className="grid w-full gap-3 lg:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-2xl border border-[#E3E6E0] p-3.5">
          <b className="text-sm text-[var(--verde)]">{t.botonSi}</b>
          <Campo etiqueta="Mensaje" valor={t.si} onCambio={(v) => set("si", v)} max={600} />
          <p className="text-xs font-semibold">Tarjeta → landing de la publicación</p>
          <Campo etiqueta="Título" valor={t.tarjetaSi.titulo} onCambio={(v) => set("tarjetaSi", { ...t.tarjetaSi, titulo: v })} max={80} filas={1} />
          <Campo etiqueta="Subtítulo" valor={t.tarjetaSi.subtitulo} onCambio={(v) => set("tarjetaSi", { ...t.tarjetaSi, subtitulo: v })} max={80} filas={1} />
          <Campo etiqueta="Botón de la tarjeta" valor={t.tarjetaSi.boton} onCambio={(v) => set("tarjetaSi", { ...t.tarjetaSi, boton: v })} max={20} filas={1} />
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-[#E3E6E0] p-3.5">
          <b className="text-sm text-[var(--verde)]">{t.botonNo}</b>
          <Campo etiqueta="Mensaje" valor={t.no} onCambio={(v) => set("no", v)} max={600} />
          <p className="rounded-lg bg-[#F4F5F1] p-2.5 text-xs text-[#33413A]">Jev lee lo que responda: si cuenta de un negocio → rama 1; si busca al aliado → rama 3; si no está seguro → te llega a ti.</p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-[#E3E6E0] p-3.5">
          <b className="text-sm text-[var(--verde)]">{t.botonAliado}</b>
          <Campo etiqueta="Mensaje" valor={t.aliado} onCambio={(v) => set("aliado", v)} max={600} />
          <Campo etiqueta="Título de la tarjeta" valor={t.tarjetaAliado.titulo} onCambio={(v) => set("tarjetaAliado", { ...t.tarjetaAliado, titulo: v })} max={80} filas={1} />
          <Campo etiqueta="Enlace (perfil o web del aliado)" valor={t.tarjetaAliado.url} onCambio={(v) => set("tarjetaAliado", { ...t.tarjetaAliado, url: v })} max={300} filas={1} />
          <Campo etiqueta="Botón de la tarjeta" valor={t.tarjetaAliado.boton} onCambio={(v) => set("tarjetaAliado", { ...t.tarjetaAliado, boton: v })} max={20} filas={1} />
        </div>
      </div>
    </div>
  );
}
