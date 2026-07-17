<template>
  <div class="sites-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Gestion des Sites</h1>
        <p class="page-subtitle">Créez et gérez les sites de votre organisation</p>
      </div>
      <Button 
        label="Nouveau Site" 
        icon="pi pi-plus" 
        @click="showCreateDialog = true"
        class="new-site-btn"
      />
    </div>

    <div class="page-content">
      <div class="filters-section">
        <div class="search-filter">
          <InputGroup>
            <InputGroupAddon>
              <i class="pi pi-search"></i>
            </InputGroupAddon>
            <InputText 
              v-model="siteStore.searchQuery" 
              placeholder="Rechercher un site..." 
              class="search-input"
            />
          </InputGroup>
        </div>
        <div class="filter-group">
          <Select 
            v-model="siteStore.filters.client" 
            :options="siteStore.clients" 
            optionLabel="name" 
            placeholder="Filtrer par client" 
            class="filter-dropdown"
            clearable
          />
        </div>
      </div>

      <TableSkeleton 
        v-if="siteStore.loading" 
        type="datatable" 
        :columns="5" 
        :rows="6"
        :showHeader="false"
      />
      <DataTable 
        v-else
        :value="siteStore.filteredSites" 
        paginator 
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} sites"
        class="sites-table"
        responsiveLayout="scroll"
      >
        <Column field="name" header="Nom du Site" sortable>
          <template #body="{ data }">
            <div class="site-name">
              <i class="pi pi-building site-icon"></i>
              <span>{{ data.name }}</span>
            </div>
          </template>
        </Column>
        
        <Column field="client_name" header="Client" sortable>
          <template #body="{ data }">
            <div class="client-info">
              <i class="pi pi-briefcase client-icon"></i>
              <span>{{ data.client_name || 'N/A' }}</span>
            </div>
          </template>
        </Column>
        
        <Column field="address" header="Adresse" sortable>
          <template #body="{ data }">
            <div class="address-info">
              <i class="pi pi-map-marker address-icon"></i>
              <span>{{ data.address || 'Non renseignée' }}</span>
            </div>
          </template>
        </Column>
        
        <Column field="creation_date" header="Date de création" sortable>
          <template #body="{ data }">
            <div class="creation-date">
              <i class="pi pi-calendar date-icon"></i>
              <span>{{ formatDate(data.creation_date) }}</span>
            </div>
          </template>
        </Column>
        
        <Column header="Actions" :exportable="false" style="min-width:12rem">
          <template #body="{ data }">
            <div class="action-buttons">
              <Button
                icon="pi pi-microchip"
                text
                size="small"
                @click="openIoTDevicesDialog(data)"
                class="iot-btn"
                v-tooltip.top="'Gérer les devices IoT'"
              />
              <Button
                icon="pi pi-pencil"
                text
                size="small"
                @click="editSite(data)"
                class="edit-btn"
                v-tooltip.top="'Modifier'"
              />
              <Button
                icon="pi pi-trash"
                text
                size="small"
                severity="danger"
                @click="confirmDelete(data)"
                class="delete-btn"
                v-tooltip.top="'Supprimer'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog de création/édition -->
    <Dialog 
      v-model:visible="showCreateDialog" 
      :header="editingSite ? 'Modifier le Site' : 'Nouveau Site'"
      modal 
      class="site-dialog"
      :style="{ width: '50rem' }"
    >
      <div class="dialog-content">
        <div class="form-row">
          <div class="form-group">
            <label for="siteName">Nom du site *</label>
            <InputText 
              id="siteName"
              v-model="siteForm.name" 
              placeholder="Entrez le nom du site"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="siteClient">Client *</label>
            <Select 
              id="siteClient"
              v-model="siteForm.client" 
              :options="siteStore.clients" 
              optionLabel="name"
              optionValue="id"
              placeholder="Sélectionnez un client"
              class="form-dropdown"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group full-width">
            <label for="siteAddress">Adresse</label>
            <Textarea 
              id="siteAddress"
              v-model="siteForm.address" 
              placeholder="Entrez l'adresse complète du site"
              rows="3"
              class="form-textarea"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="siteLatitude">Latitude</label>
            <InputNumber 
              id="siteLatitude"
              v-model="siteForm.latitude" 
              placeholder="Latitude"
              class="form-input"
              :minFractionDigits="6"
              :maxFractionDigits="6"
            />
          </div>
          <div class="form-group">
            <label for="siteLongitude">Longitude</label>
            <InputNumber 
              id="siteLongitude"
              v-model="siteForm.longitude" 
              placeholder="Longitude"
              class="form-input"
              :minFractionDigits="6"
              :maxFractionDigits="6"
            />
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <Button 
            label="Annuler" 
            text 
            @click="cancelEdit"
          />
          <Button 
            :label="editingSite ? 'Modifier' : 'Créer'" 
            @click="saveSite"
            :loading="saving"
          />
        </div>
      </template>
    </Dialog>

    <!-- Dialog de confirmation de suppression -->
    <ConfirmDialog />

    <!-- Dialog de gestion des devices IoT -->
    <Dialog
      v-model:visible="showIoTDialog"
      :header="`Devices IoT - ${selectedSiteForIoT?.name || ''}`"
      modal
      class="iot-dialog"
      :style="{ width: '60rem' }"
    >
      <div class="iot-dialog-content">
        <div class="iot-header">
          <p class="iot-description">
            Configurez les devices IoT associés à ce site. Ces devices enverront leurs données au broker MQTT.
          </p>
          <Button
            label="Nouveau Device"
            icon="pi pi-plus"
            size="small"
            @click="showDeviceForm = true"
            class="add-device-btn"
          />
        </div>

        <!-- Formulaire d'ajout de device -->
        <div v-if="showDeviceForm" class="device-form-section">
          <div class="device-form">
            <div class="form-row">
              <div class="form-group">
                <label>ID du Device *</label>
                <InputText
                  v-model="deviceForm.device_id"
                  placeholder="ex: sensor-temp-001"
                />
              </div>
              <div class="form-group">
                <label>Nom *</label>
                <InputText
                  v-model="deviceForm.name"
                  placeholder="ex: Capteur Température Atelier"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Type de device</label>
                <Select
                  v-model="deviceForm.device_type"
                  :options="deviceTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Sélectionner un type"
                />
              </div>
              <div class="form-group">
                <label>Topic MQTT (publication)</label>
                <InputText
                  v-model="deviceForm.mqtt_topic_publish"
                  placeholder="kap/devices/{device_id}/data"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group full-width">
                <label>Description</label>
                <Textarea
                  v-model="deviceForm.description"
                  rows="2"
                  placeholder="Description du device..."
                />
              </div>
            </div>
            <div class="form-actions">
              <Button
                label="Annuler"
                text
                size="small"
                @click="cancelDeviceForm"
              />
              <Button
                label="Ajouter le device"
                icon="pi pi-check"
                size="small"
                @click="saveDevice"
                :loading="savingDevice"
              />
            </div>
          </div>
        </div>

        <!-- Liste des devices -->
        <div class="devices-list">
          <div v-if="loadingDevices" class="loading-devices">
            <i class="pi pi-spin pi-spinner"></i>
            Chargement des devices...
          </div>
          <div v-else-if="siteDevices.length === 0" class="no-devices">
            <i class="pi pi-inbox empty-icon"></i>
            <p>Aucun device IoT configuré pour ce site</p>
            <small>Ajoutez un device pour commencer à collecter des données</small>
          </div>
          <div v-else class="devices-grid">
            <div
              v-for="device in siteDevices"
              :key="device.id"
              class="device-card"
              :class="{ 'device-online': device.status === 'online', 'device-offline': device.status === 'offline' }"
            >
              <div class="device-header">
                <div class="device-status">
                  <span class="status-dot" :class="device.status"></span>
                  <span class="status-text">{{ device.status === 'online' ? 'En ligne' : 'Hors ligne' }}</span>
                </div>
                <div class="device-actions">
                  <Button
                    icon="pi pi-pencil"
                    text
                    size="small"
                    @click="editDevice(device)"
                  />
                  <Button
                    icon="pi pi-trash"
                    text
                    size="small"
                    severity="danger"
                    @click="confirmDeleteDevice(device)"
                  />
                </div>
              </div>
              <div class="device-body">
                <div class="device-icon">
                  <i :class="getDeviceIcon(device.device_type)"></i>
                </div>
                <div class="device-info">
                  <h4>{{ device.name }}</h4>
                  <code class="device-id">{{ device.device_id }}</code>
                  <span class="device-type">{{ getDeviceTypeLabel(device.device_type) }}</span>
                </div>
              </div>
              <div class="device-footer">
                <div class="device-topic">
                  <i class="pi pi-send"></i>
                  <small>{{ device.mqtt_topic_publish || 'Non configuré' }}</small>
                </div>
                <div v-if="device.last_seen" class="device-lastseen">
                  <i class="pi pi-clock"></i>
                  <small>{{ formatLastSeen(device.last_seen) }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useSiteStore } from '../stores/siteStore'
import { axiosInstance } from '@/main.js'

const confirm = useConfirm()
const toast = useToast()
const siteStore = useSiteStore()

// Reactive data
const saving = ref(false)
const showCreateDialog = ref(false)
const editingSite = ref(null)

// Form data
const siteForm = ref({
  name: '',
  client: null,
  address: '',
  latitude: null,
  longitude: null
})

// IoT Devices management
const showIoTDialog = ref(false)
const selectedSiteForIoT = ref(null)
const siteDevices = ref([])
const loadingDevices = ref(false)
const showDeviceForm = ref(false)
const savingDevice = ref(false)
const editingDevice = ref(null)

const deviceTypes = [
  { label: 'Capteur', value: 'sensor' },
  { label: 'Actuateur', value: 'actuator' },
  { label: 'Gateway', value: 'gateway' },
  { label: 'Contrôleur', value: 'controller' }
]

const deviceForm = ref({
  device_id: '',
  name: '',
  device_type: 'sensor',
  mqtt_topic_publish: '',
  description: ''
})

// Methods
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('fr-FR')
}

const editSite = (site) => {
  editingSite.value = site
  siteForm.value = {
    name: site.name,
    client: site.client?.id || site.client,
    address: site.address || '',
    latitude: site.latitude,
    longitude: site.longitude
  }
  showCreateDialog.value = true
}

const saveSite = async () => {
  if (!siteForm.value.name || !siteForm.value.client) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez remplir tous les champs obligatoires',
      life: 3000
    })
    return
  }

  saving.value = true
  try {
    if (editingSite.value) {
      await siteStore.updateSite(editingSite.value.id, siteForm.value)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Site modifié avec succès',
        life: 3000
      })
    } else {
      await siteStore.createSite(siteForm.value)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Site créé avec succès',
        life: 3000
      })
    }
    
    cancelEdit()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder le site',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const cancelEdit = () => {
  editingSite.value = null
  showCreateDialog.value = false
  siteForm.value = {
    name: '',
    client: null,
    address: '',
    latitude: null,
    longitude: null
  }
}

const confirmDelete = (site) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer le site "${site.name}" ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    accept: () => deleteSite(site.id),
    reject: () => {
      toast.add({
        severity: 'info',
        summary: 'Annulé',
        detail: 'Suppression annulée',
        life: 3000
      })
    }
  })
}

const deleteSite = async (siteId) => {
  try {
    await siteStore.deleteSite(siteId)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Site supprimé avec succès',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le site',
      life: 3000
    })
  }
}

// IoT Device Management
const openIoTDevicesDialog = async (site) => {
  selectedSiteForIoT.value = site
  showIoTDialog.value = true
  await loadSiteDevices(site.id)
}

const loadSiteDevices = async (siteId) => {
  loadingDevices.value = true
  try {
    const response = await axiosInstance.get('/iot/devices/', {
      params: { site: siteId }
    })
    siteDevices.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Error loading devices:', error)
    siteDevices.value = []
  } finally {
    loadingDevices.value = false
  }
}

const resetDeviceForm = () => {
  deviceForm.value = {
    device_id: '',
    name: '',
    device_type: 'sensor',
    mqtt_topic_publish: '',
    description: ''
  }
  editingDevice.value = null
}

const cancelDeviceForm = () => {
  showDeviceForm.value = false
  resetDeviceForm()
}

const saveDevice = async () => {
  if (!deviceForm.value.device_id || !deviceForm.value.name) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez remplir les champs obligatoires',
      life: 3000
    })
    return
  }

  savingDevice.value = true
  try {
    const payload = {
      ...deviceForm.value,
      site: selectedSiteForIoT.value.id,
      status: 'offline',
      is_active: true
    }

    // Auto-generate MQTT topic if not provided
    if (!payload.mqtt_topic_publish) {
      payload.mqtt_topic_publish = `kap/devices/${payload.device_id}/data`
    }
    payload.mqtt_topic_subscribe = `kap/devices/${payload.device_id}/commands`

    if (editingDevice.value) {
      await axiosInstance.patch(`/iot/devices/${editingDevice.value.id}/`, payload)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Device modifié avec succès',
        life: 3000
      })
    } else {
      await axiosInstance.post('/iot/devices/', payload)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Device créé avec succès',
        life: 3000
      })
    }

    cancelDeviceForm()
    await loadSiteDevices(selectedSiteForIoT.value.id)
  } catch (error) {
    console.error('Error saving device:', error)
    const errorMsg = error.response?.data?.device_id?.[0] || 'Impossible de sauvegarder le device'
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: errorMsg,
      life: 3000
    })
  } finally {
    savingDevice.value = false
  }
}

const editDevice = (device) => {
  editingDevice.value = device
  deviceForm.value = {
    device_id: device.device_id,
    name: device.name,
    device_type: device.device_type,
    mqtt_topic_publish: device.mqtt_topic_publish || '',
    description: device.description || ''
  }
  showDeviceForm.value = true
}

const confirmDeleteDevice = (device) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer le device "${device.name}" ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    accept: () => deleteDevice(device.id),
    reject: () => {}
  })
}

const deleteDevice = async (deviceId) => {
  try {
    await axiosInstance.delete(`/iot/devices/${deviceId}/`)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Device supprimé avec succès',
      life: 3000
    })
    await loadSiteDevices(selectedSiteForIoT.value.id)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le device',
      life: 3000
    })
  }
}

const getDeviceIcon = (type) => {
  const icons = {
    sensor: 'pi pi-chart-line',
    actuator: 'pi pi-cog',
    gateway: 'pi pi-server',
    controller: 'pi pi-sliders-h'
  }
  return icons[type] || 'pi pi-microchip'
}

const getDeviceTypeLabel = (type) => {
  const labels = {
    sensor: 'Capteur',
    actuator: 'Actuateur',
    gateway: 'Gateway',
    controller: 'Contrôleur'
  }
  return labels[type] || type
}

const formatLastSeen = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${days}j`
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      siteStore.fetchSites(),
      siteStore.fetchClients()
    ])
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données',
      life: 3000
    })
  }
})
</script>

<style scoped>
.sites-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header-content {
  flex: 1;
}

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

.new-site-btn {
  background: #7AC943;
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
}

.new-site-btn:hover {
  background: #65a335;
}

.page-content {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.filters-section {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.search-filter {
  flex: 1;
}

.search-input {
  width: 100%;
  max-width: 400px;
}

.search-filter :deep(.p-inputgroup) {
  width: 100% !important;
  max-width: 400px !important;
}

.search-filter :deep(.p-inputgroup-addon) {
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  color: #64748b !important;
  border-right: none !important;
}

.search-filter :deep(.p-inputtext) {
  border-color: #e2e8f0 !important;
  border-left: none !important;
  background: #ffffff !important;
}

.search-filter :deep(.p-inputtext:focus) {
  border-color: #7AC943 !important;
  box-shadow: 0 0 0 3px rgba(122, 201, 67, 0.1) !important;
  outline: none !important;
}

.search-filter :deep(.p-inputtext:hover) {
  border-color: #cbd5e1 !important;
}

.search-filter :deep(.p-inputgroup:hover .p-inputgroup-addon) {
  border-color: #cbd5e1 !important;
}

.search-filter :deep(.p-inputgroup:focus-within .p-inputgroup-addon) {
  border-color: #7AC943 !important;
  background: #f0fdf4 !important;
}

.filter-dropdown {
  min-width: 200px;
}

.sites-table {
  border: none;
}

.site-name, .client-info, .address-info, .creation-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.site-icon, .client-icon, .address-icon, .date-icon {
  color: #7AC943;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.edit-btn:hover {
  color: #7AC943;
}

.delete-btn:hover {
  color: #ef4444;
}

.site-dialog {
  border-radius: 16px;
}

.dialog-content {
  padding: 1rem 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #0B2B3C;
  margin-bottom: 0.5rem;
}

.form-input, .form-dropdown, .form-textarea {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@media (max-width: 1024px) {
  .sites-page {
    padding: 1.5rem;
  }
  
  .sites-table {
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  .sites-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .page-title {
    font-size: 1.25rem;
  }
  
  .filters-section {
    flex-direction: column;
    gap: 1rem;
  }
  
  .search-filter {
    width: 100%;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-dropdown {
    width: 100%;
    min-width: auto;
  }
  
  .sites-table {
    font-size: 0.8125rem;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .site-dialog {
    width: 95% !important;
    margin: 1rem;
  }
}

@media (max-width: 480px) {
  .sites-page {
    padding: 0.75rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: 0.875rem;
  }

  .filters-section {
    padding: 1rem;
  }

  .sites-table {
    font-size: 0.75rem;
  }

  .site-dialog {
    width: 100% !important;
    margin: 0.5rem;
  }

  .action-buttons {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
}

/* IoT Devices Dialog Styles */
.iot-btn:hover {
  color: #3b82f6;
}

.iot-dialog-content {
  padding: 0.5rem 0;
}

.iot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.iot-description {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  max-width: 70%;
}

.add-device-btn {
  background: #3b82f6;
  border-color: #3b82f6;
}

.add-device-btn:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.device-form-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
}

.device-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.device-form .form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.device-form .form-group.full-width {
  grid-column: 1 / -1;
}

.device-form :deep(.p-inputtext),
.device-form :deep(.p-select),
.device-form :deep(.p-textarea) {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.devices-list {
  min-height: 200px;
}

.loading-devices {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #64748b;
}

.no-devices {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #64748b;
}

.no-devices .empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.no-devices p {
  margin: 0;
  font-weight: 600;
  color: #374151;
}

.no-devices small {
  color: #94a3b8;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.device-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.device-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.device-card.device-online {
  border-left: 4px solid #22c55e;
}

.device-card.device-offline {
  border-left: 4px solid #94a3b8;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.device-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

.status-dot.offline {
  background: #94a3b8;
}

.status-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.device-actions {
  display: flex;
  gap: 0.25rem;
}

.device-body {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
}

.device-icon {
  width: 48px;
  height: 48px;
  background: #3b82f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.device-icon i {
  color: white;
  font-size: 1.25rem;
}

.device-info {
  flex: 1;
  min-width: 0;
}

.device-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
}

.device-id {
  display: block;
  font-size: 0.75rem;
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.25rem;
}

.device-type {
  font-size: 0.75rem;
  color: #64748b;
}

.device-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
}

.device-topic,
.device-lastseen {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

.device-topic i,
.device-lastseen i {
  font-size: 0.75rem;
  color: #94a3b8;
}

.device-topic small,
.device-lastseen small {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .iot-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .iot-description {
    max-width: 100%;
  }

  .device-form .form-row {
    grid-template-columns: 1fr;
  }

  .devices-grid {
    grid-template-columns: 1fr;
  }
}
</style> 