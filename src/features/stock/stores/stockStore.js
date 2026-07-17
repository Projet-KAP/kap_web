import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'
import { importStockFile } from '@/shared/services/moduleImportService.js'

export const useStockStore = defineStore('stock', () => {
  // State
  const spareParts = ref([])
  const warehouses = ref([])
  const movements = ref([])
  const alerts = ref([])
  const assignments = ref([])
  const stats = ref({
    total_references: 0,
    available_items: 0,
    items_in_alert: 0,
    total_value: 0,
    status_distribution: {}
  })
  const stockBySite = ref([])
  const topConsumed = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const lowStockParts = computed(() => {
    return spareParts.value.filter(part => part.is_low_stock)
  })

  const outOfStockParts = computed(() => {
    return spareParts.value.filter(part => part.is_out_of_stock)
  })

  const activeAlerts = computed(() => {
    return alerts.value.filter(alert => 
      alert.status === 'OPEN' || alert.status === 'ACKNOWLEDGED'
    )
  })

  const totalStockValue = computed(() => {
    return spareParts.value.reduce((sum, part) => sum + (parseFloat(part.total_value) || 0), 0)
  })

  // Actions - Spare Parts
  const loadSpareParts = async (filters = {}) => {
    loading.value = true
    error.value = null
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && v !== '')
      )
      const params = new URLSearchParams(cleanFilters).toString()
      const url = params ? `/stock/spare-parts/?${params}` : '/stock/spare-parts/'
      const response = await axiosInstance.get(url)

      // Handle both paginated {count, results} and plain array responses
      spareParts.value = response.data?.results || response.data || []
    } catch (err) {
      error.value = err.message
      spareParts.value = []
    } finally {
      loading.value = false
    }
  }

  const createSparePart = async (partData) => {
    try {
      const response = await axiosInstance.post('/stock/spare-parts/', partData)
      spareParts.value.unshift(response.data)
      return response.data
    } catch (err) {
      throw err
    }
  }

  const updateSparePart = async (partId, partData) => {
    try {
      const response = await axiosInstance.patch(`/stock/spare-parts/${partId}/`, partData)
      const index = spareParts.value.findIndex(p => p.id === partId)
      if (index !== -1) {
        spareParts.value[index] = response.data
      }
      return response.data
    } catch (err) {
      throw err
    }
  }

  const deleteSparePart = async (partId) => {
    try {
      await axiosInstance.delete(`/stock/spare-parts/${partId}/`)
      spareParts.value = spareParts.value.filter(p => p.id !== partId)
    } catch (err) {
      throw err
    }
  }

  const importCSV = async (file) => {
    try {
      const result = await importStockFile(file)
      await loadSpareParts()
      return result
    } catch (err) {
      console.error('[STOCK STORE] Erreur import fichier:', err)
      throw err
    }
  }

  // Actions - Warehouses
  const loadWarehouses = async () => {
    try {
      const response = await axiosInstance.get('/stock/warehouses/')
      warehouses.value = response.data || []
    } catch (err) {
      warehouses.value = []
    }
  }

  const createWarehouse = async (warehouseData) => {
    try {
      const response = await axiosInstance.post('/stock/warehouses/', warehouseData)
      warehouses.value.unshift(response.data)
      return response.data
    } catch (err) {
      throw err
    }
  }

  // Actions - Movements
  const loadMovements = async (filters = {}) => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && v !== '')
      )
      const params = new URLSearchParams(cleanFilters).toString()
      const url = params ? `/stock/movements/?${params}` : '/stock/movements/'
      const response = await axiosInstance.get(url)
      
      movements.value = response.data?.results || response.data || []
    } catch (err) {
      movements.value = []
    }
  }

  const createMovement = async (movementData) => {
    try {
      const response = await axiosInstance.post('/stock/movements/', movementData)
      movements.value.unshift(response.data)
      
      // Recharger les pièces pour mettre à jour les quantités
      await loadSpareParts()
      
      return response.data
    } catch (err) {
      throw err
    }
  }

  const transferBetweenSites = async (transferData) => {
    try {
      const response = await axiosInstance.post('/stock/movements/transfer_between_sites/', transferData)
      movements.value.unshift(response.data.movement)
      
      // Recharger les pièces
      await loadSpareParts()
      
      return response.data
    } catch (err) {
      throw err
    }
  }

  // Actions - Alerts
  const loadAlerts = async () => {
    try {
      const response = await axiosInstance.get('/stock/alerts/')
      alerts.value = response.data?.results || response.data || []
    } catch (err) {
      alerts.value = []
    }
  }

  const acknowledgeAlert = async (alertId) => {
    try {
      const response = await axiosInstance.post(`/stock/alerts/${alertId}/acknowledge/`)
      const index = alerts.value.findIndex(a => a.id === alertId)
      if (index !== -1) {
        alerts.value[index] = response.data.alert
      }
      return response.data.alert
    } catch (err) {
      throw err
    }
  }

  const resolveAlert = async (alertId, notes = '') => {
    try {
      const response = await axiosInstance.post(`/stock/alerts/${alertId}/resolve/`, { notes })
      const index = alerts.value.findIndex(a => a.id === alertId)
      if (index !== -1) {
        alerts.value[index] = response.data.alert
      }
      return response.data.alert
    } catch (err) {
      throw err
    }
  }

  // Actions - Dashboard Statistics
  const loadStats = async () => {
    try {
      const response = await axiosInstance.get('/stock/spare-parts/stats/')
      stats.value = response.data
      return response.data
    } catch (err) {
      stats.value = {
        total_references: 0,
        available_items: 0,
        items_in_alert: 0,
        total_value: 0,
        status_distribution: {}
      }
    }
  }

  const loadStockBySite = async () => {
    try {
      const response = await axiosInstance.get('/stock/spare-parts/by_site/')
      stockBySite.value = response.data.map(site => ({
        id: site.current_site__id,
        site: site.current_site__name,
        type: 'Site',  // Site model doesn't have a type field
        in_stock: site.in_stock,
        alerts: site.alerts,
        percentage: site.percentage || 0
      }))
      return stockBySite.value
    } catch (err) {
      stockBySite.value = []
    }
  }

  const loadTopConsumed = async () => {
    try {
      const response = await axiosInstance.get('/stock/spare-parts/top_consumed/')
      topConsumed.value = response.data
      return response.data
    } catch (err) {
      topConsumed.value = []
    }
  }

  const loadDashboardAlerts = async () => {
    try {
      const response = await axiosInstance.get('/stock/spare-parts/alerts/')
      return response.data
    } catch (err) {
      return []
    }
  }

  const loadEvolution = async (period = 30) => {
    try {
      const response = await axiosInstance.get(`/stock/spare-parts/evolution/?period=${period}`)
      return response.data
    } catch (err) {
      return null
    }
  }

  const loadDashboardData = async () => {
    loading.value = true
    error.value = null
    try {
      await loadStats()
      await Promise.all([
        loadStockBySite(),
        loadTopConsumed(),
        loadDashboardAlerts()
      ])
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Actions - Assignments
  const loadAssignments = async (filters = {}) => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && v !== '')
      )
      const params = new URLSearchParams(cleanFilters).toString()
      const url = params ? `/stock/assignments/?${params}` : '/stock/assignments/'
      const response = await axiosInstance.get(url)

      assignments.value = response.data || []
      return response.data
    } catch (err) {
      assignments.value = []
    }
  }

  const createAssignment = async (assignmentData) => {
    try {
      const response = await axiosInstance.post('/stock/assignments/', assignmentData)
      assignments.value.unshift(response.data)

      // Recharger les pièces pour mettre à jour les quantités
      await loadSpareParts()

      return response.data
    } catch (err) {
      throw err
    }
  }

  const returnAssignment = async (assignmentId) => {
    try {
      const response = await axiosInstance.post(`/stock/assignments/${assignmentId}/return_assignment/`)
      const index = assignments.value.findIndex(a => a.id === assignmentId)
      if (index !== -1) {
        assignments.value[index] = response.data
      }

      // Recharger les pièces
      await loadSpareParts()

      return response.data
    } catch (err) {
      throw err
    }
  }

  const refreshAll = async () => {
    await Promise.all([
      loadSpareParts(),
      loadWarehouses(),
      loadMovements(),
      loadAlerts(),
      loadAssignments()
    ])
  }

  return {
    // State
    spareParts,
    warehouses,
    movements,
    alerts,
    assignments,
    stats,
    stockBySite,
    topConsumed,
    loading,
    error,

    // Computed
    lowStockParts,
    outOfStockParts,
    activeAlerts,
    totalStockValue,

    // Actions - Spare Parts
    loadSpareParts,
    createSparePart,
    updateSparePart,
    deleteSparePart,
    importCSV,

    // Actions - Warehouses
    loadWarehouses,
    createWarehouse,

    // Actions - Movements
    loadMovements,
    createMovement,
    transferBetweenSites,

    // Actions - Alerts
    loadAlerts,
    acknowledgeAlert,
    resolveAlert,

    // Actions - Dashboard
    loadStats,
    loadStockBySite,
    loadTopConsumed,
    loadDashboardAlerts,
    loadEvolution,
    loadDashboardData,

    // Actions - Assignments
    loadAssignments,
    createAssignment,
    returnAssignment,

    // General
    refreshAll
  }
})
