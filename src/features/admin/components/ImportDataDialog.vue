<template>
  <Dialog
    v-model:visible="visible"
    header="Importer les données du fichier"
    modal
    class="import-data-dialog"
    :style="{ width: '50rem' }"
  >
    <div class="dialog-content">
      <div class="file-info-section">
        <div class="file-icon">
          <i class="pi pi-file-excel"></i>
        </div>
        <div class="file-details">
          <h4>{{ file?.name }}</h4>
          <p>{{ file?.formatted_size }} • {{ formatDate(file?.uploaded_at) }}</p>
          <Tag v-if="file?.chantier_name" :value="file.chantier_name" severity="info" />
        </div>
      </div>

      <Divider />

      <div class="form-section">
        <div class="form-group">
          <label for="template">Template de mapping *</label>
          <Select
            id="template"
            v-model="selectedTemplate"
            :options="templates"
            optionLabel="name"
            optionValue="id"
            placeholder="Sélectionnez un template de mapping"
            class="w-full"
            :loading="loadingTemplates"
          >
            <template #option="slotProps">
              <div class="template-option">
                <div class="template-name">{{ slotProps.option.name }}</div>
                <div class="template-meta">
                  <Tag :value="slotProps.option.module" severity="secondary" class="text-xs" />
                  <span class="text-xs text-gray-500">{{ slotProps.option.file_type }}</span>
                </div>
              </div>
            </template>
          </Select>
          <small class="help-text">
            Le template définit comment les colonnes Excel seront interprétées
          </small>
        </div>

        <div class="form-group">
          <label for="chantier">Chantier (optionnel)</label>
          <Select
            id="chantier"
            v-model="selectedChantier"
            :options="chantiers"
            optionLabel="nom"
            optionValue="id"
            placeholder="Sélectionnez un chantier"
            class="w-full"
            :loading="loadingChantiers"
            filter
          >
            <template #option="slotProps">
              <div class="chantier-option">
                <div class="chantier-name">{{ slotProps.option.nom }}</div>
                <div class="chantier-meta">
                  <Tag :value="slotProps.option.statut" :severity="getStatusSeverity(slotProps.option.statut)" class="text-xs" />
                  <span class="text-xs text-gray-500">{{ slotProps.option.code }}</span>
                </div>
              </div>
            </template>
          </Select>
          <small class="help-text">
            Si un chantier est associé, les données importées lui seront liées
          </small>
        </div>

        <div class="checkbox-group">
          <Checkbox v-model="dryRun" inputId="dryRun" :binary="true" />
          <label for="dryRun">Mode prévisualisation (ne pas sauvegarder)</label>
        </div>
      </div>

      <div v-if="previewData" class="preview-section">
        <Divider />
        <h4>Aperçu des données</h4>
        
        <div class="preview-stats">
          <div class="stat-card">
            <i class="pi pi-table"></i>
            <div class="stat-value">{{ previewData.num_rows }}</div>
            <div class="stat-label">Lignes</div>
          </div>
          <div class="stat-card">
            <i class="pi pi-clone"></i>
            <div class="stat-value">{{ previewData.num_columns }}</div>
            <div class="stat-label">Colonnes</div>
          </div>
          <div class="stat-card success">
            <i class="pi pi-check-circle"></i>
            <div class="stat-value">{{ previewData.mapped_columns?.length || 0 }}</div>
            <div class="stat-label">Mappées</div>
          </div>
          <div class="stat-card warning">
            <i class="pi pi-exclamation-triangle"></i>
            <div class="stat-value">{{ previewData.unmapped_columns?.length || 0 }}</div>
            <div class="stat-label">Non mappées</div>
          </div>
        </div>

        <div v-if="previewData.warnings?.length" class="warnings-section">
          <Message v-for="(warning, index) in previewData.warnings" :key="index" severity="warn" :closable="false">
            {{ warning }}
          </Message>
        </div>
      </div>

      <div v-if="importResult" class="result-section">
        <Divider />
        <h4>Résultat de l'import</h4>
        
        <Message 
          :severity="importResult.status === 'SUCCESS' ? 'success' : importResult.status === 'PARTIAL' ? 'warn' : 'error'" 
          :closable="false"
        >
          <strong>{{ importResult.message }}</strong>
        </Message>

        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-label">Lignes traitées:</span>
            <span class="stat-value">{{ importResult.rows_processed }}</span>
          </div>
          <div class="stat-item success">
            <span class="stat-label">Succès:</span>
            <span class="stat-value">{{ importResult.rows_success }}</span>
          </div>
          <div class="stat-item error">
            <span class="stat-label">Erreurs:</span>
            <span class="stat-value">{{ importResult.rows_failed }}</span>
          </div>
        </div>

        <div v-if="importResult.errors?.length" class="errors-section">
          <h5>Erreurs détaillées:</h5>
          <ScrollPanel style="width: 100%; height: 200px">
            <div v-for="(error, index) in importResult.errors" :key="index" class="error-item">
              {{ error }}
            </div>
          </ScrollPanel>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button 
          label="Annuler" 
          text 
          @click="close"
          :disabled="importing"
        />
        <Button
          v-if="!importResult || importResult.status === 'FAILED'"
          label="Prévisualiser"
          icon="pi pi-eye"
          severity="secondary"
          @click="preview"
          :loading="previewing"
          :disabled="!selectedTemplate || importing"
        />
        <Button
          v-if="!importResult || importResult.status === 'FAILED'"
          label="Importer"
          icon="pi pi-upload"
          @click="importData"
          :loading="importing"
          :disabled="!selectedTemplate || previewing"
        />
        <Button
          v-if="importResult && importResult.status !== 'FAILED'"
          label="Fermer"
          icon="pi pi-check"
          @click="close"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { axiosInstance } from '@/main.js'
import { useProjetStore } from '@/stores/projetStore'

const props = defineProps({
  file: {
    type: Object,
    default: null
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'import-success'])

const toast = useToast()
const projetStore = useProjetStore()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const templates = ref([])
const chantiers = ref([])
const selectedTemplate = ref(null)
const selectedChantier = ref(null)
const dryRun = ref(false)
const loadingTemplates = ref(false)
const loadingChantiers = ref(false)
const previewing = ref(false)
const importing = ref(false)
const previewData = ref(null)
const importResult = ref(null)

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR')
}

const getStatusSeverity = (status) => {
  const statusMap = {
    'EN_COURS': 'success',
    'EN_PREPARATION': 'info',
    'TERMINE': 'secondary',
    'SUSPENDU': 'warning',
    'ANNULE': 'danger'
  }
  return statusMap[status] || 'secondary'
}

const loadTemplates = async () => {
  loadingTemplates.value = true
  try {
    const response = await axiosInstance.get('mediatheque/files/available_templates/');
    templates.value = response.data
  } catch (error) {
    console.error('Erreur lors du chargement des templates:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les templates de mapping',
      life: 3000
    })
  } finally {
    loadingTemplates.value = false
  }
}

const loadProjets = async () => {
  loadingChantiers.value = true
  try {
    await projetStore.loadProjets()
    chantiers.value = projetStore.projets
  } catch (error) {
    console.error('Erreur lors du chargement des chantiers:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les chantiers',
      life: 3000
    })
  } finally {
    loadingChantiers.value = false
  }
}

const preview = async () => {
  previewing.value = true
  previewData.value = null
  try {
    const response = await axiosInstance.post(`mediatheque/files/${props.file.id}/preview_import/`, {
      template_id: selectedTemplate.value
    })
    previewData.value = response.data
    toast.add({
      severity: 'success',
      summary: 'Aperçu généré',
      detail: 'Vérifiez les données avant l\'import',
      life: 3000
    })
  } catch (error) {
    console.error('Erreur lors de la prévisualisation:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.error || 'Impossible de prévisualiser les données',
      life: 5000
    })
  } finally {
    previewing.value = false
  }
}

const importData = async () => {
  importing.value = true
  importResult.value = null
  try {
    const payload = {
      template_id: selectedTemplate.value,
      dry_run: dryRun.value
    }
    if (selectedChantier.value) {
      payload.chantier_id = selectedChantier.value
    }

    const response = await axiosInstance.post(`mediatheque/files/${props.file.id}/import_data/`, payload);
    importResult.value = response.data

    if (response.data.status === 'SUCCESS') {
      toast.add({
        severity: 'success',
        summary: 'Import réussi',
        detail: `${response.data.rows_success} lignes importées avec succès`,
        life: 5000
      })
      const templateObj = templates.value.find(t => t.id === selectedTemplate.value) || null
      emit('import-success', { result: response.data, template: templateObj })
    } else if (response.data.status === 'PARTIAL') {
      toast.add({
        severity: 'warn',
        summary: 'Import partiel',
        detail: `${response.data.rows_success} lignes importées, ${response.data.rows_failed} échecs`,
        life: 5000
      })
      const templateObj = templates.value.find(t => t.id === selectedTemplate.value) || null
      emit('import-success', { result: response.data, template: templateObj })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Échec de l\'import',
        detail: 'Aucune ligne n\'a pu être importée',
        life: 5000
      })
    }
  } catch (error) {
    console.error('Erreur lors de l\'import:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.error || 'Impossible d\'importer les données',
      life: 5000
    })
  } finally {
    importing.value = false
  }
}

const close = () => {
  visible.value = false
  setTimeout(() => {
    selectedTemplate.value = null
    selectedChantier.value = null
    dryRun.value = false
    previewData.value = null
    importResult.value = null
  }, 300)
}

watch(() => props.file, (newFile) => {
  if (newFile) {
    selectedChantier.value = newFile.chantier || null
  }
}, { immediate: true })

watch(visible, (newVal) => {
  if (newVal) {
    loadTemplates()
    loadProjets()
  }
})
</script>

<style scoped>
.import-data-dialog {
  border-radius: 16px;
}

.dialog-content {
  padding: 1rem 0;
}

.file-info-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.file-icon {
  width: 60px;
  height: 60px;
  background: #7AC943;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
}

.file-details h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0B2B3C;
}

.file-details p {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #64748b;
}

.form-section {
  margin: 1rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #0B2B3C;
  margin-bottom: 0.5rem;
}

.help-text {
  display: block;
  margin-top: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.checkbox-group label {
  font-weight: 500;
  color: #0B2B3C;
  margin: 0;
}

.template-option,
.chantier-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.template-name,
.chantier-name {
  font-weight: 600;
  color: #0B2B3C;
}

.template-meta,
.chantier-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-section,
.result-section {
  margin: 1rem 0;
}

.preview-section h4,
.result-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0B2B3C;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card {
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
}

.stat-card.success {
  background: #f0fdf4;
  border-color: #7AC943;
}

.stat-card.warning {
  background: #fef9e8;
  border-color: #f59e0b;
}

.stat-card i {
  font-size: 1.5rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.stat-card.success i {
  color: #7AC943;
}

.stat-card.warning i {
  color: #f59e0b;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0B2B3C;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.warnings-section,
.errors-section {
  margin-top: 1rem;
}

.warnings-section :deep(.p-message) {
  margin-bottom: 0.5rem;
}

.result-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 8px;
}

.stat-item.success {
  background: #f0fdf4;
}

.stat-item.error {
  background: #fef2f2;
}

.stat-item .stat-label {
  font-weight: 600;
  color: #64748b;
}

.stat-item .stat-value {
  font-weight: 700;
  color: #0B2B3C;
  font-size: 1.25rem;
}

.errors-section h5 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #ef4444;
}

.error-item {
  padding: 0.5rem;
  background: #fef2f2;
  border-left: 3px solid #ef4444;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #991b1b;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@media (max-width: 768px) {
  .preview-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

