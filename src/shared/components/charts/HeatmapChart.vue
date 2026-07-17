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
  xLabels: {
    type: Array,
    required: true
  },
  yLabels: {
    type: Array,
    required: true
  },
  values: {
    type: Array,
    required: true
  },
  colorscale: {
    type: String,
    default: 'Blues'
  },
  showScale: {
    type: Boolean,
    default: true
  },
  height: {
    type: String,
    default: '400px'
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  hovertemplate: {
    type: String,
    default: '%{x}<br>%{y}<br>Valeur: %{z}<extra></extra>'
  }
})

defineEmits(['click', 'hover'])

const chartData = computed(() => [{
  type: 'heatmap',
  x: props.xLabels,
  y: props.yLabels,
  z: props.values,
  colorscale: props.colorscale,
  showscale: props.showScale,
  hoverongaps: false,
  hovertemplate: props.hovertemplate,
  colorbar: {
    title: '',
    tickfont: { size: 11 },
    thickness: 15,
    len: 0.9
  }
}])

const chartLayout = computed(() => ({
  xaxis: {
    side: 'bottom',
    tickangle: -45,
    tickfont: { size: 11 }
  },
  yaxis: {
    tickfont: { size: 11 }
  },
  margin: { l: 100, r: 50, t: 30, b: 80 }
}))
</script>
