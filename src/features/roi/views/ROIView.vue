<template>
  <div class="roi-view">

    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Calculateur ROI</h1>
        <p>Estimation des gains de performance</p>
      </div>
      <div class="header-actions">
        <Button label="Objectifs" icon="pi pi-target" @click="configureObjectives" text class="btn-objectives" />
        <Button label="Nouveau calcul" icon="pi pi-calculator" @click="openROICalculator('investment')" class="btn-new" />
      </div>
    </div>

    <!-- Configuration -->
    <div class="config-band">
      <div class="project-choice">
        <button
          type="button"
          :class="{ active: roiStore.formData.projectType === 'machine' }"
          @click="roiStore.formData.projectType = 'machine'"
        >
          <i class="pi pi-cog"></i>
          Machines de production
        </button>
        <button
          type="button"
          :class="{ active: roiStore.formData.projectType === 'vehicle' }"
          @click="roiStore.formData.projectType = 'vehicle'"
        >
          <i class="pi pi-truck"></i>
          Engins & Véhicules
        </button>
      </div>
      <div class="input-actions">
        <Button label="Coûts initiaux" icon="pi pi-wallet" @click="openROICalculator('investment')" outlined />
        <Button label="Charges mensuelles" icon="pi pi-list-check" @click="openROICalculator('operating')" outlined />
        <Button label="Performance & gains" icon="pi pi-chart-line" @click="openROICalculator('performance')" outlined />
      </div>
    </div>

    <!-- Stats cards -->
    <div class="stats-row">
      <div class="stat-card stat-card--roi">
        <div class="stat-icon"><i class="pi pi-percentage"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ formatPercentage(moduleData?.estimatedROI || 0) }}%</span>
          <span class="stat-label">ROI global</span>
        </div>
      </div>
      <div class="stat-card stat-card--gain">
        <div class="stat-icon"><i class="pi pi-wallet"></i></div>
        <div class="stat-info">
          <span class="stat-value gain">{{ formatCurrencyShort(moduleData?.netGain || 0) }}</span>
          <span class="stat-label">Gain net total</span>
        </div>
      </div>
      <div class="stat-card stat-card--payback">
        <div class="stat-icon"><i class="pi pi-clock"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ formatMonths(moduleData?.paybackPeriod || 0) }} mois</span>
          <span class="stat-label">DRCI</span>
        </div>
      </div>
      <div class="stat-card stat-card--count">
        <div class="stat-icon"><i class="pi pi-history"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ roiHistory.length }}</span>
          <span class="stat-label">Calculs effectués</span>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="main-content">

      <!-- Historique -->
      <div class="history-card" v-if="roiHistory.length > 0">
        <div class="card-header">
          <span class="card-title">Historique des calculs</span>
          <span class="count-badge">{{ roiHistory.length }}</span>
        </div>

        <DataTable
          :value="roiHistory"
          paginator
          :rows="8"
          :rowsPerPageOptions="[8, 15, 30]"
          paginatorTemplate="PrevPageLink PageLinks NextPageLink RowsPerPageDropdown"
          class="history-table"
          :rowHover="true"
          @row-click="e => viewCalculation(e.data)"
        >
          <Column header="Date" style="min-width: 160px">
            <template #body="{ data }">
              <span class="col-date">{{ formatDate(data.date) }}</span>
            </template>
          </Column>
          <Column header="ROI" style="width: 120px">
            <template #body="{ data }">
              <span class="col-roi">{{ data.roi || 0 }}%</span>
            </template>
          </Column>
          <Column header="Gain net" style="width: 160px">
            <template #body="{ data }">
              <span class="col-gain">{{ formatCurrencyShort(data.gain || 0) }}</span>
            </template>
          </Column>
          <Column header="Retour" style="width: 120px">
            <template #body="{ data }">
              <span class="col-payback">{{ formatMonths(data.payback || 0) }} mois</span>
            </template>
          </Column>
          <Column style="width: 60px">
            <template #body>
              <i class="pi pi-chevron-right row-arrow"></i>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Empty State -->
      <div class="empty-card" v-else>
        <i class="pi pi-calculator empty-icon"></i>
        <h3>Aucun calcul effectué</h3>
        <p>Lancez votre premier calcul ROI pour estimer vos gains de performance</p>
        <Button label="Lancer un calcul" icon="pi pi-calculator" @click="openROICalculator('investment')" class="btn-new" />
      </div>

    </div>

    <!-- ROI Calculator Dialog -->
    <ROICalculator />

    <!-- ROI Objectives Dialog -->
    <ROIObjectives
      v-model:visible="showROIObjectives"
      @objectives-saved="handleObjectivesSaved"
    />

    <!-- Calculation Details Dialog -->
    <Dialog
      v-model:visible="showCalculationDetails"
      :modal="true"
      :closable="true"
      :dismissableMask="true"
      :style="{ width: 'min(760px, 95vw)', maxHeight: '90vh' }"
      :contentStyle="{ padding: '1.25rem 1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 130px)' }"
      class="details-modal"
    >
      <template #header>
        <span class="modal-title">Détails du calcul ROI</span>
      </template>

      <div v-if="calculationDetails">
        <!-- KPIs -->
        <div class="detail-kpis">
          <div class="detail-kpi detail-kpi--blue">
            <span class="dkpi-label">ROI global</span>
            <span class="dkpi-value">{{ formatPercentage(calculationDetails.roi_global || calculationDetails.roi_6_mois || calculationDetails.roi) }}%</span>
          </div>
          <div class="detail-kpi detail-kpi--green">
            <span class="dkpi-label">Gain net total</span>
            <span class="dkpi-value">{{ formatCurrency(calculationDetails.net_total_gain || calculationDetails.gain_net_6_mois || calculationDetails.gain) }}</span>
          </div>
          <div class="detail-kpi detail-kpi--orange">
            <span class="dkpi-label">DRCI</span>
            <span class="dkpi-value">{{ formatMonths(calculationDetails.drci_months || calculationDetails.payback_period || calculationDetails.payback) }} mois</span>
          </div>
        </div>

        <!-- Gains -->
        <div class="detail-section">
          <h4>Répartition des gains mensuels</h4>
          <div class="gains-grid">
            <div class="gain-item">
              <span class="gain-label">Production</span>
              <span class="gain-value">{{ formatCurrency(calculationDetails.gain_production_mensuel || 0) }}</span>
            </div>
            <div class="gain-item">
              <span class="gain-label">Réduction arrêts</span>
              <span class="gain-value">{{ formatCurrency(calculationDetails.gain_arrets_mensuel || 0) }}</span>
            </div>
            <div class="gain-item">
              <span class="gain-label">Réduction rebuts</span>
              <span class="gain-value">{{ formatCurrency(calculationDetails.gain_rebuts_mensuel || 0) }}</span>
            </div>
            <div class="gain-item">
              <span class="gain-label">Réduction pannes</span>
              <span class="gain-value">{{ formatCurrency(calculationDetails.gain_pannes_mensuel || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Leviers -->
        <div class="detail-section" v-if="calculationDetails.leviers_performance?.length">
          <h4>Principaux leviers de performance</h4>
          <div class="leviers-list">
            <div v-for="(lever, i) in calculationDetails.leviers_performance" :key="i" class="lever-item">
              <i class="pi pi-check-circle"></i>
              <span>{{ lever }}</span>
            </div>
          </div>
        </div>

        <!-- Paramètres -->
        <div class="detail-section">
          <h4>Paramètres du calcul</h4>
          <div class="params-grid">
            <div class="param-item">
              <span class="param-label">Machines/engins</span>
              <span class="param-value">{{ calculationDetails.nombre_machines || 'N/A' }}</span>
            </div>
            <div class="param-item">
              <span class="param-label">TRS actuel</span>
              <span class="param-value">{{ calculationDetails.trs_actuel || 'N/A' }}%</span>
            </div>
            <div class="param-item">
              <span class="param-label">Gain TRS visé</span>
              <span class="param-value">{{ calculationDetails.gain_trs || 'N/A' }} pts</span>
            </div>
            <div class="param-item">
              <span class="param-label">Réduction arrêts</span>
              <span class="param-value">{{ calculationDetails.reduction_arrets || 'N/A' }}%</span>
            </div>
            <div class="param-item">
              <span class="param-label">Réduction rebuts</span>
              <span class="param-value">{{ calculationDetails.reduction_rebuts || 'N/A' }}%</span>
            </div>
            <div class="param-item">
              <span class="param-label">Coût implémentation</span>
              <span class="param-value">{{ formatCurrency(calculationDetails.cout_implementation || 0) }}</span>
            </div>
          </div>
        </div>

        <p class="detail-date">Calcul effectué le {{ formatDate(calculationDetails.created_at || selectedCalculation?.date) }}</p>
      </div>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useROIStore } from '@/features/dashboard/stores/roiStore'
import ROICalculator from '@/features/dashboard/components/ROICalculator.vue'
import ROIObjectives from '@/features/dashboard/components/ROIObjectives.vue'
import { useToast } from 'primevue/usetoast'
import { axiosInstance } from '@/main'

const roiStore = useROIStore()
const toast = useToast()

// État local
const moduleData = ref({})
const showROIObjectives = ref(false)

// Historique réactif directement depuis le store
const roiHistory = computed(() => roiStore.calculationHistory)
const showCalculationDetails = ref(false)
const selectedCalculation = ref(null)
const calculationDetails = ref(null)

// Mettre à jour les données quand un nouveau calcul est effectué
watch(() => roiStore.lastCalculation, (newCalculation) => {
  if (newCalculation) {
    moduleData.value = {
      estimatedROI: newCalculation.roi_global || newCalculation.roi6Mois || newCalculation.roi_6_mois || 0,
      netGain: newCalculation.net_total_gain || newCalculation.gainNet6Mois || newCalculation.gain_net_6_mois || 0,
      paybackPeriod: newCalculation.drci_months || newCalculation.paybackPeriod || newCalculation.payback_period || 0
    }
  }
}, { deep: true })

// Méthodes
const formatCurrency = (amount) => {
  if (!amount) return '0 F CFA'
  const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return formatted + ' F CFA'
}

const formatCurrencyShort = (amount) => {
  if (!amount) return '0 F'
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + ' M F'
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + ' K F'
  }
  return Math.round(amount) + ' F'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPercentage = (value) => {
  if (!value && value !== 0) return '0.00'
  return Number(value).toFixed(2)
}

const formatMonths = (value) => {
  if (!value && value !== 0) return '0.0'
  return Number(value).toFixed(1)
}

const openROICalculator = (modal = 'investment') => {
  roiStore.activeInputModal = modal
  roiStore.showCalculator = true
}

const configureObjectives = () => {
  showROIObjectives.value = true
}

const handleObjectivesSaved = (objectives) => {
  toast.add({
    severity: 'success',
    summary: 'Objectifs sauvegardés',
    detail: 'Vos objectifs dynamiques ont été enregistrés avec succès',
    life: 3000
  })
}


const viewCalculation = async (calculation) => {
  if (!calculation) {
    toast.add({
      severity: 'warn',
      summary: 'Erreur',
      detail: 'Aucune donnée disponible pour ce calcul',
      life: 3000
    })
    return
  }

  // Vérifier si c'est un calcul local (non sauvegardé en backend)
  const isLocalCalc = calculation.isLocal || String(calculation.id).startsWith('local_')

  if (isLocalCalc) {
    // Pour les calculs locaux, utiliser directement les données disponibles
    calculationDetails.value = {
      ...calculation,
      gain_production_mensuel: calculation.gain_production_mensuel || calculation.gain * 0.4,
      gain_arrets_mensuel: calculation.gain_arrets_mensuel || calculation.gain * 0.3,
      gain_rebuts_mensuel: calculation.gain_rebuts_mensuel || calculation.gain * 0.2,
      gain_pannes_mensuel: calculation.gain_pannes_mensuel || calculation.gain * 0.1,
      leviers_performance: calculation.leviers || ['Amélioration TRS', 'Réduction des arrêts', 'Optimisation qualité']
    }
    selectedCalculation.value = calculation
    showCalculationDetails.value = true
    return
  }

  try {
    // Charger les détails complets du calcul depuis l'API
    const response = await axiosInstance.get(`/roi/calculations/${calculation.id}/`)
    calculationDetails.value = response.data
    selectedCalculation.value = calculation
    showCalculationDetails.value = true
  } catch (error) {
    console.error('Erreur lors du chargement des détails:', error)

    // Fallback avec les données disponibles
    calculationDetails.value = {
      ...calculation,
      gain_production_mensuel: calculation.gain_production_mensuel || calculation.gain * 0.4,
      gain_arrets_mensuel: calculation.gain_arrets_mensuel || calculation.gain * 0.3,
      gain_rebuts_mensuel: calculation.gain_rebuts_mensuel || calculation.gain * 0.2,
      gain_pannes_mensuel: calculation.gain_pannes_mensuel || calculation.gain * 0.1,
      leviers_performance: calculation.leviers || ['Amélioration TRS', 'Réduction des arrêts', 'Optimisation qualité']
    }
    selectedCalculation.value = calculation
    showCalculationDetails.value = true
  }
}

const loadROIData = async () => {
  try {
    // Charger les statistiques ROI depuis l'API
    const stats = await roiStore.loadStatistics();
    
    // Charger l'historique des calculs
    await roiStore.loadCalculations()

    // Utiliser le dernier calcul si disponible, sinon les statistiques
    if (roiStore.lastCalculation) {
      moduleData.value = {
        estimatedROI: roiStore.lastCalculation.roi_global || roiStore.lastCalculation.roi6Mois || roiStore.lastCalculation.roi_6_mois || 0,
        netGain: roiStore.lastCalculation.net_total_gain || roiStore.lastCalculation.gainNet6Mois || roiStore.lastCalculation.gain_net_6_mois || 0,
        paybackPeriod: roiStore.lastCalculation.drci_months || roiStore.lastCalculation.paybackPeriod || roiStore.lastCalculation.payback_period || 0
      }
    } else if (roiHistory.value.length > 0) {
      // Utiliser le premier calcul de l'historique (le plus récent)
      const latestCalc = roiHistory.value[0]
      moduleData.value = {
        estimatedROI: latestCalc.roi_global || latestCalc.roi || latestCalc.roi6Mois || latestCalc.roi_6_mois || 0,
        netGain: latestCalc.net_total_gain || latestCalc.gain || latestCalc.gainNet6Mois || latestCalc.gain_net_6_mois || 0,
        paybackPeriod: latestCalc.drci_months || latestCalc.payback || latestCalc.paybackPeriod || latestCalc.payback_period || 0
      }
    } else {
      // Utiliser les statistiques moyennes
      moduleData.value = {
        estimatedROI: stats.average_roi || 0,
        netGain: stats.total_gain_potential || 0,
        paybackPeriod: stats.average_payback || 0
      }
    }
    
  } catch (error) {
    console.error('Erreur lors du chargement des données ROI:', error)
    
    // Utiliser le dernier calcul du store si disponible même en cas d'erreur
    if (roiStore.lastCalculation) {
      moduleData.value = {
        estimatedROI: roiStore.lastCalculation.roi_global || roiStore.lastCalculation.roi6Mois || roiStore.lastCalculation.roi_6_mois || 0,
        netGain: roiStore.lastCalculation.net_total_gain || roiStore.lastCalculation.gainNet6Mois || roiStore.lastCalculation.gain_net_6_mois || 0,
        paybackPeriod: roiStore.lastCalculation.drci_months || roiStore.lastCalculation.paybackPeriod || roiStore.lastCalculation.payback_period || 0
      }
    } else {
      // Données par défaut en cas d'erreur
      moduleData.value = {
        estimatedROI: 0,
        netGain: 0,
        paybackPeriod: 0
      }
    }
    
    // Historique de test si l'API n'est pas disponible
    if (roiHistory.value.length === 0) {
      // Ajouter des données de démo directement dans le store
      roiStore.calculationHistory.push(
        {
          id: 'demo_1',
          isLocal: true,
          date: new Date(),
          roi: 45.2,
          gain: 2500000,
          payback: 3.5
        },
        {
          id: 'demo_2',
          isLocal: true,
          date: new Date(Date.now() - 86400000), // Hier
          roi: 38.7,
          gain: 1800000,
          payback: 4.2
        }
      )

      toast.add({
        severity: 'warn',
        summary: 'Mode démo',
        detail: 'Données de démonstration - Connectez-vous à l\'API pour les vraies données',
        life: 5000
      })
    }
  }
}

onMounted(() => {
  loadROIData()
})
</script>

<style scoped>
.roi-view {
  padding: 1.5rem 2rem;
  background: #f8fafc;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
}

/* ── Header ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 1rem 1.375rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.header-content h1 {
  margin: 0 0 0.2rem;
  font-size: 1.375rem;
  font-weight: 700;
  color: #0B2B3C;
}

.header-content p {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
}

.header-actions { display: flex; gap: 0.625rem; }

.btn-new {
  background: #7AC943 !important;
  border-color: #7AC943 !important;
  color: white !important;
  font-weight: 600;
}
.btn-new:hover { background: #6bb835 !important; border-color: #6bb835 !important; }

.btn-objectives { color: #64748b !important; }
.btn-objectives:hover { background: #f1f5f9 !important; }

/* ── Configuration ── */
.config-band {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.25rem;
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 0.875rem 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.project-choice,
.input-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.project-choice button {
  border: 1px solid #dbe3ec;
  background: #fff;
  color: #475569;
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
}

.project-choice button.active {
  background: #0B2B3C;
  border-color: #0B2B3C;
  color: #fff;
}

/* ── Stats cards ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 0.875rem 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
}

.stat-card--roi .stat-icon   { background: rgba(11,43,60,0.08); color: #0B2B3C; }
.stat-card--gain .stat-icon  { background: rgba(122,201,67,0.12); color: #5a9e30; }
.stat-card--payback .stat-icon { background: rgba(245,158,11,0.12); color: #d97706; }
.stat-card--count .stat-icon { background: rgba(59,130,246,0.1); color: #3b82f6; }

.stat-info { display: flex; flex-direction: column; gap: 0.1rem; }

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0B2B3C;
  line-height: 1;
}

.stat-value.gain { color: #5a9e30; }

.stat-label {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ── Main content ── */
.main-content { display: flex; flex-direction: column; gap: 1rem; }

/* ── History card ── */
.history-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.card-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.count-badge {
  background: rgba(11,43,60,0.08);
  color: #0B2B3C;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.history-table { border: none; }

.col-date  { font-size: 0.8125rem; color: #64748b; }
.col-roi   { font-size: 0.875rem; font-weight: 700; color: #0B2B3C; }
.col-gain  { font-size: 0.875rem; font-weight: 600; color: #5a9e30; }
.col-payback { font-size: 0.8125rem; color: #d97706; font-weight: 500; }

.row-arrow { color: #cbd5e1; font-size: 0.75rem; }

/* ── Empty ── */
.empty-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.empty-icon { font-size: 2.5rem; color: #cbd5e1; }

.empty-card h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
}

.empty-card p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.875rem;
  max-width: 300px;
}

/* ── Details modal ── */
:deep(.details-modal .p-dialog-header) {
  padding: 1.125rem 1.5rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}
:deep(.details-modal .p-dialog-footer) {
  padding: 0.875rem 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.modal-title { font-size: 1rem; font-weight: 600; color: #1e293b; }

.detail-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.875rem;
  margin-bottom: 1.5rem;
}

.detail-kpi {
  border-radius: 10px;
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  text-align: center;
}
.detail-kpi--blue   { background: rgba(11,43,60,0.05); }
.detail-kpi--green  { background: rgba(122,201,67,0.08); }
.detail-kpi--orange { background: rgba(245,158,11,0.08); }

.dkpi-label { font-size: 0.75rem; color: #64748b; font-weight: 500; }
.dkpi-value { font-size: 1.25rem; font-weight: 700; color: #0B2B3C; }
.detail-kpi--green .dkpi-value  { color: #5a9e30; }
.detail-kpi--orange .dkpi-value { color: #d97706; }

.detail-section { margin-bottom: 1.25rem; }

.detail-section h4 {
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.gains-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.625rem;
}

.gain-item {
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.gain-label { font-size: 0.8rem; color: #64748b; }
.gain-value { font-size: 0.875rem; font-weight: 600; color: #5a9e30; }

.leviers-list { display: flex; flex-direction: column; gap: 0.4rem; }

.lever-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 7px;
  border-left: 3px solid #7AC943;
}
.lever-item i { color: #7AC943; font-size: 0.875rem; }
.lever-item span { font-size: 0.875rem; font-weight: 500; color: #1e293b; }

.params-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 7px;
}
.param-label { font-size: 0.8rem; color: #64748b; }
.param-value { font-size: 0.8rem; font-weight: 600; color: #0B2B3C; }

.detail-date {
  text-align: center;
  color: #94a3b8;
  font-size: 0.8rem;
  margin: 1rem 0 0;
  padding-top: 0.875rem;
  border-top: 1px solid #f1f5f9;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .config-band { flex-direction: column; align-items: stretch; }
  .input-actions :deep(.p-button) { flex: 1 1 180px; }
}

@media (max-width: 640px) {
  .roi-view { padding: 1rem; }
  .page-header { flex-direction: column; align-items: stretch; gap: 0.75rem; }
  .header-actions { justify-content: flex-end; }
  .project-choice button { flex: 1 1 100%; justify-content: center; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .detail-kpis { grid-template-columns: 1fr; }
  .gains-grid, .params-grid { grid-template-columns: 1fr; }
}
</style>
