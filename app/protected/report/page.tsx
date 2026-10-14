import { createClient } from "@/lib/supabase/server";
import { generaReport, chiudiPeriodo,riapriPeriodo } from "./actions";
import RiapriPeriodoButton from "./RiapriPeriodoButton";

import Link from "next/link";

export const instant = false;

const mesi = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

function formatEuro(centesimi: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(centesimi / 100);
}

function formatOre(mezzore: number) {
  return `${mezzore / 2} h`;
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    anno?: string;
    mese?: string;
  }>;
}) {
  const params = await searchParams;

  const oggi = new Date();

  const anno = Number(params.anno) || oggi.getFullYear();
  const mese = Number(params.mese) || oggi.getMonth() + 1;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profilo } = await supabase
    .from("profiles")
    .select("ruolo")
    .eq("id", user.id)
    .single();

  if (!profilo || !["superadmin", "direzione"].includes(profilo.ruolo)) {
    return (
      <div className="rounded-lg border p-6">
        <h1 className="text-xl font-semibold">
          Accesso non autorizzato
        </h1>
      </div>
    );
  }

  const { data: periodo } = await supabase
    .from("periodi")
    .select(`
      id,
      anno,
      mese,
      stato,
      data_apertura,
      data_chiusura
    `)
    .eq("anno", anno)
    .eq("mese", mese)
    .maybeSingle();

  let report: any[] = [];

  if (periodo) {
    const { data } = await supabase
      .from("report_mensili")
      .select(`
        id,
        famiglia_id,
        ore_totali_mezzore,
        ore_creditate_mezzore,
        credito_centesimi,
        generato_il,
        famiglie (
          id,
          nome
        )
      `)
      .eq("periodo_id", periodo.id)
      .order("credito_centesimi", {
        ascending: false,
      });

    report = data ?? [];
  }

  const totaleOre = report.reduce(
    (totale, item) =>
      totale + (item.ore_totali_mezzore ?? 0),
    0
  );

  const totaleOreCreditate = report.reduce(
    (totale, item) =>
      totale + (item.ore_creditate_mezzore ?? 0),
    0
  );

  const totaleCredito = report.reduce(
    (totale, item) =>
      totale + (item.credito_centesimi ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Report mensili
        </h1>

        <p className="text-sm text-muted-foreground">
          Riepilogo storico delle attività approvate e
          del credito maturato dalle famiglie.
        </p>
      </div>

      {/* Selettore periodo */}
      <div className="rounded-lg border p-5">
        <form
          method="get"
          className="flex flex-wrap items-end gap-4"
        >
          <div>
            <label
              htmlFor="mese"
              className="mb-1 block text-sm font-medium"
            >
              Mese
            </label>

            <select
              id="mese"
              name="mese"
              defaultValue={String(mese)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {mesi.map((nome, index) => (
                <option
                  key={index + 1}
                  value={index + 1}
                >
                  {nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="anno"
              className="mb-1 block text-sm font-medium"
            >
              Anno
            </label>

            <input
              id="anno"
              name="anno"
              type="number"
              min="2020"
              max="2100"
              defaultValue={anno}
              className="w-28 rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Visualizza
          </button>
        </form>
      </div>

      {/* Stato periodo */}
      <div className="rounded-lg border p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">
              {mesi[mese - 1]} {anno}
            </h2>

            {periodo ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Periodo{" "}
                <span className="font-medium text-foreground">
                  {periodo.stato}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Periodo non ancora creato.
              </p>
            )}
          </div>

          {periodo?.stato === "chiuso" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-md border px-3 py-2 text-sm">
                Periodo chiuso
                {periodo.data_chiusura
                  ? ` il ${periodo.data_chiusura}`
                  : ""}
              </div>

              <RiapriPeriodoButton
                anno={anno}
                mese={mese}
                nomeMese={mesi[mese - 1]}
              />
            </div>
          )}


          


        </div>

        {periodo?.stato === "aperto" && (
          <div className="mt-5 flex flex-wrap gap-3">
            <form action={generaReport}>
              <input
                type="hidden"
                name="anno"
                value={anno}
              />
              <input
                type="hidden"
                name="mese"
                value={mese}
              />

              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Genera / aggiorna report
              </button>
            </form>

            {report.length > 0 && (
              <form action={chiudiPeriodo}>
                <input
                  type="hidden"
                  name="anno"
                  value={anno}
                />
                <input
                  type="hidden"
                  name="mese"
                  value={mese}
                />

                <button
                  type="submit"
                  className="rounded-md border px-4 py-2 text-sm font-medium"
                >
                  Chiudi periodo
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Riepilogo */}
      {periodo && report.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-5">
              <p className="text-sm text-muted-foreground">
                Ore approvate
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatOre(totaleOre)}
              </p>
            </div>

            <div className="rounded-lg border p-5">
              <p className="text-sm text-muted-foreground">
                Ore creditate
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatOre(totaleOreCreditate)}
              </p>
            </div>

            <div className="rounded-lg border p-5">
              <p className="text-sm text-muted-foreground">
                Credito totale
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatEuro(totaleCredito)}
              </p>
            </div>
          </div>

          {/* Tabella famiglie */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    Famiglia
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Ore totali
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Ore creditate
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Credito
                  </th>
                </tr>
              </thead>

              <tbody>
                {report.map((item) => {
                  const famiglia = Array.isArray(item.famiglie)
                    ? item.famiglie[0]
                    : item.famiglie;

                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                            href={`/protected/report/${item.id}`}
                            className="font-medium hover:underline"
                        >
                            {famiglia?.nome ?? "—"}
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatOre(
                          item.ore_totali_mezzore
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatOre(
                          item.ore_creditate_mezzore
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-medium">
                        {formatEuro(
                          item.credito_centesimi
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {periodo && report.length === 0 && (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Il report per questo periodo non è ancora stato generato.
        </div>
      )}

      {!periodo && (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Nessun periodo presente per {mesi[mese - 1]} {anno}.
        </div>
      )}
    </div>
  );
}