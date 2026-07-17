<template>
  <Dialog 
    :visible="visible" 
    :modal="true" 
    :closable="true"
    :closeOnEscape="true"
    :dismissableMask="true"
    :header="task ? `Remplir: ${task.nom}` : 'Remplir la tâche'"
    :style="{ width: '90vw', maxWidth: '1200px' }"
    :breakpoints="{ '1199px': '95vw', '575px': '98vw' }"
    @update:visible="$emit('close')"
    class="task-fill-modal"
  >
    <div v-if="task" class="task-fill-content">
      <!-- Informations de la tâche -->
      <div class="task-info-section">
        <div class="info-grid">
          <div class="info-item">
            <label>Modèle:</label>
            <span>{{ task.modele_code }}</span>
          </div>
          <div class="info-item">
            <label>Site:</label>
            <span>{{ task.site_name }}</span>
          </div>
          <div class="info-item">
            <label>Priorité:</label>
            <Tag :value="getPriorityLabel(task.priority)" :severity="getPrioritySeverity(task.priority)" />
          </div>
          <div class="info-item">
            <label>Échéance:</label>
            <span>{{ formatDate(task.date_limite) }}</span>
          </div>
        </div>
      </div>

      <!-- Formulaire dynamique -->
      <div v-if="task.modele_structure" class="form-section">
        <h3>Données à remplir</h3>
        
        <form @submit.prevent="saveTask" class="dynamic-form">
          <div class="form-fields">
            <div 
              v-for="field in task.modele_structure.fields" 
              :key="field.id"
              class="form-field"
            >
              <label :for="field.id">
                {{ field.label }}
                <span v-if="field.required" class="required-indicator">*</span>
              </label>
              
              <!-- Champ texte -->
              <InputText 
                v-if="field.type === 'TEXT'"
                :id="field.id"
                v-model="formData[field.id]"
                :placeholder="field.help || `Saisir ${field.label.toLowerCase()}`"
                :class="{ 'p-invalid': errors[field.id] }"
                :required="field.required"
              />
              
              <!-- Champ nombre -->
              <InputNumber 
                v-else-if="field.type === 'NUMBER'"
                :id="field.id"
                v-model="formData[field.id]"
                :placeholder="field.help || `Saisir ${field.label.toLowerCase()}`"
                :class="{ 'p-invalid': errors[field.id] }"
                :required="field.required"
                :min="field.constraints?.min"
                :max="field.constraints?.max"
              />
              
              <!-- Champ date -->
              <DatePicker 
                v-else-if="field.type === 'DATE'"
                :id="field.id"
                v-model="formData[field.id]"
                dateFormat="dd/mm/yy"
                :placeholder="field.help || `Sélectionner ${field.label.toLowerCase()}`"
                :class="{ 'p-invalid': errors[field.id] }"
                :required="field.required"
                showIcon
              />
              
              <!-- Champ liste déroulante -->
              <Select 
                v-else-if="field.type === 'SELECT'"
                :id="field.id"
                v-model="formData[field.id]"
                :options="field.options"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner une option"
                :class="{ 'p-invalid': errors[field.id] }"
                :required="field.required"
              />
              
              <!-- Champ case à cocher -->
              <Checkbox 
                v-else-if="field.type === 'CHECKBOX'"
                :id="field.id"
                v-model="formData[field.id]"
                :binary="true"
                :required="field.required"
              />
              
              <!-- Champ zone de texte -->
              <Textarea 
                v-else-if="field.type === 'TEXTAREA'"
                :id="field.id"
                v-model="formData[field.id]"
                :placeholder="field.help || `Saisir ${field.label.toLowerCase()}`"
                :class="{ 'p-invalid': errors[field.id] }"
                :required="field.required"
                rows="3"
              />
              
              <small v-if="errors[field.id]" class="p-error">{{ errors[field.id] }}</small>
              <small v-if="field.help" class="p-help">{{ field.help }}</small>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="form-actions">
            <Button 
              type="button" 
              label="Annuler" 
              severity="secondary" 
              @click="$emit('close')"
              text
            />
            <Button 
              type="button" 
              label="Sauvegarder" 
              @click="saveDraft"
              :loading="saving"
              severity="secondary"
            />
            <Button 
              type="submit" 
              label="Soumettre" 
              :loading="submitting"
              :disabled="!isFormValid"
            />
          </div>
        </form>
      </div>
      
      <!-- État vide -->
      <div v-else class="empty-state">
        <i class="pi pi-exclamation-triangle empty-icon"></i>
        <h3>Structure non disponible</h3>
        <p>La structure du formulaire n'est pas disponible pour cette tâche.</p>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useDocumentStore } from '../../documents/stores/documentStore'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'task-filled'])

const toast = useToast()
const documentStore = useDocumentStore()

// État réactif
const formData = ref({})
const errors = ref({})
const saving = ref(false)
const submitting = ref(false)

// Computed
const isFormValid = computed(() => {
  if (!props.task?.modele_structure?.fields) return false
  
  return props.task.modele_structure.fields.every(field => {
    if (!field.required) return true
    const value = formData.value[field.id]
    return value !== null && value !== undefined && value !== ''
  })
})

// Méthodes
const initializeForm = () => {
  if (!props.task) return
  
  // Initialiser avec les données existantes ou vides
  const initialData = {}
  
  if (props.task.modele_structure?.fields) {
    props.task.modele_structure.fields.forEach(field => {
      // Utiliser les données existantes ou une valeur par défaut
      initialData[field.id] = props.task.donnees_remplies?.[field.id] || getDefaultValue(field)
    })
  }
  
  formData.value = initialData
  errors.value = {}
}

const getDefaultValue = (field) => {
  switch (field.type) {
    case 'CHECKBOX':
      return false
    case 'NUMBER':
      return null
    case 'SELECT':
      return null
    case 'DATE':
      return null
    default:
      return ''
  }
}

const validateForm = () => {
  errors.value = {}
  
  if (!props.task?.modele_structure?.fields) return false
  
  let isValid = true
  
  props.task.modele_structure.fields.forEach(field => {
    const value = formData.value[field.id]
    
    // Validation des champs requis
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.value[field.id] = `${field.label} est obligatoire`
      isValid = false
    }
    
    // Validation des contraintes numériques
    if (field.type === 'NUMBER' && value !== null && value !== undefined) {
      if (field.constraints?.min !== undefined && value < field.constraints.min) {
        errors.value[field.id] = `La valeur doit être supérieure ou égale à ${field.constraints.min}`
        isValid = false
      }
      if (field.constraints?.max !== undefined && value > field.constraints.max) {
        errors.value[field.id] = `La valeur doit être inférieure ou égale à ${field.constraints.max}`
        isValid = false
      }
    }
  })
  
  return isValid
}

const saveDraft = async () => {
  try {
    saving.value = true
    
    const result = await documentStore.updateTask(props.task.id, {
      donnees_remplies: formData.value,
      status: 'DRAFT'
    })
    
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Brouillon sauvegardé',
        life: 3000
      })
      emit('task-filled')
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder le brouillon',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const saveTask = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'error',
      summary: 'Erreur de validation',
      detail: 'Veuillez corriger les erreurs dans le formulaire',
      life: 3000
    })
    return
  }
  
  try {
    submitting.value = true
    
    const result = await documentStore.updateTask(props.task.id, {
      donnees_remplies: formData.value,
      status: 'PENDING_VALIDATION'
    })
    
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Tâche soumise avec succès',
        life: 3000
      })
      emit('task-filled')
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de soumettre la tâche',
      life: 3000
    })
  } finally {
    submitting.value = false
  }
}

// Utilitaires
const getPriorityLabel = (priority) => {
  const labels = {
    'LOW': 'Basse',
    'NORMAL': 'Normale',
    'HIGH': 'Haute',
    'URGENT': 'Urgente'
  }
  return labels[priority] || priority
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

const formatDate = (date) => {
  if (!date) return 'Non définie'
  return new Date(date).toLocaleDateString('fr-FR')
}

// Watchers
watch(() => props.task, () => {
  if (props.task) {
    initializeForm()
  }
}, { immediate: true })

watch(() => props.visible, (newValue) => {
  if (newValue && props.task) {
    initializeForm()
  }
})
</script>

<style scoped>
.task-fill-content {
  max-height: 70vh;
  overflow-y: auto;
}

.task-info-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.info-item span {
  color: #6b7280;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
}

.dynamic-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required-indicator {
  color: #ef4444;
  font-weight: bold;
}

.p-error {
  color: #ef4444;
  font-size: 0.875rem;
}

.p-help {
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

:deep(.p-inputtext),
:deep(.p-inputnumber),
:deep(.p-datepicker),
:deep(.p-select),
:deep(.p-textarea) {
  width: 100%;
}

:deep(.p-checkbox) {
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .form-fields {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style> 