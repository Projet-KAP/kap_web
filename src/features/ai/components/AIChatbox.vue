<template>
  <div class="ai-chatbox">
    <!-- Header -->
    <div class="chatbox-header">
      <div class="header-content">
        <i class="pi pi-comments"></i>
        <span class="title">Assistant IA KAP</span>
      </div>
      <div class="header-actions">
        <Button
          icon="pi pi-refresh"
          text
          rounded
          severity="secondary"
          @click="startNewConversation"
          v-tooltip.left="'Nouvelle conversation'"
        />
        <Button
          v-if="showClose"
          icon="pi pi-times"
          text
          rounded
          severity="secondary"
          @click="$emit('close')"
        />
      </div>
    </div>

    <!-- Messages -->
    <div class="messages-container" ref="messagesContainer">
      <!-- Message de bienvenue si aucun message -->
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">
          <i class="pi pi-sparkles"></i>
        </div>
        <h3>Bienvenue!</h3>
        <p>Je suis votre assistant IA. Je peux vous aider avec:</p>
        <ul>
          <li>Analyse des KPIs et tendances</li>
          <li>Gestion des alertes</li>
          <li>Statut des machines</li>
          <li>Données de production</li>
        </ul>
        <div class="quick-prompts">
          <Button
            v-for="prompt in quickPrompts"
            :key="prompt.text"
            :label="prompt.text"
            outlined
            size="small"
            @click="sendQuickPrompt(prompt.text)"
          />
        </div>
      </div>

      <!-- Liste des messages -->
      <div
        v-for="message in messages"
        :key="message.id || message.created_at"
        :class="['message', message.role.toLowerCase()]"
      >
        <div class="message-avatar">
          <i :class="message.role === 'USER' ? 'pi pi-user' : 'pi pi-android'"></i>
        </div>
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(message.content)"></div>
          <div class="message-meta">
            <span class="message-time">{{ formatTime(message.created_at) }}</span>
            <span v-if="message.tool_calls" class="tool-indicator">
              <i class="pi pi-bolt"></i>
              {{ message.tool_calls.length }} outil(s) utilisé(s)
            </span>
          </div>
        </div>
      </div>

      <!-- Indicateur de chargement -->
      <div v-if="sending" class="message assistant loading">
        <div class="message-avatar">
          <i class="pi pi-android"></i>
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="input-container">
      <div class="input-wrapper">
        <Textarea
          v-model="inputMessage"
          placeholder="Posez votre question..."
          :autoResize="true"
          rows="1"
          :disabled="sending"
          @keydown.enter.exact.prevent="sendMessage"
        />
        <Button
          icon="pi pi-send"
          :loading="sending"
          :disabled="!inputMessage.trim() || sending"
          @click="sendMessage"
          rounded
        />
      </div>
      <div class="input-hint">
        Appuyez sur Entrée pour envoyer
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useAIStore } from '../stores/aiStore'

// Props & Emits
const props = defineProps({
  showClose: {
    type: Boolean,
    default: false
  },
  contextType: {
    type: String,
    default: 'GENERAL'
  },
  contextData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

// Store
const aiStore = useAIStore()

// State
const inputMessage = ref('')
const messagesContainer = ref(null)

// Computed
const messages = computed(() => aiStore.sortedMessages)
const sending = computed(() => aiStore.sending)

// Quick prompts
const quickPrompts = [
  { text: 'Quel est le TRS actuel?' },
  { text: 'Y a-t-il des alertes critiques?' },
  { text: 'Quel est le statut des machines?' },
  { text: 'Analyse les tendances de production' }
]

// Methods
const formatMessage = (content) => {
  if (!content) return ''
  // Formatage basique du texte
  // Convertir les retours à la ligne en <br>
  // Échapper les caractères HTML pour la sécurité
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  // Convertir les nouvelles lignes
  return escaped.replace(/\n/g, '<br>')
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  const content = inputMessage.value.trim()
  if (!content || sending.value) return

  inputMessage.value = ''

  try {
    // Si pas de conversation active, en créer une
    if (!aiStore.currentConversation) {
      await aiStore.createConversation({
        context_type: props.contextType,
        context_data: props.contextData
      })
    }

    await aiStore.sendMessage(aiStore.currentConversation.id, content)
    scrollToBottom()
  } catch (err) {
    console.error('Erreur envoi message:', err)
  }
}

const sendQuickPrompt = (text) => {
  inputMessage.value = text
  sendMessage()
}

const startNewConversation = async () => {
  aiStore.resetCurrentState()
  await aiStore.createConversation({
    context_type: props.contextType,
    context_data: props.contextData
  })
}

// Watch messages pour scroll auto
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

// Lifecycle
onMounted(() => {
  // Charger les conversations existantes
  aiStore.fetchConversations({ status: 'ACTIVE' })
})
</script>

<style scoped lang="scss">
.ai-chatbox {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-ground);
  border-radius: 12px;
  overflow: hidden;
}

.chatbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--primary-color);
  color: white;

  .header-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
      font-size: 1.25rem;
    }

    .title {
      font-weight: 600;
    }
  }

  .header-actions {
    display: flex;
    gap: 0.25rem;

    :deep(.p-button) {
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.welcome-message {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);

  .welcome-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--primary-100);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;

    i {
      font-size: 1.5rem;
      color: var(--primary-color);
    }
  }

  h3 {
    margin: 0 0 0.5rem;
    color: var(--text-color);
  }

  p {
    margin: 0 0 0.5rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;

    li {
      padding: 0.25rem 0;

      &::before {
        content: '•';
        color: var(--primary-color);
        margin-right: 0.5rem;
      }
    }
  }

  .quick-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }
}

.message {
  display: flex;
  gap: 0.75rem;
  max-width: 85%;

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;

    .message-avatar {
      background: var(--primary-color);
      color: white;
    }

    .message-content {
      background: var(--primary-color);
      color: white;
      border-radius: 16px 16px 4px 16px;
    }

    .message-meta {
      text-align: right;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  &.assistant {
    align-self: flex-start;

    .message-avatar {
      background: var(--surface-200);
      color: var(--text-color);
    }

    .message-content {
      background: var(--surface-card);
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }

  &.system, &.tool {
    align-self: center;
    max-width: 100%;

    .message-content {
      background: var(--surface-200);
      border-radius: 8px;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }
  }

  &.loading {
    .message-content {
      padding: 1rem 1.5rem;
    }
  }
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 1rem;
  }
}

.message-content {
  padding: 0.75rem 1rem;

  .message-text {
    line-height: 1.5;

    :deep(p) {
      margin: 0 0 0.5rem;

      &:last-child {
        margin: 0;
      }
    }

    :deep(ul), :deep(ol) {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }

    :deep(code) {
      background: rgba(0, 0, 0, 0.1);
      padding: 0.125rem 0.25rem;
      border-radius: 4px;
      font-family: monospace;
    }

    :deep(pre) {
      background: var(--surface-900);
      color: var(--surface-0);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;

      code {
        background: none;
        padding: 0;
      }
    }
  }
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);

  .tool-indicator {
    display: flex;
    align-items: center;
    gap: 0.25rem;

    i {
      font-size: 0.625rem;
    }
  }
}

.typing-indicator {
  display: flex;
  gap: 4px;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-color-secondary);
    animation: bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.input-container {
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
  background: var(--surface-card);

  .input-wrapper {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;

    :deep(.p-textarea) {
      flex: 1;
      max-height: 120px;
      resize: none;
    }
  }

  .input-hint {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    margin-top: 0.5rem;
    text-align: center;
  }
}
</style>
