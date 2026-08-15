import Dexie from "dexie";
import { konvertujDatum } from "@/utils/invoiceHelpers.js";

export const db = new Dexie("BazaRacuna");

db.version(1).stores({
  // Ime tabele: 'fajlovi'
  fajlovi: '++id, tin, imeFajla, datumOd, datumDo, datumUvoz, brojRacuna',

  // Ime tabele: 'racuni'
  racuni: 'invoiceNumber, fileId, tin, date, transactionType, invoiceType'
});

/**
 * Automatska migracija koja prolazi kroz sve račune u bazi
 * i popravlja "Invalid Date" vrednosti koje su nastale zbog jednocifrenih sati.
 */
export const popraviNeispravneDatume = async () => {
  try {
    let brojPopravljenih = 0;
    
    // Prolazimo kroz sve račune i modifikujemo one koji imaju nevažeći datum
    await db.transaction('rw', db.racuni, async () => {
      await db.racuni.toCollection().modify(racun => {
        const provera = new Date(racun.date);
        if (isNaN(provera.getTime())) {
          racun.date = konvertujDatum(racun.SDCTime_ServerTimeZone);
          brojPopravljenih++;
        }
      });
    });
    
    if (brojPopravljenih > 0) {
      console.log(`[Migracija] Uspešno popravljeno ${brojPopravljenih} nevažećih datuma u bazi.`);
    }
  } catch (e) {
    console.error("[Migracija] Greška pri popravci datuma:", e);
  }
};
