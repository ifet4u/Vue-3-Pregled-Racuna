/**
 * Konvertuje datum iz formata "DD.MM.YYYY. HH:mm:ss" (kakav koristi poreska)
 * u standardan JS Date objekat sa ispravnim paddingom za jednocifrene sate/minute/sekunde.
 * @param {string} datumString
 * @returns {Date}
 */
export const konvertujDatum = (datumString) => {
  if (!datumString) return new Date();
  const parts = datumString.trim().split(' ');
  if (parts.length < 2) return new Date();
  const [d, t] = parts;
  
  const deloviDatuma = d.split('.');
  const day = String(deloviDatuma[0]).padStart(2, '0');
  const month = String(deloviDatuma[1]).padStart(2, '0');
  const year = deloviDatuma[2];

  const deloviVremena = t.split(':');
  const hour = String(deloviVremena[0]).padStart(2, '0');
  const minute = String(deloviVremena[1]).padStart(2, '0');
  const second = String(deloviVremena[2] || '00').substring(0, 2).padStart(2, '0');

  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  const parsedDate = new Date(isoString);
  if (isNaN(parsedDate.getTime())) {
    return new Date(datumString); // fallback
  }
  return parsedDate;
};

/**
 * Proverava da li je račun isključen iz finansijskih obračuna
 * (kopije, obuke, predračuni).
 * @param {Object} racun 
 * @returns {boolean}
 */
export const isExcludedInvoice = (racun) => {
  if (!racun || !racun.InvoiceType) return false;
  return ['Копија', 'Обука', 'Предрачун'].includes(racun.InvoiceType);
};

/**
 * Vraća neto iznos računa sa pravilnim znakom (+ za prodaju, - za refundaciju).
 * Ako je račun isključen, vraća 0.
 * @param {Object} racun 
 * @returns {number}
 */
export const getNetInvoiceAmount = (racun) => {
  if (isExcludedInvoice(racun)) return 0;
  const amount = racun.TotalAmount || 0;
  
  if (racun.TransactionType === 'Рефундација' || amount < 0) {
    return -Math.abs(amount);
  }
  return Math.abs(amount);
};

/**
 * Vraća iznos refundacije kao pozitivan broj ako je račun refundacija, inače 0.
 * Ako je račun isključen, vraća 0.
 * @param {Object} racun 
 * @returns {number}
 */
export const getRefundAmount = (racun) => {
  if (isExcludedInvoice(racun)) return 0;
  const amount = racun.TotalAmount || 0;
  
  if (racun.TransactionType === 'Рефундација' || amount < 0) {
    return Math.abs(amount);
  }
  return 0;
};
