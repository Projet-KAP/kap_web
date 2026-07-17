<template>
  <div class="model-modal-wrapper">
    <Dialog
      v-model:visible="drawerVisible"
      :modal="true"
      :closable="true"
      :closeOnEscape="true"
      :dismissableMask="!structureFullscreenMode"
      :style="structureFullscreenMode
        ? { width: '100vw', height: '100vh', maxHeight: '100vh', margin: 0, borderRadius: 0 }
        : { width: 'min(860px, 95vw)' }"
      :contentStyle="structureFullscreenMode
        ? { padding: 0, height: 'calc(100vh - 120px)', overflow: 'hidden' }
        : { padding: 0, maxHeight: '75vh', overflowY: 'auto' }"
      :class="['model-modal-dialog', { 'model-modal-fullscreen': structureFullscreenMode }]"
    >
      <template #header>
        <div class="modal-header-with-action">
          <span class="modal-title">{{ structureFullscreenMode ? `Éditeur de structure - ${formData.nom || 'Nouveau modèle'}` : (model ? `Modifier le modèle - Tag & KPI` : `Nouveau modèle - Tag & KPI`) }}</span>
        </div>
      </template>
    <!-- Vue normale du formulaire -->
    <form v-if="!structureFullscreenMode" @submit.prevent="saveModel" class="model-form">
      <div class="form-content">

        <!-- Informations de base -->
        <div class="form-section">
          <h3>Informations de base</h3>

          <div class="form-grid">
            <div class="form-field">
              <label for="name">Nom du modèle *</label>
              <InputText
                id="name"
                v-model="formData.nom"
                placeholder="Ex: Rapport de production journalier"
                :class="{ 'p-invalid': errors.nom }"
              />
              <small v-if="errors.nom" class="p-error">{{ errors.nom }}</small>
            </div>
            <div class="form-field">
              <label for="code">Code unique *</label>
              <InputText
                id="code"
                v-model="formData.code_interne"
                placeholder="Ex: PROD_DAILY_001"
                :class="{ 'p-invalid': errors.code_interne }"
              />
              <small v-if="errors.code_interne" class="p-error">{{ errors.code_interne }}</small>
            </div>
          </div>

          <div class="form-grid three-cols">
            <div class="form-field">
              <label for="type">Type de document *</label>
              <Select
                id="type"
                v-model="formData.document_type"
                :options="documentTypeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un type"
                :class="{ 'p-invalid': errors.document_type }"
              />
              <small v-if="errors.document_type" class="p-error">{{ errors.document_type }}</small>
            </div>
            <div class="form-field">
              <label for="version">Version</label>
              <InputText
                id="version"
                v-model="formData.version"
                readonly
                class="field-readonly"
              />
              <small class="field-hint">Auto-incrémentée</small>
            </div>
            <div class="form-field">
              <label for="max_rows">Nb. max de lignes *</label>
              <InputNumber
                id="max_rows"
                v-model="formData.max_rows"
                :min="1"
                :max="1000"
                placeholder="10"
                :class="{ 'p-invalid': errors.max_rows }"
              />
              <small v-if="errors.max_rows" class="p-error">{{ errors.max_rows }}</small>
            </div>
          </div>

          <div class="form-field">
            <label for="description">Description</label>
            <Textarea
              id="description"
              v-model="formData.description"
              rows="2"
              placeholder="Description du modèle..."
              autoResize
            />
          </div>
        </div>

        <!-- Périmètre d'application -->
        <div class="form-section">
          <h3>Périmètre d'application</h3>

          <div class="form-grid three-cols">
            <div class="form-field">
              <label for="site">Site principal *</label>
              <Select
                id="site"
                v-model="formData.site" 
                :options="sites" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Sélectionner un site"
                :class="{ 'p-invalid': errors.site }"
              />
              <small v-if="errors.site" class="p-error">{{ errors.site }}</small>
            </div>
            
            <div class="form-field">
              <label>Postes applicables</label>
              <MultiSelect 
                v-model="formData.workplaces" 
                :options="workplaces" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Sélectionner les postes"
                display="chip"
              />
            </div>
            
            <div class="form-field">
              <label>Machines applicables</label>
              <MultiSelect 
                v-model="formData.machines" 
                :options="machines" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Sélectionner les machines"
                display="chip"
              />
            </div>
          </div>
        </div>

        <!-- Structure du formulaire -->
        <div class="form-section">
          <h3>Structure du formulaire</h3>
          
          <div v-if="!structureFullscreenMode" class="structure-start-container">
            <div v-if="hasStructure" class="structure-summary">
              <div class="summary-content">
                <i class="pi pi-check-circle"></i>
                <div>
                  <strong>Structure définie</strong>
                  <p v-if="columnGroups.length > 0">
                    {{ columnGroups.length }} groupe(s) de colonnes configuré(s)
                  </p>
                  <p v-else-if="formFields.length > 0">
                    {{ formFields.length }} champ(s) défini(s)
                  </p>
                  <p v-else>
                    Structure vide
                  </p>
                </div>
              </div>
              <Button
                label="Modifier la structure"
                icon="pi pi-pencil"
                @click="structureFullscreenMode = true"
                class="p-button-secondary"
              />
            </div>
            
            <div v-else class="structure-empty-state">
              <i class="pi pi-sitemap"></i>
              <h4>Définir la structure du formulaire</h4>
              <p>Créez les champs et colonnes qui seront utilisés dans ce modèle de document.</p>
              <Button
                label="Commencer la création"
                icon="pi pi-arrow-right"
                @click="structureFullscreenMode = true"
                class="p-button-primary p-button-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </form>

    <!-- Vue plein écran de l'éditeur de structure -->
    <div v-if="structureFullscreenMode" class="structure-editor-fullscreen">
      <div class="editor-toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">Structure</span>
          <span class="toolbar-badge">{{ formFields.length + columnGroups.filter(g => !g.parent_group).length }} élément{{ (formFields.length + columnGroups.filter(g => !g.parent_group).length) > 1 ? 's' : '' }}</span>
        </div>
        <div class="toolbar-right">
          <Button label="Champ simple" icon="pi pi-plus" @click="addField" size="small" />
          <Button label="Groupe de colonnes" icon="pi pi-sitemap" @click="addColumnGroup" size="small" outlined />
          <Button icon="pi pi-eye" @click="previewStructure" size="small" outlined v-tooltip.left="'Prévisualiser'" />
        </div>
      </div>

      <!-- Liste combinée des champs simples et groupes -->
      <div class="structure-editor-content">
        <!-- Champs simples -->
        <div v-if="formFields.length > 0" class="fields-section">
          <h4 class="section-title">
            <i class="pi pi-list"></i>
            Champs simples
          </h4>
          <div class="fields-list">
        <div
          v-for="(field, index) in formFields"
          :key="index"
          class="field-item"
        >
          <div class="field-header">
            <div class="field-header-left">
              <span class="field-index">{{ index + 1 }}</span>
              <span class="field-title">{{ field.label || 'Champ sans nom' }}</span>
              <span v-if="field.type" class="field-type-badge">{{ fieldTypeOptions.find(o => o.value === field.type)?.label || field.type }}</span>
            </div>
            <Button
              icon="pi pi-trash"
              @click="removeField(index)"
              text
              severity="danger"
              size="small"
            />
          </div>

          <div class="field-form">
            <div class="form-grid">
              <div class="form-field">
                <label>Libellé</label>
                <InputText
                  v-model="field.label"
                  placeholder="Libellé du champ"
                />
              </div>

              <div class="form-field">
                <label>Type</label>
                <Select
                  v-model="field.type"
                  :options="fieldTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Type de champ"
                />
              </div>

              <div class="form-field">
                <label>Identifiant</label>
                <InputText
                  v-model="field.id"
                  placeholder="Identifiant unique"
                />
              </div>

              <div class="form-field">
                <label>Obligatoire</label>
                <div class="checkbox-field">
                  <Checkbox
                    v-model="field.required"
                    :binary="true"
                  />
                  <label>Champ obligatoire</label>
                </div>
              </div>

              <div class="form-field full-width-field">
                <label>
                  Répétitions (Colonnes)
                  <i class="pi pi-info-circle info-icon" title="Les répétitions permettent de créer plusieurs colonnes identiques pour un même champ. Par exemple, pour des relevés horaires, vous pouvez créer 4 colonnes 'Horaire 1', 'Horaire 2', etc."></i>
                </label>
                <div class="repetitions-control">
                  <div class="checkbox-field">
                    <Checkbox
                      v-model="field.repeatable"
                      :binary="true"
                    />
                    <label>Générer plusieurs colonnes identiques</label>
                  </div>
                  <div v-if="field.repeatable" class="repetitions-settings">
                    <div class="settings-row">
                      <div class="setting-item">
                        <label>Nombre de colonnes</label>
                        <InputNumber
                          v-model="field.repetitions"
                          :min="1"
                          :max="12"
                          placeholder="4"
                          class="compact-input"
                        />
                        <small>Nombre de colonnes identiques à générer</small>
                      </div>
                      <div class="setting-item">
                        <label>Libellé des colonnes</label>
                        <InputText
                          v-model="field.repetition_label"
                          placeholder="Horaire, Point, Machine..."
                          class="compact-input"
                        />
                        <small>Nom de base pour chaque colonne</small>
                      </div>
                    </div>
                    <div class="repetition-preview">
                      <div class="preview-header">
                        <i class="pi pi-table"></i>
                        <span>Aperçu du tableau généré</span>
                      </div>
                      <div class="preview-table">
                        <div class="preview-row">
                          <div class="preview-cell header">{{ field.label || 'Libellé du champ' }}</div>
                          <div
                            v-for="i in Math.max(1, parseInt(field.repetitions) || 1)"
                            :key="i"
                            class="preview-cell"
                          >
                            {{ (field.repetition_label || 'Colonne') }} {{ i }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="field.type === 'SELECT' || field.type === 'MULTISELECT'" class="form-field">
              <label>Options</label>
              <InputText
                v-model="field.options"
                placeholder="Option 1, Option 2, Option 3..."
              />
              <small>Entrez les options séparées par des virgules</small>
            </div>

            <div class="form-field">
              <label>Aide</label>
              <InputText
                v-model="field.help"
                placeholder="Texte d'aide pour l'utilisateur"
              />
            </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Groupes de colonnes -->
      <div v-if="columnGroups.length > 0" class="column-groups-section">
        <h4 class="section-title">
          <i class="pi pi-sitemap"></i>
          Groupes de colonnes
        </h4>
        <div class="groups-list">
          <div
            v-for="(group, index) in rootGroups"
            :key="group.field_id"
            class="group-item"
          >
            <div class="field-header">
              <div class="field-header-left">
                <span class="field-index group-index">{{ index + 1 }}</span>
                <span class="field-title">{{ group.label || 'Groupe sans nom' }}</span>
                <span class="field-type-badge field-type-badge--group">Groupe</span>
              </div>
              <Button
                icon="pi pi-trash"
                @click="removeGroup(group.field_id)"
                text
                severity="danger"
                size="small"
              />
            </div>

            <div class="field-form">
              <div class="form-grid">
                <div class="form-field">
                  <label>Libellé</label>
                  <InputText
                    v-model="group.label"
                    placeholder="Libellé du groupe"
                  />
                </div>

                <div class="form-field">
                  <label>Identifiant</label>
                  <InputText
                    v-model="group.field_id"
                    placeholder="Identifiant unique"
                  />
                </div>

                <div class="form-field">
                  <label>Nombre de colonnes (span)</label>
                  <InputNumber
                    v-model="group.column_span"
                    :min="0"
                    :max="50"
                    @update:model-value="updateGroupSpan(group)"
                  />
                  <small class="field-hint">Nombre de colonnes enfants (sera créé automatiquement)</small>
                </div>

                <div class="form-field">
                  <label>Ordre d'affichage</label>
                  <InputNumber
                    v-model="group.group_order"
                    :min="0"
                  />
                  <small class="field-hint">Ordre de gauche à droite</small>
                </div>
              </div>

              <!-- Section enfants du groupe -->
              <div class="group-children-section">
                <div class="children-header">
                  <span>Enfants du groupe</span>
                  <div class="children-actions">
                    <Button
                      label="Ajouter sous-groupe"
                      icon="pi pi-folder-plus"
                      @click="addChildGroup(group)"
                      class="p-button-sm p-button-success"
                    />
                    <Button
                      label="Ajouter champ"
                      icon="pi pi-file-plus"
                      @click="addChildField(group)"
                      class="p-button-sm p-button-primary"
                    />
                  </div>
                </div>

                <!-- Gestionnaire d'enfants pour ce groupe -->
        <ColumnGroupManager
                  :model-value="getChildrenOf(group.field_id)"
                  @update:model-value="updateGroupChildren(group.field_id, $event)"
          @change="onColumnGroupsChange"
                  :hide-header="true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message si aucun champ -->
      <div v-if="formFields.length === 0 && columnGroups.length === 0" class="empty-state">
        <i class="pi pi-inbox empty-icon"></i>
        <h4>Aucun champ défini</h4>
        <p>Commencez par ajouter un champ simple ou un groupe de colonnes</p>
      </div>
      </div>
    </div>

    <template #footer>
      <!-- Footer pour le mode normal -->
      <div v-if="!structureFullscreenMode" class="modal-footer">
        <Button
          label="Annuler"
          @click="drawerVisible = false"
          class="p-button-text"
        />
        <Button
          label="Sauvegarder"
          @click="saveModel"
          :loading="saving"
          class="p-button-primary"
        />
      </div>

      <!-- Footer pour le mode plein écran structure -->
      <div v-else class="fullscreen-footer">
        <Button
          label="← Retour au formulaire"
          @click="structureFullscreenMode = false"
          class="p-button-secondary"
          icon="pi pi-arrow-left"
        />
        <Button
          label="Sauvegarder"
          @click="saveModel"
          :loading="saving"
          class="p-button-primary"
          icon="pi pi-check"
          :disabled="!formData.nom || !formData.code_interne || !formData.site"
        />
      </div>
    </template>
  </Dialog>

  <!-- Dialog de prévisualisation de la grille -->
  <Dialog 
    v-model:visible="showPreviewDialog"
    :header="`Aperçu du tableau - ${formData.nom || 'Modèle'} (${previewColumns.filter(c => !c.is_column_group).length} champs)`"
    :style="previewDialogStyle"
    :modal="true"
    :closable="true"
    :draggable="false"
    :resizable="false"
    :breakpoints="{ '1199px': '95vw', '575px': '95vw' }"
    class="preview-dialog"
  >
    <div class="preview-container">
      <CollectGridAG
        v-if="previewColumns.length > 0"
        :columns="previewColumns"
        :readonly="false"
        :initial-data="{}"
        :max-rows="formData.max_rows || 10"
      />
      <div v-else class="no-columns-message">
        <i class="pi pi-info-circle"></i>
        <p>Aucun champ défini. Ajoutez des champs pour voir la grille de prévisualisation.</p>
      </div>
    </div>
    
    <template #footer>
      <Button 
        label="Fermer" 
        @click="showPreviewDialog = false"
        class="p-button-text"
      />
    </template>
  </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useDocumentStore } from '../stores/documentStore'
import { useUserStore } from '../../user/stores/userStore'
import { axiosInstance } from '@/main'
import CollectGridAG from './CollectGridAG.vue'
import ColumnGroupManager from './ColumnGroupManager.vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  model: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'saved'])

// Composables
const toast = useToast()
const documentStore = useDocumentStore()
const userStore = useUserStore()

// Refs
const drawerVisible = ref(false)
const structureFullscreenMode = ref(false)
const saving = ref(false)
const errors = ref({})

// Form data
const formData = reactive({
  nom: '',
  code_interne: '',
  version: '1.0',
  description: '',
  document_type: 'CUSTOM',
  site: null,
  workplaces: [],
  machines: [],
  structure_json: {},
  max_rows: 10
})

// Form fields for structure editor
const formFields = ref([])

// Column groups for advanced structure
const columnGroups = ref([])

// Preview dialog
const showPreviewDialog = ref(false)
const previewColumns = ref([])
const previewSampleColumns = ref(3)


// Vérifier si une structure existe
const hasStructure = computed(() => {
  return (formFields.value && formFields.value.length > 0) || (columnGroups.value && columnGroups.value.length > 0)
})


// Style fixe pour le dialog de prévisualisation (plus grand et stable)
const previewDialogStyle = computed(() => {
  return {
    width: '90vw',
    height: '85vh',
    maxWidth: '90vw',
    maxHeight: '85vh'
  }
})

// Options
const documentTypeOptions = [
  { label: 'Production journalière', value: 'PRODUCTION_DAILY' },
  { label: 'Maintenance', value: 'MAINTENANCE_SHEET' },
  { label: 'Rapport d\'arrêt', value: 'DOWNTIME_REPORT' },
  { label: 'Contrôle qualité', value: 'QUALITY_CHECK' },
  { label: 'Passation d\'équipe', value: 'SHIFT_HANDOVER' },
  { label: 'Inspection sécurité', value: 'SAFETY_INSPECTION' },
  // Nouveaux types pour Africa Bloom
  { label: 'Journal de chantier (JDC)', value: 'JOURNAL_CHANTIER' },
  { label: 'Suivi génie civil', value: 'GENIE_CIVIL' },
  { label: 'Mouvement de caisse', value: 'CAISSE' },
  { label: 'Bon de commande', value: 'BON_COMMANDE' },
  { label: 'Décompte mensuel', value: 'DECOMPTE' },
  { label: 'Suivi budgétaire', value: 'BUDGET' },
  { label: 'Rapport carburant', value: 'FUEL_REPORT' },
  { label: 'Carnet de bord véhicule', value: 'VEHICLE_LOG' },
  { label: 'Planning travaux', value: 'PLANNING' },
  { label: 'Personnalisé', value: 'CUSTOM' }
]

const fieldTypeOptions = [
  { label: 'Texte libre', value: 'TEXT' },
  { label: 'Nombre', value: 'NUMBER' },
  { label: 'Date', value: 'DATE' },
  { label: 'Date et heure', value: 'DATETIME' },
  { label: 'Liste déroulante', value: 'SELECT' },
  { label: 'Sélection multiple', value: 'MULTISELECT' },
  { label: 'Case à cocher', value: 'CHECKBOX' },
  { label: 'Zone de texte', value: 'TEXTAREA' },
  { label: 'Photo', value: 'PHOTO' },
  { label: 'Signature', value: 'SIGNATURE' }
]



// Data arrays
const sites = ref([])
const workplaces = ref([])
const machines = ref([])

// Methods
const calculateNextVersion = (currentVersion) => {
  if (!currentVersion) return '1.0'
  
  const parts = currentVersion.split('.')
  if (parts.length === 2) {
    const major = parseInt(parts[0]) || 1
    const minor = parseInt(parts[1]) || 0
    return `${major}.${minor + 1}`
  }
  
  return '1.0'
}

const initializeForm = () => {
  if (props.model) {
    // Edit mode - keep current version
    Object.assign(formData, {
      nom: props.model.nom,
      code_interne: props.model.code_interne,
      version: props.model.version,
      description: props.model.description,
      document_type: props.model.document_type,
      site: props.model.site,
      workplaces: props.model.workplaces || [],
      machines: props.model.machines || [],
      structure_json: props.model.structure_json || {},
      max_rows: props.model.max_rows || 10
    })
    
    // Load form fields from structure
    if (props.model.structure_json && props.model.structure_json.fields) {
      // Séparer les champs simples et les groupes de colonnes
      const simpleFields = []
      const groupFields = []
      
      props.model.structure_json.fields.forEach(field => {
        if (field.is_column_group || field.parent_group) {
          // C'est un groupe ou un enfant de groupe
          groupFields.push({
          field_id: field.id,
          label: field.label,
          type: field.type,
          is_column_group: field.is_column_group || false,
          parent_group: field.parent_group || null,
          group_level: field.group_level || 0,
          column_span: field.column_span || 1,
            group_order: field.group_order !== undefined ? field.group_order : (field.order !== undefined ? field.order : 0),
          required: field.required || false,
          repeatable: field.repeatable || false,
          repetitions: field.repetitions || 1,
            repetition_label: field.repetition_label || '',
            help: field.help || '',
            options: field.options || [],
          })
      } else {
          // C'est un champ simple
          simpleFields.push({
          ...field,
            order: field.order !== undefined ? field.order : 0,
          repeatable: field.repeatable || false,
          repetitions: field.repetitions || 1,
          repetition_label: field.repetition_label || '',
            options: field.options ? (Array.isArray(field.options) ? field.options.join(', ') : field.options) : '',
          })
      }
      })
      
      formFields.value = simpleFields
      columnGroups.value = groupFields
    }
    
  } else {
    // Create mode - start with version 1.0
    Object.assign(formData, {
      nom: '',
      code_interne: '',
      version: '1.0',
      description: '',
      document_type: 'CUSTOM',
      site: null,
      workplaces: [],
      machines: [],
      structure_json: {},
      max_rows: 10
    })
    formFields.value = []
    columnGroups.value = []
  }
  
}

const loadReferenceData = async () => {
  try {
    // Charger les données depuis l'API uniquement
    const results = await Promise.allSettled([
      userStore.getSites(),
      userStore.getWorkplaces(),
      userStore.getMachines()
    ])
    
    
    // Traiter les sites
    if (results[0].status === 'fulfilled' && results[0].value && results[0].value.success) {
      sites.value = userStore.sites.map(site => ({
        id: site.id,
        name: site.name,
        client_name: site.client_name || site.client?.name || 'N/A'
      }))
    } else {
      console.error('Failed to load sites from API:', results[0].reason || results[0].value)
      sites.value = []
    }
    
    // Traiter les workplaces
    if (results[1].status === 'fulfilled' && results[1].value && results[1].value.success) {
      workplaces.value = userStore.workplaces.map(wp => ({
        id: wp.id,
        name: wp.name,
        site_name: wp.site?.name || wp.site_name || 'N/A'
      }))
    } else {
      console.error('Failed to load workplaces from API:', results[1].reason || results[1].value)
      workplaces.value = []
    }
    
    // Traiter les machines
    if (results[2].status === 'fulfilled' && results[2].value && results[2].value.success) {
      machines.value = userStore.machines.map(machine => ({
        id: machine.id,
        name: machine.name,
        type: machine.type || 'Machine',
        workplace_name: machine.workplace?.name || machine.workplace_name || 'N/A'
      }))
    } else {
      console.error('Failed to load machines from API:', results[2].reason || results[2].value)
      machines.value = []
    }
    
  } catch (error) {
    console.error('Error loading reference data:', error)
    sites.value = []
    workplaces.value = []
    machines.value = []
  }
}

// Fonction pour générer un identifiant à partir d'un libellé
const generateFieldId = (label) => {
  if (!label) return ''
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '_') // Remplacer les caractères spéciaux par des underscores
    .replace(/^_+|_+$/g, '') // Supprimer les underscores en début/fin
}

const addField = () => {
  formFields.value.push({
    id: '',
    label: '',
    type: 'TEXT',
    required: false,
    help: '',
    options: '',
    repeatable: false,
    repetitions: 1,
    repetition_label: '',
    order: formFields.value.length
  })
}

// Computed: Get root groups (groups without parent)
const rootGroups = computed(() => {
  return columnGroups.value
    .filter(item => item.is_column_group && (!item.parent_group || item.parent_group === null))
    .sort((a, b) => (a.group_order || 0) - (b.group_order || 0))
})

// Helper: Get children of a parent group
const getChildrenOf = (parentId) => {
  return columnGroups.value
    .filter(item => item.parent_group === parentId)
    .sort((a, b) => (a.group_order || 0) - (b.group_order || 0))
}

// Helper: Update children of a group
const updateGroupChildren = (parentId, newChildren) => {
  // Remove old children
  columnGroups.value = columnGroups.value.filter(item => item.parent_group !== parentId)
  // Add new children with correct parent_group
  newChildren.forEach(child => {
    const childCopy = JSON.parse(JSON.stringify(child))
    childCopy.parent_group = parentId
    columnGroups.value.push(childCopy)
  })
}

const addColumnGroup = () => {
  const newGroup = {
    field_id: `group_${Date.now()}`,
    label: 'Nouveau groupe',
    type: 'TEXT',
    is_column_group: true,
    parent_group: null,
    group_level: 0,
    column_span: 0,
    group_order: rootGroups.value.length,
    required: false
  }
  
  columnGroups.value.push(newGroup)
}

const removeGroup = (groupId) => {
  // Remove the group and all its children recursively
  const removeRecursive = (id) => {
    const children = columnGroups.value.filter(item => item.parent_group === id)
    children.forEach(child => removeRecursive(child.field_id))
    columnGroups.value = columnGroups.value.filter(item => item.field_id !== id)
  }
  
  removeRecursive(groupId)
}

const addChildGroup = (parentGroup) => {
  console.log('➕ Adding child group to parent:', parentGroup.field_id)
  const newGroup = {
    field_id: `group_${Date.now()}`,
    label: 'Nouveau sous-groupe',
    type: 'TEXT',
    is_column_group: true,
    parent_group: parentGroup.field_id,
    group_level: (parentGroup.group_level || 0) + 1,
    column_span: 0,
    group_order: getChildrenOf(parentGroup.field_id).length,
    required: false
  }
  
  console.log('➕ New child group:', newGroup)
  columnGroups.value.push(newGroup)
  console.log('➕ columnGroups after push:', columnGroups.value.length)
  console.log('➕ Children of parent:', getChildrenOf(parentGroup.field_id).length, getChildrenOf(parentGroup.field_id))
}

const addChildField = (parentGroup) => {
  console.log('➕ Adding child field to parent:', parentGroup.field_id)
  const newField = {
    field_id: `field_${Date.now()}`,
    label: 'Nouveau champ',
    type: 'TEXT',
    is_column_group: false,
    parent_group: parentGroup.field_id,
    group_level: (parentGroup.group_level || 0) + 1,
    column_span: 1,
    group_order: getChildrenOf(parentGroup.field_id).length,
    required: false,
    repeatable: false,
    repetitions: 1,
    repetition_label: ''
  }
  
  console.log('➕ New child field:', newField)
  columnGroups.value.push(newField)
  console.log('➕ columnGroups after push:', columnGroups.value.length)
  console.log('➕ Children of parent:', getChildrenOf(parentGroup.field_id).length, getChildrenOf(parentGroup.field_id))
}

// Fonction pour mettre à jour automatiquement les colonnes enfants selon le span
const updateGroupSpan = (group) => {
  const currentChildren = getChildrenOf(group.field_id)
  const targetSpan = group.column_span || 0
  
  console.log('🔄 Updating group span:', {
    groupId: group.field_id,
    currentChildren: currentChildren.length,
    targetSpan: targetSpan
  })
  
  // Si le span est supérieur au nombre d'enfants actuels, créer les enfants manquants
  if (targetSpan > currentChildren.length) {
    const childrenToAdd = targetSpan - currentChildren.length
    for (let i = 0; i < childrenToAdd; i++) {
      const newField = {
        field_id: `field_${Date.now()}_${i}`,
        label: `Colonne ${currentChildren.length + i + 1}`,
        type: 'TEXT',
        is_column_group: false,
        parent_group: group.field_id,
        group_level: (group.group_level || 0) + 1,
        column_span: 1,
        group_order: currentChildren.length + i,
        required: false,
        repeatable: false,
        repetitions: 1,
        repetition_label: ''
      }
      columnGroups.value.push(newField)
    }
    console.log(`➕ Created ${childrenToAdd} child fields`)
  }
  // Si le span est inférieur au nombre d'enfants actuels, supprimer les enfants en trop
  else if (targetSpan < currentChildren.length) {
    const childrenToRemove = currentChildren.length - targetSpan
    // Supprimer les derniers enfants
    const childrenToDelete = currentChildren.slice(-childrenToRemove)
    childrenToDelete.forEach(child => {
      // Supprimer récursivement les enfants de ce child s'il s'agit d'un groupe
      if (child.is_column_group) {
        removeGroup(child.field_id)
      } else {
        columnGroups.value = columnGroups.value.filter(item => item.field_id !== child.field_id)
      }
    })
    console.log(`➖ Removed ${childrenToRemove} child fields`)
  }
}

const addColumnGroupOld = () => {
  // Trouver le prochain ordre disponible
  const maxOrder = Math.max(
    ...columnGroups.value.map(g => g.group_order || g.order || 0),
    formFields.value.length - 1,
    -1
  )
  
  const newGroupId = `group_${Date.now()}`
  columnGroups.value.push({
    field_id: newGroupId,
    label: 'Nouveau groupe',
    type: 'GROUP',
    is_column_group: true,
    parent_group: null,
    group_level: 0,
    column_span: 1,
    group_order: maxOrder + 1,
    required: false,
    repeatable: false,
    repetitions: 1,
    repetition_label: '',
    help: '',
    options: []
  })
}

const removeField = (index) => {
  formFields.value.splice(index, 1)
  // Update order
  formFields.value.forEach((field, idx) => {
    field.order = idx
  })
}

const previewStructure = () => {
  const structure = buildStructureJson()
  
  // Utiliser la structure complète qui combine champs simples et groupes
  // Transformer tous les champs (simples et groupes) en colonnes pour la prévisualisation
  const columns = []
  
  // Ajouter tous les champs de la structure (déjà triés par ordre)
  structure.fields.forEach(field => {
    // Ne prendre que les champs qui ne sont pas des groupes (les groupes sont juste des headers)
    // Les enfants des groupes seront inclus
    if (!field.is_column_group) {
    columns.push({
      id: field.id,
      code: field.id,
      label: field.label,
      name: field.label,
      type: field.type,
        required: field.required || false,
        repeatable: field.repeatable || false,
      repetitions: field.repetitions || 1,
      repetition_label: field.repetition_label || field.label,
        width: 150,
        is_column_group: false,
        parent_group: field.parent_group || null,
        group_level: field.group_level || 0,
        group_order: field.group_order || field.order || 0,
        order: field.order || 0
      })
    } else {
      // Pour les groupes, on peut les ajouter aussi pour voir la structure complète
      // mais ils seront traités différemment dans CollectGridEnhanced
      columns.push({
        id: field.id,
        code: field.id,
        label: field.label,
        name: field.label,
        type: field.type,
        required: field.required || false,
        repeatable: false,
        repetitions: 1,
        width: 150,
        is_column_group: true,
        parent_group: field.parent_group || null,
        group_level: field.group_level || 0,
        group_order: field.group_order || field.order || 0,
        order: field.order || 0
      })
    }
  })
  
  previewColumns.value = columns
  
  // Pour la prévisualisation avec groupes, on utilise CollectGridEnhanced qui gère les groupes
  // Pas besoin de sampleColumns pour les groupes car ils ont leur propre structure
  previewSampleColumns.value = 1
  
  showPreviewDialog.value = true
}

const buildStructureJson = () => {
  // Combiner les champs simples et les groupes de colonnes
  const allFields = []

  // Ajouter les champs simples
  formFields.value.forEach(field => {
    const fieldData = {
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required || false,
      help: field.help || '',
      order: field.order !== undefined ? field.order : 0,
      is_column_group: false,
      parent_group: null
    }

    if (field.options) {
      if (typeof field.options === 'string') {
      fieldData.options = field.options.split(',').map(opt => opt.trim())
    } else if (Array.isArray(field.options)) {
      fieldData.options = field.options
      }
    }

    // Add repetition data if field is repeatable
    if (field.repeatable) {
      fieldData.repeatable = true
      fieldData.repetitions = field.repetitions || 1
      fieldData.repetition_label = field.repetition_label || 'Répétition'
    }

    allFields.push(fieldData)
  })
  
  // Ajouter les groupes de colonnes
  columnGroups.value.forEach(field => {
    const fieldData = {
      id: field.field_id,
      label: field.label,
      type: field.type,
      required: field.required || false,
      help: field.help || '',
      order: field.group_order !== undefined ? field.group_order : (field.order !== undefined ? field.order : 0),
      is_column_group: field.is_column_group || false,
      parent_group: field.parent_group || null,
      group_level: field.group_level || 0,
      column_span: field.column_span || 1,
      group_order: field.group_order !== undefined ? field.group_order : (field.order !== undefined ? field.order : 0)
    }

    if (field.options) {
      if (typeof field.options === 'string') {
      fieldData.options = field.options.split(',').map(opt => opt.trim())
      } else if (Array.isArray(field.options)) {
        fieldData.options = field.options
      }
    }

    // Add repetition data if field is repeatable
    if (field.repeatable) {
      fieldData.repeatable = true
      fieldData.repetitions = field.repetitions || 1
      fieldData.repetition_label = field.repetition_label || 'Répétition'
    }

    allFields.push(fieldData)
  })
  
  // Trier par ordre pour respecter l'ordre défini
  allFields.sort((a, b) => {
    const orderA = a.order !== undefined ? a.order : (a.group_order !== undefined ? a.group_order : 0)
    const orderB = b.order !== undefined ? b.order : (b.group_order !== undefined ? b.group_order : 0)
    return orderA - orderB
  })

  return {
    fields: allFields,
    has_column_groups: columnGroups.value.length > 0,
    version: '1.0',
    created_at: new Date().toISOString(),
  }
}

const validateForm = () => {
  errors.value = {}
  
  if (!formData.nom) errors.value.nom = 'Le nom est obligatoire'
  if (!formData.code_interne) errors.value.code_interne = 'Le code est obligatoire'
  if (!formData.document_type) errors.value.document_type = 'Le type est obligatoire'
  if (!formData.site) errors.value.site = 'Le site principal est obligatoire'
  if (!formData.max_rows || formData.max_rows < 1) errors.value.max_rows = 'Le nombre de lignes doit être au moins 1'
  
  // Validate structure - check for root groups (groups without parent)
  const rootGroupsCount = columnGroups.value.filter(g => !g.parent_group || g.parent_group === null).length
  if (formFields.value.length === 0 && rootGroupsCount === 0) {
    errors.value.structure = 'Au moins un champ simple ou un groupe de colonnes est requis'
  }
  
  console.log('✅ Validation:', {
    formFields: formFields.value.length,
    rootGroups: rootGroupsCount,
    totalGroups: columnGroups.value.length,
    errors: Object.keys(errors.value)
  })
  
  return Object.keys(errors.value).length === 0
}

const saveModel = async () => {
  console.log('💾 saveModel called')
  console.log('💾 formFields:', formFields.value.length, formFields.value)
  console.log('💾 columnGroups:', columnGroups.value.length, columnGroups.value)
  console.log('💾 formData:', formData)
  
  if (!validateForm()) {
    toast.add({
      severity: 'error',
      summary: 'Erreur de validation',
      detail: 'Veuillez corriger les erreurs dans le formulaire',
      life: 5000
    })
    return
  }
  
  try {
    saving.value = true
    console.log('💾 Building structure JSON...')
    
    // Build structure JSON
    formData.structure_json = buildStructureJson()
    console.log('💾 Structure JSON:', formData.structure_json)
    
    // Préparer les données pour l'API
    const submitData = {
      ...formData,
      // Ajouter created_by depuis les données utilisateur connecté
      created_by: JSON.parse(localStorage.getItem('user') || '{}').id,
      // Convertir site simple en array pour sites applicables
      sites: formData.site ? [formData.site] : []
    }
    
    console.log('💾 Submitting data:', submitData)
    
    let result
    if (props.model) {
      // Increment version for existing model
      submitData.version = calculateNextVersion(props.model.version)
      console.log('💾 Updating model:', props.model.id)
      result = await documentStore.updateModele(props.model.id, submitData)
    } else {
      console.log('💾 Creating new model')
      result = await documentStore.createModele(submitData)
    }
    
    console.log('💾 Result:', result)
    
    if (result.success) {
      console.log('✅ Model saved successfully')
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Le modèle a été sauvegardé avec succès',
        life: 3000
      })
      emit('saved', result.data)
      drawerVisible.value = false
    } else {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: result.error || 'Erreur lors de la sauvegarde',
        life: 5000
      })
    }
  } catch (error) {
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

// Lifecycle
const onColumnGroupsChange = (groups) => {
  console.log('Column groups changed:', groups)
  // Column groups are automatically synced via v-model
}

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
  } else {
  }
})

watch(drawerVisible, (newValue) => {
  if (!newValue) {
    emit('close')
  }
})

watch(() => props.model, () => {
  if (props.visible) {
    initializeForm()
  }
})
</script>

<style scoped>
.modal-header-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 1rem;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.model-form {
  padding: 0;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f8fafc;
}

/* Structure summary styles */
.structure-summary {
  padding: 2rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
}

.summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.summary-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.summary-info i {
  font-size: 2rem;
  color: #3b82f6;
}

.summary-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.summary-hint {
  display: block;
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Structure fullscreen mode styles */
.structure-editor-fullscreen {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  position: relative;
}

.structure-editor-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  min-height: 0;
}

.structure-editor-fullscreen .editor-toolbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-bottom: 1rem;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .structure-mode-toggle {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      label {
        font-size: 0.875rem;
        color: #6c757d;
        font-weight: 500;
      }
    }
  }

  .toolbar-right {
    display: flex;
    gap: 0.75rem;
  }
}

.column-groups-fullscreen {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.structure-editor-fullscreen .fields-list {
  max-height: none;
  overflow-y: visible;
  padding: 0;
}

.structure-editor-fullscreen .fields-section {
  margin-bottom: 2rem;
}

.structure-editor-fullscreen .column-groups-section {
  margin-bottom: 2rem;
}

.required-fields-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin: 1rem;
  margin-bottom: 1.5rem;
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: #2c3e50;
    
    i {
      color: #3b82f6;
    }
  }
  
  .required-fields-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    label {
      font-weight: 500;
      font-size: 0.875rem;
      color: #495057;
    }
    
    .p-error {
      color: #dc3545;
      font-size: 0.75rem;
    }
  }
}

.fullscreen-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  padding-right: 100px; /* Espace pour le bouton AI Assistant */
  border-top: 1px solid #e9ecef;
  background: white;
  position: sticky;
  bottom: 0;
  z-index: 10;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-section {
  padding: 1.25rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.form-section:last-child {
  border-bottom: none;
}

.form-section h3 {
  margin: 0 0 1rem 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-section h3::before {
  content: '';
  width: 3px;
  height: 12px;
  background: #7AC943;
  border-radius: 2px;
}

.field-readonly {
  background: #f8fafc !important;
  color: #64748b !important;
}

.field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
}

.structure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #dee2e6;

  h3 {
    margin: 0;
    border-bottom: none;
    padding-bottom: 0;
  }

  .structure-mode-toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    label {
      font-size: 0.875rem;
      color: #6c757d;
      font-weight: 500;
    }
  }
}

.simple-fields-container {
  margin-top: 1rem;
}

.structure-start-container {
  margin-top: 1rem;
}

.structure-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;

  i {
    font-size: 4rem;
    color: #94a3b8;
    margin-bottom: 1.5rem;
  }

  h4 {
    margin: 0 0 0.75rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #2c3e50;
  }

  p {
    margin: 0 0 2rem 0;
    color: #64748b;
    font-size: 1rem;
    max-width: 500px;
  }
}

.structure-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #86efac;

  .summary-content {
    display: flex;
    align-items: center;
    gap: 1rem;

    i {
      font-size: 2rem;
      color: #22c55e;
    }

    strong {
      display: block;
      font-size: 1.1rem;
      color: #166534;
      margin-bottom: 0.25rem;
    }

    p {
      margin: 0;
      color: #15803d;
      font-size: 0.9rem;
    }
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-grid.three-cols {
  grid-template-columns: repeat(3, 1fr);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.full-width-field {
  grid-column: 1 / -1;
}

.form-field label {
  font-weight: 500;
  color: #475569;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-field :deep(.p-inputtext),
.form-field :deep(.p-select),
.form-field :deep(.p-textarea),
.form-field :deep(.p-inputnumber-input) {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  font-size: 0.9rem;
  transition: all 0.2s;
  width: 100%;
}


.form-field :deep(.p-inputtext:focus),
.form-field :deep(.p-select:focus),
.form-field :deep(.p-textarea:focus),
.form-field :deep(.p-inputnumber-input:focus) {
  border-color: #7AC943;
  box-shadow: 0 0 0 3px rgba(122, 201, 67, 0.1);
}

.info-icon {
  color: #6b7280;
  font-size: 0.875rem;
  cursor: help;
  transition: color 0.2s ease;
}

.info-icon:hover {
  color: #3b82f6;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.checkbox-field:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.checkbox-field label {
  margin: 0;
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.repetitions-control {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.repetitions-settings {
  margin-top: 0.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.settings-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.compact-input {
  height: 2.5rem;
}

.compact-input :deep(.p-inputtext) {
  height: 2.5rem;
  font-size: 0.875rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  transition: all 0.2s ease;
}

.compact-input :deep(.p-inputtext):focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.compact-input :deep(.p-inputnumber-input) {
  height: 2.5rem;
  font-size: 0.875rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  transition: all 0.2s ease;
}

.compact-input :deep(.p-inputnumber-input):focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.repetition-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  width: 100%;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.preview-header i {
  color: #3b82f6;
}

.preview-table {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow-x: auto;
  width: 100%;
  min-width: 800px;
}

.preview-row {
  display: flex;
  background: #f8fafc;
  min-width: 100%;
}

.preview-cell {
  flex: 1;
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  border-right: 1px solid #e2e8f0;
  min-width: 150px;
}

.preview-cell:last-child {
  border-right: none;
}

.preview-cell.header {
  background: #3b82f6;
  color: white;
  font-weight: 600;
  flex: 0 0 200px;
  min-width: 200px;
}

.preview-cell:not(.header) {
  background: white;
  color: #64748b;
}

.structure-editor {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: visible;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-toolbar {
  padding: 0.75rem 1.25rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toolbar-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
}

.toolbar-badge {
  font-size: 0.75rem;
  background: #f1f5f9;
  color: #64748b;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-weight: 500;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  border-left: 3px solid #7AC943;
  overflow: hidden;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.field-header-left {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.field-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #7AC943;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.group-index {
  background: #3b82f6;
}

.field-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.field-type-badge {
  font-size: 0.7rem;
  background: #eff6ff;
  color: #3b82f6;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.field-type-badge--group {
  background: #f0fdf4;
  color: #7AC943;
}

.field-form {
  padding: 1rem 1.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

:deep(.model-modal-dialog .p-dialog-content) {
  padding: 1.25rem 1.5rem;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.group-item {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.group-children-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e9ecef;

  .children-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    span {
      font-weight: 600;
      color: #495057;
    }

    .children-actions {
      display: flex;
      gap: 0.5rem;
    }
  }

  .empty-children {
    padding: 1rem;
    text-align: center;
    color: #6c757d;
    font-size: 0.875rem;
    background: #f8f9fa;
    border-radius: 4px;
  }
}

:deep(.model-modal-dialog .p-dialog-body) {
  padding: 0;
}

:deep(.model-modal-dialog .p-dialog-header) {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

:deep(.model-modal-dialog .p-dialog-footer) {
  padding: 0.875rem 1.5rem;
  border-top: 1px solid #e2e8f0;
}

:deep(.model-modal-fullscreen) {
  border-radius: 0 !important;
}

:deep(.model-modal-fullscreen .p-dialog-content) {
  overflow: hidden;
}

:deep(.model-modal-dialog .p-inputtext),
:deep(.model-modal-dialog .p-select),
:deep(.model-modal-dialog .p-multiselect),
:deep(.model-modal-dialog .p-textarea) {
  width: 100%;
}

.form-field :deep(.p-error) {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-field :deep(.p-invalid) {
  border-color: #dc3545;
}

@media (max-width: 768px) {
  .form-grid,
  .form-grid.three-cols {
    grid-template-columns: 1fr;
  }

  .settings-row {
    grid-template-columns: 1fr;
  }

  .form-section {
    padding: 0.75rem 0;
  }

  .field-form {
    padding: 0.875rem;
  }

  .modal-footer,
  .fullscreen-footer {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .modal-footer .p-button,
  .fullscreen-footer .p-button {
    flex: 1;
    min-width: 0;
    justify-content: center;
  }

  .toolbar-right {
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  :deep(.model-modal-dialog .p-dialog-content) {
    padding: 0.875rem 1rem;
    max-height: 80vh;
  }

  :deep(.model-modal-dialog .p-dialog-header),
  :deep(.model-modal-dialog .p-dialog-footer) {
    padding: 0.875rem 1rem;
  }
}

.version-display {
  position: relative;
}

.version-display .p-inputtext {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.version-info {
  display: block;
  color: #9ca3af;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  font-style: italic;
}

/* Preview Dialog Styles */
.preview-dialog :deep(.p-dialog) {
  width: 90vw !important;
  height: 85vh !important;
  min-width: 90vw !important;
  min-height: 85vh !important;
  max-width: 90vw !important;
  max-height: 85vh !important;
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
}

.preview-dialog :deep(.p-dialog-content) {
  padding: 0 !important;
  height: calc(85vh - 60px) !important;
  max-height: calc(85vh - 60px) !important;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.preview-dialog :deep(.p-dialog-header) {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.preview-dialog :deep(.p-dialog-mask) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

.preview-container {
  height: 100%;
  width: 100%;
  padding: 0;
  margin: 0;
  overflow: auto;
}

.no-columns-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  text-align: center;
  gap: 1rem;
}

.no-columns-message i {
  font-size: 3rem;
  color: #007bff;
}

.no-columns-message p {
  font-size: 1.1rem;
  margin: 0;
}

.mes-tags-section {
  border-top: 2px solid #e9ecef;
  padding-top: 2rem;
  margin-top: 2rem;
}


.field-hint {
  color: #6c757d;
  font-size: 0.875rem;
  line-height: 1.6;
  margin-top: 0.5rem;
  display: block;
  padding: 0.5rem 0.75rem;
  background: #ffffff;
  border-left: 3px solid #0ea5e9;
  border-radius: 0.25rem;
}

.field-hint strong {
  color: #475569;
  display: block;
  margin-bottom: 0.25rem;
}

.field-example {
  background: #fef3c7;
  border-left-color: #f59e0b;
}


.structure-tabs {
  :deep(.p-tabview-nav) {
    background: #f8f9fa;
    border-bottom: 2px solid #dee2e6;
  }

  :deep(.p-tabview-nav-link) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    font-weight: 500;

    i {
      font-size: 1rem;
    }
  }

  :deep(.p-tabview-panels) {
    padding: 1.5rem 0;
  }
}

.column-groups-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 600px;

  :deep(.p-message) {
    margin-bottom: 1rem;
  }
}

/* Tags & KPI Styles */
.tags-kpi-tabs {
  margin-top: 1rem;
  
  :deep(.p-tabview-nav) {
    background: #f8f9fa;
    border-bottom: 2px solid #dee2e6;
  }
  
  :deep(.p-tabview-nav-link) {
    padding: 1rem 1.5rem;
    font-weight: 500;
    color: #6c757d;
    
    &:hover {
      color: #3b82f6;
    }
  }
  
  :deep(.p-highlight .p-tabview-nav-link) {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }
  
  :deep(.p-tabview-panels) {
    padding: 1.5rem 0;
  }
}

.section-description {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.tags-tab-content,
.kpi-tab-content {
  padding: 0;
}

.tags-mapping-list,
.kpi-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tag-mapping-item,
.kpi-item {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.mapping-header,
.kpi-header-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.column-info,
.kpi-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  i {
    color: #3b82f6;
    font-size: 1.25rem;
  }
  
  .column-label,
  .kpi-name {
    font-weight: 600;
    color: #2c3e50;
    font-size: 1rem;
  }
}

.column-type-tag,
.kpi-type-tag {
  font-size: 0.75rem;
}

.mapping-form,
.kpi-form {
  margin-top: 1rem;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
  
  .section-description {
    flex: 1;
    margin-bottom: 0;
  }
}

.tag-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  
  .tag-name {
    font-weight: 600;
    color: #2c3e50;
  }
  
  .tag-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .text-xs {
    font-size: 0.75rem;
  }
  
  .text-gray-500 {
    color: #6b7280;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: #6c757d;
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
    color: #94a3b8;
  }
  
  p {
    font-size: 1rem;
    margin: 0;
  }
}
</style> 