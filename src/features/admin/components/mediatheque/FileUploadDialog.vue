<template>
  <Dialog
    :visible="modelValue"
    @update:visible="$emit('update:modelValue', $event)"
    :header="stockOnly ? 'Importer des données de stock' : 'Ajouter un fichier'"
    modal
    class="upload-dialog"
    :style="{ width: '35rem' }"
  >
    <div class="dialog-content">
          <div class="upload-area">
        <FileUpload
          mode="basic"
          :auto="false"
          :accept="stockOnly ? '.csv,.xls,.xlsx' : 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx,.zip,.rar'"
          :maxFileSize="stockOnly ? 10000000 : 50000000"
          :chooseLabel="stockOnly ? 'Choisir un fichier Stock' : 'Choisir un fichier'"
          class="upload-component"
          @select="onFileSelect"
        />
      </div>

      <div class="form-row" v-if="selectedFile">
        <div v-if="!stockOnly" class="form-group half-width">
          <label for="uploadType">Type d'import</label>
          <SelectButton
            id="uploadType"
            v-model="selectedUploadType"
            :options="uploadOptions"
            optionLabel="label"
            optionValue="value"
            class="type-selector"
          />
        </div>
        <div class="form-group" :class="{ 'half-width': !stockOnly, 'full-width': stockOnly }">
          <label>Statut</label>
          <div class="status-chip" :class="validationClass">
            {{ validationText }}
          </div>
        </div>
      </div>

      <div class="form-row" v-if="selectedFile">
        <div class="form-group full-width">
          <label for="fileName">Nom du fichier *</label>
          <InputText
            id="fileName"
            v-model="fileForm.name"
            placeholder="Entrez le nom du fichier"
            class="form-input"
          />
        </div>
      </div>

      <div class="form-row" v-if="selectedFile">
        <div class="form-group full-width">
          <label for="fileDescription">Description</label>
          <Textarea
            id="fileDescription"
            v-model="fileForm.description"
            placeholder="Description du fichier (optionnel)"
            rows="2"
            class="form-textarea"
          />
        </div>
      </div>

      <div class="form-row" v-if="selectedFile && validationErrors.length">
        <div class="form-group full-width validation-box">
          <strong>Vérification du fichier :</strong>
          <ul>
            <li v-for="(error, index) in validationErrors" :key="index">{{ error }}</li>
          </ul>
        </div>
      </div>

      <div class="form-row" v-if="selectedFile && validationWarnings.length">
        <div class="form-group full-width validation-box warning-box">
          <strong>Avertissements :</strong>
          <ul>
            <li v-for="(warning, index) in validationWarnings" :key="index">{{ warning }}</li>
          </ul>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button label="Annuler" text @click="cancelUpload" />
        <Button
          :label="selectedUploadType === 'generic' ? 'Uploader' : 'Valider et mettre à jour'"
          @click="doUpload"
          :loading="uploading"
          :disabled="!selectedFile || (selectedUploadType !== 'generic' && validationErrors.length > 0)"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { read, utils } from 'xlsx'
import { useToast } from 'primevue/usetoast'
import { useMediathequeStore } from '../../stores/mediathequeStore'
import { useImportEventsStore } from '@/stores/importEventsStore'
import {
  importEnginsFile,
  importMesFile,
  importStockFile
} from '@/shared/services/moduleImportService.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  stockOnly: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'uploaded'])

const store = useMediathequeStore()
const importEventsStore = useImportEventsStore()
const toast = useToast()

const selectedFile = ref(null)
const fileForm = ref(getEmptyForm())
const selectedUploadType = ref(props.stockOnly ? 'stock' : 'generic')
const uploading = ref(false)
const validationErrors = ref([])
const validationWarnings = ref([])
const ENGINS_IMPORT_EVENT = 'engins-import-updated'
const STOCK_IMPORT_EVENT = 'kap-import-event'

const dispatchImportEvent = (key, payload) => {
  const eventPayload = { key, payload, timestamp: Date.now() }
  localStorage.setItem(`kap-last-${key}-import`, JSON.stringify(eventPayload))
  importEventsStore.triggerImport(key, payload)
  window.dispatchEvent(new CustomEvent(STOCK_IMPORT_EVENT, { detail: eventPayload }))
}

const uploadOptions = [
  { label: 'Standard', value: 'generic' },
  { label: 'Import Stock (Stock.xlsx)', value: 'stock' },
  { label: 'Import MES (template_MES_une_feuille)', value: 'mes' },
  { label: 'Import Engins (engins_import_sessions_v3.xlsx)', value: 'engins' }
]

function getEmptyForm() {
  return { name: '', description: '' }
}

const onFileSelect = (event) => {
  selectedFile.value = event.files[0]
  fileForm.value.name = event.files[0].name
  validationErrors.value = []
  validationWarnings.value = []

  if (props.stockOnly) {
    selectedUploadType.value = 'stock'
  } else {
    const inferred = detectImportType(selectedFile.value.name)
    if (selectedUploadType.value === 'generic' && inferred !== 'generic') {
      selectedUploadType.value = inferred
    }
  }

  if (selectedUploadType.value !== 'generic') {
    validateSelectedFile()
  }
}

watch([selectedUploadType, selectedFile], async ([newType, newFile], [oldType, oldFile]) => {
  if (newFile && newType !== 'generic') {
    await validateSelectedFile()
  } else {
    validationErrors.value = []
    validationWarnings.value = []
  }
})

const detectImportType = (fileName) => {
  // Keep a lightweight filename inference, but it is only used to pre-select the type for the user.
  const lowerName = (fileName || '').toLowerCase()
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    if (lowerName.includes('stock')) return 'stock'
    if (lowerName.includes('mes') || lowerName.includes('template_mes')) return 'mes'
    if (lowerName.includes('engins') || lowerName.includes('engin')) return 'engins'
  }
  return 'generic'
}

const validateSelectedFile = async () => {
  if (!selectedFile.value) return
  validationErrors.value = []
  validationWarnings.value = []

  const type = selectedUploadType.value
  if (type === 'generic') return

  const lowerName = selectedFile.value.name.toLowerCase()
  if (!lowerName.match(/\.(xlsx?|xls|csv)$/)) {
    validationErrors.value.push('Le fichier doit être au format Excel (.xlsx ou .xls) ou CSV (.csv) pour ce type d’import.')
    return
  }

  if (lowerName.endsWith('.csv')) {
    return
  }

  const workbook = read(await selectedFile.value.arrayBuffer(), { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) {
    validationErrors.value.push('Aucune feuille détectée dans le fichier Excel.')
    return
  }

  const headers = utils.sheet_to_json(sheet, { header: 1, range: 0, blankrows: false })[0] || []
  const stripAccents = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const normalizeHeader = (h) => stripAccents(String(h || '').trim().toLowerCase())
  const normalized = headers.map(normalizeHeader)

  const requiredGroups = {
    stock: [
      ['reference', 'reference_article', 'référence', 'ref', 'reférence', 'refe'],
      ['name', 'nom_article', 'nom', 'produit', 'designation', 'désignation']
    ],
    mes: [
      ['reference', 'ordre_id', 'order_id'],
      ['product', 'produit'],
      ['machine', 'machine_id']
    ],
    engins: [
      ['reference'],
      ['name'],
      ['type']
    ]
  }[type] || []

  // For each required group, check if any alternative header exists
  const missingGroups = []
  requiredGroups.forEach((alternatives) => {
    const found = alternatives.some((alt) => normalized.includes(normalizeHeader(alt)))
    if (!found) {
      missingGroups.push(alternatives.join('/') )
    }
  })

  if (missingGroups.length) {
    validationErrors.value.push(`Colonnes manquantes: ${missingGroups.join(', ')}`)
  }

  if (normalized.length === 0) {
    validationErrors.value.push('Le fichier ne contient pas de ligne d’en-tête valide.')
  }

  // Helpful warnings about recommended but not mandatory columns
  if (type === 'stock') {
    const hasReference = normalized.includes('reference') || normalized.includes('reference_article')
    const hasQuantity = normalized.includes('quantity') || normalized.includes('quantité') || normalized.includes('stock_disponible')
    if (hasReference && !hasQuantity) {
      validationWarnings.value.push('La colonne quantité/quantité est recommandée pour un import de stock.')
    }
  }

  if (type === 'mes') {
    if (normalized.includes('reference') && !normalized.includes('product') && !normalized.includes('produit')) {
      validationWarnings.value.push('La colonne produit est recommandée pour un import MES.')
    }
  }
}

const doImportStock = async (file) => {
  /**
   * Import fichier Stock.xlsx vers l'API
   */
  try {
    const result = await importStockFile(file)
    if (result.success || result.imported > 0 || result.updated > 0 || result.replaced > 0) {
      toast.add({
        severity: 'success',
        summary: 'Import Stock réussi',
        detail: `${result.imported || 0} créés, ${result.updated || 0} modifiés, ${result.replaced || 0} remplacés, ${result.movements || 0} mouvements`,
        life: 4000
      })
      dispatchImportEvent('stock', result)
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Import Stock complété avec avertissements',
        detail: result.message || 'Vérifiez les erreurs',
        life: 4000
      })
      dispatchImportEvent('stock', result)
    }
    return result
  } catch (error) {
    const detail = error.response?.data?.error || error.response?.data?.message || error.message
    toast.add({
      severity: 'error',
      summary: 'Erreur import Stock',
      detail,
      life: 4000
    })
    throw error
  }
}

const doImportMES = async (file) => {
  /**
   * Import fichier template_MES vers l'API
   */
  try {
    const result = await importMesFile(file)
    if (result.success || result.imported > 0) {
      toast.add({
        severity: 'success',
        summary: 'Import MES réussi',
        detail: `${result.imported} créés, ${result.updated} modifiés, ${result.skipped} ignorés`,
        life: 4000
      })
      importEventsStore.triggerImport('mes', result)
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Import MES complété avec avertissements',
        detail: result.message || 'Vérifiez les erreurs',
        life: 4000
      })
    }
    return result
  } catch (error) {
    const detail = error.response?.data?.error || error.response?.data?.message || error.message
    toast.add({
      severity: 'error',
      summary: 'Erreur import MES',
      detail,
      life: 4000
    })
    throw error
  }
}

const doImportEngins = async (file) => {
  try {
    const result = await importEnginsFile(file)
    if (result && !result.error) {
      toast.add({
        severity: 'success',
        summary: 'Import Engins réussi',
        detail: 'Les données Engins ont été importées et sauvegardées.',
        life: 4000
      })
      const eventPayload = {
        type: 'engins',
        data: result,
        timestamp: Date.now()
      }
      importEventsStore.triggerImport('engins', result)
      window.dispatchEvent(new CustomEvent(ENGINS_IMPORT_EVENT, { detail: eventPayload }))
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Import Engins complété avec avertissements',
        detail: result.error || 'Vérifiez le contenu du fichier',
        life: 4000
      })
    }
    return result
  } catch (error) {
    const detail = error.response?.data?.error || error.response?.data?.message || error.message
    toast.add({
      severity: 'error',
      summary: 'Erreur import Engins',
      detail,
      life: 4000
    })
    throw error
  }
}

const doUpload = async () => {
  if (!selectedFile.value || !fileForm.value.name) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Sélectionnez un fichier et remplissez le nom', life: 3000 })
    return
  }

  if (selectedUploadType.value !== 'generic' && validationErrors.value.length) {
    toast.add({ severity: 'warn', summary: 'Fichier invalide', detail: 'Corrigez les erreurs de cohérence avant d’envoyer.', life: 4000 })
    return
  }

  uploading.value = true
  let uploadedFile = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('name', fileForm.value.name)
    if (fileForm.value.description) formData.append('description', fileForm.value.description)
    if (store.currentFolder) formData.append('folder', String(store.currentFolder))

    uploadedFile = await store.uploadFile(formData)
    toast.add({ severity: 'success', summary: 'Fichier uploadé', life: 2000 })

    if (selectedUploadType.value === 'stock') {
      const result = await doImportStock(selectedFile.value)
      emit('uploaded', { type: 'stock-import', file: uploadedFile, data: result })
    } else if (selectedUploadType.value === 'mes') {
      const result = await doImportMES(selectedFile.value)
      emit('uploaded', { type: 'mes-import', file: uploadedFile, data: result })
    } else if (selectedUploadType.value === 'engins') {
      const result = await doImportEngins(selectedFile.value)
      emit('uploaded', { type: 'engins-import', file: uploadedFile, data: result })
    } else {
      emit('uploaded', uploadedFile)
    }

    cancelUpload()
  } catch (error) {
    if (uploadedFile) {
      emit('uploaded', uploadedFile)
    }
    console.error('Upload error:', error)
  } finally {
    uploading.value = false
  }
}

const cancelUpload = () => {
  selectedFile.value = null
  fileForm.value = getEmptyForm()
  selectedUploadType.value = props.stockOnly ? 'stock' : 'generic'
  validationErrors.value = []
  validationWarnings.value = []
  emit('update:modelValue', false)
}

const validationClass = computed(() => {
  if (validationErrors.value.length) return 'invalid'
  if (validationWarnings.value.length) return 'warning'
  return 'valid'
})

const validationText = computed(() => {
  if (validationErrors.value.length) return 'Incohérence détectée'
  if (validationWarnings.value.length) return 'Cohérence vérifiée avec avertissements'
  return selectedUploadType.value === 'generic' ? 'Aucun contrôle requis' : 'Fichier vérifié'
})
</script>

<style scoped>
.upload-area {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group.full-width {
  flex: 1 1 100%;
}

.form-group.half-width {
  flex: 1 1 48%;
}

.status-chip {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-chip.valid {
  background: #DCFCE7;
  color: #166534;
}

.status-chip.warning {
  background: #FEF3C7;
  color: #78350F;
}

.status-chip.invalid {
  background: #FEE2E2;
  color: #B91C1C;
}

.validation-box {
  background: #F8FAFC;
  border: 1px solid #CBD5E1;
  padding: 1rem;
  border-radius: 0.75rem;
}

.warning-box {
  background: #FFFBEB;
  border-color: #F59E0B;
}

.form-group label {
  font-weight: 500;
  color: #475569;
}

.form-input, .form-textarea {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
