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
  value: {
    type: Number,
    required: true
  },
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  suffix: {
    type: String,
    default: '%'
  },
  height: {
    type: String,
    default: '300px'
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  thresholds: {
    type: Object,
    default: () => ({
      danger: 30,
      warning: 60,
      success: 80
    })
  },
  colors: {
    type: Object,
    default: () => ({
      danger: '#ef4444',
      warning: '#f59e0b',
      success: '#22c55e',
      excellent: '#10b981'
    })
  }
})

defineEmits(['click'])

const getGaugeColor = (value) => {
  if (value < props.thresholds.danger) return props.colors.danger
  if (value < props.thresholds.warning) return props.colors.warning
  if (value < props.thresholds.success) return props.colors.success
  return props.colors.excellent
}

const chartData = computed(() => [{
  type: 'indicator',
  mode: 'gauge+number',
  value: props.value,
  number: {
    suffix: props.suffix,
    font: { size: 32, color: '#1f2937' }
  },
  gauge: {
    axis: {
      range: [props.min, props.max],
      tickwidth: 1,
      tickcolor: '#9ca3af',
      tickfont: { size: 12 }
    },
    bar: { color: getGaugeColor(props.value), thickness: 0.8 },
    bgcolor: '#f3f4f6',
    borderwidth: 0,
    steps: [
      { range: [props.min, props.thresholds.danger], color: '#fef2f2' },
      { range: [props.thresholds.danger, props.thresholds.warning], color: '#fffbeb' },
      { range: [props.thresholds.warning, props.thresholds.success], color: '#f0fdf4' },
      { range: [props.thresholds.success, props.max], color: '#ecfdf5' }
    ],
    threshold: {
      line: { color: '#1f2937', width: 4 },
      thickness: 0.75,
      value: props.value
    }
  }
}])

const chartLayout = computed(() => ({
  margin: { l: 30, r: 30, t: 30, b: 10 }
}))
</script>
