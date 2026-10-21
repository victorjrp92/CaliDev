import { notFound } from "next/navigation";
import { arranquePorToken, respuestasDe } from "@/lib/arranque/datos";
import { FormularioArranque } from "@/components/arranque/formulario-arranque";

export const dynamic = "force-dynamic";

/**
 * calidev.dev/arranque/<token>: el formulario de arranque de un cliente.
 * Llega con lo que ya haya llenado, para seguir donde lo dejó.
 */
export default async function PaginaArranque({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const a = await arranquePorToken(token);
  if (!a) notFound();
  return (
    <FormularioArranque
      token={a.token}
      cliente={a.cliente}
      inicial={respuestasDe(a)}
      enviado={Boolean(a.enviado_at)}
    />
  );
}
