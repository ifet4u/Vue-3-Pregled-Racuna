<script setup>
import { ref, computed, onMounted, watch } from "vue";
import PregledRacuna from "@/components/PregledRacuna.vue";
import { db } from "@/data/db.js";
import { uvozRacuna } from "@/composables/UvozRacuna.js";
import { isExcludedInvoice, getNetInvoiceAmount, getRefundAmount } from "@/utils/invoiceHelpers.js";

// --- STATE ---
const racuniSve = ref([]);       // Svi učitani računi iz baze za izabrani period
const uvezeniFajlovi = ref([]);  // Istorija uvoza
const odabraniRacun = ref(null);  // Za modal detalja
const pfrModal = ref('');
const isLoading = ref(false);
const uploadStatus = ref(null);
const fileInput = ref(null);
const pokaziRacune = ref(true);

// --- SEARCH & FILTER STATE ---
const datumOd = ref('');
const datumDo = ref('');
const searchQuery = ref('');
const filterTransactionType = ref('');
const filterInvoiceType = ref('');
const filterPaymentType = ref('');
const prikazaniLimit = ref(100);

// --- FORMATIRANJE ---
const formatirajBroj = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatirajDatum = (datumString) => {
  if (!datumString) return '';
  const date = new Date(datumString);
  return new Intl.DateTimeFormat('sr-RS').format(date);
};

// --- UCITAVANJE PODATAKA ---
const osveziPodatke = async () => {
  isLoading.value = true;
  try {
    // 1. Učitaj istoriju fajlova
    uvezeniFajlovi.value = await db.fajlovi.orderBy('id').reverse().toArray();

    // 2. Učitaj račune na osnovu date filtera
    let query = db.racuni;

    if (datumOd.value && datumDo.value) {
      const start = new Date(datumOd.value);
      start.setHours(0, 0, 0, 0);

      const end = new Date(datumDo.value);
      end.setHours(23, 59, 59, 999);

      racuniSve.value = await query
        .where('date')
        .between(start, end, true, true)
        .reverse()
        .toArray();
    } else {
      // Ako nema filtera datuma, učitavamo poslednjih 2000 računa radi performansi
      racuniSve.value = await query.orderBy('date').reverse().limit(2000).toArray();
    }

    // Resetujemo limit na 100 kada se učitaju novi podaci
    prikazaniLimit.value = 100;
  } catch (e) {
    console.error("Greška pri čitanju baze:", e);
  } finally {
    isLoading.value = false;
  }
};

// --- FILTRIRANJE NA KLIJENTU ---
const filtriraniRacuni = computed(() => {
  return racuniSve.value.filter(rac => {
    // A) Tekstualna pretraga (PFR broj, Kasir, Lokacija, PIB kupca)
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase();
      const pfr = (rac.invoiceNumber || '').toLowerCase();
      const kasir = (rac.Cashier || '').toLowerCase();
      const lokacija = (rac.LocationName || '').toLowerCase();
      const kupac = (rac.BuyerTin || '').toLowerCase();

      if (!pfr.includes(query) && !kasir.includes(query) && !lokacija.includes(query) && !kupac.includes(query)) {
        return false;
      }
    }

    // B) Filter tipa transakcije
    if (filterTransactionType.value) {
      if (rac.TransactionType !== filterTransactionType.value) return false;
    }

    // C) Filter tipa računa
    if (filterInvoiceType.value) {
      if (rac.InvoiceType !== filterInvoiceType.value) return false;
    }

    // D) Filter načina plaćanja
    if (filterPaymentType.value) {
      if (!rac.Payments || !rac.Payments.some(p => p.Type === filterPaymentType.value)) {
        return false;
      }
    }

    return true;
  });
});

// Prikazani računi (ograničeno limitom paginacije)
const prikazaniRacuni = computed(() => {
  return filtriraniRacuni.value.slice(0, prikazaniLimit.value);
});

// --- FINANSIJSKE SUME ZA FILTRIRANE RAČUNE ---
const ukupanZbirPromet = computed(() => {
  return filtriraniRacuni.value
    .reduce((zbir, rac) => zbir + getNetInvoiceAmount(rac), 0);
});

const ukupanZbirRefundacija = computed(() => {
  return filtriraniRacuni.value
    .reduce((zbir, rac) => zbir + getRefundAmount(rac), 0);
});

// --- AKCIJE ---
const ucitajJos = () => {
  prikazaniLimit.value += 100;
};

const ponistiFiltere = () => {
  datumOd.value = '';
  datumDo.value = '';
  searchQuery.value = '';
  filterTransactionType.value = '';
  filterInvoiceType.value = '';
  filterPaymentType.value = '';
  osveziPodatke();
};

const odradiUpload = () => {
  const fajl = fileInput.value?.files[0];
  if (!fajl) {
    uploadStatus.value = { type: 'danger', msg: "Niste odabrali fajl." };
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const json = JSON.parse(e.target.result);
      const rezultat = await uvozRacuna(fajl, json);

      if (rezultat.success) {
        uploadStatus.value = { type: 'success', msg: rezultat.message };
        fileInput.value.value = "";
        await osveziPodatke();
      } else {
        uploadStatus.value = { type: 'danger', msg: rezultat.message };
      }
    } catch (err) {
      uploadStatus.value = { type: 'danger', msg: "Nevalidan JSON format." };
    }
  };
  reader.readAsText(fajl);
};

const obrisiFajlIzBaze = async (idFajla) => {
  if (!confirm("Da li ste sigurni? Ovo briše sve račune ovog fajla.")) return;

  try {
    await db.transaction('rw', db.fajlovi, db.racuni, async () => {
      await db.racuni.where({ fileId: idFajla }).delete();
      await db.fajlovi.delete(idFajla);
    });
    await osveziPodatke();
  } catch (e) {
    alert("Greška: " + e.message);
  }
};

const obrisiSve = async () => {
  if (!confirm("Ovo briše KOMPLETNU lokalnu bazu trajno. Da li ste sigurni?")) return;
  await db.delete();
  await db.open();
  await osveziPodatke();
};

// --- CSV IZVOZ ---
const izveziUCSV = () => {
  const headers = [
    "PFR Broj",
    "Tip Transakcije",
    "Tip Racuna",
    "Datum i Vreme",
    "Neto Iznos",
    "PDV Iznos",
    "Nacin Placanja",
    "Kasir",
    "Lokacija",
    "Kupac PIB"
  ];

  const rows = filtriraniRacuni.value.map(rac => {
    const nacinPlacanja = rac.Payments ? rac.Payments.map(p => `${p.Type}: ${p.Amount}`).join('; ') : '';
    const pdvIznos = rac.TotalTax || 0;
    const netoIznos = getNetInvoiceAmount(rac);

    return [
      rac.invoiceNumber || rac.InvoiceNumber,
      rac.TransactionType,
      rac.InvoiceType,
      rac.SDCTime_ServerTimeZone,
      netoIznos,
      pdvIznos,
      nacinPlacanja,
      rac.Cashier || '',
      rac.LocationName || '',
      rac.BuyerTin || ''
    ];
  });

  // Dodavanje UTF-8 BOM bajta za ispravno čitanje srpskih slova u Excelu
  let csvContent = "\uFEFF";
  
  csvContent += [
    headers.join(','), 
    ...rows.map(row => row.map(val => {
      let strVal = String(val);
      // Escape navodnika i zareza
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n') || strVal.includes('\r')) {
        strVal = `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Izvoz_Racuna_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  osveziPodatke();
});

// Praćenje date filtera za ponovno dobijanje iz IndexedDB
watch([datumOd, datumDo], () => {
  osveziPodatke();
});
</script>

<template>
  <div class="container-xl">
    <!-- ROW 1: Uvoz i Istorija -->
    <div class="row row-cards mb-4">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h3 class="card-title">Uvoz novih računa (JSON)</h3>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <input class="form-control" type="file" ref="fileInput" accept=".json"/>
              <small class="text-muted d-block mt-1">Uvezite JSON fajl preuzet sa portala poreske uprave.</small>
            </div>
            <button @click="odradiUpload" class="btn btn-primary w-100" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              <i class="ti ti-upload me-2" v-else></i>Uvezi u bazu
            </button>
            <div v-if="uploadStatus" :class="`alert alert-${uploadStatus.type} mt-3 mb-0`">
              {{ uploadStatus.msg }}
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card h-100" style="max-height: 250px; overflow-y: auto;">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="card-title mb-0">Istorija uvoza</h3>
            <button v-if="uvezeniFajlovi.length > 0" @click="obrisiSve" class="btn btn-sm btn-outline-danger">Obriši celu bazu</button>
          </div>
          <div class="table-responsive">
            <table class="table table-vcenter card-table table-sm">
              <thead>
                <tr>
                  <th>Fajl</th>
                  <th>Period</th>
                  <th>Uvezeno</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in uvezeniFajlovi" :key="f.id">
                  <td class="text-truncate text-semibold" style="max-width: 150px;" :title="f.imeFajla">{{ f.imeFajla }}</td>
                  <td class="small text-muted">
                    {{ formatirajDatum(f.datumOd) }} - {{ formatirajDatum(f.datumDo) }}
                  </td>
                  <td><span class="badge bg-blue-lt">{{ f.brojRacuna }}</span></td>
                  <td class="text-end">
                    <button class="btn btn-icon btn-ghost-danger btn-sm" @click="obrisiFajlIzBaze(f.id)" title="Ukloni ovaj uvoz">
                      <i class="ti ti-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="uvezeniFajlovi.length === 0">
                  <td colspan="4" class="text-center text-muted py-3">Nema uvezenih fajlova.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ROW 2: Napredno filtriranje i pretraga -->
    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">Pretraga i Filtriranje</h3>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <!-- Text search -->
          <div class="col-md-4 col-sm-12">
            <label class="form-label text-muted small">Pretraži</label>
            <div class="input-icon">
              <span class="input-icon-addon">
                <i class="ti ti-search"></i>
              </span>
              <input type="text" v-model="searchQuery" class="form-control" placeholder="PFR broj, kasir, lokacija, PIB...">
            </div>
          </div>
          
          <!-- Date Od -->
          <div class="col-md-2 col-sm-6">
            <label class="form-label text-muted small">Period od</label>
            <input type="date" v-model="datumOd" class="form-control">
          </div>
          
          <!-- Date Do -->
          <div class="col-md-2 col-sm-6">
            <label class="form-label text-muted small">Period do</label>
            <input type="date" v-model="datumDo" class="form-control">
          </div>

          <!-- Transaction type -->
          <div class="col-md-2 col-sm-6">
            <label class="form-label text-muted small">Tip transakcije</label>
            <select v-model="filterTransactionType" class="form-select">
              <option value="">Sve transakcije</option>
              <option value="Продаја">Продаја (Prodaja)</option>
              <option value="Рефундација">Рефундација (Refundacija)</option>
            </select>
          </div>

          <!-- Invoice type -->
          <div class="col-md-2 col-sm-6">
            <label class="form-label text-muted small">Tip računa</label>
            <select v-model="filterInvoiceType" class="form-select">
              <option value="">Svi tipovi</option>
              <option value="Промет">Промет (Turnover)</option>
              <option value="Аванс">Аванс (Advance)</option>
              <option value="Копија">Копија (Copy)</option>
              <option value="Обука">Обука (Training)</option>
              <option value="Предрачун">Предрачун (Proforma)</option>
            </select>
          </div>
        </div>

        <div class="row g-3 mt-1 align-items-center">
          <!-- Payment type filter -->
          <div class="col-md-4 col-sm-12">
            <label class="form-label text-muted small">Način plaćanja</label>
            <select v-model="filterPaymentType" class="form-select">
              <option value="">Sva plaćanja</option>
              <option value="Готовина">Готовина (Gotovina)</option>
              <option value="Платна картица">Платна картиca (Kartica)</option>
              <option value="Пренос на рачун">Пренос на рачун (Prenos)</option>
              <option value="Чек">Чек (Ček)</option>
              <option value="Ваучер">Ваучер (Voucher)</option>
              <option value="Друго">Друго (Drugo)</option>
            </select>
          </div>

          <div class="col-md-8 col-sm-12 text-md-end mt-md-4 pt-1">
            <button @click="ponistiFiltere" class="btn btn-outline-danger me-2">
              <i class="ti ti-rotate"></i> Poništi sve
            </button>
            <button @click="izveziUCSV" class="btn btn-success" :disabled="filtriraniRacuni.length === 0">
              <i class="ti ti-file-spreadsheet me-2"></i> Izvezi u CSV (Excel)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ROW 3: Prikaz Tabele računa -->
    <div class="card card-body mb-3 py-2 d-print-none">
      <label class="row align-items-center mb-0" style="cursor: pointer;">
        <span class="col fw-bold">Prikaži tabelu sa listom pojedinačnih računa</span>
        <span class="col-auto">
          <label class="form-check form-check-single form-switch mb-0">
            <input class="form-check-input" type="checkbox" v-model="pokaziRacune">
          </label>
        </span>
      </label>
    </div>

    <!-- TABLE -->
    <div class="card mb-5" v-if="pokaziRacune">
      <div class="card-body pb-0">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="card-title">Lista Računa</h3>
          <div class="d-flex gap-2">
            <span class="badge bg-blue-lt">Filtrirano: {{ filtriraniRacuni.length }}</span>
            <span class="badge bg-green-lt" v-if="racuniSve.length > 0">
              Učitano iz baze: {{ racuniSve.length }}
            </span>
          </div>
        </div>

        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <div class="mt-2 text-muted">Pretraživanje lokalne baze...</div>
        </div>

        <div v-else class="table-responsive" style="max-height: 600px; overflow-y: auto;">
          <table class="table table-hover table-vcenter card-table text-nowrap">
            <thead class="sticky-top bg-white border-bottom shadow-sm">
              <tr class="table-light">
                <th>PFR Broj</th>
                <th>Tip / Datum i vreme</th>
                <th>Kasir / Lokacija</th>
                <th>Načini Plaćanja</th>
                <th class="text-end">Iznos</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rac in prikazaniRacuni" :key="rac.invoiceNumber"
                  :class="[
                    {'table-danger': rac.TransactionType === 'Рефундација'},
                    {'table-warning': isExcludedInvoice(rac)},
                    {'table-info': rac.InvoiceType === 'Аванс' && rac.TransactionType !== 'Рефундација'}
                  ]">
                <td>
                  <button class="btn btn-sm w-100 text-truncate font-monospace"
                          :class="[
                            {'btn-danger': rac.TransactionType === 'Рефундација'},
                            {'btn-warning': isExcludedInvoice(rac)},
                            {'btn-primary': rac.InvoiceType === 'Аванс' && rac.TransactionType !== 'Рефундација'},
                            {'btn-outline-dark': rac.InvoiceType === 'Промет' && rac.TransactionType === 'Продаја'}
                          ]"
                          data-bs-toggle="modal" data-bs-target="#invoiceModal"
                          @click="odabraniRacun = rac; pfrModal = rac.invoiceNumber">
                    {{ rac.invoiceNumber }}
                  </button>
                </td>
                <td>
                  <div class="d-flex align-items-center gap-1">
                    <span v-if="rac.TransactionType === 'Рефундација'" class="badge bg-danger text-white">REF</span>
                    <span v-else-if="isExcludedInvoice(rac)" class="badge bg-warning text-dark">NEFISKALNI</span>
                    <span v-else class="badge bg-success text-white">PRODAJA</span>
                    <span class="badge bg-secondary-lt">{{ rac.InvoiceType }}</span>
                  </div>
                  <div class="small text-muted mt-1">{{ rac.SDCTime_ServerTimeZone }}</div>
                </td>
                <td>
                  <div class="font-weight-medium">{{ rac.Cashier }}</div>
                  <div class="small text-muted text-truncate" style="max-width: 250px;">{{ rac.LocationName }}</div>
                </td>
                <td>
                  <div v-if="rac.Payments" class="d-flex flex-wrap gap-1">
                    <span v-for="(p, pi) in rac.Payments" :key="pi" class="badge bg-light text-dark text-xs">
                      {{ p.Type }}: {{ formatirajBroj(p.Amount) }}
                    </span>
                  </div>
                </td>
                <td class="text-end fw-bold" :class="[
                  {'text-danger': getNetInvoiceAmount(rac) < 0},
                  {'text-muted': isExcludedInvoice(rac)},
                  {'text-success': getNetInvoiceAmount(rac) > 0}
                ]">
                  {{ formatirajBroj(getNetInvoiceAmount(rac)) }} din.
                </td>
              </tr>
              <tr v-if="filtriraniRacuni.length === 0">
                <td colspan="5" class="text-center py-4 text-muted">
                  Nema računa za izabrani filter ili je baza prazna.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- LOAD MORE BUTTON -->
        <div class="text-center py-3 border-top" v-if="prikazaniLimit < filtriraniRacuni.length">
          <button @click="ucitajJos" class="btn btn-outline-primary">
            Učitaj još 100 računa (Preostalo: {{ filtriraniRacuni.length - prikazaniLimit }})
          </button>
        </div>
      </div>

      <!-- TABLE FOOTER STATISTICS -->
      <div class="card-footer bg-light" v-if="filtriraniRacuni.length > 0">
        <div class="row text-center font-monospace">
          <div class="col-md-6 col-sm-12 text-md-start mb-2 mb-md-0">
            <span class="text-muted small">Prikazano:</span> <strong>{{ Math.min(prikazaniLimit, filtriraniRacuni.length) }}</strong> od <strong>{{ filtriraniRacuni.length }}</strong> računa
          </div>
          <div class="col-md-6 col-sm-12 text-md-end">
            <div class="mb-1">
              <span class="text-muted text-sm">Ukupno Refundirano (Prikazano):</span> 
              <span class="text-danger fw-bold fs-4 ms-2">-{{ formatirajBroj(ukupanZbirRefundacija) }} din.</span>
            </div>
            <div>
              <span class="text-muted text-sm text-uppercase fw-bold">Ukupan Neto Promet (Prikazano):</span> 
              <span class="text-success fw-bold fs-3 ms-2">{{ formatirajBroj(ukupanZbirPromet) }} din.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL FOR DETAILED VIEW -->
    <div class="modal fade" id="invoiceModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header d-print-none">
            <h5 class="modal-title text-truncate">Detalji PFR računa</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-0">
            <PregledRacuna v-if="odabraniRacun" :data="odabraniRacun"/>
          </div>
          <div class="modal-footer d-print-none">
            <button class="btn btn-outline-secondary" onclick="window.print()">
              <i class="ti ti-printer me-2"></i>Štampaj
            </button>
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Zatvori</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-responsive {
  scrollbar-width: thin;
}
.sticky-top {
  z-index: 5;
}
</style>
