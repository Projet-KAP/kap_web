<template>
  <div class="filters-container">
    <!-- Barre de recherche -->
    <div class="search-row">
      <div class="search-wrapper">
        <i class="pi pi-search search-icon"></i>
        <InputText
          v-model="searchTerm"
          placeholder="Rechercher un utilisateur (nom, email, identifiant...)"
          class="search-input"
          @input="onSearchChange"
        />
        <button v-if="searchTerm" class="clear-btn" @click="clearSearch">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-row">
      <div class="filter-item">
        <label>Role</label>
        <Select
          v-model="filters.role"
          :options="roleOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Tous"
          showClear
          @change="onFilterChange"
        />
      </div>

      <div class="filter-item">
        <label>Statut</label>
        <Select
          v-model="filters.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Tous"
          showClear
          @change="onFilterChange"
        />
      </div>

      <div class="filter-item" v-if="isSuperAdmin">
        <label>Client</label>
        <Select
          v-model="filters.client"
          :options="clientOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Tous"
          showClear
          @change="onFilterChange"
        />
      </div>

      <div class="filter-item">
        <label>Site</label>
        <Select
          v-model="filters.site"
          :options="availableSiteOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Tous"
          showClear
          @change="onFilterChange"
        />
      </div>
    </div>

    <!-- Quick filters -->
    <div class="quick-filters" v-if="showQuickFilters">
      <span class="quick-label">Filtres rapides :</span>
      <button
        :class="['chip', { active: quickFilters.activeOnly }]"
        @click="toggleQuickFilter('activeOnly')"
      >
        Actifs seulement
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useAuthStore } from '@/features/auth/stores/authStore'

const authStore = useAuthStore()

const props = defineProps({
  clients: {
    type: Array,
    default: () => []
  },
  sites: {
    type: Array,
    default: () => []
  },
  roles: {
    type: Array,
    default: () => []
  },
  showQuickFilters: {
    type: Boolean,
    default: true
  }
})

// Utiliser le getter du store pour la coherence
const isSuperAdmin = computed(() => authStore.isSuperAdmin)

const emit = defineEmits(['filters-changed', 'search-changed'])

const searchTerm = ref('')
const filters = reactive({
  role: null,
  status: null,
  client: null,
  site: null
})

const quickFilters = reactive({
  activeOnly: false
})

const statusOptions = [
  { label: 'Actif', value: 'ACTIVE' },
  { label: 'Inactif', value: 'INACTIVE' },
  { label: 'Desactive', value: 'DEACTIVATED' }
]

const roleOptions = computed(() => {
  if (!Array.isArray(props.roles)) return []
  return props.roles.map(role => ({
    label: role.role_name,
    value: role.role_name
  }))
})

const clientOptions = computed(() => {
  if (!Array.isArray(props.clients)) return []
  return props.clients.map(client => ({
    label: client.name,
    value: client.id
  }))
})

const availableSiteOptions = computed(() => {
  if (!Array.isArray(props.sites)) return []

  if (filters.client) {
    const clientSites = props.sites.filter(site => site.client === filters.client)
    return clientSites.map(site => ({
      label: site.name,
      value: site.id
    }))
  }

  return props.sites.map(site => ({
    label: site.name,
    value: site.id
  }))
})

watch(() => filters.client, (newClient) => {
  if (!newClient) {
    filters.site = null
  }
})

const onSearchChange = () => {
  emit('search-changed', searchTerm.value.trim())
}

const onFilterChange = () => {
  const activeFilters = { ...filters }

  if (quickFilters.activeOnly) {
    activeFilters.status = 'ACTIVE'
  }

  emit('filters-changed', {
    ...activeFilters,
    search: searchTerm.value.trim(),
    quickFilters: { ...quickFilters }
  })
}

const toggleQuickFilter = (filterName) => {
  quickFilters[filterName] = !quickFilters[filterName]

  if (filterName === 'activeOnly' && quickFilters.activeOnly) {
    filters.status = 'ACTIVE'
  } else if (filterName === 'activeOnly' && !quickFilters.activeOnly) {
    if (filters.status === 'ACTIVE') {
      filters.status = null
    }
  }

  onFilterChange()
}

const clearSearch = () => {
  searchTerm.value = ''
  onSearchChange()
}

const resetAllFilters = () => {
  searchTerm.value = ''
  filters.role = null
  filters.status = null
  filters.client = null
  filters.site = null
  quickFilters.activeOnly = false
  onFilterChange()
}

defineExpose({
  getActiveFilters: () => ({
    ...filters,
    search: searchTerm.value.trim(),
    quickFilters: { ...quickFilters }
  }),
  resetAllFilters
})
</script>

<style scoped>
.filters-container {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.search-row {
  margin-bottom: 1rem;
}

.search-wrapper {
  position: relative;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 0.875rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.625rem 2.25rem 0.625rem 2.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #374151;
  background: #fff;
  transition: border-color 0.15s;
}

.search-input:focus {
  outline: none;
  border-color: var(--kap-blue);
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  color: #6b7280;
}

.filters-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 150px;
}

.filter-item label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
}

.filter-item :deep(.p-select) {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
}

.filter-item :deep(.p-select:hover) {
  border-color: #d1d5db;
}

.filter-item :deep(.p-select.p-focus) {
  border-color: var(--kap-blue);
  box-shadow: none;
}

.quick-filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.quick-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.chip {
  padding: 0.375rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 100px;
  font-size: 0.75rem;
  color: #6b7280;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
}

.chip:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.chip.active {
  background: var(--kap-blue);
  border-color: var(--kap-blue);
  color: var(--kap-white);
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
  }

  .filter-item {
    width: 100%;
  }

  .search-wrapper {
    max-width: none;
  }
}
</style>
