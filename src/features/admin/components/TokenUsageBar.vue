<template>
  <div class="token-usage-bar" :class="{ 'is-alert': usage?.is_alert, 'is-exceeded': usage?.is_quota_exceeded }">
    <div class="usage-header">
      <span class="usage-label">Credits IA</span>
      <span class="usage-value">{{ formatTokens(usage?.monthly_tokens_used || 0) }} / {{ formatTokens(usage?.monthly_token_limit || 0) }}</span>
    </div>
    <div class="progress-track">
      <div
        class="progress-fill"
        :style="{ width: Math.min(usage?.usage_pct || 0, 100) + '%' }"
        :class="progressClass"
      ></div>
      <div
        v-if="usage?.alert_threshold_pct"
        class="threshold-marker"
        :style="{ left: (100 - usage.alert_threshold_pct) + '%' }"
      >
        <div class="threshold-line"></div>
      </div>
    </div>
    <div class="usage-footer">
      <span class="usage-pct" :class="progressClass">{{ usage?.usage_pct || 0 }}% utilise</span>
      <span v-if="usage?.is_quota_exceeded" class="usage-status status-exceeded">Quota depasse</span>
      <span v-else-if="usage?.is_alert" class="usage-status status-alert">{{ usage?.remaining_pct }}% restant</span>
      <span v-else class="usage-status status-ok">{{ usage?.remaining_pct }}% restant</span>
    </div>
    <div v-if="showDetails" class="usage-details">
      <div class="detail-row">
        <span class="detail-label">Aujourd'hui</span>
        <span class="detail-value">{{ formatTokens(usage?.daily_tokens_used || 0) }} / {{ formatTokens(usage?.daily_token_limit || 0) }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Projection mensuelle</span>
        <span class="detail-value" :class="{ 'text-danger': (usage?.projected_monthly || 0) > (usage?.monthly_token_limit || 0) }">
          {{ formatTokens(usage?.projected_monthly || 0) }}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Jour {{ usage?.days_elapsed }} / {{ usage?.days_in_month }}</span>
        <span class="detail-value">{{ usage?.provider || 'Non configure' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  usage: { type: Object, default: null },
  showDetails: { type: Boolean, default: false }
})

const progressClass = computed(() => {
  const pct = props.usage?.usage_pct || 0
  if (pct >= 90) return 'danger'
  if (pct >= 70) return 'warning'
  return 'ok'
})

const formatTokens = (count) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
  if (count >= 1000) return (count / 1000).toFixed(0) + 'k'
  return count.toString()
}
</script>

<style scoped>
.token-usage-bar {
  padding: 0.75rem;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.token-usage-bar.is-alert {
  border-color: #fbbf24;
  background: #fffbeb;
}

.token-usage-bar.is-exceeded {
  border-color: #ef4444;
  background: #fef2f2;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.usage-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.usage-value {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0B2B3C;
}

.progress-track {
  position: relative;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: visible;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-fill.ok { background: #7AC943; }
.progress-fill.warning { background: #f59e0b; }
.progress-fill.danger { background: #ef4444; }

.threshold-marker {
  position: absolute;
  top: -3px;
  transform: translateX(-50%);
  z-index: 1;
}

.threshold-line {
  width: 2px;
  height: 14px;
  background: #94a3b8;
  border-radius: 1px;
}

.usage-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.375rem;
}

.usage-pct {
  font-size: 0.75rem;
  font-weight: 500;
}

.usage-pct.ok { color: #7AC943; }
.usage-pct.warning { color: #d97706; }
.usage-pct.danger { color: #ef4444; }

.usage-status {
  font-size: 0.75rem;
  font-weight: 500;
}

.status-ok { color: #64748b; }
.status-alert { color: #d97706; }
.status-exceeded { color: #ef4444; font-weight: 600; }

.usage-details {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 0.75rem;
  color: #64748b;
}

.detail-value {
  font-size: 0.75rem;
  font-weight: 500;
  color: #334155;
}

.text-danger {
  color: #ef4444;
}
</style>
