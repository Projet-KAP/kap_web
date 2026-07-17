<template>
  <PlotlyChart
    :title="title"
    :subtitle="subtitle"
    :data="chartData"
    :layout="chartLayout"
    :height="height"
    :showHeader="showHeader"
    @click="$emit('click', $event)"
    @hover="$emit('hover', $event)"
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
  stacked: {
    type: Boolean,
    default: false
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
  }
})

defineEmits(['click', 'hover'])

const defaultColors = [
  'rgba(59, 130, 246, 0.6)',
  'rgba(16, 185, 129, 0.6)',
  'rgba(245, 158, 11, 0.6)',
  'rgba(239, 68, 68, 0.6)',
  'rgba(139, 92, 246, 0.6)'
]

const chartData = computed(() => {
  return props.datasets.map((dataset, index) => ({
    type: 'scatter',
    mode: 'lines',
    name: dataset.label,
    x: props.labels,
    y: dataset.data,
    fill: index === 0 ? 'tozeroy' : 'tonexty',
    fillcolor: dataset.color || defaultColors[index % defaultColors.length],
    line: {
      color: dataset.borderColor || defaultColors[index % defaultColors.length].replace('0.6', '1'),
      width: 2
    },
    stackgroup: props.stacked ? 'one' : undefined,
    hovertemplate: `<b>${dataset.label}</b><br>%{x}<br>Valeur: %{y:,.0f}<extra></extra>`
  }))
})

const chartLayout = computed(() => ({
  xaxis: {
    tickangle: -45,
    tickfont: { size: 11 },
    showgrid: false
  },
  yaxis: {
    tickfont: { size: 11 },
    tickformat: ',.0f',
    gridcolor: '#f3f4f6'
  },
  margin: { l: 60, r: 30, t: 30, b: 80 },
  showlegend: props.showLegend,
  legend: {
    orientation: 'h',
    y: -0.2,
    x: 0.5,
    xanchor: 'center'
  },
  hovermode: 'x unified'
}))
</script>
