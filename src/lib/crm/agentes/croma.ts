/**
 * Registro mercantil (RUES) por NIT vía Croma (`POST /co/rues/entity-by-nit/v1`).
 * Opcional: sin CROMA_API_KEY o sin NIT no se consulta, y un fallo de la fuente
 * (RUES se cae a ratos) no tumba el brief; se dice que no se pudo consultar.
 * Cuesta 10 créditos por consulta en vivo; los fallos no se cobran.
 */
export type Registro = { estado: "sin_nit" | "sin_clave" | "no_encontrado" | "fallo"; datos: null } | { estado: "encontrado"; datos: Record<string, unknown> };

export type Consulta = (nit: string) => Promise<Registro>;

async function croma(nit: string): Promise<Registro> {
  const clave = process.env.CROMA_API_KEY;
  if (!clave) return { estado: "sin_clave", datos: null };
  try {
    const r = await fetch("https://api.croma.run/co/rues/entity-by-nit/v1", {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ document_number: nit }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) return { estado: "fallo", datos: null };
    const j = (await r.json()) as Record<string, unknown>;
    return j.found === false ? { estado: "no_encontrado", datos: null } : { estado: "encontrado", datos: j };
  } catch {
    return { estado: "fallo", datos: null };
  }
}

let actual: Consulta = croma;
export function usarCroma(fn: Consulta | null) {
  actual = fn ?? croma;
}

/** Solo dígitos, 4 a 15 (sin dígito de verificación si viene con guion). */
export function nitLimpio(nit: string | null | undefined): string | null {
  const base = (nit ?? "").split("-")[0].replace(/\D/g, "");
  return base.length >= 4 && base.length <= 15 ? base : null;
}

export async function registroPorNit(nit: string | null | undefined): Promise<Registro> {
  const n = nitLimpio(nit);
  return n ? actual(n) : { estado: "sin_nit", datos: null };
}
