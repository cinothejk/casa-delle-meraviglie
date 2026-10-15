"use client";

import { useState } from "react";
import {
  assegnaSocio,
  creaFamiglia,
  modificaFamiglia,
} from "@/app/protected/famiglie/actions";

type Socio = {
  id: string;
  nome: string | null;
  cognome: string | null;
  email: string | null;
  famiglia_id: string | null;
  attivo: boolean | null;
};

type Famiglia = {
  id: string;
  nome: string;
  codice: string | null;
  attiva: boolean;
  profiles: {
    id: string;
    nome: string | null;
    cognome: string | null;
    email: string | null;
    ruolo: string | null;
    attivo: boolean | null;
  }[];
};

const colori = [
  "bg-[#F5D1BC] border-[#E6B89E]",
  "bg-[#DDE7D8] border-[#B9CCB1]",
  "bg-[#F8E7A8] border-[#E8D58B]",
  "bg-[#E6DDF3] border-[#CFC0E5]",
  "bg-[#D8EAF0] border-[#B5D5E0]",
  "bg-[#F2DCE2] border-[#E5BBC8]",
];

export default function FamiglieLista({
  famiglie,
  soci,
}: {
  famiglie: Famiglia[];
  soci: Socio[];
}) {
  const [selezionata, setSelezionata] = useState<Famiglia | null>(null);
  const [creazioneAperta, setCreazioneAperta] = useState(false);

  const [nomeNuovo, setNomeNuovo] = useState("");
  const [errore, setErrore] = useState("");

  const chiudiPopup = () => {
    setSelezionata(null);
    setErrore("");
  };

  return (
    <main className="mx-auto w-full max-w-7xl">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#C96F52]">
            Gestione nuclei familiari
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#49372F] sm:text-4xl">
            Famiglie
          </h1>
          <p className="mt-3 text-sm text-[#78675D] sm:text-base">
            Gestisci i nuclei familiari e i soci della comunità.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNomeNuovo("");
            setErrore("");
            setCreazioneAperta(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C96F52] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B85E43]"
        >
          <span aria-hidden="true">+</span>
          Crea famiglia
        </button>
      </header>

      {famiglie.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DCCFC1] bg-white/70 px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-[#49372F]">
            Nessuna famiglia presente
          </h2>
          <p className="mt-2 text-sm text-[#78675D]">
            Crea la prima famiglia con il pulsante in alto.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {famiglie.map((famiglia, index) => {
            const membri = soci.filter(
              (socio) => socio.famiglia_id === famiglia.id
            );

            return (
              <button
                type="button"
                key={famiglia.id}
                onClick={() => {
                  setErrore("");
                  setSelezionata(famiglia);
                }}
                className={`group flex min-h-44 flex-col rounded-2xl border p-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96F52] focus-visible:ring-offset-2 ${
                  colori[index % colori.length]
                }`}
              >
                <div className="mb-5 h-1.5 w-12 rounded-full bg-[#C96F52]" />

                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold leading-snug text-[#49372F]">
                    {famiglia.nome}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold ${
                      famiglia.attiva
                        ? "text-[#426447]"
                        : "text-[#8A5147]"
                    }`}
                  >
                    {famiglia.attiva ? "Attiva" : "Disattiva"}
                  </span>
                </div>

                <p className="mt-3 text-sm text-[#66564D]">
                  <span className="font-semibold">{membri.length}</span>{" "}
                  {membri.length === 1 ? "socio" : "soci"}
                </p>

                <div className="mt-auto flex justify-end pt-5 text-sm font-medium text-[#49372F]">
                  <span className="transition-transform group-hover:translate-x-1">
                    Gestisci →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {creazioneAperta && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#34261F]/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCreazioneAperta(false);
              setErrore("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titolo-creazione-famiglia"
            className="my-auto w-full max-w-lg rounded-3xl border border-[#EADDCF] bg-[#FFF8EF] p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#C96F52]">
                  Nuovo nucleo familiare
                </p>
                <h2
                  id="titolo-creazione-famiglia"
                  className="mt-1 text-2xl font-bold text-[#49372F]"
                >
                  Crea famiglia
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCreazioneAperta(false)}
                aria-label="Chiudi finestra"
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-[#78675D] hover:bg-[#F5D1BC]"
              >
                ×
              </button>
            </div>

            <form
              action={async (formData: FormData) => {
                setErrore("");
                try {
                  await creaFamiglia(formData);
                  setCreazioneAperta(false);
                  setNomeNuovo("");
                } catch (error) {
                  setErrore(
                    error instanceof Error
                      ? error.message
                      : "Impossibile creare la famiglia."
                  );
                }
              }}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="nuova-famiglia-nome"
                  className="mb-2 block text-sm font-semibold text-[#49372F]"
                >
                  Nome famiglia
                </label>
                <input
                  id="nuova-famiglia-nome"
                  name="nome"
                  required
                  maxLength={100}
                  value={nomeNuovo}
                  onChange={(event) => setNomeNuovo(event.target.value)}
                  placeholder="Es. Famiglia Rossi"
                  className="w-full rounded-xl border border-[#DCCFC1] bg-white px-4 py-3 text-sm text-[#49372F] outline-none focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/20"
                />
              </div>

              <div className="rounded-xl border border-[#EADDCF] bg-white/70 p-4">
                <p className="text-sm font-semibold text-[#49372F]">
                  Codice famiglia
                </p>
                <p className="mt-1 text-sm text-[#78675D]">
                  Il codice progressivo verrà assegnato automaticamente al momento della creazione.
                </p>
              </div>

              {errore && (
                <p role="alert" className="text-sm text-red-700">
                  {errore}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-[#EADDCF] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCreazioneAperta(false)}
                  className="rounded-xl border border-[#DCCFC1] px-5 py-3 text-sm font-semibold text-[#66564D]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#C96F52] px-5 py-3 text-sm font-semibold text-white hover:bg-[#B85E43]"
                >
                  Crea famiglia
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selezionata && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#34261F]/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) chiudiPopup();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titolo-modifica-famiglia"
            className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#EADDCF] bg-[#FFF8EF] p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#C96F52]">
                  Gestione nucleo familiare
                </p>
                <h2
                  id="titolo-modifica-famiglia"
                  className="mt-1 text-2xl font-bold text-[#49372F]"
                >
                  {selezionata.nome}
                </h2>
                <p className="mt-1 text-sm text-[#78675D]">
                  Codice: {selezionata.codice || "Non assegnato"}
                </p>
              </div>
              <button
                type="button"
                onClick={chiudiPopup}
                aria-label="Chiudi finestra"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-[#78675D] hover:bg-[#F5D1BC]"
              >
                ×
              </button>
            </div>

            <form
              action={async (formData: FormData) => {
                setErrore("");
                try {
                  await modificaFamiglia(formData);
                  chiudiPopup();
                } catch (error) {
                  setErrore(
                    error instanceof Error
                      ? error.message
                      : "Impossibile salvare le modifiche."
                  );
                }
              }}
              className="space-y-5"
            >
              <input type="hidden" name="id" value={selezionata.id} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="modifica-famiglia-nome"
                    className="mb-2 block text-sm font-semibold text-[#49372F]"
                  >
                    Nome famiglia
                  </label>
                  <input
                    id="modifica-famiglia-nome"
                    name="nome"
                    required
                    maxLength={100}
                    defaultValue={selezionata.nome}
                    className="w-full rounded-xl border border-[#DCCFC1] bg-white px-4 py-3 text-sm text-[#49372F] outline-none focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="modifica-famiglia-stato"
                    className="mb-2 block text-sm font-semibold text-[#49372F]"
                  >
                    Stato
                  </label>
                  <select
                    id="modifica-famiglia-stato"
                    name="attiva"
                    defaultValue={String(selezionata.attiva)}
                    className="w-full rounded-xl border border-[#DCCFC1] bg-white px-4 py-3 text-sm text-[#49372F] outline-none focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/20"
                  >
                    <option value="true">Attiva</option>
                    <option value="false">Disattiva</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#49372F]">
                  Codice famiglia
                </p>
                <p className="mt-1 rounded-xl border border-[#EADDCF] bg-white/70 px-4 py-3 text-sm text-[#78675D]">
                  {selezionata.codice || "Non assegnato"}
                </p>
              </div>

              {errore && (
                <p role="alert" className="text-sm text-red-700">
                  {errore}
                </p>
              )}

              <div className="flex justify-end border-b border-[#EADDCF] pb-6">
                <button
                  type="submit"
                  className="rounded-xl bg-[#C96F52] px-5 py-3 text-sm font-semibold text-white hover:bg-[#B85E43]"
                >
                  Salva modifiche
                </button>
              </div>
            </form>

            <div className="mt-6">
              <h3 className="text-lg font-bold text-[#49372F]">
                Soci della famiglia
              </h3>
              <p className="mt-1 text-sm text-[#78675D]">
                {soci.filter((s) => s.famiglia_id === selezionata.id).length}{" "}
                soci assegnati
              </p>

              <div className="mt-4 space-y-3">
                {soci
                  .filter((s) => s.famiglia_id === selezionata.id)
                  .map((socio) => (
                    <div
                      key={socio.id}
                      className="rounded-xl border border-[#EADDCF] bg-white p-4"
                    >
                      <p className="font-semibold text-[#49372F]">
                        {socio.nome || "—"} {socio.cognome || ""}
                      </p>
                      <p className="mt-1 text-xs text-[#78675D]">
                        {socio.email || "Email non disponibile"}
                      </p>
                      <form
                        action={async (formData: FormData) => {
                          setErrore("");
                          try {
                            await assegnaSocio(formData);
                            chiudiPopup();
                          } catch (error) {
                            setErrore(
                              error instanceof Error
                                ? error.message
                                : "Impossibile spostare il socio."
                            );
                          }
                        }}
                        className="mt-3 flex flex-col gap-2 sm:flex-row"
                      >
                        <input
                          type="hidden"
                          name="socio_id"
                          value={socio.id}
                        />
                        <select
                          name="famiglia_id"
                          defaultValue={selezionata.id}
                          className="min-w-0 flex-1 rounded-lg border border-[#DCCFC1] bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Nessuna famiglia</option>
                          {famiglie.map((famiglia) => (
                            <option key={famiglia.id} value={famiglia.id}>
                              {famiglia.nome}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg border border-[#DCCFC1] px-4 py-2 text-sm font-semibold text-[#49372F] hover:bg-[#F5D1BC]/40"
                        >
                          Sposta
                        </button>
                      </form>
                    </div>
                  ))}

                {soci.filter((s) => s.famiglia_id === selezionata.id)
                  .length === 0 && (
                  <p className="rounded-xl bg-white/70 p-4 text-sm text-[#78675D]">
                    Nessun socio assegnato a questa famiglia.
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-[#EADDCF] pt-5">
                <h4 className="text-sm font-bold text-[#49372F]">
                  Assegna un socio
                </h4>
                <form
                  action={async (formData: FormData) => {
                    setErrore("");
                    try {
                      await assegnaSocio(formData);
                      chiudiPopup();
                    } catch (error) {
                      setErrore(
                        error instanceof Error
                          ? error.message
                          : "Impossibile assegnare il socio."
                      );
                    }
                  }}
                  className="mt-3 flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    type="hidden"
                    name="famiglia_id"
                    value={selezionata.id}
                  />
                  <select
                    name="socio_id"
                    required
                    defaultValue=""
                    className="min-w-0 flex-1 rounded-xl border border-[#DCCFC1] bg-white px-3 py-3 text-sm"
                  >
                    <option value="" disabled>
                      Seleziona un socio
                    </option>
                    {soci
                      .filter((socio) => socio.famiglia_id !== selezionata.id)
                      .map((socio) => (
                        <option key={socio.id} value={socio.id}>
                          {socio.nome || "—"} {socio.cognome || ""}
                          {socio.famiglia_id ? " · già assegnato" : ""}
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#81977A] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Assegna socio
                  </button>
                </form>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
