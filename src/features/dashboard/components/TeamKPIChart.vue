<template>
  <Card class="team-kpi-chart">
    <template #header>
      <div class="chart-header">
        <div class="header-content">
          <h3 class="chart-title">KPIs par Équipe</h3>
          <p class="chart-subtitle">Répartition des indicateurs de performance</p>
        </div>
        <div class="header-actions">
          <Select 
            v-model="selectedKPIType" 
            :options="kpiTypeOptions"
            optionLabel="label"
            optionValue="value"
            class="kpi-selector"
            @change="updateChart"
          />
        </div>
      </div>
    </template>
    
    <template #content>
      <div class="chart-container">
        <Chart 
          type="doughnut" 
          :data="chartData" 
          :options="chartOptions" 
          class="kpi-chart"
        />
      </div>
      
      <div class="kpi-summary">
        <div class="summary-grid">
          <div v-for="(kpi, index) in kpiSummary" :key="index" class="summary-item">
            <div class="summary-icon" :style="{ backgroundColor: kpi.color }">
              <i :class="kpi.icon"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">{{ kpi.label }}</div>
              <div class="summary-value">{{ kpi.value }}%</div>
              <div class="summary-trend" :class="kpi.trendClass">
                <i :class="kpi.trendIcon"></i>
                <span>{{ kpi.trend }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// Props
const props = defineProps({
  teams: {
    type: Array,
    default: () => []
  }
})

// Refs
const selectedKPIType = ref('all')
const chartData = ref({})
const chartOptions = ref({})

// Options
const kpiTypeOptions = [
  { label: 'Tous les KPIs', value: 'all' },
  { label: 'Productivité', value: 'productivity' },
  { label: 'Qualité', value: 'quality' },
  { label: 'Efficacité', value: 'efficiency' },
  { label: 'Satisfaction', value: 'satisfaction' }
]

// KPI Colors - Palette moderne sans rose/mauve
const kpiColors = {
  productivity: '#3b82f6',
  quality: '#10b981', 
  efficiency: '#06b6d4',
  satisfaction: '#f97316',
  collaboration: '#f59e0b'
}

// Computed
const kpiSummary = computed(() => {
  const mockData = [
    {
      label: 'Productivité',
      value: 85,
      trend: 8,
      color: kpiColors.productivity,
      icon: 'pi pi-chart-line',
      trendClass: 'trend-positive',
      trendIcon: 'pi pi-arrow-up'
    },
    {
      label: 'Qualité',
      value: 92,
      trend: 5,
      color: kpiColors.quality,
      icon: 'pi pi-check-circle',
      trendClass: 'trend-positive',
      trendIcon: 'pi pi-arrow-up'
    },
    {
      label: 'Efficacité',
      value: 78,
      trend: -3,
      color: kpiColors.efficiency,
      icon: 'pi pi-bolt',
      trendClass: 'trend-negative',
      trendIcon: 'pi pi-arrow-down'
    },
    {
      label: 'Satisfaction',
      value: 88,
      trend: 12,
      color: kpiColors.satisfaction,
      icon: 'pi pi-star',
      trendClass: 'trend-positive',
      trendIcon: 'pi pi-arrow-up'
    }
  ]
  
  return selectedKPIType.value === 'all' 
    ? mockData 
    : mockData.filter(item => item.label.toLowerCase() === selectedKPIType.value)
})

// Methods
const generateChartData = () => {
  if (selectedKPIType.value === 'all') {
    // Doughnut chart showing all KPIs
    const labels = kpiSummary.value.map(kpi => kpi.label)
    const data = kpiSummary.value.map(kpi => kpi.value)
    const backgroundColor = kpiSummary.value.map(kpi => kpi.color)
    const borderColor = backgroundColor.map(color => color)
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderColor,
        borderWidth: 2,
        hoverBorderWidth: 3
      }]
    }
  } else {
    // Bar chart for specific KPI across teams
    const teamNames = props.teams.map(team => team.name)
    const teamData = props.teams.map(() => Math.floor(Math.random() * 40) + 60) // Mock data
    const selectedKPI = kpiSummary.value[0]
    
    return {
      labels: teamNames,
      datasets: [{
        label: selectedKPI.label,
        data: teamData,
        backgroundColor: selectedKPI.color + '80',
        borderColor: selectedKPI.color,
        borderWidth: 2
      }]
    }
  }
}

const updateChart = () => {
  chartData.value = generateChartData()
  
  if (selectedKPIType.value === 'all') {
    // Doughnut chart options
    chartOptions.value = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // We use custom summary
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed}%`
            }
          }
        }
      },
      cutout: '60%',
      elements: {
        arc: {
          borderWidth: 2,
          hoverBorderWidth: 3
        }
      }
    }
  } else {
    // Bar chart options
    chartOptions.value = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}%`
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 12
            }
          }
        },
        y: {
          display: true,
          min: 0,
          max: 100,
          grid: {
            color: '#f1f5f9',
            drawBorder: false
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 12
            },
            callback: function(value) {
              return value + '%'
            }
          }
        }
      }
    }
  }
}

// Watchers
watch(() => props.teams, () => {
  updateChart()
}, { deep: true })

watch(selectedKPIType, () => {
  updateChart()
})

// Lifecycle
onMounted(() => {
  updateChart()
})
</script>

<style scoped>
.team-kpi-chart {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.header-content {
  flex: 1;
}

.chart-title {
  margin: 0 0 0.25rem 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
}

.chart-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.kpi-selector {
  min-width: 150px;
}

.chart-container {
  padding: 1.5rem;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-chart {
  width: 100%;
  height: 100%;
}

.kpi-summary {
  padding: 1.5rem;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.summary-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.summary-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.summary-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.trend-positive {
  color: #16a34a;
}

.trend-negative {
  color: #dc2626;
}

.trend-neutral {
  color: #64748b;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .chart-container {
    height: 250px;
    padding: 1rem;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-item {
    padding: 0.75rem;
  }
  
  .summary-icon {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1rem;
  }
  
  .summary-value {
    font-size: 1.25rem;
  }
}
</style>
