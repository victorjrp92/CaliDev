import { redirect } from "next/navigation";

/**
 * `/services` ya no es una página: los servicios viven en el home.
 *
 * Redirige en vez de desaparecer porque la ruta lleva tiempo publicada, está en
 * enlaces antiguos y en el índice de los buscadores; devolver un 404 a quien
 * llega buscando justo eso sería el peor recibimiento posible.
 *
 * Usa el `redirect` de Next y no el de next-intl porque el de next-intl no
 * acepta ancla, y el ancla es justo el punto: hay que caer en la sección, no en
 * lo alto del home.
 *
 * El contenido que tenía la página —precios, proceso y producto estrella— sigue
 * en `messages` bajo el espacio `sp`. No se borra: no está en ningún otro sitio
 * todavía y perderlo por limpiar sería tirar texto ya escrito y traducido.
 */
export default async function ServiciosRedirige({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}#servicios`);
}
