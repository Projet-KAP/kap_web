<template>
  <div class="tag-form">
    <!-- Selecteur de type de donnee -->
    <div class="type-selector" v-if="!isEdit">
      <div
        class="type-card"
        :class="{ active: selectedDataSource === 'document' }"
        @click="selectDataSource('document')"
      >
        <div class="type-icon">
          <i class="pi pi-file-excel"></i>
        </div>
        <div class="type-content">
          <h4>Donnee de rapport</h4>
          <p>Collectee depuis vos fichiers Excel/CSV</p>
        </div>
        <div class="type-check" v-if="selectedDataSource === 'document'">
          <i class="pi pi-check-circle"></i>
        </div>
      </div>

      <div
        class="type-card"
        :class="{ active: selectedDataSource === 'iot' }"
        @click="selectDataSource('iot')"
      >
        <div class="type-icon iot">
          <i class="pi pi-wifi"></i>
        </div>
        <div class="type-content">
          <h4>Capteur IoT</h4>
          <p>Valeur en temps réel depuis un capteur</p>
        </div>
        <div class="type-check" v-if="selectedDataSource === 'iot'">
          <i class="pi pi-check-circle"></i>
        </div>
      </div>
    </div>

    <!-- Badge mode edition -->
    <div v-if="isEdit" class="edit-mode-badge">
      <Tag
        :value="isIoTTagType ? 'Capteur IoT' : 'Donnee de rapport'"
        :severity="isIoTTagType ? 'info' : 'success'"
        :icon="isIoTTagType ? 'pi pi-wifi' : 'pi pi-file-excel'"
      />
    </div>

    <!-- Section Configuration -->
    <fieldset class="form-fieldset">
      <legend>
        <i class="pi pi-cog"></i>
        Configuration
      </legend>

      <div class="form-row two-cols">
        <div class="form-group">
          <label for="module" class="required">Module</label>
          <Select
            id="module"
            v-model="formData.module"
            :options="moduleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionnez un module"
            class="w-full"
            :class="{ 'p-invalid': errors.module }"
            @change="onModuleChange"
          />
          <small v-if="errors.module" class="p-error">{{ errors.module }}</small>
        </div>

        <div class="form-group">
          <label for="tagType" class="required">Type de Tag</label>
          <Select
            id="tagType"
            v-model="formData.tag_type"
            :options="filteredTagTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionnez un type"
            class="w-full"
            :class="{ 'p-invalid': errors.tag_type }"
            @change="onTagTypeChange"
          />
          <small v-if="errors.tag_type" class="p-error">{{ errors.tag_type }}</small>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="tagName" class="required">Nom de la donnee</label>
          <InputText
            id="tagName"
            v-model="formData.tag_name"
            :placeholder="isIoTTagType ? 'Ex: TEMP_MACHINE_01' : 'Ex: VOLUME_DEBLAI'"
            :disabled="isEdit"
            class="w-full"
            :class="{ 'p-invalid': errors.tag_name }"
          />
          <small class="help-text">
            Identifiant unique en majuscules (ex: {{ isIoTTagType ? 'TEMP_MACHINE_01' : 'VOLUME_DEBLAI' }})
          </small>
          <small v-if="errors.tag_name" class="p-error">{{ errors.tag_name }}</small>
        </div>
      </div>
    </fieldset>

    <!-- Section Source des donnees (masquee pour IoT) -->
    <fieldset class="form-fieldset" v-if="!isIoTTagType">
      <legend>
        <i class="pi pi-database"></i>
        Source des donnees
      </legend>

      <div class="form-row">
        <div class="form-group">
          <label for="documents">Modeles de documents</label>
          <MultiSelect
            id="documents"
            v-model="selectedDocumentsLocal"
            :options="documentModels"
            optionLabel="nom"
            placeholder="Sélectionnez un ou plusieurs modèles"
            class="w-full"
            filter
            display="chip"
            :maxSelectedLabels="3"
            @change="onDocumentsChanged"
          >
            <template #option="slotProps">
              <div class="document-option">
                <i class="pi pi-file-excel"></i>
                <div>
                  <div class="option-name">{{ slotProps.option.nom }}</div>
                  <div class="option-meta">{{ slotProps.option.document_fields?.length || 0 }} champs</div>
                </div>
              </div>
            </template>
          </MultiSelect>
          <small class="help-text">
            Les rapports de ces modeles seront agreges pour les KPIs
          </small>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="columnName">Colonne Excel/CSV</label>
          <AutoComplete
            id="columnName"
            v-model="formData.column_name"
            :suggestions="filteredColumnLabels"
            @complete="searchColumns"
            @item-select="onColumnSelect"
            placeholder="Tapez au moins 3 caracteres..."
            class="w-full"
            :class="{ 'p-invalid': errors.column_name }"
            :forceSelection="false"
            :minLength="3"
          >
            <template #item="slotProps">
              <div class="column-suggestion">
                <div class="column-label">{{ slotProps.option }}</div>
                <div v-if="getColumnByLabel(slotProps.option)" class="column-meta">
                  <Tag :value="getColumnByLabel(slotProps.option)?.field_type" severity="secondary" class="text-xs" />
                  <span class="column-name text-xs">{{ getColumnByLabel(slotProps.option)?.field_id || getColumnByLabel(slotProps.option)?.name }}</span>
                </div>
              </div>
            </template>
          </AutoComplete>
          <small v-if="!hasColumns" class="help-text text-warning">
            <i class="pi pi-info-circle"></i> Sélectionnez d'abord un document pour voir les colonnes disponibles
          </small>
          <small v-if="errors.column_name" class="p-error">{{ errors.column_name }}</small>
        </div>
      </div>
    </fieldset>

    <!-- Info IoT -->
    <div v-if="isIoTTagType && !isEdit" class="iot-info-section">
      <div class="iot-info-icon">
        <i class="pi pi-info-circle"></i>
      </div>
      <div class="iot-info-content">
        <strong>Configuration IoT</strong>
        <p>Ce tag recevra ses données depuis un capteur IoT. Vous pourrez lier un capteur après la création dans la liste des données.</p>
      </div>
    </div>

    <!-- Section Format -->
    <fieldset class="form-fieldset">
      <legend>
        <i class="pi pi-sliders-h"></i>
        Format des donnees
      </legend>

      <div class="form-row two-cols">
        <div class="form-group">
          <label for="dataType" class="required">Type de données</label>
          <Select
            id="dataType"
            v-model="formData.data_type"
            :options="dataTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionnez un type"
            class="w-full"
            :class="{ 'p-invalid': errors.data_type }"
          />
          <small v-if="errors.data_type" class="p-error">{{ errors.data_type }}</small>
        </div>

        <div class="form-group">
          <label for="unit">Unité</label>
          <InputText
            id="unit"
            v-model="formData.unit"
            placeholder="Ex: m3, kg, heures"
            class="w-full"
          />
          <small class="help-text">Optionnel</small>
        </div>
      </div>

      <div class="form-row">
        <div class="status-toggle">
          <div class="toggle-label">
            <span>Statut de la donnee</span>
            <small>Une donnee inactive ne sera pas utilisee dans les calculs</small>
          </div>
          <div class="toggle-control">
            <span class="status-label" :class="{ inactive: !formData.is_active }">
              {{ formData.is_active ? 'Active' : 'Inactive' }}
            </span>
            <ToggleSwitch v-model="formData.is_active" />
          </div>
        </div>
      </div>
    </fieldset>

    <div class="form-actions">
      <Button
        label="Annuler"
        severity="secondary"
        outlined
        @click="$emit('cancel')"
      />
      <Button
        :label="isEdit ? 'Mettre à jour' : 'Créer la donnée'"
        icon="pi pi-check"
        @click="handleSubmit"
        :loading="loading"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMappingStore } from '@/stores/mappingStore.js'
import AutoComplete from 'primevue/autocomplete'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'

const props = defineProps({
  tag: {
    type: Object,
    default: null
  },
  availableColumns: {
    type: Array,
    default: () => []
  },
  documentModels: {
    type: Array,
    default: () => []
  }
})

// Source de donnees selectionnee (document ou iot)
const selectedDataSource = ref('document')

// Fonction pour selectionner le type de source
const selectDataSource = (type) => {
  selectedDataSource.value = type

  if (type === 'iot') {
    // Pre-selectionner MES pour IoT
    formData.value.module = 'MES'
    formData.value.data_type = 'DECIMAL'
  }
}

// Documents selectionnes localement dans ce formulaire
const selectedDocumentsLocal = ref([])

// Colonnes combinees de tous les documents selectionnes
const combinedColumns = computed(() => {
  if (!selectedDocumentsLocal.value || selectedDocumentsLocal.value.length === 0) {
    return props.availableColumns || []
  }

  const allColumns = []
  selectedDocumentsLocal.value.forEach(doc => {
    if (doc.document_fields) {
      doc.document_fields.forEach(field => {
        allColumns.push({
          ...field,
          documentName: doc.nom,
          documentId: doc.id
        })
      })
    }
  })
  return allColumns
})

// Callback quand les documents changent
const onDocumentsChanged = () => {
  filteredColumns.value = combinedColumns.value
}

// Computed pour verifier si des colonnes sont disponibles
const hasColumns = computed(() => {
  return combinedColumns.value && combinedColumns.value.length > 0
})

const emit = defineEmits(['save', 'cancel'])

const mappingStore = useMappingStore()
const { choices } = storeToRefs(mappingStore)

const loading = ref(false)
const errors = ref({})
const filteredColumns = ref([])

const isEdit = computed(() => !!props.tag)

// Initialiser les colonnes filtrees avec toutes les colonnes disponibles
const initializeColumns = () => {
  filteredColumns.value = combinedColumns.value || []
}

// Liste des labels de colonnes pour l'AutoComplete
const filteredColumnLabels = computed(() => {
  if (!filteredColumns.value || filteredColumns.value.length === 0) {
    return []
  }
  return filteredColumns.value.map(col => col.label || col.field_id || col.name).filter(Boolean)
})

// Fonction pour rechercher les colonnes disponibles (minLength=3 requis)
const searchColumns = (event) => {
  const query = event.query ? event.query.toLowerCase() : ''

  if (query.length < 3) {
    filteredColumns.value = []
    return
  }

  filteredColumns.value = (combinedColumns.value || []).filter(column =>
    column.label?.toLowerCase().includes(query) ||
    column.field_id?.toLowerCase().includes(query) ||
    column.name?.toLowerCase().includes(query)
  )
}

// Fonction pour recuperer une colonne par son label
const getColumnByLabel = (label) => {
  return (combinedColumns.value || []).find(col =>
    col.label === label || col.field_id === label || col.name === label
  )
}

// Fonction appelee quand une colonne est selectionnee depuis la liste
const onColumnSelect = () => {
  // formData.column_name est deja mis a jour automatiquement par v-model
}

const formData = ref({
  tag_name: '',
  column_name: '',
  module: '',
  tag_type: '',
  data_type: '',
  unit: '',
  is_active: true
})

const moduleOptions = computed(() => choices.value.module_choices || [])

const tagTypeMapping = {
  'MES': [
    'PRODUCTION', 'REBUT', 'TEMPS_CYCLE', 'TEMPS_ARRET', 'CADENCE',
    'QUALITE', 'MAINTENANCE', 'SECURITE', 'ENERGIE', 'MATIERE', 'OPERATEUR',
    'COURANT', 'TEMPERATURE', 'HUMIDITE', 'ACCELERATION', 'PRESSION', 'VIBRATION'
  ],
  'CHANTIER': ['TERRASSEMENT', 'BETON', 'MATERIEL', 'PERSONNEL', 'TRANSPORT', 'PLANNING', 'FINANCIER'],
  'STOCK': ['ENTREE', 'SORTIE', 'INVENTAIRE', 'TRANSFERT'],
  'FINANCE': ['DEPENSE', 'RECETTE', 'FACTURE', 'PAIEMENT'],
  'GENERAL': ['AUTRE']
}

// Types de tags IoT
const iotTagTypes = ['COURANT', 'TEMPERATURE', 'HUMIDITE', 'ACCELERATION', 'PRESSION', 'VIBRATION']

// Computed pour detecter si c'est un tag IoT
const isIoTTagType = computed(() => {
  return iotTagTypes.includes(formData.value.tag_type) || selectedDataSource.value === 'iot'
})

// Fonction appelee quand le type de tag change
const onTagTypeChange = () => {
  if (iotTagTypes.includes(formData.value.tag_type)) {
    selectedDataSource.value = 'iot'
    formData.value.data_type = 'DECIMAL'
    formData.value.column_name = ''
  }
}

const filteredTagTypeOptions = computed(() => {
  if (!formData.value.module) {
    return choices.value.tag_type_choices || []
  }

  let allowedTypes = tagTypeMapping[formData.value.module] || []

  // Si source IoT selectionnee, ne montrer que les types IoT
  if (selectedDataSource.value === 'iot') {
    allowedTypes = allowedTypes.filter(t => iotTagTypes.includes(t))
  }

  return (choices.value.tag_type_choices || []).filter(choice =>
    allowedTypes.includes(choice.value)
  )
})

const dataTypeOptions = computed(() => choices.value.data_type_choices || [])

const onModuleChange = () => {
  const allowedTypes = tagTypeMapping[formData.value.module] || []
  if (!allowedTypes.includes(formData.value.tag_type)) {
    formData.value.tag_type = ''
  }
}

const validateForm = () => {
  errors.value = {}

  if (!formData.value.tag_name || formData.value.tag_name.trim() === '') {
    errors.value.tag_name = 'Le nom de la donnee est requis'
  }

  // column_name n'est requis que pour les tags non-IoT
  if (!isIoTTagType.value && (!formData.value.column_name || formData.value.column_name.trim() === '')) {
    errors.value.column_name = 'Le nom de colonne est requis'
  }

  if (!formData.value.module) {
    errors.value.module = 'Le module est requis'
  }

  if (!formData.value.tag_type) {
    errors.value.tag_type = 'Le type de tag est requis'
  }

  if (!formData.value.data_type) {
    errors.value.data_type = 'Le type de données est requis'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    const tagName = formData.value.tag_name.trim().toUpperCase()
    const columnName = isIoTTagType.value
      ? tagName
      : (formData.value.column_name?.trim() || tagName)

    const payload = {
      tag_name: tagName,
      display_name: columnName,
      column_name: columnName,
      module: formData.value.module,
      tag_type: formData.value.tag_type,
      data_type: formData.value.data_type,
      unit: formData.value.unit || '',
      is_active: formData.value.is_active
    }

    emit('save', payload)
  } finally {
    loading.value = false
  }
}

watch(() => props.tag, (newTag) => {
  if (newTag) {
    formData.value = {
      tag_name: newTag.tag_name || '',
      column_name: newTag.column_name || '',
      module: newTag.module || '',
      tag_type: newTag.tag_type || '',
      data_type: newTag.data_type || '',
      unit: newTag.unit || '',
      is_active: newTag.is_active !== undefined ? newTag.is_active : true
    }
    // Detecter le type de source en mode edition
    if (iotTagTypes.includes(newTag.tag_type)) {
      selectedDataSource.value = 'iot'
    }
  }
}, { immediate: true })

watch(() => combinedColumns.value, (columns) => {
  if (columns && Array.isArray(columns) && columns.length > 0) {
    filteredColumns.value = [...columns]
  } else {
    filteredColumns.value = []
  }
}, { immediate: true, deep: true })

watch(() => props.availableColumns, (columns) => {
  if (!selectedDocumentsLocal.value || selectedDocumentsLocal.value.length === 0) {
    if (columns && Array.isArray(columns) && columns.length > 0) {
      filteredColumns.value = [...columns]
    }
  }
}, { immediate: true, deep: true })

onMounted(async () => {
  initializeColumns()

  if (combinedColumns.value && Array.isArray(combinedColumns.value) && combinedColumns.value.length > 0) {
    filteredColumns.value = [...combinedColumns.value]
  }

  if (!choices.value.module_choices || choices.value.module_choices.length === 0) {
    await mappingStore.loadChoices()
  }
})

// Exposer une methode pour remplir le formulaire depuis le parent
const fillFormData = (data) => {
  Object.assign(formData.value, data)
}

defineExpose({
  fillFormData
})
</script>

<style scoped lang="scss">
.tag-form {
  padding: 0.5rem 0;
}

// Type selector cards
.type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.type-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--surface-ground);
  border: 2px solid var(--surface-border);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-300);
    background: var(--surface-hover);
  }

  &.active {
    border-color: var(--primary-color);
    background: var(--primary-50);

    .type-icon {
      background: var(--primary-color);
      color: white;
    }

    .type-icon.iot {
      background: var(--cyan-500);
    }
  }

  .type-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    background: var(--surface-200);
    color: var(--text-color-secondary);
    transition: all 0.2s ease;

    i {
      font-size: 1.25rem;
    }

    &.iot {
      background: var(--cyan-100);
      color: var(--cyan-600);
    }
  }

  .type-content {
    flex: 1;

    h4 {
      margin: 0 0 0.25rem 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-color);
    }

    p {
      margin: 0;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }
  }

  .type-check {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    color: var(--primary-color);

    i {
      font-size: 1.25rem;
    }
  }
}

.edit-mode-badge {
  margin-bottom: 1.5rem;
}

// Fieldset styling
.form-fieldset {
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
  background: var(--surface-card);

  legend {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.75rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--primary-color);

    i {
      font-size: 1rem;
    }
  }
}

.form-row {
  margin-bottom: 1.25rem;

  &:last-child {
    margin-bottom: 0;
  }

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
    font-size: 0.9rem;

    &.required::after {
      content: ' *';
      color: var(--red-500);
    }
  }

  .help-text {
    margin-top: 0.375rem;
    color: var(--text-color-secondary);
    font-size: 0.8rem;

    i {
      margin-right: 0.25rem;
    }
  }
}

// Status toggle
.status-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;

  .toggle-label {
    span {
      display: block;
      font-weight: 600;
      color: var(--text-color);
      font-size: 0.9rem;
    }

    small {
      color: var(--text-color-secondary);
      font-size: 0.8rem;
    }
  }

  .toggle-control {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .status-label {
      font-weight: 500;
      color: var(--green-600);
      font-size: 0.85rem;

      &.inactive {
        color: var(--text-color-secondary);
      }
    }
  }
}

// IoT info section
.iot-info-section {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, var(--cyan-50) 0%, var(--teal-50) 100%);
  border: 1px solid var(--cyan-200);
  border-radius: 0.75rem;

  .iot-info-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--cyan-100);
    color: var(--cyan-600);
    flex-shrink: 0;

    i {
      font-size: 1.25rem;
    }
  }

  .iot-info-content {
    strong {
      display: block;
      color: var(--cyan-800);
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
    }

    p {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-color-secondary);
      line-height: 1.4;
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.p-invalid {
  border-color: var(--red-500);
}

.p-error {
  display: block;
  margin-top: 0.25rem;
  color: var(--red-500);
  font-size: 0.8rem;
}

.column-suggestion {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .column-label {
    font-weight: 600;
    color: var(--text-color);
  }

  .column-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .text-xs {
    font-size: 0.75rem;
  }

  .column-name {
    color: var(--text-color-secondary);
  }
}

.text-warning {
  color: var(--orange-500);
  font-weight: 500;
}

.document-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  i {
    font-size: 1.25rem;
    color: var(--primary-color);
  }

  .option-name {
    font-weight: 600;
    color: var(--text-color);
  }

  .option-meta {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
  }
}

@media (max-width: 768px) {
  .type-selector {
    grid-template-columns: 1fr;
  }

  .form-row.two-cols {
    grid-template-columns: 1fr;
  }

  .type-card {
    padding: 0.875rem;

    .type-icon {
      width: 2.5rem;
      height: 2.5rem;

      i {
        font-size: 1rem;
      }
    }
  }

  .status-toggle {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;

    .toggle-control {
      width: 100%;
      justify-content: space-between;
    }
  }
}
</style>
