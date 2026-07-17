<template>
  <Dialog
    :visible="visible"
    modal
    class="user-form-modal"
    :style="{ width: '80rem' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <template #header>
      <div class="modal-header-with-action">
        <span class="modal-title">{{ isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur' }}</span>
      </div>
    </template>
    <div class="form-content">
      <form @submit.prevent="handleSubmit">
        <div class="form-row">
              <div class="form-group">
            <label for="firstName">Prénom *</label>
                <InputText
              id="firstName"
              v-model="form.first_name" 
              placeholder="Prénom"
                  class="form-input"
              :class="{ 'p-invalid': errors.first_name }"
                />
            <small v-if="errors.first_name" class="p-error">{{ errors.first_name }}</small>
              </div>

              <div class="form-group">
            <label for="lastName">Nom *</label>
                <InputText
              id="lastName"
              v-model="form.last_name" 
              placeholder="Nom"
                  class="form-input"
              :class="{ 'p-invalid': errors.last_name }"
                />
            <small v-if="errors.last_name" class="p-error">{{ errors.last_name }}</small>
          </div>
              </div>

        <div class="form-row">
          <div class="form-group">
            <label for="email">Email *</label>
                <InputText
              id="email"
              v-model="form.email_address" 
                  placeholder="email@exemple.com"
                  class="form-input"
              :class="{ 'p-invalid': errors.email_address }"
                />
            <small v-if="errors.email_address" class="p-error">{{ errors.email_address }}</small>
              </div>

              <div class="form-group">
            <label for="phone">Téléphone</label>
                <InputText
              id="phone"
              v-model="form.phone_number" 
              placeholder="Numéro de téléphone"
                  class="form-input"
                />
            </div>
          </div>



        <div class="form-row">
              <div class="form-group">
            <label for="client">Client</label>
                <Select
                  id="client"
              v-model="form.client" 
                  :options="clients"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Sélectionner un client"
              class="form-dropdown"
                  @change="onClientChange"
                />
              </div>

              <div class="form-group">
            <label for="site">Site</label>
                <Select
                  id="site"
              v-model="form.site" 
                  :options="availableSites"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Sélectionner un site"
              class="form-dropdown"
                />
            </div>
          </div>

        <div class="form-row">
              <div class="form-group">
            <label for="role">Rôle</label>
                <Select
                  id="role"
              v-model="form.role" 
              :options="rolesWithLabels" 
                  optionLabel="label"
                  optionValue="id"
                  placeholder="Sélectionner un rôle"
              class="form-dropdown"
                >
                  <template #option="slotProps">
                    <div class="role-option">
                      <span class="role-name">{{ slotProps.option.label }}</span>
                      <span v-if="slotProps.option.description" class="role-description">{{ slotProps.option.description }}</span>
                    </div>
                  </template>
                </Select>
              </div>
          </div>
        <div class="form-row">
          <div class="form-group" style="grid-column: 1 / -1">
            <label>Modules autorisés</label>
            <div class="modules-checkboxes">
              <template v-if="Object.keys(groupedModules).length">
                <div v-for="(mods, category) in groupedModules" :key="category" class="module-category">
                  <div class="module-category-header">
                    <strong>{{ category }}</strong>
                  </div>
                  <div class="module-list">
                    <div v-for="m in mods" :key="m.code" class="module-checkbox">
                      <Checkbox v-model="form.enabled_modules" :value="m.code" />
                      <span class="module-label">{{ m.name }} <small class="muted">({{ m.code }})</small></span>
                    </div>
                  </div>
                </div>
              </template>
              <small v-else class="p-text-muted">Aucun module disponible</small>
            </div>
          </div>
        </div>
      </form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button 
          label="Annuler" 
          text
          @click="handleCancel"
        />
        <Button 
          :label="isEditing ? 'Modifier' : 'Créer'" 
          @click="handleSubmit"
          :loading="loading"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '../../admin/stores/userStore'
import { axiosInstance } from '@/main'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'user-created', 'user-updated'])

const userStore = useUserStore()

// Reactive data
const loading = ref(false)
const errors = ref({})

// Form data
const form = ref({
  first_name: '',
  last_name: '',
  email_address: '',
  phone_number: '',
  client: null,
  site: null,
  role: null,
  enabled_modules: []
})

// Computed
const isEditing = computed(() => !!props.user)

const clients = computed(() => userStore.clients || [])
const sites = computed(() => userStore.sites || [])
// Filtrer les rôles pour exclure SUPER_ADMIN (géré via is_superuser)
const roles = computed(() => {
  const allRoles = userStore.roles || []
  return allRoles.filter(role => {
    const roleName = role.role_name?.toUpperCase()
    return roleName !== 'SUPER_ADMIN' && roleName !== 'SUPERADMIN'
  })
})

// Formater les noms de rôles pour un affichage plus lisible
const formatRoleName = (roleName) => {
  if (!roleName) return ''
  
  // Remplacer les underscores et formater
  const formatted = roleName
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  return formatted
}

// Ajouter des descriptions pour clarifier les rôles
const getRoleDescription = (roleName) => {
  const roleLower = roleName?.toLowerCase() || ''
  
  if (roleLower.includes('admin client')) {
    return 'Administrateur d\'un client spécifique - Gère les utilisateurs et paramètres de son client'
  }
  if (roleLower === 'admin' || roleLower.includes('admin') && !roleLower.includes('client')) {
    return 'Administrateur système - Accès complet aux fonctionnalités'
  }
  if (roleLower.includes('manager')) {
    return 'Manager - Gère les équipes et projets'
  }
  if (roleLower.includes('operateur') || roleLower.includes('operator')) {
    return 'Opérateur - Utilise les fonctionnalités de production'
  }
  if (roleLower.includes('technicien')) {
    return 'Technicien - Maintenance et support technique'
  }
  
  return null
}

// Créer les options de rôles avec labels formatés et descriptions
const rolesWithLabels = computed(() => {
  return roles.value.map(role => ({
    ...role,
    label: formatRoleName(role.role_name),
    description: getRoleDescription(role.role_name)
  }))
})

const availableSites = computed(() => {
  if (!sites.value) return []
  
  // Si un client est sélectionné, filtrer les sites de ce client
  if (form.value.client) {
    return sites.value.filter(site => site.client === form.value.client)
  }
  
  // Sinon, afficher tous les sites avec le nom du client
  return sites.value.map(site => ({
    ...site,
    name: `${site.name} (${site.client_name || 'Client inconnu'})`
  }))
})

// Modules disponibles pour la sélection (checkboxes)
const availableModules = ref([])

// Fallback local list mirroring backend ClientModule.MODULE_CHOICES
const defaultModules = [
  { code: 'dashboard', name: 'Dashboard' },
  { code: 'documents', name: 'Documents & Rapports' },
  { code: 'collect', name: 'Collect' },
  { code: 'mes', name: 'MES (Manufacturing Execution System)' },
  { code: 'production_terrassement', name: 'Production Terrassement' },
  { code: 'production_beton', name: 'Production Béton' },
  { code: 'engins', name: 'Gestion Engins' },
  { code: 'machines', name: 'Machines/Engins (legacy)' },
  { code: 'workplaces', name: 'Postes de charge' },
  { code: 'stock', name: 'Gestion de Stock' },
  { code: 'transport', name: 'Transport & Camions' },
  { code: 'projets', name: 'Gestion Projets' },
  { code: 'planning', name: 'Suivi Planning' },
  { code: 'tasks', name: 'Mes Tâches' },
  { code: 'pointage', name: 'Pointage Personnel' },
  { code: 'teams', name: 'Gestion Équipes' },
  { code: 'performance', name: 'Performance Équipes' },
  { code: 'roi', name: 'ROI Calculator' },
  { code: 'comptabilite', name: "Compte d'Exploitation" },
  { code: 'mediatheque', name: 'Médiathèque' },
  { code: 'column_tags', name: 'Tags & KPI' },
  { code: 'analytics', name: 'Mes Tableaux' },
  { code: 'admin_sites', name: 'Admin Sites' },
  { code: 'admin_clients', name: 'Admin Clients' },
  { code: 'admin_users', name: 'Admin Utilisateurs' },
  { code: 'demo', name: 'Mode Demo (Dashboards par defaut)' },
  { code: 'documents_excel_export', name: 'Export/Import Excel Documents' },
  { code: 'configuration', name: 'Configuration des seuils' }
]

const fetchAvailableModules = async () => {
  try {
    const res = await axiosInstance.get('/core/client-modules/available_modules/')
    const data = Array.isArray(res.data) ? res.data : (res.data.results || [])
    if (!data || !data.length) {
      console.warn('available_modules API returned empty, using fallback list')
      availableModules.value = defaultModules
    } else {
      availableModules.value = data
    }
  } catch (e) {
    console.warn('failed to fetch available_modules, using fallback list', e)
    availableModules.value = defaultModules
  }
}

const _getModuleCategory = (module_code) => {
  const categories = {
    'dashboard': 'Core', 'documents': 'Core',
    'collect': 'Production', 'mes': 'Production',
    'production_terrassement': 'Production', 'production_beton': 'Production',
    'engins': 'Engins & Stock', 'machines': 'Engins & Stock', 'workplaces': 'Engins & Stock', 'stock': 'Engins & Stock', 'transport': 'Engins & Stock',
    'projets': 'Projets & Planning', 'planning': 'Projets & Planning', 'tasks': 'Projets & Planning',
    'pointage': 'RH & Équipes', 'teams': 'RH & Équipes', 'performance': 'RH & Équipes',
    'roi': 'Finances', 'comptabilite': 'Finances',
    'mediatheque': 'Autres', 'column_tags': 'Autres', 'analytics': 'Autres',
    'admin_sites': 'Admin', 'admin_clients': 'Admin', 'admin_users': 'Admin',
    'demo': 'Feature Flags', 'documents_excel_export': 'Feature Flags', 'configuration': 'Feature Flags'
  }
  return categories[module_code] || 'Autre'
}

const groupedModules = computed(() => {
  const groups = {}
  const list = Array.isArray(availableModules.value) ? availableModules.value : []
  list.forEach(m => {
    const code = m.code || m.module_code || m.value || ''
    const name = m.name || m.label || m.display || code
    const category = m.category || _getModuleCategory(code)
    if (!groups[category]) groups[category] = []
    groups[category].push({ code, name })
  })
  return groups
})

// Methods
const resetForm = () => {
  form.value = {
    first_name: '',
    last_name: '',
    email_address: '',
    phone_number: '',
    client: null,
    site: null,
    role: null,
    enabled_modules: []
  }
  errors.value = {}
}

const populateForm = (user) => {
  // Gérer le cas où client/site/role peuvent être des objets ou des IDs
  const getIdOrValue = (field) => {
    if (!field) return null
    return typeof field === 'object' ? field.id : field
  }
  
  form.value = {
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email_address: user.email_address || '',
    phone_number: user.phone_number || '',
    client: getIdOrValue(user.client),
    site: getIdOrValue(user.site),
    role: getIdOrValue(user.role)
  }
  // enabled_modules peut être fourni par le serializer
  form.value.enabled_modules = user.enabled_modules || []
}

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.first_name) {
    errors.value.first_name = 'Le prénom est requis'
  }
  
  if (!form.value.last_name) {
    errors.value.last_name = 'Le nom est requis'
  }
  
  if (!form.value.email_address) {
    errors.value.email_address = 'L\'email est requis'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email_address)) {
    errors.value.email_address = 'Format d\'email invalide'
  }
  
  return Object.keys(errors.value).length === 0
}

const onClientChange = () => {
  form.value.site = null
}


const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const userData = {
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email_address: form.value.email_address,
      phone_number: form.value.phone_number,
      client: form.value.client,
      site: form.value.site,
      role: form.value.role,
      enabled_modules: form.value.enabled_modules
    }
    
    if (!isEditing.value) {
      const result = await userStore.createUser(userData);
      emit('user-created', result)
    } else {
      const result = await userStore.updateUser(props.user.id, userData);
      emit('user-updated', result)
    }
    
    handleCancel()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    if (error.response?.data) {
      errors.value = error.response.data
    }
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  resetForm()
  emit('update:visible', false)
}

// Watchers
watch(() => props.visible, (newVal) => {
  if (newVal && props.user) {
    populateForm(props.user)
  } else if (newVal) {
    resetForm()
  }
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    userStore.getClients(),
    userStore.getSites(),
    userStore.getRoles()
  ])
  await fetchAvailableModules()
})
</script>

<style scoped>
.user-form-modal {
  border-radius: 16px;
}

.modal-header-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 1rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0B2B3C;
}

.generate-btn {
  color: #7AC943 !important;
  font-weight: 500;
}

.generate-btn:hover {
  background-color: rgba(122, 201, 67, 0.1) !important;
}

.form-content {
  padding: 1rem 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #0B2B3C;
  margin-bottom: 0.5rem;
}

.role-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0;
}

.role-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.875rem;
}

.role-description {
  font-size: 0.75rem;
  color: #6c757d;
  line-height: 1.4;
}

.form-input, .form-dropdown, .form-file-upload {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .user-form-modal {
    width: 95% !important;
    margin: 1rem;
  }

  .file-name-compact {
    max-width: 100px;
  }
}
</style> 