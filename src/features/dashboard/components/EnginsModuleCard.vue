<template>
  <div class="module-card engins-module">
    <div class="card-header">
      <div class="header-left">
        <div class="module-icon engins">
          <i class="pi pi-cog"></i>
        </div>
        <div class="module-info">
          <h3>KAP Engins</h3>
          <p>Analyse utilisation des engins</p>
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
          <div class="kpi-value">{{ data?.total || 0 }}</div>
          <div class="kpi-label">Engins totaux</div>
        </div>
        <div class="kpi-item success">
          <div class="kpi-value">{{ data?.operationnels || 0 }}</div>
          <div class="kpi-label">Opérationnels</div>
        </div>
        <div class="kpi-item warning">
          <div class="kpi-value">{{ data?.en_maintenance || 0 }}</div>
          <div class="kpi-label">En maintenance</div>
        </div>
      </div>

      <!-- Métriques de performance -->
      <div class="performance-section" v-if="data">
        <div class="section-title">Performances</div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-name">Disponibilité</span>
              <span class="metric-value">{{ data.disponibilite || 0 }}%</span>
            </div>
            <ProgressBar 
              :value="data.disponibilite || 0" 
              :showValue="false"
              class="metric-bar"
            />
          </div>
          
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-name">Utilisation</span>
              <span class="metric-value">{{ data.utilisation || 0 }}%</span>
            </div>
            <ProgressBar 
              :value="data.utilisation || 0" 
              :showValue="false"
              class="metric-bar"
              color="#f59e0b"
            />
          </div>
        </div>
      </div>

      <!-- TBD - Engins en mode dégradé -->
      <div class="tbd-section" v-if="degradedEquipments.length > 0">
        <div class="section-title">
          <i class="pi pi-exclamation-triangle"></i>
          Engins en mode dégradé ({{ degradedEquipments.length }})
        </div>
        <div class="tbd-list">
          <div
            v-for="equipment in degradedEquipments.slice(0, 2)"
            :key="equipment.id"
            class="tbd-item"
            :class="getTbdSeverity(equipment.status)"
          >
            <div class="tbd-header">
              <span class="equipment-name">{{ equipment.name }}</span>
              <span class="equipment-status">{{ getStatusLabel(equipment.status) }}</span>
            </div>
            <div class="tbd-time">
              <i class="pi pi-clock"></i>
              <span>TBD: {{ calculateTBD(equipment) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Indicateurs de fiabilité -->
      <div class="reliability-section" v-if="data?.mttr || data?.mtbf">
        <div class="section-title">Fiabilité</div>
        <div class="reliability-metrics">
          <div class="reliability-item">
            <div class="reliability-icon">
              <i class="pi pi-wrench"></i>
            </div>
            <div class="reliability-content">
              <span class="reliability-label">MTTR</span>
              <span class="reliability-value">{{ data.mttr || 0 }}h</span>
            </div>
          </div>

          <div class="reliability-item">
            <div class="reliability-icon">
              <i class="pi pi-clock"></i>
            </div>
            <div class="reliability-content">
              <span class="reliability-label">MTBF</span>
              <span class="reliability-value">{{ data.mtbf || 0 }}h</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="quick-actions">
        <Button 
          label="Suivi flotte"
          icon="pi pi-eye"
          size="small"
          @click="openFleetMonitoring"
          class="action-btn primary"
        />
        <Button 
          label="Planification"
          icon="pi pi-calendar"
          size="small"
          outlined
          @click="openPlanning"
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

// Computed - Équipements dégradés (maintenance, panne, arrêt, dégradé)
const degradedEquipments = computed(() => {
  if (!props.data?.equipments) return []

  return props.data.equipments.filter(eq =>
    ['maintenance', 'breakdown', 'down', 'stopped', 'degraded', 'DEGRADED', 'MAINTENANCE', 'BREAKDOWN'].includes(eq.status)
  )
})

// Fonctions utilitaires pour TBD
const calculateTBD = (equipment) => {
  const stateChangeTime = equipment.lastStateChange || equipment.updated_at || equipment.last_maintenance

  if (!stateChangeTime) {
    return 'Durée inconnue'
  }

  const now = new Date()
  const changeDate = new Date(stateChangeTime)
  const diffMs = now - changeDate

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays}j ${diffHours % 24}h`
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}min`
  } else {
    return `${diffMinutes}min`
  }
}

const getTbdSeverity = (status) => {
  const statusLower = status?.toLowerCase() || ''
  const severities = {
    'maintenance': 'warning',
    'breakdown': 'danger',
    'down': 'danger',
    'stopped': 'warning',
    'degraded': 'warning'
  }
  return severities[statusLower] || 'info'
}

const getStatusLabel = (status) => {
  const statusLower = status?.toLowerCase() || ''
  const labels = {
    'maintenance': 'Maintenance',
    'breakdown': 'Panne',
    'down': 'Arrêté',
    'stopped': 'Arrêté',
    'degraded': 'Dégradé'
  }
  return labels[statusLower] || status
}

// Methods
const navigateToModule = () => {
  router.push('/engins')
}

const openFleetMonitoring = () => {
  router.push('/engins?view=monitoring')
}

const openPlanning = () => {
  toast.add({
    severity: 'info',
    summary: 'Planification',
    detail: 'Redirection vers la planification de maintenance...',
    life: 2000
  })
}
</script>

<style scoped>
.engins-module .module-icon.engins {
  background: #374151;
}

.engins-module:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.performance-section,
.reliability-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metric-card {
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.metric-name {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #f59e0b;
}

.metric-bar {
  height: 12px;
  border-radius: 6px;
}

.reliability-metrics {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.reliability-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.reliability-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f59e0b;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.reliability-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.reliability-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.reliability-value {
  font-size: 0.875rem;
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
  grid-template-columns: repeat(3, 1fr);
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

.kpi-item.warning .kpi-value {
  color: #f59e0b;
}

/* TBD Section */
.tbd-section {
  margin-bottom: 1.5rem;
}

.tbd-section .section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tbd-section .section-title i {
  color: #f59e0b;
}

.tbd-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tbd-item {
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid;
}

.tbd-item.warning {
  background: #fff7ed;
  border-color: #f59e0b;
}

.tbd-item.danger {
  background: #fef2f2;
  border-color: #ef4444;
}

.tbd-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.equipment-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.equipment-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.tbd-item.warning .equipment-status {
  background: #fef3c7;
  color: #92400e;
}

.tbd-item.danger .equipment-status {
  background: #fee2e2;
  color: #991b1b;
}

.tbd-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.813rem;
  color: #64748b;
  font-weight: 600;
}

.tbd-time i {
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .reliability-metrics {
    flex-direction: column;
  }
  
  .metrics-grid {
    gap: 0.5rem;
  }
}
</style>
