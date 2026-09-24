"use client";

import { forwardRef } from "react";
import { CampoTexto } from "@/components/delegar/campo-texto";
import { CampoWhatsapp } from "@/components/delegar/campo-whatsapp";
import { EncabezadoPaso } from "@/components/delegar/encabezado-paso";
import { BotonesPaso } from "@/components/delegar/botones-paso";
import { ErrorServidor } from "@/components/delegar/error-servidor";
import type { DatosDelegar, Errores } from "@/lib/delegar/formulario";

/**
 * Paso 2 de 3 · Cómo te contactamos.
 *
 * «Guardar mis datos y continuar» guarda de verdad: desde aquí la solicitud
 * existe, marcada como incompleta, aunque la persona no termine el paso 3.
 * Nada se guarda antes de pulsarlo.
 *
 * El correo es opcional y no promete una respuesta distinta de la de WhatsApp.
 */
export const PasoContacto = forwardRef<
  HTMLHeadingElement,
  {
    datos: DatosDelegar;
    errores: Errores;
    enviando: boolean;
    errorServidor: string | null;
    corrigiendo: boolean;
    onCampo: (campo: "nombre" | "iso" | "numero" | "correo", valor: string) => void;
    onGuardar: () => void;
    onAtras: () => void;
  }
>(function PasoContacto({ datos, errores, enviando, errorServidor, corrigiendo, onCampo, onGuardar, onAtras }, ref) {
  return (
    <>
      <EncabezadoPaso ref={ref} paso={2} titulo="Cómo te contactamos" />
      <div className="mt-6 flex flex-col gap-5">
        <CampoTexto
          id="d-nombre"
          etiqueta="Tu nombre"
          autoComplete="name"
          placeholder="María Gómez"
          maxLength={120}
          value={datos.nombre}
          error={errores["d-nombre"]}
          onChange={(e) => onCampo("nombre", e.target.value)}
        />
        <CampoWhatsapp
          iso={datos.iso}
          numero={datos.numero}
          error={errores["d-numero"]}
          onIso={(v) => onCampo("iso", v)}
          onNumero={(v) => onCampo("numero", v)}
        />
        <CampoTexto
          id="d-correo"
          etiqueta="Correo electrónico"
          opcional
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="maria@correo.com"
          maxLength={160}
          value={datos.correo}
          error={errores["d-correo"]}
          onChange={(e) => onCampo("correo", e.target.value)}
        />
      </div>
      <p className="mt-5 text-[14px] leading-relaxed text-[#46554D]">
        Al guardar, aceptas que usemos estos datos para responder a tu solicitud.
      </p>
      {errorServidor && <ErrorServidor texto={errorServidor} />}
      <BotonesPaso
        principal={corrigiendo ? "Guardar el cambio" : "Guardar mis datos y continuar"}
        enviando={enviando}
        onPrincipal={onGuardar}
        onAtras={onAtras}
      />
    </>
  );
});
