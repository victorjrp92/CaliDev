"use client";

import { useEffect, useRef, useState } from "react";
import { PasoNegocio } from "@/components/delegar/paso-negocio";
import { PasoContacto } from "@/components/delegar/paso-contacto";
import { PasoCambio } from "@/components/delegar/paso-cambio";
import { SinNegocio } from "@/components/delegar/sin-negocio";
import { Confirmacion } from "@/components/delegar/confirmacion";
import { codigoSocial } from "@/components/social/SeguimientoSocial";
import { ISO_POR_DEFECTO, indicativoPorIso } from "@/lib/indicativos";
import { numeroNacional } from "@/lib/delegar/telefono";
import type { ClaveDelegar } from "@/lib/delegar/preguntas";
import {
  erroresPaso1,
  erroresPaso2,
  erroresPaso3,
  idEnfocable,
  utmDeLaUrl,
  type DatosDelegar,
  type Errores,
} from "@/lib/delegar/formulario";

type Etapa = 1 | 2 | 3 | "sin-negocio" | "listo";
type Lead = { id: number; token: string };

const INICIAL: DatosDelegar = {
  respuestas: {},
  actividad: "",
  dolorOtro: "",
  herramientasOtro: "",
  nombre: "",
  iso: ISO_POR_DEFECTO,
  numero: "",
  correo: "",
  empresa: "",
};

/**
 * Formulario de tres pasos, en `#registro`.
 *
 * ── Qué se guarda y cuándo ──
 *
 * Nada hasta pulsar «Guardar mis datos y continuar» en el paso 2. Ahí se crea
 * la solicitud, incompleta. El paso 3 completa ESA MISMA solicitud. Volver al
 * paso 2 —con «Atrás» o con «Corregir mi número»— la actualiza en vez de crear
 * otra. Mientras hay una petición en curso el botón no responde, así que un
 * doble toque tampoco duplica.
 *
 * ── Qué pasa si falla ──
 *
 * Se queda en el mismo paso, con todo lo escrito, y dice que lo intente de
 * nuevo. Nunca se muestra la confirmación si el servidor no la dio.
 *
 * Las respuestas viven solo en memoria: al recargar se pierden. Guardarlas en
 * el navegador sería guardar datos personales sin necesidad.
 */
export function Formulario({ campaign }: { campaign: string }) {
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [datos, setDatos] = useState<DatosDelegar>(INICIAL);
  const [errores, setErrores] = useState<Errores>({});
  const [lead, setLead] = useState<Lead | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [corrigiendo, setCorrigiendo] = useState(false);

  const enCurso = useRef(false);
  const seccion = useRef<HTMLElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeraVez = useRef(true);
  const empezo = useRef(false);

  /**
   * Avisa al mapa de calor en qué paso va (1 empezó · 2 datos de contacto ·
   * 3 guardó el contacto · 4 completó). Solo el número: nunca lo escrito.
   */
  const avisarPaso = (n: number) => window.dispatchEvent(new CustomEvent("social:paso", { detail: n }));
  useEffect(() => {
    const n = etapa === 2 ? 2 : etapa === 3 ? 3 : etapa === "listo" ? 4 : 0;
    if (n) avisarPaso(n);
  }, [etapa]);

  // Al cambiar de paso: la vista arranca arriba del paso nuevo y el foco va a
  // su título. No en la primera carga, que no debe mover la página.
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    seccion.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    titulo.current?.focus({ preventScroll: true });
  }, [etapa]);

  const quitarError = (clave: string) =>
    setErrores((prev) => {
      if (!prev[clave]) return prev;
      const resto = { ...prev };
      delete resto[clave];
      return resto;
    });

  const respuesta = (clave: ClaveDelegar, valor: string) => {
    if (!empezo.current) {
      empezo.current = true;
      avisarPaso(1);
    }
    setDatos((d) => ({ ...d, respuestas: { ...d.respuestas, [clave]: valor } }));
    quitarError(`d-${clave}`);
  };

  const campo = (nombre: keyof Omit<DatosDelegar, "respuestas">, valor: string) => {
    setDatos((d) => ({ ...d, [nombre]: valor }));
    const ids: Record<string, string> = {
      actividad: "d-actividad",
      dolorOtro: "d-dolor-otro",
      herramientasOtro: "d-herramientas-otro",
      nombre: "d-nombre",
      numero: "d-numero",
      iso: "d-numero",
      correo: "d-correo",
    };
    if (ids[nombre]) quitarError(ids[nombre]);
  };

  /** Enseña los errores y lleva el foco al primero. Devuelve si había alguno. */
  const hayErrores = (e: Errores) => {
    setErrores(e);
    const primero = Object.keys(e)[0];
    if (!primero) return false;
    requestAnimationFrame(() => {
      const el = document.getElementById(idEnfocable(primero));
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return true;
  };

  async function pedir(metodo: "POST" | "PATCH", cuerpo: Record<string, unknown>) {
    const res = await fetch("/api/leads/delegar", {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) throw new Error(json.error || "error");
    return json;
  }

  const paso1 = () => ({
    rol: datos.respuestas.rol,
    dolor: datos.respuestas.dolor,
    tamano: datos.respuestas.tamano,
    actividad: datos.actividad,
    dolor_otro: datos.dolorOtro,
  });

  const contacto = () => ({
    nombre: datos.nombre,
    pais_iso: datos.iso,
    numero: datos.numero,
    correo: datos.correo,
  });

  function continuarPaso1() {
    if (hayErrores(erroresPaso1(datos))) return;
    setEtapa(datos.respuestas.rol === "ninguna" ? "sin-negocio" : 2);
  }

  async function guardarContacto() {
    if (enCurso.current) return;
    if (hayErrores(erroresPaso2(datos))) return;

    enCurso.current = true;
    setEnviando(true);
    setErrorServidor(null);
    try {
      if (lead) {
        await pedir("PATCH", { accion: "contacto", ...lead, ...contacto(), respuestas: paso1() });
      } else {
        const r = await pedir("POST", {
          campaign,
          utm: utmDeLaUrl(location.search),
          social_codigo: codigoSocial(),
          ...contacto(),
          respuestas: paso1(),
        });
        setLead({ id: r.id, token: r.token });
      }
      setEtapa(corrigiendo ? "listo" : 3);
      setCorrigiendo(false);
    } catch {
      setErrorServidor(
        "No pudimos guardar tus datos. Revisa tu conexión y pulsa el botón otra vez: lo que escribiste sigue aquí."
      );
    } finally {
      enCurso.current = false;
      setEnviando(false);
    }
  }

  async function enviarPaso3() {
    if (enCurso.current) return;
    if (hayErrores(erroresPaso3(datos))) return;
    if (!lead) return setEtapa(2);

    enCurso.current = true;
    setEnviando(true);
    setErrorServidor(null);
    try {
      await pedir("PATCH", {
        accion: "completar",
        ...lead,
        empresa: datos.empresa,
        respuestas: {
          herramientas: datos.respuestas.herramientas,
          herramientas_otro: datos.herramientasOtro,
          busca: datos.respuestas.busca,
          plazo: datos.respuestas.plazo,
        },
      });
      setEtapa("listo");
    } catch {
      setErrorServidor(
        "No pudimos enviar tu solicitud. Tus respuestas siguen aquí: pulsa «Enviar mi solicitud» otra vez."
      );
    } finally {
      enCurso.current = false;
      setEnviando(false);
    }
  }

  const irA = (e: Etapa) => {
    setErrores({});
    setErrorServidor(null);
    setEtapa(e);
  };

  const whatsappVisible = `${indicativoPorIso(datos.iso)?.codigo ?? ""} ${numeroNacional(datos.iso, datos.numero)}`.trim();

  return (
    <section id="registro" ref={seccion} className="mx-auto max-w-xl scroll-mt-16 px-5 py-10">
      <h2 className="text-[26px] font-extrabold leading-tight tracking-tight">
        Cuéntanos qué depende hoy de ti
      </h2>
      <p className="mt-2.5 text-[16px] leading-relaxed text-[#2C3A33]">
        Tus respuestas nos ayudan a entender tu negocio y preparar una conversación útil.
      </p>

      <div className="mt-5 rounded-3xl border border-[#D8DCD4] bg-white p-5 shadow-[0_4px_20px_rgba(21,33,28,0.06)] sm:p-7">
        {etapa === 1 && (
          <PasoNegocio
            ref={titulo}
            datos={datos}
            errores={errores}
            onRespuesta={respuesta}
            onCampo={campo}
            onContinuar={continuarPaso1}
          />
        )}
        {etapa === "sin-negocio" && <SinNegocio ref={titulo} onCorregir={() => irA(1)} />}
        {etapa === 2 && (
          <PasoContacto
            ref={titulo}
            datos={datos}
            errores={errores}
            enviando={enviando}
            errorServidor={errorServidor}
            corrigiendo={corrigiendo}
            onCampo={campo}
            onGuardar={guardarContacto}
            onAtras={() => {
              setCorrigiendo(false);
              irA(corrigiendo ? "listo" : 1);
            }}
          />
        )}
        {etapa === 3 && (
          <PasoCambio
            ref={titulo}
            datos={datos}
            errores={errores}
            enviando={enviando}
            errorServidor={errorServidor}
            onRespuesta={respuesta}
            onCampo={campo}
            onEnviar={enviarPaso3}
            onAtras={() => irA(2)}
          />
        )}
        {etapa === "listo" && (
          <Confirmacion
            ref={titulo}
            nombre={datos.nombre}
            whatsapp={whatsappVisible}
            onCorregir={() => {
              setCorrigiendo(true);
              irA(2);
            }}
          />
        )}
      </div>
      <p className="mt-3 text-center text-[12.5px] text-[#55635C]">
        Medimos cómo se usa esta página para mejorarla. No guardamos tu IP ni lo que escribes hasta que lo envías.
      </p>
    </section>
  );
}
