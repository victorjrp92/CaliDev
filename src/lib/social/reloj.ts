/**
 * Autorización del reloj externo (cron-job.org). Comparación en tiempo
 * constante, como la contraseña del panel de leads.
 */
function igualSinFiltrarTiempo(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

export function relojAutorizado(peticion: Request): boolean {
  const secreto = process.env.SOCIAL_CRON_SECRET;
  if (!secreto) return false;
  const cabecera = peticion.headers.get("authorization") ?? "";
  return igualSinFiltrarTiempo(cabecera, `Bearer ${secreto}`);
}
