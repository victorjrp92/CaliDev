import { BarraSeccion } from "../barra-seccion";

export type VistaFinanzas = "resumen" | "cobros" | "suscripciones" | "gastos";

const SEGMENTOS: { vista: VistaFinanzas; href: string; etiqueta: string }[] = [
  { vista: "resumen", href: "/crm/finanzas", etiqueta: "Resumen" },
  { vista: "cobros", href: "/crm/finanzas/cobros", etiqueta: "Cobros" },
  { vista: "suscripciones", href: "/crm/finanzas/suscripciones", etiqueta: "Suscripciones" },
  { vista: "gastos", href: "/crm/finanzas/gastos", etiqueta: "Gastos" },
];

/** Cabecera de Finanzas: los cuatro segmentos siempre, y «Alta de cliente» para quien puede crear cobros. */
export function BarraFinanzas({ activo, alta, subtitulo }: { activo: VistaFinanzas; alta: boolean; subtitulo?: React.ReactNode }) {
  return (
    <BarraSeccion
      titulo="Finanzas"
      subtitulo={subtitulo}
      segmentos={SEGMENTOS.map((s) => ({ href: s.href, etiqueta: s.etiqueta, activo: s.vista === activo }))}
      accion={alta ? { href: "/crm/finanzas/alta", etiqueta: "Alta de cliente" } : undefined}
    />
  );
}
