<template>
  <Toast />
  <div class="documents-page">
    <!-- Header épuré -->
    <div class="page-header">
      <div class="header-content">
        <h1>Documents</h1>
        <p>Gestion et suivi de vos documents</p>
      </div>
    </div>

    <!-- Statistiques neutres -->
    <div class="stats-row">
      <div class="stat-card" :class="{ active: itemTypeFilter === 'model' }" @click="itemTypeFilter = itemTypeFilter === 'model' ? null : 'model'">
        <div class="stat-icon">
          <i class="pi pi-file-edit"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats?.total_models || 0 }}</span>
          <span class="stat-label">Templates</span>
        </div>
      </div>

      <div class="stat-card" :class="{ active: itemTypeFilter === 'report' }" @click="itemTypeFilter = itemTypeFilter === 'report' ? null : 'report'">
        <div class="stat-icon">
          <i class="pi pi-file"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats?.total_reports || 0 }}</span>
          <span class="stat-label">Documents</span>
        </div>
      </div>

      <div class="stat-card" :class="{ active: statusFilter === 'SUBMITTED' }" @click="statusFilter = statusFilter === 'SUBMITTED' ? null : 'SUBMITTED'; itemTypeFilter = 'report'">
        <div class="stat-icon">
          <i class="pi pi-clock"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats?.pending_reports || 0 }}</span>
          <span class="stat-label">En attente</span>
        </div>
      </div>

      <div class="stat-card" :class="{ active: statusFilter === 'VALIDATED' }" @click="statusFilter = statusFilter === 'VALIDATED' ? null : 'VALIDATED'; itemTypeFilter = 'report'">
        <div class="stat-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats?.completed_reports || 0 }}</span>
          <span class="stat-label">Terminés</span>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="main-content">
      <!-- Filtres type (pills) -->
      <div class="type-filter-pills">
        <button
          class="type-pill"
          :class="{ active: itemTypeFilter === null }"
          @click="itemTypeFilter = null"
        >Tous</button>
        <button
          class="type-pill"
          :class="{ active: itemTypeFilter === 'report' }"
          @click="itemTypeFilter = 'report'"
        ><i class="pi pi-file mr-1"></i>Documents</button>
        <button
          class="type-pill"
          :class="{ active: itemTypeFilter === 'model' }"
          @click="itemTypeFilter = 'model'"
        ><i class="pi pi-file-edit mr-1"></i>Templates</button>
      </div>

      <div class="filters-bar">
        <div class="search-box">
          <i class="pi pi-search search-icon"></i>
          <InputText
            v-model="searchQuery"
            placeholder="Rechercher un document, template..."
            class="search-input"
          />
          <i v-if="searchQuery" class="pi pi-times search-clear" @click="searchQuery = ''"></i>
        </div>

        <div class="filter-controls">
          <div class="filter-chip" :class="{ 'filter-chip--active': statusFilter }">
            <Select
              v-model="statusFilter"
              :options="currentStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Statut"
              class="filter-dropdown"
            />
            <span v-if="statusFilter" class="filter-dot"></span>
          </div>

          <div class="filter-chip" :class="{ 'filter-chip--active': typeFilter }">
            <Select
              v-model="typeFilter"
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Type"
              class="filter-dropdown"
            />
            <span v-if="typeFilter" class="filter-dot"></span>
          </div>

        </div>
      </div>

      <!-- Section tableau -->
      <div class="table-section">
        <div class="section-header">
          <h3>{{ itemTypeFilter === 'model' ? 'Templates' : itemTypeFilter === 'report' ? 'Documents' : 'Tous les documents' }}</h3>
          <div class="section-actions">
            <button class="actions-trigger-btn" @click="actionsPopover.toggle($event)">
              <i class="pi pi-plus-circle"></i>
              <span>Actions</span>
              <i class="pi pi-chevron-down trigger-chevron"></i>
            </button>
            <Popover ref="actionsPopover" class="actions-popover">
              <div class="actions-popover-list">
                <button v-if="itemTypeFilter !== 'model'" class="action-item" @click="openReportModal(); actionsPopover.hide()">
                  <span class="action-icon action-icon--green"><i class="pi pi-file-plus"></i></span>
                  <div class="action-text">
                    <span class="action-label">Nouveau document</span>
                    <span class="action-desc">Créer un nouveau document</span>
                  </div>
                </button>
                <button v-if="itemTypeFilter !== 'report'" class="action-item" @click="openModelModal(); actionsPopover.hide()">
                  <span class="action-icon action-icon--blue"><i class="pi pi-file-edit"></i></span>
                  <div class="action-text">
                    <span class="action-label">Nouveau template</span>
                    <span class="action-desc">Créer un modèle réutilisable</span>
                  </div>
                </button>
                <div class="action-separator" />
                <button v-if="itemTypeFilter !== 'model'" class="action-item" @click="showImportDialog = true; actionsPopover.hide()">
                  <span class="action-icon action-icon--teal"><i class="pi pi-file-excel"></i></span>
                  <div class="action-text">
                    <span class="action-label">Créer depuis Excel</span>
                    <span class="action-desc">Importer des données Excel</span>
                  </div>
                </button>
                <button v-if="itemTypeFilter !== 'report'" class="action-item" @click="showExportTemplateDialog = true; actionsPopover.hide()">
                  <span class="action-icon action-icon--orange"><i class="pi pi-download"></i></span>
                  <div class="action-text">
                    <span class="action-label">Exporter Template</span>
                    <span class="action-desc">Télécharger le template Excel</span>
                  </div>
                </button>
                <div class="action-separator" />
                <button class="action-item" @click="openDocumentBuilderChat(); actionsPopover.hide()">
                  <span class="action-icon action-icon--purple"><i class="pi pi-sparkles"></i></span>
                  <div class="action-text">
                    <span class="action-label">Assistant IA</span>
                    <span class="action-desc">Créer avec l'intelligence artificielle</span>
                  </div>
                </button>
              </div>
            </Popover>
          </div>
        </div>
        
        <!-- Barre d'actions groupées -->
        <Transition name="bulk-bar">
          <div v-if="selectedRows.length > 0" class="bulk-action-bar">
            <span class="bulk-count">{{ selectedRows.length }} élément{{ selectedRows.length > 1 ? 's' : '' }} sélectionné{{ selectedRows.length > 1 ? 's' : '' }}</span>
            <div class="bulk-actions">
              <Select
                v-model="bulkStatusTarget"
                :options="bulkStatusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Changer le statut..."
                class="bulk-status-select"
              />
              <Button
                label="Appliquer"
                icon="pi pi-check"
                :disabled="!bulkStatusTarget"
                @click="applyBulkStatus"
                size="small"
              />
              <Button
                label="Annuler la sélection"
                icon="pi pi-times"
                text
                severity="secondary"
                @click="selectedRows = []"
                size="small"
              />
            </div>
          </div>
        </Transition>

        <TableSkeleton
          v-if="loading"
          type="treetable"
          :columns="6"
          :rows="8"
          :showHeader="false"
        />
        <!-- DataTable simple et stable -->
        <DataTable
          v-else-if="flatData && flatData.length > 0"
          :value="flatData"
          :lazy="itemTypeFilter !== 'model'"
          paginator
          :rows="rowsPerPage"
          :rowsPerPageOptions="[12, 25, 50, 100]"
          :totalRecords="itemTypeFilter !== 'model' ? documentStore.instancesPagination.total_count : flatData.length"
          @page="onPage"
          class="documents-table"
          tableStyle="min-width: 50rem"
          stripedRows
          v-model:selection="selectedRows"
          dataKey="key"
        >
          <!-- Colonne sélection -->
          <Column selectionMode="multiple" style="width: 3rem" :exportable="false" />

          <!-- Colonne nom avec icône -->
          <Column field="name" header="Nom" sortable style="min-width: 200px">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i :class="getNodeIcon(data)" class="text-blue-500"></i>
                <span class="font-medium">{{ data.name }}</span>
              </div>
            </template>
          </Column>
          
          <!-- Colonne type -->
          <Column field="type" header="Type" sortable style="min-width: 130px">
            <template #body="{ data }">
              <Tag
                :value="data.type === 'model' ? 'Template' : 'Document'"
                :severity="data.type === 'model' ? 'info' : 'success'"
              />
            </template>
          </Column>
          
          <!-- Colonne créé par -->
          <Column field="created_by_name" header="Créé par" sortable style="min-width: 150px">
            <template #body="{ data }">
              <span>{{ data.created_by_name || data.operateur_name || 'Inconnu' }}</span>
            </template>
          </Column>
          
          <!-- Colonne statut -->
          <Column field="status" header="Statut" sortable style="min-width: 150px">
            <template #body="{ data }">
              <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
            </template>
          </Column>
          
          <!-- Colonne date -->
          <Column field="date_creation" header="Date création" sortable style="min-width: 120px">
            <template #body="{ data }">
              <span>{{ formatDate(data.date_creation) }}</span>
            </template>
          </Column>
          
          <!-- Colonne progression (seulement pour les rapports) -->
          <Column field="progression" header="Progression" style="min-width: 120px">
            <template #body="{ data }">
              <div v-if="data.type === 'report'" class="flex items-center gap-2">
                <ProgressBar :value="data.progression || 0" :showValue="false" class="w-full" />
                <span class="text-sm">{{ data.progression || 0 }}%</span>
              </div>
              <span v-else class="text-gray-400">-</span>
            </template>
          </Column>
          
          <!-- Colonne actions -->
          <Column header="Actions" style="min-width: 180px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <!-- Actions pour modèles -->
                <Button 
                  v-if="data.type === 'model'"
                  icon="pi pi-eye" 
                  text 
                  size="small"
                  @click="viewModel(data)"
                  v-tooltip.top="'Voir'"
                />
                <Button 
                  v-if="data.type === 'model'"
                  icon="pi pi-pencil" 
                  text 
                  size="small"
                  @click="editModel(data)"
                  v-tooltip.top="'Modifier'"
                />
                
                <!-- Actions pour rapports -->
                <Button
                  v-if="data.type === 'report' && data.status === 'DRAFT'"
                  icon="pi pi-play"
                  text
                  size="small"
                  severity="success"
                  @click="publishReport(data)"
                  v-tooltip.top="'Publier (envoyer en tâche)'"
                />
                <Button
                  v-if="data.type === 'report'"
                  icon="pi pi-pencil"
                  text
                  size="small"
                  @click="editReport(data)"
                  v-tooltip.top="'Modifier'"
                />

                <!-- Action supprimer -->
                <Button 
                  icon="pi pi-trash" 
                  text 
                  size="small"
                  severity="danger"
                  @click="deleteItem(data)"
                  v-tooltip.top="'Supprimer'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
        
        <!-- Etat vide -->
        <div v-else-if="!loading" class="empty-state">
          <div class="empty-illustration">
            <i :class="itemTypeFilter === 'model' ? 'pi pi-file-edit' : 'pi pi-file'"></i>
          </div>
          <h3>{{ itemTypeFilter === 'model' ? 'Aucun template' : 'Aucun document' }}</h3>
          <p>{{ itemTypeFilter === 'model' ? 'Créez un template pour structurer vos documents' : 'Créez votre premier document pour commencer' }}</p>
          <div class="empty-actions">
            <Button
              :label="itemTypeFilter === 'model' ? 'Nouveau template' : 'Nouveau document'"
              icon="pi pi-plus"
              @click="itemTypeFilter === 'model' ? openModelModal() : openReportModal()"
              class="btn-green"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog Export Template Excel -->
    <Dialog
      v-model:visible="showExportTemplateDialog"
      header="Exporter Template Excel"
      :style="{ width: '500px' }"
      :modal="true"
    >
      <div class="export-dialog-content">
        <p class="dialog-description">
          Sélectionnez un modèle pour exporter son template Excel vierge. Ce template pourra être rempli avec des données et réimporté.
        </p>
        <div class="form-field">
          <label>Modèle à exporter</label>
          <Select
            v-model="selectedModelForExport"
            :options="availableModeles"
            optionLabel="nom"
            optionValue="id"
            placeholder="Sélectionner un modèle"
            class="w-full"
            filter
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="Annuler"
          @click="showExportTemplateDialog = false"
          class="p-button-text"
        />
        <Button
          label="Exporter"
          icon="pi pi-download"
          @click="exportTemplate"
          :disabled="!selectedModelForExport"
          class="p-button-primary"
        />
      </template>
    </Dialog>

    <!-- Dialog Import Documents Excel -->
    <Dialog
      v-model:visible="showImportDialog"
      header="Créer un document depuis Excel"
      :style="{ width: '600px' }"
      :modal="true"
    >
      <div class="import-dialog-content">
        <p class="dialog-description">
          Créez un nouveau document en important les données depuis un fichier Excel. Le fichier doit correspondre au template du modèle sélectionné.
        </p>

        <!-- Bouton télécharger modèle de base - toujours visible -->
        <div class="download-template-section mb-4">
          <Button
            label="Télécharger un modèle de base"
            icon="pi pi-download"
            @click="downloadBaseTemplate"
            class="p-button-outlined p-button-help w-full"
          />
          <small class="text-gray-500 block mt-1">Template Excel générique que vous pouvez personnaliser</small>
        </div>

        <Divider />

        <div class="form-field">
          <label>Document (modèle de base) <span class="required">*</span></label>
          <Select
            v-model="importModelId"
            :options="availableModeles"
            optionLabel="nom"
            optionValue="id"
            placeholder="Sélectionner le modèle de document"
            class="w-full"
            filter
          />
        </div>

        <div class="form-field">
          <label>Nom du document <span class="required">*</span></label>
          <InputText
            v-model="importReportName"
            placeholder="Ex: Document de production - Décembre 2025"
            class="w-full"
          />
        </div>

        <div class="form-field">
          <label>Fichier Excel <span class="required">*</span></label>
          <FileUpload
            ref="fileUploader"
            mode="basic"
            accept=".xlsx,.xls"
            :maxFileSize="10000000"
            @select="onFileSelect"
            chooseLabel="Sélectionner un fichier"
            class="w-full"
          />
          <small v-if="importFile" class="file-info">
            <i class="pi pi-file-excel"></i>
            {{ importFile.name }} ({{ formatFileSize(importFile.size) }})
          </small>
        </div>

        <Message v-if="importModelId" severity="info" :closable="false" class="mt-3">
          <template #default>
            <div class="import-tip">
              <strong>Astuce :</strong> Téléchargez d'abord le template Excel du modèle pour avoir le bon format.
              <Button
                label="Télécharger le template"
                icon="pi pi-download"
                @click="exportTemplateForImport"
                class="p-button-sm p-button-outlined mt-2"
              />
            </div>
          </template>
        </Message>
      </div>
      <template #footer>
        <Button
          label="Annuler"
          @click="closeImportDialog"
          class="p-button-text"
        />
        <Button
          label="Créer le document"
          icon="pi pi-upload"
          @click="importReports"
          :disabled="!importFile || !importModelId || !importReportName"
          :loading="importing"
          class="p-button-primary"
        />
      </template>
    </Dialog>

    <!-- Modals -->
    <ConfirmDialog />
    
    <ModelModal 
      v-if="showModelModal" 
      :visible="showModelModal"
      :model="selectedModel"
      @close="closeModelModal"
      @saved="onModelSaved"
    />
    
    <ReportModal
      v-if="showReportModal"
      :visible="showReportModal"
      :report="selectedReport"
      @close="closeReportModal"
      @saved="onReportSaved"
    />

    <!-- Document Builder Chat -->
    <DocumentBuilderChat
      ref="documentBuilderChatRef"
      @modele-created="onModeleCreatedByAI"
      @modele-updated="onModeleUpdatedByAI"
      @open-modele="onOpenModeleFromChat"
    />

    <!-- Dashboard Creation Wizard -->
    <DashboardCreationWizard />
    <PostSubmitPrompt />

    <!-- Dialog prévisualisation rapport -->
    <Dialog
      v-model:visible="showPreviewDrawer"
      :modal="true"
      :closable="true"
      :closeOnEscape="true"
      :dismissableMask="true"
      :style="{ width: 'min(700px, 95vw)' }"
      class="preview-dialog"
    >
      <template #header>
        <div class="preview-dialog-header">
          <span class="preview-dialog-title">{{ previewReport?.nom }}</span>
          <div class="preview-dialog-meta">
            <Tag :value="getStatusLabel(previewReport?.status)" :severity="getStatusSeverity(previewReport?.status)" />
            <span class="preview-date">{{ formatDate(previewReport?.date_creation) }}</span>
          </div>
        </div>
      </template>
      <div v-if="previewReport" class="preview-content">
        
        <div class="preview-body">
          <!-- Informations générales -->
          <div class="info-section">
            <h3>Informations générales</h3>
            <div class="info-grid">
              <div class="info-item" v-if="previewReport.modele_name">
                <strong>Modèle:</strong>
                <span>{{ previewReport.modele_name }}</span>
              </div>
              <div class="info-item" v-if="previewReport.workplace_name">
                <strong>Poste de travail:</strong>
                <span>{{ previewReport.workplace_name }}</span>
              </div>
              <div class="info-item" v-if="previewReport.machine_name">
                <strong>Machine:</strong>
                <span>{{ previewReport.machine_name }}</span>
              </div>
              <div class="info-item" v-if="previewReport.operateur_name">
                <strong>Opérateur assigné:</strong>
                <span>{{ previewReport.operateur_name }}</span>
              </div>
              <div class="info-item" v-if="previewReport.date_prevue">
                <strong>Date prévue:</strong>
                <span>{{ formatDate(previewReport.date_prevue) }}</span>
              </div>
              <div class="info-item" v-if="previewReport.date_limite">
                <strong>Date limite:</strong>
                <span>{{ formatDate(previewReport.date_limite) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Données du formulaire -->
          <div v-if="previewReport.donnees_remplies && Object.keys(previewReport.donnees_remplies).length > 0" class="data-preview">
            <h3>Données du formulaire</h3>
            <div class="data-fields">
              <template v-for="field in previewReport.modele_structure?.fields || []" :key="field?.id || Math.random()">
                <div 
                  v-if="field && previewReport.donnees_remplies[field.id] !== undefined && previewReport.donnees_remplies[field.id] !== null && previewReport.donnees_remplies[field.id] !== ''"
                  class="data-field"
                >
                  <strong>{{ field.label }}:</strong>
                  <span v-if="field.type === 'CHECKBOX'">
                    {{ previewReport.donnees_remplies[field.id] ? 'Oui' : 'Non' }}
                  </span>
                  <span v-else-if="field.type === 'DATE'">
                    {{ formatDate(previewReport.donnees_remplies[field.id]) }}
                  </span>
                  <span v-else class="data-value">
                    {{ previewReport.donnees_remplies[field.id] }}
                  </span>
                </div>
              </template>
            </div>
          </div>
          
          <!-- Commentaires -->
          <div v-if="previewReport.commentaires" class="comments-section">
            <h3>Commentaires</h3>
            <p class="comments-text">{{ previewReport.commentaires }}</p>
          </div>
        </div>
      </div>
    </Dialog>

  </div>

</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useDocumentStore } from '../stores/documentStore'
import { useAuthStore } from '@/features/auth/stores/authStore'
import ModelModal from '../components/ModelModal.vue'
import ReportModal from '../components/ReportModal.vue'
import DocumentBuilderChat from '../components/DocumentBuilderChat.vue'
import DashboardCreationWizard from '@/features/ai/components/DashboardCreationWizard.vue'
import PostSubmitPrompt from '@/features/ai/components/PostSubmitPrompt.vue'
import { useDashboardWizardStore } from '@/features/ai/stores/dashboardWizardStore'

// Composables
const toast = useToast()
const route = useRoute()
const confirm = useConfirm()
const documentStore = useDocumentStore()
const authStore = useAuthStore()
const wizardStore = useDashboardWizardStore()

// Feature flag pour l'export/import Excel (désactivé par défaut)
const canExportExcel = computed(() => authStore.hasModule('documents_excel_export'))

// Refs
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref(null)
const typeFilter = ref(null)
const itemTypeFilter = ref(null) // null = tous, 'report' = rapports, 'model' = templates
const currentPage = ref(1)
const rowsPerPage = ref(12)
const showModelModal = ref(false)
const showReportModal = ref(false)
const showPreviewDrawer = ref(false)
const showExportTemplateDialog = ref(false)
const showImportDialog = ref(false)
const selectedModel = ref(null)
const selectedReport = ref(null)
const previewReport = ref(null)
const expandedKeys = ref({})
const selectedModelForExport = ref(null)
const importFile = ref(null)
const importModelId = ref(null)
const importReportName = ref('')
const importing = ref(false)
const documentBuilderChatRef = ref(null)
const selectedRows = ref([])
const bulkStatusTarget = ref(null)

// Mapping des statuts anglais vers français
const statusLabels = {
  // Statuts des rapports/instances
  'DRAFT': 'Brouillon',
  'IN_PROGRESS': 'En cours',
  'SUBMITTED': 'Soumis',
  'PENDING_VALIDATION': 'En attente',
  'VALIDATED': 'Validé',
  'REJECTED': 'Rejeté',
  'COMPLETED': 'Terminé',
  'CANCELLED': 'Annulé',
  'EXPIRED': 'Expiré',
  // Statuts des modèles
  'ACTIVE': 'Actif',
  'ARCHIVED': 'Archivé',
  'PUBLISHED': 'Publié'
}

// Fonction pour traduire un statut (gère les différentes casses)
const getStatusLabel = (status) => {
  if (!status) return status
  // Essayer d'abord la valeur exacte, puis en majuscules
  return statusLabels[status] || statusLabels[status.toUpperCase()] || status
}

// Stats computed - se base directement sur les données du store
const stats = computed(() => {
  const storeStats = documentStore.stats
  return {
    total_models: storeStats?.modeles?.total || 0,
    total_reports: storeStats?.instances?.total || 0,
    pending_reports: storeStats?.instances?.soumises || 0,
    completed_reports: storeStats?.instances?.validees || 0
  }
})

// Modèles disponibles pour les selects (garantit l'accès correct aux données)
const availableModeles = computed(() => {
  return documentStore.modeles || []
})

// Options
const statusOptions = [
  { label: 'Tous', value: null },
  { label: 'Brouillon', value: 'DRAFT' },
  { label: 'Publié', value: 'PUBLISHED' },
  { label: 'En cours', value: 'IN_PROGRESS' },
  { label: 'Soumis', value: 'SUBMITTED' },
  { label: 'À valider', value: 'PENDING_VALIDATION' },
  { label: 'Validé', value: 'VALIDATED' },
  { label: 'Rejeté', value: 'REJECTED' },
  { label: 'Expiré', value: 'EXPIRED' },
  { label: 'Actif', value: 'ACTIVE' },
  { label: 'Archivé', value: 'ARCHIVED' }
]

const reportStatusOptions = [
  { label: 'Brouillon', value: 'DRAFT' },
  { label: 'Publié', value: 'PUBLISHED' },
  { label: 'En cours', value: 'IN_PROGRESS' },
  { label: 'Soumis', value: 'SUBMITTED' },
  { label: 'À valider', value: 'PENDING_VALIDATION' },
  { label: 'Validé', value: 'VALIDATED' },
  { label: 'Rejeté', value: 'REJECTED' },
  { label: 'Expiré', value: 'EXPIRED' },
  { label: 'Archivé', value: 'ARCHIVED' }
]

const modelStatusOptions = [
  { label: 'Brouillon', value: 'DRAFT' },
  { label: 'Actif', value: 'ACTIVE' },
  { label: 'Archivé', value: 'ARCHIVED' }
]

// Options de statut pour les actions groupées (union rapports + modèles)
const bulkStatusOptions = computed(() => {
  const hasReports = selectedRows.value.some(r => r.type === 'report')
  const hasModels = selectedRows.value.some(r => r.type === 'model')
  if (hasReports && !hasModels) return reportStatusOptions
  if (hasModels && !hasReports) return modelStatusOptions
  // Mélange : proposer les statuts communs
  return [
    { label: 'Brouillon', value: 'DRAFT' },
    { label: 'Archivé', value: 'ARCHIVED' }
  ]
})

// Options de statut — couvrent rapports et templates
const currentStatusOptions = computed(() => {
  if (itemTypeFilter.value === 'model') {
    return [
      { label: 'Tous', value: null },
      { label: 'Brouillon', value: 'DRAFT' },
      { label: 'Actif', value: 'ACTIVE' },
      { label: 'Archivé', value: 'ARCHIVED' }
    ]
  }
  return [
    { label: 'Tous', value: null },
    { label: 'Brouillon', value: 'DRAFT' },
    { label: 'En cours', value: 'IN_PROGRESS' },
    { label: 'Soumis', value: 'SUBMITTED' },
    { label: 'À valider', value: 'PENDING_VALIDATION' },
    { label: 'Validé', value: 'VALIDATED' },
    { label: 'Rejeté', value: 'REJECTED' },
    { label: 'Actif', value: 'ACTIVE' },
    { label: 'Archivé', value: 'ARCHIVED' }
  ]
})

const typeOptions = [
  { label: 'Tous', value: null },
  { label: 'Production', value: 'PRODUCTION_DAILY' },
  { label: 'Maintenance', value: 'MAINTENANCE_SHEET' },
  { label: 'Qualité', value: 'QUALITY_CHECK' },
  { label: 'Sécurité', value: 'SAFETY_INSPECTION' }
]

// Tree data - maintenant un computed (voir plus bas)

// Function to build tree data
const buildTreeData = () => {
  const data = []
  
  // Sécurité: vérifier que les données existent
  if (!documentStore.modeles || !Array.isArray(documentStore.modeles)) {
    return data
  }
  
  // Ajouter les modèles
  documentStore.modeles.forEach(model => {
    if (!model || !model.id) return // Skip invalid models
    
    const modelNode = {
      key: `model-${model.id}`,
      name: model.nom || 'Modèle sans nom',
      type: 'model',
      document_type: model.document_type || 'CUSTOM',
      status: model.status || 'DRAFT',
      created_by_name: model.created_by_name || 'Inconnu',
      date_creation: model.date_creation,
      id: model.id,
      children: []
    }
    
    // Ajouter les rapports enfants seulement si instances existe
    if (documentStore.instances && Array.isArray(documentStore.instances)) {
      const modelReports = documentStore.instances.filter(instance => instance && instance.modele === model.id)
      modelReports.forEach(report => {
        if (!report || !report.id) return // Skip invalid reports
        
        modelNode.children.push({
          key: `report-${report.id}`,
          name: report.nom || 'Rapport sans nom',
          type: 'report',
          status: report.status || 'DRAFT',
          operateur_name: report.operateur_name || 'Inconnu',
          date_creation: report.date_creation,
          progression: report.progression || 0,
          id: report.id
        })
      })
    }
    
    data.push(modelNode)
  })
  
  return data
}

// Flat data pour DataTable - liste unifiée filtrée par itemTypeFilter
const flatData = computed(() => {
  let data = []

  // Toujours ajouter les modèles (sauf si filtre = 'report')
  if (itemTypeFilter.value !== 'report') {
    if (documentStore.modeles && Array.isArray(documentStore.modeles)) {
      documentStore.modeles.forEach(model => {
        if (model && model.id) {
          data.push({
            id: model.id,
            key: `model-${model.id}`,
            name: model.nom || 'Modèle sans nom',
            type: 'model',
            document_type: model.document_type || 'CUSTOM',
            status: model.status || 'DRAFT',
            created_by_name: model.created_by_name || 'Inconnu',
            date_creation: model.date_creation,
            progression: null,
            structure_json: model.structure_json
          })
        }
      })
    }
  }

  // Toujours ajouter les rapports (sauf si filtre = 'model')
  if (itemTypeFilter.value !== 'model') {
    if (documentStore.instances && Array.isArray(documentStore.instances)) {
      documentStore.instances.forEach(instance => {
        if (instance && instance.id) {
          data.push({
            id: instance.id,
            key: `report-${instance.id}`,
            name: instance.nom || instance.title || 'Rapport sans nom',
            type: 'report',
            document_type: instance.document_type,
            status: instance.status || 'DRAFT',
            created_by_name: instance.operateur_name || 'Inconnu',
            date_creation: instance.date_creation,
            progression: instance.progression || 0,
            modele_id: instance.modele,
            modele_name: instance.modele_name
          })
        }
      })
    }
  }

  // Appliquer les filtres de recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    data = data.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.created_by_name && item.created_by_name.toLowerCase().includes(query))
    )
  }

  // Appliquer le filtre de statut
  if (statusFilter.value) {
    data = data.filter(item => item.status === statusFilter.value)
  }

  // Appliquer le filtre de type de document
  if (typeFilter.value) {
    data = data.filter(item => item.document_type === typeFilter.value)
  }

  return data
})

// Methods
const getNodeIcon = (node) => {
  if (!node || !node.type) {
    return 'pi pi-file'
  }
  if (node.type === 'model') {
    return 'pi pi-file-edit'
  } else if (node.type === 'report') {
    return 'pi pi-file'
  }
  return 'pi pi-file'
}

const getTypeLabel = (type) => {
  const typeMap = {
    'PRODUCTION_DAILY': 'Production',
    'MAINTENANCE_SHEET': 'Maintenance',
    'QUALITY_CHECK': 'Qualité',
    'SAFETY_INSPECTION': 'Sécurité',
    'CUSTOM': 'Personnalisé'
  }
  return typeMap[type] || type
}

const getStatusSeverity = (status) => {
  if (!status) return 'secondary'
  const severityMap = {
    'DRAFT': 'secondary',
    'ACTIVE': 'success',
    'ARCHIVED': 'secondary',
    'SUBMITTED': 'warning',
    'VALIDATED': 'success',
    'REJECTED': 'danger',
    'PUBLISHED': 'info',
    'IN_PROGRESS': 'info',
    'PENDING_VALIDATION': 'warning',
    'EXPIRED': 'danger',
    'COMPLETED': 'success',
    'CANCELLED': 'secondary'
  }
  return severityMap[status] || severityMap[status.toUpperCase()] || 'secondary'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR')
}

const onNodeExpand = (node) => {
  expandedKeys.value[node.key] = true
}

const onNodeCollapse = (node) => {
  delete expandedKeys.value[node.key]
}

// Helper pour recharger spécifiquement les données nécessaires
const reloadData = async (types = ['modeles', 'instances', 'stats']) => {
  const promises = []
  if (types.includes('modeles')) promises.push(documentStore.getModeles())
  if (types.includes('instances')) {
    // Charger avec pagination
    promises.push(documentStore.getInstances({
      page: currentPage.value,
      page_size: rowsPerPage.value,
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined
    }))
  }
  if (types.includes('stats')) promises.push(documentStore.getStats())

  try {
    await Promise.all(promises)
    // Le computed flatData se mettra à jour automatiquement
  } catch (error) {
    console.error('Error reloading data:', error)
  }
}

// Pagination handler
const onPage = async (event) => {
  currentPage.value = event.page + 1 // PrimeVue uses 0-based page index
  rowsPerPage.value = event.rows
  await reloadData(['instances'])
}

// Watch filters to reload with pagination reset
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
  reloadData(['instances'])
})

// Watch type filter change — reset status filter to avoid stale combos
watch(itemTypeFilter, () => {
  statusFilter.value = null
  currentPage.value = 1
  reloadData(['instances', 'modeles'])
})

const openModelModal = () => {
  selectedModel.value = null // Nouveau modèle
  showModelModal.value = true
}

const openReportModal = () => {
  console.log('🔵 openReportModal called')
  selectedReport.value = null // Nouveau rapport
  showReportModal.value = true
  console.log('🔵 showReportModal set to:', showReportModal.value)
}

const viewModel = async (model) => {
  // Use the helper function that fetches fields and builds structure_json
  await openModeleWithFields(model.id)
}

const editModel = async (model) => {
  // Use the helper function that fetches fields and builds structure_json
  await openModeleWithFields(model.id)
}

const publishReport = async (report) => {
  try {
    const reportId = report.id || report.key?.replace('report-', '')
    const result = await documentStore.updateInstance(reportId, { status: 'IN_PROGRESS' })
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Publié',
        detail: 'Le rapport est maintenant visible dans Mes Tâches',
        life: 3000
      })
      await reloadData()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de publier le rapport',
      life: 5000
    })
  }
}

const editReport = async (report) => {
  
  // Récupérer le rapport complet depuis l'API
  try {
    const reportId = report.id || report.key?.replace('report-', '')
    if (!reportId) {
      throw new Error('ID du rapport introuvable')
    }
    
    const result = await documentStore.getInstance(reportId)
    
    if (result.success) {
      selectedReport.value = result.data
      showReportModal.value = true
    } else {
      throw new Error(result.message || 'Erreur lors du chargement')
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger le rapport pour modification',
      life: 5000
    })
  }
}

const openPreviewReport = async (report) => {
  try {
    // Récupérer les détails complets du rapport
    const reportId = report.id || report.key?.replace('report-', '')
    
    if (!reportId) {
      throw new Error('ID du rapport manquant')
    }
    
    const result = await documentStore.getInstance(reportId)
    
    if (result.success) {
      previewReport.value = result.data
      showPreviewDrawer.value = true
    } else {
      throw new Error(result.message || 'Erreur lors du chargement')
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger la prévisualisation',
      life: 3000
    })
  }
}

const validateReport = async (report) => {
  try {
    const reportId = report.id || report.key?.replace('report-', '')
    if (!reportId) {
      throw new Error('ID du rapport manquant')
    }
    
    const result = await documentStore.validateInstance(reportId)
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Rapport validé avec succès',
        life: 3000
      })
      await reloadData()
    } else {
      throw new Error(result.message || 'Erreur lors de la validation')
    }
  } catch (error) {
    console.error('Error validating report:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de valider le rapport',
      life: 3000
    })
  }
}

const changeModelStatus = (model, newStatus) => {
  const oldStatus = model.status
  const oldStatusLabel = getStatusLabel(oldStatus)
  const newStatusLabel = getStatusLabel(newStatus)

  confirm.require({
    message: `Voulez-vous vraiment changer le statut de "${oldStatusLabel}" à "${newStatusLabel}" ?`,
    header: 'Confirmation de changement de statut',
    icon: 'pi pi-exclamation-circle',
    acceptLabel: 'Oui, changer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-primary',
    accept: async () => {
      try {
        const modelId = model.id
        const result = await documentStore.updateModele(modelId, { status: newStatus })

        if (result.success) {
          toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: `Statut changé en "${newStatusLabel}"`,
            life: 3000
          })
          await reloadData()
        } else {
          throw new Error(result.error || 'Erreur lors du changement de statut')
        }
      } catch (error) {
        console.error('Error changing model status:', error)
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error.message || 'Impossible de changer le statut',
          life: 5000
        })
        // Recharger pour remettre l'ancien statut
        await reloadData()
      }
    },
    reject: () => {
      // Annulation - recharger pour remettre l'ancien statut dans le dropdown
      reloadData()
    }
  })
}

const changeReportStatus = (report, newStatus) => {
  const oldStatus = report.status
  const oldStatusLabel = getStatusLabel(oldStatus)
  const newStatusLabel = getStatusLabel(newStatus)
  
  confirm.require({
    message: `Voulez-vous vraiment changer le statut de "${oldStatusLabel}" à "${newStatusLabel}" ?`,
    header: 'Confirmation de changement de statut',
    icon: 'pi pi-exclamation-circle',
    acceptLabel: 'Oui, changer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-primary',
    accept: async () => {
      try {
        
        let result
        const reportId = report.id
        
        if (newStatus === 'SUBMITTED') {
          result = await documentStore.submitInstance(reportId)
        } else if (newStatus === 'VALIDATED') {
          result = await documentStore.validateInstance(reportId)
        } else if (newStatus === 'REJECTED') {
          result = await documentStore.rejectInstance(reportId, 'Rejeté manuellement')
        } else {
          // Pour DRAFT ou autres, on fait un update simple
          result = await documentStore.updateInstance(reportId, { status: newStatus })
        }
        
        if (result.success) {
          toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: `Statut changé en "${newStatusLabel}"`,
            life: 3000
          })
          await reloadData()
        } else {
          throw new Error(result.error || 'Erreur lors du changement de statut')
        }
      } catch (error) {
        console.error('Error changing report status:', error)
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error.message || 'Impossible de changer le statut',
          life: 5000
        })
        // Recharger pour remettre l'ancien statut
        await reloadData()
      }
    },
    reject: () => {
      // Annulation - recharger pour remettre l'ancien statut dans le dropdown
      reloadData()
    }
  })
}

const applyBulkStatus = () => {
  const newStatus = bulkStatusTarget.value
  if (!newStatus || !selectedRows.value.length) return
  const newStatusLabel = getStatusLabel(newStatus)
  const count = selectedRows.value.length

  confirm.require({
    message: `Changer le statut de ${count} élément${count > 1 ? 's' : ''} en "${newStatusLabel}" ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-circle',
    acceptLabel: 'Oui, changer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-primary',
    accept: async () => {
      let errors = 0
      for (const row of selectedRows.value) {
        try {
          if (row.type === 'report') {
            let result
            if (newStatus === 'SUBMITTED') result = await documentStore.submitInstance(row.id)
            else if (newStatus === 'VALIDATED') result = await documentStore.validateInstance(row.id)
            else if (newStatus === 'REJECTED') result = await documentStore.rejectInstance(row.id, 'Rejeté manuellement')
            else result = await documentStore.updateInstance(row.id, { status: newStatus })
            if (!result?.success) errors++
          } else {
            const result = await documentStore.updateModele(row.id, { status: newStatus })
            if (!result?.success) errors++
          }
        } catch {
          errors++
        }
      }
      selectedRows.value = []
      bulkStatusTarget.value = null
      await reloadData()
      if (errors === 0) {
        toast.add({ severity: 'success', summary: 'Succès', detail: `${count} élément${count > 1 ? 's' : ''} mis à jour`, life: 3000 })
      } else {
        toast.add({ severity: 'warn', summary: 'Partiel', detail: `${errors} erreur${errors > 1 ? 's' : ''} sur ${count} éléments`, life: 4000 })
      }
    }
  })
}

const deleteItem = (item) => {
  const itemType = item.type === 'model' ? 'modèle' : 'rapport'
  const itemName = item.name || item.nom
  
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer ce ${itemType} "${itemName}" ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        const itemId = item.id || item.key?.replace(/^(model|report)-/, '')
        if (!itemId) {
          throw new Error('ID de l\'élément manquant')
        }
        
        let result
        if (item.type === 'model') {
          result = await documentStore.deleteModele(itemId)
        } else if (item.type === 'report') {
          result = await documentStore.deleteInstance(itemId)
        }
        
        if (result.success) {
          toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} supprimé avec succès`,
            life: 3000
          })
          await reloadData()
        } else {
          throw new Error(result.error || `Erreur lors de la suppression du ${itemType}`)
        }
      } catch (error) {
        console.error('Error deleting item:', error)
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error.message || 'Impossible de supprimer l\'élément',
          life: 5000
        })
      }
    },
    reject: () => {
      // Annulation - ne rien faire
    }
  })
}

// Document Builder Chat Functions
const openDocumentBuilderChat = () => {
  if (documentBuilderChatRef.value) {
    documentBuilderChatRef.value.openChat()
  }
}

const actionsPopover = ref(null)

const onModeleCreatedByAI = async (action) => {
  toast.add({
    severity: 'success',
    summary: 'Modele cree par l\'IA',
    detail: `Le modèle "${action.nom}" a été créé avec succès`,
    life: 5000
  })
  await reloadData()

  // Close the chat and auto-open the model modal to show the created structure
  if (action.id) {
    // Close the chat first
    if (documentBuilderChatRef.value) {
      documentBuilderChatRef.value.closeChat()
    }
    await openModeleWithFields(action.id)
  }
}

const onModeleUpdatedByAI = async (actions) => {
  await reloadData()
}

// Helper function to open a modele with its fields loaded into structure_json
const openModeleWithFields = async (modeleId) => {
  try {
    // Get the modele
    const result = await documentStore.getModele(modeleId)
    if (!result.success) {
      console.error('Failed to get modele:', result.error)
      return
    }

    let modele = result.data

    // Fetch the fields for this modele
    const fieldsResult = await documentStore.getFields(modeleId)

    if (fieldsResult.success && fieldsResult.data && fieldsResult.data.length > 0) {
      // Convert DocumentField objects to structure_json format
      const fields = fieldsResult.data.map(field => ({
        id: field.field_id || field.id,
        label: field.label,
        type: field.field_type || field.type,
        required: field.required || false,
        help: field.help_text || field.help || '',
        order: field.order || 0,
        is_column_group: field.is_column_group || false,
        parent_group: field.parent_group ? (field.parent_group.field_id || field.parent_group) : null,
        group_level: field.group_level || 0,
        column_span: field.column_span || 1,
        group_order: field.group_order || field.order || 0,
        repeatable: field.repeatable || false,
        repetitions: field.repetitions || 1,
        repetition_label: field.repetition_label || '',
        options: field.options_list || field.options || []
      }))

      // Build structure_json from fields
      modele.structure_json = {
        fields: fields,
        has_column_groups: fields.some(f => f.is_column_group),
        version: '1.0'
      }
    }

    selectedModel.value = modele
    showModelModal.value = true

  } catch (error) {
    console.error('Error opening modele with fields:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger le modele',
      life: 5000
    })
  }
}

const onOpenModeleFromChat = async (modeleId) => {
  // Close the chat first
  if (documentBuilderChatRef.value) {
    documentBuilderChatRef.value.closeChat()
  }
  await openModeleWithFields(modeleId)
}

const closeModelModal = () => {
  showModelModal.value = false
  selectedModel.value = null
}

const closeReportModal = () => {
  showReportModal.value = false
  selectedReport.value = null
}

const onModelSaved = async (model) => {
  toast.add({
    severity: 'success',
    summary: 'Succès',
    detail: 'Modèle sauvegardé avec succès',
    life: 3000
  })
  await reloadData()
  closeModelModal()
}

const onReportSaved = async (report) => {
  toast.add({
    severity: 'success',
    summary: 'Succès',
    detail: 'Rapport sauvegardé avec succès',
    life: 3000
  })
  await reloadData()
  closeReportModal()

  // Trigger dashboard wizard prompt after report save/submit
  if (report && (report.status === 'SUBMITTED' || report.status === 'VALIDATED')) {
    // Delay to let the modal close first
    setTimeout(() => {
      wizardStore.showPostSubmitPrompt(report)
    }, 500)
  }
}

// ===== FONCTIONS EXPORT / IMPORT EXCEL =====

// Fonction pour formater la taille de fichier
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Fonction pour gérer la sélection de fichier
const onFileSelect = (event) => {
  if (event.files && event.files.length > 0) {
    importFile.value = event.files[0]
  }
}

// Fonction pour fermer le dialog d'import
const closeImportDialog = () => {
  showImportDialog.value = false
  importFile.value = null
  importModelId.value = null
  importReportName.value = ''
}

// Export du template Excel d'un modèle
const exportTemplate = async () => {
  if (!selectedModelForExport.value) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez sélectionner un modèle',
      life: 3000
    })
    return
  }

  try {
    // Récupérer le modèle complet
    const model = availableModeles.value.find(m => m.id === selectedModelForExport.value)
    if (!model) {
      throw new Error('Modèle non trouvé')
    }

    // Importer xlsx dynamiquement
    const XLSX = await import('xlsx')

    // Construire les données du template
    const structure = model.structure_json || {}
    const fields = structure.fields || []

    // Créer les en-têtes avec les labels des champs
    const headers = ['#'] // Colonne pour le numéro de ligne
    const fieldIds = ['row_num'] // IDs des champs pour le mapping

    fields.forEach(field => {
      if (!field.is_column_group) {
        if (field.repeatable && field.repetitions > 1) {
          // Champs répétés
          for (let i = 1; i <= field.repetitions; i++) {
            headers.push(`${field.label} ${i}`)
            fieldIds.push(`${field.id}_${i}`)
          }
        } else {
          headers.push(field.label)
          fieldIds.push(field.id)
        }
      }
    })

    // Créer les lignes vides selon max_rows
    const maxRows = model.max_rows || 10
    const data = [headers] // Première ligne = en-têtes

    // Ajouter une ligne d'instructions
    const instructions = fieldIds.map((id, idx) => {
      if (idx === 0) return 'Numéro'
      const field = fields.find(f => f.id === id.split('_')[0])
      if (field) {
        switch (field.type) {
          case 'NUMBER': return '(nombre)'
          case 'DATE': return '(JJ/MM/AAAA)'
          case 'DATETIME': return '(JJ/MM/AAAA HH:MM)'
          case 'SELECT': return `(${(field.options || []).join(' | ')})`
          case 'CHECKBOX': return '(OUI/NON)'
          default: return '(texte)'
        }
      }
      return ''
    })
    data.push(instructions)

    // Ajouter les lignes vides
    for (let i = 1; i <= maxRows; i++) {
      const row = [i] // Numéro de ligne
      for (let j = 1; j < headers.length; j++) {
        row.push('')
      }
      data.push(row)
    }

    // Créer le workbook
    const ws = XLSX.utils.aoa_to_array ? XLSX.utils.aoa_to_array(data) : data
    const worksheet = XLSX.utils.aoa_to_sheet(data)

    // Définir la largeur des colonnes
    const colWidths = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }))
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Données')

    // Ajouter une feuille de métadonnées
    const metaData = [
      ['Modèle', model.nom],
      ['Code', model.code_interne],
      ['Version', model.version],
      ['ID', model.id],
      ['Nombre de lignes', maxRows],
      ['Champs', fieldIds.slice(1).join(', ')]
    ]
    const metaSheet = XLSX.utils.aoa_to_sheet(metaData)
    XLSX.utils.book_append_sheet(workbook, metaSheet, 'Métadonnées')

    // Télécharger le fichier
    const fileName = `template_${model.code_interne || model.nom}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)

    toast.add({
      severity: 'success',
      summary: 'Export réussi',
      detail: `Template "${model.nom}" exporté avec succès`,
      life: 3000
    })

    showExportTemplateDialog.value = false
    selectedModelForExport.value = null

  } catch (error) {
    console.error('Erreur export template:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de l\'export du template: ' + error.message,
      life: 5000
    })
  }
}

// Télécharger un template de base vierge (sans modèle existant)
const downloadBaseTemplate = async () => {
  try {
    const XLSX = await import('xlsx')

    // Feuille 1 : Template de données avec colonnes d'exemple
    const dataHeaders = [
      '#',
      'Date',
      'Description',
      'Catégorie',
      'Quantité',
      'Unité',
      'Prix unitaire',
      'Montant total',
      'Observations'
    ]

    const dataInstructions = [
      'N° ligne',
      '(JJ/MM/AAAA)',
      '(texte)',
      '(texte)',
      '(nombre)',
      '(texte: kg, m³, L...)',
      '(nombre)',
      '(nombre)',
      '(texte)'
    ]

    const dataRows = [dataHeaders, dataInstructions]
    for (let i = 1; i <= 20; i++) {
      dataRows.push([i, '', '', '', '', '', '', '', ''])
    }

    const dataSheet = XLSX.utils.aoa_to_sheet(dataRows)
    dataSheet['!cols'] = dataHeaders.map(h => ({ wch: Math.max(h.length + 5, 15) }))

    // Feuille 2 : Instructions
    const instructions = [
      ['=== TEMPLATE DE BASE POUR RAPPORTS KAP ==='],
      [''],
      ['Ce fichier est un modèle de base que vous pouvez personnaliser.'],
      [''],
      ['INSTRUCTIONS :'],
      ['1. Modifiez les en-têtes de la feuille "Données" selon vos besoins'],
      ['2. Remplissez les données dans les lignes en dessous'],
      ['3. La première ligne contient les noms des colonnes'],
      ['4. La deuxième ligne indique le type de données attendu'],
      ['5. Les données commencent à partir de la ligne 3'],
      [''],
      ['TYPES DE DONNÉES SUPPORTÉS :'],
      ['- Texte : Saisie libre'],
      ['- Nombre : Valeurs numériques (utilisez le point ou la virgule pour les décimales)'],
      ['- Date : Format JJ/MM/AAAA'],
      ['- Liste : Valeurs séparées par | (ex: Option1 | Option2 | Option3)'],
      [''],
      ['CONSEILS :'],
      ['- Gardez la colonne # pour numéroter vos lignes'],
      ['- Ne supprimez pas la ligne d\'instructions (ligne 2)'],
      ['- Vous pouvez ajouter ou supprimer des colonnes selon vos besoins'],
      [''],
      ['Pour créer un modèle dans KAP :'],
      ['1. Allez dans Documents > Nouveau modèle'],
      ['2. Définissez la structure avec les mêmes colonnes que votre Excel'],
      ['3. Vous pourrez ensuite importer ce fichier pour créer des rapports']
    ]

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions)
    instructionsSheet['!cols'] = [{ wch: 70 }]

    // Créer le workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Données')
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

    // Télécharger
    const fileName = `template_base_KAP_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)

    toast.add({
      severity: 'success',
      summary: 'Téléchargement réussi',
      detail: 'Le template de base a été téléchargé',
      life: 3000
    })

  } catch (error) {
    console.error('Erreur téléchargement template de base:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du téléchargement: ' + error.message,
      life: 5000
    })
  }
}

// Export template depuis le dialog d'import
const exportTemplateForImport = async () => {
  if (importModelId.value) {
    selectedModelForExport.value = importModelId.value
    await exportTemplate()
    selectedModelForExport.value = null
  }
}

// Import d'un rapport depuis Excel
const importReports = async () => {
  if (!importFile.value || !importModelId.value || !importReportName.value) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez remplir tous les champs obligatoires',
      life: 3000
    })
    return
  }

  importing.value = true

  try {
    // Importer xlsx dynamiquement
    const XLSX = await import('xlsx')

    // Lire le fichier
    const reader = new FileReader()

    const fileData = await new Promise((resolve, reject) => {
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(e)
      reader.readAsArrayBuffer(importFile.value)
    })

    const workbook = XLSX.read(fileData, { type: 'array' })

    // Lire la feuille de données
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (jsonData.length < 3) {
      throw new Error('Le fichier ne contient pas assez de données')
    }

    // Récupérer le modèle
    const model = availableModeles.value.find(m => m.id === importModelId.value)
    if (!model) {
      throw new Error('Modèle non trouvé')
    }

    const structure = model.structure_json || {}
    const fields = structure.fields || []

    // Construire les headers attendus selon la structure du modèle
    // Note: Le premier header est '#' (correspondant au numéro de ligne)
    const expectedHeaders = ['#']
    fields.forEach(field => {
      if (!field.is_column_group) {
        if (field.repeatable && field.repetitions > 1) {
          for (let i = 1; i <= field.repetitions; i++) {
            expectedHeaders.push(`${field.label} ${i}`)
          }
        } else {
          expectedHeaders.push(field.label)
        }
      }
    })

    // Récupérer les headers du fichier Excel (première ligne)
    const excelHeaders = jsonData[0] || []

    // Validation de la structure
    const missingHeaders = expectedHeaders.filter(h => !excelHeaders.includes(h))
    const extraHeaders = excelHeaders.filter(h => !expectedHeaders.includes(h) && h)

    if (missingHeaders.length > 0 || extraHeaders.length > 0) {
      let errorMessage = `La structure du fichier Excel ne correspond pas au modèle "${model.nom}".\n\n`

      if (missingHeaders.length > 0) {
        errorMessage += `Colonnes manquantes: ${missingHeaders.join(', ')}\n`
      }
      if (extraHeaders.length > 0) {
        errorMessage += `Colonnes inattendues: ${extraHeaders.join(', ')}\n`
      }
      errorMessage += `\nVeuillez utiliser le template exporté pour ce modèle.`

      throw new Error(errorMessage)
    }

    // Construire le mapping des colonnes vers les field IDs
    const fieldIds = ['row_num']
    fields.forEach(field => {
      if (!field.is_column_group) {
        if (field.repeatable && field.repetitions > 1) {
          for (let i = 1; i <= field.repetitions; i++) {
            fieldIds.push(`${field.id}_${i}`)
          }
        } else {
          fieldIds.push(field.id)
        }
      }
    })

    // Collecter toutes les données des lignes (ignorer les 2 premières lignes: headers et instructions)
    const donnees_remplies = {}
    let rowCount = 0

    for (let i = 2; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0 || row.every(cell => !cell && cell !== 0)) {
        continue // Ignorer les lignes vides
      }

      // Pour chaque colonne, stocker les données dans un tableau
      for (let j = 1; j < fieldIds.length && j < row.length; j++) {
        const fieldId = fieldIds[j]
        const value = row[j]

        // Initialiser le tableau si nécessaire
        if (!donnees_remplies[fieldId]) {
          donnees_remplies[fieldId] = []
        }

        // Ajouter la valeur au tableau (même si vide, pour conserver l'index)
        donnees_remplies[fieldId].push(value !== undefined && value !== null ? value : '')
      }
      rowCount++
    }

    if (Object.keys(donnees_remplies).length === 0) {
      throw new Error('Aucune donnée valide trouvée dans le fichier')
    }

    // Ajouter le nombre de lignes pour que la grille sache combien afficher
    donnees_remplies._rowCount = rowCount

    // Créer le rapport avec le nom fourni par l'utilisateur
    const reportData = {
      modele: importModelId.value,
      nom: importReportName.value.trim(),
      donnees_remplies,
      status: 'DRAFT'
    }

    const result = await documentStore.createInstance(reportData)

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Rapport créé',
        detail: `Le rapport "${importReportName.value}" a été créé avec succès (${rowCount} ligne(s) importée(s))`,
        life: 5000
      })
      await reloadData()
      closeImportDialog()
    } else {
      throw new Error(result.error || 'Erreur lors de la création du rapport')
    }

  } catch (error) {
    console.error('Erreur import:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur d\'import',
      detail: error.message || 'Erreur lors de l\'import des rapports',
      life: 5000
    })
  } finally {
    importing.value = false
  }
}

// Lifecycle - charger les données une seule fois
onMounted(async () => {

  try {
    // Charger les données en parallèle une seule fois
    await Promise.all([
      documentStore.getModeles(),
      documentStore.getInstances(),
      documentStore.getStats()
    ])

    // Le computed flatData se mettra à jour automatiquement

    // Gérer le paramètre instance depuis la recherche globale
    const instanceId = route.query.instance
    if (instanceId) {
      itemTypeFilter.value = 'report'
      // Ouvrir la preview du document
      const instance = documentStore.instances?.find(i => String(i.id) === String(instanceId))
      if (instance) {
        openPreviewReport(instance)
      }
    }

  } catch (error) {
  } finally {
    // Désactiver le loading en dernier
    loading.value = false
  }
})
</script>

<style scoped>
.documents-page {
  padding: 1.5rem 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-content h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: #1e293b;
}

.header-content p {
  margin: 0.25rem 0 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* SpeedDial fixe en bas à droite */
.page-speed-dial {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
}

.page-speed-dial :deep(.p-speeddial-button) {
  background: #7AC943 !important;
  border-color: #7AC943 !important;
  width: 3.5rem;
  height: 3.5rem;
  box-shadow: 0 4px 16px rgba(122, 201, 67, 0.4);
}

.page-speed-dial :deep(.p-speeddial-button:hover) {
  background: #6bb835 !important;
  border-color: #6bb835 !important;
}

/* Bouton Vert KAP global */
.btn-green {
  background: #7AC943 !important;
  border-color: #7AC943 !important;
  color: white !important;
}

.btn-green:hover {
  background: #6bb835 !important;
  border-color: #6bb835 !important;
}

/* Stat cards row */
.stats-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-card {
  flex: 1;
  background: white;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
}

.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.7rem;
  margin-top: 0.2rem;
  font-weight: 500;
}

/* Style neutre unifié */
.stat-icon {
  background: #f1f5f9;
  color: #64748b;
}

.stat-value {
  color: #1e293b;
}

.stat-label {
  color: #64748b;
}

.stat-card:hover {
  border-color: #cbd5e1;
}

.stat-card:hover .stat-icon {
  color: #475569;
}

.main-content {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

/* Stat card active state */
.stat-card.active {
  border-color: #7AC943;
  background: #f0fce8;
}

.stat-card.active .stat-icon {
  background: #e0f5cc;
  color: #7AC943;
}

.stat-card.active .stat-value {
  color: #5a9e2f;
}

/* Pills de filtre type */
.type-filter-pills {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem 0;
}

.type-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 1rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
}

.type-pill:hover {
  border-color: #7AC943;
  color: #7AC943;
}

.type-pill.active {
  background: #7AC943;
  border-color: #7AC943;
  color: white;
}

/* Barre de filtres */
.filters-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  background: white;
  border-bottom: 1px solid #f1f5f9;
}

/* Champ de recherche */
.search-box {
  flex: 1;
  max-width: 320px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: #94a3b8;
  font-size: 0.875rem;
  pointer-events: none;
  z-index: 1;
}

.search-clear {
  position: absolute;
  right: 0.75rem;
  color: #94a3b8;
  font-size: 0.75rem;
  cursor: pointer;
  z-index: 1;
  transition: color 0.15s;
}
.search-clear:hover { color: #64748b; }

.search-box .search-input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 2.25rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-box .search-input:focus {
  border-color: #7AC943;
  background: white;
  box-shadow: 0 0 0 3px rgba(122, 201, 67, 0.1);
}

/* Filtres */
.filter-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-chip {
  position: relative;
}

.filter-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7AC943;
  border: 1.5px solid white;
  z-index: 2;
}

.filter-chip--active :deep(.p-select) {
  border-color: #7AC943 !important;
  background: #f0fdf4 !important;
}

.filter-controls .filter-dropdown {
  min-width: 130px;
}

.filter-controls .filter-dropdown :deep(.p-select) {
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  font-size: 0.875rem;
}

/* Bouton refresh */
.refresh-btn {
  width: 36px;
  height: 36px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.875rem;
}
.refresh-btn:hover {
  background: white;
  border-color: #7AC943;
  color: #7AC943;
}
.refresh-btn.spinning i {
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.filter-dropdown {
  min-width: 130px;
}

.table-section {
  padding: 1.5rem;
}

/* Popover actions */
.actions-popover-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 260px;
  padding: 4px 0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.15s;
}

.action-item:hover {
  background: #f8fafc;
}

.action-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.action-icon--green  { background: #f0fdf4; color: #7AC943; }
.action-icon--blue   { background: #eff6ff; color: #3b82f6; }
.action-icon--teal   { background: #f0fdfa; color: #0d9488; }
.action-icon--orange { background: #fff7ed; color: #ea580c; }
.action-icon--purple { background: #faf5ff; color: #9333ea; }

.action-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.action-desc {
  font-size: 0.75rem;
  color: #94a3b8;
}

.action-separator {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 14px;
}

/* Barre d'actions groupées */
.bulk-action-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  flex-wrap: wrap;
}

.bulk-count {
  font-weight: 600;
  font-size: 0.875rem;
  color: #1d4ed8;
  white-space: nowrap;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}

.bulk-status-select {
  min-width: 200px;
}

/* Transition barre */
.bulk-bar-enter-active,
.bulk-bar-leave-active {
  transition: all 0.2s ease;
}
.bulk-bar-enter-from,
.bulk-bar-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.section-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.actions-trigger-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #7AC943;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(122, 201, 67, 0.3);
}

.actions-trigger-btn:hover {
  background: #6bb835;
  box-shadow: 0 4px 12px rgba(122, 201, 67, 0.4);
  transform: translateY(-1px);
}

.trigger-chevron {
  font-size: 0.7rem;
  opacity: 0.8;
}

/* Etat vide */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-illustration {
  width: 100px;
  height: 100px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.empty-illustration i {
  font-size: 2.5rem;
  color: #94a3b8;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  color: #64748b;
  font-size: 0.9rem;
  max-width: 300px;
}

.empty-actions {
  display: flex;
  gap: 0.75rem;
}

.empty-actions .btn-green {
  background: #7AC943 !important;
  border-color: #7AC943 !important;
}

.empty-actions .btn-green:hover {
  background: #6bb835 !important;
  border-color: #6bb835 !important;
}

.empty-actions .btn-ai {
  color: #7AC943 !important;
  border-color: #7AC943 !important;
}

.empty-actions .btn-ai:hover {
  background: rgba(122, 201, 67, 0.1) !important;
}

/* Styles pour les dialogs d'export/import */
.export-dialog-content,
.import-dialog-content {
  padding: 0.5rem 0;
}

.dialog-description {
  color: #6c757d;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.form-field label .required {
  color: #dc2626;
  margin-left: 0.25rem;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: #16a34a;
  font-weight: 500;
}

.file-info i {
  color: #16a34a;
}

.import-tip {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.documents-table {
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.node-icon {
  color: #2563eb;
  font-size: 1rem;
}

.node-name {
  font-weight: 500;
  color: #2c3e50;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-text {
  font-size: 0.875rem;
  color: #6c757d;
  min-width: 40px;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  padding: 0.25rem;
}

.action-btn:hover {
  background: #f8f9fa;
}

:deep(.p-treetable) {
  border: none;
}

:deep(.p-treetable-header) {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

:deep(.p-treetable-thead > tr > th) {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #2c3e50;
}

:deep(.p-treetable-tbody > tr > td) {
  border-bottom: 1px solid #f1f3f4;
}

:deep(.p-treetable-tbody > tr:hover > td) {
  background: #f8f9fa;
}

:deep(.p-progressbar) {
  height: 6px;
  background: #e9ecef;
}

:deep(.p-progressbar-value) {
  background: #2563eb;
}

/* Styles pour le drawer de prévisualisation */
.preview-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.preview-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.preview-header h2 {
  margin: 0 0 1rem 0;
  font-size: 2rem;
  color: #2c3e50;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.preview-date {
  color: #6c757d;
  font-size: 0.875rem;
}

.preview-dialog-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.preview-dialog-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.preview-dialog-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preview-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.form-preview,
.data-preview {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.form-preview h3,
.data-preview h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.form-fields,
.data-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field-preview {
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background: #f8f9fa;
}

.form-field-preview label {
  display: block;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.field-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-placeholder {
  color: #6c757d;
  font-style: italic;
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  flex: 1;
}

.required-indicator {
  color: #dc3545;
  font-weight: bold;
}

.data-field {
  padding: 0.75rem;
  border-bottom: 1px solid #e9ecef;
}

.data-field:last-child {
  border-bottom: none;
}

.data-field strong {
  color: #2c3e50;
  margin-right: 0.5rem;
  min-width: 200px;
  display: inline-block;
}

.data-value {
  color: #495057;
  white-space: pre-wrap;
}

/* Nouvelles sections de prévisualisation */
.info-section,
.comments-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-bottom: 1.5rem;
}

.info-section h3,
.comments-section h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: #2c3e50;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e9ecef;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.25rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item strong {
  color: #6c757d;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 500;
}

.comments-text {
  color: #495057;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

/* Header Actions Spacing */
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* AI Assistant Button - KAP Dark Blue */
.ai-assistant-btn {
  background: #0B2B3C !important;
  border: none !important;
  color: white !important;
  font-weight: 600 !important;
  padding: 0.75rem 1.25rem !important;
  border-radius: 10px !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(11, 43, 60, 0.25) !important;
}

.ai-assistant-btn:hover {
  background: #0a2330 !important;
  color: white !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(11, 43, 60, 0.4) !important;
}

.ai-assistant-btn:active {
  transform: translateY(0) !important;
  box-shadow: 0 2px 8px rgba(11, 43, 60, 0.3) !important;
}

.ai-assistant-btn:focus {
  box-shadow: 0 0 0 3px rgba(11, 43, 60, 0.3) !important;
}

.ai-assistant-btn .pi-sparkles {
  color: #7AC943 !important;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .documents-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .filters-bar {
    flex-direction: column;
    gap: 1rem;
  }

  .filter-controls {
    width: 100%;
    justify-content: center;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
  }

  .preview-body {
    grid-template-columns: 1fr;
  }

  .preview-content {
    padding: 1rem;
  }

  .preview-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style> 
