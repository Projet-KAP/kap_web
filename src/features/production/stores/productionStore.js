import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'

export const useProductionStore = defineStore('production', () => {
  // State existant
  const data = ref([])
  const dashboard = ref({})
  const aggregated = ref({})
  const timeseries = ref([])
  const loading = ref(false)
  const error = ref(null)

  const currentProjet = ref(null)
  const currentModule = ref('CHANTIER')
  const currentTagType = ref(null)

  // Nouveau state pour l'interface generique
  const availableTypes = ref([])
  const typeConfig = ref({})
  const aiSuggestions = ref(null)

  // Computed
  const totalRows = computed(() => data.value.length)
  const hasData = computed(() => availableTypes.value.length > 0)

  const loadDashboard = async (projetId = null, module = 'CHANTIER', tagType = null) => {
    loading.value = true
    error.value = null

    try {
      const params = { module }

      // Ajouter projet seulement si specifie
      if (projetId) {
        params.projet = projetId
      }

      if (tagType) {
        params.tag_type = tagType
      }

      const response = await axiosInstance.get('/production/imported-data/dashboard/', { params })
      dashboard.value = response.data
      currentProjet.value = projetId
      currentModule.value = module
      currentTagType.value = tagType
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadAggregated = async (projetId, tagNames) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      params.append('projet', projetId)
      tagNames.forEach(tag => params.append('tags', tag))

      const response = await axiosInstance.get(`/production/imported-data/aggregated/?${params.toString()}`)
      aggregated.value = response.data.aggregations || {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadTimeseries = async (projetId, tagName, dateTag = 'DATE_PRODUCTION') => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axiosInstance.get('/production/imported-data/timeseries/', {
        params: {
          projet: projetId,
          tag: tagName,
          date_tag: dateTag
        }
      })
      timeseries.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadImportedData = async (projetId, filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const params = {
        projet: projetId,
        ...filters
      }
      
      const response = await axiosInstance.get('/production/imported-data/', { params })
      data.value = response.data.results || response.data
      return data.value
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const getValuesByTag = (tagName) => {
    if (!dashboard.value.tags) return []
    
    const tag = dashboard.value.tags.find(t => t.tag_name === tagName)
    return tag?.values || []
  }

  const getTagByName = (tagName) => {
    if (!dashboard.value.tags) return null
    return dashboard.value.tags.find(t => t.tag_name === tagName)
  }

  const getAggregatedValue = (tagName, metric = 'sum') => {
    if (!aggregated.value.aggregations) return 0
    
    const agg = aggregated.value.aggregations[tagName]
    return agg?.[metric] || 0
  }

  const clearData = () => {
    data.value = []
    dashboard.value = {}
    aggregated.value = {}
    timeseries.value = []
    availableTypes.value = []
    typeConfig.value = {}
    aiSuggestions.value = null
    error.value = null
  }

  // ============================================================================
  // NOUVELLES METHODES POUR L'INTERFACE GENERIQUE
  // ============================================================================

  /**
   * Charge les types de donnees disponibles
   * Retourne la liste des tag_types avec des donnees importees
   */
  const loadAvailableTypes = async (projetId = null, module = 'CHANTIER') => {
    loading.value = true
    error.value = null

    try {
      const params = { module }

      // Ajouter projet seulement si specifie
      if (projetId) {
        params.projet = projetId
      }

      const response = await axiosInstance.get('/production/imported-data/available_types/', { params })
      availableTypes.value = response.data.types || []
      currentProjet.value = projetId
      currentModule.value = module
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
      // Ne pas throw pour permettre l'affichage de l'etat vide
      return { types: [], total_types: 0 }
    } finally {
      loading.value = false
    }
  }

  /**
   * Charge la configuration complete d'un type de donnees
   * Inclut: tags KPI, tags table, agregations, suggestions de graphiques
   */
  const loadTypeConfig = async (projetId = null, tagType, module = 'CHANTIER') => {
    loading.value = true
    error.value = null

    try {
      const params = { tag_type: tagType, module }

      // Ajouter projet seulement si specifie
      if (projetId) {
        params.projet = projetId
      }

      const response = await axiosInstance.get('/production/imported-data/type_config/', { params })
      typeConfig.value = response.data
      currentProjet.value = projetId
      currentTagType.value = tagType
      currentModule.value = module

      // Mettre a jour les agregations
      aggregated.value = response.data.aggregations || {}

      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtient des suggestions IA pour un type de donnees
   */
  const getAISuggestions = async (projetId, tagType = null, context = '') => {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.post('/production/imported-data/ai_suggestions/', {
        projet_id: projetId,
        tag_type: tagType,
        context
      })
      aiSuggestions.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
      // Retourner un resultat vide plutot que throw
      return { success: false, suggestions: '', actions: [], recommended_tags: [] }
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtient l'icone appropriee pour un type de donnees
   */
  const getTypeIcon = (tagType) => {
    const icons = {
      'TERRASSEMENT': 'pi pi-chart-bar',
      'BETON': 'pi pi-building',
      'FINANCIER': 'pi pi-euro',
      'PLANNING': 'pi pi-calendar',
      'MATERIAUX': 'pi pi-box',
      'TRANSPORT': 'pi pi-truck',
      'PRODUCTION': 'pi pi-cog',
      'QUALITE': 'pi pi-check-circle',
      'MAINTENANCE': 'pi pi-wrench',
      'ENERGIE': 'pi pi-bolt',
      'SECURITE': 'pi pi-shield'
    }
    return icons[tagType] || 'pi pi-database'
  }

  /**
   * Obtient la couleur appropriee pour un type de donnees
   */
  const getTypeColor = (tagType) => {
    const colors = {
      'TERRASSEMENT': '#F59E0B',
      'BETON': '#6366F1',
      'FINANCIER': '#10B981',
      'PLANNING': '#3B82F6',
      'MATERIAUX': '#8B5CF6',
      'TRANSPORT': '#EC4899',
      'PRODUCTION': '#14B8A6',
      'QUALITE': '#22C55E',
      'MAINTENANCE': '#EF4444',
      'ENERGIE': '#F97316',
      'SECURITE': '#EAB308'
    }
    return colors[tagType] || '#6B7280'
  }

  return {
    // State existant
    data,
    dashboard,
    aggregated,
    timeseries,
    loading,
    error,
    currentProjet,
    currentModule,
    currentTagType,
    totalRows,

    // Nouveau state
    availableTypes,
    typeConfig,
    aiSuggestions,
    hasData,

    // Methodes existantes
    loadDashboard,
    loadAggregated,
    loadTimeseries,
    loadImportedData,
    getValuesByTag,
    getTagByName,
    getAggregatedValue,
    clearData,

    // Nouvelles methodes
    loadAvailableTypes,
    loadTypeConfig,
    getAISuggestions,
    getTypeIcon,
    getTypeColor
  }
})
