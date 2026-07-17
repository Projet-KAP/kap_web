<template>
  <Drawer
    v-model:visible="visible"
    position="full"
    :dismissable="true"
    :showCloseIcon="false"
    class="search-drawer"
  >
    <template #container>
      <div class="search-drawer-container">
        <!-- Header avec barre de recherche -->
        <div class="search-header">
          <div class="search-input-wrapper">
            <i class="pi pi-search search-icon"></i>
            <InputText
              ref="searchInput"
              v-model="searchQuery"
              placeholder="Rechercher des machines, engins, documents, équipes, utilisateurs..."
              class="search-input"
              @input="handleSearch"
              @keydown="handleKeydown"
              autocomplete="off"
            />
            <Button
              v-if="searchQuery"
              icon="pi pi-times-circle"
              text
              rounded
              @click="clearSearch"
              class="clear-btn"
              severity="secondary"
            />
          </div>
          <Button
            icon="pi pi-times"
            text
            rounded
            @click="closeDrawer"
            class="close-btn"
            severity="secondary"
            v-tooltip="'Fermer (ESC)'"
          />
        </div>

        <!-- Contenu -->
        <div class="search-content">
          <!-- Recherches récentes / suggestions -->
          <div v-if="!searchQuery" class="search-suggestions">
            <div class="suggestions-section">
              <h3><i class="pi pi-history"></i> Recherches récentes</h3>
              <div class="recent-searches">
                <Tag
                  v-for="(item, index) in recentSearches"
                  :key="index"
                  :value="item"
                  class="search-tag"
                  @click="selectRecentSearch(item)"
                >
                  <i class="pi pi-clock"></i>
                  {{ item }}
                </Tag>
                <div v-if="recentSearches.length === 0" class="empty-recent">
                  <i class="pi pi-info-circle"></i>
                  <span>Aucune recherche récente</span>
                </div>
              </div>
            </div>

            <div class="suggestions-section">
              <h3><i class="pi pi-bolt"></i> Accès rapides</h3>
              <div class="quick-access-grid">
                <div class="quick-access-item" @click="quickNavigate('/dashboard')">
                  <i class="pi pi-chart-line"></i>
                  <span>Dashboard</span>
                </div>
                <div class="quick-access-item" @click="quickNavigate('/engins')">
                  <i class="pi pi-wrench"></i>
                  <span>Machines/Engins</span>
                </div>
                <div class="quick-access-item" @click="quickNavigate('/collect')">
                  <i class="pi pi-database"></i>
                  <span>Collect</span>
                </div>
                <div class="quick-access-item" @click="quickNavigate('/teams')">
                  <i class="pi pi-users"></i>
                  <span>Équipes</span>
                </div>
                <div class="quick-access-item" @click="quickNavigate('/documents')">
                  <i class="pi pi-file"></i>
                  <span>Documents</span>
                </div>
                <div class="quick-access-item" @click="quickNavigate('/mes')">
                  <i class="pi pi-cog"></i>
                  <span>MES</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Résultats de recherche -->
          <div v-else class="search-results">
            <div v-if="isSearching" class="loading-state">
              <ProgressSpinner style="width: 50px; height: 50px" />
              <p>Recherche en cours...</p>
            </div>

            <div v-else-if="hasResults" class="results-container">
              <!-- Machines/Engins -->
              <div v-if="results.machines.length > 0" class="result-section">
                <h3 class="section-title">
                  <i class="pi pi-wrench"></i>
                  Machines & Engins
                  <Badge :value="results.machines.length" severity="info" />
                </h3>
                <div class="result-items">
                  <div
                    v-for="(item, index) in results.machines"
                    :key="`machine-${item.id}`"
                    class="result-item"
                    :class="{ 'highlighted': highlightedIndex === `machine-${index}` }"
                    @click="navigateToItem('machine', item)"
                    @mouseenter="highlightedIndex = `machine-${index}`"
                  >
                    <div class="result-icon machine-icon">
                      <i class="pi pi-wrench"></i>
                    </div>
                    <div class="result-content">
                      <h4>{{ item.name || item.reference }}</h4>
                      <p>
                        <Tag :value="item.type || 'MACHINE'" severity="secondary" class="mr-2" />
                        <Tag :value="item.status || 'ACTIVE'" :severity="getStatusSeverity(item.status)" />
                        <span v-if="item.workplace_name" class="ml-2">• {{ item.workplace_name }}</span>
                      </p>
                    </div>
                    <i class="pi pi-chevron-right"></i>
                  </div>
                </div>
              </div>

              <!-- Documents -->
              <div v-if="results.documents.length > 0" class="result-section">
                <h3 class="section-title">
                  <i class="pi pi-file"></i>
                  Documents
                  <Badge :value="results.documents.length" severity="info" />
                </h3>
                <div class="result-items">
                  <div
                    v-for="(item, index) in results.documents"
                    :key="`doc-${item.id}`"
                    class="result-item"
                    :class="{ 'highlighted': highlightedIndex === `doc-${index}` }"
                    @click="navigateToItem('document', item)"
                    @mouseenter="highlightedIndex = `doc-${index}`"
                  >
                    <div class="result-icon document-icon">
                      <i class="pi pi-file"></i>
                    </div>
                    <div class="result-content">
                      <h4>{{ item.name || item.title || item.reference }}</h4>
                      <p>
                        <Tag v-if="item.document_type" :value="item.document_type" severity="secondary" />
                        <span v-if="item.status" class="ml-2">• Statut: {{ item.status }}</span>
                        <span v-if="item.created_at" class="ml-2">• {{ formatDate(item.created_at) }}</span>
                      </p>
                    </div>
                    <i class="pi pi-chevron-right"></i>
                  </div>
                </div>
              </div>

              <!-- Équipes -->
              <div v-if="results.teams.length > 0" class="result-section">
                <h3 class="section-title">
                  <i class="pi pi-users"></i>
                  Équipes
                  <Badge :value="results.teams.length" severity="info" />
                </h3>
                <div class="result-items">
                  <div
                    v-for="(item, index) in results.teams"
                    :key="`team-${item.id}`"
                    class="result-item"
                    :class="{ 'highlighted': highlightedIndex === `team-${index}` }"
                    @click="navigateToItem('team', item)"
                    @mouseenter="highlightedIndex = `team-${index}`"
                  >
                    <div class="result-icon team-icon">
                      <i class="pi pi-users"></i>
                    </div>
                    <div class="result-content">
                      <h4>{{ item.name }}</h4>
                      <p>
                        <span v-if="item.members_count !== undefined">{{ item.members_count }} membres</span>
                        <span v-else-if="item.members?.length">{{ item.members.length }} membres</span>
                        <span v-if="item.department" class="ml-2">• {{ item.department }}</span>
                      </p>
                    </div>
                    <i class="pi pi-chevron-right"></i>
                  </div>
                </div>
              </div>

              <!-- Utilisateurs -->
              <div v-if="results.users.length > 0" class="result-section">
                <h3 class="section-title">
                  <i class="pi pi-user"></i>
                  Utilisateurs
                  <Badge :value="results.users.length" severity="info" />
                </h3>
                <div class="result-items">
                  <div
                    v-for="(item, index) in results.users"
                    :key="`user-${item.id}`"
                    class="result-item"
                    :class="{ 'highlighted': highlightedIndex === `user-${index}` }"
                    @click="navigateToItem('user', item)"
                    @mouseenter="highlightedIndex = `user-${index}`"
                  >
                    <div class="result-icon user-icon">
                      <Avatar :label="getInitials(item.first_name || item.username || item.email)" />
                    </div>
                    <div class="result-content">
                      <h4>{{ item.first_name }} {{ item.last_name || '' }}</h4>
                      <p>
                        <span>{{ item.email || item.username }}</span>
                        <span v-if="item.role" class="ml-2">• {{ item.role }}</span>
                      </p>
                    </div>
                    <i class="pi pi-chevron-right"></i>
                  </div>
                </div>
              </div>

              <!-- Résumé des résultats -->
              <div class="results-summary">
                <i class="pi pi-info-circle"></i>
                <span>{{ totalResults }} résultat(s) trouvé(s)</span>
                <span class="ml-2">• Utilisez ↑↓ pour naviguer, Entrée pour sélectionner</span>
              </div>
            </div>

            <div v-else class="no-results">
              <i class="pi pi-search"></i>
              <h3>Aucun résultat trouvé</h3>
              <p>Essayez avec d'autres termes de recherche</p>
              <div class="suggestions-help">
                <p class="help-title">Suggestions :</p>
                <ul>
                  <li>Vérifiez l'orthographe</li>
                  <li>Utilisez des termes plus généraux</li>
                  <li>Essayez des mots-clés différents</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Drawer>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { axiosInstance } from '@/main.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const searchInput = ref(null)
const searchQuery = ref('')
const isSearching = ref(false)
const highlightedIndex = ref(null)
const results = ref({
  machines: [],
  documents: [],
  teams: [],
  users: []
})

// Charger les recherches récentes depuis localStorage
const loadRecentSearches = () => {
  try {
    const stored = localStorage.getItem('kap_recent_searches')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Erreur chargement recherches récentes:', e)
  }
  return []
}

const saveRecentSearches = (searches) => {
  try {
    localStorage.setItem('kap_recent_searches', JSON.stringify(searches))
  } catch (e) {
    console.error('Erreur sauvegarde recherches récentes:', e)
  }
}

const recentSearches = ref(loadRecentSearches())

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const hasResults = computed(() => {
  return (
    results.value.machines.length > 0 ||
    results.value.documents.length > 0 ||
    results.value.teams.length > 0 ||
    results.value.users.length > 0
  )
})

const totalResults = computed(() => {
  const machines = Array.isArray(results.value.machines) ? results.value.machines.length : 0
  const documents = Array.isArray(results.value.documents) ? results.value.documents.length : 0
  const teams = Array.isArray(results.value.teams) ? results.value.teams.length : 0
  const users = Array.isArray(results.value.users) ? results.value.users.length : 0
  return machines + documents + teams + users
})

// Focus sur l'input quand le drawer s'ouvre
watch(visible, async (newValue) => {
  if (newValue) {
    await nextTick()
    // Pour PrimeVue 4, InputText expose directement le DOM element
    if (searchInput.value?.$el) {
      searchInput.value.$el.focus()
    } else if (searchInput.value) {
      // Fallback: si c'est directement un élément HTML
      searchInput.value.focus()
    }
    // Ajouter écouteur clavier global
    document.addEventListener('keydown', handleGlobalKeydown)
  } else {
    // Retirer écouteur et nettoyer
    document.removeEventListener('keydown', handleGlobalKeydown)
    searchQuery.value = ''
    results.value = {
      machines: [],
      documents: [],
      teams: [],
      users: []
    }
    highlightedIndex.value = null
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape' && visible.value) {
    closeDrawer()
  }
}

const handleKeydown = (e) => {
  if (e.key === 'Enter' && highlightedIndex.value) {
    // Naviguer vers l'élément surligné
    const [type, index] = highlightedIndex.value.split('-')
    const typeMap = {
      machine: 'machines',
      doc: 'documents',
      team: 'teams',
      user: 'users'
    }
    const items = results.value[typeMap[type]] || []
    if (items[index]) {
      navigateToItem(type === 'doc' ? 'document' : type, items[index])
    }
  }
}

let searchTimeout = null
const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (!searchQuery.value.trim()) {
    results.value = {
      machines: [],
      documents: [],
      teams: [],
      users: []
    }
    highlightedIndex.value = null
    return
  }

  isSearching.value = true
  highlightedIndex.value = null

  searchTimeout = setTimeout(async () => {
    try {
      const query = encodeURIComponent(searchQuery.value.trim())
      
      const searchPromises = [
        axiosInstance.get(`engins/machines/?search=${query}`).catch(() => ({ data: { results: [] } })),
        axiosInstance.get(`documents/instances/?search=${query}`).catch(() => ({ data: { results: [] } })),
        axiosInstance.get(`teams/teams/?search=${query}`).catch(() => ({ data: { results: [] } })),
        axiosInstance.get(`accounts/users/?search=${query}`).catch(() => ({ data: { results: [] } }))
      ]

      const [machinesRes, documentsRes, teamsRes, usersRes] = await Promise.allSettled(searchPromises)

      results.value = {
        machines: machinesRes.status === 'fulfilled' 
          ? (machinesRes.value.data?.results || machinesRes.value.data || [])
          : [],
        documents: documentsRes.status === 'fulfilled'
          ? (documentsRes.value.data?.results || documentsRes.value.data || [])
          : [],
        teams: teamsRes.status === 'fulfilled'
          ? (teamsRes.value.data?.results || teamsRes.value.data || [])
          : [],
        users: usersRes.status === 'fulfilled'
          ? (usersRes.value.data?.results || usersRes.value.data || [])
          : []
      }

      // Ajouter à l'historique si on a des résultats
      if (hasResults.value && !recentSearches.value.includes(searchQuery.value)) {
        recentSearches.value.unshift(searchQuery.value)
        if (recentSearches.value.length > 10) {
          recentSearches.value.pop()
        }
        saveRecentSearches(recentSearches.value)
      }
    } catch (error) {
      console.error('Erreur recherche:', error)
      results.value = {
        machines: [],
        documents: [],
        teams: [],
        users: []
      }
    } finally {
      isSearching.value = false
    }
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  results.value = {
    machines: [],
    documents: [],
    teams: [],
    users: []
  }
  highlightedIndex.value = null
  searchInput.value?.$el?.focus()
}

const selectRecentSearch = (term) => {
  searchQuery.value = term
  handleSearch()
}

const quickNavigate = (path) => {
  router.push(path)
  closeDrawer()
}

const navigateToItem = (type, item) => {
  let route = '/'

  switch (type) {
    case 'machine':
      // Naviguer vers /engins avec l'ID en query param pour sélection
      route = `/engins?highlight=${item.id}`
      break
    case 'document':
      // Naviguer vers /documents avec l'ID en query param
      route = `/documents?instance=${item.id}`
      break
    case 'team':
      // La route team-performance accepte un ID
      route = `/team-performance/${item.id}`
      break
    case 'user':
      // Naviguer vers /users avec l'ID en query param
      route = `/users?highlight=${item.id}`
      break
    default:
      route = '/dashboard'
  }

  router.push(route)
  closeDrawer()
}

const closeDrawer = () => {
  visible.value = false
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const getStatusSeverity = (status) => {
  const statusMap = {
    'ACTIVE': 'success',
    'INACTIVE': 'secondary',
    'MAINTENANCE': 'warning',
    'OUT_OF_ORDER': 'danger',
    'BREAKDOWN': 'danger'
  }
  return statusMap[status] || 'secondary'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateString
  }
}
</script>

<style scoped>
.search-drawer :deep(.p-drawer) {
  background: #f8fafc;
}

.search-drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 16px;
  padding: 0 1.5rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.search-input-wrapper:focus-within {
  background: white;
  border-color: #059669;
  box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1);
}

.search-icon {
  color: #6b7280;
  font-size: 1.25rem;
  margin-right: 1rem;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 1rem 0;
  font-size: 1.125rem;
  outline: none;
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-btn,
.close-btn {
  transition: all 0.2s ease;
}

.clear-btn:hover,
.close-btn:hover {
  background: #f3f4f6;
}

.search-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

/* Suggestions */
.search-suggestions {
  max-width: 1200px;
  margin: 0 auto;
}

.suggestions-section {
  margin-bottom: 3rem;
}

.suggestions-section h3 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.suggestions-section h3 i {
  color: #059669;
}

.recent-searches {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.empty-recent {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
  font-size: 0.875rem;
  padding: 0.5rem;
}

.search-tag {
  cursor: pointer;
  padding: 0.75rem 1.25rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-tag:hover {
  background: #f9fafb;
  border-color: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quick-access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.quick-access-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-access-item:hover {
  background: #f0fdf4;
  border-color: #059669;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(5, 150, 105, 0.15);
}

.quick-access-item i {
  font-size: 2rem;
  color: #059669;
}

.quick-access-item span {
  font-weight: 500;
  color: #1f2937;
}

/* Résultats */
.search-results {
  max-width: 1200px;
  margin: 0 auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
}

.loading-state p {
  color: #6b7280;
  font-size: 1.125rem;
}

.result-section {
  margin-bottom: 2.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
}

.section-title i {
  color: #059669;
}

.result-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-item:hover,
.result-item.highlighted {
  background: #f0fdf4;
  border-color: #059669;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.1);
}

.result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  font-size: 1.25rem;
}

.machine-icon {
  background: #f0fdf4;
  color: #059669;
}

.document-icon {
  background: #eff6ff;
  color: #2563eb;
}

.team-icon {
  background: #fef3c7;
  color: #d97706;
}

.user-icon {
  background: #f3e8ff;
  color: #9333ea;
}

.result-content {
  flex: 1;
}

.result-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.result-content p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.result-item > .pi-chevron-right {
  color: #9ca3af;
  transition: all 0.2s ease;
}

.result-item:hover > .pi-chevron-right,
.result-item.highlighted > .pi-chevron-right {
  color: #059669;
  transform: translateX(4px);
}

.results-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 2rem;
}

.results-summary i {
  color: #059669;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  text-align: center;
}

.no-results i {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.no-results h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.no-results p {
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 2rem;
}

.suggestions-help {
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
}

.help-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.suggestions-help ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestions-help li {
  padding: 0.5rem 0;
  color: #6b7280;
  position: relative;
  padding-left: 1.5rem;
}

.suggestions-help li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #059669;
  font-weight: bold;
}
</style>
