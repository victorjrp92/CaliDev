import { LeadsTable } from "@/components/admin/leads-table";

export default function AdminLeadsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Leads</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Ordenados por puntaje. El total es valor × intención ÷ 100 — sube quien
        es grande y está listo a la vez, no solo grande.
      </p>
      <LeadsTable />
    </div>
  );
}
