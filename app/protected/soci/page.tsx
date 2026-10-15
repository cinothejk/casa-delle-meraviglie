
import { createClient } from "@/lib/supabase/server";
import SociLista from "@/components/soci-lista";

export const instant = false;

export default async function SociPage() {
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
      <div className="rounded-xl border border-[#E8DCCF] bg-white p-6">
        <h1 className="text-xl font-semibold text-[#59483D]">
          Accesso non autorizzato
        </h1>
      </div>
    );
  }

  const [{ data: soci, error: sociError }, { data: famiglie, error: famiglieError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(`
          id,
          nome,
          cognome,
          email,
          username,
          ruolo,
          attivo,
          famiglia_id,
          famiglie (
            id,
            nome
          )
        `)
        .order("cognome", { ascending: true })
        .order("nome", { ascending: true }),

      supabase
        .from("famiglie")
        .select("id, nome")
        .eq("attiva", true)
        .order("nome", { ascending: true }),
    ]);

  if (sociError || famiglieError) {
    return (
      <div className="rounded-xl border border-[#E8DCCF] bg-white p-6">
        <h1 className="text-xl font-semibold text-[#59483D]">Errore</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Impossibile caricare i dati dei soci.
        </p>
      </div>
    );
  }

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[#59483D]">Soci</h1>
        <p className="mt-1 text-sm text-[#8B7B6D]">
          Gestisci i soci, le famiglie e lo stato delle iscrizioni.
        </p>
      </header>

      <SociLista
        soci={(soci ?? []) as any}
        famiglie={famiglie ?? []}
      />
    </main>
  );
}
