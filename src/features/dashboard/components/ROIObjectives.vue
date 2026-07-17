<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    header="Objectifs dynamiques"
    :style="{ width: '90vw', maxWidth: '720px' }"
    class="roi-objectives-dialog"
    @hide="handleClose"
  >
    <div class="objectives-container">
      <!-- Description courte -->
      <p class="description">
        Definissez vos cibles de performance avec des delais pour estimer vos gains.
      </p>

      <!-- Objectifs existants -->
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Chargement...</span>
      </div>

      <div v-else-if="existingObjectives.length > 0" class="existing-section">
        <div class="section-header">
          <span class="section-title">Objectifs enregistres</span>
          <span class="count-badge">{{ existingObjectives.length }}</span>
        </div>
        <div class="existing-list">
          <div
            v-for="(objective, index) in existingObjectives"
            :key="objective.id"
            class="existing-item"
          >
            <div class="item-header">
              <span class="item-title">Objectif #{{ index + 1 }}</span>
              <span class="item-date">{{ formatDate(objective.created_at) }}</span>
            </div>
            <div class="item-metrics">
              <span>TRS: {{ objective.trs_target }}%</span>
              <span>Arrets: -{{ objective.arret_target }}%</span>
              <span>Rebuts: -{{ objective.rebuts_target }}%</span>
              <span>Engins: {{ objective.engins_target }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulaire d'objectifs -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">Nouvel objectif</span>
        </div>

        <div class="form-grid">
          <div class="form-card">
            <div class="card-title">TRS</div>
            <div class="form-row">
              <div class="form-field">
                <label>Cible (%)</label>
                <InputNumber
                  v-model="objectives.trsTarget"
                  :min="0"
                  :max="100"
                  suffix="%"
                />
              </div>
              <div class="form-field">
                <label>Delai</label>
                <InputNumber
                  v-model="objectives.trsDelay"
                  :min="1"
                  :max="24"
                  suffix=" mois"
                />
              </div>
            </div>
          </div>

          <div class="form-card">
            <div class="card-title">Reduction arrets</div>
            <div class="form-row">
              <div class="form-field">
                <label>Cible (%)</label>
                <InputNumber
                  v-model="objectives.arretTarget"
                  :min="0"
                  :max="100"
                  suffix="%"
                />
              </div>
              <div class="form-field">
                <label>Delai</label>
                <InputNumber
                  v-model="objectives.arretDelay"
                  :min="1"
                  :max="24"
                  suffix=" mois"
                />
              </div>
            </div>
          </div>

          <div class="form-card">
            <div class="card-title">Reduction rebuts</div>
            <div class="form-row">
              <div class="form-field">
                <label>Cible (%)</label>
                <InputNumber
                  v-model="objectives.rebutsTarget"
                  :min="0"
                  :max="100"
                  suffix="%"
                />
              </div>
              <div class="form-field">
                <label>Delai</label>
                <InputNumber
                  v-model="objectives.rebutsDelay"
                  :min="1"
                  :max="24"
                  suffix=" mois"
                />
              </div>
            </div>
          </div>

          <div class="form-card">
            <div class="card-title">Disponibilite engins</div>
            <div class="form-row">
              <div class="form-field">
                <label>Cible (%)</label>
                <InputNumber
                  v-model="objectives.enginsTarget"
                  :min="0"
                  :max="100"
                  suffix="%"
                />
              </div>
              <div class="form-field">
                <label>Delai</label>
                <InputNumber
                  v-model="objectives.enginsDelay"
                  :min="1"
                  :max="24"
                  suffix=" mois"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview des gains -->
      <div class="preview-section">
        <div class="section-header">
          <span class="section-title">Estimation des gains</span>
        </div>
        <div class="periods-grid">
          <div
            v-for="period in estimatedPeriods"
            :key="period.month"
            class="period-item"
          >
            <span class="period-label">Mois {{ period.month }}</span>
            <span class="period-points">{{ period.points }} pts</span>
            <span class="period-gain">{{ formatCurrencyShort(period.gain) }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Annuler"
          @click="handleClose"
          text
          class="cancel-btn"
        />
        <Button
          label="Sauvegarder"
          icon="pi pi-check"
          @click="saveObjectives"
          :loading="saving"
          class="save-btn"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useROIStore } from '@/features/dashboard/stores/roiStore'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'objectives-saved'])

const toast = useToast()
const roiStore = useROIStore()

const existingObjectives = ref([])
const loading = ref(false)
const saving = ref(false)

const objectives = ref({
  trsTarget: 85,
  trsDelay: 6,
  arretTarget: 40,
  arretDelay: 6,
  rebutsTarget: 60,
  rebutsDelay: 4,
  enginsTarget: 90,
  enginsDelay: 6
})

const estimatedPeriods = computed(() => {
  const periods = []
  const maxDelay = Math.max(
    objectives.value.trsDelay,
    objectives.value.arretDelay,
    objectives.value.rebutsDelay,
    objectives.value.enginsDelay
  )

  for (let month = 1; month <= Math.min(maxDelay, 6); month++) {
    let points = 0
    let gain = 0

    if (month <= objectives.value.trsDelay) {
      const progress = month / objectives.value.trsDelay
      points += Math.round(objectives.value.trsTarget * progress)
      gain += 500000 * progress
    }

    if (month <= objectives.value.arretDelay) {
      const progress = month / objectives.value.arretDelay
      points += Math.round(objectives.value.arretTarget * progress * 0.5)
      gain += 300000 * progress
    }

    if (month <= objectives.value.rebutsDelay) {
      const progress = month / objectives.value.rebutsDelay
      points += Math.round(objectives.value.rebutsTarget * progress * 0.3)
      gain += 200000 * progress
    }

    if (month <= objectives.value.enginsDelay) {
      const progress = month / objectives.value.enginsDelay
      points += Math.round(objectives.value.enginsTarget * progress * 0.4)
      gain += 400000 * progress
    }

    periods.push({
      month,
      points,
      gain: Math.round(gain)
    })
  }

  return periods
})

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
    year: 'numeric'
  })
}

const handleClose = () => {
  emit('update:visible', false)
}

const loadExistingObjectives = async () => {
  try {
    loading.value = true
    const objectives = await roiStore.loadObjectives()
    existingObjectives.value = objectives
  } catch (error) {
    console.error('Erreur lors du chargement des objectifs:', error)
    existingObjectives.value = []
  } finally {
    loading.value = false
  }
}

const saveObjectives = async () => {
  try {
    saving.value = true
    await roiStore.saveObjective(objectives.value)

    toast.add({
      severity: 'success',
      summary: 'Objectifs sauvegardes',
      detail: 'Vos objectifs ont été enregistrés',
      life: 3000
    })

    await loadExistingObjectives()
    emit('objectives-saved', objectives.value)
    handleClose()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder les objectifs',
      life: 5000
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadExistingObjectives()
})
</script>

<style scoped>
.objectives-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.description {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.loading-state i {
  color: var(--kap-blue);
}

/* Section headers */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--kap-blue);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.count-badge {
  background: rgba(11, 43, 60, 0.1);
  color: var(--kap-blue);
  padding: 0.125rem 0.5rem;
  border-radius: 100px;
  font-size: 0.6875rem;
  font-weight: 500;
}

/* Existing objectives */
.existing-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.875rem;
}

.existing-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.existing-item {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.625rem 0.75rem;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.375rem;
}

.item-title {
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--kap-blue);
}

.item-date {
  font-size: 0.6875rem;
  color: #9ca3af;
}

.item-metrics {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: #6b7280;
}

/* Form */
.form-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.875rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.form-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.75rem;
}

.card-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--kap-blue);
  margin-bottom: 0.5rem;
}

.form-row {
  display: flex;
  gap: 0.5rem;
}

.form-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field label {
  font-size: 0.6875rem;
  color: #6b7280;
  font-weight: 500;
}

.form-field :deep(.p-inputnumber) {
  width: 100%;
}

.form-field :deep(.p-inputnumber-input) {
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.form-field :deep(.p-inputnumber-input:focus) {
  border-color: var(--kap-blue);
  outline: none;
}

/* Preview */
.preview-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.875rem;
}

.periods-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
}

.period-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.625rem 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.period-label {
  font-size: 0.625rem;
  color: #9ca3af;
  font-weight: 500;
}

.period-points {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--kap-blue);
}

.period-gain {
  font-size: 0.6875rem;
  color: var(--kap-green);
  font-weight: 600;
}

/* Dialog footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.cancel-btn {
  color: #6b7280;
}

.cancel-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.save-btn {
  background: var(--kap-blue);
  border-color: var(--kap-blue);
}

.save-btn:hover {
  background: #0a2431;
  border-color: #0a2431;
}

/* Responsive */
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .periods-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
