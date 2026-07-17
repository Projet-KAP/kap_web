<template>
  <div class="formula-builder">
    <!-- KPIs disponibles -->
    <div class="builder-section">
      <div class="section-header">
        <i class="pi pi-tag"></i>
        <h4>KPIs disponibles</h4>
      </div>
      <div class="kpis-available">
        <div
          v-for="kpi in availableKPIs"
          :key="kpi.id"
          class="draggable-kpi"
          draggable="true"
          @dragstart="handleDragStart($event, 'kpi', kpi)"
          @dragend="handleDragEnd"
        >
          <i class="pi pi-chart-bar"></i>
          <span class="kpi-name">{{ kpi.name }}</span>
          <Tag v-if="kpi.unit" :value="kpi.unit" severity="secondary" size="small" />
        </div>
      </div>
    </div>

    <!-- Opérateurs -->
    <div class="builder-section">
      <div class="section-header">
        <i class="pi pi-calculator"></i>
        <h4>Opérateurs</h4>
      </div>
      <div class="operators-available">
        <div
          v-for="op in operators"
          :key="op.value"
          class="draggable-operator"
          draggable="true"
          @dragstart="handleDragStart($event, 'operator', op)"
          @dragend="handleDragEnd"
        >
          {{ op.label }}
        </div>
      </div>
    </div>

    <!-- Zone de construction -->
    <div class="builder-section build-zone-section">
      <div class="section-header">
        <i class="pi pi-wrench"></i>
        <h4>Construisez votre formule</h4>
        <Button
          v-if="formulaElements.length > 0"
          icon="pi pi-trash"
          severity="danger"
          text
          size="small"
          @click="clearFormula"
          v-tooltip.top="'Effacer la formule'"
        />
      </div>

      <div
        class="formula-build-zone"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        :class="{ 'drag-over': isDragOver, 'has-elements': formulaElements.length > 0 }"
      >
        <div v-if="formulaElements.length === 0" class="drop-placeholder">
          <i class="pi pi-arrow-down"></i>
          <p>Glissez-déposez les KPIs et opérateurs ici</p>
        </div>

        <TransitionGroup name="formula-item" tag="div" class="formula-elements">
          <div
            v-for="(element, index) in formulaElements"
            :key="`${element.type}-${element.id || element.value}-${index}`"
            class="formula-element"
            :class="{ 'is-kpi': element.type === 'kpi', 'is-operator': element.type === 'operator' }"
          >
            <div class="element-content">
              <i v-if="element.type === 'kpi'" class="pi pi-chart-bar"></i>
              <span>{{ element.type === 'kpi' ? element.data.name : element.data.label }}</span>
              <Tag v-if="element.type === 'kpi' && element.data.unit" :value="element.data.unit" severity="secondary" size="small" />
            </div>
            <Button
              icon="pi pi-times"
              severity="danger"
              text
              rounded
              size="small"
              @click="removeElement(index)"
              class="remove-btn"
            />
          </div>
        </TransitionGroup>
      </div>

      <!-- Preview de la formule générée -->
      <div v-if="generatedFormula" class="formula-preview">
        <div class="preview-label">
          <i class="pi pi-code"></i>
          <span>Formule générée:</span>
        </div>
        <code class="formula-code">{{ generatedFormula }}</code>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Tag from 'primevue/tag'
import Button from 'primevue/button'

const props = defineProps({
  kpis: {
    type: Array,
    default: () => []
  },
  initialFormula: {
    type: String,
    default: ''
  },
  initialSourceKpis: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:formula', 'update:sourceKpis'])

const operators = [
  { label: '+', value: 'ADD' },
  { label: '-', value: 'SUB' },
  { label: '*', value: 'MUL' },
  { label: '/', value: 'DIV' },
  { label: '(', value: 'LPAREN' },
  { label: ')', value: 'RPAREN' }
]

const formulaElements = ref([])
const isDragOver = ref(false)
const draggedItem = ref(null)

const availableKPIs = computed(() => {
  return props.kpis.filter(kpi => kpi.id)
})

const generatedFormula = computed(() => {
  if (formulaElements.value.length === 0) return ''

  return formulaElements.value.map((element, index) => {
    if (element.type === 'kpi') {
      // Find the KPI index in the source list
      const kpiIndex = getKPIIndex(element.data.id)
      return `KPI${kpiIndex + 1}`
    } else {
      return element.data.label
    }
  }).join(' ')
})

const sourceKPIs = computed(() => {
  const kpiElements = formulaElements.value.filter(el => el.type === 'kpi')
  const uniqueKPIs = []
  const seenIds = new Set()

  for (const el of kpiElements) {
    if (!seenIds.has(el.data.id)) {
      uniqueKPIs.push(el.data.id)
      seenIds.add(el.data.id)
    }
  }

  return uniqueKPIs
})

const getKPIIndex = (kpiId) => {
  return sourceKPIs.value.indexOf(kpiId)
}

const handleDragStart = (event, type, data) => {
  draggedItem.value = { type, data }
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('text/plain', JSON.stringify({ type, data }))
  event.target.classList.add('dragging')
}

const handleDragEnd = (event) => {
  event.target.classList.remove('dragging')
  draggedItem.value = null
}

const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  isDragOver.value = true
}

const handleDragLeave = (event) => {
  if (event.target.classList.contains('formula-build-zone')) {
    isDragOver.value = false
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false

  if (draggedItem.value) {
    formulaElements.value.push({
      type: draggedItem.value.type,
      id: draggedItem.value.data.id || draggedItem.value.data.value,
      data: draggedItem.value.data
    })

    updateFormula()
  }
}

const removeElement = (index) => {
  formulaElements.value.splice(index, 1)
  updateFormula()
}

const clearFormula = () => {
  formulaElements.value = []
  updateFormula()
}

const updateFormula = () => {
  emit('update:formula', generatedFormula.value)
  emit('update:sourceKpis', sourceKPIs.value)
}

// Watch for changes in the formula to update parent
watch([generatedFormula, sourceKPIs], ([newFormula, newSourceKpis]) => {
  emit('update:formula', newFormula)
  emit('update:sourceKpis', newSourceKpis)
})

// Initialize from props if provided
watch(() => [props.initialFormula, props.initialSourceKpis], ([formula, sourceKpis]) => {
  if (formula && sourceKpis && sourceKpis.length > 0 && formulaElements.value.length === 0) {
    // Parse the formula and reconstruct elements
    // This is a simple implementation that assumes the formula follows the pattern
    const tokens = formula.split(' ')

    tokens.forEach(token => {
      if (token.startsWith('KPI')) {
        const kpiIndex = parseInt(token.replace('KPI', '')) - 1
        if (kpiIndex >= 0 && kpiIndex < sourceKpis.length) {
          const kpiId = sourceKpis[kpiIndex]
          const kpi = props.kpis.find(k => k.id === kpiId)
          if (kpi) {
            formulaElements.value.push({
              type: 'kpi',
              id: kpi.id,
              data: kpi
            })
          }
        }
      } else {
        // It's an operator
        const operator = operators.find(op => op.label === token)
        if (operator) {
          formulaElements.value.push({
            type: 'operator',
            id: operator.value,
            data: operator
          })
        }
      }
    })
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.formula-builder {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.builder-section {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1rem;
  background: var(--surface-0);

  &.build-zone-section {
    background: var(--surface-50);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--surface-border);

    i {
      color: var(--primary-color);
      font-size: 1.1rem;
    }

    h4 {
      margin: 0;
      flex: 1;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-color);
    }
  }
}

.kpis-available, .operators-available {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.draggable-kpi, .draggable-operator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-0);
  border: 2px solid var(--surface-border);
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    border-color: var(--primary-color);
    background: var(--primary-50);
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &:active {
    cursor: grabbing;
  }

  &.dragging {
    opacity: 0.5;
  }

  i {
    color: var(--primary-color);
  }

  .kpi-name {
    font-weight: 500;
    color: var(--text-color);
  }
}

.draggable-operator {
  min-width: 50px;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--primary-color);
}

.formula-build-zone {
  min-height: 300px;
  padding: 1.5rem;
  background: var(--surface-0);
  border: 2px dashed var(--surface-border);
  border-radius: 8px;
  transition: all 0.3s ease;

  &.drag-over {
    border-color: var(--primary-color);
    background: var(--primary-50);
  }

  &.has-elements {
    border-style: solid;
  }

  .drop-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-color-secondary);

    i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      opacity: 0.5;
    }

    p {
      margin: 0;
      font-size: 0.95rem;
    }
  }

  .formula-elements {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .formula-element {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    animation: slideIn 0.3s ease;

    &.is-kpi {
      background: var(--primary-100);
      border: 2px solid var(--primary-200);

      .element-content {
        i {
          color: var(--primary-color);
        }

        span {
          color: var(--primary-800);
          font-weight: 600;
        }
      }
    }

    &.is-operator {
      background: var(--surface-100);
      border: 2px solid var(--surface-300);

      .element-content {
        span {
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--text-color);
        }
      }
    }

    .element-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .remove-btn {
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &:hover .remove-btn {
      opacity: 1;
    }
  }
}

.formula-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--surface-0);
  border: 1px solid var(--surface-border);
  border-radius: 6px;

  .preview-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color-secondary);

    i {
      font-size: 1rem;
    }
  }

  .formula-code {
    display: block;
    padding: 0.75rem;
    background: var(--surface-50);
    border: 1px solid var(--surface-border);
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    color: var(--primary-color);
    font-weight: 600;
    word-break: break-all;
  }
}

// Animations
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.formula-item-enter-active,
.formula-item-leave-active {
  transition: all 0.3s ease;
}

.formula-item-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.formula-item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.formula-item-move {
  transition: transform 0.3s ease;
}
</style>
