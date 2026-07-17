<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :style="{ width: '650px' }"
    @hide="resetForm"
    :pt="{
      header: { class: 'quality-modal-header' }
    }"
  >
    <template #header>
      <div class="modal-header-content">
        <div class="header-icon">
          <i class="pi pi-plus-circle"></i>
        </div>
        <div class="header-text">
          <h3>Ajouter une mesure qualité</h3>
          <p>Configurez un nouveau point de contrôle pour ce document</p>
        </div>
      </div>
    </template>

    <div class="quality-field-form">
      <div class="field-group">
        <label for="label" class="required">Nom de la mesure</label>
        <InputText
          id="label"
          v-model="form.label"
          placeholder="Ex: Diamètre pièce A, Aspect visuel, Nombre de rayures..."
          class="w-full"
          :class="{ 'p-invalid': errors.label }"
          autofocus
        />
        <small v-if="errors.label" class="p-error">{{ errors.label }}</small>
      </div>

      <div class="field-group">
        <label for="type" class="required">Type de contrôle</label>
        <div class="control-type-grid">
          <div
            v-for="controlType in controlTypes"
            :key="controlType.value"
            class="control-type-card"
            :class="{ 'selected': form.type_champ === controlType.value }"
            @click="selectControlType(controlType.value)"
          >
            <div class="card-header">
              <i :class="controlType.icon"></i>
              <span class="card-title">{{ controlType.label }}</span>
            </div>
            <p class="card-description">{{ controlType.description }}</p>
          </div>
        </div>
        <small v-if="errors.type_champ" class="p-error">{{ errors.type_champ }}</small>
      </div>

      <!-- Configuration pour QUALITY_MEASURE -->
      <div v-if="form.type_champ === 'QUALITY_MEASURE'" class="configuration-section">
        <h4>Configuration des tolérances</h4>

        <div class="field-grid">
          <div class="field-group">
            <label for="target">Valeur cible</label>
            <InputNumber
              id="target"
              v-model="form.configuration.target_value"
              placeholder="Ex: 50.0"
              mode="decimal"
              :min-fraction-digits="0"
              :max-fraction-digits="3"
              class="w-full"
            />
          </div>

          <div class="field-group">
            <label for="unit">Unité</label>
            <InputText
              id="unit"
              v-model="form.configuration.unit"
              placeholder="Ex: mm, °C, bar..."
              class="w-full"
            />
          </div>
        </div>

        <div class="field-grid">
          <div class="field-group">
            <label for="tolerance_min">Tolérance min</label>
            <InputNumber
              id="tolerance_min"
              v-model="form.configuration.tolerance_min"
              placeholder="Ex: 49.8"
              mode="decimal"
              :min-fraction-digits="0"
              :max-fraction-digits="3"
              class="w-full"
              :class="{ 'p-invalid': errors.tolerance_min }"
            />
            <small v-if="errors.tolerance_min" class="p-error">{{ errors.tolerance_min }}</small>
          </div>

          <div class="field-group">
            <label for="tolerance_max">Tolérance max</label>
            <InputNumber
              id="tolerance_max"
              v-model="form.configuration.tolerance_max"
              placeholder="Ex: 50.2"
              mode="decimal"
              :min-fraction-digits="0"
              :max-fraction-digits="3"
              class="w-full"
              :class="{ 'p-invalid': errors.tolerance_max }"
            />
            <small v-if="errors.tolerance_max" class="p-error">{{ errors.tolerance_max }}</small>
          </div>
        </div>
      </div>

      <!-- Configuration pour QUALITY_VISUAL -->
      <div v-if="form.type_champ === 'QUALITY_VISUAL'" class="configuration-section">
        <h4>Options d'inspection</h4>
        <p class="info-text">
          Les valeurs acceptées seront : <strong>Conforme</strong>, <strong>Non conforme</strong>, <strong>À revoir</strong>
        </p>
      </div>

      <!-- Configuration pour QUALITY_COUNT -->
      <div v-if="form.type_champ === 'QUALITY_COUNT'" class="configuration-section">
        <h4>Configuration des non-conformités</h4>

        <p class="info-text">
          L'opérateur saisit le <strong>nombre de pièces non conformes</strong>.
          Le taux de non-conformité est calculé automatiquement.
        </p>

        <div class="field-grid" style="margin-top: 1rem">
          <div class="field-group">
            <label for="total_pieces">Nombre total de pièces du lot</label>
            <InputNumber
              id="total_pieces"
              v-model="form.configuration.total_pieces"
              placeholder="Ex: 100"
              :min="1"
              class="w-full"
              :class="{ 'p-invalid': errors.total_pieces }"
            />
            <small v-if="errors.total_pieces" class="p-error">{{ errors.total_pieces }}</small>
            <small class="help-text">Taille du lot de production contrôlé</small>
          </div>

          <div class="field-group">
            <label for="threshold_pct">Taux NC max acceptable (%)</label>
            <InputNumber
              id="threshold_pct"
              v-model="form.configuration.threshold_pct"
              placeholder="Ex: 5"
              :min="0"
              :max="100"
              :max-fraction-digits="1"
              class="w-full"
            />
            <small class="help-text">Au-delà, le lot sera signalé comme non conforme</small>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Annuler"
        severity="secondary"
        @click="isVisible = false"
      />
      <Button
        label="Ajouter"
        :loading="loading"
        @click="handleSubmit"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { useQualityStore } from '../stores/qualityStore'
import { useToast } from 'primevue/usetoast'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  instanceId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'field-added'])

const qualityStore = useQualityStore()
const toast = useToast()

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const controlTypes = [
  {
    value: 'QUALITY_MEASURE',
    label: 'Mesure dimensionnelle',
    icon: 'pi pi-chart-line',
    description: 'Mesure numérique avec tolérances (diamètre, longueur, température...)'
  },
  {
    value: 'QUALITY_VISUAL',
    label: 'Inspection visuelle',
    icon: 'pi pi-eye',
    description: 'Contrôle visuel avec conformité (Conforme/Non conforme/À revoir)'
  },
  {
    value: 'QUALITY_COUNT',
    label: 'Non-conformités',
    icon: 'pi pi-times-circle',
    description: 'Pièces non conformes — taux NC calculé automatiquement'
  }
]

const form = ref({
  label: '',
  type_champ: 'QUALITY_MEASURE',
  configuration: {
    target_value: null,
    tolerance_min: null,
    tolerance_max: null,
    unit: '',
    total_pieces: null,
    threshold_pct: 5
  }
})

const errors = ref({})
const loading = ref(false)

const selectControlType = (type) => {
  form.value.type_champ = type
  // Réinitialiser la configuration lors du changement de type
  form.value.configuration = {
    target_value: null,
    tolerance_min: null,
    tolerance_max: null,
    unit: '',
    total_pieces: null,
    threshold_pct: 5
  }
  errors.value = {}
}

const onTypeChange = () => {
  // Réinitialiser la configuration lors du changement de type
  form.value.configuration = {
    target_value: null,
    tolerance_min: null,
    tolerance_max: null,
    unit: '',
    total_pieces: null,
    threshold_pct: 5
  }
  errors.value = {}
}

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!form.value.label || form.value.label.trim() === '') {
    errors.value.label = 'Le nom de la mesure est requis'
    isValid = false
  }

  if (!form.value.type_champ) {
    errors.value.type_champ = 'Le type de contrôle est requis'
    isValid = false
  }

  if (form.value.type_champ === 'QUALITY_MEASURE') {
    const { tolerance_min, tolerance_max } = form.value.configuration

    if (tolerance_min !== null && tolerance_max !== null && tolerance_min >= tolerance_max) {
      errors.value.tolerance_min = 'La tolérance min doit être inférieure à la tolérance max'
      errors.value.tolerance_max = 'La tolérance max doit être supérieure à la tolérance min'
      isValid = false
    }
  }

  if (form.value.type_champ === 'QUALITY_COUNT') {
    if (!form.value.configuration.total_pieces || form.value.configuration.total_pieces < 1) {
      errors.value.total_pieces = 'Le nombre total de pièces est requis (minimum 1)'
      isValid = false
    }
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    const result = await qualityStore.addQualityField(props.instanceId, {
      label: form.value.label,
      type_champ: form.value.type_champ,
      configuration: form.value.configuration
    })

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Champ qualité ajouté avec succès',
        life: 3000
      })

      emit('field-added', result.data)
      isVisible.value = false
      resetForm()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: result.error || 'Impossible d\'ajouter le champ qualité',
        life: 5000
      })
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du champ qualité:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Une erreur est survenue',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = {
    label: '',
    type_champ: 'QUALITY_MEASURE',
    configuration: {
      target_value: null,
      tolerance_min: null,
      tolerance_max: null,
      unit: '',
      threshold: 0
    }
  }
  errors.value = {}
}

// Reset form when modal is closed
watch(isVisible, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})
</script>

<style scoped>
:deep(.quality-modal-header) {
  padding: 1.5rem;
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  border-bottom: none;
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  font-size: 1.5rem;
}

.header-text h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.header-text p {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
}

.quality-field-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.field-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #1e293b;
}

.field-group label.required::after {
  content: ' *';
  color: #ef4444;
}

.control-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.control-type-card {
  position: relative;
  padding: 1rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-type-card:hover {
  border-color: #94a3b8;
  background: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.control-type-card.selected {
  border-color: #475569;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  box-shadow: 0 0 0 3px rgba(71, 85, 105, 0.1);
}

.control-type-card .card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.control-type-card .card-header i {
  font-size: 1.75rem;
  color: #475569;
}

.control-type-card.selected .card-header i {
  color: #0f172a;
}

.control-type-card .card-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #1e293b;
  text-align: center;
}

.control-type-card .card-description {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.4;
  text-align: center;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.configuration-section {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 1.25rem;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.configuration-section h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.configuration-section h4::before {
  content: '';
  width: 4px;
  height: 16px;
  background: #475569;
  border-radius: 2px;
}

.info-text {
  margin: 0;
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #475569;
}

.info-text strong {
  color: #1e293b;
  font-weight: 600;
}

.help-text {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
  font-style: italic;
}

.p-error {
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 500;
}

.p-invalid {
  border-color: #ef4444 !important;
}

.w-full {
  width: 100%;
}
</style>
