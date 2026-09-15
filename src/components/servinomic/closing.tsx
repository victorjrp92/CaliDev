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
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-[#46554D]">
          Cuéntanos cómo trabajas hoy. Te decimos si ServiNomic te sirve, o si
          tu problema se resuelve de otra forma.
        </p>
      </section>

      <footer className="mx-auto max-w-xl border-t border-[#D8DCD4] px-5 pb-3 pt-6 text-center text-xs text-[#77847C]">
        CaliDev · Sistemas de operación para empresas de servicios · Cali,
        Colombia
      </footer>
    </>
  );
}
