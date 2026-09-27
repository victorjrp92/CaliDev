"use client";

import { forwardRef } from "react";
import { CampoTexto } from "@/components/delegar/campo-texto";
import { EncabezadoPaso } from "@/components/delegar/encabezado-paso";
import { GrupoOpciones } from "@/components/delegar/grupo-opciones";
import { BotonesPaso } from "@/components/delegar/botones-paso";
import { ErrorServidor } from "@/components/delegar/error-servidor";
import { BUSCA, HERRAMIENTAS, PLAZO, type ClaveDelegar } from "@/lib/delegar/preguntas";
import type { DatosDelegar, Errores } from "@/lib/delegar/formulario";

/**
 * Paso 3 de 3 · Lo que buscas cambiar.
 *
 * Aquí se pregunta la intención y el plazo, y se avisa de que la implementación
 * es de pago: quien solo explora lo puede decir sin sentirse descartado, y la
 * conversación arranca sabiendo en qué punto está.
 */
export const PasoCambio = forwardRef<
  HTMLHeadingElement,
  {
    datos: DatosDelegar;
    errores: Errores;
    enviando: boolean;
    errorServidor: string | null;
    onRespuesta: (clave: ClaveDelegar, valor: string) => void;
    onCampo: (campo: "herramientasOtro" | "empresa", valor: string) => void;
    onEnviar: () => void;
    onAtras: () => void;
  }
>(function PasoCambio({ datos, errores, enviando, errorServidor, onRespuesta, onCampo, onEnviar, onAtras }, ref) {
  const r = datos.respuestas;
  const conOtro = (r.herramientas ?? "").split(",").includes("otro");
  return (
    <>
      <EncabezadoPaso
        ref={ref}
        paso={3}
        titulo="Lo que buscas cambiar"
        apoyo="La revisión inicial es gratuita. Si necesitas una implementación, te presentaremos una propuesta de pago."
      />
      <div className="mt-6 flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <GrupoOpciones
            id="d-herramientas"
            pregunta={HERRAMIENTAS}
            valor={r.herramientas}
            error={errores["d-herramientas"]}
            onChange={(v) => onRespuesta("herramientas", v)}
          />
          {conOtro && (
            <CampoTexto
              id="d-herramientas-otro"
              etiqueta="¿Qué otra cosa usas?"
              maxLength={300}
              value={datos.herramientasOtro}
              error={errores["d-herramientas-otro"]}
              onChange={(e) => onCampo("herramientasOtro", e.target.value)}
            />
          )}
        </div>
        <GrupoOpciones id="d-busca" pregunta={BUSCA} valor={r.busca} error={errores["d-busca"]} onChange={(v) => onRespuesta("busca", v)} />
        <GrupoOpciones id="d-plazo" pregunta={PLAZO} valor={r.plazo} error={errores["d-plazo"]} onChange={(v) => onRespuesta("plazo", v)} />
        <CampoTexto
          id="d-empresa"
          etiqueta="Nombre de tu empresa"
          opcional
          autoComplete="organization"
          placeholder="Servicios del Valle"
          maxLength={160}
          value={datos.empresa}
          onChange={(e) => onCampo("empresa", e.target.value)}
        />
      </div>
      {errorServidor && <ErrorServidor texto={errorServidor} />}
      <BotonesPaso id="form-paso3-enviar" principal="Enviar mi solicitud" enviando={enviando} onPrincipal={onEnviar} onAtras={onAtras} />
    </>
  );
});
