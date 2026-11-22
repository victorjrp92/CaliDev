import { Campo } from "../../campo";

export function CampoTexto({ etiqueta, valor, cambiar, ayuda, ejemplo, tipo = "text" }: { etiqueta: string; valor: string; cambiar: (v: string) => void; ayuda?: string; ejemplo?: string; tipo?: "text" | "date" }) {
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda}>
      <input type={tipo} className="campo" value={valor} placeholder={ejemplo} maxLength={200} onChange={(e) => cambiar(e.target.value)} />
    </Campo>
  );
}
