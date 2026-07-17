<template>
  <div class="projet-detail">
    <ProjetOverview :projet="projet" />

    <div class="detail-actions">
      <Button
        label="Fermer"
        severity="secondary"
        @click="$emit('close')"
      />
    </div>
  </div>
</template>

<script setup>
import ProjetOverview from './ProjetOverview.vue'

defineProps({
  projet: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])
</script>

<style scoped lang="scss">
.projet-detail {
  display: flex;
  flex-direction: column;
  height: 100%;

  .detail-actions {
    display: flex;
    justify-content: flex-end;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--surface-border);
    background: white;
    margin-top: auto;
  }
}
</style>
