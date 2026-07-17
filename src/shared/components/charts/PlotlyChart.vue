<template>
  <Card class="plotly-chart-card">
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
      <div class="chart-container" :style="{ height: height }">
        <div ref="plotlyContainer" class="plotly-container"></div>
      </div>

      <div v-if="$slots.footer" class="chart-footer">
        <slot name="footer"></slot>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Plotly from 'plotly.js-dist-min'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  data: {
    type: Array,
    required: true
  },
  layout: {
    type: Object,
    default: () => ({})
  },
  config: {
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
  }
})

const emit = defineEmits(['click', 'hover', 'relayout'])

const plotlyContainer = ref(null)

const defaultLayout = {
  autosize: true,
  margin: { l: 50, r: 30, t: 30, b: 50 },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: {
    family: 'Inter, system-ui, sans-serif',
    color: '#374151'
  },
  hoverlabel: {
    bgcolor: '#1f2937',
    font: { color: '#fff' }
  }
}

const defaultConfig = {
  responsive: true,
  displayModeBar: false,
  locale: 'fr'
}

const renderChart = async () => {
  if (!plotlyContainer.value) return

  await nextTick()

  const mergedLayout = {
    ...defaultLayout,
    ...props.layout
  }

  const mergedConfig = {
    ...defaultConfig,
    ...props.config
  }

  await Plotly.newPlot(
    plotlyContainer.value,
    props.data,
    mergedLayout,
    mergedConfig
  )

  // Event handlers
  plotlyContainer.value.on('plotly_click', (data) => {
    emit('click', data)
  })

  plotlyContainer.value.on('plotly_hover', (data) => {
    emit('hover', data)
  })

  plotlyContainer.value.on('plotly_relayout', (data) => {
    emit('relayout', data)
  })
}

const resizeChart = () => {
  if (plotlyContainer.value) {
    Plotly.Plots.resize(plotlyContainer.value)
  }
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  if (plotlyContainer.value) {
    Plotly.purge(plotlyContainer.value)
  }
})

watch(() => props.data, renderChart, { deep: true })
watch(() => props.layout, renderChart, { deep: true })

defineExpose({ resize: resizeChart, rerender: renderChart })
</script>

<style scoped>
.plotly-chart-card {
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

.plotly-container {
  width: 100%;
  height: 100%;
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
}
</style>
