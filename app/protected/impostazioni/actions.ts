"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function verificaSuperAdmin() {
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

  if (
    error ||
    !profilo ||
    !profilo.attivo ||
    profilo.ruolo !== "superadmin"
  ) {
    throw new Error("Non autorizzato");
  }

  return supabase;
}

export async function aggiornaImpostazioni(formData: FormData) {
  const supabase = await verificaSuperAdmin();

  const oreMassime = Number(
    formData.get("ore_massime")
  );

  const valoreOraEuro = Number(
    formData.get("valore_ora")
  );

  const creditoMassimoEuro = Number(
    formData.get("credito_massimo")
  );

  if (
    !Number.isFinite(oreMassime) ||
    !Number.isFinite(valoreOraEuro) ||
    !Number.isFinite(creditoMassimoEuro)
  ) {
    throw new Error("Valori non validi");
  }

  if (oreMassime <= 0 || oreMassime > 24) {
    throw new Error(
      "Il limite mensile deve essere compreso tra 0 e 24 ore"
    );
  }

  if (oreMassime * 2 !== Math.round(oreMassime * 2)) {
    throw new Error(
      "Le ore devono essere intere o mezze ore"
    );
  }

  if (valoreOraEuro <= 0 || valoreOraEuro > 1000) {
    throw new Error(
      "Il valore dell'ora non è valido"
    );
  }

  if (
    creditoMassimoEuro <= 0 ||
    creditoMassimoEuro > 10000
  ) {
    throw new Error(
      "Il credito massimo non è valido"
    );
  }

  const oreMassimeMezzore = Math.round(
    oreMassime * 2
  );

  const valoreOraCentesimi = Math.round(
    valoreOraEuro * 100
  );

  const creditoMassimoCentesimi = Math.round(
    creditoMassimoEuro * 100
  );

  const { data: impostazione } = await supabase
    .from("impostazioni")
    .select("id")
    .order("id")
    .limit(1)
    .single();

  if (!impostazione) {
    throw new Error(
      "Configurazione non trovata"
    );
  }

  const { error } = await supabase
    .from("impostazioni")
    .update({
      ore_massime_mensili_mezzore:
        oreMassimeMezzore,
      valore_ora_centesimi:
        valoreOraCentesimi,
      credito_massimo_centesimi:
        creditoMassimoCentesimi,
      updated_at: new Date().toISOString(),
    })
    .eq("id", impostazione.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected/impostazioni");
  revalidatePath("/protected/report");
  revalidatePath("/protected/mia-situazione");
  revalidatePath("/protected/attivita");
}