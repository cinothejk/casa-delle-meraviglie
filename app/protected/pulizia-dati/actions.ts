
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function verificaSuperadmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Devi effettuare l'accesso.");
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
    throw new Error("Non sei autorizzato a eseguire questa operazione.");
  }

  return { supabase, user };
}


export async function eliminaAttivitaPulizia(id: string) {
  const { supabase } = await verificaSuperadmin();

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw new Error("ID attività non valido.");
  }

  const { error } = await supabase.rpc(
    "elimina_attivita_con_audit",
    {
      p_attivita_id: id,
    }
  );

  if (error) {
    console.error("Errore eliminazione attività:", error);
    throw new Error(
      error.message || "Errore durante l'eliminazione dell'attività."
    );
  }

  revalidatePath("/protected/attivita");
  revalidatePath("/protected/pulizia-dati");
  revalidatePath("/protected/audit");

  return { success: true };
}


export async function eliminaUtentePulizia(id: string) {
  const { supabase, user } = await verificaSuperadmin();

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw new Error("ID utente non valido.");
  }

  if (id === user.id) {
    throw new Error("Non puoi eliminare il tuo account.");
  }

  const admin = createAdminClient();

  const { data: profilo, error: letturaError } = await admin
    .from("profiles")
    .select("id, nome, cognome, username, email, ruolo, attivo, famiglia_id")
    .eq("id", id)
    .maybeSingle();

  if (letturaError || !profilo) {
    throw new Error("Utente non trovato.");
  }

  // Verifica i report: la chiave esterna usa ON DELETE RESTRICT.
  const { count: reportCount, error: reportError } = await admin
    .from("report_mensili_soci")
    .select("socio_id", { count: "exact", head: true })
    .eq("socio_id", id);

  if (reportError) {
    throw new Error(
      "Impossibile verificare i report collegati all'utente."
    );
  }

  if ((reportCount ?? 0) > 0) {
    return {
      success: false as const,
      error:
        "Questo utente è presente nei report mensili. Non è possibile eliminarlo senza una procedura specifica.",
    };
  }

  // Registra il tentativo prima di chiamare l'API Auth.
  const { data: auditId, error: auditError } = await supabase.rpc(
    "registra_audit",
    {
      p_azione: "eliminazione_avviata",
      p_tabella: "profiles",
      p_record_id: profilo.id,
      p_dati_precedenti: profilo,
      p_dati_nuovi: null,
    }
  );

  if (auditError) {
    console.error("Errore audit eliminazione utente:", auditError);
    throw new Error(
      "Impossibile registrare l'operazione nell'Audit Log."
    );
  }

  // L'API Auth elimina anche il profilo grazie a ON DELETE CASCADE.
  const { error: authDeleteError } =
    await admin.auth.admin.deleteUser(id);

  if (authDeleteError) {
    console.error("Errore eliminazione account Auth:", authDeleteError);

    const { error: esitoAuditError } = await supabase.rpc(
      "registra_audit",
      {
        p_azione: "eliminazione_fallita",
        p_tabella: "profiles",
        p_record_id: profilo.id,
        p_dati_precedenti: {
          ...profilo,
          audit_tentativo_id: auditId ?? null,
          errore: authDeleteError.message,
        },
        p_dati_nuovi: null,
      }
    );

    if (esitoAuditError) {
      console.error(
        "Errore registrazione esito fallito:",
        esitoAuditError
      );
    }

    throw new Error(
      esitoAuditError
        ? "Eliminazione non riuscita. Anche la registrazione dell'esito nell'Audit Log è fallita: verifica il log prima di riprovare."
        : "Eliminazione non riuscita. Il tentativo e il relativo errore sono stati registrati nell'Audit Log."
    );
  }

  // Aggiorna le pagine interessate.
  revalidatePath("/protected/utenti");
  revalidatePath("/protected/pulizia-dati");
  revalidatePath("/protected/audit");
  revalidatePath("/protected/attivita");

  return { success: true as const };
}


export async function eliminaFamigliaPulizia(id: string) {
  const { supabase } = await verificaSuperadmin();

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw new Error("ID famiglia non valido.");
  }

  const admin = createAdminClient();

  const { data: famiglia, error: letturaError } = await admin
    .from("famiglie")
    .select("id, nome, codice, note, attiva, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (letturaError || !famiglia) {
    throw new Error("Famiglia non trovata.");
  }

  // I report mensili devono essere conservati.
  const { count: reportCount, error: reportError } = await admin
    .from("report_mensili")
    .select("famiglia_id", { count: "exact", head: true })
    .eq("famiglia_id", id);

  if (reportError) {
    throw new Error(
      "Impossibile verificare i report collegati alla famiglia."
    );
  }

  if ((reportCount ?? 0) > 0) {
    return {
      success: false as const,
      error:
        "Questa famiglia è presente nei report mensili. Non è possibile eliminarla.",
    };
  }

  // Registra il tentativo prima della cancellazione.
  const { data: auditId, error: auditError } = await supabase.rpc(
    "registra_audit",
    {
      p_azione: "eliminazione_avviata",
      p_tabella: "famiglie",
      p_record_id: famiglia.id,
      p_dati_precedenti: famiglia,
      p_dati_nuovi: null,
    }
  );

  if (auditError) {
    console.error("Errore audit eliminazione famiglia:", auditError);

    throw new Error(
      "Impossibile registrare l'operazione nell'Audit Log."
    );
  }

  // La FK profiles.famiglia_id usa ON DELETE SET NULL.
  // La FK report_mensili.famiglia_id usa ON DELETE RESTRICT.
  const { error: eliminazioneError } = await admin
    .from("famiglie")
    .delete()
    .eq("id", id);

  if (eliminazioneError) {
    console.error("Errore eliminazione famiglia:", eliminazioneError);

    // Registra l'esito negativo senza nascondere l'errore originale.
    const { error: esitoAuditError } = await supabase.rpc(
      "registra_audit",
      {
        p_azione: "eliminazione_fallita",
        p_tabella: "famiglie",
        p_record_id: famiglia.id,
        p_dati_precedenti: {
          ...famiglia,
          audit_tentativo_id: auditId ?? null,
          errore: eliminazioneError.message,
        },
        p_dati_nuovi: null,
      }
    );

    if (esitoAuditError) {
      console.error(
        "Errore registrazione esito fallito:",
        esitoAuditError
      );
    }

    // Gestisce anche il caso in cui un report sia stato creato
    // tra il controllo preventivo e la cancellazione.
    if (
      eliminazioneError.code === "23503" ||
      eliminazioneError.code === "23001"
    ) {
      return {
        success: false as const,
        error:
          "Non è possibile eliminare questa famiglia perché è utilizzata da dati collegati, ad esempio report mensili.",
      };
    }

    throw new Error(
      esitoAuditError
        ? "Eliminazione non riuscita. Anche la registrazione dell'esito nell'Audit Log è fallita: verifica il log prima di riprovare."
        : "Eliminazione non riuscita. Il tentativo e il relativo errore sono stati registrati nell'Audit Log."
    );
  }

  revalidatePath("/protected/pulizia-dati");
  revalidatePath("/protected/audit");

  return { success: true as const };
}
