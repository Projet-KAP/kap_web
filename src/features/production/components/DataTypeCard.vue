<template>
  <div
    class="data-type-card"
    :style="{ '--type-color': color }"
    @click="$emit('click', type)"
  >
    <div class="card-icon">
      <i :class="icon"></i>
    </div>

    <div class="card-content">
      <h3 class="card-title">{{ type.display_name || type.tag_type }}</h3>

      <div class="card-stats">
        <div class="stat">
          <span class="stat-value">{{ type.data_count || 0 }}</span>
          <span class="stat-label">données</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ type.tags?.length || 0 }}</span>
          <span class="stat-label">indicateurs</span>
        </div>
      </div>

      <div v-if="type.last_import" class="card-meta">
        <i class="pi pi-clock"></i>
        <span>{{ formatDate(type.last_import) }}</span>
      </div>
    </div>

    <div class="card-arrow">
      <i class="pi pi-chevron-right"></i>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProductionStore } from '../stores/productionStore'

const props = defineProps({
  type: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

const productionStore = useProductionStore()

const icon = computed(() => productionStore.getTypeIcon(props.type.tag_type))
const color = computed(() => productionStore.getTypeColor(props.type.tag_type))

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short'
    }).format(date)
  } catch {
    return dateString
  }
}
</script>

<style scoped lang="scss">
.data-type-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  border-left: 4px solid var(--type-color, var(--primary-color));
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--type-color, var(--primary-color));
  }

  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--type-color) 15%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      font-size: 1.5rem;
      color: var(--type-color);
    }
  }

  .card-content {
    flex: 1;
    min-width: 0;

    .card-title {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 0.5rem;

      .stat {
        display: flex;
        align-items: baseline;
        gap: 0.25rem;

        .stat-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-color);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-color-secondary);
        }
      }
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary);

      i {
        font-size: 0.75rem;
      }
    }
  }

  .card-arrow {
    color: var(--text-color-secondary);
    transition: transform 0.2s ease;

    i {
      font-size: 1rem;
    }
  }

  &:hover .card-arrow {
    transform: translateX(4px);
    color: var(--type-color);
  }
}
</style>
