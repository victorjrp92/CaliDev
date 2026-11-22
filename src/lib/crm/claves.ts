import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Claves de agente y de CLI: `cdv_<prefijo>_<secreto>`. El prefijo se guarda
 * visible para encontrar la fila y mostrarla en Ajustes; del secreto solo se
 * guarda el hash. El secreto tiene 32 bytes al azar, así que basta un SHA-256
 * (bcrypt es para contraseñas que una persona puede adivinar).
 */
const ALFABETO = "abcdefghijkmnpqrstuvwxyz23456789"; // sin l, o, 0, 1: se dictan sin confusión

function aleatorio(n: number): string {
  const b = randomBytes(n);
  let s = "";
  for (let i = 0; i < n; i++) s += ALFABETO[b[i] % ALFABETO.length];
  return s;
}

export const hashSecreto = (secreto: string) => createHash("sha256").update(secreto).digest("hex");

export function generarClave(): { clave: string; prefijo: string; hash: string } {
  const prefijo = aleatorio(8);
  const secreto = randomBytes(32).toString("base64url");
  return { clave: `cdv_${prefijo}_${secreto}`, prefijo, hash: hashSecreto(secreto) };
}

export function partirClave(clave: string): { prefijo: string; secreto: string } | null {
  const m = /^cdv_([a-z2-9]{8})_([A-Za-z0-9_-]{43})$/.exec(clave.trim());
  return m ? { prefijo: m[1], secreto: m[2] } : null;
}

/** Compara en tiempo constante el hash guardado con el del secreto recibido. */
export function secretoCorrecto(secreto: string, hashGuardado: string): boolean {
  const a = Buffer.from(hashSecreto(secreto), "hex");
  const b = Buffer.from(hashGuardado, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Token de un solo uso para invitaciones: se manda en el enlace, se guarda el hash. */
export function generarToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashSecreto(token) };
}
