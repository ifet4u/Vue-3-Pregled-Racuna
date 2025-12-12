<script setup>
import { ref, onMounted, computed } from 'vue';
import {db} from "@/data/db.js";

// --- STATE ---
const isLoading = ref(true);
const stats = ref({
  ukupanPromet: 0,
  refundacije: 0,
  brojRacuna: 0,
  brojFajlova: 0
});
const detalji = ref(false)
const najprodavanijiArtikli = ref([]);

// --- FORMATIRANJE ---
const formatValuta = (vrednost) => {
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    minimumFractionDigits: 2
  }).format(vrednost);
};

const formatBroj = (vrednost) => {
  return new Intl.NumberFormat('sr-RS').format(vrednost);
};

// --- LOGIKA ---
const ucitajDashboardPodatke = async () => {
  isLoading.value = true;
  try {
    // 1. Osnovna statistika (brojanje fajlova)
    stats.value.brojFajlova = await db.fajlovi.count();

    // 2. Izvlačenje svih računa za analitiku
    // U pravoj velikoj aplikaciji ovo bi se radilo pametnije (npr. cursorima),
    // ali za IndexedDB ovo radi brzo i za 10k+ računa.
    const sviRacuni = await db.racuni.toArray();
    stats.value.brojRacuna = sviRacuni.length;

    let promet = 0;
    let refund = 0;
    const mapaArtikala = new Map(); // Koristimo mapu za grupisanje artikala

    // 3. Iteracija kroz račune
    sviRacuni.forEach(racun => {
      // A) Finansije
      const iznos = racun.TotalAmount || 0;

      // Ako je refundacija (TransactionType) ili negativan iznos
      if (racun.TransactionType === 'Рефундација' || iznos < 0) {
        refund += Math.abs(iznos); // Čuvamo kao pozitivan broj za prikaz
        promet += iznos; // Oduzimamo od prometa (jer je iznos negativan)
      } else {
        promet += iznos;
      }

      // B) Agregacija Artikala (Proveravamo da li račun ima Items)
      if (racun.Items && Array.isArray(racun.Items)) {
        racun.Items.forEach(item => {
          const kljuc = item.Name; // Grupisemo po imenu

          if (!mapaArtikala.has(kljuc)) {
            mapaArtikala.set(kljuc, {
              naziv: item.Name,
              kolicina: 0,
              ukupno: 0,
              pojavljivanja: 0
            });
          }

          const entry = mapaArtikala.get(kljuc);
          entry.kolicina += item.Quantity;
          entry.ukupno += item.TotalAmount;
          entry.pojavljivanja += 1;
        });
      }
    });

    stats.value.ukupanPromet = promet;
    stats.value.refundacije = refund;

    // 4. Konvertujemo Mapu artikala u niz i sortiramo
    najprodavanijiArtikli.value = Array.from(mapaArtikala.values())
      .sort((a, b) => b.ukupno - a.ukupno) // Sortiraj po zaradi (najveća prva)
    // .slice(0, 100); // Opciono: Uzmi samo top 100 da ne gušiš tabelu

  } catch (e) {
    console.error("Greška pri učitavanju dashboard-a:", e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  ucitajDashboardPodatke();
});
</script>

<template>
  <div class="container-xl">

    <div class="page-header d-print-none mb-4">
      <div class="row align-items-center">
        <div class="col">
          <div class="page-pretitle">Pregled</div>
          <h2 class="page-title">Finansijski Dashboard</h2>
        </div>
        <div class="col-auto ms-auto d-print-none">
          <div class="btn-list">
            <span class="d-none d-sm-inline">
              <router-link to="/racuni" class="btn btn-white">
                Učitaj nove račune
              </router-link>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <div v-else>
      <div class="row row-deck row-cards mb-4">

        <div class="col-sm-6 col-lg-4">
          <div class="card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="subheader">Neto Promet</div>
              </div>
              <div class="h1 mb-3 me-2" :class="{'text-danger': stats.ukupanPromet < 0, 'text-success': stats.ukupanPromet >= 0}">
                {{ formatValuta(stats.ukupanPromet) }}
              </div>
              <div class="d-flex mb-2">
                <div>Ukupan promet umanjen za refundacije</div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-sm-6 col-lg-4">
          <div class="card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="subheader text-danger">Ukupno Refundirano</div>
              </div>
              <div class="h1 mb-3 me-2 text-danger">
                - {{ formatValuta(stats.refundacije) }}
              </div>
              <div class="d-flex mb-2">
                Novac vraćen kupcima
              </div>
            </div>
          </div>
        </div>

        <div class="col-sm-6 col-lg-4">
          <div class="card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="subheader">Sistem</div>
              </div>
              <div class="d-flex align-items-baseline">
                <div class="h1 mb-0 me-2">{{ formatBroj(stats.brojRacuna) }}</div>
                <div class="me-auto">
                  <span class="text-muted d-inline-block align-middle">Računa</span>
                </div>
              </div>
              <div class="mt-3 text-muted">
                Uvezeno kroz {{ stats.brojFajlova }} fajl(ova)
              </div>
            </div>
          </div>
        </div>

      </div>
      <div class="card card-body mb-4">
        <label class="row">
          <span class="col">Prikaži Artikle</span>
          <span class="col-auto">
              <label class="form-check form-check-single form-switch">
              <input class="form-check-input" type="checkbox" checked="" v-model="detalji">
               </label>
              </span>
        </label>
      </div>
      <div class="card" v-if="detalji">
        <div class="card-header ">
          <h3 class="card-title">Pregled prodatih artikala (Grupisano)</h3>
        </div>

        <div class="table-responsive" >
          <table class="table card-table table-vcenter text-nowrap datatable">
            <thead>
            <tr>
              <th>Naziv Artikla</th>
              <th class="text-end">Prodata Količina</th>
              <th class="text-end">Ukupan Iznos</th>
              <th class="text-end">Prosečna Cena</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="artikal in najprodavanijiArtikli" :key="artikal.naziv" >
              <td>
                <span class="text-reset">{{ artikal.naziv }}</span>
                <div class="small text-muted">Na {{ artikal.pojavljivanja }} računa</div>
              </td>
              <td class="text-end">
                {{ formatBroj(artikal.kolicina) }}
              </td>
              <td class="text-end fw-bold">
                {{ formatValuta(artikal.ukupno) }}
              </td>
              <td class="text-end text-muted">
                {{ formatValuta(artikal.ukupno / artikal.kolicina) }}
              </td>
            </tr>
            <tr v-if="najprodavanijiArtikli.length === 0">
              <td colspan="4" class="text-center py-4">Nema podataka. Uvezite račune u sekciji 'Računi'.</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>
