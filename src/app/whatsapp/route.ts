import { enlaceWhatsapp } from "@/lib/whatsapp";

/**
 * `calidev.dev/whatsapp`: el enlace de la bio de Instagram.
 *
 * Es una ruta y no un `redirects()` de next.config porque Next decodifica el
 * destino y manda el mensaje con espacios crudos en `Location`; aquí sale
 * codificado tal cual. Temporal (307) a propósito: si el número cambia, la bio
 * sigue sirviendo y nadie guarda el destino viejo.
 */
export function GET() {
  return new Response(null, {
    status: 307,
    headers: {
      Location: enlaceWhatsapp("Hola, vengo de Instagram y quiero contarles lo que necesito."),
      "Cache-Control": "no-store",
    },
  });
}
