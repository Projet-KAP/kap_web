<template>
  <Toast />
  <div class="workplaces-page">

    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Postes de charge</h1>
        <p>Gérez les postes de travail de votre organisation</p>
      </div>
      <Button
        label="Nouveau poste"
        icon="pi pi-plus"
        @click="showCreateDialog = true"
        class="btn-new"
      />
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-sitemap"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ workplaces.length }}</span>
          <span class="stat-label">Postes</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-cog"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ totalMachines }}</span>
          <span class="stat-label">Machines</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-building"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ sites.length }}</span>
          <span class="stat-label">Sites</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-chart-bar"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ avgMachinesPerWorkplace }}</span>
          <span class="stat-label">Moy. machines/poste</span>
        </div>
      </div>
    </div>

    <!-- Table card -->
    <div class="table-card">
      <!-- Filters bar -->
      <div class="filters-bar">
        <div class="search-box">
          <i class="pi pi-search search-icon"></i>
          <InputText
            v-model="searchQuery"
            placeholder="Rechercher un poste de charge..."
            class="search-input"
          />
          <i v-if="searchQuery" class="pi pi-times search-clear" @click="searchQuery = ''"></i>
        </div>
        <Select
          v-model="siteFilter"
          :options="sites"
          optionLabel="name"
          placeholder="Tous les sites"
          class="site-filter"
          showClear
        />
      </div>

      <!-- Section header -->
      <div class="section-header">
        <span class="section-title">
          {{ filteredWorkplaces.length }} poste{{ filteredWorkplaces.length !== 1 ? 's' : '' }}
          <span v-if="searchQuery || siteFilter" class="filter-hint">filtrés</span>
        </span>
      </div>

      <TableSkeleton
        v-if="loading"
        type="datatable"
        :columns="5"
        :rows="8"
        :showHeader="false"
      />

      <DataTable
        v-else
        :value="filteredWorkplaces"
        paginator
        :rows="12"
        :rowsPerPageOptions="[12, 25, 50]"
        paginatorTemplate="PrevPageLink PageLinks NextPageLink RowsPerPageDropdown"
        currentPageReportTemplate="{first}-{last} sur {totalRecords}"
        class="workplaces-table"
        responsiveLayout="scroll"
        :rowHover="true"
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-sitemap empty-icon"></i>
            <h3>Aucun poste trouvé</h3>
            <p v-if="searchQuery || siteFilter">Modifiez vos filtres pour voir plus de résultats.</p>
            <p v-else>Créez votre premier poste de charge pour commencer.</p>
            <Button
              v-if="!searchQuery && !siteFilter"
              label="Nouveau poste"
              icon="pi pi-plus"
              @click="showCreateDialog = true"
              class="btn-new"
            />
          </div>
        </template>

        <Column field="name" header="Nom du poste" sortable style="min-width: 200px">
          <template #body="{ data }">
            <div class="workplace-name-cell">
              <span class="workplace-icon-wrap"><i class="pi pi-sitemap"></i></span>
              <span class="workplace-name">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <Column field="site_name" header="Site" sortable style="min-width: 160px">
          <template #body="{ data }">
            <div class="site-cell">
              <i class="pi pi-building"></i>
              <span>{{ data.site_name || data.site?.name || '—' }}</span>
            </div>
          </template>
        </Column>

        <Column field="machines_count" header="Machines" sortable style="width: 130px">
          <template #body="{ data }">
            <span
              :class="['machines-badge', (data.machines_count || 0) === 0 ? 'machines-badge--zero' : 'machines-badge--active']"
              @click="openMachinesDrawer(data)"
              style="cursor: pointer"
              v-tooltip.top="'Gerer les machines'"
            >
              <i class="pi pi-cog"></i>
              {{ data.machines_count || 0 }}
            </span>
          </template>
        </Column>

        <Column field="description" header="Description" style="min-width: 220px">
          <template #body="{ data }">
            <span class="description-cell">{{ data.description || '—' }}</span>
          </template>
        </Column>

        <Column header="Actions" :exportable="false" style="width: 140px">
          <template #body="{ data }">
            <div class="action-buttons">
              <button class="action-btn action-btn--machines" @click="openMachinesDrawer(data)" v-tooltip.top="'Machines'">
                <i class="pi pi-cog"></i>
              </button>
              <button class="action-btn action-btn--edit" @click="editWorkplace(data)" v-tooltip.top="'Modifier'">
                <i class="pi pi-pencil"></i>
              </button>
              <button class="action-btn action-btn--delete" @click="confirmDelete(data)" v-tooltip.top="'Supprimer'">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog création/édition -->
    <Dialog
      v-model:visible="showCreateDialog"
      :modal="true"
      :closable="true"
      :closeOnEscape="true"
      :dismissableMask="true"
      :style="{ width: 'min(560px, 95vw)', maxHeight: '90vh' }"
      :contentStyle="{ padding: '1.25rem 1.5rem', overflowY: 'auto' }"
      class="workplace-modal"
    >
      <template #header>
        <span class="modal-title">{{ editingWorkplace ? 'Modifier le poste' : 'Nouveau poste de charge' }}</span>
      </template>

      <div class="modal-form">
        <div class="form-grid">
          <div class="form-field">
            <label>Nom du poste <span class="required">*</span></label>
            <InputText
              v-model="workplaceForm.name"
              placeholder="Ex: Atelier Mécanique"
              :class="{ 'p-invalid': formErrors.name }"
            />
            <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
          </div>
          <div class="form-field">
            <label>Site <span class="required">*</span></label>
            <Select
              v-model="workplaceForm.site"
              :options="sites"
              optionLabel="name"
              placeholder="Sélectionner un site"
              :class="{ 'p-invalid': formErrors.site }"
            />
            <small v-if="formErrors.site" class="p-error">{{ formErrors.site }}</small>
          </div>
        </div>
        <div class="form-field">
          <label>Description</label>
          <Textarea
            v-model="workplaceForm.description"
            placeholder="Description du poste de charge..."
            :rows="3"
            autoResize
          />
        </div>
      </div>

      <template #footer>
        <div class="modal-footer">
          <Button label="Annuler" text @click="cancelEdit" class="btn-cancel" />
          <Button
            :label="editingWorkplace ? 'Sauvegarder' : 'Créer le poste'"
            :icon="editingWorkplace ? 'pi pi-save' : 'pi pi-plus'"
            @click="saveWorkplace"
            :loading="saving"
            class="btn-save"
          />
        </div>
      </template>
    </Dialog>

    <WorkplaceMachinesDrawer
      ref="machinesDrawer"
      :workplaceId="selectedWorkplaceId"
      :workplace="selectedWorkplace"
      :allWorkplaces="workplaces"
      @refresh="loadWorkplaces"
    />

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useUserStore } from '@/features/user/stores/userStore'
import WorkplaceMachinesDrawer from '@/features/admin/components/WorkplaceMachinesDrawer.vue'

const confirm = useConfirm()
const toast = useToast()
const userStore = useUserStore()

const loading = ref(false)
const saving = ref(false)
const showCreateDialog = ref(false)
const editingWorkplace = ref(null)
const searchQuery = ref('')
const siteFilter = ref(null)
const workplaces = ref([])
const sites = ref([])
const formErrors = ref({})

const workplaceForm = ref({ name: '', site: null, description: '' })
const machinesDrawer = ref(null)
const selectedWorkplaceId = ref(null)
const selectedWorkplace = ref(null)

const openMachinesDrawer = (workplace) => {
  selectedWorkplaceId.value = workplace.id
  selectedWorkplace.value = workplace
  machinesDrawer.value?.open(workplace.id)
}

const filteredWorkplaces = computed(() => {
  let filtered = workplaces.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.description?.toLowerCase().includes(q) ||
      w.site_name?.toLowerCase().includes(q)
    )
  }
  if (siteFilter.value) {
    filtered = filtered.filter(w =>
      w.site?.id === siteFilter.value.id || w.site === siteFilter.value.id
    )
  }
  return filtered
})

const totalMachines = computed(() =>
  workplaces.value.reduce((sum, w) => sum + (w.machines_count || 0), 0)
)

const avgMachinesPerWorkplace = computed(() => {
  if (!workplaces.value.length) return 0
  return (totalMachines.value / workplaces.value.length).toFixed(1)
})

const loadWorkplaces = async () => {
  loading.value = true
  try {
    const result = await userStore.getWorkplaces()
    if (result.success) workplaces.value = result.workplaces || []
    else toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les postes', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les postes', life: 3000 })
  } finally {
    loading.value = false
  }
}

const loadSites = async () => {
  try {
    const result = await userStore.getSites()
    if (result.success) sites.value = result.sites || []
  } catch {}
}

const editWorkplace = (workplace) => {
  editingWorkplace.value = workplace
  workplaceForm.value = { name: workplace.name, site: workplace.site, description: workplace.description || '' }
  formErrors.value = {}
  showCreateDialog.value = true
}

const validateForm = () => {
  const errors = {}
  if (!workplaceForm.value.name?.trim()) errors.name = 'Le nom est requis'
  if (!workplaceForm.value.site) errors.site = 'Le site est requis'
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const saveWorkplace = async () => {
  if (!validateForm()) return
  saving.value = true
  try {
    const data = {
      name: workplaceForm.value.name.trim(),
      site: workplaceForm.value.site?.id || workplaceForm.value.site,
      description: workplaceForm.value.description || ''
    }
    const result = editingWorkplace.value
      ? await userStore.updateWorkplace(editingWorkplace.value.id, data)
      : await userStore.createWorkplace(data)

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: editingWorkplace.value ? 'Poste modifié avec succès' : 'Poste créé avec succès',
        life: 3000
      })
      await loadWorkplaces()
      cancelEdit()
    } else {
      toast.add({ severity: 'error', summary: 'Erreur', detail: result.error || 'Impossible de sauvegarder', life: 3000 })
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder', life: 3000 })
  } finally {
    saving.value = false
  }
}

const cancelEdit = () => {
  editingWorkplace.value = null
  showCreateDialog.value = false
  workplaceForm.value = { name: '', site: null, description: '' }
  formErrors.value = {}
}

const confirmDelete = (workplace) => {
  confirm.require({
    message: `Supprimer le poste "${workplace.name}" ?`,
    header: 'Confirmer la suppression',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Annuler',
    acceptLabel: 'Supprimer',
    acceptClass: 'p-button-danger',
    accept: () => deleteWorkplace(workplace.id)
  })
}

const deleteWorkplace = async (id) => {
  try {
    const result = await userStore.deleteWorkplace(id)
    if (result.success) {
      toast.add({ severity: 'success', summary: 'Supprimé', detail: 'Poste supprimé avec succès', life: 3000 })
      await loadWorkplaces()
    } else {
      toast.add({ severity: 'error', summary: 'Erreur', detail: result.error || 'Impossible de supprimer', life: 3000 })
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer', life: 3000 })
  }
}

onMounted(() => {
  loadWorkplaces()
  loadSites()
})
</script>

<style scoped>
.workplaces-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Header ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.header-content h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0B2B3C;
  margin: 0 0 0.2rem;
}

.header-content p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.btn-new {
  background: #7AC943 !important;
  border-color: #7AC943 !important;
  color: white !important;
  font-weight: 600;
  padding: 0.625rem 1.25rem;
}
.btn-new:hover { background: #6bb835 !important; border-color: #6bb835 !important; }

/* ── Stats ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 0.875rem 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(122, 201, 67, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon i {
  color: #7AC943;
  font-size: 1rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0B2B3C;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ── Table card ── */
.table-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
  overflow: hidden;
}

/* ── Filters bar ── */
.filters-bar {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.85rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding-left: 2.25rem !important;
}

.search-clear {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.8rem;
  cursor: pointer;
}
.search-clear:hover { color: #475569; }

.site-filter {
  min-width: 200px;
}

/* ── Section header ── */
.section-header {
  padding: 0.625rem 1.25rem;
  border-bottom: 1px solid #f8fafc;
}

.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-hint {
  font-weight: 400;
  color: #7AC943;
  margin-left: 0.3rem;
}

/* ── Table ── */
.workplaces-table {
  border: none;
}

.workplace-name-cell {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.workplace-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: rgba(122, 201, 67, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.workplace-icon-wrap i {
  color: #7AC943;
  font-size: 0.8rem;
}

.workplace-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.875rem;
}

.site-cell {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #475569;
  font-size: 0.875rem;
}

.site-cell i {
  color: #94a3b8;
  font-size: 0.8rem;
}

.machines-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.machines-badge--active {
  background: rgba(122, 201, 67, 0.1);
  color: #5a9e30;
}

.machines-badge--zero {
  background: #f1f5f9;
  color: #94a3b8;
}

.machines-badge i { font-size: 0.72rem; }

.description-cell {
  color: #64748b;
  font-size: 0.875rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Action buttons ── */
.action-buttons {
  display: flex;
  gap: 0.375rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.8rem;
}

.action-btn--machines { color: #64748b; }
.action-btn--machines:hover { background: #eff6ff; border-color: #60a5fa; color: #3b82f6; }

.action-btn--edit { color: #64748b; }
.action-btn--edit:hover { background: #f0fdf4; border-color: #7AC943; color: #7AC943; }

.action-btn--delete { color: #94a3b8; }
.action-btn--delete:hover { background: #fef2f2; border-color: #fca5a5; color: #ef4444; }

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 0.75rem;
  text-align: center;
}

.empty-icon {
  font-size: 2.5rem;
  color: #cbd5e1;
}

.empty-state h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
  margin: 0;
}

.empty-state p {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
  max-width: 320px;
}

/* ── Modal ── */
:deep(.workplace-modal .p-dialog-header) {
  padding: 1.125rem 1.5rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

:deep(.workplace-modal .p-dialog-footer) {
  padding: 0.875rem 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.form-field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
}

.required { color: #ef4444; margin-left: 2px; }

.form-field :deep(.p-inputtext),
.form-field :deep(.p-select),
.form-field :deep(.p-textarea) {
  width: 100%;
  border-radius: 7px;
  border-color: #e2e8f0;
  font-size: 0.875rem;
}

.form-field :deep(.p-inputtext:focus),
.form-field :deep(.p-select:focus),
.form-field :deep(.p-textarea:focus) {
  border-color: #7AC943;
  box-shadow: 0 0 0 2px rgba(122, 201, 67, 0.15);
}

.form-field :deep(.p-invalid) { border-color: #ef4444 !important; }
.form-field :deep(.p-error) { color: #ef4444; font-size: 0.78rem; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
}

.btn-cancel { color: #64748b !important; }
.btn-save { background: #7AC943 !important; border-color: #7AC943 !important; color: white !important; font-weight: 600; }
.btn-save:hover { background: #6bb835 !important; border-color: #6bb835 !important; }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .workplaces-page { padding: 1rem; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .page-header { flex-direction: column; gap: 1rem; }
  .filters-bar { flex-direction: column; align-items: stretch; }
  .search-box { max-width: 100%; }
  .site-filter { min-width: auto; }
  .form-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
}
</style>
