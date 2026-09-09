import { redirect } from "next/navigation";

/**
 * `/nuevo` fue la ruta de trabajo mientras se diseñaba la landing. Ahora la
 * landing ES el home, así que la ruta redirige en vez de desaparecer: el enlace
 * circuló durante el diseño y romperlo no aporta nada.
 */
export default function NuevoRedirige() {
  redirect("/es");
}
