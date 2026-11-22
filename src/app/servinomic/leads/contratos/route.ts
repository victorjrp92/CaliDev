import { NextResponse } from "next/server";
import { panelAbierto } from "@/lib/panel-leads";
import { borrarContratoSinFirmas, crearContrato, todosLosContratos } from "@/lib/contratos/datos";
import { enlaceFirmante } from "@/lib/contratos/correos";
import { leerDatosServinomic } from "@/lib/contratos/leer-datos";
import { faltantesServinomic, htmlServinomic, tituloServinomic } from "@/lib/contratos/plantilla-servinomic";

/**
 * Crear y listar contratos desde el panel. Bajo /servinomic por la cookie del
 * panel. Crear devuelve un enlace por firmante: cada uno se manda a su persona.
 */
export async function GET() {
  if (!(await panelAbierto())) return NextResponse.json({ error: "Abre el panel con la contraseña." }, { status: 401 });
  const contratos = await todosLosContratos();
  return NextResponse.json(
    contratos.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      huella: c.huella,
      creado: c.created_at,
      firmantes: c.firmantes.map((f) => ({
        etiqueta: f.etiqueta,
        enlace: enlaceFirmante(f),
        nombre: f.nombre,
        abierto: f.abierto_at,
        firmado: f.firmado_at,
      })),
    }))
  );
}

/** Borra un contrato de prueba. Uno ya firmado no se borra: es el registro de la firma. */
export async function DELETE(request: Request) {
  if (!(await panelAbierto())) return NextResponse.json({ error: "Abre el panel con la contraseña." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const r = await borrarContratoSinFirmas(Number(body.id));
  return r ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "No existe o ya tiene firmas." }, { status: 409 });
}

export async function POST(request: Request) {
  if (!(await panelAbierto())) return NextResponse.json({ error: "Abre el panel con la contraseña." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // Desde la plantilla: el servidor arma el HTML, así lo firmado es siempre la plantilla.
  if (body.plantilla === "servinomic") {
    const datos = leerDatosServinomic(body.datos);
    const faltan = faltantesServinomic(datos);
    if (faltan.length) return NextResponse.json({ error: `Falta ${faltan.join(", ")}.` }, { status: 400 });
    const { contrato, firmantes: creados } = await crearContrato(
      tituloServinomic(datos),
      htmlServinomic(datos),
      [{ rol: "clienta", etiqueta: "La Clienta" }, { rol: "calidev", etiqueta: "CaliDev" }],
      JSON.stringify(datos)
    );
    return NextResponse.json({ id: contrato.id, firmantes: creados.map((f) => ({ etiqueta: f.etiqueta, enlace: enlaceFirmante(f) })) });
  }

  const titulo = typeof body.titulo === "string" ? body.titulo.trim().slice(0, 200) : "";
  const html = typeof body.html === "string" ? body.html : "";
  const firmantes = Array.isArray(body.firmantes)
    ? body.firmantes
        .map((f) => f as Record<string, unknown>)
        .filter((f) => typeof f.rol === "string" && typeof f.etiqueta === "string")
        .map((f) => ({ rol: String(f.rol).slice(0, 40), etiqueta: String(f.etiqueta).slice(0, 80) }))
    : [];
  if (!titulo || html.length < 200 || firmantes.length === 0) {
    return NextResponse.json({ error: "Faltan título, texto o firmantes." }, { status: 400 });
  }
  const { contrato, firmantes: creados } = await crearContrato(titulo, html, firmantes);
  return NextResponse.json({
    id: contrato.id,
    huella: contrato.huella,
    firmantes: creados.map((f) => ({ etiqueta: f.etiqueta, enlace: enlaceFirmante(f) })),
  });
}
