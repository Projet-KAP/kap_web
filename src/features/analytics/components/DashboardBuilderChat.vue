<template>
  <div class="dashboard-builder-chat">
    <!-- Fullscreen Chat Overlay -->
    <Transition name="chat-overlay">
      <div v-if="isOpen" class="chat-overlay">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-left">
            <Button
              icon="pi pi-bars"
              text
              rounded
              @click="showSidebar = !showSidebar"
              v-tooltip.bottom="'Historique'"
              class="sidebar-toggle"
            />
            <i class="pi pi-sparkles"></i>
            <span class="header-title">Construction intelligente</span>
          </div>
          <div class="header-actions">
            <Button
              icon="pi pi-plus"
              text
              rounded
              @click="startNewConversation"
              v-tooltip.bottom="'Nouvelle conversation'"
            />
            <Button
              icon="pi pi-times"
              text
              rounded
              @click="closeChat"
              v-tooltip.bottom="'Fermer'"
            />
          </div>
        </div>

        <!-- Main Layout with Sidebar -->
        <div class="chat-layout">
          <!-- Conversations Sidebar -->
          <Transition name="sidebar">
            <div v-if="showSidebar" class="conversations-sidebar">
              <div class="sidebar-header">
                <span>Historique</span>
                <Button
                  icon="pi pi-refresh"
                  text
                  rounded
                  size="small"
                  @click="loadConversations"
                  :loading="loadingConversations"
                />
              </div>
              <div class="conversations-list">
                <div
                  v-for="conv in conversations"
                  :key="conv.id"
                  class="conversation-item"
                  :class="{ active: currentConversation?.id === conv.id }"
                  @click="selectConversation(conv)"
                >
                  <div class="conv-main">
                    <div class="conv-title">{{ conv.title || 'Conversation' }}</div>
                    <div class="conv-date">{{ formatDate(conv.last_message_at || conv.created_at) }}</div>
                  </div>
                  <div class="conv-actions" @click.stop>
                    <button class="conv-action-btn" @click="renameConversation(conv)" title="Renommer">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="conv-action-btn conv-action-delete" @click="deleteConversation(conv)" title="Supprimer">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </div>
                <div v-if="conversations.length === 0 && !loadingConversations" class="no-conversations">
                  Aucune conversation
                </div>
              </div>
            </div>
          </Transition>

          <!-- Chat Content -->
          <div class="chat-content">
          <!-- Messages Area -->
          <div class="chat-messages" ref="messagesContainer">
            <!-- Welcome Message (only on initial load with no messages) -->
            <Transition name="fade">
              <div v-if="isInitialLoad && messages.length === 0" class="welcome-message">
                <i class="pi pi-sparkles"></i>
                <p>Décrivez le tableau de bord que vous souhaitez créer</p>
              </div>
            </Transition>

            <!-- Message List -->
            <template v-for="message in messages" :key="message.id">
              <!-- User Message -->
              <div v-if="message.role === 'USER'" class="message user">
                <div class="message-bubble">{{ message.content }}</div>
              </div>

              <!-- Assistant Message -->
              <div v-else class="message assistant">
                <div class="message-avatar">
                  <i class="pi pi-sparkles"></i>
                </div>
                <div class="message-bubble">
                  <div v-html="formatMessage(message.content)"></div>

                  <!-- Actions performed -->
                  <div v-if="message.metadata?.actions_performed?.length" class="actions-list">
                    <div
                      v-for="(action, idx) in message.metadata.actions_performed"
                      :key="idx"
                      class="action-item"
                    >
                      <i :class="getActionIcon(action)"></i>
                      <span>{{ getActionText(action) }}</span>
                      <Button
                        v-if="action.type === 'dashboard'"
                        icon="pi pi-external-link"
                        text
                        rounded
                        size="small"
                        @click="$emit('open-dashboard', action.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Loading -->
            <div v-if="sending" class="message assistant">
              <div class="message-avatar">
                <i class="pi pi-sparkles"></i>
              </div>
              <div class="message-bubble loading">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="chat-input">
            <Textarea
              v-model="inputMessage"
              placeholder="Ex. : crée un tableau de bord de production avec le TRS, la qualité et un graphique de tendances..."
              :autoResize="true"
              rows="3"
              :disabled="sending"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <Button
              icon="pi pi-send"
              :loading="sending"
              :disabled="!inputMessage.trim() || sending"
              @click="sendMessage"
              class="send-btn"
            />
          </div>
        </div>
        </div> <!-- End chat-layout -->
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick, onUnmounted, onMounted } from 'vue'
import { axiosInstance } from '@/main.js'

// Emits
const emit = defineEmits(['open-dashboard', 'dashboard-updated'])

// State
const isOpen = ref(false)
const inputMessage = ref('')
const messagesContainer = ref(null)
const sending = ref(false)
const currentConversation = ref(null)
const messages = ref([])
const isInitialLoad = ref(true)
const showSidebar = ref(false)
const conversations = ref([])
const loadingConversations = ref(false)

// Methods
const openChat = () => {
  isOpen.value = true
  loadConversations()
}

const closeChat = () => {
  isOpen.value = false
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return 'Hier'
  } else if (days < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'long' })
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const loadConversations = async () => {
  loadingConversations.value = true
  try {
    const response = await axiosInstance.get('ai/dashboard-builder/')
    conversations.value = response.data.results || response.data || []
  } catch (err) {
    console.error('Erreur chargement conversations:', err)
  } finally {
    loadingConversations.value = false
  }
}

const selectConversation = async (conv) => {
  currentConversation.value = conv
  isInitialLoad.value = false
  showSidebar.value = false

  // Load messages for this conversation
  try {
    const response = await axiosInstance.get(`ai/dashboard-builder/${conv.id}/messages/`)
    messages.value = (response.data || []).map(msg => ({
      ...msg,
      id: msg.id || `msg-${Date.now()}-${Math.random()}`
    }))
    scrollToBottom(false)
  } catch (err) {
    console.error('Erreur chargement messages:', err)
    messages.value = []
  }
}

const formatMessage = (content) => {
  if (!content) return ''
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

const getActionIcon = (action) => {
  if (action.type === 'dashboard') {
    return action.action === 'created' ? 'pi pi-plus-circle' : 'pi pi-pencil'
  }
  return 'pi pi-check'
}

const getActionText = (action) => {
  if (action.type === 'dashboard') {
    return action.action === 'created' ? `Tableau de bord #${action.id} créé` : `Tableau de bord #${action.id} modifié`
  }
  return 'Action effectuee'
}

// Debounced scroll to prevent flickering
let scrollTimeout = null
const scrollToBottom = (smooth = true) => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  scrollTimeout = setTimeout(async () => {
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant'
      })
    }
  }, 50)
}

onUnmounted(() => {
  if (scrollTimeout) clearTimeout(scrollTimeout)
})

// API
const createConversation = async () => {
  const response = await axiosInstance.post('ai/dashboard-builder/', {
    context_type: 'DASHBOARD_BUILDER',
    title: 'Creation de Dashboard'
  })
  currentConversation.value = response.data
  // Don't clear messages here - they're managed by sendMessage
  console.log('Conversation creee:', response.data)
  return response.data
}

const sendMessage = async () => {
  const content = inputMessage.value.trim()
  if (!content || sending.value) return

  // Clear input and set sending state immediately
  inputMessage.value = ''
  sending.value = true

  // Mark as first message sent (hides welcome message permanently)
  isInitialLoad.value = false

  try {
    // Create conversation FIRST if needed (before adding message to UI)
    if (!currentConversation.value || !currentConversation.value.id) {
      const conv = await createConversation()
      if (!conv || !conv.id) {
        throw new Error('Impossible de créer la conversation')
      }
    }

    // Now add user message to UI (after conversation exists)
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'USER',
      content
    }
    messages.value.push(userMsg)
    scrollToBottom(false) // instant scroll for user message

    const conversationId = currentConversation.value.id
    console.log('Envoi au chat:', conversationId)

    // Longer timeout for AI operations (5 minutes)
    const response = await axiosInstance.post(
      `ai/dashboard-builder/${conversationId}/chat/`,
      { content },
      { timeout: 300000 }
    )

    // Add assistant message
    if (response.data.message) {
      messages.value.push({
        ...response.data.message,
        id: response.data.message.id || `assistant-${Date.now()}`
      })
    }

    if (response.data.actions_performed?.length) {
      emit('dashboard-updated', response.data.actions_performed)
    }

    // Smooth scroll after assistant response
    scrollToBottom(true)

    // Refresh conversation list
    loadConversations()
  } catch (err) {
    console.error('Erreur:', err)
    messages.value.push({
      id: `error-${Date.now()}`,
      role: 'ASSISTANT',
      content: 'Desole, une erreur s\'est produite. Veuillez reessayer.'
    })
    scrollToBottom(true)
  } finally {
    sending.value = false
  }
}

const renameConversation = async (conv) => {
  const newTitle = prompt('Renommer la conversation :', conv.title || 'Conversation')
  if (!newTitle || newTitle === conv.title) return

  try {
    await axiosInstance.patch(`ai/dashboard-builder/${conv.id}/`, { title: newTitle })
    conv.title = newTitle
  } catch (err) {
    console.error('Erreur renommage:', err)
  }
}

const deleteConversation = async (conv) => {
  if (!confirm('Supprimer cette conversation ?')) return

  try {
    await axiosInstance.delete(`ai/dashboard-builder/${conv.id}/`)
    conversations.value = conversations.value.filter(c => c.id !== conv.id)
    if (currentConversation.value?.id === conv.id) {
      currentConversation.value = null
      messages.value = []
      isInitialLoad.value = true
    }
  } catch (err) {
    console.error('Erreur suppression:', err)
  }
}

const startNewConversation = () => {
  currentConversation.value = null
  messages.value = []
  isInitialLoad.value = true
  loadConversations() // Refresh the list
}

defineExpose({ openChat, closeChat })
</script>

<style scoped lang="scss">
.chat-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--surface-ground);
  display: flex;
  flex-direction: column;
}

// Header
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--primary-color);
  color: white;

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    i {
      font-size: 1.25rem;
    }

    .header-title {
      font-weight: 600;
      font-size: 1.1rem;
    }
  }

  .header-actions {
    display: flex;
    gap: 0.25rem;

    :deep(.p-button) {
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
      }
    }
  }
}

// Layout with sidebar
.chat-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// Sidebar
.conversations-sidebar {
  width: 280px;
  background: var(--surface-card);
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .sidebar-header {
    padding: 1rem;
    border-bottom: 1px solid var(--surface-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
  }

  .conversations-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .conversation-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    margin-bottom: 0.25rem;
    transition: background-color 0.15s;

    &:hover {
      background: var(--surface-hover);

      .conv-actions { opacity: 1; }
    }

    &.active {
      background: var(--primary-50);
      border-left: 3px solid var(--primary-color);
    }

    .conv-main {
      flex: 1;
      min-width: 0;
    }

    .conv-title {
      font-weight: 500;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conv-date {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin-top: 0.25rem;
    }

    .conv-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.15s;
    }

    .conv-action-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      color: var(--text-color-secondary);
      font-size: 0.75rem;

      &:hover { background: var(--surface-200); color: var(--text-color); }
    }

    .conv-action-delete:hover { color: var(--red-500); }

    .conv-preview {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin-top: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .no-conversations {
    text-align: center;
    color: var(--text-color-secondary);
    padding: 2rem 1rem;
    font-size: 0.9rem;
  }
}

// Content
.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem;
  overflow: hidden;
}

// Messages
.chat-messages {
  position: relative;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1rem;
  scroll-behavior: smooth;
  overscroll-behavior: contain;
}

.welcome-message {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-color-secondary);
  text-align: center;
  pointer-events: none;

  i {
    font-size: 3rem;
    color: var(--primary-color);
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.1rem;
    margin: 0;
  }
}

.message {
  display: flex;
  gap: 0.75rem;
  max-width: 80%;

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;

    .message-bubble {
      background: var(--primary-color);
      color: white;
      border-radius: 1rem 1rem 0.25rem 1rem;
    }
  }

  &.assistant {
    align-self: flex-start;

    .message-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary-100);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        color: var(--primary-color);
      }
    }

    .message-bubble {
      background: var(--surface-card);
      border-radius: 1rem 1rem 1rem 0.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

      &.loading {
        display: flex;
        gap: 4px;
        padding: 1rem 1.25rem;

        span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-color-secondary);
          animation: bounce 1.4s infinite ease-in-out both;

          &:nth-child(1) { animation-delay: -0.32s; }
          &:nth-child(2) { animation-delay: -0.16s; }
        }
      }
    }
  }
}

.message-bubble {
  padding: 0.875rem 1rem;
  line-height: 1.5;
  font-size: 0.95rem;
}

.actions-list {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .action-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--primary-50);
    border-radius: 0.5rem;
    font-size: 0.85rem;
    color: var(--primary-700);

    i {
      font-size: 0.9rem;
    }

    :deep(.p-button) {
      margin-left: auto;
      width: 28px;
      height: 28px;
    }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

// Input
.chat-input {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);

  :deep(.p-textarea) {
    flex: 1;
    resize: none;
    border-radius: 0.75rem;
    font-size: 1rem;
    min-height: 80px;
    max-height: 200px;
  }

  .send-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }
}

// Transitions
.chat-overlay-enter-active,
.chat-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.chat-overlay-enter-from,
.chat-overlay-leave-to {
  opacity: 0;
}

// Sidebar transition
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

// Sidebar toggle button style
.sidebar-toggle {
  :deep(.p-button) {
    color: white;
  }
}

// Fade transition for welcome message
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Message appearance animation
.message {
  animation: messageAppear 0.2s ease-out;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
