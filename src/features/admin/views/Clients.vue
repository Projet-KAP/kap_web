<template>
  <div class="clients-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Gestion des Clients</h1>
        <p class="page-subtitle">Gerez vos clients, leurs modules et credits IA</p>
      </div>
      <Button
        label="Nouveau Client"
        icon="pi pi-plus"
        @click="showCreateDialog = true"
        class="new-client-btn"
      />
    </div>

    <!-- Stats summary -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="pi pi-briefcase"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ clientStore.clientsCount }}</span>
          <span class="stat-label">Clients</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="pi pi-building"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalSites }}</span>
          <span class="stat-label">Sites</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon icon-ai">
          <i class="pi pi-microchip"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ clientsWithAI }}</span>
          <span class="stat-label">Clients IA actifs</span>
        </div>
      </div>
      <div class="stat-card" :class="{ 'stat-alert': clientsInAlert > 0 }">
        <div class="stat-icon" :class="{ 'icon-alert': clientsInAlert > 0 }">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ clientsInAlert }}</span>
          <span class="stat-label">Alertes quota</span>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="page-content">
      <div class="filters-section">
        <div class="search-filter">
          <InputGroup>
            <InputGroupAddon>
              <i class="pi pi-search"></i>
            </InputGroupAddon>
            <InputText
              v-model="clientStore.searchQuery"
              placeholder="Rechercher un client..."
              class="search-input"
            />
          </InputGroup>
        </div>
      </div>

      <!-- Client cards -->
      <div v-if="clientStore.loading" class="loading-state">
        <ProgressSpinner style="width: 40px; height: 40px" />
        <span>Chargement des clients...</span>
      </div>

      <div v-else-if="clientStore.filteredClients.length === 0" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>Aucun client trouve</p>
      </div>

      <div v-else class="clients-grid">
        <div
          v-for="client in clientStore.filteredClients"
          :key="client.id"
          class="client-card"
        >
          <div class="card-header">
            <div class="client-identity">
              <div v-if="client.logo_url" class="client-logo">
                <img :src="client.logo_url" :alt="client.name" />
              </div>
              <div v-else class="client-avatar">
                {{ client.name.charAt(0).toUpperCase() }}
              </div>
              <div class="client-meta">
                <h3 class="client-name">{{ client.name }}</h3>
                <span class="client-desc">{{ client.description || 'Aucune description' }}</span>
              </div>
            </div>
            <div class="card-actions">
              <Button icon="pi pi-microchip" text size="small" v-tooltip.top="'Config IA'" @click="openAIConfig(client)" class="action-ai" />
              <Button icon="pi pi-cog" text size="small" v-tooltip.top="'Modules'" @click="manageModules(client)" />
              <Button icon="pi pi-pencil" text size="small" v-tooltip.top="'Modifier'" @click="editClient(client)" />
              <Button icon="pi pi-trash" text size="small" severity="danger" v-tooltip.top="'Supprimer'" @click="confirmDelete(client)" />
            </div>
          </div>

          <div class="card-body">
            <div class="card-stats">
              <div class="card-stat">
                <i class="pi pi-building"></i>
                <span>{{ client.sites_count || 0 }} site(s)</span>
              </div>
              <div class="card-stat">
                <i class="pi pi-calendar"></i>
                <span>{{ formatDate(client.creation_date) }}</span>
              </div>
            </div>

            <!-- Token usage mini bar -->
            <TokenUsageBar
              v-if="clientStore.tokenUsage[client.id]"
              :usage="clientStore.tokenUsage[client.id]"
            />
            <div v-else class="no-ai-config">
              <i class="pi pi-microchip"></i>
              <span>IA non configuree</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog creation/edition -->
    <Dialog
      v-model:visible="showCreateDialog"
      modal
      class="client-dialog"
      :style="{ width: '50rem' }"
    >
      <template #header>
        <h3>{{ editingClient ? 'Modifier le Client' : 'Nouveau Client' }}</h3>
      </template>
      <div class="dialog-content">
        <div class="form-row">
          <div class="form-group full-width">
            <label for="clientName">Nom du client *</label>
            <InputText
              id="clientName"
              v-model="clientForm.name"
              placeholder="Entrez le nom du client"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label for="clientDescription">Description</label>
            <Textarea
              id="clientDescription"
              v-model="clientForm.description"
              placeholder="Description du client"
              rows="3"
              class="form-textarea"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label for="clientLogo">Logo du client</label>
            <div class="logo-upload-section">
              <div v-if="logoPreview || (editingClient && editingClient.logo_url)" class="logo-preview">
                <img
                  :src="logoPreview || editingClient?.logo_url"
                  alt="Logo"
                  class="preview-image"
                />
                <Button
                  icon="pi pi-times"
                  class="remove-logo-btn"
                  size="small"
                  severity="danger"
                  rounded
                  @click="removeLogo"
                  v-tooltip.top="'Supprimer le logo'"
                />
              </div>
              <FileUpload
                v-else
                mode="basic"
                accept="image/*"
                :maxFileSize="2000000"
                @select="onLogoSelect"
                chooseLabel="Choisir un logo"
                class="logo-uploader"
              />
              <small class="upload-hint">Format: PNG, JPG, GIF. Taille max: 2MB</small>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button label="Annuler" text @click="cancelEdit" />
          <Button
            :label="editingClient ? 'Modifier' : 'Créer'"
            @click="saveClient"
            :loading="saving"
            class="save-btn"
          />
        </div>
      </template>
    </Dialog>

    <!-- Confirm delete -->
    <ConfirmDialog />

    <!-- Modules modal -->
    <ClientModulesModal
      v-model:visible="showModulesDialog"
      :client="selectedClient"
      @saved="onModulesSaved"
    />

    <!-- AI Config panel -->
    <ClientAIConfigPanel
      v-model:visible="showAIConfigDialog"
      :client="selectedClient"
      @saved="onAIConfigSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

defineOptions({ name: 'ClientsView' })

import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useClientStore } from '../stores/clientStore'
import ClientModulesModal from '../components/ClientModulesModal.vue'
import ClientAIConfigPanel from '../components/ClientAIConfigPanel.vue'
import TokenUsageBar from '../components/TokenUsageBar.vue'

const confirm = useConfirm()
const toast = useToast()
const clientStore = useClientStore()

// Reactive data
const saving = ref(false)
const showCreateDialog = ref(false)
const editingClient = ref(null)
const showModulesDialog = ref(false)
const showAIConfigDialog = ref(false)
const selectedClient = ref(null)
const logoFile = ref(null)
const logoPreview = ref(null)

// Form data
const clientForm = ref({ name: '', description: '' })

// Computed stats
const totalSites = computed(() => {
  return clientStore.clients.reduce((sum, c) => sum + (c.sites_count || 0), 0)
})

const clientsWithAI = computed(() => {
  return clientStore.allTokenUsage.filter(u => u.has_api_key).length
})

const clientsInAlert = computed(() => {
  return clientStore.allTokenUsage.filter(u => u.is_alert || u.is_quota_exceeded).length
})

// Methods
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('fr-FR')
}

const onLogoSelect = (event) => {
  const file = event.files[0]
  if (file) {
    logoFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => { logoPreview.value = e.target.result }
    reader.readAsDataURL(file)
  }
}

const removeLogo = async () => {
  logoFile.value = null
  logoPreview.value = null
  if (editingClient.value && editingClient.value.logo_url) {
    try {
      const formData = new FormData()
      formData.append('name', editingClient.value.name)
      formData.append('description', editingClient.value.description || '')
      formData.append('remove_logo', 'true')
      await clientStore.updateClient(editingClient.value.id, formData)
      editingClient.value = clientStore.clients.find(c => c.id === editingClient.value.id)
      toast.add({ severity: 'success', summary: 'Logo supprimé', life: 3000 })
    } catch {
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer le logo', life: 3000 })
    }
  }
}

const editClient = (client) => {
  editingClient.value = client
  clientForm.value = { name: client.name, description: client.description || '' }
  logoFile.value = null
  logoPreview.value = null
  showCreateDialog.value = true
}

const saveClient = async () => {
  if (!clientForm.value.name) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Nom du client requis', life: 3000 })
    return
  }
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('name', clientForm.value.name)
    formData.append('description', clientForm.value.description || '')
    if (logoFile.value) formData.append('logo', logoFile.value)

    if (editingClient.value) {
      await clientStore.updateClient(editingClient.value.id, formData)
      toast.add({ severity: 'success', summary: 'Client modifié', life: 3000 })
    } else {
      await clientStore.createClient(formData)
      toast.add({ severity: 'success', summary: 'Client créé', life: 3000 })
    }
    cancelEdit()
  } catch {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder', life: 3000 })
  } finally {
    saving.value = false
  }
}

const cancelEdit = () => {
  editingClient.value = null
  showCreateDialog.value = false
  clientForm.value = { name: '', description: '' }
  logoFile.value = null
  logoPreview.value = null
}

const confirmDelete = (client) => {
  confirm.require({
    message: `Supprimer le client "${client.name}" ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: () => deleteClient(client.id)
  })
}

const deleteClient = async (clientId) => {
  try {
    await clientStore.deleteClient(clientId)
    toast.add({ severity: 'success', summary: 'Client supprimé', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Erreur de suppression', life: 3000 })
  }
}

const manageModules = (client) => {
  selectedClient.value = client
  showModulesDialog.value = true
}

const openAIConfig = (client) => {
  selectedClient.value = client
  showAIConfigDialog.value = true
}

const onModulesSaved = async () => {
  await clientStore.fetchClients()
  toast.add({ severity: 'success', summary: 'Modules mis à jour', life: 3000 })
}

const onAIConfigSaved = async () => {
  await clientStore.fetchAllTokenUsage()
}

// Lifecycle
onMounted(async () => {
  try {
    await clientStore.fetchClients()
    // Load token usage for all clients
    await clientStore.fetchAllTokenUsage()
  } catch {
    toast.add({ severity: 'error', summary: 'Erreur de chargement', life: 3000 })
  }
})
</script>

<style scoped>
.clients-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.header-content { flex: 1; }

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0B2B3C;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.new-client-btn {
  background: #7AC943;
  border: none;
  padding: 0.625rem 1.25rem;
  font-weight: 600;
}

.new-client-btn:hover { background: #65a335; }

/* Stats row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.stat-card.stat-alert {
  border-color: #fbbf24;
  background: #fffbeb;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f0fdf4;
  color: #7AC943;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.stat-icon.icon-ai {
  background: #eff6ff;
  color: #3b82f6;
}

.stat-icon.icon-alert {
  background: #fef3c7;
  color: #d97706;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0B2B3C;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
}

/* Content */
.page-content {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
}

.filters-section {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.search-filter { flex: 1; }

.search-input { width: 100%; max-width: 400px; }

.search-filter :deep(.p-inputgroup) { width: 100% !important; max-width: 400px !important; }
.search-filter :deep(.p-inputgroup-addon) { background: #f8fafc !important; border-color: #e2e8f0 !important; color: #64748b !important; border-right: none !important; }
.search-filter :deep(.p-inputtext) { border-color: #e2e8f0 !important; border-left: none !important; background: #fff !important; }
.search-filter :deep(.p-inputtext:focus) { border-color: #7AC943 !important; box-shadow: 0 0 0 3px rgba(122,201,67,0.1) !important; }

/* Loading & Empty */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 0.75rem;
  color: #94a3b8;
}

.empty-state i { font-size: 2rem; }

/* Client grid */
.clients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1rem;
  padding: 1.25rem;
}

.client-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.client-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.client-identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.client-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.client-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.client-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #0B2B3C;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.client-meta {
  min-width: 0;
}

.client-name {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0B2B3C;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.client-desc {
  font-size: 0.75rem;
  color: #94a3b8;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  gap: 0.125rem;
  flex-shrink: 0;
}

.action-ai { color: #3b82f6; }

.card-body {
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-stats {
  display: flex;
  gap: 1.25rem;
}

.card-stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.card-stat i {
  font-size: 0.75rem;
  color: #7AC943;
}

.no-ai-config {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #cbd5e1;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
}

.no-ai-config i { font-size: 0.75rem; }

/* Dialog */
.dialog-content { padding: 1rem 0; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-row:last-child { margin-bottom: 0; }
.form-group.full-width { grid-column: 1 / -1; }

.form-group label {
  display: block;
  font-weight: 600;
  color: #0B2B3C;
  margin-bottom: 0.5rem;
}

.form-input, .form-textarea { width: 100%; }

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.save-btn {
  background: #7AC943;
  border: none;
  font-weight: 600;
}

.save-btn:hover { background: #65a335; }

.logo-upload-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.logo-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f8fafc;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.remove-logo-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  background: rgba(239,68,68,0.9) !important;
  border: none;
}

.logo-uploader :deep(.p-fileupload-choose) {
  background: #7AC943;
  border-color: #7AC943;
  color: #fff;
  font-weight: 600;
}

.upload-hint {
  color: #64748b;
  font-size: 0.8125rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .clients-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .clients-page { padding: 1rem; }
  .page-header { flex-direction: column; gap: 1rem; }
  .stats-row { grid-template-columns: 1fr 1fr; }
  .form-row { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .stats-row { grid-template-columns: 1fr; }
}
</style>
