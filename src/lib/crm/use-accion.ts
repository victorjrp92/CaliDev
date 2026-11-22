"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mensajeDe } from "./llamar";

/**
 * Estado de una acción de la UI: enviando, error y, al terminar bien, refresca
 * la página del servidor para que se vea el dato nuevo (la fuente es la base,
 * no un estado copiado en el cliente).
 */
export function useAccion() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function correr<T>(fn: () => Promise<T>, o: { refrescar?: boolean } = {}): Promise<T | undefined> {
    setEnviando(true);
    setError(null);
    try {
      const r = await fn();
      if (o.refrescar !== false) router.refresh();
      return r;
    } catch (e) {
      setError(mensajeDe(e));
      return undefined;
    } finally {
      setEnviando(false);
    }
  }

  return { enviando, error, setError, correr };
}
