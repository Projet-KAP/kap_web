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
  labels: {
    type: Array,
    required: true
  },
  values: {
    type: Array,
    required: true
  },
  measure: {
    type: Array,
    default: null
  },
  height: {
    type: String,
    default: '400px'
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  orientation: {
    type: String,
    default: 'v',
    validator: (v) => ['h', 'v'].includes(v)
  },
  colors: {
    type: Object,
    default: () => ({
      increasing: '#10b981',
      decreasing: '#ef4444',
      total: '#3b82f6'
    })
  }
})

defineEmits(['click'])

const computedMeasure = computed(() => {
  if (props.measure) return props.measure
  return props.values.map((v, i) => {
    if (i === 0 || i === props.values.length - 1) return 'absolute'
    return 'relative'
  })
})

const chartData = computed(() => [{
  type: 'waterfall',
  orientation: props.orientation,
  x: props.orientation === 'v' ? props.labels : props.values,
  y: props.orientation === 'v' ? props.values : props.labels,
  measure: computedMeasure.value,
  textposition: 'none',
  connector: {
    line: { color: '#9ca3af', width: 1, dash: 'dot' }
  },
  increasing: { marker: { color: props.colors.increasing } },
  decreasing: { marker: { color: props.colors.decreasing } },
  totals: { marker: { color: props.colors.total } },
  hovertemplate: '<b>%{x}</b><br>Valeur: %{y:,.0f}<extra></extra>'
}])

const chartLayout = computed(() => ({
  xaxis: {
    tickangle: props.orientation === 'v' ? -45 : 0,
    tickfont: { size: 11 }
  },
  yaxis: {
    tickfont: { size: 11 },
    tickformat: ',.0f'
  },
  margin: { l: 80, r: 30, t: 30, b: 100 },
  showlegend: false
}))
</script>
