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

        <div v-if="!submitted" class="card-body">
          <h2 class="card-title">Mot de passe oublié</h2>
          <p class="card-subtitle">
            Entrez votre identifiant ou adresse email. Si un compte existe,
            vous recevrez un email avec un lien de réinitialisation.
          </p>

          <form @submit.prevent="handleSubmit" class="auth-form">
            <div class="form-group">
              <label class="form-label">Identifiant ou email</label>
              <div class="input-wrapper">
                <i class="pi pi-user input-icon"></i>
                <InputText
                  v-model="identifier"
                  placeholder="ex: lamine ou lamine@example.com"
                  class="form-input"
                  :class="{ error: errorMessage }"
                  autofocus
                />
              </div>
            </div>

            <small v-if="errorMessage" class="error-text">{{ errorMessage }}</small>

            <Button
              type="submit"
              :loading="loading"
              :label="loading ? 'Envoi en cours...' : 'Envoyer le lien'"
              icon="pi pi-envelope"
              class="submit-button"
              :disabled="!identifier.trim()"
            />
          </form>

          <div class="back-link">
            <router-link to="/login">
              <i class="pi pi-arrow-left"></i> Retour à la connexion
            </router-link>
          </div>
        </div>

        <div v-else class="card-body success-state">
          <div class="success-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h2 class="card-title">Email envoyé</h2>
          <p class="card-subtitle">
            Si un compte est associé à <strong>{{ identifier }}</strong>,
            vous recevrez un email avec les instructions de réinitialisation.
          </p>
          <p class="card-subtitle" style="margin-top: 0.5rem; font-size: 0.85rem; color: #94a3b8;">
            Vérifiez également votre dossier spam.
          </p>
          <Button
            label="Retour à la connexion"
            icon="pi pi-arrow-left"
            class="submit-button"
            @click="$router.push('/login')"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { axiosInstance } from '@/main'

const identifier = ref('')
const loading = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  if (!identifier.value.trim()) return
  errorMessage.value = ''
  loading.value = true

  try {
    await axiosInstance.post('/auth/forgot-password/', {
      identifier: identifier.value.trim()
    })
    submitted.value = true
  } catch (err) {
    // Still show success to prevent user enumeration
    submitted.value = true
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
  max-width: 460px;
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
  gap: 0.5rem;
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
  padding: 1rem 1rem 1rem 2.75rem;
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

.back-link {
  text-align: center;
  margin-top: 1.5rem;
}

.back-link a {
  color: #0B2B3C;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: color 0.2s;
}

.back-link a:hover {
  color: #7AC943;
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
