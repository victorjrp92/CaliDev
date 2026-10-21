"use client";

import type { Seccion, Valores } from "@/lib/arranque/esquema";
import { errorCampo, visible } from "@/lib/arranque/validar";
import { Campo } from "@/components/arranque/campo";

/** Una sección de campos sueltos. Los campos condicionales aparecen solo cuando aplican. */
export function SeccionCampos({
  seccion: s,
  valor,
  onCambio,
  mostrarErrores,
}: {
  seccion: Seccion;
  valor: Valores;
  onCambio: (v: Valores) => void;
  mostrarErrores: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      {s.campos
        .filter((c) => visible(c, valor))
        .map((c) => (
          <Campo
            key={c.id}
            campo={c}
            idBase={s.id}
            valor={valor[c.id]}
            error={mostrarErrores ? errorCampo(c, valor) : null}
            onCambio={(v) => onCambio({ ...valor, [c.id]: v })}
          />
        ))}
    </div>
  );
}
