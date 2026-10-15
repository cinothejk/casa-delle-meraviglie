
"use client";

import { useState, type KeyboardEvent } from "react";
import { modificaCerchio } from "@/app/protected/cerchi/actions";

type Cerchio = {
  id: string;
  nome: string;
  descrizione: string | null;
  attivo: boolean;
};

const colori = [
  {
    card: "bg-[#F5D1BC]",
    bordo: "border-[#E6B89E]",
    accento: "bg-[#C96F52]",
  },
  {
    card: "bg-[#DDE7D8]",
    bordo: "border-[#B9CCB1]",
    accento: "bg-[#81977A]",
  },
  {
    card: "bg-[#F8E7A8]",
    bordo: "border-[#E8D58B]",
    accento: "bg-[#B89A42]",
  },
  {
    card: "bg-[#E6DDF3]",
    bordo: "border-[#CFC0E5]",
    accento: "bg-[#9276B5]",
  },
  {
    card: "bg-[#D8EAF0]",
    bordo: "border-[#B5D5E0]",
    accento: "bg-[#6599AA]",
  },
  {
    card: "bg-[#F2DCE2]",
    bordo: "border-[#E5BBC8]",
    accento: "bg-[#C47C91]",
  },
];

export default function CerchiLista({
  cerchi,
}: {
  cerchi: Cerchio[];
}) {
  const [cerchioSelezionato, setCerchioSelezionato] =
    useState<Cerchio | null>(null);

  function apriPopup(cerchio: Cerchio) {
    setCerchioSelezionato(cerchio);
  }

  function gestisciTastiera(
    event: KeyboardEvent<HTMLDivElement>,
    cerchio: Cerchio
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      apriPopup(cerchio);
    }
  }

  return (
    <>
      {cerchi.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DCCFC1] bg-white/70 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-[#49372F]">
            Nessun cerchio presente
          </p>
          <p className="mt-2 text-sm text-[#78675D]">
            I cerchi della comunità appariranno qui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cerchi.map((cerchio, index) => {
            const colore = colori[index % colori.length];

            return (
              <div
                key={cerchio.id}
                role="button"
                tabIndex={0}
                aria-label={`Modifica il cerchio ${cerchio.nome}`}
                onClick={() => apriPopup(cerchio)}
                onKeyDown={(event) =>
                  gestisciTastiera(event, cerchio)
                }
                className={`group relative flex min-h-52 cursor-pointer flex-col overflow-hidden rounded-2xl border ${colore.bordo} ${colore.card} p-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96F52] focus-visible:ring-offset-2`}
              >
                <div
                  className={`mb-5 h-1.5 w-12 rounded-full ${colore.accento}`}
                />

                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold leading-snug text-[#49372F]">
                    {cerchio.nome}
                  </h2>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      cerchio.attivo
                        ? "bg-white/75 text-[#426447]"
                        : "bg-white/75 text-[#8A5147]"
                    }`}
                  >
                    {cerchio.attivo ? "Attivo" : "Disattivo"}
                  </span>
                </div>

                <p className="mt-3 flex-1 whitespace-pre-line text-sm leading-relaxed text-[#66564D]">
                  {cerchio.descrizione?.trim() ||
                    "Nessuna descrizione disponibile."}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-[#49372F]/10 pt-4 text-sm font-medium text-[#49372F]">
                  <span>Gestisci cerchio</span>
                  <span
                    aria-hidden="true"
                    className="text-lg transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cerchioSelezionato && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#34261F]/60 p-4 backdrop-blur-sm"
          onClick={() => setCerchioSelezionato(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="modifica-cerchio-titolo"
            onClick={(event) => event.stopPropagation()}
            className="my-auto w-full max-w-lg rounded-3xl border border-[#EADDCF] bg-[#FFF8EF] p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#C96F52]">
                  Organizzazione della comunità
                </p>
                <h2
                  id="modifica-cerchio-titolo"
                  className="mt-1 text-2xl font-bold text-[#49372F]"
                >
                  Modifica cerchio
                </h2>
                <p className="mt-2 text-sm text-[#78675D]">
                  Aggiorna le informazioni del cerchio selezionato.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCerchioSelezionato(null)}
                aria-label="Chiudi finestra"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-[#78675D] transition hover:bg-[#F5D1BC] hover:text-[#49372F]"
              >
                ×
              </button>
            </div>

            <form
              action={async (formData: FormData) => {
                await modificaCerchio(formData);
                setCerchioSelezionato(null);
              }}
              className="space-y-5"
            >
              <input
                type="hidden"
                name="id"
                value={cerchioSelezionato.id}
              />

              <div>
                <label
                  htmlFor="modifica-cerchio-nome"
                  className="mb-2 block text-sm font-semibold text-[#49372F]"
                >
                  Nome
                </label>
                <input
                  id="modifica-cerchio-nome"
                  name="nome"
                  required
                  maxLength={100}
                  defaultValue={cerchioSelezionato.nome}
                  className="w-full rounded-xl border border-[#DCCFC1] bg-white px-4 py-3 text-sm text-[#49372F] outline-none transition placeholder:text-[#A49488] focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="modifica-cerchio-descrizione"
                  className="mb-2 block text-sm font-semibold text-[#49372F]"
                >
                  Descrizione
                </label>
                <textarea
                  id="modifica-cerchio-descrizione"
                  name="descrizione"
                  rows={4}
                  maxLength={2000}
                  defaultValue={cerchioSelezionato.descrizione ?? ""}
                  placeholder="Descrivi questo cerchio..."
                  className="w-full resize-y rounded-xl border border-[#DCCFC1] bg-white px-4 py-3 text-sm leading-relaxed text-[#49372F] outline-none transition placeholder:text-[#A49488] focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="modifica-cerchio-stato"
                  className="mb-2 block text-sm font-semibold text-[#49372F]"
                >
                  Stato del cerchio
                </label>
                <select
                  id="modifica-cerchio-stato"
                  name="attivo"
                  defaultValue={String(cerchioSelezionato.attivo)}
                  className="w-full rounded-xl border border-[#DCCFC1] bg-white px-4 py-3 text-sm text-[#49372F] outline-none transition focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/20"
                >
                  <option value="true">Attivo</option>
                  <option value="false">Disattivo</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#EADDCF] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCerchioSelezionato(null)}
                  className="rounded-xl border border-[#DCCFC1] px-5 py-3 text-sm font-semibold text-[#66564D] transition hover:bg-[#F5D1BC]/40"
                >
                  Annulla
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#C96F52] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B85E43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96F52] focus-visible:ring-offset-2"
                >
                  Salva modifiche
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
