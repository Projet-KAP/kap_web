<template>
  <div
    :class="['widget-container', `widget-size-${widget.size || 'medium'}`]"
    :style="widgetStyle"
  >
    <div
      class="widget-card"
      :class="[`widget-color-${widget.color || 'default'}`, { 'is-dragging': isDragging }]"
    >
      <div
        ref="elementRef"
        class="widget-header"
        @pointerdown="handleDragStart"
      >
        <div class="widget-header-left">
          <i class="pi pi-bars drag-handle" v-tooltip.top="'Déplacer'"></i>
          <span class="widget-title" :title="widget.title" v-tooltip="{ value: widget.title, showDelay: 200, hideDelay: 100 }">{{ widget.title }}</span>
        </div>
        <div class="widget-actions" @pointerdown.stop>
          <slot name="actions"></slot>
        </div>
      </div>
      <div class="widget-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDraggable } from '@vue-dnd-kit/core'

const props = defineProps({
  widget: {
    type: Object,
    required: true
  }
})

// Configuration du draggable avec vue-dnd-kit
const { elementRef, handleDragStart, isDragging } = useDraggable({
  groups: ['dashboard-widgets'], // Groupe pour permettre l'interaction avec la zone de drop
  data: computed(() => ({
    widgetId: props.widget.id,
    isNewWidget: false
  }))
})

// Style du widget basé sur la position dans la grille
const widgetStyle = computed(() => {
  if (!props.widget.gridPosition) {
    const sizeSpan = props.widget.size === 'small' ? 3 : props.widget.size === 'large' ? 6 : 4
    const heightSpan = props.widget.heightSpan || 1
    console.log('🎨 Widget sans gridPosition:', props.widget.id, 'style:', { gridColumn: `span ${sizeSpan}`, gridRow: `span ${heightSpan}` })
    return {
      gridColumn: `span ${sizeSpan}`,
      gridRow: `span ${heightSpan}`
    }
  }

  const sizeSpan = props.widget.size === 'small' ? 3 : props.widget.size === 'large' ? 6 : 4
  const heightSpan = props.widget.heightSpan || 1

  const style = {
    gridColumn: `${props.widget.gridPosition.col} / span ${sizeSpan}`,
    gridRow: `${props.widget.gridPosition.row} / span ${heightSpan}`
  }
  
  // Ne pas logger à chaque rendu pour éviter le spam
  // console.log('🎨 Widget style calculé:', props.widget.id, props.widget.gridPosition, style)
  return style
})
</script>

<style scoped>
.widget-container {
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 180px; /* Hauteur minimale pour correspondre à MIN_ROW_HEIGHT */
}

.widget-card {
  height: 100%;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.widget-card.is-dragging {
  opacity: 0.5;
  transform: scale(0.95) rotate(2deg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.widget-card:hover:not(.is-dragging) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Hover effects subtils pour toutes les cards colorées */
.widget-color-blue .widget-card:hover:not(.is-dragging),
.widget-color-green .widget-card:hover:not(.is-dragging),
.widget-color-purple .widget-card:hover:not(.is-dragging),
.widget-color-orange .widget-card:hover:not(.is-dragging),
.widget-color-pink .widget-card:hover:not(.is-dragging),
.widget-color-cyan .widget-card:hover:not(.is-dragging),
.widget-color-lavender .widget-card:hover:not(.is-dragging),
.widget-color-amber .widget-card:hover:not(.is-dragging) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
  user-select: none;
  cursor: grab;
  transition: background 0.2s;
  touch-action: none;
  -webkit-user-drag: none;
}

.widget-header:hover {
  background: #f8fafc;
}

/* Hover effects subtils pour les headers */
.widget-color-blue .widget-header:hover,
.widget-color-green .widget-header:hover,
.widget-color-purple .widget-header:hover,
.widget-color-orange .widget-header:hover,
.widget-color-pink .widget-header:hover,
.widget-color-cyan .widget-header:hover,
.widget-color-lavender .widget-header:hover,
.widget-color-amber .widget-header:hover {
  background: #f1f5f9;
}

.widget-header:active {
  cursor: grabbing;
}

.widget-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.drag-handle {
  font-size: 1rem;
  color: #94a3b8;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.widget-header:hover .drag-handle {
  color: #3b82f6;
}

.widget-title {
  font-weight: 600;
  font-size: 1rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.widget-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
}

.widget-body {
  flex: 1;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  cursor: default;
  user-select: text;
}

/* Widget theme variations - bordure colorée subtile */

/* Bleu ciel */
.widget-color-blue .widget-card {
  background: white;
  border-left: 4px solid #2196F3;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-blue .widget-header {
  background: #fafbfc;
  border-bottom-color: #E3F2FD;
}
.widget-color-blue .widget-title {
  color: #0B2B3C;
}
.widget-color-blue .drag-handle {
  color: #2196F3;
}

/* Vert menthe */
.widget-color-green .widget-card {
  background: white;
  border-left: 4px solid #4CAF50;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-green .widget-header {
  background: #fafbfc;
  border-bottom-color: #E8F5E9;
}
.widget-color-green .widget-title {
  color: #0B2B3C;
}
.widget-color-green .drag-handle {
  color: #4CAF50;
}

/* Violet doux */
.widget-color-purple .widget-card {
  background: white;
  border-left: 4px solid #9C27B0;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-purple .widget-header {
  background: #fafbfc;
  border-bottom-color: #F3E5F5;
}
.widget-color-purple .widget-title {
  color: #0B2B3C;
}
.widget-color-purple .drag-handle {
  color: #9C27B0;
}

/* Orange pêche */
.widget-color-orange .widget-card {
  background: white;
  border-left: 4px solid #FF9800;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-orange .widget-header {
  background: #fafbfc;
  border-bottom-color: #FFF3E0;
}
.widget-color-orange .widget-title {
  color: #0B2B3C;
}
.widget-color-orange .drag-handle {
  color: #FF9800;
}

/* Rose pâle */
.widget-color-pink .widget-card {
  background: white;
  border-left: 4px solid #E91E63;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-pink .widget-header {
  background: #fafbfc;
  border-bottom-color: #FCE4EC;
}
.widget-color-pink .widget-title {
  color: #0B2B3C;
}
.widget-color-pink .drag-handle {
  color: #E91E63;
}

/* Turquoise */
.widget-color-cyan .widget-card {
  background: white;
  border-left: 4px solid #00BCD4;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-cyan .widget-header {
  background: #fafbfc;
  border-bottom-color: #E0F7FA;
}
.widget-color-cyan .widget-title {
  color: #0B2B3C;
}
.widget-color-cyan .drag-handle {
  color: #00BCD4;
}

/* Lavande */
.widget-color-lavender .widget-card {
  background: white;
  border-left: 4px solid #673AB7;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-lavender .widget-header {
  background: #fafbfc;
  border-bottom-color: #EDE7F6;
}
.widget-color-lavender .widget-title {
  color: #0B2B3C;
}
.widget-color-lavender .drag-handle {
  color: #673AB7;
}

/* Ambre */
.widget-color-amber .widget-card {
  background: white;
  border-left: 4px solid #FFC107;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-amber .widget-header {
  background: #fafbfc;
  border-bottom-color: #FFF8E1;
}
.widget-color-amber .widget-title {
  color: #0B2B3C;
}
.widget-color-amber .drag-handle {
  color: #FFC107;
}

/* Styles pour le contenu des widgets (slot) - valeurs colorées */
.widget-color-blue :deep(.kpi-value) {
  color: #2196F3;
}

.widget-color-green :deep(.kpi-value) {
  color: #4CAF50;
}

.widget-color-purple :deep(.kpi-value) {
  color: #9C27B0;
}

.widget-color-orange :deep(.kpi-value) {
  color: #FF9800;
}

.widget-color-pink :deep(.kpi-value) {
  color: #E91E63;
}

.widget-color-cyan :deep(.kpi-value) {
  color: #00BCD4;
}

.widget-color-lavender :deep(.kpi-value) {
  color: #673AB7;
}

.widget-color-amber :deep(.kpi-value) {
  color: #FFC107;
}

.widget-color-blue :deep(.kpi-unit),
.widget-color-green :deep(.kpi-unit),
.widget-color-purple :deep(.kpi-unit),
.widget-color-orange :deep(.kpi-unit),
.widget-color-pink :deep(.kpi-unit),
.widget-color-cyan :deep(.kpi-unit),
.widget-color-lavender :deep(.kpi-unit),
.widget-color-amber :deep(.kpi-unit),
.widget-color-blue :deep(.kpi-description),
.widget-color-green :deep(.kpi-description),
.widget-color-purple :deep(.kpi-description),
.widget-color-orange :deep(.kpi-description),
.widget-color-pink :deep(.kpi-description),
.widget-color-cyan :deep(.kpi-description),
.widget-color-lavender :deep(.kpi-description),
.widget-color-amber :deep(.kpi-description) {
  color: #64748b;
}

/* Styles pour les chart placeholders - garder neutre */
.widget-color-blue :deep(.chart-placeholder),
.widget-color-green :deep(.chart-placeholder),
.widget-color-purple :deep(.chart-placeholder),
.widget-color-orange :deep(.chart-placeholder),
.widget-color-pink :deep(.chart-placeholder),
.widget-color-cyan :deep(.chart-placeholder),
.widget-color-lavender :deep(.chart-placeholder),
.widget-color-amber :deep(.chart-placeholder),
.widget-color-blue :deep(.chart-placeholder p),
.widget-color-green :deep(.chart-placeholder p),
.widget-color-purple :deep(.chart-placeholder p),
.widget-color-orange :deep(.chart-placeholder p),
.widget-color-pink :deep(.chart-placeholder p),
.widget-color-cyan :deep(.chart-placeholder p),
.widget-color-lavender :deep(.chart-placeholder p),
.widget-color-amber :deep(.chart-placeholder p) {
  color: #94a3b8;
}
</style>
