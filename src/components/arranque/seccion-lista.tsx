"use client";

import { useState } from "react";
import type { Seccion, Valores } from "@/lib/arranque/esquema";
import { erroresValores, errorCampo, visible } from "@/lib/arranque/validar";
import { Campo } from "@/components/arranque/campo";
import { SubirExcel } from "@/components/arranque/subir-excel";

/**
 * Una lista (servicios, equipo, clientes) como tarjetas: la que se edita va
 * abierta; las demás, cerradas con su nombre y una marca de lista o de
 * «Falta completar». El contador de arriba es parte del juego: ver crecer la
 * lista anima a terminarla.
 */
export function SeccionLista({
  seccion: s,
  valor,
  onCambio,
  mostrarErrores,
}: {
  seccion: Seccion;
  valor: Valores[];
  onCambio: (v: Valores[]) => void;
  mostrarErrores: boolean;
}) {
  const [abierta, setAbierta] = useState<number | null>(valor.length ? null : 0);
  const items = valor.length ? valor : abierta === 0 ? [{}] : [];
  const item = s.item!;
  const completos = items.filter((it) => Object.keys(erroresValores(s.campos, it)).length === 0).length;

  const cambiar = (i: number, v: Valores) => onCambio(items.map((x, j) => (j === i ? v : x)));
  const quitar = (i: number) => {
    onCambio(items.filter((_, j) => j !== i));
    setAbierta(null);
  };
  const agregar = () => {
    onCambio([...items, {}]);
    setAbierta(items.length);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="mono text-[13px] text-[var(--verde)]">
        {completos} {completos === 1 ? item.singular : item.plural} {completos === 1 ? "lista" : "listas"}
        {items.length > completos && ` · ${items.length - completos} por completar`}
      </p>

      {items.map((it, i) => {
        const errores = erroresValores(s.campos, it);
        const ok = Object.keys(errores).length === 0;
        const titulo = (typeof it[item.tituloDe] === "string" && (it[item.tituloDe] as string).trim()) || `${item.singular.charAt(0).toUpperCase() + item.singular.slice(1)} ${i + 1}`;
        if (abierta !== i) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => setAbierta(i)}
              className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border-[1.5px] bg-white px-4 text-left ${
                ok ? "border-[#CFE7DA]" : mostrarErrores ? "border-[#D92D20]" : "border-[#F0D9A0]"
              }`}
            >
              <span className="flex items-center gap-3">
                <span aria-hidden="true" className={`grid h-7 w-7 flex-none place-items-center rounded-full text-[13px] font-bold ${ok ? "bg-[var(--verde)] text-[var(--lima)]" : "bg-[#FDF3D8] text-[#6B4E00]"}`}>
                  {ok ? "✓" : "!"}
                </span>
                <span className="font-semibold">{titulo}</span>
              </span>
              <span className="text-[13px] text-[#5A6B63]">{ok ? "Editar" : "Falta completar"}</span>
            </button>
          );
        }
        return (
          <div key={i} className="rounded-2xl border-[1.5px] border-[var(--verde)] bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-5">
              {s.campos
                .filter((c) => visible(c, it))
                .map((c) => (
                  <Campo
                    key={c.id}
                    campo={c}
                    idBase={`${s.id}-${i}`}
                    valor={it[c.id]}
                    error={mostrarErrores ? errorCampo(c, it) : null}
                    onCambio={(v) => cambiar(i, { ...it, [c.id]: v })}
                  />
                ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setAbierta(null)} className="min-h-11 cursor-pointer rounded-xl bg-[var(--verde)] px-5 text-[15px] font-bold text-white">
                Listo con {ok ? "este" : "este por ahora"}
              </button>
              <button type="button" onClick={() => quitar(i)} className="cursor-pointer text-[14px] text-[#8C948D] underline underline-offset-2">
                Quitar
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={agregar}
        className="min-h-12 cursor-pointer rounded-2xl border-[1.5px] border-dashed border-[var(--verde)] bg-white text-[15px] font-bold text-[var(--verde)]"
      >
        + Agregar {item.singular}
      </button>
      {!s.sinExcel && (
        <SubirExcel
          seccion={s}
          onAgregar={(xs) => {
            onCambio([...items.filter((x) => Object.keys(x).length > 0), ...xs]);
            setAbierta(null);
          }}
        />
      )}
    </div>
  );
}
