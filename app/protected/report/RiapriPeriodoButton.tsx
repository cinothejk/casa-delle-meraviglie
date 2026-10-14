
"use client";

import { useState } from "react";
import { riapriPeriodo } from "./actions";

export default function RiapriPeriodoButton({
  anno,
  mese,
  nomeMese,
}: {
  anno: number;
  mese: number;
  nomeMese: string;
}) {
  const [conferma, setConferma] = useState(false);
  const [inCorso, setInCorso] = useState(false);

  async function eseguiRiapertura(formData: FormData) {
    setInCorso(true);

    try {
      await riapriPeriodo(formData);
      window.location.reload();
    } catch (errore) {
      alert(
        errore instanceof Error
          ? errore.message
          : "Errore durante la riapertura."
      );
      setInCorso(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConferma(true)}
        className="rounded-md border border-amber-500 px-4 py-2 text-sm font-medium"
      >
        Riapri periodo
      </button>

      {conferma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titolo-riapertura"
            className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl"
          >
            <h2
              id="titolo-riapertura"
              className="text-lg font-semibold"
            >
              Riaprire il periodo?
            </h2>

            <p className="mt-3 text-sm text-muted-foreground">
              Vuoi riaprire {nomeMese} {anno}?
              Il periodo tornerà aperto. I report già
              salvati non verranno cancellati.
            </p>

            <form action={eseguiRiapertura}>
              <input
                type="hidden"
                name="anno"
                value={anno}
              />
              <input
                type="hidden"
                name="mese"
                value={mese}
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={inCorso}
                  onClick={() => setConferma(false)}
                  className="rounded-md border px-4 py-2 text-sm"
                >
                  Annulla
                </button>

                <button
                  type="submit"
                  disabled={inCorso}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {inCorso ? "Riapertura..." : "Conferma riapertura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
