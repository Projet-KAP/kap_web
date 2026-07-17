import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'

export const useDashboardWizardStore = defineStore('dashboardWizard', () => {
  // ==================
  // State - Wizard
  // ==================
  const isWizardOpen = ref(false)
  const currentStep = ref(0) // 0-3
  const showPrompt = ref(false)

  // ==================
  // State - Source
  // ==================
  const triggerSource = ref(null) // 'document' | 'collect'
  const sourceData = ref(null)

  // ==================
  // State - Etape 1: Objectif
  // ==================
  const userObjective = ref('')

  // ==================
  // State - Etape 2: Analyse
  // ==================
  const analysisLoading = ref(false)
  const analysisResult = ref(null)
  const suggestedTags = ref([])
  const suggestedKPIs = ref([])
  const selectedTagIds = ref([])
  const selectedKPIIds = ref([])

  // ==================
  // State - Etape 3: Dashboard
  // ==================
  const dashboardName = ref('')
  const previewWidgets = ref([])
  const chartType = ref('line')

  // ==================
  // State - Etape 4: Finalisation
  // ==================
  const creationLoading = ref(false)
  const createdDashboard = ref(null)
  const conversationId = ref(null)

  // ==================
  // Computed
  // ==================
  const selectedTags = computed(() =>
    suggestedTags.value.filter(t => selectedTagIds.value.includes(t.id))
  )

  const selectedKPIs = computed(() =>
    suggestedKPIs.value.filter(k => selectedKPIIds.value.includes(k.id))
  )

  const canProceedToStep2 = computed(() =>
    userObjective.value.trim().length >= 10
  )

  const canProceedToStep3 = computed(() =>
    selectedTagIds.value.length > 0 || selectedKPIIds.value.length > 0
  )

  const canProceedToStep4 = computed(() =>
    dashboardName.value.trim().length > 0
  )

  const totalSelectedItems = computed(() =>
    selectedTagIds.value.length + selectedKPIIds.value.length
  )

  // ==================
  // Actions - Lifecycle
  // ==================
  function showPostSubmitPrompt(data) {
    sourceData.value = data
    triggerSource.value = 'document'
    showPrompt.value = true
  }

  function dismissPrompt() {
    showPrompt.value = false
  }

  function openWizard(source = 'document', data = null) {
    if (data) {
      sourceData.value = data
    }
    triggerSource.value = source
    isWizardOpen.value = true
    showPrompt.value = false
    currentStep.value = 0

    // Pre-remplir l'objectif si possible
    if (data?.modele_structure?.nom) {
      userObjective.value = `Suivi des donnees de ${data.modele_structure.nom}`
    }

    // Pre-remplir le nom du dashboard
    if (data?.modele_structure?.nom) {
      dashboardName.value = `Dashboard ${data.modele_structure.nom}`
    }
  }

  function closeWizard() {
    isWizardOpen.value = false
    // Ne pas reset immediatement pour permettre la navigation
  }

  function resetState() {
    currentStep.value = 0
    triggerSource.value = null
    sourceData.value = null
    userObjective.value = ''
    analysisLoading.value = false
    analysisResult.value = null
    suggestedTags.value = []
    suggestedKPIs.value = []
    selectedTagIds.value = []
    selectedKPIIds.value = []
    dashboardName.value = ''
    previewWidgets.value = []
    chartType.value = 'line'
    creationLoading.value = false
    createdDashboard.value = null
    conversationId.value = null
    showPrompt.value = false
  }

  // ==================
  // Actions - Navigation
  // ==================
  function nextStep() {
    if (currentStep.value < 3) {
      currentStep.value++
    }
  }

  function previousStep() {
    if (currentStep.value > 0) {
      currentStep.value--
    }
  }

  function goToStep(step) {
    if (step >= 0 && step <= 3) {
      currentStep.value = step
    }
  }

  // ==================
  // Actions - Selection
  // ==================
  function toggleTagSelection(tagId) {
    const index = selectedTagIds.value.indexOf(tagId)
    if (index === -1) {
      selectedTagIds.value.push(tagId)
    } else {
      selectedTagIds.value.splice(index, 1)
    }
  }

  function toggleKPISelection(kpiId) {
    const index = selectedKPIIds.value.indexOf(kpiId)
    if (index === -1) {
      selectedKPIIds.value.push(kpiId)
    } else {
      selectedKPIIds.value.splice(index, 1)
    }
  }

  function selectAllTags() {
    selectedTagIds.value = suggestedTags.value.map(t => t.id)
  }

  function clearTagSelection() {
    selectedTagIds.value = []
  }

  function selectAllKPIs() {
    selectedKPIIds.value = suggestedKPIs.value.map(k => k.id)
  }

  function clearKPISelection() {
    selectedKPIIds.value = []
  }

  // ==================
  // Actions - API
  // ==================
  async function runAnalysis() {
    analysisLoading.value = true
    analysisResult.value = null

    try {
      const context = {
        objective: userObjective.value,
        source_type: triggerSource.value,
        document_data: sourceData.value ? {
          modele_id: sourceData.value.modele,
          modele_nom: sourceData.value.modele_structure?.nom,
          fields: sourceData.value.modele_structure?.structure_json?.fields || [],
          donnees_remplies: sourceData.value.donnees_remplies
        } : null
      }

      const response = await axiosInstance.post('/ai/wizard/analyze/', context)

      analysisResult.value = response.data.response
      suggestedTags.value = response.data.suggested_tags || []
      suggestedKPIs.value = response.data.suggested_kpis || []
      conversationId.value = response.data.conversation_id

      // Pre-selectionner les items haute relevance
      selectedTagIds.value = suggestedTags.value
        .filter(t => t.relevance === 'high')
        .map(t => t.id)

      selectedKPIIds.value = suggestedKPIs.value
        .filter(k => k.relevance === 'high')
        .map(k => k.id)

      return { success: true }
    } catch (error) {
      console.error('Erreur analyse wizard:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message
      }
    } finally {
      analysisLoading.value = false
    }
  }

  function generatePreview() {
    const widgets = []
    let row = 1
    let col = 1

    // UNIQUEMENT les tags avec données réelles (exclure les suggestions AI sans données)
    const realTags = selectedTags.value.filter(t =>
      t.source !== 'AI' && t.tag_type !== 'CHART'
    )
    const numericTags = realTags.filter(t =>
      ['NUMBER', 'DECIMAL', 'PERCENTAGE', 'float', 'integer'].includes(t.data_type)
    )

    // KPI widgets : uniquement les tags avec données
    const kpiTags = [...numericTags].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return (order[a.relevance] || 2) - (order[b.relevance] || 2)
    }).slice(0, 6)

    kpiTags.forEach((tag) => {
      const lastValue = tag.last_value || tag.current_value
      widgets.push({
        id: `widget-tag-${tag.id}`,
        type: 'kpi',
        title: tag.display_name || tag.tag_name,
        value: lastValue != null ? lastValue : '--',
        unit: tag.unit || '',
        sourceTag: tag,
        gridPosition: { row, col },
        size: 'small',
        color: tag.relevance === 'high' ? 'primary' : 'default'
      })
      col += 3
      if (col > 10) { col = 1; row++ }
    })

    // KPIs calculés par l'IA (uniquement ceux avec une valeur réelle)
    const computedKPIs = selectedKPIs.value.filter(k => k.has_data && k.computed_value != null)
    computedKPIs.slice(0, 6).forEach((kpi) => {
      widgets.push({
        id: `widget-kpi-${kpi.id}`,
        type: 'kpi',
        title: kpi.name,
        value: kpi.computed_value,
        unit: kpi.unit || '',
        description: kpi.formula || '',
        sourceKPI: kpi,
        gridPosition: { row, col },
        size: 'small',
        color: 'blue'
      })
      col += 3
      if (col > 10) { col = 1; row++ }
    })

    // Chart principal : uniquement les tags réels avec données
    if (numericTags.length > 0) {
      row++
      widgets.push({
        id: 'widget-chart-main',
        type: 'chart',
        title: 'Evolution temporelle',
        chartType: chartType.value,
        tags: numericTags.slice(0, 5).map(t => t.id),
        gridPosition: { row, col: 1 },
        size: 'large',
        color: 'default'
      })
    }

    previewWidgets.value = widgets
  }

  async function createDashboard() {
    creationLoading.value = true

    try {
      // Generer le preview si pas deja fait
      if (previewWidgets.value.length === 0) {
        generatePreview()
      }

      const payload = {
        name: dashboardName.value,
        description: `Cree automatiquement depuis ${sourceData.value?.modele_structure?.nom || 'un rapport'}`,
        widgets: previewWidgets.value.map(w => {
          // Format compatible DashboardBuilder (kpiId, selectedTags, tagSource)
          const widget = {
            id: w.id,
            type: w.type,
            title: w.title,
            size: w.size || 'small',
            color: w.color || 'default',
            gridPosition: w.gridPosition,
          }
          if (w.type === 'kpi' && w.sourceTag) {
            widget.tagId = w.sourceTag.id
            widget.tagSource = w.sourceTag.source || 'SENSOR'
            widget.value = w.value || '--'
          } else if (w.type === 'kpi' && w.sourceKPI) {
            // KPI calculé par l'IA — sauvegarder la valeur comme snapshot statique
            widget.value = w.value || w.sourceKPI.computed_value || '--'
            widget.unit = w.unit || ''
            widget.description = w.description || w.sourceKPI.formula || ''
            widget.isStatic = true  // Marquer comme valeur statique (pas de rechargement)
          } else if (w.type === 'chart') {
            widget.selectedTags = w.tags || []
            widget.chartType = w.chartType || 'line'
            widget.tagSource = 'SENSOR'
            widget.heightSpan = 2
          }
          return widget
        }),
        source_context: {
          trigger_source: triggerSource.value,
          conversation_id: conversationId.value,
          selected_tags: selectedTagIds.value,
          selected_kpis: selectedKPIIds.value
        }
      }

      const response = await axiosInstance.post('accounts/dashboards/', payload)
      createdDashboard.value = response.data

      return { success: true, dashboard: response.data }
    } catch (error) {
      console.error('Erreur creation dashboard:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message
      }
    } finally {
      creationLoading.value = false
    }
  }

  return {
    // State
    isWizardOpen,
    currentStep,
    showPrompt,
    triggerSource,
    sourceData,
    userObjective,
    analysisLoading,
    analysisResult,
    suggestedTags,
    suggestedKPIs,
    selectedTagIds,
    selectedKPIIds,
    dashboardName,
    previewWidgets,
    chartType,
    creationLoading,
    createdDashboard,
    conversationId,

    // Computed
    selectedTags,
    selectedKPIs,
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
    totalSelectedItems,

    // Actions
    showPostSubmitPrompt,
    dismissPrompt,
    openWizard,
    closeWizard,
    resetState,
    nextStep,
    previousStep,
    goToStep,
    toggleTagSelection,
    toggleKPISelection,
    selectAllTags,
    clearTagSelection,
    selectAllKPIs,
    clearKPISelection,
    runAnalysis,
    generatePreview,
    createDashboard
  }
})
