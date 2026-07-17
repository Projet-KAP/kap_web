<template>
  <div class="dashboard">
    <!-- Header Section -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="welcome-text">
          <h1 class="page-title">Tableau de bord</h1>
          <p class="page-subtitle">Vue d'ensemble de vos opérations industrielles</p>
        </div>
        <div class="header-actions">
          <Button
            icon="pi pi-sliders-h"
            label="Filtres"
            text
            @click="showFiltersDialog = true"
            class="filter-btn"
          />
          <div class="quick-stat" v-if="stats">
            <span class="stat-number">{{ stats.utilisateurs.connectes }}</span>
            <span class="stat-label">Utilisateurs connectés</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters Dialog -->
    <Dialog
      v-model:visible="showFiltersDialog"
      modal
      header="Préférences du tableau de bord"
      :style="{ width: '500px' }"
    >
      <div class="filters-content">
        <div class="filter-group">
          <label class="filter-label">
            <i class="pi pi-sync"></i>
            Actualisation automatique
          </label>
          <div class="filter-control">
            <ToggleSwitch v-model="dashboardPreferences.autoRefresh" @change="updateAutoRefresh" />
          </div>
        </div>

        <div class="filter-group" v-if="dashboardPreferences.autoRefresh">
          <label class="filter-label">
            <i class="pi pi-clock"></i>
            Intervalle d'actualisation
          </label>
          <div class="filter-control">
            <Select
              v-model="dashboardPreferences.refreshInterval"
              :options="refreshIntervalOptions"
              optionLabel="label"
              optionValue="value"
              @change="savePrefs"
              class="w-full"
            />
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">
            <i class="pi pi-chart-bar"></i>
            Afficher les KPIs
          </label>
          <div class="filter-control">
            <ToggleSwitch v-model="dashboardPreferences.showKPIs" @change="savePrefs" />
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">
            <i class="pi pi-list"></i>
            Afficher les activités
          </label>
          <div class="filter-control">
            <ToggleSwitch v-model="dashboardPreferences.showActivities" @change="savePrefs" />
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">
            <i class="pi pi-wrench"></i>
            Afficher la maintenance
          </label>
          <div class="filter-control">
            <ToggleSwitch v-model="dashboardPreferences.showMaintenance" @change="savePrefs" />
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">
            <i class="pi pi-calendar"></i>
            Période des graphiques
          </label>
          <div class="filter-control">
            <Select
              v-model="dashboardPreferences.chartPeriod"
              :options="chartPeriodOptions"
              optionLabel="label"
              optionValue="value"
              @change="savePrefs"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Fermer" @click="showFiltersDialog = false" />
      </template>
    </Dialog>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement du tableau de bord...</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="!error" class="dashboard-content">
      <!-- KPIs Row -->
      <div class="kpi-grid" v-if="kpis.length && dashboardPreferences.showKPIs">
        <div v-for="kpi in kpis" :key="kpi.id" class="kpi-card">
          <div class="kpi-icon" :style="{ color: kpi.color }">
            <i :class="kpi.icon"></i>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">
              {{ kpi.value }}{{ kpi.unit }}
              <span class="kpi-trend" :class="kpi.trend">
                <i :class="kpi.trend === 'up' ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                {{ Math.abs(kpi.change) }}%
              </span>
            </div>
            <div class="kpi-name">{{ kpi.name }}</div>
          </div>
        </div>
      </div>

      <!-- Module Cards -->
      <div class="stats-grid">
        <!-- Collectes Module -->
        <CollectModuleCard
          v-if="stats?.collectes"
          :data="stats.collectes"
          :loading="loading"
        />

        <!-- MES Module -->
        <MESModuleCard
          v-if="stats?.mes"
          :data="stats.mes"
          :loading="loading"
        />

        <!-- Engins Module -->
        <EnginsModuleCard
          v-if="stats?.engins"
          :data="stats.engins"
          :loading="loading"
        />

        <!-- Utilisateurs Module -->
        <div class="module-card" v-if="stats?.utilisateurs">
          <div class="card-header">
            <div class="header-icon users">
              <i class="pi pi-users"></i>
            </div>
            <div class="header-info">
              <h3>Utilisateurs</h3>
              <p>{{ stats.utilisateurs.total }} utilisateurs</p>
            </div>
            <router-link to="/users" class="action-btn">
              <i class="pi pi-arrow-right"></i>
            </router-link>
          </div>
          <div class="card-metrics">
            <div class="metric">
              <span class="metric-value success">{{ stats.utilisateurs.connectes }}</span>
              <span class="metric-label">Connectés</span>
            </div>
            <div class="metric">
              <span class="metric-value">{{ formatTime(stats.utilisateurs.derniere_activite) }}</span>
              <span class="metric-label">Dernière activité</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="activity-section" v-if="activities.length && dashboardPreferences.showActivities">
        <div class="section-header">
          <h2>Activités récentes</h2>
          <Button label="Voir tout" text class="view-all-btn" @click="$router.push('/notifications')" />
        </div>
        <div class="activity-feed">
          <div v-for="activity in activities.slice(0, 5)" :key="activity.id" class="activity-item">
            <div class="activity-icon" :class="activity.severity">
              <i :class="activity.icon"></i>
            </div>
            <div class="activity-content">
              <p class="activity-message">{{ activity.message }}</p>
              <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Maintenance Schedule -->
      <div class="maintenance-section" v-if="maintenanceSchedule.length && dashboardPreferences.showMaintenance">
        <div class="section-header">
          <h2>Maintenance programmée</h2>
          <Button label="Planning complet" text class="view-all-btn" @click="$router.push('/engins')" />
        </div>
        <div class="maintenance-grid">
          <div v-for="maintenance in maintenanceSchedule.slice(0, 3)" :key="maintenance.id" class="maintenance-card">
            <div class="maintenance-header">
              <span class="equipment-name">{{ maintenance.equipment }}</span>
              <span class="maintenance-type" :class="maintenance.type">{{ maintenance.type }}</span>
            </div>
            <div class="maintenance-info">
              <div class="info-item">
                <i class="pi pi-calendar"></i>
                <span>{{ formatDate(maintenance.date) }}</span>
              </div>
              <div class="info-item">
                <i class="pi pi-clock"></i>
                <span>{{ maintenance.duration }}h</span>
              </div>
              <div class="info-item">
                <i class="pi pi-user"></i>
                <span>{{ maintenance.technician }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error-container">
      <div class="error-content">
        <i class="pi pi-exclamation-triangle error-icon"></i>
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <Button label="Réessayer" @click="loadDashboardData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useNavigationStore } from '@/shared'
import { useDashboardStore } from '@/features/dashboard/stores/dashboardStore'
import CollectModuleCard from '@/features/dashboard/components/CollectModuleCard.vue'
import MESModuleCard from '@/features/dashboard/components/MESModuleCard.vue'
import EnginsModuleCard from '@/features/dashboard/components/EnginsModuleCard.vue'

const navigationStore = useNavigationStore()
const dashboardStore = useDashboardStore()

// Reactive data from store
const {
  stats,
  activities,
  kpis,
  maintenanceSchedule,
  loading,
  error,
  dashboardPreferences
} = storeToRefs(dashboardStore)

const { loadDashboardData, savePreferences, updatePreference, startAutoRefresh, stopAutoRefresh } = dashboardStore

// Local state
const showFiltersDialog = ref(false)

// Options
const refreshIntervalOptions = [
  { label: '15 secondes', value: 15000 },
  { label: '30 secondes', value: 30000 },
  { label: '1 minute', value: 60000 },
  { label: '2 minutes', value: 120000 },
  { label: '5 minutes', value: 300000 }
]

const chartPeriodOptions = [
  { label: 'Aujourd\'hui', value: '1d' },
  { label: '7 derniers jours', value: '7d' },
  { label: '30 derniers jours', value: '30d' },
  { label: '3 derniers mois', value: '90d' }
]

// Methods
const savePrefs = () => {
  savePreferences()
}

const updateAutoRefresh = () => {
  savePrefs()
  if (dashboardPreferences.value.autoRefresh) {
    startAutoRefresh(dashboardPreferences.value.refreshInterval)
  } else {
    stopAutoRefresh()
  }
}

// Helper functions
const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR')
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  navigationStore.setActiveSection('dashboard')

  // Charger les préférences sauvegardées
  await dashboardStore.loadPreferences()

  // Charger les données du dashboard
  await loadDashboardData()

  // Démarrer l'auto-refresh selon les préférences
  if (dashboardPreferences.value.autoRefresh) {
    startAutoRefresh(dashboardPreferences.value.refreshInterval)
  } else {
  }
})

onUnmounted(() => {
  // Sauvegarder les préférences
  dashboardStore.savePreferences()

  // Arrêter l'auto-refresh quand on quitte la page
  dashboardStore.stopAutoRefresh()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #FFFFFF;
}

/* Header Section */
.dashboard-header {
  background: #FFFFFF;
  border-bottom: 1px solid #f1f5f9;
  padding: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #0B2B3C;
  margin: 0 0 0.5rem 0;
  font-family: 'Inter', sans-serif;
}

.page-subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
  font-weight: 400;
}

.header-actions {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.filter-btn {
  color: #7AC943 !important;
  font-weight: 600 !important;
}

.filter-btn:hover {
  background: rgba(122, 201, 67, 0.1) !important;
}

.quick-stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #7AC943;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* Filters Dialog */
.filters-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.filter-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  color: #0B2B3C;
  font-size: 0.95rem;
}

.filter-label i {
  color: #7AC943;
  font-size: 1rem;
}

.filter-control {
  min-width: 180px;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f1f5f9;
  border-top: 4px solid #7AC943;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Main Content */
.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.kpi-card {
  background: #FFFFFF;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.kpi-card:hover {
  border-color: #7AC943;
  box-shadow: 0 4px 6px rgba(122, 201, 67, 0.1);
  transform: translateY(-2px);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.kpi-content {
  flex: 1;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0B2B3C;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kpi-trend {
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.kpi-trend.up {
  color: #7AC943;
}

.kpi-trend.down {
  color: #ef4444;
}

.kpi-name {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.module-card {
  background: #FFFFFF;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 0;
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.module-card:hover {
  border-color: #7AC943;
  box-shadow: 0 8px 25px rgba(122, 201, 67, 0.15);
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 1rem;
  color: #FFFFFF;
}

.header-icon.collect {
  background: #3b82f6;
}

.header-icon.mes {
  background: #7AC943;
}

.header-icon.engins {
  background: #f59e0b;
}

.header-icon.users {
  background: #3b82f6;
}

.header-info {
  flex: 1;
}

.header-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0B2B3C;
  margin: 0 0 0.25rem 0;
}

.header-info p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

.action-btn:hover {
  background: #7AC943;
  color: #FFFFFF;
  border-color: #7AC943;
  transform: scale(1.05);
}

.card-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.metric {
  text-align: center;
}

.metric-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0B2B3C;
  margin-bottom: 0.25rem;
}

.metric-value.success {
  color: #7AC943;
}

.metric-value.warning {
  color: #f59e0b;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Activity Section */
.activity-section, .maintenance-section {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0B2B3C;
  margin: 0;
}

.view-all-btn {
  color: #7AC943 !important;
  font-weight: 600 !important;
}

.activity-feed {
  background: #FFFFFF;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s ease;
}

.activity-item:hover {
  background: #f8fafc;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.activity-icon.info {
  background: #dbeafe;
  color: #2563eb;
}

.activity-icon.success {
  background: #d1fae5;
  color: #7AC943;
}

.activity-icon.warning {
  background: #fef3c7;
  color: #f59e0b;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-message {
  font-size: 0.875rem;
  color: #0B2B3C;
  margin: 0 0 0.25rem 0;
  font-weight: 500;
}

.activity-time {
  font-size: 0.75rem;
  color: #64748b;
}

/* Maintenance Section */
.maintenance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.maintenance-card {
  background: #FFFFFF;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.maintenance-card:hover {
  border-color: #7AC943;
  box-shadow: 0 4px 6px rgba(122, 201, 67, 0.1);
}

.maintenance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.equipment-name {
  font-weight: 600;
  color: #0B2B3C;
}

.maintenance-type {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.maintenance-type.preventive {
  background: #dbeafe;
  color: #2563eb;
}

.maintenance-type.corrective {
  background: #fef3c7;
  color: #f59e0b;
}

.maintenance-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.info-item i {
  width: 16px;
  color: #7AC943;
}

/* Error State */
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0B2B3C;
  margin: 0 0 0.5rem 0;
}

.error-content p {
  color: #64748b;
  margin: 0 0 1.5rem 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .dashboard-content {
    padding: 1.5rem;
  }

  .kpi-grid, .stats-grid, .maintenance-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .dashboard-header, .dashboard-content {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .kpi-card, .module-card, .maintenance-card {
    padding: 1rem;
  }

  .card-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
