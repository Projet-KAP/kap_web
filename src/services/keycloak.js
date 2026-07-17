/**
 * Keycloak service — singleton adapter for the KAP frontend.
 *
 * Initialises keycloak-js, exposes login / logout / token helpers,
 * and is the *single source of truth* for auth state.
 */
import Keycloak from 'keycloak-js'

// ── Keycloak instance (singleton) ──────────────────────────────────────────
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'sso-kap-alpha',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'kap',
})

let _initPromise = null

/**
 * Initialise Keycloak (called once from main.js).
 *
 * Uses `check-sso` so the user is not forcibly redirected on first visit —
 * the login page in Vue will call `keycloak.login()` explicitly.
 *
 * @returns {Promise<boolean>} whether the user is already authenticated.
 */
export function initKeycloak() {
  if (_initPromise) return _initPromise

  _initPromise = keycloak
    .init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: false,
      silentCheckSsoFallback: false,
    })
    .then((authenticated) => {
      // Clear fragment errors from Keycloak OAuth callback (e.g. error=login_required)
      if (window.location.hash && 
          (window.location.hash.includes('error=') || 
           window.location.hash.includes('code=') ||
           window.location.hash.includes('state='))) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
      
      if (authenticated) {
        _scheduleTokenRefresh()
      }
      return authenticated
    })
    .catch((err) => {
      console.error('[Keycloak] Init failed:', err)
      // Clear fragment on error too
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
      return false
    })

  return _initPromise
}

// ── Token auto-refresh ────────────────────────────────────────────────────
let _refreshTimer = null

function _scheduleTokenRefresh() {
  if (_refreshTimer) clearInterval(_refreshTimer)

  // Refresh every 60 s — keycloak-js only refreshes when the token will
  // expire within the given `minValidity` (seconds).
  _refreshTimer = setInterval(() => {
    keycloak
      .updateToken(70) // refresh if < 70 s left
      .catch(() => {
        console.warn('[Keycloak] Token refresh failed — logging out')
        keycloak.logout()
      })
  }, 60_000)
}

// ── Public helpers ─────────────────────────────────────────────────────────

/** Get current access token (always fresh thanks to auto-refresh). */
export function getToken() {
  return keycloak.token || ''
}

/** Get current refresh token. */
export function getRefreshToken() {
  return keycloak.refreshToken || ''
}

/** Whether the user has been authenticated by Keycloak. */
export function isAuthenticated() {
  return !!keycloak.authenticated
}

/** Parsed token payload (sub, email, realm_access, etc.). */
export function getTokenParsed() {
  return keycloak.tokenParsed || {}
}

/** Keycloak realm roles of the current user. */
export function getRealmRoles() {
  return keycloak.tokenParsed?.realm_access?.roles || []
}

/** Check if user has a specific realm role. */
export function hasRole(role) {
  return getRealmRoles().some(
    (r) => r.toLowerCase() === role.toLowerCase(),
  )
}

/** Trigger Keycloak login (redirect). */
export function login(redirectUri) {
  return keycloak.login({
    redirectUri: redirectUri || window.location.origin + '/dashboard',
  })
}

/** Trigger Keycloak logout (redirect). */
export function logout(redirectUri) {
  if (_refreshTimer) clearInterval(_refreshTimer)
  return keycloak.logout({
    redirectUri: redirectUri || window.location.origin + '/login',
  })
}

/** Manually refresh the token. */
export async function refreshToken(minValidity = 30) {
  const refreshed = await keycloak.updateToken(minValidity)
  if (refreshed) _scheduleTokenRefresh()
  return keycloak.token
}

/** Raw keycloak instance (escape hatch). */
export { keycloak }
export default keycloak
