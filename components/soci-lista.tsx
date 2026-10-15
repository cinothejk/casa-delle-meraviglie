
"use client";

import { useMemo, useState } from "react";
import { modificaSocio } from "@/app/protected/soci/actions";

type Socio = {
  id: string;
  nome: string | null;
  cognome: string | null;
  email: string | null;
  username: string | null;
  ruolo: string | null;
  attivo: boolean | null;
  famiglia_id: string | null;
  famiglie: { id: string; nome: string } | { id: string; nome: string }[] | null;
};

type Famiglia = {
  id: string;
  nome: string;
};

export default function SociLista({
  soci,
  famiglie,
}: {
  soci: Socio[];
  famiglie: Famiglia[];
}) {
  const [ricerca, setRicerca] = useState("");
  const [socioSelezionato, setSocioSelezionato] = useState<Socio | null>(null);
  const [salvataggio, setSalvataggio] = useState(false);

  const sociFiltrati = useMemo(() => {
    const termine = ricerca.trim().toLowerCase();

    if (!termine) return soci;

    return soci.filter((socio) =>
      [
        socio.nome,
        socio.cognome,
        socio.username,
        socio.email,
      ].some((valore) => valore?.toLowerCase().includes(termine))
    );
  }, [soci, ricerca]);

  function nomeCompleto(socio: Socio) {
    return `${socio.nome ?? ""} ${socio.cognome ?? ""}`.trim() || "Socio senza nome";
  }

  function famigliaDel(socio: Socio) {
    return Array.isArray(socio.famiglie)
      ? socio.famiglie[0]
      : socio.famiglie;
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <input
          type="search"
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          placeholder="Cerca per nome, cognome, username o email..."
          aria-label="Cerca soci"
          className="w-full rounded-xl border border-[#E8DCCF] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#9B8D80] focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/15"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {sociFiltrati.length} {sociFiltrati.length === 1 ? "socio" : "soci"}
      </p>

      {sociFiltrati.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E8DCCF] bg-white p-8 text-center">
          <p className="font-medium text-[#59483D]">
            {ricerca ? "Nessun socio trovato" : "Nessun socio presente"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {ricerca
              ? "Prova a modificare la ricerca."
              : "I soci registrati compariranno qui."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sociFiltrati.map((socio, indice) => {
            const famiglia = famigliaDel(socio);
            const sfondi = [
              "bg-[#F5D1BC]",
              "bg-[#DCE6D7]",
              "bg-[#F4E7B8]",
              "bg-[#E7DDF1]",
            ];

            return (
              <button
                key={socio.id}
                type="button"
                onClick={() => setSocioSelezionato(socio)}
                className="group rounded-2xl border border-[#E8DCCF] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#C96F52]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96F52]"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-[#59483D] ${sfondi[indice % sfondi.length]}`}
                  >
                    {`${socio.nome?.[0] ?? ""}${socio.cognome?.[0] ?? ""}`.toUpperCase() || "?"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-[#59483D]">
                      {nomeCompleto(socio)}
                    </h2>
                    <p className="mt-1 truncate text-sm text-[#8B7B6D]">
                      {socio.username ? `@${socio.username}` : "Username non impostato"}
                    </p>
                    <p className="mt-1 truncate text-sm text-[#8B7B6D]">
                      {famiglia?.nome ?? "Nessuna famiglia"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      socio.attivo
                        ? "bg-[#E2EBDD] text-[#486044]"
                        : "bg-[#F5E4DE] text-[#9A5140]"
                    }`}
                  >
                    {socio.attivo ? "Attivo" : "Non attivo"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#F0E8DF] pt-3 text-xs text-[#8B7B6D]">
                  <span className="truncate">{socio.email ?? "Email non disponibile"}</span>
                  <span className="ml-2 shrink-0 font-medium text-[#C96F52]">
                    Modifica →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {socioSelezionato && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !salvataggio) {
              setSocioSelezionato(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modifica-socio-titolo"
            className="my-auto w-full max-w-2xl rounded-3xl bg-[#FFF8EF] p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C96F52]">
                  Anagrafica
                </p>
                <h2
                  id="modifica-socio-titolo"
                  className="mt-1 text-xl font-semibold text-[#59483D]"
                >
                  Modifica socio
                </h2>
                <p className="mt-1 text-sm text-[#8B7B6D]">
                  Aggiorna i dati e salva le modifiche.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSocioSelezionato(null)}
                disabled={salvataggio}
                aria-label="Chiudi"
                className="rounded-full px-3 py-2 text-xl text-[#8B7B6D] hover:bg-[#F5D1BC]/50 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form
              action={async (formData) => {
                setSalvataggio(true);
                try {
                  await modificaSocio(formData);
                  setSocioSelezionato(null);
                } catch (errore) {
                  window.alert(
                    errore instanceof Error
                      ? errore.message
                      : "Errore durante il salvataggio."
                  );
                } finally {
                  setSalvataggio(false);
                }
              }}
              className="space-y-5"
            >
              <input
                type="hidden"
                name="socio_id"
                value={socioSelezionato.id}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="socio-nome" className="mb-1.5 block text-sm font-medium text-[#59483D]">
                    Nome
                  </label>
                  <input
                    id="socio-nome"
                    name="nome"
                    defaultValue={socioSelezionato.nome ?? ""}
                    required
                    className="w-full rounded-xl border border-[#E8DCCF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C96F52]"
                  />
                </div>

                <div>
                  <label htmlFor="socio-cognome" className="mb-1.5 block text-sm font-medium text-[#59483D]">
                    Cognome
                  </label>
                  <input
                    id="socio-cognome"
                    name="cognome"
                    defaultValue={socioSelezionato.cognome ?? ""}
                    required
                    className="w-full rounded-xl border border-[#E8DCCF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C96F52]"
                  />
                </div>

                <div>
                  <label htmlFor="socio-username" className="mb-1.5 block text-sm font-medium text-[#59483D]">
                    Username
                  </label>
                  <input
                    id="socio-username"
                    name="username"
                    defaultValue={socioSelezionato.username ?? ""}
                    className="w-full rounded-xl border border-[#E8DCCF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C96F52]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#59483D]">
                    Email
                  </label>
                  <div className="rounded-xl border border-[#E8DCCF] bg-[#F7EFE5] px-3 py-2.5 text-sm text-[#8B7B6D]">
                    {socioSelezionato.email ?? "—"}
                  </div>
                  <p className="mt-1 text-xs text-[#8B7B6D]">
                    L’email non viene modificata da questa pagina.
                  </p>
                </div>

                <div>
                  <label htmlFor="socio-famiglia" className="mb-1.5 block text-sm font-medium text-[#59483D]">
                    Famiglia
                  </label>
                  <select
                    id="socio-famiglia"
                    name="famiglia_id"
                    defaultValue={socioSelezionato.famiglia_id ?? ""}
                    className="w-full rounded-xl border border-[#E8DCCF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C96F52]"
                  >
                    <option value="">Nessuna famiglia</option>
                    {famiglie.map((famiglia) => (
                      <option key={famiglia.id} value={famiglia.id}>
                        {famiglia.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="socio-attivo" className="mb-1.5 block text-sm font-medium text-[#59483D]">
                    Stato
                  </label>
                  <select
                    id="socio-attivo"
                    name="attivo"
                    defaultValue={socioSelezionato.attivo ? "true" : "false"}
                    className="w-full rounded-xl border border-[#E8DCCF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C96F52]"
                  >
                    <option value="true">Attivo</option>
                    <option value="false">Non attivo</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl bg-[#F5D1BC]/35 px-4 py-3 text-sm text-[#70584A]">
                Ruolo attuale:{" "}
                <span className="font-semibold">
                  {socioSelezionato.ruolo ?? "Non specificato"}
                </span>
                <p className="mt-1 text-xs">
                  Il ruolo non viene modificato da questa schermata.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#E8DCCF] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={salvataggio}
                  onClick={() => setSocioSelezionato(null)}
                  className="rounded-xl border border-[#E8DCCF] bg-white px-5 py-2.5 text-sm font-medium text-[#59483D] hover:bg-[#F7EFE5] disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={salvataggio}
                  className="rounded-xl bg-[#C96F52] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B85F43] disabled:cursor-wait disabled:opacity-60"
                >
                  {salvataggio ? "Salvataggio..." : "Salva modifiche"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
