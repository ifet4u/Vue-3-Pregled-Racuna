<script setup>
defineProps({
  data: {
    type: Object,
    required: true
  }
});

const formatirajBroj = (broj) => {
  return broj.toLocaleString('sr-RS', { minimumFractionDigits: 2 });
};
</script>

<template>
  <div class="invoice">

    <!-- HEADER -->
    <div class="mb-2">
      <h5 class="mb-1">Racun #{{ data.InvoiceNumber }}</h5>
      <small class="text-muted">
        {{ data.TransactionType }} ({{ data.InvoiceType }})
      </small>
    </div>

    <!-- OSNOVNI PODACI -->
    <div class="mb-2">
      <div class="d-flex flex-wrap text-sm">
        <div class="me-3"><strong>PIB:</strong> {{ data.TIN }}</div>
        <div class="me-3"><strong>Lokacija:</strong> {{ data.LocationName }}</div>
        <div class="me-3"><strong>Kasir:</strong> {{ data.Cashier }}</div>
        <div class="me-3"><strong>POS broj:</strong> {{ data.PosInvoiceNumber }}</div>
        <div class="me-3"><strong>Datum:</strong> {{ data.SDCTime_ServerTimeZone }}</div>
        <div class="me-3"><strong>Kupac ID:</strong> {{ data.BuyerTin }}</div>
      </div>
    </div>

    <!-- STAVKE -->
    <div class="mb-2">
      <table class="table table-sm mb-0">
        <thead class="table-light">
        <tr>
          <th>Naziv</th>
          <th class="text-end">Količina</th>
          <th class="text-end">Cena</th>
          <th class="text-end">Ukupno</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(item, i) in data.Items" :key="i">
          <td>{{ item.Name }}</td>
          <td class="text-end">{{ item.Quantity }}</td>
          <td class="text-end">{{ formatirajBroj(item.UnitPrice) }}</td>
          <td class="text-end">{{ formatirajBroj(item.TotalAmount) }}</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- UPLATE -->
    <div class="mb-2">
      <div class="d-flex flex-wrap text-sm mb-1">
        <div v-for="(pay, i) in data.Payments" :key="i" class="me-3">
          {{ pay.Type }}: <strong>{{ formatirajBroj(pay.Amount) }} din.</strong>
        </div>
      </div>
      <div class="fw-bold text-end">Ukupno plaćeno: {{ formatirajBroj(data.PaymentsAmount) }} din.</div>
    </div>

    <!-- POREZI -->
    <div class="mb-2">
      <table class="table table-sm mb-0">
        <thead class="table-light">
        <tr>
          <th>Oznaka</th>
          <th>Kategorija</th>
          <th class="text-end">Stopa (%)</th>
          <th class="text-end">Iznos</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(tax, i) in data.TaxItems" :key="i">
          <td>{{ tax.Label }}</td>
          <td>{{ tax.CategoryName }}</td>
          <td class="text-end">{{ tax.Rate }}</td>
          <td class="text-end">{{ formatirajBroj(tax.Amount) }}</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- TOTAL -->
    <div class="text-end mt-2">
      <h6 class="fw-bold mb-0">Ukupan iznos: {{ formatirajBroj(data.TotalAmount) }} din.</h6>
    </div>

  </div>
</template>

<style scoped>
.invoice {
  font-size: 0.875rem; /* kompaktno za modal */
}

.table th, .table td {
  padding: 0.25rem 0.5rem; /* manja padding za tabelu u modalu */
}

.text-sm {
  font-size: 0.8rem;
}
</style>
