<template>
  <Toast />

  <div class="login-container">
    <!-- Header avec logo et texte KAP CONSEIL -->
    <header class="header">
      <div class="logo-container">
        <img src="@/assets/logo_kap.png" alt="KAP CONSEIL" class="logo-image" />
        <div class="brand-text">
          <h1 class="brand-title">KAP CONSEIL</h1>
          <p class="brand-slogan">Structuration, analyse et optimisation des opérations industrielles</p>
        </div>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Section gauche avec messages orientés performance -->
        <WelcomeBanner />

        <!-- Section droite avec formulaire de connexion -->
        <div class="login-section">
          <LoginCard
            :loading="loading"
            :request-errors="requestErrors"
            :show-errors="showErrors"
            @submit="authenticate"
          />
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <p class="footer-text">© 2025 KAP CONSEIL</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth'
import { storeToRefs } from 'pinia'
import WelcomeBanner from '../components/WelcomeBanner.vue'
import LoginCard from '../components/LoginCard.vue'

const router = useRouter()
const showErrors = ref(false)
const { loading, requestErrors } = storeToRefs(useAuthStore())
const authStore = useAuthStore()

const authenticate = async (formData) => {
  try {
    const result = await authStore.login(formData);
    
    if (result.success) {
      // Redirection vers la page home après connexion réussie
      router.push('/home')
    } else if (result.requiredActions !== undefined) {
      // Handle Keycloak required actions (403 response)
      const actions = Array.isArray(result.requiredActions)
        ? result.requiredActions
        : []
      const kid = result.keycloakId

      // Prioritize UPDATE_PASSWORD over CONFIGURE_TOTP
      if (actions.includes('UPDATE_PASSWORD')) {
        router.push({ path: '/setup-password', query: { kid } })
      } else if (actions.includes('CONFIGURE_TOTP')) {
        router.push({ path: '/otp-setup', query: { kid } })
      } else {
        authStore.setRequestErrors(result.error || 'Actions de sécurité requises sur le compte Keycloak')
        showErrors.value = true
        setTimeout(() => { showErrors.value = false }, 5000)
      }
    } else if (result.requiresOtp) {
      // TOTP configured — redirect to OTP verify with credentials
      router.push({
        path: '/otp-verify',
        query: { kid: result.keycloakId }
      })
      // Temporarily store password for OTP verify page
      sessionStorage.setItem('_otp_pwd', formData.password)
      sessionStorage.setItem('_otp_user', formData.username)
    } else {
      // L'erreur est déjà gérée dans le store, on active juste l'affichage
      showErrors.value = true
      
      // Empêcher toute redirection pendant l'affichage de l'erreur
      setTimeout(() => {
        showErrors.value = false
      }, 5000)
    }
  } catch (error) {
    console.error('Erreur de connexion:', error)
    // En cas d'erreur inattendue, on affiche un message générique
    authStore.setRequestErrors('Erreur inattendue lors de la connexion')
    showErrors.value = true
    
    // Empêcher toute redirection pendant l'affichage de l'erreur
    setTimeout(() => {
      showErrors.value = false
    }, 5000)
  }
}

// Empêcher le rechargement de page
const preventReload = (e) => {
  if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
    e.preventDefault()
    return false
  }
}

onMounted(() => {
  // Empêcher le rechargement avec F5 ou Ctrl+R
  window.addEventListener('keydown', preventReload)
  
  // Empêcher le rechargement avec le bouton de navigation
  window.addEventListener('beforeunload', (e) => {
    if (showErrors.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', preventReload)
})

watch(
  () => requestErrors,
  (newValue) => {
    if (newValue.value.length > 0) {
      showErrors.value = true
      setTimeout(() => {
        showErrors.value = false
      }, 5000)
    }
  },
  { deep: true }
)
</script>

<style scoped>
/* Variables CSS avec les couleurs officielles KAP CONSEIL */
:root {
  /* Couleurs principales KAP CONSEIL */
  --kap-blue: #0B2B3C;
  --kap-green: #7AC943;
  --kap-white: #FFFFFF;

  /* Couleurs principales */
  --primary-color: var(--kap-blue);
  --primary-hover: #0a2330;
  --secondary-color: var(--kap-green);

  /* Couleurs de fond */
  --bg-primary: var(--kap-white);
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;

  /* Couleurs de texte */
  --text-primary: var(--kap-blue);
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --text-white: var(--kap-white);

  /* Couleurs de bordure */
  --border-primary: #e2e8f0;
  --border-secondary: #cbd5e1;
  --border-focus: var(--kap-blue);

  /* Couleurs d'état */
  --error-color: #ef4444;
  --error-bg: #fef2f2;
  --error-border: #fecaca;

  /* Couleurs neutres */
  --neutral-50: #f8fafc;
  --neutral-100: #f1f5f9;
  --neutral-200: #e2e8f0;
  --neutral-300: #cbd5e1;
  --neutral-400: #94a3b8;
  --neutral-500: #64748b;
  --neutral-600: #475569;
  --neutral-700: #334155;
  --neutral-800: #1e293b;
  --neutral-900: #0f172a;

  /* Ombres */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.login-container {
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 25% 75%, rgba(11, 43, 60, 0.03) 0%, transparent 40%),
    radial-gradient(circle at 75% 25%, rgba(122, 201, 67, 0.05) 0%, transparent 40%);
  opacity: 1;
  pointer-events: none;
}

/* Header */
.header {
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background-color: var(--kap-white);
  min-height: 100px;
  border-bottom: 2px solid var(--kap-green);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo-image {
  height: 80px;
  width: auto;
  transition: transform 0.3s ease;
  object-fit: contain;
}

.logo-image:hover {
  transform: scale(1.05);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.brand-title {
  font-size: 1.8rem;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 800;
  color: var(--kap-blue);
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.brand-slogan {
  font-size: 0.85rem;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--kap-green);
  font-weight: 600;
  margin: 0;
  font-style: italic;
  letter-spacing: 0.02em;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  max-width: 1200px;
  width: 100%;
  align-items: center;
}

/* Login Section */
.login-section {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Footer */
.footer {
  padding: 1.5rem 2rem;
  text-align: center;
  background-color: var(--kap-white);
  border-top: 1px solid var(--border-primary);
}

.footer-text {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .hero-section {
    order: 2;
  }
  
  .login-section {
    order: 1;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 1rem;
    min-height: 80px;
  }
  
  .logo-image {
    height: 60px;
  }
  
  .brand-title {
    font-size: 1.5rem;
  }
  
  .brand-slogan {
    font-size: 0.75rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .content-wrapper {
    gap: 1.5rem;
  }
}
</style>
