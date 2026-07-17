<template>
  <Card class="chart-card">
    <template #header v-if="showHeader">
      <div class="chart-header">
        <div class="header-content">
          <h3>{{ title }}</h3>
          <p v-if="subtitle">{{ subtitle }}</p>
        </div>
        <div class="header-controls" v-if="$slots.controls">
          <slot name="controls"></slot>
        </div>
      </div>
    </template>
    
    <template #content>
      <div class="chart-container" :style="{ height: chartHeight }">
        <Chart 
          :type="type" 
          :data="data" 
          :options="computedOptions"
          :class="['base-chart', `chart-${type}`]"
        />
      </div>
      
      <!-- Légende personnalisée -->
      <div v-if="showLegend && data.datasets" class="chart-legend">
        <div class="legend-items">
          <div 
            v-for="(dataset, index) in data.datasets" 
            :key="index"
            class="legend-item"
          >
            <div 
              class="legend-color"
              :style="{ backgroundColor: dataset.borderColor || dataset.backgroundColor }"
            ></div>
            <span class="legend-label">{{ dataset.label }}</span>
            <span v-if="showLegendValues" class="legend-value">
              {{ getDatasetValue(dataset) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Slot pour contenu additionnel -->
      <div v-if="$slots.footer" class="chart-footer">
        <slot name="footer"></slot>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { 
  baseChartOptions, 
  lineChartOptions, 
  doughnutChartOptions,
  chartOptionsFactory 
} from '@/shared/utils/chartOptions.js'

// Props
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['line', 'bar', 'doughnut', 'pie', 'radar'].includes(value)
  },
  data: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  },
  height: {
    type: String,
    default: '400px'
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  showLegendValues: {
    type: Boolean,
    default: false
  },
  preset: {
    type: String,
    default: null,
    validator: (value) => !value || ['performance', 'reliability', 'kpi'].includes(value)
  }
})

// Computed
const chartHeight = computed(() => props.height)

const computedOptions = computed(() => {
  let baseOptions = {}
  
  // Sélectionner les options de base selon le type
  switch (props.type) {
    case 'line':
    case 'bar':
      baseOptions = lineChartOptions
      break
    case 'doughnut':
    case 'pie':
      baseOptions = doughnutChartOptions
      break
    default:
      baseOptions = baseChartOptions
  }
  
  // Appliquer un preset si spécifié
  if (props.preset && chartOptionsFactory[props.preset]) {
    baseOptions = chartOptionsFactory[props.preset]()
  }
  
  // Fusionner avec les options personnalisées
  return {
    ...baseOptions,
    ...props.options,
    plugins: {
      ...baseOptions.plugins,
      ...props.options.plugins
    }
  }
})

// Methods
const getDatasetValue = (dataset) => {
  if (!dataset.data || dataset.data.length === 0) return ''
  
  if (props.type === 'doughnut' || props.type === 'pie') {
    const total = dataset.data.reduce((sum, value) => sum + value, 0)
    return total.toLocaleString('fr-FR')
  } else {
    // Pour les graphiques linéaires, prendre la dernière valeur
    const lastValue = dataset.data[dataset.data.length - 1]
    return typeof lastValue === 'number' ? lastValue.toLocaleString('fr-FR') : lastValue
  }
}
</script>

<style scoped>
.chart-card {
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

.chart-container {
  padding: 1rem 1.5rem;
}

.base-chart {
  height: 100%;
  width: 100%;
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
  flex-shrink: 0;
}

.chart-doughnut .legend-color,
.chart-pie .legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
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

.chart-footer {
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-controls {
    flex-direction: column;
  }
  
  .chart-container {
    height: 300px !important;
  }
  
  .legend-items {
    justify-content: flex-start;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .legend-items {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
