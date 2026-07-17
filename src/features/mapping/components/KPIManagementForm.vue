<template>
  <div class="kpi-form">
    <div class="form-grid">
      <div class="form-field">
        <label>Nom du KPI *</label>
        <InputText
          v-model="formData.name"
          placeholder="Ex: Production totale"
          :class="{ 'p-invalid': errors.name }"
        />
        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
      </div>

      <div class="form-field">
        <label>Modèle de document associé</label>
        <Select
          v-model="formData.model"
          :options="models"
          optionLabel="nom"
          optionValue="id"
          placeholder="Sélectionner un modèle (optionnel)"
          :showClear="true"
          filter
        />
        <small class="field-hint">Laissez vide pour un KPI global</small>
      </div>

      <div class="form-field">
        <label>Type de calcul *</label>
        <Select
          v-model="formData.type"
          :options="kpiTypeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Sélectionner un type"
          :class="{ 'p-invalid': errors.type }"
          @change="onTypeChange"
        />
        <small v-if="errors.type" class="p-error">{{ errors.type }}</small>
      </div>

      <div class="form-field" v-if="formData.type === 'SUM' || formData.type === 'AVG' || formData.type === 'COUNT'">
        <label>Tag(s) source *</label>
        <div v-if="!formData.model" class="no-document-message">
          <Message severity="info" :closable="false">
            <template #messageicon>
              <i class="pi pi-info-circle"></i>
            </template>
            Veuillez d'abord sélectionner un modèle de document pour voir les tags associés.
          </Message>
        </div>
        <div v-else-if="loadingDocumentTags" class="loading-tags">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Chargement des tags du document...</span>
        </div>
        <MultiSelect
          v-model="formData.source_tags"
          :options="availableTags"
          optionLabel="tag_name"
          optionValue="id"
          placeholder="Sélectionner les tags du document"
          display="chip"
          :filter="true"
          :class="{ 'p-invalid': errors.source_tags }"
          :disabled="!formData.model || loadingDocumentTags"
        >
          <template #option="slotProps">
            <div class="tag-option">
              <div class="tag-name">{{ slotProps.option.tag_name }}</div>
              <div class="tag-meta">
                <Tag :value="slotProps.option.tag_type_display" severity="secondary" class="text-xs" />
                <span class="text-xs text-gray-500">{{ slotProps.option.data_type_display }}</span>
              </div>
            </div>
          </template>
        </MultiSelect>
        <small v-if="errors.source_tags" class="p-error">{{ errors.source_tags }}</small>
        <small v-else-if="formData.model && !loadingDocumentTags" class="field-hint">
          Tags disponibles pour le document sélectionné ({{ availableTags.length }} tag{{ availableTags.length > 1 ? 's' : '' }})
        </small>
      </div>

      <div class="form-field" v-if="formData.type === 'RATIO'">
        <label>Tag numérateur *</label>
        <div v-if="!formData.model" class="no-document-message">
          <Message severity="info" :closable="false">
            <template #messageicon>
              <i class="pi pi-info-circle"></i>
            </template>
            Veuillez d'abord sélectionner un modèle de document pour voir les tags associés.
          </Message>
        </div>
        <div v-else-if="loadingDocumentTags" class="loading-tags">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Chargement des tags du document...</span>
        </div>
        <Select
          v-model="formData.numerator_tag"
          :options="availableTags"
          optionLabel="tag_name"
          optionValue="id"
          placeholder="Sélectionner le tag du document"
          :filter="true"
          :class="{ 'p-invalid': errors.numerator_tag }"
          :disabled="!formData.model || loadingDocumentTags"
        >
          <template #option="slotProps">
            <div class="tag-option">
              <div class="tag-name">{{ slotProps.option.tag_name }}</div>
              <div class="tag-meta">
                <Tag :value="slotProps.option.tag_type_display" severity="secondary" class="text-xs" />
                <span class="text-xs text-gray-500">{{ slotProps.option.data_type_display }}</span>
              </div>
            </div>
          </template>
        </Select>
        <small v-if="errors.numerator_tag" class="p-error">{{ errors.numerator_tag }}</small>
        <small v-else-if="formData.model && !loadingDocumentTags" class="field-hint">
          Tags disponibles pour le document sélectionné ({{ availableTags.length }} tag{{ availableTags.length > 1 ? 's' : '' }})
        </small>
      </div>

      <div class="form-field" v-if="formData.type === 'RATIO'">
        <label>Tag dénominateur *</label>
        <div v-if="!formData.model" class="no-document-message">
          <Message severity="info" :closable="false">
            <template #messageicon>
              <i class="pi pi-info-circle"></i>
            </template>
            Veuillez d'abord sélectionner un modèle de document pour voir les tags associés.
          </Message>
        </div>
        <div v-else-if="loadingDocumentTags" class="loading-tags">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Chargement des tags du document...</span>
        </div>
        <Select
          v-model="formData.denominator_tag"
          :options="availableTags"
          optionLabel="tag_name"
          optionValue="id"
          placeholder="Sélectionner le tag du document"
          :filter="true"
          :class="{ 'p-invalid': errors.denominator_tag }"
          :disabled="!formData.model || loadingDocumentTags"
        >
          <template #option="slotProps">
            <div class="tag-option">
              <div class="tag-name">{{ slotProps.option.tag_name }}</div>
              <div class="tag-meta">
                <Tag :value="slotProps.option.tag_type_display" severity="secondary" class="text-xs" />
                <span class="text-xs text-gray-500">{{ slotProps.option.data_type_display }}</span>
              </div>
            </div>
          </template>
        </Select>
        <small v-if="errors.denominator_tag" class="p-error">{{ errors.denominator_tag }}</small>
        <small v-else-if="formData.model && !loadingDocumentTags" class="field-hint">
          Tags disponibles pour le document sélectionné ({{ availableTags.length }} tag{{ availableTags.length > 1 ? 's' : '' }})
        </small>
      </div>

      <div class="form-field full-width" v-if="formData.type === 'FORMULA'">
        <label>Formule *</label>
        <Textarea
          v-model="formData.formula"
          placeholder="Ex: SUM(tag1) / COUNT(tag2) * 100"
          rows="4"
          :class="{ 'p-invalid': errors.formula }"
        />
        <small v-if="errors.formula" class="p-error">{{ errors.formula }}</small>
        <small v-else class="field-hint">
          Utilisez les noms des tags dans votre formule. Fonctions disponibles: SUM(), AVG(), COUNT(), MAX(), MIN()
        </small>
      </div>

      <div class="form-field">
        <label>Unitaire</label>
        <InputText
          v-model="formData.unit"
          placeholder="Ex: m³, %, kg"
        />
      </div>

      <div class="form-field full-width">
        <label>Description</label>
        <Textarea
          v-model="formData.description"
          placeholder="Description du KPI"
          rows="3"
        />
      </div>
    </div>

    <Card v-if="showPreview" class="preview-card">
      <template #title>
        <div class="preview-header">
          <i class="pi pi-eye"></i>
          <span>Aperçu du KPI</span>
        </div>
      </template>
      <template #content>
        <div class="preview-content">
          <div class="preview-info">
            <div class="info-item">
              <span class="info-label">Nom:</span>
              <span class="info-value">{{ formData.name || 'Non défini' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Type de calcul:</span>
              <span class="info-value">{{ getTypeLabel(formData.type) }}</span>
            </div>
            <div v-if="formData.unit" class="info-item">
              <span class="info-label">Unité:</span>
              <span class="info-value">{{ formData.unit }}</span>
            </div>
          </div>

          <Divider />

          <div class="preview-formula">
            <h4>Formule calculée:</h4>
            <div class="formula-display">
              <code>{{ getCalculationFormula() }}</code>
            </div>
          </div>

          <div v-if="selectedTagsDetails.length > 0" class="preview-tags">
            <h4>Tags utilisés:</h4>
            <div class="tags-list">
              <Tag
                v-for="tag in selectedTagsDetails"
                :key="tag.id"
                :value="tag.tag_name"
                severity="info"
                class="mr-2 mb-2"
              />
            </div>
          </div>

          <Message severity="info" :closable="false" class="mt-3">
            <template #messageicon>
              <i class="pi pi-info-circle"></i>
            </template>
            Ce KPI sera calculé automatiquement à partir des données collectées dans vos documents.
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
        :loading="saving"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import { axiosInstance } from '@/main'

const props = defineProps({
  kpi: {
    type: Object,
    default: null
  },
  models: {
    type: Array,
    default: () => []
  },
  tags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['save', 'cancel'])

const saving = ref(false)
const errors = ref({})
const documentTags = ref([])
const loadingDocumentTags = ref(false)

const kpiTypeOptions = [
  { label: 'Somme', value: 'SUM' },
  { label: 'Moyenne', value: 'AVG' },
  { label: 'Compte', value: 'COUNT' },
  { label: 'Rapport/Ratio', value: 'RATIO' },
  { label: 'Formule personnalisée', value: 'FORMULA' }
]

const formData = reactive({
  name: '',
  type: 'SUM',
  model: null,
  source_tags: [],
  numerator_tag: null,
  denominator_tag: null,
  formula: '',
  unit: '',
  description: ''
})

// Charger les tags associés au document sélectionné
const loadDocumentTags = async (documentModeleId) => {
  if (!documentModeleId) {
    documentTags.value = []
    return
  }

  loadingDocumentTags.value = true
  try {
    const response = await axiosInstance.get(`/documents/field-tags/?document_modele=${documentModeleId}`)
    const fieldTags = response.data.results || response.data || []
    
    // Extraire les IDs des tags MES associés
    const tagIds = fieldTags.map(ft => ft.mes_tag).filter(Boolean)
    
    // Récupérer les détails complets des tags depuis la liste des tags disponibles
    documentTags.value = props.tags.filter(tag => tagIds.includes(tag.id))
  } catch (error) {
    console.error('Error loading document tags:', error)
    documentTags.value = []
  } finally {
    loadingDocumentTags.value = false
  }
}

// Watcher pour charger les tags quand le modèle change
watch(() => formData.model, async (newModelId) => {
  // Réinitialiser les tags sélectionnés si le modèle change
  if (formData.type === 'SUM' || formData.type === 'AVG' || formData.type === 'COUNT') {
    formData.source_tags = []
  } else if (formData.type === 'RATIO') {
    formData.numerator_tag = null
    formData.denominator_tag = null
  }
  
  await loadDocumentTags(newModelId)
}, { immediate: false })

const availableTags = computed(() => {
  // Si aucun modèle n'est sélectionné, ne pas afficher de tags
  if (!formData.model) {
    return []
  }
  
  // Si un modèle est sélectionné, ne montrer que les tags associés à ce document
  return documentTags.value.filter(tag => {
    if (!tag.is_active) return false
    // Accepter les types numériques: NUMBER, DECIMAL, PERCENTAGE
    const numericTypes = ['NUMBER', 'DECIMAL', 'PERCENTAGE']
    return numericTypes.includes(tag.data_type)
  })
})

// Show preview when form has enough data
const showPreview = computed(() => {
  if (!formData.name) return false

  if (formData.type === 'SUM' || formData.type === 'AVG' || formData.type === 'COUNT') {
    return formData.source_tags && formData.source_tags.length > 0
  }

  if (formData.type === 'RATIO') {
    return formData.numerator_tag && formData.denominator_tag
  }

  if (formData.type === 'FORMULA') {
    return formData.formula && formData.formula.trim() !== ''
  }

  return false
})

// Get details of selected tags for preview
const selectedTagsDetails = computed(() => {
  const tagIds = []

  if (formData.type === 'SUM' || formData.type === 'AVG' || formData.type === 'COUNT') {
    tagIds.push(...(formData.source_tags || []))
  } else if (formData.type === 'RATIO') {
    if (formData.numerator_tag) tagIds.push(formData.numerator_tag)
    if (formData.denominator_tag) tagIds.push(formData.denominator_tag)
  }

  return props.tags.filter(tag => tagIds.includes(tag.id))
})

const getTypeLabel = (type) => {
  const labels = {
    'SUM': 'Somme',
    'AVG': 'Moyenne',
    'COUNT': 'Compte',
    'RATIO': 'Rapport/Ratio',
    'FORMULA': 'Formule personnalisée'
  }
  return labels[type] || type
}

const getCalculationFormula = () => {
  if (formData.type === 'SUM') {
    const tagNames = selectedTagsDetails.value.map(t => t.tag_name).join(' + ')
    return `SUM(${tagNames})`
  }

  if (formData.type === 'AVG') {
    const tagNames = selectedTagsDetails.value.map(t => t.tag_name).join(', ')
    return `AVG(${tagNames})`
  }

  if (formData.type === 'COUNT') {
    const tagNames = selectedTagsDetails.value.map(t => t.tag_name).join(', ')
    return `COUNT(${tagNames})`
  }

  if (formData.type === 'RATIO') {
    const numerator = props.tags.find(t => t.id === formData.numerator_tag)
    const denominator = props.tags.find(t => t.id === formData.denominator_tag)
    return `${numerator?.tag_name || 'TAG1'} / ${denominator?.tag_name || 'TAG2'}`
  }

  if (formData.type === 'FORMULA') {
    return formData.formula || 'Formule non définie'
  }

  return 'Non défini'
}

watch(() => props.kpi, async (newKPI) => {
  if (newKPI) {
    const modelId = newKPI.model ? (newKPI.model.id || newKPI.model) : null
    Object.assign(formData, {
      name: newKPI.name || '',
      type: newKPI.type || 'SUM',
      model: modelId,
      source_tags: newKPI.source_tags || [],
      numerator_tag: newKPI.numerator_tag ? (newKPI.numerator_tag.id || newKPI.numerator_tag) : null,
      denominator_tag: newKPI.denominator_tag ? (newKPI.denominator_tag.id || newKPI.denominator_tag) : null,
      formula: newKPI.formula || '',
      unit: newKPI.unit || '',
      description: newKPI.description || ''
    })
    // Charger les tags du document si un modèle est associé
    if (modelId) {
      await loadDocumentTags(modelId)
    }
  } else {
    // Reset form
    Object.assign(formData, {
      name: '',
      type: 'SUM',
      model: null,
      source_tags: [],
      numerator_tag: null,
      denominator_tag: null,
      formula: '',
      unit: '',
      description: ''
    })
    documentTags.value = []
  }
}, { immediate: true })

const onTypeChange = () => {
  // Reset fields based on type
  if (formData.type !== 'SUM' && formData.type !== 'AVG' && formData.type !== 'COUNT') {
    formData.source_tags = []
  }
  if (formData.type !== 'RATIO') {
    formData.numerator_tag = null
    formData.denominator_tag = null
  }
  if (formData.type !== 'FORMULA') {
    formData.formula = ''
  }
}

const validate = () => {
  errors.value = {}

  if (!formData.name || formData.name.trim() === '') {
    errors.value.name = 'Le nom est obligatoire'
  }

  if (!formData.type) {
    errors.value.type = 'Le type de calcul est obligatoire'
  }

  if (formData.type === 'SUM' || formData.type === 'AVG' || formData.type === 'COUNT') {
    if (!formData.source_tags || formData.source_tags.length === 0) {
      errors.value.source_tags = 'Au moins un tag source est requis'
    }
  }

  if (formData.type === 'RATIO') {
    if (!formData.numerator_tag) {
      errors.value.numerator_tag = 'Le tag numérateur est obligatoire'
    }
    if (!formData.denominator_tag) {
      errors.value.denominator_tag = 'Le tag dénominateur est obligatoire'
    }
  }

  if (formData.type === 'FORMULA') {
    if (!formData.formula || formData.formula.trim() === '') {
      errors.value.formula = 'La formule est obligatoire'
    }
  }

  return Object.keys(errors.value).length === 0
}

const handleSave = () => {
  if (!validate()) {
    return
  }

  saving.value = true
  emit('save', { ...formData })
  saving.value = false
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped lang="scss">
.kpi-form {
  padding: 1rem 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-weight: 500;
    color: #2c3e50;
    font-size: 0.875rem;
  }

  &.full-width {
    grid-column: 1 / -1;
  }
}

.field-hint {
  color: #6c757d;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.tag-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  
  .tag-name {
    font-weight: 600;
    color: #2c3e50;
  }
  
  .tag-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .text-xs {
    font-size: 0.75rem;
  }
  
  .text-gray-500 {
    color: #6b7280;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

:deep(.p-error) {
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

.formula-display {
  background: var(--surface-0);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 1rem;
  margin-top: 0.5rem;

  code {
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    color: var(--primary-color);
    font-weight: 600;
  }
}

.preview-tags {
  margin-top: 1rem;

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
}

.mt-3 {
  margin-top: 1rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.loading-tags {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;

  i {
    font-size: 1rem;
  }
}

.no-document-message {
  margin-bottom: 0.5rem;
}
</style>

