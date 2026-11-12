"use client";

import type { Recurso } from "@/lib/social/tipos";
import { Campo } from "./campo";

/**
 * El flujo «recurso» dibujado como diagrama: privado con botón → (si se exige)
 * ¿te sigue? → entrega. Cada texto se edita en su sitio.
 */
export function FlujoRecurso({ r, onCambio }: { r: Recurso; onCambio: (r: Recurso) => void }) {
  const set = <K extends keyof Recurso>(k: K, v: Recurso[K]) => onCambio({ ...r, [k]: v });
  const Flecha = () => <div className="mx-auto h-5 w-0.5 bg-[#8C9A93]" />;
  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-md rounded-2xl border-2 border-[var(--verde)] bg-[#F7FBEF] p-3.5">
        <p className="mb-2 text-[11px] font-bold tracking-wide text-[var(--verde)]">MENSAJE PRIVADO · AL COMENTAR LA PALABRA CLAVE</p>
        <Campo etiqueta="Mensaje" valor={r.apertura} onCambio={(v) => set("apertura", v)} max={600} />
        <div className="mt-2">
          <Campo etiqueta="Botón" valor={r.botonEnviar} onCambio={(v) => set("botonEnviar", v)} max={20} filas={1} />
        </div>
      </div>
      <Flecha />
      <label className="mx-auto flex w-full max-w-md items-start gap-2 rounded-2xl border border-[#E3E6E0] p-3.5 text-sm">
        <input type="checkbox" className="mt-1" checked={r.exigirSeguir} onChange={(e) => set("exigirSeguir", e.target.checked)} />
        <span><b>Pedir que nos siga antes de enviarlo</b><br />
          <span className="text-xs text-[#55635C]">Instagram nos dice si ya sigue a @calidevdev. Si al segundo «Ya te sigo» todavía no aparece, se le envía igual.</span>
        </span>
      </label>
      <Flecha />
      <div className={`grid w-full gap-3 ${r.exigirSeguir ? "lg:grid-cols-2" : ""}`}>
        {r.exigirSeguir && (
          <div className="flex flex-col gap-2 rounded-2xl border border-[#E3E6E0] p-3.5">
            <b className="text-sm text-[var(--verde)]">Si no nos sigue</b>
            <Campo etiqueta="Le pedimos que nos siga" valor={r.pedirSeguir} onCambio={(v) => set("pedirSeguir", v)} max={600} />
            <Campo etiqueta="Botón" valor={r.botonSeguido} onCambio={(v) => set("botonSeguido", v)} max={20} filas={1} />
            <Campo etiqueta="Si toca el botón y aún no aparece (1.ª vez)" valor={r.reintento} onCambio={(v) => set("reintento", v)} max={600} />
            <p className="rounded-lg bg-[#F4F5F1] p-2.5 text-xs text-[#33413A]">A la 2.ª vez se le envía el recurso sin preguntar más.</p>
          </div>
        )}
        <div className="flex flex-col gap-2 rounded-2xl border border-[#E3E6E0] p-3.5">
          <b className="text-sm text-[var(--verde)]">Entrega</b>
          <Campo etiqueta="Mensaje" valor={r.entrega} onCambio={(v) => set("entrega", v)} max={600} />
          <p className="text-xs font-semibold">Tarjeta → enlace del recurso</p>
          <Campo etiqueta="Título" valor={r.tarjeta.titulo} onCambio={(v) => set("tarjeta", { ...r.tarjeta, titulo: v })} max={80} filas={1} />
          <Campo etiqueta="Subtítulo" valor={r.tarjeta.subtitulo} onCambio={(v) => set("tarjeta", { ...r.tarjeta, subtitulo: v })} max={80} filas={1} />
          <Campo etiqueta="Botón de la tarjeta" valor={r.tarjeta.boton} onCambio={(v) => set("tarjeta", { ...r.tarjeta, boton: v })} max={20} filas={1} />
        </div>
      </div>
      <p className="mt-3 text-xs text-[#55635C]">Preguntas, precios o mensajes largos van a Por atender; la persona sigue en el flujo y recibe el recurso de cada video que comente.</p>
    </div>
  );
}
