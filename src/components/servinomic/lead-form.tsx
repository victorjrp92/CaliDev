"use client";

import { useEffect, useRef, useState } from "react";
import { OptionGroup } from "@/components/servinomic/option-group";
import { CampoTelefono } from "@/components/servinomic/telefono";
import { ISO_POR_DEFECTO, numeroCompleto } from "@/lib/indicativos";
import {
  ASPIRACION_QUESTION,
  STEP_1_QUESTIONS,
  STEP_3_QUESTIONS,
  espejoDe,
  valoresDe,
  type LeadAnswers,
} from "@/lib/leads";

type Phase = "filtro" | "contacto" | "diagnostico" | "listo" | "referido";

const inputClass =
  "h-14 w-full rounded-2xl border-[1.5px] border-[#D8DCD4] bg-white px-4 text-[16px] outline-none transition-colors placeholder:text-[#8C948D] focus:border-[var(--verde)] focus:ring-2 focus:ring-[var(--verde)]/25";

/**
 * Campo con etiqueta VISIBLE encima, no solo marcador de posición.
 *
 * Con solo el marcador, en cuanto la persona escribe la etiqueta desaparece: ya
 * no puede comprobar qué puso en cada casilla, y quien vuelve a revisar antes
 * de enviar se encuentra cuatro cajas con texto y ninguna pista. En un móvil,
 * que es de donde llega este tráfico, es de los motivos más comunes de
 * abandono a mitad de formulario.
 *
 * El obligatorio se marca fuera del marcador por lo mismo: dentro se borra.
 *
 * `autoComplete` no es un detalle. El teléfono ofrece rellenar nombre y correo
 * de un toque, y eso convierte dos campos en uno.
 *
 * 16px de letra y no 15: por debajo de eso iOS hace zoom al enfocar el campo y
 * descoloca la página entera.
 */
function Campo({
  id,
  etiqueta,
  obligatorio = false,
  ayuda,
  ...props
}: {
  id: string;
  etiqueta: string;
  obligatorio?: boolean;
  ayuda?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13.5px] font-semibold">
        {etiqueta}
        {obligatorio && (
          <span className="ml-1 text-[var(--verde)]" aria-hidden="true">
            *
          </span>
        )}
        {obligatorio && <span className="sr-only"> (obligatorio)</span>}
      </label>
      <input
        id={id}
        required={obligatorio}
        aria-describedby={ayuda ? `${id}-ayuda` : undefined}
        className={inputClass}
        {...props}
      />
      {ayuda && (
        <p id={`${id}-ayuda`} className="mt-1.5 text-[12.5px] text-[#77847C]">
          {ayuda}
        </p>
      )}
    </div>
  );
}

/** Validación de correo a ojo de formulario: hay algo, una arroba y un punto. */
const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Formulario de tres pasos.
 *
 * ── Por qué el dolor va primero ──
 *
 * El paso 1 abre preguntando qué le está comiendo la semana, no si tiene
 * empresa. La persona llega desde la historia de Deisy con la motivación en su
 * punto más alto, y ese pico hay que gastarlo en que se reconozca, no en
 * verificar credenciales. Las credenciales siguen estando —rol y tamaño, en
 * tercera y cuarta— y siguen filtrando igual.
 *
 * ── Por qué el contacto va en el paso 2 y no al final ──
 *
 * Si la visitante abandona en el diagnóstico, el lead ya quedó guardado y es
 * contactable, con puntaje parcial. El puntaje se calcula en el servidor — aquí
 * nunca se envía ni se muestra.
 *
 * ── El espejo ──
 *
 * Entre el paso 1 y el 2 se le devuelve lo que acaba de decir, con sus
 * palabras. Antes ahí no pasaba nada: contestaba y le pedían el número. Ese
 * reconocimiento es lo que hace que dar el WhatsApp se sienta como el siguiente
 * paso de una conversación y no como un peaje.
 */
export function LeadForm({
  campaign,
  slots,
  referencia,
}: {
  campaign: string;
  slots: number;
  /** Nombre del cliente del caso, para cerrar el espejo. Opcional. */
  referencia?: string;
}) {
  const [phase, setPhase] = useState<Phase>("filtro");
  const [answers, setAnswers] = useState<LeadAnswers>({});
  const [leadId, setLeadId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contact, setContact] = useState({ name: "", company: "", email: "" });
  const [iso, setIso] = useState(ISO_POR_DEFECTO);
  const [numero, setNumero] = useState("");
  const [referral, setReferral] = useState("");

  // Al cambiar de paso, el encabezado del paso nuevo queda detrás de la barra
  // superior si no se reposiciona el scroll: cada paso tiene distinta altura.
  const sectionRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase]);

  const set = (key: keyof LeadAnswers) => (value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const step1Done = STEP_1_QUESTIONS.every((q) => valoresDe(answers[q.key]).length > 0);
  const step3Done = STEP_3_QUESTIONS.every((q) => valoresDe(answers[q.key]).length > 0);
  const noCompany = answers.role === "empleado" || answers.role === "ninguna";

  const whatsapp = numeroCompleto(iso, numero);
  const contactoOk =
    contact.name.trim().length >= 2 &&
    numero.replace(/\D/g, "").length >= 7 &&
    CORREO_OK.test(contact.email.trim());

  async function post(body: unknown, method: "POST" | "PATCH") {
    const res = await fetch("/api/leads", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error();
    return res.json();
  }

  async function submitContact() {
    setSending(true);
    setError(null);
    try {
      const data = await post(
        { campaign, ...contact, whatsapp, pais_iso: iso, answers },
        "POST"
      );
      setLeadId(data.id);
      setPhase("diagnostico");
    } catch {
      setError("No pudimos guardar tus datos. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  async function submitDiagnostic() {
    setSending(true);
    setError(null);
    try {
      await post({ id: leadId, company: contact.company, answers }, "PATCH");
      setPhase("listo");
    } catch {
      setError("No pudimos guardar tus respuestas. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  async function submitReferral() {
    setSending(true);
    setError(null);
    try {
      await post(
        {
          campaign,
          name: contact.name || "Referido",
          whatsapp: whatsapp || "sin-contacto",
          email: contact.email || null,
          pais_iso: iso,
          referral_contact: referral,
          answers,
        },
        "POST"
      );
      setPhase("listo");
    } catch {
      setError("No pudimos guardar el contacto. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  /**
   * La aspiración se guarda sola, sin botón y sin bloquear nada. Si falla no se
   * le dice: ya envió su solicitud y este dato es un extra nuestro, no suyo.
   */
  function guardarAspiracion(value: string) {
    set("aspiracion")(value);
    if (!leadId) return;
    void post({ id: leadId, answers: { ...answers, aspiracion: value } }, "PATCH").catch(
      () => {}
    );
  }

  const stepIndex = phase === "filtro" ? 1 : phase === "contacto" ? 2 : 3;
  const espejo = espejoDe(answers);
  const arranque = answers.urgency;

  return (
    <section
      id="registro"
      ref={sectionRef}
      className="mx-auto max-w-xl scroll-mt-20 px-5 pb-10"
    >
      {phase !== "listo" && phase !== "referido" && (
        <>
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
            Pidamos tu diagnóstico
          </h2>
          <p className="mt-2.5 text-base text-[#46554D]">
            Seis preguntas, un minuto. Respuesta en 24 horas.
          </p>
        </>
      )}

      <div className="mt-5 rounded-3xl border border-[#D8DCD4] bg-white p-5 shadow-[0_4px_20px_rgba(21,33,28,0.06)] sm:p-6">
        {phase !== "listo" && phase !== "referido" && (
          <div
            className="mb-5 flex gap-1.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={stepIndex}
            aria-label={`Paso ${stepIndex} de 3`}
          >
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                aria-hidden="true"
                className={`h-1 flex-1 rounded-full ${
                  n <= stepIndex ? "bg-[var(--verde)]" : "bg-[#D8DCD4]"
                }`}
              />
            ))}
          </div>
        )}

        {phase === "filtro" && (
          <>
            <Header step="Paso 1 de 3" title="Cuéntanos qué te pasa" />
            <div className="mt-6 flex flex-col gap-7">
              {STEP_1_QUESTIONS.map((question) => (
                <OptionGroup
                  key={question.key}
                  question={question}
                  value={answers[question.key]}
                  onChange={set(question.key)}
                />
              ))}
            </div>
            <Primary
              disabled={!step1Done}
              onClick={() => setPhase(noCompany ? "referido" : "contacto")}
            >
              Ver si encajamos
            </Primary>
          </>
        )}

        {/* Quien no tiene empresa no es descarte: es una vía de referido. Con una
            audiencia mayormente B2C, esto puede rendir más que el registro directo. */}
        {phase === "referido" && (
          <>
            <Header
              step="Casi"
              title="Esto es para quien dirige la operación"
              subtitle="Si conoces a alguien con una empresa de servicios, déjanos por dónde contactarlo. Si se vuelve cliente, hablamos de agradecértelo."
            />
            <div className="mt-5 flex flex-col gap-4">
              <Campo
                id="referido-nombre"
                etiqueta="Tu nombre"
                autoComplete="name"
                placeholder="María Gómez"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
              />
              <CampoTelefono
                iso={iso}
                numero={numero}
                onIso={setIso}
                onNumero={setNumero}
              />
              <div>
                <label
                  htmlFor="referido-empresa"
                  className="mb-1.5 block text-[13.5px] font-semibold"
                >
                  ¿A quién conoces?
                </label>
                <textarea
                  id="referido-empresa"
                  className={`${inputClass} h-auto min-h-24 resize-none py-3.5`}
                  placeholder="Nombre de la empresa y cómo contactarla"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                />
              </div>
            </div>
            {error && <ErrorLine text={error} />}
            <Primary
              disabled={referral.trim().length < 5 || sending}
              onClick={submitReferral}
            >
              {sending ? "Enviando…" : "Enviar contacto"}
            </Primary>
          </>
        )}

        {phase === "contacto" && (
          <>
            {/* El espejo va ARRIBA del título y en verde: es lo primero que se
                lee al llegar al paso, y es lo que convierte pedir el número en
                la continuación de una conversación. */}
            {espejo && (
              <div className="mb-5 rounded-2xl bg-[#E6E8E3] p-4">
                <p className="text-[15px] font-bold leading-snug text-[var(--verde-hondo)]">
                  Encajas.
                </p>
                <p className="mt-1 text-[14.5px] leading-relaxed text-[#2C3A33]">
                  {espejo}
                  {referencia && ` Es exactamente lo que le pasaba a ${referencia}.`}
                </p>
              </div>
            )}
            <Header
              step="Paso 2 de 3"
              title="¿A dónde te escribimos?"
              subtitle={`Te contactamos nosotros. Hay ${slots} cupos abiertos y revisamos cada caso a mano.`}
            />
            <div className="mt-5 flex flex-col gap-4">
              <Campo
                id="contacto-nombre"
                etiqueta="Tu nombre"
                obligatorio
                autoComplete="name"
                placeholder="María Gómez"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
              />
              <CampoTelefono
                iso={iso}
                numero={numero}
                onIso={setIso}
                onNumero={setNumero}
              />
              <Campo
                id="contacto-correo"
                etiqueta="Correo electrónico"
                obligatorio
                type="email"
                inputMode="email"
                autoComplete="email"
                ayuda="Aquí te llega la respuesta en 24 horas, encajemos o no."
                placeholder="maria@empresa.com"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            </div>
            {error && <ErrorLine text={error} />}
            <Primary disabled={!contactoOk || sending} onClick={submitContact}>
              {sending ? "Guardando…" : "Sí, escríbanme"}
            </Primary>
            <p className="mt-3 text-center text-xs text-[#77847C]">
              * Obligatorio. No compartimos tus datos con nadie.
            </p>
          </>
        )}

        {phase === "diagnostico" && (
          <>
            <Header
              step="Paso 3 de 3"
              title="Para llegar preparados"
              subtitle="Con esto llegamos a la conversación sabiendo de qué hablar, en vez de gastarla en preguntas básicas."
            />
            <div className="mt-6 flex flex-col gap-7">
              {STEP_3_QUESTIONS.map((question) => (
                <OptionGroup
                  key={question.key}
                  question={question}
                  value={answers[question.key]}
                  onChange={set(question.key)}
                />
              ))}
              <Campo
                id="contacto-empresa"
                etiqueta="Nombre de tu empresa"
                autoComplete="organization"
                ayuda="Opcional. Para mirarla antes de escribirte."
                placeholder="Servicios del Valle"
                value={contact.company}
                onChange={(e) =>
                  setContact({ ...contact, company: e.target.value })
                }
              />
            </div>
            {error && <ErrorLine text={error} />}
            <Primary disabled={!step3Done || sending} onClick={submitDiagnostic}>
              {sending ? "Enviando…" : "Pedir mi diagnóstico"}
            </Primary>
          </>
        )}

        {/* El final es lo que se recuerda: la regla del pico-final dice que una
            experiencia se juzga por su momento más intenso y por cómo termina.
            Antes terminaba en «si es tu caso, te escribimos», que deja a quien
            acaba de dar su número sin saber si va a saber algo. Ahora dice qué
            llega, cuándo, y por dónde — con el canal que ella misma eligió. */}
        {phase === "listo" && (
          <div className="py-2">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6E8E3] text-3xl text-[#0A3D2E]">
              ✓
            </span>
            <h2 className="mt-5 text-center text-2xl font-extrabold tracking-tight">
              Listo{contact.name.trim() ? `, ${contact.name.trim().split(" ")[0]}` : ""}.
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-center text-[15px] leading-relaxed text-[#46554D]">
              Te acaba de llegar un correo de confirmación.{" "}
              <strong className="font-bold text-[var(--tinta)]">
                En 24 horas tienes respuesta
              </strong>
              , encajemos o no. {textoArranque(arranque)}
            </p>

            {leadId && (
              <div className="mt-7 border-t border-[#E6E8E3] pt-6">
                <p className="text-[13.5px] font-semibold text-[#46554D]">
                  Una última, si quieres:
                </p>
                <div className="mt-3">
                  <OptionGroup
                    question={ASPIRACION_QUESTION}
                    value={answers.aspiracion}
                    onChange={guardarAspiracion}
                  />
                </div>
                {answers.aspiracion && (
                  <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--verde)]">
                    Anotado. Es por donde vamos a empezar.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** Cierra el mensaje final con el canal que la propia persona eligió. */
function textoArranque(valor: string | undefined): string {
  if (valor === "ya") return "Y si encajamos, te escribimos por WhatsApp esta semana.";
  if (valor === "1-3m") return "Y si encajamos, coordinamos esa llamada corta.";
  if (valor === "explorando") return "Te mandamos primero la información por correo, sin prisa.";
  return "";
}

function Header({
  step,
  title,
  subtitle,
}: {
  step: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#0A3D2E]">
        {step}
      </span>
      <h3 className="mt-2 text-xl font-extrabold leading-tight tracking-tight">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-1.5 text-sm leading-relaxed text-[#77847C]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Primary({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-6 h-14 w-full cursor-pointer rounded-2xl bg-[var(--lima)] text-base font-bold text-[var(--tinta)] shadow-[0_6px_18px_rgba(10,61,46,0.22)] transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verde)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
    >
      {children}
    </button>
  );
}

/**
 * `role="alert"` para que un lector de pantalla lo anuncie al aparecer. Sin eso
 * quien no ve la pantalla pulsa enviar, no pasa nada aparente y se va.
 */
function ErrorLine({ text }: { text: string }) {
  return (
    <p role="alert" className="mt-4 text-sm font-medium text-[#B42318]">
      {text}
    </p>
  );
}
