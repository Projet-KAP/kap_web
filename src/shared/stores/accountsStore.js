import { defineStore } from 'pinia'
import { ref } from 'vue'
import { axiosInstance } from '@/main.js'

export const useAccountsStore = defineStore('accounts', () => {
  const sites = ref([])
  const workplaces = ref([])
  const clients = ref([])
  const loading = ref(false)
  const error = ref(null)

  const loadSites = async (filters = {}) => {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams(filters).toString()
      const url = params ? `/accounts/sites/?${params}` : '/accounts/sites/'
      const response = await axiosInstance.get(url)
      sites.value = response.data || []
      return sites.value
    } catch (err) {

      error.value = err.message
      sites.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  const getSiteById = async (siteId) => {
    try {
      const response = await axiosInstance.get(`/accounts/sites/${siteId}/`)
      return response.data
    } catch (err) {

      throw err
    }
  }

  const loadWorkplaces = async (filters = {}) => {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams(filters).toString()
      const url = params ? `/accounts/workplaces/?${params}` : '/accounts/workplaces/'
      const response = await axiosInstance.get(url)
      workplaces.value = response.data?.data || response.data?.results || response.data || []
      return workplaces.value
    } catch (err) {

      error.value = err.message
      workplaces.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  const getWorkplaceById = async (workplaceId) => {
    try {
      const response = await axiosInstance.get(`/accounts/workplaces/${workplaceId}/`)
      return response.data
    } catch (err) {

      throw err
    }
  }

  const loadClients = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/accounts/clients/')
      clients.value = response.data || []
      return clients.value
    } catch (err) {

      error.value = err.message
      clients.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  const createSite = async (siteData) => {
    try {
      const response = await axiosInstance.post('/accounts/sites/', siteData)
      sites.value.push(response.data)
      return response.data
    } catch (err) {

      throw err
    }
  }

  const updateSite = async (siteId, siteData) => {
    try {
      const response = await axiosInstance.patch(`/accounts/sites/${siteId}/`, siteData)
      const index = sites.value.findIndex(s => s.id === siteId)
      if (index !== -1) {
        sites.value[index] = response.data
      }
      return response.data
    } catch (err) {

      throw err
    }
  }

  const createWorkplace = async (workplaceData) => {
    try {
      const response = await axiosInstance.post('/accounts/workplaces/', workplaceData)
      workplaces.value.push(response.data)
      return response.data
    } catch (err) {

      throw err
    }
  }

  const updateWorkplace = async (workplaceId, workplaceData) => {
    try {
      const response = await axiosInstance.patch(`/accounts/workplaces/${workplaceId}/`, workplaceData)
      const index = workplaces.value.findIndex(w => w.id === workplaceId)
      if (index !== -1) {
        workplaces.value[index] = response.data
      }
      return response.data
    } catch (err) {

      throw err
    }
  }

  return {
    sites,
    workplaces,
    clients,
    loading,
    error,
    loadSites,
    getSiteById,
    loadWorkplaces,
    getWorkplaceById,
    loadClients,
    createSite,
    updateSite,
    createWorkplace,
    updateWorkplace
  }
})
