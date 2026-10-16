export const instant = false;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function formatJson(value: unknown) {
  if (value === null || value === undefined) {
    return "Nessun dato";
  }

  return JSON.stringify(value, null, 2);
}


function formatAzione(azione: string) {
  const etichette: Record<string, string> = {
    eliminazione: "Eliminazione",
    eliminazione_avviata: "Eliminazione avviata",
    eliminazione_fallita: "Eliminazione fallita",
    INSERT: "Inserimento",
    UPDATE: "Modifica",
    DELETE: "Eliminazione",
  };

  return etichette[azione] ?? azione;
}


export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profilo, error: profiloError } = await supabase
    .from("profiles")
    .select("id, nome, cognome, username, ruolo")
    .eq("id", user.id)
    .single();

  if (
    profiloError ||
    !profilo ||
    profilo.ruolo !== "superadmin"
  ) {
    redirect("/protected");
  }

  const { id } = await params;

  const { data: evento, error } = await supabase
    .from("audit_log")
    .select(`
      id,
      effettuato_da,
      azione,
      tabella,
      record_id,
      dati_precedenti,
      dati_nuovi,
      created_at,
      profilo:profiles!audit_log_effettuato_da_fkey (
        id,
        nome,
        cognome,
        username,
        email
      )
    `)
    .eq("id", id)
    .single();

  if (error || !evento) {
    notFound();
  }

  const profiloEvento = Array.isArray(evento.profilo)
    ? evento.profilo[0]
    : evento.profilo;

  const nomeUtente =
    profiloEvento?.nome ||
    profiloEvento?.username ||
    profiloEvento?.email ||
    evento.effettuato_da ||
    "Utente";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Dettaglio Audit
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Dettaglio dell'operazione registrata.
          </p>
        </div>

        <Link
          href="/protected/audit"
          className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          ← Torna all'Audit Log
        </Link>
      </div>

      <div className="grid gap-4 rounded-xl border bg-white p-5 dark:bg-gray-900 md:grid-cols-2">
        <div>
          <div className="text-xs text-gray-500">
            Azione
          </div>

          <div className="mt-1 font-semibold">
            {formatAzione(evento.azione)}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500">
            Data
          </div>

          <div className="mt-1">
            {new Date(evento.created_at).toLocaleString(
              "it-IT"
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500">
            Utente
          </div>

          <div className="mt-1 font-medium">
            {nomeUtente}
          </div>

          {profiloEvento?.username && (
            <div className="text-xs text-gray-500">
              @{profiloEvento.username}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs text-gray-500">
            Tabella
          </div>

          <div className="mt-1 font-mono text-sm">
            {evento.tabella ?? "—"}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="text-xs text-gray-500">
            Record ID
          </div>

          <div className="mt-1 break-all font-mono text-sm">
            {evento.record_id ?? "—"}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white dark:bg-gray-900">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">
              Dati precedenti
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Stato del record prima dell'operazione.
            </p>
          </div>

          <pre className="max-h-[500px] overflow-auto p-5 text-xs">
            {formatJson(evento.dati_precedenti)}
          </pre>
        </div>

        <div className="rounded-xl border bg-white dark:bg-gray-900">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">
              Dati nuovi
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Stato del record dopo l'operazione.
            </p>
          </div>

          <pre className="max-h-[500px] overflow-auto p-5 text-xs">
            {formatJson(evento.dati_nuovi)}
          </pre>
        </div>
      </div>
    </section>
  );
}