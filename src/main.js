import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import VueAxios from 'vue-axios'
import { createPinia } from 'pinia'
import { TableSkeleton } from '@/shared'

// Vue DnD Kit
import VueDndKitPlugin from '@vue-dnd-kit/core'

// PrimeVue
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import fr from 'primelocale/fr.json'


import Tooltip from 'primevue/tooltip'
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Drawer from 'primevue/drawer'
import Menu from 'primevue/menu'
import Toolbar from 'primevue/toolbar'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
import OverlayBadge from 'primevue/overlaybadge'
import Popover from 'primevue/popover'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import DataView from 'primevue/dataview'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import Select from 'primevue/select'
import FileUpload from 'primevue/fileupload'
import Checkbox from 'primevue/checkbox'
import MultiSelect from 'primevue/multiselect'
// OverlayPanel deprecated in PrimeVue v4, using Popover instead
import ConfirmDialog from 'primevue/confirmdialog'
import InputNumber from 'primevue/inputnumber'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import ToggleButton from 'primevue/togglebutton'
import Password from 'primevue/password'
import TreeTable from 'primevue/treetable'
import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'
import Card from 'primevue/card'
import Rating from 'primevue/rating'
import TabView from 'primevue/tabview'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Chart from 'primevue/chart'
import Paginator from 'primevue/paginator'
import Divider from 'primevue/divider'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ScrollPanel from 'primevue/scrollpanel'
import TabMenu from 'primevue/tabmenu'
import ToggleSwitch from 'primevue/toggleswitch'

// Styles
import 'primeicons/primeicons.css'
import '@/assets/styles.scss'

const app = createApp(App)

// Désactiver les logs Pinia en développement
const pinia = createPinia()
pinia._p = []  // Disable devtools

// Sauvegarder les fonctions console originales
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

// Endpoints silencieux — erreurs HTTP ignorées (endpoints mockés ou optionnels)
const SILENT_ENDPOINTS = [
  'accounts/dashboards/',
  '/permissions/',
  '/notifications/',
  '/users/stats/',
  '/accounts/users/preferences/',
  '/engins/machines/',
  '/documents/kpis/',
  '/documents/formula-kpis/',
]

const shouldSuppressLog = (args) => {
  const errorMessage = args.map(arg => {
    if (typeof arg === 'string') return arg
    if (arg?.message) return arg.message
    if (arg?.config?.url) return arg.config.url
    if (arg?.response?.config?.url) return arg.response.config.url
    return String(arg)
  }).join(' ').toLowerCase()
  
  return SILENT_ENDPOINTS.some(endpoint => {
    const endpointLower = endpoint.toLowerCase().replace(/\//g, '')
    return (errorMessage.includes(endpointLower) || errorMessage.includes(endpoint.toLowerCase())) && 
           (errorMessage.includes('404') || 
            errorMessage.includes('not found') ||
            errorMessage.includes('failed to load resource'))
  })
}

console.error = (...args) => {
  if (!shouldSuppressLog(args)) {
    originalConsoleError.apply(console, args)
  }
}

console.warn = (...args) => {
  if (!shouldSuppressLog(args)) {
    originalConsoleWarn.apply(console, args)
  }
}

// Configuration axios avec variables d'environnement
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 120000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Fonction pour vérifier si un JWT est expiré
const isTokenExpired = (token) => {
  if (!token) return true

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000 // Convertir en millisecondes
    const now = Date.now()

    // Considérer le token comme expiré 30 secondes avant l'expiration réelle
    return now >= (exp - 30000)
  } catch (e) {
    return true
  }
}

// Interceptor de requête pour ajouter le Bearer token (Keycloak ou fallback localStorage)
axiosInstance.interceptors.request.use(
  async (config) => {
    // Pour FormData, laisser le navigateur générer Content-Type avec la
    // boundary multipart. La valeur JSON par défaut empêcherait Django de
    // recevoir request.FILES sur certains builds de production.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers?.setContentType === 'function') {
        config.headers.setContentType(undefined)
      } else if (config.headers) {
        delete config.headers['Content-Type']
        delete config.headers['content-type']
      }
    }

    // Try Keycloak token first (managed by keycloak-js)
    let token = null
    try {
      const { getToken, isAuthenticated, refreshToken } = await import('@/services/keycloak')
      if (isAuthenticated()) {
        // Ensure token is fresh
        await refreshToken(30).catch(() => {})
        token = getToken()
      }
    } catch (e) { /* keycloak not ready yet */ }

    // Fallback: localStorage token (for legacy SimpleJWT sessions during migration)
    if (!token) {
      token = localStorage.getItem('accessToken')
    }

    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    
    // Marquer les endpoints silencieux pour éviter les logs d'erreur
    const isSilentEndpoint = SILENT_ENDPOINTS.some(endpoint =>
      config.url?.includes(endpoint)
    )
    if (isSilentEndpoint) {
      config._silent = true
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor de réponse pour gérer le rafraîchissement automatique des tokens
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Supprimer les logs d'erreur pour certains endpoints (mockés ou optionnels)
    const isSilentEndpoint = originalRequest._silent || false

    // Ne pas logger ni traiter les erreurs pour les endpoints silencieux
    if (isSilentEndpoint && [401, 403, 404].includes(error.response?.status)) {
      const silentError = new Error()
      silentError.config = error.config
      silentError.response = error.response
      silentError.request = error.request
      silentError.isAxiosError = error.isAxiosError
      silentError.toJSON = error.toJSON
      silentError.silent = true
      return Promise.reject(silentError)
    }

    const isLoginPage = window.location.pathname === '/login'

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Try Keycloak token refresh first. If Keycloak indicates an active session
      // but refresh fails, do NOT fallback to legacy localStorage tokens (avoid stale sessions).
      let kcAttempted = false
      try {
        const { isAuthenticated, refreshToken, getToken } = await import('@/services/keycloak')
        if (isAuthenticated()) {
          kcAttempted = true
          await refreshToken(5) // Force refresh
          const newToken = getToken()
          if (newToken) {
            originalRequest.headers['Authorization'] = 'Bearer ' + newToken
            return axiosInstance(originalRequest)
          }
        }
      } catch (e) {
        // If Keycloak was expected to be authenticated but refresh failed,
        // force logout to avoid using stale localStorage tokens.
        if (kcAttempted) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('isAuthenticated')
          localStorage.removeItem('user')
          if (!isLoginPage) window.location.href = '/login'
          return Promise.reject(e)
        }
        // else fallthrough to legacy fallback for non-Keycloak setups
      }

      // Fallback: legacy SimpleJWT refresh (used only when Keycloak not active)
      const legacyRefreshToken = localStorage.getItem('refreshToken')
      if (legacyRefreshToken && !isTokenExpired(legacyRefreshToken)) {
        try {
          const response = await axiosInstance.post('token/refresh/', {
            refresh: legacyRefreshToken
          })

          const { access, refresh } = response.data
          localStorage.setItem('accessToken', access)
          if (refresh) localStorage.setItem('refreshToken', refresh)

          originalRequest.headers['Authorization'] = 'Bearer ' + access
          return axiosInstance(originalRequest)
        } catch (refreshError) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('isAuthenticated')
          localStorage.removeItem('user')
          if (!isLoginPage) window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }

      // No tokens available - redirect to login
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('user')
      if (!isLoginPage) window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Exporter l'instance axios pour les stores
app.config.globalProperties.$axios = axiosInstance
window.axiosInstance = axiosInstance

// axiosInstance is already exported at line 67

// Plugins
app.use(pinia)
app.use(router)
app.use(VueAxios, axiosInstance)
app.use(VueDndKitPlugin)
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Aura
  },
  locale: fr.fr
})
app.use(ToastService)
app.use(ConfirmationService)

// Directives PrimeVue
app.directive('tooltip', Tooltip)


// Composants PrimeVue - Enregistrés avec et sans préfixe pour flexibilité
app.component('Toast', Toast)
app.component('BaseToast', Toast)
app.component('Button', Button)
app.component('BaseButton', Button)
app.component('InputText', InputText)
app.component('BaseInputText', InputText)
app.component('Dialog', Dialog)
app.component('BaseDialog', Dialog)
app.component('Drawer', Drawer)
app.component('BaseDrawer', Drawer)
app.component('Menu', Menu)
app.component('BaseMenu', Menu)
app.component('Toolbar', Toolbar)
app.component('BaseToolbar', Toolbar)
app.component('Avatar', Avatar)
app.component('BaseAvatar', Avatar)
app.component('Badge', Badge)
app.component('BaseBadge', Badge)
app.component('OverlayBadge', OverlayBadge)
app.component('BaseOverlayBadge', OverlayBadge)
app.component('Popover', Popover)
app.component('BasePopover', Popover)
app.component('ProgressSpinner', ProgressSpinner)
app.component('BaseProgressSpinner', ProgressSpinner)
app.component('Message', Message)
app.component('BaseMessage', Message)
app.component('DataTable', DataTable)
app.component('BaseDataTable', DataTable)
app.component('Column', Column)
app.component('BaseColumn', Column)
app.component('DataView', DataView)
app.component('BaseDataView', DataView)
app.component('SelectButton', SelectButton)
app.component('BaseSelectButton', SelectButton)
app.component('Tag', Tag)
app.component('BaseTag', Tag)
app.component('Select', Select)
app.component('BaseSelect', Select)
app.component('Dropdown', Select) // Alias for backwards compatibility (Dropdown deprecated in PrimeVue v4)
app.component('BaseDropdown', Select)
app.component('FileUpload', FileUpload)
app.component('BaseFileUpload', FileUpload)
app.component('Checkbox', Checkbox)
app.component('BaseCheckbox', Checkbox)
app.component('MultiSelect', MultiSelect)
app.component('BaseMultiSelect', MultiSelect)
// OverlayPanel deprecated - using Popover instead
app.component('ConfirmDialog', ConfirmDialog)
app.component('BaseConfirmDialog', ConfirmDialog)
app.component('InputNumber', InputNumber)
app.component('BaseInputNumber', InputNumber)
app.component('InputGroup', InputGroup)
app.component('BaseInputGroup', InputGroup)
app.component('InputGroupAddon', InputGroupAddon)
app.component('BaseInputGroupAddon', InputGroupAddon)
app.component('Textarea', Textarea)
app.component('BaseTextarea', Textarea)
app.component('DatePicker', DatePicker)
app.component('BaseDatePicker', DatePicker)
app.component('ToggleButton', ToggleButton)
app.component('BaseToggleButton', ToggleButton)
app.component('Password', Password)
app.component('BasePassword', Password)
app.component('TreeTable', TreeTable)
app.component('BaseTreeTable', TreeTable)
app.component('ProgressBar', ProgressBar)
app.component('BaseProgressBar', ProgressBar)
app.component('Skeleton', Skeleton)
app.component('BaseSkeleton', Skeleton)
app.component('Card', Card)
app.component('BaseCard', Card)
app.component('Rating', Rating)
app.component('BaseRating', Rating)
app.component('Calendar', DatePicker) // Alias for backwards compatibility (Calendar deprecated in PrimeVue v4)
app.component('BaseCalendar', DatePicker)
app.component('TabView', TabView)
app.component('BaseTabView', TabView)
app.component('Tabs', Tabs)
app.component('BaseTabs', Tabs)
app.component('TabList', TabList)
app.component('Tab', Tab)
app.component('TabPanels', TabPanels)
app.component('TabPanel', TabPanel)
app.component('BaseTabPanel', TabPanel)
app.component('Chart', Chart)
app.component('BaseChart', Chart)
app.component('Paginator', Paginator)
app.component('BasePaginator', Paginator)
app.component('Divider', Divider)
app.component('BaseDivider', Divider)
app.component('IconField', IconField)
app.component('BaseIconField', IconField)
app.component('InputIcon', InputIcon)
app.component('BaseInputIcon', InputIcon)
app.component('ScrollPanel', ScrollPanel)
app.component('BaseScrollPanel', ScrollPanel)
app.component('TabMenu', TabMenu)
app.component('BaseTabMenu', TabMenu)
app.component('ToggleSwitch', ToggleSwitch)
app.component('BaseToggleSwitch', ToggleSwitch)
app.component('TableSkeleton', TableSkeleton)

// Mount l'application
// Initialiser Keycloak puis monter l'app
import { initKeycloak } from '@/services/keycloak'

async function bootstrap() {
  if (window.__VUE_APP_MOUNTED__) return

  // Init Keycloak (check-sso: does not force redirect)
  await initKeycloak()

  app.mount('#app')
  window.__VUE_APP_MOUNTED__ = true

  // If Keycloak has an active session, sync to auth store
  const { useAuthStore } = await import('@/features/auth/stores/authStore')
  const authStore = useAuthStore()
  await authStore.initKeycloak()
}

bootstrap()
