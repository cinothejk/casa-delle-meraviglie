import { redirect } from "next/navigation";
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

export default async function MiaSituazionePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profilo } = await supabase
    .from("profiles")
    .select("nome, cognome, ruolo, attivo, famiglia_id")
    .eq("id", user.id)
    .single();

  if (!profilo || !profilo.attivo) {
    redirect("/protected");
  }

  if (profilo.ruolo !== "socio") {
    redirect("/protected/report");
  }

  if (!profilo.famiglia_id) {
    return (
      <main className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            La mia situazione
          </h1>

          <p className="mt-2 text-muted-foreground">
            Non sei ancora associato a una famiglia.
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            Quando la Direzione ti assegnerà a una famiglia,
            qui troverai il riepilogo delle tue ore e del credito
            maturato.
          </p>
        </div>
      </main>
    );
  }

  const { data: impostazioni } = await supabase
    .from("impostazioni")
    .select(
        "ore_massime_mensili_mezzore, valore_ora_centesimi, credito_massimo_centesimi"
    )
    .order("id")
    .limit(1)
    .single();

  const { data: famiglia } = await supabase
    .from("famiglie")
    .select("id, nome")
    .eq("id", profilo.famiglia_id)
    .single();

  const { data: periodi } = await supabase
    .from("periodi")
    .select("id, anno, mese, stato")
    .order("anno", { ascending: false })
    .order("mese", { ascending: false })
    .limit(12);

  const periodoIds = (periodi ?? []).map((periodo) => periodo.id);

  const { data: reportSoci } =
    periodoIds.length > 0
      ? await supabase
          .from("report_mensili_soci")
          .select(`
            id,
            report_mensile_id,
            socio_id,
            ore_mezzore,
            report_mensili!inner (
              id,
              periodo_id,
              famiglia_id,
              ore_totali_mezzore,
              ore_creditate_mezzore,
              credito_centesimi
            )
          `)
          .eq("socio_id", user.id)
          .in("report_mensili.periodo_id", periodoIds)
          .eq("report_mensili.famiglia_id", profilo.famiglia_id)
      : { data: [] };



  const periodoMap = new Map(
    (periodi ?? []).map((periodo) => [periodo.id, periodo])
  );

  const miePartecipazioni = await supabase
    .from("partecipazioni")
    .select(`
      id,
      data_lavoro,
      ore_effettive_mezzore,
      stato,
      attivita (
        id,
        titolo
      )
    `)
    .eq("socio_id", user.id)
    .eq("stato", "approvata")
    .order("data_lavoro", { ascending: false })
    .limit(50);

  const reportPerPeriodo = (reportSoci ?? [])
    .map((item) => {
      const report = Array.isArray(item.report_mensili)
        ? item.report_mensili[0]
        : item.report_mensili;

      if (!report) {
        return null;
      }

      const periodo = periodoMap.get(report.periodo_id);

      if (!periodo) {
        return null;
      }

      return {
        ...item,
        report,
        periodo,
      };
    })
    .filter(Boolean);

    const ultimoReport = reportPerPeriodo[0] ?? null;

    const creditoFamiglia = ultimoReport
        ? ultimoReport.report.credito_centesimi
        : 0;

    const massimoOreFamiglia = impostazioni
        ? formatOre(impostazioni.ore_massime_mensili_mezzore)
        : "7 h";

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          La mia situazione
        </h1>

        <p className="mt-2 text-muted-foreground">
          Ciao {profilo.nome ?? ""}, qui puoi vedere le tue ore
          approvate e il credito maturato dalla tua famiglia.
        </p>
      </div>

      <section className="rounded-xl border p-5">
        <p className="text-sm text-muted-foreground">
          Famiglia
        </p>

        <p className="mt-1 text-xl font-semibold">
          {famiglia?.nome ?? "—"}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">
                Le mie ore approvate
            </p>

            <p className="mt-2 text-2xl font-semibold">
                {formatOre(
                (miePartecipazioni.data ?? []).reduce(
                    (totale, item) =>
                    totale + item.ore_effettive_mezzore,
                    0
                )
                )}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
                Limite familiare mensile: {massimoOreFamiglia}
            </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            Credito famiglia
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {formatEuro(
                reportPerPeriodo.length > 0
                ? reportPerPeriodo[0]!.report.credito_centesimi
                : 0
            )}
          </p>
        </div>
      </section>

      <section className="rounded-xl border">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            I miei report mensili
          </h2>

          <p className="text-sm text-muted-foreground">
            Qui vedi soltanto il tuo contributo e il credito
            complessivo della tua famiglia.
          </p>
        </div>

        <div className="divide-y">
          {reportPerPeriodo.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">
              Non sono ancora disponibili report mensili.
            </div>
          ) : (
            reportPerPeriodo.map((item) => (
              <div
                key={item!.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium capitalize">
                    {new Intl.DateTimeFormat("it-IT", {
                      month: "long",
                      year: "numeric",
                    }).format(
                      new Date(
                        item!.periodo.anno,
                        item!.periodo.mese - 1,
                        1
                      )
                    )}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Le mie ore:{" "}
                    {formatOre(item!.ore_mezzore)}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="mt-2 text-2xl font-semibold">
                        {formatEuro(creditoFamiglia)}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    credito famiglia
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Le mie attività approvate
          </h2>
        </div>

        <div className="divide-y">
          {(miePartecipazioni.data ?? []).length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">
              Non hai ancora attività approvate.
            </div>
          ) : (
            (miePartecipazioni.data ?? []).map((partecipazione) => {
              const attivita = Array.isArray(
                partecipazione.attivita
              )
                ? partecipazione.attivita[0]
                : partecipazione.attivita;

              return (
                <div
                  key={partecipazione.id}
                  className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {attivita?.titolo ?? "Attività"}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {formatData(
                        partecipazione.data_lavoro
                      )}
                    </p>
                  </div>

                  <p className="font-semibold">
                    {formatOre(
                      partecipazione.ore_effettive_mezzore
                    )}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}