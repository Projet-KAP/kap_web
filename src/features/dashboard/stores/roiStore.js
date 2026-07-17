import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main'

export const useROIStore = defineStore('roi', () => {
  // State
  const showCalculator = ref(false)
  const loading = ref(false)
  const lastCalculation = ref(null)
  const calculationHistory = ref([])
  
  // Formulaire de données
  const formData = ref({
    projectType: 'machine',
    analysisPeriodMonths: 12,
    purchasePrice: 25000000,
    installationCost: 2500000,
    trainingCost: 1000000,
    transportImportCost: 1500000,
    commissioningCost: 800000,
    maintenanceCost: 650000,
    energyConsumption: 900000,
    consumables: 450000,
    dedicatedLabor: 1200000,
    depreciation: 500000,
    insurance: 250000,
    maintenanceRepairs: 700000,
    fuelConsumption: 1500000,
    hourlyProductionCapacity: 120,
    utilizationRate: 75,
    realYieldRate: 90,
    netMarginPerProduct: 2500,
    plannedUsageHours: 180,
    availabilityRate: 85,
    hourlyRate: 45000,
    rampUpPercentages: [20, 40, 60, 80, 100]
  })

  const activeInputModal = ref('investment')

  const buildPayload = () => ({
    project_type: formData.value.projectType,
    analysis_period_months: formData.value.analysisPeriodMonths,
    purchase_price: formData.value.purchasePrice,
    installation_cost: formData.value.installationCost,
    training_cost: formData.value.trainingCost,
    transport_import_cost: formData.value.transportImportCost,
    commissioning_cost: formData.value.commissioningCost,
    maintenance_cost: formData.value.maintenanceCost,
    energy_consumption: formData.value.energyConsumption,
    consumables: formData.value.consumables,
    dedicated_labor: formData.value.dedicatedLabor,
    depreciation: formData.value.depreciation,
    insurance: formData.value.insurance,
    maintenance_repairs: formData.value.maintenanceRepairs,
    fuel_consumption: formData.value.fuelConsumption,
    hourly_production_capacity: formData.value.hourlyProductionCapacity,
    utilization_rate: formData.value.utilizationRate,
    real_yield_rate: formData.value.realYieldRate,
    net_margin_per_product: formData.value.netMarginPerProduct,
    planned_usage_hours: formData.value.plannedUsageHours,
    availability_rate: formData.value.availabilityRate,
    hourly_rate: formData.value.hourlyRate,
    ramp_up_percentages: formData.value.rampUpPercentages
  })

  // Computed
  const hasValidData = computed(() => {
    return formData.value.purchasePrice > 0 && formData.value.analysisPeriodMonths > 0
  })

  // Calculs ROI
  const calculateROI = async () => {
    loading.value = true
    
    try {
      const response = await axiosInstance.post('/roi/calculate/', buildPayload())
      
      // Sauvegarder le résultat
      lastCalculation.value = response.data

      // Ajouter à l'historique avec l'ID du backend
      calculationHistory.value.unshift({
        id: response.data.id || `local_${Date.now()}`,
        date: new Date(),
        isLocal: !response.data.id,
        roi: response.data.roi_global || response.data.roi_6_mois || 0,
        gain: response.data.net_total_gain || response.data.gain_net_6_mois || 0,
        payback: response.data.drci_months || response.data.payback_period || 0,
        ...response.data
      })
      
    } catch (error) {
      console.error('Erreur lors du calcul ROI:', error)
      const result = calculateLocalBusinessROI()
      
      // Sauvegarder le résultat
      lastCalculation.value = result

      // Ajouter à l'historique (calcul local non sauvegardé)
      calculationHistory.value.unshift({
        id: `local_${Date.now()}`,
        date: new Date(),
        isLocal: true,
        roi: result.roi_global || 0,
        gain: result.net_total_gain || 0,
        payback: result.drci_months || 0,
        ...result
      })
    } finally {
      loading.value = false
    }
  }

  // Actions
  const updateFormData = (field, value) => {
    formData.value[field] = value
  }

  const resetForm = () => {
    formData.value = {
      projectType: 'machine',
      analysisPeriodMonths: 12,
      purchasePrice: 25000000,
      installationCost: 2500000,
      trainingCost: 1000000,
      transportImportCost: 1500000,
      commissioningCost: 800000,
      maintenanceCost: 650000,
      energyConsumption: 900000,
      consumables: 450000,
      dedicatedLabor: 1200000,
      depreciation: 500000,
      insurance: 250000,
      maintenanceRepairs: 700000,
      fuelConsumption: 1500000,
      hourlyProductionCapacity: 120,
      utilizationRate: 75,
      realYieldRate: 90,
      netMarginPerProduct: 2500,
      plannedUsageHours: 180,
      availabilityRate: 85,
      hourlyRate: 45000,
      rampUpPercentages: [20, 40, 60, 80, 100]
    }
  }

  const closeCalculator = () => {
    showCalculator.value = false
  }

  // Méthodes API
  const saveCalculation = async () => {
    if (!lastCalculation.value) return null
    
    try {
      const backendData = {
        name: `Calcul ROI ${new Date().toLocaleDateString('fr-FR')}`,
        ...buildPayload()
      }
      
      const response = await axiosInstance.post('/roi/save/', backendData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      throw error
    }
  }

  const loadCalculations = async () => {
    try {
      const response = await axiosInstance.get('/roi/history/')
      calculationHistory.value = response.data.map(calc => ({
        id: calc.id,
        date: new Date(calc.created_at),
        roi: calc.roi_global || calc.roi_6_mois || calc.roi6Mois || 0,
        gain: calc.net_total_gain || calc.gain_net_6_mois || calc.gainNet6Mois || 0,
        payback: calc.drci_months || calc.payback_period || calc.paybackPeriod || 0,
        // Garder toutes les données originales pour compatibilité
        ...calc
      }))
      return response.data
    } catch (error) {
      console.error('Erreur lors du chargement des calculs:', error)
      throw error
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await axiosInstance.get('/roi/statistics/')
      return response.data
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      throw error
    }
  }

  // Méthodes pour les objectifs ROI
  const loadObjectives = async () => {
    try {
      const response = await axiosInstance.get('/roi/objectives/active/')
      return response.data
    } catch (error) {
      console.error('Erreur lors du chargement des objectifs:', error)
      // Retourner un tableau vide pour les erreurs 404 (pas d'objectifs) ou 401 (non authentifié)
      if (error.response?.status === 404 || error.response?.status === 401) {
        return []
      }
      throw error
    }
  }

  const saveObjective = async (objectiveData) => {
    try {
      // Convertir les données camelCase vers snake_case pour le backend
      const backendData = {
        trs_target: objectiveData.trsTarget,
        trs_delay: objectiveData.trsDelay,
        arret_target: objectiveData.arretTarget,
        arret_delay: objectiveData.arretDelay,
        rebuts_target: objectiveData.rebutsTarget,
        rebuts_delay: objectiveData.rebutsDelay,
        engins_target: objectiveData.enginsTarget,
        engins_delay: objectiveData.enginsDelay,
        is_active: true
      }
      
      const response = await axiosInstance.post('/roi/objectives/', backendData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'objectif:', error)
      throw error
    }
  }

  const getCalculationDetail = async (calculationId) => {
    try {
      const response = await axiosInstance.get(`/api/v1/roi/calculations/${calculationId}/`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  const calculateLocalBusinessROI = () => {
    const d = formData.value
    const isVehicle = d.projectType === 'vehicle'
    const investment = isVehicle
      ? d.purchasePrice + d.transportImportCost + d.commissioningCost
      : d.purchasePrice + d.installationCost + d.trainingCost
    const monthlyCosts = isVehicle
      ? d.maintenanceRepairs + d.fuelConsumption + d.dedicatedLabor + d.depreciation + d.insurance
      : d.maintenanceCost + d.energyConsumption + d.consumables + d.dedicatedLabor + d.depreciation + d.insurance
    const grossGain = isVehicle
      ? d.plannedUsageHours * (d.availabilityRate / 100) * d.hourlyRate
      : d.hourlyProductionCapacity * (d.utilizationRate / 100) * (d.realYieldRate / 100) * d.netMarginPerProduct
    const months = Math.max(1, d.analysisPeriodMonths)
    const monthlyRows = []
    let netTotal = 0
    for (let month = 1; month <= months; month++) {
      const ramp = d.rampUpPercentages[month - 1] ?? d.rampUpPercentages[d.rampUpPercentages.length - 1] ?? 100
      const adjusted = grossGain * (ramp / 100)
      const net = adjusted - monthlyCosts
      netTotal += net
      monthlyRows.push({
        month,
        ramp_up_percent: ramp,
        gross_gain: Math.round(adjusted),
        operating_costs: Math.round(monthlyCosts),
        net_gain: Math.round(net),
        cumulative_net_gain: Math.round(netTotal)
      })
    }
    const average = netTotal / months
    const roi = investment > 0 ? ((netTotal - investment) / investment) * 100 : 0
    const drci = average > 0 ? investment / average : 999
    return {
      project_type: d.projectType,
      currency: 'XOF',
      analysis_period_months: months,
      investment_total: Math.round(investment),
      monthly_operating_costs: Math.round(monthlyCosts),
      gross_monthly_gain: Math.round(grossGain),
      net_total_gain: Math.round(netTotal),
      average_monthly_net_gain: Math.round(average),
      roi_global: Math.round(roi * 100) / 100,
      drci_months: Math.round(drci * 10) / 10,
      monthly_rows: monthlyRows,
      roi6Mois: Math.round(roi * 100) / 100,
      gainNet6Mois: Math.round(netTotal),
      paybackPeriod: Math.round(drci * 10) / 10,
      gainTotalMensuel: Math.round(grossGain),
      leviers: [isVehicle ? 'Revenus de location' : 'Marge de production', 'Montée en charge progressive', 'Maîtrise des coûts d’exploitation']
    }
  }

  return {
    // State
    showCalculator,
    loading,
    lastCalculation,
    formData,
    activeInputModal,
    calculationHistory,
    
    // Computed
    hasValidData,
    
    // Actions
    calculateROI,
    updateFormData,
    resetForm,
    closeCalculator,
    saveCalculation,
    loadCalculations,
    loadStatistics,
    loadObjectives,
    saveObjective,
    getCalculationDetail
  }
})
