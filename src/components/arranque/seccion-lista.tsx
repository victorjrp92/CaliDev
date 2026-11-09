"use client";

import { useEffect, useRef, useState } from "react";
import type { Seccion, Valores } from "@/lib/arranque/esquema";
import { erroresValores, errorCampo, visible } from "@/lib/arranque/validar";
import { aplicarEleccion, elegidos } from "@/lib/arranque/elegir";
import { Campo } from "@/components/arranque/campo";
import { SubirExcel } from "@/components/arranque/subir-excel";

/**
 * Una lista (servicios, equipo, clientes) como tarjetas: la que se edita va
 * abierta; las demás, cerradas con su nombre y una marca de lista o de
 * «Falta completar». El contador de arriba es parte del juego: ver crecer la
 * lista anima a terminarla.
 *
 * Si la lista se arma eligiendo (`item.elegir`), arriba se marcan todas las
 * opciones de una vez y cada una aparece debajo como tarjeta, ya con sus
 * valores por defecto; «Listo con este» abre la siguiente por completar.
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
  const item = s.item!;
  const eleccion = item.elegir;
  const [abierta, setAbierta] = useState<number | null>(valor.length || eleccion ? null : 0);
  const items = valor.length || eleccion ? valor : abierta === 0 ? [{}] : [];
  const completos = items.filter((it) => Object.keys(erroresValores(s.campos, it)).length === 0).length;
  // Lo desmarcado se aparta aquí, para devolverlo tal cual si se vuelve a marcar.
  const apartados = useRef<Record<string, Valores>>({});
  // Solo se desplaza la vista al pasar de una tarjeta a la siguiente, nunca mientras se marcan opciones.
  const desplazar = useRef(false);

  useEffect(() => {
    if (!desplazar.current || abierta === null) return;
    desplazar.current = false;
    document.getElementById(`${s.id}-tarjeta-${abierta}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [abierta, s.id]);

  const sinErrores = (it: Valores) => Object.keys(erroresValores(s.campos, it)).length === 0;
  const cambiar = (i: number, v: Valores) => onCambio(items.map((x, j) => (j === i ? v : x)));
  const quitar = (i: number) => {
    const v = eleccion ? items[i][eleccion.campo] : undefined;
    if (typeof v === "string" && v) apartados.current[v] = items[i];
    onCambio(items.filter((_, j) => j !== i));
    setAbierta(null);
  };
  const agregar = () => {
    onCambio([...items, {}]);
    setAbierta(items.length);
  };
  const listo = (i: number) => {
    if (!eleccion) return setAbierta(null);
    const siguiente = [...items.keys()].map((k) => (i + 1 + k) % items.length).find((k) => k !== i && !sinErrores(items[k]));
    desplazar.current = siguiente !== undefined;
    setAbierta(siguiente ?? null);
  };
  const elegir = (seleccion: string[]) => {
    if (!eleccion) return;
    const r = aplicarEleccion(items, seleccion, eleccion.campo, eleccion.alElegir, apartados.current);
    apartados.current = r.apartados;
    onCambio(r.items);
    // La tarjeta abierta sigue abierta aunque cambie de posición; si no había, se abre la primera nueva.
    const actual = abierta === null ? -1 : r.items.indexOf(items[abierta]);
    const primeraNueva = r.items.findIndex((it) => !items.includes(it));
    setAbierta(actual >= 0 ? actual : primeraNueva >= 0 ? primeraNueva : null);
  };
  const base = eleccion ? s.campos.find((c) => c.id === eleccion.campo) : undefined;

  return (
    <div className="flex flex-col gap-3">
      {eleccion && base && (
        <div className="mb-3">
          <Campo
            campo={{ id: eleccion.campo, etiqueta: eleccion.etiqueta, ayuda: eleccion.ayuda, tipo: "opciones", requerido: true, opciones: base.opciones }}
            idBase={`${s.id}-elegir`}
            valor={elegidos(items, eleccion.campo)}
            error={mostrarErrores && !items.length ? `Marca al menos un ${item.singular}.` : null}
            onCambio={(v) => elegir(Array.isArray(v) ? v : [v])}
          />
        </div>
      )}

      {(!eleccion || items.length > 0) && (
        <p className="mono text-[13px] text-[var(--verde)]">
          {completos} {completos === 1 ? item.singular : item.plural} {(item.femenino ? "lista" : "listo") + (completos === 1 ? "" : "s")}
          {items.length > completos && ` · ${items.length - completos} por completar`}
        </p>
      )}

      {items.map((it, i) => {
        const errores = erroresValores(s.campos, it);
        const ok = Object.keys(errores).length === 0;
        const titulo = (typeof it[item.tituloDe] === "string" && (it[item.tituloDe] as string).trim()) || `${item.singular.charAt(0).toUpperCase() + item.singular.slice(1)} ${i + 1}`;
        if (abierta !== i) {
          return (
            <button
              key={i}
              id={`${s.id}-tarjeta-${i}`}
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
        // Con elección, la opción elegida es el título de la tarjeta: no se repite dentro.
        const yaElegida = (id: string) => eleccion?.campo === id && typeof it[id] === "string" && it[id] !== "";
        return (
          <div key={i} id={`${s.id}-tarjeta-${i}`} className="scroll-mt-24 rounded-2xl border-[1.5px] border-[var(--verde)] bg-white p-4 sm:p-5">
            {eleccion && <h2 className="mb-4 text-[18px] font-bold">{titulo}</h2>}
            <div className="flex flex-col gap-5">
              {s.campos
                .filter((c) => visible(c, it) && !yaElegida(c.id))
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
              <button type="button" onClick={() => listo(i)} className="min-h-11 cursor-pointer rounded-xl bg-[var(--verde)] px-5 text-[15px] font-bold text-white">
                Listo con {ok ? "este" : "este por ahora"}
              </button>
              <button type="button" onClick={() => quitar(i)} className="cursor-pointer text-[14px] text-[#8C948D] underline underline-offset-2">
                Quitar
              </button>
            </div>
          </div>
        );
      })}

      {!eleccion && (
        <button
          type="button"
          onClick={agregar}
          className="min-h-12 cursor-pointer rounded-2xl border-[1.5px] border-dashed border-[var(--verde)] bg-white text-[15px] font-bold text-[var(--verde)]"
        >
          + Agregar {item.singular}
        </button>
      )}
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
