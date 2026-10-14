
"use client";

import { useState } from "react";
import {
  aggiornaLavoroPartecipazione,
  chiudiPartecipazione,
} from "./actions";

export default function PartecipazioneInCorsoForm({
  partecipazioneId,
  attivitaId,
  dataLavoro,
  oreInserite,
  noteSocio,
  labelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
}: {
  partecipazioneId: string;
  attivitaId: string;
  dataLavoro: string;
  oreInserite: number | null;
  noteSocio: string;
  labelClass: string;
  inputClass: string;
  primaryButtonClass: string;
  secondaryButtonClass: string;
}) {
  const [inCorso, setInCorso] = useState(false);

  async function salva(formData: FormData) {
    setInCorso(true);
    try {
      await aggiornaLavoroPartecipazione(formData);
      window.location.reload();
    } catch (errore) {
      alert(
        errore instanceof Error
          ? errore.message
          : "Errore durante il salvataggio."
      );
      setInCorso(false);
    }
  }

  async function salvaEChiudi(formData: FormData) {
    setInCorso(true);
    try {
      await aggiornaLavoroPartecipazione(formData);
      await chiudiPartecipazione(formData);
      window.location.reload();
    } catch (errore) {
      alert(
        errore instanceof Error
          ? errore.message
          : "Errore durante il salvataggio o la chiusura."
      );
      setInCorso(false);
    }
  }

  return (
    <form action={salva} className="space-y-4">
      <input
        type="hidden"
        name="partecipazione_id"
        value={partecipazioneId}
      />

      <div className="space-y-2">
        <label
          htmlFor={`data-lavoro-${attivitaId}`}
          className={labelClass}
        >
          Data del lavoro
        </label>
        <input
          id={`data-lavoro-${attivitaId}`}
          name="data_lavoro"
          type="date"
          defaultValue={dataLavoro}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`ore-${attivitaId}`}
          className={labelClass}
        >
          Ore effettuate
        </label>
        <select
          id={`ore-${attivitaId}`}
          name="ore"
          defaultValue={oreInserite ?? ""}
          required
          className={inputClass}
        >
          <option value="">Seleziona le ore</option>
          {Array.from({ length: 14 }, (_, i) => i + 1).map(
            (ore) => (
              <option key={ore} value={ore}>
                {String(ore / 2).replace(".", ",")}{" "}
                {ore === 2 ? "ora" : "ore"}
              </option>
            )
          )}
        </select>
        <p className="text-xs leading-5 text-[#857568]">
          Puoi registrare da mezz'ora a 7 ore.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`note-${attivitaId}`}
          className={labelClass}
        >
          Note sul lavoro
        </label>
        <textarea
          id={`note-${attivitaId}`}
          name="note_socio"
          defaultValue={noteSocio}
          rows={3}
          className={inputClass}
          placeholder="Descrivi brevemente il lavoro svolto..."
        />
      </div>

      <button
        type="submit"
        disabled={inCorso}
        className={primaryButtonClass}
      >
        {inCorso ? "Salvataggio..." : "Salva lavoro"}
      </button>

      <div className="border-t border-sky-200 pt-4">
        <button
          type="submit"
          formAction={salvaEChiudi}
          disabled={inCorso}
          className={secondaryButtonClass}
        >
          {inCorso
            ? "Salvataggio e chiusura..."
            : "Chiudi partecipazione"}
        </button>
        <p className="mt-2 text-xs leading-5 text-sky-900/70">
          Alla chiusura, i dati inseriti vengono salvati prima
          di completare la partecipazione.
        </p>
      </div>
    </form>
  );
}
