/**
 * Documentos de ejemplo, en el navegador: abrir una foto o un PDF como
 * páginas de imagen y, ya tapadas, aplanarlas en JPEG. El original nunca sale
 * del dispositivo; lo que se sube es lo que devuelve `aplanar`, que además
 * pierde los metadatos de la foto (ubicación, cámara) por pasar por un lienzo.
 */
export type Pagina = { lienzo: HTMLCanvasElement; ancho: number; alto: number };
/** Una caja en proporciones de la página (0 a 1), para que no dependa del zoom. */
export type Caja = { x: number; y: number; w: number; h: number };

const LADO_MAXIMO = 2000;
const PAGINAS_MAXIMAS = 10;

/** Lienzo con fondo blanco: un PNG transparente pasado a JPEG saldría negro. */
function lienzoDe(ancho: number, alto: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(ancho);
  c.height = Math.round(alto);
  const x = c.getContext("2d")!;
  x.fillStyle = "#fff";
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

async function deImagen(archivo: File): Promise<Pagina[]> {
  const bmp = await createImageBitmap(archivo);
  const k = Math.min(1, LADO_MAXIMO / Math.max(bmp.width, bmp.height));
  const c = lienzoDe(bmp.width * k, bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return [{ lienzo: c, ancho: c.width, alto: c.height }];
}

async function dePdf(archivo: File): Promise<Pagina[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()) }).promise;
  const paginas: Pagina[] = [];
  for (let n = 1; n <= Math.min(doc.numPages, PAGINAS_MAXIMAS); n++) {
    const p = await doc.getPage(n);
    const base = p.getViewport({ scale: 1 });
    const vista = p.getViewport({ scale: Math.min(2.5, 1600 / base.width) });
    const c = lienzoDe(vista.width, vista.height);
    await p.render({ canvas: c, viewport: vista }).promise;
    paginas.push({ lienzo: c, ancho: c.width, alto: c.height });
  }
  await doc.destroy();
  return paginas;
}

export const esPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);

export async function abrirDocumento(archivo: File): Promise<Pagina[]> {
  return esPdf(archivo) ? dePdf(archivo) : deImagen(archivo);
}

/** La página con las cajas en negro, como JPEG. Un margen pequeño evita que asome el borde de una letra. */
export function aplanar(p: Pagina, cajas: readonly Caja[]): Promise<Blob> {
  const c = lienzoDe(p.ancho, p.alto);
  const x = c.getContext("2d")!;
  x.drawImage(p.lienzo, 0, 0);
  x.fillStyle = "#000";
  const m = Math.max(2, p.ancho * 0.004);
  for (const b of cajas) x.fillRect(b.x * p.ancho - m, b.y * p.alto - m, b.w * p.ancho + 2 * m, b.h * p.alto + 2 * m);
  return new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo generar la imagen"))), "image/jpeg", 0.85));
}
