"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Compartir el artículo.
 *
 * La URL se lee del navegador y no se construye a mano: así incluye el dominio
 * real y el prefijo de idioma sin tener que pasárselos, y funciona igual en
 * local que en producción.
 *
 * Se pide en el siguiente fotograma y no en el cuerpo del efecto — cambiar
 * estado ahí mismo encadena un render extra antes de pintar, que es el mismo
 * patrón que ya usan el reloj del hero y la barra.
 */
export function ShareButtons({ title }: { title: string }) {
  const t = useTranslations("blog");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const fotograma = requestAnimationFrame(() => setUrl(window.location.href));
    return () => cancelAnimationFrame(fotograma);
  }, []);

  // Sin URL todavía no hay nada que compartir: se espera un fotograma antes de
  // pintar enlaces que llevarían a una dirección vacía.
  if (!url) return null;

  const destinos = [
    {
      nombre: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      nombre: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
    {
      nombre: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <span className="mono text-[var(--verde)]">{t("share")}</span>
      {destinos.map((d) => (
        <a
          key={d.nombre}
          href={d.href}
          target="_blank"
          rel="noopener noreferrer"
          className="titulo-articulo"
        >
          {d.nombre}
        </a>
      ))}
    </div>
  );
}
