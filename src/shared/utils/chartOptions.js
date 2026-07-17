import { colors } from './colors.js'

// Options de base pour tous les graphiques
export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false // Utiliser des légendes personnalisées
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: colors.primary,
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true
    }
  },
  elements: {
    point: {
      hoverBackgroundColor: '#fff',
      hoverBorderWidth: 2
    }
  }
}

// Options pour graphiques linéaires
export const lineChartOptions = {
  ...baseChartOptions,
  scales: {
    x: {
      display: true,
      grid: {
        color: '#f3f4f6',
        drawBorder: false
      },
      ticks: {
        color: '#6b7280',
        font: { size: 11 }
      }
    },
    y: {
      display: true,
      grid: {
        color: '#f3f4f6',
        drawBorder: false
      },
      ticks: {
        color: '#6b7280',
        font: { size: 11 }
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
}

// Options pour graphiques en secteurs
export const doughnutChartOptions = {
  ...baseChartOptions,
  cutout: '60%',
  plugins: {
    ...baseChartOptions.plugins,
    tooltip: {
      ...baseChartOptions.plugins.tooltip,
      callbacks: {
        label: function(context) {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `${label}: ${value} (${percentage}%)`
        }
      }
    }
  }
}

// Générateurs d'options spécialisées
export const chartOptionsFactory = {
  // Options pour graphiques de performance
  performance: (yAxisLabel = 'Performance (%)') => ({
    ...lineChartOptions,
    scales: {
      ...lineChartOptions.scales,
      y: {
        ...lineChartOptions.scales.y,
        title: {
          display: true,
          text: yAxisLabel,
          color: '#6b7280',
          font: { size: 12, weight: '500' }
        },
        min: 0,
        max: 100,
        ticks: {
          ...lineChartOptions.scales.y.ticks,
          callback: function(value) {
            return value + '%'
          }
        }
      }
    }
  }),

  // Options pour graphiques de fiabilité
  reliability: () => ({
    ...lineChartOptions,
    scales: {
      ...lineChartOptions.scales,
      x: {
        ...lineChartOptions.scales.x,
        title: {
          display: true,
          text: 'Période',
          color: '#6b7280',
          font: { size: 12, weight: '500' }
        }
      },
      y: {
        ...lineChartOptions.scales.y,
        title: {
          display: true,
          text: 'Fiabilité (%)',
          color: '#6b7280',
          font: { size: 12, weight: '500' }
        },
        min: 0,
        max: 100,
        ticks: {
          ...lineChartOptions.scales.y.ticks,
          callback: function(value) {
            return value + '%'
          }
        }
      }
    }
  }),

  // Options pour graphiques KPI
  kpi: () => ({
    ...doughnutChartOptions,
    plugins: {
      ...doughnutChartOptions.plugins,
      tooltip: {
        ...doughnutChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed}%`
          }
        }
      }
    }
  })
}

// Générateurs de datasets
export const datasetFactory = {
  // Dataset pour ligne de performance
  performanceLine: (label, data, colorIndex = 0) => ({
    label,
    data,
    borderColor: colors.chart[colorIndex % colors.chart.length],
    backgroundColor: `${colors.chart[colorIndex % colors.chart.length]}20`,
    tension: 0.4,
    borderWidth: 3,
    pointRadius: 4,
    pointHoverRadius: 6,
    fill: false
  }),

  // Dataset pour secteurs KPI
  kpiDoughnut: (labels, data) => ({
    data,
    backgroundColor: labels.map((_, index) => colors.chart[index % colors.chart.length]),
    borderColor: '#fff',
    borderWidth: 2,
    hoverBorderWidth: 3
  })
}

// Générateurs de labels temporels
export const timeLabelsFactory = {
  // Labels pour différentes périodes
  generate: (period) => {
    const labels = []
    const now = new Date()
    
    switch (period) {
      case '1month':
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }))
        }
        break
      case '3months':
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - (i * 7))
          labels.push(`S${Math.ceil((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`)
        }
        break
      case '6months':
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now)
          date.setMonth(date.getMonth() - i)
          labels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }))
        }
        break
      case '1year':
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now)
          date.setMonth(date.getMonth() - i)
          labels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }))
        }
        break
    }
    
    return labels
  }
}

// Options de période communes
export const periodOptions = [
  { label: '1 Mois', value: '1month' },
  { label: '3 Mois', value: '3months' },
  { label: '6 Mois', value: '6months' },
  { label: '1 Année', value: '1year' }
]
