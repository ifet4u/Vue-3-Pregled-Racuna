<script setup>
import {RouterLink, RouterView} from 'vue-router'
</script>

<template class="page">
  <header class="navbar navbar-expand-md d-print-none">
    <div class="container-xl">
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbar-menu"
        aria-controls="navbar-menu"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <a href="#" aria-label="Tabler" class="navbar-brand navbar-brand-autodark me-3">
        <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="25" height="25"/> Vue JS
      </a>
      <ul class="navbar-nav">
        <li class="nav-item ">
          <RouterLink class="nav-link" to="/">
            <span class="nav-link-icon">
            <i class="ti ti-home"></i>
          </span>
            <span class="nav-link-title"> Home </span>
          </RouterLink>
        </li>
        <li class="nav-item ">
          <RouterLink class="nav-link" to="/racuni">
            <span class="nav-link-icon">
            <i class="ti ti-home"></i>
          </span>
            <span class="nav-link-title"> Racuni </span>
          </RouterLink>
        </li>
        <li class="nav-item ">
          <RouterLink class="nav-link" to="/test">
            <span class="nav-link-icon">
            <i class="ti ti-home"></i>
          </span>
            <span class="nav-link-title"> Test </span>
          </RouterLink>
        </li>
      </ul>
<!--      <div class="navbar-nav flex-row order-md-last ms-auto">-->
<!--        <button class="btn btn-danger">Izlaz</button>-->
<!--      </div>-->
    </div>
  </header>

  <div class="page-wrapper p-3">

    <RouterView/>
  </div>

</template>

