<template>
  <div class="collect-page">
    <!-- Page Header moderne -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <div class="title-section">
            <div class="title-icon">
              <i class="pi pi-clipboard" style="color: #2563eb;"></i>
            </div>
            <div class="title-content">
              <h1 class="page-title">
                Collectes de données
                <i 
                  class="pi pi-info-circle info-icon" 
                  v-tooltip.right="'Module de collecte des données terrain pour le calcul des indicateurs MES'"
                ></i>
              </h1>
              <p class="page-subtitle">Centralisez et optimisez vos opérations de collecte terrain</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <Button 
            label="Nouvelle collecte"
            icon="pi pi-plus"
            @click="showCreateDialog = true"
            class="p-button-primary create-btn"
            v-tooltip.left="'Créer une nouvelle collecte de données'"
          />
        </div>
      </div>
      
      <!-- Statistiques rapides -->
      <div class="quick-stats">
        <div class="stat-card">
          <div class="stat-icon en-cours">
            <i class="pi pi-clock"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.enCours }}</span>
            <span class="stat-label">En cours</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon planifiees">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.planifiees }}</span>
            <span class="stat-label">Planifiées</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon terminees">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.terminees }}</span>
            <span class="stat-label">Terminées</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon retard">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.retard }}</span>
            <span class="stat-label">En retard</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Search & Filters Section moderne -->
    <div class="search-filters-section">
      <!-- Barre de recherche principale -->
      <div class="main-search">
        <div class="search-container">
          <div class="search-input-wrapper">
            <InputText 
              v-model="filters.search"
              placeholder="Recherchez par titre, référence, description ou assigné..."
              class="main-search-input"
              v-tooltip.bottom="'Recherche intelligente dans tous les champs'"
            />
            <div class="search-shortcuts" v-if="filters.search">
              <Button 
                icon="pi pi-times"
                class="p-button-text p-button-rounded p-button-sm clear-search"
                @click="clearSearch"
                v-tooltip="'Effacer la recherche'"
              />
            </div>
          </div>
          <div class="search-actions">
            <Button 
              icon="pi pi-filter"
              :label="showAdvancedFilters ? 'Masquer filtres' : 'Filtres avancés'"
              class="p-button-outlined filter-toggle"
              @click="showAdvancedFilters = !showAdvancedFilters"
              v-tooltip="'Afficher/masquer les filtres avancés'"
            />
          </div>
        </div>
        
        <!-- Filtres rapides -->
        <div class="quick-filters" v-if="!showAdvancedFilters">
          <div class="quick-filter-chips">
            <Button 
              v-for="status in quickStatusFilters" 
              :key="status.value"
              :label="status.label"
              :class="['p-button-outlined', 'quick-filter-chip', { 'p-button-primary': filters.status === status.value }]"
              @click="toggleQuickFilter('status', status.value)"
              size="small"
            />
          </div>
        </div>
      </div>
      
      <!-- Filtres avancés (repliables) -->
      <div class="advanced-filters" v-show="showAdvancedFilters">
        <div class="filters-header">
          <h4>Filtres avancés</h4>
          <Button 
            v-if="hasActiveFilters"
            label="Réinitialiser tout"
            icon="pi pi-refresh"
            class="p-button-text p-button-sm"
            @click="resetFilters"
          />
        </div>
        
        <div class="filters-grid">
        
        <div class="filter-item">
          <label>Statut</label>
          <Select 
            v-model="filters.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Tous les statuts"
            class="w-full"
            showClear
            v-tooltip.top="'Filtrer par statut de collecte'"
          />
        </div>
        
        <div class="filter-item">
          <label>Type</label>
          <Select 
            v-model="filters.type"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Tous les types"
            class="w-full"
            showClear
            v-tooltip.top="'Filtrer par type de collecte'"
          />
        </div>
        
        <div class="filter-item">
          <label>Priorité</label>
          <Select 
            v-model="filters.priority"
            :options="priorityOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Toutes les priorités"
            class="w-full"
            showClear
            v-tooltip.top="'Filtrer par niveau de priorité'"
          />
        </div>
        
        <div class="filter-item">
          <label>Période</label>
          <DatePicker 
            v-model="filters.dateRange"
            selectionMode="range"
            dateFormat="dd/mm/yy"
            placeholder="Sélectionner une période"
            class="w-full"
            showIcon
            v-tooltip.top="'Filtrer par période de création'"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
      <p>Chargement des collectes...</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="!error" class="collect-content">
      <!-- Vue Toggle -->
      <div class="view-toggle">
        <ButtonGroup>
          <Button 
            :label="viewMode === 'grid' ? 'Vue Cartes' : 'Vue Tableau'"
            :icon="viewMode === 'grid' ? 'pi pi-th-large' : 'pi pi-table'"
            @click="toggleViewMode"
            class="p-button-outlined"
            v-tooltip="'Changer le mode d\'affichage'"
          />
        </ButtonGroup>
        
        <div class="actions-group">
          <Button 
            icon="pi pi-download"
            label="Exporter"
            class="p-button-outlined"
            @click="exportData"
            v-tooltip="'Exporter les données filtrées'"
          />
          <Button 
            icon="pi pi-chart-bar"
            label="Tableau de bord"
            class="p-button-outlined"
            @click="showDashboard = true"
            v-tooltip="'Voir le tableau de bord des collectes'"
          />
        </div>
      </div>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="collects-grid">
        <div 
          v-for="collect in filteredCollects" 
          :key="collect.id" 
          class="collect-card"
          :class="[collect.status.toLowerCase(), { 'overdue': collect.is_overdue }]"
          @click="viewDetails(collect)"
        >
          <!-- Card Header -->
          <div class="card-header">
            <div class="collect-info">
              <span class="collect-reference">{{ collect.reference }}</span>
              <h3 class="collect-title">{{ collect.title }}</h3>
            </div>
            <div class="collect-badges">
              <Tag 
                :value="getStatusLabel(collect.status)"
                :severity="getStatusSeverity(collect.status)"
                v-tooltip="'Statut actuel de la collecte'"
              />
              <Tag 
                v-if="collect.priority === 'URGENT'"
                value="Urgent"
                severity="danger"
                icon="pi pi-exclamation-triangle"
                v-tooltip="'Priorité urgente'"
              />
            </div>
          </div>

          <!-- Card Content -->
          <div class="card-content">
            <div class="collect-meta">
              <div class="meta-item" v-tooltip="'Type de collecte'">
                <i class="pi pi-tag"></i>
                <span>{{ getTypeLabel(collect.collect_type) }}</span>
              </div>
              
              <div class="meta-item" v-tooltip="'Responsable'">
                <i class="pi pi-user"></i>
                <span>{{ collect.assigned_to_name || 'Non assigné' }}</span>
              </div>
              
              <div class="meta-item" v-tooltip="'Lieu de collecte'">
                <i class="pi pi-map-marker"></i>
                <span>{{ collect.workplace_name }}</span>
              </div>
              
              <div class="meta-item" v-tooltip="'Date de création'">
                <i class="pi pi-calendar"></i>
                <span>{{ formatDate(collect.created_at) }}</span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div v-if="collect.status === 'EN_COURS'" class="progress-section">
              <div class="progress-header">
                <span class="progress-label">Progression</span>
                <span class="progress-value">{{ collect.progress }}%</span>
              </div>
              <ProgressBar 
                :value="collect.progress" 
                :showValue="false"
                v-tooltip="`${collect.completed_equipment}/${collect.equipment_count} éléments complétés`"
              />
            </div>

            <!-- Tags des colonnes MES -->
            <div v-if="collect.column_tags && collect.column_tags.length" class="mes-tags">
              <span class="tags-label">
                Tags MES :
                <i 
                  class="pi pi-info-circle info-icon-tiny" 
                  v-tooltip="'Colonnes taggées pour les calculs MES'"
                ></i>
              </span>
              <div class="tags-list">
                <Chip 
                  v-for="tag in collect.column_tags" 
                  :key="tag.id"
                  :label="tag.name"
                  :style="{ backgroundColor: tag.color + '20', color: tag.color }"
                  v-tooltip="`${tag.description || tag.tag_type} - ${tag.mes_indicator || ''}`"
                />
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="card-footer">
            <div class="footer-actions">
              <Button 
                v-if="collect.status === 'PLANIFIEE'"
                label="Démarrer"
                icon="pi pi-play"
                class="p-button-success p-button-sm"
                @click.stop="startCollect(collect)"
                v-tooltip="'Démarrer cette collecte'"
              />
              <Button 
                v-else-if="collect.status === 'EN_COURS'"
                label="Continuer"
                icon="pi pi-arrow-right"
                class="p-button-primary p-button-sm"
                @click.stop="continueCollect(collect)"
                v-tooltip="'Continuer la saisie des données'"
              />
              <Button 
                v-else-if="collect.status === 'TERMINEE'"
                label="Valider"
                icon="pi pi-check"
                class="p-button-info p-button-sm"
                @click.stop="validateCollect(collect)"
                v-tooltip="'Valider les données collectées'"
              />
              
              <Button 
                icon="pi pi-ellipsis-v"
                class="p-button-text p-button-sm"
                @click.stop="toggleMenu($event, collect)"
                v-tooltip="'Plus d\'actions'"
              />
            </div>
            
            <div v-if="collect.scheduled_end" class="deadline-info">
              <i class="pi pi-clock"></i>
              <span :class="{ 'text-danger': collect.is_overdue }">
                {{ getDeadlineText(collect.scheduled_end, collect.is_overdue) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="table-view">
        <DataTable 
          :value="filteredCollects"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          responsiveLayout="scroll"
          :globalFilterFields="['reference', 'title', 'description']"
          stripedRows
          @row-click="viewDetails($event.data)"
          class="collect-table"
        >
          <Column field="reference" header="Référence" sortable>
            <template #body="slotProps">
              <span class="font-bold">{{ slotProps.data.reference }}</span>
            </template>
          </Column>
          
          <Column field="title" header="Titre" sortable />
          
          <Column field="collect_type" header="Type" sortable>
            <template #body="slotProps">
              <Tag :value="getTypeLabel(slotProps.data.collect_type)" />
            </template>
          </Column>
          
          <Column field="status" header="Statut" sortable>
            <template #body="slotProps">
              <Tag 
                :value="getStatusLabel(slotProps.data.status)"
                :severity="getStatusSeverity(slotProps.data.status)"
              />
            </template>
          </Column>
          
          <Column field="priority" header="Priorité" sortable>
            <template #body="slotProps">
              <Tag 
                :value="getPriorityLabel(slotProps.data.priority)"
                :severity="getPrioritySeverity(slotProps.data.priority)"
              />
            </template>
          </Column>
          
          <Column field="progress" header="Progression" sortable>
            <template #body="slotProps">
              <ProgressBar 
                v-if="slotProps.data.status === 'EN_COURS'"
                :value="slotProps.data.progress" 
              />
              <span v-else>-</span>
            </template>
          </Column>
          
          <Column field="assigned_to_name" header="Responsable" sortable />
          
          <Column field="workplace_name" header="Lieu" sortable />
          
          <Column field="created_at" header="Créé le" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.data.created_at) }}
            </template>
          </Column>
          
          <Column header="Actions" :exportable="false">
            <template #body="slotProps">
              <Button 
                icon="pi pi-eye"
                class="p-button-text p-button-sm"
                @click.stop="viewDetails(slotProps.data)"
                v-tooltip="'Voir les détails'"
              />
              <Button 
                icon="pi pi-pencil"
                class="p-button-text p-button-sm"
                @click.stop="editCollect(slotProps.data)"
                v-tooltip="'Modifier'"
              />
              <Button 
                icon="pi pi-ellipsis-v"
                class="p-button-text p-button-sm"
                @click="toggleMenu($event, slotProps.data)"
                v-tooltip="'Plus d\'actions'"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error-container">
      <i class="pi pi-exclamation-triangle error-icon"></i>
      <h3>Une erreur est survenue</h3>
      <p>{{ error }}</p>
      <Button label="Réessayer" @click="loadCollects" />
    </div>

    <!-- Context Menu -->
    <Menu ref="menu" :model="menuItems" :popup="true" />

    <!-- Create Dialog -->
    <Dialog 
      v-model:visible="showCreateDialog" 
      header="Nouvelle collecte" 
      :modal="true"
      :style="{ width: '50vw' }"
      :breakpoints="{ '960px': '75vw', '640px': '95vw' }"
    >
      <CreateCollectForm 
        @created="onCollectCreated"
        @cancel="showCreateDialog = false"
      />
    </Dialog>

    <!-- Dashboard Dialog -->
    <Dialog 
      v-model:visible="showDashboard" 
      header="Tableau de bord des collectes" 
      :modal="true"
      :style="{ width: '80vw' }"
      :breakpoints="{ '960px': '90vw', '640px': '95vw' }"
    >
      <CollectDashboard />
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCollectStore } from '../stores/collectStore'
import { useToast } from 'primevue/usetoast'
import CreateCollectForm from '../components/CreateCollectForm.vue'
import CollectDashboard from '../components/CollectDashboard.vue'

// Stores & Router
const collectStore = useCollectStore()
const router = useRouter()
const toast = useToast()

// State
const loading = ref(false)
const error = ref(null)
const showCreateDialog = ref(false)
const showDashboard = ref(false)
const viewMode = ref('grid') // 'grid' ou 'table'
const selectedCollect = ref(null)
const menu = ref()

// New search UI state
const showAdvancedFilters = ref(false)

// Filters
const filters = ref({
  search: '',
  status: null,
  type: null,
  priority: null,
  dateRange: null
})

// Options pour les filtres
const statusOptions = [
  { label: 'Planifiée', value: 'PLANIFIEE' },
  { label: 'En cours', value: 'EN_COURS' },
  { label: 'En pause', value: 'EN_PAUSE' },
  { label: 'Terminée', value: 'TERMINEE' },
  { label: 'Validée', value: 'VALIDEE' },
  { label: 'Annulée', value: 'ANNULEE' }
]

const typeOptions = [
  { label: 'Production', value: 'PRODUCTION' },
  { label: 'Qualité', value: 'QUALITE' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
  { label: 'Sécurité', value: 'SECURITE' },
  { label: 'Inspection', value: 'INSPECTION' },
  { label: 'Audit', value: 'AUDIT' }
]

const priorityOptions = [
  { label: 'Basse', value: 'LOW' },
  { label: 'Moyenne', value: 'MEDIUM' },
  { label: 'Haute', value: 'HIGH' },
  { label: 'Urgente', value: 'URGENT' }
]

// Filtres rapides pour la nouvelle UI
const quickStatusFilters = [
  { label: 'En cours', value: 'EN_COURS' },
  { label: 'Planifiées', value: 'PLANIFIEE' },
  { label: 'Terminées', value: 'TERMINEE' },
  { label: 'En retard', value: 'RETARD' }
]

// Menu contextuel
const menuItems = ref([
  {
    label: 'Voir détails',
    icon: 'pi pi-eye',
    command: () => viewDetails(selectedCollect.value)
  },
  {
    label: 'Modifier',
    icon: 'pi pi-pencil',
    command: () => editCollect(selectedCollect.value)
  },
  {
    separator: true
  },
  {
    label: 'Exporter',
    icon: 'pi pi-download',
    command: () => exportCollect(selectedCollect.value)
  },
  {
    label: 'Dupliquer',
    icon: 'pi pi-copy',
    command: () => duplicateCollect(selectedCollect.value)
  },
  {
    separator: true
  },
  {
    label: 'Annuler',
    icon: 'pi pi-times',
    command: () => cancelCollect(selectedCollect.value),
    disabled: computed(() => 
      selectedCollect.value?.status === 'TERMINEE' || 
      selectedCollect.value?.status === 'VALIDEE'
    )
  }
])

// Computed
const collects = computed(() => collectStore.collects)

const filteredCollects = computed(() => {
  let result = [...collects.value]
  
  // Recherche textuelle
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(c => 
      c.reference.toLowerCase().includes(search) ||
      c.title.toLowerCase().includes(search) ||
      (c.description && c.description.toLowerCase().includes(search))
    )
  }
  
  // Filtre par statut
  if (filters.value.status) {
    result = result.filter(c => c.status === filters.value.status)
  }
  
  // Filtre par type
  if (filters.value.type) {
    result = result.filter(c => c.collect_type === filters.value.type)
  }
  
  // Filtre par priorité
  if (filters.value.priority) {
    result = result.filter(c => c.priority === filters.value.priority)
  }
  
  // Filtre par date
  if (filters.value.dateRange && filters.value.dateRange[0]) {
    const startDate = new Date(filters.value.dateRange[0])
    const endDate = filters.value.dateRange[1] ? new Date(filters.value.dateRange[1]) : new Date()
    
    result = result.filter(c => {
      const collectDate = new Date(c.created_at)
      return collectDate >= startDate && collectDate <= endDate
    })
  }
  
  return result
})

const hasActiveFilters = computed(() => {
  return filters.value.search || 
         filters.value.status || 
         filters.value.type || 
         filters.value.priority ||
         filters.value.dateRange
})

const stats = computed(() => {
  const all = collects.value
  return {
    enCours: all.filter(c => c.status === 'EN_COURS').length,
    planifiees: all.filter(c => c.status === 'PLANIFIEE').length,
    terminees: all.filter(c => c.status === 'TERMINEE' || c.status === 'VALIDEE').length,
    retard: all.filter(c => c.is_overdue).length
  }
})

// Methods
const loadCollects = async () => {
  loading.value = true
  error.value = null
  
  try {
    await collectStore.fetchCollects()
  } catch (err) {
    error.value = err.message || 'Erreur lors du chargement des collectes'
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.value,
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'table' : 'grid'
}

const toggleMenu = (event, collect) => {
  selectedCollect.value = collect
  menu.value.toggle(event)
}

const resetFilters = () => {
  filters.value = {
    search: '',
    status: null,
    type: null,
    priority: null,
    dateRange: null
  }
}

// Nouvelles méthodes pour la UI moderne
const clearSearch = () => {
  filters.value.search = ''
}

const toggleQuickFilter = (filterType, value) => {
  if (filters.value[filterType] === value) {
    filters.value[filterType] = null // Désélectionner si déjà sélectionné
  } else {
    filters.value[filterType] = value
  }
}

const viewDetails = (collect) => {
  router.push(`/collect/${collect.id}`)
}

const editCollect = (collect) => {
  router.push(`/collect/${collect.id}/edit`)
}

const startCollect = async (collect) => {
  try {
    await collectStore.startCollect(collect.id)
    toast.add({
      severity: 'success',
      summary: 'Collecte démarrée',
      detail: 'La collecte a été démarrée avec succès',
      life: 3000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err.message,
      life: 5000
    })
  }
}

const continueCollect = (collect) => {
  router.push(`/collect/${collect.id}/data`)
}

const validateCollect = async (collect) => {
  try {
    await collectStore.validateCollect(collect.id)
    toast.add({
      severity: 'success',
      summary: 'Collecte validée',
      detail: 'Les données ont été validées avec succès',
      life: 3000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err.message,
      life: 5000
    })
  }
}

const cancelCollect = async (collect) => {
  try {
    await collectStore.cancelCollect(collect.id)
    toast.add({
      severity: 'warn',
      summary: 'Collecte annulée',
      detail: 'La collecte a été annulée',
      life: 3000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err.message,
      life: 5000
    })
  }
}

const duplicateCollect = async (collect) => {
  // TODO: Implémenter la duplication
  toast.add({
    severity: 'info',
    summary: 'Fonctionnalité à venir',
    detail: 'La duplication sera bientôt disponible',
    life: 3000
  })
}

const exportCollect = async (collect) => {
  try {
    await collectStore.exportCollect(collect.id, 'excel')
    toast.add({
      severity: 'success',
      summary: 'Export réussi',
      detail: 'Les données ont été exportées',
      life: 3000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err.message,
      life: 5000
    })
  }
}

const exportData = async () => {
  // TODO: Exporter les données filtrées
  toast.add({
    severity: 'info',
    summary: 'Export en cours',
    detail: 'Préparation du fichier...',
    life: 3000
  })
}

const onCollectCreated = (collect) => {
  showCreateDialog.value = false
  toast.add({
    severity: 'success',
    summary: 'Collecte créée',
    detail: 'La nouvelle collecte a été créée avec succès',
    life: 3000
  })
  router.push(`/collect/${collect.id}`)
}

// Helpers
const getStatusLabel = (status) => {
  return statusOptions.find(s => s.value === status)?.label || status
}

const getStatusSeverity = (status) => {
  const severities = {
    'PLANIFIEE': 'info',
    'EN_COURS': 'warning',
    'EN_PAUSE': 'secondary',
    'TERMINEE': 'success',
    'VALIDEE': 'success',
    'ANNULEE': 'danger'
  }
  return severities[status] || 'secondary'
}

const getTypeLabel = (type) => {
  return typeOptions.find(t => t.value === type)?.label || type
}

const getPriorityLabel = (priority) => {
  return priorityOptions.find(p => p.value === priority)?.label || priority
}

const getPrioritySeverity = (priority) => {
  const severities = {
    'LOW': 'secondary',
    'MEDIUM': 'info',
    'HIGH': 'warning',
    'URGENT': 'danger'
  }
  return severities[priority] || 'secondary'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getDeadlineText = (date, isOverdue) => {
  if (!date) return ''
  const deadline = new Date(date)
  const now = new Date()
  const diff = deadline - now
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (isOverdue) {
    return `En retard de ${Math.abs(days)} jours`
  } else if (days > 0) {
    return `${days} jours restants`
  } else if (hours > 0) {
    return `${hours} heures restantes`
  } else {
    return 'Échéance proche'
  }
}

// Lifecycle
onMounted(() => {
  loadCollects()
})
</script>

<style lang="scss" scoped>
.collect-page {
  padding: 1.5rem;
  background: var(--surface-ground);
  min-height: 100vh;
}

.page-header {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }
  
  .header-text {
    .title-section {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      
      .title-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: #2563eb;
        border-radius: 12px;
        flex-shrink: 0;
        
        i {
          font-size: 1.5rem;
          color: white;
        }
      }
      
      .title-content {
        flex: 1;
        
        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-color);
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          
          .info-icon {
            font-size: 1.2rem;
            color: var(--text-color-secondary);
            cursor: help;
          }
        }
        
        .page-subtitle {
          color: var(--text-color-secondary);
          margin: 0;
          font-size: 1rem;
        }
      }
    }
  }
  
  .quick-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-ground);
      border-radius: 8px;
      
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        
        &.en-cours {
          background: rgba(251, 191, 36, 0.1);
          color: #f59e0b;
        }
        
        &.planifiees {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        
        &.terminees {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
        
        &.retard {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
      }
      
      .stat-content {
        display: flex;
        flex-direction: column;
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-color);
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: var(--text-color-secondary);
        }
      }
    }
  }
}

// Nouveaux styles pour la section search moderne
.search-filters-section {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .main-search {
    .search-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;

      .search-input-wrapper {
        position: relative;
        flex: 1;
        
        
        .main-search-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1px solid var(--surface-border);
          border-radius: 12px;
          background: var(--surface-ground);
          font-size: 1rem;
          transition: all 0.3s ease;
          
          &:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            background: var(--surface-card);
          }
          
          &::placeholder {
            color: var(--text-color-secondary);
            font-style: italic;
          }
        }
        
        .search-shortcuts {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          
          .clear-search {
            width: 32px;
            height: 32px;
            padding: 0;
          }
        }
      }
      
      .search-actions {
        .filter-toggle {
          min-width: 140px;
          height: 44px;
        }
      }
    }
    
    .quick-filters {
      .quick-filter-chips {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        
        .quick-filter-chip {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          &.p-button-primary {
            background: var(--primary-color);
            border-color: var(--primary-color);
            color: white;
          }
        }
      }
    }
  }
  
  .advanced-filters {
    margin-top: 1.5rem;
    border-top: 1px solid var(--surface-border);
    padding-top: 1.5rem;
    
    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      
      h4 {
        margin: 0;
        color: var(--text-color);
        font-weight: 600;
      }
    }
    
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      
      .filter-item {
        display: flex;
        flex-direction: column;
        
        label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-color);
          margin-bottom: 0.5rem;
        }
      }
    }
  }
}

.view-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  .actions-group {
    display: flex;
    gap: 0.5rem;
  }
}

.collects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
  
  .collect-card {
    background: var(--surface-card);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    cursor: pointer;
    border: 2px solid transparent;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    &.en_cours {
      border-color: #f59e0b;
    }
    
    &.overdue {
      border-color: #ef4444;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      
      .collect-info {
        flex: 1;
        
        .collect-reference {
          font-size: 0.75rem;
          color: var(--text-color-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .collect-title {
          margin: 0.25rem 0 0 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-color);
        }
      }
      
      .collect-badges {
        display: flex;
        gap: 0.5rem;
      }
    }
    
    .card-content {
      .collect-meta {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        margin-bottom: 1rem;
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-color-secondary);
          
          i {
            color: var(--primary-color);
            font-size: 0.875rem;
          }
        }
      }
      
      .progress-section {
        margin: 1rem 0;
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          
          .progress-label {
            color: var(--text-color-secondary);
          }
          
          .progress-value {
            font-weight: 600;
            color: var(--primary-color);
          }
        }
      }
      
      .mes-tags {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--surface-border);
        
        .tags-label {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-color-secondary);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
          
          .info-icon-tiny {
            font-size: 0.75rem;
            cursor: help;
          }
        }
        
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
      }
    }
    
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-border);
      
      .footer-actions {
        display: flex;
        gap: 0.5rem;
      }
      
      .deadline-info {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.875rem;
        color: var(--text-color-secondary);
        
        .text-danger {
          color: #ef4444;
          font-weight: 600;
        }
      }
    }
  }
}

.table-view {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: var(--surface-card);
  border-radius: 12px;
  
  .error-icon {
    font-size: 3rem;
    color: #ef4444;
    margin-bottom: 1rem;
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-color);
  }
  
  p {
    color: var(--text-color-secondary);
    margin-bottom: 1.5rem;
  }
}

// Responsive
@media (max-width: 768px) {
  .page-header {
    .header-content {
      flex-direction: column;
      gap: 1rem;
    }
  }
  
  .collects-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>