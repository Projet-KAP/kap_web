<template>
  <div class="document-builder-chat">
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
            <i class="pi pi-file-edit"></i>
            <span class="header-title">Assistant Documents</span>
          </div>
          <div class="header-actions">
            <Button
              icon="pi pi-question-circle"
              text
              rounded
              @click="showHelpDialog = true"
              v-tooltip.bottom="'Aide'"
            />
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
                  <div class="conv-title">{{ conv.title || 'Conversation' }}</div>
                  <div class="conv-date">{{ formatDate(conv.last_message_at || conv.created_at) }}</div>
                  <div class="conv-preview" v-if="conv.last_message">{{ conv.last_message }}</div>
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
                  <i class="pi pi-file-edit"></i>
                  <p>Décrivez le modèle de document que vous souhaitez créer</p>
                  <div class="suggestions">
                    <Button
                      label="Document de production journalier"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="useSuggestion('Crée un modèle de document de production journalier avec la saisie des quantités produites par heure')"
                    />
                    <Button
                      label="Fiche de maintenance"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="useSuggestion('Cree une fiche de maintenance avec les champs: machine, type intervention, duree, pieces changees, observations')"
                    />
                    <Button
                      label="Contrôle qualité"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="useSuggestion('Crée un formulaire de contrôle qualité avec des mesures, validations et photos')"
                    />
                  </div>
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
                    <i class="pi pi-file-edit"></i>
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
                          v-if="action.type === 'document_modele'"
                          icon="pi pi-external-link"
                          text
                          rounded
                          size="small"
                          @click="$emit('open-modele', action.id)"
                          v-tooltip="'Voir le modele'"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Loading -->
              <div v-if="sending" class="message assistant">
                <div class="message-avatar">
                  <i class="pi pi-file-edit"></i>
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
                placeholder="Ex. : crée un document avec des colonnes pour chaque heure de production, avec quantités et rebuts..."
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
        </div>

        <!-- Help Dialog -->
        <Dialog v-model:visible="showHelpDialog" modal header="Aide - Assistant Documents" :style="{ width: '600px' }">
          <div class="help-content">
            <h4>Que puis-je faire ?</h4>
            <ul>
              <li>Créer des modèles de documents (formulaires/documents)</li>
              <li>Definir des champs avec differents types (texte, nombre, date, select...)</li>
              <li>Créer des colonnes répétables pour la saisie par heure/jour/poste</li>
              <li>Organiser les champs avec des groupes de colonnes (headers multi-niveaux)</li>
              <li>Publier les modeles pour utilisation par les operateurs</li>
            </ul>

            <h4>Types de champs disponibles</h4>
            <div class="field-types">
              <Tag severity="info">TEXT</Tag>
              <Tag severity="info">NUMBER</Tag>
              <Tag severity="info">DATE</Tag>
              <Tag severity="info">SELECT</Tag>
              <Tag severity="info">CHECKBOX</Tag>
              <Tag severity="info">PHOTO</Tag>
              <Tag severity="info">SIGNATURE</Tag>
            </div>

            <h4>Exemples de demandes</h4>
            <ul class="examples">
              <li>"Cree un document de production avec la saisie par heure sur 8 heures"</li>
              <li>"Ajoute un champ obligatoire pour le numéro de lot"</li>
              <li>"Crée un groupe de colonnes 'Qualité' avec défauts et score"</li>
              <li>"Liste mes modeles de documents"</li>
              <li>"Publie le modèle que tu viens de créer"</li>
            </ul>
          </div>
        </Dialog>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick, onUnmounted } from 'vue'
import { axiosInstance } from '@/main.js'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'

// Emits
const emit = defineEmits(['open-modele', 'modele-updated', 'modele-created'])

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
const showHelpDialog = ref(false)

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
    const response = await axiosInstance.get('ai/document-builder/')
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
    const response = await axiosInstance.get(`ai/document-builder/${conv.id}/messages/`)
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
  if (action.type === 'document_modele') {
    return action.action === 'created' ? 'pi pi-plus-circle' : 'pi pi-pencil'
  }
  if (action.type === 'document_field') {
    return action.action === 'added' ? 'pi pi-plus' : 'pi pi-pencil'
  }
  if (action.type === 'column_group') {
    return 'pi pi-table'
  }
  return 'pi pi-check'
}

const getActionText = (action) => {
  if (action.type === 'document_modele') {
    if (action.action === 'created') {
      return `Modele "${action.nom}" cree (ID: ${action.id})`
    }
    return `Modele "${action.nom}" modifie`
  }
  if (action.type === 'document_field') {
    if (action.action === 'added') {
      return `Champ "${action.label}" ajoute`
    }
    return `Champ "${action.label}" modifie`
  }
  if (action.type === 'column_group') {
    return `Groupe "${action.label}" cree`
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

// Use suggestion
const useSuggestion = (suggestion) => {
  inputMessage.value = suggestion
}

// API
const createConversation = async () => {
  const response = await axiosInstance.post('ai/document-builder/', {
    context_type: 'DOCUMENT_BUILDER',
    title: 'Creation de Document'
  })
  currentConversation.value = response.data
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
      `ai/document-builder/${conversationId}/chat/`,
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

    // Emit events for actions performed
    if (response.data.actions_performed?.length) {
      emit('modele-updated', response.data.actions_performed)

      // Check if a new modele was created
      const createdModele = response.data.actions_performed.find(
        a => a.type === 'document_modele' && a.action === 'created'
      )
      if (createdModele) {
        emit('modele-created', createdModele)
      }
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
    padding: 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    margin-bottom: 0.25rem;
    transition: background-color 0.15s;

    &:hover {
      background: var(--surface-hover);
    }

    &.active {
      background: var(--primary-50);
      border-left: 3px solid var(--primary-color);
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
  pointer-events: auto;

  i {
    font-size: 3rem;
    color: var(--primary-color);
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.1rem;
    margin: 0 0 1.5rem 0;
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    max-width: 600px;
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

// Help dialog
.help-content {
  h4 {
    margin: 0 0 0.75rem 0;
    color: var(--primary-color);

    &:not(:first-child) {
      margin-top: 1.5rem;
    }
  }

  ul {
    margin: 0;
    padding-left: 1.25rem;

    li {
      margin-bottom: 0.5rem;
    }

    &.examples {
      li {
        font-style: italic;
        color: var(--text-color-secondary);
      }
    }
  }

  .field-types {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
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
