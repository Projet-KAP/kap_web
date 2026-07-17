<template>
  <div class="pointage-form">
    <form @submit.prevent="onSubmit">
      <div class="form-grid">
        <!-- Informations personnelles -->
        <div class="form-section">
          <h3>Informations Personnelles</h3>
          <div class="form-grid-2">
            <div class="field-group">
              <label for="nom_personnel">Nom & Prénom *</label>
              <InputText
                id="nom_personnel"
                v-model="formData.nom_personnel"
                :class="{ 'p-invalid': errors.nom_personnel }"
                placeholder="Ex: DIALLO Mamadou"
                required
              />
              <small v-if="errors.nom_personnel" class="p-error">{{ errors.nom_personnel }}</small>
            </div>

            <div class="field-group">
              <label for="fonction">Fonction *</label>
              <Select
                id="fonction"
                v-model="formData.fonction"
                :options="fonctions"
                optionLabel="label"
                optionValue="value"
                :class="{ 'p-invalid': errors.fonction }"
                placeholder="Sélectionner une fonction"
                filter
                required
              />
              <small v-if="errors.fonction" class="p-error">{{ errors.fonction }}</small>
            </div>

            <div class="field-group">
              <label for="corps_etat">Corps d'État</label>
              <InputText
                id="corps_etat"
                v-model="formData.corps_etat"
                placeholder="Ex: Maçon, Électricien, Chauffeur..."
              />
            </div>

            <div class="field-group">
              <label for="date_pointage">Date du Pointage *</label>
              <DatePicker
                id="date_pointage"
                v-model="formData.date_pointage"
                :class="{ 'p-invalid': errors.date_pointage }"
                dateFormat="dd/mm/yy"
                :showIcon="true"
                required
              />
              <small v-if="errors.date_pointage" class="p-error">{{ errors.date_pointage }}</small>
            </div>
          </div>
        </div>

        <!-- Statut et Heures -->
        <div class="form-section">
          <h3>Statut et Heures</h3>
          <div class="form-grid-2">
            <div class="field-group">
              <label>Statut de Présence *</label>
              <div class="presence-toggle">
                <div class="toggle-option" :class="{ active: formData.presence === true }" @click="formData.presence = true">
                  <i class="pi pi-check-circle"></i>
                  <span>Présent</span>
                </div>
                <div class="toggle-option" :class="{ active: formData.presence === false }" @click="formData.presence = false">
                  <i class="pi pi-times-circle"></i>
                  <span>Absent</span>
                </div>
              </div>
            </div>

            <div class="field-group" v-if="formData.presence">
              <label for="heures_travaillees">Heures Travail</label>
              <InputNumber
                id="heures_travaillees"
                v-model="formData.heures_travaillees"
                :min="0"
                :max="24"
                :step="0.5"
                suffix=" h"
                :class="{ 'p-invalid': errors.heures_travaillees }"
              />
              <small v-if="errors.heures_travaillees" class="p-error">{{ errors.heures_travaillees }}</small>
            </div>

            <div class="field-group" v-if="formData.presence">
              <label for="heures_supplementaires">Heures Supplémentaires</label>
              <InputNumber
                id="heures_supplementaires"
                v-model="formData.heures_supplementaires"
                :min="0"
                :max="12"
                :step="0.5"
                suffix=" h"
              />
            </div>

            <div class="field-group">
              <label for="projet">Projet</label>
              <Select
                id="projet"
                v-model="formData.projet"
                :options="projets"
                optionLabel="nom"
                optionValue="id"
                placeholder="Sélectionner un projet"
                filter
                showClear
              />
            </div>
          </div>
        </div>

        <!-- Informations salariales (uniquement si présent) -->
        <div class="form-section" v-if="formData.presence">
          <h3>Informations Salariales</h3>
          <div class="form-grid-2">
            <div class="field-group">
              <label for="salaire_horaire">Salaire Horaire</label>
              <InputNumber
                id="salaire_horaire"
                v-model="formData.salaire_horaire"
                :min="0"
                mode="currency"
                currency="XOF"
                locale="fr-FR"
                :class="{ 'p-invalid': errors.salaire_horaire }"
              />
              <small v-if="errors.salaire_horaire" class="p-error">{{ errors.salaire_horaire }}</small>
            </div>

            <div class="field-group">
              <label for="cout_journalier">Coût Journalier</label>
              <InputNumber
                id="cout_journalier"
                v-model="calculatedCoutJournalier"
                :min="0"
                mode="currency"
                currency="XOF"
                locale="fr-FR"
                disabled
                class="disabled-field"
              />
              <small class="text-gray-500">Calculé automatiquement</small>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-section">
          <h3>Notes</h3>
          <div class="field-group">
            <label for="observations">Observations</label>
            <Textarea
              id="observations"
              v-model="formData.observations"
              rows="3"
              placeholder="Notes ou commentaires sur le pointage..."
            />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <Button
          type="button"
          label="Annuler"
          icon="pi pi-times"
          class="p-button-outlined"
          @click="$emit('cancel')"
        />
        <Button
          type="submit"
          :label="pointage ? 'Mettre à jour' : 'Enregistrer'"
          icon="pi pi-check"
          :loading="loading"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useProjetStore } from '@/stores/projetStore'

const props = defineProps({
  pointage: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'cancel'])

const projetStore = useProjetStore()
const loading = ref(false)
const errors = ref({})

// Liste des fonctions prédéfinies
const fonctions = ref([
  { label: 'Chauffeur', value: 'Chauffeur' },
  { label: 'Conducteur travaux', value: 'Conducteur travaux' },
  { label: 'Chef de chantier', value: 'Chef de chantier' },
  { label: 'Maçon', value: 'Maçon' },
  { label: 'Électricien', value: 'Électricien' },
  { label: 'Plombier', value: 'Plombier' },
  { label: 'Menuisier', value: 'Menuisier' },
  { label: ' ferronnier', value: 'Ferronnier' },
  { label: 'Peintre', value: 'Peintre' },
  { label: 'Carreleur', value: 'Carreleur' },
  { label: 'Manœuvre', value: 'Manœuvre' },
  { label: 'Autre', value: 'Autre' }
])

// Données du formulaire
const formData = ref({
  nom_personnel: '',
  fonction: '',
  corps_etat: '',
  date_pointage: new Date(),
  presence: true,
  heures_travaillees: 8,
  heures_supplementaires: 0,
  salaire_horaire: 0,
  cout_journalier: 0,
  projet: null,
  observations: ''
})

// Computed
const projets = computed(() => projetStore.projets)

const calculatedCoutJournalier = computed(() => {
  if (!formData.value.presence) return 0

  const heuresNormales = formData.value.heures_travaillees || 0
  const heuresSup = formData.value.heures_supplementaires || 0
  const salaireHoraire = formData.value.salaire_horaire || 0

  // Les heures supplémentaires sont majorées à 125%
  const coutNormal = heuresNormales * salaireHoraire
  const coutSupplementaires = heuresSup * salaireHoraire * 1.25

  return Math.round(coutNormal + coutSupplementaires)
})

// Watchers
watch(calculatedCoutJournalier, (newValue) => {
  formData.value.cout_journalier = newValue
})

watch(() => formData.value.presence, (newValue) => {
  if (!newValue) {
    formData.value.heures_travaillees = 0
    formData.value.heures_supplementaires = 0
    formData.value.cout_journalier = 0
  } else {
    formData.value.heures_travaillees = 8
  }
})

// Méthodes
const onSubmit = async () => {
  loading.value = true
  errors.value = {}

  // Validation
  if (!formData.value.nom_personnel.trim()) {
    errors.value.nom_personnel = 'Le nom est obligatoire'
  }

  if (!formData.value.fonction) {
    errors.value.fonction = 'La fonction est obligatoire'
  }

  if (!formData.value.date_pointage) {
    errors.value.date_pointage = 'La date est obligatoire'
  }

  if (formData.value.presence && !formData.value.heures_travaillees) {
    errors.value.heures_travaillees = 'Les heures de travail sont obligatoires si présent'
  }

  if (Object.keys(errors.value).length > 0) {
    loading.value = false
    return
  }

  try {
    // Séparer nom et prénom
    const nomComplet = formData.value.nom_personnel.trim().split(' ')
    const nom = nomComplet[0] || ''
    const prenom = nomComplet.slice(1).join(' ') || ''

    // Transformer les données du frontend vers le format backend
    const dataToSubmit = {
      nom: nom,
      prenom: prenom,
      fonction: formData.value.fonction,
      date: formData.value.date_pointage.toISOString().split('T')[0],
      presence: formData.value.presence ? 'PRESENT' : 'ABSENT',
      heures_travaillees: parseFloat(formData.value.heures_travaillees) || 0,
      heures_supplementaires: parseFloat(formData.value.heures_supplementaires) || 0,
      cout_horaire: parseFloat(formData.value.salaire_horaire) || 0,
      cout_journalier: calculatedCoutJournalier.value,
      projet: formData.value.projet,
      notes: formData.value.observations || ''
    }

    console.log('📝 [POINTAGE FORM] Données à envoyer:', dataToSubmit)
    emit('save', dataToSubmit)
  } catch (error) {
    loading.value = false
  }
}

const initializeForm = () => {
  if (props.pointage) {
    formData.value = {
      nom_personnel: props.pointage.nom_personnel || `${props.pointage.nom || ''} ${props.pointage.prenom || ''}`.trim(),
      fonction: props.pointage.fonction || '',
      corps_etat: props.pointage.corps_etat || '',
      date_pointage: (props.pointage.date_pointage || props.pointage.date) ? new Date(props.pointage.date_pointage || props.pointage.date) : new Date(),
      presence: props.pointage.presence_bool === true || props.pointage.presence === 'PRESENT' || props.pointage.presence === true,
      heures_travaillees: parseFloat(props.pointage.heures_travaillees) || 8,
      heures_supplementaires: parseFloat(props.pointage.heures_supplementaires) || 0,
      salaire_horaire: parseFloat(props.pointage.salaire_horaire || props.pointage.cout_horaire) || 0,
      cout_journalier: parseFloat(props.pointage.cout_journalier || props.pointage.cout_total) || 0,
      projet: props.pointage.projet || props.pointage.projet_id || null,
      observations: props.pointage.observations || props.pointage.notes || ''
    }
  } else {
    formData.value = {
      nom_personnel: '',
      fonction: '',
      corps_etat: '',
      date_pointage: new Date(),
      presence: true,
      heures_travaillees: 8,
      heures_supplementaires: 0,
      salaire_horaire: 0,
      cout_journalier: 0,
      projet: null,
      observations: ''
    }
  }
}

// Cycle de vie
onMounted(async () => {
  await projetStore.loadProjets()
  initializeForm()
})

// Exposer une méthode pour remplir le formulaire depuis le parent
const fillFormData = (data) => {
  formData.value = {
    nom_personnel: data.nom_personnel || `${data.nom || ''} ${data.prenom || ''}`.trim(),
    fonction: data.fonction || '',
    corps_etat: data.corps_etat || '',
    date_pointage: (data.date_pointage || data.date) ? new Date(data.date_pointage || data.date) : new Date(),
    presence: data.presence_bool !== undefined ? data.presence_bool : (data.presence === 'PRESENT' || data.presence === true),
    heures_travaillees: parseFloat(data.heures_travaillees) || 8,
    heures_supplementaires: parseFloat(data.heures_supplementaires) || 0,
    salaire_horaire: parseFloat(data.salaire_horaire || data.cout_horaire) || 0,
    cout_journalier: parseFloat(data.cout_journalier || data.cout_total) || 0,
    projet: data.projet || data.projet_id || null,
    observations: data.observations || data.notes || ''
  }
}

defineExpose({
  fillFormData
})
</script>

<style scoped>
.pointage-form {
  padding: 0;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  background: white;
}

.form-section h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.presence-toggle {
  display: flex;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f9fafb;
}

.toggle-option {
  flex: 1;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
}

.toggle-option:hover {
  background: #f3f4f6;
}

.toggle-option.active {
  background: white;
  color: #059669;
  border: 1px solid #10b981;
  font-weight: 600;
}

.toggle-option.active:first-child {
  border-right: 1px solid #e5e7eb;
}

.toggle-option.active:last-child {
  border-left: 1px solid #e5e7eb;
}

.toggle-option i {
  font-size: 1rem;
}

.disabled-field {
  opacity: 0.7;
  background: #f9fafb !important;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.text-gray-500 {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .form-grid-2 {
    grid-template-columns: 1fr;
  }

  .presence-toggle {
    flex-direction: column;
  }

  .toggle-option.active:first-child,
  .toggle-option.active:last-child {
    border-right: none;
    border-left: none;
  }

  .toggle-option.active:first-child {
    border-bottom: 1px solid #e5e7eb;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>