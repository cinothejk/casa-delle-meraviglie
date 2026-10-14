
export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  modificaAttivita,
  aggiornaStatoPartecipazione,
  candidatiAttivita,
  iniziaPartecipazione,
  approvaPartecipazione,
  rifiutaPartecipazione,
  cambiaStatoAttivitaRapido
} from "./actions";

import ActivityCreateModal from "./ActivityCreateModal";
import ActivityDetailModal from "./ActivityDetailModal";
import PartecipazioneInCorsoForm from "./PartecipazioneInCorsoForm";

/**
 * Supabase può restituire una relazione come oggetto oppure come array.
 * Questa funzione gestisce entrambi i casi evitando errori TypeScript.
 */
function getNomeCerchio(value: unknown): string | null {
  const relazione = Array.isArray(value) ? value[0] : value;

  if (relazione === null || typeof relazione !== "object") {
    return null;
  }

  const nome = (relazione as { nome?: unknown }).nome;

  return typeof nome === "string" ? nome : null;
}

function etichettaStato(stato: string): string {
  const etichette: Record<string, string> = {
    bozza: "Bozza",
    pubblicata: "Pubblicata",
    chiusa: "Chiusa",
    annullata: "Annullata",
    candidato: "Candidato",
    in_corso: "In corso",
    completata: "Da verificare",
    approvata: "Approvata",
    rifiutata: "Rifiutata",
  };

  return etichette[stato] ?? stato;
}

function stileStato(stato: string): string {
  const stili: Record<string, string> = {
    bozza: "border-stone-200 bg-stone-100 text-stone-700",
    pubblicata: "border-emerald-200 bg-emerald-50 text-emerald-800",
    chiusa: "border-slate-200 bg-slate-100 text-slate-700",
    annullata: "border-rose-200 bg-rose-50 text-rose-800",
    candidato: "border-amber-200 bg-amber-50 text-amber-800",
    in_corso: "border-sky-200 bg-sky-50 text-sky-800",
    completata: "border-orange-200 bg-orange-50 text-orange-800",
    approvata: "border-emerald-200 bg-emerald-50 text-emerald-800",
    rifiutata: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return stili[stato] ?? "border-stone-200 bg-stone-50 text-stone-700";
}

const inputClass =
  "w-full min-w-0 rounded-xl border border-[#E8DCCF] bg-white px-3.5 py-3 text-sm text-[#44382F] outline-none transition placeholder:text-[#A79A8D] focus:border-[#C96F52] focus:ring-2 focus:ring-[#C96F52]/15";

const labelClass = "block text-sm font-medium text-[#594A3F]";

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#C96F52] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B65E43] focus:outline-none focus:ring-2 focus:ring-[#C96F52]/30 focus:ring-offset-2";

const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E5D5C7] bg-white px-4 py-2.5 text-sm font-semibold text-[#594A3F] transition hover:border-[#C96F52]/50 hover:bg-[#FFF8EF] focus:outline-none focus:ring-2 focus:ring-[#C96F52]/20";

type PaginaAttivitaProps = {
  searchParams: Promise<{
  stato?: string;
  pagina?: string;
}>;
};

export default async function AttivitaPage({
  searchParams,
}: PaginaAttivitaProps) {
  const parametri = await searchParams;

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

  // Carica i cerchi attivi.
  const { data: cerchi } = await supabase
    .from("cerchi")
    .select("id, nome")
    .eq("attivo", true)
    .order("nome");


// Carica le attività.
const { data: attivitaData, error: attivitaError } =
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

const attivita = (attivitaData ?? []).sort((a, b) => {
  // Le attività chiuse vanno in fondo.
  const aChiusa = a.stato === "chiusa";
  const bChiusa = b.stato === "chiusa";

  if (aChiusa !== bChiusa) {
    return aChiusa ? 1 : -1;
  }

  // A parità di stato, dalla più recente alla meno recente.
  return (
    new Date(b.created_at).getTime() -
    new Date(a.created_at).getTime()
  );
});



  if (attivitaError) {
    console.error("Errore caricamento attività:", attivitaError);
  }

  // Recupera gli ID delle attività.
  const attivitaIds = (attivita ?? []).map((item) => item.id);

  // Carica le partecipazioni.
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

  // Raggruppa le partecipazioni per attività.
  const partecipazioniPerAttivita = new Map<string, any[]>();

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
    partecipazioni
      .filter((partecipazione) => partecipazione.socio_id === user.id)
      .map((partecipazione) => [
        partecipazione.attivita_id,
        partecipazione,
      ])
  );

  const attivitaPubblicate = (attivita ?? []).filter(
    (attivitaItem) => attivitaItem.stato === "pubblicata"
  );

  const statiFiltro = [
    "tutte",
    "bozza",
    "pubblicata",
    "chiusa",
    "annullata",
    ] as const;

    const statoRichiesto = parametri.stato ?? "tutte";

    const filtroStato = statiFiltro.includes(
    statoRichiesto as (typeof statiFiltro)[number]
    )
    ? statoRichiesto
    : "tutte";

    const attivitaFiltrate = (attivita ?? []).filter(
    (item) => filtroStato === "tutte" || item.stato === filtroStato
    );

    const ELEMENTI_PER_PAGINA = 10;

    const paginaRichiesta = Number(parametri.pagina ?? "1");

    const paginaCorrente =
    Number.isInteger(paginaRichiesta) && paginaRichiesta > 0
    ? paginaRichiesta
    : 1;

    const totalePagine = Math.max(
    1,
    Math.ceil(attivitaFiltrate.length / ELEMENTI_PER_PAGINA)
    );

    const paginaEffettiva = Math.min(paginaCorrente, totalePagine);

    const inizio = (paginaEffettiva - 1) * ELEMENTI_PER_PAGINA;

    const attivitaVisibili = attivitaFiltrate.slice(
    inizio,
    inizio + ELEMENTI_PER_PAGINA
    );

    const elencoDaMostrare = puoGestire
    ? attivitaVisibili
    : (attivita ?? []);



  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10 text-[#44382F]">
      
    {/* INTRODUZIONE */}
    <header className="relative overflow-hidden rounded-3xl border border-[#F0DFD0] bg-gradient-to-br from-[#FFF8EF] via-[#FFF4E9] to-[#F8E3D3] p-5 shadow-sm sm:p-7">
      <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/40" />
      <div className="absolute -bottom-12 right-24 h-24 w-24 rounded-full bg-[#E9C2A9]/30" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E8D1BE] bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#966044]">
            <span aria-hidden="true">✳</span>
            Casa delle Meraviglie
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#503C30] sm:text-4xl">
            Attività
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#766456]">
            {puoGestire
              ? "Organizza le attività, segui le partecipazioni e verifica il lavoro dei soci."
              : "Scopri le attività della scuola e registra il tuo contributo."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-sm text-[#705443]">
              {puoGestire
                ? `${(attivita ?? []).length} attività totali`
                : `${attivitaPubblicate.length} attività disponibili`}
            </span>

            {puoGestire && (
              <span className="rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-sm text-[#705443]">
                {
                  partecipazioni.filter(
                    (partecipazione) =>
                      partecipazione.stato === "completata"
                  ).length
                }{" "}
                da verificare
              </span>
            )}
          </div>
        </div>

        {puoGestire && (
          <div className="shrink-0 sm:pt-2">
            <ActivityCreateModal cerchi={cerchi ?? []} />
          </div>
        )}
      </div>
      </header>

      {/* AREA SOCIO */}
      {!puoGestire && (
        <section className="space-y-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5D1BC] text-lg">
                ✨
              </span>
              <div>
                <h2 className="text-xl font-bold text-[#503C30] sm:text-2xl">
                  Attività disponibili
                </h2>
                <p className="mt-1 text-sm leading-5 text-[#857568]">
                  Scegli come contribuire alla vita della scuola.
                </p>
              </div>
            </div>
          </div>

          {attivitaPubblicate.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E4D2C2] bg-[#FFFCF8] px-5 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8E7DA] text-2xl">
                🌱
              </div>
              <h3 className="mt-4 font-semibold text-[#59483B]">
                Nuove attività in arrivo
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#8A7A6C]">
                Al momento non ci sono attività disponibili. Torna a
                controllare più avanti.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {attivitaPubblicate.map((attivitaItem) => {
                const miaPartecipazione =
                  miePartecipazioni.get(attivitaItem.id);

                const nomeCerchio = getNomeCerchio(attivitaItem.cerchi);

                return (
                  <article
                    key={attivitaItem.id}
                    className="flex min-w-0 flex-col rounded-3xl border border-[#EDE1D6] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#DFC2AC] hover:shadow-md sm:p-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F9E8DB] text-xl">
                        🌿
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-lg font-bold leading-snug text-[#503C30]">
                          {attivitaItem.titolo}
                        </h3>

                        {nomeCerchio && (
                          <p className="mt-1 text-sm text-[#8A6A54]">
                            {nomeCerchio}
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${stileStato(attivitaItem.stato)}`}
                      >
                        Pubblicata
                      </span>
                    </div>

                    {attivitaItem.descrizione && (
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#6F6257]">
                        {attivitaItem.descrizione}
                      </p>
                    )}

                    {attivitaItem.luogo && (
                      <div className="mt-4 flex items-start gap-2 text-sm text-[#78695C]">
                        <span aria-hidden="true">📍</span>
                        <span className="min-w-0 break-words">
                          {attivitaItem.luogo}
                        </span>
                      </div>
                    )}

                    <div className="mt-5 border-t border-[#F0E7DF] pt-5">
                      {(() => {
                        if (miaPartecipazione?.stato === "candidato") {
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-medium text-amber-800">
                                <span aria-hidden="true">✓</span>
                                Ti sei candidato a questa attività.
                              </div>

                              <form action={iniziaPartecipazione}>
                                <input
                                  type="hidden"
                                  name="partecipazione_id"
                                  value={miaPartecipazione.id}
                                />
                                <button
                                  type="submit"
                                  className={primaryButtonClass}
                                >
                                  Inizia attività
                                  <span className="ml-2" aria-hidden="true">
                                    →
                                  </span>
                                </button>
                              </form>
                            </div>
                          );
                        }

                        if (miaPartecipazione?.stato === "in_corso") {
                          const oreInserite =
                            miaPartecipazione.ore_effettive_mezzore;

                          return (
                            <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 sm:p-5">
                              <div className="mb-4 flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100">
                                  ⏱️
                                </span>
                                <div>
                                  <h4 className="font-semibold text-sky-950">
                                    Attività in corso
                                  </h4>
                                  <p className="text-xs text-sky-800">
                                    Registra il lavoro che hai svolto.
                                  </p>
                                </div>
                              </div>

                              
                              <PartecipazioneInCorsoForm
                                partecipazioneId={miaPartecipazione.id}
                                attivitaId={attivitaItem.id}
                                dataLavoro={miaPartecipazione.data_lavoro ?? ""}
                                oreInserite={oreInserite ?? null}
                                noteSocio={miaPartecipazione.note_socio ?? ""}
                                labelClass={labelClass}
                                inputClass={inputClass}
                                primaryButtonClass={primaryButtonClass}
                                secondaryButtonClass={secondaryButtonClass}
                              />


                              
                            </div>
                          );
                        }

                        if (miaPartecipazione?.stato === "completata") {
                          return (
                            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3.5 text-sm text-orange-900">
                              <span aria-hidden="true">⌛</span>
                              <div>
                                <p className="font-semibold">
                                  Lavoro completato
                                </p>
                                <p className="mt-1 leading-5">
                                  La partecipazione è in attesa di approvazione
                                  da parte della direzione.
                                </p>
                              </div>
                            </div>
                          );
                        }

                        if (miaPartecipazione?.stato === "approvata") {
                          return (
                            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-900">
                              <span aria-hidden="true">✓</span>
                              <div>
                                <p className="font-semibold">
                                  Attività approvata
                                </p>
                                <p className="mt-1">
                                  La tua partecipazione è stata approvata.
                                </p>
                              </div>
                            </div>
                          );
                        }

                        if (miaPartecipazione?.stato === "rifiutata") {
                          return (
                            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-900">
                              <span aria-hidden="true">!</span>
                              <div>
                                <p className="font-semibold">
                                  Partecipazione rifiutata
                                </p>
                                <p className="mt-1">
                                  Per maggiori informazioni, contatta la
                                  direzione.
                                </p>
                              </div>
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
                              className={primaryButtonClass}
                            >
                              Candidati
                              <span className="ml-2" aria-hidden="true">
                                →
                              </span>
                            </button>
                          </form>
                        );
                      })()}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}


      {/* ELENCO ATTIVITÀ */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E5EBDD] text-lg">
            📋
          </span>
          <div>
            <h2 className="text-xl font-bold text-[#503C30] sm:text-2xl">
              {puoGestire ? "Elenco attività" : "Le tue attività"}
            </h2>
            <p className="mt-1 text-sm text-[#857568]">
              {puoGestire
                ? "Consulta le attività e gestisci le partecipazioni."
                : "Consulta lo stato delle attività della scuola."}
            </p>
          </div>
        </div>

        
          {/* FILTRO E CONTEGGIO: SOLO ADMIN E DIREZIONE */}
          {puoGestire && (
            <div className="flex flex-col gap-3 rounded-2xl border border-[#EDE1D6] bg-white p-3 sm:flex-row sm:items-end sm:justify-between sm:p-4">
              <form
                method="get"
                className="flex flex-col gap-2 sm:flex-row sm:items-end"
              >
                <div className="min-w-0 flex-1 sm:min-w-52">
                  <label
                    htmlFor="filtro-stato-attivita"
                    className="mb-1.5 block text-xs font-semibold text-[#78695C]"
                  >
                    Filtra per stato
                  </label>

                  <select
                    id="filtro-stato-attivita"
                    name="stato"
                    defaultValue={filtroStato}
                    className={inputClass}
                  >
                    <option value="tutte">Tutti gli stati</option>
                    <option value="bozza">Bozza</option>
                    <option value="pubblicata">Pubblicata</option>
                    <option value="chiusa">Chiusa</option>
                    <option value="annullata">Annullata</option>
                  </select>
                </div>

                <button type="submit" className={secondaryButtonClass}>
                  Applica filtro
                </button>

                {filtroStato !== "tutte" && (
                  <a
                    href="/protected/attivita"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium text-[#966044] hover:bg-[#FFF8EF]"
                  >
                    Azzera
                  </a>
                )}
              </form>

              <p className="text-sm text-[#857568] sm:pb-3">
                Pagina {paginaEffettiva} di {totalePagine} · Mostrate{" "}
                <strong className="text-[#59483B]">
                  {elencoDaMostrare.length}
                </strong>{" "}
                su{" "}
                <strong className="text-[#59483B]">
                  {attivitaFiltrate.length}
                </strong>{" "}
                attività
              </p>
            </div>
          )}

        {elencoDaMostrare.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E4D2C2] bg-[#FFFCF8] px-5 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8E7DA] text-2xl">
              🗂️
            </div>
            <p className="mt-4 font-semibold text-[#59483B]">
              Nessuna attività presente
            </p>
            <p className="mt-2 text-sm text-[#8A7A6C]">
              {puoGestire
                ? "Puoi creare una nuova attività utilizzando il modulo qui sopra."
                : "Le attività saranno mostrate qui quando disponibili."}
            </p>
          </div>
         ) : (
          <div className="space-y-4">
            {elencoDaMostrare.map((attivitaItem) => {
              const partecipazioniAttivita =
                partecipazioniPerAttivita.get(attivitaItem.id) ?? [];

              const nomeCerchio = getNomeCerchio(attivitaItem.cerchi);

              const inAttesaApprovazione = partecipazioniAttivita.some(
                (p) => p.stato === "completata"
              );

              const stilePubblica =
                "rounded-full bg-[#81977A] px-4 py-2 text-sm font-medium text-white hover:opacity-90";

              const stileSecondario =
                "rounded-full border border-[#C96F52] px-4 py-2 text-sm font-medium text-[#C96F52] hover:bg-[#FFF8EF]";

              const azioniRapide: {
                etichetta: string;
                stato: string;
                stile: string;
              }[] = !puoGestire
                ? []
                : attivitaItem.stato === "bozza"
                  ? [
                      {
                        etichetta: "Pubblica",
                        stato: "pubblicata",
                        stile: stilePubblica,
                      },
                      {
                        etichetta: "Annulla",
                        stato: "annullata",
                        stile: stileSecondario,
                      },
                    ]
                  : attivitaItem.stato === "annullata"
                    ? [
                        {
                          etichetta: "Chiudi",
                          stato: "chiusa",
                          stile: stilePubblica,
                        },
                        {
                          etichetta: "Torna bozza",
                          stato: "bozza",
                          stile: stileSecondario,
                        },
                      ]
                    : attivitaItem.stato === "pubblicata" && !inAttesaApprovazione
                      ? [
                          {
                            etichetta: "Chiudi",
                            stato: "chiusa",
                            stile: stileSecondario,
                          },
                        ]
                      : [];

              const messaggioStato =
                puoGestire &&
                attivitaItem.stato === "pubblicata" &&
                inAttesaApprovazione
                  ? "In attesa di approvazione"
                  : undefined;  

              return (
                <ActivityDetailModal
                  key={attivitaItem.id}
                  titolo={attivitaItem.titolo}
                  cerchio={nomeCerchio ?? "Cerchio non specificato"}
                  stato={etichettaStato(attivitaItem.stato)}
                  statoClass={stileStato(attivitaItem.stato)}
                  attivitaId={attivitaItem.id}
                  azioneRapida={cambiaStatoAttivitaRapido}
                  azioniRapide={azioniRapide}
                  messaggioStato={messaggioStato}
                >


                <div className="space-y-5">

                  {/* DETTAGLI ATTIVITÀ */}
                  <section className="rounded-xl border border-[#EDE1D6] bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-[#503C30]">Dettagli attività</h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${stileStato(attivitaItem.stato)}`}
                      >
                        {etichettaStato(attivitaItem.stato)}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#6F6257]">
                      {attivitaItem.descrizione || "Nessuna descrizione disponibile."}
                    </p>

                    <p className="mt-3 text-sm text-[#78695C]">
                      <strong>Luogo:</strong> {attivitaItem.luogo ?? "Non specificato"}
                    </p>
                  </section>

                  {/* PARTECIPANTI: SOLO ADMIN E DIREZIONE */}
                  {puoGestire && (
                    <section className="border-t border-[#F0E7DF] pt-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-bold text-[#59483B]">Partecipanti</h3>
                        <span className="rounded-full bg-[#F8F1EA] px-3 py-1 text-xs font-semibold text-[#806650]">
                          {partecipazioniAttivita.length}{" "}
                          {partecipazioniAttivita.length === 1
                            ? "partecipazione"
                            : "partecipazioni"}
                        </span>
                      </div>

                      {partecipazioniAttivita.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#E8DCCF] bg-white px-4 py-5 text-sm text-[#8A7A6C]">
                          Nessun socio candidato o partecipante.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {partecipazioniAttivita.map((partecipazione) => {
                            const socio = Array.isArray(partecipazione.profiles)
                              ? partecipazione.profiles[0]
                              : partecipazione.profiles;

                            return (
                              <div
                                key={partecipazione.id}
                                className="rounded-xl border border-[#EDE1D6] bg-white p-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-[#503C30]">
                                      {socio?.nome} {socio?.cognome}
                                    </p>
                                    {socio?.email && (
                                      <p className="mt-1 break-all text-sm text-[#857568]">
                                        {socio.email}
                                      </p>
                                    )}
                                  </div>

                                  <span
                                    className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${stileStato(partecipazione.stato)}`}
                                  >
                                    {etichettaStato(partecipazione.stato)}
                                  </span>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                  <div className="rounded-lg border border-[#F0E7DF] p-3">
                                    <p className="text-xs text-[#8A7A6C]">Data del lavoro</p>
                                    <p className="mt-1 text-sm font-semibold text-[#59483B]">
                                      {partecipazione.data_lavoro
                                        ? new Date(
                                            `${partecipazione.data_lavoro}T12:00:00`
                                          ).toLocaleDateString("it-IT")
                                        : "—"}
                                    </p>
                                  </div>

                                  <div className="rounded-lg border border-[#F0E7DF] p-3">
                                    <p className="text-xs text-[#8A7A6C]">Ore registrate</p>
                                    <p className="mt-1 text-sm font-semibold text-[#59483B]">
                                      {partecipazione.ore_effettive_mezzore !== null
                                        ? `${partecipazione.ore_effettive_mezzore / 2} ${
                                            partecipazione.ore_effettive_mezzore === 2
                                              ? "ora"
                                              : "ore"
                                          }`
                                        : "—"}
                                    </p>
                                  </div>

                                  <div className="rounded-lg border border-[#F0E7DF] p-3">
                                    <p className="text-xs text-[#8A7A6C]">Completata il</p>
                                    <p className="mt-1 text-sm font-semibold text-[#59483B]">
                                      {partecipazione.data_completamento
                                        ? new Date(
                                            partecipazione.data_completamento
                                          ).toLocaleDateString("it-IT")
                                        : "—"}
                                    </p>
                                  </div>
                                </div>

                                {partecipazione.note_socio && (
                                  <div className="mt-3 rounded-lg border border-[#E9DCCF] bg-[#FFFCF8] p-3 text-sm">
                                    <p className="font-semibold text-[#59483B]">
                                      Note del socio
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap leading-6 text-[#78695C]">
                                      {partecipazione.note_socio}
                                    </p>
                                  </div>
                                )}

                                {/* AVVIO PARTECIPAZIONE */}
                                {partecipazione.stato === "candidato" && (
                                  <form
                                    action={aggiornaStatoPartecipazione}
                                    className="mt-4"
                                  >
                                    <input
                                      type="hidden"
                                      name="partecipazione_id"
                                      value={partecipazione.id}
                                    />
                                    <input
                                      type="hidden"
                                      name="stato"
                                      value="in_corso"
                                    />
                                    <button
                                      type="submit"
                                      className={secondaryButtonClass}
                                    >
                                      Avvia partecipazione
                                    </button>
                                  </form>
                                )}

                                {/* APPROVAZIONE E RIFIUTO */}
                                {partecipazione.stato === "completata" && (
                                  <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/70 p-4">
                                    <h4 className="font-semibold text-orange-950">
                                      Partecipazione da verificare
                                    </h4>
                                    <p className="mt-1 text-sm text-orange-900/80">
                                      Controlla data, ore e note prima di decidere.
                                    </p>

                                    <form action={approvaPartecipazione} className="mt-4">
                                      <input
                                        type="hidden"
                                        name="partecipazione_id"
                                        value={partecipazione.id}
                                      />
                                      <button
                                        type="submit"
                                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#81977A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D8466]"
                                      >
                                        ✓ Approva partecipazione
                                      </button>
                                    </form>

                                    <form
                                      action={rifiutaPartecipazione}
                                      className="mt-3 flex flex-col gap-2"
                                    >
                                      <input
                                        type="hidden"
                                        name="partecipazione_id"
                                        value={partecipazione.id}
                                      />
                                      <label
                                        htmlFor={`motivo-rifiuto-${partecipazione.id}`}
                                        className="text-xs font-medium text-[#6F6257]"
                                      >
                                        Motivo del rifiuto
                                      </label>
                                      <input
                                        id={`motivo-rifiuto-${partecipazione.id}`}
                                        type="text"
                                        name="note_direzione"
                                        placeholder="Inserisci un motivo..."
                                        className={inputClass}
                                      />
                                      <button
                                        type="submit"
                                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-800 hover:bg-rose-50"
                                      >
                                        Rifiuta partecipazione
                                      </button>
                                    </form>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  )}

                  {/* MODIFICA ATTIVITÀ */}
                  {puoGestire && (
                    <details className="group border-t border-[#F0E7DF] pt-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-[#EDE1D6] bg-white px-4 py-3.5 font-semibold text-[#59483B] hover:bg-[#FFF5EB] [&::-webkit-details-marker]:hidden">
                        <span>✎ Modifica attività</span>
                        <span className="text-[#A17A60] transition group-open:rotate-180">
                          ▾
                        </span>
                      </summary>

                      <form
                        action={modificaAttivita}
                        className="mt-4 grid gap-5 rounded-xl border border-[#EDE1D6] bg-white p-4 sm:grid-cols-2 sm:p-5"
                      >
                        <input type="hidden" name="id" value={attivitaItem.id} />

                        <div className="space-y-2">
                          <label
                            htmlFor={`titolo-${attivitaItem.id}`}
                            className={labelClass}
                          >
                            Titolo *
                          </label>
                          <input
                            id={`titolo-${attivitaItem.id}`}
                            name="titolo"
                            defaultValue={attivitaItem.titolo}
                            required
                            className={inputClass}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor={`cerchio-${attivitaItem.id}`}
                            className={labelClass}
                          >
                            Cerchio *
                          </label>
                          <select
                            id={`cerchio-${attivitaItem.id}`}
                            name="cerchio_id"
                            defaultValue={attivitaItem.cerchio_id}
                            required
                            className={inputClass}
                          >
                            {(cerchi ?? []).map((cerchio) => (
                              <option key={cerchio.id} value={cerchio.id}>
                                {cerchio.nome}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <label
                            htmlFor={`descrizione-${attivitaItem.id}`}
                            className={labelClass}
                          >
                            Descrizione
                          </label>
                          <textarea
                            id={`descrizione-${attivitaItem.id}`}
                            name="descrizione"
                            rows={4}
                            defaultValue={attivitaItem.descrizione ?? ""}
                            className={inputClass}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor={`luogo-${attivitaItem.id}`}
                            className={labelClass}
                          >
                            Luogo
                          </label>
                          <input
                            id={`luogo-${attivitaItem.id}`}
                            name="luogo"
                            defaultValue={attivitaItem.luogo ?? ""}
                            className={inputClass}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor={`stato-${attivitaItem.id}`}
                            className={labelClass}
                          >
                            Stato
                          </label>
                          <select
                            id={`stato-${attivitaItem.id}`}
                            name="stato"
                            defaultValue={attivitaItem.stato}
                            className={inputClass}
                          >
                            <option value="bozza">Bozza</option>
                            <option value="pubblicata">Pubblicata</option>
                            <option value="chiusa">Chiusa</option>
                            <option value="annullata">Annullata</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <button type="submit" className={primaryButtonClass}>
                            Salva modifiche
                          </button>
                        </div>
                      </form>
                    </details>
                  )}
                </div>


                  </ActivityDetailModal>
                );

            })}
          </div>
        )}

        {puoGestire && totalePagine > 1 && (

            <nav
              aria-label="Paginazione attività"
              className="flex flex-col gap-3 rounded-2xl border border-[#EDE1D6] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-[#857568]">
                Attività{" "}
                <strong className="text-[#59483B]">{inizio + 1}</strong>
                {" – "}
                <strong className="text-[#59483B]">
                  {Math.min(inizio + ELEMENTI_PER_PAGINA, attivitaFiltrate.length)}
                </strong>
                {" di "}
                <strong className="text-[#59483B]">{attivitaFiltrate.length}</strong>
              </p>


          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`?stato=${encodeURIComponent(filtroStato)}&pagina=${paginaEffettiva - 1}`}
              aria-disabled={paginaEffettiva === 1}
              className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-[#EDE1D6] px-3 py-2 text-sm font-semibold ${
                paginaEffettiva === 1
                  ? "pointer-events-none opacity-40"
                  : "text-[#59483B] hover:bg-[#FFF5EB]"
              }`}
            >
              ← Precedente
            </a>

            {Array.from({ length: totalePagine }, (_, indice) => indice + 1)
              .filter(
                (pagina) =>
                  pagina === 1 ||
                  pagina === totalePagine ||
                  Math.abs(pagina - paginaEffettiva) <= 1
              )
              .map((pagina, indice, pagine) => (
                <span key={pagina} className="contents">
                  {indice > 0 && pagina - pagine[indice - 1] > 1 && (
                    <span className="px-1 text-[#857568]">…</span>
                  )}

                  <a
                    href={`?stato=${encodeURIComponent(filtroStato)}&pagina=${pagina}`}
                    aria-current={pagina === paginaEffettiva ? "page" : undefined}
                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${
                      pagina === paginaEffettiva
                        ? "border-[#C96F52] bg-[#C96F52] text-white"
                        : "border-[#EDE1D6] text-[#59483B] hover:bg-[#FFF5EB]"
                    }`}
                  >
                    {pagina}
                  </a>
                </span>
              ))}

            <a
              href={`?stato=${encodeURIComponent(filtroStato)}&pagina=${paginaEffettiva + 1}`}
              aria-disabled={paginaEffettiva === totalePagine}
              className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-[#EDE1D6] px-3 py-2 text-sm font-semibold ${
                paginaEffettiva === totalePagine
                  ? "pointer-events-none opacity-40"
                  : "text-[#59483B] hover:bg-[#FFF5EB]"
              }`}
            >
              Successiva →
            </a>
          </div>

            </nav>
          )}


      </section>
    </div>
  );
}