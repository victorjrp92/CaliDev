/**
 * Lo que también construimos, en cuatro tarjetas con icono.
 *
 * En una línea de texto se perdía al final de la frase; en tarjetas se ve de un
 * vistazo que CaliDev también hace tecnología, y le dan peso a la sección para
 * que no quede flotando entre la cita y «Qué pasa después».
 *
 * Los iconos son trazos simples en SVG, del verde de la página. Van encima del
 * nombre y no al lado: a 390 px, «Automatizaciones» no cabe junto a un icono.
 */
const TECNOLOGIAS = [
  { nombre: "Software a la medida", icono: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" /> },
  {
    nombre: "Apps",
    icono: (
      <>
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M11 18.5h2" />
      </>
    ),
  },
  {
    nombre: "Páginas web",
    icono: (
      <>
        <rect x="2.5" y="4" width="19" height="15" rx="2.5" />
        <path d="M2.5 8.5h19" />
      </>
    ),
  },
  { nombre: "Automatizaciones", icono: <path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z" /> },
];

export function TarjetasTecnologia() {
  return (
    <ul className="mt-3.5 grid grid-cols-2 gap-2.5">
      {TECNOLOGIAS.map((t) => (
        <li
          key={t.nombre}
          className="flex flex-col items-start gap-2 rounded-2xl border-[1.5px] border-[#D8DCD4] bg-white px-3.5 py-3.5 text-[15px] font-semibold leading-tight"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5 flex-none text-[var(--verde)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {t.icono}
          </svg>
          {t.nombre}
        </li>
      ))}
    </ul>
  );
}
