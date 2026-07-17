import { defineStore } from 'pinia'
import { ref } from 'vue'
import { axiosInstance } from '@/main.js'

export const useAnalyticsStore = defineStore('analytics', () => {
  // State
  const kpis = ref([])
  const formulas = ref([])
  const tags = ref([])
  const dashboards = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Cache pour les données de tags (clé: tagId-startDate-endDate, valeur: données)
  const tagDataCache = ref(new Map())
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes en ms

  /**
   * Récupère tous les KPIs disponibles
   */
  const getKPIs = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('documents/kpis/')
      kpis.value = response.data.results || response.data || []
      return kpis.value
    } catch (err) {
      console.error('Error fetching KPIs:', err)
      error.value = err.message
      kpis.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère toutes les formules disponibles
   */
  const getFormulas = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('documents/formula-kpis/')
      formulas.value = response.data.results || response.data || []
      return formulas.value
    } catch (err) {
      console.error('Error fetching formulas:', err)
      error.value = err.message
      formulas.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère tous les tags disponibles pour les charts
   * Charge les MESCollectTag qui sont mappés aux champs de documents
   */
  const getTags = async () => {
    loading.value = true
    error.value = null
    try {
      // Charger les MESCollectTag depuis /collect/mes-tags/ (ce sont ceux mappés aux champs)
      const response = await axiosInstance.get('collect/mes-tags/')
      
      // Gérer la pagination si nécessaire
      let allTags = []
      
      // Vérifier si c'est une réponse paginée
      if (response.data.results) {
        // Réponse paginée (format DRF standard)
        allTags = response.data.results || []
        
        // Si pagination, charger toutes les pages
        if (response.data.count && response.data.count > allTags.length) {
          const pageSize = response.data.results?.length || 25
          const totalPages = Math.ceil(response.data.count / pageSize)
          const additionalRequests = []
          
          for (let page = 2; page <= totalPages; page++) {
            additionalRequests.push(
              axiosInstance.get('collect/mes-tags/', {
                params: {
                  page: page
                }
              })
            )
          }
          
          if (additionalRequests.length > 0) {
            const additionalResponses = await Promise.all(additionalRequests)
            additionalResponses.forEach(res => {
              const pageTags = res.data.results || []
              allTags = allTags.concat(pageTags)
            })
          }
        }
      } else {
        // Réponse non paginée (tableau direct)
        allTags = Array.isArray(response.data) ? response.data : []
      }
      
      // Transformer les MESCollectTag en format compatible avec le dashboard
      // MESCollectTag a: id, name, tag_type, mes_indicator, description
      // Le dashboard attend: id, display_name (ou tag_name), etc.
      tags.value = allTags.map(tag => ({
        id: tag.id,
        tag_name: tag.name,
        display_name: tag.name,
        name: tag.name,
        tag_type: tag.tag_type,
        mes_indicator: tag.mes_indicator,
        description: tag.description
      }))
      
      return tags.value
    } catch (err) {
      console.error('Error fetching tags:', err)
      error.value = err.message
      tags.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère les dashboards sauvegardés de l'utilisateur
   */
  const getDashboards = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('accounts/dashboards/')
      dashboards.value = response.data.results || response.data || []
      return dashboards.value
    } catch (err) {
      // Ne pas logger les erreurs 404 car l'endpoint peut ne pas exister encore
      // L'interceptor dans main.js gère déjà le silence pour cet endpoint
      if (err.response?.status !== 404 && !err.silent) {
        console.error('Error fetching dashboards:', err)
        error.value = err.message
      }
      dashboards.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Sauvegarde un dashboard
   */
  const saveDashboard = async (dashboard) => {
    loading.value = true
    error.value = null
    try {
      let response
      if (dashboard.id) {
        response = await axiosInstance.put(`accounts/dashboards/${dashboard.id}/`, dashboard)
      } else {
        response = await axiosInstance.post('accounts/dashboards/', dashboard)
      }

      // Mettre à jour la liste des dashboards
      const index = dashboards.value.findIndex(d => d.id === response.data.id)
      if (index !== -1) {
        dashboards.value[index] = response.data
      } else {
        dashboards.value.push(response.data)
      }

      return response.data
    } catch (err) {
      console.error('Error saving dashboard:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Supprime un dashboard
   */
  const deleteDashboard = async (dashboardId) => {
    loading.value = true
    error.value = null
    try {
      await axiosInstance.delete(`accounts/dashboards/${dashboardId}/`)
      dashboards.value = dashboards.value.filter(d => d.id !== dashboardId)
    } catch (err) {
      console.error('Error deleting dashboard:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère les données d'un tag sur une période (avec cache)
   * Supporte les 2 sources:
   * - MES: /collect/mes-tags/{id}/data/
   * - SENSOR: /sensors/tags/{id}/data/
   */
  const getTagData = async (tagId, startDate, endDate, tagSource = 'MES') => {
    const cacheKey = `${tagSource}-${tagId}-${startDate}-${endDate}`

    // Vérifier le cache
    const cached = tagDataCache.value.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.data
    }

    try {
      // Choisir l'endpoint selon la source
      const endpoint = tagSource === 'SENSOR'
        ? `sensors/tags/${tagId}/data/`
        : `collect/mes-tags/${tagId}/data/`

      const response = await axiosInstance.get(endpoint, {
        params: { start_date: startDate, end_date: endDate }
      })

      // Mettre en cache
      tagDataCache.value.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      })

      return response.data
    } catch (err) {
      console.error(`Error fetching ${tagSource} tag data:`, err)
      error.value = err.message
      return { timestamps: [], values: [] }
    }
  }

  /**
   * Charge les données de plusieurs tags
   * Supporte les 2 sources: MES et SENSOR
   * @param tagIds - Liste des IDs de tags
   * @param startDate - Date de début
   * @param endDate - Date de fin
   * @param tagSource - Source des tags: 'MES' (défaut) ou 'SENSOR'
   */
  const getMultipleTagsData = async (tagIds, startDate, endDate, tagSource = 'MES') => {
    const results = {}
    const uncachedTagIds = []

    // Séparer les tags en cache et non-cachés
    for (const tagId of tagIds) {
      const cacheKey = `${tagSource}-${tagId}-${startDate}-${endDate}`
      const cached = tagDataCache.value.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        results[tagId] = cached.data
      } else {
        uncachedTagIds.push(tagId)
      }
    }

    // Charger tous les tags non-cachés
    if (uncachedTagIds.length > 0) {
      console.log(`📦 Chargement de ${uncachedTagIds.length} ${tagSource} tags`)

      if (tagSource === 'SENSOR') {
        // Pour SENSOR tags, charger individuellement (pas de bulk endpoint)
        await Promise.all(uncachedTagIds.map(async (tagId) => {
          try {
            const response = await axiosInstance.get(`/sensors/tags/${tagId}/data/`, {
              params: { start_date: startDate, end_date: endDate }
            })
            const cacheKey = `SENSOR-${tagId}-${startDate}-${endDate}`
            tagDataCache.value.set(cacheKey, {
              data: response.data,
              timestamp: Date.now()
            })
            results[tagId] = response.data
          } catch (err) {
            console.error(`Error fetching SENSOR tag ${tagId}:`, err)
            results[tagId] = { timestamps: [], values: [] }
          }
        }))
        console.log(`✅ ${uncachedTagIds.length} SENSOR tags chargés`)
      } else {
        // Pour MES tags, essayer le bulk endpoint
        try {
          const response = await axiosInstance.post('collect/field-tags/bulk_data/', {
            tag_ids: uncachedTagIds,
            start_date: startDate,
            end_date: endDate
          })

          // Mettre en cache et ajouter aux résultats
          for (const [tagId, data] of Object.entries(response.data)) {
            const cacheKey = `MES-${tagId}-${startDate}-${endDate}`
            tagDataCache.value.set(cacheKey, {
              data: data,
              timestamp: Date.now()
            })
            results[tagId] = data
          }
          console.log(`✅ ${uncachedTagIds.length} MES tags chargés en bulk`)
        } catch (err) {
          console.error('Erreur bulk_data, fallback sur requêtes individuelles:', err)

          // Fallback: charger individuellement si le bulk échoue
          for (const tagId of uncachedTagIds) {
            try {
              const response = await axiosInstance.get(`collect/mes-tags/${tagId}/data/`, {
                params: { start_date: startDate, end_date: endDate }
              })
              const cacheKey = `MES-${tagId}-${startDate}-${endDate}`
              tagDataCache.value.set(cacheKey, {
                data: response.data,
                timestamp: Date.now()
              })
              results[tagId] = response.data
            } catch (err2) {
              console.error(`Error fetching MES tag ${tagId}:`, err2)
              results[tagId] = { timestamps: [], values: [] }
            }
          }
        }
      }
    }

    return results
  }

  /**
   * Charge les données de tags groupés par source (MES et SENSOR)
   * Utile quand les widgets utilisent des sources mixtes
   */
  const getMultipleTagsDataBySource = async (tagsBySource, startDate, endDate) => {
    const results = {}

    // Charger MES tags
    if (tagsBySource.MES && tagsBySource.MES.length > 0) {
      const mesResults = await getMultipleTagsData(tagsBySource.MES, startDate, endDate, 'MES')
      Object.assign(results, mesResults)
    }

    // Charger SENSOR tags
    if (tagsBySource.SENSOR && tagsBySource.SENSOR.length > 0) {
      const sensorResults = await getMultipleTagsData(tagsBySource.SENSOR, startDate, endDate, 'SENSOR')
      Object.assign(results, sensorResults)
    }

    return results
  }

  /**
   * Vide le cache des données de tags
   */
  const clearTagDataCache = () => {
    tagDataCache.value.clear()
  }

  /**
   * Récupère la valeur actuelle d'un KPI avec filtrage par date
   */
  const getKPIValue = async (kpiId, startDate = null, endDate = null) => {
    try {
      const params = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const response = await axiosInstance.get(`documents/kpis/${kpiId}/value/`, { params })
      return response.data.value || null
    } catch (err) {
      // Erreur silencieuse - KPI peut ne pas exister ou endpoint en développement
      return null
    }
  }

  /**
   * Récupère le résultat d'une formule avec filtrage par date
   */
  const getFormulaValue = async (formulaId, startDate = null, endDate = null) => {
    try {
      const params = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const response = await axiosInstance.get(`documents/formula-kpis/${formulaId}/value/`, { params })
      return response.data.value || null
    } catch (err) {
      // Erreur silencieuse - l'endpoint est en développement
      return null
    }
  }

  return {
    // State
    kpis,
    formulas,
    tags,
    dashboards,
    loading,
    error,
    // Actions
    getKPIs,
    getFormulas,
    getTags,
    getDashboards,
    saveDashboard,
    deleteDashboard,
    getTagData,
    getMultipleTagsData,
    getMultipleTagsDataBySource,
    clearTagDataCache,
    getKPIValue,
    getFormulaValue
  }
})

