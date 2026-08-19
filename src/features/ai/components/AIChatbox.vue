<template>
  <div class="chatgpt-layout">
    <!-- Top Action (New Chat) -->
    <div class="top-bar" v-if="showClose || true">
      <Button
        label="Nouvelle conversation"
        icon="pi pi-plus"
        text
        severity="secondary"
        class="new-chat-btn"
        @click="startNewConversation"
      />
      <Button
        v-if="showClose"
        icon="pi pi-times"
        text
        rounded
        severity="secondary"
        @click="$emit('close')"
        class="close-btn"
      />
    </div>

    <!-- Messages Area -->
    <div class="chat-messages-container" ref="messagesContainer">
      <!-- Welcome Screen -->
      <div v-if="messages.length === 0" class="welcome-screen">
        <div class="welcome-logo">
          <i class="pi pi-sparkles"></i>
        </div>
        <h2 class="welcome-title">Comment puis-je vous aider aujourd'hui ?</h2>
        
        <div class="quick-prompts-grid">
          <div 
            v-for="prompt in quickPrompts" 
            :key="prompt.text"
            class="prompt-card"
            @click="sendQuickPrompt(prompt.text)"
          >
            <span class="prompt-text">{{ prompt.text }}</span>
            <div class="prompt-icon"><i class="pi pi-arrow-up"></i></div>
          </div>
        </div>
      </div>

      <!-- Messages List -->
      <div class="messages-list" v-else>
        <div
          v-for="message in messages"
          :key="message.id || message.created_at"
          :class="['chat-row', message.role.toLowerCase()]"
        >
          <div class="chat-content-wrapper">
            <div class="message-avatar" v-if="message.role !== 'USER'">
              <div class="ai-logo-bg">
                <i class="pi pi-sparkles"></i>
              </div>
            </div>
            
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              
              <div v-if="message.tool_calls && message.tool_calls.length" class="tool-calls-container">
                <div class="tool-badge">
                  <i class="pi pi-check-circle"></i>
                  <span>Analysé {{ message.tool_calls.length }} source(s)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div v-if="sending" class="chat-row assistant">
          <div class="chat-content-wrapper">
            <div class="message-avatar">
              <div class="ai-logo-bg pulse-anim">
                <i class="pi pi-sparkles"></i>
              </div>
            </div>
            <div class="message-content loading-content">
              <div class="gpt-typing-indicator"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="chat-input-area">
      <div class="input-container-wrapper">
        <div class="input-box">
          <Textarea
            v-model="inputMessage"
            placeholder="Envoyer un message à KAP AI..."
            :autoResize="true"
            rows="1"
            :disabled="sending"
            @keydown.enter.exact.prevent="sendMessage"
            class="gpt-textarea"
          />
          <button 
            class="send-btn" 
            :class="{ active: inputMessage.trim() && !sending }"
            :disabled="!inputMessage.trim() && !sending"
            @click="sendMessage"
          >
            <i class="pi pi-arrow-up" v-if="!sending"></i>
            <i class="pi pi-stop" v-else></i>
          </button>
        </div>
        <div class="disclaimer">
          KAP AI peut faire des erreurs. Considérez vérifier les informations importantes.
        </div>
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
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  
  // Remplacer les blocs de code markdown par une div stylisee
  let formatted = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // Convertir les nouvelles lignes
  return formatted.replace(/\n/g, '<br>')
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
  // Allow stop generation behavior visually
  if (sending.value) return 

  if (!content) return

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
  setTimeout(scrollToBottom, 500)
})
</script>

<style scoped lang="scss">
.chatgpt-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--surface-0, #ffffff);
  color: var(--text-color, #212529);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  position: relative;
  overflow: hidden;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: transparent;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  
  .new-chat-btn {
    color: var(--text-color-secondary);
    font-weight: 500;
    
    &:hover {
      background-color: var(--surface-100);
      color: var(--text-color);
    }
  }
  
  .close-btn {
    color: var(--text-color-secondary);
    
    &:hover {
      background-color: var(--surface-100);
      color: var(--text-color);
    }
  }
}

.chat-messages-container {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding-top: 3.5rem; /* space for top-bar */
  padding-bottom: 2rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--surface-300);
    border-radius: 3px;
  }
}

.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80%;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;

  .welcome-logo {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background-color: var(--surface-900);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    
    i {
      font-size: 2rem;
      color: white;
    }
  }

  .welcome-title {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 2.5rem;
    text-align: center;
    color: var(--text-color);
  }

  .quick-prompts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    width: 100%;
    max-width: 700px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    .prompt-card {
      border: 1px solid var(--surface-200);
      border-radius: 16px;
      padding: 1rem 1.25rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 0.2s, transform 0.1s;
      background-color: var(--surface-0);
      
      &:hover {
        background-color: var(--surface-50);
        
        .prompt-icon {
          opacity: 1;
          transform: translateX(4px);
        }
      }

      .prompt-text {
        font-size: 0.875rem;
        color: var(--text-color-secondary);
        font-weight: 500;
      }
      
      .prompt-icon {
        background-color: var(--surface-900);
        border-radius: 8px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.2s;
        
        i {
          color: white;
          font-size: 0.75rem;
        }
      }
    }
  }
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0 1rem;
}

.chat-row {
  display: flex;
  justify-content: center;
  width: 100%;
  
  .chat-content-wrapper {
    display: flex;
    gap: 1rem;
    width: 100%;
    max-width: 800px;
  }

  &.user {
    .chat-content-wrapper {
      flex-direction: row-reverse;
    }
    
    .message-content {
      background-color: var(--surface-100);
      padding: 1rem 1.25rem;
      border-radius: 20px;
      border-bottom-right-radius: 4px;
      max-width: 75%;
    }
  }

  &.assistant {
    .chat-content-wrapper {
      flex-direction: row;
    }
    
    .message-content {
      padding: 0.25rem 0;
      flex: 1;
      max-width: calc(100% - 40px - 1rem);
    }
  }
}

.message-avatar {
  flex-shrink: 0;
  
  .ai-logo-bg {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: var(--green-600, #7AC943);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    
    i {
      color: white;
      font-size: 1rem;
    }
  }
}

.pulse-anim {
  animation: pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

.message-content {
  color: var(--text-color);
  font-size: 1rem;
  line-height: 1.6;
  
  .message-text {
    :deep(p) {
      margin-bottom: 1rem;
      &:last-child { margin-bottom: 0; }
    }
    
    :deep(ul), :deep(ol) {
      margin: 1rem 0;
      padding-left: 2rem;
    }
    
    :deep(li) {
      margin-bottom: 0.5rem;
    }
    
    :deep(pre) {
      background-color: var(--surface-900);
      color: var(--surface-0);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;
      font-family: 'Fira Code', monospace;
      font-size: 0.875rem;
      
      code {
        background: transparent;
        padding: 0;
        color: inherit;
      }
    }
    
    :deep(code) {
      background-color: var(--surface-100);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'Fira Code', monospace;
      font-size: 0.875em;
    }
  }
}

.tool-calls-container {
  margin-top: 1rem;
  
  .tool-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--surface-100);
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    font-weight: 500;
    
    i {
      color: var(--green-500);
    }
  }
}

.gpt-typing-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--text-color);
  margin-top: 8px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.chat-input-area {
  padding: 0 1rem 1.5rem;
  background: linear-gradient(0deg, var(--surface-0) 80%, rgba(255,255,255,0) 100%);
  position: relative;
  
  .input-container-wrapper {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .input-box {
    width: 100%;
    position: relative;
    background-color: var(--surface-100);
    border-radius: 24px;
    border: 1px solid var(--surface-200);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
    display: flex;
    align-items: flex-end;
    padding: 0.5rem;
    transition: box-shadow 0.2s, border-color 0.2s;
    
    &:focus-within {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border-color: var(--surface-300);
    }
    
    .gpt-textarea {
      flex: 1;
      background: transparent;
      border: none;
      box-shadow: none;
      padding: 0.5rem 1rem;
      padding-right: 3rem; /* space for send button */
      font-family: inherit;
      font-size: 1rem;
      line-height: 1.5;
      color: var(--text-color);
      max-height: 200px;
      overflow-y: auto;
      
      &:focus {
        outline: none;
        box-shadow: none;
      }
      
      &::placeholder {
        color: var(--text-color-secondary);
      }
    }
    
    .send-btn {
      position: absolute;
      right: 0.75rem;
      bottom: 0.75rem;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background-color: var(--surface-300);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
      
      i {
        font-size: 0.875rem;
      }
      
      &.active {
        background-color: var(--surface-900);
        
        &:hover {
          background-color: var(--surface-700);
        }
      }
      
      &:disabled {
        cursor: not-allowed;
      }
      
      &:active:not(:disabled) {
        transform: scale(0.95);
      }
    }
  }
  
  .disclaimer {
    margin-top: 0.75rem;
    font-size: 0.7rem;
    color: var(--text-color-secondary);
    text-align: center;
  }
}
</style>
