<script setup>
import { ref, computed, onMounted } from "vue";
import PregledRacuna from "@/components/PregledRacuna.vue";
import {db} from "@/data/db.js";
import {uvozRacuna} from "@/composables/UvozRacuna.js";

// --- STATE ---
const racuni = ref([]);        // Lista svih računa iz baze
const uvezeniFajlovi = ref([]); // Lista fajlova (sesija uvoza)
const odabraniRacun = ref(null); // Za modal
const pfrModal = ref('');
const isLoading = ref(false);
const uploadStatus = ref(null);
const fileInput = ref(null);
const pokaziRacune = ref(false)
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
  // Ako je datum objekat iz baze
  const date = new Date(datumString);
  return new Intl.DateTimeFormat('sr-RS').format(date);
};

// --- COMPUTED (Računanje totala iz učitanih računa) ---
const ukupanZbirPromet = computed(() => {
  return racuni.value
    .filter(rac => rac.InvoiceType === 'Промет')
    .reduce((zbir, rac) => zbir + (rac.TotalAmount || 0), 0);
});

// --- AKCIJE SA BAZOM ---

// 1. Učitaj sve podatke iz baze
const osveziPodatke = async () => {
  isLoading.value = true;
  try {
    // Učitaj fajlove (sortirano po ID-u unazad - najnoviji prvi)
    uvezeniFajlovi.value = await db.fajlovi.orderBy('id').reverse().toArray();

    // Učitaj račune (sortirano po datumu unazad)
    // Ovde možeš dodati limit(500) ako imaš previše računa
    racuni.value = await db.racuni.orderBy('date').reverse().toArray();
  } catch (e) {
    console.error("Greška pri čitanju baze:", e);
  } finally {
    isLoading.value = false;
  }
};

// 2. Upload novog fajla
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

      // Pozivamo tvoju skriptu za uvoz
      const rezultat = await uvozRacuna(fajl, json);

      if (rezultat.success) {
        uploadStatus.value = { type: 'success', msg: rezultat.message };
        fileInput.value.value = ""; // Reset inputa
        await osveziPodatke(); // Osveži tabelu
      } else {
        uploadStatus.value = { type: 'danger', msg: rezultat.message };
      }
    } catch (err) {
      uploadStatus.value = { type: 'danger', msg: "Nevalidan JSON format." };
    }
  };
  reader.readAsText(fajl);
};

// 3. Brisanje kompletnog fajla i njegovih računa
const obrisiFajlIzBaze = async (idFajla) => {
  if(!confirm("Da li ste sigurni? Ovo će obrisati sve račune vezane za ovaj fajl.")) return;

  try {
    await db.transaction('rw', db.fajlovi, db.racuni, async () => {
      // Prvo brišemo račune koji imaju taj fileId
      await db.racuni.where({ fileId: idFajla }).delete();
      // Onda brišemo zapis o fajlu
      await db.fajlovi.delete(idFajla);
    });
    await osveziPodatke();
  } catch (e) {
    alert("Greška pri brisanju: " + e.message);
  }
};

// 4. Brisanje cele baze (opciono)
const obrisiSve = async () => {
  if(!confirm("Ovo briše KOMPLETNU bazu. Da li ste sigurni?")) return;
  await db.delete();
  await db.open(); // Ponovo otvori praznu
  await osveziPodatke();
}

// Na mount komponente učitaj podatke
onMounted(() => {
  osveziPodatke();
});
</script>

<template>
  <div class="container-xl">

    <div class="row row-cards mb-4">

      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header ">
            <h3 class="card-title">Uvoz novih računa</h3>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <input class="form-control" type="file" ref="fileInput" accept=".json"/>
            </div>
            <button @click="odradiUpload" class="btn btn-primary w-100" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              Uvezi u bazu
            </button>

            <div v-if="uploadStatus" :class="`alert alert-${uploadStatus.type} mt-3 mb-0`">
              {{ uploadStatus.msg }}
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card h-100" style="max-height: 300px; overflow-y: auto;">
          <div class="card-header d-flex justify-content-between">
            <h3 class="card-title">Istorija uvoza</h3>
            <button v-if="uvezeniFajlovi.length > 0" @click="obrisiSve" class="btn btn-sm btn-outline-danger">Obriši sve</button>
          </div>
          <div class="table-responsive">
            <table class="table table-vcenter card-table table-sm">
              <thead>
              <tr>
                <th>Fajl</th>
                <th>Period</th>
                <th>Računa</th>
                <th></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="f in uvezeniFajlovi" :key="f.id">
                <td class="text-truncate" style="max-width: 150px;" :title="f.imeFajla">{{ f.imeFajla }}</td>
                <td class="small text-muted">
                  {{ formatirajDatum(f.datumOd) }} - {{ formatirajDatum(f.datumDo) }}
                </td>
                <td>{{ f.brojRacuna }}</td>
                <td class="text-end">
                  <button class="btn btn-icon btn-ghost-danger btn-sm" @click="obrisiFajlIzBaze(f.id)" title="Obriši ovaj uvoz">
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
    <div class="card card-body mb-4">
      <label class="row">
        <span class="col">Prikaži Racune</span>
        <span class="col-auto">
              <label class="form-check form-check-single form-switch">
              <input class="form-check-input" type="checkbox" checked="" v-model="pokaziRacune">
               </label>
              </span>
      </label>
    </div>
    <div class="card" v-if="pokaziRacune">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="card-title">Pregled svih računa u bazi</h3>
          <span class="badge bg-blue-lt">Ukupno: {{ racuni.length }}</span>
        </div>
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <div class="mt-2">Učitavanje podataka iz baze...</div>
        </div>

        <table v-else class="table table-hover table-vcenter">
          <thead>
          <tr class="table-light">
            <th>PFR Broj</th>
            <th>Tip / Datum</th>
            <th class="text-center">Iznos</th>
          </tr>
          </thead>
          <tbody>
          <template v-for="rac in racuni" :key="rac.invoiceNumber">
            <tr :class="[
          {'table-danger': rac.TransactionType === 'Рефундација'},
          {'table-info': rac.InvoiceType === 'Аванс' && rac.TransactionType !== 'Рефундација'}
      ]">
              <td>
                <button class="btn btn-sm w-100 text-truncate"
                        :class="[
                    {'btn-danger': rac.TransactionType === 'Рефундација'},
                    {'btn-primary': rac.InvoiceType === 'Аванс' && rac.TransactionType !== 'Рефундација'},
                    {'btn-outline-dark': rac.InvoiceType === 'Промет' && rac.TransactionType === 'Продаја'}
                  ]"
                        data-bs-toggle="modal" data-bs-target="#exampleModal"
                        @click="odabraniRacun = rac; pfrModal = rac.invoiceNumber">
                  {{ rac.invoiceNumber }}
                </button>
              </td>
              <td>
                <span v-if="rac.TransactionType === 'Рефундација'" class="badge bg-danger me-1">REF</span>
                {{ rac.SDCTime_ServerTimeZone }}
              </td>
              <td class="text-end fw-bold"
                  :class="{'text-danger': rac.TotalAmount < 0}">
                {{ formatirajBroj(rac.TotalAmount) }} din.
              </td>
            </tr>
          </template>
          <tr v-if="racuni.length === 0">
            <td colspan="3" class="text-center py-4 text-muted">Baza je prazna. Uvezite JSON fajl.</td>
          </tr>
          </tbody>

          <tfoot class="table-light border-top border-3" v-if="racuni.length > 0">
          <tr>
            <td colspan="2" class="text-end text-uppercase fw-bold">Ukupan Promet:</td>
            <td class="text-end fw-bold fs-5" :class="{'text-danger': ukupanZbirPromet < 0}">
              {{ formatirajBroj(ukupanZbirPromet) }} din.
            </td>
          </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div class="modal fade" id="exampleModal" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-truncate">{{ pfrModal }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <PregledRacuna v-if="odabraniRacun" :data="odabraniRacun"/>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zatvori</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Opciono: da se tabela lepše ponaša na manjim ekranima */
.table-responsive {
  scrollbar-width: thin;
}
</style>
