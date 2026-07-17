<template>
  <Card class="ai-insight-card" :class="[insight.severity.toLowerCase(), insight.status.toLowerCase()]">
    <template #header>
      <div class="insight-header">
        <div class="insight-type">
          <i :class="typeIcon"></i>
          <span>{{ insight.insight_type_display }}</span>
        </div>
        <Tag :severity="severityColor" :value="insight.severity_display" />
      </div>
    </template>

    <template #content>
      <h4 class="insight-title">{{ insight.title }}</h4>
      <p class="insight-description">{{ insight.description }}</p>

      <!-- Actions recommandées -->
      <div v-if="insight.recommended_actions?.length" class="recommended-actions">
        <h5>Actions recommandées:</h5>
        <ul>
          <li v-for="(action, idx) in insight.recommended_actions.slice(0, 3)" :key="idx">
            {{ action }}
          </li>
        </ul>
      </div>

      <!-- Métadonnées -->
      <div class="insight-meta">
        <div class="meta-item">
          <i class="pi pi-tag"></i>
          <span>{{ insight.category_display }}</span>
        </div>
        <div class="meta-item">
          <i class="pi pi-clock"></i>
          <span>{{ formatDate(insight.created_at) }}</span>
        </div>
        <div v-if="insight.confidence_score" class="meta-item">
          <i class="pi pi-chart-line"></i>
          <span>Confiance: {{ Math.round(insight.confidence_score * 100) }}%</span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="insight-actions">
        <Button
          v-if="insight.status === 'NEW'"
          label="Marquer comme lu"
          icon="pi pi-check"
          text
          size="small"
          @click="markRead"
        />
        <Button
          v-if="insight.status !== 'DISMISSED'"
          label="Ignorer"
          icon="pi pi-times"
          text
          size="small"
          severity="secondary"
          @click="dismiss"
        />
        <Button
          label="Détails"
          icon="pi pi-external-link"
          text
          size="small"
          @click="$emit('view-details', insight)"
        />
      </div>
    </template>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { useAIStore } from '../stores/aiStore'

const props = defineProps({
  insight: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['view-details', 'updated'])

const aiStore = useAIStore()

// Computed
const typeIcon = computed(() => {
  const icons = {
    'ANOMALY': 'pi pi-exclamation-triangle',
    'TREND': 'pi pi-chart-line',
    'PREDICTION': 'pi pi-eye',
    'RECOMMENDATION': 'pi pi-lightbulb',
    'ALERT': 'pi pi-bell',
    'OPTIMIZATION': 'pi pi-bolt'
  }
  return icons[props.insight.insight_type] || 'pi pi-info-circle'
})

const severityColor = computed(() => {
  const colors = {
    'CRITICAL': 'danger',
    'HIGH': 'warn',
    'MEDIUM': 'info',
    'LOW': 'secondary',
    'INFO': 'info'
  }
  return colors[props.insight.severity] || 'info'
})

// Methods
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const markRead = async () => {
  try {
    await aiStore.markInsightRead(props.insight.id)
    emit('updated')
  } catch (err) {
    console.error('Erreur:', err)
  }
}

const dismiss = async () => {
  try {
    await aiStore.updateInsightStatus(props.insight.id, 'DISMISSED')
    emit('updated')
  } catch (err) {
    console.error('Erreur:', err)
  }
}
</script>

<style scoped lang="scss">
.ai-insight-card {
  border-left: 4px solid var(--surface-border);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.critical {
    border-left-color: var(--red-500);
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%);
  }

  &.high {
    border-left-color: var(--orange-500);
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%);
  }

  &.medium {
    border-left-color: var(--blue-500);
  }

  &.low, &.info {
    border-left-color: var(--surface-400);
  }

  &.read, &.acknowledged {
    opacity: 0.8;
  }

  &.dismissed {
    opacity: 0.5;
  }
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--surface-50);
  border-bottom: 1px solid var(--surface-border);

  .insight-type {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);

    i {
      font-size: 1rem;
    }
  }
}

:deep(.p-card-content) {
  padding: 1rem !important;
}

.insight-title {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.insight-description {
  margin: 0 0 1rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

.recommended-actions {
  background: var(--surface-100);
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;

  h5 {
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color);
  }

  ul {
    margin: 0;
    padding-left: 1.25rem;

    li {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      padding: 0.125rem 0;
    }
  }
}

.insight-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: var(--text-color-secondary);

    i {
      font-size: 0.875rem;
    }
  }
}

.insight-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}
</style>
