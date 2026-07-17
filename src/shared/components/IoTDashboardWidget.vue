<template>
  <div class="iot-dashboard-widget">
    <div class="widget-header">
      <div class="header-title">
        <i class="pi pi-microchip"></i>
        <h3>IoT - Capteurs</h3>
      </div>
      <Button
        icon="pi pi-refresh"
        text
        size="small"
        :loading="loading"
        @click="loadDashboard"
        v-tooltip.top="'Actualiser'"
      />
    </div>

    <div v-if="loading && !dashboardData" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
    </div>

    <div v-else-if="!dashboardData" class="empty-state">
      <i class="pi pi-wifi"></i>
      <p>Aucun device configure</p>
    </div>

    <div v-else class="widget-content">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-value">{{ dashboardData.total_devices }}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card online">
          <div class="stat-value">{{ dashboardData.online_devices }}</div>
          <div class="stat-label">En ligne</div>
        </div>
        <div class="stat-card offline">
          <div class="stat-value">{{ dashboardData.offline_devices }}</div>
          <div class="stat-label">Hors ligne</div>
        </div>
        <div class="stat-card alerts" v-if="dashboardData.unacknowledged_alerts > 0">
          <div class="stat-value">{{ dashboardData.unacknowledged_alerts }}</div>
          <div class="stat-label">Alertes</div>
        </div>
      </div>

      <!-- Devices by Type -->
      <div class="devices-by-type" v-if="Object.keys(dashboardData.devices_by_type || {}).length > 0">
        <h4>Par type</h4>
        <div class="type-list">
          <div
            v-for="(count, type) in dashboardData.devices_by_type"
            :key="type"
            class="type-item"
          >
            <i :class="getDeviceTypeIcon(type)"></i>
            <span class="type-label">{{ getDeviceTypeLabel(type) }}</span>
            <span class="type-count">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Alerts Preview -->
      <div class="alerts-preview" v-if="recentAlerts.length > 0">
        <h4>Alertes recentes</h4>
        <div class="alerts-list">
          <div
            v-for="alert in recentAlerts.slice(0, 3)"
            :key="alert.id"
            class="alert-item"
            :class="`severity-${alert.severity}`"
          >
            <i class="pi pi-exclamation-triangle"></i>
            <div class="alert-content">
              <span class="alert-device">{{ alert.device?.name }}</span>
              <span class="alert-message">{{ alert.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="widget-footer">
        <Button
          label="Voir tous les devices"
          icon="pi pi-external-link"
          text
          size="small"
          @click="navigateToDevices"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIoTStore } from '@/stores/iotStore'
import Button from 'primevue/button'

const router = useRouter()
const iotStore = useIoTStore()

const loading = ref(false)
const dashboardData = ref(null)
const recentAlerts = ref([])

let refreshInterval = null

async function loadDashboard() {
  loading.value = true
  try {
    dashboardData.value = await iotStore.fetchDashboard()
    await iotStore.fetchAlerts({ is_resolved: false })
    recentAlerts.value = iotStore.alerts.slice(0, 5)
  } catch (error) {
    console.error('Error loading IoT dashboard:', error)
  } finally {
    loading.value = false
  }
}

function getDeviceTypeIcon(type) {
  const icons = {
    sensor: 'pi pi-chart-line',
    actuator: 'pi pi-cog',
    gateway: 'pi pi-server',
    controller: 'pi pi-sliders-h'
  }
  return icons[type] || 'pi pi-microchip'
}

function getDeviceTypeLabel(type) {
  const labels = {
    sensor: 'Capteurs',
    actuator: 'Actuateurs',
    gateway: 'Gateways',
    controller: 'Contrôleurs'
  }
  return labels[type] || type
}

function navigateToDevices() {
  router.push({ name: 'sites' })
}

onMounted(() => {
  loadDashboard()
  // Auto-refresh every 60 seconds
  refreshInterval = setInterval(loadDashboard, 60000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.iot-dashboard-widget {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-title i {
  font-size: 1.25rem;
}

.header-title h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.widget-header :deep(.p-button) {
  color: white;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
}

.loading-state i {
  font-size: 1.5rem;
}

.empty-state i {
  font-size: 2rem;
  color: #cbd5e1;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

.widget-content {
  padding: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 0.75rem;
  text-align: center;
}

.stat-card.online {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.stat-card.offline {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.stat-card.alerts {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-card.online .stat-value { color: #16a34a; }
.stat-card.offline .stat-value { color: #64748b; }
.stat-card.alerts .stat-value { color: #dc2626; }

.stat-label {
  font-size: 0.6875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.devices-by-type h4,
.alerts-preview h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
}

.type-item i {
  color: #3b82f6;
  font-size: 0.875rem;
}

.type-label {
  flex: 1;
  font-size: 0.8125rem;
  color: #374151;
}

.type-count {
  font-weight: 600;
  color: #1e293b;
  background: #e2e8f0;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  border-radius: 6px;
  border-left: 3px solid;
}

.alert-item.severity-critical { border-color: #dc2626; }
.alert-item.severity-error { border-color: #ea580c; }
.alert-item.severity-warning { border-color: #d97706; }
.alert-item.severity-info { border-color: #2563eb; }

.alert-item i {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 2px;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.alert-device {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

.alert-message {
  font-size: 0.6875rem;
  color: #64748b;
}

.widget-footer {
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 0.75rem;
  text-align: center;
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
