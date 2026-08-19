<template>
  <Drawer
    v-model:visible="internalVisible"
    position="full"
    class="gpt-drawer"
  >
    <div class="chatgpt-layout">
      <!-- Top Action (Header / Close) -->
      <div class="top-bar">
        <div class="drawer-header-title">
          <i class="pi pi-sparkles"></i>
          <span>Assistant IA Production</span>
        </div>
        <Button
          icon="pi pi-times"
          text
          rounded
          severity="secondary"
          @click="internalVisible = false"
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
          <h2 class="welcome-title">Assistant Production</h2>
          <p class="welcome-subtitle">Votre copilote intelligent pour le suivi de production</p>
          
          <div class="quick-prompts-grid">
            <div 
              v-for="action in quickActions" 
              :key="action.id"
              class="prompt-card"
              @click="sendQuickAction(action)"
            >
              <div class="prompt-text-group">
                <i :class="action.icon" class="action-icon"></i>
                <span class="prompt-text">{{ action.label }}</span>
              </div>
              <div class="prompt-icon"><i class="pi pi-arrow-up"></i></div>
            </div>
          </div>
        </div>

        <!-- Messages List -->
        <div class="messages-list" v-else>
          <!-- Initial Welcome Message in Chat -->
          <div class="chat-row assistant">
            <div class="chat-content-wrapper">
              <div class="message-avatar">
                <div class="ai-logo-bg">
                  <i class="pi pi-sparkles"></i>
                </div>
              </div>
              <div class="message-content">
                <div class="message-text">
                  <p>Bonjour ! Je suis votre assistant IA pour le suivi de production.</p>
                  <p>Je peux vous aider à analyser vos données, suggérer de nouveaux indicateurs ou optimiser vos KPIs. Comment puis-je vous aider ?</p>
                </div>
              </div>
            </div>
          </div>

          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['chat-row', message.role]"
          >
            <div class="chat-content-wrapper">
              <div class="message-avatar" v-if="message.role !== 'user'">
                <div class="ai-logo-bg">
                  <i class="pi pi-sparkles"></i>
                </div>
              </div>
              
              <div class="message-content">
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                
                <div v-if="message.actions && message.actions.length" class="tool-calls-container">
                  <div class="tool-actions-flex">
                    <Tag
                      v-for="(action, i) in message.actions"
                      :key="i"
                      :value="getActionLabel(action)"
                      :severity="getActionSeverity(action.type)"
                      rounded
                      class="custom-tag"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="loading" class="chat-row assistant">
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
              v-model="userInput"
              placeholder="Posez votre question sur la production..."
              :autoResize="true"
              rows="1"
              :disabled="loading"
              @keydown.enter.exact.prevent="sendMessage"
              class="gpt-textarea"
            />
            <button 
              class="send-btn" 
              :class="{ active: userInput.trim() && !loading }"
              :disabled="!userInput.trim() && !loading"
              @click="sendMessage"
            >
              <i class="pi pi-arrow-up" v-if="!loading"></i>
              <i class="pi pi-stop" v-else></i>
            </button>
          </div>
          <div class="disclaimer">
            L'Assistant IA peut générer des erreurs. Veuillez vérifier les recommandations avec les équipes opérationnelles.
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { axiosInstance } from '@/main'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  projetId: {
    type: [Number, String],
    default: null
  },
  tagType: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:visible'])

const internalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const messages = ref([])
const userInput = ref('')
const loading = ref(false)
const messagesContainer = ref(null)

const quickActions = [
  { id: 'analyze', label: 'Analyser mes données', icon: 'pi pi-chart-line' },
  { id: 'suggest', label: 'Suggérer des indicateurs', icon: 'pi pi-lightbulb' },
  { id: 'import', label: "Aide à l'import", icon: 'pi pi-upload' },
  { id: 'kpis', label: 'Optimiser mes KPIs', icon: 'pi pi-sliders-h' }
]

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  if (loading.value) return 
  if (!userInput.value.trim()) return

  const content = userInput.value.trim()
  userInput.value = ''

  messages.value.push({
    role: 'user',
    content
  })
  scrollToBottom()

  loading.value = true

  try {
    let contextMessage = content
    if (props.projetId) contextMessage += ` [Projet: ${props.projetId}]`
    if (props.tagType) contextMessage += ` [Type: ${props.tagType}]`

    const response = await axiosInstance.post('/ai/tag-discovery/quick-chat/', {
      content: contextMessage
    })

    messages.value.push({
      role: 'assistant',
      content: response.data.response || "Je n'ai pas pu traiter votre demande.",
      actions: response.data.actions_performed || []
    })
  } catch (error) {
    console.error('Error sending message:', error)
    messages.value.push({
      role: 'assistant',
      content: "Désolé, une erreur s'est produite. Veuillez réessayer."
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

const sendQuickAction = (action) => {
  const prompts = {
    analyze: "Analyse les données que j'ai importées et dis-moi ce que tu observes.",
    suggest: "Quels indicateurs me suggères-tu de suivre pour mon activité ?",
    import: "Comment dois-je formater mon fichier Excel pour l'import ?",
    kpis: "Comment puis-je optimiser mes KPIs actuels ?"
  }

  userInput.value = prompts[action.id] || action.label
  sendMessage()
}

const formatMessage = (content) => {
  if (!content) return ''
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  
  let formatted = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  return formatted.replace(/\n/g, '<br>')
}

const getActionLabel = (action) => {
  const labels = {
    tag_created: `Tag créé : ${action.tag_name || ''}`,
    tags_suggested: `${action.count || 0} tags suggérés`,
    template_created: `Template: ${action.template_name || ''}`,
    dashboard_created: `Dashboard: ${action.dashboard_name || ''}`,
    excel_generated: `Excel généré`
  }
  return labels[action.type] || action.type
}

const getActionSeverity = (type) => {
  const severities = {
    tag_created: 'success',
    tags_suggested: 'info',
    template_created: 'success',
    dashboard_created: 'success',
    excel_generated: 'success'
  }
  return severities[type] || 'secondary'
}

watch(() => props.visible, (visible) => {
  if (visible) {
    setTimeout(scrollToBottom, 300)
  }
})
</script>

<style lang="scss">
.gpt-drawer.p-drawer {
  background: var(--surface-0) !important;
  border: none !important;
}

.gpt-drawer .p-drawer-header {
  display: none !important; 
}

.gpt-drawer .p-drawer-content {
  padding: 0 !important;
  height: 100vh !important;
  overflow: hidden !important;
}
</style>

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
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  border-bottom: 1px solid var(--surface-200);
  
  .drawer-header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--text-color);
    
    i {
      color: var(--green-600);
      font-size: 1.2rem;
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
  padding-top: 4.5rem; /* space for top-bar */
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
    margin-bottom: 1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    
    i {
      font-size: 2rem;
      color: white;
    }
  }

  .welcome-title {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-align: center;
    color: var(--text-color);
  }

  .welcome-subtitle {
    color: var(--text-color-secondary);
    margin-bottom: 2.5rem;
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

      .prompt-text-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .action-icon {
        color: var(--green-600);
        font-size: 1.1rem;
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
}

.tool-actions-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  .custom-tag {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
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
      padding-right: 3rem;
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
