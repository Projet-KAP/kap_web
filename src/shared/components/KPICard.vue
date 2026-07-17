<template>
  <Card :class="['kpi-card', variant, { 'has-gradient': gradient }]">
    <template #content>
      <div class="card-content">
        <div class="card-icon" :style="iconStyle">
          <i :class="icon"></i>
        </div>
        <div class="card-info">
          <p class="card-title">{{ title }}</p>
          <h3>{{ formattedValue }}</h3>
          <div class="card-meta" v-if="$slots.meta || meta">
            <slot name="meta">
              <span v-if="meta">{{ meta }}</span>
            </slot>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { colors, colorUtils } from '@/shared/utils/colors.js'

// Props
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'info', 'secondary', 'neutral'].includes(value)
  },
  gradient: {
    type: Boolean,
    default: true
  },
  format: {
    type: String,
    default: 'number', // 'number', 'percentage', 'currency'
  },
  meta: {
    type: String,
    default: null
  }
})

// Computed
const formattedValue = computed(() => {
  const value = props.value
  
  switch (props.format) {
    case 'percentage':
      return `${value}%`
    case 'currency':
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(value)
    default:
      return typeof value === 'number' ? value.toLocaleString('fr-FR') : value
  }
})

const iconStyle = computed(() => {
  if (!props.gradient) return {}
  
  return {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)'
  }
})
</script>

<style scoped>
.kpi-card {
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
  color: white;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.kpi-card.primary.has-gradient {
  background: #3b82f6;
}

.kpi-card.success.has-gradient {
  background: #7AC943;
}

.kpi-card.warning.has-gradient {
  background: #f59e0b;
}

.kpi-card.info.has-gradient {
  background: #0ea5e9;
}

.kpi-card.secondary.has-gradient {
  background: #64748b;
}

.kpi-card.neutral.has-gradient {
  background: #ffffff;
  color: #2563eb;
  border: 2px solid #e2e8f0;
}

.kpi-card:not(.has-gradient) {
  background: white;
  color: #1f2937;
  border: 1px solid #e2e8f0;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.kpi-card:not(.has-gradient) .card-icon {
  background: #f8fafc;
  color: v-bind('colors.primary');
}

.card-icon i {
  font-size: 1.25rem;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 0.75rem;
  margin: 0 0 0.25rem 0;
  opacity: 0.8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-card:not(.has-gradient) .card-title {
  color: #6b7280;
  opacity: 1;
}

.card-info h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  line-height: 1;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.8;
}

.kpi-card:not(.has-gradient) .card-meta {
  color: #6b7280;
  opacity: 1;
}

@media (max-width: 768px) {
  .card-content {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .card-icon {
    width: 40px;
    height: 40px;
  }

  .card-icon i {
    font-size: 1rem;
  }

  .card-info h3 {
    font-size: 1.25rem;
  }
}
</style>
