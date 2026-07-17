<template>
  <div class="users-page">
    <!-- En-tête de page -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">Gestion des Utilisateurs</h1>
          <p class="page-subtitle">Administration des utilisateurs, comptes de connexion et rôles</p>
        </div>
        <div class="header-actions">
          <Button 
            label="Nouvel utilisateur"
            icon="pi pi-user-plus"
            @click="showCreateModal = true"
            class="create-btn"
          />
        </div>
      </div>
    </div>

    <!-- Statistiques -->
    <UserStatsCards 
      :userStats="userStore.userStats"
      :compteStats="userStore.compteStats"
    />

    <!-- Filtres -->
    <UserFilters 
      :clients="userStore.clients"
      :sites="userStore.sites"
      :roles="userStore.roles"
      @filters-changed="onFiltersChanged"
      @search-changed="onSearchChanged"
      ref="filtersRef"
    />

    <!-- État de chargement -->
    <div v-if="userStore.loading && !hasData" class="loading-container">
      <ProgressSpinner />
      <p>Chargement des utilisateurs...</p>
    </div>

    <!-- Messages d'erreur -->
    <Message 
      v-if="userStore.requestErrors && userStore.requestErrors.length > 0" 
      severity="error"
      class="error-message"
      @close="userStore.resetRequestErrors"
    >
      <ul v-if="userStore.requestErrors.length > 1">
        <li v-for="error in userStore.requestErrors" :key="error">{{ error }}</li>
      </ul>
      <span v-else>{{ userStore.requestErrors[0] }}</span>
    </Message>

    <!-- Table des utilisateurs -->
    <UserTable 
      v-if="hasData"
      :users="userStore.users"
      :loading="userStore.loading"
      :selectedUsers="userStore.selectedUsers"
      @update:selectedUsers="userStore.setSelectedUsers"
      @view-user="viewUser"
      @edit-user="editUser"
      @deactivate-user="deactivateUser"
      @bulk-action="handleBulkAction"
      @refresh="refreshData"
    />

    <!-- État vide -->
    <div v-if="!hasData && !userStore.loading" class="empty-state">
      <div class="empty-content">
        <i class="pi pi-users empty-icon"></i>
        <h3>Aucun utilisateur trouvé</h3>
        <p>{{ hasActiveFilters ? 'Aucun utilisateur ne correspond aux critères de recherche' : 'Commencez par créer votre premier utilisateur' }}</p>
        <Button 
          v-if="!hasActiveFilters"
          label="Créer un utilisateur"
          icon="pi pi-plus"
          @click="showCreateModal = true"
          class="create-first-btn"
        />
      </div>
    </div>

    <!-- Modal de création/édition -->
    <UserFormModal
      v-model:visible="showFormModal"
      :user="selectedUser"
      @user-created="onUserCreated"
      @user-updated="onUserUpdated"
    />

    <!-- Modal de détails utilisateur -->
    <Dialog
      v-model:visible="showDetailModal"
      modal
      :header="selectedUser ? `Détails de ${selectedUser.first_name} ${selectedUser.last_name}` : 'Détails de l\'utilisateur'"
      class="user-detail-modal"
      :style="{ width: '50rem' }"
    >
      <div v-if="selectedUser" class="user-detail-content">
        <div class="detail-section">
          <h3 class="section-title">Informations personnelles</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Prénom</label>
              <span>{{ selectedUser.first_name || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>Nom</label>
              <span>{{ selectedUser.last_name || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>Email</label>
              <span>{{ selectedUser.email_address || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>Téléphone</label>
              <span>{{ selectedUser.phone_number || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="section-title">Informations de compte</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Identifiant</label>
              <span>{{ selectedUser.compte?.identifiant || selectedUser.compte_identifiant || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>Statut</label>
              <Tag 
                :value="getStatusLabel(selectedUser)" 
                :class="getStatusClass(selectedUser)"
                :icon="getStatusIcon(selectedUser)"
              />
            </div>
            <div class="detail-item">
              <label>Date de création</label>
              <span>{{ formatDate(selectedUser.creation_date) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="section-title">Organisation</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Client</label>
              <span>
                <Tag v-if="selectedUser.is_superuser === true || selectedUser.is_superuser === 'true'" value="Système" severity="info" />
                <span v-else>{{ selectedUser.client_name || selectedUser.client?.name || '-' }}</span>
              </span>
            </div>
            <div class="detail-item">
              <label>Site</label>
              <span>
                <Tag v-if="selectedUser.is_superuser === true || selectedUser.is_superuser === 'true'" value="Système" severity="info" />
                <span v-else>{{ selectedUser.site_name || selectedUser.site?.name || '-' }}</span>
              </span>
            </div>
            <div class="detail-item">
              <label>Rôle</label>
              <Tag 
                :value="getRoleDisplayName(selectedUser)" 
                :class="getRoleClass(getRoleDisplayName(selectedUser))"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button 
            label="Modifier" 
            icon="pi pi-pencil"
            @click="editUserFromDetail"
          />
          <Button 
            label="Fermer" 
            text
            @click="showDetailModal = false"
          />
        </div>
      </template>
    </Dialog>

    <!-- Dialog de confirmation -->
    <ConfirmDialog />

    <!-- Toast notifications -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import UserStatsCards from '../components/UserStatsCards.vue'
import UserFilters from '../components/UserFilters.vue'
import UserTable from '../components/UserTable.vue'
import UserFormModal from '../components/UserFormModal.vue'

const userStore = useUserStore()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()

// Refs
const filtersRef = ref()
const showCreateModal = ref(false)
const showFormModal = ref(false)
const showDetailModal = ref(false)
const selectedUser = ref(null)
const currentFilters = ref({})

// Computed
const hasData = computed(() => userStore.users && userStore.users.length > 0)
const hasActiveFilters = computed(() => {
  if (!currentFilters.value) return false
  return Object.values(currentFilters.value).some(value => 
    value !== null && value !== undefined && value !== ''
  )
})

// Watchers
watch(showCreateModal, (newVal) => {
  if (newVal) {
    selectedUser.value = null
    showFormModal.value = true
    showCreateModal.value = false
  }
})

// Lifecycle
onMounted(async () => {
  await initializeData()

  // Gérer le paramètre highlight depuis la recherche globale
  const highlightId = route.query.highlight
  if (highlightId) {
    const user = userStore.users.find(u => String(u.id) === String(highlightId))
    if (user) {
      viewUser(user)
    }
  }
})

// Methods
const initializeData = async () => {
  try {
    await Promise.all([
      userStore.getUsers(),
      userStore.getRoles(),
      userStore.getClients(),
      userStore.getSites(),
      userStore.getUserStats(),
      userStore.getCompteStats()
    ])
  } catch (error) {
    console.error('Error initializing data:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des données',
      life: 5000
    })
  }
}

const refreshData = async () => {
  try {
    await Promise.all([
      userStore.getUsers(currentFilters.value),
      userStore.getUserStats(),
      userStore.getCompteStats()
    ])
    toast.add({
      severity: 'success',
      summary: 'Actualisé',
      detail: 'Les données ont été actualisées',
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de l\'actualisation des données',
      life: 3000
    })
  }
}

const onFiltersChanged = async (filters) => {
  currentFilters.value = filters
  await userStore.getUsers(filters)
}

const onSearchChanged = async (searchTerm) => {
  userStore.setSearchQuery(searchTerm)
  // Relancer la recherche avec les filtres actuels + le terme de recherche
  const filtersWithSearch = {
    ...currentFilters.value,
    search: searchTerm
  }
  await userStore.getUsers(filtersWithSearch)
}

const viewUser = (user) => {
  selectedUser.value = user
  showDetailModal.value = true
}

const editUser = (user) => {
  selectedUser.value = user
  showFormModal.value = true
}

const deactivateUser = (user) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir désactiver l'utilisateur ${user.first_name} ${user.last_name} ? Il ne pourra plus se connecter.`,
    header: 'Confirmation de désactivation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-warning',
    acceptLabel: 'Désactiver',
    rejectLabel: 'Annuler',
    accept: async () => {
      try {
        await userStore.deactivateUser(user.id)
        toast.add({
          severity: 'success',
          summary: 'Succès',
          detail: `L'utilisateur ${user.first_name} ${user.last_name} a été désactivé`,
          life: 3000
        })
        await refreshData()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: `Impossible de désactiver l'utilisateur: ${error.response?.data?.detail || error.message || 'Erreur inconnue'}`,
          life: 5000
        })
      }
    }
  })
}

const handleBulkAction = async ({ action, users }) => {
  if (action === 'deactivate') {
    confirm.require({
      message: `Êtes-vous sûr de vouloir désactiver ${users.length} utilisateur(s) ? Ils ne pourront plus se connecter.`,
      header: 'Confirmation de désactivation groupée',
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-warning',
      acceptLabel: 'Désactiver',
      rejectLabel: 'Annuler',
      accept: async () => {
        let successCount = 0
        let errorCount = 0

        for (const user of users) {
          try {
            await userStore.deactivateUser(user.id)
            successCount++
          } catch (error) {
            errorCount++
            console.error(`Erreur lors de la désactivation de ${user.first_name} ${user.last_name}:`, error)
          }
        }

        if (successCount > 0 && errorCount === 0) {
          toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: `${successCount} utilisateur(s) désactivé(s) avec succès`,
            life: 3000
          })
        } else if (successCount > 0 && errorCount > 0) {
          toast.add({
            severity: 'warn',
            summary: 'Partiellement réussi',
            detail: `${successCount} utilisateur(s) désactivé(s), ${errorCount} erreur(s)`,
            life: 4000
          })
        } else if (errorCount > 0) {
          toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: `Impossible de désactiver les utilisateurs sélectionnés`,
            life: 5000
          })
        }

        if (successCount > 0) {
          await refreshData()
        }
      }
    })
  } else if (action === 'export') {
    console.log('Export des utilisateurs:', users)
  }
}

const onUserCreated = (user) => {
  showFormModal.value = false
  toast.add({
    severity: 'success',
    summary: 'Succès',
    detail: 'Utilisateur créé avec succès',
    life: 3000
  })
  // Réinitialiser les filtres pour voir le nouvel utilisateur
  currentFilters.value = {}
  if (filtersRef.value && filtersRef.value.resetAllFilters) {
    filtersRef.value.resetAllFilters()
  }
  // Recharger les données sans filtres
  userStore.getUsers({})
  userStore.getUserStats()
  userStore.getCompteStats()
}

const onUserUpdated = (user) => {
  showFormModal.value = false
  showDetailModal.value = false
  toast.add({
    severity: 'success',
    summary: 'Succès',
    detail: 'Utilisateur modifié avec succès',
    life: 3000
  })
  refreshData()
}

const editUserFromDetail = () => {
  showDetailModal.value = false
  showFormModal.value = true
}

const getStatusLabel = (user) => {
  // Si l'utilisateur n'a pas de compte ou pas de statut, on considère le statut comme Actif par défaut
  const status = user.compte_status || user.compte?.status || 'ACTIVE'
  switch (status) {
    case 'ACTIVE': return 'Actif'
    case 'INACTIVE': return 'Inactif'
    case 'DEACTIVATED': return 'Désactivé'
    default: return 'Actif'
  }
}

const getStatusClass = (user) => {
  const status = user.compte_status || user.compte?.status || 'ACTIVE'
  switch (status) {
    case 'ACTIVE': return 'status-active'
    case 'INACTIVE': return 'status-inactive'
    case 'DEACTIVATED': return 'status-deactivated'
    default: return 'status-active'
  }
}

const getStatusIcon = (user) => {
  const status = user.compte_status || user.compte?.status || 'ACTIVE'
  switch (status) {
    case 'ACTIVE': return 'pi pi-check-circle'
    case 'INACTIVE': return 'pi pi-pause-circle'
    case 'DEACTIVATED': return 'pi pi-times-circle'
    default: return 'pi pi-check-circle'
  }
}

const getRoleDisplayName = (user) => {
  if (user.is_superuser === true || user.is_superuser === 'true') {
    return 'Super Administrateur'
  }
  const roleName = user.role_name || user.role?.role_name || user.role?.name
  if (roleName === 'SUPER_ADMIN' || roleName === 'super_admin') {
    return 'Super Administrateur'
  }
  return roleName || 'Non défini'
}

const getRoleClass = (roleName) => {
  if (!roleName || roleName === 'Non défini') return 'role-undefined'
  const role = roleName.toLowerCase()
  if (role.includes('super administrateur') || role === 'super_admin' || role === 'superadmin') {
    return 'role-superadmin'
  }
  if (role.includes('admin')) return 'role-admin'
  if (role.includes('manager') || role.includes('supervisor')) return 'role-manager'
  if (role.includes('operator') || role.includes('operateur')) return 'role-operator'
  return 'role-viewer'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}


</script>

<style scoped>
.users-page {
  padding: 1.5rem;
  background: #f9fafb;
  min-height: calc(100vh - 200px);
}

.page-header {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.header-text {
  flex: 1;
}

.page-title {
  margin: 0 0 0.25rem 0;
  color: var(--kap-blue);
  font-size: 1.25rem;
  font-weight: 600;
}

.page-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.8125rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.create-btn {
  background: var(--kap-blue);
  border-color: var(--kap-blue);
  color: var(--kap-white);
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.15s;
}

.create-btn:hover {
  background: #0a2331;
  border-color: #0a2331;
}

.create-btn:focus {
  background: #0a2331;
  border-color: #0a2331;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.loading-container p {
  margin-top: 1rem;
  color: #6b7280;
  font-size: 0.8125rem;
}

.error-message {
  margin-bottom: 1.5rem;
}

.error-message ul {
  margin: 0;
  padding-left: 1.5rem;
}

.empty-state {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
}

.empty-content {
  max-width: 360px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 2.5rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-content h3 {
  color: var(--kap-blue);
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.empty-content p {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.create-first-btn {
  background: var(--kap-blue);
  border-color: var(--kap-blue);
  color: var(--kap-white);
  padding: 0.625rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
}

.create-first-btn:hover {
  background: #0a2331;
  border-color: #0a2331;
}

/* Styles pour le modal de details */
.user-detail-modal {
  border-radius: 8px;
}

.user-detail-content {
  padding: 0.5rem 0;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-weight: 500;
  color: #9ca3af;
  font-size: 0.75rem;
}

.detail-item span {
  color: var(--kap-blue);
  font-size: 0.875rem;
}

.status-active {
  background: rgba(122, 201, 67, 0.15);
  color: var(--kap-green);
}

.status-inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.status-deactivated {
  background: #f3f4f6;
  color: #9ca3af;
}

.status-unknown {
  background: #f3f4f6;
  color: #9ca3af;
}

.role-admin {
  background: var(--kap-blue) !important;
  color: #ffffff !important;
}

.role-manager {
  background: rgba(11, 43, 60, 0.8) !important;
  color: #ffffff !important;
}

.role-operator {
  background: rgba(11, 43, 60, 0.6) !important;
  color: #ffffff !important;
}

.role-viewer {
  background: rgba(11, 43, 60, 0.1) !important;
  color: var(--kap-blue) !important;
}

.role-undefined {
  background: #f3f4f6 !important;
  color: #9ca3af !important;
}

.role-superadmin {
  background: var(--kap-green) !important;
  color: #ffffff !important;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@media (max-width: 768px) {
  .users-page {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .header-actions {
    justify-content: center;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style> 