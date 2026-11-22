import { pedir } from "../lib/api.ts";
import { type Args, bandera, id, posReq, soloBanderas } from "../lib/args.ts";
import { errorUso } from "../lib/errores.ts";
import { type Resultado, fechaHora, ficha, recortar, tabla, titulo } from "../lib/salida.ts";

export const AYUDA = [
  'calidev persona buscar "<texto>" [--limite N]',
  "calidev persona ver <id>                    Datos, línea de tiempo, oportunidades y notas",
].join("\n");

type Persona = { id: number; nombre: string; correo: string | null; whatsapp: string | null; usuario_ig: string | null; empresa: string | null; origen: string | null; notas: string | null; created_at: string };
type Hito = { at: string; tipo: string; titulo: string; detalle: string | null };
type Oportunidad = { id: number; titulo: string; etapa: string; proximo_paso: string | null; proximo_paso_at: string | null };
type Nota = { id: number; tipo: string; autor: string | null; cuerpo: string; created_at: string };

export async function persona(sub: string | undefined, a: Args): Promise<Resultado> {
  if (sub === "buscar") {
    soloBanderas(a, ["limite"]);
    const q = a.pos.join(" ").trim();
    const limite = bandera(a, "limite");
    const { cuerpo } = await pedir<{ personas: Persona[] }>("/personas", { consulta: { q: q || undefined, limite: limite ? id(limite, "limite") : undefined } });
    return {
      datos: cuerpo,
      texto: tabla(["ID", "NOMBRE", "WHATSAPP", "CORREO", "EMPRESA", "ORIGEN"], cuerpo.personas.map((p) => [p.id, p.nombre, p.whatsapp, p.correo, p.empresa, p.origen])),
    };
  }
  if (sub === "ver") {
    soloBanderas(a, []);
    const n = id(posReq(a, 0, "id"));
    const { cuerpo } = await pedir<{ persona: Persona; linea_de_tiempo: Hito[]; oportunidades: Oportunidad[] | null; notas: Nota[] | null }>(`/personas/${n}`);
    const p = cuerpo.persona;
    const partes = [ficha([
      ["Persona", `${p.nombre} (#${p.id})`], ["WhatsApp", p.whatsapp], ["Correo", p.correo], ["Instagram", p.usuario_ig],
      ["Empresa", p.empresa], ["Origen", p.origen], ["Desde", fechaHora(p.created_at)], ["Notas", p.notas],
    ])];
    if (cuerpo.oportunidades) {
      partes.push(titulo("Oportunidades"));
      partes.push(tabla(["ID", "ETAPA", "TÍTULO", "PRÓXIMO PASO", "FECHA"], cuerpo.oportunidades.map((o) => [o.id, o.etapa, o.titulo, o.proximo_paso, fechaHora(o.proximo_paso_at)])));
    }
    partes.push(titulo("Línea de tiempo"));
    partes.push(tabla(["CUÁNDO", "TIPO", "QUÉ", "DETALLE"], cuerpo.linea_de_tiempo.map((e) => [fechaHora(e.at), e.tipo, e.titulo, e.detalle ? recortar(e.detalle, 60) : null])));
    if (cuerpo.notas) {
      partes.push(titulo("Notas"));
      partes.push(tabla(["ID", "CUÁNDO", "TIPO", "AUTOR", "NOTA"], cuerpo.notas.map((x) => [x.id, fechaHora(x.created_at), x.tipo, x.autor, recortar(x.cuerpo, 70)])));
    }
    return { datos: cuerpo, texto: partes.join("\n") };
  }
  throw errorUso(`persona: usa buscar o ver.\n${AYUDA}`);
}
