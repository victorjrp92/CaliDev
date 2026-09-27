import type { Textos } from "./tipos";

/**
 * Valores iniciales de una automatización nueva. Son los que se probaron en
 * vivo el 27 sep 2026 con el agente local (ig-agente/config.py). Victor los
 * edita por publicación desde el panel; aquí solo viven los de partida.
 *
 * Los textos públicos rotan entre variantes para que Instagram no vea cientos
 * de respuestas idénticas (señal de spam). Los botones van en ≤ 20 caracteres:
 * es el límite de Meta.
 */
export const TEXTOS_INICIALES: Textos = {
  pregunta: "¡Hola! 😊 Para orientarte mejor: ¿tienes un negocio o emprendimiento?",
  si: "¡Genial! 🙌 Conoce un poco más de nosotros y recibe tu asesoría gratis:",
  no: "¡Listo! Cuéntanos en qué te podemos ayudar 😊",
  aliado: "¡Con gusto te atenderán en LimpiaExpress! 💙",
  botonSi: "Sí, tengo negocio",
  botonNo: "No",
  botonAliado: "Busco LimpiaExpress",
  pubContacto: [
    "¡Gracias por tu interés! Te escribimos por mensaje 📩",
    "¡Con mucho gusto! Revisa tus mensajes, te escribimos 📩",
    "¡Gracias! Ya te enviamos un mensaje 😊",
    "¡Qué bueno! Te escribimos por interno 📩",
  ],
  pubAliado: [
    "¡Con gusto te atienden en @limpiaexpress_cali! 💙",
    "¡Escríbeles a @limpiaexpress_cali, con gusto te atienden! 💙",
    "¡Claro! En @limpiaexpress_cali te atienden con mucho gusto 💙",
  ],
  pubCritica: ["¡Gracias por tu comentario!", "Gracias por tu comentario 🙏"],
  tarjetaSi: {
    titulo: "Asesoría gratis · Calidev",
    subtitulo: "Conoce un poco más de nosotros y recibe tu asesoría gratis.",
    boton: "Quiero mi asesoría",
  },
  tarjetaAliado: {
    titulo: "LimpiaExpress Cali",
    subtitulo: "Servicio de limpieza para hogares y empresas.",
    boton: "Ir a LimpiaExpress",
    url: "https://www.instagram.com/limpiaexpress_cali/",
  },
};

/** Reglas de voz para DeepSeek cuando redacta con contexto. */
export const ESTILO_IA = `Eres el community manager de Calidev, una empresa colombiana que ordena y digitaliza negocios.
Respondes comentarios de Instagram en las publicaciones de @calidevdev.
Reglas:
- Español latino, de tú, cálido y cercano. Habla como "nosotros" (el equipo de Calidev).
- Máximo 2 frases cortas y 1 o 2 emojis. Nada de hashtags.
- Responde a lo que la persona dijo, no con una frase genérica.
- Nunca des precios, nunca prometas resultados, nunca inventes datos ni nombres.
- Si agradecen o felicitan, agradece y transmite la idea de que nos hace felices mejorar negocios y vidas.
- Devuelve SOLO el texto de la respuesta, sin comillas.`;
