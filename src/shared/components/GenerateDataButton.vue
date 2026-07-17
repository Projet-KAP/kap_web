<template>
  <Button
    label="Générer des données"
    icon="pi pi-sparkles"
    severity="secondary"
    text
    size="small"
    @click="$emit('generate')"
    class="generate-data-btn"
  />
</template>

<script setup>
defineEmits(['generate'])
</script>

<style scoped>
.generate-data-btn {
  color: #7AC943 !important;
  font-weight: 500;
}

.generate-data-btn:hover {
  background-color: rgba(122, 201, 67, 0.1) !important;
}
</style>
