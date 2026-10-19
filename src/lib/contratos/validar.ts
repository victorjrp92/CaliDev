/**
 * Lectura y validación de lo que manda el formulario de firma. Todo llega del
 * navegador, así que nada se da por bueno: textos recortados, correo con forma
 * de correo y la firma como PNG de tamaño razonable.
 */

export const TIPOS_DOCUMENTO = ["Cédula de ciudadanía", "Cédula de extranjería", "NIT", "Pasaporte", "PPT"] as const;

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIRMA_MAX = 400_000;

function texto(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

export function leerCorreo(v: unknown): string | null {
  const c = texto(v, 200).toLowerCase();
  return CORREO.test(c) ? c : null;
}

export type Formulario = {
  nombre: string;
  tipoDocumento: string;
  documento: string;
  correo: string;
  celular: string;
  empresa: string;
  firma: string;
  codigo: string;
};

export function leerFormulario(body: Record<string, unknown>): { ok: true; datos: Formulario } | { ok: false; error: string } {
  const nombre = texto(body.nombre, 120);
  const tipoDocumento = texto(body.tipoDocumento, 40);
  const documento = texto(body.documento, 30);
  const correo = leerCorreo(body.correo);
  const celular = texto(body.celular, 30);
  const empresa = texto(body.empresa, 120);
  const firma = typeof body.firma === "string" ? body.firma : "";
  const codigo = texto(body.codigo, 6);

  if (nombre.length < 5 || !nombre.includes(" ")) return { ok: false, error: "Escribe tu nombre completo." };
  if (!(TIPOS_DOCUMENTO as readonly string[]).includes(tipoDocumento)) return { ok: false, error: "Elige el tipo de documento." };
  if (!/^[A-Za-z0-9.\- ]{4,30}$/.test(documento)) return { ok: false, error: "Revisa el número de documento." };
  if (!correo) return { ok: false, error: "Revisa tu correo." };
  if (!firma.startsWith("data:image/png;base64,") || firma.length > FIRMA_MAX) return { ok: false, error: "Dibuja tu firma otra vez." };
  if (body.acepto !== true) return { ok: false, error: "Marca la casilla de aceptación." };
  if (!/^\d{6}$/.test(codigo)) return { ok: false, error: "Escribe el código de 6 dígitos que te llegó al correo." };

  return { ok: true, datos: { nombre, tipoDocumento, documento, correo, celular, empresa, firma, codigo } };
}

/** IP de quien firma, tal como la deja Vercel. Queda en la constancia. */
export function ipDe(request: Request): string {
  const reenviada = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || request.headers.get("x-real-ip") || "desconocida";
}
