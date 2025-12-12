<script setup>
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';

const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};
</script>

<template>
  <div class="page">
    <header class="navbar navbar-expand-md d-print-none">
      <div class="container-xl">

        <button
          class="navbar-toggler"
          type="button"
          @click="toggleMenu"
          :aria-expanded="isMenuOpen"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <a href="#" class="navbar-brand navbar-brand-autodark me-3">
          <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="25" height="25"/>
          <span class="ms-2">Vue JS</span>
        </a>

        <div class="collapse navbar-collapse" :class="{ 'show': isMenuOpen }" id="navbar-menu">
          <div class="d-flex flex-column flex-md-row flex-fill align-items-stretch align-items-md-center">
            <ul class="navbar-nav">

              <li class="nav-item">
                <RouterLink class="nav-link" to="/" @click="closeMenu">
                  <span class="nav-link-icon">
                    <i class="ti ti-home-2"></i>
                  </span>
                  <span class="nav-link-title"> Home </span>
                </RouterLink>
              </li>

              <li class="nav-item">
                <RouterLink class="nav-link" to="/racuni" @click="closeMenu">
                  <span class="nav-link-icon">
                    <i class="ti ti-file-invoice"></i>
                  </span>
                  <span class="nav-link-title"> Računi </span>
                </RouterLink>
              </li>

              <li class="nav-item">
                <RouterLink class="nav-link" to="/test" @click="closeMenu">
                  <span class="nav-link-icon">
                    <i class="ti ti-flask"></i>
                  </span>
                  <span class="nav-link-title"> Test </span>
                </RouterLink>
              </li>

            </ul>
          </div>
        </div>
      </div>
    </header>

    <div class="page-wrapper p-3">
      <RouterView/>
    </div>
  </div>
</template>

<style scoped>
.collapse {
  transition: all 0.3s ease;
}
</style>
