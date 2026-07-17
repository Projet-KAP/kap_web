<template>
  <div class="auth-page">
    <header class="auth-header">
      <div class="logo-container">
        <img src="@/assets/logo_kap.png" alt="KAP CONSEIL" class="logo-image" />
        <div class="brand-text">
          <h1 class="brand-title">KAP CONSEIL</h1>
        </div>
      </div>
    </header>

    <main class="auth-main">
      <div class="auth-card">
        <div class="card-accent"></div>

        <div class="card-body">
          <div class="info-badge">
            <i class="pi pi-shield"></i>
            Vérification requise
          </div>

          <h2 class="card-title">Code de vérification</h2>
          <p class="card-subtitle">
            Entrez le code à 6 chiffres affiché dans votre application d'authentification.
          </p>

          <form @submit.prevent="handleVerify" class="auth-form">
            <div class="otp-input-group">
              <input
                v-for="(_, idx) in 6"
                :key="idx"
                :ref="el => { if (el) otpRefs[idx] = el }"
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="otp-digit"
                :class="{ filled: otpDigits[idx] }"
                v-model="otpDigits[idx]"
                @input="onDigitInput(idx)"
                @keydown.backspace="onBackspace(idx, $event)"
                @paste="onPaste"
              />
            </div>

            <small v-if="errorMessage" class="error-text">{{ errorMessage }}</small>

            <Button
              type="submit"
              :loading="loading"
              :label="loading ? 'Vérification...' : 'Vérifier'"
              icon="pi pi-sign-in"
              class="submit-button"
              :disabled="otpCode.length !== 6"
            />

            <router-link to="/login" class="back-link">
              <i class="pi pi-arrow-left"></i> Retour à la connexion
            </router-link>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const errorMessage = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const otpRefs = ref([])

const keycloakId = computed(() => route.query.kid || '')
const otpCode = computed(() => otpDigits.value.join(''))

const handleVerify = async () => {
  if (otpCode.value.length !== 6) return
  loading.value = true
  errorMessage.value = ''

  const storedPassword = sessionStorage.getItem('_otp_pwd') || ''
  const storedUser = sessionStorage.getItem('_otp_user') || ''

  if (!storedUser || !storedPassword) {
    router.push('/login')
    return
  }

  try {
    const result = await authStore.login({
      username: storedUser,
      password: storedPassword,
      otp_code: otpCode.value,
    })

    if (result.success) {
      // Clean up temporary credentials
      sessionStorage.removeItem('_otp_pwd')
      sessionStorage.removeItem('_otp_user')
      router.push('/home')
    } else {
      errorMessage.value = result.error || 'Code invalide. Veuillez réessayer.'
      otpDigits.value = ['', '', '', '', '', '']
      otpRefs.value[0]?.focus()
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'Code invalide. Veuillez réessayer.'
    otpDigits.value = ['', '', '', '', '', '']
    otpRefs.value[0]?.focus()
  } finally {
    loading.value = false
  }
}

const onDigitInput = (idx) => {
  const val = otpDigits.value[idx]
  if (val && !/^\d$/.test(val)) {
    otpDigits.value[idx] = ''
    return
  }
  if (val && idx < 5) {
    otpRefs.value[idx + 1]?.focus()
  }
}

const onBackspace = (idx, event) => {
  if (!otpDigits.value[idx] && idx > 0) {
    event.preventDefault()
    otpDigits.value[idx - 1] = ''
    otpRefs.value[idx - 1]?.focus()
  }
}

const onPaste = (event) => {
  event.preventDefault()
  const text = (event.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6)
  for (let i = 0; i < 6; i++) {
    otpDigits.value[i] = text[i] || ''
  }
  const focusIdx = Math.min(text.length, 5)
  otpRefs.value[focusIdx]?.focus()
}

onMounted(() => {
  if (!keycloakId.value) {
    router.push('/login')
    return
  }
  otpRefs.value[0]?.focus()
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.auth-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-image {
  height: 36px;
  width: auto;
}

.brand-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0B2B3C;
  letter-spacing: 0.05em;
}

.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-card {
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.card-accent {
  height: 4px;
  background: linear-gradient(90deg, #7AC943, #0B2B3C);
}

.card-body {
  padding: 2.5rem;
}

.info-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #fef3c7;
  color: #b45309;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0B2B3C;
  margin-bottom: 0.5rem;
}

.card-subtitle {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 2rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.otp-input-group {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.otp-digit {
  width: 48px;
  height: 56px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0B2B3C;
  transition: all 0.2s;
  outline: none;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.otp-digit:focus {
  border-color: #0B2B3C;
  box-shadow: 0 0 0 3px rgba(11, 43, 60, 0.1);
}

.otp-digit.filled {
  border-color: #7AC943;
  background: #f0fdf4;
}

.error-text {
  color: #ef4444;
  font-size: 0.85rem;
  text-align: center;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  background: #0B2B3C !important;
  border-color: #0B2B3C !important;
}

.submit-button:hover {
  background: #0a2330 !important;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #64748b;
  font-size: 0.9rem;
  text-decoration: none;
  padding: 0.5rem;
}

.back-link:hover {
  color: #0B2B3C;
}
</style>
