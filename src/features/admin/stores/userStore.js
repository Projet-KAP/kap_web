import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main'

export const useUserStore = defineStore('user', () => {
  // State
  const users = ref([])
  const roles = ref([])
  const clients = ref([])
  const sites = ref([])
  const loading = ref(false)
  const currentUser = ref(null)
  const searchQuery = ref('')
  const filters = ref({})
  const permissions = ref([])

  // Getters
  const filteredUsers = computed(() => {
    let filtered = users.value

    if (searchQuery.value) {
      filtered = filtered.filter(user => 
        user.first_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        user.email_address?.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    }

    if (filters.value.role) {
      filtered = filtered.filter(user => user.role?.id === filters.value.role)
    }

    if (filters.value.site) {
      filtered = filtered.filter(user => user.site?.id === filters.value.site)
    }

    if (filters.value.client) {
      filtered = filtered.filter(user => user.client?.id === filters.value.client)
    }

    return filtered
  })

  const usersCount = computed(() => filteredUsers.value.length)

  // Actions
  const fetchUsers = async (params = {}) => {
    loading.value = true
    try {
      const response = await axiosInstance.get('/accounts/users/', { params });
      if (response.data && response.data.results) {
        users.value = response.data.results
      } else {
        users.value = response.data || []
      }
      return users.value
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchRoles = async () => {
    try {
      // Fetch from available_roles endpoint (merges DB + Keycloak client roles)
      const response = await axiosInstance.get('/accounts/users/available_roles/');
      const data = response.data?.results || response.data || []
      // Normalize: the endpoint returns {id, name, description}
      roles.value = data.map(r => ({
        id: r.id,
        role_name: r.name || r.role_name,
        role_description: r.description || r.role_description || '',
        keycloak_only: r.keycloak_only || false,
      }))
      return roles.value
    } catch (error) {
      // Fallback to standard roles endpoint
      try {
        const response = await axiosInstance.get('/accounts/roles/');
        if (response.data && response.data.results) {
          roles.value = response.data.results
        } else {
          roles.value = response.data || []
        }
        return roles.value
      } catch (fallbackError) {
        throw fallbackError
      }
    }
  }

  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get('/accounts/clients/');
      if (response.data && response.data.results) {
        clients.value = response.data.results
      } else {
        clients.value = response.data || []
      }
      return clients.value
    } catch (error) {
      throw error
    }
  }

  const fetchSites = async () => {
    try {
      const response = await axiosInstance.get('/accounts/sites/');
      if (response.data && response.data.results) {
        sites.value = response.data.results
      } else {
        sites.value = response.data || []
      }
      return sites.value
    } catch (error) {
      throw error
    }
  }

  const fetchUser = async (id) => {
    try {
      const response = await axiosInstance.get(`/accounts/users/${id}/`);
      currentUser.value = response.data
      return response.data
    } catch (error) {
      throw error
    }
  }

  const createUser = async (userData) => {
    try {
      const response = await axiosInstance.post('/accounts/users/', userData);
      users.value.push(response.data)
      return response.data
    } catch (error) {
      throw error
    }
  }

  const updateUser = async (id, userData) => {
    try {
      const response = await axiosInstance.put(`/accounts/users/${id}/`, userData);
      const index = users.value.findIndex(user => user.id === id)
      if (index !== -1) {
        users.value[index] = response.data
      }
      if (currentUser.value?.id === id) {
        currentUser.value = response.data
      }
      return response.data
    } catch (error) {
      throw error
    }
  }

  const deleteUser = async (id) => {
    try {
      await axiosInstance.delete(`/accounts/users/${id}/`)
      users.value = users.value.filter(user => user.id !== id)
      if (currentUser.value?.id === id) {
        currentUser.value = null
      }
    } catch (error) {
      throw error
    }
  }

  const activateUser = async (userId) => {
    try {
      await axiosInstance.post(`/accounts/users/${userId}/activate/`)
      const index = users.value.findIndex(user => user.id === userId)
      if (index !== -1) {
        users.value[index].is_active = true
        if (users.value[index].compte) users.value[index].compte.status = 'ACTIVE'
      }
      return true
    } catch (error) {
      throw error
    }
  }

  const deactivateUser = async (userId) => {
    try {
      await axiosInstance.post(`/accounts/users/${userId}/deactivate/`)
      const index = users.value.findIndex(user => user.id === userId)
      if (index !== -1) {
        users.value[index].is_active = false
        if (users.value[index].compte) users.value[index].compte.status = 'INACTIVE'
      }
      return true
    } catch (error) {
      throw error
    }
  }

  const downloadUsers = async (format = 'csv') => {
    try {
      const response = await axiosInstance.get('/accounts/users/', {
        params: { format },
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `utilisateurs.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
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
    users.value = []
    roles.value = []
    permissions.value = []
    clients.value = []
    sites.value = []
    currentUser.value = null
    searchQuery.value = ''
    filters.value = {}
    loading.value = false
  }

  return {
    // State
    users,
    roles,
    permissions,
    clients,
    sites,
    loading,
    currentUser,
    searchQuery,
    filters,
    
    // Getters
    filteredUsers,
    usersCount,
    
    // Actions
    fetchUsers,
    fetchRoles,
    fetchClients,
    fetchSites,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    activateUser,
    deactivateUser,
    downloadUsers,
    setSearchQuery,
    setFilters,
    clearFilters,
    reset
  }
}) 