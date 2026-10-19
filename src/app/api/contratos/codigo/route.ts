import { NextResponse } from "next/server";
import { contratoPorId, firmantePorToken, nuevoCodigo } from "@/lib/contratos/datos";
import { correoCodigo } from "@/lib/contratos/correos";
import { leerCorreo } from "@/lib/contratos/validar";
import { enviarCorreo } from "@/lib/delegar/correos/enviar";

/**
 * Envía el código de 6 dígitos al correo que la persona escribió en el
 * formulario. Es lo que demuestra que ese correo es suyo: la firma solo se
 * acepta con el código que llegó ahí.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const firmante = await firmantePorToken(typeof body.token === "string" ? body.token : "");
  if (!firmante) return NextResponse.json({ error: "Este enlace no es válido." }, { status: 404 });
  const correo = leerCorreo(body.correo);
  if (!correo) return NextResponse.json({ error: "Revisa tu correo." }, { status: 400 });

  const r = await nuevoCodigo(firmante, correo);
  if (!r.ok) {
    return r.motivo === "firmado"
      ? NextResponse.json({ error: "Este contrato ya está firmado." }, { status: 409 })
      : NextResponse.json({ error: "Ya te enviamos un código. Espera un minuto para pedir otro." }, { status: 429 });
  }

  const contrato = await contratoPorId(firmante.contrato_id);
  const ok = contrato ? await enviarCorreo(correoCodigo(correo, r.codigo, contrato)) : false;
  if (!ok) return NextResponse.json({ error: "No pudimos enviar el código. Intenta de nuevo en un minuto." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
