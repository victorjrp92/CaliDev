import fs from "fs";
import path from "path";
import matter from "gray-matter";

/**
 * Textos legales, uno por idioma, en `content/legal/<nombre>.<idioma>.md`.
 *
 * Viven como archivo y no en `messages/*.json` porque son documentos largos con
 * tablas y enlaces, y porque tienen efecto legal: cambiar una coma tiene que
 * quedar en el historial de git como un cambio al texto, no escondido entre
 * cientos de claves de interfaz.
 *
 * Sin respaldo a otro idioma: si falta la versión pedida, la página da 404.
 * Servir el texto en inglés bajo /de/ haría pasar una política por traducida
 * cuando no lo está.
 */
const DIRECTORIO = path.join(process.cwd(), "content/legal");

export interface TextoLegal {
  titulo: string;
  descripcion: string;
  vigencia: string;
  contenido: string;
}

export function textoLegal(nombre: string, idioma: string): TextoLegal | null {
  const archivo = path.join(DIRECTORIO, `${nombre}.${idioma}.md`);
  if (!fs.existsSync(archivo)) return null;
  const { data, content } = matter(fs.readFileSync(archivo, "utf8"));
  return {
    titulo: String(data.titulo),
    descripcion: String(data.descripcion),
    vigencia: String(data.vigencia),
    contenido: content,
  };
}
