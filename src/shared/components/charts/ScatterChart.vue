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
  datasets: {
    type: Array,
    required: true
  },
  xAxisTitle: {
    type: String,
    default: ''
  },
  yAxisTitle: {
    type: String,
    default: ''
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
  showTrendline: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click', 'hover'])

const defaultColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

const chartData = computed(() => {
  const traces = []

  props.datasets.forEach((dataset, index) => {
    const color = dataset.color || defaultColors[index % defaultColors.length]

    traces.push({
      type: 'scatter',
      mode: dataset.mode || 'markers',
      name: dataset.label,
      x: dataset.x,
      y: dataset.y,
      text: dataset.text || undefined,
      marker: {
        color: color,
        size: dataset.markerSize || 10,
        opacity: 0.8,
        line: { color: '#fff', width: 1 }
      },
      hovertemplate: dataset.hovertemplate || `<b>${dataset.label}</b><br>X: %{x}<br>Y: %{y}<extra></extra>`
    })

    if (props.showTrendline && dataset.x.length > 1) {
      const { slope, intercept } = linearRegression(dataset.x, dataset.y)
      const minX = Math.min(...dataset.x)
      const maxX = Math.max(...dataset.x)

      traces.push({
        type: 'scatter',
        mode: 'lines',
        name: `Tendance ${dataset.label}`,
        x: [minX, maxX],
        y: [slope * minX + intercept, slope * maxX + intercept],
        line: {
          color: color,
          width: 2,
          dash: 'dash'
        },
        showlegend: false,
        hoverinfo: 'skip'
      })
    }
  })

  return traces
})

const linearRegression = (x, y) => {
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0)
  const sumXX = x.reduce((total, xi) => total + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

const chartLayout = computed(() => ({
  xaxis: {
    title: props.xAxisTitle,
    tickfont: { size: 11 },
    gridcolor: '#f3f4f6',
    zeroline: false
  },
  yaxis: {
    title: props.yAxisTitle,
    tickfont: { size: 11 },
    gridcolor: '#f3f4f6',
    zeroline: false
  },
  margin: { l: 60, r: 30, t: 30, b: 60 },
  showlegend: props.showLegend,
  legend: {
    orientation: 'h',
    y: -0.2,
    x: 0.5,
    xanchor: 'center'
  },
  hovermode: 'closest'
}))
</script>
