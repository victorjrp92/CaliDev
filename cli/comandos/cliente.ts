import { pedir } from "../lib/api.ts";
import { type Args, bandera, banderaReq, fecha, id, posReq, soloBanderas } from "../lib/args.ts";
import { errorUso } from "../lib/errores.ts";
import { type Resultado, dia, ficha, pesos } from "../lib/salida.ts";
import { valorDe } from "./cobro.ts";

export const AYUDA = [
  'calidev cliente alta "<empresa>" --contacto "<nombre>" [--correo C] [--whatsapp W] [--nit N] [--producto ID]',
  "                     [--mensual V] [--arranque V] [--promo CODIGO] [--moneda COP|EUR|USD] [--personas N]",
  "                     [--permanencia AAAA-MM-DD] [--inicio AAAA-MM-DD] [--cobros V@AAAA-MM-DD,V@AAAA-MM-DD]",
  "                     Empresa, contacto, suscripción y cobros en un paso (precio publicado si no das valores)",
].join("\n");

type Cobro = { id: number; valor: string; moneda: string; vence_at: string; metodo: string };
type Alta = {
  persona: { id: number; nombre: string; empresa: string | null };
  suscripcion: { id: number; valor_mensual: string; valor_arranque: string; moneda: string };
  cobros: Cobro[];
  promo: string | null;
};

/** "950000@2026-12-05,900000@2027-01-05" → cobros (concepto cuota). */
export function cobrosDe(v: string, moneda: string) {
  return v.split(",").map((t, i) => {
    const [valor, vence] = t.trim().split("@");
    if (!valor || !vence) throw errorUso(`--cobros: cada cobro va como VALOR@AAAA-MM-DD (el ${i + 1}.º llegó «${t}»).`, "cobros");
    return { valor: valorDe(valor, moneda, "cobros"), vence: fecha(vence, "cobros"), concepto: "cuota" };
  });
}

export async function cliente(sub: string | undefined, a: Args): Promise<Resultado> {
  if (sub !== "alta") throw errorUso(`cliente: usa alta.\n${AYUDA}`);
  soloBanderas(a, ["contacto", "correo", "whatsapp", "nit", "producto", "mensual", "arranque", "promo", "moneda", "personas", "permanencia", "inicio", "cobros"]);
  const empresa = posReq(a, 0, "empresa");
  const moneda = (bandera(a, "moneda") ?? "COP").toUpperCase();
  const [producto, mensual, arranque, personas, permanencia, inicio, cobros] =
    ["producto", "mensual", "arranque", "personas", "permanencia", "inicio", "cobros"].map((k) => bandera(a, k));
  const r = await pedir<Alta>("/clientes", {
    cuerpo: {
      empresa, nit: bandera(a, "nit"),
      contacto: { nombre: banderaReq(a, "contacto"), correo: bandera(a, "correo"), whatsapp: bandera(a, "whatsapp") },
      producto_id: producto ? id(producto, "producto") : undefined,
      valor_mensual: mensual ? valorDe(mensual, moneda, "mensual") : undefined,
      valor_arranque: arranque ? valorDe(arranque, moneda, "arranque") : undefined,
      promo: bandera(a, "promo"), moneda, personas: personas ? id(personas, "personas") : undefined,
      permanencia_hasta: permanencia ? fecha(permanencia, "permanencia") : undefined, inicio: inicio ? fecha(inicio, "inicio") : undefined,
      cobros: cobros ? cobrosDe(cobros, moneda) : undefined,
    },
    idempotencia: bandera(a, "idempotency-key"),
  });
  const x = r.cuerpo;
  return {
    datos: x,
    texto: ficha([
      ["Cliente", `${x.persona.empresa ?? empresa} · contacto ${x.persona.nombre} (#${x.persona.id})`],
      ["Suscripción", `#${x.suscripcion.id} · arranque ${pesos(x.suscripcion.valor_arranque, x.suscripcion.moneda)} · mensual ${pesos(x.suscripcion.valor_mensual, x.suscripcion.moneda)}`],
      ["Promo", x.promo ?? "—"],
      ["Cobros", x.cobros.length ? x.cobros.map((c) => `#${c.id} ${pesos(c.valor, c.moneda)} vence ${dia(c.vence_at)}`).join(" · ") : "ninguno"],
    ]),
  };
}
