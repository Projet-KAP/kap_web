<template>
  <div class="user-table-container">
    <div class="table-header">
      <div class="table-controls">
        <div class="selection-info" v-if="hasSelectedUsers">
          <span>{{ selectedUsers.length }} utilisateur(s) sélectionné(s)</span>
          <Button 
            ref="bulkActionsButton"
            label="Actions groupées" 
            icon="pi pi-angle-down"
            text
            @click="toggleBulkActions"
            class="bulk-actions-btn"
          />
        </div>
        <div class="table-actions">
          <Button 
            icon="pi pi-refresh" 
            text
            @click="$emit('refresh')"
            class="action-btn"
            v-tooltip.top="'Actualiser la liste des utilisateurs'"
          />
          <Button 
            icon="pi pi-download" 
            text
            @click="exportUsers"
            class="action-btn"
            v-tooltip.top="'Exporter la liste en CSV/Excel'"
          />
        </div>
      </div>
    </div>

    <div class="table-wrapper">
      <TableSkeleton 
        v-if="loading" 
        type="datatable" 
        :columns="8" 
        :rows="6"
        :showHeader="false"
      />
      <DataTable 
        v-else
        ref="dt"
        :value="users" 
        :paginator="true"
        :rows="25"
        :rowsPerPageOptions="[10, 25, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} utilisateurs"
        :selection="selectedUsers"
        @update:selection="$emit('update:selectedUsers', $event)"
        dataKey="id"
        :rowHover="true"
        responsiveLayout="scroll"
        :scrollable="true"
        scrollHeight="600px"
        class="user-table"
        @row-select="onRowSelect"
        @row-unselect="onRowUnselect"
        @select-all="onSelectAll"
        @unselect-all="onUnselectAll"
      >
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        
        <Column field="full_name" header="Utilisateur" sortable>
          <template #body="{ data }">
            <div class="user-info">
              <div class="user-name">{{ data.first_name }} {{ data.last_name }}</div>
              <div class="user-email">{{ data.email_address }}</div>
            </div>
          </template>
        </Column>

        <Column field="role_name" header="Rôle" sortable>
          <template #body="{ data }">
            <Tag 
              :value="getRoleDisplayName(data)" 
              :class="getRoleClass(getRoleDisplayName(data))"
              class="role-tag"
            />
          </template>
        </Column>

        <Column field="site_name" header="Site" sortable>
          <template #body="{ data }">
            <span class="site-name">
              <template v-if="data.is_superuser === true || data.is_superuser === 'true'">
                <Tag value="Système" severity="info" class="system-tag" />
              </template>
              <template v-else>
                {{ data.site_name || data.site?.name || '-' }}
              </template>
            </span>
          </template>
        </Column>

        <Column field="client_name" header="Client" sortable>
          <template #body="{ data }">
            <span class="client-name">
              <template v-if="data.is_superuser === true || data.is_superuser === 'true'">
                <Tag value="Système" severity="info" class="system-tag" />
              </template>
              <template v-else>
                {{ data.client_name || data.client?.name || '-' }}
              </template>
            </span>
          </template>
        </Column>

        <Column field="status" header="Statut" sortable>
          <template #body="{ data }">
            <div class="status-container">
              <Tag 
                :value="getStatusLabel(data)" 
                :class="getStatusClass(data)"
                :icon="getStatusIcon(data)"
                class="status-tag"
              />
            </div>
          </template>
        </Column>

        <Column field="phone_number" header="Téléphone">
          <template #body="{ data }">
            <span class="phone-number">{{ data.phone_number || '-' }}</span>
          </template>
        </Column>

        <Column field="creation_date" header="Créé le" sortable>
          <template #body="{ data }">
            <span class="creation-date">{{ formatDate(data.creation_date) }}</span>
          </template>
        </Column>

        <Column header="Actions" style="width: 120px">
          <template #body="{ data }">
            <div class="action-buttons">
              <Button 
                icon="pi pi-eye" 
                text
                @click="$emit('view-user', data)"
                class="action-btn view-btn"
                v-tooltip.top="'Voir les détails de l\'utilisateur'"
              />
              <Button 
                icon="pi pi-pencil" 
                text
                @click="$emit('edit-user', data)"
                class="action-btn edit-btn"
                v-tooltip.top="'Modifier les informations'"
              />
              <Button 
                icon="pi pi-ban" 
                text 
                @click="$emit('deactivate-user', data)"
                severity="warning"
                class="action-btn deactivate-btn"
                v-tooltip.top="'Désactiver l\'utilisateur'"
              />
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="empty-state">
            <i class="pi pi-users empty-icon"></i>
            <h3>Aucun utilisateur trouvé</h3>
            <p>Aucun utilisateur ne correspond aux critères de recherche</p>
          </div>
        </template>

        <template #loading>
          <div class="loading-state">
            <ProgressSpinner />
            <p>Chargement des utilisateurs...</p>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Menu contextuel -->
    <Menu ref="userMenu" :model="menuItems" :popup="true" />

    <!-- Menu actions groupées -->
    <Popover v-model:visible="showBulkActions" :target="bulkActionsButton" class="bulk-actions-panel">
      <template #content>
        <div class="bulk-actions-content">
          <h4>Actions groupées</h4>
          <div class="bulk-action-item danger" @click="bulkDeactivate">
            <i class="pi pi-ban"></i>
            <span>Désactiver les utilisateurs</span>
          </div>
        </div>
      </template>
    </Popover>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  users: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedUsers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:selectedUsers',
  'view-user',
  'edit-user',
  'deactivate-user',
  'bulk-action',
  'refresh'
])

const dt = ref()
const userMenu = ref()
const bulkActionsButton = ref()
const showBulkActions = ref(false)
const currentUser = ref(null)

const hasSelectedUsers = computed(() => props.selectedUsers.length > 0)

const menuItems = ref([
  {
    label: 'Voir le profil',
    icon: 'pi pi-user',
    command: () => emit('view-user', currentUser.value)
  },
  {
    label: 'Modifier',
    icon: 'pi pi-pencil',
    command: () => emit('edit-user', currentUser.value)
  },
  { separator: true },
  {
    label: 'Désactiver',
    icon: 'pi pi-ban',
    class: 'danger-menu-item',
    command: () => emit('deactivate-user', currentUser.value)
  }
])

const getRoleDisplayName = (user) => {
  // Vérifier d'abord si c'est un superadmin système
  if (user.is_superuser === true || user.is_superuser === 'true') {
    return 'Super Administrateur'
  }
  
  // Try multiple ways to get the role name
  const roleName = user.role_name || 
                   user.role?.role_name || 
                   user.role?.name ||
                   (typeof user.role === 'string' ? user.role : null)
  
  // Si le rôle est SUPER_ADMIN, afficher Super Administrateur
  if (roleName === 'SUPER_ADMIN' || roleName === 'super_admin') {
    return 'Super Administrateur'
  }
  
  return roleName || 'Non défini'
}

const getRoleClass = (roleName) => {
  if (!roleName || roleName === 'Non défini') return 'role-undefined'
  
  const role = roleName.toLowerCase()
  
  // Super administrateur a un style spécial
  if (role.includes('super administrateur') || role === 'super_admin' || role === 'superadmin') {
    return 'role-superadmin'
  }
  
  if (role.includes('admin')) return 'role-admin'
  if (role.includes('manager') || role.includes('supervisor')) return 'role-manager'
  if (role.includes('operator') || role.includes('operateur')) return 'role-operator'
  return 'role-viewer'
}

const getStatusLabel = (user) => {
  if (user.is_active === false) return 'Désactivé'
  return 'Actif'
}

const getStatusClass = (user) => {
  if (user.is_active === false) return 'status-inactive'
  return 'status-active'
}

const getStatusIcon = (user) => {
  if (user.is_active === false) return 'pi pi-times-circle'
  return 'pi pi-check-circle'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const onRowSelect = (event) => {
  const selected = [...props.selectedUsers, event.data]
  emit('update:selectedUsers', selected)
}

const onRowUnselect = (event) => {
  const selected = props.selectedUsers.filter(user => user.id !== event.data.id)
  emit('update:selectedUsers', selected)
}

const onSelectAll = (event) => {
  emit('update:selectedUsers', event.data)
}

const onUnselectAll = () => {
  emit('update:selectedUsers', [])
}

const showUserMenu = (event, user) => {
  currentUser.value = user
  userMenu.value.toggle(event)
}

const toggleBulkActions = (event) => {
  showBulkActions.value = !showBulkActions.value
}

const bulkDeactivate = () => {
  emit('bulk-action', { action: 'deactivate', users: props.selectedUsers })
  showBulkActions.value = false
}

const exportUsers = () => {
  dt.value.exportCSV()
}
</script>

<style scoped>
.user-table-container {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.bulk-actions-btn {
  color: #374151;
}

.bulk-actions-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 6px;
  transition: all 0.15s;
  color: #6b7280;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.action-btn:focus {
  background: #f3f4f6;
  color: #374151;
}

.table-wrapper {
  padding: 0;
}

.user-table {
  border: none;
}

.user-table :deep(.p-datatable-header) {
  background: transparent;
  border: none;
  padding: 0;
}

.user-table :deep(.p-datatable-thead > tr > th) {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  padding: 0.75rem 1rem;
}

.user-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.user-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f9fafb;
}

.user-avatar {
  display: flex;
  justify-content: center;
}

.avatar {
  background: #e5e7eb !important;
  color: #374151 !important;
  font-weight: 500;
  font-size: 0.875rem;
  text-transform: uppercase;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  font-weight: 500;
  color: var(--kap-blue);
}

.user-email {
  font-size: 0.8125rem;
  color: #9ca3af;
}

.role-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-weight: 500;
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
  background: var(--kap-green);
  color: var(--kap-white);
  font-weight: 500;
}

.system-tag {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  background: #f3f4f6;
  color: #6b7280;
}

.site-name, .client-name {
  color: var(--kap-blue);
  font-size: 0.875rem;
}

.status-container {
  display: flex;
  align-items: center;
}

.status-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

.phone-number, .creation-date {
  color: #6b7280;
  font-size: 0.8125rem;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

.action-buttons .action-btn {
  width: 2rem;
  height: 2rem;
  font-size: 0.75rem;
}

.view-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.edit-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.menu-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.empty-state, .loading-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  color: #d1d5db;
}

.bulk-actions-panel .bulk-actions-content {
  padding: 1rem;
  min-width: 200px;
}

.bulk-actions-content h4 {
  margin: 0 0 0.75rem 0;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.bulk-action-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s;
  color: #374151;
  font-size: 0.875rem;
}

.bulk-action-item:hover {
  background: #f3f4f6;
}

.bulk-action-item.danger {
  color: #374151;
}

.bulk-action-item.danger:hover {
  background: #f3f4f6;
}

:deep(.danger-menu-item) {
  color: #374151 !important;
}

:deep(.danger-menu-item:hover) {
  background: #f3f4f6 !important;
}

@media (max-width: 768px) {
  .table-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .selection-info {
    justify-content: center;
  }
  
  .table-actions {
    justify-content: center;
  }
  
  .user-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 0.5rem;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
}
</style> 