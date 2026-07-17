<template>
  <div class="teams-page">
    <Toast />
    <ConfirmDialog />
    
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Gestion des Équipes</h1>
        <p class="page-subtitle">Gérez vos équipes et suivez leurs performances</p>
      </div>
      <div class="header-actions">
        <Button 
          label="Nouvelle équipe" 
          icon="pi pi-plus" 
          @click="openCreateModal"
        />
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon primary">
          <i class="pi pi-users"></i>
        </div>
        <div class="stat-content">
          <span class="stat-label">Total Équipes</span>
          <span class="stat-value">{{ totalTeams }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon success">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-content">
          <span class="stat-label">Équipes Actives</span>
          <span class="stat-value accent">{{ activeTeams.length }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon muted">
          <i class="pi pi-pause-circle"></i>
        </div>
        <div class="stat-content">
          <span class="stat-label">Équipes Inactives</span>
          <span class="stat-value muted">{{ inactiveTeams.length }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon primary">
          <i class="pi pi-building"></i>
        </div>
        <div class="stat-content">
          <span class="stat-label">Départements</span>
          <span class="stat-value">{{ Object.keys(teamsByDepartment).length }}</span>
        </div>
      </div>
    </div>

    <div class="content-card">
      <div class="card-header">
        <div class="header-left">
          <h2>Liste des Équipes</h2>
          <span class="count-badge">{{ filteredTeams.length }} équipe(s)</span>
        </div>
        <div class="header-right">
          <InputText 
            v-model="teamStore.searchQuery" 
            placeholder="Rechercher une équipe..." 
            class="search-input"
          />
          
          <Select 
            v-model="statusFilter" 
            :options="statusOptions" 
            optionLabel="label"
            optionValue="value"
            placeholder="Statut" 
            clearable
          />
          
          <Select 
            v-model="departmentFilter" 
            :options="departmentOptions" 
            optionLabel="label"
            optionValue="value"
            placeholder="Département" 
            clearable
          />
        </div>
      </div>

      <DataTable 
        :value="filteredTeams" 
        :loading="teamStore.loading"
        paginator 
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} équipes"
        stripedRows
        class="teams-table"
      >
        <Column field="name" header="Nom" sortable>
          <template #body="{ data }">
            <div class="team-name-cell">
              <Avatar 
                :label="data.name.charAt(0).toUpperCase()" 
                size="normal"
                shape="circle"
                :style="{ backgroundColor: getTeamColor(data.id), color: 'white' }"
              />
              <span class="team-name">{{ data.name }}</span>
            </div>
          </template>
        </Column>
        
        <Column field="description" header="Description">
          <template #body="{ data }">
            <span class="description-text">{{ data.description || '-' }}</span>
          </template>
        </Column>
        
        <Column field="department" header="Département" sortable>
          <template #body="{ data }">
            <Tag 
              :value="data.department || 'Non assigné'" 
              :severity="data.department ? 'info' : 'secondary'"
            />
          </template>
        </Column>
        
        <Column field="manager" header="Manager">
          <template #body="{ data }">
            <div v-if="data.manager" class="manager-cell">
              <i class="pi pi-user"></i>
              <span>{{ data.manager.first_name }} {{ data.manager.last_name }}</span>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </Column>
        
        <Column field="members_count" header="Membres" sortable>
          <template #body="{ data }">
            <div class="members-count">
              <i class="pi pi-users"></i>
              <span>{{ data.members_count || 0 }}</span>
            </div>
          </template>
        </Column>
        
        <Column field="status" header="Statut" sortable>
          <template #body="{ data }">
            <Tag 
              :value="getStatusLabel(data.status)" 
              :severity="getStatusSeverity(data.status)"
            />
          </template>
        </Column>
        
        <Column header="Actions" style="width: 150px">
          <template #body="{ data }">
            <div class="action-buttons">
              <Button 
                icon="pi pi-eye" 
                @click="viewTeam(data)"
                size="small"
                text
                rounded
                v-tooltip.top="'Voir détails'"
              />
              <Button 
                icon="pi pi-pencil" 
                @click="editTeam(data)"
                size="small"
                text
                rounded
                v-tooltip.top="'Modifier'"
              />
              <Button 
                icon="pi pi-trash" 
                @click="confirmDelete(data)"
                size="small"
                text
                rounded
                severity="danger"
                v-tooltip.top="'Supprimer'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog 
      v-model:visible="showFormModal" 
      :header="selectedTeam ? 'Modifier l\'équipe' : 'Nouvelle équipe'"
      modal 
      :style="{ width: '700px' }"
      class="team-form-modal"
    >
      <form @submit.prevent="saveTeam" class="team-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="team-name" class="form-label">Nom de l'équipe <span class="required">*</span></label>
            <InputText 
              id="team-name"
              v-model="teamForm.name" 
              placeholder="Ex: Équipe Production"
              :class="{ 'p-invalid': errors.name }"
              required
            />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>
          
          <div class="form-group">
            <label for="team-department" class="form-label">Département</label>
            <InputText 
              id="team-department"
              v-model="teamForm.department" 
              placeholder="Ex: Production"
            />
          </div>
          
          <div class="form-group full-width">
            <label for="team-description" class="form-label">Description</label>
            <Textarea 
              id="team-description"
              v-model="teamForm.description" 
              placeholder="Description de l'équipe"
              rows="3"
            />
          </div>
          
          <div class="form-group">
            <label for="team-status" class="form-label">Statut</label>
            <Select 
              id="team-status"
              v-model="teamForm.status" 
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner un statut"
            />
          </div>
          
          <div class="form-group">
            <label for="team-site" class="form-label">Site <span class="required">*</span></label>
            <Select 
              id="team-site"
              v-model="teamForm.site" 
              :options="availableSites"
              optionLabel="name"
              optionValue="id"
              placeholder="Sélectionner un site"
              :class="{ 'p-invalid': errors.site }"
              required
            />
            <small v-if="errors.site" class="p-error">{{ errors.site }}</small>
          </div>
          
          <div class="form-group">
            <label for="team-manager" class="form-label">Manager</label>
            <Select 
              id="team-manager"
              v-model="teamForm.manager_id" 
              :options="availableUsers"
              optionLabel="full_name"
              optionValue="id"
              placeholder="Sélectionner un manager"
              filter
            />
          </div>
          
          <div class="form-group full-width">
            <label for="team-members" class="form-label">Membres de l'équipe</label>
            <MultiSelect 
              id="team-members"
              v-model="teamForm.members" 
              :options="availableUsers"
              optionLabel="full_name"
              optionValue="id"
              placeholder="Sélectionner les membres"
              filter
              display="chip"
            />
            <small class="form-hint">Vous pouvez également ajouter des membres après la création</small>
          </div>
        </div>
        
        <div class="form-actions">
          <Button 
            label="Générer données" 
            icon="pi pi-magic-wand" 
            severity="secondary"
            @click="generateRandomTeamData"
            :loading="generatingData"
            v-if="!selectedTeam"
          />
          <Button 
            label="Annuler" 
            @click="closeFormModal"
            text
            severity="secondary"
          />
          <Button 
            label="Enregistrer" 
            type="submit"
            :loading="teamStore.loading"
          />
        </div>
      </form>
    </Dialog>

    <Dialog 
      v-model:visible="showDetailsModal" 
      :header="selectedTeam?.name"
      modal 
      :style="{ width: '900px' }"
      class="team-details-modal"
    >
      <div v-if="selectedTeam" class="team-details">
        <TabView>
          <TabPanel header="Informations">
            <div class="info-section">
              <div class="info-grid">
                <div class="info-item">
                  <label>Nom</label>
                  <span>{{ selectedTeam.name }}</span>
                </div>
                <div class="info-item">
                  <label>Département</label>
                  <span>{{ selectedTeam.department || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>Statut</label>
                  <Tag 
                    :value="getStatusLabel(selectedTeam.status)" 
                    :severity="getStatusSeverity(selectedTeam.status)"
                  />
                </div>
                <div class="info-item">
                  <label>Manager</label>
                  <span v-if="selectedTeam.manager">
                    {{ selectedTeam.manager.first_name }} {{ selectedTeam.manager.last_name }}
                  </span>
                  <span v-else>-</span>
                </div>
                <div class="info-item full-width">
                  <label>Description</label>
                  <span>{{ selectedTeam.description || '-' }}</span>
                </div>
              </div>
            </div>
          </TabPanel>
          
          <TabPanel :header="`Membres (${teamMembers.length})`">
            <div class="members-section">
              <div class="section-header">
                <Button 
                  label="Ajouter un membre" 
                  icon="pi pi-plus" 
                  @click="showAddMemberModal = true"
                  size="small"
                />
              </div>
              <DataTable :value="teamMembers" class="members-table">
                <Column field="user.first_name" header="Nom">
                  <template #body="{ data }">
                    {{ data.user.first_name }} {{ data.user.last_name }}
                  </template>
                </Column>
                <Column field="user.email_address" header="Email"></Column>
                <Column field="role" header="Rôle">
                  <template #body="{ data }">
                    <Tag :value="data.role" />
                  </template>
                </Column>
                <Column field="joined_at" header="Rejoint le">
                  <template #body="{ data }">
                    <span>{{ formatDate(data.joined_at) }}</span>
                  </template>
                </Column>
                <Column header="Actions">
                  <template #body="{ data }">
                    <Button 
                      icon="pi pi-trash" 
                      @click="removeMember(data.user.id)"
                      size="small"
                      text
                      rounded
                      severity="danger"
                      v-tooltip.top="'Retirer'"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </Dialog>

    <Dialog 
      v-model:visible="showAddMemberModal" 
      header="Ajouter un membre"
      modal 
      :style="{ width: '500px' }"
      class="add-member-modal"
    >
      <div class="add-member-form">
        <div class="form-group">
          <label for="member-user" class="form-label">Utilisateur <span class="required">*</span></label>
          <Select 
            id="member-user"
            v-model="newMember.user_id" 
            :options="availableUsersForTeam"
            optionLabel="full_name"
            optionValue="id"
            placeholder="Sélectionner un utilisateur"
            filter
            :class="{ 'p-invalid': memberErrors.user_id }"
          />
          <small v-if="memberErrors.user_id" class="p-error">{{ memberErrors.user_id }}</small>
        </div>
        
        <div class="form-group">
          <label for="member-role" class="form-label">Rôle</label>
          <Select 
            id="member-role"
            v-model="newMember.role" 
            :options="memberRoles"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner un rôle"
          />
        </div>
        
        <div class="form-actions">
          <Button 
            label="Annuler" 
            @click="closeAddMemberModal"
            text
            severity="secondary"
          />
          <Button 
            label="Ajouter" 
            @click="addMember"
            :loading="teamStore.loading"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTeamStore } from '../stores/teamStore'
import { useUserStore } from '@/features/user/stores/userStore'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const teamStore = useTeamStore()
const userStore = useUserStore()
const toast = useToast()
const confirm = useConfirm()

const showFormModal = ref(false)
const showDetailsModal = ref(false)
const showAddMemberModal = ref(false)
const selectedTeam = ref(null)
const teamMembers = ref([])
const statusFilter = ref(null)
const departmentFilter = ref(null)
const errors = ref({})
const generatingData = ref(false)

const teamForm = ref({
  name: '',
  description: '',
  department: '',
  status: 'ACTIVE',
  manager_id: null,
  members: [],
  site: null
})

const newMember = ref({
  user_id: null,
  role: 'MEMBER'
})

const memberErrors = ref({})

const statusOptions = [
  { label: 'Actif', value: 'ACTIVE' },
  { label: 'Inactif', value: 'INACTIVE' }
]

const memberRoles = [
  { label: 'Membre', value: 'MEMBER' },
  { label: 'Leader', value: 'LEADER' }
]

const totalTeams = computed(() => teamStore.totalTeams)
const activeTeams = computed(() => teamStore.activeTeams)
const inactiveTeams = computed(() => teamStore.inactiveTeams)
const teamsByDepartment = computed(() => teamStore.teamsByDepartment)

const filteredTeams = computed(() => {
  let filtered = teamStore.filteredTeams
  
  if (statusFilter.value) {
    filtered = filtered.filter(team => team.status === statusFilter.value)
  }
  
  if (departmentFilter.value) {
    filtered = filtered.filter(team => team.department === departmentFilter.value)
  }
  
  return filtered
})

const departmentOptions = computed(() => {
  const departments = [...new Set(teamStore.teams.map(team => team.department).filter(Boolean))]
  return departments.map(dept => ({ label: dept, value: dept }))
})

const availableUsers = computed(() => {
  // Filtrer les utilisateurs par client si l'utilisateur connecté a un client
  const currentUserClient = userStore.currentUser?.client
  let users = userStore.users || []
  
  // Si on est en mode édition, inclure aussi les membres de l'équipe sélectionnée
  // pour qu'ils s'affichent même s'ils ne sont pas du même client
  if (selectedTeam.value && teamForm.value.members && teamForm.value.members.length > 0) {
    const memberIds = teamForm.value.members.map(id => typeof id === 'object' ? id.id : id)
    const existingMembers = users.filter(user => memberIds.includes(user.id))
    const otherUsers = users.filter(user => !memberIds.includes(user.id))
    
    // Filtrer les autres utilisateurs par client si nécessaire
    if (currentUserClient) {
      users = [...existingMembers, ...otherUsers.filter(user => user.client === currentUserClient)]
    } else {
      users = [...existingMembers, ...otherUsers]
    }
  } else if (currentUserClient) {
    users = users.filter(user => user.client === currentUserClient)
  }
  
  const mappedUsers = users.map(user => ({
    ...user,
    full_name: `${user.first_name} ${user.last_name}`
  }))
  
  return mappedUsers
})

const availableUsersForTeam = computed(() => {
  if (!selectedTeam.value) {
    return []
  }
  
  // Récupérer l'ID du client de l'équipe
  const teamClientId = selectedTeam.value.client_id
  
  // Filtrer les utilisateurs par le client de l'équipe
  let users = userStore.users || []
  
  if (teamClientId) {
    users = users.filter(user => {
      const userClientId = user.client?.id || user.client_id || user.client
      return userClientId === teamClientId
    })
  }
  
  // Exclure les membres déjà dans l'équipe
  const memberIds = teamMembers.value.map(m => m.user?.id || m.user)
  users = users.filter(user => !memberIds.includes(user.id))
  
  // Mapper avec full_name
  return users.map(user => ({
    ...user,
    full_name: `${user.first_name} ${user.last_name}`
  }))
})

const availableSites = computed(() => {
  // Récupérer les sites depuis le store ou utiliser les sites de l'utilisateur
  return userStore.sites || []
})

onMounted(async () => {
  await initializeData()
})

const initializeData = async () => {
  try {
    await Promise.all([
      teamStore.getTeams(),
      userStore.getUsers(),
      userStore.getSites()
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

const generateRandomTeamData = async () => {
  generatingData.value = true
  
  try {
    // Recharger les équipes pour avoir les données les plus récentes
    await teamStore.getTeams()
    
    // Vérifier que les utilisateurs sont chargés
    if (!availableUsers.value || availableUsers.value.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Aucun utilisateur disponible. Veuillez réessayer.',
        life: 3000
      })
      generatingData.value = false
      return
    }
    // Données d'équipes réalistes
    const teamNames = [
      'Équipe Production A', 'Équipe Production B', 'Équipe Maintenance',
      'Équipe Qualité', 'Équipe Logistique', 'Équipe R&D',
      'Équipe Marketing', 'Équipe Ventes', 'Équipe Support Client',
      'Équipe IT', 'Équipe RH', 'Équipe Finance'
    ]
    
    const departments = [
      'Production', 'Maintenance', 'Qualité', 'Logistique', 
      'R&D', 'Marketing', 'Ventes', 'Support', 'IT', 'RH', 'Finance'
    ]
    
    const descriptions = [
      'Équipe responsable de la production des pièces principales',
      'Équipe de maintenance préventive et corrective',
      'Équipe de contrôle qualité et validation',
      'Équipe de gestion des stocks et expéditions',
      'Équipe de recherche et développement de nouveaux produits',
      'Équipe de communication et promotion des produits',
      'Équipe commerciale et relation client',
      'Équipe de support technique et assistance',
      'Équipe informatique et systèmes',
      'Équipe de gestion des ressources humaines',
      'Équipe de gestion financière et comptable'
    ]
    
    const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE'] // 75% actives, 25% inactives
    
    // Sélectionner des données aléatoires
    const baseTeamName = teamNames[Math.floor(Math.random() * teamNames.length)]
    const department = departments[Math.floor(Math.random() * departments.length)]
    const description = descriptions[Math.floor(Math.random() * descriptions.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    // S'assurer que les équipes sont chargées
    if (!teamStore.teams || teamStore.teams.length === 0) {
      await teamStore.getTeams()
    }
    
    // Générer un nom unique en vérifiant la combinaison nom + site
    let teamName = baseTeamName
    let counter = 1
    const existingTeams = teamStore.teams || []
    const selectedSite = userStore.currentUser?.site || 1
    
    // Vérifier si la combinaison nom + site existe déjà
    while (existingTeams.some(t => 
      t.name.toLowerCase() === teamName.toLowerCase() && t.site === selectedSite
    )) {
      teamName = `${baseTeamName} ${counter}`
      counter++
    }
    
    
    // Sélectionner un manager aléatoire parmi les utilisateurs disponibles
    const availableManagers = availableUsers.value.filter(user => {
      const roleName = user.role_name || ''
      return roleName.toLowerCase().includes('manager') || 
             roleName.toLowerCase().includes('superviseur') ||
             roleName.toLowerCase().includes('chef') ||
             roleName.toLowerCase().includes('admin')
    })
    
    
    const managerId = availableManagers.length > 0 
      ? availableManagers[Math.floor(Math.random() * availableManagers.length)].id 
      : null
    
    
    // Sélectionner 2-4 membres aléatoires
    const availableMembers = availableUsers.value.filter(user => 
      user.id !== managerId && (user.is_active !== false)
    )
    
    const numberOfMembers = Math.floor(Math.random() * 3) + 2 // 2 à 4 membres
    const selectedMembers = availableMembers
      .sort(() => 0.5 - Math.random())
      .slice(0, numberOfMembers)
      .map(member => member.id)
    
    
    // Remplir le formulaire avec les données générées
    teamForm.value = {
      name: teamName,
      description: description,
      department: department,
      status: status,
      manager_id: managerId,
      members: selectedMembers,
      site: selectedSite
    }
    
    
    // Vérification finale d'unicité
    const isUnique = !existingTeams.some(t => 
      t.name.toLowerCase() === teamName.toLowerCase() && t.site === selectedSite
    )
    
    toast.add({
      severity: 'success',
      summary: 'Données générées',
      detail: 'Le formulaire a été rempli avec des données aléatoires',
      life: 3000
    })
    
  } catch (error) {
    console.error('Erreur lors de la génération des données:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la génération des données',
      life: 5000
    })
  } finally {
    generatingData.value = false
  }
}

const openCreateModal = () => {
  resetForm()
  selectedTeam.value = null
  showFormModal.value = true
}

const resetForm = () => {
  teamForm.value = {
    name: '',
    description: '',
    department: '',
    status: 'ACTIVE',
    manager_id: null,
    members: [],
    site: null
  }
  errors.value = {}
}

const validateForm = () => {
  errors.value = {}
  
  if (!teamForm.value.name?.trim()) {
    errors.value.name = 'Le nom est requis'
  }
  
  if (!teamForm.value.site) {
    errors.value.site = 'Le site est obligatoire'
  }
  
  return Object.keys(errors.value).length === 0
}

const saveTeam = async () => {
  if (!validateForm()) return
  
  // Vérification d'unicité avant sauvegarde
  if (!selectedTeam.value) {
    const existingTeams = teamStore.teams || []
    const isDuplicate = existingTeams.some(team => 
      team.name.toLowerCase() === teamForm.value.name.toLowerCase() && 
      team.site === teamForm.value.site
    )
    
    if (isDuplicate) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Une équipe avec ce nom existe déjà sur ce site. Veuillez choisir un autre nom.',
        life: 5000
      })
      return
    }
  }
  
  try {
    let createdTeam
    if (selectedTeam.value) {
      // Mettre à jour l'équipe
      await teamStore.updateTeam(selectedTeam.value.id, teamForm.value)
      
      // Mettre à jour les membres si nécessaire
      if (teamForm.value.members && teamForm.value.members.length > 0) {
        // Récupérer les membres actuels
        const currentMembers = await teamStore.getTeamMembers(selectedTeam.value.id)
        const currentMemberIds = currentMembers.map(m => m.user)
        
        // Ajouter les nouveaux membres
        for (const userId of teamForm.value.members) {
          if (!currentMemberIds.includes(userId)) {
            try {
              await teamStore.addTeamMember(selectedTeam.value.id, userId, 'MEMBER')
            } catch (memberError) {
              // silenced
            }
          }
        }
        
        // Supprimer les membres qui ne sont plus dans la liste
        for (const currentMember of currentMembers) {
          if (!teamForm.value.members.includes(currentMember.user)) {
            try {
              await teamStore.removeTeamMember(selectedTeam.value.id, currentMember.user)
            } catch (memberError) {
              // silenced
            }
          }
        }
      }
      
      // Recharger les équipes pour mettre à jour la liste
      await teamStore.getTeams()
      
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Équipe modifiée avec succès',
        life: 3000
      })
    } else {
      createdTeam = await teamStore.createTeam(teamForm.value)

      // Vérifier que l'équipe a bien été créée avec un ID
      if (!createdTeam || !createdTeam.id) {
        throw new Error('L\'équipe n\'a pas été créée correctement')
      }


      // Petite pause pour s'assurer que l'équipe est bien en base
      await new Promise(resolve => setTimeout(resolve, 500))

      if (teamForm.value.members && teamForm.value.members.length > 0) {
        for (const userId of teamForm.value.members) {
          try {
            await teamStore.addTeamMember(createdTeam.id, userId, 'MEMBER')
          } catch (memberError) {
            // silenced
          }
        }
      }
      
      // Recharger les équipes pour mettre à jour la liste
      await teamStore.getTeams()

      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Équipe créée avec succès',
        life: 3000
      })
    }
    closeFormModal()
  } catch (error) {
    let errorMessage = 'Erreur lors de l\'enregistrement'
    
    if (error.response?.data) {
      const errorData = error.response.data
      
      if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
        errorMessage = errorData.non_field_errors[0]
        if (errorMessage.includes('name, site must make a unique set')) {
          errorMessage = 'Une équipe avec ce nom existe déjà sur ce site. Veuillez choisir un autre nom.'
        }
      } else if (errorData.name && Array.isArray(errorData.name)) {
        errorMessage = errorData.name[0]
      } else if (errorData.message) {
        errorMessage = errorData.message
      }
    }
    
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: errorMessage,
      life: 5000
    })
  }
}

const closeFormModal = () => {
  showFormModal.value = false
  resetForm()
  selectedTeam.value = null
}

const editTeam = async (team) => {
  selectedTeam.value = team
  
  try {
    // Charger les détails complets de l'équipe
    const teamDetails = await teamStore.getTeamById(team.id)
    
    // Charger les membres de l'équipe
    const members = await teamStore.getTeamMembers(team.id)
    
    // S'assurer que les utilisateurs sont chargés
    if (!userStore.users || userStore.users.length === 0) {
      await userStore.getUsers()
    }
    
    // Mettre à jour selectedTeam avec les détails complets
    selectedTeam.value = teamDetails
    
    // Extraire les IDs des membres et s'assurer qu'ils sont dans userStore.users
    const memberUserIds = members.map(member => {
      const userId = member.user?.id || member.user
      // Si l'utilisateur n'est pas dans userStore.users, l'ajouter depuis member.user
      if (userId && member.user && typeof member.user === 'object') {
        const exists = userStore.users.find(u => u.id === userId)
        if (!exists && member.user.first_name) {
          // Ajouter l'utilisateur au store temporairement pour l'affichage
          userStore.users.push({
            id: member.user.id,
            first_name: member.user.first_name,
            last_name: member.user.last_name,
            email_address: member.user.email_address,
            full_name: member.user.full_name || `${member.user.first_name} ${member.user.last_name}`,
            client: teamDetails.client_id
          })
        }
      }
      return userId
    })
    
    teamForm.value = {
      name: teamDetails.name,
      description: teamDetails.description,
      department: teamDetails.department,
      status: teamDetails.status,
      manager_id: teamDetails.manager?.id || null,
      members: memberUserIds,
      site: teamDetails.site
    }
    
    showFormModal.value = true
    
  } catch (error) {
    console.error('Erreur lors du chargement des détails de l\'équipe:', error)
    // Fallback avec les données de base
    teamForm.value = {
      name: team.name,
      description: team.description,
      department: team.department,
      status: team.status,
      manager_id: team.manager?.id || null,
      members: [],
      site: team.site
    }
  }
  
  showFormModal.value = true
}

const viewTeam = async (team) => {
  selectedTeam.value = team
  try {
    teamMembers.value = await teamStore.getTeamMembers(team.id)
    showDetailsModal.value = true
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des détails',
      life: 5000
    })
  }
}


const confirmDelete = (team) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}" ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-text',
    rejectLabel: 'Annuler',
    acceptLabel: 'Supprimer',
    acceptClass: 'p-button-danger',
    accept: () => deleteTeam(team.id)
  })
}

const deleteTeam = async (teamId) => {
  try {
    await teamStore.deleteTeam(teamId)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Équipe supprimée avec succès',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la suppression',
      life: 5000
    })
  }
}

const removeMember = async (userId) => {
  try {
    await teamStore.removeTeamMember(selectedTeam.value.id, userId)
    teamMembers.value = teamMembers.value.filter(member => member.user.id !== userId)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Membre retiré de l\'équipe',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la suppression du membre',
      life: 5000
    })
  }
}


const getStatusLabel = (status) => {
  return statusOptions.find(opt => opt.value === status)?.label || status
}

const getStatusSeverity = (status) => {
  switch (status) {
    case 'ACTIVE': return 'success'
    case 'INACTIVE': return 'warning'
    default: return 'secondary'
  }
}

const getTeamColor = (teamId) => {
  const colors = ['#0B2B3C', '#7AC943', '#0B2B3C', '#7AC943', '#0B2B3C', '#7AC943', '#0B2B3C', '#7AC943']
  return colors[teamId % colors.length]
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR')
}

const addMember = async () => {
  memberErrors.value = {}
  
  if (!newMember.value.user_id) {
    memberErrors.value.user_id = 'Veuillez sélectionner un utilisateur'
    return
  }
  
  try {
    const addedMember = await teamStore.addTeamMember(
      selectedTeam.value.id, 
      newMember.value.user_id, 
      newMember.value.role
    )
    
    teamMembers.value.push(addedMember)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Membre ajouté à l\'équipe',
      life: 3000
    })
    
    closeAddMemberModal()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.error || 'Erreur lors de l\'ajout du membre',
      life: 5000
    })
  }
}

const closeAddMemberModal = () => {
  showAddMemberModal.value = false
  newMember.value = {
    user_id: null,
    role: 'MEMBER'
  }
  memberErrors.value = {}
}
</script>

<style scoped>
.teams-page {
  padding: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem 1.25rem;
}

.header-content h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--kap-blue);
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}

.header-actions :deep(.p-button) {
  background: var(--kap-blue);
  border-color: var(--kap-blue);
}

.header-actions :deep(.p-button:hover) {
  background: #0a2431;
  border-color: #0a2431;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: white;
  border-radius: 6px;
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  border: 1px solid #e5e7eb;
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.primary {
  background: rgba(11, 43, 60, 0.1);
  color: var(--kap-blue);
}

.stat-icon.success {
  background: rgba(122, 201, 67, 0.15);
  color: var(--kap-green);
}

.stat-icon.muted {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

.stat-icon i {
  font-size: 1.125rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--kap-blue);
  line-height: 1;
}

.stat-value.accent {
  color: var(--kap-green);
}

.stat-value.muted {
  color: #9ca3af;
}

.content-card {
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-left h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--kap-blue);
}

.count-badge {
  background: rgba(11, 43, 60, 0.1);
  color: var(--kap-blue);
  padding: 0.25rem 0.625rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  min-width: 250px;
}

.teams-table {
  border: none;
}

.team-name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.team-name {
  font-weight: 500;
  color: var(--kap-blue);
}

.description-text {
  color: #64748b;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.manager-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
}

.manager-cell i {
  font-size: 0.875rem;
}

.members-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.action-buttons .p-button:hover {
  background: var(--kap-green);
  color: white;
}

.action-buttons .p-button:focus {
  box-shadow: none;
}

.action-buttons .p-button[severity="danger"]:hover {
  background: #ef4444;
  color: white;
}

.team-form {
  padding: 1rem 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-weight: 500;
  color: var(--kap-blue);
  font-size: 0.875rem;
}

.required {
  color: #ef4444;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.info-section {
  padding: 1rem 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
}

.info-item span {
  color: var(--kap-blue);
  font-size: 0.875rem;
}

.members-section {
  padding: 1rem 0;
}

.section-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.members-table {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}


.text-muted {
  color: #94a3b8;
}

.add-member-form {
  padding: 1rem 0;
}

.add-member-form .form-group {
  margin-bottom: 1.5rem;
}

.add-member-form .form-actions {
  margin-top: 2rem;
}

.form-hint {
  display: block;
  margin-top: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}

@media (max-width: 768px) {
  .teams-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right {
    width: 100%;
  }

  .search-input {
    width: 100%;
    min-width: auto;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>