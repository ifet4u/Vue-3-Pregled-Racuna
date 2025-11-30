<script setup>
import {listaRacuna,praznaListaRacuna} from "@/data/listaRacuna.js";
</script>

<template>
  <main>
    <h1 class="mb-3">Lista Artikala</h1>
    <h3 v-if="praznaListaRacuna">Nema racuna u listi, ucitajte ih u sektoru Racuni</h3>
    <table v-else class="table table-striped">
      <thead>
      <tr>
        <th>Artikal</th>
        <th>Kol</th>
        <th>Cena</th>
        <th>Ukupno</th>
      </tr>
      </thead>
      <tbody>
      <template v-for="racun in listaRacuna" :key="racun.InvoiceNumber">
          <tr v-for="artikal in racun.Items" :key="artikal.Name">
            <td>{{ artikal.Name }}</td>
            <td>{{ artikal.Quantity }}</td>
            <td>{{ artikal.UnitPrice }}</td>
            <td>{{ artikal.TotalAmount }}</td>
          </tr>
      </template>
      </tbody>
    </table>
  </main>
</template>
