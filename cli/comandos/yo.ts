import { pedir } from "../lib/api.ts";
import { type Args, soloBanderas } from "../lib/args.ts";
import { leerConfig } from "../lib/config.ts";
import { type Resultado, ficha } from "../lib/salida.ts";

export const AYUDA = "calidev yo                           Quién soy con esta clave y qué puedo hacer";

export type Yo = {
  usuario: { id: number; nombre: string; correo: string; tipo: string; rol: string };
  origen: string;
  clave_id: number | null;
  alcances: string[] | null;
  permisos: string[];
};

export function describirYo(y: Yo, url: string): string {
  return ficha([
    ["Usuario", `${y.usuario.nombre} (#${y.usuario.id}, ${y.usuario.tipo}, rol ${y.usuario.rol})`],
    ["CRM", url],
    ["Clave", y.clave_id === null ? null : `#${y.clave_id}`],
    ["Alcances", y.alcances ? y.alcances.join(", ") : "los de su rol"],
    ["Permisos", y.permisos.join(", ")],
  ]);
}

export async function yo(a: Args): Promise<Resultado> {
  soloBanderas(a, []);
  const c = leerConfig();
  const { cuerpo } = await pedir<Yo>("/yo", { config: c });
  return { datos: cuerpo, texto: describirYo(cuerpo, c.url) };
}
