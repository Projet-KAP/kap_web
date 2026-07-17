<template>
  <Card class="location-map-card">
    <template #header>
      <div class="map-header">
        <div class="header-content">
          <h3>Localisation des Engins</h3>
          <p>Position en temps réel avec statut tracker</p>
        </div>
        <div class="header-controls">
          <Button
            icon="pi pi-refresh"
            text
            @click="refreshLocations"
            v-tooltip="'Actualiser les positions'"
            :loading="refreshing"
          />
        </div>
      </div>
    </template>
    
    <template #content>
      <!-- Vue Liste uniquement -->
      <div class="locations-list">
        <div class="list-header">
          <div class="header-left">
            <h4>Positions des Engins <span class="engins-count">({{ engins.length }})</span></h4>
          </div>
          <span class="last-update">
            <i class="pi pi-clock"></i>
            {{ lastUpdateTime }}
          </span>
        </div>

        <div class="locations-grid">
          <div
            v-for="engin in paginatedEngins"
            :key="engin.id"
            class="location-card"
            :class="{ 'selected': selectedEngin?.id === engin.id }"
            @click="selectEngin(engin)"
          >
            <!-- En-tête de la carte -->
            <div class="card-header">
              <div class="engin-main-info">
                <div class="engin-icon-wrapper">
                  <i :class="getEnginIcon(engin.type)"></i>
                </div>
                <div class="engin-identity">
                  <h5>{{ engin.name }}</h5>
                  <span class="engin-type-label">{{ engin.type }}</span>
                </div>
              </div>
              <div class="status-badges">
                <Tag
                  :value="getStatusLabel(engin.status)"
                  :severity="getStatusSeverity(engin.status)"
                  class="status-badge"
                />
              </div>
            </div>

            <!-- Informations principales -->
            <div class="card-main-content">
              <!-- Position -->
              <div class="info-section location-section">
                <div class="section-header">
                  <i class="pi pi-map-marker"></i>
                  <span class="section-title">Localisation</span>
                </div>
                <div class="section-content">
                  <p class="address">{{ engin.location?.address }}</p>
                  <p class="coordinates">{{ formatCoordinates(engin.location) }}</p>
                  <p class="last-update-time">
                    <i class="pi pi-history"></i>
                    {{ formatTime(engin.location?.lastUpdate) }}
                  </p>
                </div>
              </div>

              <!-- Tracker Status -->
              <div class="info-section tracker-section">
                <div class="section-header">
                  <i class="pi pi-wifi"></i>
                  <span class="section-title">État du tracker</span>
                  <Tag
                    :value="engin.tracker?.isActive ? 'ACTIF' : 'INACTIF'"
                    :severity="engin.tracker?.isActive ? 'success' : 'danger'"
                    size="small"
                  />
                </div>
                <div class="section-content tracker-metrics">
                  <!-- Signal -->
                  <div class="tracker-metric">
                    <span class="metric-label">Signal</span>
                    <div class="signal-indicator">
                      <div
                        v-for="i in 5"
                        :key="i"
                        class="signal-bar"
                        :class="{ active: i <= (engin.tracker?.signalStrength || 0) }"
                      ></div>
                      <span class="signal-value">{{ engin.tracker?.signalStrength || 0 }}/5</span>
                    </div>
                  </div>

                  <!-- Batterie -->
                  <div class="tracker-metric">
                    <span class="metric-label">Batterie</span>
                    <div class="battery-indicator">
                      <ProgressBar
                        :value="engin.tracker?.batteryLevel || 0"
                        :showValue="false"
                        :class="getBatteryClass(engin.tracker?.batteryLevel || 0)"
                      />
                      <span class="battery-value">{{ engin.tracker?.batteryLevel || 0 }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination-container">
          <Paginator
            :rows="itemsPerPage"
            :totalRecords="engins.length"
            :first="(currentPage - 1) * itemsPerPage"
            @page="onPageChange"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          />
        </div>
      </div>

      <!-- Détails de l'engin sélectionné -->
      <div v-if="selectedEngin" class="selected-engin-details">
        <div class="details-header">
          <h4>{{ selectedEngin.name }}</h4>
          <Button 
            icon="pi pi-times" 
            text 
            @click="selectedEngin = null"
            class="close-btn"
          />
        </div>
        
        <div class="details-content">
          <div class="detail-section">
            <h5>Informations Générales</h5>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Modèle:</span>
                <span class="value">{{ selectedEngin.model }}</span>
              </div>
              <div class="info-item">
                <span class="label">Série:</span>
                <span class="value">{{ selectedEngin.serialNumber }}</span>
              </div>
              <div class="info-item">
                <span class="label">Heures de fonctionnement:</span>
                <span class="value">{{ selectedEngin.operatingHours }}h</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h5>KPIs de Performance</h5>
            <div class="kpis-mini-grid">
              <div class="mini-kpi">
                <span class="kpi-label">Fiabilité</span>
                <span class="kpi-value">{{ selectedEngin.kpis.reliability }}%</span>
              </div>
              <div class="mini-kpi">
                <span class="kpi-label">Taux de panne</span>
                <span class="kpi-value">{{ selectedEngin.kpis.breakdownRate }}%</span>
              </div>
              <div class="mini-kpi">
                <span class="kpi-label">Taux de réparation</span>
                <span class="kpi-value">{{ selectedEngin.kpis.repairRate }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { colors } from '@/shared/utils/colors.js'

// Props
const props = defineProps({
  engins: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['engin-selected', 'refresh-locations'])

// État réactif
const selectedEngin = ref(null)
const refreshing = ref(false)
const lastUpdateTime = ref(new Date().toLocaleTimeString('fr-FR'))
const currentPage = ref(1)
const itemsPerPage = ref(1) // 1 engin par page

// Computed - Engins paginés
const paginatedEngins = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return props.engins.slice(start, end)
})

// Methods
const refreshLocations = async () => {
  refreshing.value = true
  try {
    // Simuler l'actualisation
    await new Promise(resolve => setTimeout(resolve, 1000))
    lastUpdateTime.value = new Date().toLocaleTimeString('fr-FR')
    emit('refresh-locations')
  } finally {
    refreshing.value = false
  }
}

const selectEngin = (engin) => {
  selectedEngin.value = engin
  emit('engin-selected', engin)
}

const onPageChange = (event) => {
  currentPage.value = event.page + 1
}

const getEnginIcon = (type) => {
  const icons = {
    'EXCAVATRICE': 'pi pi-cog',
    'BULLDOZER': 'pi pi-forward',
    'GRUE': 'pi pi-arrow-up',
    'COMPACTEUR': 'pi pi-circle'
  }
  return icons[type] || 'pi pi-cog'
}

const getStatusSeverity = (status) => {
  const severities = {
    'ACTIVE': 'success',
    'OPERATIONAL': 'success',  // Mapper OPERATIONAL vers ACTIVE
    'MAINTENANCE': 'warning',
    'INACTIVE': 'secondary',
    'BREAKDOWN': 'danger',
    'DEGRADED': 'warning',
    'STOPPED': 'secondary',
    'OUT_OF_ORDER': 'danger'
  }
  return severities[status] || 'secondary'
}

const getStatusLabel = (status) => {
  const labels = {
    'ACTIVE': 'OPERATIONAL',
    'OPERATIONAL': 'OPERATIONAL',
    'MAINTENANCE': 'MAINTENANCE',
    'INACTIVE': 'INACTIF',
    'BREAKDOWN': 'EN PANNE',
    'DEGRADED': 'DÉGRADÉ',
    'STOPPED': 'ARRÊTÉ',
    'OUT_OF_ORDER': 'HORS SERVICE'
  }
  return labels[status] || status
}

const formatCoordinates = (location) => {
  if (!location || location.latitude === null || location.longitude === null) {
    return 'Non disponible'
  }
  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'Non disponible'
  return new Date(timestamp).toLocaleString('fr-FR')
}

const getBatteryClass = (level) => {
  if (level > 50) return 'battery-good'
  if (level > 20) return 'battery-medium'
  return 'battery-low'
}

onMounted(() => {
  // Initialisation
})
</script>

<style scoped>
.location-map-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.map-header {
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
  gap: 0.5rem;
  flex-shrink: 0;
}

.map-container {
  height: 400px;
  position: relative;
  background: #f0f9ff;
  border-radius: 8px;
  margin: 1rem 1.5rem;
  overflow: hidden;
}

.map-placeholder {
  width: 100%;
  height: 100%;
  position: relative;
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
}

.map-grid {
  position: relative;
  width: 100%;
  height: 100%;
}

.engin-marker {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.engin-marker:hover {
  transform: scale(1.1);
}

.marker-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 3px solid white;
}

.status-active .marker-icon {
  background: v-bind('colors.status.success');
}

.status-maintenance .marker-icon {
  background: v-bind('colors.status.warning');
}

.status-inactive .marker-icon {
  background: v-bind('colors.status.neutral');
}

.tracker-inactive .marker-icon {
  opacity: 0.5;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 0.5; }
  51%, 100% { opacity: 0.8; }
}

.marker-label {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  white-space: nowrap;
}

.map-legend {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.legend-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.locations-list {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
  border-top: 1px solid #e2e8f0;
  margin-top: 1rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.list-header h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.engins-count {
  background: white;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: v-bind('colors.primary');
  border: 1px solid v-bind('colors.primary');
}

.last-update {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.last-update i {
  color: v-bind('colors.primary');
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 1.5rem;
}

.location-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.location-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: v-bind('colors.primary');
}

.location-card.selected {
  border-color: v-bind('colors.primary');
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.engin-main-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.engin-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, v-bind('colors.primary') 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.75rem;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.engin-identity h5 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.engin-type-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.status-badges {
  display: flex;
  gap: 0.5rem;
}

.status-badge {
  font-weight: 600;
}

.card-main-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e2e8f0;
}

.section-header i {
  font-size: 1.25rem;
  color: v-bind('colors.primary');
}

.section-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: 1;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.location-section .address {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.location-section .coordinates {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  font-family: 'Courier New', monospace;
}

.location-section .last-update-time {
  margin: 0;
  font-size: 0.875rem;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.location-section .last-update-time i {
  font-size: 0.75rem;
}

.tracker-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.tracker-metric {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.signal-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.signal-bar {
  width: 6px;
  height: 16px;
  background: #e5e7eb;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.signal-bar.active {
  background: v-bind('colors.status.success');
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.signal-value {
  margin-left: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.battery-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.battery-indicator :deep(.p-progressbar) {
  height: 10px;
  flex: 1;
  border-radius: 8px;
  background: #e5e7eb;
}

.battery-good :deep(.p-progressbar-value) {
  background: linear-gradient(90deg, v-bind('colors.status.success') 0%, #059669 100%);
}

.battery-medium :deep(.p-progressbar-value) {
  background: linear-gradient(90deg, v-bind('colors.status.warning') 0%, #f59e0b 100%);
}

.battery-low :deep(.p-progressbar-value) {
  background: linear-gradient(90deg, v-bind('colors.status.error') 0%, #dc2626 100%);
}

.battery-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  min-width: 40px;
}

.selected-engin-details {
  margin-top: 1.5rem;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.details-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h5 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
}

.info-item .label {
  font-weight: 500;
  color: #6b7280;
}

.info-item .value {
  font-weight: 600;
  color: #1f2937;
}

.kpis-mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.mini-kpi {
  text-align: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
}

.kpi-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.kpi-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: v-bind('colors.primary');
}

@media (max-width: 768px) {
  .map-header {
    flex-direction: column;
    align-items: stretch;
  }

  .map-container {
    height: 300px;
  }

  .list-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .locations-grid {
    grid-template-columns: 1fr;
  }

  .tracker-metrics {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .kpis-mini-grid {
    grid-template-columns: 1fr;
  }
}
</style>
