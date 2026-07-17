// Layout components
export { default as AppLayout } from './layout/AppLayout.vue'
export { default as AppBar } from './components/AppBar.vue'

// Shared components
export { default as ErrorMessage } from './components/ErrorMessage.vue'
export { default as TableSkeleton } from './components/TableSkeleton.vue'

// Stores
export { useNavigationStore } from './stores/navigationStore.js'

// Utils
export * from './utils'

// Constantes de navigation
export const NAVIGATION_CONSTANTS = {
  DEFAULT_ROUTES: {
    DASHBOARD: '/dashboard',
    COLLECT: '/collect',
    MES: '/mes',
    ENGINS: '/engins'
  },

  MENU_SECTIONS: {
    MAIN: 'main',
    CONFIG: 'config',
    USER: 'user'
  }
}

// Helpers pour la navigation
export const navigationHelpers = {
  getPageTitle: (routeName) => {
    const titles = {
      'dashboard': 'Tableau de bord',
      'collect': 'Collect',
      'mes': 'MES',
      'engins': 'Engins'
    }
    return titles[routeName] || 'KAP CONSEIL'
  },

  getBreadcrumb: (routeName) => {
    const breadcrumbs = {
      'dashboard': ['Accueil', 'Tableau de bord'],
      'collect': ['Modules', 'Collect'],
      'mes': ['Modules', 'MES'],
      'engins': ['Modules', 'Engins']
    }
    return breadcrumbs[routeName] || []
  },

  isValidRoute: (routeName) => {
    const validRoutes = ['dashboard', 'collect', 'mes', 'engins']
    return validRoutes.includes(routeName)
  }
} 