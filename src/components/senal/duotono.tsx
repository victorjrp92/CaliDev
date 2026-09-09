import Image from "next/image";

/**
 * El tratamiento de imagen de la casa: gris con una fuga de luz lima.
 *
 * Es lo que hace que fotos de origen muy distinto —retratos de estudio,
 * fotogramas de vídeo, capturas— se lean como una sola familia. El gris quita
 * el color de origen y la fuga lo repone, pero solo en una esquina y por
 * mezcla `screen`, así que tiñe el fondo de la foto y no las caras.
 *
 * `revelaEnHover` devuelve el color al pasar el ratón. Se usa en los retratos
 * del equipo: la persona aparece de verdad cuando te acercas a leer quién es.
 * Con `prefers-reduced-motion` la transición no ocurre (la hoja de estilos las
 * anula todas), así que la imagen se queda en su estado inicial y sigue siendo
 * legible.
 */
export function Duotono({
  src,
  alt,
  ancho,
  alto,
  className = "",
  revelaEnHover = false,
  prioridad = false,
  sizes,
}: {
  src: string;
  alt: string;
  ancho: number;
  alto: number;
  className?: string;
  revelaEnHover?: boolean;
  prioridad?: boolean;
  sizes?: string;
}) {
  return (
    <div className={`duotono relative overflow-hidden ${revelaEnHover ? "group" : ""} ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={ancho}
        height={alto}
        sizes={sizes}
        priority={prioridad}
        className={`h-full w-full object-cover contrast-[1.06] grayscale transition-[filter] duration-500 ${
          revelaEnHover ? "group-hover:grayscale-0" : ""
        }`}
      />
    </div>
  );
}
