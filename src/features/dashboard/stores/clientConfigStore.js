import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useClientConfigStore = defineStore('clientConfig', () => {
  // State
  const clientConfig = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Configuration par défaut (peut être récupérée depuis l'API)
  const defaultConfig = {
    clientId: 'demo',
    clientName: 'Demo Client - Tous Modules',
    activeModules: ['collect', 'mes', 'engins'], // Tous les modules actifs par défaut
    subscription: 'premium',
    dashboardLayout: 'tabbed', // 'tabbed' ou 'unified'
    features: {
      collect: {
        enabled: true,
        features: ['manual_entry', 'excel_import', 'advanced_reports', 'analytics']
      },
      mes: {
        enabled: true,
        features: ['real_time_monitoring', 'kpi_dashboard', 'alerts', 'performance_analytics']
      },
      engins: {
        enabled: true,
        features: ['fleet_monitoring', 'maintenance_planning', 'usage_analytics', 'predictive_maintenance']
      }
    },
    preferences: {
      defaultView: 'overview',
      showAdvancedMetrics: true,
      autoRefresh: true,
      refreshInterval: 30000
    }
  }

  // Computed
  const isModuleEnabled = computed(() => (moduleName) => {
    if (!clientConfig.value) return false
    return clientConfig.value.activeModules.includes(moduleName)
  })

  const enabledModules = computed(() => {
    if (!clientConfig.value) return []
    return clientConfig.value.activeModules
  })

  const hasMultipleModules = computed(() => {
    return enabledModules.value.length > 1
  })

  const shouldUseTabs = computed(() => {
    return hasMultipleModules.value && clientConfig.value?.dashboardLayout === 'tabbed'
  })

  const getModuleFeatures = computed(() => (moduleName) => {
    if (!clientConfig.value?.features[moduleName]) return []
    return clientConfig.value.features[moduleName].features || []
  })

  const canShowAdvancedMetrics = computed(() => {
    return clientConfig.value?.preferences?.showAdvancedMetrics === true
  })

  // Actions
  const loadClientConfig = async (clientId = null) => {
    loading.value = true
    error.value = null

    try {
      // Simuler un appel API pour récupérer la config client
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Pour la démo, on utilise la config par défaut ou une config spécifique
      const configs = {
        'demo': defaultConfig,
        'client-collect-only': {
          ...defaultConfig,
          clientId: 'client-collect-only',
          clientName: 'Client Collecte Seule',
          activeModules: ['collect'],
          subscription: 'basic'
        },
        'client-full': {
          ...defaultConfig,
          clientId: 'client-full',
          clientName: 'Client Complet',
          activeModules: ['collect', 'mes', 'engins'],
          subscription: 'premium',
          features: {
            collect: {
              enabled: true,
              features: ['manual_entry', 'excel_import', 'advanced_reports', 'analytics']
            },
            mes: {
              enabled: true,
              features: ['real_time_monitoring', 'kpi_dashboard', 'alerts', 'performance_analytics']
            },
            engins: {
              enabled: true,
              features: ['fleet_monitoring', 'maintenance_planning', 'usage_analytics', 'predictive_maintenance']
            }
          },
          preferences: {
            defaultView: 'overview',
            showAdvancedMetrics: true,
            autoRefresh: true,
            refreshInterval: 15000
          }
        },
        'client-collect-mes': {
          ...defaultConfig,
          clientId: 'client-collect-mes',
          clientName: 'Client Collecte + MES',
          activeModules: ['collect', 'mes'],
          subscription: 'standard',
          features: {
            collect: {
              enabled: true,
              features: ['manual_entry', 'excel_import', 'basic_reports', 'analytics']
            },
            mes: {
              enabled: true,
              features: ['real_time_monitoring', 'kpi_dashboard', 'alerts']
            },
            engins: {
              enabled: false,
              features: []
            }
          },
          preferences: {
            defaultView: 'mes',
            showAdvancedMetrics: true,
            autoRefresh: true,
            refreshInterval: 20000
          }
        }
      }

      const targetClientId = clientId || 'demo'
      clientConfig.value = configs[targetClientId] || configs['demo']

    } catch (err) {
      error.value = 'Erreur lors du chargement de la configuration client'
      console.error('Client config loading error:', err)
      // Fallback sur la config par défaut
      clientConfig.value = defaultConfig
    } finally {
      loading.value = false
    }
  }

  const switchClientConfig = async (clientId) => {
    await loadClientConfig(clientId)
  }

  const updateClientPreferences = (preferences) => {
    if (clientConfig.value) {
      clientConfig.value.preferences = {
        ...clientConfig.value.preferences,
        ...preferences
      }
    }
  }

  const enableModule = (moduleName) => {
    if (clientConfig.value && !clientConfig.value.activeModules.includes(moduleName)) {
      clientConfig.value.activeModules.push(moduleName)
      if (clientConfig.value.features[moduleName]) {
        clientConfig.value.features[moduleName].enabled = true
      }
    }
  }

  const disableModule = (moduleName) => {
    if (clientConfig.value) {
      clientConfig.value.activeModules = clientConfig.value.activeModules.filter(m => m !== moduleName)
      if (clientConfig.value.features[moduleName]) {
        clientConfig.value.features[moduleName].enabled = false
      }
    }
  }

  const getModuleConfig = (moduleName) => {
    if (!clientConfig.value?.features[moduleName]) return null
    return clientConfig.value.features[moduleName]
  }

  const resetConfig = () => {
    clientConfig.value = null
    error.value = null
  }

  // Modules disponibles avec leurs métadonnées
  const availableModules = [
    {
      id: 'collect',
      name: 'KAP Collect',
      description: 'Collecte manuelle des données pour digitaliser vos processus',
      icon: 'pi pi-database',
      color: '#3b82f6',
      route: '/user/collect',
      subscriptionLevel: 'basic'
    },
    {
      id: 'mes',
      name: 'KAP MES',
      description: 'Suivi de vos KPIs industriels et recommandations d\'optimisation',
      icon: 'pi pi-sitemap',
      color: '#7AC943',
      route: '/mes',
      subscriptionLevel: 'standard'
    },
    {
      id: 'engins',
      name: 'KAP Engins',
      description: 'Analyse de l\'utilisation et de l\'efficacité des engins de projet',
      icon: 'pi pi-cog',
      color: '#f59e0b',
      route: '/engins',
      subscriptionLevel: 'premium'
    },
  ]

  const getAvailableModules = computed(() => {
    return availableModules.filter(module => 
      isModuleEnabled.value(module.id)
    )
  })

  const getModuleMetadata = (moduleId) => {
    return availableModules.find(module => module.id === moduleId)
  }

  return {
    // State
    clientConfig,
    loading,
    error,
    availableModules,

    // Computed
    isModuleEnabled,
    enabledModules,
    hasMultipleModules,
    shouldUseTabs,
    getModuleFeatures,
    canShowAdvancedMetrics,
    getAvailableModules,

    // Actions
    loadClientConfig,
    switchClientConfig,
    updateClientPreferences,
    enableModule,
    disableModule,
    getModuleConfig,
    getModuleMetadata,
    resetConfig
  }
})
