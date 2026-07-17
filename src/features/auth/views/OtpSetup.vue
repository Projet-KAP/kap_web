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

        <!-- Step 1: QR Code display -->
        <div v-if="step === 'qr'" class="card-body">
          <div class="info-badge">
            <i class="pi pi-shield"></i>
            Sécurité renforcée
          </div>

          <h2 class="card-title">Configurer l'authentification à deux facteurs</h2>
          <p class="card-subtitle">
            Scannez le QR code ci-dessous avec votre application d'authentification
            (Google Authenticator, Authy, etc.)
          </p>

          <div v-if="loadingQr" class="qr-loading">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Génération du QR code...</span>
          </div>

          <div v-else-if="qrCode" class="qr-section">
            <div class="qr-wrapper">
              <img :src="qrCode" alt="QR Code TOTP" class="qr-image" />
            </div>

            <div class="manual-entry">
              <p class="manual-label">Ou entrez ce code manuellement :</p>
              <div class="secret-display">
                <code class="secret-code">{{ secret }}</code>
                <button type="button" class="copy-btn" @click="copySecret" :title="copied ? 'Copié !' : 'Copier'">
                  <i :class="copied ? 'pi pi-check' : 'pi pi-copy'"></i>
                </button>
              </div>
            </div>

            <Button
              label="J'ai scanné le QR code"
              icon="pi pi-arrow-right"
              iconPos="right"
              class="submit-button"
              @click="step = 'verify'"
            />
          </div>

          <small v-if="errorMessage" class="error-text">{{ errorMessage }}</small>
        </div>

        <!-- Step 2: Code verification -->
        <div v-else-if="step === 'verify'" class="card-body">
          <h2 class="card-title">Vérification du code</h2>
          <p class="card-subtitle">
            Entrez le code à 6 chiffres affiché dans votre application d'authentification.
          </p>

          <form @submit.prevent="verifyCode" class="auth-form">
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
              :label="loading ? 'Vérification...' : 'Vérifier et activer'"
              icon="pi pi-check"
              class="submit-button"
              :disabled="otpCode.length !== 6"
            />

            <button type="button" class="back-link" @click="step = 'qr'">
              <i class="pi pi-arrow-left"></i> Retour au QR code
            </button>
          </form>
        </div>

        <!-- Step 3: Success -->
        <div v-else-if="step === 'success'" class="card-body success-state">
          <div class="success-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h2 class="card-title">Authentification activée</h2>
          <p class="card-subtitle">
            L'authentification à deux facteurs est maintenant active sur votre compte.
          </p>
          <Button
            label="Se connecter"
            icon="pi pi-sign-in"
            class="submit-button"
            @click="$router.push('/login')"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { axiosInstance } from '@/main'

const route = useRoute()

const step = ref('qr')
const qrCode = ref('')
const secret = ref('')
const loadingQr = ref(true)
const loading = ref(false)
const errorMessage = ref('')
const copied = ref(false)
const otpDigits = ref(['', '', '', '', '', ''])
const otpRefs = ref([])

const keycloakId = computed(() => route.query.kid || '')
const otpCode = computed(() => otpDigits.value.join(''))

const generateQr = async () => {
  loadingQr.value = true
  errorMessage.value = ''

  try {
    const response = await axiosInstance.post('/auth/otp-setup/', {
      keycloak_id: keycloakId.value,
    })
    qrCode.value = response.data.qr_code
    secret.value = response.data.secret
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'Erreur lors de la génération du QR code.'
  } finally {
    loadingQr.value = false
  }
}

const verifyCode = async () => {
  if (otpCode.value.length !== 6) return
  loading.value = true
  errorMessage.value = ''

  try {
    await axiosInstance.post('/auth/otp-setup/', {
      keycloak_id: keycloakId.value,
      secret: secret.value,
      otp_code: otpCode.value,
    })
    step.value = 'success'
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'Code invalide. Veuillez réessayer.'
    otpDigits.value = ['', '', '', '', '', '']
    otpRefs.value[0]?.focus()
  } finally {
    loading.value = false
  }
}

const copySecret = async () => {
  try {
    await navigator.clipboard.writeText(secret.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    // fallback
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
  if (keycloakId.value) {
    generateQr()
  }
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
  max-width: 520px;
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
  background: #f0fdf4;
  color: #16a34a;
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
  margin-bottom: 1.5rem;
}

.qr-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #64748b;
}

.qr-loading i {
  font-size: 1.5rem;
}

.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.qr-wrapper {
  background: #ffffff;
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  display: inline-block;
}

.qr-image {
  width: 200px;
  height: 200px;
  display: block;
}

.manual-entry {
  width: 100%;
  text-align: center;
}

.manual-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.secret-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.secret-code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0B2B3C;
  letter-spacing: 0.1em;
  word-break: break-all;
}

.copy-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.copy-btn:hover {
  color: #0B2B3C;
  background: #e2e8f0;
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
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem;
}

.back-link:hover {
  color: #0B2B3C;
}

.success-state {
  text-align: center;
}

.success-icon {
  font-size: 3rem;
  color: #7AC943;
  margin-bottom: 1rem;
}

.success-icon i {
  font-size: 3rem;
}
</style>
