import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

function formatOre(mezzore: number) {
  const ore = mezzore / 2;

  return `${ore.toLocaleString("it-IT", {
    minimumFractionDigits: ore % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })} h`;
}

function formatEuro(centesimi: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(centesimi / 100);
}

function formatData(data: string | null) {
  if (!data) {
    return "—";
  }

  return new Intl.DateTimeFormat("it-IT").format(
    new Date(`${data}T00:00:00`)
  );
}

export default async function ReportDettaglioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profilo } = await supabase
    .from("profiles")
    .select("nome, cognome, ruolo, attivo")
    .eq("id", user.id)
    .single();

  if (
    !profilo ||
    !profilo.attivo ||
    !["superadmin", "direzione"].includes(profilo.ruolo)
  ) {
    redirect("/protected");
  }

  const { data: report, error: reportError } = await supabase
    .from("report_mensili")
    .select(`
      id,
      periodo_id,
      famiglia_id,
      ore_totali_mezzore,
      ore_creditate_mezzore,
      credito_centesimi,
      generato_il,
      famiglie (
        id,
        nome,
        codice
      ),
      periodi (
        id,
        anno,
        mese,
        stato
      )
    `)
    .eq("id", id)
    .single();

  if (reportError || !report) {
    redirect("/protected/report");
  }

  const famiglia = Array.isArray(report.famiglie)
    ? report.famiglie[0]
    : report.famiglie;

  const periodo = Array.isArray(report.periodi)
    ? report.periodi[0]
    : report.periodi;

  const { data: dettagliSoci, error: dettagliError } = await supabase
    .from("report_mensili_soci")
    .select(`
      id,
      socio_id,
      ore_mezzore,
      profiles!report_mensili_soci_socio_id_fkey (
        id,
        nome,
        cognome,
        email
      )
    `)
    .eq("report_mensile_id", report.id)
    .order("ore_mezzore", { ascending: false });

  if (dettagliError) {
    throw new Error(dettagliError.message);
  }

  const socioIds = (dettagliSoci ?? []).map(
    (dettaglio) => dettaglio.socio_id
  );

  let partecipazioni: Array<{
    id: string;
    socio_id: string;
    attivita_id: string;
    data_lavoro: string | null;
    ore_effettive_mezzore: number;
    titolo_attivita: string;
  }> = [];

  if (socioIds.length > 0 && periodo) {
    const primoGiorno = `${periodo.anno}-${String(periodo.mese).padStart(
      2,
      "0"
    )}-01`;

    const ultimoGiorno = new Date(
      periodo.anno,
      periodo.mese,
      0
    );

    const ultimoGiornoString = `${periodo.anno}-${String(
      periodo.mese
    ).padStart(2, "0")}-${String(ultimoGiorno.getDate()).padStart(2, "0")}`;

    const { data: partecipazioniData, error: partecipazioniError } =
      await supabase
        .from("partecipazioni")
        .select(`
          id,
          socio_id,
          attivita_id,
          data_lavoro,
          ore_effettive_mezzore,
          attivita!inner (
            titolo
          )
        `)
        .in("socio_id", socioIds)
        .eq("stato", "approvata")
        .gte("data_lavoro", primoGiorno)
        .lte("data_lavoro", ultimoGiornoString)
        .order("data_lavoro", { ascending: true });

    if (partecipazioniError) {
      throw new Error(partecipazioniError.message);
    }

    partecipazioni =
      (partecipazioniData ?? []).map((partecipazione) => {
        const attivita = Array.isArray(partecipazione.attivita)
          ? partecipazione.attivita[0]
          : partecipazione.attivita;

        return {
          id: partecipazione.id,
          socio_id: partecipazione.socio_id,
          attivita_id: partecipazione.attivita_id,
          data_lavoro: partecipazione.data_lavoro,
          ore_effettive_mezzore:
            partecipazione.ore_effettive_mezzore,
          titolo_attivita: attivita?.titolo ?? "Attività",
        };
      });
  }

  const partecipazioniPerSocio = new Map<
    string,
    typeof partecipazioni
  >();

  for (const partecipazione of partecipazioni) {
    const elenco =
      partecipazioniPerSocio.get(partecipazione.socio_id) ?? [];

    elenco.push(partecipazione);
    partecipazioniPerSocio.set(partecipazione.socio_id, elenco);
  }

  const nomeFamiglia = famiglia?.nome ?? "Famiglia";

  const meseLabel = periodo
    ? new Intl.DateTimeFormat("it-IT", {
        month: "long",
        year: "numeric",
      }).format(new Date(periodo.anno, periodo.mese - 1, 1))
    : "Periodo";

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/protected/report"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Torna ai report
          </Link>

          <h1 className="mt-2 text-2xl font-semibold">
            {nomeFamiglia}
          </h1>

          <p className="text-muted-foreground">
            Report di {meseLabel}
          </p>
        </div>

        <div className="rounded-lg border px-4 py-2 text-sm">
          Stato periodo:{" "}
          <strong>
            {periodo?.stato === "chiuso" ? "Chiuso" : "Aperto"}
          </strong>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            Ore effettuate
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {formatOre(report.ore_totali_mezzore)}
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            Ore riconosciute
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {formatOre(report.ore_creditate_mezzore)}
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            Credito maturato
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {formatEuro(report.credito_centesimi)}
          </p>
        </div>
      </section>

      <section className="rounded-xl border">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Contributo dei soci
          </h2>

          <p className="text-sm text-muted-foreground">
            Ore approvate che hanno contribuito al credito della famiglia.
          </p>
        </div>

        <div className="divide-y">
          {(dettagliSoci ?? []).length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">
              Nessun contributo registrato nel periodo.
            </div>
          ) : (
            (dettagliSoci ?? []).map((dettaglio) => {
              const socio = Array.isArray(dettaglio.profiles)
                ? dettaglio.profiles[0]
                : dettaglio.profiles;

              const attivitaSocio =
                partecipazioniPerSocio.get(dettaglio.socio_id) ?? [];

              return (
                <div key={dettaglio.id} className="p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {socio?.nome} {socio?.cognome}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {socio?.email}
                      </p>
                    </div>

                    <div className="text-lg font-semibold">
                      {formatOre(dettaglio.ore_mezzore)}
                    </div>
                  </div>

                  {attivitaSocio.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="px-3 py-2 font-medium">
                              Data
                            </th>
                            <th className="px-3 py-2 font-medium">
                              Attività
                            </th>
                            <th className="px-3 py-2 text-right font-medium">
                              Ore
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {attivitaSocio.map((partecipazione) => (
                            <tr
                              key={partecipazione.id}
                              className="border-b last:border-0"
                            >
                              <td className="px-3 py-2">
                                {formatData(
                                  partecipazione.data_lavoro
                                )}
                              </td>

                              <td className="px-3 py-2">
                                {partecipazione.titolo_attivita}
                              </td>

                              <td className="px-3 py-2 text-right">
                                {formatOre(
                                  partecipazione.ore_effettive_mezzore
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}