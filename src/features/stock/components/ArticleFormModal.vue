<template>
  <Dialog
    v-model:visible="isVisible"
    :header="isEditMode ? 'Modifier l\'article' : 'Nouvel article'"
    :modal="true"
    :closable="true"
    :style="{ width: '900px' }"
    @hide="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="article-form">
      <!-- Identification -->
      <div class="form-section">
        <h3 class="section-title">Identification</h3>
        <div class="form-grid">
          <div class="form-field required">
            <label for="reference">Référence</label>
            <InputText
              id="reference"
              v-model="formData.reference"
              :class="{ 'p-invalid': errors.reference }"
              placeholder="Ex: SH66172"
              required
            />
            <small v-if="errors.reference" class="p-error">{{ errors.reference }}</small>
          </div>

          <div class="form-field">
            <label for="alternative_code">Code alternatif</label>
            <InputText
              id="alternative_code"
              v-model="formData.alternative_code"
              placeholder="Ex: ALT-001"
            />
          </div>

          <div class="form-field">
            <label for="personal_reference">Référence personnelle</label>
            <InputText
              id="personal_reference"
              v-model="formData.personal_reference"
              placeholder="Ex: REF-PERSO-001"
            />
          </div>

          <div class="form-field">
            <label for="barcode">Code-barres</label>
            <InputText
              id="barcode"
              v-model="formData.barcode"
              placeholder="Ex: 455115875"
            />
          </div>

          <div class="form-field required full-width">
            <label for="name">Nom de l'article</label>
            <InputText
              id="name"
              v-model="formData.name"
              :class="{ 'p-invalid': errors.name }"
              placeholder="Ex: FILTRE HYDRAULIQUE HIFI"
              required
            />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>

          <div class="form-field full-width">
            <label for="description">Description</label>
            <Textarea
              id="description"
              v-model="formData.description"
              rows="3"
              placeholder="Description détaillée de l'article"
            />
          </div>
        </div>
      </div>

      <!-- Fabricant & Spécifications -->
      <div class="form-section">
        <h3 class="section-title">Fabricant & Spécifications</h3>
        <div class="form-grid">
          <div class="form-field">
            <label for="manufacturer">Fabricant</label>
            <InputText
              id="manufacturer"
              v-model="formData.manufacturer"
              placeholder="Ex: HIFI"
            />
          </div>

          <div class="form-field">
            <label for="manufacturer_ref">Réf. Fabricant</label>
            <InputText
              id="manufacturer_ref"
              v-model="formData.manufacturer_ref"
              placeholder="Ex: SH66172"
            />
          </div>

          <div class="form-field">
            <label for="model">Modèle</label>
            <InputText
              id="model"
              v-model="formData.model"
              placeholder="Ex: Series 2000"
            />
          </div>

          <div class="form-field">
            <label for="equipment_family">Famille d'équipement</label>
            <InputText
              id="equipment_family"
              v-model="formData.equipment_family"
              placeholder="Ex: Filtration"
            />
          </div>
        </div>
      </div>

      <!-- Stock & Quantités -->
      <div class="form-section">
        <h3 class="section-title">Stock & Quantités</h3>
        <div class="form-grid">
          <div class="form-field required">
            <label for="stock_unit">Unité de stock</label>
            <Select
              id="stock_unit"
              v-model="formData.stock_unit"
              :options="stockUnits"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner une unité"
              :class="{ 'p-invalid': errors.stock_unit }"
            />
            <small v-if="errors.stock_unit" class="p-error">{{ errors.stock_unit }}</small>
          </div>

          <div class="form-field required">
            <label for="quantity">Quantité en stock</label>
            <InputNumber
              id="quantity"
              v-model="formData.quantity"
              :min="0"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="0.00"
            />
          </div>

          <div class="form-field required">
            <label for="min_stock">Stock minimum</label>
            <InputNumber
              id="min_stock"
              v-model="formData.min_stock"
              :min="0"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="0.00"
            />
          </div>

          <div class="form-field">
            <label for="max_stock">Stock maximum</label>
            <InputNumber
              id="max_stock"
              v-model="formData.max_stock"
              :min="0"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <!-- Prix -->
      <div class="form-section">
        <h3 class="section-title">Prix</h3>
        <div class="form-grid">
          <div class="form-field required">
            <label for="unit_price">Prix unitaire (XOF)</label>
            <InputNumber
              id="unit_price"
              v-model="formData.unit_price"
              :min="0"
              :minFractionDigits="0"
              :maxFractionDigits="0"
              placeholder="0"
              mode="currency"
              currency="XOF"
              locale="fr-FR"
            />
          </div>

          <div class="form-field">
            <label>Valeur totale (calculée)</label>
            <div class="calculated-value">
              {{ formatCurrency(calculatedTotalValue) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Localisation -->
      <div class="form-section">
        <h3 class="section-title">Localisation</h3>
        <div class="form-grid">
          <div class="form-field required">
            <label for="site">Site</label>
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

          <div class="form-field required">
            <label for="warehouse">Site de consommation</label>
            <MultiSelect
              id="warehouse"
              v-model="formData.warehouse"
              :options="warehouses"
              optionLabel="name"
              optionValue="id"
              placeholder="Sélectionner un ou plusieurs sites de consommation"
              :class="{ 'p-invalid': errors.warehouse }"
              display="chip"
              :filter="true"
              @filter="onWarehouseFilter"
            >
              <template #option="slotProps">
                <div class="warehouse-option">
                  <span>{{ slotProps.option.name }}</span>
                  <small class="text-muted">({{ slotProps.option.code }})</small>
                </div>
              </template>
            </MultiSelect>
            <div class="mt-2">
              <Button
                label="Créer un nouveau site de consommation"
                icon="pi pi-plus"
                size="small"
                text
                @click="showCreateWarehouseDialog = true"
            />
            </div>
            <small v-if="errors.warehouse" class="p-error">{{ errors.warehouse }}</small>
          </div>

          <div class="form-field">
            <label for="location_in_warehouse">Emplacement dans l'entrepôt</label>
            <InputText
              id="location_in_warehouse"
              v-model="formData.location_in_warehouse"
              placeholder="Ex: Allée A, Rayon 3"
            />
          </div>

          <div class="form-field">
            <label for="storage_equipment">Équipement de stockage</label>
            <InputText
              id="storage_equipment"
              v-model="formData.storage_equipment"
              placeholder="Ex: Palette P-001"
            />
          </div>
        </div>
      </div>

      <!-- Statut & Options -->
      <div class="form-section">
        <h3 class="section-title">Statut & Options</h3>
        <div class="form-grid">
          <div class="form-field">
            <label for="status">Statut de l'article</label>
            <Select
              id="status"
              v-model="formData.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner un statut"
            />
          </div>

          <div class="form-field checkbox-field">
            <Checkbox
              id="stock_alerts_enabled"
              v-model="formData.stock_alerts_enabled"
              :binary="true"
            />
            <label for="stock_alerts_enabled">Alertes de stock activées</label>
          </div>

          <div class="form-field checkbox-field">
            <Checkbox
              id="auto_replenishment"
              v-model="formData.auto_replenishment"
              :binary="true"
            />
            <label for="auto_replenishment">Réapprovisionnement automatique</label>
          </div>

          <div class="form-field full-width">
            <label for="remarks">Remarques</label>
            <Textarea
              id="remarks"
              v-model="formData.remarks"
              rows="2"
              placeholder="Remarques ou notes supplémentaires"
            />
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Annuler"
          icon="pi pi-times"
          @click="handleClose"
          text
        />
        <Button
          :label="isEditMode ? 'Mettre à jour' : 'Créer'"
          icon="pi pi-check"
          @click="handleSubmit"
          :loading="loading"
        />
      </div>
    </template>
  </Dialog>

  <!-- Dialog pour créer un nouveau site de consommation -->
  <Dialog
    v-model:visible="showCreateWarehouseDialog"
    header="Créer un nouveau site de consommation"
    :modal="true"
    :style="{ width: '500px' }"
  >
    <div class="form-grid">
      <div class="form-field required full-width">
        <label for="new_warehouse_name">Nom du site de consommation</label>
        <InputText
          id="new_warehouse_name"
          v-model="newWarehouseData.name"
          placeholder="Ex: Entrepôt Principal"
        />
      </div>

      <div class="form-field required full-width">
        <label for="new_warehouse_code">Code</label>
        <InputText
          id="new_warehouse_code"
          v-model="newWarehouseData.code"
          placeholder="Ex: ENT-001"
        />
      </div>

      <div class="form-field required full-width">
        <label for="new_warehouse_site">Site</label>
        <Select
          id="new_warehouse_site"
          v-model="newWarehouseData.site"
          :options="sites"
          optionLabel="name"
          optionValue="id"
          placeholder="Sélectionner un site"
        />
      </div>

      <div class="form-field full-width">
        <label for="new_warehouse_address">Adresse</label>
        <Textarea
          id="new_warehouse_address"
          v-model="newWarehouseData.address"
          rows="2"
          placeholder="Adresse du site de consommation"
        />
      </div>
    </div>

    <template #footer>
      <Button
        label="Annuler"
        icon="pi pi-times"
        text
        @click="showCreateWarehouseDialog = false"
      />
      <Button
        label="Créer"
        icon="pi pi-check"
        :loading="creatingWarehouse"
        @click="createNewWarehouse"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStockStore } from '@/features/stock/stores/stockStore'
import { useToast } from 'primevue/usetoast'
import { axiosInstance } from '@/main.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  article: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const stockStore = useStockStore()
const toast = useToast()

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const isEditMode = computed(() => !!props.article)

const loading = ref(false)
const errors = ref({})

const formData = ref({
  reference: '',
  alternative_code: '',
  personal_reference: '',
  barcode: '',
  name: '',
  description: '',
  manufacturer: '',
  manufacturer_ref: '',
  model: '',
  equipment_family: '',
  stock_unit: 'PC',
  quantity: 0,
  min_stock: 0,
  max_stock: null,
  unit_price: 0,
  site: null,
  warehouse: [], // MultiSelect - array of warehouse IDs
  location_in_warehouse: '',
  storage_equipment: '',
  status: 'DISPONIBLE',
  stock_alerts_enabled: true,
  auto_replenishment: false,
  remarks: ''
})

const showCreateWarehouseDialog = ref(false)
const newWarehouseData = ref({
  name: '',
  code: '',
  site: null,
  address: ''
})
const creatingWarehouse = ref(false)

const stockUnits = [
  { label: 'Pièce (PC)', value: 'PC' },
  { label: 'Kilogramme (KG)', value: 'KG' },
  { label: 'Litre (L)', value: 'L' },
  { label: 'Mètre (M)', value: 'M' },
  { label: 'Mètre carré (M2)', value: 'M2' },
  { label: 'Mètre cube (M3)', value: 'M3' },
  { label: 'Boîte (BOX)', value: 'BOX' },
  { label: 'Set/Ensemble (SET)', value: 'SET' }
]

const statusOptions = [
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'En commande', value: 'EN_COMMANDE' },
  { label: 'Réservé', value: 'RESERVE' },
  { label: 'Indisponible', value: 'INDISPONIBLE' }
]

const sites = ref([])
const warehouses = computed(() => {
  const wh = stockStore.warehouses
  return Array.isArray(wh) ? wh : []
})

const calculatedTotalValue = computed(() => {
  return (formData.value.quantity || 0) * (formData.value.unit_price || 0)
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(value || 0)
}

const validateForm = () => {
  errors.value = {}

  if (!formData.value.reference) {
    errors.value.reference = 'La référence est obligatoire'
  }

  if (!formData.value.name) {
    errors.value.name = 'Le nom est obligatoire'
  }

  if (!formData.value.stock_unit) {
    errors.value.stock_unit = 'L\'unité est obligatoire'
  }

  if (!formData.value.site) {
    errors.value.site = 'Le site est obligatoire'
  }

  if (!formData.value.warehouse || (Array.isArray(formData.value.warehouse) && formData.value.warehouse.length === 0)) {
    errors.value.warehouse = 'Le site de consommation est obligatoire'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'warn',
      summary: 'Validation',
      detail: 'Veuillez remplir tous les champs obligatoires',
      life: 3000
    })
    return
  }

  loading.value = true

  try {
    // Calculate total_value
    const dataToSubmit = {
      ...formData.value,
      total_value: calculatedTotalValue.value,
      current_site: formData.value.site  // API expects current_site
    }

    if (isEditMode.value) {
      await stockStore.updateSparePart(props.article.id, dataToSubmit)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Article mis à jour avec succès',
        life: 3000
      })
    } else {
      await stockStore.createSparePart(dataToSubmit)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Article créé avec succès',
        life: 3000
      })
    }

    emit('saved')
    handleClose()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.message || 'Une erreur est survenue',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const onWarehouseFilter = (event) => {
  // Le filtre est géré automatiquement par MultiSelect
}

const createNewWarehouse = async () => {
  if (!newWarehouseData.value.name || !newWarehouseData.value.code || !newWarehouseData.value.site) {
    toast.add({
      severity: 'warn',
      summary: 'Validation',
      detail: 'Veuillez remplir tous les champs obligatoires',
      life: 3000
    })
    return
  }

  creatingWarehouse.value = true
  try {
    const createdWarehouse = await stockStore.createWarehouse({
      name: newWarehouseData.value.name,
      code: newWarehouseData.value.code,
      site: newWarehouseData.value.site,
      address: newWarehouseData.value.address || ''
    })

    // Ajouter le nouvel entrepôt à la sélection
    if (Array.isArray(formData.value.warehouse)) {
      formData.value.warehouse.push(createdWarehouse.id)
    } else {
      formData.value.warehouse = [createdWarehouse.id]
    }

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Site de consommation créé avec succès',
      life: 3000
    })

    // Réinitialiser le formulaire
    newWarehouseData.value = {
      name: '',
      code: '',
      site: null,
      address: ''
    }
    showCreateWarehouseDialog.value = false
  } catch (error) {
    console.error('Erreur lors de la création:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.message || 'Impossible de créer le site de consommation',
      life: 5000
    })
  } finally {
    creatingWarehouse.value = false
  }
}

const handleClose = () => {
  formData.value = {
    reference: '',
    alternative_code: '',
    personal_reference: '',
    barcode: '',
    name: '',
    description: '',
    manufacturer: '',
    manufacturer_ref: '',
    model: '',
    equipment_family: '',
    stock_unit: 'PC',
    quantity: 0,
    min_stock: 0,
    max_stock: null,
    unit_price: 0,
    site: null,
    warehouse: [],
    location_in_warehouse: '',
    storage_equipment: '',
    status: 'DISPONIBLE',
    stock_alerts_enabled: true,
    auto_replenishment: false,
    remarks: ''
  }
  errors.value = {}
  isVisible.value = false
}

// Watch for article changes (edit mode)
watch(() => props.article, (newArticle) => {
  if (newArticle) {
    formData.value = {
      ...newArticle,
      site: newArticle.current_site || newArticle.site,
      warehouse: Array.isArray(newArticle.warehouse) ? newArticle.warehouse : (newArticle.warehouse ? [newArticle.warehouse] : [])
    }
  }
}, { immediate: true })

// Load sites
onMounted(async () => {
  try {
    const response = await axiosInstance.get('sites/')
    sites.value = response.data || []
  } catch (err) {
    console.error('Error loading sites:', err)
  }
})

// Load initial data
watch(isVisible, async (visible) => {
  if (visible) {
    // Load warehouses if not already loaded
    if (warehouses.value.length === 0) {
      await stockStore.loadWarehouses()
    }

    // Load sites from API
    try {
      const response = await axiosInstance.get('sites/')
      sites.value = response.data?.results || response.data || []
    } catch (err) {
      console.error('Error loading sites:', err)
    }
  }
})
</script>

<style scoped lang="scss">
.article-form {
  padding: 1rem 0;
}

.form-section {
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &.full-width {
    grid-column: 1 / -1;
  }

  &.required label::after {
    content: ' *';
    color: #ef4444;
  }

  &.checkbox-field {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;

    label {
      margin: 0;
      cursor: pointer;
    }
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .p-invalid {
    border-color: #ef4444;
  }

  .p-error {
    color: #ef4444;
    font-size: 0.75rem;
  }
}

.calculated-value {
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-weight: 600;
  color: #111827;
  border: 1px solid #d1d5db;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field.full-width {
    grid-column: 1;
  }
}
</style>
