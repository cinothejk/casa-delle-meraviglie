"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { aggiornaImpostazioni } from "./actions";

type Props = {
  oreMassime: number;
  valoreOra: number;
  creditoMassimo: number;
};

type Modifica = {
  nome: string;
  attuale: string;
  nuovo: string;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#EADDCF] bg-white px-3 py-2.5 text-[#49372F] outline-none transition focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/15";

const buttonPrimary =
  "rounded-xl bg-[#C96F52] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B65D43]";

const buttonSecondary =
  "rounded-xl border border-[#EADDCF] bg-white px-5 py-2.5 text-sm font-semibold text-[#49372F] transition hover:bg-[#FFF8EF]";

function formattaEuro(valore: number) {
  return valore.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

function formattaOre(valore: number) {
  return `${valore.toLocaleString("it-IT")} ${
    valore === 1 ? "ora" : "ore"
  }`;
}

export default function ImpostazioniForm({
  oreMassime,
  valoreOra,
  creditoMassimo,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const confermaRef = useRef(false);

  const [modaleAperta, setModaleAperta] = useState(false);
  const [modifiche, setModifiche] = useState<Modifica[]>([]);

  function gestisciInvio(event: FormEvent<HTMLFormElement>) {
    // Dopo la conferma, lascia eseguire la Server Action.
    if (confermaRef.current) {
      confermaRef.current = false;
      return;
    }

    // Al primo clic mostra il riepilogo senza salvare.
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const nuoveOre = Number(formData.get("ore_massime"));
    const nuovoValoreOra = Number(formData.get("valore_ora"));
    const nuovoCreditoMassimo = Number(
      formData.get("credito_massimo")
    );

    const elenco: Modifica[] = [];

    if (nuoveOre !== oreMassime) {
      elenco.push({
        nome: "Ore massime mensili",
        attuale: formattaOre(oreMassime),
        nuovo: formattaOre(nuoveOre),
      });
    }

    if (
      Math.round(nuovoValoreOra * 100) !==
      Math.round(valoreOra * 100)
    ) {
      elenco.push({
        nome: "Valore di un'ora",
        attuale: formattaEuro(valoreOra),
        nuovo: formattaEuro(nuovoValoreOra),
      });
    }

    if (
      Math.round(nuovoCreditoMassimo * 100) !==
      Math.round(creditoMassimo * 100)
    ) {
      elenco.push({
        nome: "Credito massimo mensile",
        attuale: formattaEuro(creditoMassimo),
        nuovo: formattaEuro(nuovoCreditoMassimo),
      });
    }

    setModifiche(elenco);
    setModaleAperta(true);
  }

  function confermaSalvataggio() {
    const form = formRef.current;

    if (!form) return;

    setModaleAperta(false);

    confermaRef.current = true;
    form.requestSubmit();
  }

  return (
    <>
      <div className="rounded-2xl border border-[#EADDCF] bg-white p-5 sm:p-6">
        <form
          ref={formRef}
          action={aggiornaImpostazioni}
          onSubmit={gestisciInvio}
          className="space-y-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-[#49372F]">
              Regole mensili
            </h2>

            <p className="mt-1 text-sm text-[#8B796D]">
              Questi valori vengono utilizzati per il calcolo
              dei crediti delle famiglie.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label
                htmlFor="ore_massime"
                className="block text-sm font-medium text-[#49372F]"
              >
                Ore massime mensili
              </label>

              <input
                id="ore_massime"
                name="ore_massime"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                defaultValue={oreMassime}
                className={inputClass}
                required
              />

              <p className="mt-1 text-xs text-[#8B796D]">
                Limite complessivo per famiglia.
              </p>
            </div>

            <div>
              <label
                htmlFor="valore_ora"
                className="block text-sm font-medium text-[#49372F]"
              >
                Valore di 1 ora (€)
              </label>

              <input
                id="valore_ora"
                name="valore_ora"
                type="number"
                min="0.01"
                max="1000"
                step="0.01"
                defaultValue={valoreOra}
                className={inputClass}
                required
              />

              <p className="mt-1 text-xs text-[#8B796D]">
                Valore economico di ogni ora approvata.
              </p>
            </div>

            <div>
              <label
                htmlFor="credito_massimo"
                className="block text-sm font-medium text-[#49372F]"
              >
                Credito massimo mensile (€)
              </label>

              <input
                id="credito_massimo"
                name="credito_massimo"
                type="number"
                min="0.01"
                max="10000"
                step="0.01"
                defaultValue={creditoMassimo}
                className={inputClass}
                required
              />

              <p className="mt-1 text-xs text-[#8B796D]">
                Tetto massimo di credito per famiglia.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#FFF8EF] p-4 text-sm">
            <p className="font-semibold text-[#49372F]">
              Configurazione attuale
            </p>

            <ul className="mt-2 space-y-1 text-[#8B796D]">
              <li>
                Massimo: {formattaOre(oreMassime)} / famiglia / mese
              </li>
              <li>
                Valore: {formattaEuro(valoreOra)} / ora
              </li>
              <li>
                Credito massimo: {formattaEuro(creditoMassimo)} /
                famiglia / mese
              </li>
            </ul>
          </div>

          <div className="flex justify-end border-t border-[#EFE4D9] pt-5">
            <button type="submit" className={buttonPrimary}>
              Salva impostazioni
            </button>
          </div>
        </form>
      </div>

      {modaleAperta && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#30251F]/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="conferma-impostazioni-titolo"
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[#FFF8EF] p-5 shadow-2xl sm:rounded-3xl sm:p-7"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F5D1BC] text-[#9E5038]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M12 8v4m0 4h.01" />
                  <path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="conferma-impostazioni-titolo"
                  className="text-xl font-bold text-[#49372F]"
                >
                  Conferma le impostazioni
                </h2>

                <p className="mt-1 text-sm text-[#8B796D]">
                  Controlla il riepilogo prima di applicare le modifiche.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModaleAperta(false)}
                aria-label="Chiudi"
                className="rounded-full p-2 text-[#8B796D] hover:bg-[#F5D1BC]/40"
              >
                ✕
              </button>
            </div>

            {modifiche.length > 0 ? (
              <>
                <div className="mt-6 space-y-3">
                  {modifiche.map((modifica) => (
                    <div
                      key={modifica.nome}
                      className="rounded-xl border border-[#EADDCF] bg-white p-4"
                    >
                      <p className="text-sm font-semibold text-[#49372F]">
                        {modifica.nome}
                      </p>

                      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-[#8B796D]">
                            Attuale
                          </p>
                          <p className="mt-1 break-words text-sm text-[#49372F]">
                            {modifica.attuale}
                          </p>
                        </div>

                        <span className="text-[#C96F52]" aria-hidden="true">
                          →
                        </span>

                        <div className="min-w-0">
                          <p className="text-xs text-[#8B796D]">
                            Nuovo
                          </p>
                          <p className="mt-1 break-words text-sm font-semibold text-[#A6533B]">
                            {modifica.nuovo}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 rounded-xl bg-[#F5D1BC]/40 p-3 text-sm text-[#754632]">
                  Le modifiche saranno salvate nelle impostazioni
                  della comunità e influenzeranno i calcoli futuri
                  secondo le regole dell&apos;applicazione.
                </p>
              </>
            ) : (
              <div className="mt-6 rounded-xl border border-[#EADDCF] bg-white p-4">
                <p className="font-semibold text-[#49372F]">
                  Nessuna modifica rilevata
                </p>
                <p className="mt-1 text-sm text-[#8B796D]">
                  Tutti i valori inseriti corrispondono già alla
                  configurazione attuale.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModaleAperta(false)}
                className={buttonSecondary}
              >
                Annulla
              </button>

              {modifiche.length > 0 && (
                <button
                  type="button"
                  onClick={confermaSalvataggio}
                  className={buttonPrimary}
                >
                  Conferma e salva
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}