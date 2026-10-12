export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  creaAttivita,
  modificaAttivita,
  aggiornaStatoPartecipazione,
  candidatiAttivita,
  iniziaPartecipazione,
  aggiornaLavoroPartecipazione,
  chiudiPartecipazione,
  approvaPartecipazione,
  rifiutaPartecipazione,
} from "./actions";

export default async function AttivitaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, cognome, username, ruolo")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/protected");
  }

  const puoGestire =
    profile.ruolo === "superadmin" ||
    profile.ruolo === "direzione";

  // Carica i cerchi attivi
  const { data: cerchi } = await supabase
    .from("cerchi")
    .select("id, nome")
    .eq("attivo", true)
    .order("nome");

  // Carica le attività
  const { data: attivita, error: attivitaError } =
    await supabase
      .from("attivita")
      .select(`
        id,
        titolo,
        descrizione,
        luogo,
        stato,
        cerchio_id,
        created_at,
        cerchi (
          id,
          nome
        )
      `)
      .order("created_at", {
        ascending: false,
      });

  if (attivitaError) {
    console.error(
      "Errore caricamento attività:",
      attivitaError
    );
  }

  // Recupera gli ID delle attività
  const attivitaIds = (attivita ?? []).map(
    (item) => item.id
  );

  // Carica le partecipazioni
  let partecipazioni: any[] = [];

  if (attivitaIds.length > 0) {
    const {
      data,
      error: partecipazioniError,
    } = await supabase
      .from("partecipazioni")
      .select(`
        id,
        attivita_id,
        socio_id,
        stato,
        data_lavoro,
        data_completamento,
        ore_effettive_mezzore,
        note_socio,
        profiles!partecipazioni_socio_id_fkey (
            id,
            nome,
            cognome,
            email
        )
      `)
      .in("attivita_id", attivitaIds);

    if (partecipazioniError) {
      console.error(
        "Errore caricamento partecipazioni:",
        partecipazioniError
      );
    }

    partecipazioni = data ?? [];
  }

  // Raggruppa le partecipazioni per attività
  const partecipazioniPerAttivita = new Map<
    string,
    any[]
  >();

  for (const partecipazione of partecipazioni) {
    const lista =
      partecipazioniPerAttivita.get(
        partecipazione.attivita_id
      ) ?? [];

    lista.push(partecipazione);

    partecipazioniPerAttivita.set(
      partecipazione.attivita_id,
      lista
    );
  }

  const miePartecipazioni = new Map(
    (partecipazioni ?? [])
        .filter((partecipazione) => partecipazione.socio_id === user.id)
        .map((partecipazione) => [
        partecipazione.attivita_id,
        partecipazione,
        ])
    );

  return (
    <div className="space-y-8">
      {/* TITOLO */}
      <div>
        <h1 className="text-2xl font-semibold">
          Attività
        </h1>

        <p className="text-muted-foreground">
          Gestione delle attività della scuola e
          delle partecipazioni dei soci.
        </p>
      </div>

      {/* PARTE SOCIO */}
        {!puoGestire && (
        <section className="space-y-6">
            <div>
            <h2 className="text-2xl font-semibold">
                Attività disponibili
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
                Qui trovi le attività pubblicate a cui puoi candidarti.
            </p>
            </div>

            <div className="grid gap-4">
            {attivita
                ?.filter((attivitaItem) => attivitaItem.stato === "pubblicata")
                .map((attivitaItem) => (
                <div
                    key={attivitaItem.id}
                    className="rounded-lg border p-5"
                >
                    <div className="flex flex-col gap-3">
                    <div>
                        <h3 className="text-lg font-semibold">
                        {attivitaItem.titolo}
                        </h3>

                        {attivitaItem.cerchi && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            Cerchio: {attivitaItem.cerchi.nome}
                        </p>
                        )}
                    </div>

                    {attivitaItem.descrizione && (
                        <p className="text-sm">
                        {attivitaItem.descrizione}
                        </p>
                    )}

                    {attivitaItem.luogo && (
                        <p className="text-sm text-muted-foreground">
                        Luogo: {attivitaItem.luogo}
                        </p>
                    )}

                    {(() => {
                        const miaPartecipazione =
                            miePartecipazioni.get(attivitaItem.id);

                        if (miaPartecipazione?.stato === "candidato") {
                            return (
                                <div className="flex flex-col gap-2">
                                <div className="rounded-md border px-4 py-2 text-sm text-muted-foreground">
                                    Candidato ✓
                                </div>

                                <form action={iniziaPartecipazione}>
                                    <input
                                    type="hidden"
                                    name="partecipazione_id"
                                    value={miaPartecipazione.id}
                                    />

                                    <button
                                    type="submit"
                                    className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
                                    >
                                    Inizia attività
                                    </button>
                                </form>
                                </div>
                            );
                        }

                        if (miaPartecipazione?.stato === "in_corso") {
                            const oreInserite =
                                miaPartecipazione.ore_effettive_mezzore;

                            return (
                                <div className="space-y-4 rounded-md border p-4">
                                <div className="text-sm font-medium">
                                    Attività in corso
                                </div>

                                <form
                                    action={aggiornaLavoroPartecipazione}
                                    className="space-y-4"
                                >
                                    <input
                                    type="hidden"
                                    name="partecipazione_id"
                                    value={miaPartecipazione.id}
                                    />

                                    <div className="space-y-2">
                                    <label
                                        htmlFor={`data-lavoro-${attivitaItem.id}`}
                                        className="text-sm font-medium"
                                    >
                                        Data del lavoro
                                    </label>

                                    <input
                                        id={`data-lavoro-${attivitaItem.id}`}
                                        name="data_lavoro"
                                        type="date"
                                        defaultValue={
                                        miaPartecipazione.data_lavoro ?? ""
                                        }
                                        required
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                    />
                                    </div>

                                    <div className="space-y-2">
                                    <label
                                        htmlFor={`ore-${attivitaItem.id}`}
                                        className="text-sm font-medium"
                                    >
                                        Ore effettuate
                                    </label>

                                    <select
                                        id={`ore-${attivitaItem.id}`}
                                        name="ore"
                                        defaultValue={oreInserite ?? ""}
                                        required
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                    >
                                        <option value="">
                                        Seleziona le ore
                                        </option>
                                        <option value="1">0,5 ore</option>
                                        <option value="2">1 ora</option>
                                        <option value="3">1,5 ore</option>
                                        <option value="4">2 ore</option>
                                        <option value="5">2,5 ore</option>
                                        <option value="6">3 ore</option>
                                        <option value="7">3,5 ore</option>
                                        <option value="8">4 ore</option>
                                        <option value="9">4,5 ore</option>
                                        <option value="10">5 ore</option>
                                        <option value="11">5,5 ore</option>
                                        <option value="12">6 ore</option>
                                        <option value="13">6,5 ore</option>
                                        <option value="14">7 ore</option>
                                    </select>
                                    </div>

                                    <div className="space-y-2">
                                    <label
                                        htmlFor={`note-${attivitaItem.id}`}
                                        className="text-sm font-medium"
                                    >
                                        Note
                                    </label>

                                    <textarea
                                        id={`note-${attivitaItem.id}`}
                                        name="note_socio"
                                        defaultValue={
                                        miaPartecipazione.note_socio ?? ""
                                        }
                                        rows={3}
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                        placeholder="Inserisci eventuali note sul lavoro svolto..."
                                    />
                                    </div>

                                    <button
                                    type="submit"
                                    className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
                                    >
                                    Salva lavoro
                                    </button>
                                </form>

                                <form
                                    action={chiudiPartecipazione}
                                    className="pt-2"
                                    >
                                    <input
                                        type="hidden"
                                        name="partecipazione_id"
                                        value={miaPartecipazione.id}
                                    />

                                    <button
                                        type="submit"
                                        className="rounded-md border px-4 py-2 text-sm"
                                    >
                                        Chiudi partecipazione
                                    </button>
                                    </form>
                                </div>
                            );
                        }

                        if (miaPartecipazione?.stato === "completata") {
                            return (
                                <div className="rounded-md border px-4 py-2 text-sm">
                                Partecipazione completata — in attesa di approvazione
                                </div>
                            );
                            }

                            if (
                            miaPartecipazione?.stato === "approvata"
                            ) {
                            return (
                                <div className="rounded-md border px-4 py-2 text-sm">
                                Attività approvata ✓
                                </div>
                            );
                            }

                            if (
                            miaPartecipazione?.stato === "rifiutata"
                            ) {
                            return (
                                <div className="rounded-md border px-4 py-2 text-sm">
                                Partecipazione rifiutata
                                </div>
                            );
                            }

                        return (
                            <form action={candidatiAttivita}>
                            <input
                                type="hidden"
                                name="attivita_id"
                                value={attivitaItem.id}
                            />

                            <button
                                type="submit"
                                className="rounded-md border px-4 py-2 text-sm"
                            >
                                Candidati
                            </button>
                            </form>
                        );
                        })()}
                    </div>
                </div>
                ))}
            </div>

            {(!attivita ||
            attivita.filter(
                (attivitaItem) => attivitaItem.stato === "pubblicata"
            ).length === 0) && (
            <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                Al momento non ci sono attività disponibili.
                </p>
            </div>
            )}
        </section>
        )}

      {/* NUOVA ATTIVITÀ */}
      {puoGestire && (
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Nuova attività
          </h2>

          <form
            action={creaAttivita}
            className="grid gap-4 md:grid-cols-2"
          >
            {/* Titolo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Titolo
              </label>

              <input
                name="titolo"
                required
                className="w-full rounded-md border bg-background px-3 py-2"
                placeholder="Es. Sistemazione giardino"
              />
            </div>

            {/* Cerchio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Cerchio
              </label>

              <select
                name="cerchio_id"
                required
                className="w-full rounded-md border bg-background px-3 py-2"
              >
                <option value="">
                  Seleziona un cerchio
                </option>

                {(cerchi ?? []).map((cerchio) => (
                  <option
                    key={cerchio.id}
                    value={cerchio.id}
                  >
                    {cerchio.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Descrizione */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">
                Descrizione
              </label>

              <textarea
                name="descrizione"
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2"
                placeholder="Descrivi cosa bisogna fare..."
              />
            </div>

            {/* Luogo */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">
                Luogo
              </label>

              <input
                name="luogo"
                className="w-full rounded-md border bg-background px-3 py-2"
                placeholder="Es. Giardino della scuola"
              />
            </div>

            {/* Pulsante */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
              >
                Crea attività
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ELENCO ATTIVITÀ */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Elenco attività
        </h2>

        <div className="space-y-4">
          {(attivita ?? []).map((attivitaItem) => {
            const partecipazioniAttivita =
              partecipazioniPerAttivita.get(
                attivitaItem.id
              ) ?? [];

            const cerchio = Array.isArray(
              attivitaItem.cerchi
            )
              ? attivitaItem.cerchi[0]
              : attivitaItem.cerchi;

            return (
              <div
                key={attivitaItem.id}
                className="rounded-xl border bg-card p-5"
              >
                {/* TESTATA ATTIVITÀ */}
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {attivitaItem.titolo}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      Cerchio:{" "}
                      {cerchio?.nome ?? "—"}
                    </p>
                  </div>

                  <span className="rounded-full border px-3 py-1 text-sm">
                    {attivitaItem.stato}
                  </span>
                </div>

                {/* DESCRIZIONE */}
                {attivitaItem.descrizione && (
                  <p className="mt-3 whitespace-pre-wrap text-sm">
                    {attivitaItem.descrizione}
                  </p>
                )}

                {/* LUOGO */}
                <div className="mt-4 text-sm">
                  <strong>Luogo:</strong>{" "}
                  {attivitaItem.luogo ?? "—"}
                </div>

                {/* PARTECIPANTI */}
                {puoGestire && (
                  <div className="mt-6 border-t pt-5">
                    <h4 className="mb-3 font-semibold">
                      Partecipanti
                    </h4>

                    {partecipazioniAttivita.length ===
                    0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nessun socio candidato o
                        partecipante.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {partecipazioniAttivita.map(
                          (partecipazione) => {
                            const socio =
                              Array.isArray(
                                partecipazione.profiles
                              )
                                ? partecipazione
                                    .profiles[0]
                                : partecipazione.profiles;

                            return (
                              <div
                                key={
                                  partecipazione.id
                                }
                                className="rounded-lg border p-4"
                              >
                                {/* SOCIO */}
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {socio?.nome}{" "}
                                      {socio?.cognome}
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                      {socio?.email}
                                    </p>
                                  </div>

                                  <span className="rounded-full border px-3 py-1 text-sm">
                                    {
                                      partecipazione.stato
                                    }
                                  </span>
                                </div>

                                {/* DATI PARTECIPAZIONE */}
                                <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                                  <div>
                                    <strong>
                                      Data lavoro:
                                    </strong>{" "}
                                    {partecipazione.data_lavoro
                                      ? new Date(
                                          partecipazione.data_lavoro
                                        ).toLocaleDateString(
                                          "it-IT"
                                        )
                                      : "—"}
                                  </div>

                                  <div>
                                    <strong>
                                      Ore:
                                    </strong>{" "}
                                    {partecipazione.ore_effettive_mezzore !==
                                    null
                                      ? `${
                                          partecipazione.ore_effettive_mezzore /
                                          2
                                        } h`
                                      : "—"}
                                  </div>

                                  <div>
                                    <strong>
                                      Completata:
                                    </strong>{" "}
                                    {partecipazione.data_completamento
                                      ? new Date(
                                          partecipazione.data_completamento
                                        ).toLocaleDateString(
                                          "it-IT"
                                        )
                                      : "—"}
                                  </div>
                                </div>

                                {/* NOTE */}
                                {partecipazione.note_socio && (
                                  <div className="mt-3 rounded-md bg-muted p-3 text-sm">
                                    <strong>
                                      Note del socio:
                                    </strong>

                                    <p className="mt-1 whitespace-pre-wrap">
                                      {
                                        partecipazione.note_socio
                                      }
                                    </p>
                                  </div>
                                )}

                                {/* AZIONI */}
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {/* CANDIDATO → IN CORSO */}
                                  {partecipazione.stato ===
                                    "candidato" && (
                                    <form
                                      action={
                                        aggiornaStatoPartecipazione
                                      }
                                    >
                                      <input
                                        type="hidden"
                                        name="partecipazione_id"
                                        value={
                                          partecipazione.id
                                        }
                                      />

                                      <input
                                        type="hidden"
                                        name="stato"
                                        value="in_corso"
                                      />

                                      <button
                                        type="submit"
                                        className="rounded-md border px-3 py-2 text-sm"
                                      >
                                        Inizia partecipazione
                                      </button>
                                    </form>
                                  )}

                                  {/* COMPLETATA → APPROVA / RIFIUTA */}
                                  {partecipazione.stato === "completata" && (
                                        <div className="mt-4 flex flex-col gap-3 rounded-md border p-4">
                                            <div className="text-sm font-medium">
                                            Partecipazione da verificare
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                            <form action={approvaPartecipazione}>
                                                <input
                                                type="hidden"
                                                name="partecipazione_id"
                                                value={partecipazione.id}
                                                />

                                                <button
                                                type="submit"
                                                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
                                                >
                                                Approva
                                                </button>
                                            </form>

                                            <form
                                                action={rifiutaPartecipazione}
                                                className="flex flex-col gap-2"
                                            >
                                                <input
                                                type="hidden"
                                                name="partecipazione_id"
                                                value={partecipazione.id}
                                                />

                                                <input
                                                type="text"
                                                name="note_direzione"
                                                placeholder="Motivo del rifiuto"
                                                className="rounded-md border px-3 py-2 text-sm"
                                                />

                                                <button
                                                type="submit"
                                                className="rounded-md border px-4 py-2 text-sm"
                                                >
                                                Rifiuta
                                                </button>
                                            </form>
                                            </div>
                                        </div>
                                        )}

                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* MODIFICA ATTIVITÀ */}
                {puoGestire && (
                  <details className="mt-5 border-t pt-5">
                    <summary className="cursor-pointer font-medium">
                      Modifica attività
                    </summary>

                    <form
                      action={modificaAttivita}
                      className="mt-4 grid gap-4 md:grid-cols-2"
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={attivitaItem.id}
                      />

                      {/* Titolo */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Titolo
                        </label>

                        <input
                          name="titolo"
                          defaultValue={
                            attivitaItem.titolo
                          }
                          required
                          className="w-full rounded-md border bg-background px-3 py-2"
                        />
                      </div>

                      {/* Cerchio */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Cerchio
                        </label>

                        <select
                          name="cerchio_id"
                          defaultValue={
                            attivitaItem.cerchio_id
                          }
                          required
                          className="w-full rounded-md border bg-background px-3 py-2"
                        >
                          {(cerchi ?? []).map(
                            (cerchio) => (
                              <option
                                key={cerchio.id}
                                value={cerchio.id}
                              >
                                {cerchio.nome}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      {/* Descrizione */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">
                          Descrizione
                        </label>

                        <textarea
                          name="descrizione"
                          rows={4}
                          defaultValue={
                            attivitaItem.descrizione ??
                            ""
                          }
                          className="w-full rounded-md border bg-background px-3 py-2"
                        />
                      </div>

                      {/* Luogo */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Luogo
                        </label>

                        <input
                          name="luogo"
                          defaultValue={
                            attivitaItem.luogo ?? ""
                          }
                          className="w-full rounded-md border bg-background px-3 py-2"
                        />
                      </div>

                      {/* Stato */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Stato
                        </label>

                        <select
                          name="stato"
                          defaultValue={
                            attivitaItem.stato
                          }
                          className="w-full rounded-md border bg-background px-3 py-2"
                        >
                          <option value="bozza">
                            Bozza
                          </option>

                          <option value="pubblicata">
                            Pubblicata
                          </option>

                          <option value="chiusa">
                            Chiusa
                          </option>

                          <option value="annullata">
                            Annullata
                          </option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <button
                          type="submit"
                          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
                        >
                          Salva modifiche
                        </button>
                      </div>
                    </form>
                  </details>
                )}
              </div>
            );
          })}

          {/* NESSUNA ATTIVITÀ */}
          {(!attivita ||
            attivita.length === 0) && (
            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              Nessuna attività presente.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}