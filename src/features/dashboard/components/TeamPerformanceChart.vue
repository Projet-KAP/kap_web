<template>
  <Card class="team-performance-chart">
    <template #header>
      <div class="chart-header">
        <div class="header-content">
          <h3 class="chart-title">Performance des Équipes</h3>
          <p class="chart-subtitle">Évolution mensuelle des performances</p>
        </div>
        <div class="header-actions">
          <Select 
            v-model="selectedPeriod" 
            :options="periodOptions"
            optionLabel="label"
            optionValue="value"
            class="period-selector"
            @change="updateChart"
          />
        </div>
      </div>
    </template>
    
    <template #content>
      <div class="chart-container">
        <Chart 
          type="line" 
          :data="chartData" 
          :options="chartOptions" 
          class="performance-chart"
        />
      </div>
      
      <div class="chart-legend">
        <div class="legend-items">
          <div v-for="team in teams" :key="team.id" class="legend-item">
            <div 
              class="legend-color" 
              :style="{ backgroundColor: getTeamColor(team.id) }"
            ></div>
            <span class="legend-label">{{ team.name }}</span>
            <span class="legend-value">{{ team.currentScore }}%</span>
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
const selectedPeriod = ref('3months')
const chartData = ref({})
const chartOptions = ref({})

// Options
const periodOptions = [
  { label: '1 Mois', value: '1month' },
  { label: '3 Mois', value: '3months' },
  { label: '6 Mois', value: '6months' },
  { label: '1 Année', value: '1year' }
]

// Team colors - Palette moderne sans rose/mauve
const teamColors = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#2563eb'  // Indigo
]

// Computed
const teams = computed(() => {
  return props.teams.map((team, index) => ({
    ...team,
    currentScore: team.performance_score || Math.floor(Math.random() * 40) + 60 // Mock data
  }))
})

// Methods
const getTeamColor = (teamId) => {
  return teamColors[teamId % teamColors.length]
}

const generateMockData = () => {
  const months = selectedPeriod.value === '1month' ? 4 : 
                 selectedPeriod.value === '3months' ? 12 : 
                 selectedPeriod.value === '6months' ? 24 : 52

  const labels = []
  const currentDate = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate)
    if (selectedPeriod.value === '1year') {
      date.setDate(date.getDate() - (i * 7)) // Weekly for 1 year
      labels.push(date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }))
    } else {
      date.setDate(date.getDate() - (i * 7)) // Weekly
      labels.push(date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }))
    }
  }

  const datasets = teams.value.map((team, index) => {
    const data = []
    let baseScore = team.currentScore
    
    for (let i = 0; i < months; i++) {
      // Generate realistic performance data with some variation
      const variation = (Math.random() - 0.5) * 20
      baseScore = Math.max(30, Math.min(100, baseScore + variation))
      data.push(Math.round(baseScore))
    }
    
    return {
      label: team.name,
      data: data,
      borderColor: getTeamColor(team.id),
      backgroundColor: getTeamColor(team.id) + '20',
      tension: 0.4,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6
    }
  })

  return { labels, datasets }
}

const updateChart = () => {
  const data = generateMockData()
  
  chartData.value = {
    labels: data.labels,
    datasets: data.datasets
  }
  
  chartOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // We use custom legend
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
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
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      point: {
        hoverBackgroundColor: '#fff',
        hoverBorderWidth: 2
      }
    }
  }
}

// Watchers
watch(() => props.teams, () => {
  updateChart()
}, { deep: true })

// Lifecycle
onMounted(() => {
  updateChart()
})
</script>

<style scoped>
.team-performance-chart {
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

.period-selector {
  min-width: 120px;
}

.chart-container {
  padding: 1.5rem;
  height: 400px;
}

.performance-chart {
  width: 100%;
  height: 100%;
}

.chart-legend {
  padding: 0 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid #f1f5f9;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.875rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-label {
  color: #374151;
  font-weight: 500;
}

.legend-value {
  color: #1e293b;
  font-weight: 600;
  margin-left: 0.25rem;
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
    height: 300px;
    padding: 1rem;
  }
  
  .legend-items {
    flex-direction: column;
    align-items: stretch;
  }
  
  .legend-item {
    justify-content: space-between;
  }
}
</style>
