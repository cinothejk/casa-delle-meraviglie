"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verificaGestione() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utente non autenticato.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("ruolo")
    .eq("id", user.id)
    .single();

  if (
    error ||
    !profile ||
    (profile.ruolo !== "superadmin" && profile.ruolo !== "direzione")
  ) {
    throw new Error("Non autorizzato.");
  }

  return supabase;
}

export async function creaAttivita(formData: FormData) {
  const supabase = await verificaGestione();

  const titolo = String(formData.get("titolo") ?? "").trim();
  const descrizione = String(formData.get("descrizione") ?? "").trim();
  const cerchioId = String(formData.get("cerchio_id") ?? "");
  const luogo = String(formData.get("luogo") ?? "").trim();

  if (!titolo) {
    throw new Error("Il titolo dell'attività è obbligatorio.");
  }

  if (!cerchioId) {
    throw new Error("Il cerchio è obbligatorio.");
  }

  const { data: nuovaAttivita, error } = await supabase
    .from("attivita")
    .insert({
      titolo,
      descrizione: descrizione || null,
      cerchio_id: cerchioId,
      luogo: luogo || null,
      stato: "bozza",
    })
    .select()
    .single();

  if (error || !nuovaAttivita) {
    throw new Error(error?.message ?? "Errore nella creazione dell'attività.");
  }

  // Registriamo la creazione nell'Audit Log.
  const { error: auditError } = await supabase.rpc("registra_audit", {
    p_azione: "creazione",
    p_tabella: "attivita",
    p_record_id: nuovaAttivita.id,
    p_dati_precedenti: null,
    p_dati_nuovi: nuovaAttivita,
  });

  if (auditError) {
    console.error("Errore registrazione audit:", auditError);
  }

  revalidatePath("/protected/attivita");
}

export async function modificaAttivita(formData: FormData) {
  const supabase = await verificaGestione();

  const id = String(formData.get("id") ?? "");
  const titolo = String(formData.get("titolo") ?? "").trim();
  const descrizione = String(formData.get("descrizione") ?? "").trim();
  const cerchioId = String(formData.get("cerchio_id") ?? "");
  const luogo = String(formData.get("luogo") ?? "").trim();
  const stato = String(formData.get("stato") ?? "bozza");

  if (!id) {
    throw new Error("Attività non specificata.");
  }

  if (!titolo) {
    throw new Error("Il titolo dell'attività è obbligatorio.");
  }

  if (!cerchioId) {
    throw new Error("Il cerchio è obbligatorio.");
  }

  const statiValidi = [
    "bozza",
    "pubblicata",
    "chiusa",
    "annullata",
  ];

  if (!statiValidi.includes(stato)) {
    throw new Error("Stato dell'attività non valido.");
  }

  // Leggiamo i dati attuali prima della modifica.
  const { data: attivitaPrima, error: primaError } = await supabase
    .from("attivita")
    .select("*")
    .eq("id", id)
    .single();

  if (primaError || !attivitaPrima) {
    throw new Error("Attività non trovata.");
  }

  // Eseguiamo la modifica e recuperiamo il record aggiornato.
  const { data: attivitaDopo, error: updateError } = await supabase
    .from("attivita")
    .update({
      titolo,
      descrizione: descrizione || null,
      cerchio_id: cerchioId,
      luogo: luogo || null,
      stato,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError || !attivitaDopo) {
    throw new Error(
      updateError?.message ?? "Errore durante la modifica dell'attività."
    );
  }

  // Registriamo la modifica nell'Audit Log.
  const { error: auditError } = await supabase.rpc("registra_audit", {
    p_azione: "modifica",
    p_tabella: "attivita",
    p_record_id: id,
    p_dati_precedenti: attivitaPrima,
    p_dati_nuovi: attivitaDopo,
  });

  if (auditError) {
    console.error("Errore registrazione audit:", auditError);
  }

  revalidatePath("/protected/attivita");
}

export async function aggiornaStatoPartecipazione(
  formData: FormData
) {
  const supabase = await verificaGestione();

  const partecipazioneId = String(
    formData.get("partecipazione_id") ?? ""
  );

  const nuovoStato = String(
    formData.get("stato") ?? ""
  );

  if (!partecipazioneId) {
    throw new Error("Partecipazione non specificata.");
  }

  const statiValidi = [
    "candidato",
    "in_corso",
    "completata",
    "approvata",
    "rifiutata",
  ];

  if (!statiValidi.includes(nuovoStato)) {
    throw new Error("Stato della partecipazione non valido.");
  }

  const { error } = await supabase
    .from("partecipazioni")
    .update({
      stato: nuovoStato,
    })
    .eq("id", partecipazioneId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected/attivita");
}

export async function candidatiAttivita(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utente non autenticato.");
  }

  const attivitaId = String(
    formData.get("attivita_id") ?? ""
  );

  if (!attivitaId) {
    throw new Error("Attività non specificata.");
  }

  // Recuperiamo il profilo dell'utente
  const { data: profilo, error: profiloError } = await supabase
    .from("profiles")
    .select("id, ruolo, attivo")
    .eq("id", user.id)
    .single();

  if (profiloError || !profilo) {
    throw new Error("Profilo utente non trovato.");
  }

  if (profilo.ruolo !== "socio") {
    throw new Error(
      "Solo un socio può candidarsi a un'attività."
    );
  }

  if (!profilo.attivo) {
    throw new Error("Il tuo profilo non è attivo.");
  }

  // Verifichiamo che l'attività sia pubblicata
  const { data: attivita, error: attivitaError } =
    await supabase
      .from("attivita")
      .select("id, stato")
      .eq("id", attivitaId)
      .single();

  if (attivitaError || !attivita) {
    throw new Error("Attività non trovata.");
  }

  if (attivita.stato !== "pubblicata") {
    throw new Error(
      "Questa attività non è attualmente disponibile."
    );
  }

  // Verifichiamo che non esista già una partecipazione
  const { data: esistente, error: esistenteError } =
    await supabase
      .from("partecipazioni")
      .select("id, stato")
      .eq("attivita_id", attivitaId)
      .eq("socio_id", user.id)
      .maybeSingle();

  if (esistenteError) {
    throw new Error(esistenteError.message);
  }

  if (esistente) {
    throw new Error(
      "Ti sei già candidato a questa attività."
    );
  }

  // Creiamo la candidatura e recuperiamo il record creato.
  const { data: nuovaPartecipazione, error: inserimentoError } =
    await supabase
      .from("partecipazioni")
      .insert({
        attivita_id: attivitaId,
        socio_id: user.id,
        stato: "candidato",
      })
      .select("*")
      .single();

  if (inserimentoError || !nuovaPartecipazione) {
    throw new Error(
      inserimentoError?.message ??
        "Errore nella creazione della candidatura."
    );
  }

  // Registriamo la candidatura nell'Audit Log.
  const { error: auditError } = await supabase.rpc(
    "registra_audit",
    {
      p_azione: "candidatura",
      p_tabella: "partecipazioni",
      p_record_id: nuovaPartecipazione.id,
      p_dati_precedenti: null,
      p_dati_nuovi: nuovaPartecipazione,
    }
  );

  if (auditError) {
    console.error(
      "Errore registrazione audit:",
      auditError
    );
  }

  revalidatePath("/protected/attivita");
}

export async function iniziaPartecipazione(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utente non autenticato.");
  }

  const partecipazioneId = String(
    formData.get("partecipazione_id") ?? ""
  );

  if (!partecipazioneId) {
    throw new Error("Partecipazione non specificata.");
  }

  // Recuperiamo la partecipazione
  const { data: partecipazione, error: partecipazioneError } =
    await supabase
      .from("partecipazioni")
      .select(`
        id,
        socio_id,
        stato,
        attivita_id,
        attivita (
          id,
          stato
        )
      `)
      .eq("id", partecipazioneId)
      .single();

  if (partecipazioneError || !partecipazione) {
    throw new Error("Partecipazione non trovata.");
  }

  // La partecipazione deve appartenere all'utente loggato
  if (partecipazione.socio_id !== user.id) {
    throw new Error(
      "Non puoi modificare la partecipazione di un altro socio."
    );
  }

  // Deve essere ancora una candidatura
  if (partecipazione.stato !== "candidato") {
    throw new Error(
      "Questa partecipazione non è più in stato di candidatura."
    );
  }

  // L'attività deve essere pubblicata
  const attivita = Array.isArray(partecipazione.attivita)
    ? partecipazione.attivita[0]
    : partecipazione.attivita;

  if (!attivita || attivita.stato !== "pubblicata") {
    throw new Error(
      "Questa attività non è più disponibile."
    );
  }

  const { error } = await supabase
    .from("partecipazioni")
    .update({
      stato: "in_corso",
    })
    .eq("id", partecipazioneId)
    .eq("socio_id", user.id)
    .eq("stato", "candidato");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected/attivita");
}

export async function aggiornaLavoroPartecipazione(
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utente non autenticato.");
  }

  const partecipazioneId = String(
    formData.get("partecipazione_id") ?? ""
  );

  const dataLavoro = String(
    formData.get("data_lavoro") ?? ""
  );

  const ore = String(
    formData.get("ore") ?? ""
  );

  const noteSocio = String(
    formData.get("note_socio") ?? ""
  );

  if (!partecipazioneId) {
    throw new Error("Partecipazione non specificata.");
  }

  if (!dataLavoro) {
    throw new Error(
      "La data del lavoro è obbligatoria."
    );
  }

  const oreNumero = Number(ore);

  if (
    !Number.isInteger(oreNumero) ||
    oreNumero < 1 ||
    oreNumero > 14
  ) {
    throw new Error(
      "Le ore devono essere espresse in mezze ore, da 0,5 a 7 ore."
    );
  }

  // Recuperiamo la partecipazione
  const { data: partecipazione, error: partecipazioneError } =
    await supabase
      .from("partecipazioni")
      .select(`
        id,
        socio_id,
        stato
      `)
      .eq("id", partecipazioneId)
      .single();

  if (partecipazioneError || !partecipazione) {
    throw new Error("Partecipazione non trovata.");
  }

  // Il socio può modificare solamente la propria partecipazione
  if (partecipazione.socio_id !== user.id) {
    throw new Error(
      "Non puoi modificare la partecipazione di un altro socio."
    );
  }

  // Per questo passaggio deve essere in corso
  if (partecipazione.stato !== "in_corso") {
    throw new Error(
      "Puoi registrare il lavoro solo per un'attività in corso."
    );
  }

  // Verifica che la data sia valida
  const data = new Date(`${dataLavoro}T00:00:00`);

  if (Number.isNaN(data.getTime())) {
    throw new Error("La data del lavoro non è valida.");
  }

  // Salvataggio
  const { error } = await supabase
    .from("partecipazioni")
    .update({
      data_lavoro: dataLavoro,
      ore_effettive_mezzore: oreNumero,
      note_socio: noteSocio || null,
    })
    .eq("id", partecipazioneId)
    .eq("socio_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected/attivita");
}

export async function chiudiPartecipazione(
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utente non autenticato.");
  }

  const partecipazioneId = String(
    formData.get("partecipazione_id") ?? ""
  );

  if (!partecipazioneId) {
    throw new Error("Partecipazione non specificata.");
  }

  // Recuperiamo la partecipazione prima della modifica.
  const { data: partecipazione, error: partecipazioneError } =
    await supabase
      .from("partecipazioni")
      .select(`
        id,
        socio_id,
        stato,
        data_lavoro,
        ore_effettive_mezzore
      `)
      .eq("id", partecipazioneId)
      .single();

  if (partecipazioneError || !partecipazione) {
    throw new Error("Partecipazione non trovata.");
  }

  // Sicurezza: deve essere la partecipazione del socio loggato.
  if (partecipazione.socio_id !== user.id) {
    throw new Error(
      "Non puoi chiudere la partecipazione di un altro socio."
    );
  }

  // Deve essere ancora in corso.
  if (partecipazione.stato !== "in_corso") {
    throw new Error(
      "Puoi chiudere solo una partecipazione in corso."
    );
  }

  // Prima di chiudere devono essere presenti data e ore.
  if (!partecipazione.data_lavoro) {
    throw new Error(
      "Inserisci prima la data del lavoro."
    );
  }

  if (
    partecipazione.ore_effettive_mezzore === null ||
    partecipazione.ore_effettive_mezzore <= 0
  ) {
    throw new Error(
      "Inserisci prima le ore effettuate."
    );
  }

  // Eseguiamo la chiusura e recuperiamo il record aggiornato.
  const { data: partecipazioneDopo, error: updateError } =
    await supabase
      .from("partecipazioni")
      .update({
        stato: "completata",
        data_completamento: new Date().toISOString(),
      })
      .eq("id", partecipazioneId)
      .eq("socio_id", user.id)
      .eq("stato", "in_corso")
      .select("*")
      .single();

  if (updateError || !partecipazioneDopo) {
    throw new Error(
      updateError?.message ??
        "Errore durante la chiusura della partecipazione."
    );
  }

  // Registriamo il completamento nell'Audit Log.
  const { error: auditError } = await supabase.rpc(
    "registra_audit",
    {
      p_azione: "completamento",
      p_tabella: "partecipazioni",
      p_record_id: partecipazioneId,
      p_dati_precedenti: partecipazione,
      p_dati_nuovi: partecipazioneDopo,
    }
  );

  if (auditError) {
    console.error(
      "Errore registrazione audit:",
      auditError
    );
  }

  revalidatePath("/protected/attivita");
}

export async function approvaPartecipazione(
  formData: FormData
) {
  const supabase = await verificaGestione();

  const partecipazioneId = String(
    formData.get("partecipazione_id") ?? ""
  );

  if (!partecipazioneId) {
    throw new Error("Partecipazione non specificata.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utente non autenticato.");
  }

  // Recuperiamo la partecipazione prima dell'approvazione.
  const { data: partecipazione, error: letturaError } =
    await supabase
      .from("partecipazioni")
      .select(`
        id,
        stato,
        data_lavoro,
        ore_effettive_mezzore
      `)
      .eq("id", partecipazioneId)
      .single();

  if (letturaError || !partecipazione) {
    throw new Error("Partecipazione non trovata.");
  }

  if (partecipazione.stato !== "completata") {
    throw new Error(
      "È possibile approvare solo una partecipazione completata."
    );
  }

  if (!partecipazione.data_lavoro) {
    throw new Error(
      "La partecipazione non contiene la data del lavoro."
    );
  }

  if (
    partecipazione.ore_effettive_mezzore === null ||
    partecipazione.ore_effettive_mezzore <= 0
  ) {
    throw new Error(
      "La partecipazione non contiene ore valide."
    );
  }

  // Approvazione.
  const { data: partecipazioneDopo, error: updateError } =
    await supabase
      .from("partecipazioni")
      .update({
        stato: "approvata",
        approvato_da: user.id,
        approvato_il: new Date().toISOString(),
      })
      .eq("id", partecipazioneId)
      .eq("stato", "completata")
      .select("*")
      .single();

  if (updateError || !partecipazioneDopo) {
    throw new Error(
      updateError?.message ??
        "Errore durante l'approvazione della partecipazione."
    );
  }

  // Registriamo l'approvazione nell'Audit Log.
  const { error: auditError } = await supabase.rpc(
    "registra_audit",
    {
      p_azione: "approvazione",
      p_tabella: "partecipazioni",
      p_record_id: partecipazioneId,
      p_dati_precedenti: partecipazione,
      p_dati_nuovi: partecipazioneDopo,
    }
  );

  if (auditError) {
    console.error(
      "Errore registrazione audit:",
      auditError
    );
  }

  revalidatePath("/protected/attivita");
}

export async function rifiutaPartecipazione(
  formData: FormData
) {
  const supabase = await verificaGestione();

  const partecipazioneId = String(
    formData.get("partecipazione_id") ?? ""
  );

  const noteDirezione = String(
    formData.get("note_direzione") ?? ""
  ).trim();

  if (!partecipazioneId) {
    throw new Error("Partecipazione non specificata.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utente non autenticato.");
  }

  // Recuperiamo la partecipazione prima del rifiuto.
  const { data: partecipazione, error: letturaError } =
    await supabase
      .from("partecipazioni")
      .select("*")
      .eq("id", partecipazioneId)
      .single();

  if (letturaError || !partecipazione) {
    throw new Error("Partecipazione non trovata.");
  }

  if (partecipazione.stato !== "completata") {
    throw new Error(
      "È possibile rifiutare solo una partecipazione completata."
    );
  }

  // Rifiutiamo la partecipazione e recuperiamo il record aggiornato.
  const {
    data: partecipazioneDopo,
    error: updateError,
  } = await supabase
    .from("partecipazioni")
    .update({
      stato: "rifiutata",
      note_direzione: noteDirezione || null,
    })
    .eq("id", partecipazioneId)
    .eq("stato", "completata")
    .select("*")
    .single();

  if (updateError || !partecipazioneDopo) {
    throw new Error(
      updateError?.message ??
        "Errore durante il rifiuto della partecipazione."
    );
  }

  // Registriamo il rifiuto nell'Audit Log.
  const { error: auditError } = await supabase.rpc(
    "registra_audit",
    {
      p_azione: "rifiuto",
      p_tabella: "partecipazioni",
      p_record_id: partecipazioneId,
      p_dati_precedenti: partecipazione,
      p_dati_nuovi: partecipazioneDopo,
    }
  );

  if (auditError) {
    console.error(
      "Errore registrazione audit:",
      auditError
    );
  }

  revalidatePath("/protected/attivita");
}


export async function cambiaStatoAttivitaRapido(
  formData: FormData
) {
  const supabase = await verificaGestione();

  const id = String(formData.get("id") ?? "");
  const nuovoStato = String(formData.get("stato") ?? "");

  if (!id) {
    throw new Error("Attività non specificata.");
  }

  const { data: attivitaPrima, error: letturaError } =
    await supabase
      .from("attivita")
      .select("*")
      .eq("id", id)
      .single();

  if (letturaError || !attivitaPrima) {
    throw new Error("Attività non trovata.");
  }

  const statoAttuale = attivitaPrima.stato;

  const transizioniValide: Record<string, string[]> = {
    bozza: ["pubblicata", "annullata"],
    annullata: ["chiusa", "bozza"],
    pubblicata: ["chiusa"],
  };

  if (!transizioniValide[statoAttuale]?.includes(nuovoStato)) {
    throw new Error(
      "Passaggio di stato non consentito."
    );
  }

  // Non chiudere un'attività con partecipazioni
  // completate ancora in attesa di approvazione.
  if (
    statoAttuale === "pubblicata" &&
    nuovoStato === "chiusa"
  ) {
    const { data: inAttesa, error: partecipazioniError } =
      await supabase
        .from("partecipazioni")
        .select("id")
        .eq("attivita_id", id)
        .eq("stato", "completata")
        .limit(1);

    if (partecipazioniError) {
      throw new Error(
        "Impossibile verificare le approvazioni delle partecipazioni."
      );
    }

    if (inAttesa && inAttesa.length > 0) {
      throw new Error(
        "Non puoi chiudere l'attività: ci sono partecipazioni da approvare."
      );
    }
  }

  const { data: attivitaDopo, error: updateError } =
    await supabase
      .from("attivita")
      .update({ stato: nuovoStato })
      .eq("id", id)
      .eq("stato", statoAttuale)
      .select("*")
      .single();

  if (updateError || !attivitaDopo) {
    throw new Error(
      updateError?.message ??
        "L'attività è stata modificata da un altro utente. Aggiorna la pagina."
    );
  }

  const { error: auditError } = await supabase.rpc(
    "registra_audit",
    {
      p_azione: "modifica",
      p_tabella: "attivita",
      p_record_id: id,
      p_dati_precedenti: attivitaPrima,
      p_dati_nuovi: attivitaDopo,
    }
  );

  if (auditError) {
    console.error("Errore registrazione audit:", auditError);
  }

  revalidatePath("/protected/attivita");
}
