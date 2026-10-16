
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  eliminaAttivitaPulizia,
  eliminaUtentePulizia,
  eliminaFamigliaPulizia,
} from "./actions";

type Attivita = {
  id: string;
  titolo: string;
  stato: string;
  created_at: string;
};

type Utente = {
  id: string;
  nome: string;
  cognome: string;
  username: string | null;
  email: string | null;
  ruolo: string;
  attivo: boolean;
};

type Famiglia = {
  id: string;
  nome: string;
  codice: string;
  note: string | null;
  attiva: boolean;
  created_at: string;
};

type Props = {
  attivita: Attivita[];
  utenti: Utente[];
  famiglie: Famiglia[];
  utenteCorrenteId: string;
};

const inputClass =
  "w-full rounded-xl border border-[#E8DCCF] bg-white px-4 py-3 text-sm text-[#44382F] outline-none transition placeholder:text-[#A79A8D] focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/15";

const dangerButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50";

function etichettaStato(stato: string) {
  const etichette: Record<string, string> = {
    bozza: "Bozza",
    pubblicata: "Pubblicata",
    chiusa: "Chiusa",
    annullata: "Annullata",
  };

  return etichette[stato] ?? stato;
}

export default function PuliziaDatiManager({
  attivita,
  utenti,
  famiglie,
  utenteCorrenteId,
}: Props) {
  const [ricercaAttivita, setRicercaAttivita] = useState("");
  const [ricercaUtenti, setRicercaUtenti] = useState("");
  const [ricercaFamiglie, setRicercaFamiglie] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [errore, setErrore] = useState("");
  const [inCorso, avviaTransizione] = useTransition();
  const router = useRouter();
  const [conferma, setConferma] = useState<{
        tipo: "attivita" | "utente" | "famiglia";
        id: string;
        nome: string;
        dettaglio: string;
    } | null>(null);

  const attivitaFiltrate = useMemo(() => {
    const termine = ricercaAttivita.trim().toLocaleLowerCase("it");

    return attivita.filter((item) =>
      `${item.titolo} ${item.stato}`
        .toLocaleLowerCase("it")
        .includes(termine)
    );
  }, [attivita, ricercaAttivita]);

    const utentiFiltrati = useMemo(() => {
    const termine = ricercaUtenti.trim().toLocaleLowerCase("it");

    return utenti.filter((item) =>
       `${item.nome} ${item.cognome} ${item.username ?? ""} ${
         item.email ?? ""
       } ${item.ruolo}`
         .toLocaleLowerCase("it")
         .includes(termine)
     );
     }, [utenti, ricercaUtenti]);

     
    const famiglieFiltrate = useMemo(() => {
    const termine = ricercaFamiglie.trim().toLocaleLowerCase("it");

    return famiglie.filter((item) =>
        `${item.nome} ${item.codice} ${item.note ?? ""}`
        .toLocaleLowerCase("it")
        .includes(termine)
    );
    }, [famiglie, ricercaFamiglie]);


  
    function confermaEliminazioneAttivita(item: Attivita) {
    setErrore("");
    setMessaggio("");
    setConferma({
        tipo: "attivita",
        id: item.id,
        nome: item.titolo,
        dettaglio:
        "Le partecipazioni collegate verranno eliminate automaticamente. L'operazione non può essere annullata.",
    });
    }



    function confermaEliminazioneUtente(item: Utente) {
    if (item.id === utenteCorrenteId) {
        setErrore("Non puoi eliminare il tuo account.");
        return;
    }

    setErrore("");
    setMessaggio("");
    setConferma({
        tipo: "utente",
        id: item.id,
        nome: `${item.nome} ${item.cognome}`,
        dettaglio:
        "Verrà eliminato anche il suo account di autenticazione. L'operazione non può essere annullata.",
    });
    }

    
    function confermaEliminazioneFamiglia(item: Famiglia) {
    setErrore("");
    setMessaggio("");
    setConferma({
        tipo: "famiglia",
        id: item.id,
        nome: item.nome,
        dettaglio:
        "I profili collegati resteranno nel sistema, ma non saranno più associati a questa famiglia. L'operazione non può essere annullata.",
    });
    }


    function eseguiEliminazione() {
    if (!conferma || inCorso) return;

    const elemento = conferma;
    setConferma(null);
    setErrore("");
    setMessaggio("");

    avviaTransizione(async () => {
        try {
        
            if (elemento.tipo === "attivita") {
            await eliminaAttivitaPulizia(elemento.id);
            setMessaggio(`Attività "${elemento.nome}" eliminata.`);
            } else if (elemento.tipo === "utente") {
            const risultato = await eliminaUtentePulizia(elemento.id);

            if (!risultato.success) {
                setErrore(risultato.error);
                return;
            }

            setMessaggio(`Utente "${elemento.nome}" eliminato.`);
            } else {
            const risultato = await eliminaFamigliaPulizia(elemento.id);

            if (!risultato.success) {
                setErrore(risultato.error);
                return;
            }

            setMessaggio(`Famiglia "${elemento.nome}" eliminata.`);
            }


        router.refresh();
        } catch (error) {
        setErrore(
            error instanceof Error
            ? error.message
            : "Errore durante l'eliminazione."
        );
        }
    });
    }


  return (
    <div className="space-y-8">
      
        {conferma && (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D211D]/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
            if (event.target === event.currentTarget && !inCorso) {
                setConferma(null);
            }
            }}
        >
            <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titolo-conferma-eliminazione"
            aria-describedby="descrizione-conferma-eliminazione"
            className="w-full max-w-md rounded-2xl border border-[#EADDCF] bg-[#FFF8EF] p-6 shadow-2xl"
            >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <span className="text-2xl" aria-hidden="true">!</span>
            </div>

            <h2
                id="titolo-conferma-eliminazione"
                className="text-xl font-bold text-[#44382F]"
            >
                Confermi l'eliminazione?
            </h2>

            <p className="mt-3 break-words font-semibold text-[#9C533B]">
                {conferma.nome}
            </p>

            <p
                id="descrizione-conferma-eliminazione"
                className="mt-2 text-sm leading-6 text-[#76665A]"
            >
                {conferma.dettaglio}
            </p>

            <p className="mt-3 text-xs font-medium text-rose-700">
                Questa operazione è definitiva.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                type="button"
                disabled={inCorso}
                onClick={() => setConferma(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E8DCCF] bg-white px-4 py-2 text-sm font-semibold text-[#49372F] transition hover:bg-[#F7EDE2] disabled:opacity-50"
                >
                Annulla
                </button>

                <button
                type="button"
                disabled={inCorso}
                onClick={eseguiEliminazione}
                className={dangerButtonClass}
                >
                {inCorso ? "Eliminazione..." : "Elimina definitivamente"}
                </button>
            </div>
            </div>
        </div>
        )}  


      {messaggio && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {messaggio}
        </div>
      )}

      {errore && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {errore}
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-[#EADDCF] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#44382F]">
              Attività
            </h2>
            <p className="mt-1 text-sm text-[#76665A]">
              Elimina un'attività e le sue partecipazioni collegate.
            </p>
          </div>

          <span className="rounded-full bg-[#FFF1E7] px-3 py-1 text-sm font-semibold text-[#9C533B]">
            {attivita.length} totali
          </span>
        </div>

        <input
          type="search"
          value={ricercaAttivita}
          onChange={(event) => setRicercaAttivita(event.target.value)}
          placeholder="Cerca un'attività..."
          aria-label="Cerca attività"
          className={inputClass}
        />

        {attivitaFiltrate.length === 0 ? (
          <p className="rounded-xl bg-[#FFF8EF] p-4 text-sm text-[#76665A]">
            Nessuna attività trovata.
          </p>
        ) : (
          <ul className="divide-y divide-[#F0E5DA]">
            {attivitaFiltrate.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#44382F]">
                    {item.titolo}
                  </p>
                  <p className="mt-1 text-sm text-[#76665A]">
                    {etichettaStato(item.stato)} ·{" "}
                    {new Date(item.created_at).toLocaleDateString("it-IT")}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={inCorso}
                  onClick={() => confermaEliminazioneAttivita(item)}
                  className={dangerButtonClass}
                >
                  {inCorso ? "Attendi..." : "Elimina attività"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-[#EADDCF] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#44382F]">
              Utenti
            </h2>
            <p className="mt-1 text-sm text-[#76665A]">
              Elimina un account e il relativo profilo. Gli utenti presenti
              nei report mensili non possono essere eliminati da questa pagina.
            </p>
          </div>

          <span className="rounded-full bg-[#FFF1E7] px-3 py-1 text-sm font-semibold text-[#9C533B]">
            {utenti.length} totali
          </span>
        </div>

        <input
          type="search"
          value={ricercaUtenti}
          onChange={(event) => setRicercaUtenti(event.target.value)}
          placeholder="Cerca per nome, username o email..."
          aria-label="Cerca utenti"
          className={inputClass}
        />

        {utentiFiltrati.length === 0 ? (
          <p className="rounded-xl bg-[#FFF8EF] p-4 text-sm text-[#76665A]">
            Nessun utente trovato.
          </p>
        ) : (
          <ul className="divide-y divide-[#F0E5DA]">
            {utentiFiltrati.map((item) => {
              const utenteCorrente = item.id === utenteCorrenteId;

              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#44382F]">
                      {item.nome} {item.cognome}
                      {utenteCorrente && (
                        <span className="ml-2 text-xs font-medium text-[#9C533B]">
                          (tu)
                        </span>
                      )}
                    </p>

                    <p className="mt-1 break-words text-sm text-[#76665A]">
                      {item.username ? `@${item.username}` : "Username assente"}
                      {item.email ? ` · ${item.email}` : ""}
                    </p>

                    <p className="mt-1 text-xs text-[#8A796C]">
                      {item.ruolo} · {item.attivo ? "Attivo" : "Disattivato"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={inCorso || utenteCorrente}
                    onClick={() => confermaEliminazioneUtente(item)}
                    title={
                      utenteCorrente
                        ? "Non puoi eliminare il tuo account"
                        : "Elimina utente"
                    }
                    className={dangerButtonClass}
                  >
                    {utenteCorrente
                      ? "Account corrente"
                      : inCorso
                        ? "Attendi..."
                        : "Elimina utente"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      
        <section className="space-y-4 rounded-2xl border border-[#EADDCF] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
            <h2 className="text-xl font-semibold text-[#44382F]">
                Famiglie
            </h2>
            <p className="mt-1 text-sm text-[#76665A]">
                Elimina una famiglia. I profili associati resteranno nel sistema.
                Le famiglie presenti nei report mensili non possono essere eliminate.
            </p>
            </div>

            <span className="rounded-full bg-[#FFF1E7] px-3 py-1 text-sm font-semibold text-[#9C533B]">
            {famiglie.length} totali
            </span>
        </div>

        <input
            type="search"
            value={ricercaFamiglie}
            onChange={(event) => setRicercaFamiglie(event.target.value)}
            placeholder="Cerca per nome, codice o note..."
            aria-label="Cerca famiglie"
            className={inputClass}
        />

        {famiglieFiltrate.length === 0 ? (
            <p className="rounded-xl bg-[#FFF8EF] p-4 text-sm text-[#76665A]">
            Nessuna famiglia trovata.
            </p>
        ) : (
            <ul className="divide-y divide-[#F0E5DA]">
            {famiglieFiltrate.map((item) => (
                <li
                key={item.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                <div className="min-w-0">
                    <p className="font-semibold text-[#44382F]">
                    {item.nome}
                    </p>

                    <p className="mt-1 text-sm text-[#76665A]">
                    Codice: {item.codice}
                    </p>

                    {item.note && (
                    <p className="mt-1 break-words text-sm text-[#76665A]">
                        {item.note}
                    </p>
                    )}

                    <p className="mt-1 text-xs text-[#8A796C]">
                    {item.attiva ? "Attiva" : "Disattivata"} · Creata il{" "}
                    {new Date(item.created_at).toLocaleDateString("it-IT")}
                    </p>
                </div>

                <button
                    type="button"
                    disabled={inCorso}
                    onClick={() => confermaEliminazioneFamiglia(item)}
                    className={dangerButtonClass}
                >
                    {inCorso ? "Attendi..." : "Elimina famiglia"}
                </button>
                </li>
            ))}
            </ul>
        )}
        </section>


      <p className="text-xs leading-5 text-[#8A796C]">
        Le cancellazioni sono definitive. L'Audit Log deve essere conservato.
        Prima di usare questa funzione in produzione, verifica anche le regole
        di eliminazione dei record collegati e la coerenza tra account Auth e
        profilo.
      </p>
    </div>
  );
}
