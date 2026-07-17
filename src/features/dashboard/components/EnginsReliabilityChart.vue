<template>
  <BaseChart
    title="Fiabilité des Engins"
    subtitle="Évolution de la fiabilité par type d'engin"
    type="line"
    :data="chartData"
    preset="reliability"
    :show-legend-values="true"
    height="400px"
  >
    <template #controls>
      <BaseSelect
        v-model="selectedPeriod"
        :options="periodOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Période"
        class="period-select"
      />
      <BaseSelect
        v-model="selectedType"
        :options="typeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Type d'engin"
        class="type-select"
        clearable
      />
    </template>

    <template #footer>
      <!-- Statistiques de fiabilité -->
      <div class="reliability-stats">
        <div class="stat-item">
          <div class="stat-icon excellent">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-info">
            <h4>{{ excellentReliability }}</h4>
            <p>Excellente (≥95%)</p>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon good">
            <i class="pi pi-thumbs-up"></i>
          </div>
          <div class="stat-info">
            <h4>{{ goodReliability }}</h4>
            <p>Bonne (85-94%)</p>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon warning">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="stat-info">
            <h4>{{ warningReliability }}</h4>
            <p>À surveiller (75-84%)</p>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon critical">
            <i class="pi pi-times-circle"></i>
          </div>
          <div class="stat-info">
            <h4>{{ criticalReliability }}</h4>
            <p>Critique (<75%)</p>
          </div>
        </div>
      </div>
    </template>
  </BaseChart>
</template>

<script setup>
import { computed } from 'vue'
import BaseChart from '@/shared/components/BaseChart.vue'
import { usePerformanceChart } from '@/shared/composables/useChart.js'
import { periodOptions } from '@/shared/utils/chartOptions.js'

// Props
const props = defineProps({
  engins: {
    type: Array,
    default: () => []
  }
})

// Options
const typeOptions = [
  { label: 'Excavatrice', value: 'EXCAVATRICE' },
  { label: 'Bulldozer', value: 'BULLDOZER' },
  { label: 'Grue', value: 'GRUE' },
  { label: 'Compacteur', value: 'COMPACTEUR' }
]

// Utiliser le composable pour la logique des graphiques
const { selectedPeriod, selectedType, chartData } = usePerformanceChart(computed(() => props.engins))

// Computed pour les statistiques de fiabilité

// Statistiques de fiabilité
const excellentReliability = computed(() => {
  return props.engins.filter(e => e.kpis?.reliability >= 95).length
})

const goodReliability = computed(() => {
  return props.engins.filter(e => e.kpis?.reliability >= 85 && e.kpis?.reliability < 95).length
})

const warningReliability = computed(() => {
  return props.engins.filter(e => e.kpis?.reliability >= 75 && e.kpis?.reliability < 85).length
})

const criticalReliability = computed(() => {
  return props.engins.filter(e => e.kpis?.reliability < 75).length
})

// Plus de méthodes redondantes - tout est géré par les composables et utilitaires !
</script>

<style scoped>
.reliability-chart-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 1.5rem 0 1.5rem;
  gap: 1rem;
}

.header-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.header-content p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.header-controls {
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
}

.period-select,
.type-select {
  min-width: 140px;
}

.chart-container {
  height: 400px;
  padding: 1rem 1.5rem;
}

.reliability-chart {
  height: 100%;
}

.chart-legend {
  padding: 0 1.5rem 1rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  margin-top: 1rem;
  padding-top: 1rem;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 16px;
  height: 3px;
  border-radius: 2px;
}

.legend-label {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.legend-value {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
}

.reliability-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.stat-icon.excellent {
  background: #dcfce7;
  color: #16a34a;
}

.stat-icon.good {
  background: #dbeafe;
  color: #2563eb;
}

.stat-icon.warning {
  background: #fef3c7;
  color: #d97706;
}

.stat-icon.critical {
  background: #fee2e2;
  color: #dc2626;
}

.stat-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-info p {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-controls {
    flex-direction: column;
  }
  
  .period-select,
  .type-select {
    min-width: auto;
  }
  
  .chart-container {
    height: 300px;
  }
  
  .legend-items {
    justify-content: flex-start;
  }
  
  .reliability-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .reliability-stats {
    grid-template-columns: 1fr;
  }
}
</style>
