<template>
  <div class="collect-detail-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-navigation">
          <Button 
            icon="pi pi-arrow-left" 
            text 
            @click="goBack"
            class="back-btn"
          />
          <div class="header-text">
            <h1 class="page-title">{{ currentCollect?.title || 'Détail Collecte' }}</h1>
            <div class="page-meta">
              <Tag 
                :value="getStatusLabel(currentCollect?.status)" 
                :severity="getStatusSeverity(currentCollect?.status)"
              />
              <span class="meta-separator">•</span>
              <span class="meta-item">{{ currentCollect?.assigned_to }}</span>
              <span class="meta-separator">•</span>
              <span class="meta-item">{{ formatDate(currentCollect?.created_at) }}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <Button 
            v-if="currentCollect?.status === 'planifiee'"
            label="Démarrer"
            icon="pi pi-play"
            @click="startCollect"
            :loading="starting"
          />
          <Button 
            v-if="currentCollect?.status === 'en_cours'"
            label="Terminer"
            icon="pi pi-check"
            severity="success"
            @click="completeCollect"
            :loading="completing"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
      <p>Chargement de la collecte...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <Message severity="error" :closable="false">
        <div class="error-content">
          <h3>Erreur</h3>
          <p>{{ error }}</p>
          <Button label="Réessayer" icon="pi pi-refresh" @click="loadCollectData" />
        </div>
      </Message>
    </div>

    <!-- Main Content -->
    <div v-else-if="currentCollect" class="collect-detail-content">
      <!-- Collect Info -->
      <div class="info-section">
        <div class="section-header">
          <h2>Informations générales</h2>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>Type</label>
            <span>{{ getTypeLabel(currentCollect.type) }}</span>
          </div>
          <div class="info-item">
            <label>Priorité</label>
            <Tag 
              :value="getPriorityLabel(currentCollect.priority)" 
              :severity="getPrioritySeverity(currentCollect.priority)"
            />
          </div>
          <div class="info-item">
            <label>Localisation</label>
            <span>{{ currentCollect.location }}</span>
          </div>
          <div class="info-item">
            <label>Équipements</label>
            <span>{{ currentCollect.completed_equipment }}/{{ currentCollect.equipment_count }}</span>
          </div>
          <div class="info-item">
            <label>Progrès</label>
            <div class="progress-container">
              <ProgressBar :value="currentCollect.progress" />
              <span class="progress-text">{{ currentCollect.progress }}%</span>
            </div>
          </div>
          <div class="info-item full-width">
            <label>Description</label>
            <p>{{ currentCollect.description }}</p>
          </div>
        </div>
      </div>

      <!-- Data Import Section -->
      <div class="data-section">
        <div class="section-header">
          <h2>Données de collecte</h2>
          <div class="section-actions">
            <Button 
              label="Importer Excel"
              icon="pi pi-upload"
              @click="showCSVUpload = true"
              :disabled="currentCollect.status === 'terminee'"
              outlined
            />
          </div>
        </div>

        <!-- Import Status -->
        <div v-if="hasImportedData" class="import-status">
          <Message severity="success" :closable="false">
            <div class="import-info">
              <div class="import-details">
                <h4>Données importées</h4>
                <p>Fichier: {{ currentCollect.imported_file_name }}</p>
                <p>{{ currentCollect.imported_rows_count }} lignes importées le {{ formatDateTime(currentCollect.data_import_date) }}</p>
              </div>
              <div class="import-actions">
                <Button 
                  icon="pi pi-eye" 
                  text 
                  rounded 
                  @click="loadImportedData"
                  v-tooltip="'Voir les données'"
                />
                <Button 
                  icon="pi pi-trash" 
                  text 
                  rounded 
                  severity="danger"
                  @click="confirmDeleteImport"
                  v-tooltip="'Supprimer l\'import'"
                  :disabled="currentCollect.status === 'terminee'"
                />
              </div>
            </div>
          </Message>
        </div>

        <!-- No Data State -->
        <div v-else class="no-data-state">
          <div class="no-data-content">
            <i class="pi pi-file-excel no-data-icon"></i>
            <h3>Aucune donnée importée</h3>
            <p>Importez un fichier Excel pour ajouter des données à cette collecte</p>
            <Button 
              label="Importer maintenant"
              icon="pi pi-upload"
              @click="showCSVUpload = true"
              :disabled="currentCollect.status === 'terminee'"
            />
          </div>
        </div>

        <!-- Imported Data Table -->
        <div v-if="importedData && importedData.length > 0" class="data-table-section">
          <div class="table-header">
            <h3>Données importées ({{ importedData.length }} entrées)</h3>
            <div class="table-actions">
              <Button 
                icon="pi pi-download" 
                text 
                @click="exportData"
                v-tooltip="'Exporter'"
              />
              <Button 
                icon="pi pi-refresh" 
                text 
                @click="loadImportedData"
                v-tooltip="'Actualiser'"
              />
            </div>
          </div>
          
          <DataTable 
            :value="importedData" 
            :scrollable="true"
            scrollHeight="400px"
            :loading="loadingData"
            paginator
            :rows="20"
            :rowsPerPageOptions="[10, 20, 50]"
            class="data-table"
          >
            <Column field="equipement_id" header="ID Équipement" style="min-width: 120px" />
            <Column field="equipement_nom" header="Nom Équipement" style="min-width: 180px" />
            <Column field="valeur_mesuree" header="Valeur" style="min-width: 100px">
              <template #body="{ data }">
                <span class="value-cell">{{ data.valeur_mesuree }} {{ data.unite_mesure }}</span>
              </template>
            </Column>
            <Column field="statut_conformite" header="Conformité" style="min-width: 120px">
              <template #body="{ data }">
                <Tag 
                  :value="data.statut_conformite" 
                  :severity="getConformitySeverity(data.statut_conformite)"
                />
              </template>
            </Column>
            <Column field="operateur" header="Opérateur" style="min-width: 150px" />
            <Column field="date_collecte" header="Date" style="min-width: 120px">
              <template #body="{ data }">
                {{ formatDate(data.date_collecte) }}
              </template>
            </Column>
            <Column field="observations" header="Observations" style="min-width: 200px">
              <template #body="{ data }">
                <span class="observations-cell" v-tooltip="data.observations">
                  {{ truncateText(data.observations, 50) }}
                </span>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- CSV Upload Modal -->
    <CSVUploadModal 
      v-model:visible="showCSVUpload"
      @data-imported="onDataImported"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCollectStore } from '@/features/collect/stores/collectStore'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import CSVUploadModal from '@/features/collect/components/CSVUploadModal.vue'

// Composables
const route = useRoute()
const router = useRouter()
const collectStore = useCollectStore()
const toast = useToast()
const confirm = useConfirm()

// Store state
const {
  currentCollect,
  loading,
  error
} = storeToRefs(collectStore)

const {
  getCollectById,
  startCollect: startCollectAction,
  completeCollect: completeCollectAction,
  importExcelData,
  getImportedData,
  deleteImportedData
} = collectStore

// Local state
const showCSVUpload = ref(false)
const starting = ref(false)
const completing = ref(false)
const importedData = ref([])
const loadingData = ref(false)

// Computed
const collectId = computed(() => route.params.id)

const hasImportedData = computed(() => 
  currentCollect.value?.imported_data && 
  currentCollect.value?.imported_rows_count > 0
)

// Methods
const loadCollectData = async () => {
  if (!collectId.value) return
  
  await getCollectById(collectId.value)
  
  // Charger les données importées si elles existent
  if (hasImportedData.value) {
    await loadImportedData()
  }
}

const loadImportedData = async () => {
  if (!collectId.value) return
  
  loadingData.value = true
  try {
    const data = await getImportedData(collectId.value);
    if (data) {
      importedData.value = data
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données importées',
      life: 3000
    })
  } finally {
    loadingData.value = false
  }
}

const onDataImported = async (csvData) => {
  try {
    const result = await importExcelData(collectId.value, csvData);
    if (result) {
      toast.add({
        severity: 'success',
        summary: 'Import réussi',
        detail: `${csvData.totalRows} lignes importées avec succès`,
        life: 3000
      })
      
      // Recharger les données
      await loadImportedData()
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur d\'import',
      detail: 'Impossible d\'importer les données',
      life: 3000
    })
  }
}

const confirmDeleteImport = () => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir supprimer les données importées ?',
    header: 'Confirmer la suppression',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Annuler',
    acceptLabel: 'Supprimer',
    accept: deleteImport
  })
}

const deleteImport = async () => {
  try {
    const result = await deleteImportedData(collectId.value);
    if (result) {
      importedData.value = []
      toast.add({
        severity: 'success',
        summary: 'Suppression réussie',
        detail: 'Les données importées ont été supprimées',
        life: 3000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer les données',
      life: 3000
    })
  }
}

const startCollect = async () => {
  starting.value = true
  try {
    const result = await startCollectAction(collectId.value);
    if (result) {
      toast.add({
        severity: 'success',
        summary: 'Collecte démarrée',
        detail: 'La collecte a été démarrée avec succès',
        life: 3000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de démarrer la collecte',
      life: 3000
    })
  } finally {
    starting.value = false
  }
}

const completeCollect = async () => {
  completing.value = true
  try {
    const result = await completeCollectAction(collectId.value);
    if (result) {
      toast.add({
        severity: 'success',
        summary: 'Collecte terminée',
        detail: 'La collecte a été terminée avec succès',
        life: 3000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de terminer la collecte',
      life: 3000
    })
  } finally {
    completing.value = false
  }
}

const goBack = () => {
  router.push('/user/collect')
}

const exportData = () => {
  // TODO: Implémenter l'export des données
  toast.add({
    severity: 'info',
    summary: 'Fonctionnalité à venir',
    detail: 'Export des données en cours de développement',
    life: 3000
  })
}

// Utility functions
const getStatusLabel = (status) => {
  const labels = {
    'planifiee': 'Planifiée',
    'en_cours': 'En cours',
    'terminee': 'Terminée',
    'annulee': 'Annulée'
  }
  return labels[status] || status
}

const getStatusSeverity = (status) => {
  const severities = {
    'planifiee': 'info',
    'en_cours': 'warning',
    'terminee': 'success',
    'annulee': 'danger'
  }
  return severities[status] || 'info'
}

const getTypeLabel = (type) => {
  const labels = {
    'maintenance': 'Maintenance',
    'qualite': 'Qualité',
    'production': 'Production',
    'securite': 'Sécurité'
  }
  return labels[type] || type
}

const getPriorityLabel = (priority) => {
  const labels = {
    'low': 'Faible',
    'medium': 'Moyenne',
    'high': 'Élevée',
    'urgent': 'Urgente'
  }
  return labels[priority] || priority
}

const getPrioritySeverity = (priority) => {
  const severities = {
    'low': 'success',
    'medium': 'info',
    'high': 'warning',
    'urgent': 'danger'
  }
  return severities[priority] || 'info'
}

const getConformitySeverity = (status) => {
  const severities = {
    'CONFORME': 'success',
    'NON_CONFORME': 'danger',
    'A_VERIFIER': 'warning'
  }
  return severities[status] || 'info'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR')
}

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('fr-FR')
}

const truncateText = (text, maxLength) => {
  if (!text) return '-'
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// Lifecycle
onMounted(() => {
  loadCollectData()
})

// Watchers
watch(() => route.params.id, (newId) => {
  if (newId) {
    loadCollectData()
  }
})
</script>

<style scoped>
.collect-detail-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.header-navigation {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.back-btn {
  margin-top: 0.25rem;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.page-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

.meta-separator {
  color: var(--surface-border);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: var(--text-color-secondary);
}

.error-container {
  padding: 2rem;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.error-content h3 {
  margin: 0;
  color: var(--red-500);
}

.collect-detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-section, .data-section {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.section-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.section-actions {
  display: flex;
  gap: 0.75rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-weight: 600;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.info-item span, .info-item p {
  color: var(--text-color);
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-text {
  font-weight: 600;
  color: var(--text-color);
  min-width: 2.5rem;
}

.import-status {
  margin-bottom: 1.5rem;
}

.import-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.import-details h4 {
  margin: 0 0 0.5rem 0;
  color: var(--green-600);
  font-weight: 600;
}

.import-details p {
  margin: 0.25rem 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.import-actions {
  display: flex;
  gap: 0.5rem;
}

.no-data-state {
  text-align: center;
  padding: 3rem 1rem;
}

.no-data-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.no-data-icon {
  font-size: 3rem;
  color: var(--text-color-secondary);
}

.no-data-content h3 {
  margin: 0;
  color: var(--text-color);
  font-weight: 600;
}

.no-data-content p {
  margin: 0;
  color: var(--text-color-secondary);
  max-width: 400px;
}

.data-table-section {
  margin-top: 1.5rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

.data-table {
  border: 1px solid var(--surface-border);
  border-radius: 6px;
}

.value-cell {
  font-family: monospace;
  font-weight: 600;
}

.observations-cell {
  color: var(--text-color-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .collect-detail-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-navigation {
    align-items: center;
  }
  
  .page-meta {
    flex-wrap: wrap;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .import-info {
    flex-direction: column;
    align-items: stretch;
  }
  
  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
}
</style>
