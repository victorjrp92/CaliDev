/**
 * Permisos del CRM (docs/crm/spec.md §2). Un permiso es `area:verbo`; un rol
 * es un conjunto de permisos; una clave de agente lleva alcances que limitan
 * los de su rol y nunca los amplían.
 *
 * «Los agentes no cierran» vive aquí: PROHIBIDOS_AGENTE se niega a todo
 * usuario de tipo agente aunque su rol o su clave digan otra cosa.
 */

export const PERMISOS = [
  "contactos:leer",
  "contactos:escribir",
  "ventas:leer",
  "ventas:escribir",
  "oportunidad:ganar",
  "precio:fijar",
  "agenda:leer",
  "agenda:escribir",
  "tareas:leer",
  "tareas:escribir",
  "notas:leer",
  "notas:escribir",
  "aprobaciones:leer",
  "aprobaciones:solicitar",
  "aprobaciones:decidir",
  "auditoria:leer",
  "usuarios:gestionar",
  "claves:propias",
  "claves:gestionar",
  "sistema:sincronizar",
  // Entregas 1b y 1c: se declaran ya para que las claves puedan pedirlos.
  "contratos:leer",
  "contratos:escribir",
  "contrato:enviar",
  "finanzas:leer",
  "finanzas:escribir",
  "cobros:borrador",
  "cobros:crear",
] as const;

export type Permiso = (typeof PERMISOS)[number];
export type Rol = "dueno" | "socia" | "agente" | "sistema";
export type TipoUsuario = "humano" | "agente";

export const PROHIBIDOS_AGENTE: readonly Permiso[] = [
  "aprobaciones:decidir",
  "oportunidad:ganar",
  "contrato:enviar",
  "precio:fijar",
  "usuarios:gestionar",
  "claves:gestionar",
  "claves:propias",
];

const TODOS = new Set<Permiso>(PERMISOS);

export const ROLES: Record<Rol, ReadonlySet<Permiso>> = {
  dueno: TODOS,
  // Karen: todo lo operativo, incluido aprobar. No gestiona usuarios ni claves ajenas.
  socia: new Set(PERMISOS.filter((p) => p !== "usuarios:gestionar" && p !== "claves:gestionar")),
  agente: new Set<Permiso>([
    "contactos:leer",
    "contactos:escribir",
    "ventas:leer",
    "ventas:escribir",
    "agenda:leer",
    "tareas:leer",
    "tareas:escribir",
    "notas:leer",
    "notas:escribir",
    "aprobaciones:leer",
    "aprobaciones:solicitar",
    "contratos:leer",
    "finanzas:leer",
    "cobros:borrador",
  ]),
  // Los crons (ciclo de IG, webhook de Stripe): leen, sincronizan y piden aprobación.
  sistema: new Set<Permiso>([
    "contactos:leer",
    "contactos:escribir",
    "ventas:leer",
    "agenda:leer",
    "notas:escribir",
    "tareas:escribir",
    "aprobaciones:solicitar",
    "sistema:sincronizar",
  ]),
};

export const ROLES_HUMANOS: Rol[] = ["dueno", "socia"];
export const ROLES_AGENTE: Rol[] = ["agente", "sistema"];

export function esRol(x: unknown): x is Rol {
  return typeof x === "string" && x in ROLES;
}

/** ¿El alcance `a` (que puede ser `*` o `area:*`) cubre el permiso `p`? */
function cubre(a: string, p: Permiso): boolean {
  if (a === "*" || a === p) return true;
  return a.endsWith(":*") && p.startsWith(a.slice(0, -1));
}

/**
 * Un usuario tiene un permiso si su rol lo da, la clave (si entró con clave)
 * lo incluye en sus alcances, y no es un agente pidiendo algo prohibido.
 * `alcances === null` significa sesión humana sin clave: manda solo el rol.
 */
export function tienePermiso(
  u: { tipo: TipoUsuario; rol: string },
  alcances: readonly string[] | null,
  p: Permiso,
): boolean {
  if (!esRol(u.rol)) return false;
  if (u.tipo === "agente" && PROHIBIDOS_AGENTE.includes(p)) return false;
  if (u.tipo === "agente" && ROLES_HUMANOS.includes(u.rol)) return false; // un agente con rol humano es un error de datos
  if (!ROLES[u.rol].has(p)) return false;
  if (alcances === null) return true;
  return alcances.some((a) => cubre(a, p));
}

/** Los alcances que se pueden pedir para una clave: solo los que el rol del dueño de la clave tiene. */
export function alcancesValidos(rol: Rol, tipo: TipoUsuario, pedidos: string[]): { ok: string[]; invalidos: string[] } {
  const ok: string[] = [];
  const invalidos: string[] = [];
  for (const a of pedidos) {
    const alguno = PERMISOS.some((p) => cubre(a, p) && tienePermiso({ tipo, rol }, null, p));
    (alguno ? ok : invalidos).push(a);
  }
  return { ok, invalidos };
}
