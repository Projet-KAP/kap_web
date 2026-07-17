import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main'

export const useMediathequeStore = defineStore('mediatheque', () => {
  // State
  const loading = ref(false)
  const uploading = ref(false)
  const error = ref(null)

  // Data
  const files = ref([])
  const categories = ref([])
  const currentFile = ref(null)
  const stats = ref(null)

  // Dossiers (Drive)
  const folders = ref([])
  const folderTree = ref([])
  const currentFolder = ref(null)
  const breadcrumb = ref([])

  // Contexte data
  const clients = ref([])
  const sites = ref([])
  const workplaces = ref([])
  const machines = ref([])
  const teams = ref([])

  // Getters
  const filesByType = computed(() => {
    const grouped = {}
    files.value.forEach(file => {
      if (!grouped[file.file_type]) {
        grouped[file.file_type] = []
      }
      grouped[file.file_type].push(file)
    })
    return grouped
  })

  const totalSize = computed(() => {
    return files.value.reduce((sum, file) => sum + (file.file_size || 0), 0)
  })

  const formattedTotalSize = computed(() => {
    return formatFileSize(totalSize.value)
  })

  // Helper functions
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getMediaUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    // Construire l'URL base depuis VITE_API_BASE_URL (enlever /api/v1/)
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/'
    const baseUrl = apiBase.replace(/\/api\/v1\/?$/, '')
    return `${baseUrl}${path}`
  }

  const getFileIcon = (mimeType) => {
    if (!mimeType) return 'pi pi-file'
    if (mimeType.startsWith('image/')) return 'pi pi-image'
    if (mimeType.startsWith('video/')) return 'pi pi-video'
    if (mimeType.startsWith('audio/')) return 'pi pi-volume-up'
    if (mimeType.includes('pdf')) return 'pi pi-file-pdf'
    if (mimeType.includes('word')) return 'pi pi-file-word'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'pi pi-file-excel'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'pi pi-file'
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'pi pi-folder'
    return 'pi pi-file'
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/mediatheque/categories/');
      categories.value = response.data.results || response.data
      return categories.value
    } catch (err) {

      error.value = err.message
      throw err
    }
  }

  const createCategory = async (categoryData) => {
    try {
      const response = await axiosInstance.post('/mediatheque/categories/', categoryData);
      categories.value.push(response.data)
      return response.data
    } catch (err) {

      error.value = err.message
      throw err
    }
  }

  const updateCategory = async (id, categoryData) => {
    try {
      const response = await axiosInstance.patch(`/mediatheque/categories/${id}/`, categoryData);
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = response.data
      }
      return response.data
    } catch (err) {

      error.value = err.message
      throw err
    }
  }

  const deleteCategory = async (id) => {
    try {
      await axiosInstance.delete(`/mediatheque/categories/${id}/`)
      categories.value = categories.value.filter(c => c.id !== id)
    } catch (err) {

      error.value = err.message
      throw err
    }
  }

  // ============================================================================
  // FILES
  // ============================================================================

  const fetchFiles = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/mediatheque/files/', { params });
      files.value = response.data.results || response.data
      return files.value
    } catch (err) {

      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchFile = async (id) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/mediatheque/files/${id}/`);
      currentFile.value = response.data
      return response.data
    } catch (err) {

      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const uploadFile = async (formData, onUploadProgress) => {
    uploading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/mediatheque/files/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress
      })
      files.value.unshift(response.data)
      return response.data
    } catch (err) {

      error.value = err.message
      throw err
    } finally {
      uploading.value = false
    }
  }

  const updateFile = async (id, data) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.patch(`/mediatheque/files/${id}/`, data);
      const index = files.value.findIndex(f => f.id === id)
      if (index !== -1) {
        files.value[index] = response.data
      }
      return response.data
    } catch (err) {

      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteFile = async (id) => {
    loading.value = true
    error.value = null
    try {
      await axiosInstance.delete(`/mediatheque/files/${id}/`)
      files.value = files.value.filter(f => f.id !== id)
    } catch (err) {

      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const downloadFile = async (id) => {
    try {
      const response = await axiosInstance.post(`/mediatheque/files/${id}/download/`);
      return response.data
    } catch (err) {

      error.value = err.message
      throw err
    }
  }

  const viewFile = async (id) => {
    try {
      const response = await axiosInstance.post(`/mediatheque/files/${id}/view/`);
      const index = files.value.findIndex(f => f.id === id)
      if (index !== -1) {
        files.value[index] = response.data
      }
      return response.data
    } catch (err) {

      error.value = err.message
      throw err
    }
  }

  const archiveFile = async (id) => {
    try {
      await axiosInstance.post(`/mediatheque/files/${id}/archive/`)
      const index = files.value.findIndex(f => f.id === id)
      if (index !== -1) {
        files.value[index].is_archived = true
      }
    } catch (err) {

      error.value = err.message
      throw err
    }
  }

  const restoreFile = async (id) => {
    try {
      await axiosInstance.post(`/mediatheque/files/${id}/restore/`)
      const index = files.value.findIndex(f => f.id === id)
      if (index !== -1) {
        files.value[index].is_archived = false
      }
    } catch (err) {

      error.value = err.message
      throw err
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  const bulkDeleteFiles = async (ids) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/mediatheque/files/bulk_delete/', { ids });
      files.value = files.value.filter(f => !ids.includes(f.id))
      return response.data
    } catch (err) {

      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const bulkArchiveFiles = async (ids) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post('/mediatheque/files/bulk_archive/', { ids });
      files.value.forEach(f => {
        if (ids.includes(f.id)) {
          f.is_archived = true
        }
      })
      return response.data
    } catch (err) {

      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // FOLDERS (Drive)
  // ============================================================================

  const fetchFolders = async (parentId = null) => {
    try {
      const params = { parent: parentId || 'root' }
      const response = await axiosInstance.get('/mediatheque/folders/', { params })
      folders.value = response.data.results || response.data
      return folders.value
    } catch (err) {
      console.error('Erreur chargement dossiers:', err)
      error.value = err.message
      throw err
    }
  }

  const fetchFolderTree = async () => {
    try {
      const response = await axiosInstance.get('/mediatheque/folders/tree/')
      folderTree.value = response.data
      return folderTree.value
    } catch (err) {
      console.error('Erreur chargement arbre dossiers:', err)
      error.value = err.message
      throw err
    }
  }

  const fetchBreadcrumb = async (folderId) => {
    try {
      const response = await axiosInstance.get(`/mediatheque/folders/${folderId}/breadcrumb/`)
      breadcrumb.value = response.data
      return breadcrumb.value
    } catch (err) {
      console.error('Erreur chargement breadcrumb:', err)
      error.value = err.message
      throw err
    }
  }

  const createFolder = async (data) => {
    try {
      const payload = { name: data.name }
      if (data.parent) {
        payload.parent = data.parent
      }
      const response = await axiosInstance.post('/mediatheque/folders/', payload)
      folders.value.push(response.data)
      await fetchFolderTree()
      return response.data
    } catch (err) {
      console.error('Erreur creation dossier:', err)
      error.value = err.message
      throw err
    }
  }

  const renameFolder = async (id, name) => {
    try {
      const response = await axiosInstance.patch(`/mediatheque/folders/${id}/`, { name })
      const index = folders.value.findIndex(f => f.id === id)
      if (index !== -1) folders.value[index] = response.data
      await fetchFolderTree()
      return response.data
    } catch (err) {
      console.error('Erreur renommage dossier:', err)
      error.value = err.message
      throw err
    }
  }

  const deleteFolder = async (id) => {
    try {
      await axiosInstance.delete(`/mediatheque/folders/${id}/`)
      folders.value = folders.value.filter(f => f.id !== id)
      await fetchFolderTree()
    } catch (err) {
      console.error('Erreur suppression dossier:', err)
      error.value = err.message
      throw err
    }
  }

  const moveFolder = async (id, newParentId) => {
    try {
      const response = await axiosInstance.post(`/mediatheque/folders/${id}/move/`, { parent_id: newParentId })
      await fetchFolderTree()
      return response.data
    } catch (err) {
      console.error('Erreur deplacement dossier:', err)
      error.value = err.message
      throw err
    }
  }

  const moveFile = async (id, folderId) => {
    try {
      const response = await axiosInstance.post(`/mediatheque/files/${id}/move/`, { folder_id: folderId })
      // Rafraichir la liste courante
      await navigateToFolder(currentFolder.value)
      return response.data
    } catch (err) {
      console.error('Erreur deplacement fichier:', err)
      error.value = err.message
      throw err
    }
  }

  const navigateToFolder = async (folderId) => {
    loading.value = true
    error.value = null
    try {
      currentFolder.value = folderId

      // Charger en parallele dossiers + fichiers + breadcrumb
      const [, filesResult] = await Promise.all([
        fetchFolders(folderId),
        axiosInstance.get('/mediatheque/files/', { params: { folder: folderId || 'root' } }),
        folderId ? fetchBreadcrumb(folderId) : Promise.resolve(breadcrumb.value = [])
      ])
      files.value = filesResult.data.results || filesResult.data
    } catch (err) {
      console.error('Erreur navigation dossier:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // SHARING (Permissions)
  // ============================================================================

  const fetchPermissions = async (type, id) => {
    try {
      const endpoint = type === 'folder' ? 'folders' : 'files'
      const response = await axiosInstance.get(`/mediatheque/${endpoint}/${id}/share/`)
      return response.data
    } catch (err) {
      console.error('Erreur chargement permissions:', err)
      error.value = err.message
      throw err
    }
  }

  const addPermission = async (type, id, permissionData) => {
    try {
      const endpoint = type === 'folder' ? 'folders' : 'files'
      const response = await axiosInstance.post(`/mediatheque/${endpoint}/${id}/share/`, permissionData)
      return response.data
    } catch (err) {
      console.error('Erreur ajout permission:', err)
      error.value = err.message
      throw err
    }
  }

  const removePermission = async (type, id, permissionId) => {
    try {
      const endpoint = type === 'folder' ? 'folders' : 'files'
      await axiosInstance.delete(`/mediatheque/${endpoint}/${id}/share/`, { data: { permission_id: permissionId } })
    } catch (err) {
      console.error('Erreur suppression permission:', err)
      error.value = err.message
      throw err
    }
  }

  // ============================================================================
  // STATS & SPECIAL LISTS
  // ============================================================================

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/mediatheque/files/stats/');
      stats.value = response.data
      return response.data
    } catch (err) {

      error.value = err.message
      throw err
    }
  }

  const fetchRecentFiles = async (limit = 10) => {
    try {
      const response = await axiosInstance.get('/mediatheque/files/recent/', { params: { limit } });
      return response.data
    } catch (err) {

      error.value = err.message
      throw err
    }
  }

  const fetchPopularFiles = async (limit = 10) => {
    try {
      const response = await axiosInstance.get('/mediatheque/files/popular/', { params: { limit } });
      return response.data
    } catch (err) {

      error.value = err.message
      throw err
    }
  }

  // ============================================================================
  // CONTEXT DATA (Clients, Sites, Workplaces, Machines, Teams)
  // ============================================================================

  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get('/accounts/clients/');
      clients.value = response.data.results || response.data
      return clients.value
    } catch (err) {

      throw err
    }
  }

  const fetchSites = async () => {
    try {
      const response = await axiosInstance.get('/accounts/sites/');
      sites.value = response.data.results || response.data
      return sites.value
    } catch (err) {

      throw err
    }
  }

  const fetchWorkplaces = async () => {
    try {
      const response = await axiosInstance.get('/accounts/workplaces/');
      workplaces.value = response.data.data || response.data.results || response.data
      return workplaces.value
    } catch (err) {

      throw err
    }
  }

  const fetchMachines = async () => {
    try {
      const response = await axiosInstance.get('/engins/machines/');
      machines.value = response.data.data || response.data.results || response.data
      return machines.value
    } catch (err) {

      throw err
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await axiosInstance.get('/teams/teams/');
      teams.value = response.data.results || response.data
      return teams.value
    } catch (err) {

      throw err
    }
  }

  return {
    // State
    loading,
    uploading,
    error,
    files,
    categories,
    currentFile,
    stats,
    clients,
    sites,
    workplaces,
    machines,
    teams,

    // Folders (Drive)
    folders,
    folderTree,
    currentFolder,
    breadcrumb,

    // Getters
    filesByType,
    totalSize,
    formattedTotalSize,

    // Helpers
    formatFileSize,
    getFileIcon,
    getMediaUrl,

    // Categories
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // Folders
    fetchFolders,
    fetchFolderTree,
    fetchBreadcrumb,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    moveFile,
    navigateToFolder,

    // Sharing
    fetchPermissions,
    addPermission,
    removePermission,

    // Files
    fetchFiles,
    fetchFile,
    uploadFile,
    updateFile,
    deleteFile,
    downloadFile,
    viewFile,
    archiveFile,
    restoreFile,

    // Bulk operations
    bulkDeleteFiles,
    bulkArchiveFiles,

    // Stats
    fetchStats,
    fetchRecentFiles,
    fetchPopularFiles,

    // Context data
    fetchClients,
    fetchSites,
    fetchWorkplaces,
    fetchMachines,
    fetchTeams
  }
})
