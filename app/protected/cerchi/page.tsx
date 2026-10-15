
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CerchiLista from "@/components/cerchi-lista";

export const instant = false;

export default async function CerchiPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ruolo")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    (profile.ruolo !== "superadmin" &&
      profile.ruolo !== "direzione")
  ) {
    redirect("/protected");
  }

  const { data: cerchi, error } = await supabase
    .from("cerchi")
    .select(`
      id,
      nome,
      descrizione,
      attivo
    `)
    .order("nome", { ascending: true });

  if (error) {
    return (
      <main className="rounded-2xl border border-[#E8C9C1] bg-[#FFF8EF] p-6">
        <h1 className="text-2xl font-bold text-[#49372F]">
          Errore nel caricamento dei cerchi
        </h1>

        <p className="mt-2 text-sm text-red-700">
          {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl">
      <header className="mb-8">
        <p className="text-sm font-medium text-[#C96F52]">
          Organizzazione delle attività
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#49372F] sm:text-4xl">
          Cerchi
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#78675D] sm:text-base">
          Scopri e gestisci i cerchi della comunità.
          Seleziona una card per modificare le informazioni
          e la disponibilità.
        </p>
      </header>

      <CerchiLista cerchi={cerchi ?? []} />
    </main>
  );
}
