<template>
  <div class="mediatheque-page">
    <div class="drive-layout">
      <!-- Sidebar: arbre de dossiers -->
      <FolderSidebar
        @select-folder="navigateTo"
        @create-folder="showCreateFolder = true"
      />

      <!-- Zone principale -->
      <div class="drive-main">
        <!-- Breadcrumb -->
        <MediaBreadcrumb @navigate="navigateTo" />

        <!-- Toolbar -->
        <MediaToolbar
          v-model:searchQuery="searchQuery"
          v-model:typeFilter="typeFilter"
          v-model:categoryFilter="categoryFilter"
          v-model:viewMode="viewMode"
          :categories="store.categories"
          @upload="openUploadDialog"
          @create-folder="showCreateFolder = true"
        />

        <!-- Engins Import Banner -->
        <div class="engins-import-section">
          <div class="import-banner">
            <i class="pi pi-cog"></i>
            <div class="banner-content">
              <strong>Importer un fichier</strong>
              <small>Stock, MES ou Engins : sélectionnez le type dans le dialogue d’import.</small>
            </div>
            <Button 
              label="Importer un fichier" 
              icon="pi pi-upload"
              size="small"
              severity="success"
              @click="openUploadDialog"
            />
          </div>
        </div>

        <!-- Contenu -->
        <TableSkeleton
          v-if="store.loading"
          type="dataview"
          :items="8"
          :showHeader="false"
        />
        <MediaGrid
          v-else
          :folders="filteredFolders"
          :files="filteredFiles"
          :viewMode="viewMode"
          :loading="store.loading"
          @open-folder="navigateTo"
          @move-folder="openMoveFolder"
          @share-folder="openShareFolder"
          @rename-folder="onRenameFolder"
          @delete-folder="onDeleteFolder"
          @preview="previewFile"
          @download="downloadFile"
          @edit="editFile"
          @delete="confirmDeleteFile"
          @import="importFile"
          @move-file="openMoveFile"
          @share-file="openShareFile"
        />
      </div>
    </div>

    <!-- Dialogs -->
    <FileUploadDialog
      v-model="showUploadDialog"
      @uploaded="onFileUploaded"
    />

    <CreateFolderDialog v-model="showCreateFolder" />

    <ShareDialog
      v-model="showShareDialog"
      :target="shareTarget"
      :targetType="shareTargetType"
    />

    <MoveDialog
      v-model="showMoveDialog"
      :target="moveTarget"
      :targetType="moveTargetType"
      @moved="refreshContent"
    />

    <!-- Dialog categorie -->
    <Dialog
      v-model:visible="showCategoryDialog"
      header="Créer une catégorie"
      modal
      :style="{ width: '30rem' }"
    >
      <div class="category-form">
        <div class="form-group">
          <label for="categoryName">Nom *</label>
          <InputText id="categoryName" v-model="categoryForm.name" placeholder="Ex: Documents techniques" class="w-full" />
        </div>
        <div class="form-group" style="margin-top: 0.75rem">
          <label for="categoryDesc">Description</label>
          <Textarea id="categoryDesc" v-model="categoryForm.description" placeholder="Description (optionnel)" rows="3" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Annuler" text @click="showCategoryDialog = false" />
        <Button label="Créer" @click="createCategory" :loading="creatingCategory" />
      </template>
    </Dialog>

    <!-- Dialog renommage dossier -->
    <Dialog
      v-model:visible="showRenameDialog"
      header="Renommer le dossier"
      modal
      :style="{ width: '26rem' }"
      @hide="renameForm.name = ''"
    >
      <div class="form-group">
        <label for="renameFolderName">Nouveau nom</label>
        <InputText
          id="renameFolderName"
          v-model="renameForm.name"
          class="w-full"
          placeholder="Nom du dossier"
          @keyup.enter="submitRenameFolder"
          autofocus
        />
      </div>
      <template #footer>
        <Button label="Annuler" text @click="showRenameDialog = false" />
        <Button label="Renommer" @click="submitRenameFolder" :disabled="!renameForm.name.trim()" />
      </template>
    </Dialog>

    <ConfirmDialog />

    <ImportDataDialog
      v-model="showImportDialog"
      :file="selectedFileForImport"
      @import-success="onImportSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import TableSkeleton from '@/shared/components/TableSkeleton.vue'
import ImportDataDialog from '../components/ImportDataDialog.vue'
import FolderSidebar from '../components/mediatheque/FolderSidebar.vue'
import MediaBreadcrumb from '../components/mediatheque/MediaBreadcrumb.vue'
import MediaToolbar from '../components/mediatheque/MediaToolbar.vue'
import MediaGrid from '../components/mediatheque/MediaGrid.vue'
import FileUploadDialog from '../components/mediatheque/FileUploadDialog.vue'
import CreateFolderDialog from '../components/mediatheque/CreateFolderDialog.vue'
import ShareDialog from '../components/mediatheque/ShareDialog.vue'
import MoveDialog from '../components/mediatheque/MoveDialog.vue'
import { useMediathequeStore } from '../stores/mediathequeStore'
import { axiosInstance } from '@/main.js'
import { useImportEventsStore } from '@/stores/importEventsStore'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const store = useMediathequeStore()
const importEvents = useImportEventsStore()

// State
const showUploadDialog = ref(false)
const showCreateFolder = ref(false)
const showShareDialog = ref(false)
const showMoveDialog = ref(false)
const showCategoryDialog = ref(false)
const showImportDialog = ref(false)
const creatingCategory = ref(false)
const searchQuery = ref('')
const typeFilter = ref(null)
const categoryFilter = ref(null)
const viewMode = ref('grid')
const selectedFileForImport = ref(null)
const shareTarget = ref(null)
const shareTargetType = ref('folder')
const moveTarget = ref(null)
const moveTargetType = ref('file')
const categoryForm = ref({ name: '', description: '' })

const ENGINS_IMPORT_STORAGE_KEY = 'engins_import_snapshot_v1'
const ENGINS_IMPORT_EVENT = 'engins-import-updated'

// Handlers
const openUploadDialog = () => {
  showUploadDialog.value = true
}

// Filtres locaux sur les donnees deja chargees
const filteredFolders = computed(() => {
  if (!searchQuery.value) return store.folders
  const q = searchQuery.value.toLowerCase()
  return store.folders.filter(f => f.name.toLowerCase().includes(q))
})

const filteredFiles = computed(() => {
  let filtered = store.files
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q)
    )
  }
  if (typeFilter.value) {
    filtered = filtered.filter(f => f.file_type === typeFilter.value)
  }
  if (categoryFilter.value) {
    filtered = filtered.filter(f => f.category === categoryFilter.value)
  }
  return filtered
})

// Navigation
const navigateTo = async (folderId) => {
  await store.navigateToFolder(folderId)
  // Update URL
  if (folderId) {
    router.replace({ params: { folderId } })
  } else {
    router.replace({ params: { folderId: undefined } })
  }
}

const refreshContent = () => {
  store.navigateToFolder(store.currentFolder)
}

const isEnginsExcelFile = (file) => {
  if (!file?.name) return false
  const name = String(file.name).toLowerCase()
  return (name.endsWith('.xlsx') || name.endsWith('.xls')) && name.includes('engin')
}

const normalizeImportKey = (moduleName, fileName = null) => {
  if (!moduleName && !fileName) return null
  const key = String(moduleName || '').trim().toLowerCase()
  if (['mes', 'engins', 'stock'].includes(key)) return key
  if (key.includes('engin')) return 'engins'
  if (key.includes('mes')) return 'mes'
  if (key.includes('stock') || key.includes('materiau') || key.includes('material')) return 'stock'

  if (fileName) {
    const lowerName = String(fileName).toLowerCase()
    if (lowerName.includes('stock') || lowerName.includes('materiau') || lowerName.includes('material')) return 'stock'
    if (lowerName.includes('mes')) return 'mes'
    if (lowerName.includes('engin')) return 'engins'
  }

  return null
}

const redirectAfterImport = (key) => {
  if (key === 'engins') {
    router.push({ name: 'engins' }).catch(() => {})
  } else if (key === 'mes') {
    router.push({ name: 'mes' }).catch(() => {})
  } else if (key === 'stock') {
    router.push({ name: 'production-materiaux', query: { importedAt: Date.now() } }).catch(() => {})
  }
}

const dispatchGlobalImportEvent = (key, payload) => {
  window.dispatchEvent(new CustomEvent('kap-import-event', {
    detail: { key, payload, timestamp: Date.now() }
  }))
}

const triggerImportEvent = (key, payload) => {
  importEvents.triggerImport(key, payload)
  dispatchGlobalImportEvent(key, payload)
  redirectAfterImport(key)
}

const triggerEnginsImportFlow = (file) => {
  confirm.require({
    message: `Le fichier "${file.name}" semble être un import Engins. Voulez-vous mettre à jour les données Engins maintenant ?`,
    header: 'Mise à jour des données Engins',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Mettre à jour',
    rejectLabel: 'Plus tard',
    accept: async () => {
      try {
        const sourcePath = file.content_url || file.file_url || file.file
        if (!sourcePath) {
          throw new Error("URL du fichier introuvable après le téléversement")
        }
        const sourceUrl = store.getMediaUrl(sourcePath)
        const downloadResp = await axiosInstance.get(sourceUrl, { responseType: 'blob' })
        const excelBlob = downloadResp.data
        const excelFile = new File([excelBlob], file.name || 'engins_import.xlsx', {
          type: excelBlob.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const formData = new FormData()
        formData.append('file', excelFile)

        const importResp = await axiosInstance.post('/engins/machines/import_excel/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        const payload = {
          updatedAt: new Date().toISOString(),
          sourceFile: file.name,
          data: importResp.data
        }
        localStorage.setItem(ENGINS_IMPORT_STORAGE_KEY, JSON.stringify(payload))
        window.dispatchEvent(new CustomEvent(ENGINS_IMPORT_EVENT, { detail: payload }))
        triggerImportEvent('engins', { file, data: importResp.data })

        toast.add({
          severity: 'success',
          summary: 'Engins mis à jour',
          detail: 'Les données Excel et les KPI calculés sont disponibles dans la vue Engins.',
          life: 4000
        })
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Import Engins echoue',
          detail: err?.response?.data?.error || 'Impossible de mettre à jour les données Engins',
          life: 5000
        })
      }
    }
  })
}

const onFileUploaded = async (uploadedFile) => {
  refreshContent()

  if (!uploadedFile) {
    return
  }

  if (uploadedFile.type === 'stock-import' || uploadedFile.type === 'mes-import') {
    const key = uploadedFile.type === 'stock-import' ? 'stock' : 'mes'
    triggerImportEvent(key, { file: uploadedFile, data: uploadedFile.data || null })

    toast.add({
      severity: 'success',
      summary: `Import ${key === 'stock' ? 'Stock' : 'MES'} détecté`,
      detail: `Les données ${key === 'stock' ? 'de stock' : 'MES'} ont été mises à jour.`,
      life: 4000
    })

    return
  }

  if (uploadedFile.type === 'engins-import') {
    const payload = {
      updatedAt: new Date().toISOString(),
      sourceFile: uploadedFile.name || uploadedFile.file?.name || 'engins_import.xlsx',
      data: uploadedFile.data || null
    }

    localStorage.setItem(ENGINS_IMPORT_STORAGE_KEY, JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent(ENGINS_IMPORT_EVENT, { detail: { type: 'engins', data: payload, timestamp: Date.now() } }))
    triggerImportEvent('engins', { file: uploadedFile, data: payload })
    return
  }

  if (uploadedFile && isEnginsExcelFile(uploadedFile)) {
    triggerEnginsImportFlow(uploadedFile)
  }
}

// File actions
const previewFile = async (file) => {
  try {
    const sourcePath = file.content_url || file.file_url || file.file
    if (sourcePath) {
      const response = await axiosInstance.get(store.getMediaUrl(sourcePath), { responseType: 'blob' })
      const objectUrl = URL.createObjectURL(response.data)
      window.open(objectUrl, '_blank')
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
    }
    await store.viewFile(file.id)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible d'ouvrir le fichier", life: 3000 })
  }
}

const downloadFile = async (file) => {
  try {
    const downloadMeta = await store.downloadFile(file.id)
    const downloadPath = downloadMeta?.url || file.content_url || file.file_url
    if (!downloadPath) {
      throw new Error('URL de téléchargement indisponible')
    }

    const response = await axiosInstance.get(store.getMediaUrl(downloadPath), { responseType: 'blob' })
    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de télécharger', life: 3000 })
  }
}

const editFile = async (file) => {
  // TODO: edit dialog
  toast.add({ severity: 'info', summary: 'Info', detail: 'Edition a venir', life: 2000 })
}

const confirmDeleteFile = (file) => {
  confirm.require({
    message: `Supprimer "${file.name}" ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await store.deleteFile(file.id)
        toast.add({ severity: 'success', summary: 'Fichier supprimé', life: 2000 })
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer', life: 3000 })
      }
    }
  })
}

const importFile = (file) => {
  selectedFileForImport.value = file
  showImportDialog.value = true
}

const onImportSuccess = (payload) => {
  // payload: { result, template }
  showImportDialog.value = false
  refreshContent()
  toast.add({ severity: 'success', summary: 'Import réussi', life: 3000 })

  try {
    const moduleName = payload?.template?.module || payload?.result?.module || payload?.result?.import_type || null
    const fileName = selectedFileForImport.value?.name || null
    const key = normalizeImportKey(moduleName, fileName)
    if (!key) return

    // trigger global import event for other views to react and redirect
    triggerImportEvent(key, { file: selectedFileForImport.value, data: payload.result })
  } catch (e) {
    // ignore non-fatal errors
    console.error('onImportSuccess handling failed', e)
  }
}

// Folder actions
const showRenameDialog = ref(false)
const renameForm = ref({ id: null, name: '' })

const onRenameFolder = (folder) => {
  renameForm.value = { id: folder.id, name: folder.name }
  showRenameDialog.value = true
}

const submitRenameFolder = async () => {
  const { id, name } = renameForm.value
  if (!name.trim()) return
  try {
    await store.renameFolder(id, name.trim())
    showRenameDialog.value = false
    refreshContent()
    toast.add({ severity: 'success', summary: 'Dossier renommé', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de renommer', life: 3000 })
  }
}

const onDeleteFolder = (folder) => {
  confirm.require({
    message: `Supprimer le dossier "${folder.name}" et tout son contenu ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await store.deleteFolder(folder.id)
        refreshContent()
        toast.add({ severity: 'success', summary: 'Dossier supprimé', life: 2000 })
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer', life: 3000 })
      }
    }
  })
}

// Move
const openMoveFile = (file) => {
  moveTarget.value = file
  moveTargetType.value = 'file'
  showMoveDialog.value = true
}

const openMoveFolder = (folder) => {
  moveTarget.value = folder
  moveTargetType.value = 'folder'
  showMoveDialog.value = true
}

// Share
const openShareFolder = (folder) => {
  shareTarget.value = folder
  shareTargetType.value = 'folder'
  showShareDialog.value = true
}

const openShareFile = (file) => {
  shareTarget.value = file
  shareTargetType.value = 'file'
  showShareDialog.value = true
}

// Category
const createCategory = async () => {
  if (!categoryForm.value.name) return
  creatingCategory.value = true
  try {
    await store.createCategory({
      name: categoryForm.value.name,
      description: categoryForm.value.description || ''
    })
    toast.add({ severity: 'success', summary: 'Catégorie créée', life: 2000 })
    showCategoryDialog.value = false
    categoryForm.value = { name: '', description: '' }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de créer la catégorie', life: 3000 })
  } finally {
    creatingCategory.value = false
  }
}

// Init
onMounted(() => {
  const folderId = route.params.folderId ? Number(route.params.folderId) : null
  Promise.all([
    store.navigateToFolder(folderId),
    store.fetchCategories(),
    store.fetchClients(),
    store.fetchSites(),
    store.fetchWorkplaces(),
    store.fetchMachines(),
    store.fetchTeams()
  ]).catch(err => {
    console.error('Erreur lors du chargement:', err)
  })
})

// Watch route changes
watch(() => route.params.folderId, (newId) => {
  const folderId = newId ? Number(newId) : null
  if (folderId !== store.currentFolder) {
    store.navigateToFolder(folderId)
  }
})
</script>

<style scoped>
.mediatheque-page {
  height: 100%;
}

.drive-layout {
  display: flex;
  height: calc(100vh - 65px);
}

.drive-main {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  min-width: 0;
}

.engins-import-section {
  margin: 1rem 0;
}

.import-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #e8f5e9 100%);
  border: 2px solid #7ac943;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.import-banner i {
  font-size: 1.8rem;
  color: #7ac943;
  flex-shrink: 0;
}

.banner-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.banner-content strong {
  color: #0b2b3c;
  font-size: 0.95rem;
}

.banner-content small {
  color: #64748b;
  font-size: 0.8rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.35rem;
}
</style>
