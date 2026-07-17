<template>
  <div class="module-card mes-module">
    <div class="card-header">
      <div class="header-left">
        <div class="module-icon mes">
          <i class="pi pi-sitemap"></i>
        </div>
        <div class="module-info">
          <h3>KAP MES</h3>
          <p>Suivi KPIs industriels</p>
        </div>
      </div>
      <div class="header-actions">
        <Button 
          icon="pi pi-external-link" 
          text 
          rounded
          @click="navigateToModule"
          v-tooltip="'Accéder au module'"
          class="action-btn"
        />
      </div>
    </div>

    <div class="card-content">
      <!-- KPIs principaux -->
      <div class="kpi-row">
        <div class="kpi-item">
          <div class="kpi-value">{{ data?.trs || 0 }}%</div>
          <div class="kpi-label">TRS</div>
          <div class="kpi-trend" :class="getTrendClass(data?.trs_trend)">
            <i :class="getTrendIcon(data?.trs_trend)"></i>
            {{ Math.abs(data?.trs_trend || 0) }}%
          </div>
        </div>
        <div class="kpi-item">
          <div class="kpi-value">{{ data?.machines_actives || 0 }}</div>
          <div class="kpi-label">Machines actives</div>
        </div>
        <div class="kpi-item">
          <div class="kpi-value">{{ data?.taux_qualite || 0 }}%</div>
          <div class="kpi-label">Qualité</div>
        </div>
        <div class="kpi-item">
          <div class="kpi-value" :class="getCapacityClass(capacityLoad)">{{ capacityLoad.toFixed(0) }}%</div>
          <div class="kpi-label">Charge Capa</div>
          <div class="capacity-indicator">
            <div class="capacity-bar">
              <div class="capacity-fill" :class="getCapacityClass(capacityLoad)" :style="{ width: capacityLoad + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alertes et notifications -->
      <div class="alerts-section" v-if="data?.alertes && data.alertes.length > 0">
        <div class="section-title">
          <i class="pi pi-exclamation-triangle"></i>
          Alertes actives ({{ data.alertes.length }})
        </div>
        <div class="alerts-list">
          <div 
            v-for="alerte in data.alertes.slice(0, 3)" 
            :key="alerte.id"
            class="alert-item"
            :class="alerte.severity"
          >
            <div class="alert-icon">
              <i :class="getAlertIcon(alerte.severity)"></i>
            </div>
            <div class="alert-content">
              <div class="alert-message">{{ alerte.message }}</div>
              <div class="alert-time">{{ formatTime(alerte.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performances machines -->
      <div class="machines-section" v-if="data?.machines">
        <div class="section-title">Performances machines</div>
        <div class="machines-grid">
          <div 
            v-for="machine in data.machines.slice(0, 4)" 
            :key="machine.id"
            class="machine-item"
          >
            <div class="machine-header">
              <span class="machine-name">{{ machine.name }}</span>
              <Tag 
                :value="machine.status" 
                :severity="getStatusSeverity(machine.status)"
              />
            </div>
            <div class="machine-metrics">
              <div class="metric">
                <span class="metric-label">TRS</span>
                <span class="metric-value">{{ machine.trs }}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">Disponibilité</span>
                <span class="metric-value">{{ machine.disponibilite }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="quick-actions">
        <Button 
          label="Tableau de bord"
          icon="pi pi-chart-line"
          size="small"
          @click="openDashboard"
          class="action-btn primary"
        />
        <Button
          label="Voir Machines"
          icon="pi pi-cog"
          size="small"
          outlined
          @click="viewMachines"
          class="action-btn"
        />
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading" class="loading-overlay">
      <ProgressSpinner style="width:30px;height:30px" strokeWidth="4" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

// Props
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Composables
const router = useRouter()
const toast = useToast()

// Computed - Charge capacitaire
const capacityLoad = computed(() => {
  if (!props.data) return 0

  const activeMachines = props.data.machines_actives || 0
  const totalMachines = props.data.total_machines || 10 // Fallback à 10 si non défini
  const activeOrders = props.data.ordres_actifs || 0

  // Formule simplifiée pour le dashboard
  const machineUtilization = (activeMachines / totalMachines) * 100

  // Si on a des ordres actifs, on ajoute un bonus
  if (activeOrders > 0) {
    const orderLoad = Math.min((activeOrders / 5) * 20, 30) // Max 30% de bonus
    return Math.min(machineUtilization + orderLoad, 100)
  }

  return Math.min(machineUtilization, 100)
})

// Methods
const navigateToModule = () => {
  router.push('/mes')
}

const openDashboard = () => {
  router.push('/mes?view=dashboard')
}

const viewMachines = () => {
  router.push('/mes')
}

const getTrendClass = (trend) => {
  if (!trend) return ''
  return trend > 0 ? 'up' : 'down'
}

const getTrendIcon = (trend) => {
  if (!trend) return 'pi pi-minus'
  return trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'
}

const getAlertIcon = (severity) => {
  const icons = {
    'critical': 'pi pi-times-circle',
    'warning': 'pi pi-exclamation-triangle',
    'info': 'pi pi-info-circle'
  }
  return icons[severity] || 'pi pi-info-circle'
}

const getStatusSeverity = (status) => {
  const severities = {
    'active': 'success',
    'warning': 'warning',
    'error': 'danger',
    'maintenance': 'info'
  }
  return severities[status] || 'info'
}

const getCapacityClass = (capacity) => {
  if (capacity >= 90) return 'critical'
  if (capacity >= 75) return 'high'
  if (capacity >= 50) return 'optimal'
  if (capacity >= 25) return 'low'
  return 'very-low'
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffMins = Math.floor((now - date) / 60000)
  
  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  const diffHours = Math.floor(diffMins / 60)
  return `Il y a ${diffHours}h`
}
</script>

<style scoped>
.mes-module .module-icon.mes {
  background: #374151;
}

.mes-module:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.kpi-trend.up {
  color: #16a34a;
}

.kpi-trend.down {
  color: #dc2626;
}

.alerts-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid;
}

.alert-item.critical {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.alert-item.warning {
  background: #fffbeb;
  border-color: #fed7aa;
  color: #d97706;
}

.alert-item.info {
  background: #eff6ff;
  border-color: #dbeafe;
  color: #2563eb;
}

.alert-icon {
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-message {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.125rem;
}

.alert-time {
  font-size: 0.75rem;
  opacity: 0.8;
}

.machines-section {
  margin-bottom: 1.5rem;
}

.machines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.machine-item {
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.machine-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.machine-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.machine-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
}

.metric-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

/* Styles de base du module card */
.module-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.module-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  background: #ffffff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.module-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  color: white;
}

.module-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
}

.module-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  transition: all 0.2s ease;
}

.card-content {
  padding: 1.5rem;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.kpi-item {
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.kpi-item:hover {
  background: #f3f4f6;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.kpi-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.action-btn.primary {
  background: #374151;
  border-color: #374151;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

/* Charge capacitaire - Styles de couleur */
.kpi-value.critical {
  color: #dc2626;
}

.kpi-value.high {
  color: #f59e0b;
}

.kpi-value.optimal {
  color: #10b981;
}

.kpi-value.low {
  color: #3b82f6;
}

.kpi-value.very-low {
  color: #64748b;
}

.capacity-indicator {
  margin-top: 0.5rem;
}

.capacity-bar {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.capacity-fill.critical {
  background: #dc2626;
}

.capacity-fill.high {
  background: #f59e0b;
}

.capacity-fill.optimal {
  background: #7AC943;
}

.capacity-fill.low {
  background: #3b82f6;
}

.capacity-fill.very-low {
  background: #64748b;
}

@media (max-width: 768px) {
  .machines-grid {
    grid-template-columns: 1fr;
  }
  
  .alert-item {
    padding: 0.5rem;
  }
}
</style>
