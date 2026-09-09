import { Apertura } from "@/components/senal/nosotros/apertura";
import { Proposito } from "@/components/senal/nosotros/proposito";
import { Principios } from "@/components/senal/nosotros/principios";
import { Equipo } from "@/components/senal/nosotros/equipo";
import { Resultados } from "@/components/senal/nosotros/resultados";
import { Cierre } from "@/components/senal/cierre";

/**
 * Nosotros, en SEÑAL.
 *
 * El orden de los fondos no es decorativo: verde, hueso, niebla, azul, verde y
 * el hueso del cierre. Nunca dos seguidos iguales, y el más oscuro (azul) cae
 * en el equipo, que es donde las fotos tienen que destacar.
 */
export function AboutPage() {
  return (
    <>
      <Apertura />
      <Proposito />
      <Principios />
      <Equipo />
      <Resultados />
      <Cierre />
    </>
  );
}
