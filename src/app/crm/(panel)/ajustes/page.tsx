import { redirect } from "next/navigation";

/** Ajustes pasó a llamarse Agentes; los enlaces viejos siguen sirviendo. */
export default function Ajustes() {
  redirect("/crm/agentes");
}
