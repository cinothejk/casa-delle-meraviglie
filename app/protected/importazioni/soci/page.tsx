
"use client";

import { useState } from "react";
import Papa from "papaparse";
import { importaSoci } from "./actions";

type SocioCSV = {
  nome: string;
  cognome: string;
  username: string;
  email: string;
  famiglia: string;
  attivo: string;
};

type Risultato = {
  success: boolean;
  create?: number;
  errori?: number;
  dettagli?: string[];
  error?: string;
};

export default function ImportaSociPage() {
  const [righe, setRighe] = useState<SocioCSV[]>([]);
  const [erroriCSV, setErroriCSV] = useState<string[]>([]);
  const [risultato, setRisultato] = useState<Risultato | null>(null);
  const [caricamento, setCaricamento] = useState(false);
  const [fileNome, setFileNome] = useState("");

  function caricaCSV(file: File) {
    setRighe([]);
    setErroriCSV([]);
    setRisultato(null);
    setFileNome(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) =>
        header.replace(/^\uFEFF/, "").trim().toLowerCase(),
      complete: (result) => {
        const intestazioni = result.meta.fields ?? [];
        const obbligatorie = [
          "nome",
          "cognome",
          "username",
          "email",
          "famiglia",
        ];

        const mancanti = obbligatorie.filter(
          (campo) => !intestazioni.includes(campo)
        );

        if (mancanti.length > 0) {
          setErroriCSV([
            `Mancano le colonne obbligatorie: ${mancanti.join(", ")}.`,
          ]);
          return;
        }

        const errori: string[] = [];

        result.errors.forEach((errore) => {
          const posizione =
            errore.row === undefined
              ? "Errore CSV"
              : `Errore CSV alla riga ${errore.row + 2}`;

          errori.push(`${posizione}: ${errore.message}`);
        });

        const normalizzate: SocioCSV[] = result.data.map((riga) => ({
          nome: (riga.nome ?? "").trim(),
          cognome: (riga.cognome ?? "").trim(),
          username: (riga.username ?? "").trim(),
          email: (riga.email ?? "").trim().toLowerCase(),
          famiglia: (riga.famiglia ?? "").trim(),
          attivo: (riga.attivo ?? "true").trim().toLowerCase() || "true",
        }));

        normalizzate.forEach((riga, indice) => {
          const numero = indice + 2;

          if (
            !riga.nome ||
            !riga.cognome ||
            !riga.username ||
            !riga.email ||
            !riga.famiglia
          ) {
            errori.push(`Riga ${numero}: uno o più campi obbligatori sono vuoti.`);
          }

          if (
            riga.attivo &&
            !["true", "false", "si", "sì", "no", "1", "0"].includes(
              riga.attivo
            )
          ) {
            errori.push(`Riga ${numero}: valore della colonna attivo non valido.`);
          }

          if (["false", "no", "0"].includes(riga.attivo)) {
            errori.push(
              `Riga ${numero}: i nuovi account vengono importati attivi. Usa true.`
            );
          }
        });

        const usernames = new Set<string>();
        const email = new Set<string>();

        normalizzate.forEach((riga, indice) => {
          const numero = indice + 2;
          const username = riga.username.toLocaleLowerCase("it");
          const indirizzo = riga.email.toLocaleLowerCase("it");

          if (username && usernames.has(username)) {
            errori.push(`Riga ${numero}: username duplicato nel CSV.`);
          }
          if (indirizzo && email.has(indirizzo)) {
            errori.push(`Riga ${numero}: email duplicata nel CSV.`);
          }

          usernames.add(username);
          email.add(indirizzo);
        });

        setRighe(normalizzate);
        setErroriCSV(errori);
      },
      error: (errore) => {
        setErroriCSV([`Impossibile leggere il CSV: ${errore.message}`]);
      },
    });
  }

  async function confermaImportazione(formData: FormData) {
    setCaricamento(true);
    setRisultato(null);

    try {
      const esito = await importaSoci(formData);
      setRisultato(esito);

      if (esito.success) {
        setRighe([]);
        setFileNome("");
      }
    } catch {
      setRisultato({
        success: false,
        error: "Errore imprevisto durante l'importazione.",
      });
    } finally {
      setCaricamento(false);
    }
  }

  const jsonRighe = JSON.stringify(righe);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Importazione soci da CSV</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Carica un CSV, controlla l'anteprima e conferma l'importazione.
          Ogni nuovo socio riceverà un'email per impostare la password.
        </p>
      </div>

      <section className="rounded-xl border p-4 sm:p-6">
        <h2 className="text-lg font-medium">1. Seleziona il file</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Colonne richieste: nome, cognome, username, email, famiglia.
          La colonna attivo è facoltativa; se omessa, il socio sarà attivo.
        </p>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium">
            File CSV
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) caricaCSV(file);
            }}
            className="block w-full text-sm"
          />
        </label>

        {fileNome && (
          <p className="mt-2 text-sm">File selezionato: {fileNome}</p>
        )}
      </section>

      {erroriCSV.length > 0 && (
        <section
          className="rounded-xl border border-red-300 p-4"
          role="alert"
        >
          <h2 className="font-semibold">Controlla il CSV</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {erroriCSV.map((errore, indice) => (
              <li key={`${indice}-${errore}`}>{errore}</li>
            ))}
          </ul>
        </section>
      )}

      {righe.length > 0 && (
        <section className="space-y-4 rounded-xl border p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-medium">2. Anteprima</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Righe lette: {righe.length}. Prima di confermare, controlla
              soprattutto che i nomi delle famiglie corrispondano a famiglie
              esistenti e attive.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Nome</th>
                  <th className="p-2">Cognome</th>
                  <th className="p-2">Username</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Famiglia</th>
                  <th className="p-2">Attivo</th>
                </tr>
              </thead>
              <tbody>
                {righe.slice(0, 20).map((riga, indice) => (
                  <tr key={`${riga.email}-${indice}`} className="border-b">
                    <td className="p-2">{riga.nome}</td>
                    <td className="p-2">{riga.cognome}</td>
                    <td className="p-2">{riga.username}</td>
                    <td className="p-2">{riga.email}</td>
                    <td className="p-2">{riga.famiglia}</td>
                    <td className="p-2">{riga.attivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {righe.length > 20 && (
            <p className="text-sm text-muted-foreground">
              Sono mostrate le prime 20 righe; verranno elaborate tutte le{" "}
              {righe.length} righe.
            </p>
          )}

          <form action={confermaImportazione} className="space-y-3">
            <input type="hidden" name="soci_json" value={jsonRighe} />

            <button
              type="submit"
              disabled={caricamento || erroriCSV.length > 0 || righe.length === 0}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {caricamento ? "Importazione in corso..." : "Conferma importazione"}
            </button>

            <p className="text-sm text-muted-foreground">
              L'importazione crea account reali e invia email. Prima di
              confermare, assicurati di aver selezionato il file corretto.
            </p>
          </form>
        </section>
      )}

      {risultato && (
        <section className="rounded-xl border p-4" aria-live="polite">
          <h2 className="text-lg font-semibold">
            {risultato.success
              ? "Importazione completata"
              : "Importazione con problemi"}
          </h2>

          {risultato.error && (
            <p className="mt-2 text-sm">{risultato.error}</p>
          )}

          {risultato.create !== undefined && (
            <p className="mt-2">
              Soci creati correttamente: <strong>{risultato.create}</strong>
            </p>
          )}

          {risultato.errori !== undefined && (
            <p className="mt-1">
              Righe non importate: <strong>{risultato.errori}</strong>
            </p>
          )}

          {risultato.dettagli && risultato.dettagli.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {risultato.dettagli.map((dettaglio, indice) => (
                <li key={`${indice}-${dettaglio}`}>{dettaglio}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}