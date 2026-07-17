<template>
  <div class="tags-view">
    <TagManagement />
  </div>
</template>

<script setup>
import TagManagement from './TagManagement.vue'
</script>

<style scoped>
.tags-view {
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.header-content h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.subtitle {
  color: var(--text-color-secondary);
  margin: 0;
}

.tags-tabview {
  margin-top: 1rem;
}

:deep(.p-tabview-panels) {
  padding: 1.5rem 0;
}
</style>

