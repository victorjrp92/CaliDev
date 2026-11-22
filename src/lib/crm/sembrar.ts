import { sql } from "@/lib/db";
import { asegurarEsquema } from "./esquema";
import { crearUsuario, reinvitar } from "./usuarios";

/**
 * Siembra a los humanos del CRM (spec §3: Victor y Karen no se registran solos).
 * Se puede repetir sin duplicar:
 *   - si la persona no existe, la crea;
 *   - si existe y aún no eligió contraseña, le genera un enlace nuevo (el
 *     anterior deja de servir);
 *   - si ya entró, no la toca.
 * La usan el script `scripts/crm-sembrar.ts` y la ruta temporal `/api/crm/siembra`.
 */
export const PERSONAS_SEMBRADAS = [
  { clave: "victor", nombre: "Victor Ramos", rol: "dueno" },
  { clave: "karen", nombre: "Karen Cortés", rol: "socia" },
] as const;

export type ClaveSembrada = (typeof PERSONAS_SEMBRADAS)[number]["clave"];

export type ResultadoSiembra = {
  persona: string;
  correo: string;
  estado: "creada" | "reinvitada" | "ya_entro" | "otro_rol";
  mensaje: string;
  enlace: string | null;
};

export async function sembrarHumanos(correos: Partial<Record<ClaveSembrada, string>>, base: string): Promise<ResultadoSiembra[]> {
  await asegurarEsquema();
  const raiz = base.replace(/\/+$/, "");
  const salida: ResultadoSiembra[] = [];
  for (const p of PERSONAS_SEMBRADAS) {
    const crudo = correos[p.clave];
    if (!crudo) continue;
    const correo = crudo.trim().toLowerCase();
    const r = await sql<{ id: number; rol: string; tipo: string; hash_clave: string | null }>`
      SELECT id, rol, tipo, hash_clave FROM crm_usuarios WHERE correo = ${correo}`;
    const u = r.rows[0];
    const fila = (estado: ResultadoSiembra["estado"], mensaje: string, token: string | null): ResultadoSiembra => ({
      persona: p.nombre, correo, estado, mensaje, enlace: token ? `${raiz}/crm/invitacion/${token}` : null,
    });
    if (!u) {
      const token = (await crearUsuario(null, { nombre: p.nombre, correo, tipo: "humano", rol: p.rol })).invitacion!;
      salida.push(fila("creada", `Creada como ${p.rol}.`, token));
    } else if (u.tipo !== "humano" || u.rol !== p.rol) {
      salida.push(fila("otro_rol", `Ya existe como ${u.tipo}/${u.rol}, no ${p.rol}. No se cambia; revísalo en Agentes.`, null));
    } else if (u.hash_clave) {
      salida.push(fila("ya_entro", "Ya eligió contraseña. No se toca.", null));
    } else {
      salida.push(fila("reinvitada", "Seguía sin entrar; enlace nuevo (el anterior ya no sirve).", await reinvitar(null, u.id)));
    }
  }
  return salida;
}

/** ¿Algún humano ya entró con contraseña? Desde ese momento la siembra por web se apaga. */
export async function algunHumanoEntro(): Promise<boolean> {
  await asegurarEsquema();
  const r = await sql<{ n: number }>`SELECT count(*)::int AS n FROM crm_usuarios WHERE tipo = 'humano' AND hash_clave IS NOT NULL`;
  return (r.rows[0]?.n ?? 0) > 0;
}
