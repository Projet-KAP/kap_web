import { defineStore } from 'pinia'
import { axiosInstance } from '@/main'
import { useNotificationsStore } from '@/stores/notificationsStore'
import {
  keycloak,
  initKeycloak,
  getToken,
  getRefreshToken,
  getRealmRoles,
  hasRole,
  login as kcLogin,
  logout as kcLogout,
  isAuthenticated as kcIsAuthenticated,
  refreshToken as kcRefreshToken,
} from '@/services/keycloak'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null,
    isAuthenticated: false,
    accessToken: '',
    refreshToken: '',
    loading: false,
    requestErrors: [],
    keycloakReady: false,
  }),

  getters: {
    getCurrentUser: (state) => {
      if (!state.currentUser) {
        const user = localStorage.getItem('user')
        if (user) {
          try {
            state.currentUser = JSON.parse(user)
          } catch (e) {
            state.currentUser = null
          }
        }
      }
      return state.currentUser
    },
    getEnabledModules: (state) => {
      const user = state.getCurrentUser || state.currentUser

      // Prefer Keycloak token claim when available
      const tokenModulesRaw = keycloak.tokenParsed?.enabled_modules
      let tokenModules = []
      if (tokenModulesRaw) {
        if (Array.isArray(tokenModulesRaw)) tokenModules = tokenModulesRaw
        else if (typeof tokenModulesRaw === 'string') {
          tokenModules = tokenModulesRaw.split(',').map(s => s.trim()).filter(Boolean)
        }
      }
      if (tokenModules.length > 0) return tokenModules

      // Fallback to user profile from API
      const userModulesRaw = user?.enabled_modules
      if (!userModulesRaw) return []
      if (Array.isArray(userModulesRaw)) return userModulesRaw
      if (typeof userModulesRaw === 'string') {
        return userModulesRaw.split(',').map(s => s.trim()).filter(Boolean)
      }
      return []
    },

    hasModule: (state) => (moduleCode) => {
      const user = state.getCurrentUser || state.currentUser
      if (!user) return false

      // Superadmin has access to everything
      if (user.is_superuser === true || user.is_superuser === 'true') return true

      const enabled = state.getEnabledModules || []
      // If getter returned a function-style (Pinia), call it
      const modules = typeof enabled === 'function' ? enabled() : enabled
      return Array.isArray(modules) && modules.includes(moduleCode)
    },
    getIsAuthenticated() {
      return this.isAuthenticated || kcIsAuthenticated()
    },
    getRequestErrors() {
      return this.requestErrors
    },
    getAccessToken() {
      return getToken() || this.accessToken
    },
    getRefreshToken() {
      return getRefreshToken() || this.refreshToken
    },
    getLoading() {
      return this.loading
    },
    // Vérifications de rôles — uses Keycloak realm roles
    isAdmin() {
      // Check Keycloak roles first
      if (kcIsAuthenticated()) {
        return hasRole('admin') || hasRole('administrateur') || hasRole('superadmin')
      }
      // Fallback: check local user data
      const user = this.getCurrentUser
      if (!user) return false

      let roleName = null
      if (user.role) {
        if (typeof user.role === 'string') roleName = user.role
        else if (user.role.role_name) roleName = user.role.role_name
        else if (user.role.name) roleName = user.role.name
      } else if (user.role_name) {
        roleName = user.role_name
      }
      if (!roleName) return false
      return roleName.toLowerCase().includes('admin') || roleName.toLowerCase().includes('administrateur')
    },
    isSiteAdmin() {
      const user = this.getCurrentUser
      if (!user) return false
      return this.isAdmin && user.site_id
    },
    isGlobalAdmin() {
      const user = this.getCurrentUser
      if (!user) return false
      return this.isAdmin && !user.site_id
    },
    isSuperAdmin() {
      // Check Keycloak role
      if (kcIsAuthenticated()) {
        return hasRole('superadmin')
      }
      const user = this.getCurrentUser
      if (!user) return false
      return user.is_superuser === true || user.is_superuser === 'true'
    },
    canAccessAdminPanel() {
      return this.isSuperAdmin
    },
    canAccessConfiguration() {
      return this.isSuperAdmin
    },
    getUserRole() {
      // Keycloak realm roles
      if (kcIsAuthenticated()) {
        const roles = getRealmRoles().filter(
          (r) => !['default-roles-sso-kap-alpha', 'offline_access', 'uma_authorization'].includes(r)
        )
        return roles[0] || null
      }
      const user = this.getCurrentUser
      if (!user) return null

      if (user.role) {
        if (typeof user.role === 'string') return user.role
        else if (user.role.role_name) return user.role.role_name
        else if (user.role.name) return user.role.name
      } else if (user.role_name) {
        return user.role_name
      }
      return null
    },
    getUserSite() {
      const user = this.getCurrentUser
      return user?.site || null
    }
  },

  actions: {
    // ── Keycloak bootstrap (called once from main.js) ─────────────────────
    async initKeycloak() {
      try {
        const authenticated = await initKeycloak()
        this.keycloakReady = true

        if (authenticated) {
          this.accessToken = getToken()
          this.refreshToken = getRefreshToken()
          this.isAuthenticated = true
          localStorage.setItem('isAuthenticated', 'true')

          // Fetch full user profile from API
          await this._fetchUserProfile()

          // Init WebSocket
          try {
            const notificationsStore = useNotificationsStore()
            notificationsStore.initWebSocket(this.accessToken)
          } catch (e) { /* silenced */ }
        }
        return authenticated
      } catch (err) {
        console.error('[AuthStore] Keycloak init error:', err)
        this.keycloakReady = true
        return false
      }
    },

    setTokens({ access, refresh }) {
      this.accessToken = access
      this.refreshToken = refresh
      // Keep localStorage in sync for backwards-compat code
      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
    },

    setCurrentUser(user) {
      this.currentUser = user
    },

    setIsAuthenticated(value) {
      this.isAuthenticated = value
    },

    setRequestErrors(errors) {
      this.requestErrors = Array.isArray(errors) ? errors : [errors]
    },

    resetRequestErrors() {
      this.requestErrors = []
    },

    async refreshTokens() {
      try {
        // Use Keycloak token refresh
        const newToken = await kcRefreshToken(30)
        if (newToken) {
          this.accessToken = newToken
          this.refreshToken = getRefreshToken()
          localStorage.setItem('accessToken', newToken)
          return newToken
        }
      } catch (e) { /* silenced */ }

      // Fallback: legacy SimpleJWT refresh
      try {
        const response = await axiosInstance.post('/token/refresh/', {
          refresh: this.refreshToken
        })
        this.setTokens({
          access: response.data.access,
          refresh: response.data.refresh || this.refreshToken
        })
        return response.data.access
      } catch (error) {
        this.logout()
        throw error
      }
    },

    removeUserInfos() {
      this.accessToken = ''
      this.refreshToken = ''
      this.currentUser = null
      this.isAuthenticated = false
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('isAuthenticated')
    },

    /**
     * Login — uses POST /api/auth/login/ which now talks to Keycloak on the backend.
     * The backend returns Keycloak tokens directly.
     */
    async login(payload) {
      this.loading = true
      this.resetRequestErrors()

      try {
        const apiPayload = {
          identifiant: payload.username,
          password: payload.password
        }
        if (payload.otp_code) {
          apiPayload.otp_code = payload.otp_code
        }

        let response = null

        // First try: configured axios baseURL
        try {
          response = await axiosInstance.post('/auth/login/', apiPayload)
        } catch (networkError) {
          // Local dev fallback: retry common backend ports when API is unreachable.
          if (!networkError.response && typeof window !== 'undefined') {
            const currentBase = import.meta.env.VITE_API_BASE_URL || ''
            const isLocal = /localhost|127\.0\.0\.1/.test(currentBase)

            if (isLocal) {
              const fallbackBases = [
                'http://127.0.0.1:8002/api/v1/',
                'http://localhost:8083/api/v1/',
                'http://127.0.0.1:8000/api/v1/'
              ].filter((base) => base !== currentBase)

              for (const base of fallbackBases) {
                try {
                  response = await axiosInstance.post(`${base}auth/login/`, apiPayload)
                  break
                } catch (fallbackError) {
                  if (fallbackError.response) {
                    throw fallbackError
                  }
                }
              }
            }
          }

          if (!response) {
            throw networkError
          }
        }

        const { access, refresh, user } = response.data

        if (access) {
          this.setTokens({ access, refresh: refresh || '' })

          if (user) {
            this.setCurrentUser(user)
            localStorage.setItem('user', JSON.stringify(user))
          } else {
            await this._fetchUserProfile()
          }

          this.setIsAuthenticated(true)
          localStorage.setItem('isAuthenticated', 'true')

          // Init WebSocket
          try {
            const notificationsStore = useNotificationsStore()
            notificationsStore.initWebSocket(access)
          } catch (e) { /* silenced */ }

          this.loading = false
          return { success: true }
        } else {
          this.setRequestErrors('Tokens manquants dans la réponse')
          this.loading = false
          return { success: false, error: 'Tokens manquants' }
        }
      } catch (error) {
        this.loading = false
        if (error.response) {
          const errorData = error.response.data

          // Handle 403 with required_actions (Keycloak first login / OTP setup)
          if (
            error.response.status === 403 &&
            Object.prototype.hasOwnProperty.call(errorData, 'required_actions')
          ) {
            return {
              success: false,
              requiredActions: Array.isArray(errorData.required_actions)
                ? errorData.required_actions
                : [],
              keycloakId: errorData.keycloak_id,
              error: errorData.message || 'Actions requises'
            }
          }

          // Handle 403 with requires_otp (TOTP verification needed)
          if (error.response.status === 403 && errorData.requires_otp) {
            return {
              success: false,
              requiresOtp: true,
              keycloakId: errorData.keycloak_id,
              error: errorData.message || 'Code OTP requis'
            }
          }

          let errorMessage = 'Erreur de connexion'
          if (errorData.detail) errorMessage = errorData.detail
          else if (errorData.non_field_errors) errorMessage = errorData.non_field_errors[0]
          else if (errorData.error) errorMessage = errorData.error
          else if (errorData.message) errorMessage = errorData.message
          this.setRequestErrors(errorMessage)
          return { success: false, error: errorMessage }
        } else {
          this.setRequestErrors('Erreur de connexion au serveur')
          return { success: false, error: 'Erreur de connexion au serveur' }
        }
      }
    },

    /**
     * Login via Keycloak redirect (SSO flow).
     * Used when calling kcLogin() directly — after redirect back,
     * initKeycloak() will pick up the session.
     */
    loginWithKeycloak(redirectUri) {
      return kcLogin(redirectUri)
    },

    async logout() {
      // Disconnect WebSocket
      try {
        const notificationsStore = useNotificationsStore()
        notificationsStore.disconnectWebSocket()
      } catch (e) { /* silenced */ }

      // Notify server
      if (this.accessToken && this.refreshToken) {
        try {
          await axiosInstance.post('/auth/logout/', {
            refresh: this.refreshToken
          }, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
          })
        } catch (e) { /* silenced */ }
      }

      this.removeUserInfos()

      // If Keycloak is active, use its logout (redirect)
      if (kcIsAuthenticated()) {
        try {
          await kcLogout(window.location.origin + '/login')
          return // Keycloak will redirect
        } catch (e) { /* silenced */ }
      }

      window.location.href = '/login'
    },

    async changePassword(payload) {
      this.loading = true
      this.resetRequestErrors()

      try {
        const response = await axiosInstance.post('/auth/change-password/', payload, {
          headers: { 'Authorization': `Bearer ${this.accessToken}` }
        })

        this.loading = false
        if (response.data.message) {
          return { success: true, message: response.data.message }
        }
        this.setRequestErrors(response.data.error || 'Erreur lors du changement de mot de passe')
        return { success: false, error: response.data.error }
      } catch (error) {
        this.loading = false
        if (error.response) {
          const errorMessage = error.response.data.error || error.response.data.detail || 'Erreur lors du changement de mot de passe'
          this.setRequestErrors(errorMessage)
          return { success: false, error: errorMessage }
        } else {
          this.setRequestErrors('Erreur de connexion au serveur')
          return { success: false, error: 'Erreur de connexion au serveur' }
        }
      }
    },

    // Rafraîchir les informations utilisateur depuis l'API
    async refreshUser() {
      return this._fetchUserProfile()
    },

    // ── Internal ──────────────────────────────────────────────────────────
    async _fetchUserProfile() {
      try {
        const response = await axiosInstance.get('/accounts/users/me/')
        const user = response.data?.user || response.data
        if (user) {
          this.setCurrentUser(user)
          localStorage.setItem('user', JSON.stringify(user))
          return user
        }
      } catch (e) {
        return null
      }
    }
  }
})
