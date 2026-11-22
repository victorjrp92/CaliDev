import { permanentRedirect } from "next/navigation";

/** El panel ya no va por campaña: todo el seguimiento vive en el CRM. */
export default function PanelViejo() {
  permanentRedirect("/crm/ventas");
}
