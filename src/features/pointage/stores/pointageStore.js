import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'

export const usePointageStore = defineStore('pointage', () => {
  const pointages = ref([])
  const selectedPointage = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const stats = ref({
    total_employes: 0,
    employes_presents: 0,
    employes_absents: 0,
    taux_presence: 0,
    total_heures: 0,
    cout_total: 0
  })

  const pointagesDuJour = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return pointages.value.filter(p => (p.date_pointage || p.date) === today)
  })

  const employesPresents = computed(() =>
    pointagesDuJour.value.filter(p => p.presence_bool === true || p.presence === 'PRESENT')
  )

  const employesAbsents = computed(() =>
    pointagesDuJour.value.filter(p => p.presence_bool === false || (p.presence && p.presence !== 'PRESENT'))
  )

  const loadPointages = async (filters = {}) => {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()

      if (filters.date_debut) params.append('date_debut', filters.date_debut)
      if (filters.date_fin) params.append('date_fin', filters.date_fin)
      if (filters.projet) params.append('projet', filters.projet)
      if (filters.fonction) params.append('fonction', filters.fonction)
      if (filters.presence !== undefined) params.append('presence', filters.presence)
      if (filters.date) params.append('date', filters.date)

      const url = `pointage/pointages/${params.toString() ? '?' + params.toString() : ''}`
      console.log('📡 [POINTAGE STORE] Chargement pointages:', url)

      const response = await axiosInstance.get(url)
      const data = response.data

      const loadedPointages = Array.isArray(data) ? data : (data.results || [])
      console.log('✅ [POINTAGE STORE] Pointages chargés:', loadedPointages.length)
      
      // Normaliser les données pour garantir la cohérence
      pointages.value = loadedPointages.map(p => {
        // S'assurer que tous les champs calculés sont présents
        if (!p.nom_personnel && (p.nom || p.prenom)) {
          p.nom_personnel = `${p.nom || ''} ${p.prenom || ''}`.trim()
        }
        if (!p.date_pointage && p.date) {
          p.date_pointage = p.date
        }
        if (p.presence_bool === undefined && p.presence) {
          p.presence_bool = p.presence === 'PRESENT'
        }
        if (!p.salaire_horaire && p.cout_horaire) {
          p.salaire_horaire = p.cout_horaire
        }
        if (!p.corps_etat && p.fonction) {
          p.corps_etat = p.fonction
        }
        return p
      })
      
      await calculateStats()
    } catch (err) {
      // Si l'endpoint n'existe pas (404) ou le backend n'est pas disponible, initialiser avec un tableau vide
      if (err.response?.status === 404 || err.code === 'ERR_NETWORK' || err.response?.status === 0) {
        pointages.value = []
        console.warn('⚠️ [POINTAGE STORE] Backend non disponible ou endpoint 404, utilisation d\'un tableau vide')
        // Réinitialiser les stats à zéro
        stats.value = {
          total_employes: 0,
          employes_presents: 0,
          employes_absents: 0,
          taux_presence: 0,
          total_heures: 0,
          cout_total: 0
        }
      } else {
        error.value = err.response?.data?.message || 'Erreur lors du chargement des pointages'
      }
    } finally {
      loading.value = false
    }
  }

  const loadPointageById = async (id) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`pointage/pointages/${id}/`)
      selectedPointage.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement du pointage'
      console.error('Erreur chargement pointage:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createPointage = async (pointageData) => {
    loading.value = true
    error.value = null
    try {
      console.log('📝 [POINTAGE STORE] Création pointage:', pointageData)
      const response = await axiosInstance.post('pointage/pointages/', pointageData)
      console.log('✅ [POINTAGE STORE] Pointage créé:', response.data)
      
      // Ajouter le nouveau pointage en début de liste
      const newPointage = response.data
      // Normaliser les données pour correspondre au format attendu par le frontend
      if (!newPointage.nom_personnel && newPointage.nom) {
        newPointage.nom_personnel = `${newPointage.nom} ${newPointage.prenom || ''}`.trim()
      }
      if (!newPointage.date_pointage && newPointage.date) {
        newPointage.date_pointage = newPointage.date
      }
      if (!newPointage.presence_bool && newPointage.presence) {
        newPointage.presence_bool = newPointage.presence === 'PRESENT'
      }
      if (!newPointage.salaire_horaire && newPointage.cout_horaire) {
        newPointage.salaire_horaire = newPointage.cout_horaire
      }
      if (!newPointage.corps_etat && newPointage.fonction) {
        newPointage.corps_etat = newPointage.fonction
      }
      
      pointages.value.unshift(newPointage)
      await calculateStats()
      return newPointage
    } catch (err) {
      error.value = err.response?.data || 'Erreur lors de la création du pointage'
      if (err.response?.data) {
        console.error('   Détails:', err.response.data)
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePointage = async (id, pointageData) => {
    loading.value = true
    error.value = null
    try {
      console.log('📝 [POINTAGE STORE] Mise à jour pointage:', id, pointageData)
      const response = await axiosInstance.patch(`pointage/pointages/${id}/`, pointageData)
      console.log('✅ [POINTAGE STORE] Pointage mis à jour:', response.data)
      
      const updatedPointage = response.data
      // Normaliser les données pour correspondre au format attendu par le frontend
      if (!updatedPointage.nom_personnel && updatedPointage.nom) {
        updatedPointage.nom_personnel = `${updatedPointage.nom} ${updatedPointage.prenom || ''}`.trim()
      }
      if (!updatedPointage.date_pointage && updatedPointage.date) {
        updatedPointage.date_pointage = updatedPointage.date
      }
      if (!updatedPointage.presence_bool && updatedPointage.presence) {
        updatedPointage.presence_bool = updatedPointage.presence === 'PRESENT'
      }
      if (!updatedPointage.salaire_horaire && updatedPointage.cout_horaire) {
        updatedPointage.salaire_horaire = updatedPointage.cout_horaire
      }
      if (!updatedPointage.corps_etat && updatedPointage.fonction) {
        updatedPointage.corps_etat = updatedPointage.fonction
      }
      
      const index = pointages.value.findIndex(p => p.id === id)
      if (index !== -1) {
        pointages.value[index] = updatedPointage
      }
      if (selectedPointage.value?.id === id) {
        selectedPointage.value = updatedPointage
      }
      await calculateStats()
      return updatedPointage
    } catch (err) {
      error.value = err.response?.data || 'Erreur lors de la mise à jour du pointage'
      if (err.response?.data) {
        console.error('   Détails:', err.response.data)
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const deletePointage = async (id) => {
    loading.value = true
    error.value = null
    try {
      console.log('🗑️ [POINTAGE STORE] Suppression pointage:', id)
      await axiosInstance.delete(`pointage/pointages/${id}/`)
      pointages.value = pointages.value.filter(p => p.id !== id)
      if (selectedPointage.value?.id === id) {
        selectedPointage.value = null
      }
      await calculateStats()
      console.log('✅ [POINTAGE STORE] Pointage supprimé')
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression du pointage'
      if (err.response?.data) {
        console.error('   Détails:', err.response.data)
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const calculateStats = () => {
    if (!pointages.value.length) {
      stats.value = {
        total_employes: 0,
        employes_presents: 0,
        employes_absents: 0,
        taux_presence: 0,
        total_heures: 0,
        cout_total: 0
      }
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const pointagesAujourdhui = pointages.value.filter(p => (p.date_pointage || p.date) === today)
    const presents = pointagesAujourdhui.filter(p => p.presence_bool === true || p.presence === 'PRESENT')
    const absents = pointagesAujourdhui.filter(p => p.presence_bool === false || (p.presence && p.presence !== 'PRESENT'))

    const totalHeures = presents.reduce((sum, p) => sum + (parseFloat(p.heures_travaillees) || 0), 0)
    const coutTotal = presents.reduce((sum, p) => sum + (parseFloat(p.cout_journalier || p.cout_total) || 0), 0)

    const tauxPresence = pointagesAujourdhui.length > 0
      ? Math.round((presents.length / pointagesAujourdhui.length) * 100)
      : 0

    stats.value = {
      total_employes: pointagesAujourdhui.length,
      employes_presents: presents.length,
      employes_absents: absents.length,
      taux_presence: tauxPresence,
      total_heures: totalHeures,
      cout_total: coutTotal
    }
  }

  const clearSelectedPointage = () => {
    selectedPointage.value = null
  }

  return {
    pointages,
    selectedPointage,
    loading,
    error,
    stats,
    pointagesDuJour,
    employesPresents,
    employesAbsents,
    loadPointages,
    loadPointageById,
    createPointage,
    updatePointage,
    deletePointage,
    calculateStats,
    clearSelectedPointage
  }
})