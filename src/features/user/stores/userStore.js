import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref(null)
  const users = ref([])
  const roles = ref([])
  const clients = ref([])
  const sites = ref([])
  const workplaces = ref([])
  const machines = ref([])
  const comptes = ref([])
  const userStats = ref(null)
  const compteStats = ref(null)
  const loading = ref(false)
  const requestErrors = ref([])
  const selectedUsers = ref([])
  const searchQuery = ref('')

  // Computed
  const isLoggedIn = computed(() => currentUser.value !== null)
  
  const activeUsers = computed(() => 
    users.value.filter(user => user.compte_id?.status === 'ACTIVE' || user.compte?.status === 'ACTIVE')
  )

  const inactiveUsers = computed(() => 
    users.value.filter(user => user.compte_id?.status === 'INACTIVE' || user.compte?.status === 'INACTIVE')
  )

  const deactivatedUsers = computed(() => 
    users.value.filter(user => user.compte_id?.status === 'DEACTIVATED' || user.compte?.status === 'DEACTIVATED')
  )
  
  const totalUsers = computed(() => users.value.length)
  
  const usersByRole = computed(() => {
    const roleStats = {}
    roles.value.forEach(role => {
      roleStats[role.role_name] = users.value.filter(user => 
        user.role?.role_name === role.role_name || user.role_name === role.role_name
      ).length
    })
    return roleStats
  })

  const usersBySite = computed(() => {
    const siteStats = {}
    sites.value.forEach(site => {
      siteStats[site.name] = users.value.filter(user => 
        user.site?.name === site.name || user.site_name === site.name
      ).length
    })
    return siteStats
  })

  const hasSelectedUsers = computed(() => selectedUsers.value.length > 0)

  // Actions
  const setCurrentUser = (user) => {
    currentUser.value = user
  }

  const clearCurrentUser = () => {
    currentUser.value = null
  }

  const setRequestErrors = (errors) => {
    requestErrors.value = Array.isArray(errors) ? errors : [errors]
  }

  const resetRequestErrors = () => {
    requestErrors.value = []
  }

  const setSelectedUsers = (userIds) => {
    selectedUsers.value = userIds
  }

  const clearSelectedUsers = () => {
    selectedUsers.value = []
  }

  const setSearchQuery = (query) => {
    searchQuery.value = query
  }

  // User CRUD Operations
  const getUsers = async (filters = {}) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      return { success: false, error: 'Non authentifié' }
    }

    loading.value = true
    resetRequestErrors()

    try {
      const params = new URLSearchParams()
      if (filters.role) params.append('role', filters.role)
      if (filters.search) params.append('search', filters.search)
      if (filters.site) params.append('site', filters.site)
      if (filters.client) params.append('client', filters.client)

      const response = await axiosInstance.get(`/accounts/users/?${params.toString()}`);
      const usersData = response.data.users || response.data.results || response.data || []
      const totalCount = response.data.count || usersData.length
      users.value = usersData
      return { success: true, users: usersData, count: totalCount }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des utilisateurs'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  const getUserById = async (userId) => {
    try {
      const response = await axiosInstance.get(`/accounts/users/${userId}/`);
      return { success: true, user: response.data.user || response.data }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Utilisateur non trouvé'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const createUser = async (payload) => {
    loading.value = true
    resetRequestErrors()

    try {
      const response = await axiosInstance.post('/accounts/users/', payload);
      const userData = response.data.user || response.data
      const message = response.data.message || 'Utilisateur créé avec succès'
      users.value.unshift(userData)
      return { success: true, user: userData, message }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.errors || 'Erreur lors de la création de l\'utilisateur'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (userId, payload) => {
    loading.value = true
    resetRequestErrors()

    try {
      const response = await axiosInstance.put(`/accounts/users/${userId}/`, payload);
      const userData = response.data.user || response.data
      const message = response.data.message || 'Utilisateur mis à jour avec succès'
      const index = users.value.findIndex(user => user.id === userId)
      if (index !== -1) {
        users.value[index] = userData
      }
      return { success: true, user: userData, message }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.errors || 'Erreur lors de la mise à jour'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (userId) => {
    loading.value = true
    resetRequestErrors()

    try {
      const response = await axiosInstance.delete(`/accounts/users/${userId}/`);
      const message = response.data.message || 'Utilisateur supprimé avec succès'
      users.value = users.value.filter(user => user.id !== userId)
      return { success: true, message }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la suppression'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      loading.value = false
    }
  }

  const activateUser = async (userId) => {
    try {
      const response = await axiosInstance.post(`/accounts/users/${userId}/activate/`);
      const message = response.data.message || 'Utilisateur activé avec succès'
      const user = users.value.find(u => u.id === userId)
      if (user) {
        user.is_active = true
        if (user.compte) user.compte.status = 'ACTIVE'
      }
      return { success: true, message }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de l\'activation'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const deactivateUser = async (userId) => {
    try {
      const response = await axiosInstance.post(`/accounts/users/${userId}/deactivate/`);
      const message = response.data.message || 'Utilisateur désactivé avec succès'
      const user = users.value.find(u => u.id === userId)
      if (user) {
        user.is_active = false
        if (user.compte) user.compte.status = 'INACTIVE'
      }
      return { success: true, message }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la désactivation'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  // Roles Management
  const getRoles = async () => {
    try {
      const response = await axiosInstance.get('/accounts/roles/');
      const rolesData = response.data?.results || response.data || []
      roles.value = rolesData
      return { success: true, roles: rolesData }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des rôles'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  // Clients & Sites Management
  const getClients = async () => {
    try {
      const response = await axiosInstance.get('/accounts/clients/');
      const clientsData = response.data?.results || response.data || []
      clients.value = clientsData
      return { success: true, clients: clientsData }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des clients'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const getSites = async (clientId = null) => {
    try {
      const url = clientId ? `/sites/?client=${clientId}` : '/accounts/sites/'
      const response = await axiosInstance.get(url);
      if (response.data) {
        const sitesData = response.data?.results || response.data || []
        sites.value = sitesData
        return { success: true, sites: sitesData }
      }
      return { success: false, error: 'Pas de données reçues' }
    } catch (err) {
      setRequestErrors('Erreur lors du chargement des sites')
      return { success: false, error: 'Erreur lors du chargement des sites' }
    }
  }

  const getWorkplaces = async () => {
    try {
      const response = await axiosInstance.get('/accounts/workplaces/');
      if (response.data?.success) {
        const workplacesData = response.data.data || []
        workplaces.value = workplacesData
        return { success: true, workplaces: workplacesData }
      }
      return { success: false, error: 'Pas de données reçues' }
    } catch (err) {
      setRequestErrors('Erreur lors du chargement des postes')
      return { success: false, error: 'Erreur lors du chargement des postes' }
    }
  }

  const getMachines = async () => {
    try {
      const response = await axiosInstance.get('/engins/machines/');
      if (response.data) {
        // Handle different response formats
        const machinesData = response.data?.success 
          ? (response.data.data || [])
          : (response.data?.results || response.data?.data || (Array.isArray(response.data) ? response.data : []))
        
        if (Array.isArray(machinesData)) {
        machines.value = machinesData
        return { success: true, machines: machinesData }
        }
      }
      return { success: false, error: 'Pas de données reçues' }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Erreur lors du chargement des machines'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const createMachine = async (machineData) => {
    try {
      const response = await axiosInstance.post('/engins/machines/', machineData);
      if (response.data?.success) {
        await getMachines()
        return { success: true, data: response.data.data }
      }
      return { success: false, error: 'Erreur lors de la création de la machine' }
    } catch (err) {
      return { success: false, error: err.response?.data?.errors || 'Erreur lors de la création de la machine' }
    }
  }

  const updateMachine = async (id, machineData) => {
    try {
      const response = await axiosInstance.put(`/machines/${id}/`, machineData);
      if (response.data?.success) {
        await getMachines()
        return { success: true, data: response.data.data }
      }
      return { success: false, error: 'Erreur lors de la modification de la machine' }
    } catch (err) {
      return { success: false, error: err.response?.data?.errors || 'Erreur lors de la modification de la machine' }
    }
  }

  const deleteMachine = async (id) => {
    try {
      const response = await axiosInstance.delete(`/machines/${id}/`);
      if (response.data?.success) {
        await getMachines()
        return { success: true }
      }
      return { success: false, error: 'Erreur lors de la suppression de la machine' }
    } catch (err) {
      return { success: false, error: 'Erreur lors de la suppression de la machine' }
    }
  }

  const createWorkplace = async (workplaceData) => {
    try {
      const response = await axiosInstance.post('/accounts/workplaces/', workplaceData);
      if (response.data?.success) {
        await getWorkplaces()
        return { success: true, data: response.data.data }
      }
      return { success: false, error: 'Erreur lors de la création du workplace' }
    } catch (err) {
      return { success: false, error: err.response?.data?.errors || 'Erreur lors de la création du workplace' }
    }
  }

  const updateWorkplace = async (id, workplaceData) => {
    try {
      const response = await axiosInstance.put(`/accounts/workplaces/${id}/`, workplaceData);
      if (response.data?.success) {
        await getWorkplaces()
        return { success: true, data: response.data.data }
      }
      return { success: false, error: 'Erreur lors de la modification du workplace' }
    } catch (err) {
      return { success: false, error: err.response?.data?.errors || 'Erreur lors de la modification du workplace' }
    }
  }

  const deleteWorkplace = async (id) => {
    try {
      const response = await axiosInstance.delete(`/accounts/workplaces/${id}/`);
      if (response.data?.success) {
        await getWorkplaces()
        return { success: true }
      }
      return { success: false, error: 'Erreur lors de la suppression du workplace' }
    } catch (err) {
      return { success: false, error: 'Erreur lors de la suppression du workplace' }
    }
  }

  // Comptes Management
  const getComptes = async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)

      const response = await axiosInstance.get(`/comptes/?${params.toString()}`);
      const comptesData = response.data.comptes || response.data || []
      const totalCount = response.data.count || comptesData.length
      comptes.value = comptesData
      return { success: true, comptes: comptesData, count: totalCount }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des comptes'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const activateCompte = async (compteId) => {
    try {
      const response = await axiosInstance.post(`/comptes/${compteId}/activate/`);
      const message = response.data.message || 'Compte activé avec succès'
      const compte = comptes.value.find(c => c.id === compteId)
      if (compte) {
        compte.status = 'Actif'
      }
      return { success: true, message }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de l\'activation du compte'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const deactivateCompte = async (compteId) => {
    try {
      const response = await axiosInstance.post(`/comptes/${compteId}/deactivate/`);
      const message = response.data.message || 'Compte désactivé avec succès'
      const compte = comptes.value.find(c => c.id === compteId)
      if (compte) {
        compte.status = 'Desactivated'
      }
      return { success: true, message }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la désactivation du compte'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const resetPassword = async (compteId, newPassword = null) => {
    try {
      const payload = newPassword ? { new_password: newPassword } : {}
      const response = await axiosInstance.post(`/comptes/${compteId}/reset_password/`, payload);
      const message = response.data.message || 'Mot de passe réinitialisé avec succès'
      return { success: true, message }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la réinitialisation du mot de passe'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const bulkUpdateStatus = async (compteIds, status) => {
    try {
      const response = await axiosInstance.post('/comptes/bulk_status_update/', {
        compte_ids: compteIds,
        status: status
      })
      const message = response.data.message || `${compteIds.length} compte(s) mis à jour`
      compteIds.forEach(id => {
        const compte = comptes.value.find(c => c.id === id)
        if (compte) {
          compte.status = status
        }
      })
      return { success: true, message }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la mise à jour en lot'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  // Statistics
  const getUserStats = async () => {
    try {
      const response = await axiosInstance.get('/accounts/users/stats/');
      const statsData = response.data.stats || response.data
      userStats.value = statsData
      return { success: true, stats: statsData }
    } catch (err) {
      // Retourner des stats vides en cas d'erreur (404, 401, 403, etc.) sans logger
      userStats.value = { total: 0, active: 0, inactive: 0 }
      return { success: true, stats: userStats.value }
    }
  }

  const getCompteStats = async () => {
    try {
      const response = await axiosInstance.get('/accounts/comptes/stats/');
      const statsData = response.data.stats || response.data
      compteStats.value = statsData
      return { success: true, stats: statsData }
    } catch (err) {
      // Ne pas afficher d'erreur si l'endpoint n'existe pas (404)
      // Retourner des stats vides silencieusement
      if (err.response?.status === 404) {
        compteStats.value = {
          total_comptes: 0,
          active_comptes: 0,
          inactive_comptes: 0,
          deactivated_comptes: 0,
          comptes_with_users: 0,
          comptes_without_users: 0
        }
        return { success: true, stats: compteStats.value }
      }
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des statistiques des comptes'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  // Current User Management
  const getCurrentUser = async () => {
    try {
      const response = await axiosInstance.get('/accounts/users/me/');
      currentUser.value = response.data
      return { success: true, user: response.data }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement du profil utilisateur'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const updateCurrentUser = async (userData) => {
    try {
      const response = await axiosInstance.patch('/accounts/users/me/', userData);
      currentUser.value = response.data
      return { success: true, user: response.data, message: 'Profil mis à jour avec succès' }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la mise à jour du profil'
      setRequestErrors(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  // Initialize data
  const initializeUserData = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      return
    }
    
    loading.value = true
    try {
      await Promise.all([
        getRoles(),
        fetchPermissions(),
        getClients(),
        getSites(),
        getUserStats(),
        getCompteStats()
      ])
    } catch (err) {
    } finally {
      loading.value = false
    }
  }

  const loadCurrentUser = async () => {
    try {
      const response = await axiosInstance.get('/accounts/users/me/');
      currentUser.value = response.data
      return response.data
    } catch (err) {
      throw err
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await axiosInstance.patch('/accounts/users/me/', profileData);
      currentUser.value = response.data
      return response.data
    } catch (err) {
      throw err
    }
  }

  const changePassword = async (passwordData) => {
    try {
      const response = await axiosInstance.post('/auth/change-password/', passwordData);
      return response.data
    } catch (err) {
      throw err
    }
  }

  const updatePreferences = async (preferencesData) => {
    try {
      const response = await axiosInstance.put('/accounts/users/preferences/', preferencesData);
      return response.data
    } catch (err) {
      throw err
    }
  }

  const loadPreferences = async () => {
    try {
      const response = await axiosInstance.get('/accounts/users/preferences/');
      return response.data
    } catch (err) {
      throw err
    }
  }

  return {
    // State
    currentUser,
    users,
    roles,
    clients,
    sites,
    workplaces,
    machines,
    comptes,
    userStats,
    compteStats,
    loading,
    requestErrors,
    selectedUsers,
    searchQuery,

    // Computed
    isLoggedIn,
    activeUsers,
    inactiveUsers,
    deactivatedUsers,
    totalUsers,
    usersByRole,
    usersBySite,
    hasSelectedUsers,

    // Actions
    setCurrentUser,
    clearCurrentUser,
    setRequestErrors,
    resetRequestErrors,
    setSelectedUsers,
    clearSelectedUsers,
    setSearchQuery,

    // User CRUD
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    activateUser,
    deactivateUser,

    // Roles
    getRoles,
    
    // Clients & Sites
    getClients,
    getSites,
    getWorkplaces,
    createWorkplace,
    updateWorkplace,
    deleteWorkplace,
    getMachines,
    createMachine,
    updateMachine,
    deleteMachine,
    
    // Comptes
    getComptes,
    activateCompte,
    deactivateCompte,
    resetPassword,
    bulkUpdateStatus,
    
    // Statistics
    getUserStats,
    getCompteStats,
    
    // Current User
    getCurrentUser,
    updateCurrentUser,
    
    // Initialize
    initializeUserData,
    loadCurrentUser,
    updateProfile,
    changePassword,
    updatePreferences,
    loadPreferences
  }
})
