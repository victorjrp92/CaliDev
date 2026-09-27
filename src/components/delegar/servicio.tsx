import { TarjetasTecnologia } from "@/components/delegar/tarjetas-tecnologia";

/**
 * El servicio en una frase, y la tecnología en cuatro tarjetas.
 *
 * Antes eran un título, una entradilla y tres tarjetas (qué se hace, quién se
 * encarga, cómo se sabe que va bien). Víctor lo recortó el 2026-09-28: la gente
 * que llega del video no quiere leer tanto. Después eligió esta presentación
 * (opción B de la hoja de opciones) porque la frase sola quedaba flotando.
 *
 * «¡Descansar de verdad!» lleva un subrayado lima de marcador: es la promesa
 * que la persona recuerda. `box-decoration-clone` mantiene el resaltado si la
 * frase parte línea.
 *
 * El contenedor `data-seccion="servicio"` (en landing.tsx) no cambia: el mapa
 * de calor de calidev.dev/social sigue encontrando esta sección con ese nombre.
 */
export function Servicio() {
  return (
    <section className="mx-auto max-w-xl px-5 py-10">
      <p className="text-[24px] font-extrabold leading-snug tracking-tight [text-wrap:balance] md:text-[28px]">
        Trabajamos juntos para que puedas crecer, delegar y descansar.{" "}
        <mark className="bg-transparent bg-[linear-gradient(transparent_55%,var(--lima)_55%,var(--lima)_92%,transparent_92%)] px-0.5 text-inherit [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
          ¡Descansar de verdad!
        </mark>
      </p>
      <p className="mt-4 text-[17px] leading-relaxed text-[#2C3A33]">
        ¡Ah! Y si hace falta, construimos la tecnología que lo sostiene:
      </p>
      <TarjetasTecnologia />
    </section>
  );
}
