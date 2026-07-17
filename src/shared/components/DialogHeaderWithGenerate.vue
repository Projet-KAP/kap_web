<template>
  <div class="modal-header-with-action">
    <span class="modal-title">{{ title }}</span>
    <GenerateDataButton v-if="showGenerateButton" @generate="$emit('generate')" />
  </div>
</template>

<script setup>
import GenerateDataButton from './GenerateDataButton.vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  showGenerateButton: {
    type: Boolean,
    default: true
  }
})

defineEmits(['generate'])
</script>

<style scoped>
.modal-header-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 1rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0B2B3C;
}
</style>
