<template>
  <div class="login-card">
    <div class="login-header">
      <h3 class="login-title">Connexion</h3>
      <p class="login-subtitle">Accédez à votre espace de travail</p>
    </div>

    <LoginForm
      :loading="loading"
      :request-errors="requestErrors"
      :show-errors="showErrors"
      @submit="handleSubmit"
    />

    <ErrorMessage
      :errors="requestErrors"
      :show="showErrors"
    />
  </div>
</template>

<script setup>
import LoginForm from './LoginForm.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

defineProps({
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

const handleSubmit = (formData) => {
  emit('submit', formData)
}
</script>

<style scoped>
.login-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 20px 40px -10px rgba(11, 43, 60, 0.15);
  width: 100%;
  max-width: 420px;
  border: 2px solid #7AC943;
  position: relative;
  overflow: hidden;
  transform: translateY(0);
  transition: all 0.3s ease;
}

.login-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 25px 50px -10px rgba(11, 43, 60, 0.2),
    0 0 0 1px rgba(122, 201, 67, 0.1);
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(
    90deg,
    #0B2B3C,
    #7AC943,
    #0B2B3C
  );
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 3rem;
  padding-top: 1rem;
}

.login-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #0B2B3C;
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.02em;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.login-subtitle {
  font-size: 1.125rem;
  color: #7AC943;
  margin: 0;
  font-weight: 600;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style> 