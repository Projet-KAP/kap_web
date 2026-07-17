<template>
  <div class="recent-activities">
    <div v-if="loading" class="loading-state">
      <ProgressSpinner style="width:24px;height:24px" strokeWidth="4" />
      <span>Chargement des activités...</span>
    </div>
    
    <div v-else-if="activities && activities.length > 0" class="activities-list">
      <div 
        v-for="activity in displayedActivities" 
        :key="activity.id"
        class="activity-item"
        :class="activity.severity"
      >
        <div class="activity-icon">
          <i :class="getActivityIcon(activity.type, activity.severity)"></i>
        </div>
        <div class="activity-content">
          <div class="activity-message">{{ activity.message }}</div>
          <div class="activity-meta">
            <span class="activity-module">{{ getModuleName(activity.module) }}</span>
            <span class="activity-location" v-if="activity.location">{{ activity.location }}</span>
            <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
          </div>
        </div>
        <div v-if="activity.actionable" class="activity-action">
          <Button 
            icon="pi pi-arrow-right"
            text
            rounded
            size="small"
            @click="handleActivityAction(activity)"
          />
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <i class="pi pi-info-circle"></i>
      <p>Aucune activité récente</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

// Props
const props = defineProps({
  activities: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  },
  maxItems: {
    type: Number,
    default: 5
  }
})

// Composables
const router = useRouter()

// Computed
const displayedActivities = computed(() => {
  return props.activities.slice(0, props.maxItems)
})

// Methods
const getActivityIcon = (type, severity) => {
  const icons = {
    collect: 'pi pi-database',
    alert: 'pi pi-exclamation-triangle',
    maintenance: 'pi pi-wrench',
    production: 'pi pi-cog',
    quality: 'pi pi-check-circle'
  }
  
  if (severity === 'critical') return 'pi pi-times-circle'
  if (severity === 'warning') return 'pi pi-exclamation-triangle'
  
  return icons[type] || 'pi pi-info-circle'
}

const getModuleName = (moduleId) => {
  const modules = {
    collect: 'KAP Collect',
    mes: 'KAP MES',
    engins: 'KAP Engins'
  }
  return modules[moduleId] || moduleId
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffMins = Math.floor((now - date) / 60000)
  
  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Il y a ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `Il y a ${diffDays}j`
}

const handleActivityAction = (activity) => {
  // Rediriger vers la page appropriée selon le type d'activité
  switch (activity.type) {
    case 'collect':
      if (activity.collectId) {
        router.push(`/user/collect/${activity.collectId}`)
      } else {
        router.push('/user/collect')
      }
      break
    case 'alert':
      router.push('/mes?view=alerts')
      break
    case 'maintenance':
      router.push('/engins?view=maintenance')
      break
    default:
  }
}
</script>

<style scoped>
.recent-activities {
  width: 100%;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.activity-item:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.activity-item.success {
  border-left: 4px solid #10b981;
}

.activity-item.warning {
  border-left: 4px solid #f59e0b;
}

.activity-item.info {
  border-left: 4px solid #3b82f6;
}

.activity-item.critical {
  border-left: 4px solid #ef4444;
}

.activity-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
}

.activity-item.success .activity-icon {
  background: #10b981;
}

.activity-item.warning .activity-icon {
  background: #f59e0b;
}

.activity-item.info .activity-icon {
  background: #3b82f6;
}

.activity-item.critical .activity-icon {
  background: #ef4444;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-message {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.activity-module {
  font-weight: 500;
  color: #374151;
}

.activity-location::before {
  content: '•';
  margin-right: 0.5rem;
}

.activity-time::before {
  content: '•';
  margin-right: 0.5rem;
}

.activity-action {
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #6b7280;
  text-align: center;
}

.empty-state i {
  font-size: 1.5rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .activity-item {
    padding: 0.75rem;
  }
  
  .activity-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .activity-location::before,
  .activity-time::before {
    display: none;
  }
}
</style>