/**
 * Siembra a los humanos del CRM (spec §3: Victor y Karen se crean por script)
 * e imprime su enlace de invitación de un solo uso. Se puede correr las veces
 * que haga falta:
 *   - si la persona no existe, la crea;
 *   - si existe y aún no eligió contraseña, le genera un enlace nuevo (el
 *     anterior deja de servir);
 *   - si ya entró, no la toca.
 *
 * Uso (con las variables de producción cargadas, nunca contra Neon por descuido):
 *   SUPABASE_DB_URL=… npx tsx scripts/crm-sembrar.ts --victor <correo> --karen <correo> [--url https://calidev.dev]
 *
 * Los correos se pasan por argumento para no dejarlos escritos en el repo.
 */
import { PERSONAS_SEMBRADAS, sembrarHumanos } from "@/lib/crm/sembrar";

function leer(argv: string[]): Map<string, string> {
  const m = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Error(`Argumento suelto: ${a}`);
    const [k, v] = a.includes("=") ? [a.slice(2, a.indexOf("=")), a.slice(a.indexOf("=") + 1)] : [a.slice(2), argv[++i]];
    if (!v) throw new Error(`Falta el valor de --${k}`);
    m.set(k, v);
  }
  return m;
}

async function main(): Promise<number> {
  const args = leer(process.argv.slice(2));
  const conocidas = new Set<string>(["url", ...PERSONAS_SEMBRADAS.map((p) => p.clave)]);
  for (const k of args.keys()) if (!conocidas.has(k)) throw new Error(`Bandera desconocida: --${k}`);
  if (!process.env.SUPABASE_DB_URL) throw new Error("Falta SUPABASE_DB_URL: cárgala con las variables de producción (sin ella el código usaría Neon).");
  if (!PERSONAS_SEMBRADAS.some((p) => args.has(p.clave))) throw new Error("Pasa al menos --victor <correo> o --karen <correo>.");

  console.log(`Base: ${new URL(process.env.SUPABASE_DB_URL).host}\n`);
  const r = await sembrarHumanos({ victor: args.get("victor"), karen: args.get("karen") }, args.get("url") ?? "https://calidev.dev");
  for (const x of r) {
    console.log(`${x.persona} <${x.correo}>: ${x.mensaje}`);
    if (x.enlace) console.log(`  ${x.enlace}\n  Un solo uso, vence en 7 días.`);
    console.log("");
  }
  return 0;
}

main().then(
  (c) => process.exit(c),
  (e: Error) => {
    console.error(`crm-sembrar: ${e.message}`);
    process.exit(1);
  },
);
