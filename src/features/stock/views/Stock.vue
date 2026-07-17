<template>
  <div class="stock-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">Gestion de Stock</h1>
          <p class="page-subtitle">Gestion des pièces détachées et mouvements de stock</p>
        </div>
        <div class="header-actions">
          <Button
            label="Nouveau mouvement"
            icon="pi pi-arrow-right-arrow-left"
            @click="showMovementDialog = true"
            severity="secondary"
            outlined
            class="mr-2"
          />
          <Button
            label="Nouvelle pièce"
            icon="pi pi-plus"
            @click="openCreateDialog"
            severity="info"
          />
        </div>
      </div>
    </div>

    <!-- Stock Overview Cards -->
    <div class="stock-overview">
      <div class="overview-card">
        <div class="card-icon total">
          <i class="pi pi-box"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ spareParts.length }}</div>
          <div class="card-label">Références en stock</div>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-icon value">
          <i class="pi pi-dollar"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ formatCurrency(totalStockValue) }}</div>
          <div class="card-label">Valeur totale</div>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-icon warning">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ lowStockParts.length }}</div>
          <div class="card-label">Stock faible</div>
        </div>
      </div>

      <div class="overview-card">
        <div class="card-icon danger">
          <i class="pi pi-times-circle"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ outOfStockParts.length }}</div>
          <div class="card-label">Ruptures</div>
        </div>
      </div>
    </div>

    <!-- Active Alerts -->
    <div v-if="activeAlerts.length > 0" class="alerts-section">
      <h3><i class="pi pi-bell"></i> Alertes actives ({{ activeAlerts.length }})</h3>
      <div class="alerts-list">
        <div v-for="alert in activeAlerts" :key="alert.id" class="alert-item" :class="alert.priority.toLowerCase()">
          <div class="alert-header">
            <span class="alert-type">{{ alert.alert_type }}</span>
            <span class="alert-priority">{{ alert.priority }}</span>
          </div>
          <div class="alert-message">{{ alert.message }}</div>
          <div class="alert-details">
            <span>{{ alert.spare_part_name }} ({{ alert.spare_part_ref }})</span>
            <span>{{ alert.current_quantity }} {{ alert.spare_part?.stock_unit }}</span>
          </div>
          <div class="alert-actions">
            <Button 
              v-if="alert.status === 'OPEN'"
              label="Prendre en compte" 
              size="small"
              outlined
              @click="acknowledgeAlert(alert.id)"
            />
            <Button 
              label="Résoudre" 
              size="small"
              severity="success"
              @click="resolveAlert(alert.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <InputText 
        v-model="searchTerm"
        placeholder="Rechercher une pièce..."
        class="search-input"
      >
        <template #prefix>
          <i class="pi pi-search"></i>
        </template>
      </InputText>
      
      <Select 
        v-model="warehouseFilter"
        :options="warehouses"
        optionLabel="name"
        optionValue="id"
        placeholder="Site de consommation"
        showClear
      />
      
      <Select 
        v-model="stockStatusFilter"
        :options="stockStatusOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Statut stock"
        showClear
      />
    </div>

    <!-- Spare Parts Table -->
    <div class="table-container">
      <DataTable
        :value="filteredSpareParts"
        :loading="loading"
        :paginator="true"
        :rows="20"
        :rowsPerPageOptions="[10, 20, 50, 100]"
        responsiveLayout="scroll"
        stripedRows
        class="stock-table"
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-inbox"></i>
            <p>Aucune pièce détachée trouvée</p>
          </div>
        </template>

        <Column field="reference" header="Référence" sortable>
          <template #body="slotProps">
            <div class="ref-cell">
              <strong>{{ slotProps.data.reference }}</strong>
              <small v-if="slotProps.data.alternative_code">{{ slotProps.data.alternative_code }}</small>
            </div>
          </template>
        </Column>

        <Column field="name" header="Nom" sortable />

        <Column field="manufacturer" header="Fabricant" sortable />

        <Column field="quantity" header="Stock" sortable>
          <template #body="slotProps">
            <div class="quantity-cell">
              <Tag 
                :value="`${slotProps.data.quantity} ${slotProps.data.stock_unit}`"
                :severity="getStockSeverity(slotProps.data)"
              />
              <small>Seuil: {{ slotProps.data.threshold }}</small>
            </div>
          </template>
        </Column>

        <Column field="warehouse_name" header="Site de consommation" sortable />

        <Column field="site_name" header="Site" sortable />

        <Column field="total_value" header="Valeur totale" sortable>
          <template #body="slotProps">
            {{ formatCurrency(slotProps.data.total_value) }}
          </template>
        </Column>

        <Column header="Actions" style="width: 150px">
          <template #body="slotProps">
            <div class="action-buttons">
              <Button 
                icon="pi pi-pencil" 
                size="small"
                text
                rounded
                @click="openEditDialog(slotProps.data)"
              />
              <Button 
                icon="pi pi-arrow-right-arrow-left" 
                size="small"
                text
                rounded
                severity="info"
                @click="openTransferDialog(slotProps.data)"
              />
              <Button 
                icon="pi pi-trash" 
                size="small"
                text
                rounded
                severity="danger"
                @click="confirmDelete(slotProps.data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="showCreateEditDialog"
      :header="editMode ? 'Modifier la pièce' : 'Nouvelle pièce détachée'"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="form-grid">
        <div class="form-field">
          <label>Référence *</label>
          <InputText v-model="formData.reference" placeholder="REF-001" />
        </div>

        <div class="form-field">
          <label>Code alternatif</label>
          <InputText v-model="formData.alternative_code" placeholder="Code secondaire" />
        </div>

        <div class="form-field">
          <label>Code-barres</label>
          <InputText v-model="formData.barcode" placeholder="Scannez ou saisissez" />
        </div>

        <div class="form-field full-width">
          <label>Nom *</label>
          <InputText v-model="formData.name" placeholder="Nom de la pièce" />
        </div>

        <div class="form-field full-width">
          <label>Description</label>
          <Textarea v-model="formData.description" rows="3" />
        </div>

        <div class="form-field">
          <label>Fabricant</label>
          <InputText v-model="formData.manufacturer" />
        </div>

        <div class="form-field">
          <label>Réf. Fabricant</label>
          <InputText v-model="formData.manufacturer_ref" />
        </div>

        <div class="form-field">
          <label>Unité de stock *</label>
          <Select 
            v-model="formData.stock_unit"
            :options="unitOptions"
            optionLabel="label"
            optionValue="value"
          />
        </div>

        <div class="form-field">
          <label>Quantité *</label>
          <InputNumber v-model="formData.quantity" :min="0" />
        </div>

        <div class="form-field">
          <label>Seuil d'alerte *</label>
          <InputNumber v-model="formData.threshold" :min="0" />
        </div>

        <div class="form-field">
          <label>Quantité maximale</label>
          <InputNumber v-model="formData.max_quantity" :min="0" />
        </div>

        <div class="form-field">
          <label>Site de consommation *</label>
          <MultiSelect 
            v-model="formData.warehouse"
            :options="warehouses"
            optionLabel="name"
            optionValue="id"
            placeholder="Sélectionner un ou plusieurs sites de consommation"
            display="chip"
            :filter="true"
          />
        </div>

        <div class="form-field">
          <label>Site actuel *</label>
          <Select 
            v-model="formData.current_site"
            :options="sites"
            optionLabel="name"
            optionValue="id"
            placeholder="Sélectionner un site"
          />
        </div>

        <div class="form-field">
          <label>Emplacement</label>
          <InputText v-model="formData.location_in_warehouse" placeholder="Allée A, Rangée 3..." />
        </div>

        <div class="form-field">
          <label>Prix unitaire</label>
          <InputNumber v-model="formData.unit_price" mode="currency" currency="EUR" locale="fr-FR" />
        </div>
      </div>

      <template #footer>
        <Button label="Annuler" text @click="showCreateEditDialog = false" />
        <Button 
          :label="editMode ? 'Modifier' : 'Créer'"
          :loading="saving"
          @click="saveSparePart"
        />
      </template>
    </Dialog>

    <!-- Transfer Dialog -->
    <Dialog 
      v-model:visible="showTransferDialog"
      header="Transférer vers un autre site"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div v-if="transferItem" class="transfer-form">
        <div class="transfer-info">
          <p><strong>Pièce:</strong> {{ transferItem.name }}</p>
          <p><strong>Stock actuel:</strong> {{ transferItem.quantity }} {{ transferItem.stock_unit }}</p>
          <p><strong>Site actuel:</strong> {{ transferItem.site_name }}</p>
        </div>

        <div class="form-field">
          <label>Quantité à transférer *</label>
          <InputNumber 
            v-model="transferData.quantity"
            :min="0"
            :max="transferItem.quantity"
          />
        </div>

        <div class="form-field">
          <label>Vers le site de consommation *</label>
          <MultiSelect 
            v-model="transferData.to_warehouse"
            :options="otherWarehouses"
            optionLabel="name"
            optionValue="id"
            placeholder="Sélectionner un ou plusieurs sites de consommation"
            display="chip"
            :filter="true"
          />
        </div>

        <div class="form-field">
          <label>Vers le site *</label>
          <Select 
            v-model="transferData.to_site"
            :options="otherSites"
            optionLabel="name"
            optionValue="id"
            placeholder="Sélectionner"
          />
        </div>

        <div class="form-field">
          <label>Notes</label>
          <Textarea v-model="transferData.notes" rows="3" />
        </div>
      </div>

      <template #footer>
        <Button label="Annuler" text @click="showTransferDialog = false" />
        <Button 
          label="Transférer"
          icon="pi pi-arrow-right"
          :loading="transferring"
          @click="executeTransfer"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useStockStore } from '../stores/stockStore'
import { useImportEventsStore } from '@/stores/importEventsStore'
import { axiosInstance } from '@/main.js'
import { useNavigationStore } from '@/shared/stores/navigationStore'


const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const stockStore = useStockStore()
const importEventsStore = useImportEventsStore()
const navigationStore = useNavigationStore()

// State
const loading = ref(false)
const saving = ref(false)
const transferring = ref(false)
const showCreateEditDialog = ref(false)
const showTransferDialog = ref(false)
const showMovementDialog = ref(false)
const editMode = ref(false)
const searchTerm = ref('')
const warehouseFilter = ref(null)
const stockStatusFilter = ref(null)
const sites = ref([])
const transferItem = ref(null)

const unitOptions = [
  { label: 'Pièce (PC)', value: 'PC' },
  { label: 'Kilogramme (KG)', value: 'KG' },
  { label: 'Litre (L)', value: 'L' },
  { label: 'Mètre (M)', value: 'M' },
  { label: 'Mètre carré (M²)', value: 'M2' },
  { label: 'Mètre cube (M³)', value: 'M3' },
  { label: 'Boîte (BOX)', value: 'BOX' },
  { label: 'Set/Ensemble (SET)', value: 'SET' }
]

const stockStatusOptions = [
  { label: 'Tous', value: null },
  { label: 'Stock normal', value: 'normal' },
  { label: 'Stock faible', value: 'low' },
  { label: 'Rupture', value: 'out' }
]

const formData = ref({
  reference: '',
  alternative_code: '',
  barcode: '',
  name: '',
  description: '',
  manufacturer: '',
  manufacturer_ref: '',
  stock_unit: 'PC',
  quantity: 0,
  threshold: 0,
  max_quantity: null,
  warehouse: null,
  current_site: null,
  location_in_warehouse: '',
  unit_price: null
})

const transferData = ref({
  quantity: 0,
  to_warehouse: null,
  to_site: null,
  notes: ''
})

// Computed
const spareParts = computed(() => stockStore.spareParts)
const warehouses = computed(() => stockStore.warehouses)
const lowStockParts = computed(() => stockStore.lowStockParts)
const outOfStockParts = computed(() => stockStore.outOfStockParts)
const activeAlerts = computed(() => stockStore.activeAlerts)
const totalStockValue = computed(() => stockStore.totalStockValue)

const filteredSpareParts = computed(() => {
  let result = spareParts.value

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    result = result.filter(part =>
      part.reference?.toLowerCase().includes(search) ||
      part.name?.toLowerCase().includes(search) ||
      part.manufacturer?.toLowerCase().includes(search) ||
      part.barcode?.toLowerCase().includes(search)
    )
  }

  if (warehouseFilter.value) {
    result = result.filter(part => part.warehouse === warehouseFilter.value)
  }

  if (stockStatusFilter.value === 'low') {
    result = result.filter(part => part.is_low_stock && !part.is_out_of_stock)
  } else if (stockStatusFilter.value === 'out') {
    result = result.filter(part => part.is_out_of_stock)
  } else if (stockStatusFilter.value === 'normal') {
    result = result.filter(part => !part.is_low_stock && !part.is_out_of_stock)
  }

  return result
})

const otherWarehouses = computed(() => {
  if (!transferItem.value) return warehouses.value
  return warehouses.value.filter(w => w.id !== transferItem.value.warehouse)
})

const otherSites = computed(() => {
  if (!transferItem.value) return sites.value
  return sites.value.filter(s => s.id !== transferItem.value.current_site)
})

// Methods
const formatCurrency = (value) => {
  if (!value) return '0 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

const getStockSeverity = (part) => {
  if (part.is_out_of_stock) return 'danger'
  if (part.is_low_stock) return 'warning'
  return 'success'
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      stockStore.loadSpareParts(),
      stockStore.loadWarehouses(),
      stockStore.loadAlerts(),
      loadSites()
    ])
  } catch (err) {
    console.error('Error loading stock data:', err)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données de stock',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

watch(
  () => importEventsStore.lastImportEvent?.timestamp,
  () => {
    const event = importEventsStore.lastImportEvent
    if (event?.type === 'stock') {
      toast.add({
        severity: 'info',
        summary: 'Mise à jour de stock détectée',
        detail: 'Les données de stock ont été mises à jour. Rafraîchissement en cours...',
        life: 3000
      })
      loadData()
    }
  }
)

const loadSites = async () => {
  try {
    const response = await axiosInstance.get('sites/')
    sites.value = response.data || []
  } catch (err) {
    console.error('Error loading sites:', err)
  }
}

const openCreateDialog = () => {
  editMode.value = false
  resetForm()
  showCreateEditDialog.value = true
}

const openEditDialog = (part) => {
  editMode.value = true
  formData.value = { ...part }
  showCreateEditDialog.value = true
}

const resetForm = () => {
  formData.value = {
    reference: '',
    alternative_code: '',
    barcode: '',
    name: '',
    description: '',
    manufacturer: '',
    manufacturer_ref: '',
    stock_unit: 'PC',
    quantity: 0,
    threshold: 0,
    max_quantity: null,
    warehouse: null,
    current_site: null,
    location_in_warehouse: '',
    unit_price: null
  }
}

const saveSparePart = async () => {
  if (!formData.value.reference || !formData.value.name) {
    toast.add({
      severity: 'warn',
      summary: 'Champs requis',
      detail: 'Veuillez remplir les champs obligatoires',
      life: 3000
    })
    return
  }

  saving.value = true
  try {
    if (editMode.value) {
      await stockStore.updateSparePart(formData.value.id, formData.value)
      toast.add({
        severity: 'success',
        summary: 'Pièce mise à jour',
        detail: 'La pièce a été mise à jour avec succès',
        life: 3000
      })
    } else {
      await stockStore.createSparePart(formData.value)
      toast.add({
        severity: 'success',
        summary: 'Pièce créée',
        detail: 'La pièce a été ajoutée avec succès',
        life: 3000
      })
    }
    
    showCreateEditDialog.value = false
    resetForm()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err.response?.data?.error || 'Impossible de sauvegarder la pièce',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (part) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer ${part.name} ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await stockStore.deleteSparePart(part.id)
        toast.add({
          severity: 'success',
          summary: 'Pièce supprimée',
          detail: 'La pièce a été supprimée',
          life: 3000
        })
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer la pièce',
          life: 3000
        })
      }
    }
  })
}

const openTransferDialog = (part) => {
  transferItem.value = part
  transferData.value = {
    quantity: 0,
    to_warehouse: null,
    to_site: null,
    notes: ''
  }
  showTransferDialog.value = true
}

const executeTransfer = async () => {
  if (!transferData.value.quantity || !transferData.value.to_warehouse || !transferData.value.to_site) {
    toast.add({
      severity: 'warn',
      summary: 'Champs requis',
      detail: 'Veuillez remplir tous les champs',
      life: 3000
    })
    return
  }

  transferring.value = true
  try {
    await stockStore.transferBetweenSites({
      spare_part_id: transferItem.value.id,
      ...transferData.value
    })
    
    toast.add({
      severity: 'success',
      summary: 'Transfert effectué',
      detail: 'La pièce a été transférée avec succès',
      life: 3000
    })
    
    showTransferDialog.value = false
    transferItem.value = null
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err.response?.data?.error || 'Impossible d\'effectuer le transfert',
      life: 3000
    })
  } finally {
    transferring.value = false
  }
}

const acknowledgeAlert = async (alertId) => {
  try {
    await stockStore.acknowledgeAlert(alertId)
    toast.add({
      severity: 'info',
      summary: 'Alerte prise en compte',
      life: 3000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de prendre en compte l\'alerte',
      life: 3000
    })
  }
}

const resolveAlert = async (alertId) => {
  try {
    await stockStore.resolveAlert(alertId)
    toast.add({
      severity: 'success',
      summary: 'Alerte résolue',
      life: 3000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de résoudre l\'alerte',
      life: 3000
    })
  }
}

onMounted(async () => {
  navigationStore.setActiveSection('stock')
  await loadData()
})
</script>

<style scoped>
.stock-page {
  min-height: 100vh;
  background: #f8fafc;
}

.page-header {
  background: #FFFFFF;
  border-bottom: 1px solid #e2e8f0;
  padding: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #0B2B3C;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.stock-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.overview-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.card-icon.total {
  background: #2563eb;
}

.card-icon.value {
  background: #7AC943;
}

.card-icon.warning {
  background: #f59e0b;
}

.card-icon.danger {
  background: #ef4444;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0B2B3C;
}

.card-label {
  color: #64748b;
  font-size: 0.875rem;
}

.alerts-section {
  max-width: 1400px;
  margin: 0 auto 2rem;
  padding: 0 2rem;
}

.alerts-section h3 {
  color: #0B2B3C;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alerts-list {
  display: grid;
  gap: 1rem;
}

.alert-item {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-item.high, .alert-item.critical {
  border-color: #ef4444;
  background: #fef2f2;
}

.alert-item.medium {
  border-color: #f59e0b;
  background: #fffbeb;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-type {
  font-weight: 600;
  color: #0B2B3C;
}

.alert-message {
  color: #475569;
}

.alert-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #64748b;
}

.alert-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.filters-section {
  max-width: 1400px;
  margin: 0 auto 2rem;
  padding: 1.5rem 2rem;
  display: flex;
  gap: 1rem;
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.table-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem 2rem;
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stock-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ref-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ref-cell small {
  color: #64748b;
  font-size: 0.75rem;
}

.quantity-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.quantity-cell small {
  color: #64748b;
  font-size: 0.75rem;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1rem 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  font-weight: 600;
  color: #0B2B3C;
  font-size: 0.875rem;
}

.transfer-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transfer-info {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}

.transfer-info p {
  margin: 0.25rem 0;
  color: #475569;
}
</style>

