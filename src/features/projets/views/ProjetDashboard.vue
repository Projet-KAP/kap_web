<template>
  <div class="projet-dashboard">
    <div class="page-header">
      <div class="header-content">
        <h1>Gestion des Projets</h1>
        <p class="subtitle">Pilotage et suivi de vos projets Travaux Publics</p>
      </div>
      <div class="header-actions">
        <Button 
          label="Nouveau Projet" 
          icon="pi pi-plus"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <div class="stats-cards" v-if="stats">
      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon primary">
              <i class="pi pi-building"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.total_projets || 0 }}</div>
              <div class="stat-label">Total Projets</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon success">
              <i class="pi pi-play"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.projets_en_cours || 0 }}</div>
              <div class="stat-label">En Cours</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon danger">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats?.projets_en_retard || 0 }}</div>
              <div class="stat-label">En Retard</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon info">
              <i class="pi pi-money-bill"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatMontant(stats?.montant_total || 0) }}</div>
              <div class="stat-label">Montant Total</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Card class="projets-list-card">
      <template #header>
        <div class="card-header">
          <h2>Liste des Projets</h2>
        </div>
      </template>

      <template #content>
        <div class="filters-section">
          <div class="filters">
            <Select 
              v-model="selectedStatut" 
              :options="statutOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Filtrer par statut"
              style="width: 200px"
              @change="applyFilters"
            />

            <Select 
              v-model="selectedType" 
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Type de projet"
              style="width: 200px"
              @change="applyFilters"
            />

            <InputText 
              v-model="searchQuery"
              placeholder="Rechercher un projet..."
              class="search-input"
              @input="applyFilters"
            />

            <Button 
              label="Réinitialiser" 
              icon="pi pi-filter-slash"
              severity="secondary"
              outlined
              @click="resetFilters"
            />
          </div>
        </div>

        <DataTable 
          :value="projets" 
          :loading="loading"
          stripedRows
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} projets"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucun projet trouvé</p>
            </div>
          </template>

          <Column field="code" header="Code" :sortable="true" style="min-width: 120px"></Column>
          <Column field="nom" header="Nom du Projet" :sortable="true" style="min-width: 250px"></Column>
          
          <Column field="type_projet" header="Type" :sortable="true">
            <template #body="{ data }">
              <Tag :value="getTypeLabel(data.type_projet)" :severity="getTypeSeverity(data.type_projet)" />
            </template>
          </Column>

          <Column field="statut" header="Statut" :sortable="true">
            <template #body="{ data }">
              <Tag :value="getStatutLabel(data.statut)" :severity="getStatutSeverity(data.statut)" />
            </template>
          </Column>

          <Column field="ville" header="Ville" :sortable="true"></Column>

          <Column field="date_debut_prevue" header="Début Prévu" :sortable="true">
            <template #body="{ data }">
              {{ formatDate(data.date_debut_prevue) }}
            </template>
          </Column>

          <Column field="date_fin_prevue" header="Fin Prévue" :sortable="true">
            <template #body="{ data }">
              {{ formatDate(data.date_fin_prevue) }}
            </template>
          </Column>

          <Column field="taux_consommation_delai" header="Avancement" :sortable="true">
            <template #body="{ data }">
              <div class="progress-col">
                <ProgressBar :value="data.taux_consommation_delai" :showValue="false" style="height: 6px" />
                <span class="progress-value">{{ data.taux_consommation_delai }}%</span>
              </div>
            </template>
          </Column>

          <Column field="est_en_retard" header="Retard">
            <template #body="{ data }">
              <i v-if="data.est_en_retard" class="pi pi-exclamation-circle" style="color: var(--red-500)"></i>
              <i v-else class="pi pi-check-circle" style="color: var(--green-500)"></i>
            </template>
          </Column>

          <Column header="Actions" style="width: 150px">
            <template #body="{ data }">
              <div class="actions-cell">
                <Button 
                  icon="pi pi-eye" 
                  severity="info"
                  text
                  rounded
                  @click="viewChantier(data)"
                  v-tooltip.top="'Voir détails'"
                />
                <Button 
                  icon="pi pi-pencil" 
                  severity="warning"
                  text
                  rounded
                  @click="editChantier(data)"
                  v-tooltip.top="'Modifier'"
                />
                <Button 
                  icon="pi pi-trash" 
                  severity="danger"
                  text
                  rounded
                  @click="confirmDelete(data)"
                  v-tooltip.top="'Supprimer'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog
      v-model:visible="showCreateDialog"
      :modal="true"
      :style="{ width: '800px' }"
      :pt="{
        root: { style: 'max-height: 90vh' },
        content: { style: 'max-height: calc(90vh - 200px); overflow-y: auto; padding: 1.5rem' }
      }"
    >
      <template #header>
        <h3>Nouveau Projet</h3>
      </template>
      <ProjetForm
        ref="projetFormRef"
        @save="handleCreate"
        @cancel="showCreateDialog = false"
      />
    </Dialog>

    <Dialog
      v-model:visible="showEditDialog"
      header="Modifier le Projet"
      :modal="true"
      :style="{ width: '800px' }"
      :pt="{
        root: { style: 'max-height: 90vh' },
        content: { style: 'max-height: calc(90vh - 200px); overflow-y: auto; padding: 1.5rem' }
      }"
    >
      <ProjetForm
        :chantier="selectedChantier"
        @save="handleUpdate"
        @cancel="showEditDialog = false"
      />
    </Dialog>

    <Dialog 
      v-model:visible="showDetailDialog" 
      :header="`Détails - ${selectedChantier?.nom}`" 
      :modal="true"
      :style="{ width: '1000px' }"
    >
      <ProjetDetail 
        v-if="selectedChantier"
        :projet="selectedChantier"
        @close="showDetailDialog = false"
      />
    </Dialog>

    <ConfirmDialog></ConfirmDialog>

    <!-- AI Assistant Button -->
    <AIAssistantButton @click="showAIDialog = true" />

    <!-- AI Assistant Dialog -->
    <AIAssistantDialog v-model:visible="showAIDialog" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjetStore } from '@/stores/projetStore.js'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import ProjetForm from '../components/ProjetForm.vue'
import ProjetDetail from '../components/ProjetDetail.vue'
import AIAssistantButton from '@/features/production/components/AIAssistantButton.vue'
import AIAssistantDialog from '@/features/production/components/AIAssistantDialog.vue'

const projetStore = useProjetStore()
const { projets, loading, stats } = storeToRefs(projetStore)
const confirm = useConfirm()
const toast = useToast()

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDetailDialog = ref(false)
const showAIDialog = ref(false)
const selectedChantier = ref(null)
const projetFormRef = ref(null)

const selectedStatut = ref(null)
const selectedType = ref(null)
const searchQuery = ref('')

const statutOptions = [
  { label: 'Tous', value: null },
  { label: 'En préparation', value: 'PREPARATION' },
  { label: 'En cours', value: 'EN_COURS' },
  { label: 'Suspendu', value: 'SUSPENDU' },
  { label: 'Terminé', value: 'TERMINE' },
  { label: 'Abandonné', value: 'ABANDONNE' }
]

const typeOptions = [
  { label: 'Tous', value: null },
  { label: 'Terrassement', value: 'TERRASSEMENT' },
  { label: 'Béton', value: 'BETON' },
  { label: 'Transport', value: 'TRANSPORT' },
  { label: 'Financier', value: 'FINANCIER' },
  { label: 'Mixte', value: 'MIXTE' },
  { label: 'Autre', value: 'AUTRE' }
]

const applyFilters = async () => {
  const filters = {}
  if (selectedStatut.value) filters.statut = selectedStatut.value
  if (selectedType.value) filters.type = selectedType.value
  if (searchQuery.value) filters.search = searchQuery.value

  await projetStore.loadProjets(filters)
}

const resetFilters = async () => {
  selectedStatut.value = null
  selectedType.value = null
  searchQuery.value = ''
  await projetStore.loadProjets()
}

const viewChantier = async (projet) => {
  // TODO: Implement loadProjetById in store
  selectedChantier.value = projet
  showDetailDialog.value = true
}

const editChantier = (projet) => {
  selectedChantier.value = projet
  showEditDialog.value = true
}

const confirmDelete = (projet) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer le projet "${projet.nom}" ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: () => handleDelete(projet.id)
  })
}

const handleCreate = async (projetData) => {
  try {
    await projetStore.createProjet(projetData)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Projet créé avec succès',
      life: 3000
    })
    showCreateDialog.value = false
    await projetStore.loadProjets()
    await projetStore.loadStats()
  } catch (error) {
        toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.detail || 'Erreur lors de la création du projet',
      life: 3000
    })
  }
}

const handleUpdate = async (projetData) => {
  try {
    await projetStore.updateProjet(selectedChantier.value.id, projetData)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Chantier modifié avec succès',
      life: 3000
    })
    showEditDialog.value = false
    await projetStore.loadProjets()
    await projetStore.loadStats()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.detail || 'Erreur lors de la modification du projet',
      life: 3000
    })
  }
}

const handleDelete = async (id) => {
  try {
    await projetStore.deleteProjet(id)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Chantier supprimé avec succès',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la suppression du projet',
      life: 3000
    })
  }
}

const getTypeLabel = (type) => {
  const labels = {
    'TERRASSEMENT': 'Terrassement',
    'BETON': 'Béton',
    'TRANSPORT': 'Transport',
    'FINANCIER': 'Financier',
    'MIXTE': 'Mixte',
    'AUTRE': 'Autre'
  }
  return labels[type] || type
}

const getTypeSeverity = (type) => {
  const severities = {
    'TERRASSEMENT': 'info',
    'BETON': 'warning',
    'TRANSPORT': 'success',
    'FINANCIER': 'secondary',
    'MIXTE': 'contrast',
    'AUTRE': 'secondary'
  }
  return severities[type] || 'secondary'
}

const getStatutLabel = (statut) => {
  const labels = {
    'PREPARATION': 'Préparation',
    'EN_COURS': 'En cours',
    'SUSPENDU': 'Suspendu',
    'TERMINE': 'Terminé',
    'ABANDONNE': 'Abandonné'
  }
  return labels[statut] || statut
}

const getStatutSeverity = (statut) => {
  const severities = {
    'PREPARATION': 'info',
    'EN_COURS': 'success',
    'SUSPENDU': 'warning',
    'TERMINE': 'secondary',
    'ABANDONNE': 'danger'
  }
  return severities[statut] || 'secondary'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

const formatMontant = (montant) => {
  if (!montant) return '0 FCFA'
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA'
}

onMounted(async () => {
  await projetStore.loadProjets()
  await projetStore.loadStats()
})
</script>

<style scoped lang="scss">
.projet-dashboard {
  padding: 2rem;
  min-height: 100vh;
  background: #ffffff;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  .header-content {
    h1 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: var(--primary-color);
    }
    
    .subtitle {
      margin: 0;
      color: var(--text-color-secondary);
      font-size: 1rem;
    }
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  .stat-card {
    :deep(.p-card-content) {
      padding: 1.5rem;
    }
    
    .stat-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        
        &.primary {
          background: #f1f5f9;
          color: #3b82f6;
        }

        &.success {
          background: rgba(122, 201, 67, 0.1);
          color: #7AC943;
        }

        &.danger {
          background: #fef2f2;
          color: #ef4444;
        }

        &.info {
          background: #f0f9ff;
          color: #0ea5e9;
        }
      }
      
      .stat-info {
        flex: 1;
        
        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-color);
          margin-bottom: 0.25rem;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: var(--text-color-secondary);
        }
      }
    }
  }
}

.projets-list-card {
  .card-header {
    padding: 1.5rem 1.5rem 0;
    
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
      color: var(--text-color);
    }
  }
  
  .filters-section {
    margin-bottom: 1.5rem;
    
    .filters {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      
      .search-input {
        flex: 1;
        min-width: 250px;
      }
    }
  }
}

.progress-col {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .progress-value {
    font-size: 0.875rem;
    font-weight: 600;
    min-width: 45px;
  }
}

.actions-cell {
  display: flex;
  gap: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-color-secondary);
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  p {
    font-size: 1.125rem;
    margin: 0;
  }
}

:deep(.p-datatable) {
  .p-datatable-thead > tr > th {
    background: var(--surface-50);
    color: var(--text-color);
    font-weight: 600;
  }
}
</style>

