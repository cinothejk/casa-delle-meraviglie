"use server";

import { createClient } from "@/lib/supabase/server";

export type EsitoImportazione = {
  success: boolean;
  inserite?: number;
  duplicate?: number;
  non_valide?: number;
  error?: string;
};

export async function importaFamiglie(
  formData: FormData
): Promise<EsitoImportazione> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Devi effettuare l'accesso.",
    };
  }

  const { data: profilo, error: profiloError } =
    await supabase
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

  const contenuto = String(
    formData.get("famiglie_json") ?? ""
  );

  if (!contenuto || contenuto.length > 2_000_000) {
    return {
      success: false,
      error: "Il contenuto è vuoto o supera il limite consentito.",
    };
  }

  let famiglie: unknown;

  try {
    famiglie = JSON.parse(contenuto);
  } catch {
    return {
      success: false,
      error: "Il contenuto del CSV non è valido.",
    };
  }

  if (!Array.isArray(famiglie)) {
    return {
      success: false,
      error: "Il formato dei dati non è valido.",
    };
  }

  if (famiglie.length === 0 || famiglie.length > 5000) {
    return {
      success: false,
      error: "Sono consentite da 1 a 5000 righe per importazione.",
    };
  }

  const { data, error } = await supabase.rpc(
    "importa_famiglie_csv",
    {
      p_famiglie: famiglie,
    }
  );

  if (error) {
    console.error("Errore importazione famiglie:", error);

    return {
      success: false,
      error: "Importazione non riuscita. Controlla i log del server.",
    };
  }

  return {
    success: true,
    inserite: Number(data?.inserite ?? 0),
    duplicate: Number(data?.duplicate ?? 0),
    non_valide: Number(data?.non_valide ?? 0),
  };
}