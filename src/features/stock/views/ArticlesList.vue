<template>
  <div class="articles-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <i class="pi pi-box"></i>
        </div>
        <div class="header-text">
          <h1>Articles en Stock</h1>
          <p>{{ totalRecords }} article{{ totalRecords > 1 ? 's' : '' }} au total</p>
        </div>
      </div>
      <div class="header-actions">
        <Button
          icon="pi pi-upload"
          label="Import CSV"
          @click="showImportDialog = true"
          outlined
          size="small"
        />
        <Button
          icon="pi pi-plus"
          label="Nouvel article"
          @click="openCreateDialog"
          size="small"
          class="btn-primary"
        />
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="search-box">
        <i class="pi pi-search"></i>
        <input
          type="text"
          v-model="filters.search"
          placeholder="Rechercher par reference, nom, fabricant..."
          @input="handleSearch"
        />
        <i v-if="filters.search" class="pi pi-times clear-btn" @click="filters.search = ''; applyFilters()"></i>
      </div>
      <div class="filter-chips">
        <Select
          v-model="filters.warehouse"
          :options="warehouseOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Entrepot"
          @change="applyFilters"
          class="filter-select"
        />
        <Select
          v-model="filters.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Statut"
          @change="applyFilters"
          class="filter-select"
        />
        <Select
          v-model="filters.stockState"
          :options="stockStateOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Etat stock"
          @change="applyFilters"
          class="filter-select"
        />
        <button
          v-if="hasActiveFilters"
          class="reset-btn"
          @click="resetFilters"
        >
          <i class="pi pi-filter-slash"></i>
          Reinitialiser
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <DataTable
        v-model:selection="selectedArticles"
        :value="articles"
        :loading="loading"
        :paginator="articles.length > 20"
        :rows="20"
        :rowsPerPageOptions="[20, 50, 100]"
        :totalRecords="totalRecords"
        dataKey="id"
        class="articles-table"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="{first}-{last} sur {totalRecords}"
        :rowHover="true"
      >
        <template #empty>
          <div class="empty-state">
            <div class="empty-icon">
              <i class="pi pi-inbox"></i>
            </div>
            <h3>Aucun article trouve</h3>
            <p v-if="hasActiveFilters">Essayez de modifier vos filtres</p>
            <p v-else>Ajoutez votre premier article pour commencer</p>
            <div class="empty-actions">
              <Button
                v-if="hasActiveFilters"
                label="Reinitialiser les filtres"
                icon="pi pi-filter-slash"
                @click="resetFilters"
                outlined
                size="small"
              />
              <Button
                v-else
                label="Ajouter un article"
                icon="pi pi-plus"
                @click="openCreateDialog"
                size="small"
                class="btn-primary"
              />
            </div>
          </div>
        </template>

        <Column selectionMode="multiple" style="width: 2.5rem" :exportable="false"></Column>

        <Column field="reference" header="Article" sortable style="min-width: 280px">
          <template #body="{ data }">
            <div class="article-cell">
              <div class="article-main">
                <span class="article-ref">{{ data.reference }}</span>
                <span class="article-name">{{ data.name }}</span>
              </div>
              <span v-if="data.manufacturer" class="article-manufacturer">{{ data.manufacturer }}</span>
            </div>
          </template>
        </Column>

        <Column field="quantity" header="Stock" sortable style="min-width: 160px">
          <template #body="{ data }">
            <div class="stock-cell">
              <div class="stock-main">
                <span class="stock-qty" :class="getStockClass(data)">{{ data.quantity }}</span>
                <span class="stock-unit">{{ data.stock_unit }}</span>
              </div>
              <div class="stock-bar" v-if="data.threshold > 0">
                <div
                  class="stock-bar-fill"
                  :class="getStockBarClass(data)"
                  :style="{ width: getStockPercent(data) + '%' }"
                ></div>
              </div>
              <Tag
                v-if="data.is_out_of_stock"
                severity="danger"
                value="Rupture"
                class="stock-tag"
              />
              <Tag
                v-else-if="data.is_low_stock"
                severity="warning"
                value="Faible"
                class="stock-tag"
              />
            </div>
          </template>
        </Column>

        <Column field="unit_price" header="Prix unit." sortable style="min-width: 110px">
          <template #body="{ data }">
            <span class="price-value">{{ formatCurrency(data.unit_price) }}</span>
          </template>
        </Column>

        <Column field="total_value" header="Valeur" sortable style="min-width: 120px">
          <template #body="{ data }">
            <span class="value-total">{{ formatCurrency(data.total_value) }}</span>
          </template>
        </Column>

        <Column field="warehouse" header="Emplacement" sortable style="min-width: 180px">
          <template #body="{ data }">
            <div class="location-cell">
              <span class="location-warehouse">{{ data.warehouse_name || '-' }}</span>
              <span v-if="data.site_name" class="location-site">{{ data.site_name }}</span>
            </div>
          </template>
        </Column>

        <Column field="status" header="Statut" sortable style="min-width: 110px">
          <template #body="{ data }">
            <span class="status-dot" :class="getStatusClass(data.status)"></span>
            <span class="status-text">{{ getStatusLabel(data.status) }}</span>
          </template>
        </Column>

        <Column :exportable="false" style="width: 120px" header="">
          <template #body="{ data }">
            <div class="row-actions">
              <button class="action-btn" @click="viewArticle(data)" v-tooltip.top="'Details'">
                <i class="pi pi-eye"></i>
              </button>
              <button class="action-btn" @click="editArticle(data)" v-tooltip.top="'Modifier'">
                <i class="pi pi-pencil"></i>
              </button>
              <button class="action-btn" @click="createMovement(data)" v-tooltip.top="'Mouvement'">
                <i class="pi pi-arrow-right-arrow-left"></i>
              </button>
              <button class="action-btn danger" @click="deleteArticle(data)" v-tooltip.top="'Supprimer'">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Selection Bar -->
    <Transition name="slide-up">
      <div v-if="selectedArticles.length > 0" class="selection-bar">
        <div class="selection-content">
          <span class="selection-count">{{ selectedArticles.length }} selectionne{{ selectedArticles.length > 1 ? 's' : '' }}</span>
          <div class="selection-actions">
            <Button
              label="Exporter"
              icon="pi pi-download"
              @click="exportSelected"
              outlined
              size="small"
            />
            <Button
              label="Supprimer"
              icon="pi pi-trash"
              @click="deleteSelected"
              severity="danger"
              outlined
              size="small"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Dialog Article Detail -->
    <Dialog
      v-model:visible="showDetailDialog"
      modal
      header="Details de l'article"
      :style="{ width: '800px', maxWidth: '95vw' }"
    >
      <div v-if="selectedArticle" class="article-details">
        <div class="detail-header">
          <div>
            <span class="detail-ref">{{ selectedArticle.reference }}</span>
            <h3>{{ selectedArticle.name }}</h3>
          </div>
          <Tag :severity="getStatusSeverity(selectedArticle.status)" :value="getStatusLabel(selectedArticle.status)" />
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Code alternatif</label>
            <span>{{ selectedArticle.alternative_code || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>Code-barres</label>
            <span>{{ selectedArticle.barcode || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>Fabricant</label>
            <span>{{ selectedArticle.manufacturer || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>Ref. Fabricant</label>
            <span>{{ selectedArticle.manufacturer_ref || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>Quantite</label>
            <span :class="getQuantityClass(selectedArticle)">{{ selectedArticle.quantity }} {{ selectedArticle.stock_unit }}</span>
          </div>
          <div class="detail-item">
            <label>Stock minimum</label>
            <span>{{ selectedArticle.min_stock }} {{ selectedArticle.stock_unit }}</span>
          </div>
          <div class="detail-item">
            <label>Prix unitaire</label>
            <span>{{ formatCurrency(selectedArticle.unit_price) }}</span>
          </div>
          <div class="detail-item">
            <label>Valeur totale</label>
            <span class="value-total">{{ formatCurrency(selectedArticle.total_value) }}</span>
          </div>
          <div class="detail-item">
            <label>Site</label>
            <span>{{ selectedArticle.site_name || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>Entrepot</label>
            <span>{{ selectedArticle.warehouse_name || '-' }}</span>
          </div>
          <div v-if="selectedArticle.description" class="detail-item full">
            <label>Description</label>
            <span>{{ selectedArticle.description }}</span>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Modals -->
    <ArticleFormModal
      v-model:visible="showArticleDialog"
      :article="articleToEdit"
      @saved="handleArticleSaved"
    />
    <MovementFormModal
      v-model:visible="showMovementDialog"
      :article="articleForMovement"
      @saved="handleMovementSaved"
    />
    <StockCSVImportModal
      v-model:visible="showImportDialog"
      @import-completed="handleImportCompleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStockStore } from '@/features/stock/stores/stockStore'
import { useToast } from 'primevue/usetoast'
import { axiosInstance } from '@/main.js'
import ArticleFormModal from '@/features/stock/components/ArticleFormModal.vue'
import MovementFormModal from '@/features/stock/components/MovementFormModal.vue'
import StockCSVImportModal from '@/features/stock/components/StockCSVImportModal.vue'

const router = useRouter()
const route = useRoute()
const stockStore = useStockStore()
const toast = useToast()

// State
const selectedArticles = ref([])
const showDetailDialog = ref(false)
const showArticleDialog = ref(false)
const showMovementDialog = ref(false)
const showImportDialog = ref(false)
const selectedArticle = ref(null)
const articleToEdit = ref(null)
const articleForMovement = ref(null)

// Filters
const filters = ref({
  search: '',
  warehouse: null,
  site: null,
  status: null,
  stockState: null
})

// Computed
const articles = computed(() => stockStore.spareParts)
const loading = computed(() => stockStore.loading)
const totalRecords = computed(() => articles.value.length)

const hasActiveFilters = computed(() => {
  return filters.value.search || filters.value.warehouse || filters.value.site || filters.value.status || filters.value.stockState
})

const warehouseOptions = ref([
  { label: 'Tous les entrepots', value: null }
])

const statusOptions = ref([
  { label: 'Tous les statuts', value: null },
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'En commande', value: 'EN_COMMANDE' },
  { label: 'Reserve', value: 'RESERVE' },
  { label: 'Indisponible', value: 'INDISPONIBLE' }
])

const stockStateOptions = ref([
  { label: 'Tous', value: null },
  { label: 'En alerte', value: 'low_stock' },
  { label: 'En rupture', value: 'out_of_stock' },
  { label: 'Normal', value: 'normal' }
])

// Methods
const loadArticles = async () => {
  try {
    await stockStore.loadSpareParts(filters.value)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les articles',
      life: 3000
    })
  }
}

const handleSearch = () => {
  clearTimeout(window.searchTimeout)
  window.searchTimeout = setTimeout(() => {
    applyFilters()
  }, 300)
}

const applyFilters = () => {
  loadArticles()
}

const resetFilters = () => {
  filters.value = {
    search: '',
    warehouse: null,
    site: null,
    status: null,
    stockState: null
  }
  loadArticles()
}

const viewArticle = (article) => {
  selectedArticle.value = article
  showDetailDialog.value = true
}

const editArticle = (article) => {
  articleToEdit.value = article
  showArticleDialog.value = true
}

const createMovement = (article) => {
  articleForMovement.value = article
  showMovementDialog.value = true
}

const deleteArticle = async (article) => {
  if (confirm(`Supprimer l'article "${article.name}" ?`)) {
    try {
      await stockStore.deleteSparePart(article.id)
      toast.add({
        severity: 'success',
        summary: 'Article supprime',
        detail: `${article.reference} a ete supprime`,
        life: 3000
      })
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: "Impossible de supprimer l'article",
        life: 3000
      })
    }
  }
}

const deleteSelected = () => {
  if (confirm(`Supprimer ${selectedArticles.value.length} article(s) ?`)) {
    toast.add({
      severity: 'info',
      summary: 'Info',
      detail: 'Fonctionnalite en cours de developpement',
      life: 3000
    })
  }
}

const openCreateDialog = () => {
  articleToEdit.value = null
  showArticleDialog.value = true
}

const handleArticleSaved = () => {
  loadArticles()
}

const handleMovementSaved = () => {
  loadArticles()
  toast.add({
    severity: 'success',
    summary: 'Mouvement enregistre',
    life: 3000
  })
}

const handleImportCompleted = () => {
  loadArticles()
}

const exportSelected = () => {
  toast.add({ severity: 'info', summary: 'Info', detail: 'Export en cours de developpement', life: 3000 })
}

const formatCurrency = (value) => {
  if (!value || value == 0) return '-'
  return new Intl.NumberFormat('fr-FR').format(value) + ' F'
}

const getQuantityClass = (article) => {
  if (article.is_out_of_stock) return 'qty-danger'
  if (article.is_low_stock) return 'qty-warning'
  return 'qty-ok'
}

const getStockClass = (data) => {
  if (data.is_out_of_stock) return 'danger'
  if (data.is_low_stock) return 'warning'
  return 'ok'
}

const getStockBarClass = (data) => {
  if (data.is_out_of_stock) return 'danger'
  if (data.is_low_stock) return 'warning'
  return 'ok'
}

const getStockPercent = (data) => {
  if (!data.threshold || data.threshold === 0) return 100
  const max = data.max_stock || data.threshold * 3
  return Math.min(100, Math.round((parseFloat(data.quantity) / max) * 100))
}

const getStatusSeverity = (status) => {
  const severities = {
    'DISPONIBLE': 'success',
    'EN_COMMANDE': 'warning',
    'RESERVE': 'info',
    'INDISPONIBLE': 'danger'
  }
  return severities[status] || 'secondary'
}

const getStatusClass = (status) => {
  const classes = {
    'DISPONIBLE': 'green',
    'EN_COMMANDE': 'orange',
    'RESERVE': 'blue',
    'INDISPONIBLE': 'red'
  }
  return classes[status] || 'gray'
}

const getStatusLabel = (status) => {
  const labels = {
    'DISPONIBLE': 'Disponible',
    'EN_COMMANDE': 'En commande',
    'RESERVE': 'Reserve',
    'INDISPONIBLE': 'Indisponible'
  }
  return labels[status] || status
}

onMounted(async () => {
  await loadArticles()
  await stockStore.loadWarehouses()

  // Populate warehouse filter options
  if (stockStore.warehouses.length > 0) {
    warehouseOptions.value = [
      { label: 'Tous les entrepots', value: null },
      ...stockStore.warehouses.map(w => ({ label: w.name, value: w.id }))
    ]
  }

  await handleArticleIdFromQuery()
})

const handleArticleIdFromQuery = async () => {
  const articleId = route.query.articleId
  if (!articleId) return

  const articleIdNum = parseInt(articleId)
  if (isNaN(articleIdNum)) {
    router.replace({ query: {} })
    return
  }

  let article = articles.value.find(a => a.id === articleIdNum)

  if (!article) {
    try {
      const response = await axiosInstance.get(`/stock/spare-parts/${articleIdNum}/`)
      if (response.data) {
        article = response.data
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: "Impossible de charger l'article",
        life: 3000
      })
      router.replace({ query: {} })
      return
    }
  }

  if (article) {
    viewArticle(article)
    router.replace({ query: {} })
  } else {
    router.replace({ query: {} })
  }
}

watch(() => route.query.articleId, async (articleId) => {
  if (articleId) {
    await handleArticleIdFromQuery()
  }
})
</script>

<style scoped lang="scss">
.articles-page {
  padding: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
}

/* ==================== HEADER ==================== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.header-icon {
  width: 44px;
  height: 44px;
  background: #3b82f6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  i { font-size: 1.125rem; color: white; }
}

.header-text {
  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  p {
    font-size: 0.8125rem;
    color: #64748b;
    margin: 0;
  }
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  background: #22c55e !important;
  border-color: #22c55e !important;
  &:hover { background: #16a34a !important; border-color: #16a34a !important; }
}

/* ==================== FILTERS ==================== */
.filters-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
  max-width: 400px;

  i.pi-search {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 0.875rem;
  }

  input {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 2.25rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.8125rem;
    background: white;
    transition: all 0.15s;
    height: 36px;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    &::placeholder { color: #94a3b8; }
  }

  .clear-btn {
    position: absolute;
    right: 0.625rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    cursor: pointer;
    font-size: 0.6875rem;
    padding: 0.25rem;
    &:hover { color: #64748b; }
  }
}

.filter-chips {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-select {
  :deep(.p-select) {
    height: 36px;
    font-size: 0.8125rem;
    border-radius: 8px;
    min-width: 140px;
  }
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  height: 36px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: none;
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: #94a3b8; color: #475569; background: #f8fafc; }

  i { font-size: 0.75rem; }
}

/* ==================== TABLE ==================== */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.articles-table {
  :deep(.p-datatable-thead > tr > th) {
    background: #f8fafc;
    color: #64748b;
    font-weight: 600;
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid #e2e8f0;
    border-width: 0 0 1px 0;
  }

  :deep(.p-datatable-tbody > tr > td) {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
    border-width: 0 0 1px 0;
    border-color: #f1f5f9;
  }

  :deep(.p-datatable-tbody > tr:hover > td) {
    background: #f8fafc;
  }

  :deep(.p-datatable-tbody > tr:last-child > td) {
    border-bottom: none;
  }

  :deep(.p-paginator) {
    padding: 0.625rem 0.75rem;
    border-top: 1px solid #f1f5f9;
    font-size: 0.8125rem;
  }
}

/* ==================== CELLS ==================== */
.article-cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.article-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.article-ref {
  font-family: monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  white-space: nowrap;
}

.article-name {
  font-weight: 500;
  color: #1e293b;
}

.article-manufacturer {
  font-size: 0.6875rem;
  color: #94a3b8;
  padding-left: 0;
}

.stock-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stock-main {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.stock-qty {
  font-size: 0.9375rem;
  font-weight: 700;

  &.ok { color: #16a34a; }
  &.warning { color: #d97706; }
  &.danger { color: #dc2626; }
}

.stock-unit {
  font-size: 0.6875rem;
  color: #94a3b8;
  font-weight: 500;
}

.stock-bar {
  width: 60px;
  height: 3px;
  background: #f1f5f9;
  border-radius: 2px;
  overflow: hidden;
}

.stock-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;

  &.ok { background: #22c55e; }
  &.warning { background: #f59e0b; }
  &.danger { background: #ef4444; }
}

.stock-tag {
  width: fit-content;
  font-size: 0.5625rem !important;
  padding: 0 0.375rem !important;
  height: 16px;
}

.price-value {
  color: #64748b;
  font-size: 0.8125rem;
}

.value-total {
  font-weight: 600;
  color: #1e293b;
}

.location-cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.location-warehouse {
  font-weight: 500;
  color: #374151;
  font-size: 0.8125rem;
}

.location-site {
  font-size: 0.6875rem;
  color: #94a3b8;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 0.375rem;
  vertical-align: middle;

  &.green { background: #22c55e; }
  &.orange { background: #f59e0b; }
  &.blue { background: #3b82f6; }
  &.red { background: #ef4444; }
  &.gray { background: #9ca3af; }
}

.status-text {
  font-size: 0.8125rem;
  color: #374151;
}

/* ==================== ROW ACTIONS ==================== */
.row-actions {
  display: flex;
  gap: 0.125rem;
  opacity: 0.4;
  transition: opacity 0.15s;
}

:deep(.p-datatable-tbody > tr:hover) .row-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  color: #64748b;

  i { font-size: 0.75rem; }

  &:hover {
    background: #f1f5f9;
    color: #3b82f6;
  }

  &.danger:hover {
    background: #fef2f2;
    color: #dc2626;
  }
}

/* ==================== EMPTY STATE ==================== */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.8125rem;
    color: #94a3b8;
    margin: 0 0 1rem 0;
  }
}

.empty-icon {
  width: 56px;
  height: 56px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  i { font-size: 1.5rem; color: #94a3b8; }
}

.empty-actions {
  display: flex;
  justify-content: center;
}

/* ==================== SELECTION BAR ==================== */
.selection-bar {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.selection-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #1e293b;
  color: white;
  padding: 0.625rem 1rem;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.selection-count {
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
}

.selection-actions {
  display: flex;
  gap: 0.5rem;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateX(-50%) translateY(20px);
  opacity: 0;
}

/* ==================== DETAIL DIALOG ==================== */
.article-details {
  padding: 0.5rem 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;

  .detail-ref {
    font-family: monospace;
    font-size: 0.75rem;
    font-weight: 600;
    color: #3b82f6;
    background: #eff6ff;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
  }

  h3 {
    margin: 0.375rem 0 0 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #0f172a;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &.full { grid-column: 1 / -1; }

  label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  span {
    font-size: 0.9375rem;
    color: #1e293b;
  }
}

.qty-danger { color: #dc2626; font-weight: 600; }
.qty-warning { color: #d97706; font-weight: 600; }
.qty-ok { color: #16a34a; font-weight: 600; }

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .articles-page { padding: 1rem; }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions { justify-content: flex-end; }

  .filters-bar { flex-direction: column; }
  .search-box { max-width: none; }

  .detail-grid { grid-template-columns: 1fr; }
}
</style>
