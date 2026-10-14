import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";


import ImpostazioniForm from "./ImpostazioniForm";

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

      <ImpostazioniForm
        oreMassime={oreMassime}
        valoreOra={valoreOra}
        creditoMassimo={creditoMassimo}
      />
      

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