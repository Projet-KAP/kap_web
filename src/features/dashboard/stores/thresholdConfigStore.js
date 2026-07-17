// Store pour la configuration des seuils KPI
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThresholdConfigStore = defineStore('thresholdConfig', () => {
  // État des seuils configurables
  const thresholds = ref({
    // Mode dégradé - Ratio pannes/utilisation
    degradedMode: {
      id: 'degradedMode',
      name: 'Mode Dégradé',
      description: 'Seuil de déclenchement du mode dégradé basé sur le ratio pannes/utilisation',
      unit: 'ratio',
      defaultValue: 0.020, // 2% par défaut
      currentValue: 0.020,
      minValue: 0.001,
      maxValue: 0.500,
      step: 0.001,
      category: 'Fiabilité',
      equipmentTypes: ['all'], // Applicable à tous les équipements
      enabled: true,
      levels: {
        normal: { max: 0.020, label: 'Normal', color: 'success', severity: 'success' },
        degraded: { min: 0.020, max: 0.050, label: 'Dégradé', color: 'warning', severity: 'warning' },
        critical: { min: 0.050, label: 'Critique', color: 'danger', severity: 'error' }
      }
    },
    
    // TRS - Taux de Rendement Synthétique
    trs: {
      id: 'trs',
      name: 'TRS',
      description: 'Seuils pour le Taux de Rendement Synthétique',
      unit: '%',
      defaultValue: 85,
      currentValue: 85,
      minValue: 50,
      maxValue: 100,
      step: 1,
      category: 'Performance',
      equipmentTypes: ['Machine-outil', 'Robot industriel', 'Presse'],
      enabled: true,
      levels: {
        poor: { max: 60, label: 'Faible', color: 'danger', severity: 'error' },
        acceptable: { min: 60, max: 85, label: 'Acceptable', color: 'warning', severity: 'warning' },
        excellent: { min: 85, label: 'Excellent', color: 'success', severity: 'success' }
      }
    },
    
    // Taux de rebuts
    rejectRate: {
      id: 'rejectRate',
      name: 'Taux de Rebuts',
      description: 'Seuils pour le taux de rebuts en production',
      unit: '%',
      defaultValue: 2,
      currentValue: 2,
      minValue: 0,
      maxValue: 20,
      step: 0.1,
      category: 'Qualité',
      equipmentTypes: ['Machine-outil', 'Robot industriel', 'Presse'],
      enabled: true,
      levels: {
        excellent: { max: 2, label: 'Excellent', color: 'success', severity: 'success' },
        acceptable: { min: 2, max: 5, label: 'Acceptable', color: 'warning', severity: 'warning' },
        poor: { min: 5, label: 'Faible', color: 'danger', severity: 'error' }
      }
    },
    
    // MTTR - Mean Time To Repair
    mttr: {
      id: 'mttr',
      name: 'MTTR',
      description: 'Temps Moyen de Réparation en minutes',
      unit: 'min',
      defaultValue: 30,
      currentValue: 30,
      minValue: 5,
      maxValue: 480,
      step: 5,
      category: 'Maintenance',
      equipmentTypes: ['all'],
      enabled: true,
      levels: {
        excellent: { max: 30, label: 'Excellent', color: 'success', severity: 'success' },
        acceptable: { min: 30, max: 60, label: 'Acceptable', color: 'warning', severity: 'warning' },
        poor: { min: 60, label: 'Faible', color: 'danger', severity: 'error' }
      }
    },
    
    // Disponibilité des engins
    engineAvailability: {
      id: 'engineAvailability',
      name: 'Disponibilité Engins',
      description: 'Seuils de disponibilité pour les engins de projet',
      unit: '%',
      defaultValue: 90,
      currentValue: 90,
      minValue: 50,
      maxValue: 100,
      step: 1,
      category: 'Disponibilité',
      equipmentTypes: ['Engin de projet', 'Véhicule'],
      enabled: true,
      levels: {
        poor: { max: 70, label: 'Faible', color: 'danger', severity: 'error' },
        acceptable: { min: 70, max: 90, label: 'Acceptable', color: 'warning', severity: 'warning' },
        excellent: { min: 90, label: 'Excellent', color: 'success', severity: 'success' }
      }
    }
  })

  // Configuration utilisateur sauvegardée
  const userConfig = ref({
    lastModified: null,
    modifiedBy: null,
    autoSave: true,
    notifications: {
      enabled: true,
      emailAlerts: false,
      thresholdCrossing: true
    }
  })

  // Getters
  const getThresholdById = computed(() => (id) => {
    return thresholds.value[id] || null
  })

  const getThresholdsByCategory = computed(() => (category) => {
    return Object.values(thresholds.value).filter(threshold => 
      threshold.category === category && threshold.enabled
    )
  })

  const getThresholdsByEquipmentType = computed(() => (equipmentType) => {
    return Object.values(thresholds.value).filter(threshold => 
      threshold.enabled && (
        threshold.equipmentTypes.includes('all') || 
        threshold.equipmentTypes.includes(equipmentType)
      )
    )
  })

  const getAllCategories = computed(() => {
    const categories = [...new Set(Object.values(thresholds.value).map(t => t.category))]
    return categories.sort()
  })

  // Actions
  const updateThreshold = (id, newValue) => {
    if (thresholds.value[id]) {
      const threshold = thresholds.value[id]
      
      // Valider la nouvelle valeur
      if (newValue >= threshold.minValue && newValue <= threshold.maxValue) {
        threshold.currentValue = newValue
        userConfig.value.lastModified = new Date().toISOString()
        
        // Sauvegarder en localStorage si activé
        if (userConfig.value.autoSave) {
          saveToLocalStorage()
        }
        
        return true
      }
    }
    return false
  }

  const resetThreshold = (id) => {
    if (thresholds.value[id]) {
      thresholds.value[id].currentValue = thresholds.value[id].defaultValue
      userConfig.value.lastModified = new Date().toISOString()
      
      if (userConfig.value.autoSave) {
        saveToLocalStorage()
      }
      
      return true
    }
    return false
  }

  const resetAllThresholds = () => {
    Object.keys(thresholds.value).forEach(id => {
      thresholds.value[id].currentValue = thresholds.value[id].defaultValue
    })
    
    userConfig.value.lastModified = new Date().toISOString()
    
    if (userConfig.value.autoSave) {
      saveToLocalStorage()
    }
  }

  const toggleThreshold = (id, enabled) => {
    if (thresholds.value[id]) {
      thresholds.value[id].enabled = enabled
      userConfig.value.lastModified = new Date().toISOString()
      
      if (userConfig.value.autoSave) {
        saveToLocalStorage()
      }
    }
  }

  // Fonction pour évaluer une valeur par rapport aux seuils
  const evaluateValue = (thresholdId, value) => {
    const threshold = thresholds.value[thresholdId]
    if (!threshold || !threshold.enabled) {
      return { level: 'unknown', label: 'Non défini', color: 'secondary', severity: 'secondary' }
    }

    const levels = threshold.levels
    
    // Pour le mode dégradé (logique inversée)
    if (thresholdId === 'degradedMode') {
      if (value <= levels.normal.max) {
        return { level: 'normal', ...levels.normal }
      } else if (value <= levels.degraded.max) {
        return { level: 'degraded', ...levels.degraded }
      } else {
        return { level: 'critical', ...levels.critical }
      }
    }
    
    // Pour les autres métriques (logique normale)
    for (const [levelKey, levelConfig] of Object.entries(levels)) {
      if (levelConfig.min !== undefined && levelConfig.max !== undefined) {
        if (value >= levelConfig.min && value <= levelConfig.max) {
          return { level: levelKey, ...levelConfig }
        }
      } else if (levelConfig.max !== undefined && value <= levelConfig.max) {
        return { level: levelKey, ...levelConfig }
      } else if (levelConfig.min !== undefined && value >= levelConfig.min) {
        return { level: levelKey, ...levelConfig }
      }
    }
    
    return { level: 'unknown', label: 'Hors plage', color: 'secondary', severity: 'secondary' }
  }

  // Fonction pour calculer le ratio pannes/utilisation
  const calculateDegradedModeRatio = (nombrePannes, heuresUtilisation) => {
    if (!heuresUtilisation || heuresUtilisation === 0) return 0
    return nombrePannes / heuresUtilisation
  }

  // Sauvegarde et chargement
  const saveToLocalStorage = () => {
    try {
      const dataToSave = {
        thresholds: thresholds.value,
        userConfig: userConfig.value,
        version: '1.0',
        savedAt: new Date().toISOString()
      }
      localStorage.setItem('kap_threshold_config', JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des seuils:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('kap_threshold_config')
      if (saved) {
        const data = JSON.parse(saved)
        
        // Fusionner avec les valeurs par défaut pour gérer les nouveaux seuils
        Object.keys(data.thresholds || {}).forEach(id => {
          if (thresholds.value[id]) {
            thresholds.value[id].currentValue = data.thresholds[id].currentValue
            thresholds.value[id].enabled = data.thresholds[id].enabled
          }
        })
        
        if (data.userConfig) {
          userConfig.value = { ...userConfig.value, ...data.userConfig }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des seuils:', error)
    }
  }

  const exportConfig = () => {
    const config = {
      thresholds: thresholds.value,
      userConfig: userConfig.value,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kap_threshold_config_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importConfig = (configData) => {
    try {
      const data = typeof configData === 'string' ? JSON.parse(configData) : configData
      
      if (data.thresholds) {
        Object.keys(data.thresholds).forEach(id => {
          if (thresholds.value[id]) {
            thresholds.value[id].currentValue = data.thresholds[id].currentValue
            thresholds.value[id].enabled = data.thresholds[id].enabled
          }
        })
      }
      
      if (data.userConfig) {
        userConfig.value = { ...userConfig.value, ...data.userConfig }
      }
      
      userConfig.value.lastModified = new Date().toISOString()
      
      if (userConfig.value.autoSave) {
        saveToLocalStorage()
      }
      
      return true
    } catch (error) {
      console.error('Erreur lors de l\'importation de la configuration:', error)
      return false
    }
  }

  // Initialisation
  const initialize = () => {
    loadFromLocalStorage()
  }

  return {
    // État
    thresholds,
    userConfig,
    
    // Getters
    getThresholdById,
    getThresholdsByCategory,
    getThresholdsByEquipmentType,
    getAllCategories,
    
    // Actions
    updateThreshold,
    resetThreshold,
    resetAllThresholds,
    toggleThreshold,
    evaluateValue,
    calculateDegradedModeRatio,
    
    // Persistance
    saveToLocalStorage,
    loadFromLocalStorage,
    exportConfig,
    importConfig,
    initialize
  }
})
