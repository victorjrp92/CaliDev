import { NextResponse, after } from "next/server";
import { contratoPorId, firmantePorToken, firmantesDe, firmar } from "@/lib/contratos/datos";
import { correoAvisoFirma, correoCompleto, correoConstancia } from "@/lib/contratos/correos";
import { ipDe, leerFormulario } from "@/lib/contratos/validar";
import { enviarCorreo } from "@/lib/delegar/correos/enviar";

/**
 * Registra la firma: datos de la persona, el dibujo de su firma, el código
 * que llegó a su correo, la IP y el navegador. Después salen los correos:
 * constancia para quien firmó, aviso a Víctor y, si ya firmaron todos, el
 * contrato completo para cada parte.
 */
const MOTIVOS: Record<string, [string, number]> = {
  firmado: ["Este contrato ya está firmado.", 409],
  "sin-codigo": ["Primero pide el código a tu correo.", 400],
  "otro-correo": ["El código se envió a otro correo. Pide uno nuevo para este.", 400],
  vencido: ["El código venció. Pide uno nuevo.", 400],
  intentos: ["Demasiados intentos. Pide un código nuevo.", 429],
  incorrecto: ["El código no coincide. Revisa el correo e inténtalo otra vez.", 400],
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const firmante = await firmantePorToken(typeof body.token === "string" ? body.token : "");
  if (!firmante) return NextResponse.json({ error: "Este enlace no es válido." }, { status: 404 });

  const leido = leerFormulario(body);
  if (!leido.ok) return NextResponse.json({ error: leido.error }, { status: 400 });
  const { codigo, ...datos } = leido.datos;

  const r = await firmar(firmante, codigo, {
    ...datos,
    ip: ipDe(request),
    navegador: (request.headers.get("user-agent") ?? "").slice(0, 300),
  });
  if (!r.ok) {
    const [error, status] = MOTIVOS[r.motivo];
    return NextResponse.json({ error }, { status });
  }

  after(async () => {
    const contrato = await contratoPorId(r.firmante.contrato_id);
    if (!contrato) return;
    const todos = await firmantesDe(contrato.id);
    const faltan = todos.filter((x) => !x.firmado_at);
    await enviarCorreo(correoAvisoFirma(r.firmante, contrato, faltan));
    // Quien firma de último recibe directamente el aviso de contrato completo.
    if (faltan.length > 0) await enviarCorreo(correoConstancia(r.firmante, contrato));
    else for (const f of todos) if (f.correo) await enviarCorreo(correoCompleto(f, contrato));
  });

  return NextResponse.json({ ok: true });
}
