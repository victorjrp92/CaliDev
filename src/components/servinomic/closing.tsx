/**
 * Cierre. Sin CTA propio: el formulario queda justo encima, así que otro botón
 * aquí solo mandaría a la persona hacia arriba, y la barra fija ya cubre la
 * acción. El pie no tiene enlaces — ninguna ruta de fuga en toda la página.
 */
export function ServinomicClosing() {
  return (
    <>
      <section className="mx-auto max-w-xl px-5 pb-8 pt-2 text-center">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
          Tu operación ya te está diciendo dónde duele
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-[#4A5A53]">
          Cuéntanos cómo trabajas hoy y te decimos si ServiNomic te sirve — o si
          tu problema se resuelve de otra forma.
        </p>
      </section>

      <footer className="mx-auto max-w-xl border-t border-[#E7E1D7] px-5 pb-3 pt-6 text-center text-xs text-[#87938C]">
        CaliDev · Sistemas de operación para empresas de servicios · Cali,
        Colombia
      </footer>
    </>
  );
}
