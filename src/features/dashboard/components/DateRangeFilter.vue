<template>
  <div class="date-range-filter">
    <div class="filter-header">
      <h4>Période d'analyse</h4>
      <Button 
        v-if="showReset"
        icon="pi pi-refresh" 
        text 
        size="small"
        @click="resetFilters"
        v-tooltip="'Réinitialiser'"
      />
    </div>
    
    <div class="filter-options">
      <!-- Boutons de période prédéfinie -->
      <div class="period-buttons">
        <Button
          v-for="period in periodOptions"
          :key="period.value"
          :label="period.label"
          :class="['period-btn', { active: selectedPeriod === period.value }]"
          @click="selectPeriod(period.value)"
          size="small"
        />
      </div>
      
      <!-- Sélection de dates personnalisée -->
      <div v-if="selectedPeriod === 'custom'" class="custom-dates">
        <DatePicker
          v-model="customStartDate"
          dateFormat="dd/mm/yy"
          placeholder="Date début"
          :maxDate="maxDate"
          showIcon
        />
        <span class="date-separator">-</span>
        <DatePicker
          v-model="customEndDate"
          dateFormat="dd/mm/yy"
          placeholder="Date fin"
          :maxDate="maxDate"
          :minDate="customStartDate"
          showIcon
        />
        <Button
          label="Appliquer"
          icon="pi pi-check"
          @click="applyCustomDates"
          class="apply-btn"
          size="small"
        />
      </div>
    </div>
    
    <!-- Affichage de la période sélectionnée -->
    <div v-if="dateRange.start && dateRange.end" class="selected-range">
      <i class="pi pi-calendar"></i>
      <span>{{ formatDateRange() }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ start: null, end: null, period: 'week' })
  },
  showReset: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change'])

// State
const selectedPeriod = ref(props.modelValue.period || 'week')
const customStartDate = ref(null)
const customEndDate = ref(null)
const maxDate = ref(new Date())

// Options de période
const periodOptions = [
  { label: "Aujourd'hui", value: 'today' },
  { label: 'Cette semaine', value: 'week' },
  { label: '7 derniers jours', value: '7days' },
  { label: '30 derniers jours', value: '30days' },
  { label: 'Ce mois', value: 'month' },
  { label: 'Personnalisé', value: 'custom' }
]

// Computed
const dateRange = computed(() => {
  const now = new Date()
  let start, end

  switch (selectedPeriod.value) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      end = now
      break
      
    case 'week':
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1 // Lundi = 0
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
      end = now
      break
      
    case '7days':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      end = now
      break
      
    case '30days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      end = now
      break
      
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = now
      break
      
    case 'custom':
      start = customStartDate.value
      end = customEndDate.value
      break
      
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      end = now
  }

  return { start, end, period: selectedPeriod.value }
})

// Methods
const selectPeriod = (period) => {
  selectedPeriod.value = period
  if (period !== 'custom') {
    emitChange()
  }
}

const applyCustomDates = () => {
  if (customStartDate.value && customEndDate.value) {
    emitChange()
  }
}

const resetFilters = () => {
  selectedPeriod.value = 'week'
  customStartDate.value = null
  customEndDate.value = null
  emitChange()
}

const emitChange = () => {
  const range = dateRange.value
  emit('update:modelValue', range)
  emit('change', range)
}

const formatDateRange = () => {
  const { start, end } = dateRange.value
  if (!start || !end) return ''
  
  const startStr = format(start, 'dd MMM', { locale: fr })
  const endStr = format(end, 'dd MMM yyyy', { locale: fr })
  
  return `${startStr} - ${endStr}`
}

// Watch pour initialiser
watch(() => props.modelValue, (newVal) => {
  if (newVal.period) {
    selectedPeriod.value = newVal.period
  }
}, { immediate: true })

// Émettre la valeur initiale
emitChange()
</script>

<style scoped>
.date-range-filter {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filter-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.period-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.period-btn {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  transition: all 0.2s ease;
}

.period-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.period-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

.custom-dates {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.date-separator {
  color: #9ca3af;
  font-weight: 500;
}

.apply-btn {
  background: #059669;
  border-color: #059669;
  color: white;
}

.apply-btn:hover {
  background: #047857;
  border-color: #047857;
}

.selected-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #eff6ff;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1e40af;
}

.selected-range i {
  color: #2563eb;
}

@media (max-width: 768px) {
  .period-buttons {
    flex-direction: column;
  }
  
  .period-btn {
    width: 100%;
  }
  
  .custom-dates {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

