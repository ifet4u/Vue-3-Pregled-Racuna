<script setup>
import Modal from "@/components/tabler/Modal.vue";
import swal from "sweetalert"
import { ref } from "vue";
import { flash } from "@/composables/useFlash.js";
import SoljicaSto from "@/components/SoljicaSto.vue";
let naslov = "Test stranica";

const stolovi = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

</script>
<template>
  <div class="about container">
    <div class="row gap-2">
      <div class="col col-sm-12 card">
        <div class="card-body">
          <div class="card-title">Primer sa SoljicaSto komponentom</div>
          <div class="row g-1">
            <template v-for="sto in stolovi" :key="sto" >
              <SoljicaSto :naziv="sto"/>
            </template>
          </div>
        </div>
      </div>
<!--      <div class="col-md-5 col-sm-12 card card-body">-->
<!--        <div class="card-title">Primer sa Modalom</div>-->
<!--        <p>-->
<!--          Modal je odvojena komponenta sa parametrima header i footer.-->
<!--        </p>-->
<!--        <Modal header footer taster="Prikazi">-->
<!--          <template #naslov>Naslov modala</template>-->
<!--          <p>Ovo je sadrzaj modala</p>-->
<!--          <div class="mb-3">-->
<!--            <input type="text" class="form-control" v-model="poruka"/>-->
<!--            <input type="text" class="form-control" v-model="naslovPoruke"/>-->
<!--          </div>-->
<!--          <button @click="pozdravi()" class="btn btn-lg btn-danger">Pozdravi</button>-->
<!--        </Modal>-->
<!--      </div>-->
    </div>

  </div>
</template>


