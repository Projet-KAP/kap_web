<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :style="{ width: '520px' }"
    :header="tag?.display_name || tag?.tag_name || 'Aperçu des valeurs'"
    class="tag-preview-drawer"
  >
    <div v-if="tag" class="preview-content">
      <!-- Header avec info tag -->
      <div class="tag-header">
        <div class="tag-info">
          <div class="tag-badges">
            <Tag :value="tag.module_display || tag.module" severity="info" />
            <Tag :value="tag.tag_type_display || tag.tag_type" severity="secondary" />
            <Tag v-if="tag.unit" :value="tag.unit" severity="contrast" />
          </div>
          <Tag
            :value="tag.is_active ? 'Actif' : 'Inactif'"
            :severity="tag.is_active ? 'success' : 'danger'"
            :icon="tag.is_active ? 'pi pi-check-circle' : 'pi pi-times-circle'"
          />
        </div>
      </div>

      <!-- Section valeur actuelle -->
      <div class="current-value-section" v-if="hasData">
        <div class="value-card">
          <div class="value-display">
            <span class="big-value">{{ formatValue(currentValue) }}</span>
            <span class="unit" v-if="tag.unit">{{ tag.unit }}</span>
          </div>
          <div class="trend" v-if="trendPercent !== null" :class="trendClass">
            <i :class="trendIcon"></i>
            <span>{{ Math.abs(trendPercent).toFixed(1) }}%</span>
          </div>
        </div>
        <p class="value-label">Dernière valeur collectée</p>
      </div>

      <!-- Loader -->
      <div v-if="loading" class="loading-state">
        <ProgressSpinner style="width: 48px; height: 48px" />
        <p>Chargement des données...</p>
      </div>

      <!-- Graphique historique -->
      <div v-else-if="hasData" class="chart-section">
        <div class="section-header">
          <h4><i class="pi pi-chart-line"></i> Historique</h4>
          <span class="period-label">{{ periodLabel }}</span>
        </div>
        <div class="chart-container">
          <Chart
            :type="chartType"
            :data="chartData"
            :options="chartOptions"
          />
        </div>
      </div>

      <!-- Metriques -->
      <div v-if="hasData && metrics" class="metrics-section">
        <div class="section-header">
          <h4><i class="pi pi-calculator"></i> Statistiques</h4>
        </div>
        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-value">{{ formatValue(metrics.sum) }}</span>
            <span class="metric-label">Somme</span>
          </div>
          <div class="metric-card">
            <span class="metric-value">{{ formatValue(metrics.avg) }}</span>
            <span class="metric-label">Moyenne</span>
          </div>
          <div class="metric-card">
            <span class="metric-value">{{ formatValue(metrics.min) }}</span>
            <span class="metric-label">Minimum</span>
          </div>
          <div class="metric-card">
            <span class="metric-value">{{ formatValue(metrics.max) }}</span>
            <span class="metric-label">Maximum</span>
          </div>
          <div class="metric-card wide">
            <span class="metric-value">{{ metrics.count }}</span>
            <span class="metric-label">Nombre de valeurs</span>
          </div>
        </div>
      </div>

      <!-- Section IoT si mapping existe -->
      <div v-if="iotData" class="iot-section">
        <div class="section-header">
          <h4><i class="pi pi-wifi"></i> Capteur IoT</h4>
          <Tag
            :value="iotData.is_online ? 'En ligne' : 'Hors ligne'"
            :severity="iotData.is_online ? 'success' : 'danger'"
            :icon="iotData.is_online ? 'pi pi-circle-fill' : 'pi pi-circle'"
          />
        </div>
        <div class="iot-content">
          <div class="iot-value-card" :class="iotAlertClass">
            <span class="iot-value">{{ formatValue(iotData.value) }}</span>
            <span class="iot-unit">{{ iotData.unit || tag.unit }}</span>
          </div>
          <div class="iot-meta">
            <div class="meta-item">
              <i class="pi pi-server"></i>
              <span>{{ iotData.device_name }}</span>
            </div>
            <div class="meta-item">
              <i class="pi pi-clock"></i>
              <span>{{ formatTimestamp(iotData.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Etat vide -->
      <div v-if="!loading && !hasData" class="empty-state">
        <i class="pi pi-inbox"></i>
        <h3>Aucune donnee collectee</h3>
        <p>Ce tag n'a pas encore de valeurs. Les données apparaîtront une fois des rapports soumis.</p>
      </div>
    </div>
  </Drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { axiosInstance } from '@/main'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  tag: {
    type: Object,
    default: null
  },
  iotMappings: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const aggregationData = ref(null)
const historyData = ref([])
const iotData = ref(null)

// Computed
const hasData = computed(() => {
  return aggregationData.value && aggregationData.value.metrics &&
    Object.keys(aggregationData.value.metrics).length > 0
})

const metrics = computed(() => aggregationData.value?.metrics || null)

const currentValue = computed(() => {
  return metrics.value?.last_value ?? metrics.value?.avg ?? 0
})

const trendPercent = computed(() => {
  if (!metrics.value || !metrics.value.first_value || !metrics.value.last_value) return null
  const first = parseFloat(metrics.value.first_value)
  const last = parseFloat(metrics.value.last_value)
  if (first === 0) return null
  return ((last - first) / first) * 100
})

const trendClass = computed(() => {
  if (trendPercent.value === null) return ''
  return trendPercent.value >= 0 ? 'trend-up' : 'trend-down'
})

const trendIcon = computed(() => {
  if (trendPercent.value === null) return ''
  return trendPercent.value >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'
})

const periodLabel = computed(() => {
  if (!aggregationData.value) return ''
  const start = formatDate(aggregationData.value.date_start)
  const end = formatDate(aggregationData.value.date_end)
  return `${start} - ${end}`
})

const isIoTTag = computed(() => {
  const iotTypes = ['COURANT', 'TEMPERATURE', 'HUMIDITE', 'ACCELERATION', 'PRESSION', 'VIBRATION']
  return iotTypes.includes(props.tag?.tag_type)
})

const chartType = computed(() => isIoTTag.value ? 'line' : 'bar')

const chartData = computed(() => {
  if (!historyData.value || historyData.value.length === 0) {
    // Fallback: generate fake data from metrics for demo
    if (metrics.value && metrics.value.count > 0) {
      return generateChartFromMetrics()
    }
    return { labels: [], datasets: [] }
  }

  const labels = historyData.value.map(d => formatDate(d.timestamp || d.date))
  const values = historyData.value.map(d => d.value)

  return {
    labels,
    datasets: [{
      label: props.tag?.display_name || 'Valeur',
      data: values,
      borderColor: isIoTTag.value ? '#0ea5e9' : '#7AC943',
      backgroundColor: isIoTTag.value
        ? 'rgba(14, 165, 233, 0.1)'
        : 'rgba(122, 201, 67, 0.6)',
      fill: isIoTTag.value,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: isIoTTag.value ? 2 : 0,
      pointHoverRadius: 4
    }]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: { size: 12 },
      bodyFont: { size: 11 },
      padding: 8,
      cornerRadius: 4
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 }, maxRotation: 0 }
    },
    y: {
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
      ticks: { font: { size: 10 } },
      beginAtZero: true
    }
  }
}))

const iotAlertClass = computed(() => {
  if (!iotData.value?.alert_status) return ''
  const status = iotData.value.alert_status
  if (status.includes('critical')) return 'alert-critical'
  if (status.includes('warning')) return 'alert-warning'
  return ''
})

// Methods
const formatValue = (val) => {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'number') {
    return val.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  }
  return val
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

const formatTimestamp = (ts) => {
  if (!ts) return '-'
  const date = new Date(ts)
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const generateChartFromMetrics = () => {
  // Generate pseudo-historical data from min/max/avg for display
  const count = Math.min(metrics.value.count || 7, 7)
  const labels = []
  const values = []
  const avg = metrics.value.avg || 0
  const min = metrics.value.min || avg * 0.8
  const max = metrics.value.max || avg * 1.2
  const range = max - min

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(formatDate(d))
    // Generate variation around avg
    values.push(min + Math.random() * range)
  }

  return {
    labels,
    datasets: [{
      label: props.tag?.display_name || 'Valeur',
      data: values,
      borderColor: '#7AC943',
      backgroundColor: 'rgba(122, 201, 67, 0.6)',
      tension: 0.4,
      borderWidth: 2
    }]
  }
}

const loadData = async () => {
  if (!props.tag) return

  loading.value = true
  aggregationData.value = null
  historyData.value = []
  iotData.value = null

  try {
    // Fetch aggregation data
    const aggResponse = await axiosInstance.get(
      `/documents/mes-data-aggregation/?tag=${props.tag.tag_name}`
    )
    if (aggResponse.data.success) {
      aggregationData.value = aggResponse.data
    }

    // Check for IoT mapping
    const tagMapping = props.iotMappings?.find(m => m.mes_tag_id === props.tag.id)
    if (tagMapping) {
      // Fetch current IoT value
      try {
        const iotResponse = await axiosInstance.get(
          `/documents/iot-mappings/current-values/?tag_id=${props.tag.id}`
        )
        if (iotResponse.data.success && iotResponse.data.results?.length > 0) {
          iotData.value = iotResponse.data.results[0]
        }
      } catch (e) {
        console.warn('IoT data not available:', e)
      }

      // Fetch IoT history for sparkline
      try {
        const historyResponse = await axiosInstance.get(
          `/documents/iot-mappings/${tagMapping.id}/history/?hours=168&limit=50`
        )
        if (historyResponse.data.success) {
          historyData.value = historyResponse.data.history || []
        }
      } catch (e) {
        console.warn('IoT history not available:', e)
      }
    }
  } catch (error) {
    console.error('Error loading tag data:', error)
  } finally {
    loading.value = false
  }
}

// Watchers
watch(() => props.modelValue, (newVal) => {
  if (newVal && props.tag) {
    loadData()
  }
})

watch(() => props.tag, (newTag) => {
  if (newTag && props.modelValue) {
    loadData()
  }
})
</script>

<style scoped>
.tag-preview-drawer :deep(.p-drawer-content) {
  padding: 0;
}

.preview-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tag-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.tag-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Current value section */
.current-value-section {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #0B2B3C 0%, #0a3a52 100%);
  border-radius: 16px;
  color: white;
}

.value-card {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 1rem;
}

.value-display {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.big-value {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.unit {
  font-size: 1.25rem;
  opacity: 0.8;
}

.trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.trend-up {
  background: rgba(122, 201, 67, 0.2);
  color: #7AC943;
}

.trend-down {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.value-label {
  margin: 0.75rem 0 0 0;
  font-size: 0.875rem;
  opacity: 0.7;
}

/* Sections */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0B2B3C;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-header h4 i {
  color: #7AC943;
}

.period-label {
  font-size: 0.75rem;
  color: #64748b;
}

/* Chart */
.chart-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
}

.chart-container {
  height: 180px;
}

/* Metrics */
.metrics-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.metric-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 0.75rem;
  text-align: center;
}

.metric-card.wide {
  grid-column: span 2;
}

.metric-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0B2B3C;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
}

/* IoT Section */
.iot-section {
  background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
  border: 1px solid #22d3ee;
  border-radius: 12px;
  padding: 1rem;
}

.iot-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.iot-value-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  border: 2px solid transparent;
}

.iot-value-card.alert-warning {
  border-color: #f59e0b;
  background: #fffbeb;
}

.iot-value-card.alert-critical {
  border-color: #ef4444;
  background: #fef2f2;
}

.iot-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0891b2;
}

.iot-unit {
  font-size: 1rem;
  color: #64748b;
  margin-left: 0.25rem;
}

.iot-meta {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #0e7490;
}

.meta-item i {
  font-size: 0.875rem;
}

/* States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  gap: 1rem;
}

.loading-state p {
  color: #64748b;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.empty-state i {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #334155;
  font-size: 1.125rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
  max-width: 280px;
  margin: 0 auto;
}
</style>
