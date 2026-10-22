import { sql } from "@/lib/db";

/**
 * Mensajes del formulario de contacto de calidev.dev. Antes iban a Formspree,
 * que los mandaba al correo personal de Victor y no dejaba rastro en ningún
 * lado; ahora cada uno queda aquí y llega a calidevdev@gmail.com.
 */
export type Contacto = { id: number; nombre: string; correo: string; mensaje: string; pagina: string | null; created_at: string };

let tabla: Promise<unknown> | null = null;
function asegurarTabla() {
  tabla ??= sql`
    CREATE TABLE IF NOT EXISTS contactos (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      pagina TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch((err) => {
    tabla = null;
    throw err;
  });
  return tabla;
}

export async function guardarContacto(c: { nombre: string; correo: string; mensaje: string; pagina: string | null }): Promise<Contacto> {
  await asegurarTabla();
  const r = await sql<Contacto>`
    INSERT INTO contactos (nombre, correo, mensaje, pagina) VALUES (${c.nombre}, ${c.correo}, ${c.mensaje}, ${c.pagina}) RETURNING *
  `;
  return r.rows[0];
}
