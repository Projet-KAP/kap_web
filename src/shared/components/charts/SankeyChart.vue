<template>
  <PlotlyChart
    :title="title"
    :subtitle="subtitle"
    :data="chartData"
    :layout="chartLayout"
    :height="height"
    :showHeader="showHeader"
    @click="$emit('click', $event)"
  >
    <template #controls v-if="$slots.controls">
      <slot name="controls"></slot>
    </template>
    <template #footer v-if="$slots.footer">
      <slot name="footer"></slot>
    </template>
  </PlotlyChart>
</template>

<script setup>
import { computed } from 'vue'
import PlotlyChart from './PlotlyChart.vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  nodes: {
    type: Object,
    required: true
  },
  links: {
    type: Object,
    required: true
  },
  height: {
    type: String,
    default: '500px'
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  orientation: {
    type: String,
    default: 'h',
    validator: (v) => ['h', 'v'].includes(v)
  }
})

defineEmits(['click'])

const defaultNodeColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

const chartData = computed(() => [{
  type: 'sankey',
  orientation: props.orientation,
  node: {
    pad: 15,
    thickness: 20,
    line: { color: '#fff', width: 0.5 },
    label: props.nodes.label || [],
    color: props.nodes.color || defaultNodeColors.slice(0, props.nodes.label?.length || 0),
    hovertemplate: '<b>%{label}</b><br>Total: %{value:,.0f}<extra></extra>'
  },
  link: {
    source: props.links.source || [],
    target: props.links.target || [],
    value: props.links.value || [],
    color: props.links.color || 'rgba(59, 130, 246, 0.3)',
    hovertemplate: '%{source.label} → %{target.label}<br>Valeur: %{value:,.0f}<extra></extra>'
  }
}])

const chartLayout = computed(() => ({
  margin: { l: 20, r: 20, t: 30, b: 20 },
  font: { size: 12 }
}))
</script>
