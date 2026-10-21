"use client";

import { useEffect, useRef, useState } from "react";
import { SECCIONES, type Respuestas, type Valores } from "@/lib/arranque/esquema";
import { avance, seccionCompleta } from "@/lib/arranque/validar";
import { BarraAvance } from "@/components/arranque/barra-avance";
import { SeccionCampos } from "@/components/arranque/seccion-campos";
import { SeccionLista } from "@/components/arranque/seccion-lista";
import { Celebracion } from "@/components/arranque/celebracion";
import { ResumenEnvio } from "@/components/arranque/resumen-envio";

/**
 * El formulario de arranque, paso a paso: bienvenida, una pantalla por
 * sección y el resumen para enviar.
 *
 * Se guarda solo (un segundo después de dejar de escribir y al pasar de
 * sección), así se puede cerrar y volver con el mismo enlace. «Guardar y
 * seguir» muestra lo que falta; completar una sección por primera vez dispara
 * la celebración. Se puede seguir sin terminar una sección y volver después
 * desde la barra de arriba.
 */
type Guardado = "guardado" | "guardando" | "error" | null;
const N = SECCIONES.length;

export function FormularioArranque({ token, cliente, inicial, enviado: yaEnviado }: { token: string; cliente: string; inicial: Respuestas; enviado: boolean }) {
  const [respuestas, setRespuestas] = useState<Respuestas>(inicial);
  const [paso, setPaso] = useState(() => {
    if (!Object.keys(inicial).length) return 0;
    const i = SECCIONES.findIndex((s) => !seccionCompleta(s, inicial));
    return i < 0 ? N + 1 : i + 1;
  });
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [guardado, setGuardado] = useState<Guardado>(null);
  const [celebrar, setCelebrar] = useState<{ titulo: string; texto: string; final: boolean } | null>(null);
  const [enviado, setEnviado] = useState(yaEnviado);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendiente = useRef<{ seccion: string; valor: Valores | Valores[] } | null>(null);
  const arriba = useRef<HTMLDivElement>(null);

  const { completas, porcentaje } = avance(respuestas);
  const nombre = cliente.split(" ")[0];

  async function guardar(): Promise<boolean> {
    if (temporizador.current) clearTimeout(temporizador.current);
    const p = pendiente.current;
    if (!p) return true;
    pendiente.current = null;
    setGuardado("guardando");
    const res = await fetch("/api/arranque", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, seccion: p.seccion, valor: p.valor }),
    }).catch(() => null);
    setGuardado(res?.ok ? "guardado" : "error");
    if (!res?.ok) pendiente.current = pendiente.current ?? p;
    return Boolean(res?.ok);
  }

  // Si cierra la pestaña con algo sin guardar, se intenta enviar igual.
  useEffect(() => {
    const salir = () => {
      const p = pendiente.current;
      if (p) navigator.sendBeacon?.("/api/arranque", new Blob([JSON.stringify({ token, ...p })], { type: "application/json" }));
    };
    window.addEventListener("pagehide", salir);
    return () => window.removeEventListener("pagehide", salir);
  }, [token]);

  function cambiar(seccion: string, valor: Valores | Valores[]) {
    setRespuestas((r) => ({ ...r, [seccion]: valor }));
    pendiente.current = { seccion, valor };
    setGuardado(null);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(guardar, 1000);
  }

  async function ir(i: number) {
    await guardar();
    setMostrarErrores(false);
    setPaso(i);
    arriba.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function guardarYSeguir() {
    const s = SECCIONES[paso - 1];
    const estabaCompleta = completas.includes(s.id);
    if (!seccionCompleta(s, respuestas)) {
      setMostrarErrores(true);
      setTimeout(() => document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }
    await guardar();
    if (!estabaCompleta) {
      const final = avance(respuestas).completas.length === N;
      setCelebrar({ titulo: final ? `¡Lo lograste, ${nombre}!` : "¡Sección completa!", texto: s.logro, final });
    } else ir(paso + 1);
  }

  async function enviar() {
    await guardar();
    setEnviando(true);
    setErrorEnvio(null);
    const res = await fetch("/api/arranque/enviar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setEnviando(false);
    if (res?.ok) setEnviado(true);
    else setErrorEnvio(json.error ?? "Sin conexión. Intenta de nuevo.");
  }

  if (enviado) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16 text-center">
        <div aria-hidden="true" className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[var(--lima)] text-[38px] font-black text-[var(--verde)]">✓</div>
        <h1 className="mt-6 text-[32px] font-extrabold leading-tight tracking-tight">¡Gracias, {nombre}!</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[#2C3A33]">
          Recibimos toda la información. Con esto empezamos a configurar ServiNomic para tu negocio y te contamos cuando esté lista para la capacitación.
        </p>
      </main>
    );
  }

  const s = paso >= 1 && paso <= N ? SECCIONES[paso - 1] : null;
  const valor = s ? respuestas[s.id] : undefined;

  return (
    <>
      <div ref={arriba} />
      {paso > 0 && <BarraAvance porcentaje={porcentaje} completas={completas} actual={paso} onIr={ir} guardado={guardado} />}
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-5">
        {paso === 0 && (
          <div className="pt-6">
            <p className="mono text-[var(--verde)]">Arranque de ServiNomic</p>
            <h1 className="mt-3 text-[34px] font-extrabold leading-[1.08] tracking-tight [text-wrap:balance]">Hola {nombre}, armemos tu cuenta juntos</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-[#2C3A33]">
              Son {N} pasos cortos sobre tu negocio, tu equipo y tus clientes. Con esto dejamos ServiNomic configurado a tu manera.
            </p>
            <ul className="mt-6 flex flex-col gap-2 text-[15.5px]">
              <li>✓ Se guarda solo: puedes cerrar y seguir después con este mismo enlace.</li>
              <li>✓ Si no sabes algo, sigue adelante y lo completas luego.</li>
              <li>✓ Para listas largas puedes subir un Excel.</li>
            </ul>
            <ol className="mt-6 grid gap-2 sm:grid-cols-2">
              {SECCIONES.map((x, i) => (
                <li key={x.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-[14.5px]">
                  <span className="mono grid h-7 w-7 flex-none place-items-center rounded-full bg-[#EEF2EF] text-[13px] text-[var(--verde)]">{i + 1}</span>
                  {x.titulo}
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => ir(1)} className="mt-8 min-h-13 w-full cursor-pointer rounded-xl bg-[var(--lima)] px-6 py-4 text-[17px] font-extrabold text-[var(--tinta)] sm:w-auto">
              Empezar
            </button>
          </div>
        )}

        {s && (
          <div>
            <p className="mono text-[var(--verde)]">
              Paso {paso} de {N}
            </p>
            <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-tight">{s.titulo}</h1>
            <p className="mt-2 text-[16px] leading-relaxed text-[#2C3A33]">{s.intro}</p>
            <div className="mt-7">
              {s.tipo === "lista" ? (
                <SeccionLista seccion={s} valor={Array.isArray(valor) ? valor : []} onCambio={(v) => cambiar(s.id, v)} mostrarErrores={mostrarErrores} />
              ) : (
                <SeccionCampos seccion={s} valor={valor && !Array.isArray(valor) ? valor : {}} onCambio={(v) => cambiar(s.id, v)} mostrarErrores={mostrarErrores} />
              )}
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="button" onClick={guardarYSeguir} className="min-h-13 cursor-pointer rounded-xl bg-[var(--verde)] px-7 py-4 text-[16px] font-bold text-white">
                Guardar y seguir
              </button>
              <button type="button" onClick={() => ir(paso + 1)} className="cursor-pointer text-[14.5px] text-[#5A6B63] underline underline-offset-2">
                Lo completo después
              </button>
              {paso > 1 && (
                <button type="button" onClick={() => ir(paso - 1)} className="cursor-pointer text-[14.5px] text-[#5A6B63] underline underline-offset-2 sm:ml-auto">
                  Volver
                </button>
              )}
            </div>
          </div>
        )}

        {paso === N + 1 && <ResumenEnvio respuestas={respuestas} completas={completas} onIr={ir} onEnviar={enviar} enviando={enviando} error={errorEnvio} />}
      </main>

      {celebrar && (
        <Celebracion
          titulo={celebrar.titulo}
          texto={celebrar.texto}
          porcentaje={porcentaje}
          final={celebrar.final}
          onSeguir={() => {
            setCelebrar(null);
            ir(celebrar.final ? N + 1 : paso + 1);
          }}
        />
      )}
    </>
  );
}
