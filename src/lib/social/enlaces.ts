import { createHash } from "node:crypto";

const DOMINIOS = ["calidev.dev", "seiricon.com", "www.instagram.com", "instagram.com"];

/** Código para ?c=: deriva del igsid con sal, así la URL no expone el id de Instagram. */
export function codigoPersona(igsid: string, sal: string): string {
  const h = createHash("sha256").update(`${sal}:${igsid}`).digest();
  const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(h.subarray(0, 10), (b) => abc[b % abc.length]).join("");
}

export function landingPermitida(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && DOMINIOS.includes(u.hostname);
  } catch { return false; }
}

export function enlaceTarjeta(landing: string, codigo: string, campana: string): string {
  const u = new URL(landing);
  if (!u.hostname.endsWith("instagram.com")) {
    u.searchParams.set("utm_source", "instagram");
    u.searchParams.set("utm_medium", "dm");
    u.searchParams.set("utm_campaign", campana);
    u.searchParams.set("c", codigo);
  }
  return u.toString();
}
