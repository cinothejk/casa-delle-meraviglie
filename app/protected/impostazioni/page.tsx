import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { aggiornaImpostazioni } from "./actions";

export const instant = false;

export default async function ImpostazioniPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profilo } = await supabase
    .from("profiles")
    .select("ruolo, attivo")
    .eq("id", user.id)
    .single();

  if (
    !profilo ||
    !profilo.attivo ||
    profilo.ruolo !== "superadmin"
  ) {
    redirect("/protected");
  }

  const { data: impostazioni, error } = await supabase
    .from("impostazioni")
    .select(`
      id,
      ore_massime_mensili_mezzore,
      valore_ora_centesimi,
      credito_massimo_centesimi,
      updated_at
    `)
    .order("id")
    .limit(1)
    .single();

  if (error || !impostazioni) {
    throw new Error(
      "Impostazioni non disponibili"
    );
  }

  const oreMassime =
    impostazioni.ore_massime_mensili_mezzore / 2;

  const valoreOra =
    impostazioni.valore_ora_centesimi / 100;

  const creditoMassimo =
    impostazioni.credito_massimo_centesimi / 100;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Impostazioni
        </h1>

        <p className="mt-2 text-muted-foreground">
          Configura le regole economiche delle attività
          della comunità.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900">
        <form
          action={aggiornaImpostazioni}
          className="space-y-6"
        >
          <div>
            <h2 className="text-lg font-semibold">
              Regole mensili
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Questi valori vengono utilizzati per il
              calcolo dei crediti delle famiglie.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label
                htmlFor="ore_massime"
                className="block text-sm font-medium"
              >
                Ore massime mensili
              </label>

              <input
                id="ore_massime"
                name="ore_massime"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                defaultValue={oreMassime}
                className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2"
                required
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Limite complessivo per famiglia.
              </p>
            </div>

            <div>
              <label
                htmlFor="valore_ora"
                className="block text-sm font-medium"
              >
                Valore di 1 ora (€)
              </label>

              <input
                id="valore_ora"
                name="valore_ora"
                type="number"
                min="0.01"
                max="1000"
                step="0.01"
                defaultValue={valoreOra}
                className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2"
                required
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Valore economico di ogni ora approvata.
              </p>
            </div>

            <div>
              <label
                htmlFor="credito_massimo"
                className="block text-sm font-medium"
              >
                Credito massimo mensile (€)
              </label>

              <input
                id="credito_massimo"
                name="credito_massimo"
                type="number"
                min="0.01"
                max="10000"
                step="0.01"
                defaultValue={creditoMassimo}
                className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2"
                required
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Tetto massimo di credito per famiglia.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
            <p className="font-medium">
              Configurazione attuale
            </p>

            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                Massimo:{" "}
                {oreMassime.toLocaleString("it-IT")} ore
                / famiglia / mese
              </li>

              <li>
                Valore:{" "}
                {valoreOra.toLocaleString("it-IT", {
                  style: "currency",
                  currency: "EUR",
                })}
                / ora
              </li>

              <li>
                Credito massimo:{" "}
                {creditoMassimo.toLocaleString("it-IT", {
                  style: "currency",
                  currency: "EUR",
                })}
                / famiglia / mese
              </li>
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
            >
              Salva impostazioni
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border p-5">
        <h2 className="font-semibold">
          Nota
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Le modifiche alle impostazioni influenzano i
          nuovi calcoli e i nuovi report. I report mensili
          già generati rimangono storicizzati e non vengono
          modificati automaticamente.
        </p>
      </div>
    </main>
  );
}