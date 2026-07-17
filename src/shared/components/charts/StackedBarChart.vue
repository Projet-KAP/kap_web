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
  datasets: {
    type: Array,
    required: true
  },
  orientation: {
    type: String,
    default: 'v',
    validator: (v) => ['h', 'v'].includes(v)
  },
  height: {
    type: String,
    default: '400px'
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  percentMode: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const defaultColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

const chartData = computed(() => {
  return props.datasets.map((dataset, index) => ({
    type: 'bar',
    name: dataset.label,
    x: props.orientation === 'v' ? props.labels : dataset.data,
    y: props.orientation === 'v' ? dataset.data : props.labels,
    orientation: props.orientation,
    marker: {
      color: dataset.color || defaultColors[index % defaultColors.length],
      line: { width: 0 }
    },
    textposition: 'none',
    hovertemplate: `<b>${dataset.label}</b><br>%{${props.orientation === 'v' ? 'x' : 'y'}}<br>Valeur: %{${props.orientation === 'v' ? 'y' : 'x'}:,.0f}<extra></extra>`
  }))
})

const chartLayout = computed(() => ({
  barmode: props.percentMode ? 'relative' : 'stack',
  barnorm: props.percentMode ? 'percent' : undefined,
  xaxis: {
    tickangle: props.orientation === 'v' ? -45 : 0,
    tickfont: { size: 11 },
    tickformat: props.percentMode && props.orientation === 'h' ? '.0%' : ',.0f'
  },
  yaxis: {
    tickfont: { size: 11 },
    tickformat: props.percentMode && props.orientation === 'v' ? '.0%' : ',.0f'
  },
  margin: { l: props.orientation === 'h' ? 120 : 60, r: 30, t: 30, b: props.orientation === 'v' ? 100 : 50 },
  showlegend: props.showLegend,
  legend: {
    orientation: 'h',
    y: -0.25,
    x: 0.5,
    xanchor: 'center'
  }
}))
</script>
