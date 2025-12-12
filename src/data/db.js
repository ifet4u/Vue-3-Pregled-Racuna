import Dexie from "dexie";

export const db = new Dexie("BazaRacuna");

db.version(1).stores({
  // Ime tabele: 'fajlovi'
  fajlovi: '++id, tin, imeFajla, datumOd, datumDo, datumUvoz, brojRacuna',

  // Ime tabele: 'racuni'
  racuni: 'invoiceNumber, fileId, tin, date, transactionType, invoiceType'
});
