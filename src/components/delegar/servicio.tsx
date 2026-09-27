/**
 * El servicio en una frase, y la tecnología en otra.
 *
 * Antes eran un título, una entradilla y tres tarjetas (qué se hace, quién se
 * encarga, cómo se sabe que va bien). Víctor lo recortó el 2026-09-28: la gente
 * que llega del video no quiere leer tanto, y las tarjetas distraían del
 * formulario que viene justo después.
 *
 * La segunda línea se queda porque es la única de la página que nombra lo que
 * también construimos: software, apps, webs y automatizaciones.
 *
 * El contenedor `data-seccion="servicio"` (en landing.tsx) no cambia: el mapa
 * de calor de calidev.dev/social sigue encontrando esta sección con ese nombre.
 */
export function Servicio() {
  return (
    <section className="mx-auto max-w-xl px-5 py-10">
      <p className="text-[24px] font-extrabold leading-snug tracking-tight [text-wrap:balance] md:text-[28px]">
        Trabajamos juntos para que puedas crecer, delegar y descansar.{" "}
        <span className="text-[var(--verde)]">¡Descansar de verdad!</span>
      </p>
      <p className="mt-4 text-[17px] leading-relaxed text-[#2C3A33]">
        ¡Ah! Y si hace falta, construimos la tecnología que lo sostiene:{" "}
        <strong className="font-bold text-[var(--tinta)]">
          software a la medida, apps, páginas web y automatizaciones.
        </strong>
      </p>
    </section>
  );
}
