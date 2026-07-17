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

        <div v-if="!success" class="card-body">
          <div class="info-badge">
            <i class="pi pi-info-circle"></i>
            Première connexion
          </div>

          <h2 class="card-title">Créer votre mot de passe</h2>
          <p class="card-subtitle">
            Définissez un nouveau mot de passe pour sécuriser votre compte.
          </p>

          <form @submit.prevent="handleSubmit" class="auth-form">
            <div class="form-group">
              <label class="form-label">Nouveau mot de passe</label>
              <div class="input-wrapper">
                <i class="pi pi-shield input-icon"></i>
                <InputText
                  :type="showNew ? 'text' : 'password'"
                  v-model="form.newPassword"
                  placeholder="Minimum 8 caractères"
                  class="form-input"
                  :class="{ error: form.newPassword && form.newPassword.length < 8 }"
                />
                <button type="button" class="toggle-btn" @click="showNew = !showNew">
                  <i :class="showNew ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                </button>
              </div>
              <div v-if="form.newPassword" class="strength-bar">
                <div class="strength-fill" :class="strengthClass" :style="{ width: strengthPercent + '%' }"></div>
              </div>
              <small v-if="form.newPassword" class="strength-text" :class="strengthClass">{{ strengthLabel }}</small>
            </div>

            <div class="form-group">
              <label class="form-label">Confirmer le mot de passe</label>
              <div class="input-wrapper">
                <i class="pi pi-check-circle input-icon"></i>
                <InputText
                  :type="showConfirm ? 'text' : 'password'"
                  v-model="form.confirmPassword"
                  placeholder="Retapez le nouveau mot de passe"
                  class="form-input"
                  :class="{ error: form.confirmPassword && form.newPassword !== form.confirmPassword }"
                />
                <button type="button" class="toggle-btn" @click="showConfirm = !showConfirm">
                  <i :class="showConfirm ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                </button>
              </div>
              <small v-if="form.confirmPassword && form.newPassword !== form.confirmPassword" class="error-text">
                Les mots de passe ne correspondent pas
              </small>
            </div>

            <small v-if="errorMessage" class="error-text">{{ errorMessage }}</small>

            <Button
              type="submit"
              :loading="loading"
              :label="loading ? 'Mise à jour...' : 'Définir le mot de passe'"
              icon="pi pi-check"
              class="submit-button"
              :disabled="!isValid"
            />
          </form>
        </div>

        <div v-else class="card-body success-state">
          <div class="success-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h2 class="card-title">Mot de passe créé</h2>
          <p class="card-subtitle">
            Votre nouveau mot de passe a été défini avec succès.
            Vous pouvez maintenant vous connecter.
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
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { axiosInstance } from '@/main'

const route = useRoute()

const form = ref({
  newPassword: '',
  confirmPassword: '',
})

const showNew = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const success = ref(false)
const errorMessage = ref('')

const keycloakId = computed(() => route.query.kid || '')

const passwordStrength = computed(() => {
  const p = form.value.newPassword
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

const strengthPercent = computed(() => (passwordStrength.value / 5) * 100)
const strengthClass = computed(() => {
  const s = passwordStrength.value
  if (s <= 1) return 'weak'
  if (s <= 2) return 'fair'
  if (s <= 3) return 'good'
  return 'strong'
})
const strengthLabel = computed(() => {
  const s = passwordStrength.value
  if (s <= 1) return 'Faible'
  if (s <= 2) return 'Moyen'
  if (s <= 3) return 'Bon'
  return 'Fort'
})

const isValid = computed(() => {
  return (
    form.value.newPassword.length >= 8 &&
    form.value.newPassword === form.value.confirmPassword &&
    keycloakId.value
  )
})

const handleSubmit = async () => {
  if (!isValid.value) return
  errorMessage.value = ''
  loading.value = true

  try {
    await axiosInstance.post('/auth/setup-password/', {
      keycloak_id: keycloakId.value,
      new_password: form.value.newPassword,
    })
    success.value = true
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'Erreur lors de la mise à jour du mot de passe.'
  } finally {
    loading.value = false
  }
}
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
  background: #eff6ff;
  color: #2563eb;
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

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0B2B3C;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: 1rem 2.75rem 1rem 2.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #ffffff;
  color: #0B2B3C;
}

.form-input:focus {
  outline: none;
  border-color: #0B2B3C;
  box-shadow: 0 0 0 3px rgba(11, 43, 60, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.toggle-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
}

.toggle-btn:hover {
  color: #0B2B3C;
}

.strength-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.25rem;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s;
}

.strength-fill.weak { background: #ef4444; }
.strength-fill.fair { background: #f59e0b; }
.strength-fill.good { background: #3b82f6; }
.strength-fill.strong { background: #7AC943; }

.strength-text {
  font-size: 0.75rem;
  font-weight: 600;
}

.strength-text.weak { color: #ef4444; }
.strength-text.fair { color: #f59e0b; }
.strength-text.good { color: #3b82f6; }
.strength-text.strong { color: #7AC943; }

.error-text {
  color: #ef4444;
  font-size: 0.85rem;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  background: #0B2B3C !important;
  border-color: #0B2B3C !important;
  margin-top: 0.5rem;
}

.submit-button:hover {
  background: #0a2330 !important;
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
