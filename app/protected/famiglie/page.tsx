
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamiglieLista from "@/components/famiglie-lista";

export const instant = false;

export default async function FamigliePage() {
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

  const [
    { data: famiglie, error: famiglieError },
    { data: soci, error: sociError },
  ] = await Promise.all([
    supabase
      .from("famiglie")
      .select(`
        id,
        nome,
        codice,
        attiva,
        profiles (
          id,
          nome,
          cognome,
          email,
          ruolo,
          attivo
        )
      `)
      .order("nome", { ascending: true }),

    supabase
      .from("profiles")
      .select(`
        id,
        nome,
        cognome,
        email,
        famiglia_id,
        attivo
      `)
      .order("cognome", { ascending: true }),
  ]);

  if (famiglieError || sociError) {
    return (
      <main className="rounded-2xl border border-[#E8C9C1] bg-[#FFF8EF] p-6">
        <h1 className="text-2xl font-bold text-[#49372F]">
          Errore nel caricamento delle famiglie
        </h1>
        <p className="mt-2 text-sm text-red-700">
          {famiglieError?.message || sociError?.message}
        </p>
      </main>
    );
  }

  const famiglieNormalizzate = (famiglie ?? []).map((famiglia) => ({
    ...famiglia,
    profiles: Array.isArray(famiglia.profiles)
      ? famiglia.profiles
      : famiglia.profiles
        ? [famiglia.profiles]
        : [],
  }));

  return (
    <FamiglieLista
      famiglie={famiglieNormalizzate}
      soci={soci ?? []}
    />
  );
}
