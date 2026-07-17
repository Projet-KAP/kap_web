import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const stats = ref(null)
  const activities = ref([])
  const kpis = ref([])
  const productionChart = ref(null)
  const maintenanceSchedule = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const isDataLoaded = computed(() => stats.value !== null)

  const overallEfficiency = computed(() => {
    if (!stats.value) return 0
    const { mes } = stats.value
    return mes.taux_performance || 0
  })

  const criticalAlerts = computed(() => {
    return activities.value.filter(activity =>
      activity.severity === 'critical' || activity.severity === 'warning'
    ).length
  })

  const upcomingMaintenance = computed(() => {
    return maintenanceSchedule.value.filter(maintenance => {
      const maintenanceDate = new Date(maintenance.date)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return maintenanceDate <= tomorrow
    }).length
  })

  // Actions - Retourne les données du backend ou des structures vides
  const getStats = async () => {
    try {
      const response = await axiosInstance.get('/dashboard/stats/')
      const data = response.data?.data || response.data
      return { success: true, data: data || {} }
    } catch (err) {
      return { success: true, data: {} }
    }
  }

  const getRecentActivities = async (limit = 10) => {
    try {
      const response = await axiosInstance.get(`/dashboard/activities/?limit=${limit}`)
      const data = response.data?.data || response.data?.results || response.data
      return { success: true, data: data || [] }
    } catch (err) {
      return { success: true, data: [] }
    }
  }

  const getKPIs = async () => {
    try {
      const response = await axiosInstance.get('/dashboard/kpis/')
      const data = response.data?.data || response.data?.results || response.data
      return { success: true, data: data || [] }
    } catch (err) {
      return { success: true, data: [] }
    }
  }

  const getProductionChart = async (period = '7d') => {
    try {
      const response = await axiosInstance.get(`/dashboard/production-chart/?period=${period}`)
      const data = response.data?.data || response.data
      return { success: true, data: data || null }
    } catch (err) {
      return { success: true, data: null }
    }
  }

  const getMaintenanceSchedule = async () => {
    try {
      const response = await axiosInstance.get('/dashboard/maintenance-schedule/')
      const data = response.data?.data || response.data?.results || response.data
      return { success: true, data: data || [] }
    } catch (err) {
      return { success: true, data: [] }
    }
  }

  const loadDashboardData = async () => {
    loading.value = true
    error.value = null

    try {
      const [
        statsResponse,
        activitiesResponse,
        kpisResponse,
        chartResponse,
        scheduleResponse
      ] = await Promise.all([
        getStats(),
        getRecentActivities(5),
        getKPIs(),
        getProductionChart(),
        getMaintenanceSchedule()
      ])

      if (statsResponse.success) {
        stats.value = statsResponse.data
      }

      if (activitiesResponse.success) {
        activities.value = activitiesResponse.data
      }

      if (kpisResponse.success) {
        kpis.value = kpisResponse.data
      }

      if (chartResponse.success) {
        productionChart.value = chartResponse.data
      }

      if (scheduleResponse.success) {
        maintenanceSchedule.value = scheduleResponse.data
      }

    } catch (err) {
      error.value = 'Erreur lors du chargement du tableau de bord'
      console.error('Dashboard loading error:', err)
    } finally {
      loading.value = false
    }
  }

  const refreshStats = async () => {
    try {
      const response = await getStats()
      if (response.success) {
        stats.value = response.data
      }
    } catch (err) {
      console.error('Error refreshing stats:', err)
    }
  }

  const refreshActivities = async () => {
    try {
      const response = await getRecentActivities(10)
      if (response.success) {
        activities.value = response.data
      }
    } catch (err) {
      console.error('Error refreshing activities:', err)
    }
  }

  const getProductionChartForPeriod = async (period = '7d') => {
    loading.value = true
    try {
      const response = await getProductionChart(period)
      if (response.success) {
        productionChart.value = response.data
        return response.data
      }
    } catch (err) {
      error.value = 'Erreur lors du chargement du graphique'
      console.error('Production chart error:', err)
    } finally {
      loading.value = false
    }
  }

  const getStatsForModule = (module) => {
    if (!stats.value) return null
    return stats.value[module] || null
  }

  // Auto-refresh functionality
  let refreshInterval = null

  const startAutoRefresh = (intervalMs = 30000) => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }

    refreshInterval = setInterval(() => {
      refreshStats()
      refreshActivities()
    }, intervalMs)
  }

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  const clearData = () => {
    stats.value = null
    activities.value = []
    kpis.value = []
    productionChart.value = null
    maintenanceSchedule.value = []
    error.value = null
  }

  // Dashboard preferences/filters
  const dashboardPreferences = ref({
    autoRefresh: true,
    refreshInterval: 30000,
    showKPIs: true,
    showActivities: true,
    showMaintenance: true,
    chartPeriod: '7d'
  })

  const loadPreferences = async () => {
    try {
      const response = await axiosInstance.get('/accounts/users/preferences/')

      if (response.data.success) {
        const data = response.data.data
        // Mapper les champs snake_case de l'API vers camelCase du store
        dashboardPreferences.value = {
          autoRefresh: data.auto_refresh,
          refreshInterval: data.refresh_interval,
          showKPIs: data.show_kpis,
          showActivities: data.show_activities,
          showMaintenance: data.show_maintenance,
          chartPeriod: data.chart_period
        }
      }
    } catch (err) {
      console.error('Error loading dashboard preferences:', err)
      // Garder les valeurs par défaut en cas d'erreur
    }
  }

  const savePreferences = async () => {
    try {
      // Mapper les champs camelCase du store vers snake_case de l'API
      const data = {
        auto_refresh: dashboardPreferences.value.autoRefresh,
        refresh_interval: dashboardPreferences.value.refreshInterval,
        show_kpis: dashboardPreferences.value.showKPIs,
        show_activities: dashboardPreferences.value.showActivities,
        show_maintenance: dashboardPreferences.value.showMaintenance,
        chart_period: dashboardPreferences.value.chartPeriod
      }

      const response = await axiosInstance.put('/accounts/users/preferences/', data)

      if (response.data.success) {
      }
    } catch (err) {
      console.error('Error saving dashboard preferences:', err)
    }
  }

  const updatePreference = (key, value) => {
    dashboardPreferences.value[key] = value
    savePreferences()
  }

  return {
    // State
    stats,
    activities,
    kpis,
    productionChart,
    maintenanceSchedule,
    loading,
    error,
    dashboardPreferences,

    // Computed
    isDataLoaded,
    overallEfficiency,
    criticalAlerts,
    upcomingMaintenance,

    // Actions
    loadDashboardData,
    refreshStats,
    refreshActivities,
    getProductionChartForPeriod,
    getStatsForModule,
    startAutoRefresh,
    stopAutoRefresh,
    clearData,
    loadPreferences,
    savePreferences,
    updatePreference
  }
})
