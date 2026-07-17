<template>
  <div class="kpi-grid">
    <Card
      v-for="(tag, index) in displayTags"
      :key="tag.tag_name"
      :class="['kpi-card', getCardClass(index)]"
    >
      <template #content>
        <div class="kpi-content">
          <div class="kpi-icon" :style="{ background: getIconBg(index) }">
            <i :class="getKPIIcon(tag)" :style="{ color: getIconColor(index) }"></i>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">{{ tag.display_name || tag.tag_name }}</div>
            <div class="kpi-value">
              {{ formatValue(getAggValue(tag.tag_name, 'sum'), tag) }}
              <span v-if="tag.unit" class="kpi-unit">{{ tag.unit }}</span>
            </div>
            <div class="kpi-meta">
              <span v-if="getAggValue(tag.tag_name, 'avg')">
                Moy: {{ formatValue(getAggValue(tag.tag_name, 'avg'), tag) }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Placeholder si pas de KPIs -->
    <div v-if="displayTags.length === 0" class="no-kpis">
      <i class="pi pi-info-circle"></i>
      <p>Aucun indicateur numerique disponible</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  aggregations: {
    type: Object,
    default: () => ({})
  },
  maxCards: {
    type: Number,
    default: 4
  }
})

// Filtrer les tags numeriques et limiter
const displayTags = computed(() => {
  return props.tags
    .filter(tag => ['NUMBER', 'DECIMAL', 'PERCENTAGE'].includes(tag.data_type))
    .slice(0, props.maxCards)
})

const getAggValue = (tagName, metric) => {
  return props.aggregations[tagName]?.[metric] || 0
}

const formatValue = (value, tag) => {
  if (value === null || value === undefined) return '0'

  // Format selon le type de donnee
  if (tag.data_type === 'PERCENTAGE') {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value) + '%'
  }

  // Format nombre avec separateur de milliers
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

const getKPIIcon = (tag) => {
  const tagName = tag.tag_name?.toLowerCase() || ''

  if (tagName.includes('volume')) return 'pi pi-chart-bar'
  if (tagName.includes('montant') || tagName.includes('cout')) return 'pi pi-euro'
  if (tagName.includes('heure') || tagName.includes('temps')) return 'pi pi-clock'
  if (tagName.includes('quantite') || tagName.includes('qty')) return 'pi pi-box'
  if (tagName.includes('taux') || tagName.includes('pourcentage')) return 'pi pi-percentage'
  if (tagName.includes('resistance')) return 'pi pi-check-circle'
  if (tagName.includes('distance')) return 'pi pi-map'

  return 'pi pi-chart-line'
}

const cardClasses = ['primary', 'success', 'warning', 'info']
const getCardClass = (index) => cardClasses[index % cardClasses.length]

const cardColors = {
  primary: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' },
  success: { bg: 'rgba(122, 201, 67, 0.15)', color: '#7AC943' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' },
  info: { bg: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }
}

const getIconBg = (index) => cardColors[cardClasses[index % cardClasses.length]].bg
const getIconColor = (index) => cardColors[cardClasses[index % cardClasses.length]].color
</script>

<style scoped lang="scss">
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  border-left: 4px solid var(--primary-color);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.primary {
    border-left-color: #3B82F6;
  }

  &.success {
    border-left-color: #7AC943;
  }

  &.warning {
    border-left-color: #F59E0B;
  }

  &.info {
    border-left-color: #6366F1;
  }
}

.kpi-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 1.5rem;
  }
}

.kpi-info {
  flex: 1;
  min-width: 0;

  .kpi-label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .kpi-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
    line-height: 1.2;

    .kpi-unit {
      font-size: 0.875rem;
      font-weight: 400;
      color: var(--text-color-secondary);
      margin-left: 0.25rem;
    }
  }

  .kpi-meta {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    margin-top: 0.25rem;
  }
}

.no-kpis {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--surface-ground);
  border-radius: 12px;
  color: var(--text-color-secondary);

  i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  p {
    margin: 0;
  }
}
</style>
