"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verificaSuperAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utente non autenticato.");
  }

  const { data: profilo, error } = await supabase
    .from("profiles")
    .select("id, ruolo, attivo")
    .eq("id", user.id)
    .single();

  if (
    error ||
    !profilo ||
    profilo.ruolo !== "superadmin" ||
    !profilo.attivo
  ) {
    throw new Error("Operazione consentita solo al SuperAdmin.");
  }

  return {
    supabase,
    user,
    profilo,
  };
}

export async function creaUtente(formData: FormData) {
  const { supabase } = await verificaSuperAdmin();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  const nome = String(formData.get("nome") ?? "").trim();
  const cognome = String(formData.get("cognome") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();

  const ruolo = String(formData.get("ruolo") ?? "socio");

  const famigliaIdRaw = String(
    formData.get("famiglia_id") ?? ""
  );

  const famigliaId = famigliaIdRaw || null;

  if (!email) {
    throw new Error("L'email è obbligatoria.");
  }

  if (!password || password.length < 8) {
    throw new Error(
      "La password deve contenere almeno 8 caratteri."
    );
  }

  if (!nome) {
    throw new Error("Il nome è obbligatorio.");
  }

  if (!cognome) {
    throw new Error("Il cognome è obbligatorio.");
  }

  if (!username) {
    throw new Error("Lo username è obbligatorio.");
  }

  if (!["socio", "direzione"].includes(ruolo)) {
    throw new Error("Ruolo non valido.");
  }

  if (ruolo === "direzione" && famigliaId) {
    throw new Error(
      "Un utente Direzione non può essere associato a una famiglia."
    );
  }

  if (famigliaId) {
    const { data: famiglia, error: famigliaError } =
      await supabase
        .from("famiglie")
        .select("id")
        .eq("id", famigliaId)
        .eq("attiva", true)
        .single();

    if (famigliaError || !famiglia) {
      throw new Error(
        "Famiglia non trovata o non attiva."
      );
    }
  }

  const supabaseAdmin = createAdminClient();

  /*
   * 1. Creiamo l'account Auth.
   *
   * Il database creerà automaticamente il relativo
   * record nella tabella profiles.
   */
  const { data: nuovoUtente, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !nuovoUtente.user) {
    throw new Error(
      authError?.message ??
        "Errore durante la creazione dell'utente."
    );
  }

  const userId = nuovoUtente.user.id;

  /*
   * 2. Il profilo esiste già grazie al trigger di Supabase.
   * Lo aggiorniamo tramite il client normale del SuperAdmin.
   */
  const { data: profilo, error: profiloError } =
  await supabase.rpc(
    "configura_profilo_nuovo_utente",
    {
      p_user_id: userId,
      p_nome: nome,
      p_cognome: cognome,
      p_username: username,
      p_ruolo: ruolo,
      p_famiglia_id: famigliaId,
    }
  );

  if (profiloError || !profilo) {
    /*
     * Se il profilo non può essere completato,
     * eliminiamo anche l'account Auth appena creato.
     */
    await supabaseAdmin.auth.admin.deleteUser(userId);

    throw new Error(
      profiloError?.message ??
        "Errore durante la configurazione del profilo."
    );
  }

  /*
   * 3. Audit Log.
   */
  const { error: auditError } = await supabase.rpc(
    "registra_audit",
    {
      p_azione: "creazione",
      p_tabella: "profiles",
      p_record_id: userId,
      p_dati_precedenti: null,
      p_dati_nuovi: profilo,
    }
  );

  if (auditError) {
    console.error(
      "Errore registrazione audit:",
      auditError
    );
  }

  revalidatePath("/protected/utenti");
  revalidatePath("/protected/soci");
  revalidatePath("/protected/famiglie");
}

export async function modificaUtente(formData: FormData) {
  const { supabase } = await verificaSuperAdmin();

  const utenteId = String(
    formData.get("utente_id") ?? ""
  );

  const nome = String(
    formData.get("nome") ?? ""
  ).trim();

  const cognome = String(
    formData.get("cognome") ?? ""
  ).trim();

  const username = String(
    formData.get("username") ?? ""
  ).trim();

  const ruolo = String(
    formData.get("ruolo") ?? ""
  );

  const famigliaIdRaw = String(
    formData.get("famiglia_id") ?? ""
  );

  const famigliaId = famigliaIdRaw || null;

  const attivo =
    String(formData.get("attivo") ?? "true") === "true";

  if (!utenteId) {
    throw new Error("Utente non specificato.");
  }

  if (!nome) {
    throw new Error("Il nome è obbligatorio.");
  }

  if (!cognome) {
    throw new Error("Il cognome è obbligatorio.");
  }

  if (!username) {
    throw new Error("Lo username è obbligatorio.");
  }

  if (!["socio", "direzione"].includes(ruolo)) {
    throw new Error(
      "Il ruolo può essere solo Socio o Direzione."
    );
  }

  /*
   * Leggiamo il profilo attuale.
   */
  const { data: utentePrima, error: letturaError } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", utenteId)
      .single();

  if (letturaError || !utentePrima) {
    throw new Error("Utente non trovato.");
  }

  /*
   * Il SuperAdmin non può essere modificato
   * attraverso questa funzione.
   */
  if (utentePrima.ruolo === "superadmin") {
    throw new Error(
      "Il profilo SuperAdmin non può essere modificato da questa schermata."
    );
  }

  /*
   * Non permettiamo di trasformare un utente
   * in SuperAdmin.
   */
  if (ruolo === "superadmin") {
    throw new Error(
      "Non è possibile assegnare il ruolo SuperAdmin."
    );
  }

  /*
   * Direzione non può avere una famiglia.
   */
  if (ruolo === "direzione" && famigliaId) {
    throw new Error(
      "Un utente Direzione non può essere associato a una famiglia."
    );
  }

  /*
   * Verifica famiglia.
   */
  if (famigliaId) {
    const { data: famiglia, error: famigliaError } =
      await supabase
        .from("famiglie")
        .select("id")
        .eq("id", famigliaId)
        .eq("attiva", true)
        .single();

    if (famigliaError || !famiglia) {
      throw new Error(
        "Famiglia non trovata o non attiva."
      );
    }
  }

  /*
   * Aggiornamento.
   */
  const { data: utenteDopo, error: updateError } =
    await supabase
      .from("profiles")
      .update({
        nome,
        cognome,
        username,
        ruolo,
        famiglia_id: famigliaId,
        attivo,
      })
      .eq("id", utenteId)
      .select("*")
      .single();

  if (updateError || !utenteDopo) {
    throw new Error(
      updateError?.message ??
        "Errore durante la modifica dell'utente."
    );
  }

  /*
   * Audit Log.
   */
  const { error: auditError } = await supabase.rpc(
    "registra_audit",
    {
      p_azione: "modifica",
      p_tabella: "profiles",
      p_record_id: utenteId,
      p_dati_precedenti: utentePrima,
      p_dati_nuovi: utenteDopo,
    }
  );

  if (auditError) {
    console.error(
      "Errore registrazione audit:",
      auditError
    );
  }

  revalidatePath("/protected/utenti");
  revalidatePath("/protected/soci");
  revalidatePath("/protected/famiglie");
  revalidatePath("/protected/mia-situazione");
}

export async function generaResetPassword(
  formData: FormData
) {
  const { supabase } = await verificaSuperAdmin();

  const utenteId = String(
    formData.get("utente_id") ?? ""
  );

  if (!utenteId) {
    throw new Error("Utente non specificato.");
  }

  const { data: utente, error: utenteError } =
    await supabase
      .from("profiles")
      .select("id, email, nome, cognome, ruolo")
      .eq("id", utenteId)
      .single();

  if (utenteError || !utente) {
    throw new Error("Utente non trovato.");
  }

  if (utente.ruolo === "superadmin") {
    throw new Error(
      "Non è possibile reimpostare la password del SuperAdmin da questa schermata."
    );
  }

  if (!utente.email) {
    throw new Error(
      "L'utente non ha un indirizzo email valido."
    );
  }

  const { data, error } =
    await supabase.auth.resetPasswordForEmail(
      utente.email,
      {
        redirectTo:
          `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/update-password`,
      }
    );

  if (error) {
    throw new Error(
      error.message ??
        "Errore durante la generazione del reset password."
    );
  }

  const { error: auditError } =
    await supabase.rpc("registra_audit", {
      p_azione: "reset_password",
      p_tabella: "profiles",
      p_record_id: utente.id,
      p_dati_precedenti: null,
      p_dati_nuovi: {
        email: utente.email,
      },
    });

  if (auditError) {
    console.error(
      "Errore registrazione audit:",
      auditError
    );
  }

  revalidatePath("/protected/utenti");

  return {
    success: true,
  };
}