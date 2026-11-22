"use client";

import { useState } from "react";

/** Copia el enlace de firma sin mostrarlo: es personal y quien lo tiene firma. */
export function CopiarEnlace({ enlace }: { enlace: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button type="button" className="boton-chico" onClick={async () => {
      await navigator.clipboard.writeText(enlace).catch(() => null);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    }}>
      {copiado ? "Copiado" : "Copiar enlace"}
    </button>
  );
}
