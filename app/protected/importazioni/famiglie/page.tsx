"use client";

import { useState } from "react";
import Papa from "papaparse";
import { importaFamiglie } from "./actions";

type RigaCSV = {
  nome?: string;
  note?: string;
  attiva?: string;
};

type FamigliaCSV = {
  nome: string;
  note: string | null;
  attiva: boolean;
  riga: number;
  errore: string | null;
};

export default function ImportazioneFamigliePage() {
  const [righe, setRighe] = useState<FamigliaCSV[]>([]);
  const [erroreFile, setErroreFile] = useState("");
  const [nomeFile, setNomeFile] = useState("");
  const [esito, setEsito] = useState<{
    success: boolean;
    inserite?: number;
    duplicate?: number;
    non_valide?: number;
    error?: string;
    } | null>(null);

  const [inviando, setInviando] = useState(false);


  async function inviaImportazione(formData: FormData) {
    setInviando(true);
    setEsito(null);

    try {
        const risultato = await importaFamiglie(formData);
        setEsito(risultato);
    } catch {
        setEsito({
        success: false,
        error: "Errore imprevisto durante l'importazione.",
        });
    } finally {
        setInviando(false);
    }
}

  function leggiFile(file?: File) {
    setRighe([]);
    setErroreFile("");
    setNomeFile("");

    if (!file) return;

    setNomeFile(file.name);

    Papa.parse<RigaCSV>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) =>
        header.trim().toLowerCase().replace(/^\uFEFF/, ""),
      complete: (risultato) => {
        const intestazioni = risultato.meta.fields ?? [];

        if (!intestazioni.includes("nome")) {
          setErroreFile(
            'Il CSV deve contenere la colonna obbligatoria "nome".'
          );
          return;
        }

        const nomiVisti = new Set<string>();

        const famiglie = risultato.data.map((riga, indice) => {
          const nome = String(riga.nome ?? "").trim();
          const note = String(riga.note ?? "").trim();
          const attivaRaw = String(riga.attiva ?? "")
            .trim()
            .toLowerCase();

          let errore: string | null = null;
          let attiva = true;

          if (!nome) {
            errore = "Nome obbligatorio";
          } else if (nomiVisti.has(nome.toLowerCase())) {
            errore = "Nome duplicato nel file";
          } else {
            nomiVisti.add(nome.toLowerCase());
          }

          if (
            attivaRaw &&
            !["true", "false", "si", "sì", "no", "1", "0"].includes(
              attivaRaw
            )
          ) {
            errore = errore
              ? `${errore}; valore attiva non valido`
              : "Valore attiva non valido";
          } else if (attivaRaw) {
            attiva = ["true", "si", "sì", "1"].includes(attivaRaw);
          }

          return {
            nome,
            note: note || null,
            attiva,
            riga: indice + 2,
            errore,
          };
        });

        setRighe(famiglie);

        if (risultato.errors.length > 0) {
          setErroreFile(
            `Il CSV contiene ${risultato.errors.length} problema/i di lettura. Controlla il delimitatore e le virgolette.`
          );
        }
      },
      error: () => {
        setErroreFile("Impossibile leggere il file CSV.");
      },
    });
  }

  const valide = righe.filter((riga) => !riga.errore);
  const nonValide = righe.filter((riga) => riga.errore);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Importazione famiglie
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Carica un CSV, controlla l&apos;anteprima e verifica le
          righe prima dell&apos;importazione.
        </p>
      </div>

      <section className="rounded-xl border p-5">
        <h2 className="text-lg font-semibold">
          1. Seleziona il file CSV
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Colonne supportate: nome, note, attiva. Il codice
          famiglia viene generato automaticamente.
        </p>

        <div className="mt-4">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) =>
              leggiFile(event.target.files?.[0])
            }
            className="block w-full text-sm"
          />
        </div>

        {nomeFile && (
          <p className="mt-3 text-sm">
            File selezionato: <strong>{nomeFile}</strong>
          </p>
        )}

        {erroreFile && (
          <p className="mt-3 rounded-lg border border-red-300 p-3 text-sm text-red-700">
            {erroreFile}
          </p>
        )}
      </section>

      {righe.length > 0 && (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4">
              <p className="text-sm text-gray-500">
                Righe lette
              </p>
              <p className="mt-1 text-2xl font-bold">
                {righe.length}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-gray-500">
                Righe valide
              </p>
              <p className="mt-1 text-2xl font-bold">
                {valide.length}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-gray-500">
                Da correggere
              </p>
              <p className="mt-1 text-2xl font-bold">
                {nonValide.length}
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border">
            <div className="border-b p-5">
              <h2 className="text-lg font-semibold">
                2. Anteprima
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Nessun dato è stato ancora salvato nel database.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="p-3">Riga</th>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Note</th>
                    <th className="p-3">Attiva</th>
                    <th className="p-3">Validazione</th>
                  </tr>
                </thead>

                <tbody>
                  {righe.map((riga) => (
                    <tr
                      key={riga.riga}
                      className="border-t"
                    >
                      <td className="p-3">{riga.riga}</td>
                      <td className="p-3">{riga.nome || "—"}</td>
                      <td className="p-3">{riga.note || "—"}</td>
                      <td className="p-3">
                        {riga.attiva ? "Sì" : "No"}
                      </td>
                      <td className="p-3">
                        {riga.errore ? (
                          <span className="text-red-600">
                            {riga.errore}
                          </span>
                        ) : (
                          <span className="text-green-700">
                            Valida
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        <section className="rounded-xl border p-5">
  <h2 className="text-lg font-semibold">
    3. Conferma importazione
  </h2>

  <p className="mt-2 text-sm text-gray-500">
    Le righe valide saranno importate. Quelle non valide
    e i nomi già presenti saranno conteggiati senza
    sovrascrivere le famiglie esistenti.
  </p>

  <form action={inviaImportazione} className="mt-4">
    <input
      type="hidden"
      name="famiglie_json"
      value={JSON.stringify(
        righe.map((riga) => ({
          nome: riga.nome,
          note: riga.note,
          attiva: riga.errore?.includes("valore attiva non valido")
            ? "valore_non_valido"
            : riga.attiva
              ? "true"
              : "false",
        }))
      )}
    />

    <button
      type="submit"
      disabled={inviando || !!erroreFile}
      className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
    >
      {inviando ? "Importazione in corso..." : "Conferma importazione"}
    </button>
  </form>

  {esito && (
    <div className="mt-4 rounded-lg border p-4">
      {esito.success ? (
        <>
          <h3 className="font-semibold">
            Importazione completata
          </h3>

          <ul className="mt-2 space-y-1 text-sm">
            <li>Famiglie inserite: {esito.inserite}</li>
            <li>Famiglie duplicate ignorate: {esito.duplicate}</li>
            <li>Righe non valide: {esito.non_valide}</li>
          </ul>
        </>
      ) : (
        <p className="text-sm text-red-600">
          {esito.error}
        </p>
      )}
    </div>
  )}
</section>

        </>
      )}
    </div>
  );
}