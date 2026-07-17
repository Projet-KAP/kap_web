<template>
  <div class="chantier-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div class="form-group">
          <label for="code">Code Chantier *</label>
          <InputText 
            id="code"
            v-model="formData.code"
            :class="{ 'p-invalid': errors.code }"
            placeholder="Ex: CH-2025-001"
          />
          <small v-if="errors.code" class="p-error">{{ errors.code }}</small>
        </div>

        <div class="form-group">
          <label for="nom">Nom du Chantier *</label>
          <InputText 
            id="nom"
            v-model="formData.nom"
            :class="{ 'p-invalid': errors.nom }"
            placeholder="Ex: Route Dakar-Thiès"
          />
          <small v-if="errors.nom" class="p-error">{{ errors.nom }}</small>
        </div>

        <div class="form-group full-width">
          <label for="description">Description</label>
          <Textarea 
            id="description"
            v-model="formData.description"
            rows="3"
            placeholder="Description détaillée du chantier"
          />
        </div>

        <div class="form-group">
          <label for="sous_type">Type de Chantier *</label>
          <Select 
            id="sous_type"
            v-model="formData.sous_type"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner le type"
            :class="{ 'p-invalid': errors.sous_type }"
          />
          <small v-if="errors.sous_type" class="p-error">{{ errors.sous_type }}</small>
        </div>

        <div class="form-group">
          <label for="statut">Statut *</label>
          <Select 
            id="statut"
            v-model="formData.statut"
            :options="statutOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner le statut"
            :class="{ 'p-invalid': errors.statut }"
          />
          <small v-if="errors.statut" class="p-error">{{ errors.statut }}</small>
        </div>

        <div class="form-group">
          <label for="ville">Ville</label>
          <InputText 
            id="ville"
            v-model="formData.ville"
            placeholder="Ex: Dakar"
          />
        </div>

        <div class="form-group full-width">
          <label for="adresse">Adresse</label>
          <InputText 
            id="adresse"
            v-model="formData.adresse"
            placeholder="Adresse complète du chantier"
          />
        </div>

        <div class="form-group">
          <label for="latitude">Latitude</label>
          <InputNumber 
            id="latitude"
            v-model="formData.latitude"
            :minFractionDigits="2"
            :maxFractionDigits="7"
            placeholder="14.6928"
          />
        </div>

        <div class="form-group">
          <label for="longitude">Longitude</label>
          <InputNumber 
            id="longitude"
            v-model="formData.longitude"
            :minFractionDigits="2"
            :maxFractionDigits="7"
            placeholder="-17.4467"
          />
        </div>

        <div class="form-group">
          <label for="date_debut_prevue">Date Début Prévue *</label>
          <DatePicker 
            id="date_debut_prevue"
            v-model="formData.date_debut_prevue"
            dateFormat="dd/mm/yy"
            :class="{ 'p-invalid': errors.date_debut_prevue }"
          />
          <small v-if="errors.date_debut_prevue" class="p-error">{{ errors.date_debut_prevue }}</small>
        </div>

        <div class="form-group">
          <label for="date_fin_prevue">Date Fin Prévue *</label>
          <DatePicker 
            id="date_fin_prevue"
            v-model="formData.date_fin_prevue"
            dateFormat="dd/mm/yy"
            :class="{ 'p-invalid': errors.date_fin_prevue }"
          />
          <small v-if="errors.date_fin_prevue" class="p-error">{{ errors.date_fin_prevue }}</small>
        </div>

        <div class="form-group">
          <label for="duree_prevue_jours">Durée Prévue (jours) *</label>
          <InputNumber 
            id="duree_prevue_jours"
            v-model="formData.duree_prevue_jours"
            :min="1"
            :class="{ 'p-invalid': errors.duree_prevue_jours }"
          />
          <small v-if="errors.duree_prevue_jours" class="p-error">{{ errors.duree_prevue_jours }}</small>
        </div>

        <div class="form-group">
          <label for="montant_marche">Montant Marché (FCFA) *</label>
          <InputNumber 
            id="montant_marche"
            v-model="formData.montant_marche"
            :min="0"
            mode="currency"
            currency="XOF"
            locale="fr-FR"
            :class="{ 'p-invalid': errors.montant_marche }"
          />
          <small v-if="errors.montant_marche" class="p-error">{{ errors.montant_marche }}</small>
        </div>

        <div class="form-group">
          <label for="budget_previsionnel">Budget Prévisionnel (FCFA) *</label>
          <InputNumber 
            id="budget_previsionnel"
            v-model="formData.budget_previsionnel"
            :min="0"
            mode="currency"
            currency="XOF"
            locale="fr-FR"
            :class="{ 'p-invalid': errors.budget_previsionnel }"
          />
          <small v-if="errors.budget_previsionnel" class="p-error">{{ errors.budget_previsionnel }}</small>
        </div>

        <div v-if="formData.statut === 'EN_COURS' || formData.statut === 'TERMINE'" class="form-group">
          <label for="date_debut_reelle">Date Début Réelle</label>
          <DatePicker 
            id="date_debut_reelle"
            v-model="formData.date_debut_reelle"
            dateFormat="dd/mm/yy"
          />
        </div>

        <div v-if="formData.statut === 'TERMINE'" class="form-group">
          <label for="date_fin_reelle">Date Fin Réelle</label>
          <DatePicker 
            id="date_fin_reelle"
            v-model="formData.date_fin_reelle"
            dateFormat="dd/mm/yy"
          />
        </div>
      </div>

      <div class="form-actions">
        <Button 
          label="Annuler" 
          severity="secondary"
          outlined
          type="button"
          @click="$emit('cancel')"
        />
        <Button 
          label="Enregistrer" 
          type="submit"
          :loading="loading"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/features/auth/stores/authStore.js'


const props = defineProps({
  chantier: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'cancel'])

const authStore = useAuthStore()
const loading = ref(false)
const errors = ref({})

const formData = ref({
  code: '',
  nom: '',
  description: '',
  sous_type: 'TERRASSEMENT',
  statut: 'PREPARATION',
  ville: '',
  adresse: '',
  latitude: null,
  longitude: null,
  date_debut_prevue: null,
  date_fin_prevue: null,
  duree_prevue_jours: null,
  montant_marche: null,
  budget_previsionnel: null,
  date_debut_reelle: null,
  date_fin_reelle: null,
  client: authStore.user?.client,
  site: authStore.user?.site || null
})

const typeOptions = [
  { label: 'Terrassement', value: 'TERRASSEMENT' },
  { label: 'Béton', value: 'BETON' },
  { label: 'Transport', value: 'TRANSPORT' },
  { label: 'Financier', value: 'FINANCIER' },
  { label: 'Mixte', value: 'MIXTE' },
  { label: 'Autre', value: 'AUTRE' }
]

const statutOptions = [
  { label: 'En préparation', value: 'PREPARATION' },
  { label: 'En cours', value: 'EN_COURS' },
  { label: 'Suspendu', value: 'SUSPENDU' },
  { label: 'Terminé', value: 'TERMINE' },
  { label: 'Abandonné', value: 'ABANDONNE' }
]

const validate = () => {
  errors.value = {}
  
  if (!formData.value.code) errors.value.code = 'Le code est requis'
  if (!formData.value.nom) errors.value.nom = 'Le nom est requis'
  if (!formData.value.sous_type) errors.value.sous_type = 'Le type est requis'
  if (!formData.value.statut) errors.value.statut = 'Le statut est requis'
  if (!formData.value.date_debut_prevue) errors.value.date_debut_prevue = 'La date de début est requise'
  if (!formData.value.date_fin_prevue) errors.value.date_fin_prevue = 'La date de fin est requise'
  if (!formData.value.duree_prevue_jours) errors.value.duree_prevue_jours = 'La durée est requise'
  if (!formData.value.montant_marche) errors.value.montant_marche = 'Le montant du marché est requis'
  if (!formData.value.budget_previsionnel) errors.value.budget_previsionnel = 'Le budget prévisionnel est requis'
  
  if (formData.value.date_fin_prevue && formData.value.date_debut_prevue) {
    if (new Date(formData.value.date_fin_prevue) <= new Date(formData.value.date_debut_prevue)) {
      errors.value.date_fin_prevue = 'La date de fin doit être après la date de début'
    }
  }
  
  if (formData.value.budget_previsionnel > formData.value.montant_marche) {
    errors.value.budget_previsionnel = 'Le budget ne peut pas dépasser le montant du marché'
  }
  
  return Object.keys(errors.value).length === 0
}

const formatDateForAPI = (date) => {
  if (!date) return null
  if (typeof date === 'string') return date
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const handleSubmit = async () => {
  console.log('🚀 handleSubmit called')
  console.log('📝 formData:', formData.value)

  const isValid = validate()
  console.log('✅ Validation result:', isValid)

  if (!isValid) {
    console.warn('⚠️ Validation failed, not submitting')
    return
  }

  loading.value = true

  const dataToSend = {
    ...formData.value,
    date_debut_prevue: formatDateForAPI(formData.value.date_debut_prevue),
    date_fin_prevue: formatDateForAPI(formData.value.date_fin_prevue),
    date_debut_reelle: formatDateForAPI(formData.value.date_debut_reelle),
    date_fin_reelle: formatDateForAPI(formData.value.date_fin_reelle)
  }

  console.log('📤 Emitting save event with data:', dataToSend)

  try {
    emit('save', dataToSend)
  } finally {
    loading.value = false
  }
}

watch(() => props.chantier, (newVal) => {
  if (newVal) {
    console.log('🔄 Editing projet:', newVal)
    formData.value = {
      ...newVal,
      // Extraire les IDs des objets si nécessaire
      client: typeof newVal.client === 'object' ? newVal.client?.id : newVal.client,
      site: typeof newVal.site === 'object' ? newVal.site?.id : newVal.site,
      responsable: typeof newVal.responsable === 'object' ? newVal.responsable?.id : newVal.responsable,
      // Convertir les dates en objets Date
      date_debut_prevue: newVal.date_debut_prevue ? new Date(newVal.date_debut_prevue) : null,
      date_fin_prevue: newVal.date_fin_prevue ? new Date(newVal.date_fin_prevue) : null,
      date_debut_reelle: newVal.date_debut_reelle ? new Date(newVal.date_debut_reelle) : null,
      date_fin_reelle: newVal.date_fin_reelle ? new Date(newVal.date_fin_reelle) : null,
      // Utiliser sous_type du backend
      sous_type: newVal.sous_type || 'TERRASSEMENT'
    }
    console.log('✅ Form data populated:', formData.value)
  }
}, { immediate: true })

// Exposer une méthode pour remplir le formulaire depuis le parent
const fillFormData = (data) => {
  Object.assign(formData.value, data)
}

defineExpose({
  fillFormData
})
</script>

<style scoped lang="scss">
.chantier-form {
  display: flex;
  flex-direction: column;
  max-height: 100%;

  form {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
    flex: 1;
    overflow-y: auto;
    padding-right: 0.5rem;

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      &.full-width {
        grid-column: 1 / -1;
      }

      label {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--text-color);
      }

      .p-invalid {
        border-color: var(--red-500);
      }

      .p-error {
        color: var(--red-500);
        font-size: 0.75rem;
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    margin-top: auto;
    border-top: 1px solid var(--surface-border);
    background: white;
    position: sticky;
    bottom: 0;
    z-index: 10;
  }
}
</style>

