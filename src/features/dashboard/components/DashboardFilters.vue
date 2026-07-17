<template>
  <div class="dashboard-filters">
    <!-- Bouton déclencheur du Dialog -->
    <Button 
      icon="pi pi-filter"
      label="Filtres"
      @click="showFilters"
      class="filter-toggle-btn"
      :class="{ active: hasActiveFilters }"
      :badge="activeFiltersCount > 0 ? activeFiltersCount.toString() : null"
      badgeClass="p-badge-info"
      outlined
    />

    <!-- Dialog modal des filtres -->
    <Dialog 
      v-model:visible="filtersDialogVisible"
      modal
      :style="{ width: '800px', maxHeight: '90vh' }"
      :breakpoints="{ '1400px': '85vw', '1024px': '90vw', '768px': '95vw', '480px': '98vw' }"
      class="filters-dialog"
      :draggable="false"
      :resizable="false"
    >
      <template #header>
      <div class="filters-header">
          <div class="flex items-center gap-3">
            <i class="pi pi-filter text-gray-600"></i>
            <h3 class="m-0 text-lg font-semibold text-gray-800">Filtres du tableau de bord</h3>
          </div>
          <span 
          v-if="activeFiltersCount > 0" 
            class="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm font-medium"
          >
            {{ activeFiltersCount }}
          </span>
      </div>
      </template>
      
      <div class="filters-content">
        <div class="filters-grid">
        <!-- Section Métriques -->
          <div class="filter-group col-span-full">
          <div class="filter-label-with-actions">
            <label class="filter-label">
              <i class="pi pi-chart-line"></i>
              Métriques à afficher
              <span class="text-sm text-gray-500 font-normal ml-2">
                ({{ filters.selectedMetrics.length }} sélectionnées)
              </span>
            </label>
            <div class="select-all-actions">
              <Button
                label="Tout sélectionner"
                icon="pi pi-check-square"
                @click="selectAllMetrics"
                text
                size="small"
                class="select-action-btn"
              />
              <Button
                label="Tout désélectionner"
                icon="pi pi-times"
                @click="deselectAllMetrics"
                text
                size="small"
                class="select-action-btn"
              />
            </div>
          </div>
          <div class="filter-options">
            <div class="metrics-categories">
              <!-- Métriques Machines -->
              <div class="metric-category">
                <h4 class="category-title">
                  <i class="pi pi-cog text-blue-600"></i>
                  Machines & Production
                </h4>
                <div class="metrics-grid">
                  <div 
                    v-for="metric in machineMetrics" 
                    :key="metric.value"
                    class="metric-item"
                    :class="{ active: filters.selectedMetrics.includes(metric.value) }"
                    @click="toggleMetric(metric.value)"
                  >
                    <div class="metric-header">
                      <span class="metric-label">{{ metric.label }}</span>
                      <span class="metric-unit">{{ metric.unit }}</span>
                    </div>
                    <p class="metric-description">{{ metric.description }}</p>
                    <div v-if="metric.threshold" class="metric-thresholds">
                      <span class="threshold excellent">Excellent: {{ metric.threshold.excellent }}{{ metric.unit }}</span>
                      <span class="threshold acceptable">Acceptable: {{ metric.threshold.acceptable }}{{ metric.unit }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Métriques Engins -->
              <div class="metric-category">
                <h4 class="category-title">
                  <i class="pi pi-truck text-orange-600"></i>
                  Engins & Chantier
                </h4>
                <div class="metrics-grid">
                  <div 
                    v-for="metric in enginsMetrics" 
                    :key="metric.value"
                    class="metric-item"
                    :class="{ active: filters.selectedMetrics.includes(metric.value) }"
                    @click="toggleMetric(metric.value)"
                  >
                    <div class="metric-header">
                      <span class="metric-label">{{ metric.label }}</span>
                      <span class="metric-unit">{{ metric.unit }}</span>
                    </div>
                    <p class="metric-description">{{ metric.description }}</p>
                    <div v-if="metric.threshold" class="metric-thresholds">
                      <span class="threshold excellent">Excellent: {{ metric.threshold.excellent }}{{ metric.unit }}</span>
                      <span class="threshold acceptable">Acceptable: {{ metric.threshold.acceptable }}{{ metric.unit }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Métriques Opérateurs -->
              <div class="metric-category">
                <h4 class="category-title">
                  <i class="pi pi-users text-green-600"></i>
                  Opérateurs & Performance
                </h4>
                <div class="metrics-grid">
                  <div 
                    v-for="metric in operateursMetrics" 
                    :key="metric.value"
                    class="metric-item"
                    :class="{ active: filters.selectedMetrics.includes(metric.value) }"
                    @click="toggleMetric(metric.value)"
                  >
                    <div class="metric-header">
                      <span class="metric-label">{{ metric.label }}</span>
                      <span class="metric-unit">{{ metric.unit }}</span>
                    </div>
                    <p class="metric-description">{{ metric.description }}</p>
                  </div>
                </div>
              </div>

              <!-- Métriques Générales -->
              <div class="metric-category">
                <h4 class="category-title">
                  <i class="pi pi-chart-bar text-blue-600"></i>
                  Performance Globale
                </h4>
                <div class="metrics-grid">
                  <div 
                    v-for="metric in generalMetrics" 
                    :key="metric.value"
                    class="metric-item"
                    :class="{ active: filters.selectedMetrics.includes(metric.value) }"
                    @click="toggleMetric(metric.value)"
                  >
                    <div class="metric-header">
                      <span class="metric-label">{{ metric.label }}</span>
                      <span class="metric-unit">{{ metric.unit }}</span>
                    </div>
                    <p class="metric-description">{{ metric.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Statuts/États -->
        <div class="filter-group">
          <label class="filter-label">
            <i class="pi pi-info-circle"></i>
            États à inclure
          </label>
          <div class="filter-options">
            <div class="status-tabs">
              <div 
                v-for="status in statusOptions" 
                :key="status.value"
                class="status-tab"
                :class="[
                  status.severity, 
                  { active: filters.selectedStatuses.includes(status.value) }
                ]"
                @click="onStatusTabClick({ value: status.value })"
              >
                <i :class="getStatusIcon(status.value)" class="status-icon"></i>
                <span class="status-label">{{ status.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Préférences d'affichage -->
        <div class="filter-group">
          <label class="filter-label">
            <i class="pi pi-eye"></i>
            Préférences d'affichage
          </label>
          <div class="filter-options">
            <div class="display-tabs">
              <div 
                v-for="pref in displayPreferenceOptions" 
                :key="pref.value"
                class="display-tab"
                :class="{ active: filters.displayPreferences.includes(pref.value) }"
                @click="onDisplayTabClick({ value: pref.value })"
              >
                <i :class="pref.icon" class="display-icon"></i>
                <span class="display-label">{{ pref.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
          <div class="filter-actions col-span-full">
          <Button 
            label="Réinitialiser"
            icon="pi pi-refresh"
            text
            @click="resetFilters"
            class="reset-btn"
          />
          <Button 
            label="Sauvegarder"
            icon="pi pi-save"
            @click="saveFilters"
            class="save-btn"
          />
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
        <Button 
            label="Annuler" 
            severity="secondary"
            text
            @click="hideFilters"
          />
          <Button
            label="Appliquer les filtres"
            icon="pi pi-check"
            @click="applyFilters"
        />
      </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useClientConfigStore } from '../stores/clientConfigStore.js'
import { useToast } from 'primevue/usetoast'
import { axiosInstance } from '@/main.js'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'filters-changed'])

// Composables
const clientConfigStore = useClientConfigStore()
const toast = useToast()
const { getAvailableModules } = storeToRefs(clientConfigStore)

// Refs
const filtersDialogVisible = ref(false)

// Filtres par défaut
const defaultFilters = {
  period: 'today',
  dateStart: null,
  dateEnd: null,
  selectedModules: [],
  selectedMetrics: ['trs', 'performance', 'qualite'],
  selectedStatuses: ['active', 'warning', 'error'], // Array pour tabs
  groupBy: null,
  displayPreferences: ['showTrends', 'showAlerts'] // Array pour tabs
}

// Initialisation réactive avec fusion sécurisée
const filters = reactive({
  ...defaultFilters,
  ...props.modelValue,
  // Migration des anciens formats si nécessaire
  selectedStatuses: Array.isArray(props.modelValue?.selectedStatuses) 
    ? props.modelValue.selectedStatuses 
    : defaultFilters.selectedStatuses,
  displayPreferences: Array.isArray(props.modelValue?.displayPreferences)
    ? props.modelValue.displayPreferences
    : defaultFilters.displayPreferences
})

// Filters initialized

// Options
const periodOptions = [
  { label: 'Aujourd\'hui', value: 'today' },
  { label: 'Cette semaine', value: 'week' },
  { label: 'Ce mois', value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
  { label: 'Personnalisé', value: 'custom' }
]

const metricOptions = [
  // 🏭 Métriques Machines (KAP Collect + MES) - Essentielles
  {
    label: 'TRS / OEE',
    value: 'trs',
    category: 'machines',
    description: 'Taux de Rendement Synthétique (Disponibilité × Performance × Qualité)',
    unit: '%',
    threshold: { excellent: 85, acceptable: 60 }
  },
  {
    label: 'Disponibilité',
    value: 'disponibilite',
    category: 'machines',
    description: 'Temps de fonctionnement / Temps planifié',
    unit: '%'
  },
  {
    label: 'Performance',
    value: 'performance',
    category: 'machines',
    description: '(Production réelle × Temps de cycle idéal) / Temps de fonctionnement',
    unit: '%'
  },
  {
    label: 'Qualité',
    value: 'qualite',
    category: 'machines',
    description: 'Produits conformes / Production totale',
    unit: '%'
  },
  {
    label: 'Taux de rebuts',
    value: 'rebuts',
    category: 'machines',
    description: 'Produits non conformes / Production totale',
    unit: '%',
    threshold: { excellent: 2, acceptable: 5 }
  },
  {
    label: 'Productivité',
    value: 'productivite_machine',
    category: 'machines',
    description: 'Produits conformes / Temps total de production',
    unit: 'pcs/h'
  },
  {
    label: 'Temps d\'arrêt',
    value: 'temps_arret',
    category: 'machines',
    description: 'Somme des arrêts (planifiés + non planifiés)',
    unit: 'min'
  },

  // 🚜 Métriques Engins (KAP Engins) - Essentielles
  {
    label: 'MTTR',
    value: 'mttr',
    category: 'engins',
    description: 'Temps moyen de réparation',
    unit: 'min',
    threshold: { excellent: 30, acceptable: 60 }
  },
  {
    label: 'MTBF',
    value: 'mtbf',
    category: 'engins',
    description: 'Temps moyen entre pannes',
    unit: 'h',
    threshold: { excellent: 20, acceptable: 10 }
  },
  {
    label: 'Disponibilité',
    value: 'disponibilite_engins',
    category: 'engins',
    description: 'Heures moteur ON / Heures planifiées',
    unit: '%',
    threshold: { excellent: 90, acceptable: 70 }
  },
  {
    label: 'Utilisation',
    value: 'utilisation_reelle',
    category: 'engins',
    description: 'Heures utilisées / Heures disponibles',
    unit: '%'
  },
  {
    label: 'Fiabilité',
    value: 'fiabilite_chantier',
    category: 'engins',
    description: 'Heures d\'utilisation réelle / Heures prévues',
    unit: '%'
  },
  {
    label: 'Consommation carburant',
    value: 'consommation_carburant',
    category: 'engins',
    description: 'Consommation de carburant moyenne',
    unit: 'L/h'
  },

  // 👷 Métriques Opérateurs
  {
    label: 'Productivité opérateur',
    value: 'productivite_operateur',
    category: 'operateurs',
    description: 'Production réalisée / Temps de travail',
    unit: 'pcs/h'
  },

  // 📊 Performance globale
  {
    label: 'Performance globale',
    value: 'performance_globale',
    category: 'general',
    description: 'Performance globale de l\'installation',
    unit: '%'
  }
]

const statusOptions = [
  { label: 'Actif', value: 'active', severity: 'success' },
  { label: 'Attention', value: 'warning', severity: 'warning' },
  { label: 'Erreur', value: 'error', severity: 'danger' },
  { label: 'Maintenance', value: 'maintenance', severity: 'info' },
  { label: 'Arrêté', value: 'stopped', severity: 'secondary' }
]



const groupByOptions = [
  { label: 'Par machine', value: 'machine' },
  { label: 'Par zone', value: 'zone' },
  { label: 'Par opérateur', value: 'operator' },
  { label: 'Par équipe', value: 'team' },
  { label: 'Par type', value: 'type' }
]

// Computed
const availableModules = computed(() => getAvailableModules.value || [])

// Métriques organisées par catégories
const machineMetrics = computed(() => metricOptions.filter(m => m.category === 'machines'))
const enginsMetrics = computed(() => metricOptions.filter(m => m.category === 'engins'))
const operateursMetrics = computed(() => metricOptions.filter(m => m.category === 'operateurs'))
const generalMetrics = computed(() => metricOptions.filter(m => m.category === 'general'))

const activeFiltersCount = computed(() => {
  let count = 0

  // Compter chaque catégorie de filtres qui a des sélections

  // Modules : compter le nombre de modules sélectionnés
  if (filters.selectedModules && filters.selectedModules.length > 0) {
    count += filters.selectedModules.length
  }

  // Métriques : compter le nombre de métriques sélectionnées
  if (filters.selectedMetrics && filters.selectedMetrics.length > 0) {
    count += filters.selectedMetrics.length
  }

  // Statuts : compter le nombre de statuts sélectionnés
  if (filters.selectedStatuses && filters.selectedStatuses.length > 0) {
    count += filters.selectedStatuses.length
  }

  // Période : +1 si différent de "today"
  if (filters.period && filters.period !== 'today') {
    count++
  }

  // Groupement : +1 si défini
  if (filters.groupBy) {
    count++
  }

  return count
})

const hasActiveFilters = computed(() => activeFiltersCount.value > 0)

// Pas besoin de computed spécial pour les checkboxes - v-model direct

const getStatusIcon = (statusValue) => {
  const iconMap = {
    active: 'pi pi-check-circle',
    warning: 'pi pi-exclamation-triangle', 
    error: 'pi pi-times-circle',
    maintenance: 'pi pi-wrench',
    stopped: 'pi pi-ban'
  }
  return iconMap[statusValue] || 'pi pi-circle'
}

// Options pour les tabs des états
const statusTabItems = computed(() => statusOptions.map(status => ({
  label: status.label,
  value: status.value,
  icon: getStatusIcon(status.value),
  severity: status.severity
})))

// Options pour les tabs des préférences
const displayPreferenceOptions = [
  { label: 'Métriques avancées', value: 'showAdvanced', icon: 'pi pi-chart-bar' },
  { label: 'Tendances', value: 'showTrends', icon: 'pi pi-chart-line' },
  { label: 'Alertes', value: 'showAlerts', icon: 'pi pi-bell' },
  { label: 'Vue compacte', value: 'compactView', icon: 'pi pi-compress' }
]

const displayTabItems = displayPreferenceOptions.map(pref => ({
  label: pref.label,
  value: pref.value,
  icon: pref.icon
}))

// Methods pour les métriques
const toggleMetric = (metricValue) => {
  const index = filters.selectedMetrics.indexOf(metricValue)
  if (index > -1) {
    // Retirer si déjà sélectionné
    filters.selectedMetrics.splice(index, 1)
  } else {
    // Ajouter si pas sélectionné
    filters.selectedMetrics.push(metricValue)
  }
  onFilterChange()
}

const selectAllMetrics = () => {
  // Sélectionner toutes les métriques disponibles
  filters.selectedMetrics = metricOptions.map(m => m.value)
  onFilterChange()
}

const deselectAllMetrics = () => {
  // Désélectionner toutes les métriques
  filters.selectedMetrics = []
  onFilterChange()
}

// Methods pour les tabs
const onStatusTabClick = (event) => {
  const statusValue = event.value
  if (filters.selectedStatuses.includes(statusValue)) {
    // Retirer si déjà sélectionné
    filters.selectedStatuses = filters.selectedStatuses.filter(s => s !== statusValue)
  } else {
    // Ajouter si pas sélectionné
    filters.selectedStatuses.push(statusValue)
  }
  onFilterChange()
}

const onDisplayTabClick = (event) => {
  const prefValue = event.value
  if (filters.displayPreferences.includes(prefValue)) {
    // Retirer si déjà sélectionné
    filters.displayPreferences = filters.displayPreferences.filter(p => p !== prefValue)
  } else {
    // Ajouter si pas sélectionné
    filters.displayPreferences.push(prefValue)
  }
  onFilterChange()
}

// Methods pour le Dialog
const showFilters = () => {
  filtersDialogVisible.value = true
}

const hideFilters = () => {
  filtersDialogVisible.value = false
}

const onFilterChange = () => {
  emit('update:modelValue', filters)
  emit('filters-changed', filters)
}

const applyFilters = async () => {
  // Appliquer les filtres = sauvegarder + fermer
  await saveFilters()
  hideFilters()
}

const resetFilters = () => {
  // Réinitialiser avec les modules disponibles sélectionnés
  Object.assign(filters, {
    ...defaultFilters,
    selectedModules: (availableModules.value || []).map(m => m.id)
  })
  onFilterChange()

  toast.add({
    severity: 'info',
    summary: 'Filtres réinitialisés',
    detail: 'Tous les filtres ont été remis à zéro',
    life: 3000
  })

  // Fermer le dialog après réinitialisation
  hideFilters()
}

const saveFilters = async () => {
  try {
    // Sauvegarder via l'API
    const data = {
      dashboard_filters: filters
    }

    await axiosInstance.put('/accounts/users/preferences/', data)

    toast.add({
      severity: 'success',
      summary: 'Filtres sauvegardés',
      detail: 'Vos préférences ont été enregistrées en base de données',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.errors || 'Impossible de sauvegarder les préférences',
      life: 3000
    })
  }
}

const loadSavedFilters = async () => {
  try {
    const response = await axiosInstance.get('/accounts/users/preferences/')

    if (response.data.success && response.data.data.dashboard_filters) {
      const savedFilters = response.data.data.dashboard_filters

      // Migration des anciens formats si nécessaire
      if (savedFilters.selectedStatuses && typeof savedFilters.selectedStatuses === 'object' && !Array.isArray(savedFilters.selectedStatuses)) {
        savedFilters.selectedStatuses = Object.keys(savedFilters.selectedStatuses).filter(key => savedFilters.selectedStatuses[key])
      }

      if (savedFilters.displayPreferences && (!Array.isArray(savedFilters.displayPreferences) || typeof savedFilters.displayPreferences === 'boolean')) {
        savedFilters.displayPreferences = defaultFilters.displayPreferences
      }

      Object.assign(filters, {
        ...defaultFilters,
        ...savedFilters,
        selectedStatuses: Array.isArray(savedFilters.selectedStatuses)
          ? savedFilters.selectedStatuses
          : defaultFilters.selectedStatuses,
        displayPreferences: Array.isArray(savedFilters.displayPreferences)
          ? savedFilters.displayPreferences
          : defaultFilters.displayPreferences
      })
    }
  } catch (error) {
    // En cas d'erreur, utiliser les valeurs par défaut (silencieux)
    Object.assign(filters, defaultFilters)
  }
}

// Initialisation
onMounted(async () => {
  // Initialiser avec tous les modules disponibles sélectionnés
  filters.selectedModules = (availableModules.value || []).map(m => m.id)

  // Charger les filtres sauvegardés depuis l'API
  await loadSavedFilters()

  // Émettre l'état initial
  onFilterChange()
})

// Watchers
watch(() => props.modelValue, (newValue) => {
  Object.assign(filters, { ...defaultFilters, ...newValue })
}, { deep: true })

// Debug watcher pour les statuts
watch(() => filters.selectedStatuses, () => {
  // Status filters changed
}, { deep: true })
</script>

<style scoped>
.dashboard-filters {
  position: relative;
  display: inline-block;
}

.filter-toggle-btn {
  position: relative;
  transition: all 0.3s ease;
}

.filter-toggle-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.filter-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 2;
}

/* Styles pour le Dialog - Design épuré */
.filters-dialog {
  --p-dialog-border-radius: 12px;
}

:deep(.p-dialog) {
  border-radius: 12px;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

:deep(.p-dialog .p-dialog-content) {
  padding: 0;
  background: #ffffff;
}

:deep(.p-dialog .p-dialog-header) {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 12px 12px 0 0;
}

:deep(.p-dialog .p-dialog-footer) {
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.filters-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.025em;
}



.filters-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.filter-group {
  margin-bottom: 0;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.filter-group.col-span-full {
  grid-column: span 2;
}

.filter-label-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.select-all-actions {
  display: flex;
  gap: 0.5rem;
}

.select-action-btn {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  color: #374151;
  transition: all 0.2s ease;
}

.select-action-btn:hover {
  color: #16a34a;
  background: #f0fdf4;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.filter-label i {
  color: #6b7280;
  font-size: 1rem;
  width: 18px;
  text-align: center;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.period-selector {
  width: 100%;
}

.custom-dates {
  margin-top: 0.75rem;
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-input-group label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.date-input {
  width: 100%;
}

.module-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.module-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.module-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.metrics-selector {
  width: 100%;
}

/* Styles pour les métriques organisées par catégories */
.metrics-categories {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.metric-category {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background: #f9fafb;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.metric-item {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.metric-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.metric-item.active {
  border-color: #374151;
  background: #f3f4f6;
  box-shadow: 0 2px 8px rgba(55, 65, 81, 0.1);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.metric-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.metric-unit {
  background: #e5e7eb;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.metric-item.active .metric-unit {
  background: #374151;
  color: #ffffff;
}

.metric-description {
  color: #6b7280;
  font-size: 0.8rem;
  line-height: 1.4;
  margin: 0 0 0.75rem 0;
}

.metric-thresholds {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.threshold {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.threshold.excellent {
  background: #dcfce7;
  color: #166534;
}

.threshold.acceptable {
  background: #fef3c7;
  color: #92400e;
}





.group-selector {
  width: 100%;
}

.display-preferences {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preference-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preference-item label {
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f1f5f9;
}

.reset-btn {
  color: #6b7280;
  background: transparent;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.save-btn {
  background: #374151;
  border: 1px solid #374151;
  color: #fff;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background: #1f2937;
  border-color: #1f2937;
}



/* Styles épurés pour les composants PrimeVue */

/* SelectButton - Période */
:deep(.p-selectbutton .p-button) {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  border-radius: 6px;
}

:deep(.p-selectbutton .p-button.p-highlight) {
  background: #16a34a;
  border-color: #16a34a;
  color: #fff;
}

/* Status tabs */
.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  background: #ffffff;
  min-width: max-content;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-tab:hover {
  border-color: #d1d5db;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.status-icon {
  font-size: 1rem;
  transition: all 0.3s ease;
}

.status-label {
  font-weight: 500;
  transition: all 0.3s ease;
}

/* Colors for different status types */
.status-tab.success .status-icon {
  color: #16a34a;
}

.status-tab.warning .status-icon {
  color: #f59e0b;
}

.status-tab.danger .status-icon {
  color: #ef4444;
}

.status-tab.info .status-icon {
  color: #3b82f6;
}

.status-tab.secondary .status-icon {
  color: #6b7280;
}

/* États actifs simplifiés */
.status-tab.active {
  background: #374151;
  border-color: #374151;
  color: white;
  transform: translateY(-1px);
}

.status-tab.active .status-icon,
.status-tab.active .status-label {
  color: white;
}

/* Display tabs */
.display-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.display-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  background: #ffffff;
  min-width: max-content;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.display-tab:hover {
  border-color: #d1d5db;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.display-icon {
  font-size: 1rem;
  transition: all 0.3s ease;
  color: #6b7280;
}

.display-label {
  font-weight: 500;
  transition: all 0.3s ease;
}

.display-tab.active {
  background: #374151;
  border-color: #374151;
  color: white;
  transform: translateY(-1px);
}

.display-tab.active .display-icon,
.display-tab.active .display-label {
  color: white;
}

/* Anciens styles pour compatibilité - à supprimer progressivement */
.status-checkbox-item.success .status-icon {
  color: #16a34a;
}

.status-checkbox-item.success :deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background: #16a34a !important;
  border-color: #16a34a !important;
}

.status-checkbox-item.warning .status-icon {
  color: #f59e0b;
}

.status-checkbox-item.warning :deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background: #f59e0b !important;
  border-color: #f59e0b !important;
}

.status-checkbox-item.danger .status-icon {
  color: #ef4444;
}

.status-checkbox-item.danger :deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background: #ef4444 !important;
  border-color: #ef4444 !important;
}

.status-checkbox-item.info .status-icon {
  color: #3b82f6;
}

.status-checkbox-item.info :deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

.status-checkbox-item.secondary .status-icon {
  color: #6b7280;
}

.status-checkbox-item.secondary :deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background: #6b7280 !important;
  border-color: #6b7280 !important;
}

/* États actifs avec background coloré - approche alternative */
.status-checkbox-item.success.active {
  background: #f0fdf4;
  border-color: #16a34a;
}

.status-checkbox-item.warning.active {
  background: #fffbeb;
  border-color: #f59e0b;
}

.status-checkbox-item.danger.active {
  background: #fef2f2;
  border-color: #ef4444;
}

.status-checkbox-item.info.active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.status-checkbox-item.secondary.active {
  background: #f9fafb;
  border-color: #6b7280;
}

/* MultiSelect - Métriques */
:deep(.p-multiselect) {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}

:deep(.p-multiselect .p-multiselect-label) {
  color: #374151;
  padding: 0.5rem;
}

:deep(.p-multiselect-chip) {
  background: #f59e0b;
  color: #fff;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  margin: 0.125rem;
}

/* Select - Général */
:deep(.p-select) {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}

:deep(.p-select .p-select-label) {
  color: #374151;
  padding: 0.5rem;
}

/* DatePicker */
:deep(.p-datepicker input) {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem;
  background: #fff;
  color: #374151;
}

/* Checkbox - Modules */
:deep(.p-checkbox .p-checkbox-box) {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 4px;
  width: 18px;
  height: 18px;
}

:deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background: #16a34a;
  border-color: #16a34a;
}

:deep(.p-checkbox .p-checkbox-box.p-highlight .p-checkbox-icon) {
  color: #fff;
}

/* Focus states épurés */
:deep(.p-multiselect:focus),
:deep(.p-select:focus),
:deep(.p-datepicker input:focus) {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

/* S'assurer que le texte reste visible */
:deep(.p-multiselect .p-multiselect-label),
:deep(.p-select .p-select-label),
:deep(.p-datepicker input),
:deep(.p-multiselect input),
:deep(.p-select input) {
  color: #374151 !important;
  background: transparent !important;
}

:deep(.p-multiselect .p-multiselect-label.p-placeholder),
:deep(.p-select .p-select-label.p-placeholder) {
  color: #9ca3af !important;
}

/* Assurer la visibilité des options dans les dropdowns */
:deep(.p-multiselect-panel),
:deep(.p-select-panel) {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

:deep(.p-multiselect-item),
:deep(.p-select-item) {
  color: #374151;
  padding: 0.5rem;
}

:deep(.p-multiselect-item:hover),
:deep(.p-select-item:hover) {
  background: #f3f4f6;
  color: #374151;
}

/* Responsive Design pour Dialog */
@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .filter-group.col-span-full {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  :deep(.p-dialog) {
    margin: 1rem;
    width: calc(100vw - 2rem) !important;
    max-width: none !important;
  }
  
  .filters-content {
    padding: 1.5rem;
    max-height: 60vh;
  }
  
  .filters-grid {
    gap: 1rem;
  }
  
  .filter-group {
    padding: 1rem;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .metric-category {
    padding: 1rem;
  }
  
  :deep(.p-dialog .p-dialog-header) {
    padding: 1rem 1.5rem;
  }
  
  :deep(.p-dialog .p-dialog-footer) {
    padding: 1rem 1.5rem;
  }
  
  .date-inputs {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .module-checkboxes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.5rem;
  }
  
  .status-checkboxes {
    gap: 0.5rem;
  }
  
  .status-checkbox-item {
    padding: 0.375rem 0.5rem;
    gap: 0.5rem;
  }
  

}

@media (max-width: 480px) {
  :deep(.p-dialog) {
    margin: 0.5rem;
    width: calc(100vw - 1rem) !important;
    height: calc(100vh - 1rem) !important;
    max-height: calc(100vh - 1rem) !important;
  }
  
  .filters-header h3 {
    font-size: 1rem;
  }
  
  .filter-group {
    padding: 0.75rem;
  }
  
  .filters-content {
    padding: 1rem;
    max-height: calc(100vh - 180px);
  }
  
  .filters-grid {
    gap: 0.75rem;
  }
  
  .module-checkboxes {
    grid-template-columns: 1fr;
  }
  
  .status-checkboxes {
    gap: 0.375rem;
  }
  
  .status-checkbox-item {
    padding: 0.25rem 0.375rem;
    gap: 0.375rem;
  }
  
  .status-label {
    font-size: 0.8125rem;
  }
  

  
  .filter-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .reset-btn,
  .save-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
