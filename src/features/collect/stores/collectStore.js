import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'
import { useAuthStore } from '@/features/auth/stores/authStore.js'

// Pas besoin de définir API_BASE_URL car axiosInstance a déjà sa baseURL configurée
// On utilisera directement les endpoints relatifs

export const useCollectStore = defineStore('collect', () => {
  // Get auth store
  const authStore = useAuthStore()

  // State
  const collects = ref([])
  const templates = ref([])
  const columnTags = ref([])
  const reports = ref([])
  const currentCollect = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const getErrorMessage = (err, fallback) => {
    const data = err.response?.data
    if (!data) return fallback
    if (typeof data === 'string') return data
    if (data.message) return data.message
    if (data.error) return data.error
    if (data.detail) return data.detail
    const firstValue = Object.values(data)[0]
    if (Array.isArray(firstValue)) return firstValue.join(', ')
    if (typeof firstValue === 'string') return firstValue
    return fallback
  }

  // Computed
  const activeCollects = computed(() => 
    collects.value.filter(collect => collect.status === 'en_cours')
  )

  const plannedCollects = computed(() => 
    collects.value.filter(collect => collect.status === 'planifiee')
  )

  const completedCollects = computed(() => 
    collects.value.filter(collect => collect.status === 'terminee')
  )

  const totalCollects = computed(() => collects.value.length)

  const urgentCollects = computed(() => 
    collects.value.filter(collect => collect.priority === 'urgent' && collect.status !== 'terminee')
  )

  const collectsByType = computed(() => {
    const types = {}
    collects.value.forEach(collect => {
      if (!types[collect.type]) {
        types[collect.type] = 0
      }
      types[collect.type]++
    })
    return types
  })

  const averageProgress = computed(() => {
    if (collects.value.length === 0) return 0
    const total = collects.value.reduce((sum, collect) => sum + collect.progress, 0)
    return Math.round(total / collects.value.length)
  })

  // Actions
  const loadCollects = async (filters = {}) => {
    if (!authStore.getIsAuthenticated) {
      error.value = 'Utilisateur non authentifié'
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get('/collect/collects/', { params: filters });
      collects.value = response.data.results || response.data
    } catch (err) {
      error.value = getErrorMessage(err, 'Erreur lors du chargement des collectes')
    } finally {
      loading.value = false
    }
  }

  const getCollectById = async (collectId) => {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get(`/collect/collects/${collectId}/`);
      currentCollect.value = response.data
      return response.data
    } catch (err) {
      error.value = getErrorMessage(err, 'Collecte non trouvée')
      return null
    } finally {
      loading.value = false
    }
  }

  const createCollect = async (collectData) => {
    loading.value = true
    error.value = null

    try {
      let payload = collectData
      const config = {}
      const hasUpload = collectData && (collectData.attachments || collectData.files)

      if (hasUpload) {
        const formData = new FormData()
        Object.entries(collectData).forEach(([key, value]) => {
          if (value === undefined || value === null) return

          if (key === 'attachments' && Array.isArray(value)) {
            value.forEach((file) => {
              if (file instanceof File) formData.append('attachments', file)
            })
            return
          }

          if (Array.isArray(value)) {
            value.forEach((item) => formData.append(`${key}[]`, item))
            return
          }

          if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) {
            formData.append(key, JSON.stringify(value))
            return
          }

          formData.append(key, value)
        })
        payload = formData
        config.headers = { 'Content-Type': 'multipart/form-data' }
      }

      const response = await axiosInstance.post('/collect/collects/', payload, config)
      collects.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = getErrorMessage(err, 'Erreur lors de la création de la collecte')
      return null
    } finally {
      loading.value = false
    }
  }

  const updateCollect = async (collectId, updateData) => {
    loading.value = true
    error.value = null

    try {
      let payload = updateData
      const config = {}
      const hasUpload = updateData && (updateData.attachments || updateData.files)

      if (hasUpload) {
        const formData = new FormData()
        Object.entries(updateData).forEach(([key, value]) => {
          if (value === undefined || value === null) return

          if (key === 'attachments' && Array.isArray(value)) {
            value.forEach((file) => {
              if (file instanceof File) formData.append('attachments', file)
            })
            return
          }

          if (Array.isArray(value)) {
            value.forEach((item) => formData.append(`${key}[]`, item))
            return
          }

          if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) {
            formData.append(key, JSON.stringify(value))
            return
          }

          formData.append(key, value)
        })
        payload = formData
        config.headers = { 'Content-Type': 'multipart/form-data' }
      }

      const response = await axiosInstance.patch(`/collect/collects/${collectId}/`, payload, config);
      const index = collects.value.findIndex(c => c.id === parseInt(collectId))
      if (index !== -1) {
        collects.value[index] = response.data
      }
      
      if (currentCollect.value && currentCollect.value.id === parseInt(collectId)) {
        currentCollect.value = response.data
      }
      
      return response.data
    } catch (err) {
      error.value = getErrorMessage(err, 'Erreur lors de la mise à jour de la collecte')
      return null
    } finally {
      loading.value = false
    }
  }

  const startCollect = async (collectId) => {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.post(`/collect/collects/${collectId}/start/`);
      const index = collects.value.findIndex(c => c.id === parseInt(collectId))
      if (index !== -1) {
        collects.value[index] = response.data
      }
      
      if (currentCollect.value && currentCollect.value.id === parseInt(collectId)) {
        currentCollect.value = response.data
      }
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du démarrage de la collecte'
      return null
    } finally {
      loading.value = false
    }
  }

  const completeCollect = async (collectId) => {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.post(`/collect/collects/${collectId}/complete/`);
      const index = collects.value.findIndex(c => c.id === parseInt(collectId))
      if (index !== -1) {
        collects.value[index] = response.data
      }
      
      if (currentCollect.value && currentCollect.value.id === parseInt(collectId)) {
        currentCollect.value = response.data
      }
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la finalisation de la collecte'
      return null
    } finally {
      loading.value = false
    }
  }

  const validateCollect = async (collectId, payload = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.post(`/collect/collects/${collectId}/validate/`, payload)
      const index = collects.value.findIndex(c => c.id === parseInt(collectId))
      if (index !== -1) {
        collects.value[index] = response.data
      }
      if (currentCollect.value && currentCollect.value.id === parseInt(collectId)) {
        currentCollect.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = getErrorMessage(err, 'Erreur lors de la validation de la collecte')
      return null
    } finally {
      loading.value = false
    }
  }

  const shareCollect = async (collectId, recipients = [], message = '') => {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.post(`/collect/collects/${collectId}/share/`, {
        recipients,
        message
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du partage de la collecte'
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteCollect = async (collectId) => {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.delete(`/collect/collects/${collectId}/`)
      collects.value = collects.value.filter(c => c.id !== parseInt(collectId))
      if (currentCollect.value && currentCollect.value.id === parseInt(collectId)) {
        currentCollect.value = null
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression de la collecte'
      return null
    } finally {
      loading.value = false
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await axiosInstance.get('/collect/templates/');
      templates.value = response.data.results || response.data
    } catch (err) {
    }
  }

  const loadReports = async (collectId = null) => {
    try {
      const url = collectId 
        ? `/collect/collects/${collectId}/reports/`
        : '/documents/reports/'
      const response = await axiosInstance.get(url);
      reports.value = response.data.results || response.data
    } catch (err) {
    }
  }

  const generateReport = async (collectId) => {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.post(`/collect/collects/${collectId}/generate_report/`);
      reports.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la génération du rapport'
      return null
    } finally {
      loading.value = false
    }
  }

  const getCollectsByStatus = (status) => {
    return collects.value.filter(collect => collect.status === status)
  }

  const getCollectsByType = (type) => {
    return collects.value.filter(collect => collect.type === type)
  }

  const getCollectsByAssignee = (assignee) => {
    return collects.value.filter(collect => collect.assigned_to === assignee)
  }

  const searchCollects = (searchTerm) => {
    if (!searchTerm) return collects.value
    
    const term = searchTerm.toLowerCase()
    return collects.value.filter(collect => 
      collect.title.toLowerCase().includes(term) ||
      collect.description.toLowerCase().includes(term) ||
      collect.assigned_to.toLowerCase().includes(term) ||
      collect.location.toLowerCase().includes(term)
    )
  }

  const clearCurrentCollect = () => {
    currentCollect.value = null
  }

  const clearError = () => {
    error.value = null
  }

  const loadColumnTags = async () => {
    try {
      const response = await axiosInstance.get('/collect/mes-tags/');
      columnTags.value = response.data.results || response.data
    } catch (err) {
    }
  }

  const clearData = () => {
    collects.value = []
    currentCollect.value = null
    templates.value = []
    reports.value = []
    columnTags.value = []
    error.value = null
  }

  const importExcelData = async (collectId, excelData) => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', excelData)
      
      const response = await axiosInstance.post(
        `/collect/collects/${collectId}/import_excel/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      
      // Mettre à jour la collecte dans la liste
      const index = collects.value.findIndex(c => c.id === parseInt(collectId))
      if (index !== -1) {
        collects.value[index] = response.data.collect || response.data
      }
      
      // Mettre à jour la collecte courante si c'est la même
      if (currentCollect.value && currentCollect.value.id === parseInt(collectId)) {
        currentCollect.value = response.data.collect || response.data
      }
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de l\'import des données Excel'
      return null
    } finally {
      loading.value = false
    }
  }

  const importCSVData = async (collectId, csvData) => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', csvData)
      
      const response = await axiosInstance.post(
        `/collect/collects/${collectId}/import_csv/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      
      // Mettre à jour la collecte dans la liste
      const index = collects.value.findIndex(c => c.id === parseInt(collectId))
      if (index !== -1) {
        // Recharger la collecte pour avoir les données à jour
        const updatedCollect = await getCollectById(collectId);
        if (updatedCollect) {
          collects.value[index] = updatedCollect
        }
      }
      
      // Mettre à jour la collecte courante si c'est la même
      if (currentCollect.value && currentCollect.value.id === parseInt(collectId)) {
        const updatedCollect = await getCollectById(collectId);
        if (updatedCollect) {
          currentCollect.value = updatedCollect
        }
      }
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de l\'import des données CSV'
      return null
    } finally {
      loading.value = false
    }
  }

  const getImportedData = async (collectId) => {
    try {
      const response = await axiosInstance.get(`/collect/collects/${collectId}/data/`);
      return response.data.results || response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des données importées'
      return null
    }
  }

  const deleteImportedData = async (collectId) => {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.delete(`/collect/collects/${collectId}/data/`);
      
      // Mettre à jour la collecte dans la liste
      const index = collects.value.findIndex(c => c.id === parseInt(collectId))
      if (index !== -1) {
        // Recharger la collecte pour avoir les données à jour
        const updatedCollect = await getCollectById(collectId);
        if (updatedCollect) {
          collects.value[index] = updatedCollect
        }
      }
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression des données importées'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    collects,
    currentCollect,
    templates,
    columnTags,
    reports,
    loading,
    error,

    // Computed
    activeCollects,
    plannedCollects,
    completedCollects,
    totalCollects,
    urgentCollects,
    collectsByType,
    averageProgress,

    // Actions
    loadCollects,
    getCollectById,
    createCollect,
    updateCollect,
    startCollect,
    completeCollect,
    validateCollect,
    shareCollect,
    deleteCollect,
    loadTemplates,
    loadColumnTags,
    loadReports,
    generateReport,
    importExcelData,
    importCSVData,
    getImportedData,
    deleteImportedData,
    getCollectsByStatus,
    getCollectsByType,
    getCollectsByAssignee,
    searchCollects,
    clearCurrentCollect,
    clearError,
    clearData
  }
}) 
