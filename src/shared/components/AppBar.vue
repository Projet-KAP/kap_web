<template>
  <div class="appbar-container">
    <Toolbar class="kap-toolbar">
      <template #start>
        <div class="toolbar-start">
          <!-- Logo et titre KAP -->
          <div class="brand-section">
            <div class="company-logo">
              <img src="@/assets/logo_kap.png" alt="KAP" class="logo" />
            </div>
            <h2 class="company-name">KAP CONSEIL</h2>
          </div>
        </div>
      </template>

      <template #end>
        <div class="toolbar-end">
          <!-- Menu utilisateur -->
          <div class="user-menu-wrapper">
            <Button 
              class="user-menu-btn"
              @click="toggleUserMenu"
              text
            >
              <template #default>
                <div class="user-menu-content">
                  <Avatar 
                    :label="getUserInitials()" 
                    class="user-avatar"
                    shape="circle"
                  />
                  <div class="user-info">
                    <span class="user-name">{{ currentUser?.first_name || 'Admin' }}</span>
                    <span class="user-role">Administrateur</span>
                  </div>
                  <i class="pi pi-chevron-down user-chevron" :class="{ 'rotated': userMenuOpen }"></i>
                </div>
              </template>
            </Button>
            
            <!-- Menu utilisateur intégré -->
            <div v-if="userMenuOpen" class="user-dropdown-menu">
              <button class="menu-item" @click="navigateToProfile">
                <i class="pi pi-user menu-icon"></i>
                <span>Mon profil</span>
              </button>
              
              <button class="menu-item logout-item" @click="logout">
                <i class="pi pi-sign-out menu-icon"></i>
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </Toolbar>

    <!-- Overlay pour fermer le menu en cliquant ailleurs -->
    <div v-if="userMenuOpen" class="menu-overlay" @click="closeUserMenu"></div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth'


const router = useRouter()
const authStore = useAuthStore()

const userMenuOpen = ref(false)

const currentUser = computed(() => authStore.getCurrentUser)

const getUserInitials = () => {
  const user = currentUser.value
  if (user?.first_name) {
    return user.first_name.charAt(0).toUpperCase()
  }
  return 'A'
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const navigateToProfile = () => {
  router.push('/profile')
  userMenuOpen.value = false
}

const logout = async () => {
  await authStore.logout()
  userMenuOpen.value = false
}

const closeUserMenu = () => {
  userMenuOpen.value = false
}

// Fermer le menu lorsqu'on clique ailleurs ou qu'on perd le focus
const handleClickOutside = (event) => {
  const menuBtn = event.target.closest('.user-menu-btn')
  const menuDropdown = event.target.closest('.user-dropdown-menu')

  if (!menuBtn && !menuDropdown && userMenuOpen.value) {
    closeUserMenu()
  }
}

const handleFocusChange = () => {
  // Fermer le menu quand la fenêtre perd le focus
  if (!document.hasFocus() && userMenuOpen.value) {
    closeUserMenu()
  }
}

onMounted(() => {
  // Écouter les clics sur le document
  document.addEventListener('click', handleClickOutside)
  // Écouter les changements de focus
  window.addEventListener('blur', handleFocusChange)
})

onUnmounted(() => {
  // Nettoyer les écouteurs
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('blur', handleFocusChange)
})
</script>

<style scoped>
.appbar-container {
  position: relative;
}

.kap-toolbar {
  background: var(--kap-white);
  border: none;
  border-bottom: 1px solid var(--border-primary);
  box-shadow: var(--shadow-sm);
  padding: 0.75rem 2rem;
  min-height: 4rem;
  margin-left: 4rem;
  transition: margin-left 0.3s ease;
}

.toolbar-start {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.company-logo {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.company-name {
  color: #0B2B3C;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: -0.025em;
}



.toolbar-end {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-menu-wrapper {
  position: relative;
}

.user-menu-btn {
  background: var(--kap-white) !important;
  border: 1px solid var(--border-primary) !important;
  border-radius: 0.75rem !important;
  padding: 0.5rem 0.75rem !important;
  transition: all 0.2s ease !important;
  cursor: pointer !important;
}

.user-menu-btn:hover {
  background: var(--bg-secondary) !important;
  border-color: var(--kap-green) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.user-menu-btn:hover .user-avatar {
  transform: scale(1.05);
}

.user-menu-btn:hover .user-chevron {
  color: var(--kap-green);
  transform: translateY(1px);
}

.user-menu-btn:hover .user-name {
  color: var(--kap-blue);
}

.user-menu-btn:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.user-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 180px;
  background: var(--kap-white);
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-xl);
  padding: 0.5rem;
  z-index: 1050;
  animation: fadeInDown 0.15s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1040;
  background: transparent;
}

.user-menu-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  background: linear-gradient(135deg, var(--kap-green), #6ba83a) !important;
  color: var(--kap-white) !important;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  width: 2.5rem !important;
  height: 2.5rem !important;
  font-size: 1.25rem !important;
  transition: transform 0.2s ease !important;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  text-align: left;
}

.user-name {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.user-role {
  color: var(--text-secondary);
  font-size: 0.6875rem;
  font-weight: 500;
}

.user-chevron {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.user-chevron.rotated {
  transform: rotate(180deg);
}

.user-dropdown-menu .menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.15s ease;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  text-align: left;
  margin-bottom: 2px;
}

.user-dropdown-menu .menu-item:hover {
  background: var(--neutral-50);
}

.user-dropdown-menu .menu-icon {
  font-size: 1rem;
  color: var(--text-secondary);
  width: 16px;
  text-align: center;
}

.user-dropdown-menu .logout-item {
  color: var(--error-color);
}

.user-dropdown-menu .logout-item:hover {
  background: var(--error-bg);
  color: var(--error-color);
}

/* Responsive Design */
@media (max-width: 768px) {
  .kap-toolbar {
    padding: 1rem;
    margin-left: 4rem;
  }
  
  .toolbar-start {
    gap: 1rem;
  }
  
  .brand-section {
    gap: 0.75rem;
  }
  
  .company-logo {
    width: 2rem;
    height: 2rem;
  }
  
  .logo {
    width: 1.25rem;
  }
  
  .company-name {
    font-size: 1.125rem;
  }
  
  .toolbar-end {
    gap: 1rem;
  }
  
  .user-dropdown-menu {
    width: 160px;
  }
}

@media (max-width: 480px) {
  .toolbar-start {
    gap: 0.75rem;
  }
  
  .company-name {
    display: none;
  }
}

/* Personnalisation PrimeVue */
:deep(.p-toolbar) {
  background: transparent;
  border: none;
  padding: 0;
}



:deep(.p-badge) {
  font-size: 0.625rem;
  min-width: 1.125rem;
  height: 1.125rem;
  line-height: 1.125rem;
}
</style> 