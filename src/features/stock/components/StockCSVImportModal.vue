<template>
  <Dialog
    v-model:visible="visible"
    modal
    class="stock-csv-dialog"
    :style="{ width: '60rem' }"
    @hide="handleClose"
  >
    <template #header>
      <div class="dialog-header">
        <i class="pi pi-cloud-upload"></i>
        <span>Import CSV - Articles en stock</span>
      </div>
    </template>

    <div class="dialog-content">
      <!-- Instructions -->
      <Message severity="info" class="mb-4">
        <div class="instruction-content">
          <h4>Instructions d'import</h4>
          <ul>
            <li><strong>reference</strong>, <strong>name</strong> et <strong>warehouse_code</strong> sont obligatoires</li>
            <li>Le <strong>warehouse_code</strong> doit correspondre a un entrepot existant (ex: WH-DKR-01)</li>
            <li>Les articles avec une référence déjà existante seront ignorés</li>
            <li>Taille maximale : 5MB | Maximum 10 000 lignes</li>
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

      <!-- Upload Zone -->
      <div class="upload-section">
        <div class="upload-area">
          <FileUpload
            mode="basic"
            :auto="false"
            accept=".csv"
            :maxFileSize="5000000"
            chooseLabel="Choisir un fichier CSV"
            class="upload-component"
            @select="onFileSelect"
            ref="fileUpload"
          />

          <div class="upload-help-text" v-if="!selectedFile">
            <i class="pi pi-cloud-upload upload-icon"></i>
            <p>Cliquez pour sélectionner ou glissez-déposez votre fichier CSV</p>
          </div>
        </div>
      </div>

      <!-- Selected File -->
      <div v-if="selectedFile" class="selected-file">
        <div class="file-info">
          <div class="file-details">
            <i class="pi pi-file file-icon"></i>
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

      <!-- Validating -->
      <div v-if="validating" class="validation-progress">
        <ProgressSpinner style="width:50px;height:50px" strokeWidth="8" />
        <p>Validation du fichier en cours...</p>
      </div>

      <!-- Validation Results -->
      <div v-if="validationResult" class="validation-results">
        <Message v-if="validationResult.isValid" severity="success" class="mb-3">
          <div class="validation-summary">
            <h4>Fichier valide</h4>
            <p>{{ validationResult.data.totalRows }} lignes de données détectées</p>
          </div>
        </Message>

        <Message v-if="!validationResult.isValid" severity="error" class="mb-3">
          <div class="validation-summary">
            <h4>Fichier non valide</h4>
            <p>{{ validationResult.errors.length }} erreur(s) détectée(s)</p>
          </div>
        </Message>

        <!-- Errors -->
        <div v-if="validationResult.errors?.length > 0" class="error-details">
          <h5>Erreurs détectées :</h5>
          <ul class="error-list">
            <li v-for="(error, idx) in validationResult.errors.slice(0, 20)" :key="idx" class="error-item">
              <i class="pi pi-exclamation-triangle"></i>
              <span>{{ error.message }}</span>
              <Badge v-if="error.row" :value="`Ligne ${error.row}`" severity="danger" />
            </li>
            <li v-if="validationResult.errors.length > 20" class="error-item">
              <i class="pi pi-info-circle"></i>
              <span>... et {{ validationResult.errors.length - 20 }} autres erreurs</span>
            </li>
          </ul>
        </div>

        <!-- Warnings -->
        <div v-if="validationResult.warnings?.length > 0" class="warning-details">
          <h5>Avertissements :</h5>
          <ul class="warning-list">
            <li v-for="(warning, idx) in validationResult.warnings.slice(0, 10)" :key="idx" class="warning-item">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ warning.message }}</span>
              <Badge v-if="warning.row" :value="`Ligne ${warning.row}`" severity="warning" />
            </li>
          </ul>
        </div>

        <!-- Data Preview -->
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

      <!-- Import Result -->
      <div v-if="importResult" class="import-result">
        <Message severity="success" class="mb-2" v-if="importResult.created > 0">
          <span><strong>{{ importResult.created }}</strong> article(s) créé(s) avec succès</span>
        </Message>
        <Message severity="warn" class="mb-2" v-if="importResult.skipped > 0">
          <span><strong>{{ importResult.skipped }}</strong> article(s) ignore(s) (reference existante)</span>
        </Message>
        <div v-if="importResult.errors?.length > 0" class="error-details">
          <h5>Erreurs lors de l'import :</h5>
          <ul class="error-list">
            <li v-for="(err, idx) in importResult.errors.slice(0, 10)" :key="idx" class="error-item">
              <i class="pi pi-exclamation-triangle"></i>
              <span>Ligne {{ err.row }} : {{ err.error }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Fermer"
          text
          @click="handleClose"
        />
        <Button
          v-if="!importResult"
          label="Importer les articles"
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
import { useStockStore } from '@/features/stock/stores/stockStore'
import stockCsvValidator from '../utils/stockCsvValidator.js'
import { generateCSVTemplate } from '../templates/stockCsvTemplate.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'import-completed'])

const toast = useToast()
const stockStore = useStockStore()

// State
const selectedFile = ref(null)
const validating = ref(false)
const validationResult = ref(null)
const importing = ref(false)
const importResult = ref(null)

const fileUpload = ref(null)

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

const onFileSelect = async (event) => {
  const file = event.files[0]
  if (!file) return

  selectedFile.value = file
  importResult.value = null
  await validateFile(file)
}

const validateFile = async (file) => {
  validating.value = true
  validationResult.value = null

  try {
    const result = await stockCsvValidator.validateFile(file)
    validationResult.value = result

    if (result.isValid) {
      toast.add({
        severity: 'success',
        summary: 'Validation reussie',
        detail: `Fichier valide avec ${result.data.totalRows} lignes de données`,
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Validation echouee',
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
  importResult.value = null
  if (fileUpload.value) {
    fileUpload.value.clear()
  }
}

const downloadTemplate = () => {
  try {
    const template = generateCSVTemplate()

    const blob = new Blob([template.content], { type: template.type })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = template.filename

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.add({
      severity: 'success',
      summary: 'Modèle téléchargé',
      detail: 'Le modèle CSV a été téléchargé',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de télécharger le modèle',
      life: 3000
    })
  }
}

const importData = async () => {
  if (!validationResult.value?.isValid || !selectedFile.value) return

  importing.value = true

  try {
    const result = await stockStore.importCSV(selectedFile.value)
    importResult.value = result

    if (result.created > 0) {
      toast.add({
        severity: 'success',
        summary: 'Import reussi',
        detail: `${result.created} article(s) importe(s) avec succes`,
        life: 5000
      })
      emit('import-completed', result)
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Aucun article créé',
        detail: `${result.skipped} article(s) ignore(s) - references existantes`,
        life: 5000
      })
    }

    // Clear validation state after successful import
    validationResult.value = null
    selectedFile.value = null
    if (fileUpload.value) {
      fileUpload.value.clear()
    }
  } catch (error) {
    const detail = error.response?.data?.error || "Erreur lors de l'import"
    toast.add({
      severity: 'error',
      summary: "Erreur d'import",
      detail,
      life: 5000
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
  selectedFile.value = null
  validationResult.value = null
  validating.value = false
  importing.value = false
  importResult.value = null

  if (fileUpload.value) {
    fileUpload.value.clear()
  }
}

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    setTimeout(() => {
      selectedFile.value = null
      validationResult.value = null
      validating.value = false
      importing.value = false
      importResult.value = null
    }, 300)
  }
})
</script>

<style scoped>
.stock-csv-dialog {
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

.import-result {
  margin-top: 1.5rem;
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

@media (max-width: 768px) {
  .stock-csv-dialog {
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
