"use client";

import { Fragment, useEffect, useState } from "react";
import { labelFor } from "@/lib/leads";

type Lead = {
  id: number;
  campaign: string;
  name: string;
  company: string | null;
  whatsapp: string;
  email: string | null;
  role: string | null;
  staff: string | null;
  country: string | null;
  payment_model: string | null;
  payroll_hours: string | null;
  services_month: string | null;
  urgency: string | null;
  score_value: number;
  score_intent: number;
  score_total: number;
  track: string;
  qualified: boolean;
  status: string;
  completed: boolean;
  referral_contact: string | null;
  created_at: string;
};

const STATUSES = ["nuevo", "contactado", "en conversación", "cerrado", "descartado"];

/**
 * Lista de leads ordenada por puntaje.
 *
 * Se muestran las tres columnas de puntaje (valor, intención y total) en vez de
 * solo el total: el total dice a quién llamar primero, pero valor e intención
 * dicen por qué, que es lo que se necesita para preparar la llamada.
 */
export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [onlyQualified, setOnlyQualified] = useState(true);

  useEffect(() => {
    fetch("/api/admin/leads")
      .then((r) => r.json())
      .then((data) => setLeads(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: number, status: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch("/api/admin/leads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  if (loading) return <p className="text-muted-foreground">Cargando leads…</p>;

  const visible = onlyQualified ? leads.filter((l) => l.qualified) : leads;
  const discarded = leads.length - leads.filter((l) => l.qualified).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyQualified}
            onChange={(e) => setOnlyQualified(e.target.checked)}
            className="cursor-pointer"
          />
          Solo calificados
        </label>
        <span className="text-sm text-muted-foreground">
          {visible.length} de {leads.length} · {discarded} sin empresa o referidos
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr className="[&>th]:px-3 [&>th]:py-2.5 [&>th]:font-medium">
              <th>Puntaje</th>
              <th>Valor</th>
              <th>Intención</th>
              <th>Empresa</th>
              <th>Contacto</th>
              <th>Track</th>
              <th>Operarios</th>
              <th>Campaña</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((lead) => (
              <Fragment key={lead.id}>
                <tr
                  onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                  className="cursor-pointer border-t border-border hover:bg-muted/30 [&>td]:px-3 [&>td]:py-2.5"
                >
                  <td>
                    <span className="font-mono text-base font-semibold text-primary">
                      {lead.score_total}
                    </span>
                  </td>
                  <td className="font-mono text-muted-foreground">{lead.score_value}</td>
                  <td className="font-mono text-muted-foreground">{lead.score_intent}</td>
                  <td className="font-medium">{lead.company || "—"}</td>
                  <td>
                    <div>{lead.name}</div>
                    <div className="text-xs text-muted-foreground">{lead.whatsapp}</div>
                  </td>
                  <td>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        lead.track === "producto"
                          ? "bg-primary/10 text-primary"
                          : lead.track === "servicio"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {lead.track}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{labelFor("staff", lead.staff)}</td>
                  <td className="text-xs text-muted-foreground">{lead.campaign}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className="cursor-pointer rounded border border-border bg-background px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>

                {expanded === lead.id && (
                  <tr className="border-t border-border bg-muted/20">
                    <td colSpan={9} className="px-4 py-4">
                      <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        <Detail label="Rol" value={labelFor("role", lead.role)} />
                        <Detail label="País" value={labelFor("country", lead.country)} />
                        <Detail label="Cómo paga" value={labelFor("payment_model", lead.payment_model)} />
                        <Detail label="Horas en cerrar pagos" value={labelFor("payroll_hours", lead.payroll_hours)} />
                        <Detail label="Servicios/mes" value={labelFor("services_month", lead.services_month)} />
                        <Detail label="Urgencia" value={labelFor("urgency", lead.urgency)} />
                        <Detail label="Email" value={lead.email || "—"} />
                        <Detail
                          label="Formulario"
                          value={lead.completed ? "Completo" : "Parcial — abandonó el paso 3"}
                        />
                        <Detail
                          label="Registrado"
                          value={new Date(lead.created_at).toLocaleDateString("es-CO")}
                        />
                        {lead.referral_contact && (
                          <Detail label="Refiere a" value={lead.referral_contact} />
                        )}
                      </dl>
                      <a
                        href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
                      >
                        Escribir por WhatsApp →
                      </a>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>

        {visible.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Todavía no hay leads.
          </p>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
