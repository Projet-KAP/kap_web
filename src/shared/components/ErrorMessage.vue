<template>
  <div v-if="show && errors.length > 0" class="error-container">
    <div class="error-message">
      <i class="pi pi-exclamation-triangle"></i>
      <ul class="error-list">
        <li v-for="error in errors" :key="error">{{ error }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
defineProps({
  errors: {
    type: Array,
    default: () => []
  },
  show: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.error-container {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.error-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #dc2626;
}

.error-message i {
  font-size: 1.25rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.error-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.error-list li {
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.error-list li:last-child {
  margin-bottom: 0;
}
</style> 