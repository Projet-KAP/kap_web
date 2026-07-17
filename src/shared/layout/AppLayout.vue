<template>
  <div class="app-layout">
    <!-- Overlay pour fermer le sidebar -->
    <div 
      v-if="drawerVisible && !isDesktop"
      class="sidebar-overlay" 
      @click="closeDrawer"
    ></div>
    
    <div class="sidebar-container" :class="{ 'sidebar-open': drawerVisible }">
      <div class="sidebar" :class="{ 'sidebar-visible': drawerVisible }">
        <div class="drawer-container">
          <div class="drawer-header">
            <div class="brand-section">
              <div class="brand-logo-wrapper">
                <div class="logo-glow"></div>
                <img
                  :src="clientLogo || defaultLogo"
                  :alt="clientName || 'KAP'"
                  class="brand-logo"
                  @error="(e) => e.target.src = defaultLogo"
                />
              </div>
              <div class="brand-text">
                <span class="brand-title">{{ clientName || 'KAP CONSEIL' }}</span>
                <span class="brand-subtitle">Pilotage Industriel</span>
              </div>
            </div>
            <div class="drawer-header-actions">
              <Button
                v-if="isDesktop"
                type="button"
                @click="toggleSidebarPin"
                icon="pi pi-thumbtack"
                text
                :class="['pin-btn', { active: sidebarPinned }]"
                :aria-label="sidebarPinned ? 'Désépingler la barre latérale' : 'Épingler la barre latérale'"
                v-tooltip.bottom="sidebarPinned ? 'Désépingler la barre latérale' : 'Épingler la barre latérale'"
              />
              <Button
                v-if="!isDesktop || !sidebarPinned"
                type="button"
                @click="closeDrawer"
                icon="pi pi-times"
                text
                class="close-btn"
                aria-label="Fermer la barre latérale"
              />
            </div>
          </div>

          <div class="drawer-content">
            <div class="nav-section">
              <div class="section-title">NAVIGATION</div>
              <ul class="nav-list">
                <li v-if="hasModule('collect')">
                  <router-link
                    to="/collect"
                    class="nav-item"
                    :class="{ active: isActive('collect') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-cloud-upload"></i>
                    <span>Collecte</span>
                  </router-link>
                </li>
                <li v-if="hasModule('mes')">
                  <router-link 
                    to="/mes" 
                    class="nav-item"
                    :class="{ active: isActive('mes') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-cog"></i>
                    <span>MES</span>
                  </router-link>
                </li>
                <li v-if="hasModule('machines')">
                  <router-link
                    to="/engins"
                    class="nav-item"
                    :class="{ active: isActive('engins') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-truck"></i>
                    <span>Engins</span>
                  </router-link>
                </li>
                <li v-if="hasModule('workplaces')">
                  <router-link 
                    to="/workplaces" 
                    class="nav-item"
                    :class="{ active: isActive('workplaces') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-sitemap"></i>
                    <span>Postes de charge</span>
                  </router-link>
                </li>
                <li v-if="hasModule('documents')">
                  <router-link 
                    to="/documents" 
                    class="nav-item"
                    :class="{ active: isActive('documents') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-file-edit"></i>
                    <span>Documents</span>
                  </router-link>
                </li>
                <li v-if="hasModule('mediatheque')">
                  <router-link 
                    to="/mediatheque" 
                    class="nav-item"
                    :class="{ active: isActive('mediatheque') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-images"></i>
                    <span>Médiathèque</span>
                  </router-link>
                </li>
                <li v-if="hasModule('roi')">
                  <router-link
                    to="/roi"
                    class="nav-item"
                    :class="{ active: isActive('roi') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-calculator"></i>
                    <span>Calculateur ROI</span>
                  </router-link>
                </li>
                <li v-if="hasModule('column_tags')">
                  <router-link
                    to="/tags"
                    class="nav-item"
                    :class="{ active: isActive('tags') || isActive('column-tags') || isActive('mapping-templates') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-tags"></i>
                    <span>Indicateurs & Tags</span>
                  </router-link>
                </li>
                <li v-if="hasModule('stock')">
                  <router-link
                    to="/production/materiaux"
                    class="nav-item"
                    :class="{ active: isActive('materiaux') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-box"></i>
                    <span>Matériaux & Stock</span>
                  </router-link>
                </li>
              </ul>
            </div>

            <div class="nav-section" v-if="hasModule('dashboard') || hasModule('mes') || hasModule('collect') || hasModule('machines')">
              <div class="section-title">ANALYTIQUES</div>
              <ul class="nav-list">
                <li v-if="hasModule('dashboard')">
                  <router-link
                    to="/dashboard"
                    class="nav-item"
                    :class="{ active: isActive('dashboard') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-th-large"></i>
                    <span>Tableau de bord</span>
                  </router-link>
                </li>
                <li v-if="hasModule('analytics')">
                  <router-link
                    to="/analytics"
                    class="nav-item"
                    :class="{ active: isActive('analytics') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-sliders-h"></i>
                    <span>Studio</span>
                  </router-link>
                </li>
              </ul>
            </div>

            <div class="nav-section" v-if="hasModule('projets') || hasModule('production_terrassement') || hasModule('production_beton') || hasModule('transport') || hasModule('comptabilite') || hasModule('planning')">
              <div class="section-title">CHANTIERS & PRODUCTION</div>
              <ul class="nav-list">
                <!-- Point d'entrée principal : Liste des chantiers -->
                <li v-if="hasModule('projets')">
                  <router-link
                    to="/projets"
                    class="nav-item"
                    :class="{ active: isActive('projets') }"
                    @click="closeDrawer"
                    v-tooltip.right="'Créer et gérer vos chantiers'"
                  >
                    <i class="pi pi-building"></i>
                    <span>Mes Chantiers</span>
                  </router-link>
                </li>

                <!-- Sous-section Production -->
                <li class="nav-subsection" v-if="hasModule('production_terrassement') || hasModule('production_beton') || hasModule('transport')">
                  <div class="subsection-header" @click="toggleProductionMenu">
                    <i class="pi pi-chart-line"></i>
                    <span>Suivi Production</span>
                    <i :class="['chevron', 'pi', productionMenuOpen ? 'pi-chevron-down' : 'pi-chevron-right']"></i>
                  </div>
                  <ul class="nav-sublist" v-show="productionMenuOpen">
                    <li v-if="hasModule('production_terrassement')">
                      <router-link
                        to="/production/terrassement"
                        class="nav-item nav-subitem"
                        :class="{ active: isActive('terrassement') }"
                        @click="closeDrawer"
                        v-tooltip.right="'Volumes déblai/remblai et heures engin'"
                      >
                        <i class="pi pi-chart-bar"></i>
                        <span>Terrassement</span>
                      </router-link>
                    </li>
                    <li v-if="hasModule('production_beton')">
                      <router-link
                        to="/production/beton"
                        class="nav-item nav-subitem"
                        :class="{ active: isActive('beton') }"
                        @click="closeDrawer"
                        v-tooltip.right="'Coulages, résistances et conformité'"
                      >
                        <i class="pi pi-box"></i>
                        <span>Béton</span>
                      </router-link>
                    </li>
                    <li v-if="hasModule('transport')">
                      <router-link
                        to="/production/transport"
                        class="nav-item nav-subitem"
                        :class="{ active: isActive('transport') }"
                        @click="closeDrawer"
                        v-tooltip.right="'Voyages, volumes et flotte camions'"
                      >
                        <i class="pi pi-truck"></i>
                        <span>Transport</span>
                      </router-link>
                    </li>
                  </ul>
                </li>

                <!-- Suivi Financier -->
                <li v-if="hasModule('comptabilite')">
                  <router-link
                    to="/production/financier"
                    class="nav-item"
                    :class="{ active: isActive('financier') }"
                    @click="closeDrawer"
                    v-tooltip.right="'Factures, dépenses et marge par chantier'"
                  >
                    <i class="pi pi-wallet"></i>
                    <span>Suivi Financier</span>
                  </router-link>
                </li>

                <!-- Suivi Planning -->
                <li v-if="hasModule('planning')">
                  <router-link
                    to="/production/planning"
                    class="nav-item"
                    :class="{ active: isActive('planning') }"
                    @click="closeDrawer"
                    v-tooltip.right="'Planification et suivi des activités'"
                  >
                    <i class="pi pi-calendar"></i>
                    <span>Suivi Planning</span>
                  </router-link>
                </li>
              </ul>
            </div>

            <div class="nav-section" v-if="hasModule('teams') || hasModule('performance') || hasModule('pointage') || hasModule('tasks')">
              <div class="section-title">ÉQUIPES & PERFORMANCE</div>
              <ul class="nav-list">
                <li v-if="hasModule('tasks')">
                  <router-link
                    to="/mes-taches"
                    class="nav-item"
                    :class="{ active: isActive('mes-taches') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-check-square"></i>
                    <span>Mes Tâches</span>
                  </router-link>
                </li>
                <li v-if="hasModule('pointage')">
                  <router-link
                    to="/pointage"
                    class="nav-item"
                    :class="{ active: isActive('pointage') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-clock"></i>
                    <span>Pointage Personnel</span>
                  </router-link>
                </li>
                <li v-if="hasModule('teams')">
                  <router-link
                    to="/teams"
                    class="nav-item"
                    :class="{ active: isActive('teams') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-users"></i>
                    <span>Gestion Équipes</span>
                  </router-link>
                </li>
                <li v-if="hasModule('performance')">
                  <router-link
                    to="/team-performance"
                    class="nav-item"
                    :class="{ active: isActive('team-performance') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-chart-bar"></i>
                    <span>Performance Équipes</span>
                  </router-link>
                </li>
              </ul>
            </div>

            <div class="nav-section" v-if="hasModule('admin_users') || hasModule('admin_sites') || hasModule('admin_clients')">
              <div class="section-title">CONFIGURATION</div>
              <ul class="nav-list">
                <li v-if="hasModule('admin_users')">
                  <router-link
                    to="/users"
                    class="nav-item"
                    :class="{ active: isActive('users') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-user"></i>
                    <span>Utilisateurs</span>
                  </router-link>
                </li>
                <li v-if="hasModule('admin_sites')">
                  <router-link
                    to="/admin/sites"
                    class="nav-item"
                    :class="{ active: isActive('admin/sites') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-building"></i>
                    <span>Sites</span>
                  </router-link>
                </li>
                <li v-if="hasModule('admin_clients')">
                  <router-link
                    to="/admin/clients"
                    class="nav-item"
                    :class="{ active: isActive('admin/clients') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-briefcase"></i>
                    <span>Clients</span>
                  </router-link>
                </li>
                <li v-if="hasModule('configuration') || hasModule('admin_clients') || hasModule('admin_sites')">
                  <router-link
                    to="/configuration/seuils"
                    class="nav-item"
                    :class="{ active: isActive('seuils') }"
                    @click="closeDrawer"
                  >
                    <i class="pi pi-sliders-h"></i>
                    <span>Seuils d'alerte</span>
                  </router-link>
                </li>
              </ul>
            </div>
          </div>

          <div class="drawer-footer">
            <div class="user-section">
              <Avatar 
                :label="getUserInitials()" 
                class="user-avatar"
                shape="circle"
                size="large"
                :style="{ backgroundColor: '#7AC943' }"
              />
              <div class="user-info">
                <span class="user-name">{{ currentUser?.first_name || currentUser?.username || 'Utilisateur' }}</span>
                <span class="user-role">{{ getUserRoleDisplay() }}</span>
              </div>
            </div>
            <Button 
              @click="logout"
              icon="pi pi-sign-out"
              text
              severity="danger"
              class="logout-btn"
              label="Déconnexion"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="main-layout" :class="{ 'content-shifted': drawerVisible && isDesktop }">
      <header class="app-header">
        <div class="header-left">
          <Button 
            v-show="!drawerVisible"
            icon="pi pi-bars" 
            @click="toggleDrawer" 
            text
            class="menu-btn"
          />
        </div>

        <div class="header-center">
          <div class="search-container" @click="openSearchDrawer">
            <div class="search-wrapper">
              <i class="pi pi-search search-icon"></i>
              <span class="search-placeholder">Rechercher...</span>
              <kbd class="search-kbd">Ctrl K</kbd>
            </div>
          </div>
        </div>

        <div class="header-right">
          <MqttStatusIndicator />

          <Button
            text
            rounded
            class="support-btn"
            @click="openSupportModal"
            aria-label="Contacter le support"
          >
            <img src="/support.png" alt="Support" class="support-btn-icon">
          </Button>

          <div class="notification-wrapper">
            <OverlayBadge
              v-if="notificationCount > 0"
              :value="notificationCount"
              severity="danger"
              class="notification-badge"
            >
              <Button
                icon="pi pi-bell"
                text
                rounded
                class="notification-btn"
                @click="openNotificationsDrawer"
              />
            </OverlayBadge>
            <Button
              v-else
              icon="pi pi-bell"
              text
              rounded
              class="notification-btn"
              @click="openNotificationsDrawer"
            />
          </div>

          <div class="user-section" @click="toggleUserMenu">
            <Avatar 
              :label="getUserInitials()" 
              class="user-avatar"
              shape="circle"
              size="large"
              :style="{ backgroundColor: '#7AC943' }"
            />
            <span class="user-name">{{ currentUser?.first_name || 'Admin' }}</span>
            <i class="pi pi-chevron-down chevron-icon"></i>
          </div>

          <!-- Menu utilisateur dropdown -->
          <div class="user-dropdown" :class="{ open: userMenuOpen }">
            <div class="user-dropdown-header">
              <Avatar 
                :label="getUserInitials()" 
                class="dropdown-avatar"
                shape="circle"
                size="large"
                :style="{ backgroundColor: '#7AC943' }"
              />
              <div class="user-info">
                <div class="user-name">{{ currentUser?.first_name || 'Admin' }} {{ currentUser?.last_name || '' }}</div>
                <div class="user-email">{{ currentUser?.email_address || currentUser?.email || 'Utilisateur' }}</div>
              </div>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <div class="dropdown-menu">
              <div class="dropdown-item" @click="navigateToProfile">
                <div class="dropdown-icon primary">
                  <i class="pi pi-user"></i>
                </div>
                <span>Mon profil</span>
              </div>
              
              <div class="dropdown-item logout" @click="logout">
                <div class="dropdown-icon danger">
                  <i class="pi pi-sign-out"></i>
                </div>
                <span>Déconnexion</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="main-content">
        <router-view />
      </main>
    </div>

    <!-- Search Drawer -->
    <SearchDrawer v-model="searchDrawerVisible" />

    <!-- Notifications Drawer -->
    <NotificationsDrawer
      v-model="notificationsDrawerVisible"
    />

    <Toast position="top-right" />

    <SupportRequestModal
      v-model="supportModalVisible"
    />

    <!-- AI Recommendations - Global (masqué dans les modules Chantiers & Production qui ont leur propre assistant) -->
    <AIRecommendations
      v-if="!isInProductionModule"
      context-type="GENERAL"
      :auto-start="true"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { useNavigationStore } from '@/shared/stores/navigationStore'
import { useNotificationsStore } from '@/stores/notificationsStore.js'
import SearchDrawer from '@/shared/components/SearchDrawer.vue'
import NotificationsDrawer from '@/shared/components/NotificationsDrawer.vue'
import MqttStatusIndicator from '@/shared/components/MqttStatusIndicator.vue'
import Toast from 'primevue/toast'
import SupportRequestModal from '@/shared/components/SupportRequestModal.vue'
import AIRecommendations from '@/shared/components/AIRecommendations.vue'
import defaultLogoSrc from '@/assets/logo_kap.png'


const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const navigationStore = useNavigationStore()
const notificationsStore = useNotificationsStore()

const drawerVisible = ref(false)
const sidebarPinned = ref(false)
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 0)
const searchQuery = ref('')
const userMenuOpen = ref(false)
const op = ref()
const searchDrawerVisible = ref(false)
const notificationsDrawerVisible = ref(false)
const supportModalVisible = ref(false)
const productionMenuOpen = ref(true) // Sous-menu production ouvert par défaut
const { unreadCount: notificationCount } = storeToRefs(notificationsStore)

const currentUser = computed(() => authStore.getCurrentUser)

// Logo et nom du client dynamiques
const defaultLogo = defaultLogoSrc
const clientLogo = computed(() => {
  const user = currentUser.value
  // UserDetailSerializer retourne client comme objet complet avec logo_url
  if (user?.client?.logo_url) {
    return user.client.logo_url
  }
  // Fallback pour client_data (UserSerializer)
  if (user?.client_data?.logo_url) {
    return user.client_data.logo_url
  }
  return null
})

const clientName = computed(() => {
  const user = currentUser.value
  // Priorite: client.name (objet complet) > client_name (string) > client_data.name
  const name = user?.client?.name || user?.client_name || user?.client_data?.name
  if (name) {
    // Nettoyer le nom: enlever "Default" si present
    let cleanName = name
    if (cleanName.toLowerCase().includes('default')) {
      cleanName = cleanName.replace(/\s*default\s*/gi, '').trim()
    }
    return cleanName || 'KAP'
  }
  return null
})

// Masquer l'assistant global quand on est dans les modules Chantiers & Production
// car ces modules ont leur propre assistant IA spécialisé
const isInProductionModule = computed(() => {
  const path = route.path
  return path.startsWith('/production') || path.startsWith('/projets')
})

const loadNotificationCount = async () => {
  await notificationsStore.loadNotifications()
}

const isDesktop = computed(() => {
  return viewportWidth.value >= 1200
})

onMounted(() => {
  loadNotificationCount()
  // Rafraîchir les informations utilisateur (logo, etc.)
  authStore.refreshUser()

  sidebarPinned.value = window.localStorage.getItem('kap-sidebar-pinned') === 'true'
  if (isDesktop.value && sidebarPinned.value) {
    drawerVisible.value = true
  }

  const handleResize = () => {
    viewportWidth.value = window.innerWidth
    if (!isDesktop.value && drawerVisible.value) {
      drawerVisible.value = false
    } else if (isDesktop.value && sidebarPinned.value) {
      drawerVisible.value = true
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

// Surveiller les changements de route pour mettre à jour la navigation active
watch(() => route.path, (newPath) => {
  if (newPath) {
    // Extraire la section de l'URL
    const pathSegments = newPath.split('/').filter(Boolean)
    const mainSection = pathSegments[0] || 'dashboard'

    // Gérer les cas spéciaux
    if (newPath.startsWith('/user/collect')) {
      navigationStore.setActiveSection('collect')
    } else if (newPath.startsWith('/admin/sites')) {
      navigationStore.setActiveSection('admin/sites')
    } else if (newPath.startsWith('/admin/clients')) {
      navigationStore.setActiveSection('admin/clients')
    } else if (newPath.startsWith('/team-performance')) {
      navigationStore.setActiveSection('team-performance')
    } else if (newPath.startsWith('/mes-taches')) {
      navigationStore.setActiveSection('mes-taches')
    } else if (newPath.includes('/tags') || newPath.includes('/column-tags') || newPath.includes('/mapping-templates')) {
      navigationStore.setActiveSection('tags')
    } else if (newPath.includes('/production/terrassement')) {
      navigationStore.setActiveSection('terrassement')
    } else if (newPath.includes('/production/beton')) {
      navigationStore.setActiveSection('beton')
    } else if (newPath.startsWith('/production/materiaux') || newPath.startsWith('/stock')) {
      navigationStore.setActiveSection('materiaux')
    } else if (newPath.includes('/production/financier')) {
      navigationStore.setActiveSection('financier')
    } else if (newPath.includes('/production/transport')) {
      navigationStore.setActiveSection('transport')
    } else if (newPath.includes('/production/planning')) {
      navigationStore.setActiveSection('planning')
    } else if (newPath.includes('/pointage')) {
      navigationStore.setActiveSection('pointage')
    } else if (newPath.includes('/projets')) {
      navigationStore.setActiveSection('projets')
    } else if (newPath.startsWith('/roi-advanced')) {
      navigationStore.setActiveSection('roi')
    } else if (newPath.startsWith('/obd')) {
      navigationStore.setActiveSection('engins')
    } else if (newPath.startsWith('/sonaged-dashboard')) {
      navigationStore.setActiveSection('dashboard')
    } else if (newPath.includes('/analytics')) {
      navigationStore.setActiveSection('analytics')
    } else {
      // Pour les routes simples, utiliser le premier segment
      navigationStore.setActiveSection(mainSection)
    }
  }
}, { immediate: true })

const isActive = (section) => {
  return navigationStore.activeSection === section
}

const hasModule = (moduleCode) => {
  return authStore.hasModule(moduleCode)
}

const getUserInitials = () => {
  if (currentUser.value && currentUser.value.first_name) {
    return currentUser.value.first_name.charAt(0).toUpperCase()
  }
  if (currentUser.value && currentUser.value.email) {
    return currentUser.value.email.charAt(0).toUpperCase()
  }
  return 'A'
}

const getUserRoleDisplay = () => {
  // Vérifier d'abord si c'est le superadmin
  if (authStore.isSuperAdmin) {
    return 'Super Administrateur'
  }

  // Ensuite, afficher le rôle réel de l'utilisateur
  const role = currentUser.value?.role
  if (role) {
    // Si le rôle a un nom (role_name), l'utiliser
    if (typeof role === 'object' && role.role_name) {
      return role.role_name
    }
    // Si le rôle est une string, l'utiliser
    if (typeof role === 'string') {
      return role
    }
  }

  // Fallback sur les anciens checks
  if (authStore.isSiteAdmin) {
    return `Admin ${currentUser.value?.site?.name || 'Site'}`
  }
  if (authStore.isAdmin) {
    return 'Administrateur'
  }

  if (!role) return 'Utilisateur'
  
  // Formater le rôle pour l'affichage
  const roleDisplayMap = {
    'OPERATEUR': 'Opérateur',
    'SUPERVISEUR': 'Superviseur',
    'MANAGER': 'Manager',
    'MAINTENANCE': 'Maintenance',
    'QUALITE': 'Qualité'
  }
  
  return roleDisplayMap[role.toUpperCase()] || role
}

const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
}

const closeDrawer = () => {
  if (isDesktop.value && sidebarPinned.value) return
  drawerVisible.value = false
}

const toggleSidebarPin = () => {
  sidebarPinned.value = !sidebarPinned.value
  window.localStorage.setItem('kap-sidebar-pinned', String(sidebarPinned.value))
  drawerVisible.value = true
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const toggleProductionMenu = () => {
  productionMenuOpen.value = !productionMenuOpen.value
}

const openSearchDrawer = () => {
  searchDrawerVisible.value = true
}

const openNotificationsDrawer = () => {
  notificationsDrawerVisible.value = true
}

const openSupportModal = () => {
  supportModalVisible.value = true
}

// Raccourci clavier Ctrl+K pour ouvrir la recherche
onMounted(() => {
  const handleKeydown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault()
      openSearchDrawer()
    }
  }

  window.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})

const navigateToProfile = () => {
  userMenuOpen.value = false
  router.push('/profile')
}

const logout = () => {
  userMenuOpen.value = false
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  --header-height: 4rem;
  min-height: 100%;
  background: #f8fafc;
}

@media (max-width: 768px) {
  .app-layout {
    --header-height: 3.5rem;
  }
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 280px;
  max-width: 90vw;
  background: white;
  z-index: 1000;
  transition: transform 0.3s ease-in-out;
  transform: translateX(-100%);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.sidebar-open {
  transform: translateX(0);
}

.sidebar {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
}

.sidebar-visible {
  transform: translateX(0); /* Show drawer */
}

.drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  animation: slideInLeft 0.3s ease-out;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  height: var(--header-height);
  min-height: var(--header-height);
  max-height: var(--header-height);
  box-sizing: border-box;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: brand-slide-in 0.4s ease-out 0.1s both;
}

@keyframes brand-slide-in {
  0% {
    opacity: 0;
    transform: translateX(-15px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

.brand-logo-wrapper {
  position: relative;
  flex-shrink: 0;
}

.logo-glow {
  position: absolute;
  inset: -3px;
  background: linear-gradient(135deg, rgba(122, 201, 67, 0.4) 0%, rgba(11, 43, 60, 0.3) 100%);
  border-radius: 12px;
  filter: blur(6px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.brand-section:hover .logo-glow {
  opacity: 1;
}

.brand-logo {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  object-fit: contain;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  padding: 0.35rem;
  box-shadow:
    0 2px 8px rgba(11, 43, 60, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.brand-section:hover .brand-logo {
  transform: scale(1.05) rotate(2deg);
  box-shadow:
    0 6px 16px rgba(11, 43, 60, 0.15),
    0 2px 6px rgba(122, 201, 67, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(122, 201, 67, 0.4);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.brand-title {
  font-weight: 800;
  color: #0B2B3C;
  font-size: 1rem;
  letter-spacing: -0.03em;
  line-height: 1.1;
  transition: color 0.2s ease;
}

.brand-section:hover .brand-title {
  color: #0a2330;
}

.brand-subtitle {
  font-size: 0.625rem;
  font-weight: 600;
  color: #7AC943;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .brand-logo {
    width: 2.25rem;
    height: 2.25rem;
  }

  .brand-title {
    font-size: 0.9375rem;
  }

  .brand-subtitle {
    font-size: 0.5625rem;
  }
}

.close-btn {
  background: transparent !important;
  color: #64748b !important;
  border: none !important;
  padding: 0.5rem !important;
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
}

.drawer-header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pin-btn {
  background: transparent !important;
  color: #64748b !important;
  border: none !important;
  padding: 0.5rem !important;
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
}

.pin-btn:hover,
.pin-btn.active {
  background: #ecfdf5 !important;
  color: #4f9f2f !important;
}

.pin-btn.active {
  transform: rotate(-35deg);
}

.close-btn:hover {
  background: #f1f5f9 !important;
  color: #ef4444 !important;
  transform: rotate(90deg);
}

.drawer-content {
  flex: 1;
  padding: 1.25rem 0;
  padding-top: 1.5rem;
  animation: fadeInUp 0.4s ease-out 0.1s both;
  overflow-y: auto;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.drawer-content::-webkit-scrollbar {
  width: 6px;
}

.drawer-content::-webkit-scrollbar-track {
  background: transparent;
  margin: 0.5rem 0;
}

.drawer-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.drawer-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@media (max-width: 768px) {
  .drawer-content {
    padding: 1rem 0;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.nav-section {
  margin-bottom: 1.75rem;
  padding-top: 0.75rem;
}

.nav-section:first-of-type {
  padding-top: 0.25rem;
}

.section-title {
  color: #94a3b8;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
  margin-right: 1.5rem;
}

@media (max-width: 768px) {
  .section-title {
    padding: 0 1rem;
  }
  .section-title::after {
    margin-right: 1rem;
  }
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 1rem;
  color: #475569;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  border-radius: 10px;
  margin: 0.25rem 0;
  position: relative;
}

@media (max-width: 768px) {
  .nav-item {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
    border-radius: 8px;
  }
}

.nav-item:hover {
  background: #f1f5f9;
  color: #0B2B3C;
  transform: translateX(4px);
}

.nav-item:hover i {
  color: #7AC943;
  transform: scale(1.1);
}

.nav-item.active {
  background: #0B2B3C;
  color: white;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(11, 43, 60, 0.2);
}

.nav-item.active i {
  color: #7AC943;
}

.nav-item.active:hover {
  transform: translateX(4px);
  box-shadow: 0 6px 16px rgba(11, 43, 60, 0.3);
}

.nav-item i {
  font-size: 1.125rem;
  width: 1.5rem;
  text-align: center;
  transition: all 0.2s ease;
  color: #64748b;
}

.nav-item span {
  z-index: 2;
  position: relative;
}

/* Sous-menu Production */
.nav-subsection {
  margin: 0.25rem 0.5rem;
}

.subsection-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 1rem;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.subsection-header:hover {
  background: #f1f5f9;
  color: #0B2B3C;
  border-color: #cbd5e1;
}

.subsection-header i {
  font-size: 1.125rem;
  width: 1.5rem;
  text-align: center;
  color: #64748b;
  transition: all 0.2s ease;
}

.subsection-header:hover i {
  color: #7AC943;
}

.subsection-header .chevron {
  margin-left: auto;
  font-size: 0.75rem;
  color: #94a3b8;
  transition: transform 0.3s ease;
}

.nav-sublist {
  list-style: none;
  margin: 0.5rem 0 0 0;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.nav-subitem {
  padding: 0.625rem 0.875rem !important;
  font-size: 0.8125rem !important;
  border-radius: 8px !important;
  margin: 0.125rem 0 !important;
}

.nav-subitem:hover {
  background: white !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
}

.nav-subitem.active {
  background: #0B2B3C !important;
  color: white !important;
  box-shadow: 0 2px 6px rgba(11, 43, 60, 0.15) !important;
}

.nav-subitem.active i {
  color: #7AC943 !important;
}

@media (max-width: 768px) {
  .subsection-header {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
  }

  .nav-sublist {
    padding: 0.375rem;
  }

  .nav-subitem {
    padding: 0.5rem 0.625rem !important;
  }
}

.drawer-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
  animation: fadeInDown 0.4s ease-out 0.2s both;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .drawer-footer {
    padding: 1rem;
  }
}

.drawer-footer .user-section {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 0;
  padding: 0.875rem 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.drawer-footer .user-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #7AC943;
}

.drawer-footer .user-avatar {
  border-radius: 10px !important;
  width: 2.75rem !important;
  height: 2.75rem !important;
  font-size: 1.125rem !important;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info .user-name {
  font-weight: 600;
  color: #0B2B3C;
  font-size: 0.9375rem;
  display: block;
  margin-bottom: 0.25rem;
}

.user-role {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
  background: #f1f5f9;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.logout-btn {
  width: 100%;
  justify-content: center;
  background: #fef2f2 !important;
  color: #dc2626 !important;
  border: 1px solid #fecaca !important;
  border-radius: 10px !important;
  padding: 0.875rem !important;
  font-weight: 600 !important;
  transition: all 0.2s ease !important;
  font-size: 0.875rem !important;
}

.logout-btn:hover {
  background: #fee2e2 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

.search-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  cursor: pointer;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 0.75rem 1.25rem;
  transition: all 0.3s ease;
}

.search-wrapper:hover {
  background: white;
  border-color: #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.search-icon {
  color: #6b7280;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.search-placeholder {
  flex: 1;
  color: #9ca3af;
  font-size: 0.9375rem;
  font-weight: 400;
}

.search-kbd {
  display: none;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

@media (min-width: 768px) {
  .search-kbd {
    display: flex;
  }
}

.notification-btn {
  background: transparent !important;
  color: #475569 !important;
  border: none !important;
  padding: 0.5rem !important;
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
  position: relative !important;
}

.notification-btn:hover {
  background: #f1f5f9 !important;
  color: #059669 !important;
  transform: scale(1.05);
}

.support-btn {
  background: linear-gradient(135deg, rgba(122, 201, 67, 0.14) 0%, rgba(11, 43, 60, 0.06) 100%) !important;
  border: 1px solid rgba(122, 201, 67, 0.22) !important;
  padding: 0.45rem !important;
  border-radius: 0.75rem !important;
  transition: all 0.2s ease !important;
}

.support-btn:hover {
  transform: translateY(-1px) scale(1.03);
  background: linear-gradient(135deg, rgba(122, 201, 67, 0.24) 0%, rgba(11, 43, 60, 0.1) 100%) !important;
  box-shadow: 0 10px 18px rgba(11, 43, 60, 0.12);
}

.support-btn-icon {
  width: 1.2rem;
  height: 1.2rem;
  display: block;
  object-fit: contain;
}

.notification-wrapper {
  position: relative;
  cursor: pointer;
}
  
.notification-btn {
  border-radius: 6px;
}
  
  .notification-badge :deep(.p-badge) {
    position: absolute;
    top: -8px;
    right: -8px;
    font-size: 0.6875rem;
    min-width: 1.25rem;
    height: 1.25rem;
    line-height: 1.25rem;
    border-radius: 12px;
    font-weight: 700;
    background: #ef4444 !important;
    color: white !important;
    border: 2px solid white !important;
    box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1002;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
  
.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
  
  .notifications-card {
    width: 420px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }
  
  .notifications-header {
    padding: 1.25rem 1.5rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    background: #f8fafc;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .notifications-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: -0.025em;
  }
  
  .notifications-header :deep(.p-badge) {
    background: #ef4444 !important;
    color: white !important;
    border-radius: 10px !important;
    font-size: 0.75rem !important;
    font-weight: 700 !important;
    padding: 0.25rem 0.5rem !important;
    min-width: auto !important;
    height: auto !important;
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3) !important;
  }
  
  .notifications-content {
    max-height: 320px;
    overflow-y: auto;
    padding: 0.5rem 0;
  }
  
  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 0.875rem;
    padding: 1rem 1.5rem;
    transition: all 0.2s ease;
    cursor: pointer;
    border-left: 3px solid transparent;
    position: relative;
  }
  
  .notification-item:hover {
    background: #f8fafc;
    border-left-color: #059669;
    transform: translateX(2px);
  }
  
  .notification-item.unread {
    background: #fef7ff;
    border-left-color: #3b82f6;
  }
  
  .notification-item.unread:hover {
    background: #f3e8ff;
    border-left-color: #3b82f6;
  }
  
  .notification-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.125rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .notification-icon.success {
    background: #d1fae5;
    color: #059669;
  }
  
  .notification-icon.warning {
    background: #fef3c7;
    color: #d97706;
  }
  
  .notification-icon.info {
    background: #dbeafe;
    color: #2563eb;
  }
  
  .notification-icon.primary {
    background: #e0e7ff;
    color: #4f46e5;
  }
  
  .notification-text {
    flex: 1;
    min-width: 0;
  }
  
  .notification-title {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
    line-height: 1.3;
  }
  
  .notification-message {
    color: #64748b;
    font-size: 0.8125rem;
    line-height: 1.4;
    margin-bottom: 0.375rem;
  }
  
  .notification-time {
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .notifications-footer {
    padding: 1rem 1.5rem 1.25rem;
    border-top: 1px solid #f1f5f9;
    background: #ffffff;
  }
  
  .view-all-btn {
    width: 100%;
    justify-content: center;
    font-weight: 600;
    color: #059669 !important;
    border: 1px solid #d1fae5 !important;
    background: #ecfdf5 !important;
    border-radius: 10px !important;
    padding: 0.75rem !important;
    transition: all 0.2s ease !important;
  }
  
  .view-all-btn:hover {
    background: #d1fae5 !important;
    border-color: #a7f3d0 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .notifications-content::-webkit-scrollbar {
    width: 4px;
  }
  
  .notifications-content::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
  }
  
  .notifications-content::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
  
  .notifications-content::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  @media (max-width: 575px) {
    .notifications-list {
      max-height: 250px;
    }
  }

  .main-layout {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    margin-left: 0;
    transition: margin-left 0.3s ease-in-out;
    position: relative;
    overflow: visible !important;
  }

  .content-shifted {
    margin-left: 280px;
  }

  @media (min-width: 1200px) {
    .content-shifted {
      margin-left: 280px;
    }
  }

  @media (max-width: 768px) {
    .content-shifted {
      margin-left: 0;
    }
    
    .sidebar-container {
      width: 100vw;
      max-width: 100vw;
    }
  }

  .app-header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 100;
    gap: 1rem;
    height: var(--header-height);
    min-height: var(--header-height);
    max-height: var(--header-height);
    box-sizing: border-box;
    overflow: visible !important;
  }

  .header-left {
    display: flex;
    align-items: center;
  }

  .header-center {
    display: flex;
    align-items: center;
    flex-grow: 1;
    justify-content: center;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
    overflow: visible !important;
  }

  .menu-btn {
    background: transparent !important;
    color: #475569 !important;
    border: none !important;
    padding: 0.5rem !important;
    border-radius: 6px !important;
    transition: all 0.2s ease !important;
  }

  .menu-btn:hover {
    background: #f1f5f9 !important;
    color: #059669 !important;
    transform: scale(1.05);
  }

  .main-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
  }

  .main-content :deep(.page-title),
  .main-content :deep(.page-header h1),
  .main-content :deep(.header-title h1),
  .main-content :deep(.header-text h1) {
    font-weight: 700 !important;
  }

  @media (max-width: 768px) {
    .main-content {
      padding: 1rem;
    }
  }

  .user-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid #e2e8f0;
    width: 280px;
    z-index: 9999 !important;
    overflow: hidden;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s ease-out;
  }

  .user-dropdown.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .user-dropdown-header {
    display: flex;
    align-items: center;
    padding: 1.25rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #f1f5f9;
  }

  .dropdown-avatar {
    margin-right: 1rem;
    width: 48px !important;
    height: 48px !important;
    font-size: 1.25rem !important;
    border-radius: 12px !important;
  }

  .user-info .user-name {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.125rem;
  }

  .user-info .user-email {
    font-size: 0.8125rem;
    color: #64748b;
    font-weight: 500;
  }

  .dropdown-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 0.5rem 1.5rem;
  }

  .dropdown-menu {
    padding: 0.75rem 0.5rem;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem 1rem;
    color: #374151;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    border-radius: 10px;
    cursor: pointer;
    margin: 0.125rem 0;
  }

  .dropdown-item:hover {
    background: #f8fafc;
    color: #059669;
    transform: translateX(4px);
  }

  .dropdown-item.logout {
    color: #dc2626;
  }

  .dropdown-item.logout:hover {
    background: #fef2f2;
    color: #dc2626;
  }

  .dropdown-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 8px;
    font-size: 0.875rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .dropdown-icon.primary {
    background: #e0e7ff;
    color: #4f46e5;
  }

  .dropdown-icon.secondary {
    background: #f1f5f9;
    color: #475569;
  }

  .dropdown-icon.danger {
    background: #fef2f2;
    color: #dc2626;
  }
  
  /* Responsivité - Version simplifiée */
  @media (max-width: 1199px) {
    .sidebar-container {
      width: 100vw;
    }
    
    .main-layout {
      margin-left: 0 !important;
    }
  }
  
  @media (max-width: 768px) {
    .app-header {
      padding: 1rem;
      gap: 1rem;
    }
    
    .header-center {
      display: none;
    }
    
    .header-right {
      gap: 0.5rem;
    }
    
    .user-section {
      gap: 0.5rem;
    }
    
    .user-name {
      display: none;
    }
    
    .chevron-icon {
      display: none;
    }
    
    .notifications-card {
      width: 95vw;
      max-width: 380px;
    }
    
    .user-dropdown {
      width: 260px;
      right: -10px;
    }
    
    .main-content {
      padding: 1rem;
    }
  }
  
  @media (max-width: 480px) {
    .app-header {
      padding: 0.75rem;
    }
    
    .menu-btn {
      padding: 0.5rem !important;
    }
    
    .notification-btn {
      padding: 0.5rem !important;
    }

    .support-btn {
      padding: 0.45rem !important;
    }
    
    .user-avatar {
      width: 2rem !important;
      height: 2rem !important;
      font-size: 0.875rem !important;
    }
    
    .notifications-card {
      width: 100vw;
      border-radius: 0;
      margin: 0 -1rem;
    }
    
    .user-dropdown {
      width: 100vw;
      right: -1rem;
      border-radius: 0;
    }
    
    .main-content {
      padding: 0.75rem;
    }
  }
  
  /* Desktop uniquement */
  @media (min-width: 1200px) {
    .sidebar-overlay {
      display: none;
    }
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .user-section:hover {
    background-color: #f1f5f9;
    border-color: #e2e8f0;
  }

  .user-section .user-avatar {
    background: #7AC943 !important;
    color: white !important;
    font-weight: 600;
    border-radius: 6px !important;
    transition: transform 0.2s ease;
    width: 2.5rem !important;
    height: 2.5rem !important;
    font-size: 1rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .user-section .user-avatar:hover {
    transform: scale(1.05);
  }

  .user-section .user-name {
    color: #0f172a;
    font-weight: 600;
    font-size: 0.875rem;
    line-height: 1.2;
  }

  .chevron-icon {
    color: #64748b;
    font-size: 0.75rem;
    transition: transform 0.3s ease;
  }
</style>
