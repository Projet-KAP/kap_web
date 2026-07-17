import { computed } from 'vue'
import { useAuthStore } from '@/features/auth/stores/authStore'

/**
 * Composable pour vérifier l'accès aux modules
 * Utilise le système de feature flagging basé sur les modules activés du client
 */
export function useModuleAccess() {
  const authStore = useAuthStore()

  /**
   * Vérifie si l'utilisateur a accès à un module
   * @param {string} moduleCode - Code du module à vérifier
   * @returns {boolean}
   */
  const hasModule = (moduleCode) => {
    return authStore.hasModule(moduleCode)
  }

  /**
   * Vérifie si l'utilisateur a accès à au moins un des modules
   * @param {string[]} moduleCodes - Liste des codes de modules
   * @returns {boolean}
   */
  const hasAnyModule = (moduleCodes) => {
    if (!moduleCodes || moduleCodes.length === 0) return true
    return moduleCodes.some(code => authStore.hasModule(code))
  }

  /**
   * Vérifie si l'utilisateur a accès à tous les modules
   * @param {string[]} moduleCodes - Liste des codes de modules
   * @returns {boolean}
   */
  const hasAllModules = (moduleCodes) => {
    if (!moduleCodes || moduleCodes.length === 0) return true
    return moduleCodes.every(code => authStore.hasModule(code))
  }

  /**
   * Liste des modules activés pour l'utilisateur
   */
  const enabledModules = computed(() => authStore.getEnabledModules)

  /**
   * Vérifie si l'utilisateur est superadmin (accès à tout)
   */
  const isSuperAdmin = computed(() => {
    const user = authStore.getCurrentUser
    return user?.is_superuser === true
  })

  return {
    hasModule,
    hasAnyModule,
    hasAllModules,
    enabledModules,
    isSuperAdmin
  }
}
