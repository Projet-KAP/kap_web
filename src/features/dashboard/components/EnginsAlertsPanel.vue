<template>
  <Card class="alerts-panel-card">
    <template #header>
      <div class="alerts-header">
        <div class="header-content">
          <h3>Alertes Engins</h3>
          <p>Surveillance en temps réel</p>
        </div>
        <div class="header-stats">
          <Tag 
            v-if="criticalCount > 0"
            :value="`${criticalCount} critiques`" 
            severity="danger"
            class="alert-count critical"
          />
          <Tag 
            v-if="warningCount > 0"
            :value="`${warningCount} avertissements`" 
            severity="warning"
            class="alert-count warning"
          />
          <Tag 
            v-if="totalAlerts === 0"
            value="Aucune alerte" 
            severity="success"
            class="alert-count success"
          />
        </div>
      </div>
    </template>
    
    <template #content>
      <!-- Filtres -->
      <div class="alerts-filters">
        <div class="filter-group">
          <Select 
            v-model="selectedType" 
            :options="alertTypeOptions" 
            optionLabel="label"
            optionValue="value"
            placeholder="Type d'alerte"
            clearable
            class="filter-select"
          />
        </div>
        <div class="filter-group">
          <Select 
            v-model="selectedPriority" 
            :options="priorityOptions" 
            optionLabel="label"
            optionValue="value"
            placeholder="Priorité"
            clearable
            class="filter-select"
          />
        </div>
        <div class="filter-group">
          <Select 
            v-model="selectedEnginType" 
            :options="enginTypeOptions" 
            optionLabel="label"
            optionValue="value"
            placeholder="Type d'engin"
            clearable
            class="filter-select"
          />
        </div>
        <Button 
          icon="pi pi-filter-slash" 
          text 
          @click="clearFilters"
          v-tooltip="'Effacer les filtres'"
          class="clear-filters-btn"
        />
      </div>

      <!-- Liste des alertes -->
      <div class="alerts-list">
        <div v-if="filteredAlerts.length === 0" class="no-alerts">
          <i class="pi pi-check-circle"></i>
          <h4>Aucune alerte</h4>
          <p>Tous les engins fonctionnent normalement</p>
        </div>
        
        <div 
          v-for="alert in filteredAlerts" 
          :key="`${alert.enginId}-${alert.id}`"
          class="alert-item"
          :class="[`alert-${alert.type.toLowerCase()}`, `priority-${alert.priority.toLowerCase()}`]"
        >
          <div class="alert-icon">
            <i :class="getAlertIcon(alert.type)"></i>
          </div>
          
          <div class="alert-content">
            <div class="alert-header">
              <div class="alert-title">
                <h5>{{ alert.enginName }}</h5>
                <Tag 
                  :value="alert.type" 
                  :severity="getAlertSeverity(alert.type)"
                  class="alert-type-tag"
                />
              </div>
              <div class="alert-meta">
                <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
                <Tag 
                  :value="alert.priority" 
                  :severity="getPrioritySeverity(alert.priority)"
                  class="priority-tag"
                />
              </div>
            </div>
            
            <div class="alert-message">
              {{ alert.message }}
            </div>
            
            <div class="alert-actions">
              <Button 
                label="Voir Engin" 
                icon="pi pi-eye" 
                text 
                size="small"
                @click="$emit('view-engin', alert.enginId)"
                class="action-btn"
              />
              <Button 
                label="Marquer comme lu" 
                icon="pi pi-check" 
                text 
                size="small"
                @click="markAsRead(alert)"
                class="action-btn"
              />
              <Button 
                label="Ignorer" 
                icon="pi pi-times" 
                text 
                size="small"
                @click="dismissAlert(alert)"
                class="action-btn dismiss"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Résumé des alertes par engin -->
      <div class="alerts-summary">
        <div class="summary-header">
          <h4>Résumé par Engin</h4>
          <Button 
            icon="pi pi-refresh" 
            text 
            @click="$emit('refresh-alerts')"
            v-tooltip="'Actualiser les alertes'"
          />
        </div>
        
        <div class="summary-grid">
          <div 
            v-for="summary in enginsSummary" 
            :key="summary.enginId"
            class="summary-item"
            :class="{ 'has-critical': summary.critical > 0 }"
          >
            <div class="summary-engin">
              <i :class="getEnginIcon(summary.enginType)" class="engin-icon"></i>
              <div class="engin-info">
                <h6>{{ summary.enginName }}</h6>
                <span class="engin-type">{{ summary.enginType }}</span>
              </div>
            </div>
            
            <div class="summary-counts">
              <div v-if="summary.critical > 0" class="count-item critical">
                <span class="count">{{ summary.critical }}</span>
                <span class="label">Critiques</span>
              </div>
              <div v-if="summary.warning > 0" class="count-item warning">
                <span class="count">{{ summary.warning }}</span>
                <span class="label">Avertissements</span>
              </div>
              <div v-if="summary.info > 0" class="count-item info">
                <span class="count">{{ summary.info }}</span>
                <span class="label">Infos</span>
              </div>
              <div v-if="summary.total === 0" class="count-item success">
                <i class="pi pi-check"></i>
                <span class="label">OK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { colors } from '@/shared/utils/colors.js'

// Props
const props = defineProps({
  engins: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['view-engin', 'refresh-alerts', 'alert-dismissed', 'alert-read'])

// État réactif
const selectedType = ref(null)
const selectedPriority = ref(null)
const selectedEnginType = ref(null)

// Options
const alertTypeOptions = [
  { label: 'Critique', value: 'CRITICAL' },
  { label: 'Avertissement', value: 'WARNING' },
  { label: 'Information', value: 'INFO' }
]

const priorityOptions = [
  { label: 'Haute', value: 'HIGH' },
  { label: 'Moyenne', value: 'MEDIUM' },
  { label: 'Basse', value: 'LOW' }
]

const enginTypeOptions = [
  { label: 'Excavatrice', value: 'EXCAVATRICE' },
  { label: 'Bulldozer', value: 'BULLDOZER' },
  { label: 'Grue', value: 'GRUE' },
  { label: 'Compacteur', value: 'COMPACTEUR' }
]

// Computed
const allAlerts = computed(() => {
  if (!props.engins || !Array.isArray(props.engins)) return []

  return props.engins.flatMap(engin =>
    (engin.alerts || []).map(alert => ({
      ...alert,
      type: alert.severity || 'WARNING', // Mapper severity -> type
      priority: alert.severity === 'CRITICAL' ? 'HIGH' : alert.severity === 'WARNING' ? 'MEDIUM' : 'LOW', // Mapper severity -> priority
      enginId: engin.id,
      enginName: engin.name,
      enginType: engin.type
    }))
  ).sort((a, b) => {
    // Trier par priorité puis par timestamp
    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    return new Date(b.timestamp) - new Date(a.timestamp)
  })
})

const filteredAlerts = computed(() => {
  let alerts = allAlerts.value

  if (selectedType.value) {
    alerts = alerts.filter(alert => alert.type === selectedType.value)
  }

  if (selectedPriority.value) {
    alerts = alerts.filter(alert => alert.priority === selectedPriority.value)
  }

  if (selectedEnginType.value) {
    alerts = alerts.filter(alert => alert.enginType === selectedEnginType.value)
  }

  return alerts
})

const totalAlerts = computed(() => allAlerts.value.length)
const criticalCount = computed(() => allAlerts.value.filter(a => a.type === 'CRITICAL').length)
const warningCount = computed(() => allAlerts.value.filter(a => a.type === 'WARNING').length)

const enginsSummary = computed(() => {
  if (!props.engins || !Array.isArray(props.engins)) return []

  return props.engins.map(engin => {
    const alerts = engin.alerts || []
    return {
      enginId: engin.id,
      enginName: engin.name,
      enginType: engin.type,
      total: alerts.length,
      critical: alerts.filter(a => a.type === 'CRITICAL').length,
      warning: alerts.filter(a => a.type === 'WARNING').length,
      info: alerts.filter(a => a.type === 'INFO').length
    }
  })
})

// Methods
const getAlertIcon = (type) => {
  const icons = {
    'CRITICAL': 'pi pi-exclamation-triangle',
    'WARNING': 'pi pi-exclamation-circle',
    'INFO': 'pi pi-info-circle'
  }
  return icons[type] || 'pi pi-info-circle'
}

const getAlertSeverity = (type) => {
  const severities = {
    'CRITICAL': 'danger',
    'WARNING': 'warning',
    'INFO': 'info'
  }
  return severities[type] || 'info'
}

const getPrioritySeverity = (priority) => {
  const severities = {
    'HIGH': 'danger',
    'MEDIUM': 'warning',
    'LOW': 'info'
  }
  return severities[priority] || 'info'
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

const formatTime = (timestamp) => {
  const now = new Date()
  const alertTime = new Date(timestamp)
  const diffMs = now - alertTime
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins}min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return alertTime.toLocaleDateString('fr-FR')
}

const clearFilters = () => {
  selectedType.value = null
  selectedPriority.value = null
  selectedEnginType.value = null
}

const markAsRead = (alert) => {
  emit('alert-read', alert)
}

const dismissAlert = (alert) => {
  emit('alert-dismissed', alert)
}
</script>

<style scoped>
.alerts-panel-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.alerts-header {
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

.header-stats {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.alerts-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;
}

.filter-group {
  min-width: 150px;
}

.filter-select {
  width: 100%;
}

.clear-filters-btn {
  color: #6b7280;
}

.alerts-list {
  max-height: 500px;
  overflow-y: auto;
  padding: 1rem 1.5rem;
}

.no-alerts {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.no-alerts i {
  font-size: 3rem;
  color: v-bind('colors.status.success');
  margin-bottom: 1rem;
}

.no-alerts h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.no-alerts p {
  margin: 0;
}

.alert-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 4px solid transparent;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.alert-item:hover {
  background: #f1f5f9;
}

.alert-critical {
  border-left-color: v-bind('colors.status.error');
  background: #fef2f2;
}

.alert-warning {
  border-left-color: v-bind('colors.status.warning');
  background: #fffbeb;
}

.alert-info {
  border-left-color: v-bind('colors.status.info');
  background: #eff6ff;
}

.alert-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.alert-critical .alert-icon {
  background: #fee2e2;
  color: v-bind('colors.status.error');
}

.alert-warning .alert-icon {
  background: #fef3c7;
  color: v-bind('colors.status.warning');
}

.alert-info .alert-icon {
  background: #dbeafe;
  color: v-bind('colors.status.info');
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 1rem;
}

.alert-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-title h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.alert-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.alert-message {
  margin-bottom: 1rem;
  color: #374151;
  line-height: 1.5;
}

.alert-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  font-size: 0.875rem;
  color: v-bind('colors.primary');
}

.action-btn.dismiss {
  color: #6b7280;
}

.alerts-summary {
  border-top: 1px solid #f3f4f6;
  padding: 1.5rem;
  background: #f8fafc;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.summary-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.summary-item.has-critical {
  border-left: 4px solid v-bind('colors.status.error');
}

.summary-engin {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.engin-icon {
  font-size: 1.5rem;
  color: v-bind('colors.primary');
}

.engin-info h6 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.engin-type {
  font-size: 0.875rem;
  color: #6b7280;
}

.summary-counts {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.count-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.count-item.critical .count {
  color: v-bind('colors.status.error');
}

.count-item.warning .count {
  color: v-bind('colors.status.warning');
}

.count-item.info .count {
  color: v-bind('colors.status.info');
}

.count-item.success {
  color: v-bind('colors.status.success');
}

.count {
  font-size: 1.25rem;
  font-weight: 700;
}

.label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .alerts-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .alerts-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    min-width: auto;
  }
  
  .alert-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .alert-meta {
    justify-content: space-between;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .summary-counts {
    justify-content: space-around;
  }
}
</style>
