"use client";

import { SECCIONES, type Respuestas } from "@/lib/arranque/esquema";

/**
 * Último paso: qué secciones están listas y cuáles faltan, con un botón para
 * ir a cada una. «Enviar a CaliDev» solo aparece con todo completo.
 */
export function ResumenEnvio({
  respuestas,
  completas,
  onIr,
  onEnviar,
  enviando,
  error,
}: {
  respuestas: Respuestas;
  completas: string[];
  onIr: (i: number) => void;
  onEnviar: () => void;
  enviando: boolean;
  error: string | null;
}) {
  const todo = completas.length === SECCIONES.length;
  return (
    <div>
      <p className="mono text-[var(--verde)]">Último paso</p>
      <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-tight">{todo ? "Todo listo para enviar" : "Ya casi"}</h1>
      <p className="mt-2 text-[16px] leading-relaxed text-[#2C3A33]">
        {todo ? "Revisa que todo esté bien y envíanoslo. Con esto empezamos a configurar tu cuenta." : "Te faltan estas secciones. Toca una para completarla."}
      </p>
      <ul className="mt-6 flex flex-col gap-2">
        {SECCIONES.map((s, i) => {
          const ok = completas.includes(s.id);
          const v = respuestas[s.id];
          const cuantos = Array.isArray(v) ? v.length : null;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onIr(i + 1)}
                className={`flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border-[1.5px] bg-white px-4 text-left ${ok ? "border-[#CFE7DA]" : "border-[#F0D9A0]"}`}
              >
                <span className="flex items-center gap-3">
                  <span aria-hidden="true" className={`grid h-7 w-7 place-items-center rounded-full text-[13px] font-bold ${ok ? "bg-[var(--verde)] text-[var(--lima)]" : "bg-[#FDF3D8] text-[#6B4E00]"}`}>
                    {ok ? "✓" : i + 1}
                  </span>
                  <span className="font-semibold">
                    {s.titulo}
                    {cuantos !== null && cuantos > 0 && <span className="font-normal text-[#5A6B63]"> · {cuantos} {cuantos === 1 ? s.item?.singular : s.item?.plural}</span>}
                  </span>
                </span>
                <span className="text-[13px] text-[#5A6B63]">{ok ? "Revisar" : "Completar"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {todo && (
        <button type="button" onClick={onEnviar} disabled={enviando} className="mt-6 min-h-13 w-full cursor-pointer rounded-xl bg-[var(--lima)] px-6 py-4 text-[17px] font-extrabold text-[var(--tinta)] disabled:opacity-60">
          {enviando ? "Enviando…" : "Enviar a CaliDev"}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-3 text-[15px] font-semibold text-[#B42318]">
          {error}
        </p>
      )}
    </div>
  );
}
