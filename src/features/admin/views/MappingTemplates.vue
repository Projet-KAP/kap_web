<template>
  <div class="mapping-templates-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Templates de Mapping</h1>
        <p class="page-subtitle">Configurez les templates pour importer des données Excel/CSV</p>
      </div>
      <Button
        label="Nouveau Template"
        icon="pi pi-plus"
        @click="openCreateDialog"
        class="create-btn"
      />
    </div>

    <div class="page-content">
      <DataTable
        :value="mappingStore.mappingTemplates"
        :loading="mappingStore.loading"
        paginator
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} templates"
        filterDisplay="row"
        :globalFilterFields="['name', 'module', 'file_type']"
        class="templates-table"
      >
        <template #header>
          <div class="table-header">
            <InputText v-model="filters['global'].value" placeholder="Rechercher..." />
          </div>
        </template>

        <Column field="name" header="Nom" sortable style="min-width: 200px">
          <template #body="{ data }">
            <div class="template-name">
              <strong>{{ data.name }}</strong>
              <Tag v-if="!data.is_active" value="Inactif" severity="secondary" class="ml-2" />
            </div>
          </template>
        </Column>

        <Column field="module" header="Module" sortable style="min-width: 150px">
          <template #body="{ data }">
            <Tag :value="data.module" :severity="getModuleSeverity(data.module)" />
          </template>
        </Column>

        <Column field="file_type" header="Type de fichier" sortable style="min-width: 120px">
          <template #body="{ data }">
            <Tag :value="data.file_type" severity="info" />
          </template>
        </Column>

        <Column field="client_name" header="Client" sortable style="min-width: 150px">
          <template #body="{ data }">
            {{ data.client_name || 'Global' }}
          </template>
        </Column>

        <Column field="column_mapping" header="Colonnes mappées" style="min-width: 150px">
          <template #body="{ data }">
            <Badge :value="Object.keys(data.column_mapping || {}).length" severity="success" />
            colonnes
          </template>
        </Column>

        <Column field="created_at" header="Date de création" sortable style="min-width: 150px">
          <template #body="{ data }">
            {{ formatDate(data.created_at) }}
          </template>
        </Column>

        <Column header="Actions" style="min-width: 200px" :exportable="false">
          <template #body="{ data }">
            <div class="action-buttons">
              <Button
                icon="pi pi-copy"
                text
                rounded
                @click="duplicateTemplate(data)"
                v-tooltip.top="'Dupliquer'"
              />
              <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="secondary"
                @click="editTemplate(data)"
                v-tooltip.top="'Modifier'"
              />
              <Button
                :icon="data.is_active ? 'pi pi-eye-slash' : 'pi pi-eye'"
                text
                rounded
                :severity="data.is_active ? 'warning' : 'success'"
                @click="toggleActive(data)"
                v-tooltip.top="data.is_active ? 'Désactiver' : 'Activer'"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                @click="confirmDelete(data)"
                v-tooltip.top="'Supprimer'"
              />
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="empty-state">
            <i class="pi pi-inbox empty-icon"></i>
            <h3>Aucun template trouvé</h3>
            <p>Créez votre premier template de mapping</p>
            <Button
              label="Créer un template"
              icon="pi pi-plus"
              @click="openCreateDialog"
              class="mt-3"
            />
          </div>
        </template>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="showTemplateDialog"
      modal
      class="template-dialog"
      :style="{ width: '70rem', maxHeight: '90vh' }"
    >
      <template #header>
        <h3>{{ isEditing ? 'Modifier le template' : 'Créer un template' }}</h3>
      </template>
      <div class="dialog-content">
        <div class="form-row">
          <div class="form-group">
            <label for="templateName">Nom *</label>
            <InputText
              id="templateName"
              v-model="templateForm.name"
              placeholder="Ex: Production Terrassement ABC"
              class="w-full"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="templateModule">Module *</label>
            <Select
              id="templateModule"
              v-model="templateForm.module"
              :options="moduleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionnez un module"
              class="w-full"
            />
          </div>
          <div class="form-group">
            <label for="templateFileType">Type de fichier *</label>
            <Select
              id="templateFileType"
              v-model="templateForm.file_type"
              :options="fileTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionnez un type"
              class="w-full"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label for="templateDescription">Description</label>
            <Textarea
              id="templateDescription"
              v-model="templateForm.description"
              rows="3"
              placeholder="Description du template..."
              class="w-full"
            />
          </div>
        </div>

        <Divider />

        <h4>Mapping des colonnes</h4>
        <p class="help-text mb-3">
          Définissez comment les colonnes Excel/CSV seront mappées vers les champs de la base de données
        </p>

        <div class="mapping-section">
          <div
            v-for="(mapping, index) in templateForm.mappings"
            :key="index"
            class="mapping-row"
          >
            <div class="mapping-fields">
              <div class="field-group">
                <label>Nom de colonne Excel</label>
                <InputText
                  v-model="mapping.excel_column"
                  placeholder="Ex: Volume Déblai (m³)"
                  class="w-full"
                />
              </div>
              <div class="field-group">
                <label>Tag cible</label>
                <Select
                  v-model="mapping.tag_id"
                  :options="availableTags"
                  optionLabel="tag_name"
                  optionValue="id"
                  placeholder="Sélectionnez un tag"
                  filter
                  class="w-full"
                >
                  <template #option="slotProps">
                    <div class="tag-option">
                      <div class="tag-name">{{ slotProps.option.tag_name }}</div>
                      <div class="tag-meta">
                        <Tag :value="slotProps.option.tag_type" severity="secondary" class="text-xs" />
                        <span class="text-xs text-gray-500">{{ slotProps.option.data_type }}</span>
                      </div>
                    </div>
                  </template>
                </Select>
              </div>
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                @click="removeMapping(index)"
                class="remove-mapping-btn"
              />
            </div>
          </div>

          <Button
            label="Ajouter un mapping"
            icon="pi pi-plus"
            text
            @click="addMapping"
            class="add-mapping-btn"
          />
        </div>

        <Divider />

        <div class="form-row">
          <div class="form-group">
            <label for="templateSheetName">Nom de la feuille</label>
            <InputText
              id="templateSheetName"
              v-model="templateForm.sheet_name"
              placeholder="Nom de la feuille Excel (optionnel)"
              class="w-full"
            />
          </div>
          <div class="form-group">
            <label for="templateHeaderRow">Ligne d'en-tête</label>
            <InputNumber
              id="templateHeaderRow"
              v-model="templateForm.header_row"
              :min="0"
              placeholder="0"
              class="w-full"
            />
          </div>
        </div>

        <div class="checkbox-group">
          <Checkbox v-model="templateForm.is_active" inputId="isActive" :binary="true" />
          <label for="isActive">Template actif</label>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button label="Annuler" text @click="closeDialog" />
          <Button
            :label="isEditing ? 'Mettre à jour' : 'Créer'"
            @click="saveTemplate"
            :loading="saving"
          />
        </div>
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useMappingStore } from '@/stores/mappingStore'

const confirm = useConfirm()
const toast = useToast()
const mappingStore = useMappingStore()

const showTemplateDialog = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const availableTags = ref([])

const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

const templateForm = ref({
  name: '',
  module: '',
  file_type: 'EXCEL',
  description: '',
  sheet_name: '',
  header_row: 0,
  mappings: [],
  is_active: true
})

const moduleOptions = [
  { label: 'MES (Manufacturing Execution System)', value: 'MES' },
  { label: 'Chantiers TP', value: 'CHANTIER' },
  { label: 'Gestion Stock', value: 'STOCK' },
  { label: 'Finance', value: 'FINANCE' }
]

const fileTypeOptions = [
  { label: 'Excel (.xlsx, .xls)', value: 'EXCEL' },
  { label: 'CSV (.csv)', value: 'CSV' }
]

const getModuleSeverity = (module) => {
  const map = {
    'MES': 'info',
    'CHANTIER': 'success',
    'STOCK': 'warning',
    'FINANCE': 'danger'
  }
  return map[module] || 'secondary'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}


const loadTemplates = async () => {
  try {
    await mappingStore.loadMappingTemplates()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les templates',
      life: 3000
    })
  }
}

const loadTags = async () => {
  try {
    await mappingStore.loadColumnTags()
    availableTags.value = mappingStore.columnTags
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les tags',
      life: 3000
    })
  }
}

const openCreateDialog = () => {
  isEditing.value = false
  templateForm.value = {
    name: '',
    module: '',
    file_type: 'EXCEL',
    description: '',
    sheet_name: '',
    header_row: 0,
    mappings: [],
    is_active: true
  }
  showTemplateDialog.value = true
}

const editTemplate = (template) => {
  isEditing.value = true
  const mappings = []
  if (template.column_mapping) {
    Object.entries(template.column_mapping).forEach(([excel_column, tag_id]) => {
      mappings.push({ excel_column, tag_id: parseInt(tag_id) })
    })
  }
  
  templateForm.value = {
    id: template.id,
    name: template.name,
    module: template.module,
    file_type: template.file_type,
    description: template.description || '',
    sheet_name: template.sheet_name || '',
    header_row: template.header_row || 0,
    mappings,
    is_active: template.is_active
  }
  showTemplateDialog.value = true
}

const addMapping = () => {
  templateForm.value.mappings.push({
    excel_column: '',
    tag_id: null
  })
}

const removeMapping = (index) => {
  templateForm.value.mappings.splice(index, 1)
}

const saveTemplate = async () => {
  if (!templateForm.value.name || !templateForm.value.module) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez remplir les champs obligatoires',
      life: 3000
    })
    return
  }

  saving.value = true
  try {
    const column_mapping = {}
    templateForm.value.mappings.forEach(mapping => {
      if (mapping.excel_column && mapping.tag_id) {
        column_mapping[mapping.excel_column] = mapping.tag_id
      }
    })

    const payload = {
      name: templateForm.value.name,
      module: templateForm.value.module,
      file_type: templateForm.value.file_type,
      description: templateForm.value.description,
      sheet_name: templateForm.value.sheet_name,
      header_row: templateForm.value.header_row,
      column_mapping,
      is_active: templateForm.value.is_active
    }

    if (isEditing.value) {
      await mappingStore.updateMappingTemplate(templateForm.value.id, payload)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Template mis à jour',
        life: 3000
      })
    } else {
      await mappingStore.createMappingTemplate(payload)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Template créé',
        life: 3000
      })
    }

    closeDialog()
    await loadTemplates()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder le template',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const duplicateTemplate = async (template) => {
  try {
    await mappingStore.duplicateMappingTemplate(template.id)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Template dupliqué',
      life: 3000
    })
    await loadTemplates()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de dupliquer le template',
      life: 3000
    })
  }
}

const toggleActive = async (template) => {
  try {
    await mappingStore.updateMappingTemplate(template.id, {
      is_active: !template.is_active
    })
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: template.is_active ? 'Template désactivé' : 'Template activé',
      life: 3000
    })
    await loadTemplates()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de modifier le template',
      life: 3000
    })
  }
}

const confirmDelete = (template) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer le template "${template.name}" ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    accept: () => deleteTemplate(template.id)
  })
}

const deleteTemplate = async (id) => {
  try {
    await mappingStore.deleteMappingTemplate(id)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Template supprimé',
      life: 3000
    })
    await loadTemplates()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le template',
      life: 3000
    })
  }
}

const closeDialog = () => {
  showTemplateDialog.value = false
  templateForm.value = {
    name: '',
    module: '',
    file_type: 'EXCEL',
    description: '',
    sheet_name: '',
    header_row: 0,
    mappings: [],
    is_active: true
  }
}

onMounted(() => {
  Promise.all([loadTemplates(), loadTags()])
})
</script>

<style scoped>
.mapping-templates-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #0B2B3C;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

.create-btn {
  background: #7AC943 !important;
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
}

.page-content {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: flex-start;
  padding: 1rem;
}

.template-name {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.empty-icon {
  font-size: 4rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.template-dialog {
  border-radius: 16px;
}

.dialog-content {
  padding: 1rem 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #0B2B3C;
  margin-bottom: 0.5rem;
}

.help-text {
  color: #64748b;
  font-size: 0.875rem;
}

.mapping-section {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  background: #f8fafc;
}

.mapping-row {
  margin-bottom: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.mapping-fields {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
}

.field-group label {
  display: block;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.remove-mapping-btn {
  margin-bottom: 0.25rem;
}

.add-mapping-btn {
  width: 100%;
  margin-top: 0.5rem;
}

.tag-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tag-name {
  font-weight: 600;
  color: #0B2B3C;
}

.tag-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@media (max-width: 768px) {
  .mapping-templates-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .form-row,
  .mapping-fields {
    grid-template-columns: 1fr;
  }
}
</style>

