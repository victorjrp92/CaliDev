import { pedir } from "../lib/api.ts";
import { type Args, activa, bandera, banderaReq, fecha, id, monto, posReq, soloBanderas } from "../lib/args.ts";
import { errorUso } from "../lib/errores.ts";
import { type Resultado, dia, ficha, pesos, tabla } from "../lib/salida.ts";

export const AYUDA = [
  "calidev cobro listar [--estado pendiente|pagado|anulado|todos] [--mora] [--empresa ID]",
  "calidev cobro crear --empresa ID --valor V --vence AAAA-MM-DD [--moneda COP|EUR|USD] [--concepto arranque|cuota|mensualidad|otro]",
  "                    [--metodo transferencia|stripe|efectivo] [--descripcion T] [--suscripcion ID]   Un agente lo deja en Aprobaciones (sale 4)",
  "calidev cobro pagado <id> [--metodo M] [--fecha AAAA-MM-DD]   Lo marca pagado con la tasa de ese día",
].join("\n");

type Cobro = {
  id: number; empresa: string; concepto: string; descripcion: string | null; valor: string; moneda: string; valor_cop: number;
  vence_at: string; pagado_at: string | null; metodo: string; estado: string; dias_mora: number; enlace_pago: string | null;
};
type Creado = { estado: "creado"; cobro: Cobro } | { estado: "pendiente"; aprobacion: { id: number } };

/** Pesos enteros; EUR y USD admiten dos decimales con punto o coma. */
export function valorDe(v: string, moneda: string, nombre = "valor"): number {
  if (moneda === "COP") return monto(v, nombre);
  const limpio = v.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) throw errorUso(`--${nombre} debe ser un monto con hasta 2 decimales (llegó «${v}»).`, nombre);
  return Number(limpio);
}

const estadoDe = (c: Cobro) => (c.estado === "pendiente" && c.dias_mora > 0 ? `mora ${c.dias_mora} d` : c.estado);
const linea = (c: Cobro) => `#${c.id} ${c.empresa} · ${pesos(c.valor, c.moneda)} · vence ${dia(c.vence_at)} · ${estadoDe(c)}`;

export async function cobro(sub: string | undefined, a: Args): Promise<Resultado> {
  const idem = bandera(a, "idempotency-key");

  if (sub === "listar") {
    soloBanderas(a, ["estado", "mora", "empresa"]);
    const empresa = bandera(a, "empresa");
    const { cuerpo } = await pedir<{ cobros: Cobro[] }>("/cobros", {
      consulta: { estado: bandera(a, "estado"), mora: activa(a, "mora"), empresa_id: empresa ? id(empresa, "empresa") : undefined },
    });
    return {
      datos: cuerpo,
      texto: tabla(["ID", "VENCE", "EMPRESA", "CONCEPTO", "VALOR", "EN PESOS", "MÉTODO", "ESTADO"],
        cuerpo.cobros.map((c) => [c.id, dia(c.vence_at), c.empresa, c.concepto, pesos(c.valor, c.moneda), pesos(c.valor_cop), c.metodo, estadoDe(c)])),
    };
  }

  if (sub === "crear") {
    soloBanderas(a, ["empresa", "valor", "vence", "moneda", "concepto", "metodo", "descripcion", "suscripcion"]);
    const moneda = (bandera(a, "moneda") ?? "COP").toUpperCase();
    const suscripcion = bandera(a, "suscripcion");
    const r = await pedir<Creado>("/cobros", {
      cuerpo: {
        empresa_id: id(banderaReq(a, "empresa"), "empresa"), valor: valorDe(banderaReq(a, "valor"), moneda), vence_at: fecha(banderaReq(a, "vence"), "vence"),
        moneda, concepto: bandera(a, "concepto"), metodo: bandera(a, "metodo"), descripcion: bandera(a, "descripcion"),
        suscripcion_id: suscripcion ? id(suscripcion, "suscripcion") : undefined,
      },
      idempotencia: idem,
    });
    const b = r.cuerpo;
    if (b.estado === "pendiente") return { datos: b, texto: `Pedido: queda en Aprobaciones (#${b.aprobacion.id}). Nada se crea hasta que un humano lo apruebe.`, pendiente: true };
    return { datos: b, texto: `Creado ${linea(b.cobro)}` + (b.cobro.enlace_pago ? `\nEnlace de pago: ${b.cobro.enlace_pago}` : "") };
  }

  if (sub === "pagado") {
    soloBanderas(a, ["metodo", "fecha"]);
    const n = id(posReq(a, 0, "id"));
    const f = bandera(a, "fecha");
    const r = await pedir<{ cobro: Cobro }>(`/cobros/${n}`, {
      metodo: "PATCH", cuerpo: { accion: "pagado", metodo: bandera(a, "metodo"), pagado_at: f ? fecha(f, "fecha") : undefined }, idempotencia: idem,
    });
    const c = r.cuerpo.cobro;
    return { datos: r.cuerpo, texto: ficha([["Pagado", linea(c)], ["En pesos", pesos(c.valor_cop)], ["Método", c.metodo]]) };
  }

  throw errorUso(`cobro: usa listar, crear o pagado.\n${AYUDA}`);
}
