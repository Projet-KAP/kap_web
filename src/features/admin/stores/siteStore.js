import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main'

export const useSiteStore = defineStore('site', () => {
  // State
  const sites = ref([])
  const clients = ref([])
  const loading = ref(false)
  const currentSite = ref(null)
  const searchQuery = ref('')
  const filters = ref({})

  // Getters
  const filteredSites = computed(() => {
    let filtered = Array.isArray(sites.value) ? sites.value : []

    if (searchQuery.value) {
      filtered = filtered.filter(site => 
        site.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        site.address?.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    }

    if (filters.value.client) {
      filtered = filtered.filter(site => site.client?.id === filters.value.client)
    }

    return filtered
  })

  const sitesCount = computed(() => filteredSites.value.length)

  // Actions
  const fetchSites = async (params = {}) => {
    loading.value = true
    try {
      const response = await axiosInstance.get('/accounts/sites/', { params });
      // Gérer la pagination Django REST Framework
      if (response.data && response.data.results) {
        sites.value = response.data.results
      } else {
        sites.value = response.data || []
      }
      return sites.value
    } catch (error) {
      console.error('Erreur lors du chargement des sites:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get('/accounts/clients/');
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
    }
  }

  const fetchSite = async (id) => {
    try {
      const response = await axiosInstance.get(`/sites/${id}/`);
      currentSite.value = response.data
      return response.data
    } catch (error) {
      console.error('Erreur lors du chargement du site:', error)
      throw error
    }
  }

  const createSite = async (siteData) => {
    try {
      const response = await axiosInstance.post('/accounts/sites/', siteData);
      sites.value.push(response.data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création du site:', error)
      throw error
    }
  }

  const updateSite = async (id, siteData) => {
    try {
      const response = await axiosInstance.put(`/sites/${id}/`, siteData);
      const index = sites.value.findIndex(site => site.id === id)
      if (index !== -1) {
        sites.value[index] = response.data
      }
      if (currentSite.value?.id === id) {
        currentSite.value = response.data
      }
      return response.data
    } catch (error) {
      console.error('Erreur lors de la modification du site:', error)
      throw error
    }
  }

  const deleteSite = async (id) => {
    try {
      await axiosInstance.delete(`/sites/${id}/`)
      sites.value = sites.value.filter(site => site.id !== id)
      if (currentSite.value?.id === id) {
        currentSite.value = null
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du site:', error)
      throw error
    }
  }

  const getSiteWorkplaces = async (siteId) => {
    try {
      const response = await axiosInstance.get(`/sites/${siteId}/workplaces/`);
      // Gérer la pagination Django REST Framework
      if (response.data && response.data.results) {
        return response.data.results
      }
      return response.data || []
    } catch (error) {
      console.error('Erreur lors du chargement des lieux de travail du site:', error)
      throw error
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
    sites.value = []
    clients.value = []
    currentSite.value = null
    searchQuery.value = ''
    filters.value = {}
    loading.value = false
  }

  return {
    // State
    sites,
    clients,
    loading,
    currentSite,
    searchQuery,
    filters,
    
    // Getters
    filteredSites,
    sitesCount,
    
    // Actions
    fetchSites,
    fetchClients,
    fetchSite,
    createSite,
    updateSite,
    deleteSite,
    getSiteWorkplaces,
    setSearchQuery,
    setFilters,
    clearFilters,
    reset
  }
}) 