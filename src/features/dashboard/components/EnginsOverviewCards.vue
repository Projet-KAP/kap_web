<template>
  <div class="engins-overview">
    <div class="overview-grid">
      <!-- Carte Engins Actifs -->
      <KPICard
        title="Engins Actifs"
        :value="enginsData.operationalCount || enginsData.activeCount"
        icon="pi pi-cog"
        variant="neutral"
      >
        <template #meta>
          <span class="total">{{ enginsData.totalCount }} total</span>
        </template>
      </KPICard>

      <!-- Carte Fiabilité Moyenne -->
      <KPICard
        title="Fiabilité Moyenne"
        :value="enginsData.averageReliability"
        icon="pi pi-shield"
        variant="neutral"
        format="percentage"
      >
        <template #meta>
          <ProgressBar 
            v-if="enginsData.averageReliability > 0"
            :value="enginsData.averageReliability" 
            :showValue="false"
            class="reliability-progress"
          />
        </template>
      </KPICard>

      <!-- Carte Alertes Critiques -->
      <KPICard
        title="Alertes Critiques"
        :value="enginsData.criticalAlerts"
        icon="pi pi-exclamation-triangle"
        variant="neutral"
      >
        <template #meta>
          <Tag 
            v-if="enginsData.criticalAlerts > 0" 
            severity="secondary" 
            value="Action requise"
          />
          <Tag 
            v-else 
            severity="secondary" 
            value="Tout va bien"
          />
        </template>
      </KPICard>

      <!-- Carte Taux de Panne -->
      <KPICard
        title="Taux de Panne"
        :value="enginsData.averageBreakdownRate"
        icon="pi pi-times-circle"
        variant="neutral"
        format="percentage"
      >
        <template #meta>
          <span v-if="enginsData.breakdownTrendValue" :class="['trend', enginsData.breakdownTrend]">
            <i :class="getTrendIcon(enginsData.breakdownTrend)"></i>
            {{ enginsData.breakdownTrendValue }}%
          </span>
        </template>
      </KPICard>
    </div>

    <!-- KPIs Détaillés -->
    <div class="detailed-kpis">
      <Card class="kpis-card">
        <template #header>
          <div class="card-header">
            <h3>KPIs Détaillés</h3>
            <Button 
              icon="pi pi-refresh" 
              text 
              @click="$emit('refresh-data')"
              v-tooltip="'Actualiser les données'"
            />
          </div>
        </template>
        <template #content>
          <div class="kpis-grid">
            <div class="kpi-item">
              <div class="kpi-label">
                <i class="pi pi-clock"></i>
                <span>Temps de Fonctionnement</span>
              </div>
              <div class="kpi-value">
                <span class="value">{{ enginsData.averageUptime }}%</span>
                <ProgressBar 
                  :value="enginsData.averageUptime" 
                  :showValue="false"
                  class="kpi-progress uptime"
                />
              </div>
            </div>

            <div class="kpi-item">
              <div class="kpi-label">
                <i class="pi pi-wrench"></i>
                <span>Taux de Réparation</span>
              </div>
              <div class="kpi-value">
                <span class="value">{{ enginsData.averageRepairRate }}%</span>
                <ProgressBar 
                  :value="enginsData.averageRepairRate" 
                  :showValue="false"
                  class="kpi-progress repair"
                />
              </div>
            </div>

            <div class="kpi-item">
              <div class="kpi-label">
                <i class="pi pi-cog"></i>
                <span>Score Maintenance</span>
              </div>
              <div class="kpi-value">
                <span class="value">{{ enginsData.averageMaintenanceScore }}%</span>
                <ProgressBar 
                  :value="enginsData.averageMaintenanceScore" 
                  :showValue="false"
                  class="kpi-progress maintenance"
                />
              </div>
            </div>

            <div class="kpi-item">
              <div class="kpi-label">
                <i class="pi pi-chart-line"></i>
                <span>Efficacité Carburant</span>
              </div>
              <div class="kpi-value">
                <span class="value">{{ enginsData.averageFuelEfficiency }}%</span>
                <ProgressBar 
                  :value="enginsData.averageFuelEfficiency" 
                  :showValue="false"
                  class="kpi-progress fuel"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Trackers Status -->
    <div class="trackers-section">
      <Card class="trackers-card">
        <template #header>
          <div class="card-header">
            <h3>État des Trackers</h3>
            <Button 
              label="Voir Localisation" 
              icon="pi pi-map-marker" 
              @click="$emit('view-location')"
              class="location-btn"
            />
          </div>
        </template>
        <template #content>
          <div class="trackers-grid">
            <div class="tracker-stat">
              <div class="stat-icon active">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="stat-info">
                <h4>{{ enginsData.activeTrackers }}</h4>
                <p>Trackers Actifs</p>
              </div>
            </div>

            <div class="tracker-stat">
              <div class="stat-icon signal">
                <i class="pi pi-wifi"></i>
              </div>
              <div class="stat-info">
                <h4>{{ enginsData.averageSignalStrength }}</h4>
                <p>Signal Moyen</p>
              </div>
            </div>

            <div class="tracker-stat">
              <div class="stat-icon battery">
                <i class="pi pi-bolt"></i>
              </div>
              <div class="stat-info">
                <h4>{{ enginsData.averageBatteryLevel }}%</h4>
                <p>Batterie Moyenne</p>
              </div>
            </div>

            <div class="tracker-stat">
              <div class="stat-icon location">
                <i class="pi pi-map-marker"></i>
              </div>
              <div class="stat-info">
                <h4>{{ enginsData.locationsCount }}</h4>
                <p>Localisations</p>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Actions Rapides -->
    <div class="quick-actions">
      <Card class="actions-card">
        <template #header>
          <h3>Actions Rapides</h3>
        </template>
        <template #content>
          <div class="actions-grid">
            <Button 
              label="Gérer Engins" 
              icon="pi pi-cog" 
              @click="$emit('manage-engins')"
              class="action-btn primary-action"
            />
            <Button 
              label="Voir Alertes" 
              icon="pi pi-bell" 
              @click="$emit('view-alerts')"
              class="action-btn secondary-action"
              :badge="enginsData.totalAlerts > 0 ? enginsData.totalAlerts.toString() : null"
            />
            <Button
              label="Historique Maintenance"
              icon="pi pi-history"
              @click="$emit('view-maintenance-history')"
              class="action-btn secondary-action"
            />
            <Button 
              label="Planifier Maintenance" 
              icon="pi pi-calendar-plus" 
              @click="$emit('schedule-maintenance')"
              class="action-btn secondary-action"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import KPICard from '@/shared/components/KPICard.vue'

// Props
const props = defineProps({
  enginsData: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits([
  'refresh-data',
  'view-location',
  'manage-engins',
  'view-alerts',
  'view-maintenance-history',
  'schedule-maintenance'
])

// Methods
const getTrendIcon = (trend) => {
  switch (trend) {
    case 'up': return 'pi pi-arrow-up'
    case 'down': return 'pi pi-arrow-down'
    default: return 'pi pi-minus'
  }
}
</script>

<style scoped>
.engins-overview {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.overview-card {
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.engins-card {
  background: #2563eb;
  color: white;
}

.reliability-card {
  background: #7AC943;
  color: white;
}

.alerts-card {
  background: #d97706;
  color: white;
}

.breakdown-card {
  background: #0ea5e9;
  color: white;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.card-icon i {
  font-size: 1.8rem;
}

.card-info h3 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1;
}

.card-info p {
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  opacity: 0.9;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.total {
  font-size: 0.875rem;
  opacity: 0.8;
}

.reliability-progress {
  width: 120px;
  height: 12px;
  border-radius: 6px;
}

.reliability-progress :deep(.p-progressbar-value) {
  background: rgba(255, 255, 255, 0.8);
}

.trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.trend.up {
  color: #10b981;
}

.trend.down {
  color: #ef4444;
}

.detailed-kpis {
  margin-top: 1rem;
}

.kpis-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.kpi-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.kpi-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #6b7280;
}

.kpi-label i {
  color: #2563eb;
}

.kpi-value {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.kpi-value .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.kpi-progress {
  height: 14px;
  border-radius: 7px;
}

.kpi-progress.uptime :deep(.p-progressbar-value) {
  background: #7AC943;
}

.kpi-progress.repair :deep(.p-progressbar-value) {
  background: #2563eb;
}

.kpi-progress.maintenance :deep(.p-progressbar-value) {
  background: #d97706;
}

.kpi-progress.fuel :deep(.p-progressbar-value) {
  background: #0ea5e9;
}

.trackers-section {
  margin-top: 1rem;
}

.trackers-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.location-btn {
  background: #2563eb;
  border: none;
  color: white;
}

.trackers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.tracker-stat {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.stat-icon.active {
  background: #dcfce7;
  color: #16a34a;
}

.stat-icon.signal {
  background: #dbeafe;
  color: #2563eb;
}

.stat-icon.battery {
  background: #fef3c7;
  color: #d97706;
}

.stat-icon.location {
  background: #fce7f3;
  color: #be185d;
}

.stat-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.quick-actions {
  margin-top: 1rem;
}

.actions-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.primary-action {
  background: #2563eb;
  border: none;
  color: white;
}

.primary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.secondary-action {
  border-color: #2563eb;
  color: #2563eb;
  background: white;
}

.secondary-action:hover {
  background: #2563eb;
  color: white;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
  
  .kpis-grid {
    grid-template-columns: 1fr;
  }
  
  .trackers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
