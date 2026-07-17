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
  target: {
    type: Number,
    required: true
  },
  ranges: {
    type: Array,
    default: () => [30, 70, 100]
  },
  rangeColors: {
    type: Array,
    default: () => ['#fef2f2', '#fffbeb', '#f0fdf4']
  },
  height: {
    type: String,
    default: '200px'
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  suffix: {
    type: String,
    default: '%'
  },
  barColor: {
    type: String,
    default: '#3b82f6'
  }
})

defineEmits(['click'])

const chartData = computed(() => [{
  type: 'indicator',
  mode: 'number+gauge+delta',
  value: props.value,
  delta: {
    reference: props.target,
    position: 'top',
    valueformat: '.0f',
    suffix: props.suffix
  },
  number: {
    suffix: props.suffix,
    font: { size: 24, color: '#1f2937' }
  },
  gauge: {
    shape: 'bullet',
    axis: {
      range: [0, Math.max(...props.ranges, props.target, props.value)],
      tickformat: '.0f'
    },
    bar: {
      color: props.barColor,
      thickness: 0.5
    },
    bgcolor: '#f3f4f6',
    steps: props.ranges.map((range, index) => ({
      range: [index === 0 ? 0 : props.ranges[index - 1], range],
      color: props.rangeColors[index] || '#f3f4f6'
    })),
    threshold: {
      line: { color: '#1f2937', width: 3 },
      thickness: 0.8,
      value: props.target
    }
  }
}])

const chartLayout = computed(() => ({
  margin: { l: 120, r: 30, t: 60, b: 30 }
}))
</script>
