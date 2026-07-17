<template>
  <div class="media-breadcrumb" v-if="store.currentFolder">
    <span class="breadcrumb-item clickable" @click="$emit('navigate', null)">
      <i class="pi pi-home"></i>
    </span>
    <template v-for="(item, index) in store.breadcrumb" :key="item.id">
      <i class="pi pi-chevron-right breadcrumb-separator"></i>
      <span
        class="breadcrumb-item"
        :class="{ clickable: index < store.breadcrumb.length - 1, current: index === store.breadcrumb.length - 1 }"
        @click="index < store.breadcrumb.length - 1 && $emit('navigate', item.id)"
      >
        {{ item.name }}
      </span>
    </template>
  </div>
</template>

<script setup>
import { useMediathequeStore } from '../../stores/mediathequeStore'

const store = useMediathequeStore()

defineEmits(['navigate'])
</script>

<style scoped>
.media-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.breadcrumb-item {
  color: #64748b;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.breadcrumb-item.clickable {
  cursor: pointer;
}

.breadcrumb-item.clickable:hover {
  background: #f1f5f9;
  color: #3b82f6;
}

.breadcrumb-item.current {
  color: #1e293b;
  font-weight: 600;
}

.breadcrumb-separator {
  font-size: 0.65rem;
  color: #cbd5e1;
}
</style>
