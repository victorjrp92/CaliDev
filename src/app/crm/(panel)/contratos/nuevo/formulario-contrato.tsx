"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { faltantesServinomic, htmlServinomic, type DatosServinomic } from "@/lib/contratos/plantilla-servinomic";
import { llamar } from "@/lib/crm/llamar";
import { useAccion } from "@/lib/crm/use-accion";
import { CampoNumero } from "./campo-numero";
import { CampoTexto } from "./campo-texto";
import { EditorCuotas } from "./editor-cuotas";
import { GrupoCampos } from "./grupo-campos";

export type Vinculo = { oportunidad_id: number | null; persona_id: number | null; empresa_id: number | null };

/**
 * El contrato de ServiNomic con sus datos ya llenos (desde la oportunidad o
 * con fechas calculadas para hoy). La vista previa es el mismo HTML que se
 * guarda y se firma; al crearlo se abre su ficha para firmar y enviar.
 */
export function FormularioContrato({ inicial, vinculo }: { inicial: DatosServinomic; vinculo: Vinculo }) {
  const router = useRouter();
  const [d, setD] = useState(inicial);
  const [previa, setPrevia] = useState(false);
  const { enviando, error, setError, correr } = useAccion();
  const faltan = faltantesServinomic(d);
  const pon = <K extends keyof DatosServinomic>(k: K) => (v: DatosServinomic[K]) => { setError(null); setD((x) => ({ ...x, [k]: v })); };

  async function crear() {
    if (faltan.length) return setError(`Falta ${faltan.join(", ")}.`);
    const r = await correr(() => llamar<{ contrato: { id: number } }>("POST", "/contratos", { plantilla: "servinomic", datos: d, ...vinculo }, { clave: crypto.randomUUID() }), { refrescar: false });
    if (r) router.push(`/crm/contratos/${r.contrato.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <GrupoCampos titulo="Cliente">
        <CampoTexto etiqueta="Nombre para el saludo" valor={d.nombre} cambiar={pon("nombre")} ejemplo="María José" />
        <CampoTexto etiqueta="Negocio" valor={d.negocio} cambiar={pon("negocio")} ejemplo="Aseo Integral" />
        <CampoTexto etiqueta="Ciudad del contrato" valor={d.ciudad} cambiar={pon("ciudad")} />
        <CampoTexto etiqueta="Fecha del contrato" tipo="date" valor={d.fecha} cambiar={pon("fecha")} />
      </GrupoCampos>

      <GrupoCampos titulo="Arranque">
        <CampoNumero etiqueta="Precio publicado" valor={d.arranquePublicado} cambiar={pon("arranquePublicado")} />
        <CampoNumero etiqueta="Precio para este cliente" valor={d.arranque} cambiar={pon("arranque")} />
        <EditorCuotas cuotas={d.cuotas} arranque={d.arranque} cambiar={pon("cuotas")} />
        <CampoTexto etiqueta="Empieza el trabajo" valor={d.inicio} cambiar={pon("inicio")} ejemplo="lunes 1 de diciembre de 2026" />
        <CampoTexto etiqueta="El arranque termina a más tardar" valor={d.finArranque} cambiar={pon("finArranque")} ejemplo="31 de diciembre de 2026" />
      </GrupoCampos>

      <GrupoCampos titulo="Mensualidad">
        <CampoNumero etiqueta="Precio publicado" valor={d.mensualidadPublicada} cambiar={pon("mensualidadPublicada")} />
        <CampoNumero etiqueta="Precio para este cliente" valor={d.mensualidad} cambiar={pon("mensualidad")} />
        <CampoNumero etiqueta="Personas incluidas" valor={d.personas} cambiar={pon("personas")} plata={false} />
        <CampoNumero etiqueta="Cada persona adicional" valor={d.personaAdicional} cambiar={pon("personaAdicional")} />
        <CampoTexto etiqueta="Se paga desde" valor={d.mensualidadDesde} cambiar={pon("mensualidadDesde")} ejemplo="enero de 2027" />
        <CampoTexto etiqueta="Mes gratis" valor={d.mesGratis} cambiar={pon("mesGratis")} ayuda="Vacío si no hay mes gratis." />
      </GrupoCampos>

      <GrupoCampos titulo="Incluye">
        <label className="flex items-center gap-2.5 text-[15px] sm:col-span-2">
          <input type="checkbox" className="h-5 w-5 accent-[var(--acento)]" checked={d.nomina} onChange={(e) => pon("nomina")(e.target.checked)} />
          Pago de nómina con un clic (Wompi)
        </label>
        <CampoNumero etiqueta="Sesiones de consultoría" valor={d.consultorias} cambiar={pon("consultorias")} plata={false} />
        <CampoTexto etiqueta="Se usan hasta" valor={d.consultoriasHasta} cambiar={pon("consultoriasHasta")} />
      </GrupoCampos>

      <GrupoCampos titulo="Permanencia">
        <CampoNumero etiqueta="Meses (0 = sin permanencia)" valor={d.permanenciaMeses} cambiar={pon("permanenciaMeses")} plata={false} />
        <div aria-hidden className="max-sm:hidden" />
        <CampoTexto etiqueta="Desde" valor={d.permanenciaDesde} cambiar={pon("permanenciaDesde")} />
        <CampoTexto etiqueta="Hasta" valor={d.permanenciaHasta} cambiar={pon("permanenciaHasta")} />
      </GrupoCampos>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={crear} disabled={enviando} className="boton-principal">{enviando ? "Creando…" : "Crear contrato"}</button>
        <button type="button" onClick={() => setPrevia((x) => !x)} className="boton-secundario">{previa ? "Ocultar vista previa" : "Ver vista previa"}</button>
        {faltan.length > 0 && !error && <p className="text-[14px] text-[var(--texto-2)]">Para crearlo falta {faltan.join(", ")}.</p>}
        {error && <p role="alert" className="text-[14px] text-[var(--peligro)]">{error}</p>}
      </div>

      {previa && (
        // El contrato es un papel: blanco en los dos temas, como se ve al firmarlo.
        <div className="bloque bg-white px-5 py-6 text-[#1d1d1f] sm:px-10" dangerouslySetInnerHTML={{ __html: htmlServinomic(d) }} />
      )}
    </div>
  );
}
