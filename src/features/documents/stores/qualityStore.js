import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'

export const useQualityStore = defineStore('quality', () => {
  // State
  const qualityFields = ref([])
  const qualityMetrics = ref(null)
  const metricsCache = ref(new Map())
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const hasQualityFields = computed(() => qualityFields.value.length > 0)

  const conformityRate = computed(() => {
    if (!qualityMetrics.value) return 0
    return qualityMetrics.value.conformity_rate || 0
  })

  const totalChecks = computed(() => {
    if (!qualityMetrics.value) return 0
    return qualityMetrics.value.total_checks || 0
  })

  // Actions
  async function addQualityField(instanceId, fieldData) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.post(
        `/documents/instances/${instanceId}/add-quality-field/`,
        fieldData
      )

      if (response.data.success) {
        qualityFields.value.push(response.data.data)

        // Invalider le cache des métriques pour cette instance
        metricsCache.value.delete(instanceId)

        return { success: true, data: response.data.data }
      }

      throw new Error(response.data.message || 'Erreur lors de l\'ajout du champ qualité')
    } catch (err) {
      error.value = err.message || 'Une erreur est survenue'
      console.error('Erreur addQualityField:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function fetchQualityMetrics(instanceId, useCache = true) {
    // Vérifier le cache
    if (useCache && metricsCache.value.has(instanceId)) {
      console.log(`📦 Cache hit pour métriques qualité instance ${instanceId}`)
      qualityMetrics.value = metricsCache.value.get(instanceId)
      return { success: true, data: qualityMetrics.value }
    }

    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get(
        `/documents/instances/${instanceId}/quality-metrics/`
      )

      if (response.data.success) {
        qualityMetrics.value = response.data.data

        // Mettre en cache
        metricsCache.value.set(instanceId, response.data.data)

        return { success: true, data: response.data.data }
      }

      throw new Error(response.data.message || 'Erreur lors de la récupération des métriques')
    } catch (err) {
      error.value = err.message || 'Une erreur est survenue'
      console.error('Erreur fetchQualityMetrics:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  function clearMetricsCache(instanceId = null) {
    if (instanceId) {
      metricsCache.value.delete(instanceId)
    } else {
      metricsCache.value.clear()
    }
  }

  function validateQualityValue(value, field) {
    const config = field.configuration || {}

    if (field.field_type === 'QUALITY_MEASURE') {
      const numValue = parseFloat(value)

      if (isNaN(numValue)) {
        return { valid: false, message: 'Valeur numérique attendue' }
      }

      const toleranceMin = config.tolerance_min
      const toleranceMax = config.tolerance_max

      if (toleranceMin !== null && toleranceMin !== undefined &&
          toleranceMax !== null && toleranceMax !== undefined) {

        const isConforming = numValue >= toleranceMin && numValue <= toleranceMax

        return {
          valid: true,
          conforming: isConforming,
          status: isConforming ? 'OK' : 'NOK',
          message: isConforming
            ? 'Valeur conforme'
            : `Hors tolérance (${toleranceMin} - ${toleranceMax})`
        }
      }

      return { valid: true, conforming: true, status: 'OK' }
    }

    if (field.field_type === 'QUALITY_VISUAL') {
      const normalizedValue = String(value).toLowerCase().trim()
      const conformingValues = ['conforme', 'ok', 'yes', 'oui']
      const nonConformingValues = ['non conforme', 'nok', 'no', 'non']

      const isConforming = conformingValues.includes(normalizedValue)
      const isNonConforming = nonConformingValues.includes(normalizedValue)

      return {
        valid: true,
        conforming: isConforming,
        status: isConforming ? 'OK' : (isNonConforming ? 'NOK' : 'REVIEW'),
        message: isConforming ? 'Conforme' : (isNonConforming ? 'Non conforme' : 'À revoir')
      }
    }

    if (field.field_type === 'QUALITY_COUNT') {
      const numValue = parseInt(value)

      if (isNaN(numValue) || numValue < 0) {
        return { valid: false, message: 'Nombre entier positif attendu' }
      }

      const totalPieces = config.total_pieces
      const thresholdPct = config.threshold_pct ?? 5

      if (!totalPieces || totalPieces < 1) {
        return { valid: true, conforming: true, status: 'OK', count: numValue }
      }

      if (numValue > totalPieces) {
        return { valid: false, message: `Ne peut pas dépasser le total (${totalPieces} pièces)` }
      }

      const ncRate = (numValue / totalPieces) * 100
      const isConforming = ncRate <= thresholdPct

      return {
        valid: true,
        conforming: isConforming,
        status: isConforming ? 'OK' : 'NOK',
        count: numValue,
        nc_rate: Math.round(ncRate * 10) / 10,
        message: isConforming
          ? `Taux NC : ${Math.round(ncRate * 10) / 10}% ✓`
          : `Taux NC : ${Math.round(ncRate * 10) / 10}% (seuil : ${thresholdPct}%)`
      }
    }

    return { valid: true, conforming: true }
  }

  function getCellStyle(value, field) {
    const validation = validateQualityValue(value, field)

    if (!validation.valid) {
      return {
        backgroundColor: '#fef2f2',
        color: '#991b1b',
        border: '2px solid #f87171'
      }
    }

    if (validation.conforming) {
      return {
        backgroundColor: '#f0fdf4',
        color: '#166534',
        fontWeight: '500'
      }
    }

    return {
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      fontWeight: '500'
    }
  }

  function resetState() {
    qualityFields.value = []
    qualityMetrics.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    qualityFields,
    qualityMetrics,
    loading,
    error,

    // Getters
    hasQualityFields,
    conformityRate,
    totalChecks,

    // Actions
    addQualityField,
    fetchQualityMetrics,
    clearMetricsCache,
    validateQualityValue,
    getCellStyle,
    resetState
  }
})
