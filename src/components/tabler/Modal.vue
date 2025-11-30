<script setup>
defineProps({
  footer: {
    type: Boolean,
    default: false
  },
  header: {
    type: Boolean,
    default: false
  },
  taster: {
    type: String,
    default: 'Prikazi modal'
  },
  id: {
    type: [String,Number],
    default: 'osnovniModal'
  }
});
</script>

<template>
  <!-- Dugme koje otvara modal (samo ako nije prosleđen id) -->
  <button
    v-if="!id"
    type="button"
    class="btn btn-primary"
    data-bs-toggle="modal"
    :data-bs-target="'#' + id"
    v-text="taster"
  ></button>

  <!-- Modal -->
  <div class="modal fade" :id="id" tabindex="-1">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header" v-if="header">
          <h5 class="modal-title"><slot name="naslov"></slot></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body">
          <slot></slot>
        </div>

        <div class="modal-footer" v-if="footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Save changes</button>
        </div>
      </div>
    </div>
  </div>
</template>
