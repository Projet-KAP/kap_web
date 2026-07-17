<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="`Gérer les modules - ${client?.name || ''}`"
    :style="{ width: '900px' }"
    :closable="!saving"
  >
    <div v-if="loading" class="flex justify-center items-center p-8">
      <ProgressSpinner />
    </div>

    <div v-else class="space-y-6">
      <!-- Actions rapides -->
      <div class="flex gap-2 mb-4">
        <Button
          label="Activer tous"
          icon="pi pi-check-circle"
          severity="success"
          size="small"
          outlined
          @click="enableAll"
          :disabled="saving"
        />
        <Button
          label="Désactiver tous"
          icon="pi pi-times-circle"
          severity="danger"
          size="small"
          outlined
          @click="disableAll"
          :disabled="saving"
        />
        <Button
          label="Modules par défaut"
          icon="pi pi-refresh"
          severity="info"
          size="small"
          outlined
          @click="setDefaults"
          :disabled="saving"
        />
      </div>

      <!-- Modules groupés par catégorie -->
      <div
        v-for="(categoryModules, category) in modulesByCategory"
        :key="category"
        class="border rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-700">
            {{ category }}
          </h3>
          <div class="flex gap-2">
            <Button
              label="Tout activer"
              size="small"
              text
              @click="enableCategory(category)"
              :disabled="saving"
            />
            <Button
              label="Tout désactiver"
              size="small"
              text
              severity="secondary"
              @click="disableCategory(category)"
              :disabled="saving"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="module in categoryModules"
            :key="module.code"
            class="flex items-center justify-between p-3 border rounded hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center gap-2">
              <i
                :class="[
                  'pi',
                  getModuleIcon(module.code),
                  moduleStates[module.code] ? 'text-green-600' : 'text-gray-400'
                ]"
              />
              <span class="font-medium">{{ module.name }}</span>
            </div>
            <ToggleSwitch
              v-model="moduleStates[module.code]"
              :disabled="saving"
            />
          </div>
        </div>
      </div>

      <!-- Résumé -->
      <div class="bg-blue-50 border border-blue-200 rounded p-3">
        <p class="text-sm text-blue-800 flex items-center gap-2">
          <i class="pi pi-info-circle" />
          <span><strong>{{ enabledCount }}</strong> module(s) active(s) sur <strong>{{ totalCount }}</strong></span>
        </p>
      </div>
    </div>

    <template #footer>
      <Button
        label="Annuler"
        severity="secondary"
        @click="handleCancel"
        :disabled="saving"
      />
      <Button
        label="Enregistrer"
        icon="pi pi-check"
        :loading="saving"
        @click="handleSave"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useClientModuleStore } from '../stores/clientModuleStore'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  client: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const clientModuleStore = useClientModuleStore()
const authStore = useAuthStore()
const toast = useToast()

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const loading = ref(false)
const saving = ref(false)
const moduleStates = ref({})

// Modules admin réservés aux superadmins
const adminModules = ['admin_sites', 'admin_clients', 'admin_users']

// Modules groupés par catégorie (filtrés selon les permissions)
const modulesByCategory = computed(() => {
  const allModules = clientModuleStore.getModulesByCategory()
  const isSuperAdmin = authStore.isSuperAdmin
  
  // Si l'utilisateur n'est pas superadmin, filtrer les modules admin
  if (!isSuperAdmin) {
    const filtered = {}
    Object.keys(allModules).forEach(category => {
      filtered[category] = allModules[category].filter(
        module => !adminModules.includes(module.code)
      )
      // Ne garder que les catégories qui ont encore des modules
      if (filtered[category].length === 0) {
        delete filtered[category]
      }
    })
    return filtered
  }
  
  return allModules
})

// Compteurs
const enabledCount = computed(() => {
  return Object.values(moduleStates.value).filter(enabled => enabled).length
})

const totalCount = computed(() => {
  return clientModuleStore.availableModules.length
})

// Charger les modules quand le modal s'ouvre
watch(() => props.visible, async (visible) => {
  if (visible && props.client?.id) {
    await loadModules()
  }
})

/**
 * Charge les modules disponibles et activés du client
 */
async function loadModules() {
  if (!props.client?.id) {
    return
  }

  loading.value = true

  try {
    // Charger les modules disponibles
    await clientModuleStore.fetchAvailableModules()

    // Charger les modules du client
    await clientModuleStore.fetchClientModules(props.client.id)

    // Initialiser les états des switches
    const newStates = {}
    clientModuleStore.availableModules.forEach(module => {
      const isEnabled = clientModuleStore.isModuleEnabled(module.code)
      newStates[module.code] = isEnabled
    })
    moduleStates.value = newStates
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les modules',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

/**
 * Enregistre les modifications
 */
async function handleSave() {
  saving.value = true

  try {
    // Préparer les données pour l'API
    const modulesData = Object.entries(moduleStates.value).map(([code, enabled]) => ({
      module_code: code,
      is_enabled: enabled
    }))

    await clientModuleStore.bulkUpdateModules(props.client.id, modulesData)

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Modules mis à jour avec succès',
      life: 3000
    })

    emit('saved')
    isVisible.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.error || 'Impossible de sauvegarder les modules',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

/**
 * Annule les modifications
 */
function handleCancel() {
  isVisible.value = false
}

/**
 * Active tous les modules
 */
function enableAll() {
  const newStates = {}
  // Utiliser directement availableModules au lieu de moduleStates
  clientModuleStore.availableModules.forEach(module => {
    newStates[module.code] = true
  })
  moduleStates.value = newStates
}

/**
 * Désactive tous les modules
 */
function disableAll() {
  const newStates = {}
  // Utiliser directement availableModules
  clientModuleStore.availableModules.forEach(module => {
    newStates[module.code] = false
  })
  moduleStates.value = newStates
}

/**
 * Configure les modules par défaut
 */
function setDefaults() {
  const defaultModules = [
    'dashboard',
    'documents',
    'engins',
    'teams',
    'tasks',
    'mediatheque'
  ]

  const newStates = {}
  // Utiliser directement availableModules
  clientModuleStore.availableModules.forEach(module => {
    newStates[module.code] = defaultModules.includes(module.code)
  })
  moduleStates.value = newStates
}

/**
 * Active tous les modules d'une catégorie
 */
function enableCategory(category) {
  const categoryModules = modulesByCategory.value[category] || []
  const newStates = { ...moduleStates.value }
  categoryModules.forEach(module => {
    newStates[module.code] = true
  })
  moduleStates.value = newStates
}

/**
 * Désactive tous les modules d'une catégorie
 */
function disableCategory(category) {
  const categoryModules = modulesByCategory.value[category] || []
  const newStates = { ...moduleStates.value }
  categoryModules.forEach(module => {
    newStates[module.code] = false
  })
  moduleStates.value = newStates
}

/**
 * Retourne l'icône appropriée pour un module
 */
function getModuleIcon(moduleCode) {
  const icons = {
    dashboard: 'pi-th-large',
    documents: 'pi-file',
    collect: 'pi-database',
    mes: 'pi-cog',
    production_terrassement: 'pi-building',
    production_beton: 'pi-box',
    engins: 'pi-car',
    machines: 'pi-wrench',
    workplaces: 'pi-map-marker',
    stock: 'pi-warehouse',
    transport: 'pi-truck',
    projets: 'pi-briefcase',
    planning: 'pi-calendar',
    tasks: 'pi-check-square',
    pointage: 'pi-clock',
    teams: 'pi-users',
    performance: 'pi-chart-line',
    roi: 'pi-dollar',
    comptabilite: 'pi-calculator',
    mediatheque: 'pi-images',
    column_tags: 'pi-tag',
    analytics: 'pi-chart-line',
    admin_sites: 'pi-building',
    admin_clients: 'pi-briefcase',
    admin_users: 'pi-users',
    demo: 'pi-eye'
  }

  return icons[moduleCode] || 'pi-circle'
}
</script>

<style scoped>
/* Animations pour les transitions */
.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}
</style>
