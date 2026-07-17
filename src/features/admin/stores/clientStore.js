import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main'

export const useClientStore = defineStore('client', () => {
  // State
  const clients = ref([])
  const loading = ref(false)
  const currentClient = ref(null)
  const searchQuery = ref('')
  const filters = ref({})

  // Getters
  const filteredClients = computed(() => {
    let filtered = Array.isArray(clients.value) ? clients.value : []

    if (searchQuery.value) {
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        client.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    }

    return filtered
  })

  const clientsCount = computed(() => filteredClients.value.length)

  // Actions
  const fetchClients = async (params = {}) => {
    loading.value = true
    try {
      const response = await axiosInstance.get('/accounts/clients/', { params });
      // Gérer la pagination Django REST Framework
      if (response.data && response.data.results) {
        clients.value = response.data.results
      } else {
        clients.value = response.data || []
      }
      return clients.value
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchClient = async (id) => {
    try {
      const response = await axiosInstance.get(`/clients/${id}/`);
      currentClient.value = response.data
      return response.data
    } catch (error) {
      console.error('Erreur lors du chargement du client:', error)
      throw error
    }
  }

  const createClient = async (clientData) => {
    try {
      // Pour FormData, supprimer le Content-Type par défaut pour laisser axios le définir avec le boundary
      const config = clientData instanceof FormData
        ? { headers: { 'Content-Type': undefined } }
        : {}
      const response = await axiosInstance.post('/accounts/clients/', clientData, config);
      clients.value.push(response.data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création du client:', error)
      throw error
    }
  }

  const updateClient = async (id, clientData) => {
    try {
      // Pour FormData, supprimer le Content-Type par défaut pour laisser axios le définir avec le boundary
      const config = clientData instanceof FormData
        ? { headers: { 'Content-Type': undefined } }
        : {}
      const response = await axiosInstance.patch(`/accounts/clients/${id}/`, clientData, config);
      const index = clients.value.findIndex(client => client.id === id)
      if (index !== -1) {
        // Utiliser splice pour garantir la réactivité Vue
        clients.value.splice(index, 1, response.data)
      }
      if (currentClient.value?.id === id) {
        currentClient.value = response.data
      }
      return response.data
    } catch (error) {
      console.error('Erreur lors de la modification du client:', error)
      throw error
    }
  }

  const deleteClient = async (id) => {
    try {
      await axiosInstance.delete(`/accounts/clients/${id}/`)
      clients.value = clients.value.filter(client => client.id !== id)
      if (currentClient.value?.id === id) {
        currentClient.value = null
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error)
      throw error
    }
  }

  const getClientSites = async (clientId) => {
    try {
      const response = await axiosInstance.get(`/clients/${clientId}/sites/`);
      // Gérer la pagination Django REST Framework
      if (response.data && response.data.results) {
        return response.data.results
      }
      return response.data || []
    } catch (error) {
      console.error('Erreur lors du chargement des sites du client:', error)
      throw error
    }
  }

  // AI Config & Token Usage
  const aiConfigs = ref({})       // { clientId: configObject }
  const tokenUsage = ref({})      // { clientId: usageObject }
  const allTokenUsage = ref([])   // Array of all clients usage
  const aiConfigLoading = ref(false)

  const fetchClientAIConfig = async (clientId) => {
    try {
      const response = await axiosInstance.get('ai/provider-configs/', { params: { client_id: clientId } })
      const configs = response.data.results || response.data
      aiConfigs.value[clientId] = configs.length > 0 ? configs[0] : null
      return aiConfigs.value[clientId]
    } catch (error) {
      console.error('Erreur chargement config AI:', error)
      return null
    }
  }

  const saveClientAIConfig = async (clientId, configData) => {
    aiConfigLoading.value = true
    try {
      const existing = aiConfigs.value[clientId]
      let response
      if (existing && existing.id) {
        response = await axiosInstance.patch(`ai/provider-configs/${existing.id}/`, {
          ...configData,
          client: clientId
        })
      } else {
        response = await axiosInstance.post('ai/provider-configs/', {
          ...configData,
          client: clientId
        })
      }
      aiConfigs.value[clientId] = response.data
      return response.data
    } catch (error) {
      console.error('Erreur sauvegarde config AI:', error)
      throw error
    } finally {
      aiConfigLoading.value = false
    }
  }

  const fetchClientTokenUsage = async (clientId) => {
    try {
      const response = await axiosInstance.get(`ai/token-usage/${clientId}/`)
      tokenUsage.value[clientId] = response.data
      return response.data
    } catch (error) {
      console.error('Erreur chargement usage tokens:', error)
      return null
    }
  }

  const fetchAllTokenUsage = async () => {
    try {
      const response = await axiosInstance.get('ai/token-usage/')
      allTokenUsage.value = response.data
      // Also update per-client cache
      for (const usage of response.data) {
        tokenUsage.value[usage.client_id] = usage
      }
      return response.data
    } catch (error) {
      console.error('Erreur chargement usage tokens:', error)
      return []
    }
  }

  const setSearchQuery = (query) => {
    searchQuery.value = query
  }

  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    searchQuery.value = ''
    filters.value = {}
  }

  const reset = () => {
    clients.value = []
    currentClient.value = null
    searchQuery.value = ''
    filters.value = {}
    loading.value = false
  }

  return {
    // State
    clients,
    loading,
    currentClient,
    searchQuery,
    filters,
    aiConfigs,
    tokenUsage,
    allTokenUsage,
    aiConfigLoading,

    // Getters
    filteredClients,
    clientsCount,

    // Actions
    fetchClients,
    fetchClient,
    createClient,
    updateClient,
    deleteClient,
    getClientSites,
    fetchClientAIConfig,
    saveClientAIConfig,
    fetchClientTokenUsage,
    fetchAllTokenUsage,
    setSearchQuery,
    setFilters,
    clearFilters,
    reset
  }
}) 