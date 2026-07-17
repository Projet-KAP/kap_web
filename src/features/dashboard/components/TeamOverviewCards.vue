<template>
  <div class="team-overview-cards">
    <div class="cards-grid">
      <!-- Total Teams Card -->
      <Card class="overview-card teams-card">
        <template #content>
          <div class="card-content">
            <div class="card-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="card-info">
              <div class="card-value">{{ totalTeams }}</div>
              <div class="card-label">Équipes Actives</div>
              <div class="card-trend" :class="teamsTrendClass">
                <i :class="teamsTrendIcon"></i>
                <span>{{ teamsTrend }}% ce mois</span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Average Performance Card -->
      <Card class="overview-card performance-card">
        <template #content>
          <div class="card-content">
            <div class="card-icon">
              <i class="pi pi-chart-line"></i>
            </div>
            <div class="card-info">
              <div class="card-value">{{ averagePerformance }}%</div>
              <div class="card-label">Performance Moyenne</div>
              <div class="card-trend" :class="performanceTrendClass">
                <i :class="performanceTrendIcon"></i>
                <span>{{ performanceTrend }}% ce mois</span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Active KPIs Card -->
      <Card class="overview-card kpis-card">
        <template #content>
          <div class="card-content">
            <div class="card-icon">
              <i class="pi pi-chart-bar"></i>
            </div>
            <div class="card-info">
              <div class="card-value">{{ activeKPIs }}</div>
              <div class="card-label">KPIs Actifs</div>
              <div class="card-trend" :class="kpisTrendClass">
                <i :class="kpisTrendIcon"></i>
                <span>{{ kpisTrend }}% ce mois</span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Completed Objectives Card -->
      <Card class="overview-card objectives-card">
        <template #content>
          <div class="card-content">
            <div class="card-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="card-info">
              <div class="card-value">{{ completedObjectives }}%</div>
              <div class="card-label">Objectifs Atteints</div>
              <div class="card-trend" :class="objectivesTrendClass">
                <i :class="objectivesTrendIcon"></i>
                <span>{{ objectivesTrend }}% ce mois</span>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <div class="actions-header">
        <h4>Actions Rapides</h4>
      </div>
      <div class="actions-grid">
        <Button
          label="Nouvelle Équipe"
          icon="pi pi-plus"
          @click="$emit('create-team')"
          class="action-btn primary-action"
        />
        <Button
          label="Évaluation KPI"
          icon="pi pi-chart-bar"
          @click="$emit('evaluate-kpis')"
          class="action-btn secondary-action"
          outlined
        />
        <Button
          label="Voir Médiathèque"
          icon="pi pi-images"
          @click="$emit('view-media')"
          class="action-btn secondary-action"
          outlined
        />
      </div>
    </div>

    <!-- Recent Activities -->
    <div class="recent-activities">
      <div class="activities-header">
        <h4>Activités Récentes</h4>
        <Button 
          label="Voir tout" 
          @click="$emit('view-all-activities')"
          text
          size="small"
        />
      </div>
      <div v-if="recentActivities.length > 0" class="activities-list">
        <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
          <div class="activity-icon" :class="activity.iconClass">
            <i :class="activity.icon"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-description">{{ activity.description }}</div>
            <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
          </div>
          <div class="activity-status">
            <Tag :value="activity.status" :severity="getStatusSeverity(activity.status)" />
          </div>
        </div>
      </div>
      <div v-else class="empty-activities">
        <p>Aucune activité récente</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Props
const props = defineProps({
  teams: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'create-team',
  'generate-report', 
  'evaluate-kpis',
  'view-media',
  'view-all-activities'
])

// Refs
const recentActivities = ref([])

// Mock data for demonstration
const mockStats = {
  totalTeams: 8,
  teamsTrend: 12,
  averagePerformance: 87,
  performanceTrend: 5,
  activeKPIs: 24,
  kpisTrend: -2,
  completedObjectives: 78,
  objectivesTrend: 15
}

// Computed
const totalTeams = computed(() => props.teams.length || mockStats.totalTeams)

const averagePerformance = computed(() => {
  if (props.teams.length === 0) return mockStats.averagePerformance
  const total = props.teams.reduce((sum, team) => sum + (team.performance_score || 75), 0)
  return Math.round(total / props.teams.length)
})

const activeKPIs = computed(() => mockStats.activeKPIs)
const completedObjectives = computed(() => mockStats.completedObjectives)

// Trends
const teamsTrend = computed(() => mockStats.teamsTrend)
const performanceTrend = computed(() => mockStats.performanceTrend)
const kpisTrend = computed(() => mockStats.kpisTrend)
const objectivesTrend = computed(() => mockStats.objectivesTrend)

// Trend classes and icons
const teamsTrendClass = computed(() => getTrendClass(teamsTrend.value))
const performanceTrendClass = computed(() => getTrendClass(performanceTrend.value))
const kpisTrendClass = computed(() => getTrendClass(kpisTrend.value))
const objectivesTrendClass = computed(() => getTrendClass(objectivesTrend.value))

const teamsTrendIcon = computed(() => getTrendIcon(teamsTrend.value))
const performanceTrendIcon = computed(() => getTrendIcon(performanceTrend.value))
const kpisTrendIcon = computed(() => getTrendIcon(kpisTrend.value))
const objectivesTrendIcon = computed(() => getTrendIcon(objectivesTrend.value))

// Methods
const getTrendClass = (trend) => {
  if (trend > 0) return 'trend-positive'
  if (trend < 0) return 'trend-negative'
  return 'trend-neutral'
}

const getTrendIcon = (trend) => {
  if (trend > 0) return 'pi pi-arrow-up'
  if (trend < 0) return 'pi pi-arrow-down'
  return 'pi pi-minus'
}

const getStatusSeverity = (status) => {
  const severityMap = {
    'Terminé': 'success',
    'En cours': 'info',
    'En attente': 'warning',
    'Échoué': 'danger'
  }
  return severityMap[status] || 'secondary'
}

const formatTime = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInMinutes = Math.floor((now - time) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'À l\'instant'
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
  if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`
  return time.toLocaleDateString('fr-FR')
}

const loadRecentActivities = async () => {
  try {
    const response = await fetch('/api/v1/dashboard/activities/?limit=10', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      recentActivities.value = data.results || []
    } else {
      recentActivities.value = []
    }
  } catch (error) {
    console.error('Erreur lors du chargement des activités:', error)
    recentActivities.value = []
  }
}

// Lifecycle
onMounted(() => {
  loadRecentActivities()
})
</script>

<style scoped>
.team-overview-cards {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.overview-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.teams-card {
  background: #ffffff;
  color: #2563eb;
  border: 2px solid #e2e8f0;
}

.performance-card {
  background: #ffffff;
  color: #3b82f6;
  border: 2px solid #e2e8f0;
}

.kpis-card {
  background: #ffffff;
  color: #0ea5e9;
  border: 2px solid #e2e8f0;
}

.objectives-card {
  background: #ffffff;
  color: #059669;
  border: 2px solid #e2e8f0;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
}

.card-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  font-size: 1.75rem;
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.card-label {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 0.75rem;
}

.card-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  opacity: 0.9;
}

.trend-positive {
  color: rgba(255, 255, 255, 0.9);
}

.trend-negative {
  color: rgba(255, 255, 255, 0.9);
}

.trend-neutral {
  color: rgba(255, 255, 255, 0.9);
}

.quick-actions {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
}

.actions-header {
  margin-bottom: 1rem;
}

.actions-header h4 {
  margin: 0;
  color: #1e293b;
  font-weight: 600;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
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

.recent-activities {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
}

.activities-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.activities-header h4 {
  margin: 0;
  color: #1e293b;
  font-weight: 600;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.activity-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.activity-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: white;
}

.icon-success {
  background: #10b981;
}

.icon-info {
  background: #3b82f6;
}

.icon-warning {
  background: #f59e0b;
}

.icon-danger {
  background: #ef4444;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.activity-description {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.activity-time {
  color: #94a3b8;
  font-size: 0.75rem;
}

.activity-status {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .activities-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .activity-content {
    width: 100%;
  }
  
  .card-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .card-value {
    font-size: 2rem;
  }
}
</style>
