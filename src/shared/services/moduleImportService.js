import { axiosInstance } from '@/main.js'

const IMPORT_TIMEOUT = 120000

const uploadFile = async (endpoint, file) => {
  if (!file) throw new Error('Aucun fichier fourni')

  const formData = new FormData()
  formData.append('file', file)

  // Ne pas fixer Content-Type ici : le navigateur doit ajouter lui-même la
  // boundary multipart. Sans elle, Django ne trouve aucun fichier dans FILES.
  const response = await axiosInstance.post(endpoint, formData, {
    timeout: IMPORT_TIMEOUT
  })
  return response.data
}

export const importStockFile = (file) => {
  const filename = String(file?.name || '').toLowerCase()
  const endpoint = filename.endsWith('.csv')
    ? '/stock/spare-parts/import_csv/'
    : '/stock/spare-parts/import_excel/'
  return uploadFile(endpoint, file)
}

export const importMesFile = (file) => (
  uploadFile('/engins/work-orders/import_excel/', file)
)

export const importEnginsFile = (file) => (
  uploadFile('/engins/machines/import_excel/', file)
)

