/**
 * Lo que se sube desde un arranque vive en Vercel Blob, bajo
 * `arranques/<token>/`. En las respuestas se guarda cada archivo como un texto
 * JSON dentro de la lista del campo:
 *
 * - plantillas (`archivos`): `{ url, nombre }`
 * - documentos de ejemplo (`muestras`): `{ tipo, paginas: [url…] }`, una
 *   imagen ya tapada por página. Nunca se guarda el nombre del archivo
 *   original: suele llevar el nombre del cliente.
 *
 * El servidor solo acepta URLs de nuestro almacén y de la carpeta de ese
 * enlace: nadie puede colar en un arranque un archivo de otro sitio.
 */
export type ArchivoSubido = { url: string; nombre: string };
export type Muestra = { tipo: string; paginas: string[] };

export const carpetaDe = (token: string) => `arranques/${token}/`;

export function urlPermitida(url: unknown, token: string): url is string {
  if (typeof url !== "string" || !token) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com") && u.pathname.startsWith("/" + carpetaDe(token));
  } catch {
    return false;
  }
}

function json(s: unknown): Record<string, unknown> | null {
  if (typeof s !== "string") return null;
  try {
    const o = JSON.parse(s);
    return o && typeof o === "object" && !Array.isArray(o) ? o : null;
  } catch {
    return null;
  }
}

export function leerArchivo(s: unknown): ArchivoSubido | null {
  const o = json(s);
  return o && typeof o.url === "string" && typeof o.nombre === "string" ? { url: o.url, nombre: o.nombre } : null;
}

export function leerMuestra(s: unknown): Muestra | null {
  const o = json(s);
  if (!o || typeof o.tipo !== "string" || !Array.isArray(o.paginas)) return null;
  const paginas = o.paginas.filter((p): p is string => typeof p === "string");
  return paginas.length ? { tipo: o.tipo, paginas } : null;
}
