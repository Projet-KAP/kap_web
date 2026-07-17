import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'

export const useEnginsStore = defineStore('engins', () => {
  // State
  const engins = ref([])
  const loading = ref(false)
  const requestErrors = ref({})
  const selectedEngin = ref(null)
  const searchQuery = ref('')
  const filters = ref({
    status: null,
    type: null,
    location: null,
    reliability: null
  })

  // Mock data for development
  const mockEngins = [
    {
      id: 1,
      name: 'Excavatrice CAT 320',
      type: 'EXCAVATRICE',
      model: 'CAT 320D',
      serialNumber: 'CAT320-001',
      status: 'ACTIVE',
      location: {
        latitude: 48.8566,
        longitude: 2.3522,
        address: 'Chantier Paris Centre',
        lastUpdate: '2024-01-20T10:30:00Z'
      },
      kpis: {
        reliability: 92.5,
        uptime: 87.3,
        breakdownRate: 2.1,
        repairRate: 95.8,
        maintenanceScore: 88.7,
        fuelEfficiency: 78.4
      },
      alerts: [
        {
          id: 1,
          type: 'WARNING',
          message: 'Maintenance préventive due dans 5 jours',
          priority: 'MEDIUM',
          timestamp: '2024-01-20T08:15:00Z'
        },
        {
          id: 2,
          type: 'INFO',
          message: 'Niveau carburant: 75%',
          priority: 'LOW',
          timestamp: '2024-01-20T07:45:00Z'
        }
      ],
      tracker: {
        isActive: true,
        batteryLevel: 85,
        signalStrength: 4,
        lastPing: '2024-01-20T10:25:00Z'
      },
      operatingHours: 1247,
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-01-25'
    },
    {
      id: 2,
      name: 'Bulldozer D6T',
      type: 'BULLDOZER',
      model: 'CAT D6T',
      serialNumber: 'CAT-D6T-002',
      status: 'MAINTENANCE',
      location: {
        latitude: 48.8606,
        longitude: 2.3376,
        address: 'Atelier Maintenance Central',
        lastUpdate: '2024-01-19T16:20:00Z'
      },
      kpis: {
        reliability: 88.2,
        uptime: 82.1,
        breakdownRate: 3.5,
        repairRate: 92.3,
        maintenanceScore: 91.2,
        fuelEfficiency: 72.8
      },
      alerts: [
        {
          id: 3,
          type: 'CRITICAL',
          message: 'Panne hydraulique détectée',
          priority: 'HIGH',
          timestamp: '2024-01-19T14:30:00Z'
        }
      ],
      tracker: {
        isActive: true,
        batteryLevel: 92,
        signalStrength: 5,
        lastPing: '2024-01-19T16:18:00Z'
      },
      operatingHours: 2156,
      lastMaintenance: '2024-01-19',
      nextMaintenance: '2024-02-15'
    },
    {
      id: 3,
      name: 'Grue Mobile 50T',
      type: 'GRUE',
      model: 'Liebherr LTM 1050',
      serialNumber: 'LTM-1050-003',
      status: 'ACTIVE',
      location: {
        latitude: 48.8738,
        longitude: 2.2950,
        address: 'Chantier La Défense',
        lastUpdate: '2024-01-20T11:00:00Z'
      },
      kpis: {
        reliability: 94.8,
        uptime: 91.5,
        breakdownRate: 1.2,
        repairRate: 97.1,
        maintenanceScore: 93.4,
        fuelEfficiency: 68.9
      },
      alerts: [
        {
          id: 4,
          type: 'INFO',
          message: 'Inspection sécurité programmée demain',
          priority: 'MEDIUM',
          timestamp: '2024-01-20T09:00:00Z'
        }
      ],
      tracker: {
        isActive: true,
        batteryLevel: 78,
        signalStrength: 3,
        lastPing: '2024-01-20T10:58:00Z'
      },
      operatingHours: 892,
      lastMaintenance: '2024-01-05',
      nextMaintenance: '2024-02-05'
    },
    {
      id: 4,
      name: 'Compacteur Vibreur',
      type: 'COMPACTEUR',
      model: 'Bomag BW 213',
      serialNumber: 'BW213-004',
      status: 'INACTIVE',
      location: {
        latitude: 48.8448,
        longitude: 2.3739,
        address: 'Dépôt Bercy',
        lastUpdate: '2024-01-18T17:30:00Z'
      },
      kpis: {
        reliability: 85.7,
        uptime: 79.2,
        breakdownRate: 4.1,
        repairRate: 89.5,
        maintenanceScore: 86.3,
        fuelEfficiency: 81.2
      },
      alerts: [
        {
          id: 5,
          type: 'WARNING',
          message: 'Engin inactif depuis 2 jours',
          priority: 'MEDIUM',
          timestamp: '2024-01-18T17:30:00Z'
        }
      ],
      tracker: {
        isActive: false,
        batteryLevel: 45,
        signalStrength: 2,
        lastPing: '2024-01-18T17:25:00Z'
      },
      operatingHours: 1678,
      lastMaintenance: '2023-12-20',
      nextMaintenance: '2024-01-30'
    },
    {
      id: 5,
      name: 'Pelle Hydraulique 20T',
      type: 'PELLE',
      model: 'CAT 320E',
      serialNumber: 'CAT320E-005',
      status: 'BREAKDOWN',
      location: {
        latitude: 48.8566,
        longitude: 2.3522,
        address: 'Chantier Paris Centre',
        lastUpdate: '2024-01-19T14:30:00Z'
      },
      kpis: {
        reliability: 78.3,
        uptime: 65.4,
        breakdownRate: 6.2,
        repairRate: 82.1,
        maintenanceScore: 79.8,
        fuelEfficiency: 71.5
      },
      alerts: [
        {
          id: 6,
          type: 'CRITICAL',
          message: 'Panne moteur - Arrêt d\'urgence',
          priority: 'HIGH',
          timestamp: '2024-01-19T14:30:00Z'
        }
      ],
      tracker: {
        isActive: true,
        batteryLevel: 23,
        signalStrength: 1,
        lastPing: '2024-01-19T14:25:00Z'
      },
      operatingHours: 2156,
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-02-10'
    },
    {
      id: 6,
      name: 'Chargeur sur Pneus',
      type: 'CHARGEUR',
      model: 'CAT 950M',
      serialNumber: 'CAT950M-006',
      status: 'STOPPED',
      location: {
        latitude: 48.8606,
        longitude: 2.3376,
        address: 'Atelier Maintenance Central',
        lastUpdate: '2024-01-20T08:00:00Z'
      },
      kpis: {
        reliability: 91.2,
        uptime: 88.7,
        breakdownRate: 2.8,
        repairRate: 94.3,
        maintenanceScore: 89.1,
        fuelEfficiency: 76.8
      },
      alerts: [
        {
          id: 7,
          type: 'WARNING',
          message: 'Arrêt programmé pour maintenance',
          priority: 'MEDIUM',
          timestamp: '2024-01-20T08:00:00Z'
        }
      ],
      tracker: {
        isActive: true,
        batteryLevel: 67,
        signalStrength: 3,
        lastPing: '2024-01-20T07:55:00Z'
      },
      operatingHours: 1890,
      lastMaintenance: '2024-01-20',
      nextMaintenance: '2024-02-20'
    },
    {
      id: 7,
      name: 'Tractopelle JCB 4CX',
      type: 'TRACTOPELLE',
      model: 'JCB 4CX',
      serialNumber: 'JCB4CX-007',
      status: 'DEGRADED',
      location: {
        latitude: 48.8699,
        longitude: 2.3466,
        address: 'Chantier Gare du Nord',
        lastUpdate: '2024-01-20T09:45:00Z'
      },
      kpis: {
        reliability: 68.4,
        uptime: 58.2,
        breakdownRate: 8.7,
        repairRate: 75.3,
        maintenanceScore: 62.9,
        fuelEfficiency: 54.6
      },
      alerts: [
        {
          id: 8,
          type: 'WARNING',
          message: 'Performance dégradée - Inspection recommandée',
          priority: 'HIGH',
          timestamp: '2024-01-20T09:00:00Z'
        },
        {
          id: 9,
          type: 'WARNING',
          message: 'Consommation carburant élevée',
          priority: 'MEDIUM',
          timestamp: '2024-01-20T07:30:00Z'
        }
      ],
      tracker: {
        isActive: true,
        batteryLevel: 52,
        signalStrength: 3,
        lastPing: '2024-01-20T09:42:00Z'
      },
      operatingHours: 3425,
      lastMaintenance: '2023-12-05',
      nextMaintenance: '2024-01-22'
    },
    {
      id: 8,
      name: 'Rouleau Compresseur 12T',
      type: 'ROULEAU',
      model: 'Hamm HD 120',
      serialNumber: 'HD120-008',
      status: 'BREAKDOWN',
      location: {
        latitude: 48.8420,
        longitude: 2.3200,
        address: 'Chantier Tour Eiffel',
        lastUpdate: '2024-01-19T16:15:00Z'
      },
      kpis: {
        reliability: 62.8,
        uptime: 48.5,
        breakdownRate: 11.2,
        repairRate: 68.9,
        maintenanceScore: 55.4,
        fuelEfficiency: 49.3
      },
      alerts: [
        {
          id: 10,
          type: 'CRITICAL',
          message: 'Système de vibration défaillant',
          priority: 'HIGH',
          timestamp: '2024-01-19T16:15:00Z'
        },
        {
          id: 11,
          type: 'CRITICAL',
          message: 'Arrêt immédiat requis',
          priority: 'HIGH',
          timestamp: '2024-01-19T16:16:00Z'
        }
      ],
      tracker: {
        isActive: true,
        batteryLevel: 18,
        signalStrength: 2,
        lastPing: '2024-01-19T16:10:00Z'
      },
      operatingHours: 4128,
      lastMaintenance: '2023-11-20',
      nextMaintenance: '2024-02-01'
    },
    {
      id: 9,
      name: 'Niveleuse CAT 140M',
      type: 'NIVELEUSE',
      model: 'CAT 140M',
      serialNumber: 'CAT140M-009',
      status: 'MAINTENANCE',
      location: {
        latitude: 48.8606,
        longitude: 2.3376,
        address: 'Atelier Maintenance Central',
        lastUpdate: '2024-01-18T14:30:00Z'
      },
      kpis: {
        reliability: 86.3,
        uptime: 79.8,
        breakdownRate: 4.2,
        repairRate: 88.7,
        maintenanceScore: 85.1,
        fuelEfficiency: 70.2
      },
      alerts: [
        {
          id: 12,
          type: 'INFO',
          message: 'Maintenance planifiée en cours',
          priority: 'LOW',
          timestamp: '2024-01-18T14:30:00Z'
        }
      ],
      tracker: {
        isActive: true,
        batteryLevel: 89,
        signalStrength: 5,
        lastPing: '2024-01-20T10:00:00Z'
      },
      operatingHours: 2847,
      lastMaintenance: '2024-01-18',
      nextMaintenance: '2024-03-15'
    },
    {
      id: 10,
      name: 'Tombereau Articulé 30T',
      type: 'TOMBEREAU',
      model: 'Volvo A30G',
      serialNumber: 'A30G-010',
      status: 'DEGRADED',
      location: {
        latitude: 48.8550,
        longitude: 2.3650,
        address: 'Chantier Bastille',
        lastUpdate: '2024-01-20T08:20:00Z'
      },
      kpis: {
        reliability: 71.5,
        uptime: 64.3,
        breakdownRate: 7.4,
        repairRate: 78.6,
        maintenanceScore: 69.2,
        fuelEfficiency: 58.9
      },
      alerts: [
        {
          id: 13,
          type: 'WARNING',
          message: 'Usure prématurée des pneus détectée',
          priority: 'MEDIUM',
          timestamp: '2024-01-20T08:00:00Z'
        },
        {
          id: 14,
          type: 'WARNING',
          message: 'Température moteur élevée',
          priority: 'MEDIUM',
          timestamp: '2024-01-20T08:15:00Z'
        }
      ],
      tracker: {
        isActive: true,
        batteryLevel: 63,
        signalStrength: 3,
        lastPing: '2024-01-20T08:18:00Z'
      },
      operatingHours: 3156,
      lastMaintenance: '2023-12-28',
      nextMaintenance: '2024-01-28'
    },
    {
      id: 11,
      name: 'Pelle Hydraulique Mini',
      type: 'MINI_PELLE',
      model: 'Bobcat E26',
      serialNumber: 'E26-011',
      status: 'BREAKDOWN',
      location: {
        latitude: 48.8580,
        longitude: 2.3387,
        address: 'Chantier Saint-Michel',
        lastUpdate: '2024-01-20T07:45:00Z'
      },
      kpis: {
        reliability: 58.9,
        uptime: 42.7,
        breakdownRate: 13.5,
        repairRate: 64.2,
        maintenanceScore: 51.8,
        fuelEfficiency: 46.5
      },
      alerts: [
        {
          id: 15,
          type: 'CRITICAL',
          message: 'Fuite hydraulique majeure',
          priority: 'HIGH',
          timestamp: '2024-01-20T07:45:00Z'
        }
      ],
      tracker: {
        isActive: true,
        batteryLevel: 12,
        signalStrength: 1,
        lastPing: '2024-01-20T07:40:00Z'
      },
      operatingHours: 4589,
      lastMaintenance: '2023-10-15',
      nextMaintenance: '2024-01-15'
    },
    {
      id: 12,
      name: 'Finisseur Asphalte',
      type: 'FINISSEUR',
      model: 'Vögele Super 1800',
      serialNumber: 'S1800-012',
      status: 'MAINTENANCE',
      location: {
        latitude: 48.8606,
        longitude: 2.3376,
        address: 'Atelier Maintenance Central',
        lastUpdate: '2024-01-19T10:00:00Z'
      },
      kpis: {
        reliability: 89.7,
        uptime: 84.2,
        breakdownRate: 3.1,
        repairRate: 92.8,
        maintenanceScore: 90.3,
        fuelEfficiency: 74.1
      },
      alerts: [
        {
          id: 16,
          type: 'INFO',
          message: 'Révision annuelle en cours',
          priority: 'LOW',
          timestamp: '2024-01-19T10:00:00Z'
        }
      ],
      tracker: {
        isActive: true,
        batteryLevel: 94,
        signalStrength: 5,
        lastPing: '2024-01-20T09:55:00Z'
      },
      operatingHours: 1965,
      lastMaintenance: '2024-01-19',
      nextMaintenance: '2025-01-19'
    }
  ]

  // Computed
  const filteredEngins = computed(() => {
    let result = engins.value

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(engin => 
        engin.name.toLowerCase().includes(query) ||
        engin.type.toLowerCase().includes(query) ||
        engin.model.toLowerCase().includes(query) ||
        engin.serialNumber.toLowerCase().includes(query)
      )
    }

    if (filters.value.status) {
      result = result.filter(engin => engin.status === filters.value.status)
    }

    if (filters.value.type) {
      result = result.filter(engin => engin.type === filters.value.type)
    }

    if (filters.value.reliability) {
      const minReliability = filters.value.reliability
      result = result.filter(engin => engin.kpis?.reliability >= minReliability)
    }

    return result
  })

  const enginsCount = computed(() => engins.value.length)
  // Engins actifs = ACTIVE uniquement (ou OPERATIONAL qui est un alias)
  const activeEngins = computed(() => engins.value.filter(e => 
    e.status === 'ACTIVE' || e.status === 'OPERATIONAL'
  ))
  // Engins opérationnels = ACTIVE, OPERATIONAL, DEGRADED (peuvent encore fonctionner)
  const operationalEngins = computed(() => engins.value.filter(e => 
    e.status === 'ACTIVE' || e.status === 'OPERATIONAL' || e.status === 'DEGRADED'
  ))
  const inactiveEngins = computed(() => engins.value.filter(e => e.status === 'INACTIVE'))
  const maintenanceEngins = computed(() => engins.value.filter(e => e.status === 'MAINTENANCE'))
  const breakdownEngins = computed(() => engins.value.filter(e => e.status === 'BREAKDOWN'))
  const degradedEngins = computed(() => engins.value.filter(e => e.status === 'DEGRADED'))

  const globalKPIs = computed(() => {
    if (engins.value.length === 0) return {}

    const totals = engins.value.reduce((acc, engin) => {
      if (engin.kpis) {
        acc.reliability += engin.kpis.reliability || 0
        acc.uptime += engin.kpis.uptime || 0
        acc.breakdownRate += engin.kpis.breakdownRate || 0
        acc.repairRate += engin.kpis.repairRate || 0
        acc.maintenanceScore += engin.kpis.maintenanceScore || 0
        acc.fuelEfficiency += engin.kpis.fuelEfficiency || 0
      }
      return acc
    }, {
      reliability: 0,
      uptime: 0,
      breakdownRate: 0,
      repairRate: 0,
      maintenanceScore: 0,
      fuelEfficiency: 0
    })

    const count = engins.value.length
    return {
      reliability: Math.round((totals.reliability / count) * 10) / 10,
      uptime: Math.round((totals.uptime / count) * 10) / 10,
      breakdownRate: Math.round((totals.breakdownRate / count) * 10) / 10,
      repairRate: Math.round((totals.repairRate / count) * 10) / 10,
      maintenanceScore: Math.round((totals.maintenanceScore / count) * 10) / 10,
      fuelEfficiency: Math.round((totals.fuelEfficiency / count) * 10) / 10
    }
  })

  const criticalAlerts = computed(() => {
    return engins.value.flatMap(engin =>
      (engin.alerts || []).filter(alert => alert.type === 'CRITICAL')
    )
  })

  const allAlerts = computed(() => {
    return engins.value.flatMap(engin =>
      (engin.alerts || []).map(alert => ({
        ...alert,
        enginId: engin.id,
        enginName: engin.name
      }))
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  })

  // Helper function to check if data is empty
  const isEmpty = (data) => {
    if (!data) return true
    if (Array.isArray(data)) return data.length === 0
    if (typeof data === 'object') return Object.keys(data).length === 0
    return false
  }

  // Helper function to normalize engin data structure
  const normalizeEngin = (engin) => {
    return {
      ...engin,
      kpis: engin.kpis || {
        reliability: 0,
        uptime: 0,
        breakdownRate: 0,
        repairRate: 0,
        maintenanceScore: 0,
        fuelEfficiency: 0
      },
      alerts: engin.alerts || [],
      tracker: engin.tracker || {
        isActive: false,
        batteryLevel: 0,
        signalStrength: 0,
        lastPing: null
      },
      location: engin.location || {
        latitude: null,
        longitude: null,
        address: 'Non définie',
        lastUpdate: null
      },
      operatingHours: engin.operatingHours || Math.floor(Math.random() * 2000) + 500 // Valeur aléatoire entre 500 et 2500h
    }
  }

  // Actions
  const loadEngins = async () => {
    loading.value = true
    try {
      // Filtrer explicitement les engins (type=ENGINE)
      const response = await axiosInstance.get('/engins/machines/?type=ENGINE');
      const data = response.data?.data || response.data?.results || response.data

      if (isEmpty(data) || !Array.isArray(data)) {
        engins.value = []
      } else {
        // Filtrer pour s'assurer qu'on ne garde que les engins (type=ENGINE)
        const filteredData = data.filter(item => item.type === 'ENGINE')
        engins.value = filteredData.map(normalizeEngin)
      }
      
    } catch (error) {
      engins.value = []
      requestErrors.value.load = error.message
    } finally {
      loading.value = false
    }
  }

  const getEnginById = (id) => {
    return engins.value.find(engin => engin.id === id)
  }

  const updateEnginLocation = async (enginId, location) => {
    const engin = getEnginById(enginId)
    if (engin) {
      engin.location = {
        ...engin.location,
        ...location,
        lastUpdate: new Date().toISOString()
      }
    }
  }

  const addAlert = async (enginId, alert) => {
    const engin = getEnginById(enginId)
    if (engin) {
      engin.alerts.unshift({
        ...alert,
        id: Date.now(),
        timestamp: new Date().toISOString()
      })
    }
  }

  const dismissAlert = async (enginId, alertId) => {
    const engin = getEnginById(enginId)
    if (engin) {
      engin.alerts = engin.alerts.filter(alert => alert.id !== alertId)
    }
  }

  const updateKPIs = async (enginId, kpis) => {
    const engin = getEnginById(enginId)
    if (engin) {
      engin.kpis = { ...engin.kpis, ...kpis }
    }
  }

  const setMaintenanceStatus = async (enginId, status) => {
    const engin = getEnginById(enginId)
    if (engin) {
      engin.status = status
      if (status === 'MAINTENANCE') {
        engin.lastMaintenance = new Date().toISOString().split('T')[0]
      }
    }
  }

  const resetFilters = () => {
    filters.value = {
      status: null,
      type: null,
      location: null,
      reliability: null
    }
    searchQuery.value = ''
  }

  const updateEnginStatus = async (enginId, newStatus) => {
    try {
      const response = await axiosInstance.patch(`/engins/machines/${enginId}/`, {
        status: newStatus
      })
      
      const engin = engins.value.find(e => e.id === enginId)
      if (engin) {
        engin.status = newStatus
      }
      
      return response.data
    } catch (error) {
      throw error
    }
  }

  const deleteEngin = async (enginId) => {
    try {
      await axiosInstance.delete(`/engins/machines/${enginId}/`)

      // Retirer l'engin de la liste locale
      engins.value = engins.value.filter(e => e.id !== enginId)

      return true
    } catch (error) {
      throw error
    }
  }

  return {
    // State
    engins,
    loading,
    requestErrors,
    selectedEngin,
    searchQuery,
    filters,

    // Computed
    filteredEngins,
    enginsCount,
    activeEngins,
    operationalEngins,
    inactiveEngins,
    maintenanceEngins,
    breakdownEngins,
    degradedEngins,
    globalKPIs,
    criticalAlerts,
    allAlerts,

    // Actions
    loadEngins,
    getEnginById,
    updateEnginLocation,
    addAlert,
    dismissAlert,
    updateKPIs,
    setMaintenanceStatus,
    resetFilters,
    updateEnginStatus,
    deleteEngin
  }
})
