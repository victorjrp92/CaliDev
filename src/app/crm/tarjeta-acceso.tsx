import { LogoCrm } from "./logo-crm";

/** Entrar e invitación: una tarjeta sola en el centro, fuera del menú del panel. */
export function TarjetaAcceso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col justify-center px-4 py-12">
      <div className="panel flex flex-col px-6 py-7">
        <p className="flex items-center gap-2.5"><LogoCrm tamano={30} /><span className="marca-nombre">Calidev</span><span className="nota">CRM</span></p>
        <div className="mt-6"><h1 className="titulo-grande">{titulo}</h1></div>
        {children}
      </div>
    </main>
  );
}
