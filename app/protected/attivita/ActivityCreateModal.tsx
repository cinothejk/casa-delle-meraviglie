"use client";

import { useEffect, useState } from "react";
import { creaAttivita } from "./actions";

type Cerchio = {
id: string;
nome: string;
};

type ActivityCreateModalProps = {
cerchi: Cerchio[];
};

export default function ActivityCreateModal({
cerchi,
}: ActivityCreateModalProps) {
const [aperto, setAperto] = useState(false);

useEffect(() => {
if (!aperto) return;


function gestisciTasto(event: KeyboardEvent) {
  if (event.key === "Escape") {
    setAperto(false);
  }
}

window.addEventListener("keydown", gestisciTasto);

return () => {
  window.removeEventListener("keydown", gestisciTasto);
};


}, [aperto]);

return (
<>
<button
type="button"
onClick={() => setAperto(true)}
className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#C96F52] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B65E43]"
> <span aria-hidden="true" className="text-lg leading-none">
+ </span>
Nuova attività </button>


  {aperto && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#30251F]/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setAperto(false);
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-nuova-attivita-titolo"
        className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#E8D9CA] bg-[#FFFCF8] shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#EFE3D8] bg-[#FFFCF8] px-5 py-4 sm:px-7">
          <div>
            <h2
              id="modal-nuova-attivita-titolo"
              className="text-xl font-bold text-[#503C30]"
            >
              Nuova attività
            </h2>
            <p className="mt-1 text-sm text-[#857568]">
              Inserisci i dettagli dell'attività.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAperto(false)}
            aria-label="Chiudi finestra"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E8D9CA] bg-white text-xl text-[#705443] hover:bg-[#F8E7DA]"
          >
            ×
          </button>
        </header>

        <form
          action={creaAttivita}
          className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7"
        >
          <div className="space-y-2">
            <label
              htmlFor="nuova-attivita-titolo"
              className="block text-sm font-medium text-[#594A3F]"
            >
              Titolo *
            </label>
            <input
              id="nuova-attivita-titolo"
              name="titolo"
              required
              className="w-full min-w-0 rounded-xl border border-[#E8DCCF] bg-white px-3.5 py-3 text-sm text-[#44382F] outline-none focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/15"
              placeholder="Es. Sistemazione giardino"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="nuova-attivita-cerchio"
              className="block text-sm font-medium text-[#594A3F]"
            >
              Cerchio *
            </label>
            <select
              id="nuova-attivita-cerchio"
              name="cerchio_id"
              required
              defaultValue=""
              className="w-full min-w-0 rounded-xl border border-[#E8DCCF] bg-white px-3.5 py-3 text-sm text-[#44382F] outline-none focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/15"
            >
              <option value="" disabled>
                Seleziona un cerchio
              </option>
              {cerchi.map((cerchio) => (
                <option key={cerchio.id} value={cerchio.id}>
                  {cerchio.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label
              htmlFor="nuova-attivita-descrizione"
              className="block text-sm font-medium text-[#594A3F]"
            >
              Descrizione
            </label>
            <textarea
              id="nuova-attivita-descrizione"
              name="descrizione"
              rows={3}
              className="w-full min-w-0 rounded-xl border border-[#E8DCCF] bg-white px-3.5 py-3 text-sm text-[#44382F] outline-none focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/15"
              placeholder="Descrivi cosa bisogna fare..."
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label
              htmlFor="nuova-attivita-luogo"
              className="block text-sm font-medium text-[#594A3F]"
            >
              Luogo
            </label>
            <input
              id="nuova-attivita-luogo"
              name="luogo"
              className="w-full min-w-0 rounded-xl border border-[#E8DCCF] bg-white px-3.5 py-3 text-sm text-[#44382F] outline-none focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/15"
              placeholder="Es. Giardino della scuola"
            />
          </div>

          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => setAperto(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E5D5C7] bg-white px-4 py-2.5 text-sm font-semibold text-[#594A3F] hover:bg-[#FFF8EF]"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#C96F52] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B65E43]"
            >
              Crea attività
            </button>
          </div>
        </form>
      </section>
    </div>
  )}
</>


);
}
