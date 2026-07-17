import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'

export const useDocumentStore = defineStore('document', () => {
  // State
  const modeles = ref([])
  const instances = ref([])
  const workorders = ref([])
  const fields = ref([])
  const notifications = ref([])
  const stats = ref(null)
  const loading = ref(false)
  const requestErrors = ref([])
  const selectedModeles = ref([])
  const selectedInstances = ref([])
  const instancesPagination = ref({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false
  })

  // Cache pour les modèles (évite de recharger à chaque ouverture)
  const modelesCache = ref(new Map())

  // Getters
  const activeModeles = computed(() => 
    modeles.value.filter(m => m.status === 'ACTIVE')
  )
  
  const draftModeles = computed(() => 
    modeles.value.filter(m => m.status === 'DRAFT')
  )
  
  const pendingInstances = computed(() => 
    instances.value.filter(i => i.status === 'SUBMITTED')
  )
  
  const overdueInstances = computed(() => 
    instances.value.filter(i => i.is_overdue)
  )

  // Actions
  const setRequestErrors = (errors) => {
    requestErrors.value = Array.isArray(errors) ? errors : [errors]
  }

  const resetRequestErrors = () => {
    requestErrors.value = []
  }

  const setSelectedModeles = (selected) => {
    selectedModeles.value = selected
  }

  const setSelectedInstances = (selected) => {
    selectedInstances.value = selected
  }

  const clearModelesCache = () => {
    modelesCache.value.clear()
    console.log('🗑️ Cache des modèles vidé')
  }

  // API Calls - Modeles (Gabarits)
  const getModeles = async (filters = {}, light = false) => {
    try {
      loading.value = true
      resetRequestErrors()

      // Add light parameter for faster loading (dropdowns)
      if (light) {
        filters.light = 'true'
      }
      const params = new URLSearchParams(filters)
      const response = await axiosInstance.get(`/documents/modeles/?${params}`)
      
      if (response.data.success) {
        modeles.value = response.data.data
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors du chargement des gabarits')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error fetching modeles:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors du chargement des gabarits')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const getModele = async (modeleId) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.get(`/documents/modeles/${modeleId}/`)
      
      if (response.data.success) {
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors du chargement du gabarit')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error fetching modele:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors du chargement du gabarit')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const createModele = async (modeleData) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.post('/documents/modeles/', modeleData)
      
      if (response.data.success) {
        modeles.value.unshift(response.data.data)
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la création du gabarit')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error creating modele:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la création du gabarit')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const getModeleById = async (modeleId, useCache = true) => {
    try {
      // Vérifier le cache d'abord
      if (useCache && modelesCache.value.has(modeleId)) {
        console.log(`📦 Cache hit pour modèle ${modeleId}`)
        return { success: true, data: modelesCache.value.get(modeleId) }
      }

      loading.value = true
      resetRequestErrors()

      const response = await axiosInstance.get(`/documents/modeles/${modeleId}/`)

      if (response.data.success) {
        // Mettre en cache
        modelesCache.value.set(modeleId, response.data.data)
        console.log(`💾 Modèle ${modeleId} mis en cache`)
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la récupération du gabarit')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error fetching modele:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la récupération du gabarit')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const updateModele = async (modeleId, modeleData) => {
    try {
      loading.value = true
      resetRequestErrors()

      const response = await axiosInstance.put(`/documents/modeles/${modeleId}/`, modeleData)

      if (response.data.success) {
        const index = modeles.value.findIndex(m => m.id === modeleId)
        if (index !== -1) {
          modeles.value[index] = response.data.data
        }
        // Invalider le cache pour ce modèle
        modelesCache.value.delete(modeleId)
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la mise à jour du gabarit')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error updating modele:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la mise à jour du gabarit')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const deleteModele = async (modeleId) => {
    try {
      loading.value = true
      resetRequestErrors()

      const response = await axiosInstance.delete(`/documents/modeles/${modeleId}/`)

      if (response.data.success) {
        modeles.value = modeles.value.filter(m => m.id !== modeleId)
        // Invalider le cache pour ce modèle
        modelesCache.value.delete(modeleId)
        return { success: true }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la suppression du gabarit')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error deleting modele:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la suppression du gabarit')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const publishModele = async (modeleId) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.post(`/documents/modeles/${modeleId}/publish/`)
      
      if (response.data.success) {
        const index = modeles.value.findIndex(m => m.id === modeleId)
        if (index !== -1) {
          modeles.value[index] = response.data.data
        }
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la publication du gabarit')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error publishing modele:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la publication du gabarit')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const archiveModele = async (modeleId) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.post(`/documents/modeles/${modeleId}/archive/`)
      
      if (response.data.success) {
        const index = modeles.value.findIndex(m => m.id === modeleId)
        if (index !== -1) {
          modeles.value[index] = response.data.data
        }
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de l\'archivage du gabarit')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error archiving modele:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de l\'archivage du gabarit')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // API Calls - Instances
  const getInstances = async (filters = {}, append = false) => {
    try {
      loading.value = true
      resetRequestErrors()

      // Default pagination
      if (!filters.page) filters.page = 1
      if (!filters.page_size) filters.page_size = 20

      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value)
        }
      })
      const response = await axiosInstance.get(`/documents/instances/?${params}`)

      if (response.data.success) {
        if (append && filters.page > 1) {
          // Append for infinite scroll
          instances.value = [...instances.value, ...response.data.data]
        } else {
          instances.value = response.data.data
        }
        // Update pagination
        if (response.data.pagination) {
          instancesPagination.value = response.data.pagination
        }
        return { success: true, data: response.data.data, pagination: response.data.pagination }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors du chargement des instances')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error fetching instances:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors du chargement des instances')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const loadMoreInstances = async (filters = {}) => {
    if (!instancesPagination.value.has_next || loading.value) return { success: false }
    const nextPage = instancesPagination.value.page + 1
    return getInstances({ ...filters, page: nextPage }, true)
  }

  const getInstance = async (instanceId) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.get(`/documents/instances/${instanceId}/`)
      
      if (response.data.success) {
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors du chargement de l\'instance')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error fetching instance:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors du chargement de l\'instance')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const getWorkorders = async (filters = {}) => {
    try {
      loading.value = true
      resetRequestErrors()

      const params = new URLSearchParams(filters)
      const response = await axiosInstance.get(`/engins/work-orders/?${params}`)
      
      if (response.data.success) {
        workorders.value = response.data.data
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors du chargement des ordres de fabrication')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error fetching workorders:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors du chargement des ordres de fabrication')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const createInstance = async (instanceData) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.post('/documents/instances/', instanceData)
      
      if (response.data.success) {
        instances.value.unshift(response.data.data)
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la création de l\'instance')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error creating instance:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la création de l\'instance')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const updateInstance = async (instanceId, instanceData) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.put(`/documents/instances/${instanceId}/`, instanceData)
      
      if (response.data.success) {
        const index = instances.value.findIndex(i => i.id === instanceId)
        if (index !== -1) {
          instances.value[index] = response.data.data
        }
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la mise à jour de l\'instance')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error updating instance:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la mise à jour de l\'instance')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const submitInstance = async (instanceId) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.post(`/documents/instances/${instanceId}/submit/`)
      
      if (response.data.success) {
        const index = instances.value.findIndex(i => i.id === instanceId)
        if (index !== -1) {
          instances.value[index] = response.data.data
        }
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la soumission de l\'instance')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error submitting instance:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la soumission de l\'instance')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const validateInstance = async (instanceId) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.post(`/documents/instances/${instanceId}/validate/`)
      
      if (response.data.success) {
        const index = instances.value.findIndex(i => i.id === instanceId)
        if (index !== -1) {
          instances.value[index] = response.data.data
        }
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la validation de l\'instance')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error validating instance:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la validation de l\'instance')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const deleteInstance = async (instanceId) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.delete(`/documents/instances/${instanceId}/`)
      
      if (response.data.success) {
        instances.value = instances.value.filter(i => i.id !== instanceId)
        return { success: true }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la suppression du rapport')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error deleting instance:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la suppression du rapport')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const rejectInstance = async (instanceId, comment) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.post(`/documents/instances/${instanceId}/reject/`, { comment })
      
      if (response.data.success) {
        const index = instances.value.findIndex(i => i.id === instanceId)
        if (index !== -1) {
          instances.value[index] = response.data.data
        }
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors du rejet de l\'instance')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error rejecting instance:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors du rejet de l\'instance')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // API Calls - Fields
  const getFields = async (modeleId) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.get(`/documents/modeles/${modeleId}/fields/`)
      
      if (response.data.success) {
        fields.value = response.data.data
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors du chargement des champs')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error fetching fields:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors du chargement des champs')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const createField = async (modeleId, fieldData) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.post(`/documents/modeles/${modeleId}/fields/`, fieldData)
      
      if (response.data.success) {
        fields.value.push(response.data.data)
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la création du champ')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error creating field:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la création du champ')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const updateField = async (modeleId, fieldId, fieldData) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.put(`/documents/modeles/${modeleId}/fields/${fieldId}/`, fieldData)
      
      if (response.data.success) {
        const index = fields.value.findIndex(f => f.id === fieldId)
        if (index !== -1) {
          fields.value[index] = response.data.data
        }
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la mise à jour du champ')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error updating field:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la mise à jour du champ')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const deleteField = async (modeleId, fieldId) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.delete(`/documents/modeles/${modeleId}/fields/${fieldId}/`)
      
      if (response.data.success) {
        fields.value = fields.value.filter(f => f.id !== fieldId)
        return { success: true }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la suppression du champ')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error deleting field:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la suppression du champ')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // API Calls - Statistics
  const getStats = async (siteId = null) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const params = siteId ? `?site_id=${siteId}` : ''
      const response = await axiosInstance.get(`/documents/stats/${params}`)
      
      if (response.data.success) {
        stats.value = response.data.stats
        return { success: true, data: response.data.stats }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors du chargement des statistiques')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors du chargement des statistiques')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  // API Calls - Mes Tâches (Opérateurs)
  const getMyTasks = async (filters = {}) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const params = new URLSearchParams(filters)
      const response = await axiosInstance.get(`/documents/mes-taches/?${params}`)
      
      if (response.data.success) {
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors du chargement de vos tâches')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error fetching my tasks:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors du chargement de vos tâches')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const getMyTasksStats = async () => {
    try {
      loading.value = true
      resetRequestErrors()
      
      const response = await axiosInstance.get('/documents/mes-taches/stats/')
      
      if (response.data.success) {
        return { success: true, data: response.data.stats }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors du chargement des statistiques')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error fetching my tasks stats:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors du chargement des statistiques')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const updateTask = async (taskId, taskData) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      
      const response = await axiosInstance.patch(`/documents/mes-taches/${taskId}/`, taskData)
      
      if (response.data.success) {
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la mise à jour de la tâche')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error updating task:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la mise à jour de la tâche')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  const submitTask = async (taskId) => {
    try {
      loading.value = true
      resetRequestErrors()
      
      
      const response = await axiosInstance.post(`/documents/mes-taches/${taskId}/submit/`)
      
      if (response.data.success) {
        return { success: true, data: response.data.data }
      } else {
        setRequestErrors(response.data.message || 'Erreur lors de la soumission de la tâche')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Error submitting task:', error)
      setRequestErrors(error.response?.data?.message || 'Erreur lors de la soumission de la tâche')
      return { success: false, error: error.response?.data?.message }
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    modeles,
    instances,
    workorders,
    fields,
    notifications,
    stats,
    loading,
    requestErrors,
    selectedModeles,
    selectedInstances,
    instancesPagination,

    // Getters
    activeModeles,
    draftModeles,
    pendingInstances,
    overdueInstances,

    // Actions
    setRequestErrors,
    resetRequestErrors,
    setSelectedModeles,
    setSelectedInstances,
    clearModelesCache,

    // API Calls - Modeles
    getModeles,
    getModele,
    getModeleById,
    createModele,
    updateModele,
    deleteModele,
    publishModele,
    archiveModele,

    // API Calls - Instances
    getInstances,
    loadMoreInstances,
    getInstance,
    createInstance,
    updateInstance,
    submitInstance,
    validateInstance,
    deleteInstance,
    rejectInstance,
    
    // API Calls - Workorders
    getWorkorders,
    
    // API Calls - Fields
    getFields,
    createField,
    updateField,
    deleteField,
    
    // API Calls - Statistics
    getStats,
    
    // API Calls - Mes Tâches
    getMyTasks,
    getMyTasksStats,
    updateTask,
    submitTask
  }
}) 