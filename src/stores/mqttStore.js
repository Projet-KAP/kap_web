import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'

export const useMqttStore = defineStore('mqtt', () => {
  // State
  const connected = ref(false)
  const receivingData = ref(false)
  const lastMessageTime = ref(null)
  const messageCount = ref(0)
  const devicesTotal = ref(0)
  const devicesOnline = ref(0)
  const host = ref('')
  const port = ref(1883)
  const subscribedTopics = ref([])
  const loading = ref(false)
  const error = ref(null)
  const lastCheck = ref(null)
  const checkInterval = ref(null)

  // Getters
  const isConnected = computed(() => connected.value)
  const isReceivingData = computed(() => receivingData.value)
  const hasDevices = computed(() => devicesTotal.value > 0)
  const connectionStatus = computed(() => {
    if (loading.value) return 'checking'
    if (devicesTotal.value === 0) return 'no_devices'
    if (!connected.value) return 'disconnected'
    if (!receivingData.value) return 'unavailable'
    return 'connected'
  })

  // Actions
  const checkStatus = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('iot/mqtt/status/')
      connected.value = response.data.connected
      receivingData.value = response.data.receiving_data || false
      lastMessageTime.value = response.data.last_message_time ? new Date(response.data.last_message_time) : null
      messageCount.value = response.data.message_count || 0
      devicesTotal.value = response.data.devices_total || 0
      devicesOnline.value = response.data.devices_online || 0
      host.value = response.data.host || ''
      port.value = response.data.port || 1883
      subscribedTopics.value = response.data.subscribed_topics || []
      lastCheck.value = new Date()
      return response.data
    } catch (err) {
      // En cas d'erreur API, on considère que le broker est déconnecté
      connected.value = false
      receivingData.value = false
      error.value = err.response?.data?.message || err.message || 'Erreur de connexion au broker MQTT'
      return null
    } finally {
      loading.value = false
    }
  }

  const startAutoCheck = (intervalMs = 30000) => {
    // Vérification initiale
    checkStatus()

    // Arrêter l'intervalle existant si présent
    if (checkInterval.value) {
      clearInterval(checkInterval.value)
    }

    // Démarrer la vérification périodique
    checkInterval.value = setInterval(() => {
      checkStatus()
    }, intervalMs)
  }

  const stopAutoCheck = () => {
    if (checkInterval.value) {
      clearInterval(checkInterval.value)
      checkInterval.value = null
    }
  }

  const reconnect = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('iot/mqtt/connect/', {
        host: host.value || 'mosquitto',
        port: port.value || 1883
      })
      if (response.data.success) {
        connected.value = true
        error.value = null
      } else {
        connected.value = false
        error.value = response.data.message || 'Échec de la reconnexion'
      }
      return response.data
    } catch (err) {
      connected.value = false
      error.value = err.response?.data?.message || err.message || 'Erreur lors de la tentative de reconnexion'
      return null
    } finally {
      loading.value = false
    }
  }

  const $reset = () => {
    stopAutoCheck()
    connected.value = false
    receivingData.value = false
    lastMessageTime.value = null
    messageCount.value = 0
    devicesTotal.value = 0
    devicesOnline.value = 0
    host.value = ''
    port.value = 1883
    subscribedTopics.value = []
    loading.value = false
    error.value = null
    lastCheck.value = null
  }

  return {
    // State
    connected,
    receivingData,
    lastMessageTime,
    messageCount,
    devicesTotal,
    devicesOnline,
    host,
    port,
    subscribedTopics,
    loading,
    error,
    lastCheck,
    // Getters
    isConnected,
    isReceivingData,
    hasDevices,
    connectionStatus,
    // Actions
    checkStatus,
    startAutoCheck,
    stopAutoCheck,
    reconnect,
    $reset
  }
})
