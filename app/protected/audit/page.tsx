
export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const PER_PAGINA = 20;

type SearchParams = Promise<{
  data_da?: string;
  data_a?: string;
  utente?: string;
  azione?: string;
  tabella?: string;
  pagina?: string;
}>;

function valoreSingolo(valore?: string) {
  return typeof valore === "string" ? valore.trim() : "";
}

function creaUrl(
  parametri: Record<string, string>,
  pagina: number
) {
  const query = new URLSearchParams();

  for (const [chiave, valore] of Object.entries(parametri)) {
    if (valore) query.set(chiave, valore);
  }

  if (pagina > 1) {
    query.set("pagina", String(pagina));
  }

  const stringa = query.toString();

  return stringa
    ? `/protected/audit?${stringa}`
    : "/protected/audit";
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const dataDa = valoreSingolo(params.data_da);
  const dataA = valoreSingolo(params.data_a);
  const utente = valoreSingolo(params.utente);
  const azione = valoreSingolo(params.azione);
  const tabella = valoreSingolo(params.tabella);

  const paginaRichiesta = Number(params.pagina ?? "1");
  const pagina =
    Number.isInteger(paginaRichiesta) && paginaRichiesta > 0
      ? paginaRichiesta
      : 1;

  const filtri = {
    data_da: dataDa,
    data_a: dataA,
    utente,
    azione,
    tabella,
  };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Verifica dei permessi SuperAdmin.
  const { data: profilo, error: profiloError } = await supabase
    .from("profiles")
    .select("id, nome, cognome, username, ruolo, attivo")
    .eq("id", user.id)
    .single();

  if (
    profiloError ||
    !profilo ||
    profilo.ruolo !== "superadmin" ||
    !profilo.attivo
  ) {
    redirect("/protected");
  }

  // Utenti disponibili nel filtro.
  const { data: profili, error: profiliError } = await supabase
    .from("profiles")
    .select("id, nome, cognome, username, email")
    .order("cognome")
    .order("nome");

  if (profiliError) {
    throw new Error("Errore nel caricamento degli utenti.");
  }

  // Query paginata con conteggio totale dei risultati filtrati.
  let query = supabase
    .from("audit_log")
    .select(
      `
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
      `,
      { count: "exact" }
    );

  if (dataDa && /^\d{4}-\d{2}-\d{2}$/.test(dataDa)) {
    query = query.gte("created_at", `${dataDa}T00:00:00`);
  }

  if (dataA && /^\d{4}-\d{2}-\d{2}$/.test(dataA)) {
    query = query.lte("created_at", `${dataA}T23:59:59.999`);
  }

  if (utente) {
    query = query.eq("effettuato_da", utente);
  }

  if (azione) {
    query = query.ilike("azione", `%${azione}%`);
  }

  if (tabella) {
    query = query.ilike("tabella", `%${tabella}%`);
  }

  const inizio = (pagina - 1) * PER_PAGINA;

  const {
    data: auditLog,
    error: auditError,
    count,
  } = await query
    .order("created_at", { ascending: false })
    .range(inizio, inizio + PER_PAGINA - 1);

  if (auditError) {
    throw new Error(auditError.message);
  }

  const totale = count ?? 0;
  const pagineTotali = Math.max(1, Math.ceil(totale / PER_PAGINA));

  // Se si richiede una pagina oltre l'ultima disponibile,
  // torna all'ultima pagina valida.
  if (pagina > pagineTotali) {
    redirect(creaUrl(filtri, pagineTotali));
  }

  const numeroPrimo = totale === 0 ? 0 : inizio + 1;
  const numeroUltimo = Math.min(inizio + PER_PAGINA, totale);

  const inputClass =
    "mt-1 w-full rounded-xl border border-[#EADDCF] bg-white px-3 py-2.5 text-sm text-[#49372F] outline-none focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/15";

  const buttonClass =
    "inline-flex items-center justify-center rounded-xl bg-[#C96F52] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B65D43]";

  const buttonSecondary =
    "inline-flex items-center justify-center rounded-xl border border-[#EADDCF] bg-white px-4 py-2.5 text-sm font-medium text-[#49372F] transition hover:bg-[#FFF8EF]";

  return (
    <section className="space-y-6">
      {/* Intestazione */}
      <div>
        <Link
          href="/protected"
          className={`${buttonSecondary} mb-4`}
        >
          ← Dashboard
        </Link>

        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#C96F52]">
          Area amministrativa
        </p>

        <h1 className="mt-1 text-2xl font-bold text-[#49372F] sm:text-3xl">
          Audit Log
        </h1>

        <p className="mt-2 text-sm text-[#8B796D]">
          Consulta e filtra lo storico delle operazioni effettuate
          dagli utenti.
        </p>
      </div>

      {/* Filtri */}
      <div className="rounded-2xl border border-[#EADDCF] bg-white p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="font-semibold text-[#49372F]">
            Filtra eventi
          </h2>
          <p className="mt-1 text-sm text-[#8B796D]">
            Combina uno o più filtri per restringere i risultati.
          </p>
        </div>

        <form
          method="get"
          action="/protected/audit"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <label
              htmlFor="data_da"
              className="block text-sm font-medium text-[#49372F]"
            >
              Data dal
            </label>
            <input
              id="data_da"
              name="data_da"
              type="date"
              defaultValue={dataDa}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="data_a"
              className="block text-sm font-medium text-[#49372F]"
            >
              Data al
            </label>
            <input
              id="data_a"
              name="data_a"
              type="date"
              defaultValue={dataA}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="utente"
              className="block text-sm font-medium text-[#49372F]"
            >
              Utente
            </label>
            <select
              id="utente"
              name="utente"
              defaultValue={utente}
              className={inputClass}
            >
              <option value="">Tutti gli utenti</option>
              {(profili ?? []).map((elemento) => {
                const nome = [
                  elemento.nome,
                  elemento.cognome,
                ]
                  .filter(Boolean)
                  .join(" ");

                const etichetta =
                  nome ||
                  elemento.username ||
                  elemento.email ||
                  elemento.id;

                return (
                  <option key={elemento.id} value={elemento.id}>
                    {etichetta}
                    {elemento.username
                      ? ` (@${elemento.username})`
                      : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              htmlFor="azione"
              className="block text-sm font-medium text-[#49372F]"
            >
              Azione
            </label>
            <input
              id="azione"
              name="azione"
              type="text"
              defaultValue={azione}
              placeholder="Es. INSERT, UPDATE, DELETE"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="tabella"
              className="block text-sm font-medium text-[#49372F]"
            >
              Tabella
            </label>
            <input
              id="tabella"
              name="tabella"
              type="text"
              defaultValue={tabella}
              placeholder="Nome della tabella"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col justify-end gap-2 sm:flex-row lg:col-span-3">
            <Link
              href="/protected/audit"
              className={buttonSecondary}
            >
              Azzera filtri
            </Link>

            <button type="submit" className={buttonClass}>
              Applica filtri
            </button>
          </div>
        </form>
      </div>

      {/* Tabella */}
      <div className="overflow-hidden rounded-2xl border border-[#EADDCF] bg-white">
        <div className="flex flex-col gap-1 border-b border-[#EFE4D9] bg-[#FFF8EF] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-semibold text-[#49372F]">
              Registro operazioni
            </h2>
            <p className="mt-1 text-sm text-[#8B796D]">
              {totale.toLocaleString("it-IT")} eventi trovati
              {totale > 0
                ? ` · visualizzati ${numeroPrimo}–${numeroUltimo}`
                : ""}
            </p>
          </div>

          <span className="text-xs text-[#8B796D]">
            100 eventi per pagina
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#EADDCF] bg-white">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-[#49372F]">
                  Data
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#49372F]">
                  Utente
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#49372F]">
                  Azione
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#49372F]">
                  Tabella
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#49372F]">
                  Record
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#49372F]">
                  Dettaglio
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EFE4D9]">
              {(auditLog ?? []).map((evento) => {
                const profiloEvento = Array.isArray(evento.profilo)
                  ? evento.profilo[0]
                  : evento.profilo;

                const nomeUtente =
                  [
                    profiloEvento?.nome,
                    profiloEvento?.cognome,
                  ]
                    .filter(Boolean)
                    .join(" ") ||
                  profiloEvento?.username ||
                  profiloEvento?.email ||
                  evento.effettuato_da ||
                  "Utente";

                return (
                  <tr
                    key={evento.id}
                    className="transition hover:bg-[#FFF8EF]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[#49372F]">
                      {new Date(evento.created_at).toLocaleString(
                        "it-IT",
                        { dateStyle: "short", timeStyle: "short" }
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-[#49372F]">
                        {nomeUtente}
                      </div>
                      {profiloEvento?.username && (
                        <div className="text-xs text-[#8B796D]">
                          @{profiloEvento.username}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-[#F5D1BC]/40 px-2.5 py-1 text-xs font-medium text-[#8C4B35]">
                        
                          {(
                            {
                              eliminazione: "Eliminazione",
                              eliminazione_avviata: "Eliminazione avviata",
                              eliminazione_fallita: "Eliminazione fallita",
                              INSERT: "Inserimento",
                              UPDATE: "Modifica",
                              DELETE: "Eliminazione",
                            } as Record<string, string>
                          )[evento.azione] ?? evento.azione}

                      </span>
                    </td>

                    <td className="px-4 py-3 text-[#49372F]">
                      {evento.tabella ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="font-mono text-xs text-[#8B796D]"
                        title={evento.record_id ?? ""}
                      >
                        {evento.record_id
                          ? `${evento.record_id.slice(0, 8)}…`
                          : "—"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/protected/audit/${evento.id}`}
                        className="font-semibold text-[#B65D43] underline-offset-4 hover:underline"
                      >
                        Dettaglio →
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {!auditLog?.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center"
                  >
                    <p className="font-semibold text-[#49372F]">
                      Nessun evento trovato
                    </p>
                    <p className="mt-1 text-sm text-[#8B796D]">
                      Prova a modificare o azzerare i filtri.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginazione */}
        {totale > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#EADDCF] bg-[#FFF8EF]/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-[#8B796D]">
              Pagina{" "}
              <span className="font-semibold text-[#49372F]">
                {pagina}
              </span>{" "}
              di{" "}
              <span className="font-semibold text-[#49372F]">
                {pagineTotali}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={creaUrl(filtri, 1)}
                aria-disabled={pagina === 1}
                className={`${buttonSecondary} ${
                  pagina === 1 ? "pointer-events-none opacity-40" : ""
                }`}
              >
                « Prima
              </Link>

              <Link
                href={creaUrl(filtri, Math.max(1, pagina - 1))}
                aria-disabled={pagina === 1}
                className={`${buttonSecondary} ${
                  pagina === 1 ? "pointer-events-none opacity-40" : ""
                }`}
              >
                ← Precedente
              </Link>

              <Link
                href={creaUrl(
                  filtri,
                  Math.min(pagineTotali, pagina + 1)
                )}
                aria-disabled={pagina === pagineTotali}
                className={`${buttonSecondary} ${
                  pagina === pagineTotali
                    ? "pointer-events-none opacity-40"
                    : ""
                }`}
              >
                Successiva →
              </Link>

              <Link
                href={creaUrl(filtri, pagineTotali)}
                aria-disabled={pagina === pagineTotali}
                className={`${buttonSecondary} ${
                  pagina === pagineTotali
                    ? "pointer-events-none opacity-40"
                    : ""
                }`}
              >
                Ultima »
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
