<template>
  <form class="login-form" @submit.prevent="handleSubmit" novalidate>
    <div class="form-group">
      <label class="form-label">Identifiant</label>
      <div class="input-wrapper">
        <i class="pi pi-user input-icon"></i>
        <InputText
          v-model="formData.username"
          placeholder="Entrez votre identifiant"
          class="form-input"
          :class="{ error: showErrors && requestErrors.length > 0 }"
          type="text"
        />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Mot de passe</label>
      <div class="input-wrapper">
        <i class="pi pi-lock input-icon"></i>
        <InputText
          :type="passwordType"
          v-model="formData.password"
          placeholder="Entrez votre mot de passe"
          class="form-input"
          :class="{ error: showErrors && requestErrors.length > 0 }"
        />
        <button type="button" @click="togglePassword" class="password-toggle">
          <i :class="isSlashed ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
        </button>
      </div>
    </div>

    <div class="forgot-password-row">
      <router-link to="/forgot-password" class="forgot-link">
        Mot de passe oublié ?
      </router-link>
    </div>

    <Button
      type="submit"
      :loading="loading"
      :label="loading ? 'Connexion en cours...' : 'Se connecter'"
      icon="pi pi-sign-in"
      iconPos="left"
      loadingIcon="pi pi-spin pi-spinner"
      class="login-button"
      :disabled="!formData.username || !formData.password"
    />
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'


const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  requestErrors: {
    type: Array,
    default: () => []
  },
  showErrors: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit'])

const formData = ref({
  username: '',
  password: ''
})

const passwordType = ref('password')
const isSlashed = ref(true)

const togglePassword = () => {
  passwordType.value = passwordType.value === 'password' ? 'text' : 'password'
  isSlashed.value = !isSlashed.value
}

const handleSubmit = () => {
  // Validation côté client
  if (!formData.value.username || !formData.value.password) {
    return
  }
  
  // Empêcher les soumissions multiples
  if (props.loading) {
    return
  }
  
  emit('submit', formData.value)
}

// Exposer les méthodes pour le parent
defineExpose({
  formData
})
</script>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0B2B3C;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  padding: 1.125rem 1rem 1.125rem 2.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  background-color: #ffffff;
  color: #0B2B3C;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.form-input:focus {
  outline: none;
  border-color: #7AC943;
  box-shadow: 0 0 0 3px rgba(122, 201, 67, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.form-input::placeholder {
  color: #94a3b8;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: #64748b;
}

.login-button {
  width: 100%;
  padding: 1rem;
  background: #0B2B3C;
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.2);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Style pour le bouton en état loading */
.login-button :deep(.p-button-loading-icon) {
  font-size: 1.2rem;
}

.login-button :deep(.p-button-label) {
  font-weight: 600;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.forgot-password-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -0.75rem;
}

.forgot-link {
  font-size: 0.85rem;
  color: #64748b;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #0B2B3C;
  text-decoration: underline;
}
</style> 