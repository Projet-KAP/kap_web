<template>
  <div class="stats-bar">
    <div class="stat-item">
      <span class="stat-value">{{ userStats?.total_users || userStats?.total || 0 }}</span>
      <span class="stat-label">Utilisateurs</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-value accent">{{ userStats?.active_users || userStats?.active || 0 }}</span>
      <span class="stat-label">Actifs</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-value muted">{{ userStats?.inactive_users || 0 }}</span>
      <span class="stat-label">Inactifs</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-value">{{ compteStats?.total_comptes || 0 }}</span>
      <span class="stat-label">Comptes</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  userStats: {
    type: Object,
    default: () => ({})
  },
  compteStats: {
    type: Object,
    default: () => ({})
  },
  showTrends: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.stats-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--kap-blue);
}

.stat-value.accent {
  color: var(--kap-green);
}

.stat-value.muted {
  color: #9ca3af;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.stat-divider {
  width: 1px;
  height: 1.25rem;
  background: #e5e7eb;
}

@media (max-width: 640px) {
  .stats-bar {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .stat-divider {
    display: none;
  }

  .stat-item {
    flex: 1 1 auto;
    min-width: 80px;
  }
}
</style>
