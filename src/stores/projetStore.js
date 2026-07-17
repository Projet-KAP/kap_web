import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'

export const useProjetStore = defineStore('projet', () => {
  const projets = ref([])
  const loading = ref(false)
  const error = ref(null)
  const stats = ref({})

  const projetsEnCours = computed(() => projets.value.filter(p => p.statut === 'EN_COURS'))
  const projetsEnPreparation = computed(() => projets.value.filter(p => p.statut === 'PREPARATION'))
  const projetsTermines = computed(() => projets.value.filter(p => p.statut === 'TERMINE'))
  const projetsEnRetard = computed(() => projets.value.filter(p => p.est_en_retard))

  const loadProjets = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axiosInstance.get('/projets/projets/', { params })
      projets.value = response.data.results || response.data
      return projets.value
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
            if (err.code === 'ERR_NETWORK' || err.response?.status === 0) {
        projets.value = []
                return []
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const createProjet = async (projetData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axiosInstance.post('/projets/projets/', projetData)
      projets.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data || err.message
            throw err
    } finally {
      loading.value = false
    }
  }

  const updateProjet = async (id, projetData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axiosInstance.put(`/projets/projets/${id}/`, projetData)
      const index = projets.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projets.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data || err.message
            throw err
    } finally {
      loading.value = false
    }
  }

  const deleteProjet = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      await axiosInstance.delete(`/projets/projets/${id}/`)
      projets.value = projets.value.filter(p => p.id !== id)
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
            throw err
    } finally {
      loading.value = false
    }
  }

  const loadStats = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axiosInstance.get('/projets/projets/stats/')
      stats.value = response.data || {
        total_projets: 0,
        projets_en_cours: 0,
        projets_en_retard: 0,
        montant_total: 0
      }
            return stats.value
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
            // Initialiser avec des valeurs par défaut en cas d'erreur
      stats.value = {
        total_projets: 0,
        projets_en_cours: 0,
        projets_en_retard: 0,
        montant_total: 0
      }
      // Ne pas throw pour ne pas bloquer l'interface
      return stats.value
    } finally {
      loading.value = false
    }
  }

  const demarrerProjet = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axiosInstance.post(`/projets/projets/${id}/demarrer/`)
      const index = projets.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projets.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
            throw err
    } finally {
      loading.value = false
    }
  }

  const terminerProjet = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axiosInstance.post(`/projets/projets/${id}/terminer/`)
      const index = projets.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projets.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
            throw err
    } finally {
      loading.value = false
    }
  }

  const suspendreProjet = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axiosInstance.post(`/projets/projets/${id}/suspendre/`)
      const index = projets.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projets.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
            throw err
    } finally {
      loading.value = false
    }
  }

  const reprendreProjet = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axiosInstance.post(`/projets/projets/${id}/reprendre/`)
      const index = projets.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projets.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
            throw err
    } finally {
      loading.value = false
    }
  }

  return {
    projets,
    loading,
    error,
    stats,
    projetsEnCours,
    projetsEnPreparation,
    projetsTermines,
    projetsEnRetard,
    loadProjets,
    createProjet,
    updateProjet,
    deleteProjet,
    loadStats,
    demarrerProjet,
    terminerProjet,
    suspendreProjet,
    reprendreProjet
  }
})
