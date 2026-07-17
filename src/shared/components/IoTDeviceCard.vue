<template>
  <div
    class="iot-device-card"
    :class="[
      `status-${device.status}`,
      { 'clickable': clickable }
    ]"
    @click="handleClick"
  >
    <!-- Header avec statut -->
    <div class="device-header">
      <div class="status-indicator">
        <span class="status-dot" :class="device.status"></span>
        <span class="status-label">{{ statusLabel }}</span>
      </div>
      <div class="device-actions" v-if="showActions">
        <Button
          v-if="showDetails"
          icon="pi pi-eye"
          text
          size="small"
          @click.stop="$emit('view', device)"
          v-tooltip.top="'Voir les details'"
        />
        <Button
          v-if="showEdit"
          icon="pi pi-pencil"
          text
          size="small"
          @click.stop="$emit('edit', device)"
          v-tooltip.top="'Modifier'"
        />
        <Button
          v-if="showDelete"
          icon="pi pi-trash"
          text
          size="small"
          severity="danger"
          @click.stop="$emit('delete', device)"
          v-tooltip.top="'Supprimer'"
        />
      </div>
    </div>

    <!-- Corps principal -->
    <div class="device-body">
      <div class="device-icon" :class="`type-${device.device_type}`">
        <i :class="deviceIcon"></i>
      </div>
      <div class="device-info">
        <h4 class="device-name">{{ device.name }}</h4>
        <code class="device-id">{{ device.device_id }}</code>
        <div class="device-meta">
          <Tag
            :value="deviceTypeLabel"
            :severity="deviceTypeSeverity"
            class="device-type-tag"
          />
        </div>
      </div>
    </div>

    <!-- Metriques temps reel (si disponibles) -->
    <div v-if="showMetrics && latestMetrics.length > 0" class="device-metrics">
      <div
        v-for="metric in latestMetrics.slice(0, 3)"
        :key="metric.name"
        class="metric-item"
      >
        <span class="metric-label">{{ metric.display_name || metric.name }}</span>
        <span class="metric-value">
          {{ formatValue(metric.value) }}
          <small v-if="metric.unit">{{ metric.unit }}</small>
        </span>
      </div>
    </div>

    <!-- Footer avec infos complementaires -->
    <div class="device-footer">
      <div class="footer-item" v-if="device.mqtt_topic_publish">
        <i class="pi pi-send"></i>
        <span class="footer-text">{{ truncateTopic(device.mqtt_topic_publish) }}</span>
      </div>
      <div class="footer-item" v-if="device.last_seen">
        <i class="pi pi-clock"></i>
        <span class="footer-text">{{ formatLastSeen(device.last_seen) }}</span>
      </div>
      <div class="footer-item" v-if="device.battery_level !== null && device.battery_level !== undefined">
        <i :class="batteryIcon"></i>
        <span class="footer-text">{{ device.battery_level }}%</span>
      </div>
      <div class="footer-item" v-if="device.signal_strength !== null && device.signal_strength !== undefined">
        <i :class="signalIcon"></i>
        <span class="footer-text">{{ device.signal_strength }}%</span>
      </div>
    </div>

    <!-- Alertes actives (si presentes) -->
    <div v-if="activeAlerts.length > 0" class="device-alerts">
      <div
        v-for="alert in activeAlerts.slice(0, 2)"
        :key="alert.id"
        class="alert-item"
        :class="`severity-${alert.severity}`"
      >
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ alert.message || 'Alerte active' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const props = defineProps({
  device: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  showDetails: {
    type: Boolean,
    default: true
  },
  showEdit: {
    type: Boolean,
    default: true
  },
  showDelete: {
    type: Boolean,
    default: true
  },
  showMetrics: {
    type: Boolean,
    default: true
  },
  clickable: {
    type: Boolean,
    default: false
  },
  metrics: {
    type: Array,
    default: () => []
  },
  alerts: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['click', 'view', 'edit', 'delete'])

const statusLabel = computed(() => {
  const labels = {
    online: 'En ligne',
    offline: 'Hors ligne',
    error: 'Erreur',
    maintenance: 'Maintenance'
  }
  return labels[props.device.status] || props.device.status
})

const deviceIcon = computed(() => {
  const icons = {
    sensor: 'pi pi-chart-line',
    actuator: 'pi pi-cog',
    gateway: 'pi pi-server',
    controller: 'pi pi-sliders-h'
  }
  return icons[props.device.device_type] || 'pi pi-microchip'
})

const deviceTypeLabel = computed(() => {
  const labels = {
    sensor: 'Capteur',
    actuator: 'Actuateur',
    gateway: 'Gateway',
    controller: 'Controleur'
  }
  return labels[props.device.device_type] || props.device.device_type
})

const deviceTypeSeverity = computed(() => {
  const severities = {
    sensor: 'info',
    actuator: 'warn',
    gateway: 'success',
    controller: 'secondary'
  }
  return severities[props.device.device_type] || 'secondary'
})

const batteryIcon = computed(() => {
  const level = props.device.battery_level
  if (level > 75) return 'pi pi-battery-full'
  if (level > 50) return 'pi pi-battery-medium'
  if (level > 25) return 'pi pi-battery-low'
  return 'pi pi-battery-empty'
})

const signalIcon = computed(() => {
  const level = props.device.signal_strength
  if (level > 75) return 'pi pi-wifi'
  if (level > 50) return 'pi pi-wifi'
  if (level > 25) return 'pi pi-wifi'
  return 'pi pi-wifi'
})

const latestMetrics = computed(() => {
  if (props.metrics && props.metrics.length > 0) {
    return props.metrics
  }
  if (props.device.metrics && props.device.metrics.length > 0) {
    return props.device.metrics
  }
  return []
})

const activeAlerts = computed(() => {
  if (props.alerts && props.alerts.length > 0) {
    return props.alerts.filter(a => !a.is_resolved)
  }
  if (props.device.iot_alerts && props.device.iot_alerts.length > 0) {
    return props.device.iot_alerts.filter(a => !a.is_resolved)
  }
  return []
})

function formatLastSeen(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'A l\'instant'
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${days}j`
}

function formatValue(value) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : value.toFixed(2)
  }
  return String(value)
}

function truncateTopic(topic) {
  if (!topic) return ''
  if (topic.length > 30) {
    return topic.substring(0, 27) + '...'
  }
  return topic
}

function handleClick() {
  if (props.clickable) {
    emit('click', props.device)
  }
}
</script>

<style scoped>
.iot-device-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.iot-device-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.iot-device-card.clickable {
  cursor: pointer;
}

.iot-device-card.status-online {
  border-left: 4px solid #22c55e;
}

.iot-device-card.status-offline {
  border-left: 4px solid #94a3b8;
}

.iot-device-card.status-error {
  border-left: 4px solid #ef4444;
}

.iot-device-card.status-maintenance {
  border-left: 4px solid #f59e0b;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

.status-dot.offline {
  background: #94a3b8;
}

.status-dot.error {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.status-dot.maintenance {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
}

.status-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.device-actions {
  display: flex;
  gap: 0.25rem;
}

.device-body {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
}

.device-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.device-icon.type-sensor {
  background: #3b82f6;
}

.device-icon.type-actuator {
  background: #f59e0b;
}

.device-icon.type-gateway {
  background: #22c55e;
}

.device-icon.type-controller {
  background: #8b5cf6;
}

.device-icon i {
  color: white;
  font-size: 1.25rem;
}

.device-info {
  flex: 1;
  min-width: 0;
}

.device-name {
  margin: 0 0 0.25rem 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
}

.device-id {
  display: inline-block;
  font-size: 0.75rem;
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.device-type-tag {
  font-size: 0.6875rem;
}

.device-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border-top: 1px solid #bbf7d0;
  border-bottom: 1px solid #bbf7d0;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.metric-label {
  font-size: 0.6875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: #16a34a;
}

.metric-value small {
  font-weight: 400;
  color: #64748b;
  font-size: 0.75rem;
}

.device-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #64748b;
}

.footer-item i {
  font-size: 0.75rem;
  color: #94a3b8;
}

.footer-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.device-alerts {
  padding: 0.5rem 1rem;
  background: #fef2f2;
  border-top: 1px solid #fecaca;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  padding: 0.25rem 0;
}

.alert-item.severity-critical {
  color: #dc2626;
}

.alert-item.severity-error {
  color: #ea580c;
}

.alert-item.severity-warning {
  color: #d97706;
}

.alert-item.severity-info {
  color: #2563eb;
}

.alert-item i {
  font-size: 0.75rem;
}

@media (max-width: 640px) {
  .device-metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .device-footer {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
