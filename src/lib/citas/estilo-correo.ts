/**
 * Piezas comunes de los correos de citas, con el diseño B de la confirmación de
 * leads: encabezado verde con etiqueta en mono, cuerpo blanco sobre niebla.
 *
 * Tablas y estilos en línea, que es lo único que respetan Gmail y Outlook.
 */

export const C = {
  verde: "#0A3D2E",
  lima: "#C8F045",
  hueso: "#FAFAF7",
  tinta: "#14201B",
  texto: "#2C3A33",
  gris: "#46554D",
  niebla: "#E6E8E3",
  linea: "#D8DCD4",
};
export const FUENTE = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
export const MONO = "'SFMono-Regular',Menlo,Consolas,monospace";

export function etiqueta(texto: string): string {
  return `<div style="font-family:${MONO};font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${C.gris};margin:0 0 8px">${texto}</div>`;
}

export function boton(texto: string, href: string, variante: "lima" | "verde" = "lima"): string {
  const colores =
    variante === "lima"
      ? `background:${C.lima};color:${C.tinta}`
      : `background:${C.verde};color:${C.hueso}`;
  return `<a href="${href}" style="display:inline-block;${colores};font-family:${FUENTE};font-weight:700;font-size:15px;padding:12px 18px;border-radius:12px;text-decoration:none">${texto}</a>`;
}

/** El marco completo: vista previa oculta, fondo niebla, tarjeta blanca de 520 px. */
export function marco(opciones: {
  titulo: string;
  vistaPrevia: string;
  meta: string;
  encabezado: string;
  cuerpo: string;
  pie: string;
}): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${opciones.titulo}</title></head>
<body style="margin:0;padding:0;background:${C.niebla}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${opciones.vistaPrevia}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.niebla}">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden">
        <tr><td style="background:${C.verde};padding:22px 24px 24px;font-family:${FUENTE}">
          <div style="font-family:${MONO};font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${C.lima}">${opciones.meta}</div>
          <div style="margin-top:10px;font-size:24px;line-height:1.2;font-weight:800;color:${C.hueso}">${opciones.encabezado}</div>
        </td></tr>
        ${opciones.cuerpo}
      </table>
      <div style="max-width:520px;margin-top:12px;font-family:${FUENTE};font-size:12px;color:${C.gris}">${opciones.pie}</div>
    </td></tr>
  </table>
</body></html>`;
}

export function firma(): string {
  return `<div style="margin-top:18px;font-weight:700;color:${C.tinta}">Víctor</div>
          <div style="color:${C.gris}">CaliDev · <a href="https://calidev.dev" style="color:${C.verde}">calidev.dev</a></div>`;
}
