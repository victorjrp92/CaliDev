import { Clip } from "@/components/servinomic/clip";

/**
 * El clip del hero: un servicio de limpieza, en bucle y mudo.
 *
 * Las reglas de datos móviles —descarga diferida, reproducir solo a la vista,
 * `playsInline`, movimiento reducido— viven en `Clip`, que las aplica igual a
 * todos los vídeos de la página.
 *
 * NOTA: la escena es una recreación, no la grabación de un servicio real. Por
 * eso no lleva pie de foto que la presente como documental. Los datos ciertos
 * del equipo —cuántas son y en cuántas ciudades— viven en la ficha de Deisy,
 * justo debajo.
 */
export function ClipHero() {
  return (
    <Clip
      src="/servinomic/limpieza.mp4"
      poster="/servinomic/limpieza-poster.webp"
      descripcion="Tres personas del equipo de limpieza trabajando en una casa: una limpia un ventanal, otra trapea el piso y otra la cocina"
      className="rounded-3xl"
    />
  );
}
