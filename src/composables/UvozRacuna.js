import {db} from "@/data/db.js";

const konvertujDatum = (datum) => {
  if (!datum) return new Date();
  const [d, t] = datum.split(' ');
  const deloviDatuma = d.split('.');
  const day = deloviDatuma[0];
  const month = deloviDatuma[1];
  const year = deloviDatuma[2];

  return new Date(`${year}-${month}-${day}T${t}`);
}

export const uvozRacuna = async (fajl, jsonData) => {
  if (!jsonData.length) return {success: false, message: "Nema podataka za uvoz."};

  const tin = jsonData[0].TIN;

  // Provera u bazi
  const postojeciFajl = await db.fajlovi.limit(1).first();

  if (postojeciFajl && postojeciFajl.tin !== tin) {
    return {success: false, message: `PIB u fajlu (${tin}) se ne poklapa sa bazom (${postojeciFajl.tin}).`};
  }

  let minDate = new Date(8640000000000000);
  let maxDate = new Date(-8640000000000000);

  const racuniZaUvoz = jsonData.map(racun => {
    const datum = konvertujDatum(racun.SDCTime_ServerTimeZone);
    if (datum < minDate) minDate = datum;
    if (datum > maxDate) maxDate = datum;

    return {
      ...racun,
      invoiceNumber: racun.InvoiceNumber,
      date: datum,
      tin: tin
    }
  })

  try {
    // ISPRAVKA: Imena tabela moraju biti na srpskom kao u db.js (fajlovi, racuni)
    await db.transaction('rw', db.fajlovi, db.racuni, async () => {

      const fileId = await db.fajlovi.add({
        imeFajla: fajl.name,
        tin: tin,
        datumUvoz: new Date(),
        datumOd: minDate,
        datumDo: maxDate,
        brojRacuna: racuniZaUvoz.length
      });

      //  Dodela fileId-a svakom računu
      const finalniRacuni = racuniZaUvoz.map(r => ({ ...r, fileId: fileId }));

      // Masovni upis
      await db.racuni.bulkPut(finalniRacuni);
    });

    return { success: true, message: `Uspešno! Uvezeno ${racuniZaUvoz.length} računa.` };
  } catch (error) {
    console.error(error); // Dobro je videti grešku u konzoli
    return { success: false, message: `Greška prilikom uvoza: ${error.message}` };
  }
}
