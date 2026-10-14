"use client";

import { useEffect, useState, type ReactNode } from "react";

type AzioneRapida = {
  etichetta: string;
  stato: string;
  stile: string;
};

type Props = {
  titolo: string;
  cerchio: string;
  stato: string;
  statoClass: string;
  children: ReactNode;
  attivitaId: string;
  azioneRapida: (formData: FormData) => void | Promise<void>;
  azioniRapide?: AzioneRapida[];
  messaggioStato?: string;
};

export default function ActivityDetailModal({
  titolo,
  cerchio,
  stato,
  statoClass,
  children,
  attivitaId,
  azioneRapida,
  azioniRapide = [],
  messaggioStato,
}: Props) {
  const [aperta, setAperta] = useState(false);

  useEffect(() => {
    if (!aperta) return;

    const gestisciTasto = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAperta(false);
    };

    document.addEventListener("keydown", gestisciTasto);
    return () => document.removeEventListener("keydown", gestisciTasto);
  }, [aperta]);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setAperta(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            if (event.target !== event.currentTarget) return;
            event.preventDefault();
            setAperta(true);
          }
        }}
        className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[#EDE1D6] bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#DFC2AC] hover:bg-[#FFFCF8] focus:outline-none focus:ring-2 focus:ring-[#C96F52]/40 sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.7fr)_auto_auto]"
      >
        <span className="truncate font-semibold text-[#503C30]">
          {titolo}
        </span>

        <span className="hidden truncate text-sm text-[#857568] sm:block">
          {cerchio}
        </span>

        <span
          className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${statoClass}`}
        >
          {stato}
        </span>

        <span className="text-sm text-[#966044]">Dettagli →</span>

        <span className="col-span-2 truncate text-xs text-[#857568] sm:hidden">
          {cerchio}
        </span>

        {(azioniRapide.length > 0 || messaggioStato) && (
          <div
            className="col-span-2 flex flex-wrap items-center gap-2 border-t border-[#F5D1BC] pt-3"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {messaggioStato && (
              <span className="rounded-full bg-[#F5D1BC] px-4 py-2 text-sm font-medium text-[#75432F]">
                {messaggioStato}
              </span>
            )}

            {azioniRapide.map((azione) => (
              <form
                key={azione.stato}
                action={azioneRapida}
                onClick={(event) => event.stopPropagation()}
              >
                <input type="hidden" name="id" value={attivitaId} />
                <input type="hidden" name="stato" value={azione.stato} />

                <button type="submit" className={azione.stile}>
                  {azione.etichetta}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>

      {aperta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#34261F]/50 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAperta(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titolo-dettaglio-attivita"
            className="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#EDE1D6] bg-[#FFFCF8] shadow-2xl"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#EDE1D6] bg-white px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2
                  id="titolo-dettaglio-attivita"
                  className="break-words text-lg font-bold text-[#503C30] sm:text-xl"
                >
                  {titolo}
                </h2>
                <p className="mt-1 text-sm text-[#857568]">{cerchio}</p>
              </div>

              <button
                type="button"
                onClick={() => setAperta(false)}
                aria-label="Chiudi dettagli"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EDE1D6] text-xl text-[#78695C] hover:bg-[#FFF5EB]"
              >
                ×
              </button>
            </header>

            <div className="overflow-y-auto p-4 sm:p-6">{children}</div>
          </section>
        </div>
      )}
    </>
  );
}