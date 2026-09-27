// Deja la última publicación lista para la prueba real con una cuenta nueva.
import { sql } from "../../src/lib/db";
import { guardarAutomatizacion } from "../../src/lib/social/datos";
import { evento, fijarAjuste } from "../../src/lib/social/db";
import { TEXTOS_INICIALES } from "../../src/lib/social/textos";
import { validarAutomatizacion } from "../../src/lib/social/validar";

const ID = "18222221302331797";
const CONTEXTO =
  "El video explica cómo el trabajo repetitivo se come las horas de un dueño de pyme y muestra dos cosas gratis " +
  "para montar hoy: respuestas rápidas de WhatsApp Business y un formulario de Google que cae en una hoja de cálculo. " +
  "Cierra con la frase de Michael Gerber sobre que si el negocio depende de ti, no tienes un negocio sino un empleo, " +
  "y pregunta a la gente si tenía razón. Calidev ordena y digitaliza negocios pequeños.";

async function main() {
  const r = validarAutomatizacion({
    modo: "automatico", sensible: false,
    landingUrl: "https://calidev.dev/servinomic/limpiaexpress",
    palabrasClave: ["ayuda", "info"], detectarInteres: true, umbral: 0.7,
    contexto: CONTEXTO, textos: TEXTOS_INICIALES,
  });
  if (!r.ok) throw new Error(r.error);
  await guardarAutomatizacion({ mediaId: ID, ...r.valor, activar: true });
  // Solo los comentarios NUEVOS desde ahora: los viejos no se tocan.
  await sql`UPDATE social_automatizaciones SET activado_en = NOW(), proxima_revision = NOW() WHERE media_id = ${ID}`;
  // Que ninguna otra publicación esté activa durante la prueba.
  await sql`UPDATE social_automatizaciones SET modo = 'apagado' WHERE media_id <> ${ID}`;
  await fijarAjuste("simulacion", "0");
  await fijarAjuste("pausado", "0");
  await evento("Prueba real: agente activo solo en la publicación del 21 sep, modo real", "alerta", ID);

  const { rows } = await sql`
    SELECT a.media_id, a.modo, a.umbral, a.landing_url, a.activado_en, a.palabras_clave,
      (SELECT valor FROM social_ajustes WHERE clave='simulacion') AS simulacion,
      (SELECT valor FROM social_ajustes WHERE clave='pausado') AS pausado
    FROM social_automatizaciones a WHERE a.media_id = ${ID}`;
  console.log(rows[0]);
  const { rows: otras } = await sql`SELECT COUNT(*) n FROM social_automatizaciones WHERE modo <> 'apagado'`;
  console.log("publicaciones activas:", otras[0].n);
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
