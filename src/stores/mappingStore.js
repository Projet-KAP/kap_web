import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'

export const useMappingStore = defineStore('mapping', () => {
  const tags = ref([])
  const templates = ref([])
  const importLogs = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  const choices = ref({
    module_choices: [],
    tag_type_choices: [],
    data_type_choices: []
  })
  
  const columnTags = computed(() => tags.value)
  const mappingTemplates = computed(() => templates.value)

  const tagsByModule = computed(() => {
    const grouped = {}
    tags.value.forEach(tag => {
      if (!grouped[tag.module]) {
        grouped[tag.module] = []
      }
      grouped[tag.module].push(tag)
    })
    return grouped
  })

  const tagsByType = computed(() => {
    const grouped = {}
    tags.value.forEach(tag => {
      if (!grouped[tag.tag_type]) {
        grouped[tag.tag_type] = []
      }
      grouped[tag.tag_type].push(tag)
    })
    return grouped
  })

  const activeTags = computed(() => tags.value.filter(t => t.is_active))
  const activeTemplates = computed(() => templates.value.filter(t => t.is_active))

  const loadTags = async (filters = {}) => {
    loading.value = true
    error.value = null
    try {
      // Charger les tags MES depuis /collect/mes-tags/
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)

      const response = await axiosInstance.get(`collect/mes-tags/?${params.toString()}`)
      let mesTags = Array.isArray(response.data) ? response.data : (response.data.results || [])
      
      // Gérer la pagination si nécessaire
      if (response.data.next) {
        let allTags = [...mesTags]
        let nextUrl = response.data.next
        while (nextUrl) {
          const nextResponse = await axiosInstance.get(nextUrl.replace(/^.*\/api\/v1\//, ''))
          const nextTags = Array.isArray(nextResponse.data) ? nextResponse.data : (nextResponse.data.results || [])
          allTags = [...allTags, ...nextTags]
          nextUrl = nextResponse.data.next
        }
        mesTags = allTags
      }
      
      // Filtrer par module si spécifié (pour les tags MES, on filtre côté client)
      if (filters.module && filters.module !== 'MES') {
        mesTags = []
      }
      
      // Filtrer par tag_type si spécifié
      if (filters.tag_type) {
        mesTags = mesTags.filter(tag => tag.tag_type === filters.tag_type)
      }
      
      tags.value = mesTags
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des tags'
          } finally {
      loading.value = false
    }
  }

  const loadTagsByModule = async (module) => {
    try {
      const response = await axiosInstance.get(`mapping/tags/by_module/?module=${module}`)
      return response.data
    } catch (err) {
            return {}
    }
  }

  const loadChoices = async () => {
    try {
      const response = await axiosInstance.get('mapping/tags/choices/')
      choices.value = response.data
    } catch (err) {
          }
  }

  const createTag = async (tagData) => {
    loading.value = true
    error.value = null
    try {
      // Utiliser l'endpoint MES pour créer les tags
      const response = await axiosInstance.post('collect/mes-tags/', tagData)
      tags.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data || 'Erreur lors de la création du tag'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTag = async (id, tagData) => {
    loading.value = true
    error.value = null
    try {
      // Utiliser l'endpoint MES pour mettre à jour les tags
      const response = await axiosInstance.patch(`collect/mes-tags/${id}/`, tagData)
      const index = tags.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tags.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data || 'Erreur lors de la mise à jour du tag'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteTag = async (id) => {
    loading.value = true
    error.value = null
    try {
      // Utiliser l'endpoint MES pour supprimer les tags
      await axiosInstance.delete(`collect/mes-tags/${id}/`)
      tags.value = tags.value.filter(t => t.id !== id)
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression du tag'
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadTemplates = async (filters = {}) => {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters.module) params.append('module', filters.module)

      const response = await axiosInstance.get(`mapping/templates/?${params.toString()}`)
      templates.value = Array.isArray(response.data) ? response.data : (response.data.results || [])
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des templates'
          } finally {
      loading.value = false
    }
  }

  const createTemplate = async (templateData) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('mapping/templates/', templateData)
      templates.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data || 'Erreur lors de la création du template'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTemplate = async (id, templateData) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.patch(`mapping/templates/${id}/`, templateData)
      const index = templates.value.findIndex(t => t.id === id)
      if (index !== -1) {
        templates.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data || 'Erreur lors de la mise à jour du template'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteTemplate = async (id) => {
    loading.value = true
    error.value = null
    try {
      await axiosInstance.delete(`mapping/templates/${id}/`)
      templates.value = templates.value.filter(t => t.id !== id)
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression du template'
      throw err
    } finally {
      loading.value = false
    }
  }

  const testMapping = async (templateId, file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axiosInstance.post(
        `mapping/templates/${templateId}/test_mapping/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )
      return response.data
    } catch (err) {
            throw err
    }
  }

  const duplicateTemplate = async (templateId, newName) => {
    try {
      const response = await axiosInstance.post(
        `mapping/templates/${templateId}/duplicate/`,
        { name: newName }
      )
      templates.value.unshift(response.data)
      return response.data
    } catch (err) {
            throw err
    }
  }

  const importExcel = async (file, options = {}) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (options.template_id) formData.append('template_id', options.template_id)
      if (options.projet_id) formData.append('projet_id', options.projet_id)
      if (options.dry_run !== undefined) formData.append('dry_run', options.dry_run)
      
      const response = await axiosInstance.post(
        'mapping/import/',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )
      return response.data
    } catch (err) {
            throw err
    }
  }

  const previewExcel = async (file, templateId = null) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (templateId) formData.append('template_id', templateId)
      
      const response = await axiosInstance.post(
        'mapping/import/preview/',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )
      return response.data
    } catch (err) {
            throw err
    }
  }

  const loadImportLogs = async (filters = {}) => {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters.projet) params.append('projet', filters.projet)
      if (filters.status) params.append('status', filters.status)

      const response = await axiosInstance.get(`mapping/import-logs/?${params.toString()}`)
      importLogs.value = Array.isArray(response.data) ? response.data : (response.data.results || [])
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des logs'
          } finally {
      loading.value = false
    }
  }

  const loadImportStats = async () => {
    try {
      const response = await axiosInstance.get('mapping/import-logs/stats/')
      return response.data
    } catch (err) {
            return null
    }
  }

  return {
    tags,
    templates,
    importLogs,
    loading,
    error,
    choices,
    columnTags,
    mappingTemplates,
    tagsByModule,
    tagsByType,
    activeTags,
    activeTemplates,
    loadTags,
    loadTagsByModule,
    loadChoices,
    createTag,
    updateTag,
    deleteTag,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    testMapping,
    duplicateTemplate,
    importExcel,
    previewExcel,
    loadImportLogs,
    loadImportStats,
    loadColumnTags: loadTags,
    loadMappingTemplates: loadTemplates,
    createMappingTemplate: createTemplate,
    updateMappingTemplate: updateTemplate,
    deleteMappingTemplate: deleteTemplate,
    duplicateMappingTemplate: duplicateTemplate
  }
})

