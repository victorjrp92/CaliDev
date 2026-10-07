import { redirect } from "next/navigation";

/** El panel ya no va por campaña: todo el seguimiento vive en /servinomic/leads. */
export default function PanelViejo() {
  redirect("/servinomic/leads");
}
