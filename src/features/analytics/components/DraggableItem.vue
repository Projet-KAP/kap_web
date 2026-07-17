<template>
  <div
    ref="elementRef"
    class="draggable-item"
    :class="itemClass"
    @pointerdown="handleDragStart"
  >
    <i :class="icon"></i>
    <div class="item-info">
      <span class="item-name">{{ item.name }}</span>
      <span v-if="item.unit" class="item-unit">{{ item.unit }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDraggable } from '@vue-dnd-kit/core'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    required: true // 'kpi', 'formula', 'chart'
  }
})

// Configuration du draggable avec vue-dnd-kit
const { elementRef, handleDragStart, isDragging } = useDraggable({
  groups: ['dashboard-widgets'], // Groupe pour permettre l'interaction avec la zone de drop
  data: computed(() => ({
    type: props.type,
    item: props.item,
    isNewWidget: true
  }))
})

// Classes et icônes basées sur le type
const itemClass = computed(() => {
  const baseClass = `${props.type}-item`
  return isDragging.value ? `${baseClass} is-dragging` : baseClass
})

const icon = computed(() => {
  switch (props.type) {
    case 'kpi':
      return 'pi pi-chart-bar'
    case 'formula':
      return 'pi pi-calculator'
    case 'chart':
      return 'pi pi-chart-line'
    default:
      return 'pi pi-circle'
  }
})
</script>

<style scoped>
.draggable-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s;
  user-select: none;
  touch-action: none;
  -webkit-user-drag: none;
}

.draggable-item:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateX(4px);
}

.draggable-item.is-dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.item-name {
  font-weight: 500;
  color: #1e293b;
}

.item-unit {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 400;
}
</style>
