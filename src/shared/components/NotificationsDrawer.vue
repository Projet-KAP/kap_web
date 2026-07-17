<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :style="{ width: '480px' }"
    :dismissable="true"
    class="notifications-drawer"
  >
    <template #header>
      <div class="drawer-header-content">
        <div class="header-left">
          <i class="pi pi-bell"></i>
          <h2>Notifications</h2>
          <Badge v-if="unreadCount > 0" :value="unreadCount" severity="danger" />
        </div>
        <div class="header-actions">
          <Button
            v-if="unreadCount > 0"
            label="Tout marquer comme lu"
            text
            size="small"
            @click="markAllAsRead"
          />
        </div>
      </div>
    </template>

    <div class="notifications-container">
      <!-- Filtres -->
      <div class="filters-section">
        <SelectButton
          v-model="selectedFilter"
          :options="filterOptions"
          optionLabel="label"
          optionValue="value"
          class="filter-buttons"
        />
      </div>

      <!-- Liste des notifications -->
      <div v-if="filteredNotifications.length > 0" class="notifications-list">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          class="notification-card"
          :class="{ 'unread': !notification.read, [`type-${notification.type}`]: true }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-indicator" :class="`severity-${notification.severity}`"></div>

          <div class="notification-icon" :class="`type-${notification.type}`">
            <i :class="getNotificationIcon(notification.type)"></i>
          </div>

          <div class="notification-content">
            <div class="notification-header">
              <h4>{{ notification.title }}</h4>
              <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
            </div>
            <p class="notification-message">{{ notification.message }}</p>

            <div v-if="notification.metadata" class="notification-meta">
              <Tag
                v-if="notification.metadata.category"
                :value="notification.metadata.category"
                severity="info"
                size="small"
              />
            </div>
          </div>

          <div class="notification-actions">
            <Button
              v-if="!notification.read"
              icon="pi pi-check"
              text
              rounded
              size="small"
              @click.stop="markAsRead(notification.id)"
              v-tooltip="'Marquer comme lu'"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click.stop="deleteNotification(notification.id)"
              v-tooltip="'Supprimer'"
            />
          </div>
        </div>
      </div>

      <!-- État vide -->
      <div v-else class="empty-state">
        <i class="pi pi-bell-slash"></i>
        <h3>Aucune notification</h3>
        <p>Vous n'avez pas de notifications {{ selectedFilter === 'all' ? '' : selectedFilter === 'unread' ? 'non lues' : 'lues' }}</p>
      </div>
    </div>
  </Drawer>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '@/stores/notificationsStore.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const notificationsStore = useNotificationsStore()
const { notifications, loading } = storeToRefs(notificationsStore)
const selectedFilter = ref('all')

const filterOptions = [
  { label: 'Toutes', value: 'all' },
  { label: 'Non lues', value: 'unread' },
  { label: 'Lues', value: 'read' }
]

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formattedNotifications = computed(() => {
  return notifications.value.map(notif => ({
    id: notif.id,
    type: getTypeFromNotificationType(notif.notification_type),
    severity: notif.severity,
    title: notif.title,
    message: notif.message,
    timestamp: notif.created_at,
    read: notif.read,
    metadata: {
      category: getCategoryLabel(notif.notification_type),
      link: notif.link,
      ...(notif.metadata || {})
    }
  }))
})

const filteredNotifications = computed(() => {
  if (selectedFilter.value === 'all') {
    return formattedNotifications.value
  } else if (selectedFilter.value === 'unread') {
    return formattedNotifications.value.filter(n => !n.read)
  } else {
    return formattedNotifications.value.filter(n => n.read)
  }
})

const unreadCount = computed(() => notificationsStore.unreadCount)

const loadNotifications = async () => {
  await notificationsStore.loadNotifications()
}

const getTypeFromNotificationType = (notificationType) => {
  const typeMap = {
    'COLLECT': 'success',
    'MAINTENANCE': 'warning',
    'SYSTEM': 'info',
    'USER': 'user',
    'ENGIN': 'error',
    'DOCUMENT': 'document',
    'ALERT': 'error',
    'TEAM': 'info',
    'ROI': 'info',
    'STOCK': 'warning'
  }
  return typeMap[notificationType] || 'info'
}

const getCategoryLabel = (notificationType) => {
  const categoryMap = {
    'COLLECT': 'Collect',
    'MAINTENANCE': 'Maintenance',
    'SYSTEM': 'Système',
    'USER': 'Utilisateurs',
    'ENGIN': 'Engins',
    'DOCUMENT': 'Documents',
    'ALERT': 'Alertes',
    'TEAM': 'Équipes',
    'ROI': 'ROI',
    'STOCK': 'Stock'
  }
  return categoryMap[notificationType] || 'Info'
}

const getNotificationIcon = (type) => {
  const icons = {
    success: 'pi-check-circle',
    warning: 'pi-exclamation-triangle',
    error: 'pi-times-circle',
    info: 'pi-info-circle',
    user: 'pi-user-plus',
    machine: 'pi-wrench',
    document: 'pi-file'
  }
  return `pi ${icons[type] || 'pi-bell'}`
}

const formatTime = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = Math.floor((now - time) / 1000) // différence en secondes

  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`
  return time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const handleNotificationClick = async (notification) => {
  if (!notification.read) {
    await markAsRead(notification.id)
  }

  if (notification.metadata?.link) {
    router.push(notification.metadata.link)
    visible.value = false
  }
}

const markAsRead = async (id) => {
  await notificationsStore.markAsRead(id)
}

const markAllAsRead = async () => {
  await notificationsStore.markAllAsRead()
}

const deleteNotification = async (id) => {
  await notificationsStore.deleteNotification(id)
}

onMounted(() => {
  loadNotifications()
})

// Recharger quand le drawer s'ouvre
watch(visible, (newValue) => {
  if (newValue) {
    loadNotifications()
  }
})
</script>

<style scoped>
.drawer-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-left i {
  color: #059669;
  font-size: 1.5rem;
}

.header-left h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.notifications-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filters-section {
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
}

.filter-buttons :deep(.p-selectbutton) {
  display: flex;
  width: 100%;
}

.filter-buttons :deep(.p-button) {
  flex: 1;
}

.notifications-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notification-card {
  position: relative;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-card:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateX(4px);
}

.notification-card.unread {
  background: #f0fdf4;
  border-color: #059669;
}

.notification-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  border-radius: 0 4px 4px 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notification-card.unread .notification-indicator {
  opacity: 1;
}

.notification-indicator.severity-danger {
  background: #dc2626;
}

.notification-indicator.severity-warning {
  background: #f59e0b;
}

.notification-indicator.severity-info {
  background: #059669;
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex-shrink: 0;
}

.notification-icon.type-success {
  background: #dcfce7;
  color: #059669;
}

.notification-icon.type-warning {
  background: #fef3c7;
  color: #f59e0b;
}

.notification-icon.type-error {
  background: #fee2e2;
  color: #dc2626;
}

.notification-icon.type-info {
  background: #dbeafe;
  color: #3b82f6;
}

.notification-icon.type-user {
  background: #f3e8ff;
  color: #3b82f6;
}

.notification-icon.type-machine {
  background: #e0f2fe;
  color: #0284c7;
}

.notification-icon i {
  font-size: 1.25rem;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.notification-header h4 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
}

.notification-time {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
}

.notification-message {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.notification-meta {
  margin-top: 0.5rem;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notification-card:hover .notification-actions {
  opacity: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-state i {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
}
</style>
