"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type Estado = "reposo" | "enviando" | "enviado" | "error";

/**
 * Formulario de contacto en SEÑAL.
 *
 * Los campos son nativos y no componentes de shadcn: el resto del sitio ya no
 * usa ese sistema y traerlo solo para tres entradas obligaría a mantener dos
 * lenguajes visuales por una pantalla.
 *
 * `?interes=` viene de los enlaces del recorrido de servicios y precarga el
 * mensaje: si alguien pulsa desde «automatizaciones», llega con eso escrito y no
 * ante un campo en blanco.
 *
 * El envío va a /api/contacto: se guarda en la base y llega a
 * calidevdev@gmail.com (antes iba a Formspree, al correo personal de Victor y
 * a servidores en Estados Unidos). `sitio` es un campo trampa, invisible para
 * las personas, que solo llenan los bots.
 */
export function ContactForm() {
  const t = useTranslations("contact");
  const parametros = useSearchParams();
  const [estado, setEstado] = useState<Estado>("reposo");

  const interes = parametros.get("interes");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("enviando");
    const datos = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        body: JSON.stringify({ ...datos, pagina: window.location.pathname }),
        headers: { "Content-Type": "application/json" },
      });
      setEstado(res.ok ? "enviado" : "error");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "enviado") {
    return (
      <div
        role="status"
        className="rounded-2xl bg-[var(--lima)] p-10 text-[var(--tinta)]"
      >
        <p className="mono opacity-70">{t("success_label")}</p>
        <p className="mt-4 text-[clamp(1.3rem,2.4vw,1.7rem)] font-extrabold leading-[1.15] tracking-[-0.03em]">
          {t("success")}
        </p>
      </div>
    );
  }

  const campo =
    "mt-2 w-full rounded-xl border border-[var(--hueso)]/20 bg-[var(--hueso)]/8 px-4 py-3.5 " +
    "text-[var(--hueso)] placeholder:text-[var(--hueso)]/40 transition-colors " +
    "focus:border-[var(--lima)] focus:outline-none focus:ring-2 focus:ring-[var(--lima)]/40";

  return (
    <form onSubmit={enviar} noValidate={false} className="flex flex-col gap-6">
      <div>
        <label htmlFor="nombre" className="mono opacity-70">
          {t("name")}
        </label>
        <input
          id="nombre"
          name="name"
          required
          autoComplete="name"
          placeholder={t("name_placeholder")}
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="correo" className="mono opacity-70">
          {t("email")}
        </label>
        <input
          id="correo"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("email_placeholder")}
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="mensaje" className="mono opacity-70">
          {t("message")}
        </label>
        <textarea
          id="mensaje"
          name="message"
          required
          rows={5}
          defaultValue={interes ? t("interes_prefijo", { interes }) : undefined}
          placeholder={t("message_placeholder")}
          className={`${campo} resize-y`}
        />
      </div>

      <input type="text" name="sitio" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {estado === "error" && (
        <p role="alert" className="text-[var(--lima)]">
          {t("error")}
        </p>
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="mono mt-2 inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--lima)] px-7 py-3.5 text-[var(--tinta)] transition-[filter] hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
      >
        {estado === "enviando" ? t("sending") : t("send")}
      </button>
    </form>
  );
}
