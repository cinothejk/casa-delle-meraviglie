export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AuditPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Verifichiamo che l'utente sia SuperAdmin.
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

  // Recuperiamo gli ultimi eventi di Audit Log.
  const { data: auditLog, error: auditError } = await supabase
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
    .order("created_at", { ascending: false })
    .limit(200);

  if (auditError) {
    throw new Error(auditError.message);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Audit Log
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Registro delle operazioni effettuate dagli utenti.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">
                  Data
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Utente
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Azione
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Tabella
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Record
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Dettaglio
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {(auditLog ?? []).map((evento) => {
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
                  <tr
                    key={evento.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      {new Date(
                        evento.created_at
                      ).toLocaleString("it-IT")}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {nomeUtente}
                      </div>

                      {profiloEvento?.username && (
                        <div className="text-xs text-gray-500">
                          @{profiloEvento.username}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium dark:bg-gray-800">
                        {evento.azione}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {evento.tabella ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">
                        {evento.record_id
                          ? evento.record_id.slice(0, 8) + "…"
                          : "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/protected/audit/${evento.id}`}
                        className="text-sm font-medium underline hover:no-underline"
                      >
                        Dettaglio
                      </Link>
                    </td>

                  </tr>
                );
              })}

              {!auditLog?.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Nessun evento registrato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Visualizzati gli ultimi 200 eventi.
      </div>
    </section>
  );
}