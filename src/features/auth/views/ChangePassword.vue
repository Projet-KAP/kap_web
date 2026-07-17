<template>
  <div class="change-password-container">
    <div class="page-header">
      <h1 class="page-title">Modifier le mot de passe</h1>
      <p class="page-subtitle">Mettez à jour votre mot de passe pour sécuriser votre compte</p>
    </div>

    <div class="password-card" v-if="!success">
      <form @submit.prevent="handleSubmit" class="password-form">
        <div class="form-group">
          <label class="form-label">Mot de passe actuel</label>
          <div class="input-wrapper">
            <i class="pi pi-lock input-icon"></i>
            <InputText
              :type="showOld ? 'text' : 'password'"
              v-model="form.old_password"
              placeholder="Votre mot de passe actuel"
              class="form-input"
            />
            <button type="button" class="toggle-btn" @click="showOld = !showOld">
              <i :class="showOld ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Nouveau mot de passe</label>
          <div class="input-wrapper">
            <i class="pi pi-shield input-icon"></i>
            <InputText
              :type="showNew ? 'text' : 'password'"
              v-model="form.new_password"
              placeholder="Minimum 8 caractères"
              class="form-input"
              :class="{ error: form.new_password && form.new_password.length < 8 }"
            />
            <button type="button" class="toggle-btn" @click="showNew = !showNew">
              <i :class="showNew ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
          <div v-if="form.new_password" class="strength-bar">
            <div class="strength-fill" :class="strengthClass" :style="{ width: strengthPercent + '%' }"></div>
          </div>
          <small v-if="form.new_password" class="strength-text" :class="strengthClass">{{ strengthLabel }}</small>
        </div>

        <div class="form-group">
          <label class="form-label">Confirmer le nouveau mot de passe</label>
          <div class="input-wrapper">
            <i class="pi pi-check-circle input-icon"></i>
            <InputText
              :type="showConfirm ? 'text' : 'password'"
              v-model="confirmPassword"
              placeholder="Retapez le nouveau mot de passe"
              class="form-input"
              :class="{ error: confirmPassword && form.new_password !== confirmPassword }"
            />
            <button type="button" class="toggle-btn" @click="showConfirm = !showConfirm">
              <i :class="showConfirm ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
          <small v-if="confirmPassword && form.new_password !== confirmPassword" class="error-text">
            Les mots de passe ne correspondent pas
          </small>
        </div>

        <small v-if="errorMessage" class="error-text">{{ errorMessage }}</small>

        <Button
          type="submit"
          :loading="loading"
          :label="loading ? 'Mise à jour...' : 'Modifier le mot de passe'"
          icon="pi pi-check"
          class="submit-button"
          :disabled="!isValid"
        />
      </form>
    </div>

    <div class="password-card success-card" v-else>
      <div class="success-icon">
        <i class="pi pi-check-circle"></i>
      </div>
      <h2 class="success-title">Mot de passe modifié</h2>
      <p class="success-text">
        Votre mot de passe a été modifié avec succès.
      </p>
      <Button
        label="Retour au profil"
        icon="pi pi-arrow-left"
        class="submit-button"
        @click="$router.push('/profile')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/features/auth'

const authStore = useAuthStore()

const form = ref({
  old_password: '',
  new_password: '',
})
const confirmPassword = ref('')
const showOld = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const success = ref(false)
const errorMessage = ref('')

const passwordStrength = computed(() => {
  const p = form.value.new_password
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
    form.value.old_password &&
    form.value.new_password.length >= 8 &&
    form.value.new_password === confirmPassword.value
  )
})

const handleSubmit = async () => {
  if (!isValid.value) return
  errorMessage.value = ''
  loading.value = true

  try {
    const result = await authStore.changePassword({
      old_password: form.value.old_password,
      new_password: form.value.new_password,
      confirm_password: form.value.new_password,
    })
    if (result.success) {
      success.value = true
    } else {
      errorMessage.value = result.error || 'Erreur lors de la modification du mot de passe.'
    }
  } catch (err) {
    errorMessage.value = 'Erreur lors de la modification du mot de passe.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.change-password-container {
  max-width: 560px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0B2B3C;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: 0.95rem;
  color: #64748b;
}

.password-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  padding: 2rem;
}

.password-form {
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

.success-card {
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

.success-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #0B2B3C;
  margin-bottom: 0.5rem;
}

.success-text {
  color: #64748b;
  margin-bottom: 1.5rem;
}
</style>
