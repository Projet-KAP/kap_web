<template>
  <Dialog 
    v-model:visible="visible" 
    modal 
    class="excel-upload-dialog"
    :style="{ width: '60rem' }"
    @hide="handleClose"
  >
    <template #header>
      <div class="dialog-header">
        <i class="pi pi-cloud-upload"></i>
        <span>Import de données Excel</span>
      </div>
    </template>

    <div class="dialog-content">
      <!-- Instructions et modèle -->
      <div class="upload-instructions">
        <Message severity="info" class="mb-4">
          <div class="instruction-content">
            <h4>Instructions d'import</h4>
            <ul>
              <li>Utilisez uniquement le modèle CSV fourni</li>
              <li>Respectez la structure et les noms des colonnes</li>
              <li>Taille maximale : 5MB | Maximum 10000 lignes</li>
              <li>Format autorisé : .csv</li>
            </ul>
            <div class="template-download">
              <Button 
                label="Télécharger le modèle CSV" 
                icon="pi pi-download"
                outlined
                severity="info"
                @click="downloadTemplate"
                class="mt-2"
              />
            </div>
          </div>
        </Message>
      </div>

      <!-- Zone d'upload -->
      <div class="upload-section">
        <div class="upload-area" :class="{ 'drag-over': isDragOver }">
          <FileUpload 
            mode="basic"
            :auto="false"
            accept=".csv"
            :maxFileSize="5000000"
            chooseLabel="Choisir un fichier CSV"
            class="upload-component"
            @select="onFileSelect"
            @before-send="beforeUpload"
            ref="fileUpload"
          />
          
          <div class="upload-help-text" v-if="!selectedFile">
            <i class="pi pi-cloud-upload upload-icon"></i>
            <p>Cliquez pour sélectionner ou glissez-déposez votre fichier Excel ici</p>
          </div>
        </div>
      </div>

      <!-- Fichier sélectionné -->
      <div v-if="selectedFile" class="selected-file">
        <div class="file-info">
          <div class="file-details">
            <i class="pi pi-file-excel file-icon"></i>
            <div class="file-meta">
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
          </div>
          <Button 
            icon="pi pi-times" 
            text 
            rounded 
            severity="danger"
            @click="removeFile"
            class="remove-btn"
          />
        </div>
      </div>

      <!-- Validation en cours -->
      <div v-if="validating" class="validation-progress">
        <ProgressSpinner style="width:50px;height:50px" strokeWidth="8" />
        <p>Validation du fichier en cours...</p>
      </div>

      <!-- Résultats de validation -->
      <div v-if="validationResult" class="validation-results">
        <!-- Succès -->
        <Message v-if="validationResult.isValid" severity="success" class="mb-3">
          <div class="validation-summary">
            <h4>✓ Fichier valide</h4>
            <p>{{ validationResult.data.totalRows }} lignes de données détectées</p>
          </div>
        </Message>

        <!-- Erreurs -->
        <Message v-if="!validationResult.isValid" severity="error" class="mb-3">
          <div class="validation-summary">
            <h4>✗ Fichier non valide</h4>
            <p>{{ validationResult.errors.length }} erreur(s) détectée(s)</p>
          </div>
        </Message>

        <!-- Détail des erreurs -->
        <div v-if="validationResult.errors?.length > 0" class="error-details">
          <h5>Erreurs détectées :</h5>
          <ul class="error-list">
            <li v-for="error in validationResult.errors" :key="error.type" class="error-item">
              <i class="pi pi-exclamation-triangle"></i>
              <span>{{ error.message }}</span>
              <Badge v-if="error.row" :value="`Ligne ${error.row}`" severity="danger" />
            </li>
          </ul>
        </div>

        <!-- Avertissements -->
        <div v-if="validationResult.warnings?.length > 0" class="warning-details">
          <h5>Avertissements :</h5>
          <ul class="warning-list">
            <li v-for="warning in validationResult.warnings" :key="warning.type" class="warning-item">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ warning.message }}</span>
              <Badge v-if="warning.row" :value="`Ligne ${warning.row}`" severity="warning" />
            </li>
          </ul>
        </div>

        <!-- Aperçu des données -->
        <div v-if="validationResult.isValid && validationResult.data" class="data-preview">
          <h5>Aperçu des données ({{ Math.min(5, validationResult.data.totalRows) }} premières lignes) :</h5>
          <DataTable 
            :value="previewData" 
            class="preview-table"
            :scrollable="true"
            scrollHeight="300px"
          >
            <Column 
              v-for="header in validationResult.data.headers.slice(0, 6)" 
              :key="header"
              :field="header" 
              :header="header"
              style="min-width: 120px"
            />
            <Column v-if="validationResult.data.headers.length > 6" header="...">
              <template #body>
                <span class="text-muted">+{{ validationResult.data.headers.length - 6 }} colonnes</span>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button 
          label="Annuler" 
          text 
          @click="handleClose"
        />
        <Button 
          label="Importer les données"
          icon="pi pi-check"
          @click="importData"
          :disabled="!validationResult?.isValid || importing"
          :loading="importing"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import csvValidator from '../utils/csvValidator.js'
import { generateCSVTemplate } from '../templates/csvTemplate.js'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:visible', 'data-imported'])

// Composables
const toast = useToast()

// State
const selectedFile = ref(null)
const validating = ref(false)
const validationResult = ref(null)
const importing = ref(false)
const isDragOver = ref(false)

// Refs
const fileUpload = ref(null)

// Computed
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const previewData = computed(() => {
  if (!validationResult.value?.data?.rows) return []
  
  const headers = validationResult.value.data.headers
  return validationResult.value.data.rows.slice(0, 5).map(row => {
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = row[index] || ''
    })
    return obj
  })
})

// Methods
const onFileSelect = async (event) => {
  const file = event.files[0]
  if (!file) return
  
  selectedFile.value = file
  await validateFile(file)
}

const validateFile = async (file) => {
  validating.value = true
  validationResult.value = null
  
  try {
    const result = await csvValidator.validateFile(file);
    validationResult.value = result
    
    if (result.isValid) {
      toast.add({
        severity: 'success',
        summary: 'Validation réussie',
        detail: `Fichier valide avec ${result.data.totalRows} lignes de données`,
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Validation échouée',
        detail: `${result.errors.length} erreur(s) détectée(s)`,
        life: 5000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur de validation',
      detail: 'Impossible de valider le fichier',
      life: 3000
    })
  } finally {
    validating.value = false
  }
}

const removeFile = () => {
  selectedFile.value = null
  validationResult.value = null
  if (fileUpload.value) {
    fileUpload.value.clear()
  }
}

const downloadTemplate = () => {
  try {
    const template = generateCSVTemplate()
    
    // Créer un blob avec le contenu CSV
    const blob = new Blob([template.content], { type: template.type })
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = template.filename
    
    // Déclencher le téléchargement
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Nettoyer l'URL
    window.URL.revokeObjectURL(url)
    
    toast.add({
      severity: 'success',
      summary: 'Modèle téléchargé',
      detail: 'Le modèle CSV a été téléchargé avec succès',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur de téléchargement',
      detail: 'Impossible de télécharger le modèle',
      life: 3000
    })
  }
}

const importData = async () => {
  if (!validationResult.value?.isValid) return
  
  importing.value = true
  
  try {
    const formattedData = csvValidator.formatDataForImport(
      validationResult.value.data.headers,
      validationResult.value.data.rows
    )
    
    // Émettre les données pour le parent
    emit('data-imported', {
      fileName: selectedFile.value.name,
      totalRows: validationResult.value.data.totalRows,
      data: formattedData
    })
    
    toast.add({
      severity: 'success',
      summary: 'Import réussi',
      detail: `${validationResult.value.data.totalRows} lignes importées avec succès`,
      life: 3000
    })
    
    handleClose()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur d\'import',
      detail: 'Impossible d\'importer les données',
      life: 3000
    })
  } finally {
    importing.value = false
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleClose = () => {
  visible.value = false
  // Reset state
  selectedFile.value = null
  validationResult.value = null
  validating.value = false
  importing.value = false
  
  if (fileUpload.value) {
    fileUpload.value.clear()
  }
}

const beforeUpload = (event) => {
  // Empêcher l'upload automatique
  event.preventDefault()
  return false
}

// Watch pour reset quand le dialog se ferme
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    // Reset quand fermé
    setTimeout(() => {
      selectedFile.value = null
      validationResult.value = null
      validating.value = false
      importing.value = false
    }, 300)
  }
})
</script>

<style scoped>
.excel-upload-dialog {
  --dialog-border-radius: 12px;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--primary-color);
}

.dialog-content {
  padding: 1.5rem 0;
}

.upload-instructions {
  margin-bottom: 2rem;
}

.instruction-content h4 {
  margin: 0 0 1rem 0;
  color: var(--primary-color);
  font-weight: 600;
}

.instruction-content ul {
  margin: 0 0 1rem 0;
  padding-left: 1.2rem;
}

.instruction-content li {
  margin-bottom: 0.5rem;
  color: var(--text-color-secondary);
}

.template-download {
  display: flex;
  justify-content: flex-start;
}

.upload-section {
  margin-bottom: 1.5rem;
}

.upload-area {
  border: 2px dashed var(--surface-border);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: var(--surface-ground);
  transition: all 0.3s ease;
  position: relative;
}

.upload-area.drag-over {
  border-color: var(--primary-color);
  background: var(--primary-50);
}

.upload-component {
  width: 100%;
}

.upload-help-text {
  margin-top: 1rem;
  color: var(--text-color-secondary);
}

.upload-icon {
  font-size: 3rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.selected-file {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-icon {
  font-size: 2rem;
  color: var(--green-500);
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-weight: 600;
  color: var(--text-color);
}

.file-size {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.validation-progress {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}

.validation-results {
  margin-top: 1.5rem;
}

.validation-summary h4 {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.error-details, .warning-details {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 6px;
}

.error-details {
  background: var(--red-50);
  border: 1px solid var(--red-200);
}

.warning-details {
  background: var(--yellow-50);
  border: 1px solid var(--yellow-200);
}

.error-details h5, .warning-details h5 {
  margin: 0 0 0.75rem 0;
  font-weight: 600;
}

.error-list, .warning-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-item, .warning-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
}

.error-item {
  background: var(--red-100);
  color: var(--red-800);
}

.warning-item {
  background: var(--yellow-100);
  color: var(--yellow-800);
}

.data-preview {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.data-preview h5 {
  margin: 0 0 1rem 0;
  font-weight: 600;
  color: var(--text-color);
}

.preview-table {
  border: 1px solid var(--surface-border);
  border-radius: 6px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.text-muted {
  color: var(--text-color-secondary);
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .excel-upload-dialog {
    width: 95vw !important;
  }
  
  .upload-area {
    padding: 1rem;
  }
  
  .file-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
