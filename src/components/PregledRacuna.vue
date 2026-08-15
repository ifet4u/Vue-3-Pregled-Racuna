<script setup>
import { isExcludedInvoice } from "@/utils/invoiceHelpers.js";

defineProps({
  data: {
    type: Object,
    required: true
  }
});

const formatValuta = (vrednost) => {
  return new Intl.NumberFormat('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(vrednost) + ' RSD';
};

const formatBroj = (vrednost) => {
  return new Intl.NumberFormat('sr-RS', {
    maximumFractionDigits: 4
  }).format(vrednost);
};
</script>

<template>
  <div class="receipt-container">
    <div class="receipt-paper">
      <!-- Top jagged edge -->
      <div class="receipt-edge top"></div>

      <!-- Header -->
      <div class="receipt-header text-center">
        <h3 class="merchant-name">{{ data.LocationName || 'LOKACIJA NIJE NAVEDENA' }}</h3>
        <p class="merchant-info">
          <strong>PIB:</strong> {{ data.TIN }}<br>
          <strong>Kasir:</strong> {{ data.Cashier || 'N/A' }}<br>
          <strong>POS broj:</strong> {{ data.PosInvoiceNumber || 'N/A' }}
        </p>
        <div class="divider-dashed"></div>
        <h4 class="receipt-title" :class="{ 'text-danger': isExcludedInvoice(data) }">
          {{ isExcludedInvoice(data) ? 'REKLAMNI / OBUKA' : 'FISKALNI ISEČAK' }}
        </h4>
        <div class="receipt-type text-uppercase">
          {{ data.TransactionType }} - {{ data.InvoiceType }}
        </div>
        <div class="divider-dashed"></div>
      </div>

      <!-- Stavke / Items -->
      <div class="receipt-items">
        <table class="receipt-table">
          <thead>
            <tr>
              <th class="text-start">Naziv</th>
              <th class="text-end">Količina x Cena</th>
              <th class="text-end">Ukupno</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in data.Items" :key="i">
              <td class="text-start">
                <span class="item-name">{{ item.Name }}</span>
                <span v-if="item.Labels" class="item-label">Stope: ({{ item.Labels.join(', ') }})</span>
              </td>
              <td class="text-end text-nowrap">
                {{ formatBroj(item.Quantity) }} x {{ formatBroj(item.UnitPrice) }}
              </td>
              <td class="text-end fw-bold text-nowrap">
                {{ formatBroj(item.TotalAmount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="divider-dashed"></div>

      <!-- Porezi / Taxes -->
      <div class="receipt-taxes">
        <div class="d-flex justify-content-between fw-bold mb-1 text-sm">
          <span>Stopa (Naziv)</span>
          <span>PDV Iznos</span>
        </div>
        <div v-for="(tax, i) in data.TaxItems" :key="i" class="d-flex justify-content-between text-xs text-muted">
          <span>{{ tax.CategoryName }} ({{ tax.Label }} - {{ tax.Rate }}%)</span>
          <span>{{ formatBroj(tax.Amount) }}</span>
        </div>
        <div class="d-flex justify-content-between fw-bold mt-1 text-sm">
          <span>Ukupan porez:</span>
          <span>{{ formatBroj(data.TotalTax || 0) }}</span>
        </div>
      </div>

      <div class="divider-dashed"></div>

      <!-- Plaćanje / Payments -->
      <div class="receipt-payments">
        <div v-for="(pay, i) in data.Payments" :key="i" class="d-flex justify-content-between text-sm">
          <span>Uplata ({{ pay.Type }})</span>
          <span class="fw-bold">{{ formatBroj(pay.Amount) }}</span>
        </div>
        <div class="d-flex justify-content-between fs-3 fw-bold mt-2 border-top-double pt-2">
          <span>UKUPNO:</span>
          <span>{{ formatValuta(data.TotalAmount) }}</span>
        </div>
      </div>

      <div class="divider-dashed"></div>

      <!-- PFR podaci -->
      <div class="receipt-footer text-xs font-monospace text-muted">
        <div class="pfr-info mb-3">
          <div><strong>Vreme:</strong> {{ data.SDCTime_ServerTimeZone }}</div>
          <div><strong>PFR broj:</strong> {{ data.InvoiceNumber }}</div>
          <div><strong>Brojač:</strong> {{ data.InvoiceCounter }}</div>
          <div v-if="data.BuyerTin"><strong>Kupac PIB:</strong> {{ data.BuyerTin }}</div>
          <div><strong>Potpis:</strong> {{ data.SignedBy }}</div>
        </div>

        <!-- Mock QR Code -->
        <div class="qr-mock-container my-3 d-flex flex-column align-items-center">
          <div class="qr-mock-code">
            <svg width="110" height="110" viewBox="0 0 100 100" class="qr-svg">
              <path d="M0,0 h30 v10 h-20 v20 h-10 z M100,0 h-30 v10 h20 v20 h10 z M0,100 h30 v-10 h-20 v-20 h-10 z M100,100 h-30 v-10 h20 v-20 h10 z" fill="#333"/>
              <!-- Mock random pixel blocks for QR feel -->
              <rect x="15" y="15" width="20" height="20" fill="#333"/>
              <rect x="20" y="20" width="10" height="10" fill="#fff"/>
              <rect x="65" y="15" width="20" height="20" fill="#333"/>
              <rect x="70" y="20" width="10" height="10" fill="#fff"/>
              <rect x="15" y="65" width="20" height="20" fill="#333"/>
              <rect x="20" y="70" width="10" height="10" fill="#fff"/>
              
              <!-- Center elements and random dots -->
              <rect x="45" y="45" width="10" height="10" fill="#333"/>
              <rect x="55" y="35" width="15" height="5" fill="#333"/>
              <rect x="35" y="55" width="5" height="15" fill="#333"/>
              <rect x="45" y="65" width="15" height="15" fill="#333"/>
              <rect x="65" y="45" width="10" height="20" fill="#333"/>
              <rect x="35" y="35" width="5" height="5" fill="#333"/>
              <rect x="45" y="20" width="10" height="5" fill="#333"/>
              <rect x="20" y="45" width="5" height="10" fill="#333"/>
            </svg>
          </div>
          <span class="qr-label mt-1 text-uppercase text-center">Skenirajte za proveru računa</span>
        </div>

        <div class="divider-dashed"></div>
        <p class="receipt-end-msg text-center mb-0">HVALA NA POSETI!</p>
      </div>

      <!-- Bottom jagged edge -->
      <div class="receipt-edge bottom"></div>
    </div>
  </div>
</template>

<style scoped>
.receipt-container {
  background-color: #f4f6fa;
  padding: 24px;
  display: flex;
  justify-content: center;
  border-radius: 8px;
}

.receipt-paper {
  background-color: #ffffff;
  width: 100%;
  max-width: 440px;
  padding: 28px 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  position: relative;
  font-family: 'Courier New', Courier, monospace;
  color: #1a1a1a;
  box-sizing: border-box;
}

/* Edge styles to look like torn paper */
.receipt-edge {
  position: absolute;
  left: 0;
  width: 100%;
  height: 8px;
  background-size: 16px 8px;
  background-repeat: repeat-x;
}

.receipt-edge.top {
  top: -8px;
  background-image: linear-gradient(135deg, #ffffff 4px, transparent 0), linear-gradient(225deg, #ffffff 4px, transparent 0);
}

.receipt-edge.bottom {
  bottom: -8px;
  background-image: linear-gradient(45deg, #ffffff 4px, transparent 0), linear-gradient(-45deg, #ffffff 4px, transparent 0);
}

/* Dashed separator */
.divider-dashed {
  border-top: 1px dashed #555555;
  margin: 14px 0;
}

.merchant-name {
  font-size: 1.15rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
  line-height: 1.3;
}

.merchant-info {
  font-size: 0.8rem;
  line-height: 1.4;
  margin-bottom: 8px;
}

.receipt-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 6px 0;
  letter-spacing: 1px;
}

.receipt-type {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.receipt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.receipt-table th {
  font-weight: bold;
  border-bottom: 1px dashed #555555;
  padding-bottom: 6px;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.receipt-table td {
  padding: 8px 0;
  vertical-align: top;
  line-height: 1.3;
}

.item-name {
  display: block;
  font-weight: bold;
  word-break: break-word;
}

.item-label {
  display: block;
  font-size: 0.72rem;
  color: #666666;
  margin-top: 2px;
}

.receipt-taxes, .receipt-payments {
  font-size: 0.85rem;
}

.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.85rem;
}

.border-top-double {
  border-top: 3px double #1a1a1a;
}

.qr-mock-code {
  padding: 8px;
  background: #ffffff;
  border: 1px solid #dddddd;
  display: inline-block;
}

.qr-label {
  font-size: 0.68rem;
  color: #777777;
  letter-spacing: 0.5px;
}

.receipt-end-msg {
  font-size: 0.85rem;
  letter-spacing: 2px;
  font-weight: bold;
}
</style>
