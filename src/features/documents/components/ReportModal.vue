<template>
  <div class="report-modal-wrapper">
    <Dialog
      v-model:visible="drawerVisible"
      :modal="true"
      :closable="true"
      :closeOnEscape="true"
      :dismissableMask="true"
      :style="{ width: 'min(680px, 95vw)', maxHeight: '90vh' }"
      :contentStyle="{ padding: '1rem 1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 130px)' }"
      class="report-modal-dialog"
    >
      <template #header>
        <div class="modal-header-with-action">
          <span class="modal-title">{{ isReadOnly ? 'Détails du document' : (report ? 'Modifier le document' : 'Nouveau document') }}</span>
          <span v-if="report" :class="['status-badge', `status-${report.status?.toLowerCase()}`]">
            {{ statusLabels[report.status] || report.status }}
          </span>
        </div>
      </template>

      <form @submit.prevent="saveReport" class="report-form">
        <div class="form-content">

          <!-- Identification -->
          <div class="field-group">
            <span class="group-label"><i class="pi pi-file-edit"></i> Identification</span>
            <div class="form-grid two-cols">
              <div class="form-field">
                <label for="model">Template <span class="required">*</span></label>
                <Select
                  id="model"
                  v-model="formData.modele"
                  :options="models"
                  optionLabel="nom"
                  optionValue="id"
                  placeholder="Choisir un template"
                  :class="{ 'p-invalid': errors.modele }"
                  :disabled="isReadOnly"
                  @change="onModelChange"
                />
                <small v-if="errors.modele" class="p-error">{{ errors.modele }}</small>
              </div>
              <div class="form-field">
                <label for="name">Nom du document <span class="required">*</span></label>
                <InputText
                  id="name"
                  v-model="formData.nom"
                  placeholder="Ex: Document production 12/02"
                  :class="{ 'p-invalid': errors.nom }"
                  :disabled="isReadOnly"
                />
                <small v-if="errors.nom" class="p-error">{{ errors.nom }}</small>
              </div>
            </div>
          </div>

          <!-- Localisation -->
          <div class="field-group">
            <span class="group-label"><i class="pi pi-map-marker"></i> Localisation</span>
            <div class="form-grid two-cols">
              <div class="form-field">
                <label for="workplace">Poste de travail <span class="required">*</span></label>
                <Select
                  id="workplace"
                  v-model="formData.workplace"
                  :options="workplaces"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Choisir un poste"
                  :class="{ 'p-invalid': errors.workplace }"
                  :disabled="isReadOnly"
                  @change="handleWorkplaceChange"
                />
                <small v-if="errors.workplace" class="p-error">{{ errors.workplace }}</small>
              </div>
              <div class="form-field">
                <label for="machine">Machine</label>
                <Select
                  id="machine"
                  v-model="formData.machine"
                  :options="filteredMachines"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Choisir une machine"
                  :disabled="isReadOnly || !formData.workplace"
                />
                <small class="field-hint" v-if="!formData.workplace">Sélectionnez d'abord un poste</small>
              </div>
            </div>
          </div>

          <!-- Assignation -->
          <div class="field-group">
            <span class="group-label"><i class="pi pi-users"></i> Assignation</span>
            <div class="assignment-toggle">
              <button
                type="button"
                :class="['toggle-btn', { active: assignmentType === 'person' }]"
                @click="assignmentType = 'person'; handleAssignmentTypeChange()"
                :disabled="isReadOnly"
              >
                <i class="pi pi-user"></i> Opérateurs
              </button>
              <button
                type="button"
                :class="['toggle-btn', { active: assignmentType === 'team' }]"
                @click="assignmentType = 'team'; handleAssignmentTypeChange()"
                :disabled="isReadOnly"
              >
                <i class="pi pi-users"></i> Équipe
              </button>
            </div>
            <div class="form-grid two-cols">
              <div class="form-field" v-if="assignmentType === 'person'">
                <label for="operators">Opérateurs assignés</label>
                <MultiSelect
                  id="operators"
                  v-model="formData.operateurs_assignes"
                  :options="operatorsWithNames"
                  optionLabel="fullName"
                  optionValue="id"
                  placeholder="Choisir un ou plusieurs opérateurs"
                  :disabled="isReadOnly"
                  :filter="true"
                  filterPlaceholder="Rechercher..."
                  display="chip"
                />
              </div>
              <div class="form-field" v-if="assignmentType === 'team'">
                <label for="team">Équipe assignée</label>
                <Select
                  id="team"
                  v-model="formData.team_assigne"
                  :options="teams"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Choisir une équipe"
                  :disabled="isReadOnly"
                />
              </div>
              <div class="form-field">
                <label for="workorder">Ordre de fabrication</label>
                <Select
                  id="workorder"
                  v-model="formData.workorder"
                  :options="workorders"
                  optionLabel="display_name"
                  optionValue="id"
                  placeholder="Associer un OF (optionnel)"
                  :disabled="isReadOnly"
                  :filter="true"
                  showClear
                >
                  <template #value="slotProps">
                    <div v-if="slotProps.value">
                      {{ workorders.find(wo => wo.id === slotProps.value)?.display_name }}
                    </div>
                    <span v-else>{{ slotProps.placeholder }}</span>
                  </template>
                  <template #option="slotProps">
                    <div class="workorder-option">
                      <div class="wo-reference">{{ slotProps.option.reference }}</div>
                      <div class="wo-product">{{ slotProps.option.product_name }}</div>
                      <div class="wo-progress">{{ slotProps.option.actual_quantity }}/{{ slotProps.option.planned_quantity }} pcs</div>
                    </div>
                  </template>
                </Select>
              </div>
            </div>
          </div>

          <!-- Planning -->
          <div class="field-group">
            <span class="group-label"><i class="pi pi-calendar"></i> Planning</span>
            <div class="form-grid two-cols">
              <div class="form-field">
                <label for="date_prevue">Date prévue</label>
                <DatePicker
                  id="date_prevue"
                  v-model="formData.date_prevue"
                  dateFormat="dd/mm/yy"
                  placeholder="Sélectionner une date"
                  :disabled="isReadOnly"
                  showIcon
                />
              </div>
              <div class="form-field">
                <label for="date_limite">Date limite</label>
                <DatePicker
                  id="date_limite"
                  v-model="formData.date_limite"
                  dateFormat="dd/mm/yy"
                  placeholder="Sélectionner une date limite"
                  :disabled="isReadOnly"
                  showIcon
                />
              </div>
            </div>
          </div>

          <!-- Grille de saisie (masquée si aucune donnée en mode édition) -->
          <div v-if="selectedModel && selectedModel.structure_json && hasRepeatableFields && (!report || hasGridData)" class="field-group grid-group">
            <div class="grid-group-header">
              <span class="group-label"><i class="pi pi-table"></i> Grille de saisie</span>
              <Button
                icon="pi pi-window-maximize"
                label="Plein écran"
                @click="openGridFullscreen"
                size="small"
                text
              />
            </div>
            <div class="grid-container">
              <CollectGridAG
                v-if="selectedModel && gridColumns.length > 0"
                ref="collectGridRef"
                :columns="gridColumns"
                :initialData="formData.donnees_remplies"
                :readonly="isReadOnly"
                @data-changed="onGridDataChanged"
              />
              <div v-else class="grid-loading">
                <i class="pi pi-spin pi-spinner"></i>
                <span>Chargement...</span>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="field-group">
            <span class="group-label"><i class="pi pi-comment"></i> Notes</span>
            <div class="form-field">
              <Textarea
                v-model="formData.commentaires"
                rows="3"
                placeholder="Ajouter des notes ou commentaires..."
                :disabled="isReadOnly"
                autoResize
              />
            </div>
          </div>

        </div>
      </form>

      <template #footer>
        <div class="modal-footer">
          <template v-if="isReadOnly">
            <Button label="Fermer" @click="drawerVisible = false" class="btn-secondary" />
          </template>
          <template v-else>
            <Button label="Annuler" @click="drawerVisible = false" class="btn-cancel" text />
            <Button
              v-if="report && report.status === 'SUBMITTED'"
              label="Valider"
              icon="pi pi-check"
              @click="validateReport"
              :loading="saving"
              class="btn-validate"
            />
            <Button
              label="Sauvegarder"
              icon="pi pi-save"
              @click="saveReport"
              :loading="saving"
              class="btn-save"
            />
          </template>
        </div>
      </template>
    </Dialog>

    <!-- Modal plein écran pour la grille -->
    <Dialog
      v-model:visible="showGridFullscreen"
      :modal="true"
      :closable="true"
      :closeOnEscape="true"
      :dismissableMask="true"
      header="Grille de saisie — Plein écran"
      :style="{ width: '98vw', height: '95vh' }"
      class="grid-fullscreen-modal"
    >
      <div class="grid-fullscreen-container" style="max-height: calc(95vh - 120px); overflow: auto;">
        <CollectGridAG
          v-if="hasRepeatableFields && selectedModel && gridColumns.length > 0"
          ref="collectGridFullscreenRef"
          :columns="gridColumns"
          :initialData="formData.donnees_remplies"
          @data-changed="onGridDataChanged"
          :readonly="isReadOnly"
        />
        <div v-else class="grid-loading">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
          <p>Chargement de la grille...</p>
        </div>
      </div>
      <template #footer>
        <Button label="Fermer" @click="closeGridFullscreen" class="p-button-secondary" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useDocumentStore } from '../stores/documentStore'
import { useUserStore } from '../../user/stores/userStore'
import { useAuthStore } from '../../auth/stores/authStore'
import { axiosInstance } from '@/main'
import CollectGridAG from './CollectGridAG.vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  report: {
    type: Object,
    default: null
  },
  mode: {
    type: String,
    default: 'edit',
    validator: (value) => ['view', 'edit'].includes(value)
  }
})

// Emits
const emit = defineEmits(['close', 'saved'])

// Composables
const toast = useToast()
const documentStore = useDocumentStore()
const userStore = useUserStore()
const authStore = useAuthStore()

// Refs
const drawerVisible = ref(false)
const saving = ref(false)
const errors = ref({})
const selectedModel = ref(null)
const showGridFullscreen = ref(false)
const collectGridRef = ref(null)
const collectGridFullscreenRef = ref(null)

// Form data
const formData = reactive({
  modele: null,
  nom: '',
  workplace: null,
  machine: null,
  workorder: null,
  session: null,
  operateur_assigne: null,
  operateurs_assignes: [],
  team_assigne: null,
  date_prevue: null,
  date_limite: null,
  commentaires: '',
  donnees_remplies: {}
})

// Labels des statuts en français
const statusLabels = {
  'DRAFT': 'Brouillon',
  'IN_PROGRESS': 'En cours',
  'SUBMITTED': 'Soumis',
  'PENDING_VALIDATION': 'En attente',
  'VALIDATED': 'Validé',
  'REJECTED': 'Rejeté',
  'EXPIRED': 'Expiré',
  'ARCHIVED': 'Archivé',
  'PUBLISHED': 'Publié',
  'CANCELLED': 'Annulé'
}

// Type d'assignation
const assignmentType = ref('person')
const assignmentTypeOptions = [
  { label: 'Personne', value: 'person' },
  { label: 'Équipe', value: 'team' }
]

// Options

// Data arrays
const models = ref([])
const workplaces = ref([])
const machines = ref([])
const workorders = ref([])
const sessions = ref([])
const operators = ref([])
const teams = ref([])

// Computed pour formater les opérateurs avec noms complets
const operatorsWithNames = computed(() => {
  return operators.value.map(operator => ({
    ...operator,
    fullName: operator.fullName || `${operator.first_name || ''} ${operator.last_name || ''}`.trim() || operator.email_address || 'Utilisateur sans nom'
  }))
})

// Computed pour filtrer les machines par workplace sélectionné
const filteredMachines = computed(() => {
  if (!formData.workplace) {
    return machines.value || []
  }
  const allMachines = machines.value || []
  return allMachines.filter(m => 
    m.workplace === formData.workplace || 
    m.workplace_id === formData.workplace ||
    m.workplace?.id === formData.workplace
  )
})

// Computed pour vérifier si on est en mode lecture seule
// La grille est en lecture seule si:
// 1. Le mode est explicitement 'view'
// 2. OU le rapport existe et a été soumis ou validé
const isReadOnly = computed(() => {
  if (props.mode === 'view') return true
  if (props.report && (props.report.status === 'SUBMITTED' || props.report.status === 'VALIDATED')) {
    return true
  }
  return false
})

// Computed pour vérifier si le modèle doit afficher une grille (tableau)
const hasRepeatableFields = computed(() => {
  if (!selectedModel.value || !selectedModel.value.structure_json) {
    return false
  }
  // Vérifier si c'est un tableau (layout === 'table')
  const isTable = selectedModel.value.structure_json.layout === 'table'
  if (isTable) {
    const fields = selectedModel.value.structure_json.fields || []
    // Pour un tableau, on affiche la grille si il y a des champs
    return fields.length > 0
  }
  // Sinon, vérifier les champs répétables (pour compatibilité)
  const fields = selectedModel.value.structure_json.fields || []
  const hasRepeatable = fields.some(field => field.repeatable && field.repetitions > 0)
  return hasRepeatable
})

// La grille contient-elle des données ? (évite d'afficher une grille vide en édition)
const hasGridData = computed(() => {
  if (!formData.donnees_remplies) return false
  const data = formData.donnees_remplies
  // Vérifier si au moins une clé contient un array avec des données
  return Object.values(data).some(v => Array.isArray(v) && v.length > 0)
})

// Computed pour obtenir les colonnes de la grille
const gridColumns = computed(() => {
  if (!selectedModel.value || !selectedModel.value.structure_json) return []
  const fields = selectedModel.value.structure_json.fields || []
  return fields.map(field => ({
    ...field,
    prop: field.id,
    name: field.label
  }))
})

// Computed pour obtenir le nombre de colonnes pour la grille
const gridSampleColumns = computed(() => {
  if (!selectedModel.value || !selectedModel.value.structure_json) return 1
  const fields = selectedModel.value.structure_json.fields || []
  const maxRepetitions = Math.max(...fields.filter(f => f.repeatable).map(f => f.repetitions || 0), 1)
  return maxRepetitions
})

// Methods
const handleAssignmentTypeChange = () => {
  if (assignmentType.value === 'person') {
    formData.team_assigne = null
  } else {
    formData.operateur_assigne = null
    formData.operateurs_assignes = []
  }
}

const initializeForm = async () => {
  if (props.report) {
    // Edit mode
    // Déterminer le type d'assignation selon les données existantes
    if (props.report.team_assigne) {
      assignmentType.value = 'team'
    } else {
      assignmentType.value = 'person'
    }
    // Sync: if no multi-assign but has single operator, pre-fill the list
    if (!props.report.operateurs_assignes?.length && props.report.operateur_assigne) {
      formData.operateurs_assignes = [props.report.operateur_assigne]
    }
    
    Object.assign(formData, {
      modele: props.report.modele,
      nom: props.report.nom,
      workplace: props.report.workplace,
      machine: props.report.machine,
      workorder: props.report.workorder,
      session: props.report.session,
      operateur_assigne: props.report.operateur_assigne,
      operateurs_assignes: props.report.operateurs_assignes ? [...props.report.operateurs_assignes] : [],
      team_assigne: props.report.team_assigne,
      date_prevue: props.report.date_prevue ? new Date(props.report.date_prevue) : null,
      date_limite: props.report.date_limite ? new Date(props.report.date_limite) : null,
      commentaires: props.report.commentaires || '',
      donnees_remplies: props.report.donnees_remplies ? { ...props.report.donnees_remplies } : {}
    })


    // Load selected model structure if we have a modele ID
    // D'abord vérifier si modele_structure est déjà dans le rapport
    if (props.report.modele_structure && props.report.modele_structure.structure_json) {
      selectedModel.value = props.report.modele_structure
    } else if (props.report.modele) {
      try {
        const modelResult = await documentStore.getModeleById(props.report.modele);
        if (modelResult.success) {
          selectedModel.value = modelResult.data
        }
      } catch (error) {
        console.error('Error loading model structure:', error)
      }
    }
  } else {
    // Create mode
    assignmentType.value = 'person'
    Object.assign(formData, {
      modele: null,
      nom: '',
      workplace: null,
      machine: null,
      workorder: null,
      session: null,
      operateur_assigne: null,
      operateurs_assignes: [],
      team_assigne: null,
      date_prevue: new Date(),
      date_limite: null,
      commentaires: '',
      donnees_remplies: {}
    })
    selectedModel.value = null
  }
}

const loadReferenceData = async () => {
  try {
    const results = await Promise.allSettled([
      documentStore.getModeles({}, true), // Mode light pour chargement rapide des dropdowns
      userStore.getWorkplaces(),
      userStore.getMachines(),
      documentStore.getWorkorders(),
      userStore.getUsers(),
      axiosInstance.get('/teams/teams/')
      // userStore.getSessions() - méthode n'existe pas encore
    ])
    
    
    // Traiter les modèles
    if (results[0].status === 'fulfilled') {
      models.value = documentStore.modeles || []
    } else {
      models.value = []
    }
    
    // Traiter les workplaces
    if (results[1].status === 'fulfilled') {
      workplaces.value = userStore.workplaces || []
    } else {
      workplaces.value = []
    }
    
    // Traiter les machines
    if (results[2].status === 'fulfilled') {
      machines.value = userStore.machines || []
    } else {
      machines.value = []
    }
    
    // Traiter les ordres de fabrication
    if (results[3].status === 'fulfilled') {
      workorders.value = documentStore.workorders || []
    } else {
      workorders.value = []
    }
    
    // Traiter les utilisateurs/opérateurs
    if (results[4].status === 'fulfilled') {
      const result = results[4].value
      let allUsers = []
      
      // Extraire les utilisateurs de la réponse
      if (result && result.users) {
        allUsers = result.users
      } else if (result && result.data) {
        allUsers = result.data.users || result.data.results || result.data || []
      } else if (userStore.users && userStore.users.length > 0) {
        allUsers = userStore.users
      } else {
        // S'assurer que les utilisateurs sont chargés dans le store
        const usersResult = await userStore.getUsers()
        if (usersResult.success && usersResult.users) {
          allUsers = usersResult.users
        }
      }
      
      
      // Si aucun utilisateur n'est disponible, essayer de charger directement
      if (allUsers.length === 0) {
        try {
          const usersResponse = await axiosInstance.get('/accounts/users/')
          const usersData = usersResponse.data.users || usersResponse.data.results || usersResponse.data || []
          allUsers = usersData
          userStore.users = usersData
        } catch (err) {
          operators.value = []
          return
        }
      }
      
      // Filtrer les opérateurs avec plusieurs variantes possibles, mais aussi inclure tous les utilisateurs actifs si aucun opérateur n'est trouvé
      let filteredOperators = allUsers.filter(u => {
        const roleName = (u.role_name || u.role?.role_name || u.role?.name || '').toLowerCase()
        return roleName.includes('operateur') || roleName.includes('opérateur') || roleName === 'operator'
      })
      
      
      // Si aucun opérateur trouvé, utiliser tous les utilisateurs actifs (ou tous si aucun statut)
      if (filteredOperators.length === 0) {
        filteredOperators = allUsers.filter(u => {
          const compteStatus = u.compte_id?.status || u.compte?.status
          return compteStatus === 'ACTIVE' || !compteStatus // Inclure les actifs ou ceux sans statut
        })
      }
      
      // Si toujours aucun, utiliser tous les utilisateurs
      if (filteredOperators.length === 0) {
        filteredOperators = allUsers
      }
      
      operators.value = filteredOperators.map(u => ({
        ...u,
        fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email_address || 'Utilisateur sans nom'
      }))
      
    } else {
      // Essayer de charger directement en cas d'erreur
      try {
        const usersResponse = await axiosInstance.get('/accounts/users/')
        const usersData = usersResponse.data.users || usersResponse.data.results || usersResponse.data || []
        operators.value = usersData.map(u => ({
          ...u,
          fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email_address || 'Utilisateur sans nom'
        }))
      } catch (err) {
        operators.value = []
      }
    }
    
    // Traiter les équipes
    if (results[5].status === 'fulfilled') {
      const response = results[5].value
      teams.value = response.data?.results || response.data || []
    } else {
      teams.value = []
    }
    
    sessions.value = [] // Temporairement vide
  } catch (error) {
    // Initialiser avec des tableaux vides en cas d'erreur
    models.value = []
    workplaces.value = []
    machines.value = []
    operators.value = []
    sessions.value = []
  }
}

const onModelChange = async () => {
  if (formData.modele) {
    const result = await documentStore.getModele(formData.modele);
    if (result.success) {
      selectedModel.value = result.data
      // Initialize form data with default values
      if (selectedModel.value.structure_json && selectedModel.value.structure_json.fields) {
        selectedModel.value.structure_json.fields.forEach(field => {
          if (!formData.donnees_remplies[field.id]) {
            formData.donnees_remplies[field.id] = field.default_value || null
          }
        })
      }
    }
  } else {
    selectedModel.value = null
  }
}

const handleWorkplaceChange = () => {
  // Réinitialiser la machine sélectionnée quand on change de workplace
  formData.machine = null
}

const validateForm = (strict = false) => {
  errors.value = {}
  
  if (!formData.modele) errors.value.modele = 'Le modèle est obligatoire'
  if (!formData.nom) errors.value.nom = 'Le nom est obligatoire'
  if (!formData.workplace) errors.value.workplace = 'Le poste de travail est obligatoire'
  if (!formData.date_prevue) errors.value.date_prevue = 'La date prévue est obligatoire'
  
  if (strict && selectedModel.value && selectedModel.value.structure_json && selectedModel.value.structure_json.fields) {
    selectedModel.value.structure_json.fields.forEach(field => {
      if (field.required && (!formData.donnees_remplies[field.id] || formData.donnees_remplies[field.id] === '')) {
        errors.value[field.id] = `Le champ "${field.label}" est obligatoire`
      }
    })
  }
  
  return Object.keys(errors.value).length === 0
}

// Fonction pour gérer les changements de données dans la grille
const onGridDataChanged = (data) => {
  // Mettre à jour formData.donnees_remplies avec les données de la grille
  formData.donnees_remplies = { ...formData.donnees_remplies, ...data }
}

const saveReport = async () => {
  
  if (!validateForm(false)) {
    const errorMessages = Object.entries(errors.value)
      .map(([key, msg]) => `• ${msg}`)
      .join('\n')
    
    toast.add({
      severity: 'error',
      summary: 'Erreur de validation',
      detail: errorMessages || 'Veuillez remplir les champs obligatoires',
      life: 8000
    })
    return
  }
  
  // L'assignation est optionnelle, mais si un type est sélectionné, on s'assure que la valeur correspondante est définie
  // Si le type est 'person' mais qu'aucun opérateur n'est sélectionné, on met operateur_assigne à null
  // Si le type est 'team' mais qu'aucune équipe n'est sélectionnée, on met team_assigne à null
  
  try {
    saving.value = true
    
    // Préparer les données à envoyer
    const dataToSend = { ...formData }
    
    // S'assurer qu'on assigne soit à une personne, soit à une équipe, pas les deux
    if (assignmentType.value === 'team') {
      dataToSend.operateur_assigne = null
      dataToSend.operateurs_assignes = []
    } else {
      dataToSend.team_assigne = null
      // Sync operateur_assigne = premier de la liste pour compatibilité
      dataToSend.operateur_assigne = dataToSend.operateurs_assignes?.[0] || null
    }
    
    // Convertir les dates au format YYYY-MM-DD
    if (dataToSend.date_prevue instanceof Date) {
      dataToSend.date_prevue = dataToSend.date_prevue.toISOString().split('T')[0]
    }
    if (dataToSend.date_limite instanceof Date) {
      dataToSend.date_limite = dataToSend.date_limite.toISOString().split('T')[0]
    }
    
    // Note: Le créateur est ajouté automatiquement côté backend (request.user)
    // donc pas besoin de l'envoyer depuis le frontend
    
    let result
    if (props.report) {
      result = await documentStore.updateInstance(props.report.id, dataToSend);
    } else {
      result = await documentStore.createInstance(dataToSend);
    }
    
    if (result.success) {
      emit('saved', result.data)
    } else {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: result.error || 'Erreur lors de la sauvegarde',
        life: 5000
      })
    }
  } catch (error) {
    console.error('Error saving report:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la sauvegarde',
      life: 5000
    })
  } finally {
    saving.value = false
  }
}

const submitReport = async () => {
  if (!validateForm(true)) {
    const errorMessages = Object.entries(errors.value)
      .map(([key, msg]) => `• ${msg}`)
      .join('\n')
    
    toast.add({
      severity: 'error',
      summary: 'Document incomplet',
      detail: 'Tous les champs obligatoires doivent être remplis pour soumettre le document.\n\n' + errorMessages,
      life: 10000
    })
    return
  }
  
  
  try {
    saving.value = true

    // Préparer les données à envoyer
    const dataToSend = { ...formData }

    // Assignation
    if (assignmentType.value === 'team') {
      dataToSend.operateur_assigne = null
      dataToSend.operateurs_assignes = []
    } else {
      dataToSend.team_assigne = null
      dataToSend.operateur_assigne = dataToSend.operateurs_assignes?.[0] || null
    }

    // Convertir les dates au format YYYY-MM-DD
    if (dataToSend.date_prevue instanceof Date) {
      dataToSend.date_prevue = dataToSend.date_prevue.toISOString().split('T')[0]
    }
    if (dataToSend.date_limite instanceof Date) {
      dataToSend.date_limite = dataToSend.date_limite.toISOString().split('T')[0]
    }

    // Note: Le créateur est ajouté automatiquement côté backend (request.user)
    // donc pas besoin de l'envoyer depuis le frontend

    // First save the report
    let result
    if (props.report) {
      result = await documentStore.updateInstance(props.report.id, dataToSend);
    } else {
      result = await documentStore.createInstance(dataToSend);
    }
    
    if (result.success) {
      // Then submit it
      const submitResult = await documentStore.submitInstance(result.data.id);
      if (submitResult.success) {
        emit('saved', submitResult.data)
      } else {
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: submitResult.error || 'Erreur lors de la soumission',
          life: 5000
        })
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: result.error || 'Erreur lors de la sauvegarde',
        life: 5000
      })
    }
  } catch (error) {
    console.error('Error submitting report:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la soumission',
      life: 5000
    })
  } finally {
    saving.value = false
  }
}

const validateReport = async () => {
  try {
    saving.value = true
    
    const result = await documentStore.validateInstance(props.report.id);
    if (result.success) {
      emit('saved', result.data)
    } else {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: result.error || 'Erreur lors de la validation',
        life: 5000
      })
    }
  } catch (error) {
    console.error('Error validating report:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la validation',
      life: 5000
    })
  } finally {
    saving.value = false
  }
}

const openGridFullscreen = () => {
  showGridFullscreen.value = true
}

const closeGridFullscreen = () => {
  showGridFullscreen.value = false
}


// Lifecycle
onMounted(() => {
  drawerVisible.value = props.visible
  if (props.visible) {
    initializeForm()
    loadReferenceData()
  }
})

// Watchers
watch(() => props.visible, (visible) => {
  drawerVisible.value = visible
  if (visible) {
    initializeForm()
    loadReferenceData()
  }
}, { immediate: true })

watch(drawerVisible, (newValue) => {
  if (!newValue) {
    emit('close')
  }
})

watch(() => props.report, (newReport) => {
  if (props.visible) {
    initializeForm()
  }
})
</script>

<style scoped>
/* ── Dialog override ── */
:deep(.report-modal-dialog .p-dialog-content) {
  padding: 1rem 1.5rem;
  overflow-y: auto;
}

:deep(.report-modal-dialog .p-dialog-header) {
  padding: 1.125rem 1.5rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

:deep(.report-modal-dialog .p-dialog-footer) {
  padding: 0.875rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #fff;
}

/* ── Header ── */
.modal-header-with-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.status-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-draft                          { background: #f1f5f9; color: #64748b; }
.status-in_progress, .status-published { background: #eff6ff; color: #3B82F6; }
.status-submitted                      { background: #fff7ed; color: #ea580c; }
.status-pending_validation             { background: #fefce8; color: #b45309; }
.status-validated                      { background: #f0fdf4; color: #7AC943; }
.status-rejected, .status-expired      { background: #fef2f2; color: #dc2626; }
.status-archived, .status-cancelled    { background: #f8fafc; color: #94a3b8; }

/* ── Form layout ── */
.report-form { padding: 0; }

.form-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Field groups ── */
.field-group {
  padding: 1rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.field-group:first-child { padding-top: 0.25rem; }
.field-group:last-child { border-bottom: none; padding-bottom: 0.25rem; }

.group-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
}

.group-label i {
  color: #7AC943;
  font-size: 0.8rem;
}

/* ── Form grid ── */
.form-grid {
  display: grid;
  gap: 0.875rem;
}

.form-grid.two-cols {
  grid-template-columns: repeat(2, 1fr);
}

/* ── Form fields ── */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.form-field label {
  font-weight: 500;
  color: #475569;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.form-field label .required {
  color: #ef4444;
  margin-left: 2px;
}

.field-hint {
  color: #94a3b8;
  font-size: 0.78rem;
  font-style: italic;
}

/* ── Assignment toggle ── */
.assignment-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 1rem;
  padding: 3px;
  background: #f1f5f9;
  border-radius: 7px;
  width: fit-content;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.875rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 500;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toggle-btn:hover:not(:disabled) { background: rgba(255,255,255,0.6); }

.toggle-btn.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.toggle-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Grid group ── */
.grid-group { padding: 1.25rem 0; }

.grid-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.grid-container {
  width: 100%;
  max-height: 420px;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.grid-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.grid-fullscreen-container { width: 100%; overflow: hidden; }

/* ── Workorder option ── */
.workorder-option { display: flex; flex-direction: column; gap: 1px; padding: 0.2rem 0; }
.wo-reference { font-weight: 600; color: #1e293b; font-size: 0.875rem; }
.wo-product { font-size: 0.8rem; color: #64748b; }
.wo-progress { font-size: 0.78rem; color: #7AC943; font-weight: 500; }

/* ── Footer ── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
}

.btn-cancel { color: #64748b !important; }
.btn-cancel:hover { background: #f1f5f9 !important; }

.btn-secondary {
  background: #f1f5f9 !important;
  border-color: #e2e8f0 !important;
  color: #475569 !important;
}

.btn-validate { background: #7AC943 !important; border-color: #7AC943 !important; }
.btn-validate:hover { background: #6bb835 !important; border-color: #6bb835 !important; }

.btn-submit { background: #f8fafc !important; border-color: #e2e8f0 !important; color: #475569 !important; }
.btn-submit:hover { background: #f1f5f9 !important; }

.btn-save { background: #7AC943 !important; border-color: #7AC943 !important; color: white !important; }
.btn-save:hover { background: #6bb835 !important; border-color: #6bb835 !important; }

/* ── Form inputs ── */
.form-field :deep(.p-inputtext),
.form-field :deep(.p-select),
.form-field :deep(.p-multiselect),
.form-field :deep(.p-textarea),
.form-field :deep(.p-datepicker) { width: 100%; }

.form-field :deep(.p-inputtext),
.form-field :deep(.p-select),
.form-field :deep(.p-multiselect),
.form-field :deep(.p-textarea) {
  border-radius: 7px;
  border-color: #e2e8f0;
  font-size: 0.875rem;
  transition: all 0.15s ease;
}


.form-field :deep(.p-inputtext:focus),
.form-field :deep(.p-select:focus),
.form-field :deep(.p-multiselect:focus),
.form-field :deep(.p-textarea:focus) {
  border-color: #7AC943;
  box-shadow: 0 0 0 2px rgba(122, 201, 67, 0.15);
}

.form-field :deep(.p-multiselect-chip) {
  background: rgba(122, 201, 67, 0.12) !important;
  color: #1e293b !important;
  font-size: 0.78rem !important;
}

.form-field :deep(.p-error) { color: #ef4444; font-size: 0.78rem; margin-top: 0.2rem; }
.form-field :deep(.p-invalid) { border-color: #ef4444 !important; }

/* DatePicker */
.form-field :deep(.p-datepicker) { width: 100%; }
.form-field :deep(.p-datepicker-input) {
  border-radius: 7px !important;
  border-color: #e2e8f0 !important;
  font-size: 0.875rem !important;
  transition: all 0.15s ease !important;
}
.form-field :deep(.p-datepicker-input:focus) {
  border-color: #7AC943 !important;
  box-shadow: 0 0 0 2px rgba(122, 201, 67, 0.15) !important;
}
.form-field :deep(.p-datepicker-trigger) {
  background: transparent !important;
  border: none !important;
  color: #64748b !important;
}
.form-field :deep(.p-datepicker-trigger:hover) { color: #7AC943 !important; }

/* ── Responsive ── */
@media (max-width: 680px) {
  .form-grid.two-cols { grid-template-columns: 1fr; }

  .assignment-toggle { width: 100%; }
  .toggle-btn { flex: 1; justify-content: center; }

  .modal-footer {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .modal-footer .p-button {
    flex: 1;
    min-width: 0;
    justify-content: center;
  }

  :deep(.report-modal-dialog .p-dialog-content) {
    padding: 0.75rem 1rem;
  }
  :deep(.report-modal-dialog .p-dialog-header),
  :deep(.report-modal-dialog .p-dialog-footer) {
    padding: 0.875rem 1rem;
  }
}
</style> 