
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PuliziaDatiManager from "./PuliziaDatiManager";

export const instant = false;

export default async function PuliziaDatiPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profilo, error: profiloError } = await supabase
    .from("profiles")
    .select("ruolo, attivo")
    .eq("id", user.id)
    .single();

  if (
    profiloError ||
    !profilo ||
    profilo.ruolo !== "superadmin" ||
    !profilo.attivo
  ) {
    redirect("/protected");
  }

  const { data: attivita, error: attivitaError } = await supabase
    .from("attivita")
    .select("id, titolo, stato, created_at")
    .order("created_at", { ascending: false });

  if (attivitaError) {
    throw new Error("Errore nel caricamento delle attività.");
  }

  const { data: utenti, error: utentiError } = await supabase
    .from("profiles")
    .select("id, nome, cognome, username, email, ruolo, attivo")
    .order("cognome")
    .order("nome");

  if (utentiError) {
    throw new Error("Errore nel caricamento degli utenti.");
  }

  
  const { data: famiglie, error: famiglieError } = await supabase
    .from("famiglie")
    .select("id, nome, codice, note, attiva, created_at")
    .order("nome");

  if (famiglieError) {
    throw new Error("Errore nel caricamento delle famiglie.");
  }


  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-[#EADDCF] bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#C96F52]">
          Amministrazione
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#44382F]">
          Pulizia dati
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#76665A]">
          Elimina singolarmente attività e utenti non più necessari.
          Ogni operazione richiede conferma. Le eliminazioni sono definitive.
        </p>
      </header>

      <PuliziaDatiManager
        attivita={attivita ?? []}
        utenti={utenti ?? []}
        famiglie={famiglie ?? []}
        utenteCorrenteId={user.id}
      />
    </section>
  );
}
