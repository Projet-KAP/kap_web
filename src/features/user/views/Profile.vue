<template>
  <div class="profile-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">Mon Profil</h1>
          <p class="page-subtitle">Gérez vos informations personnelles et vos préférences</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="profile-content">
      <!-- Profile Overview Card -->
      <div class="profile-overview">
        <div class="profile-info">
          <h2 class="profile-name">{{ userFullName }}</h2>
          <p class="profile-email">{{ currentUser.email_address }}</p>
          <div class="profile-badges">
            <span class="role-badge" :class="userRoleName.toLowerCase()">
              {{ userRoleName }}
            </span>
            <span class="department-badge" v-if="userDepartment !== 'N/A'">
              {{ userDepartment }}
            </span>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat-item">
            <div class="stat-value">{{ formatDate(currentUser.creation_date) }}</div>
            <div class="stat-label">Membre depuis</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">Maintenant</div>
            <div class="stat-label">Connecté</div>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Personal Information -->
        <div class="info-card">
          <div class="card-header">
            <h3>Informations personnelles</h3>
            <Button 
              :label="editingPersonal ? 'Annuler' : 'Modifier'"
              :icon="editingPersonal ? 'pi pi-times' : 'pi pi-pencil'"
              text
              @click="toggleEditPersonal"
              class="edit-toggle-btn"
            />
          </div>

          <form @submit.prevent="updateProfile" class="form-content">
            <div class="form-grid">
              <div class="form-group">
                <label for="name">Nom complet</label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-user"></i>
                  </InputGroupAddon>
                  <InputText 
                    id="name"
                    v-model="profileForm.name"
                    :disabled="!editingPersonal"
                    placeholder="Prénom Nom"
                    autocomplete="name"
                  />
                </InputGroup>
              </div>

              <div class="form-group">
                <label for="email">Email</label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-envelope"></i>
                  </InputGroupAddon>
                  <InputText 
                    id="email"
                    v-model="profileForm.email"
                    :disabled="!editingPersonal"
                    type="email"
                    placeholder="email@exemple.com"
                    autocomplete="email"
                  />
                </InputGroup>
              </div>

              <div class="form-group span-2">
                <label for="phone">Téléphone</label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-phone"></i>
                  </InputGroupAddon>
                  <InputText 
                    id="phone"
                    v-model="profileForm.phone"
                    :disabled="!editingPersonal"
                    placeholder="+221 77 123 45 67"
                    autocomplete="tel"
                  />
                </InputGroup>
              </div>
            </div>

            <div class="form-actions" v-if="editingPersonal">
              <Button 
                type="submit"
                label="Enregistrer"
                icon="pi pi-check"
                :loading="savingProfile"
                class="save-btn"
              />
            </div>
          </form>
        </div>

        <!-- Changer le mot de passe -->
        <div class="info-card">
          <div class="card-header">
            <h3>Mot de passe</h3>
            <Button 
              :label="editingPassword ? 'Annuler' : 'Changer'"
              :icon="editingPassword ? 'pi pi-times' : 'pi pi-key'"
              text
              @click="toggleEditPassword"
              class="edit-toggle-btn"
            />
          </div>

          <div class="security-info" v-if="!editingPassword">
            <p class="security-message">Vous pouvez modifier votre mot de passe à tout moment.</p>
          </div>

          <form @submit.prevent="updatePassword" class="form-content" v-if="editingPassword">
            <div class="form-grid">
              <div class="form-group span-2">
                <label for="currentPassword">Mot de passe actuel</label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-lock"></i>
                  </InputGroupAddon>
                  <Password 
                    id="currentPassword"
                    v-model="passwordForm.currentPassword"
                    :feedback="false"
                    toggleMask
                    placeholder="Votre mot de passe actuel"
                    autocomplete="current-password"
                  />
                </InputGroup>
              </div>

              <div class="form-group">
                <label for="newPassword">Nouveau mot de passe</label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-key"></i>
                  </InputGroupAddon>
                  <Password 
                    id="newPassword"
                    v-model="passwordForm.newPassword"
                    :feedback="false"
                    toggleMask
                    placeholder="Min. 8 caractères"
                    autocomplete="new-password"
                  />
                </InputGroup>
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirmer le nouveau</label>
                <InputGroup>
                  <InputGroupAddon>
                    <i class="pi pi-check"></i>
                  </InputGroupAddon>
                  <Password 
                    id="confirmPassword"
                    v-model="passwordForm.confirmPassword"
                    :feedback="false"
                    toggleMask
                    placeholder="Répétez le mot de passe"
                    autocomplete="new-password"
                  />
                </InputGroup>
              </div>
            </div>

            <div class="form-actions">
              <Button 
                type="submit"
                label="Mettre à jour"
                icon="pi pi-check"
                :loading="savingPassword"
                class="save-btn"
              />
            </div>
          </form>
        </div>
      </div>
    </div>

    <Toast />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useNavigationStore } from '@/shared'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { useToast } from 'primevue/usetoast'
import { axiosInstance } from '@/main'

const navigationStore = useNavigationStore()
const authStore = useAuthStore()
const toast = useToast()

// Reactive data
const editingPersonal = ref(false)
const editingPassword = ref(false)
const savingProfile = ref(false)
const savingPassword = ref(false)
const loading = ref(true)

const fileInput = ref(null)
const photoPreview = ref(null)
const selectedFile = ref(null)

const currentUser = ref({
  id: null,
  first_name: '',
  last_name: '',
  email_address: '',
  phone_number: '',
  role: null,
  site: null,
  client: null,
  creation_date: null,
  last_login: null
})

// Forms
const profileForm = reactive({
  name: '',
  email: '',
  phone: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Helper functions
const getInitials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long'
  })
}


// Computed
const userFullName = computed(() => {
  if (!currentUser.value) return ''
  return `${currentUser.value.first_name || ''} ${currentUser.value.last_name || ''}`.trim()
})

const userRoleName = computed(() => {
  if (!currentUser.value?.role) return 'Utilisateur'
  const roleName = typeof currentUser.value.role === 'string'
    ? currentUser.value.role
    : currentUser.value.role.role_name || 'Utilisateur'
  // Format: SUPER_ADMIN -> Super Admin
  return roleName
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
})

const userDepartment = computed(() => {
  if (!currentUser.value?.site) return 'N/A'
  if (typeof currentUser.value.site === 'string') return currentUser.value.site
  return currentUser.value.site.name || 'N/A'
})

// Actions
const initializeForm = () => {
  const fullName = userFullName.value
  profileForm.name = fullName || ''
  profileForm.email = currentUser.value.email_address || ''
  profileForm.phone = currentUser.value.phone_number || ''
}

const toggleEditPersonal = () => {
  if (editingPersonal.value) {
    initializeForm()
  }
  editingPersonal.value = !editingPersonal.value
}

const toggleEditPassword = () => {
  if (editingPassword.value) {
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  }
  editingPassword.value = !editingPassword.value
}

const updateProfile = async () => {
  const [firstName, ...lastNameParts] = profileForm.name.trim().split(' ')
  const lastName = lastNameParts.join(' ')
  
  if (!firstName || !profileForm.email) {
    toast.add({
      severity: 'warn',
      summary: 'Champs requis',
      detail: 'Veuillez remplir tous les champs obligatoires',
      life: 3000
    })
    return
  }

  savingProfile.value = true
  try {
    const updateData = {
      first_name: firstName,
      last_name: lastName || firstName,
      phone_number: profileForm.phone
    }
    
    const response = await axiosInstance.patch('/accounts/users/me/', updateData)
    
    currentUser.value = response.data
    
    authStore.setCurrentUser(response.data)
    localStorage.setItem('user', JSON.stringify(response.data))
    
    toast.add({
      severity: 'success',
      summary: 'Profil mis à jour',
      detail: 'Vos informations ont été sauvegardées avec succès',
      life: 3000
    })
    
    editingPersonal.value = false
  } catch (error) {
    console.error('Erreur mise à jour profil:', error)
    const errorMessage = error.response?.data?.detail || error.response?.data?.error || 'Impossible de mettre à jour le profil'
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: errorMessage,
      life: 3000
    })
  } finally {
    savingProfile.value = false
  }
}

const updatePassword = async () => {
  if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    toast.add({
      severity: 'warn',
      summary: 'Champs requis',
      detail: 'Veuillez remplir tous les champs',
      life: 3000
    })
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Les mots de passe ne correspondent pas',
      life: 3000
    })
    return
  }

  if (passwordForm.newPassword.length < 8) {
    toast.add({
      severity: 'error',
      summary: 'Mot de passe trop court',
      detail: 'Le mot de passe doit contenir au moins 8 caractères',
      life: 3000
    })
    return
  }

  savingPassword.value = true
  try {
    await axiosInstance.post('/auth/change-password/', {
      old_password: passwordForm.currentPassword,
      new_password: passwordForm.newPassword
    })
    
    toast.add({
      severity: 'success',
      summary: 'Mot de passe mis à jour',
      detail: 'Votre mot de passe a été modifié avec succès',
      life: 3000
    })
    
    editingPassword.value = false
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    console.error('Erreur changement mot de passe:', error)
    const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Impossible de mettre à jour le mot de passe'
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: errorMessage,
      life: 3000
    })
  } finally {
    savingPassword.value = false
  }
}

// Load user profile
const loadUserProfile = async () => {
  loading.value = true
  try {
    const response = await axiosInstance.get('/accounts/users/me/')
    currentUser.value = response.data
    
    initializeForm()
  } catch (error) {
    console.error('Erreur lors du chargement du profil:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger votre profil',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  navigationStore.setActiveSection('profile')
  await loadUserProfile()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #FFFFFF;
}

/* Page Header */
.page-header {
  background: #FFFFFF;
  border-bottom: 1px solid #f1f5f9;
  padding: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #0B2B3C;
  margin: 0 0 0.5rem 0;
  font-family: 'Inter', sans-serif;
}

.page-subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
  font-weight: 400;
}

/* Main Content */
.profile-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Profile Overview */
.profile-overview {
  background: #0B2B3C;
  color: #FFFFFF;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  position: relative;
  overflow: hidden;
}

.profile-overview::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(122, 201, 67, 0.1), transparent);
  border-radius: 50%;
  transform: translate(50%, -50%);
}

.status-indicator {
  position: absolute;
  bottom: 8px;
  left: 8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #FFFFFF;
}

.status-indicator.online {
  background: #7AC943;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: #FFFFFF;
}

.profile-email {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 0.75rem 0;
}

.profile-badges {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.role-badge, .department-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.role-badge.admin {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.role-badge.manager {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.role-badge.operator {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
}

.department-badge {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.profile-stats {
  display: flex;
  gap: 2rem;
  flex-shrink: 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.info-card {
  background: #FFFFFF;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.info-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.danger-zone {
  border-left: 4px solid #ef4444;
}

.card-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0B2B3C;
  margin: 0;
}

.edit-toggle-btn, .view-all-btn {
  color: #7AC943 !important;
  font-weight: 600 !important;
}

.session-count {
  font-size: 0.875rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.form-content {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.span-2 {
  grid-column: span 2;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.625rem;
  display: block;
}

.form-input {
  width: 100%;
  border: 2px solid #e2e8f0 !important;
  border-radius: 10px !important;
  padding: 0.75rem 1rem !important;
  font-size: 0.9375rem !important;
  transition: all 0.3s ease !important;
  background: #FFFFFF !important;
}

.form-input:hover:not(:disabled) {
  border-color: #cbd5e1 !important;
}

.form-input:focus {
  border-color: #7AC943 !important;
  box-shadow: 0 0 0 4px rgba(122, 201, 67, 0.12) !important;
  outline: none !important;
}

.form-input:disabled {
  background: #f8fafc !important;
  border-color: #f1f5f9 !important;
  color: #94a3b8 !important;
  cursor: not-allowed !important;
}

:deep(.p-inputtext) {
  border: 2px solid #e2e8f0 !important;
  border-radius: 10px !important;
  padding: 0.75rem 1rem !important;
  font-size: 0.9375rem !important;
  transition: all 0.3s ease !important;
}

:deep(.p-inputtext:enabled:hover) {
  border-color: #cbd5e1 !important;
}

:deep(.p-inputtext:enabled:focus) {
  border-color: #7AC943 !important;
  box-shadow: 0 0 0 4px rgba(122, 201, 67, 0.12) !important;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-password .p-inputtext) {
  width: 100%;
  border: 2px solid #e2e8f0 !important;
  border-radius: 10px !important;
  padding: 0.75rem 1rem !important;
  padding-right: 3rem !important;
  font-size: 0.9375rem !important;
}

:deep(.p-password .p-inputtext:enabled:hover) {
  border-color: #cbd5e1 !important;
}

:deep(.p-password .p-inputtext:enabled:focus) {
  border-color: #7AC943 !important;
  box-shadow: 0 0 0 4px rgba(122, 201, 67, 0.12) !important;
}

:deep(.p-inputgroup) {
  width: 100%;
}

:deep(.p-inputgroup-addon) {
  background: #f8fafc !important;
  border: 2px solid #e2e8f0 !important;
  border-right: none !important;
  color: #64748b !important;
  padding: 0.75rem 1rem !important;
  border-radius: 10px 0 0 10px !important;
}

:deep(.p-inputgroup .p-inputtext),
:deep(.p-inputgroup .p-password .p-inputtext) {
  border-left: none !important;
  border-radius: 0 10px 10px 0 !important;
}

:deep(.p-inputgroup:focus-within .p-inputgroup-addon) {
  border-color: #7AC943 !important;
  background: rgba(122, 201, 67, 0.05) !important;
  color: #7AC943 !important;
}

:deep(.p-inputgroup:hover:not(:focus-within) .p-inputgroup-addon) {
  border-color: #cbd5e1 !important;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  background: #7AC943 !important;
  border: none !important;
  color: #FFFFFF !important;
  font-weight: 600 !important;
  padding: 0.875rem 2rem !important;
  border-radius: 10px !important;
  box-shadow: 0 4px 12px rgba(122, 201, 67, 0.25) !important;
  transition: all 0.3s ease !important;
}

.save-btn:hover {
  background: #65a335 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(122, 201, 67, 0.35) !important;
}

/* Security Section */
.security-info {
  padding: 1.5rem;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 10px;
  background: #f8fafc;
  margin-bottom: 1rem;
}

.security-item:last-child {
  margin-bottom: 0;
}

.security-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #7AC943;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.security-content {
  flex: 1;
  min-width: 0;
}

.security-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0B2B3C;
  margin-bottom: 0.25rem;
}

.security-desc {
  font-size: 0.875rem;
  color: #64748b;
}

.config-btn {
  color: #7AC943 !important;
  font-weight: 600 !important;
}

.security-message {
  padding: 1.5rem;
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

/* Activity Section */
.activity-list {
  padding: 1.5rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #FFFFFF;
}

.activity-icon.login {
  background: #3b82f6;
}

.activity-icon.update {
  background: #7AC943;
}

.activity-icon.password {
  background: #f59e0b;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0B2B3C;
  margin-bottom: 0.25rem;
}

.activity-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Sessions Section */
.sessions-list {
  padding: 1.5rem;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.session-item:last-child {
  border-bottom: none;
}

.session-device {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.session-device-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0B2B3C;
}

.session-current {
  background: #dcfce7;
  color: #16a34a;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.session-location, .session-time {
  font-size: 0.875rem;
  color: #64748b;
}

.terminate-btn {
  color: #ef4444 !important;
  background: transparent !important;
  border: 1px solid #ef4444 !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  border-radius: 6px !important;
}

.terminate-btn:hover {
  background: #ef4444 !important;
  color: #FFFFFF !important;
}

/* Preferences Section */
.preferences-content {
  padding: 1.5rem;
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.preference-item:last-child {
  border-bottom: none;
}

.preference-info {
  flex: 1;
  min-width: 0;
  margin-right: 1rem;
}

.preference-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0B2B3C;
  margin-bottom: 0.25rem;
}

.preference-desc {
  font-size: 0.875rem;
  color: #64748b;
}

.language-dropdown {
  min-width: 120px;
}

/* Danger Zone */
.danger-content {
  padding: 1.5rem;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.danger-info {
  flex: 1;
  min-width: 0;
}

.danger-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ef4444;
  margin-bottom: 0.25rem;
}

.danger-desc {
  font-size: 0.875rem;
  color: #64748b;
}

.danger-btn {
  border-color: #ef4444 !important;
  color: #ef4444 !important;
}

.danger-btn:hover {
  background: #ef4444 !important;
  color: #FFFFFF !important;
}

/* Dialog */
.delete-dialog .dialog-content {
  text-align: center;
  padding: 1rem 0;
}

.warning-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
}

.delete-dialog h4 {
  color: #0B2B3C;
  margin: 0 0 0.5rem 0;
}

.delete-dialog p {
  color: #64748b;
  margin: 0 0 1.5rem 0;
}

.confirm-input {
  text-align: left;
}

.confirm-input label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0B2B3C;
  margin-bottom: 0.5rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .profile-content {
    padding: 1.5rem;
  }

  .profile-overview {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
  }

  .profile-stats {
    justify-content: center;
  }

  .content-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.span-2 {
    grid-column: span 1;
  }

  .danger-item, .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .profile-content {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .profile-overview {
    padding: 1.5rem;
  }

  .profile-name {
    font-size: 1.5rem;
  }

  .profile-stats {
    flex-direction: column;
    gap: 1rem;
  }
}
</style> 