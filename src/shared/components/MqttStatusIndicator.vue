<template>
  <div
    class="mqtt-status-indicator"
    :class="statusClass"
    v-tooltip.bottom="tooltipContent"
    @click="handleClick"
  >
    <div class="status-dot" :class="{ pulse: statusClass === 'disconnected' || statusClass === 'unavailable' }"></div>
    <span class="status-label">{{ statusLabel }}</span>
    <i v-if="loading" class="pi pi-spin pi-spinner loading-icon"></i>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMqttStore } from '@/stores/mqttStore.js'
import { useToast } from 'primevue/usetoast'

const mqttStore = useMqttStore()
const toast = useToast()
const { connected, receivingData, lastMessageTime, messageCount, devicesTotal, devicesOnline, loading, error, lastCheck } = storeToRefs(mqttStore)

const statusClass = computed(() => {
  if (loading.value) return 'checking'
  if (devicesTotal.value === 0) return 'no_devices'
  if (!connected.value) return 'disconnected'
  if (!receivingData.value) return 'unavailable'
  return 'connected'
})

const statusLabel = computed(() => {
  if (loading.value) return 'Capteurs...'
  return 'Capteurs'
})

const tooltipContent = computed(() => {
  if (loading.value) {
    return 'Verification de la connexion aux capteurs...'
  }

  if (devicesTotal.value === 0) {
    return 'Aucun capteur configure pour ce compte'
  }

  const deviceInfo = `${devicesOnline.value}/${devicesTotal.value} capteur(s) en ligne`

  if (!connected.value) {
    return `Capteurs deconnectes\n${deviceInfo}\nCliquez pour retablir la connexion`
  }

  if (!receivingData.value) {
    const lastMsgStr = lastMessageTime.value
      ? `Derniere donnee: ${new Date(lastMessageTime.value).toLocaleString()}`
      : 'Aucune donnee recue'
    return `Connexion etablie mais inactive\n${deviceInfo}\n${lastMsgStr}\nPas de donnees depuis 5 min`
  }

  const lastMsgStr = lastMessageTime.value
    ? `Derniere donnee: ${new Date(lastMessageTime.value).toLocaleTimeString()}`
    : ''
  return `Capteurs actifs\n${deviceInfo}\n${lastMsgStr}`.trim()
})

const handleClick = async () => {
  if (loading.value) return

  if (devicesTotal.value === 0) {
    toast.add({
      severity: 'info',
      summary: 'Aucun capteur',
      detail: 'Aucun capteur IoT configure pour votre compte',
      life: 3000
    })
    return
  }

  if (!connected.value) {
    toast.add({
      severity: 'info',
      summary: 'Reconnexion',
      detail: 'Tentative de reconnexion aux capteurs...',
      life: 2000
    })

    const result = await mqttStore.reconnect()

    if (result?.success) {
      toast.add({
        severity: 'success',
        summary: 'Capteurs connectes',
        detail: 'La connexion aux capteurs a été rétablie',
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Échec de la connexion',
        detail: error.value || 'Impossible de se connecter aux capteurs',
        life: 5000
      })
    }
  } else if (!receivingData.value) {
    // Connecte mais pas de donnees - juste rafraichir
    toast.add({
      severity: 'warn',
      summary: 'Capteurs inactifs',
      detail: 'Connexion etablie mais aucune donnee recue depuis 5 minutes',
      life: 3000
    })
    await mqttStore.checkStatus()
  } else {
    // Tout va bien - juste rafraichir le statut
    await mqttStore.checkStatus()
  }
}

onMounted(() => {
  // Démarrer la vérification automatique toutes les 30 secondes
  mqttStore.startAutoCheck(30000)
})

onUnmounted(() => {
  mqttStore.stopAutoCheck()
})
</script>

<style scoped>
.mqtt-status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.mqtt-status-indicator.connected {
  background: #d1fae5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.mqtt-status-indicator.connected:hover {
  background: #a7f3d0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);
}

.mqtt-status-indicator.disconnected {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  animation: attention 2s ease-in-out infinite;
}

.mqtt-status-indicator.disconnected:hover {
  background: #fecaca;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.25);
}

.mqtt-status-indicator.no_devices {
  background: #f1f5f9;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}

.mqtt-status-indicator.checking {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;
}

.mqtt-status-indicator.unavailable {
  background: #ffedd5;
  color: #ea580c;
  border: 1px solid #fed7aa;
  animation: attention 2s ease-in-out infinite;
}

.mqtt-status-indicator.unavailable:hover {
  background: #fed7aa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);
}

@keyframes attention {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.connected .status-dot {
  background: #059669;
  box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
}

.disconnected .status-dot {
  background: #dc2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
}

.no_devices .status-dot {
  background: #94a3b8;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.2);
}

.checking .status-dot {
  background: #d97706;
  box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2);
}

.unavailable .status-dot {
  background: #ea580c;
  box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.2);
}

.status-dot.pulse {
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
}

.status-label {
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.loading-icon {
  font-size: 0.75rem;
  margin-left: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
  .mqtt-status-indicator {
    padding: 0.25rem 0.5rem;
  }

  .status-label {
    display: none;
  }

  .status-dot {
    width: 10px;
    height: 10px;
  }
}
</style>
