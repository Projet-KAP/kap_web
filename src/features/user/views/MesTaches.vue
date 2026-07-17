<template>
  <div class="mes-taches-page">
    <Toast />

    <!-- Loading overlay pour l'ouverture du rapport -->
    <div v-if="loadingReport" class="loading-overlay">
      <div class="loading-content">
        <ProgressSpinner style="width: 60px; height: 60px" strokeWidth="4" />
        <p class="loading-text">Chargement du rapport...</p>
      </div>
    </div>

    <!-- Header avec stats -->
    <div class="page-header">
      <div class="header-top">
        <div class="header-content">
          <h1>Mes Taches</h1>
          <p>Consultez et remplissez vos rapports assignes</p>
        </div>
        <Button
          icon="pi pi-refresh"
          label="Actualiser"
          @click="refreshData"
          outlined
          size="small"
        />
      </div>

      <!-- Stats rapides -->
      <div class="stats-row">
        <div class="stat-card stat-progress" @click="setQuickFilter('IN_PROGRESS')">
          <div class="stat-icon"><i class="pi pi-pencil"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ getTaskCountByStatus('IN_PROGRESS') }}</span>
            <span class="stat-label">En cours</span>
          </div>
        </div>
        <div class="stat-card stat-submitted" @click="setQuickFilter('SUBMITTED')">
          <div class="stat-icon"><i class="pi pi-send"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ getTaskCountByStatus('SUBMITTED') }}</span>
            <span class="stat-label">Soumises</span>
          </div>
        </div>
        <div class="stat-card stat-urgent" @click="setQuickFilter('URGENT')">
          <div class="stat-icon"><i class="pi pi-exclamation-triangle"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ getUrgentTasksCount() }}</span>
            <span class="stat-label">Urgentes</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Barre de filtres -->
    <div class="filters-section">
      <div class="filters-bar">
        <div class="search-box">
          <div class="search-wrapper">
            <i class="pi pi-search search-icon"></i>
            <InputText
              v-model="searchQuery"
              placeholder="Rechercher un rapport, OF, produit..."
              class="search-input"
            />
          </div>
        </div>

        <div class="filter-controls">
          <Select
            v-model="statusFilter"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Statut"
            class="filter-select"
            showClear
          />

          <Select
            v-model="priorityFilter"
            :options="priorityOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Priorite"
            class="filter-select"
            showClear
          />

          <Button
            v-if="statusFilter || priorityFilter || searchQuery"
            icon="pi pi-filter-slash"
            label="Effacer"
            @click="clearFilters"
            text
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- Liste des taches -->
    <div class="tasks-section">
      <div v-if="loading" class="loading-state">
        <ProgressSpinner />
        <p>Chargement de vos taches...</p>
      </div>

      <div v-else-if="filteredTasks.length === 0" class="empty-state">
        <div class="empty-icon-wrapper">
          <i class="pi pi-inbox"></i>
        </div>
        <h3>Aucune tache trouvee</h3>
        <p>Aucune tache ne correspond a vos criteres</p>
        <Button
          v-if="statusFilter || priorityFilter || searchQuery"
          label="Effacer les filtres"
          icon="pi pi-filter-slash"
          @click="clearFilters"
          outlined
          size="small"
          class="mt-3"
        />
      </div>

      <div v-else>
        <DataView :value="filteredTasks" layout="grid" paginator :rows="8">
          <template #header>
            <div class="dataview-header">
              <span class="tasks-count">{{ filteredTasks.length }} tache(s)</span>
            </div>
          </template>

          <template #grid="slotProps">
            <div class="tasks-cards-grid">
              <div v-for="task in slotProps.items" :key="task.id" class="task-card-wrapper">
                <div
                  class="task-card"
                  :class="getTaskCardClass(task)"
                  @click="handleCardClick(task)"
                >
                  <!-- Header : statut + priorité -->
                  <div class="task-card-header">
                    <Tag
                      :value="getStatusLabel(task.status)"
                      :severity="getStatusSeverity(task.status)"
                      class="task-status-tag"
                    />
                    <Tag
                      :value="getPriorityLabel(task.priority)"
                      :severity="getPrioritySeverity(task.priority)"
                      class="task-priority-tag"
                    />
                  </div>

                  <!-- Corps -->
                  <div class="task-card-body">
                    <!-- Code modèle -->
                    <span class="task-code">{{ task.modele_code }}</span>

                    <!-- Titre -->
                    <h3 class="task-title">{{ cleanTaskTitle(task.nom) }}</h3>

                    <!-- Métadonnées -->
                    <div class="task-metas">
                      <div class="task-meta-item">
                        <i class="pi pi-map-marker"></i>
                        <span>{{ task.site_name || '—' }}</span>
                      </div>
                      <div class="task-meta-item">
                        <i class="pi pi-calendar"></i>
                        <span>{{ formatDate(task.date_limite) }}</span>
                      </div>
                      <div v-if="task.team_assigne_name || task.operateurs_assignes_names?.length || task.operateur_assigne_name" class="task-meta-item">
                        <i :class="task.team_assigne_name ? 'pi pi-users' : (task.operateurs_assignes_names?.length > 1 ? 'pi pi-users' : 'pi pi-user')"></i>
                        <span>{{ task.team_assigne_name || (task.operateurs_assignes_names?.length ? task.operateurs_assignes_names.join(', ') : task.operateur_assigne_name) }}</span>
                      </div>
                    </div>

                    <!-- Progression -->
                    <div class="task-progress">
                      <div class="task-progress-header">
                        <span>Progression</span>
                        <span class="task-progress-pct">{{ getTaskProgress(task) }}%</span>
                      </div>
                      <ProgressBar :value="getTaskProgress(task)" :showValue="false" />
                    </div>
                  </div>

                  <!-- Footer actions -->
                  <div class="task-card-footer" @click.stop>
                    <!-- DRAFT -->
                    <Button
                      v-if="task.status === 'DRAFT'"
                      icon="pi pi-play"
                      label="Démarrer"
                      size="small"
                      severity="success"
                      @click="startTask(task)"
                      class="task-btn-main"
                    />

                    <!-- IN_PROGRESS -->
                    <template v-else-if="task.status === 'IN_PROGRESS'">
                      <Button
                        icon="pi pi-pencil"
                        label="Saisir"
                        size="small"
                        @click="openGridFullscreen(task)"
                        class="task-btn-main"
                      />
                      <div class="task-btn-secondary-group">
                        <Button
                          v-if="getTaskProgress(task) >= 80"
                          icon="pi pi-send"
                          size="small"
                          severity="warning"
                          @click="submitTask(task)"
                          v-tooltip.top="'Soumettre'"
                          class="task-btn-icon"
                        />
                        <Button
                          icon="pi pi-check-circle"
                          size="small"
                          @click="openQualityControl(task)"
                          class="task-btn-icon quality-btn"
                          v-tooltip.top="'Contrôle qualité'"
                        />
                      </div>
                    </template>

                    <!-- Bouton qualité accessible sur tous les statuts (sauf DRAFT) -->
                    <Button
                      v-if="!['DRAFT', 'IN_PROGRESS'].includes(task.status)"
                      icon="pi pi-check-circle"
                      size="small"
                      @click="openQualityControl(task)"
                      class="task-btn-icon quality-btn"
                      v-tooltip.top="'Contrôle qualité'"
                    />

                    <!-- Autres statuts -->
                    <Button
                      v-if="!['DRAFT', 'IN_PROGRESS'].includes(task.status)"
                      icon="pi pi-eye"
                      label="Voir"
                      size="small"
                      severity="secondary"
                      @click="viewTask(task)"
                      class="task-btn-main"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </DataView>
      </div>
    </div>

    <!-- Modal pour remplir une tâche -->
    <ReportModal
      v-if="showFillModal && selectedTask"
      :visible="showFillModal"
      :report="selectedTask"
      :mode="getModalMode(selectedTask)"
      @close="showFillModal = false"
      @saved="onTaskSaved"
    />

    <!-- Dashboard Wizard Components -->
    <DashboardCreationWizard />
    <PostSubmitPrompt />

    <!-- Quality Control Drawer -->
    <QualityControlDrawer
      v-if="selectedTaskForQuality"
      v-model:visible="showQualityDrawer"
      :instance-id="selectedTaskForQuality.id"
      @refresh="fetchMyTasks"
    />

    <!-- Drawer Grille plein écran -->
    <Drawer
      v-model:visible="showGridModal"
      :header="getDrawerHeader()"
      position="full"
      @hide="selectedInstanceQualityFields = []"
    >
      <div class="grid-fullscreen-container">
        <CollectGridAG
          v-if="selectedModel"
          ref="collectGridRef"
          :columns="gridColumns"
          :readonly="isTaskReadonly"
          :initialData="selectedTask?.donnees_remplies || {}"
          :maxRows="selectedModel?.max_rows || 10"
          @data-changed="onGridDataChanged"
        />
      </div>
      
      <template #footer>
        <div class="flex gap-2 justify-end">
          <Button
            label="Fermer"
            icon="pi pi-times"
            @click="showGridModal = false"
            :class="isTaskReadonly ? '' : 'p-button-secondary'"
          />
          <Button
            v-if="!isTaskReadonly"
            label="Sauvegarder"
            icon="pi pi-save"
            @click="saveGridData"
            class="p-button-secondary"
          />
          <Button
            v-if="!isTaskReadonly && selectedTask?.status === 'IN_PROGRESS'"
            label="Soumettre"
            icon="pi pi-check"
            @click="submitTaskFromGrid"
            class="p-button-success"
          />
        </div>
      </template>
    </Drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useDocumentStore } from '../../documents/stores/documentStore'
import { useAuthStore } from '../../auth/stores/authStore'
import { useDashboardWizardStore } from '../../ai/stores/dashboardWizardStore'
import ReportModal from '../../documents/components/ReportModal.vue'
import CollectGridAG from '../../documents/components/CollectGridAG.vue'
import QualityControlDrawer from '../../documents/components/QualityControlDrawer.vue'
import DashboardCreationWizard from '../../ai/components/DashboardCreationWizard.vue'
import PostSubmitPrompt from '../../ai/components/PostSubmitPrompt.vue'

const toast = useToast()
const documentStore = useDocumentStore()
const authStore = useAuthStore()
const wizardStore = useDashboardWizardStore()

// État réactif
const loading = ref(false)
const loadingReport = ref(false)
const tasks = ref([])
const stats = ref({})
const searchQuery = ref('')
const statusFilter = ref(null)
const priorityFilter = ref(null)
const showFillModal = ref(false)
const showGridModal = ref(false)
const selectedTask = ref(null)
const selectedModel = ref(null)
const selectedInstanceQualityFields = ref([])
const collectGridRef = ref(null)
const showQualityDrawer = ref(false)
const selectedTaskForQuality = ref(null)

// Options de filtres (alignés avec DocumentInstance.STATUS_CHOICES du backend)
const statusOptions = [
  { label: 'Tous les statuts', value: null },
  { label: 'En cours', value: 'IN_PROGRESS' },
  { label: 'Soumis', value: 'SUBMITTED' },
  { label: 'En attente', value: 'PENDING_VALIDATION' },
  { label: 'Validé', value: 'VALIDATED' },
  { label: 'Rejeté', value: 'REJECTED' },
  { label: 'Expiré', value: 'EXPIRED' },
  { label: 'Archivé', value: 'ARCHIVED' }
]

const priorityOptions = [
  { label: 'Toutes les priorités', value: null },
  { label: 'Basse', value: 'LOW' },
  { label: 'Normale', value: 'NORMAL' },
  { label: 'Haute', value: 'HIGH' },
  { label: 'Urgente', value: 'URGENT' }
]

// Computed
const filteredTasks = computed(() => {
  let filtered = tasks.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(task =>
      (task.nom && task.nom.toLowerCase().includes(query)) ||
      (task.modele_code && task.modele_code.toLowerCase().includes(query)) ||
      (task.modele_name && task.modele_name.toLowerCase().includes(query)) ||
      (task.site_name && task.site_name.toLowerCase().includes(query)) ||
      (task.workorder_reference && task.workorder_reference.toLowerCase().includes(query)) ||
      (task.workorder_product_name && task.workorder_product_name.toLowerCase().includes(query))
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(task => task.status === statusFilter.value)
  }

  if (priorityFilter.value) {
    filtered = filtered.filter(task => task.priority === priorityFilter.value)
  }

  return filtered.sort((a, b) => {
    // D'abord par priorite (urgentes en premier)
    const priorityOrder = { 'URGENT': 1, 'HIGH': 2, 'NORMAL': 3, 'LOW': 4 }
    const priorityDiff = (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5)
    if (priorityDiff !== 0) return priorityDiff

    // Ensuite par statut (taches actives en premier, DRAFT et IN_PROGRESS au meme niveau)
    const statusOrder = {
      'DRAFT': 1,
      'IN_PROGRESS': 1,  // Meme niveau que DRAFT pour rester visible
      'SUBMITTED': 2,
      'PENDING_VALIDATION': 3,
      'REJECTED': 4,
      'VALIDATED': 5,
      'PUBLISHED': 6,
      'EXPIRED': 7,
      'ARCHIVED': 8
    }
    const statusDiff = (statusOrder[a.status] || 10) - (statusOrder[b.status] || 10)
    if (statusDiff !== 0) return statusDiff

    // Enfin par date limite (plus proche en premier)
    const dateA = a.date_limite ? new Date(a.date_limite) : new Date('2099-12-31')
    const dateB = b.date_limite ? new Date(b.date_limite) : new Date('2099-12-31')
    return dateA - dateB
  })
})

// Computed pour determiner si la tache est en lecture seule
const isTaskReadonly = computed(() => {
  if (!selectedTask.value) return true
  // Seules les taches DRAFT et IN_PROGRESS sont editables
  const editableStatuses = ['DRAFT', 'IN_PROGRESS']
  return !editableStatuses.includes(selectedTask.value.status)
})

// Computed pour les colonnes de la grille
const gridColumns = computed(() => {
  if (!selectedModel.value || !selectedModel.value.structure_json) return []
  const fields = selectedModel.value.structure_json.fields || []
  const base = fields.map(field => ({ ...field, prop: field.id, name: field.label }))

  // Ajouter les colonnes qualité spécifiques à l'instance
  const qualityCols = selectedInstanceQualityFields.value.map(f => ({
    id: f.field_id,
    label: f.label,
    type: f.field_type,
    configuration: f.configuration,
    required: false,
    order: 9000 + (f.order || 0),
    prop: f.field_id,
    name: f.label,
    isQuality: true,
  }))

  return [...base, ...qualityCols]
})

// Computed pour le nombre de colonnes répétables
const gridSampleColumns = computed(() => {
  if (!selectedModel.value || !selectedModel.value.structure_json) return 1
  const fields = selectedModel.value.structure_json.fields || []
  const maxRepetitions = Math.max(...fields.filter(f => f.repeatable).map(f => f.repetitions || 0), 1)
  return maxRepetitions
})

// Méthodes
const initializeData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchMyTasks(),
      fetchStats()
    ])
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger vos tâches',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const fetchMyTasks = async () => {
  try {
    // Nettoyer le cache avant de charger de nouvelles données
    progressCache.clear()
    
    const result = await documentStore.getMyTasks()
    if (result.success) {
      tasks.value = result.data
      tasks.value.forEach(t => {
        if (t.modele_structure) {
          const requiredFields = t.modele_structure.fields?.filter(f => f.required) || []
        }
      })
    }
  } catch (error) {
    console.error('Erreur lors du chargement des tâches:', error)
  }
}

  const fetchStats = async () => {
    try {
      const result = await documentStore.getMyTasksStats();
      if (result.success) {
        stats.value = result.data
    }
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error)
  }
}

const refreshData = () => {
  initializeData()
}

// Fonctions pour les stats et filtres rapides
const getTaskCountByStatus = (status) => {
  return tasks.value.filter(t => t.status === status).length
}

const getUrgentTasksCount = () => {
  return tasks.value.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length
}

const setQuickFilter = (filter) => {
  // Reset les filtres
  searchQuery.value = ''
  priorityFilter.value = null
  statusFilter.value = null

  if (filter === 'URGENT') {
    // Filtre special pour les urgentes (URGENT + HIGH)
    priorityFilter.value = 'URGENT'
  } else {
    statusFilter.value = filter
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = null
  priorityFilter.value = null
}

const viewTask = (task) => {
  // Ouvrir la grille de saisie en mode lecture pour voir les donnees
  openGridFullscreen(task)
}

const fillTask = (task) => {
  selectedTask.value = task
  showFillModal.value = true
}

const openGridFullscreen = async (task) => {
  selectedTask.value = task
  loadingReport.value = true

  // Charger la structure du modèle
  try {
    const modelResult = await documentStore.getModeleById(task.modele)
    if (!modelResult.success) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de charger le modèle',
        life: 3000
      })
      return
    }

    let modele = modelResult.data

    // Si structure_json n'a pas de champs, récupérer les champs depuis l'API
    if (!modele.structure_json || !modele.structure_json.fields || modele.structure_json.fields.length === 0) {
      const fieldsResult = await documentStore.getFields(task.modele)

      if (fieldsResult.success && fieldsResult.data && fieldsResult.data.length > 0) {
        // Convertir les DocumentField en format structure_json
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

        // Construire structure_json
        modele.structure_json = {
          fields: fields,
          has_column_groups: fields.some(f => f.is_column_group),
          version: '1.0'
        }
      }
    }

    selectedModel.value = modele

    // Charger les mesures qualité spécifiques à cette instance
    const instanceResult = await documentStore.getInstance(task.id)
    selectedInstanceQualityFields.value = instanceResult.data?.quality_fields || []

    showGridModal.value = true
  } catch (error) {
    console.error('Error loading model:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement du modèle',
      life: 3000
    })
  } finally {
    loadingReport.value = false
  }
}

const openQualityControl = (task) => {
  selectedTaskForQuality.value = task
  showQualityDrawer.value = true
}

const startTask = async (task) => {
  try {
    const result = await documentStore.updateInstance(task.id, { status: 'IN_PROGRESS' })
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Tache demarree',
        detail: 'Vous pouvez maintenant saisir vos données',
        life: 2000
      })
      // Mettre a jour le statut localement pour eviter un refresh complet
      task.status = 'IN_PROGRESS'
      // Ouvrir automatiquement la grille de saisie
      await openGridFullscreen(task)
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de demarrer la tache',
      life: 3000
    })
  }
}

const submitTask = async (task) => {
  try {
    const result = await documentStore.submitTask(task.id)
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Tâche soumise avec succès',
        life: 3000
      })
      refreshData()

      // Trigger dashboard wizard prompt after successful submission
      if (result.data && (result.data.status === 'SUBMITTED' || result.data.status === 'PENDING_VALIDATION')) {
        setTimeout(() => {
          wizardStore.showPostSubmitPrompt(result.data)
        }, 500)
      }
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de soumettre la tâche',
      life: 3000
    })
  }
}

const onTaskSaved = () => {
  showFillModal.value = false
  selectedTask.value = null
  toast.add({
    severity: 'success',
    summary: 'Succès',
    detail: 'Rapport sauvegardé avec succès',
    life: 3000
  })
  refreshData()
}

const saveGridData = async () => {
  try {
    // Pas de validation pour la sauvegarde simple - on sauvegarde l'état actuel
    
    // Récupérer les vraies données de la grille
    let gridData = {}
    if (collectGridRef.value && collectGridRef.value.getGridData) {
      gridData = collectGridRef.value.getGridData()
    } else {
      console.warn('⚠️ Impossible de récupérer les données de la grille')
    }
    
    const updatedData = {
      donnees_remplies: { 
        ...selectedTask.value.donnees_remplies, 
        ...gridData 
      }
    }
    
    
    const newProgression = getTaskProgress({
      ...selectedTask.value,
      donnees_remplies: updatedData.donnees_remplies
    })
    
    updatedData.progression = newProgression
    
    
    const result = await documentStore.updateTask(selectedTask.value.id, updatedData)
    
    if (result.success) {
      // Mettre à jour la tâche localement avec la nouvelle progression
      selectedTask.value.donnees_remplies = updatedData.donnees_remplies
      selectedTask.value.progression = newProgression
      
      toast.add({
        severity: 'success',
        summary: 'Sauvegarde réussie',
        detail: `Données sauvegardées (${newProgression}% complété) - Vous pouvez continuer la saisie`,
        life: 3000
      })
      showGridModal.value = false
      refreshData() // Recharger pour synchroniser avec le serveur
    } else {
      throw new Error(result.message || 'Erreur lors de la sauvegarde')
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    
    // Gérer les erreurs spécifiques
    let errorMessage = 'Erreur lors de la sauvegarde'
    if (error.response?.status === 403) {
      errorMessage = 'Vous n\'êtes pas autorisé à modifier cette tâche. Seul l\'opérateur assigné ou un membre de l\'équipe assignée peut la modifier.'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }
    
    toast.add({
      severity: 'error',
      summary: 'Erreur de sauvegarde',
      detail: errorMessage,
      life: 5000
    })
  }
}

const submitTaskFromGrid = async () => {
  try {
    // Valider les champs obligatoires avant la soumission
    if (collectGridRef.value) {
      const validationErrors = collectGridRef.value.validateRequiredFields()
      
      if (validationErrors.length > 0) {
        // Afficher les erreurs de validation
        const errorMessages = validationErrors.map(error => error.message).join('\n')
        toast.add({
          severity: 'warn',
          summary: 'Validation requise',
          detail: `Veuillez remplir tous les champs obligatoires:\n${errorMessages}`,
          life: 5000
        })
        return
      }
    }
    
    // Récupérer les vraies données de la grille
    let gridData = {}
    if (collectGridRef.value && collectGridRef.value.getGridData) {
      gridData = collectGridRef.value.getGridData()
    } else {
      console.warn('⚠️ Impossible de récupérer les données de la grille')
    }
    
    // Combiner avec les données existantes
    const updatedData = {
      donnees_remplies: { 
        ...selectedTask.value.donnees_remplies, 
        ...gridData 
      },
      status: 'SUBMITTED' // Changer le statut à SUBMITTED
    }
    
    
    // Calculer la progression côté frontend avant soumission
    const newProgression = getTaskProgress({
      ...selectedTask.value,
      donnees_remplies: updatedData.donnees_remplies
    })
    
    
    // D'abord sauvegarder les données
    const saveResult = await documentStore.updateTask(selectedTask.value.id, updatedData)
    
    if (!saveResult.success) {
      throw new Error(saveResult.message || 'Erreur lors de la sauvegarde avant soumission')
    }
    
    // Puis soumettre la tâche
    const result = await documentStore.submitTask(selectedTask.value.id)
    
    if (result.success) {
      // Mettre à jour la tâche localement
      selectedTask.value.donnees_remplies = updatedData.donnees_remplies
      selectedTask.value.progression = newProgression
      selectedTask.value.status = 'SUBMITTED'

      toast.add({
        severity: 'success',
        summary: 'Tâche soumise',
        detail: `Tâche soumise avec succès (${newProgression}% complété)`,
        life: 3000
      })
      showGridModal.value = false
      refreshData() // Recharger pour synchroniser avec le serveur

      // Trigger dashboard wizard prompt after successful submission
      if (result.data && (result.data.status === 'SUBMITTED' || result.data.status === 'PENDING_VALIDATION')) {
        // Delay to let the modal close first
        setTimeout(() => {
          wizardStore.showPostSubmitPrompt(result.data)
        }, 500)
      }
    } else {
      throw new Error(result.message || 'Erreur lors de la soumission')
    }
  } catch (error) {
    console.error('Erreur lors de la soumission:', error)
    
    // Gérer les erreurs spécifiques
    let errorMessage = 'Erreur lors de la soumission'
    if (error.response?.status === 403) {
      errorMessage = 'Vous n\'êtes pas autorisé à soumettre cette tâche. Seul l\'opérateur assigné ou un membre de l\'équipe assignée peut la soumettre.'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }
    
    toast.add({
      severity: 'error',
      summary: 'Erreur de soumission',
      detail: errorMessage,
      life: 5000
    })
  }
}

const onGridDataChanged = (newData) => {
  // Mettre à jour les données de la tâche sélectionnée
  if (selectedTask.value) {
    selectedTask.value.donnees_remplies = { ...selectedTask.value.donnees_remplies, ...newData }
    
    // Nettoyer le cache pour cette tâche
    const taskId = selectedTask.value.id
    for (const key of progressCache.keys()) {
      if (key.startsWith(`${taskId}-`) || key.startsWith(`debug-${taskId}`)) {
        progressCache.delete(key)
      }
    }
    
    // Recalculer la progression en temps réel
    const newProgression = getTaskProgress(selectedTask.value)
    selectedTask.value.progression = newProgression
    
  }
}

// Utilitaires
const getStatusSeverity = (status) => {
  const severities = {
    'DRAFT': 'secondary',
    'PUBLISHED': 'info',
    'IN_PROGRESS': 'info',
    'SUBMITTED': 'warning',
    'PENDING_VALIDATION': 'warning',
    'VALIDATED': 'success',
    'REJECTED': 'danger',
    'EXPIRED': 'danger',
    'ARCHIVED': 'secondary'
  }
  return severities[status] || 'info'
}

const getPrioritySeverity = (priority) => {
  const severities = {
    'LOW': 'info',
    'NORMAL': 'success',
    'HIGH': 'warning',
    'URGENT': 'danger'
  }
  return severities[priority] || 'info'
}

const getPriorityLabel = (priority) => {
  // Labels alignes avec DocumentInstance.PRIORITY_CHOICES du backend
  const labels = {
    'LOW': 'Basse',
    'NORMAL': 'Normale',
    'HIGH': 'Haute',
    'URGENT': 'Urgente'
  }
  return labels[priority] || priority || 'Non definie'
}

const getTaskCardClass = (task) => {
  const classes = ['task-clickable']
  if (task.status === 'DRAFT') classes.push('task-draft')
  if (task.status === 'IN_PROGRESS') classes.push('task-in-progress')
  if (task.status === 'PENDING_VALIDATION') classes.push('task-pending')
  if (task.status === 'VALIDATED') classes.push('task-completed')
  if (task.status === 'REJECTED') classes.push('task-rejected')
  if (task.status === 'SUBMITTED') classes.push('task-submitted')
  if (isOverdue(task)) classes.push('task-overdue')
  return classes
}

const isOverdue = (task) => {
  if (!task.date_limite) return false
  return new Date(task.date_limite) < new Date()
}

const getTaskIcon = (task) => {
  // Icone contextuelle selon le statut
  const icons = {
    'DRAFT': 'pi pi-file',
    'IN_PROGRESS': 'pi pi-pencil',
    'SUBMITTED': 'pi pi-send',
    'PENDING_VALIDATION': 'pi pi-clock',
    'VALIDATED': 'pi pi-check-circle',
    'REJECTED': 'pi pi-times-circle',
    'ARCHIVED': 'pi pi-inbox'
  }
  return icons[task.status] || 'pi pi-file'
}

const handleCardClick = (task) => {
  // Action contextuelle au clic sur la carte
  if (task.status === 'DRAFT') {
    startTask(task)
  } else if (task.status === 'IN_PROGRESS') {
    openGridFullscreen(task)
  } else {
    viewTask(task)
  }
}

const getModalMode = (task) => {
  const editableStatuses = ['IN_PROGRESS', 'SUBMITTED', 'PENDING_VALIDATION']

  if (editableStatuses.includes(task.status)) {
    return 'edit'
  }

  return 'view'
}

const getDrawerHeader = () => {
  if (!selectedTask.value) return 'Saisie'

  const task = selectedTask.value
  const editableStatuses = ['DRAFT', 'IN_PROGRESS']
  const isReadonly = !editableStatuses.includes(task.status)

  let header = isReadonly ? 'Consultation' : 'Saisie'
  header += ` - ${cleanTaskTitle(task.nom)}`

  if (task.workorder_reference) {
    header += ` | OF: ${task.workorder_reference}`
    if (task.workorder_product_name) {
      header += ` (${task.workorder_product_name})`
    }
  }

  if (isReadonly) {
    header += ` [${getStatusLabel(task.status)}]`
  }

  return header
}

// Cache pour éviter les recalculs multiples
const progressCache = new Map()

const getTaskProgress = (task) => {
  if (!task.donnees_remplies) return 0
  
  // Utiliser le cache si disponible
  const cacheKey = `${task.id}-${JSON.stringify(task.donnees_remplies)}`
  if (progressCache.has(cacheKey)) {
    return progressCache.get(cacheKey)
  }
  
  // Toujours calculer côté frontend pour avoir une progression en temps réel
  // Récupérer la structure du modèle depuis modele_structure.structure_json ou depuis le modèle lui-même
  let modelStructure = null

  // Le serializer retourne modele_structure.structure_json.fields
  if (task.modele_structure && task.modele_structure.structure_json && task.modele_structure.structure_json.fields) {
    modelStructure = task.modele_structure.structure_json
  } else if (task.modele_structure && task.modele_structure.fields) {
    // Fallback pour ancienne structure
    modelStructure = task.modele_structure
  } else if (task.modele && task.modele.structure_json && task.modele.structure_json.fields) {
    modelStructure = task.modele.structure_json
  }
  
  if (!modelStructure || !modelStructure.fields) {
    // Fallback : utiliser la progression calculée côté serveur uniquement si pas de structure
    console.warn('Pas de structure de modèle disponible pour tâche', task.id, {
      modele_structure: task.modele_structure,
      modele: task.modele
    })
    const serverProgress = task.progression || 0
    progressCache.set(cacheKey, serverProgress)
    return serverProgress
  }

  // Exclure les groupes de colonnes (headers) du calcul
  const allFields = modelStructure.fields.filter(field => !field.is_column_group)

  if (allFields.length === 0) {
    progressCache.set(cacheKey, 100)
    return 100
  }

  // Calculer la progression sur TOUS les champs (pas seulement les obligatoires)
  let totalProgression = 0
  for (const field of allFields) {
    const value = task.donnees_remplies[field.id]
    const fieldProgression = calculateFieldProgression(field, value)
    totalProgression += fieldProgression
  }

  const calculatedProgress = Math.round(totalProgression / allFields.length)
  
  // Mettre en cache
  progressCache.set(cacheKey, calculatedProgress)
  
  return calculatedProgress
}

const calculateFieldProgression = (field, value) => {
  if (value === null || value === undefined) return 0
  
  const fieldType = field.type || 'TEXT'
  const isRepeatable = field.repeatable || false
  const repetitions = field.repetitions || 1
  
  if (isRepeatable) {
    if (!Array.isArray(value)) return 0
    
    // Compter les valeurs valides
    let filledCount = 0
    for (const item of value) {
      if (validateSingleValue(fieldType, item)) {
        filledCount++
      }
    }
    
    // Progression proportionnelle : (valeurs remplies / total répétitions) * 100
    return (filledCount / repetitions) * 100
  } else {
    // Champ simple : 0% ou 100%
    return validateSingleValue(fieldType, value) ? 100 : 0
  }
}

const isFieldFilled = (field, value) => {
  if (value === null || value === undefined) return false
  
  const fieldType = field.type || 'TEXT'
  const isRepeatable = field.repeatable || false
  const repetitions = field.repetitions || 1
  
  // Pour les champs répétables, la valeur doit être une liste
  if (isRepeatable) {
    if (!Array.isArray(value)) return false
    
    // Compter les valeurs non vides
    let filledCount = 0
    for (const item of value) {
      if (validateSingleValue(fieldType, item)) {
        filledCount++
      }
    }
    
    // Considérer le champ comme rempli si au moins 50% des répétitions sont remplies
    // ou si au moins 1 valeur est remplie pour les champs avec peu de répétitions
    const minRequired = Math.max(1, Math.floor(repetitions / 2))
    return filledCount >= minRequired
  } else {
    // Champ simple
    return validateSingleValue(fieldType, value)
  }
}

const validateSingleValue = (fieldType, value) => {
  if (value === null || value === undefined || value === '') return false
  
  switch (fieldType) {
    case 'TEXT':
    case 'TEXTAREA':
      return String(value).trim() !== ''
    case 'NUMBER':
      try {
        parseFloat(value)
        return true
      } catch {
        return false
      }
    case 'DATE':
    case 'DATETIME':
      return String(value).trim() !== ''
    case 'SELECT':
      return String(value).trim() !== ''
    case 'MULTISELECT':
      return Array.isArray(value) && value.length > 0
    case 'CHECKBOX':
      return typeof value === 'boolean'
    case 'PHOTO':
    case 'SIGNATURE':
      return String(value).trim() !== ''
    default:
      return String(value).trim() !== ''
  }
}

const getStatusLabel = (status) => {
  const labels = {
    'DRAFT': 'Brouillon',
    'PUBLISHED': 'Publié',
    'IN_PROGRESS': 'En cours',
    'SUBMITTED': 'Soumis',
    'PENDING_VALIDATION': 'En attente',
    'VALIDATED': 'Validé',
    'REJECTED': 'Rejeté',
    'EXPIRED': 'Expiré',
    'ARCHIVED': 'Archivé',
    'COMPLETED': 'Terminé',
    'CANCELLED': 'Annulé'
  }
  return labels[status] || status
}

const cleanTaskTitle = (title) => {
  if (!title) return 'Sans titre'
  // Supprime les prefixes de statut du titre (ex: "IN_PROGRESS - " ou "DRAFT - ")
  const statusPrefixes = ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'SUBMITTED', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'EXPIRED', 'ARCHIVED']
  let cleanedTitle = title
  for (const prefix of statusPrefixes) {
    if (cleanedTitle.startsWith(prefix + ' - ')) {
      cleanedTitle = cleanedTitle.substring(prefix.length + 3)
      break
    }
  }
  return cleanedTitle
}

const formatDate = (date) => {
  if (!date) return 'Non définie'
  return new Date(date).toLocaleDateString('fr-FR')
}

// Lifecycle
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.mes-taches-page {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  background: #f8fafc;
  min-height: 100vh;
}

/* Header */
.page-header {
  margin-bottom: 1.5rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.header-content h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.header-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.stat-draft .stat-icon {
  background: #fef3c7;
  color: #d97706;
}

.stat-progress .stat-icon {
  background: #dbeafe;
  color: #2563eb;
}

.stat-submitted .stat-icon {
  background: #ede9fe;
  color: #7c3aed;
}

.stat-urgent .stat-icon {
  background: #fee2e2;
  color: #dc2626;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.25rem;
}

/* Filters */
.filters-section {
  margin-bottom: 1.5rem;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.search-box {
  flex: 1;
  min-width: 280px;
}

.search-wrapper {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.9rem;
  z-index: 1;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding-left: 2.5rem !important;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
  color: #94a3b8;
}

.filter-controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.filter-select {
  min-width: 140px;
}

/* Tasks Section */
.tasks-section {
  min-height: 400px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #64748b;
  background: white;
  border-radius: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.empty-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.empty-icon-wrapper i {
  font-size: 2rem;
  color: #94a3b8;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #334155;
  font-size: 1.125rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

/* DataView header */
.dataview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tasks-count {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* ── Task Cards Grid ────────────────────────────────── */
.tasks-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1rem;
  padding: 0.75rem 0.25rem;
}

.task-card-wrapper {
  min-width: 0;
}

/* ── Task Card ──────────────────────────────────────── */
.task-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #cbd5e1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.task-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.09);
  transform: translateY(-2px);
}

/* Couleurs de bande par statut */
.task-draft       { border-left-color: #f59e0b; }
.task-in-progress { border-left-color: #3b82f6; }
.task-submitted   { border-left-color: #8b5cf6; }
.task-pending     { border-left-color: #eab308; }
.task-completed   { border-left-color: #10b981; }
.task-rejected    { border-left-color: #ef4444; }
.task-overdue     { border-left-color: #dc2626; }

/* Header : tags seulement */
.task-card-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 1rem 0.5rem;
}

:deep(.task-status-tag .p-tag),
:deep(.task-priority-tag .p-tag) {
  font-size: 0.7rem !important;
  padding: 0.2rem 0.5rem !important;
  border-radius: 5px !important;
  font-weight: 600 !important;
}

/* Body */
.task-card-body {
  flex: 1;
  padding: 0.25rem 1rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.task-code {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.task-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-metas {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.task-meta-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.task-meta-item i {
  font-size: 0.75rem;
  color: #94a3b8;
  width: 12px;
  flex-shrink: 0;
}

/* Progression */
.task-progress {
  margin-top: 0.125rem;
}

.task-progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 0.375rem;
}

.task-progress-pct {
  font-weight: 700;
  color: #475569;
}

/* Footer */
.task-card-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}

.task-btn-main {
  flex: 1;
}

.task-btn-secondary-group {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
}

.task-btn-icon {
  width: 2rem;
  height: 2rem;
  padding: 0 !important;
}

.quality-btn {
  background: #475569 !important;
  border-color: #475569 !important;
  color: white !important;
}

.quality-btn:hover {
  background: #334155 !important;
  border-color: #334155 !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Responsive ─────────────────────────────────────── */

/* Tablette large (≤ 1280px) : 3 cards par ligne */
@media (max-width: 1280px) {
  .tasks-cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}

/* Tablette (≤ 1024px) */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .tasks-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile large (≤ 768px) */
@media (max-width: 768px) {
  .mes-taches-page {
    padding: 1rem;
  }

  .page-header {
    padding: 1rem;
    gap: 1rem;
  }

  .header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .header-top h1 {
    font-size: 1.25rem;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.625rem;
  }

  .stat-card {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .filters-section {
    padding: 0.75rem 1rem;
  }

  .filters-bar {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .search-box {
    width: 100%;
  }

  .filter-controls {
    width: 100%;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .filter-select {
    flex: 1;
    min-width: 120px;
  }

  .tasks-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .task-title {
    font-size: 0.875rem;
  }
}

/* Mobile (≤ 600px) : 1 card par ligne */
@media (max-width: 600px) {
  .tasks-cards-grid {
    grid-template-columns: 1fr;
    padding: 0.5rem 0;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .task-card-footer {
    flex-wrap: wrap;
  }

  .task-btn-main {
    flex: 1 1 100%;
  }

  .task-btn-secondary-group {
    width: 100%;
    justify-content: flex-end;
  }
}

/* Très petit mobile (≤ 400px) */
@media (max-width: 400px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .stat-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 0.625rem;
  }

  .filter-controls {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }
}

:deep(.progress-success .p-progressbar-value) {
  background-color: #10b981;
}

:deep(.progress-warning .p-progressbar-value) {
  background-color: #f59e0b;
}

:deep(.progress-danger .p-progressbar-value) {
  background-color: #ef4444;
}

:deep(.p-dataview .p-dataview-content) {
  background: transparent;
}

:deep(.p-dataview-header) {
  background: white;
  border-radius: 12px 12px 0 0;
  border: 1px solid #e2e8f0;
  border-bottom: none;
  padding: 1rem 1.25rem;
}


/* Grid fullscreen container - IMPORTANT pour éviter double scroll */
.grid-fullscreen-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* Drawer styles pour éviter le double scroll */
:deep(.p-drawer) {
  display: flex;
  flex-direction: column;
}

:deep(.p-drawer-header) {
  flex-shrink: 0;
}

:deep(.p-drawer-content) {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  overflow: hidden !important;
  padding: 1rem;
  /* Hauteur calculée: viewport - header (~60px) - footer (~60px) - padding */
  height: calc(100vh - 140px);
  max-height: calc(100vh - 140px);
}

:deep(.p-drawer-footer) {
  flex-shrink: 0;
}

/* S'assurer que la grille AG prend tout l'espace disponible */
.grid-fullscreen-container :deep(.collect-grid-wrapper) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.grid-fullscreen-container :deep(.collect-grid) {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  height: 100%;
}

/* Loading overlay pour l'ouverture du rapport */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-in-out;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2.5rem 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.3s ease-out;
}

.loading-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style> 
