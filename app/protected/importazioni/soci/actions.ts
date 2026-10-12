
"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RigaSocioCSV = {
  nome?: unknown;
  cognome?: unknown;
  username?: unknown;
  email?: unknown;
  famiglia?: unknown;
  attivo?: unknown;
};

export type EsitoImportazioneSoci = {
  success: boolean;
  create?: number;
  errori?: number;
  dettagli?: string[];
  error?: string;
};

function testo(value: unknown): string {
  return String(value ?? "").trim();
}

function emailValida(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function statoValido(value: unknown): boolean {
  return ["true", "false", "si", "sì", "no", "1", "0"].includes(
    testo(value).toLowerCase()
  );
}

export async function importaSoci(
  formData: FormData
): Promise<EsitoImportazioneSoci> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Devi effettuare l'accesso." };
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
    return {
      success: false,
      error: "Operazione consentita solo al SuperAdmin attivo.",
    };
  }

  const contenuto = String(formData.get("soci_json") ?? "");

  if (!contenuto || contenuto.length > 2_000_000) {
    return {
      success: false,
      error: "Il contenuto è vuoto o supera il limite consentito.",
    };
  }

  let righe: unknown;

  try {
    righe = JSON.parse(contenuto);
  } catch {
    return { success: false, error: "Il contenuto JSON non è valido." };
  }

  if (!Array.isArray(righe) || righe.length === 0 || righe.length > 500) {
    return {
      success: false,
      error: "Sono consentite da 1 a 500 righe per importazione.",
    };
  }

  const admin = createAdminClient();

  const { data: famiglie, error: famiglieError } = await supabase
    .from("famiglie")
    .select("id, nome, attiva");

  if (famiglieError || !famiglie) {
    return {
      success: false,
      error: "Impossibile leggere l'elenco delle famiglie.",
    };
  }

  const famigliePerNome = new Map<string, { id: string; attiva: boolean }>();

  for (const famiglia of famiglie) {
    const chiave = testo(famiglia.nome).toLocaleLowerCase("it");
    famigliePerNome.set(chiave, {
      id: famiglia.id,
      attiva: famiglia.attiva,
    });
  }

  const { data: profiliEsistenti, error: profiliError } = await supabase
    .from("profiles")
    .select("username, email");

  if (profiliError || !profiliEsistenti) {
    return {
      success: false,
      error: "Impossibile controllare gli utenti già presenti.",
    };
  }

  const usernamesEsistenti = new Set(
    profiliEsistenti
      .map((p) => testo(p.username).toLocaleLowerCase("it"))
      .filter(Boolean)
  );

  const emailEsistenti = new Set(
    profiliEsistenti
      .map((p) => testo(p.email).toLocaleLowerCase("it"))
      .filter(Boolean)
  );

  const usernamesCSV = new Set<string>();
  const emailCSV = new Set<string>();
  const dettagli: string[] = [];

  const righeValide: Array<{
    riga: number;
    nome: string;
    cognome: string;
    username: string;
    email: string;
    famigliaId: string;
  }> = [];

  for (let i = 0; i < righe.length; i++) {
    const r = righe[i] as RigaSocioCSV;
    const numeroRiga = i + 2;

    const nome = testo(r.nome);
    const cognome = testo(r.cognome);
    const username = testo(r.username);
    const email = testo(r.email).toLowerCase();
    const nomeFamiglia = testo(r.famiglia);
    const attivo = testo(r.attivo).toLowerCase();

    const erroriRiga: string[] = [];

    if (!nome || !cognome || !username || !email || !nomeFamiglia) {
      erroriRiga.push("manca un campo obbligatorio");
    }

    if (!emailValida(email)) {
      erroriRiga.push("email non valida");
    }

    if (attivo && !statoValido(attivo)) {
      erroriRiga.push("valore attivo non valido");
    }

    if (attivo && ["false", "no", "0"].includes(attivo)) {
      erroriRiga.push(
        "i nuovi account vengono importati attivi; disattivali dopo l'importazione"
      );
    }

    const chiaveUsername = username.toLocaleLowerCase("it");
    const chiaveEmail = email.toLocaleLowerCase("it");

    if (chiaveUsername && usernamesEsistenti.has(chiaveUsername)) {
      erroriRiga.push("username già presente");
    }

    if (chiaveEmail && emailEsistenti.has(chiaveEmail)) {
      erroriRiga.push("email già presente");
    }

    if (chiaveUsername && usernamesCSV.has(chiaveUsername)) {
      erroriRiga.push("username duplicato nel CSV");
    }

    if (chiaveEmail && emailCSV.has(chiaveEmail)) {
      erroriRiga.push("email duplicata nel CSV");
    }

    const famiglia = famigliePerNome.get(
      nomeFamiglia.toLocaleLowerCase("it")
    );

    if (!famiglia) {
      erroriRiga.push("famiglia non trovata");
    } else if (!famiglia.attiva) {
      erroriRiga.push("famiglia disattivata");
    }

    if (erroriRiga.length > 0) {
      dettagli.push(`Riga ${numeroRiga}: ${erroriRiga.join(", ")}.`);
      continue;
    }

    usernamesCSV.add(chiaveUsername);
    emailCSV.add(chiaveEmail);

    righeValide.push({
      riga: numeroRiga,
      nome,
      cognome,
      username,
      email,
      famigliaId: famiglia!.id,
    });
  }

  // Se ci sono errori di validazione, non creiamo account parzialmente.
  if (dettagli.length > 0) {
    return {
      success: false,
      create: 0,
      errori: dettagli.length,
      dettagli,
      error: "Correggi gli errori indicati e ripeti l'importazione.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!baseUrl) {
    return {
      success: false,
      error: "Configura NEXT_PUBLIC_SITE_URL prima dell'importazione.",
    };
  }

  let create = 0;

  for (const r of righeValide) {
    const passwordTemporanea = randomBytes(32).toString("base64url");

    const { data: creato, error: erroreCreazione } =
      await admin.auth.admin.createUser({
        email: r.email,
        password: passwordTemporanea,
        email_confirm: true,
        user_metadata: {
          nome: r.nome,
          cognome: r.cognome,
        },
      });

    if (erroreCreazione || !creato.user) {
      dettagli.push(
        `Riga ${r.riga}: creazione account non riuscita (${erroreCreazione?.message ?? "errore sconosciuto"}).`
      );
      continue;
    }

    const userId = creato.user.id;

    const { error: erroreProfilo } = await supabase.rpc(
      "configura_profilo_nuovo_utente",
      {
        p_user_id: userId,
        p_nome: r.nome,
        p_cognome: r.cognome,
        p_username: r.username,
        p_ruolo: "socio",
        p_famiglia_id: r.famigliaId,
      }
    );

    if (erroreProfilo) {
      await admin.auth.admin.deleteUser(userId);
      dettagli.push(
        `Riga ${r.riga}: configurazione profilo non riuscita; account annullato.`
      );
      continue;
    }

    const { error: erroreEmail } = await supabase.auth.resetPasswordForEmail(
      r.email,
      {
        redirectTo: `${baseUrl}/auth/update-password`,
      }
    );

    if (erroreEmail) {
    console.error("Errore invio email importazione socio:", {
        message: erroreEmail.message,
        status: erroreEmail.status,
        name: erroreEmail.name,
    });

    const { error: erroreEliminazione } =
        await admin.auth.admin.deleteUser(userId);

    if (erroreEliminazione) {
        console.error(
        "Attenzione: impossibile eliminare l'account dopo il fallimento dell'email:",
        erroreEliminazione.message
        );
    }

    dettagli.push(
        `Riga ${r.riga}: invio email non riuscito; controlla il terminale del server.`
    );
    continue;
    }

    usernamesEsistenti.add(r.username.toLocaleLowerCase("it"));
    emailEsistenti.add(r.email.toLocaleLowerCase("it"));
    create++;
  }

  await supabase.rpc("registra_audit", {
    p_azione: "importazione_csv",
    p_tabella: "profiles",
    p_record_id: null,
    p_dati_precedenti: null,
    p_dati_nuovi: {
      creati: create,
      errori: dettagli.length,
    },
  });

  revalidatePath("/protected/utenti");
  revalidatePath("/protected/soci");
  revalidatePath("/protected/famiglie");

  return {
    success: dettagli.length === 0,
    create,
    errori: dettagli.length,
    dettagli,
    error:
      dettagli.length > 0
        ? "Importazione completata con alcune righe non importate. Controlla i dettagli."
        : undefined,
  };
}