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
import { sql } from "@/lib/db";
import { crearUsuario, reinvitar } from "@/lib/crm/usuarios";

const PERSONAS = [
  { bandera: "victor", nombre: "Victor Ramos", rol: "dueno" },
  { bandera: "karen", nombre: "Karen Cortés", rol: "socia" },
] as const;

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
  const conocidas = new Set(["url", ...PERSONAS.map((p) => p.bandera)]);
  for (const k of args.keys()) if (!conocidas.has(k)) throw new Error(`Bandera desconocida: --${k}`);
  if (!process.env.SUPABASE_DB_URL) throw new Error("Falta SUPABASE_DB_URL: cárgala con las variables de producción (sin ella el código usaría Neon).");
  const pedidas = PERSONAS.filter((p) => args.has(p.bandera));
  if (!pedidas.length) throw new Error("Pasa al menos --victor <correo> o --karen <correo>.");
  const base = (args.get("url") ?? "https://calidev.dev").replace(/\/+$/, "");

  const host = new URL(process.env.SUPABASE_DB_URL).host;
  console.log(`Base: ${host}\n`);

  for (const p of pedidas) {
    const correo = args.get(p.bandera)!.trim().toLowerCase();
    const r = await sql<{ id: number; rol: string; tipo: string; hash_clave: string | null; activo: boolean }>`
      SELECT id, rol, tipo, hash_clave, activo FROM crm_usuarios WHERE correo = ${correo}`;
    const u = r.rows[0];
    let token: string;
    if (!u) {
      token = (await crearUsuario(null, { nombre: p.nombre, correo, tipo: "humano", rol: p.rol })).invitacion!;
      console.log(`${p.nombre} <${correo}>: creada como ${p.rol}.`);
    } else if (u.tipo !== "humano" || u.rol !== p.rol) {
      console.log(`${p.nombre} <${correo}>: ya existe como ${u.tipo}/${u.rol}, no ${p.rol}. No se cambia; revísalo en Ajustes.`);
      continue;
    } else if (u.hash_clave) {
      console.log(`${p.nombre} <${correo}>: ya eligió contraseña. No se toca.`);
      continue;
    } else {
      token = await reinvitar(null, u.id);
      console.log(`${p.nombre} <${correo}>: seguía sin entrar; enlace nuevo (el anterior ya no sirve).`);
    }
    console.log(`  ${base}/crm/invitacion/${token}\n  Un solo uso, vence en 7 días.\n`);
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
