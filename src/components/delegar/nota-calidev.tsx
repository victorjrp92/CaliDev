import { Estrellas } from "@/components/senal/estrellas";
import { obtenerValoracion } from "@/lib/nuevo/valoracion";
import { CarasClientes } from "@/components/delegar/caras-clientes";

/**
 * La nota real que las clientas le pusieron a CaliDev, entre la presentación y
 * el botón del hero: es la última señal de confianza antes de pulsar.
 *
 * Sale de la tabla `opiniones`, igual que en la portada, y siempre va con el
 * número de opiniones debajo, en pequeño. Al lado van las caras de tres
 * clientes. Si la nota no se puede leer, no se pinta nada: el hero funciona
 * igual sin ella.
 */
export async function NotaCalidev() {
  const valoracion = await obtenerValoracion();
  if (!valoracion) return null;

  const media = valoracion.media.toLocaleString("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const opiniones = `${valoracion.personas} ${valoracion.personas === 1 ? "opinión" : "opiniones"}`;

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3.5">
        <Estrellas media={valoracion.media} tamano="h-7 w-7" prefijo="hero" />
        <CarasClientes />
      </div>
      <p className="mt-1.5 text-[13px] text-[#46554D]">
        <strong className="font-bold text-[var(--tinta)]">{media}</strong> · {opiniones} de clientes
      </p>
    </div>
  );
}
