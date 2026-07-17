import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Global store pour les événements d'import de fichiers
 * Permet aux pages d'écouter les imports de fichiers et de se rafraîchir
 */
export const useImportEventsStore = defineStore('importEvents', () => {
  const lastImportEvent = ref(null)

  const triggerImport = (importType, data) => {
    /**
     * Déclenche un événement d'import
     * @param {string} importType - 'stock', 'mes', etc.
     * @param {object} data - données de l'import
     */
    lastImportEvent.value = {
      type: importType,
      data: data,
      timestamp: Date.now()
    }
  }

  const getLastImport = (importType) => {
    /**
     * Récupère le dernier événement d'import du type spécifié
     */
    if (lastImportEvent.value?.type === importType) {
      return lastImportEvent.value
    }
    return null
  }

  const clearLastImport = () => {
    lastImportEvent.value = null
  }

  return {
    lastImportEvent,
    triggerImport,
    getLastImport,
    clearLastImport
  }
})
