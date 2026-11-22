import type { Metadata } from "next";
import Link from "next/link";
import { invitacionVigente } from "@/lib/crm/usuarios";
import { TarjetaAcceso } from "../../tarjeta-acceso";
import { FormularioInvitacion } from "./formulario-invitacion";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invitación" };

/** Enlace de un solo uso: la persona elige su contraseña y queda dentro. */
export default async function Invitacion({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const u = await invitacionVigente(token).catch(() => null);
  return (
    <TarjetaAcceso titulo={u ? `Hola, ${u.nombre.split(" ")[0]}` : "Este enlace ya no sirve"}>
      {u ? (
        <>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--texto-2)]">
            Elige tu contraseña para entrar al CRM con <strong className="font-semibold text-[var(--texto)]">{u.correo}</strong>. Mínimo 10 caracteres; una frase corta sirve.
          </p>
          <FormularioInvitacion token={token} correo={u.correo} />
        </>
      ) : (
        <>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--texto-2)]">
            Se usó una vez o venció. Pide a Victor uno nuevo; si ya tienes contraseña, entra directo.
          </p>
          <Link href="/crm/entrar" className="boton-principal mt-8 text-center">Ir a entrar</Link>
        </>
      )}
    </TarjetaAcceso>
  );
}
