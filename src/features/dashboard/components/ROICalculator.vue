<template>
  <Dialog
    v-model:visible="roiStore.showCalculator"
    :modal="true"
    :closable="true"
    :dismissableMask="true"
    :style="{ width: 'min(980px, 96vw)' }"
    :contentStyle="{ padding: '0', overflow: 'hidden' }"
    class="roi-calculator-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="dialog-icon"><i class="pi pi-calculator"></i></div>
        <div>
          <span class="dialog-title">{{ modalTitle }}</span>
          <span class="dialog-subtitle">{{ modalSubtitle }}</span>
        </div>
      </div>
    </template>

    <div class="calculator-shell">
      <section class="config-strip">
        <div class="project-toggle" role="group" aria-label="Type de projet ROI">
          <button
            type="button"
            :class="{ active: roiStore.formData.projectType === 'machine' }"
            @click="roiStore.formData.projectType = 'machine'"
          >
            <i class="pi pi-cog"></i>
            Machine de production
          </button>
          <button
            type="button"
            :class="{ active: roiStore.formData.projectType === 'vehicle' }"
            @click="roiStore.formData.projectType = 'vehicle'"
          >
            <i class="pi pi-truck"></i>
            Engin & véhicule
          </button>
        </div>

        <div class="modal-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="{ active: roiStore.activeInputModal === tab.key }"
            @click="roiStore.activeInputModal = tab.key"
          >
            <i :class="tab.icon"></i>
            {{ tab.label }}
          </button>
        </div>
      </section>

      <div class="calculator-body">
        <section class="input-panel">
          <div v-if="roiStore.activeInputModal === 'investment'" class="fields-grid">
            <div class="form-field">
              <label>{{ isVehicle ? "Prix d'achat de l'engin" : "Prix d'achat de la machine" }}</label>
              <InputNumber v-model="roiStore.formData.purchasePrice" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
            </div>

            <template v-if="isVehicle">
              <div class="form-field">
                <label>Frais de transport / importation</label>
                <InputNumber v-model="roiStore.formData.transportImportCost" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
              </div>
              <div class="form-field">
                <label>Frais de mise en service</label>
                <InputNumber v-model="roiStore.formData.commissioningCost" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
              </div>
            </template>

            <template v-else>
              <div class="form-field">
                <label>Frais d'installation</label>
                <InputNumber v-model="roiStore.formData.installationCost" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
              </div>
              <div class="form-field">
                <label>Frais de formation initiale</label>
                <InputNumber v-model="roiStore.formData.trainingCost" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
              </div>
            </template>
          </div>

          <div v-else-if="roiStore.activeInputModal === 'operating'" class="fields-grid">
            <template v-if="isVehicle">
              <div class="form-field">
                <label>Frais d'entretien et réparations</label>
                <InputNumber v-model="roiStore.formData.maintenanceRepairs" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
              </div>
              <div class="form-field">
                <label>Consommation de carburant</label>
                <InputNumber v-model="roiStore.formData.fuelConsumption" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
              </div>
            </template>

            <template v-else>
              <div class="form-field">
                <label>Frais de maintenance</label>
                <InputNumber v-model="roiStore.formData.maintenanceCost" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
              </div>
              <div class="form-field">
                <label>Consommation énergétique</label>
                <InputNumber v-model="roiStore.formData.energyConsumption" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
              </div>
              <div class="form-field">
                <label>Consommables</label>
                <InputNumber v-model="roiStore.formData.consumables" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
              </div>
            </template>

            <div class="form-field">
              <label>Main-d'oeuvre dédiée</label>
              <InputNumber v-model="roiStore.formData.dedicatedLabor" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
            </div>
            <div class="form-field">
              <label>Frais d'amortissement</label>
              <InputNumber v-model="roiStore.formData.depreciation" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
            </div>
            <div class="form-field">
              <label>Frais d'assurance</label>
              <InputNumber v-model="roiStore.formData.insurance" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
            </div>
          </div>

          <div v-else class="performance-stack">
            <div class="fields-grid">
              <template v-if="isVehicle">
                <div class="form-field">
                  <label>Nombre d'heures d'utilisation prévues</label>
                  <InputNumber v-model="roiStore.formData.plannedUsageHours" :min="0" suffix=" h" class="w-full" />
                </div>
                <div class="form-field">
                  <label>Taux de disponibilité de l'engin</label>
                  <InputNumber v-model="roiStore.formData.availabilityRate" :min="0" :max="100" suffix="%" class="w-full" />
                </div>
                <div class="form-field">
                  <label>Tarif horaire de location</label>
                  <InputNumber v-model="roiStore.formData.hourlyRate" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
                </div>
              </template>

              <template v-else>
                <div class="form-field">
                  <label>Capacité de production horaire</label>
                  <InputNumber v-model="roiStore.formData.hourlyProductionCapacity" :min="0" class="w-full" />
                </div>
                <div class="form-field">
                  <label>Taux d'utilisation effectif</label>
                  <InputNumber v-model="roiStore.formData.utilizationRate" :min="0" :max="100" suffix="%" class="w-full" />
                </div>
                <div class="form-field">
                  <label>Rendement réel</label>
                  <InputNumber v-model="roiStore.formData.realYieldRate" :min="0" :max="100" suffix="%" class="w-full" />
                </div>
                <div class="form-field">
                  <label>Marge nette par produit fabriqué</label>
                  <InputNumber v-model="roiStore.formData.netMarginPerProduct" :min="0" mode="currency" currency="XOF" locale="fr-FR" class="w-full" />
                </div>
              </template>

              <div class="form-field">
                <label>Période d'analyse</label>
                <InputNumber v-model="roiStore.formData.analysisPeriodMonths" :min="1" :max="120" suffix=" mois" class="w-full" />
              </div>
            </div>

            <div class="ramp-section">
              <div class="section-label">Montée en charge des gains</div>
              <div class="ramp-grid">
                <div v-for="month in 5" :key="month" class="form-field ramp-field">
                  <label>Mois {{ month }}</label>
                  <InputNumber v-model="roiStore.formData.rampUpPercentages[month - 1]" :min="0" :max="100" suffix="%" class="w-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside class="result-panel">
          <div v-if="!roiStore.lastCalculation" class="result-empty">
            <i class="pi pi-chart-line"></i>
            <strong>Résultats ROI</strong>
            <span>Les indicateurs se calculent dès validation des données.</span>
          </div>

          <template v-else>
            <div class="result-title">Tableau de bord</div>
            <div class="result-kpi">
              <span>ROI global</span>
              <strong>{{ formatPercentage(resultValue('roi_global', 'roi6Mois')) }}</strong>
            </div>
            <div class="result-kpi">
              <span>DRCI</span>
              <strong>{{ formatMonths(resultValue('drci_months', 'paybackPeriod')) }}</strong>
            </div>
            <div class="result-kpi">
              <span>Gain net total</span>
              <strong>{{ formatCurrency(resultValue('net_total_gain', 'gainNet6Mois')) }}</strong>
            </div>
            <div class="result-meta">
              <span>Investissement total</span>
              <strong>{{ formatCurrency(roiStore.lastCalculation.investment_total || 0) }}</strong>
            </div>
            <div class="result-meta">
              <span>Charges mensuelles</span>
              <strong>{{ formatCurrency(roiStore.lastCalculation.monthly_operating_costs || 0) }}</strong>
            </div>
            <div class="result-meta">
              <span>Gain brut mensuel</span>
              <strong>{{ formatCurrency(roiStore.lastCalculation.gross_monthly_gain || 0) }}</strong>
            </div>

            <div v-if="roiStore.lastCalculation.monthly_rows?.length" class="monthly-list">
              <div class="section-label">Projection mensuelle</div>
              <div v-for="row in roiStore.lastCalculation.monthly_rows.slice(0, 12)" :key="row.month" class="month-row">
                <span>M{{ row.month }} · {{ row.ramp_up_percent }}%</span>
                <strong>{{ formatCurrency(row.net_gain) }}</strong>
              </div>
            </div>
          </template>
        </aside>
      </div>
    </div>

    <template #footer>
      <div class="dialog-actions">
        <Button label="Réinitialiser" icon="pi pi-refresh" @click="roiStore.resetForm" text />
        <div class="primary-actions">
          <Button label="Sauvegarder" icon="pi pi-save" @click="saveCalculation" :disabled="!roiStore.lastCalculation" outlined />
          <Button label="Calculer le ROI" icon="pi pi-calculator" @click="calculateROI" :loading="roiStore.loading" :disabled="!roiStore.hasValidData" class="btn-calculate" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useROIStore } from '../stores/roiStore'
import { useToast } from 'primevue/usetoast'

const roiStore = useROIStore()
const toast = useToast()

const tabs = [
  { key: 'investment', label: 'Investissement initial', icon: 'pi pi-wallet' },
  { key: 'operating', label: 'Charges mensuelles', icon: 'pi pi-list-check' },
  { key: 'performance', label: 'Performance & gains', icon: 'pi pi-chart-line' }
]

const isVehicle = computed(() => roiStore.formData.projectType === 'vehicle')

const modalTitle = computed(() => {
  if (roiStore.activeInputModal === 'operating') return "Coûts d'exploitation mensuels"
  if (roiStore.activeInputModal === 'performance') return 'Paramètres de performance et gains'
  return "Coûts d'investissement initial"
})

const modalSubtitle = computed(() => {
  return isVehicle.value ? 'Projet Engins & Véhicules' : 'Projet Machines de production'
})

const resultValue = (primary, fallback) => {
  const result = roiStore.lastCalculation || {}
  return result[primary] ?? result[fallback] ?? 0
}

const formatCurrency = (amount) => {
  if (!amount) return '0 F CFA'
  const formatted = Math.round(Number(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${formatted} F CFA`
}

const formatPercentage = (value) => {
  if (!value && value !== 0) return '0.00%'
  return `${Number(value).toFixed(2)}%`
}

const formatMonths = (value) => {
  if (!value || Number(value) >= 999) return 'Non atteint'
  return `${Number(value).toFixed(1)} mois`
}

const calculateROI = async () => {
  await roiStore.calculateROI()
  toast.add({
    severity: 'success',
    summary: 'ROI calculé',
    detail: 'Les indicateurs ont été mis à jour',
    life: 2500
  })
}

const saveCalculation = async () => {
  try {
    await roiStore.saveCalculation()
    toast.add({
      severity: 'success',
      summary: 'Calcul sauvegardé',
      detail: 'Le calcul ROI a été enregistré',
      life: 2500
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Sauvegarde impossible',
      detail: error?.response?.data?.error || 'Le calcul n’a pas pu être sauvegardé',
      life: 3500
    })
  }
}
</script>

<style scoped>
:deep(.roi-calculator-dialog .p-dialog-header) {
  padding: 1.125rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

:deep(.roi-calculator-dialog .p-dialog-footer) {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.dialog-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(122, 201, 67, 0.14);
  color: #5a9e30;
}

.dialog-title,
.dialog-subtitle {
  display: block;
}

.dialog-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0B2B3C;
}

.dialog-subtitle {
  margin-top: 0.15rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.calculator-shell {
  background: #f8fafc;
}

.config-strip {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.project-toggle,
.modal-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.project-toggle button,
.modal-tabs button {
  border: 1px solid #dbe3ec;
  background: white;
  color: #475569;
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.project-toggle button.active,
.modal-tabs button.active {
  background: #0B2B3C;
  border-color: #0B2B3C;
  color: white;
}

.calculator-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  min-height: 430px;
}

.input-panel {
  padding: 1.25rem;
  border-right: 1px solid #e2e8f0;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.performance-stack {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-field label,
.section-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: #64748b;
}

.ramp-section {
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.ramp-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.result-panel {
  padding: 1.25rem;
  background: white;
}

.result-empty {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
  color: #94a3b8;
}

.result-empty i {
  font-size: 2rem;
  color: #cbd5e1;
}

.result-empty strong {
  color: #334155;
}

.result-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0B2B3C;
  margin-bottom: 0.875rem;
}

.result-kpi {
  padding: 0.875rem 1rem;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  margin-bottom: 0.75rem;
}

.result-kpi span,
.result-meta span,
.month-row span {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.result-kpi strong {
  display: block;
  margin-top: 0.2rem;
  font-size: 1.25rem;
  color: #0B2B3C;
}

.result-meta,
.month-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.result-meta strong,
.month-row strong {
  font-size: 0.8125rem;
  color: #1e293b;
  text-align: right;
}

.monthly-list {
  margin-top: 1rem;
  max-height: 170px;
  overflow: auto;
}

.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.primary-actions {
  display: flex;
  gap: 0.625rem;
}

.btn-calculate {
  background: #7AC943 !important;
  border-color: #7AC943 !important;
  color: white !important;
  font-weight: 700;
}

@media (max-width: 860px) {
  .calculator-body {
    grid-template-columns: 1fr;
  }

  .input-panel {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .fields-grid,
  .ramp-grid {
    grid-template-columns: 1fr;
  }

  .dialog-actions,
  .primary-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
