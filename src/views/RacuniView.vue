<template>
  <div class="about container">
    <div class="row">
      <div class="col col-sm-12 card">
        <div class="card-body">
          <div class="card-title d-flex justify-content-between">
            <span>Pregled Json racuna </span>
            <button class="btn btn-danger btn-sm" v-if="!praznaListaRacuna"
                    @click="obrisiListuRacuna">
              Obrisi
            </button>
          </div>
          <div class="text-primary" v-if="loadRacuni"><h1>Loading<span class="animated-dots"></span>
          </h1></div>
          <div class="text-danger" v-if="errorLoadingRacuna">{{ errorLoadingRacuna }}</div>
          <p v-if="praznaListaRacuna">
            <label for="formFile" class="form-label">Uploadaj fajl sa računima loading</label>
            <input class="form-control" type="file" id="formFile" ref="fileInput"/>
            <button @click="odradiUpload" class="btn btn-primary mt-3">Procitaj fajl</button>
          </p>
          <table v-else>
            <thead>
            <tr class="table-light">
              <th colspan="3" class="text-center fw-bold ">
                Lista računa
              </th>
            </tr>
            <tr>
              <th>PFR</th>
              <th>Datum/vreme</th>
              <th class="text-center">Iznos</th>
            </tr>
            </thead>
            <tbody>
            <template v-for="rac in listaRacuna" :key="rac.InvoiceNumber">
              <tr
                :class="[
                {'text-danger' :rac.InvoiceType === 'Повраћај' },
                {'text-primary' :rac.InvoiceType=== 'Аванс' }
                ]">
                <td>
                  <button class="btn btn-sm  w-100"
                          :class="[
                                  {'btn-danger' :rac.InvoiceType === 'Повраћај' },
                                  {'btn-primary' :rac.InvoiceType=== 'Аванс' }
                                  ]"
                          data-bs-toggle="modal" data-bs-target="#exampleModal"
                          @click="racun = rac; pfr = rac.InvoiceNumber">
                    {{ rac.InvoiceNumber }}
                  </button>
                </td>
                <td>{{ rac.SDCTime_ServerTimeZone }}</td>
                <td class="text-end">{{ formatirajBroj(rac.TotalAmount) }} din.</td>
              </tr>
            </template>
            </tbody>
          </table>
          <div class="modal" id="exampleModal" tabindex="-1">
            <div class="modal-dialog" role="document">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">{{ pfr }}</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal"
                          aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <PregledRacuna v-if="racun" :data="racun"/>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn me-auto" data-bs-dismiss="modal">Close</button>
                  <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Save
                    changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import {ref} from "vue";
import PregledRacuna from "@/components/PregledRacuna.vue";
import {
  listaRacuna,
  praznaListaRacuna,
  errorLoadingRacuna,
  loadRacuni,
  uploadjujFajl,
  obrisiListuRacuna
} from "@/data/listaRacuna.js";

const racun = ref(null);
const pfr = ref('');
// **ISPRAVKA 1:** Deklarisanje reference za input polje
const fileInput = ref(null);
const odradiUpload = () => { // na ovakav nacin se poziva funkcija izvan skripta sa parametrom
  uploadjujFajl(fileInput);
}
const formatirajBroj = (value) => { // preporuka je korisitit arrow funkcije i konstante umeto pravih funkcija
  if (value === null || value === undefined) return ''
  return new Intl.NumberFormat('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
</script>
<!--{-->
<!--"InvoiceNumber":"VPS2YJ5W-VPS2YJ5W-2932",-->
<!--"TIN":"100502068",-->
<!--"LocationName":"POSLOVNI CENTAR CARA DUSANA",-->
<!--"RequestedBy":"VPS2YJ5W",-->
<!--"DateAndTimeOfPos":"",-->
<!--"Cashier":"92 Nemanja Kukulj",-->
<!--"BuyerTin":"10:105081084",-->
<!--"BuyersCostCenter":null,-->
<!--"PosInvoiceNumber":"630/3.0",-->
<!--"Payments":[-->
<!--{-->
<!--"Amount":12314.0000,-->
<!--"Type":"Пренос на рачун"-->
<!--}-->
<!--],-->
<!--"SDCTime_ServerTimeZone":"31.05.2023. 20:00:34",-->
<!--"InvoiceCounter":"2752/2932ПП",-->
<!--"SignedBy":"VPS2YJ5W",-->
<!--"TotalAmount":12314.0000,-->
<!--"TransactionType":"Продаја",-->
<!--"InvoiceType":"Промет",-->
<!--"PaymentsAmount":12314.0000,-->
<!--"Items":[-->
<!--{-->
<!--"GTIN":"",-->
<!--"Name":"21461000 LASA P 175/65 R14 82H GREENWAY (Ђ)/kom",-->
<!--"Quantity":2.0000,-->
<!--"Labels":[-->
<!--"Ђ"-->
<!--],-->
<!--"UnitPrice":5137.0000,-->
<!--"TotalAmount":10274.0000-->
<!--},-->
<!--{-->
<!--"GTIN":"",-->
<!--"Name":"HAR8004140 HAR VENTIL PUT TR 414 (Ђ)/kom",-->
<!--"Quantity":2.0000,-->
<!--"Labels":[-->
<!--"Ђ"-->
<!--],-->
<!--"UnitPrice":100.0000,-->
<!--"TotalAmount":200.0000-->
<!--},-->
<!--{-->
<!--"GTIN":"",-->
<!--"Name":"U88157 USLUGA D-M GUME A&K (Ђ)/h",-->
<!--"Quantity":2.0000,-->
<!--"Labels":[-->
<!--"Ђ"-->
<!--],-->
<!--"UnitPrice":270.0000,-->
<!--"TotalAmount":540.0000-->
<!--},-->
<!--{-->
<!--"GTIN":"",-->
<!--"Name":"U88022 USLUGA BALANS DO 15' ALU (Ђ)/h",-->
<!--"Quantity":2.0000,-->
<!--"Labels":[-->
<!--"Ђ"-->
<!--],-->
<!--"UnitPrice":650.0000,-->
<!--"TotalAmount":1300.0000-->
<!--}-->
<!--],-->
<!--"TaxItems":[-->
<!--{-->
<!--"Label":"Ђ",-->
<!--"Amount":2052.3333,-->
<!--"Rate":20.00,-->
<!--"CategoryName":"О-ПДВ"-->
<!--}-->
<!--]-->
<!--}-->
