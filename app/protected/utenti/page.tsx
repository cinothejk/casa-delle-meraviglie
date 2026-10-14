import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  creaUtente,
  modificaUtente,
  generaResetPassword,
} from "./actions";
import UtentiManager from "./UtentiManager";


export const instant = false;

export default async function UtentiPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profilo, error: profiloError } = await supabase
    .from("profiles")
    .select("id, nome, cognome, username, ruolo, attivo")
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

  const { data: famiglie, error: famiglieError } = await supabase
    .from("famiglie")
    .select("id, nome, attiva")
    .eq("attiva", true)
    .order("nome");

  if (famiglieError) {
    throw new Error(
      "Errore nel caricamento delle famiglie."
    );
  }

  const { data: utenti, error: utentiError } = await supabase
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
    .order("cognome")
    .order("nome");

  if (utentiError) {
    throw new Error(
      "Errore nel caricamento degli utenti."
    );
  }

return (
  <section className="space-y-6">
    <div>
      <Link
        href="/protected"
        className="inline-flex items-center rounded-xl border border-[#EADDCF] bg-white px-4 py-2.5 text-sm font-medium text-[#49372F] transition hover:bg-[#FFF8EF]"
      >
        ← Dashboard
      </Link>
    </div>

    <UtentiManager
      utenti={utenti ?? []}
      famiglie={famiglie ?? []}
    />
  </section>
);


}