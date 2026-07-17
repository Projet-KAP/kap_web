import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { axiosInstance } from '@/main'

export const useIoTStore = defineStore('iot', () => {
  // State
  const devices = ref([])
  const metrics = ref({})
  const alerts = ref([])
  const dashboardData = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const selectedDevice = ref(null)
  const deviceData = ref({})
  const realTimeValues = ref({})

  // Computed
  const onlineDevices = computed(() =>
    devices.value.filter(d => d.status === 'online')
  )

  const offlineDevices = computed(() =>
    devices.value.filter(d => d.status === 'offline')
  )

  const devicesByType = computed(() => {
    const grouped = {}
    devices.value.forEach(device => {
      const type = device.device_type || 'sensor'
      if (!grouped[type]) grouped[type] = []
      grouped[type].push(device)
    })
    return grouped
  })

  const devicesBySite = computed(() => {
    const grouped = {}
    devices.value.forEach(device => {
      const siteId = device.site?.id || device.site || 'unknown'
      const siteName = device.site?.name || `Site ${siteId}`
      if (!grouped[siteId]) {
        grouped[siteId] = { name: siteName, devices: [] }
      }
      grouped[siteId].devices.push(device)
    })
    return grouped
  })

  const unacknowledgedAlerts = computed(() =>
    alerts.value.filter(a => !a.is_acknowledged)
  )

  const criticalAlerts = computed(() =>
    alerts.value.filter(a => a.severity === 'critical' && !a.is_resolved)
  )

  // Actions
  async function fetchDevices(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get('/iot/devices/', { params })
      devices.value = response.data.results || response.data || []
      return devices.value
    } catch (err) {
      error.value = err.response?.data?.detail || 'Erreur lors du chargement des devices'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDevicesBySite(siteId) {
    return fetchDevices({ site: siteId })
  }

  async function fetchDevicesByMachine(machineId) {
    return fetchDevices({ machine: machineId })
  }

  async function fetchDevice(deviceId) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get(`/iot/devices/${deviceId}/`)
      selectedDevice.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Erreur lors du chargement du device'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createDevice(deviceData) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.post('/iot/devices/', deviceData)
      devices.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Erreur lors de la création du device'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateDevice(deviceId, deviceData) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.patch(`/iot/devices/${deviceId}/`, deviceData)
      const index = devices.value.findIndex(d => d.id === deviceId)
      if (index !== -1) {
        devices.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Erreur lors de la mise à jour du device'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteDevice(deviceId) {
    loading.value = true
    error.value = null

    try {
      await axiosInstance.delete(`/iot/devices/${deviceId}/`)
      devices.value = devices.value.filter(d => d.id !== deviceId)
    } catch (err) {
      error.value = err.response?.data?.detail || 'Erreur lors de la suppression du device'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDeviceData(deviceId, params = {}) {
    try {
      const response = await axiosInstance.get(`/iot/devices/${deviceId}/data/`, { params })
      deviceData.value[deviceId] = response.data
      return response.data
    } catch (err) {
      throw err
    }
  }

  async function fetchDeviceMetrics(deviceId) {
    try {
      const response = await axiosInstance.get('/iot/metrics/', {
        params: { device: deviceId }
      })
      metrics.value[deviceId] = response.data.results || response.data || []
      return metrics.value[deviceId]
    } catch (err) {
      throw err
    }
  }

  async function fetchDashboard() {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get('/iot/devices/dashboard/')
      dashboardData.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Erreur lors du chargement du dashboard'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchAlerts(params = {}) {
    try {
      const response = await axiosInstance.get('/iot/iot-alerts/', { params })
      alerts.value = response.data.results || response.data || []
      return alerts.value
    } catch (err) {
      throw err
    }
  }

  async function acknowledgeAlert(alertId) {
    try {
      const response = await axiosInstance.post(`/iot/iot-alerts/${alertId}/acknowledge/`)
      const index = alerts.value.findIndex(a => a.id === alertId)
      if (index !== -1) {
        alerts.value[index] = response.data
      }
      return response.data
    } catch (err) {
      throw err
    }
  }

  async function resolveAlert(alertId) {
    try {
      const response = await axiosInstance.post(`/iot/iot-alerts/${alertId}/resolve/`)
      const index = alerts.value.findIndex(a => a.id === alertId)
      if (index !== -1) {
        alerts.value[index] = response.data
      }
      return response.data
    } catch (err) {
      throw err
    }
  }

  async function sendCommand(deviceId, command, payload = {}) {
    try {
      const response = await axiosInstance.post('/iot/commands/', {
        device: deviceId,
        name: command,
        payload: payload,
        status: 'pending'
      })
      return response.data
    } catch (err) {
      throw err
    }
  }

  async function fetchRealTimeData(machineId = null) {
    try {
      const params = machineId ? { machine: machineId } : {}
      const response = await axiosInstance.get('/sensors/readings/real_time_data/', { params })
      realTimeValues.value = response.data
      return response.data
    } catch (err) {
      throw err
    }
  }

  function getDeviceById(deviceId) {
    return devices.value.find(d => d.id === deviceId || d.device_id === deviceId)
  }

  async function associateMachine(deviceId, machineId) {
    const response = await axiosInstance.post(`/iot/devices/${deviceId}/associate-machine/`, {
      machine_id: machineId
    })
    return response.data
  }

  async function fetchUnassignedDevices() {
    const response = await axiosInstance.get('/iot/devices/', { params: { unassigned: 'true' } })
    return response.data.results || response.data || []
  }

  function getMetricsForDevice(deviceId) {
    return metrics.value[deviceId] || []
  }

  function getLatestDataForDevice(deviceId) {
    const data = deviceData.value[deviceId]
    if (!data || data.length === 0) return null
    return data[0]
  }

  function clearError() {
    error.value = null
  }

  function resetState() {
    devices.value = []
    metrics.value = {}
    alerts.value = []
    dashboardData.value = null
    selectedDevice.value = null
    deviceData.value = {}
    realTimeValues.value = {}
    error.value = null
  }

  return {
    // State
    devices,
    metrics,
    alerts,
    dashboardData,
    loading,
    error,
    selectedDevice,
    deviceData,
    realTimeValues,

    // Computed
    onlineDevices,
    offlineDevices,
    devicesByType,
    devicesBySite,
    unacknowledgedAlerts,
    criticalAlerts,

    // Actions
    fetchDevices,
    fetchDevicesBySite,
    fetchDevicesByMachine,
    fetchDevice,
    createDevice,
    updateDevice,
    deleteDevice,
    fetchDeviceData,
    fetchDeviceMetrics,
    fetchDashboard,
    fetchAlerts,
    acknowledgeAlert,
    resolveAlert,
    sendCommand,
    fetchRealTimeData,
    getDeviceById,
    getMetricsForDevice,
    associateMachine,
    fetchUnassignedDevices,
    getLatestDataForDevice,
    clearError,
    resetState
  }
})
