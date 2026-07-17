<template>
  <div class="user-info-card">
    <h2>Informations utilisateur</h2>
    <div v-if="currentUser" class="user-details">
      <div class="user-field">
        <label>Nom complet:</label>
        <span>{{ currentUser.first_name }} {{ currentUser.last_name }}</span>
      </div>
      <div class="user-field">
        <label>Email:</label>
        <span>{{ currentUser.email_address }}</span>
      </div>
      <div class="user-field">
        <label>Rôle:</label>
        <span>{{ currentUser.role?.role_name || 'Non défini' }}</span>
      </div>
      <div class="user-field">
        <label>Statut:</label>
        <span>{{ currentUser.compte?.status || 'Non défini' }}</span>
      </div>
    </div>
    <div v-else class="no-user">
      <p>Aucune information utilisateur disponible</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/features/auth'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.getCurrentUser)
</script>

<style scoped>
.user-info-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.user-info-card h2 {
  color: #0B2B3C;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.user-field:last-child {
  border-bottom: none;
}

.user-field label {
  font-weight: 600;
  color: #374151;
  min-width: 120px;
}

.user-field span {
  color: #64748b;
  text-align: right;
}

.no-user {
  text-align: center;
  color: #64748b;
  padding: 2rem;
}

@media (max-width: 768px) {
  .user-field {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .user-field span {
    text-align: left;
  }
}
</style> 