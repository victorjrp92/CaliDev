"use client";

/**
 * La cita ya reservada: cuándo es, cómo entrar y cómo ponerla en el
 * calendario. Google Calendar abre el evento ya lleno; el .ics sirve para Apple
 * Calendar y Outlook. Además le llega un correo con la invitación adjunta.
 */
export function CitaConfirmada({
  token,
  reserva,
  onCambiar,
}: {
  token: string;
  reserva: { descripcion: string; google: string };
  onCambiar: () => void;
}) {
  return (
    <section className="mt-8 rounded-3xl border border-[#D8DCD4] bg-white p-6 shadow-[0_4px_20px_rgba(21,33,28,0.06)]" aria-live="polite">
      <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--verde)]">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
          <path d="M5 12.5 10 17.5 19 7.5" stroke="#C8F045" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="mono mt-5 text-[var(--verde)]">Videollamada confirmada</p>
      <p className="mt-2 text-[21px] font-extrabold leading-snug tracking-tight">{reserva.descripcion}</p>
      <p className="mt-2 text-[15px] text-[#46554D]">
        Por Google Meet. Te llegó un correo con la invitación para tu calendario.
      </p>
      <div className="mt-6 flex flex-col gap-2.5">
        <a
          href={reserva.google}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 items-center justify-center rounded-2xl bg-[var(--lima)] text-base font-bold text-[var(--tinta)] shadow-[0_6px_18px_rgba(10,61,46,0.22)]"
        >
          Agregar a Google Calendar
        </a>
        <a
          href={`/cita/${token}/invitacion.ics`}
          className="flex h-12 items-center justify-center rounded-2xl border-[1.5px] border-[#D8DCD4] bg-white text-[15px] font-semibold text-[var(--verde)]"
        >
          Descargar para Apple Calendar u Outlook
        </a>
        <button
          type="button"
          onClick={onCambiar}
          className="mt-1 h-11 cursor-pointer text-[15px] font-semibold text-[var(--verde)] underline underline-offset-2"
        >
          Cambiar la hora
        </button>
      </div>
    </section>
  );
}
