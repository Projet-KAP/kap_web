<template>
  <Dialog
    v-model:visible="isVisible"
    header="Nouveau Mouvement de Stock"
    :modal="true"
    :closable="true"
    :style="{ width: '700px' }"
    @hide="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="movement-form">
      <!-- Type de mouvement -->
      <div class="form-section">
        <h3 class="section-title">Type de mouvement</h3>
        <div class="movement-type-selector">
          <div
            v-for="type in movementTypes"
            :key="type.value"
            class="movement-type-card"
            :class="{ active: formData.movement_type === type.value }"
            @click="formData.movement_type = type.value"
          >
            <i :class="type.icon" class="movement-icon"></i>
            <div class="movement-label">{{ type.label }}</div>
            <div class="movement-desc">{{ type.description }}</div>
          </div>
        </div>
      </div>

      <!-- Article -->
      <div class="form-section">
        <h3 class="section-title">Article</h3>
        <div class="form-grid">
          <div class="form-field required full-width">
            <label for="spare_part">Sélectionner un article</label>
            <div class="flex gap-2">
            <Select
              id="spare_part"
              v-model="formData.spare_part"
              :options="articles"
              optionLabel="label"
              optionValue="value"
              placeholder="Choisir un article"
              filter
              :class="{ 'p-invalid': errors.spare_part }"
              @change="handleArticleChange"
                class="flex-1"
              />
              <Button
                icon="pi pi-qrcode"
                label="Scanner"
                @click="startBarcodeScan"
                severity="secondary"
                outlined
                v-tooltip="'Scanner le code-barres'"
              />
            </div>
            <div v-if="barcodeInput" class="mt-2">
              <InputText
                v-model="barcodeInput"
                placeholder="Scannez ou saisissez le code-barres"
                @keyup.enter="searchByBarcode"
                class="w-full"
              />
              <Button
                label="Rechercher"
                icon="pi pi-search"
                size="small"
                class="mt-2"
                @click="searchByBarcode"
            />
            </div>
            <small v-if="errors.spare_part" class="p-error">{{ errors.spare_part }}</small>
          </div>

          <!-- Stock info -->
          <div v-if="selectedArticleInfo" class="stock-info-card full-width">
            <div class="info-row">
              <span class="info-label">Stock actuel:</span>
              <span class="info-value">{{ selectedArticleInfo.quantity }} {{ selectedArticleInfo.stock_unit }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Stock minimum:</span>
              <span class="info-value">{{ selectedArticleInfo.min_stock }} {{ selectedArticleInfo.stock_unit }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Site actuel:</span>
              <span class="info-value">{{ selectedArticleInfo.site_name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quantité et raison -->
      <div class="form-section">
        <h3 class="section-title">Détails du mouvement</h3>
        <div class="form-grid">
          <div class="form-field required">
            <label for="quantity">Quantité</label>
            <InputNumber
              id="quantity"
              v-model="formData.quantity"
              :min="0.01"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="0.00"
              :class="{ 'p-invalid': errors.quantity }"
            />
            <small v-if="errors.quantity" class="p-error">{{ errors.quantity }}</small>
          </div>

          <div class="form-field">
            <label for="unit_price">Prix unitaire (optionnel)</label>
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

          <div class="form-field full-width">
            <label for="reason">Raison du mouvement</label>
            <Select
              id="reason"
              v-model="formData.reason"
              :options="reasonOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner une raison"
            />
          </div>

          <div class="form-field full-width">
            <label for="notes">Notes / Commentaires</label>
            <Textarea
              id="notes"
              v-model="formData.notes"
              rows="3"
              placeholder="Informations supplémentaires..."
            />
          </div>
        </div>
      </div>

      <!-- Transfert : Site destination -->
      <div v-if="formData.movement_type === 'TRANSFER'" class="form-section">
        <h3 class="section-title">Destination du transfert</h3>
        <div class="form-grid">
          <div class="form-field required">
            <label for="destination_site">Site de destination</label>
            <Select
              id="destination_site"
              v-model="formData.destination_site"
              :options="sites"
              optionLabel="name"
              optionValue="id"
              placeholder="Sélectionner un site"
              :class="{ 'p-invalid': errors.destination_site }"
            />
            <small v-if="errors.destination_site" class="p-error">{{ errors.destination_site }}</small>
          </div>

          <div class="form-field required">
            <label for="destination_warehouse">Site de consommation de destination</label>
            <MultiSelect
              id="destination_warehouse"
              v-model="formData.destination_warehouse"
              :options="warehouses"
              optionLabel="name"
              optionValue="id"
              placeholder="Sélectionner un ou plusieurs sites de consommation"
              display="chip"
              :filter="true"
              :class="{ 'p-invalid': errors.destination_warehouse }"
            />
            <small v-if="errors.destination_warehouse" class="p-error">{{ errors.destination_warehouse }}</small>
          </div>
        </div>
      </div>

      <!-- Récapitulatif -->
      <div v-if="formData.spare_part && formData.quantity" class="summary-card">
        <h4>Récapitulatif</h4>
        <div class="summary-content">
          <div class="summary-row">
            <span>Type:</span>
            <Tag :severity="getMovementSeverity(formData.movement_type)" :value="getMovementLabel(formData.movement_type)" />
          </div>
          <div class="summary-row">
            <span>Quantité:</span>
            <strong>{{ formData.quantity }} {{ selectedArticleInfo?.stock_unit }}</strong>
          </div>
          <div v-if="formData.movement_type === 'OUT'" class="summary-row">
            <span>Stock après sortie:</span>
            <strong :class="getStockAfterClass()">
              {{ calculateStockAfter() }} {{ selectedArticleInfo?.stock_unit }}
            </strong>
          </div>
          <div v-if="formData.unit_price" class="summary-row">
            <span>Valeur totale:</span>
            <strong>{{ formatCurrency(formData.quantity * formData.unit_price) }}</strong>
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
          label="Enregistrer le mouvement"
          icon="pi pi-check"
          @click="handleSubmit"
          :loading="loading"
          :disabled="!formData.spare_part || !formData.quantity"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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
  },
  initialType: {
    type: String,
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

const loading = ref(false)
const errors = ref({})

const formData = ref({
  movement_type: 'IN',
  spare_part: null,
  quantity: 0,
  unit_price: null,
  reason: null,
  notes: '',
  destination_site: null,
  destination_warehouse: [] // MultiSelect - array of warehouse IDs
})

const movementTypes = [
  {
    value: 'IN',
    label: 'Entrée',
    description: 'Ajout de stock',
    icon: 'pi pi-arrow-down'
  },
  {
    value: 'OUT',
    label: 'Sortie',
    description: 'Retrait de stock',
    icon: 'pi pi-arrow-up'
  },
  {
    value: 'TRANSFER',
    label: 'Transfert',
    description: 'Entre sites',
    icon: 'pi pi-arrow-right-arrow-left'
  }
]

const reasonOptions = computed(() => {
  const commonReasons = [
    { label: 'Achat / Réception', value: 'PURCHASE' },
    { label: 'Retour client', value: 'RETURN' },
    { label: 'Ajustement inventaire', value: 'ADJUSTMENT' },
    { label: 'Consommation', value: 'CONSUMPTION' },
    { label: 'Vente', value: 'SALE' },
    { label: 'Perte / Casse', value: 'LOSS' },
    { label: 'Maintenance', value: 'MAINTENANCE' },
    { label: 'Autre', value: 'OTHER' }
  ]

  if (formData.value.movement_type === 'IN') {
    return commonReasons.filter(r => ['PURCHASE', 'RETURN', 'ADJUSTMENT', 'OTHER'].includes(r.value))
  } else if (formData.value.movement_type === 'OUT') {
    return commonReasons.filter(r => ['CONSUMPTION', 'SALE', 'LOSS', 'MAINTENANCE', 'ADJUSTMENT', 'OTHER'].includes(r.value))
  }

  return [{ label: 'Transfert entre sites', value: 'TRANSFER' }]
})

const articles = computed(() => {
  return stockStore.spareParts.map(part => ({
    label: `${part.reference} - ${part.name} (Stock: ${part.quantity} ${part.stock_unit})`,
    value: part.id,
    data: part
  }))
})

const selectedArticleInfo = computed(() => {
  if (!formData.value.spare_part) return null
  const article = articles.value.find(a => a.value === formData.value.spare_part)
  return article?.data || null
})

const sites = ref([])
const warehouses = computed(() => stockStore.warehouses)
const barcodeInput = ref(null)

const startBarcodeScan = () => {
  barcodeInput.value = ''
  // Focus sur le champ de saisie après un court délai
  setTimeout(() => {
    const input = document.querySelector('input[placeholder*="code-barres"]')
    if (input) {
      input.focus()
    }
  }, 100)
}

const searchByBarcode = async () => {
  if (!barcodeInput.value || !barcodeInput.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Code-barres requis',
      detail: 'Veuillez saisir ou scanner un code-barres',
      life: 3000
    })
    return
  }

  const barcode = barcodeInput.value.trim()
  
  try {
    // Utiliser l'endpoint backend pour rechercher par code-barres
    const response = await axiosInstance.get(`/stock/spare-parts/by_barcode/?barcode=${encodeURIComponent(barcode)}`)
    
    if (response.data.success && response.data.spare_part) {
      const foundPart = response.data.spare_part
      formData.value.spare_part = foundPart.id
      handleArticleChange()
      barcodeInput.value = ''
      
      // Recharger les pièces pour mettre à jour la liste locale
      await stockStore.loadSpareParts()
      
      toast.add({
        severity: 'success',
        summary: 'Article trouvé',
        detail: `${foundPart.reference} - ${foundPart.name}`,
        life: 2000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Article non trouvé',
        detail: response.data.error || `Aucun article avec le code-barres "${barcode}"`,
        life: 3000
      })
    }
  } catch (error) {
    console.error('Erreur lors de la recherche par code-barres:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.error || `Impossible de rechercher l'article avec le code-barres "${barcode}"`,
      life: 3000
    })
  }
}

const handleArticleChange = () => {
  // Auto-fill unit price from article if available
  if (selectedArticleInfo.value && selectedArticleInfo.value.unit_price) {
    formData.value.unit_price = selectedArticleInfo.value.unit_price
  }
}

const calculateStockAfter = () => {
  if (!selectedArticleInfo.value) return 0
  return selectedArticleInfo.value.quantity - formData.value.quantity
}

const getStockAfterClass = () => {
  const stockAfter = calculateStockAfter()
  if (stockAfter < 0) return 'text-red-600'
  if (stockAfter < selectedArticleInfo.value.min_stock) return 'text-orange-600'
  return 'text-green-600'
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(value || 0)
}

const getMovementSeverity = (type) => {
  const severities = {
    'IN': 'success',
    'OUT': 'danger',
    'TRANSFER': 'info'
  }
  return severities[type] || 'secondary'
}

const getMovementLabel = (type) => {
  const labels = {
    'IN': 'Entrée',
    'OUT': 'Sortie',
    'TRANSFER': 'Transfert'
  }
  return labels[type] || type
}

const validateForm = () => {
  errors.value = {}

  if (!formData.value.spare_part) {
    errors.value.spare_part = 'Sélectionnez un article'
  }

  if (!formData.value.quantity || formData.value.quantity <= 0) {
    errors.value.quantity = 'La quantité doit être supérieure à 0'
  }

  // Check if enough stock for OUT movement
  if (formData.value.movement_type === 'OUT' && selectedArticleInfo.value) {
    if (formData.value.quantity > selectedArticleInfo.value.quantity) {
      errors.value.quantity = `Stock insuffisant (disponible: ${selectedArticleInfo.value.quantity})`
    }
  }

  // Validate transfer fields
  if (formData.value.movement_type === 'TRANSFER') {
    if (!formData.value.destination_site) {
      errors.value.destination_site = 'Sélectionnez un site de destination'
    }
    if (!formData.value.destination_warehouse) {
      errors.value.destination_warehouse = 'Sélectionnez un entrepôt de destination'
    }
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'warn',
      summary: 'Validation',
      detail: 'Veuillez corriger les erreurs',
      life: 3000
    })
    return
  }

  loading.value = true

  try {
    if (formData.value.movement_type === 'TRANSFER') {
      // Use transfer endpoint
      await stockStore.transferBetweenSites({
        spare_part: formData.value.spare_part,
        quantity: formData.value.quantity,
        from_site: selectedArticleInfo.value.current_site,
        to_site: formData.value.destination_site,
        to_warehouse: formData.value.destination_warehouse,
        notes: formData.value.notes
      })

      toast.add({
        severity: 'success',
        summary: 'Transfert effectué',
        detail: 'Le transfert a été enregistré avec succès',
        life: 3000
      })
    } else {
      // Regular movement (IN or OUT)
      await stockStore.createMovement({
        spare_part: formData.value.spare_part,
        movement_type: formData.value.movement_type,
        quantity: formData.value.quantity,
        unit_price: formData.value.unit_price,
        reason: formData.value.reason,
        notes: formData.value.notes
      })

      toast.add({
        severity: 'success',
        summary: 'Mouvement enregistré',
        detail: `${getMovementLabel(formData.value.movement_type)} de ${formData.value.quantity} enregistrée`,
        life: 3000
      })
    }

    emit('saved')
    handleClose()
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error)
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

const handleClose = () => {
  formData.value = {
    movement_type: 'IN',
    spare_part: null,
    quantity: 0,
    unit_price: null,
    reason: null,
    notes: '',
    destination_site: null,
    destination_warehouse: []
  }
  barcodeInput.value = null
  errors.value = {}
  isVisible.value = false
}

// Watch for article prop changes
watch(() => props.article, (newArticle) => {
  if (newArticle) {
    formData.value.spare_part = newArticle.id
    handleArticleChange()
  }
}, { immediate: true })

// Map des types externes vers les types internes du modal
const typeMapping = {
  'ENTREE': 'IN',
  'SORTIE': 'OUT',
  'TRANSFERT': 'TRANSFER',
  'IN': 'IN',
  'OUT': 'OUT',
  'TRANSFER': 'TRANSFER'
}

// Load initial data
watch(isVisible, async (visible) => {
  if (visible) {
    // Appliquer le type initial si fourni
    if (props.initialType) {
      formData.value.movement_type = typeMapping[props.initialType] || 'IN'
    }

    // Load articles if not already loaded
    if (stockStore.spareParts.length === 0) {
      await stockStore.loadSpareParts()
    }

    // Load warehouses if not already loaded
    if (warehouses.value.length === 0) {
      await stockStore.loadWarehouses()
    }

    // TODO: Load sites when sites store is available
    sites.value = [
      { id: 2, name: 'Magasin Pieces Detachees Lisses' },
      { id: 3, name: 'Chantier A' },
      { id: 4, name: 'Atelier Principal' }
    ]
  }
})
</script>

<style scoped lang="scss">
.movement-form {
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

.movement-type-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.movement-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  &.active {
    border-color: #3b82f6;
    background: #dbeafe;

    .movement-icon {
      color: #3b82f6;
    }
  }
}

.movement-icon {
  font-size: 2rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.movement-label {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.movement-desc {
  font-size: 0.875rem;
  color: #6b7280;
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

.stock-info-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;

  &:not(:last-child) {
    border-bottom: 1px solid #e5e7eb;
  }

  .info-label {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .info-value {
    font-weight: 600;
    color: #111827;
  }
}

.summary-card {
  background: #f0f9ff;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1.5rem;

  h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1rem 0;
  }
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;

  span {
    color: #374151;
  }

  strong {
    font-size: 1.05rem;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .movement-type-selector {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field.full-width {
    grid-column: 1;
  }
}
</style>
