/**
 * Testimonios reales de clientes reales.
 *
 * REGLA: las palabras son textuales de lo que cada cliente dijo. No se
 * inventan, no se «mejoran» y no se atribuye a nadie algo que no haya dicho.
 *
 * Las fotos todavía no están. Hasta que lleguen se muestra un monograma con la
 * inicial, NO una foto de archivo: una cara de un desconocido junto al nombre
 * real de una clienta es exactamente la clase de cosa que no puede publicarse
 * por accidente, y un monograma deja el hueco a la vista.
 */
export type Testimonio = {
  id: string;
  cita: string;
  autor: string;
  cargo: string;
  /** Ruta a la foto real. `null` mientras no la tengamos. */
  foto: string | null;
};

export const TESTIMONIOS: Testimonio[] = [
  {
    id: "deisy",
    cita:
      "Victor no solo nos hizo una app. Analizó toda nuestra operación, encontró dónde perdíamos dinero y construyó un sistema que nos devolvió 27 horas a la semana.",
    autor: "Deisy Moncayo",
    cargo: "CEO, LimpiaExpress Cali",
    foto: null,
  },
  {
    // ⚠️ PENDIENTE — el único texto sin verificar de toda la página.
    // Nadia está feliz con su web y la enseña con orgullo, pero eso lo contó
    // Victor: no son las palabras de ella. El marcador es deliberadamente
    // visible para que no pueda publicarse por accidente. Sustituir por lo
    // que Nadia diga, textual.
    id: "nadia",
    cita: "[PENDIENTE: las palabras de Nadia sobre su página]",
    autor: "Nadia",
    cargo: "Colourful Fiesta — Sídney, Australia",
    foto: null,
  },
  {
    id: "laura",
    cita:
      "Nos ayudaron a diseñar una estrategia de producto para predecir qué anuncios iban a funcionar antes de gastar el presupuesto. El producto mostró tanto potencial que terminamos siendo adquiridos.",
    autor: "Laura Sánchez",
    cargo: "CEO, Cubiko Colombia — adquirida por Dropi",
    foto: null,
  },
];
