<template>
  <div class="actions-card">
    <h2>Actions</h2>
    <div class="action-buttons">
      <Button 
        @click="logout" 
        severity="danger" 
        icon="pi pi-sign-out"
        label="Se déconnecter"
      />
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/features/auth'


const authStore = useAuthStore()

const logout = async () => {
  await authStore.logout()
}
</script>

<style scoped>
.actions-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.actions-card h2 {
  color: #0B2B3C;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
</style> 