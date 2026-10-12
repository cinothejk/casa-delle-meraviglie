"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function verificaGestione() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utente non autenticato");
  }

  const { data: profilo, error } = await supabase
    .from("profiles")
    .select("ruolo, attivo")
    .eq("id", user.id)
    .single();

  if (error || !profilo || !profilo.attivo) {
    throw new Error("Profilo non autorizzato");
  }

  if (!["superadmin", "direzione"].includes(profilo.ruolo)) {
    throw new Error("Non autorizzato");
  }

  return {
    supabase,
    user,
    ruolo: profilo.ruolo,
  };
}

export async function modificaSocio(formData: FormData) {
  const supabase = await createClient();

  await verificaGestione();

  const socioId = String(formData.get("socio_id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const cognome = String(formData.get("cognome") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const famigliaId = String(formData.get("famiglia_id") ?? "").trim();
  const attivo = String(formData.get("attivo") ?? "") === "true";

  if (!socioId) {
    throw new Error("Socio non valido");
  }

  if (!nome || !cognome) {
    throw new Error("Nome e cognome sono obbligatori");
  }

  // Leggiamo i dati attuali prima della modifica.
  const { data: socioPrima, error: socioPrimaError } = await supabase
    .from("profiles")
    .select(
      "id, nome, cognome, username, email, ruolo, attivo, famiglia_id"
    )
    .eq("id", socioId)
    .single();

  if (socioPrimaError || !socioPrima) {
    throw new Error("Socio non trovato");
  }

  // Verifica famiglia, se valorizzata.
  if (famigliaId) {
    const { data: famiglia, error: famigliaError } = await supabase
      .from("famiglie")
      .select("id")
      .eq("id", famigliaId)
      .single();

    if (famigliaError || !famiglia) {
      throw new Error("Famiglia non trovata");
    }
  }

  // Controllo username duplicato.
  if (username) {
    const { data: usernameEsistente } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", socioId)
      .maybeSingle();

    if (usernameEsistente) {
      throw new Error("Username già utilizzato");
    }
  }

  const { data: socioDopo, error: updateError } = await supabase
    .from("profiles")
    .update({
      nome,
      cognome,
      username: username || null,
      famiglia_id: famigliaId || null,
      attivo,
    })
    .eq("id", socioId)
    .select(
      "id, nome, cognome, username, email, ruolo, attivo, famiglia_id"
    )
    .single();

  if (updateError || !socioDopo) {
    throw new Error(
      updateError?.message ?? "Errore durante la modifica del socio"
    );
  }

  // Registriamo la modifica nell'Audit Log.
  const { error: auditError } = await supabase.rpc("registra_audit", {
    p_azione: "modifica",
    p_tabella: "profiles",
    p_record_id: socioId,
    p_dati_precedenti: socioPrima,
    p_dati_nuovi: socioDopo,
  });

  if (auditError) {
    console.error("Errore registrazione audit:", auditError);
  }

  revalidatePath("/protected/soci");
  revalidatePath("/protected/famiglie");
  revalidatePath("/protected/attivita");
}