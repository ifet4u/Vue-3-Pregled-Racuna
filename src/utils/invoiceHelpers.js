/**
 * Proverava da li je račun isključen iz finansijskih obračuna
 * (kopije, obuke, predračuni).
 * @param {Object} racun 
 * @returns {boolean}
 */
export const isExcludedInvoice = (racun) => {
  if (!racun || !racun.InvoiceType) return false;
  return ['Копија', 'Обука', 'Предраčuн'].includes(racun.InvoiceType);
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
