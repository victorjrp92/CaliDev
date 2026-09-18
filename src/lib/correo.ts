/**
 * Correo de confirmación al registrarse, por la API de Resend.
 *
 * Existe porque el formulario promete respuesta en 24 horas y esa promesa
 * necesita una prueba inmediata. Hace tres cosas a la vez: devuelve algo al
 * instante a quien acaba de dar sus datos, demuestra que el correo que escribió
 * está bien escrito, y deja constancia por escrito de lo que prometimos.
 *
 * ── Nunca puede tumbar el registro ──
 *
 * Si falta la clave, si Resend responde con un error o si la red se cae, esta
 * función no lanza: devuelve `false` y se sigue. Un lead guardado sin correo de
 * confirmación es un lead; un formulario que falla porque el proveedor de
 * correo tuvo un mal minuto es un lead perdido para siempre. Por eso además se
 * llama DESPUÉS de haber guardado en base de datos, nunca antes.
 *
 * ── Configuración ──
 *
 * `RESEND_API_KEY` y `CORREO_REMITENTE` en Vercel. Sin la primera no se envía
 * nada y el sitio funciona igual; el remitente tiene que ser una dirección de
 * un dominio verificado en Resend.
 *
 * Se llama a la API con `fetch` y no con el SDK a propósito: es una petición
 * POST con un JSON, y no vale añadir una dependencia —con su superficie de
 * actualizaciones y su peso— para ahorrarse quince líneas.
 */

const REMITENTE_POR_DEFECTO = "Cali Dev <hola@calidev.dev>";

export type DatosConfirmacion = {
  nombre: string;
  correo: string;
  /** Lo que la persona eligió en "¿cómo empezamos?", para cerrar con su canal. */
  arranque?: string;
};

function lineaArranque(arranque: string | undefined): string {
  if (arranque === "ya") return "Si encajamos, te escribimos por WhatsApp esta semana.";
  if (arranque === "1-3m") return "Si encajamos, coordinamos esa llamada corta contigo.";
  if (arranque === "explorando")
    return "Te mandamos primero la información por aquí, sin prisa.";
  return "Si encajamos, te escribimos por WhatsApp.";
}

/**
 * El cuerpo es texto y HTML sencillo, sin imágenes ni maquetación de campaña.
 *
 * Un correo transaccional que llega con plantilla de boletín se lee como
 * publicidad y se filtra como publicidad. Este tiene que parecer —y ser— un
 * mensaje de una persona que confirma algo.
 */
function cuerpo({ nombre, arranque }: DatosConfirmacion) {
  const saludo = nombre.trim().split(" ")[0] || "Hola";
  const cierre = lineaArranque(arranque);

  const texto = [
    `${saludo}, recibimos tu solicitud.`,
    "",
    "Revisamos cada caso a mano, uno por uno. En 24 horas tienes respuesta, encajemos o no — si no es el momento, también te lo decimos.",
    "",
    cierre,
    "",
    "— El equipo de Cali Dev",
    "calidev.dev",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:16px;line-height:1.6;color:#14201B;max-width:520px">
      <p>${saludo}, recibimos tu solicitud.</p>
      <p>Revisamos cada caso a mano, uno por uno. <strong>En 24 horas tienes respuesta</strong>, encajemos o no — si no es el momento, también te lo decimos.</p>
      <p>${cierre}</p>
      <p style="color:#46554D">— El equipo de Cali Dev<br>
      <a href="https://calidev.dev" style="color:#0A3D2E">calidev.dev</a></p>
    </div>
  `.trim();

  return { texto, html };
}

export async function enviarConfirmacion(datos: DatosConfirmacion): Promise<boolean> {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) return false;

  const remitente = process.env.CORREO_REMITENTE || REMITENTE_POR_DEFECTO;
  const { texto, html } = cuerpo(datos);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remitente,
        to: [datos.correo],
        subject: "Recibimos tu solicitud — respuesta en 24 horas",
        text: texto,
        html,
      }),
    });

    if (!res.ok) {
      console.error("Resend respondió", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error enviando confirmación:", err);
    return false;
  }
}
