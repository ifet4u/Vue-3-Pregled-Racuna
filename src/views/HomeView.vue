<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { db, popraviNeispravneDatume } from "@/data/db.js";
import { isExcludedInvoice, getNetInvoiceAmount, getRefundAmount } from "@/utils/invoiceHelpers.js";
import ApexChart from "vue3-apexcharts";

// --- STATE ---
const isLoading = ref(true);
const datumOd = ref('');
const datumDo = ref('');
const stats = ref({
  ukupanPromet: 0,
  refundacije: 0,
  brojRacuna: 0,
  brojFajlova: 0,
  brojIskljucenih: 0,
  brojProdaja: 0,
  brojRefundacija: 0
});
const detalji = ref(true); // Prikaži artikle podrazumevano
const najprodavanijiArtikli = ref([]);
const pibObveznika = ref('');
const lokacijaObveznika = ref('');

// --- COMPUTED ZA IZVEŠTAJ ---
const tipIzvestaja = computed(() => {
  if (!datumOd.value && !datumDo.value) {
    return "PERIODIČNI FISKALNI IZVEŠTAJ (Sve vreme)";
  }
  if (datumOd.value && datumOd.value === datumDo.value) {
    return "DNEVNI FISKALNI IZVEŠTAJ";
  }
  return "PERIODIČNI FISKALNI IZVEŠTAJ";
});

const tipTasteraIzvestaja = computed(() => {
  if (datumOd.value && datumDo.value && datumOd.value === datumDo.value) {
    return "dnevni izveštaj";
  }
  return "periodični izveštaj";
});

const periodIzvestajaText = computed(() => {
  if (!datumOd.value && !datumDo.value) {
    return "Za ceo period poslovanja";
  }
  
  const formatirajD = (dStr) => {
    if (!dStr) return '';
    const [y, m, d] = dStr.split('-');
    return `${d}.${m}.${y}.`;
  };

  if (datumOd.value && datumDo.value && datumOd.value === datumDo.value) {
    return `Za dan: ${formatirajD(datumOd.value)}`;
  }
  
  if (datumOd.value && datumDo.value) {
    return `Za period: ${formatirajD(datumOd.value)} - ${formatirajD(datumDo.value)}`;
  }
  
  if (datumOd.value) {
    return `Od dana: ${formatirajD(datumOd.value)}`;
  }
  
  return `Do dana: ${formatirajD(datumDo.value)}`;
});

const stampajIzvestaj = () => {
  window.print();
};

// --- CHARTS STATE ---
const trendChartData = ref({ labels: [], values: [] });
const placanjeChartData = ref({ labels: [], values: [] });
const taxChartData = ref({ labels: [], values: [] });

// --- ARTICLES TABLE STATE ---
const artikliPretraga = ref('');
const trenutnaStranica = ref(1);
const artikalaPoStranici = ref(10);

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

const formatBrojBezValute = (vrednost) => {
  return new Intl.NumberFormat('sr-RS', {
    maximumFractionDigits: 2
  }).format(vrednost);
};

// --- BRZI FILTERI ---
const primeniBrziFilter = (tip) => {
  const danas = new Date();
  if (tip === 'danas') {
    datumOd.value = danas.toISOString().split('T')[0];
    datumDo.value = danas.toISOString().split('T')[0];
  } else if (tip === '30_dana') {
    const pre30 = new Date();
    pre30.setDate(danas.getDate() - 30);
    datumOd.value = pre30.toISOString().split('T')[0];
    datumDo.value = danas.toISOString().split('T')[0];
  } else if (tip === 'ovaj_mesec') {
    const prviUMesecu = new Date(danas.getFullYear(), danas.getMonth(), 1);
    // Korekcija za vremensku zonu da datum bude tačan YYYY-MM-DD
    const y = prviUMesecu.getFullYear();
    const m = String(prviUMesecu.getMonth() + 1).padStart(2, '0');
    datumOd.value = `${y}-${m}-01`;
    datumDo.value = danas.toISOString().split('T')[0];
  } else if (tip === 'prosli_mesec') {
    const prosliMesecPrvi = new Date(danas.getFullYear(), danas.getMonth() - 1, 1);
    const prosliMesecZadnji = new Date(danas.getFullYear(), danas.getMonth(), 0);
    
    const y1 = prosliMesecPrvi.getFullYear();
    const m1 = String(prosliMesecPrvi.getMonth() + 1).padStart(2, '0');
    datumOd.value = `${y1}-${m1}-01`;
    
    const y2 = prosliMesecZadnji.getFullYear();
    const m2 = String(prosliMesecZadnji.getMonth() + 1).padStart(2, '0');
    const d2 = String(prosliMesecZadnji.getDate()).padStart(2, '0');
    datumDo.value = `${y2}-${m2}-${d2}`;
  } else {
    datumOd.value = '';
    datumDo.value = '';
  }
  ucitajDashboardPodatke();
};

// --- LOGIKA ---
const ucitajDashboardPodatke = async () => {
  isLoading.value = true;
  try {
    stats.value.brojFajlova = await db.fajlovi.count();

    // Izvlačimo sve račune za filtriranje i grupisanje
    const sviRacuni = await db.racuni.toArray();

    if (sviRacuni.length > 0) {
      pibObveznika.value = sviRacuni[0].TIN || '';
      lokacijaObveznika.value = sviRacuni[0].LocationName || '';
    }

    let promet = 0;
    let refund = 0;
    stats.value.brojRacuna = 0;
    stats.value.brojIskljucenih = 0;
    stats.value.brojProdaja = 0;
    stats.value.brojRefundacija = 0;

    const mapaArtikala = new Map();
    const mapaTrenda = new Map();
    const mapaPlacanja = new Map();
    const mapaPoreza = new Map();

    const start = datumOd.value ? new Date(datumOd.value) : null;
    if (start) start.setHours(0, 0, 0, 0);

    const end = datumDo.value ? new Date(datumDo.value) : null;
    if (end) end.setHours(23, 59, 59, 999);

    sviRacuni.forEach(racun => {
      let datum = racun.date;
      
      // Defanzivna provera i konverzija
      if (!(datum instanceof Date) || isNaN(datum.getTime())) {
        datum = new Date(datum);
      }
      if (isNaN(datum.getTime())) {
        return; // Preskačemo račun sa neispravnim datumom
      }
      
      // Filtriranje po datumu
      if (start && datum < start) return;
      if (end && datum > end) return;

      // Brojanje isključenih računa
      if (isExcludedInvoice(racun)) {
        stats.value.brojIskljucenih++;
        return; // Preskačemo finansijske obračune
      }

      stats.value.brojRacuna++;

      const netoIznos = getNetInvoiceAmount(racun);
      const refundIznos = getRefundAmount(racun);

      promet += netoIznos;
      refund += refundIznos;

      if (racun.TransactionType === 'Рефундација' || netoIznos < 0) {
        stats.value.brojRefundacija++;
      } else {
        stats.value.brojProdaja++;
      }

      // Trend: grupisanje po danu (dan-mesec-godina format)
      const danKljuc = datum.toISOString().split('T')[0];
      mapaTrenda.set(danKljuc, (mapaTrenda.get(danKljuc) || 0) + netoIznos);

      // Grupisanje načina plaćanja
      const sign = (racun.TransactionType === 'Рефундација' || racun.TotalAmount < 0) ? -1 : 1;
      if (racun.Payments && Array.isArray(racun.Payments)) {
        racun.Payments.forEach(pay => {
          const tip = pay.Type || 'Ostalo';
          const iznosUplate = (pay.Amount || 0) * sign;
          mapaPlacanja.set(tip, (mapaPlacanja.get(tip) || 0) + iznosUplate);
        });
      }

      // Grupisanje poreza
      if (racun.TaxItems && Array.isArray(racun.TaxItems)) {
        racun.TaxItems.forEach(tax => {
          const naziv = `${tax.CategoryName} (${tax.Label} - ${tax.Rate}%)`;
          const iznosPoreza = (tax.Amount || 0) * sign;
          mapaPoreza.set(naziv, (mapaPoreza.get(naziv) || 0) + iznosPoreza);
        });
      }

      // Grupisanje artikala
      if (racun.Items && Array.isArray(racun.Items)) {
        racun.Items.forEach(item => {
          const kljuc = item.Name;

          if (!mapaArtikala.has(kljuc)) {
            mapaArtikala.set(kljuc, {
              naziv: item.Name,
              kolicina: 0,
              ukupno: 0,
              pojavljivanja: 0
            });
          }

          const entry = mapaArtikala.get(kljuc);
          entry.kolicina += item.Quantity * sign;
          entry.ukupno += item.TotalAmount * sign;
          entry.pojavljivanja += 1;
        });
      }
    });

    stats.value.ukupanPromet = promet;
    stats.value.refundacije = refund;

    // 1. Sortiranje i priprema podataka za trend grafikon
    const sortiraniDani = Array.from(mapaTrenda.keys()).sort();
    trendChartData.value = {
      labels: sortiraniDani.map(d => {
        const [y, m, day] = d.split('-');
        return `${day}.${m}.${y}.`;
      }),
      values: sortiraniDani.map(d => Math.round(mapaTrenda.get(d) * 100) / 100)
    };

    // 2. Priprema podataka za načine plaćanja
    const placanjaNiz = Array.from(mapaPlacanja.entries())
      .filter(([_, v]) => Math.abs(v) > 0.01)
      .sort((a, b) => b[1] - a[1]);

    placanjeChartData.value = {
      labels: placanjaNiz.map(([k, _]) => k),
      values: placanjaNiz.map(([_, v]) => Math.round(v * 100) / 100)
    };

    // 3. Priprema podataka za porez
    const poreziNiz = Array.from(mapaPoreza.entries())
      .filter(([_, v]) => Math.abs(v) > 0.01)
      .sort((a, b) => b[1] - a[1]);

    taxChartData.value = {
      labels: poreziNiz.map(([k, _]) => k),
      values: poreziNiz.map(([_, v]) => Math.round(v * 100) / 100)
    };

    // 4. Pretvaranje mape artikala u niz i sortiranje
    najprodavanijiArtikli.value = Array.from(mapaArtikala.values())
      .sort((a, b) => b.ukupno - a.ukupno);

    trenutnaStranica.value = 1; // Resetujemo na prvu stranicu pri filtriranju

  } catch (e) {
    console.error("Greška pri učitavanju dashboard-a:", e);
  } finally {
    isLoading.value = false;
  }
};

// --- COMPUTED ZA ARTIKLE ---
const filtriraniArtikli = computed(() => {
  if (!artikliPretraga.value.trim()) {
    return najprodavanijiArtikli.value;
  }
  const pretraga = artikliPretraga.value.toLowerCase();
  return najprodavanijiArtikli.value.filter(a =>
    a.naziv.toLowerCase().includes(pretraga)
  );
});

const ukupnoStranicaArtikala = computed(() => {
  return Math.ceil(filtriraniArtikli.value.length / artikalaPoStranici.value);
});

const prikazaniArtikli = computed(() => {
  const pocetak = (trenutnaStranica.value - 1) * artikalaPoStranici.value;
  const kraj = pocetak + artikalaPoStranici.value;
  return filtriraniArtikli.value.slice(pocetak, kraj);
});

const prosecanRacun = computed(() => {
  if (stats.value.brojRacuna === 0) return 0;
  return stats.value.ukupanPromet / stats.value.brojRacuna;
});

// --- CHART CONFIGURATIONS ---
const trendChartOptions = computed(() => ({
  chart: {
    type: 'area',
    height: 280,
    toolbar: { show: false },
    fontFamily: 'inherit'
  },
  colors: ['#206bc4'],
  stroke: { width: 2, curve: 'smooth' },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.05,
      stops: [0, 90, 100]
    }
  },
  xaxis: {
    categories: trendChartData.value.labels,
    labels: { rotate: -45, style: { fontSize: '10px' } }
  },
  yaxis: {
    labels: {
      formatter: (val) => formatBrojBezValute(val) + ' din.'
    }
  },
  dataLabels: { enabled: false },
  grid: { strokeDashArray: 4 },
  tooltip: {
    y: {
      formatter: (val) => formatValuta(val)
    }
  }
}));

const trendChartSeries = computed(() => [{
  name: 'Neto Promet',
  data: trendChartData.value.values
}]);

const placanjeChartOptions = computed(() => ({
  chart: {
    type: 'donut',
    fontFamily: 'inherit'
  },
  labels: placanjeChartData.value.labels,
  colors: ['#2fb344', '#206bc4', '#f76707', '#f59f00', '#d63939', '#6574cd', '#a8a8a8'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: true },
  tooltip: {
    y: {
      formatter: (val) => formatValuta(val)
    }
  }
}));

const placanjeChartSeries = computed(() => placanjeChartData.value.values);

const taxChartOptions = computed(() => ({
  chart: {
    type: 'donut',
    fontFamily: 'inherit'
  },
  labels: taxChartData.value.labels,
  colors: ['#6574cd', '#4299e1', '#f59f00', '#2fb344', '#d63939'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: true },
  tooltip: {
    y: {
      formatter: (val) => formatValuta(val)
    }
  }
}));

const taxChartSeries = computed(() => taxChartData.value.values);

onMounted(async () => {
  await popraviNeispravneDatume();
  ucitajDashboardPodatke();
});

// Osveži podatke pri promeni datuma preko date-inputa
watch([datumOd, datumDo], () => {
  // Ali ne radimo to automatski na svaki klik ako korisnik kuca, nego pustimo da osvezi Dashboard
});
</script>

<template>
  <div class="container-xl">
    <div class="d-print-none">
      <!-- PAGE HEADER -->
      <div class="page-header mb-4">
        <div class="row align-items-center">
          <div class="col">
            <div class="page-pretitle">Pregled</div>
            <h2 class="page-title">Finansijski Dashboard</h2>
          </div>
          <div class="col-auto ms-auto">
            <div class="btn-list">
              <button @click="stampajIzvestaj" class="btn btn-outline-primary" :disabled="stats.brojRacuna === 0">
                <i class="ti ti-printer me-2"></i>Štampaj {{ tipTasteraIzvestaja }}
              </button>
              <router-link to="/racuni" class="btn btn-primary">
                <i class="ti ti-upload me-2"></i> Uvoz i istorija
              </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- DATE FILTERS -->
    <div class="card mb-4 d-print-none">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-3 col-sm-6">
            <label class="form-label text-muted small">Datum od</label>
            <input type="date" v-model="datumOd" class="form-control" @change="ucitajDashboardPodatke">
          </div>
          <div class="col-md-3 col-sm-6">
            <label class="form-label text-muted small">Datum do</label>
            <input type="date" v-model="datumDo" class="form-control" @change="ucitajDashboardPodatke">
          </div>
          <div class="col-md-6 col-sm-12">
            <label class="form-label text-muted small">Brzi filteri</label>
            <div class="btn-group w-100">
              <button class="btn btn-outline-secondary btn-sm" @click="primeniBrziFilter('danas')">Danas</button>
              <button class="btn btn-outline-secondary btn-sm" @click="primeniBrziFilter('30_dana')">30 dana</button>
              <button class="btn btn-outline-secondary btn-sm" @click="primeniBrziFilter('ovaj_mesec')">Ovaj mesec</button>
              <button class="btn btn-outline-secondary btn-sm" @click="primeniBrziFilter('prosli_mesec')">Prošli mesec</button>
              <button class="btn btn-outline-danger btn-sm" @click="primeniBrziFilter('sve')">Poništi</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- LOADER -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <div class="text-muted">Kalkulisanje statistike i grafikona...</div>
    </div>

    <!-- MAIN DASHBOARD CONTENT -->
    <div v-else>
      <!-- KPI STATS CARDS -->
      <div class="row row-deck row-cards mb-4">
        <!-- NET TURNOVER -->
        <div class="col-sm-6 col-lg-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="subheader">Neto Promet</div>
              </div>
              <div class="h1 mb-2 mt-1 me-2" :class="{'text-danger': stats.ukupanPromet < 0, 'text-success': stats.ukupanPromet >= 0}">
                {{ formatValuta(stats.ukupanPromet) }}
              </div>
              <div class="text-muted small">
                Ukupan promet umanjen za refundacije
              </div>
            </div>
          </div>
        </div>

        <!-- TOTAL REFUNDED -->
        <div class="col-sm-6 col-lg-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="subheader text-danger">Ukupno Refundirano</div>
              </div>
              <div class="h1 mb-2 mt-1 me-2 text-danger">
                - {{ formatValuta(stats.refundacije) }}
              </div>
              <div class="text-muted small">
                Ukupan povraćaj novca kupcima
              </div>
            </div>
          </div>
        </div>

        <!-- AVERAGE TICKET -->
        <div class="col-sm-6 col-lg-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="subheader">Prosečna Vrednost Računa</div>
              </div>
              <div class="h1 mb-2 mt-1 me-2 text-primary">
                {{ formatValuta(prosecanRacun) }}
              </div>
              <div class="text-muted small">
                Neto promet podeljen brojem računa
              </div>
            </div>
          </div>
        </div>

        <!-- TRANSACTION COUNTS -->
        <div class="col-sm-6 col-lg-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="subheader">Broj Dokumenata</div>
              </div>
              <div class="d-flex align-items-baseline mt-1">
                <div class="h1 mb-0 me-2">{{ formatBroj(stats.brojRacuna) }}</div>
                <div class="me-auto">
                  <span class="text-muted text-xs">Aktivnih računa</span>
                </div>
              </div>
              <div class="mt-2 text-muted text-xs d-flex justify-content-between">
                <span>Iz {{ stats.brojFajlova }} fajlova</span>
                <span v-if="stats.brojIskljucenih > 0" class="text-warning fw-bold" :title="`Ignorisano ${stats.brojIskljucenih} računa (Obuka / Kopija / Predračun)`">
                  Ignorisano: {{ stats.brojIskljucenih }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHARTS ROW -->
      <div class="row row-cards mb-4">
        <!-- TREND LINE CHART -->
        <div class="col-lg-8">
          <div class="card">
            <div class="card-body">
              <h3 class="card-title">Trend Neto Prometa po Danima</h3>
              <div v-if="trendChartData.labels.length > 0">
                <ApexChart type="area" height="280" :options="trendChartOptions" :series="trendChartSeries" />
              </div>
              <div v-else class="text-center py-5 text-muted">
                Nema dovoljno podataka za prikaz grafikona trenda.
              </div>
            </div>
          </div>
        </div>

        <!-- PAYMENT AND TAX PIE CHARTS -->
        <div class="col-lg-4 d-flex flex-column gap-4">
          <!-- PAYMENT BREAKDOWN -->
          <div class="card flex-fill">
            <div class="card-body">
              <h3 class="card-title">Načini Plaćanja (Neto)</h3>
              <div v-if="placanjeChartSeries.length > 0">
                <ApexChart type="donut" height="200" :options="placanjeChartOptions" :series="placanjeChartSeries" />
              </div>
              <div v-else class="text-center py-5 text-muted small">
                Nema podataka o načinima plaćanja.
              </div>
            </div>
          </div>

          <!-- TAX BREAKDOWN -->
          <div class="card flex-fill">
            <div class="card-body">
              <h3 class="card-title">Poreske Stope (Neto PDV)</h3>
              <div v-if="taxChartSeries.length > 0">
                <ApexChart type="donut" height="200" :options="taxChartOptions" :series="taxChartSeries" />
              </div>
              <div v-else class="text-center py-5 text-muted small">
                Nema podataka o pdv stopama.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ARTICLES ACCORDION / TOGGLE -->
      <div class="card card-body mb-4 d-print-none">
        <label class="row align-items-center mb-0" style="cursor: pointer;">
          <span class="col fw-bold">Prikaži statistiku prodatih artikala (Grupisano)</span>
          <span class="col-auto">
            <label class="form-check form-check-single form-switch mb-0">
              <input class="form-check-input" type="checkbox" v-model="detalji">
            </label>
          </span>
        </label>
      </div>

      <!-- ARTICLES TABLE (WITH PAGINATION AND SEARCH) -->
      <div class="card mb-5" v-if="detalji">
        <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h3 class="card-title mb-0">Prodati Artikli (Neto agregacija)</h3>
          <!-- Search input inside header -->
          <div class="input-icon" style="max-width: 300px; width: 100%;">
            <span class="input-icon-addon">
              <i class="ti ti-search"></i>
            </span>
            <input type="text" v-model="artikliPretraga" class="form-control form-control-sm" placeholder="Pretraži artikle..." @input="trenutnaStranica = 1">
          </div>
        </div>

        <div class="table-responsive">
          <table class="table card-table table-vcenter text-nowrap table-hover">
            <thead>
              <tr class="table-light">
                <th>Naziv Artikla</th>
                <th class="text-end">Količina</th>
                <th class="text-end">Ukupan Iznos</th>
                <th class="text-end">Prosečna Cena</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="artikal in prikazaniArtikli" :key="artikal.naziv">
                <td>
                  <div class="font-weight-medium">{{ artikal.naziv }}</div>
                  <div class="small text-muted">Na {{ artikal.pojavljivanja }} računa</div>
                </td>
                <td class="text-end fw-semibold">
                  {{ formatBroj(artikal.kolicina) }}
                </td>
                <td class="text-end fw-bold text-success" :class="{'text-danger': artikal.ukupno < 0}">
                  {{ formatValuta(artikal.ukupno) }}
                </td>
                <td class="text-end text-muted">
                  {{ formatValuta(artikal.kolicina !== 0 ? artikal.ukupno / artikal.kolicina : 0) }}
                </td>
              </tr>
              <tr v-if="filtriraniArtikli.length === 0">
                <td colspan="4" class="text-center py-4 text-muted">
                  Nema artikala koji odgovaraju pretrazi ili nema uvoza.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION CONTROLS -->
        <div class="card-footer d-flex align-items-center justify-content-between" v-if="ukupnoStranicaArtikala > 1">
          <p class="m-0 text-muted small">
            Prikazano <span>{{ (trenutnaStranica - 1) * artikalaPoStranici + 1 }}</span> do
            <span>{{ Math.min(trenutnaStranica * artikalaPoStranici, filtriraniArtikli.length) }}</span>
            od <span>{{ filtriraniArtikli.length }}</span> artikala
          </p>
          <ul class="pagination m-0 ms-auto">
            <li class="page-item" :class="{ disabled: trenutnaStranica === 1 }">
              <button class="page-link" @click="trenutnaStranica--" :disabled="trenutnaStranica === 1">
                <i class="ti ti-chevron-left"></i>
              </button>
            </li>
            
            <!-- Simplified pagination: show active page and around pages -->
            <template v-for="str in ukupnoStranicaArtikala" :key="str">
              <li class="page-item" v-if="str === 1 || str === ukupnoStranicaArtikala || Math.abs(str - trenutnaStranica) <= 2" :class="{ active: trenutnaStranica === str }">
                <button class="page-link" @click="trenutnaStranica = str">{{ str }}</button>
              </li>
              <li class="page-item disabled" v-else-if="str === 2 || str === ukupnoStranicaArtikala - 1">
                <span class="page-link">...</span>
              </li>
            </template>

            <li class="page-item" :class="{ disabled: trenutnaStranica === ukupnoStranicaArtikala }">
              <button class="page-link" @click="trenutnaStranica++" :disabled="trenutnaStranica === ukupnoStranicaArtikala">
                <i class="ti ti-chevron-right"></i>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- Zatvaranje d-print-none omotača ekrana -->
    </div>
    
    <!-- ŠTAMPANI FISKALNI IZVEŠTAJ (VIDLJIV SAMO NA ŠTAMPI) -->
    <div class="d-none d-print-block print-report-container">
      <div class="print-report-paper">
        <!-- Obveznik -->
        <div class="text-center mb-3">
          <h3 class="merchant-name">{{ lokacijaObveznika || 'LOKACIJA OBVEZNIKA' }}</h3>
          <p class="merchant-info">
            <strong>PIB:</strong> {{ pibObveznika || 'N/A' }}
          </p>
          <div class="divider-dashed-print"></div>
          <h4 class="receipt-title">{{ tipIzvestaja }}</h4>
          <div class="receipt-type text-uppercase fw-bold text-sm">
            {{ periodIzvestajaText }}
          </div>
          <div class="small text-muted mt-1 font-monospace" style="font-size: 0.75rem;">
            Vreme štampe: {{ new Date().toLocaleString('sr-RS') }}
          </div>
          <div class="divider-dashed-print"></div>
        </div>

        <!-- Finansijski rezime -->
        <div class="mb-3 font-monospace">
          <div class="d-flex justify-content-between">
            <span>PROMET PRODAJE (+):</span>
            <strong>{{ formatValuta(stats.ukupanPromet + stats.refundacije) }}</strong>
          </div>
          <div class="d-flex justify-content-between text-danger">
            <span>POVRAĆAJ / REFUNDACIJA (-):</span>
            <strong>-{{ formatValuta(stats.refundacije) }}</strong>
          </div>
          <div class="divider-dashed-print"></div>
          <div class="d-flex justify-content-between fs-3 fw-bold">
            <span>NETO PROMET:</span>
            <span>{{ formatValuta(stats.ukupanPromet) }}</span>
          </div>
        </div>

        <div class="divider-dashed-print"></div>

        <!-- Porez po stopama -->
        <div class="mb-3 font-monospace text-sm">
          <h5 class="text-uppercase fw-bold mb-2">Porezi po poreskim stopama</h5>
          <div class="d-flex justify-content-between fw-bold border-bottom pb-1 mb-1" style="font-size: 0.75rem;">
            <span>Stopa / Kategorija</span>
            <span>Neto PDV Iznos</span>
          </div>
          <div v-for="(val, idx) in taxChartData.values" :key="idx" class="d-flex justify-content-between text-muted py-1" style="font-size: 0.8rem;">
            <span>{{ taxChartData.labels[idx] }}</span>
            <span>{{ formatValuta(val) }}</span>
          </div>
          <div v-if="taxChartData.values.length === 0" class="text-center py-2 text-muted">
            Nema podataka o porezima.
          </div>
        </div>

        <div class="divider-dashed-print"></div>

        <!-- Načini plaćanja -->
        <div class="mb-3 font-monospace text-sm">
          <h5 class="text-uppercase fw-bold mb-2">Uplate po načinima plaćanja</h5>
          <div v-for="(val, idx) in placanjeChartData.values" :key="idx" class="d-flex justify-content-between py-1" style="font-size: 0.8rem;">
            <span>Uplata: {{ placanjeChartData.labels[idx] }}</span>
            <strong>{{ formatValuta(val) }}</strong>
          </div>
          <div v-if="placanjeChartData.values.length === 0" class="text-center py-2 text-muted">
            Nema podataka o uplatama.
          </div>
        </div>

        <div class="divider-dashed-print"></div>

        <!-- Statistika dokumenata -->
        <div class="mb-3 font-monospace text-xs text-muted">
          <h5 class="text-uppercase fw-bold mb-2 text-dark">Statistika dokumenata</h5>
          <div class="d-flex justify-content-between">
            <span>Broj prodajnih računa:</span>
            <span>{{ stats.brojProdaja }}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span>Broj refundacija:</span>
            <span>{{ stats.brojRefundacija }}</span>
          </div>
          <div class="d-flex justify-content-between fw-bold text-dark border-top pt-1 mt-1">
            <span>Ukupno obrađenih računa:</span>
            <span>{{ stats.brojRacuna }}</span>
          </div>
          <div class="d-flex justify-content-between mt-1" v-if="stats.brojIskljucenih > 0">
            <span>Ignorisano (Kopije/Obuka):</span>
            <span>{{ stats.brojIskljucenih }}</span>
          </div>
        </div>

        <div class="divider-dashed-print"></div>
        <p class="text-center fw-bold mt-3 font-monospace text-uppercase" style="letter-spacing: 2px;">
          Kraj Izveštaja
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.subheader {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #626976;
}
.btn-group .btn {
  padding: 0.4rem 0.6rem;
}

/* Stilovi za štampu izveštaja */
.print-report-container {
  display: none;
}

@media print {
  /* Sakrij standardni ekran */
  .d-print-none,
  header,
  .navbar,
  .page-header,
  .card,
  .btn-list,
  .btn,
  footer {
    display: none !important;
  }

  body {
    background-color: white !important;
    color: black !important;
    font-size: 12px !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .d-print-block {
    display: block !important;
  }

  .print-report-container {
    display: flex !important;
    justify-content: center;
    width: 100%;
    background-color: white;
  }

  .print-report-paper {
    width: 100%;
    max-width: 440px;
    padding: 10px;
    font-family: 'Courier New', Courier, monospace;
    color: #000;
  }

  .merchant-name {
    font-size: 1.2rem;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .merchant-info {
    font-size: 0.85rem;
    margin-bottom: 8px;
  }

  .receipt-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 6px 0;
  }

  .receipt-type {
    font-size: 0.85rem;
  }

  .divider-dashed-print {
    border-top: 1px dashed #000 !important;
    margin: 12px 0;
    height: 0;
  }
}
</style>
