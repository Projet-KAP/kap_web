import { createRouter, createWebHistory } from 'vue-router'
import { LoginView } from '@/features/auth'
import { DashboardView, CollectView, MESView, EnginsView, UsersView, ProfileView, MesTaches } from '@/features/user'
import ModularDashboard from '@/features/dashboard/views/ModularDashboard.vue'
import CollectDetail from '@/features/collect/views/CollectDetail.vue'
import { DynamicDocuments } from '@/features/documents'
import Sites from '@/features/admin/views/Sites.vue'
import Clients from '@/features/admin/views/Clients.vue'
import Workplaces from '@/features/admin/views/Workplaces.vue'
import Mediatheque from '@/features/admin/views/Mediatheque.vue'
import PopulateClient from '@/features/admin/views/PopulateClient.vue'
// Configuration
import { SeuilsConfiguration } from '@/features/configuration'

// Production - Interface generique IA
import ProductionHub from '@/features/production/views/ProductionHub.vue'
import DynamicProductionDashboard from '@/features/production/views/DynamicProductionDashboard.vue'
import Teams from '@/features/teams/views/Teams.vue'
import TeamPerformance from '@/features/teams/views/TeamPerformance.vue'
import PointageDashboard from '@/features/pointage/views/PointageDashboard.vue'
import { ROIView } from '@/features/roi'
import ROIAdvancedDashboard from '@/features/roi/views/ROIAdvancedDashboard.vue'
import Stock from '@/features/stock/views/Stock.vue'
import StockDashboard from '@/features/stock/views/StockDashboard.vue'
import ArticlesList from '@/features/stock/views/ArticlesList.vue'
import ProjetDashboard from '@/features/projets/views/ProjetDashboard.vue'
import DashboardBuilder from '@/features/analytics/views/DashboardBuilder.vue'
import { AppLayout } from '@/shared'

// Auth pages
import ForgotPassword from '@/features/auth/views/ForgotPassword.vue'
import SetupPassword from '@/features/auth/views/SetupPassword.vue'
import OtpSetup from '@/features/auth/views/OtpSetup.vue'
import OtpVerify from '@/features/auth/views/OtpVerify.vue'
import ChangePassword from '@/features/auth/views/ChangePassword.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPassword
    },
    {
      path: '/setup-password',
      name: 'setup-password',
      component: SetupPassword
    },
    {
      path: '/otp-setup',
      name: 'otp-setup',
      component: OtpSetup
    },
    {
      path: '/otp-verify',
      name: 'otp-verify',
      component: OtpVerify
    },
    {
      path: '/home',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: ModularDashboard
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/collect',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'collect',
          component: CollectView
        },
        {
          path: ':id',
          name: 'collect-detail',
          component: CollectDetail,
          props: true
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/user/collect',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'user-collect',
          component: CollectView
        },
        {
          path: ':id',
          name: 'user-collect-detail',
          component: CollectDetail,
          props: true
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/mes',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'mes',
          component: MESView
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/engins',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'engins',
          component: EnginsView
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/obd',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'obd',
          component: () => import('@/features/obd/views/OBDSerialView.vue')
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/analytics',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'analytics',
          component: DashboardBuilder
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/workplaces',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'workplaces',
          component: Workplaces
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/documents',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'documents',
          component: DynamicDocuments
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/mes-taches',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'mes-taches',
          component: MesTaches
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/mediatheque/:folderId?',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'mediatheque',
          component: Mediatheque,
          props: true
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/tags',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'tags',
          component: () => import('@/features/mapping/views/TagsView.vue')
        }
      ],
      meta: { requireLogin: true }
    },
    // Routes de compatibilité (redirigent vers /tags)
    {
      path: '/mapping-templates',
      redirect: '/tags'
    },
    {
      path: '/column-tags',
      redirect: '/tags'
    },
    {
      path: '/production',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'production',
          component: ProductionHub
        },
        {
          // Route specifique pour materiaux - utilise StockDashboard (sans IA/rapports)
          path: 'materiaux',
          name: 'production-materiaux',
          component: StockDashboard
        },
        {
          path: ':type',
          name: 'production-type',
          component: DynamicProductionDashboard,
          props: true
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/users',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'users',
          component: UsersView
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/profile',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'profile',
          component: ProfileView
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/change-password',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'change-password',
          component: ChangePassword
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/admin/sites',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'admin-sites',
          component: Sites
        }
      ],
      meta: { requireLogin: true, requireAdmin: true }
    },
    {
      path: '/admin/clients',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'admin-clients',
          component: Clients
        }
      ],
      meta: { requireLogin: true, requireAdmin: true }
    },
    {
      path: '/populate',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'populate-client',
          component: PopulateClient
        }
      ],
      meta: { requireLogin: true, requireAdmin: true }
    },
    {
      path: '/configuration/seuils',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'seuils',
          component: SeuilsConfiguration
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/pointage',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'pointage',
          component: PointageDashboard
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/teams',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'teams',
          component: Teams
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/team-performance/:id?',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'team-performance',
          component: TeamPerformance
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/roi',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'roi',
          component: ROIView
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/stock',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'stock',
          component: Stock
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/projets',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'projets',
          component: ProjetDashboard
        }
      ],
      meta: { requireLogin: true }
    },
    // Route spéciale pour materiaux avec sous-route articles
    {
      path: '/production/materiaux/articles',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'materiaux-articles',
          component: ArticlesList
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/roi-advanced',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'roi-advanced',
          component: ROIAdvancedDashboard
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/ai-assistant',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'ai-assistant',
          component: () => import('@/features/ai/views/AIAssistant.vue')
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/sonaged-dashboard',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'sonaged-dashboard',
          component: () => import('@/features/dashboard/views/SonagedDashboard.vue')
        }
      ],
      meta: { requireLogin: true }
    },
    {
      path: '/chart-showcase',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'chart-showcase',
          component: () => import('@/features/analytics/views/ChartShowcase.vue')
        }
      ],
      meta: { requireLogin: true }
    },

  ]
})

router.beforeEach(async (to, from, next) => {
  // Check auth via Keycloak service or localStorage fallback
  let isAuthenticated = false
  try {
    const { isAuthenticated: kcAuth } = await import('@/services/keycloak')
    isAuthenticated = kcAuth()
  } catch (e) { /* ignore */ }

  // Fallback: localStorage (legacy SimpleJWT sessions during migration)
  if (!isAuthenticated) {
    isAuthenticated = JSON.parse(localStorage.getItem('isAuthenticated'))
  }
  
  // Si l'utilisateur n'est pas authentifié et la route nécessite une connexion
  if (to.matched.some((record) => record.meta.requireLogin) && !isAuthenticated) {
    next({ name: 'login', query: { to: to.path } })
    return
  }

  // Si l'utilisateur est authentifié et tente d'accéder à la page de login
  if (to.path === '/login' && isAuthenticated) {
    next('/home')
    return
  }

  // Vérification des droits admin pour les routes protégées
  if (to.matched.some((record) => record.meta.requireAdmin)) {
    // Check Keycloak realm roles first
    let isAdmin = false
    try {
      const { hasRole } = await import('@/services/keycloak')
      isAdmin = hasRole('admin') || hasRole('administrateur') || hasRole('superadmin')
    } catch (e) { /* ignore */ }

    // Fallback: check localStorage user
    if (!isAdmin) {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.is_superuser === true) {
        isAdmin = true
      } else {
        let roleName = null
        if (user.role) {
          if (typeof user.role === 'string') roleName = user.role
          else if (user.role.role_name) roleName = user.role.role_name
          else if (user.role.name) roleName = user.role.name
        } else if (user.role_name) {
          roleName = user.role_name
        }
        isAdmin = roleName && (
          roleName.toLowerCase().includes('admin') ||
          roleName.toLowerCase().includes('administrateur')
        )
      }
    }

    if (!isAdmin) {
      next('/home')
      return
    }
  }

  // Vérification pour les admins de site (accès uniquement à leur site)
  if (to.matched.some((record) => record.meta.requireSiteAdmin)) {
    if (!authStore.isSiteAdmin && !authStore.isGlobalAdmin) {
      next('/home')
      return
    }
  }

  next()
})

export default router
