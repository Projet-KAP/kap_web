import { ref } from 'vue'
import { defineStore } from 'pinia'
import { axiosInstance } from '@/main'

export const useClientModuleStore = defineStore('clientModules', () => {
  const modules = ref([])
  const availableModules = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * Récupère tous les modules disponibles avec leurs catégories
   */
  async function fetchAvailableModules() {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get('/accounts/client-modules/available_modules/')
      availableModules.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Erreur lors de la récupération des modules disponibles'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère les modules d'un client spécifique
   */
  async function fetchClientModules(clientId) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get('/accounts/client-modules/', {
        params: { client: clientId }
      })
      // L'API retourne un objet paginé {count, results, ...}
      // On extrait seulement le tableau 'results'
      modules.value = response.data.results || response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Erreur lors de la récupération des modules du client'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Met à jour les modules d'un client en masse
   */
  async function bulkUpdateModules(clientId, modulesData) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.post('/accounts/client-modules/bulk_update/', {
        client: clientId,
        modules: modulesData
      })

      // Recharger les modules du client après la mise à jour
      await fetchClientModules(clientId)

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Erreur lors de la mise à jour des modules'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Initialise les modules par défaut pour un nouveau client
   */
  async function initializeDefaultModules(clientId) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.post('/accounts/client-modules/initialize_defaults/', {
        client: clientId
      })

      // Recharger les modules du client après l'initialisation
      await fetchClientModules(clientId)

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Erreur lors de l\'initialisation des modules'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Active ou désactive un module spécifique
   */
  async function toggleModule(clientId, moduleCode, isEnabled) {
    loading.value = true
    error.value = null

    try {
      // Trouver le module existant
      const existingModule = modules.value.find(m => m.module_code === moduleCode)

      if (existingModule) {
        // Mettre à jour le module existant
        const response = await axiosInstance.patch(`/accounts/client-modules/${existingModule.id}/`, {
          is_enabled: isEnabled
        })

        // Mettre à jour localement
        const index = modules.value.findIndex(m => m.id === existingModule.id)
        if (index !== -1) {
          modules.value[index] = response.data
        }

        return response.data
      } else {
        // Créer un nouveau module
        const response = await axiosInstance.post('/accounts/client-modules/', {
          client: clientId,
          module_code: moduleCode,
          is_enabled: isEnabled
        })

        modules.value.push(response.data)
        return response.data
      }
    } catch (err) {
      error.value = err.response?.data?.detail || 'Erreur lors de la modification du module'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère les modules groupés par catégorie
   */
  function getModulesByCategory() {
    const grouped = {}

    availableModules.value.forEach(module => {
      const category = module.category || 'Autre'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(module)
    })

    return grouped
  }

  /**
   * Vérifie si un module est activé pour un client
   */
  function isModuleEnabled(moduleCode) {
    const module = modules.value.find(m => m.module_code === moduleCode)
    return module ? module.is_enabled : false
  }

  /**
   * Récupère la liste des codes de modules activés
   */
  function getEnabledModuleCodes() {
    return modules.value
      .filter(m => m.is_enabled)
      .map(m => m.module_code)
  }

  return {
    modules,
    availableModules,
    loading,
    error,
    fetchAvailableModules,
    fetchClientModules,
    bulkUpdateModules,
    initializeDefaultModules,
    toggleModule,
    getModulesByCategory,
    isModuleEnabled,
    getEnabledModuleCodes
  }
})
