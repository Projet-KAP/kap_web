<template>
  <Dialog
    :visible="modelValue"
    @update:visible="$emit('update:modelValue', $event)"
    :header="'Partager : ' + (target?.name || '')"
    modal
    :style="{ width: '35rem' }"
  >
    <div class="share-form">
      <!-- Ajouter un partage -->
      <div class="add-share">
        <div class="share-row">
          <div class="share-type-toggle">
            <SelectButton
              v-model="shareType"
              :options="shareTypeOptions"
              optionLabel="label"
              optionValue="value"
              :allowEmpty="false"
              size="small"
            />
          </div>
        </div>
        <div class="share-row">
          <Select
            v-if="shareType === 'user'"
            v-model="selectedUser"
            :options="users"
            :optionLabel="(u) => u.first_name + ' ' + u.last_name"
            optionValue="id"
            placeholder="Sélectionner un utilisateur"
            class="flex-1"
            :filter="true"
            filterPlaceholder="Rechercher..."
          />
          <Select
            v-else
            v-model="selectedTeam"
            :options="teams"
            optionLabel="name"
            optionValue="id"
            placeholder="Sélectionner une équipe"
            class="flex-1"
            :filter="true"
            filterPlaceholder="Rechercher..."
          />
          <Select
            v-model="selectedPermission"
            :options="permissionOptions"
            optionLabel="label"
            optionValue="value"
            class="permission-select"
          />
          <Button
            icon="pi pi-plus"
            @click="addShare"
            :disabled="!(shareType === 'user' ? selectedUser : selectedTeam)"
            size="small"
          />
        </div>
      </div>

      <!-- Liste des permissions -->
      <div class="permissions-list" v-if="permissions.length">
        <h4>Partage avec</h4>
        <div
          v-for="perm in permissions"
          :key="perm.id"
          class="perm-item"
        >
          <div class="perm-info">
            <i :class="perm.user ? 'pi pi-user' : 'pi pi-users'"></i>
            <span class="perm-name">{{ perm.user_name || perm.team_name }}</span>
          </div>
          <div class="perm-actions">
            <Tag :value="permissionLabel(perm.permission)" :severity="permissionSeverity(perm.permission)" />
            <Button
              icon="pi pi-times"
              text
              rounded
              size="small"
              severity="danger"
              @click="removeShare(perm.id)"
            />
          </div>
        </div>
      </div>

      <div v-else-if="!loadingPerms" class="no-shares">
        <p>Aucun partage. Ajoutez des utilisateurs ou equipes.</p>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useMediathequeStore } from '../../stores/mediathequeStore'
import { axiosInstance } from '@/main'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  target: { type: Object, default: null },
  targetType: { type: String, default: 'folder' } // 'folder' or 'file'
})

const emit = defineEmits(['update:modelValue'])

const store = useMediathequeStore()
const toast = useToast()

const permissions = ref([])
const loadingPerms = ref(false)
const shareType = ref('user')
const selectedUser = ref(null)
const selectedTeam = ref(null)
const selectedPermission = ref('VIEW')
const users = ref([])
const teams = ref([])

const shareTypeOptions = [
  { label: 'Utilisateur', value: 'user' },
  { label: 'Equipe', value: 'team' }
]

const permissionOptions = [
  { label: 'Lecture', value: 'VIEW' },
  { label: 'Modification', value: 'EDIT' },
  { label: 'Admin', value: 'ADMIN' }
]

const permissionLabel = (perm) => {
  const map = { VIEW: 'Lecture', EDIT: 'Modification', ADMIN: 'Admin' }
  return map[perm] || perm
}

const permissionSeverity = (perm) => {
  const map = { VIEW: 'info', EDIT: 'warn', ADMIN: 'danger' }
  return map[perm] || 'secondary'
}

watch(() => props.modelValue, async (val) => {
  if (val && props.target) {
    loadingPerms.value = true
    try {
      const [permsData] = await Promise.all([
        store.fetchPermissions(props.targetType, props.target.id),
        loadUsersAndTeams()
      ])
      permissions.value = permsData
    } catch (err) {
      console.error('Erreur chargement permissions:', err)
    } finally {
      loadingPerms.value = false
    }
  }
})

const loadUsersAndTeams = async () => {
  try {
    const [usersRes, teamsRes] = await Promise.all([
      axiosInstance.get('/accounts/users/'),
      axiosInstance.get('/teams/teams/')
    ])
    users.value = usersRes.data.results || usersRes.data
    teams.value = teamsRes.data.results || teamsRes.data
  } catch (err) {
    console.error('Erreur chargement utilisateurs/equipes:', err)
  }
}

const addShare = async () => {
  const data = { permission: selectedPermission.value }
  if (shareType.value === 'user') {
    data.user = selectedUser.value
  } else {
    data.team = selectedTeam.value
  }

  try {
    const newPerm = await store.addPermission(props.targetType, props.target.id, data)
    permissions.value.push(newPerm)
    selectedUser.value = null
    selectedTeam.value = null
    toast.add({ severity: 'success', summary: 'Partage ajouté', life: 2000 })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err.response?.data?.detail || 'Impossible de partager',
      life: 3000
    })
  }
}

const removeShare = async (permissionId) => {
  try {
    await store.removePermission(props.targetType, props.target.id, permissionId)
    permissions.value = permissions.value.filter(p => p.id !== permissionId)
    toast.add({ severity: 'success', summary: 'Partage supprimé', life: 2000 })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le partage',
      life: 3000
    })
  }
}
</script>

<style scoped>
.share-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.add-share {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.share-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.flex-1 {
  flex: 1;
}

.permission-select {
  width: 140px;
}

.permissions-list h4 {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  margin: 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.perm-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: #f8fafc;
  margin-bottom: 0.35rem;
}

.perm-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.perm-info i {
  color: #64748b;
}

.perm-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: #1e293b;
}

.perm-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.no-shares {
  text-align: center;
  padding: 1rem;
}

.no-shares p {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}
</style>
