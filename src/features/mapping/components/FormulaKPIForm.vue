<template>
  <div class="formula-kpi-form">
    <div class="form-section">
      <div class="form-row">
        <div class="form-group">
          <label for="formulaName" class="required">Nom de la Formule KPI</label>
          <InputText
            id="formulaName"
            v-model="formData.name"
            placeholder="Ex: Taux de productivité global"
            class="w-full"
            :class="{ 'p-invalid': errors.name }"
          />
          <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="required">Construction de la Formule</label>
          <FormulaBuilder
            :kpis="availableKPIs"
            :initialFormula="formData.formula"
            :initialSourceKpis="formData.source_kpis"
            @update:formula="formData.formula = $event"
            @update:sourceKpis="formData.source_kpis = $event"
          />
          <small v-if="errors.source_kpis" class="p-error">{{ errors.source_kpis }}</small>
          <small v-if="errors.formula" class="p-error">{{ errors.formula }}</small>
        </div>
      </div>

    </div>

    <Card v-if="showPreview" class="preview-card">
      <template #title>
        <div class="preview-header">
          <i class="pi pi-eye"></i>
          <span>Aperçu de la Formule</span>
        </div>
      </template>
      <template #content>
        <div class="preview-content">
          <div class="preview-info">
            <div class="info-item">
              <span class="info-label">Nom:</span>
              <span class="info-value">{{ formData.name || 'Non défini' }}</span>
            </div>
          </div>

          <Divider />

          <div class="preview-formula">
            <h4>Formule définie:</h4>
            <div class="formula-display-box">
              <code>{{ getExpandedFormula() }}</code>
            </div>
          </div>

          <div v-if="selectedKPIsForDisplay.length > 0" class="preview-kpis">
            <h4>KPIs utilisés:</h4>
            <div class="kpis-list">
              <div v-for="kpi in selectedKPIsForDisplay" :key="kpi.id" class="kpi-item">
                <Tag :value="kpi.name" severity="info" />
                <span class="kpi-meta">{{ getKPITypeLabel(kpi.type) }}</span>
                <span v-if="kpi.unit" class="kpi-unit">{{ kpi.unit }}</span>
              </div>
            </div>
          </div>

          <Message severity="info" :closable="false" class="mt-3">
            <template #messageicon>
              <i class="pi pi-info-circle"></i>
            </template>
            Cette formule calculera automatiquement ses valeurs à partir des KPIs sélectionnés.
          </Message>
        </div>
      </template>
    </Card>

    <div class="form-actions">
      <Button
        label="Annuler"
        severity="secondary"
        @click="handleCancel"
      />
      <Button
        label="Sauvegarder"
        icon="pi pi-check"
        @click="handleSave"
        :disabled="!isFormValid"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import FormulaBuilder from './FormulaBuilder.vue'

const props = defineProps({
  formulaKpi: {
    type: Object,
    default: null
  },
  kpis: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['save', 'cancel'])

const formData = reactive({
  name: '',
  source_kpis: [],
  formula: ''
})

const errors = ref({})

const availableKPIs = computed(() => {
  return props.kpis.filter(kpi => kpi.id)
})

const selectedKPIsForDisplay = computed(() => {
  return formData.source_kpis
    .map(kpiId => props.kpis.find(kpi => kpi.id === kpiId))
    .filter(kpi => kpi)
})

const showPreview = computed(() => {
  return formData.name && formData.source_kpis.length > 0 && formData.formula
})

const isFormValid = computed(() => {
  return formData.name &&
         formData.source_kpis.length > 0 &&
         formData.formula &&
         Object.keys(errors.value).length === 0
})

const getExpandedFormula = () => {
  if (!formData.formula) return 'Non définie'

  let expandedFormula = formData.formula
  selectedKPIsForDisplay.value.forEach((kpi, index) => {
    const placeholder = `KPI${index + 1}`
    const regex = new RegExp(placeholder, 'g')
    expandedFormula = expandedFormula.replace(regex, `[${kpi.name}]`)
  })

  return expandedFormula
}

const getKPITypeLabel = (type) => {
  const typeLabels = {
    'SIMPLE': 'Simple',
    'CALCULATED': 'Calculé',
    'FORMULA': 'Formule'
  }
  return typeLabels[type] || type
}

const validate = () => {
  errors.value = {}

  if (!formData.name || formData.name.trim() === '') {
    errors.value.name = 'Le nom est requis'
  }

  if (!formData.source_kpis || formData.source_kpis.length === 0) {
    errors.value.source_kpis = 'Sélectionnez au moins un KPI'
  }

  if (!formData.formula || formData.formula.trim() === '') {
    errors.value.formula = 'La formule est requise'
  } else {
    // Basic validation of formula syntax
    const validChars = /^[KPI0-9+\-*/().\s]+$/
    if (!validChars.test(formData.formula)) {
      errors.value.formula = 'Formule invalide. Utilisez uniquement: KPI1-9, +, -, *, /, (, )'
    }
  }

  return Object.keys(errors.value).length === 0
}

const handleSave = () => {
  if (validate()) {
    emit('save', {
      name: formData.name,
      source_kpis: formData.source_kpis,
      formula: formData.formula
    })
  }
}

const handleCancel = () => {
  emit('cancel')
}

watch(() => props.formulaKpi, (newFormulaKPI) => {
  if (newFormulaKPI) {
    Object.assign(formData, {
      name: newFormulaKPI.name || '',
      source_kpis: newFormulaKPI.source_kpis || [],
      formula: newFormulaKPI.formula || ''
    })
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.formula-kpi-form {
  padding: 1rem 0;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-row {
  margin-bottom: 1.5rem;

  &.two-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
}

.form-group {
  display: flex;
  flex-direction: column;

  label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-color);

    &.required::after {
      content: ' *';
      color: var(--red-500);
    }
  }

  .help-text {
    margin-top: 0.25rem;
    color: var(--text-color-secondary);
    font-size: 0.875rem;
    font-style: italic;
  }
}

.p-error {
  color: #dc3545;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

:deep(.p-invalid) {
  border-color: #dc3545;
}

.preview-card {
  margin: 1.5rem 0;
  background: var(--surface-50);
  border: 2px dashed var(--primary-color);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);

  i {
    font-size: 1.25rem;
  }
}

.preview-content {
  h4 {
    margin: 0 0 0.75rem 0;
    color: var(--text-color);
    font-size: 0.95rem;
    font-weight: 600;
  }
}

.preview-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .info-label {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .info-value {
    font-size: 1rem;
    color: var(--text-color);
    font-weight: 500;
  }
}

.formula-display-box {
  background: var(--surface-0);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 1rem;
  margin-top: 0.5rem;

  code {
    font-family: 'Courier New', monospace;
    font-size: 1.1rem;
    color: var(--primary-color);
    font-weight: 600;
    line-height: 1.6;
    word-break: break-word;
  }
}

.preview-kpis {
  margin-top: 1rem;

  .kpis-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .kpi-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--surface-0);
    border-radius: 4px;

    .kpi-meta {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .kpi-unit {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      font-weight: 600;
    }
  }
}

.mt-3 {
  margin-top: 1rem;
}

.mr-1 {
  margin-right: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
  margin-top: 2rem;
}

.w-full {
  width: 100%;
}

@media (max-width: 768px) {
  .form-row.two-cols {
    grid-template-columns: 1fr;
  }
}
</style>
