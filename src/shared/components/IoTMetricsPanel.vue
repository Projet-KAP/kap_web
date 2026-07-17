<template>
  <div class="iot-metrics-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-left">
        <i class="pi pi-chart-line header-icon"></i>
        <div class="header-text">
          <h3 class="panel-title">{{ title }}</h3>
          <p class="panel-subtitle" v-if="device">
            <span class="status-dot" :class="device.status"></span>
            {{ device.name }}
          </p>
        </div>
      </div>
      <div class="header-actions">
        <Button
          v-if="showRefresh"
          icon="pi pi-refresh"
          text
          size="small"
          :loading="loading"
          @click="refreshData"
          v-tooltip.top="'Actualiser'"
        />
        <Select
          v-if="showPeriodSelector"
          v-model="selectedPeriod"
          :options="periodOptions"
          optionLabel="label"
          optionValue="value"
          class="period-selector"
          @change="onPeriodChange"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading && !metrics.length" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Chargement des donnees...</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="!metrics.length" class="empty-state">
      <i class="pi pi-inbox"></i>
      <p>Aucune donnee disponible</p>
      <small>Les capteurs n'ont pas encore envoye de donnees</small>
    </div>

    <!-- Metrics grid -->
    <div v-else class="metrics-content">
      <!-- Metriques principales -->
      <div class="metrics-grid">
        <div
          v-for="metric in displayedMetrics"
          :key="metric.id || metric.name"
          class="metric-card"
          :class="{ 'alert': isMetricInAlert(metric) }"
          @click="selectMetric(metric)"
        >
          <div class="metric-header">
            <span class="metric-name">{{ metric.display_name || metric.name }}</span>
            <i
              v-if="isMetricInAlert(metric)"
              class="pi pi-exclamation-triangle alert-icon"
            ></i>
          </div>
          <div class="metric-value-container">
            <span class="metric-value">{{ formatValue(metric.value || metric.latest_value) }}</span>
            <span class="metric-unit" v-if="metric.unit">{{ metric.unit }}</span>
          </div>
          <div class="metric-footer">
            <div v-if="metric.min_value !== null || metric.max_value !== null" class="threshold-bar">
              <div
                class="threshold-progress"
                :style="{ width: getThresholdProgress(metric) + '%' }"
                :class="getThresholdClass(metric)"
              ></div>
            </div>
            <span class="metric-updated" v-if="metric.updated_at">
              {{ formatLastUpdate(metric.updated_at) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Graphique de la metrique selectionnee -->
      <div v-if="selectedMetricData && showChart" class="chart-section">
        <div class="chart-header">
          <h4>{{ selectedMetricData.display_name || selectedMetricData.name }}</h4>
          <Button
            icon="pi pi-times"
            text
            size="small"
            @click="selectedMetricData = null"
          />
        </div>
        <BaseChart
          v-if="chartData"
          type="line"
          :data="chartData"
          :options="chartOptions"
          class="metric-chart"
        />
      </div>
    </div>

    <!-- Alertes actives -->
    <div v-if="activeAlerts.length > 0" class="alerts-section">
      <h4 class="alerts-title">
        <i class="pi pi-exclamation-triangle"></i>
        Alertes actives ({{ activeAlerts.length }})
      </h4>
      <div class="alerts-list">
        <div
          v-for="alert in activeAlerts"
          :key="alert.id"
          class="alert-item"
          :class="`severity-${alert.severity}`"
        >
          <div class="alert-content">
            <span class="alert-message">{{ alert.message }}</span>
            <span class="alert-time">{{ formatLastUpdate(alert.created_at) }}</span>
          </div>
          <Button
            v-if="showAcknowledge"
            label="Acquitter"
            size="small"
            text
            @click="acknowledgeAlert(alert)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useIoTStore } from '@/stores/iotStore'
import Button from 'primevue/button'
import Select from 'primevue/select'
import BaseChart from '@/shared/components/BaseChart.vue'

const props = defineProps({
  device: {
    type: Object,
    default: null
  },
  deviceId: {
    type: [Number, String],
    default: null
  },
  metrics: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: 'Metriques IoT'
  },
  showRefresh: {
    type: Boolean,
    default: true
  },
  showPeriodSelector: {
    type: Boolean,
    default: true
  },
  showChart: {
    type: Boolean,
    default: true
  },
  showAcknowledge: {
    type: Boolean,
    default: true
  },
  autoRefresh: {
    type: Boolean,
    default: true
  },
  refreshInterval: {
    type: Number,
    default: 30000 // 30 secondes
  },
  maxMetrics: {
    type: Number,
    default: 6
  }
})

const emit = defineEmits(['refresh', 'alert-acknowledged', 'metric-selected'])

const iotStore = useIoTStore()

const loading = ref(false)
const selectedPeriod = ref('hour')
const selectedMetricData = ref(null)
const metricHistory = ref([])
let refreshTimer = null

const periodOptions = [
  { label: 'Dernière heure', value: 'hour' },
  { label: 'Dernieres 24h', value: 'day' },
  { label: 'Dernière semaine', value: 'week' }
]

const displayedMetrics = computed(() => {
  const metricsToDisplay = props.metrics.length > 0
    ? props.metrics
    : iotStore.getMetricsForDevice(props.deviceId || props.device?.id)
  return metricsToDisplay.slice(0, props.maxMetrics)
})

const activeAlerts = computed(() => {
  if (props.device?.iot_alerts) {
    return props.device.iot_alerts.filter(a => !a.is_resolved)
  }
  return iotStore.alerts.filter(
    a => a.device?.id === (props.deviceId || props.device?.id) && !a.is_resolved
  )
})

const chartData = computed(() => {
  if (!metricHistory.value || metricHistory.value.length === 0) return null

  const sortedData = [...metricHistory.value].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  )

  return {
    labels: sortedData.map(d => formatChartLabel(d.timestamp)),
    datasets: [{
      label: selectedMetricData.value?.display_name || selectedMetricData.value?.name || 'Valeur',
      data: sortedData.map(d => d.value_float || d.value_int || d.value),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 5
    }]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: false,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    }
  }
}))

async function refreshData() {
  loading.value = true
  try {
    const id = props.deviceId || props.device?.id
    if (id) {
      await iotStore.fetchDeviceMetrics(id)
      await iotStore.fetchDeviceData(id, { limit: 100 })
    }
    emit('refresh')
  } catch (error) {
    console.error('Error refreshing data:', error)
  } finally {
    loading.value = false
  }
}

async function selectMetric(metric) {
  selectedMetricData.value = metric
  emit('metric-selected', metric)

  if (props.showChart) {
    await loadMetricHistory(metric)
  }
}

async function loadMetricHistory(metric) {
  try {
    const id = props.deviceId || props.device?.id
    if (!id) return

    const response = await iotStore.fetchDeviceData(id, {
      metric: metric.id,
      limit: 50
    })
    metricHistory.value = response || []
  } catch (error) {
    console.error('Error loading metric history:', error)
    metricHistory.value = []
  }
}

function onPeriodChange() {
  if (selectedMetricData.value) {
    loadMetricHistory(selectedMetricData.value)
  }
}

async function acknowledgeAlert(alert) {
  try {
    await iotStore.acknowledgeAlert(alert.id)
    emit('alert-acknowledged', alert)
  } catch (error) {
    console.error('Error acknowledging alert:', error)
  }
}

function formatValue(value) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2)
  }
  if (typeof value === 'boolean') return value ? 'ON' : 'OFF'
  return String(value)
}

function formatLastUpdate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 1) return 'A l\'instant'
  if (minutes < 60) return `Il y a ${minutes}min`
  if (hours < 24) return `Il y a ${hours}h`
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function formatChartLabel(dateString) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function isMetricInAlert(metric) {
  return activeAlerts.value.some(a => a.metric?.id === metric.id)
}

function getThresholdProgress(metric) {
  const value = metric.value || metric.latest_value || 0
  const min = metric.min_value || 0
  const max = metric.max_value || 100
  const range = max - min
  if (range === 0) return 50
  return Math.min(100, Math.max(0, ((value - min) / range) * 100))
}

function getThresholdClass(metric) {
  const progress = getThresholdProgress(metric)
  if (progress < 25 || progress > 90) return 'critical'
  if (progress < 40 || progress > 80) return 'warning'
  return 'normal'
}

function startAutoRefresh() {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = setInterval(refreshData, props.refreshInterval)
  }
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

watch(() => props.deviceId, (newId) => {
  if (newId) refreshData()
})

watch(() => props.device, (newDevice) => {
  if (newDevice?.id) refreshData()
}, { deep: true })

onMounted(() => {
  if (props.deviceId || props.device?.id) {
    refreshData()
  }
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.iot-metrics-panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 1.25rem;
  color: #3b82f6;
}

.panel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.panel-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.8125rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.online { background: #22c55e; }
.status-dot.offline { background: #94a3b8; }
.status-dot.error { background: #ef4444; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.period-selector {
  width: 150px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #64748b;
  text-align: center;
}

.loading-state i,
.empty-state i {
  font-size: 2.5rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0;
  font-weight: 600;
  color: #374151;
}

.empty-state small {
  color: #94a3b8;
}

.metrics-content {
  padding: 1rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.metric-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.metric-card.alert {
  border-color: #fca5a5;
  background: #fef2f2;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.metric-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.alert-icon {
  color: #ef4444;
  font-size: 0.875rem;
}

.metric-value-container {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.metric-unit {
  font-size: 0.875rem;
  font-weight: 400;
  color: #64748b;
}

.metric-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.threshold-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.threshold-progress {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.threshold-progress.normal {
  background: #22c55e;
}

.threshold-progress.warning {
  background: #f59e0b;
}

.threshold-progress.critical {
  background: #ef4444;
}

.metric-updated {
  font-size: 0.6875rem;
  color: #94a3b8;
}

.chart-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h4 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
}

.metric-chart {
  height: 200px;
}

.alerts-section {
  padding: 1rem;
  background: #fef2f2;
  border-top: 1px solid #fecaca;
}

.alerts-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #dc2626;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 6px;
  border-left: 3px solid;
}

.alert-item.severity-critical { border-color: #dc2626; }
.alert-item.severity-error { border-color: #ea580c; }
.alert-item.severity-warning { border-color: #d97706; }
.alert-item.severity-info { border-color: #2563eb; }

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.alert-message {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.alert-time {
  font-size: 0.6875rem;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
