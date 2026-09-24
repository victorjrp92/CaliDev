import Image from "next/image";
import { TESTIMONIOS } from "@/lib/nuevo/testimonios";

/**
 * Las tres caras de clientes, superpuestas en fila, al lado de las estrellas.
 *
 * Son las mismas fotos reales de la portada (lib/nuevo/testimonios.ts). Sin
 * foto va el monograma con la inicial, nunca una cara de archivo. El aro del
 * color del fondo separa una cara de la siguiente.
 */
const TAMANO = 30;

export function CarasClientes() {
  return (
    <ul className="flex items-center" aria-label="Clientes de CaliDev">
      {TESTIMONIOS.map((persona, i) => (
        <li key={persona.id} className={i === 0 ? "" : "-ml-2.5"} style={{ zIndex: TESTIMONIOS.length - i }}>
          <span className="block rounded-full ring-[2.5px] ring-[var(--hueso)]">
            {persona.foto ? (
              <Image
                src={persona.foto}
                alt={persona.autor}
                width={TAMANO}
                height={TAMANO}
                sizes={`${TAMANO}px`}
                className="block rounded-full object-cover"
                style={{ width: TAMANO, height: TAMANO }}
              />
            ) : (
              <span
                role="img"
                aria-label={persona.autor}
                style={{ width: TAMANO, height: TAMANO }}
                className="grid place-items-center rounded-full bg-[#E6E8E3] text-[12px] font-bold text-[var(--verde)]"
              >
                {persona.autor[0]}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
