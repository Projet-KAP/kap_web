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
  parents: {
    type: Array,
    required: true
  },
  values: {
    type: Array,
    required: true
  },
  colors: {
    type: Array,
    default: null
  },
  height: {
    type: String,
    default: '500px'
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  textinfo: {
    type: String,
    default: 'label+value+percent parent'
  },
  branchvalues: {
    type: String,
    default: 'total'
  }
})

defineEmits(['click'])

const defaultColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

const chartData = computed(() => [{
  type: 'treemap',
  labels: props.labels,
  parents: props.parents,
  values: props.values,
  textinfo: props.textinfo,
  branchvalues: props.branchvalues,
  marker: {
    colors: props.colors || defaultColors,
    line: { width: 2, color: '#fff' }
  },
  textfont: {
    size: 14,
    color: '#fff'
  },
  hovertemplate: '<b>%{label}</b><br>Valeur: %{value:,.0f}<br>Part: %{percentParent:.1%}<extra></extra>',
  pathbar: {
    visible: true,
    thickness: 20,
    textfont: { size: 12 }
  }
}])

const chartLayout = computed(() => ({
  margin: { l: 10, r: 10, t: 30, b: 10 }
}))
</script>
