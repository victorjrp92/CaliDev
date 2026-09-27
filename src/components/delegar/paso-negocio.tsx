"use client";

import { forwardRef } from "react";
import { CampoTexto } from "@/components/delegar/campo-texto";
import { EncabezadoPaso } from "@/components/delegar/encabezado-paso";
import { GrupoOpciones } from "@/components/delegar/grupo-opciones";
import { BotonesPaso } from "@/components/delegar/botones-paso";
import { DOLOR, ROL, TAMANO, type ClaveDelegar } from "@/lib/delegar/preguntas";
import type { DatosDelegar, Errores } from "@/lib/delegar/formulario";

/** Paso 1 de 3 · Tu negocio. Sin datos personales todavía. */
export const PasoNegocio = forwardRef<
  HTMLHeadingElement,
  {
    datos: DatosDelegar;
    errores: Errores;
    onRespuesta: (clave: ClaveDelegar, valor: string) => void;
    onCampo: (campo: "actividad" | "dolorOtro", valor: string) => void;
    onContinuar: () => void;
  }
>(function PasoNegocio({ datos, errores, onRespuesta, onCampo, onContinuar }, ref) {
  const r = datos.respuestas;
  return (
    <>
      <EncabezadoPaso ref={ref} paso={1} titulo="Tu negocio" />
      <div className="mt-6 flex flex-col gap-7">
        <GrupoOpciones id="d-rol" pregunta={ROL} valor={r.rol} error={errores["d-rol"]} onChange={(v) => onRespuesta("rol", v)} />
        <CampoTexto
          id="d-actividad"
          etiqueta="¿A qué se dedica tu negocio?"
          ayuda="Por ejemplo: aseo, mantenimiento, instalaciones u otro servicio."
          autoComplete="off"
          value={datos.actividad}
          error={errores["d-actividad"]}
          onChange={(e) => onCampo("actividad", e.target.value)}
        />
        <div className="flex flex-col gap-3">
          <GrupoOpciones id="d-dolor" pregunta={DOLOR} valor={r.dolor} error={errores["d-dolor"]} onChange={(v) => onRespuesta("dolor", v)} />
          {r.dolor === "otro" && (
            <CampoTexto
              id="d-dolor-otro"
              etiqueta="¿Cuál es el problema?"
              maxLength={300}
              value={datos.dolorOtro}
              error={errores["d-dolor-otro"]}
              onChange={(e) => onCampo("dolorOtro", e.target.value)}
            />
          )}
        </div>
        <GrupoOpciones id="d-tamano" pregunta={TAMANO} valor={r.tamano} error={errores["d-tamano"]} onChange={(v) => onRespuesta("tamano", v)} />
      </div>
      <BotonesPaso id="form-paso1-continuar" principal="Continuar" onPrincipal={onContinuar} />
    </>
  );
});
