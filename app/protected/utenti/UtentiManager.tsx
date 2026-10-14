
"use client";

import { useMemo, useState } from "react";
import {
  creaUtente,
  modificaUtente,
  generaResetPassword,
} from "./actions";
import type { ReactNode } from "react";

type Famiglia = {
  id: string;
  nome: string;
};

type Utente = {
  id: string;
  nome: string | null;
  cognome: string | null;
  email: string | null;
  username: string | null;
  ruolo: string;
  attivo: boolean;
  famiglia_id: string | null;
  famiglie: Famiglia | Famiglia[] | null;
};

type Props = {
  utenti: Utente[];
  famiglie: Famiglia[];
};

const inputClass =
  "w-full rounded-xl border border-[#EADDCF] bg-white px-3 py-2.5 text-sm text-[#49372F] outline-none transition focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/15";

const labelClass =
  "mb-1.5 block text-sm font-medium text-[#49372F]";

const buttonPrimary =
  "inline-flex items-center justify-center rounded-xl bg-[#C96F52] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B65D43] disabled:cursor-not-allowed disabled:opacity-50";

const buttonSecondary =
  "inline-flex items-center justify-center rounded-xl border border-[#EADDCF] bg-white px-4 py-2.5 text-sm font-semibold text-[#49372F] transition hover:bg-[#FFF8EF]";

function getFamiglia(utente: Utente) {
  return Array.isArray(utente.famiglie)
    ? utente.famiglie[0] ?? null
    : utente.famiglie;
}

function StatoBadge({ attivo }: { attivo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        attivo
          ? "bg-[#E6EFE3] text-[#476443]"
          : "bg-[#F8E5DF] text-[#A44F39]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          attivo ? "bg-[#64845D]" : "bg-[#C96F52]"
        }`}
      />
      {attivo ? "Attivo" : "Disattivo"}
    </span>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export default function UtentiManager({
  utenti,
  famiglie,
}: Props) {
  const [ricerca, setRicerca] = useState("");
  const [creazioneAperta, setCreazioneAperta] = useState(false);
  const [utenteSelezionato, setUtenteSelezionato] =
    useState<Utente | null>(null);

  const utentiFiltrati = useMemo(() => {
    const termine = ricerca.trim().toLocaleLowerCase("it");

    if (!termine) return utenti;

    return utenti.filter((utente) => {
      const famiglia = getFamiglia(utente);

      const valori = [
        utente.nome,
        utente.cognome,
        utente.email,
        famiglia?.nome,
      ];

      return valori.some((valore) =>
        (valore ?? "")
          .toLocaleLowerCase("it")
          .includes(termine)
      );
    });
  }, [utenti, ricerca]);

  return (
    <>
      <section className="space-y-6">
        {/* Intestazione */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#C96F52]">
              Area amministrativa
            </p>

            <h1 className="mt-1 text-2xl font-bold text-[#49372F] sm:text-3xl">
              Gestione Utenti
            </h1>

            <p className="mt-2 text-sm text-[#8B796D]">
              Cerca, consulta e gestisci gli account della comunità.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreazioneAperta(true)}
            className={buttonPrimary}
          >
            <span className="mr-2 text-lg leading-none">+</span>
            Crea utente
          </button>
        </div>

        {/* Riepilogo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#EADDCF] bg-white p-4">
            <p className="text-sm text-[#8B796D]">Utenti totali</p>
            <p className="mt-1 text-2xl font-bold text-[#49372F]">
              {utenti.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#EADDCF] bg-white p-4">
            <p className="text-sm text-[#8B796D]">Utenti attivi</p>
            <p className="mt-1 text-2xl font-bold text-[#64845D]">
              {utenti.filter((utente) => utente.attivo).length}
            </p>
          </div>
        </div>

        {/* Ricerca ed elenco */}
        <div className="overflow-hidden rounded-2xl border border-[#EADDCF] bg-white">
          <div className="border-b border-[#EFE4D9] p-4 sm:p-5">
            <h2 className="font-semibold text-[#49372F]">
              Elenco utenti
            </h2>

            <p className="mt-1 text-sm text-[#8B796D]">
              Seleziona una persona per vedere tutti i dettagli.
            </p>

            <div className="relative mt-4">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8B796D]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 4 4" />
                </svg>
              </span>

              <input
                type="search"
                value={ricerca}
                onChange={(event) => setRicerca(event.target.value)}
                placeholder="Cerca per nome, cognome, email o famiglia..."
                aria-label="Cerca utenti"
                className={`${inputClass} pl-10 pr-10`}
              />

              {ricerca && (
                <button
                  type="button"
                  onClick={() => setRicerca("")}
                  aria-label="Cancella ricerca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#8B796D] hover:text-[#49372F]"
                >
                  ✕
                </button>
              )}
            </div>

            <p className="mt-2 text-xs text-[#8B796D]">
              {utentiFiltrati.length}{" "}
              {utentiFiltrati.length === 1 ? "utente trovato" : "utenti trovati"}
            </p>
          </div>

          {/* Intestazioni visibili da tablet in su */}
          <div className="hidden grid-cols-[1.2fr_1.2fr_1.4fr_auto] gap-4 bg-[#FFF8EF] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#8B796D] sm:grid">
            <span>Nome</span>
            <span>Cognome</span>
            <span>Famiglia</span>
            <span>Stato</span>
          </div>

          <div className="divide-y divide-[#EFE4D9]">
            {utentiFiltrati.map((utente) => {
              const famiglia = getFamiglia(utente);

              return (
                <button
                  key={utente.id}
                  type="button"
                  onClick={() => setUtenteSelezionato(utente)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left transition hover:bg-[#FFF8EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C96F52] sm:grid-cols-[1.2fr_1.2fr_1.4fr_auto] sm:gap-4 sm:px-5"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#8B796D] sm:hidden">
                      Nome
                    </span>
                    <span className="block truncate text-sm font-semibold text-[#49372F]">
                      {utente.nome || "—"}
                    </span>
                  </span>

                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#8B796D] sm:hidden">
                      Cognome
                    </span>
                    <span className="block truncate text-sm text-[#49372F]">
                      {utente.cognome || "—"}
                    </span>
                  </span>

                  <span className="col-span-2 min-w-0 sm:col-span-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#8B796D] sm:hidden">
                      Famiglia
                    </span>
                    <span className="block truncate text-sm text-[#8B796D]">
                      {famiglia?.nome || "Nessuna famiglia"}
                    </span>
                  </span>

                  <span className="col-start-2 row-start-1 justify-self-end sm:col-start-auto sm:row-start-auto">
                    <StatoBadge attivo={utente.attivo} />
                  </span>
                </button>
              );
            })}

            {utentiFiltrati.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="font-semibold text-[#49372F]">
                  Nessun utente trovato
                </p>
                <p className="mt-1 text-sm text-[#8B796D]">
                  Prova con un altro nome, un&apos;email o una famiglia.
                </p>
                {ricerca && (
                  <button
                    type="button"
                    onClick={() => setRicerca("")}
                    className={`${buttonSecondary} mt-4`}
                  >
                    Azzera ricerca
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modale creazione */}
      {creazioneAperta && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#30251F]/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCreazioneAperta(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="crea-utente-titolo"
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-[#FFF8EF] p-5 shadow-2xl sm:rounded-3xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#C96F52]">
                  Nuovo account
                </p>
                <h2
                  id="crea-utente-titolo"
                  className="mt-1 text-xl font-bold text-[#49372F]"
                >
                  Crea utente
                </h2>
                <p className="mt-1 text-sm text-[#8B796D]">
                  Inserisci i dati per creare un nuovo accesso.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreazioneAperta(false)}
                aria-label="Chiudi"
                className="rounded-full p-2 text-[#8B796D] hover:bg-[#F5D1BC]/40"
              >
                ✕
              </button>
            </div>

            <form action={creaUtente} className="mt-6 grid gap-4 sm:grid-cols-2">
              <Campo label="Nome">
                <input name="nome" required className={inputClass} />
              </Campo>

              <Campo label="Cognome">
                <input name="cognome" required className={inputClass} />
              </Campo>

              <Campo label="Username">
                <input name="username" required className={inputClass} />
              </Campo>

              <Campo label="Email">
                <input
                  name="email"
                  type="email"
                  required
                  className={inputClass}
                />
              </Campo>

              <Campo label="Password iniziale">
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-[#8B796D]">
                  Almeno 8 caratteri.
                </p>
              </Campo>

              <Campo label="Ruolo">
                <select
                  name="ruolo"
                  defaultValue="socio"
                  className={inputClass}
                >
                  <option value="socio">Socio</option>
                  <option value="direzione">Direzione</option>
                </select>
              </Campo>

              <div className="sm:col-span-2">
                <Campo label="Famiglia">
                  <select
                    name="famiglia_id"
                    defaultValue=""
                    className={inputClass}
                  >
                    <option value="">Nessuna famiglia</option>
                    {famiglie.map((famiglia) => (
                      <option key={famiglia.id} value={famiglia.id}>
                        {famiglia.nome}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-[#8B796D]">
                    Per un Socio seleziona la famiglia di appartenenza.
                    Direzione non può essere associata a una famiglia.
                  </p>
                </Campo>
              </div>

              <div className="mt-2 flex flex-col-reverse gap-2 border-t border-[#EADDCF] pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCreazioneAperta(false)}
                  className={buttonSecondary}
                >
                  Annulla
                </button>
                <button type="submit" className={buttonPrimary}>
                  Crea utente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale dettagli e modifica */}
      {utenteSelezionato && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#30251F]/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setUtenteSelezionato(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dettagli-utente-titolo"
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-[#FFF8EF] p-5 shadow-2xl sm:rounded-3xl sm:p-7"
          >
            {(() => {
              const utente = utenteSelezionato;
              const famiglia = getFamiglia(utente);
              const isSuperAdmin = utente.ruolo === "superadmin";

              return (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#C96F52]">
                        Dettaglio account
                      </p>
                      <h2
                        id="dettagli-utente-titolo"
                        className="mt-1 break-words text-xl font-bold text-[#49372F]"
                      >
                        {utente.nome} {utente.cognome}
                      </h2>
                      <p className="mt-1 break-all text-sm text-[#8B796D]">
                        {utente.email || "Email non disponibile"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUtenteSelezionato(null)}
                      aria-label="Chiudi dettagli"
                      className="shrink-0 rounded-full p-2 text-[#8B796D] hover:bg-[#F5D1BC]/40"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <StatoBadge attivo={utente.attivo} />
                    <span className="rounded-full border border-[#EADDCF] bg-white px-3 py-1 text-xs font-semibold text-[#49372F]">
                      {utente.ruolo}
                    </span>
                  </div>

                  {isSuperAdmin ? (
                    <div className="mt-6 rounded-2xl border border-[#EADDCF] bg-white p-4">
                      <p className="font-semibold text-[#49372F]">
                        Account SuperAdmin
                      </p>
                      <p className="mt-1 text-sm text-[#8B796D]">
                        Questo account non può essere modificato da questa schermata.
                      </p>
                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-[#8B796D]">Username</p>
                          <p className="mt-1 break-words font-medium text-[#49372F]">
                            {utente.username || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#8B796D]">Famiglia</p>
                          <p className="mt-1 font-medium text-[#49372F]">
                            {famiglia?.nome || "Nessuna famiglia"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form
                      action={modificaUtente}
                      className="mt-6 grid gap-4 sm:grid-cols-2"
                    >
                      <input
                        type="hidden"
                        name="utente_id"
                        value={utente.id}
                      />

                      <Campo label="Nome">
                        <input
                          name="nome"
                          defaultValue={utente.nome ?? ""}
                          required
                          className={inputClass}
                        />
                      </Campo>

                      <Campo label="Cognome">
                        <input
                          name="cognome"
                          defaultValue={utente.cognome ?? ""}
                          required
                          className={inputClass}
                        />
                      </Campo>

                      <Campo label="Username">
                        <input
                          name="username"
                          defaultValue={utente.username ?? ""}
                          required
                          className={inputClass}
                        />
                      </Campo>

                      <Campo label="Email">
                        <input
                          value={utente.email ?? ""}
                          disabled
                          readOnly
                          className={`${inputClass} cursor-not-allowed bg-[#F4EDE5] text-[#8B796D]`}
                        />
                      </Campo>

                      <Campo label="Ruolo">
                        <select
                          name="ruolo"
                          defaultValue={utente.ruolo}
                          className={inputClass}
                        >
                          <option value="socio">Socio</option>
                          <option value="direzione">Direzione</option>
                        </select>
                      </Campo>

                      <Campo label="Famiglia">
                        <select
                          name="famiglia_id"
                          defaultValue={utente.famiglia_id ?? ""}
                          className={inputClass}
                        >
                          <option value="">Nessuna famiglia</option>
                          {famiglie.map((elemento) => (
                            <option key={elemento.id} value={elemento.id}>
                              {elemento.nome}
                            </option>
                          ))}
                        </select>
                      </Campo>

                      <Campo label="Stato account">
                        <select
                          name="attivo"
                          defaultValue={utente.attivo ? "true" : "false"}
                          className={inputClass}
                        >
                          <option value="true">Attivo</option>
                          <option value="false">Disattivo</option>
                        </select>
                      </Campo>

                      <div className="mt-2 flex flex-col gap-2 border-t border-[#EADDCF] pt-4 sm:col-span-2 sm:flex-row sm:flex-wrap sm:justify-between">
                        <button
                          type="submit"
                          formAction={generaResetPassword}
                          className={buttonSecondary}
                        >
                          Reimposta password
                        </button>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => setUtenteSelezionato(null)}
                            className={buttonSecondary}
                          >
                            Chiudi
                          </button>
                          <button type="submit" className={buttonPrimary}>
                            Salva modifiche
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

