import { BotonCta } from "@/components/delegar/boton-cta";

/**
 * Cierre: el mismo botón que arriba y un pie sobrio.
 *
 * El enlace a la política de tratamiento de datos falta a propósito: todavía no
 * está publicada, y enlazar una página que no existe es peor que no enlazar.
 * Va aquí en cuanto se publique.
 */
export function Cierre() {
  return (
    <section className="mx-auto max-w-xl px-5 pb-12 pt-4">
      <BotonCta />
      <p className="mt-8 text-center text-[13px] text-[#46554D]">CaliDev · Cali · Frankfurt</p>
    </section>
  );
}
