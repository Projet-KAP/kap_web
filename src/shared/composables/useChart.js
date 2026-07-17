import { ref, computed } from 'vue'
import { colors } from '@/shared/utils/colors.js'
import { timeLabelsFactory, datasetFactory, periodOptions } from '@/shared/utils/chartOptions.js'

export function useChart() {
  // État réactif
  const selectedPeriod = ref('3months')
  const selectedType = ref(null)
  const loading = ref(false)

  // Méthodes utilitaires
  const generateMockData = (baseValue, period, variation = 5) => {
    const dataPoints = getDataPointsCount(period)
    const data = []
    
    for (let i = 0; i < dataPoints; i++) {
      const randomVariation = (Math.random() - 0.5) * variation * 2
      const trend = (dataPoints - i) * 0.05 // Légère amélioration dans le temps
      const value = Math.max(0, Math.min(100, baseValue + randomVariation + trend))
      data.push(Math.round(value * 10) / 10)
    }
    
    return data
  }

  const getDataPointsCount = (period) => {
    switch (period) {
      case '1month': return 30
      case '3months': return 12
      case '6months': return 6
      case '1year': return 12
      default: return 12
    }
  }

  const generateTimeLabels = (period) => {
    return timeLabelsFactory.generate(period)
  }

  const createPerformanceDataset = (label, data, colorIndex = 0) => {
    return datasetFactory.performanceLine(label, data, colorIndex)
  }

  const createKPIDataset = (labels, data) => {
    return datasetFactory.kpiDoughnut(labels, data)
  }

  // Computed
  const timeLabels = computed(() => generateTimeLabels(selectedPeriod.value))

  return {
    // État
    selectedPeriod,
    selectedType,
    loading,
    
    // Options
    periodOptions,
    
    // Computed
    timeLabels,
    
    // Méthodes
    generateMockData,
    getDataPointsCount,
    generateTimeLabels,
    createPerformanceDataset,
    createKPIDataset
  }
}

// Composable spécialisé pour les KPIs
export function useKPIChart(kpiData) {
  const { selectedPeriod, timeLabels } = useChart()

  const chartData = computed(() => {
    if (!kpiData.value || kpiData.value.length === 0) {
      return { labels: [], datasets: [] }
    }

    const labels = kpiData.value.map(item => item.label)
    const data = kpiData.value.map(item => item.value)
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map((_, index) => colors.chart[index % colors.chart.length]),
        borderColor: '#fff',
        borderWidth: 2,
        hoverBorderWidth: 3
      }]
    }
  })

  return {
    selectedPeriod,
    timeLabels,
    chartData
  }
}

// Composable pour les graphiques de performance
export function usePerformanceChart(performanceData) {
  const { selectedPeriod, selectedType, timeLabels, generateMockData } = useChart()

  const filteredData = computed(() => {
    if (!selectedType.value) return performanceData.value
    return performanceData.value.filter(item => item.type === selectedType.value)
  })

  const chartData = computed(() => {
    const labels = timeLabels.value
    
    if (selectedType.value) {
      // Afficher les éléments individuels du type sélectionné
      const datasets = filteredData.value.map((item, index) => ({
        label: item.name,
        data: generateMockData(item.performance || item.kpis?.reliability || 85, selectedPeriod.value),
        borderColor: colors.chart[index % colors.chart.length],
        backgroundColor: `${colors.chart[index % colors.chart.length]}20`,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false
      }))
      
      return { labels, datasets }
    } else {
      // Afficher par type/catégorie
      const types = [...new Set(performanceData.value.map(item => item.type))]
      const datasets = types.map((type, index) => {
        const itemsOfType = performanceData.value.filter(item => item.type === type)
        const avgPerformance = itemsOfType.reduce((sum, item) => 
          sum + (item.performance || item.kpis?.reliability || 85), 0) / itemsOfType.length
        
        return {
          label: type,
          data: generateMockData(avgPerformance, selectedPeriod.value),
          borderColor: colors.chart[index % colors.chart.length],
          backgroundColor: `${colors.chart[index % colors.chart.length]}20`,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false
        }
      })
      
      return { labels, datasets }
    }
  })

  return {
    selectedPeriod,
    selectedType,
    timeLabels,
    filteredData,
    chartData
  }
}

// Composable pour les statistiques
export function useStats(data) {
  const totalCount = computed(() => data.value?.length || 0)
  
  const activeCount = computed(() => 
    data.value?.filter(item => item.status === 'ACTIVE').length || 0
  )
  
  const inactiveCount = computed(() => 
    data.value?.filter(item => item.status === 'INACTIVE').length || 0
  )
  
  const averagePerformance = computed(() => {
    if (!data.value || data.value.length === 0) return 0
    
    const total = data.value.reduce((sum, item) => {
      const performance = item.performance || item.kpis?.reliability || 0
      return sum + performance
    }, 0)
    
    return Math.round((total / data.value.length) * 10) / 10
  })

  const criticalAlerts = computed(() => {
    if (!data.value) return 0
    
    return data.value.reduce((count, item) => {
      const criticalCount = item.alerts?.filter(alert => alert.type === 'CRITICAL').length || 0
      return count + criticalCount
    }, 0)
  })

  return {
    totalCount,
    activeCount,
    inactiveCount,
    averagePerformance,
    criticalAlerts
  }
}
