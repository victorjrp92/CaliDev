import { ScrollReelTestimonials } from "@/components/ui/scroll-reel-testimonials";
import { TESTIMONIOS } from "@/lib/nuevo/testimonios";

/**
 * Va justo después de los servicios: primero se ve lo que hacemos, y acto
 * seguido alguien que no somos nosotros lo confirma. Sobre fondo verde, para
 * separarlo del recorrido horizontal de arriba y del azul de las herramientas.
 */
export function Testimonios() {
  return (
    <section className="bg-[var(--verde)] px-7 py-24 text-[var(--hueso)] md:px-14 md:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="mono text-[var(--lima)]">Lo que dicen</p>
        <h2 className="mt-6 max-w-[16ch] text-[clamp(2.2rem,5.5vw,4.4rem)] font-extrabold leading-[1.0] tracking-[-0.035em]">
          No hace falta que lo digamos nosotros.
        </h2>

        <ScrollReelTestimonials
          className="mt-14"
          testimonials={TESTIMONIOS.map((t) => ({
            id: t.id,
            quote: t.cita,
            author: t.autor,
            role: t.cargo,
            image: t.foto,
          }))}
        />
      </div>
    </section>
  );
}
