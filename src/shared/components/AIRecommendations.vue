<template>
  <div class="ai-assistant">
    <!-- Trigger Button - Floating AI Button -->
    <div :class="['ai-trigger-container', { 'has-alerts': hasRecommendations, [severityClass]: true }]">
      <div v-if="severityClass === 'critical'" class="trigger-pulse"></div>

      <Button
        :icon="visible ? 'pi pi-times' : undefined"
        :class="['ai-trigger', { 'expanded': visible, [severityClass]: true, 'has-new': hasNewRecommendations }]"
        @click="visible = !visible"
        v-tooltip.left="triggerTooltip"
        text
        rounded
      >
        <template v-if="!visible" #icon>
          <img src="/chatbot.png" alt="Assistant IA" style="width:120px;height:120px;object-fit:contain;" />
        </template>
      </Button>

      <Transition name="badge-pop">
        <div v-if="hasRecommendations && !visible" :class="['trigger-badge', severityClass]">
          {{ storeRecommendations.length > 9 ? '9+' : storeRecommendations.length }}
        </div>
      </Transition>

      <Transition name="label-slide">
        <div v-if="severityClass === 'critical' && !visible" class="trigger-label">
          Action requise
        </div>
      </Transition>
    </div>

    <!-- Full Screen Drawer (Pure Chat Interface) -->
    <Drawer
      v-model:visible="visible"
      position="full"
      class="gpt-drawer"
    >
      <div class="chatgpt-clone-layout">
        
        <!-- Sidebar -->
        <div class="chatgpt-sidebar" :class="{ 'sidebar-open': sidebarOpen }">
          <div class="sidebar-header">
            <button class="new-chat-btn" @click="resetChat">
              <div class="btn-logo-wrapper">
                <img src="/default_logo.png" alt="KAP" />
              </div>
              <span class="btn-text">Nouvelle discussion</span>
              <i class="pi pi-file-edit"></i>
            </button>
            <button class="close-sidebar-mobile" @click="sidebarOpen = false">
              <i class="pi pi-times"></i>
            </button>
          </div>
          
          <div class="sidebar-history">
            <div class="history-group">
              <span class="group-title">Conversations</span>
              <div 
                v-for="conv in historyConversations" 
                :key="conv.id"
                class="history-item"
                :class="{ active: activeConversationId === conv.id }"
                @click="selectConversation(conv)"
              >
                <i class="pi pi-message"></i> 
                <span class="history-title">{{ conv.title || 'Discussion' }}</span>
                <i class="pi pi-trash delete-conv-btn" @click.stop="deleteConversation(conv.id)" title="Supprimer"></i>
              </div>
              <div v-if="historyConversations.length === 0" class="history-item text-gray-500">
                <span style="font-size: 0.85rem; font-style: italic;">Aucune conversation</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-footer" style="display: none;">
            <!-- User profile removed per request -->
          </div>
        </div>

        <!-- Main Chat Area -->
        <div class="chatgpt-main">
          
          <!-- Mobile Header (Visible only on small screens or to close drawer) -->
          <div class="main-header">
            <div class="header-left">
              <button class="menu-btn" @click="sidebarOpen = true">
                <i class="pi pi-bars"></i>
              </button>
              <span class="header-title">KAP Copilot</span>
            </div>
            <div class="header-right">
              <Button
                icon="pi pi-times"
                text
                rounded
                severity="secondary"
                @click="visible = false"
                class="close-drawer-btn"
                v-tooltip.bottom="'Fermer le copilote'"
              />
            </div>
          </div>

          <!-- Messages Area -->
          <div class="chat-messages-container" ref="chatMessages">
            
            <!-- Welcome Screen -->
            <div v-if="chatHistory.length <= 1" class="welcome-screen">
              <div class="welcome-logo">
                <img src="/default_logo.png" alt="KAP Logo" />
              </div>
              <h2 class="welcome-title">Comment puis-je vous aider aujourd'hui ?</h2>
              
              <div class="quick-prompts-grid">
                <div 
                  v-for="action in quickActions" 
                  :key="action.id"
                  class="prompt-card"
                  @click="sendQuickAction(action.prompt)"
                >
                  <div class="prompt-text-group">
                    <span class="prompt-label">{{ action.label }}</span>
                    <span class="prompt-desc">{{ action.desc }}</span>
                  </div>
                  <div class="prompt-icon"><i class="pi pi-arrow-up"></i></div>
                </div>
              </div>
            </div>

            <!-- Messages List -->
            <div class="messages-list" v-else>
              <div
                v-for="(message, index) in chatHistory"
                :key="index"
                :class="['chat-row', message.role]"
              >
                <div class="chat-content-wrapper">
                  <!-- Avatar IA -->
                  <div class="message-avatar" v-if="message.role !== 'user'">
                    <div class="ai-logo-bg">
                      <img src="/default_logo.png" alt="KAP" />
                    </div>
                  </div>
                  <!-- Avatar User -->
                  <div class="message-avatar user-avatar-msg" v-else>
                    <div class="user-logo-bg">
                      <i class="pi pi-user"></i>
                    </div>
                  </div>
                  
                  <div class="message-content">
                    <div class="message-name">{{ message.role === 'user' ? 'Vous' : 'KAP AI' }}</div>
                    <div class="message-text" v-html="formatMessage(message.content)"></div>
                  </div>
                </div>
              </div>

              <!-- Loading Indicator -->
              <div v-if="isTyping" class="chat-row assistant">
                <div class="chat-content-wrapper">
                  <div class="message-avatar">
                    <div class="ai-logo-bg pulse-anim">
                      <img src="/default_logo.png" alt="KAP" />
                    </div>
                  </div>
                  <div class="message-content loading-content">
                    <div class="message-name">KAP AI</div>
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
                  v-model="chatInput"
                  placeholder="Posez votre question à KAP AI..."
                  :autoResize="true"
                  rows="1"
                  :disabled="isTyping"
                  @keydown.enter.exact.prevent="sendMessage"
                  class="gpt-textarea"
                />
                <button 
                  class="send-btn" 
                  :class="{ active: chatInput.trim() && !isTyping }"
                  :disabled="!chatInput.trim() && !isTyping"
                  @click="sendMessage"
                >
                  <i class="pi pi-arrow-up" v-if="!isTyping"></i>
                  <i class="pi pi-stop" v-else></i>
                </button>
              </div>
              <div class="disclaimer">
                KAP AI peut faire des erreurs. Veuillez vérifier les informations importantes.
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAIStore } from '@/features/ai/stores/aiStore'
import { axiosInstance } from '@/main'

const props = defineProps({
  kpiType: { type: String, default: 'general' },
  contextType: { type: String, default: 'DASHBOARD' },
  contextData: { type: Object, default: () => ({}) },
  siteId: { type: [Number, String], default: null },
  autoStart: { type: Boolean, default: true }
})

const emit = defineEmits(['refresh-analysis'])

const toast = useToast()
const aiStore = useAIStore()

const visible = ref(false)
const sidebarOpen = ref(false)
const hasNewRecommendations = ref(false)
const chatInput = ref('')
const isTyping = ref(false)
const chatMessages = ref(null)

const historyConversations = ref([])
const activeConversationId = ref(null)

const loadHistory = async () => {
  try {
    const response = await axiosInstance.get('/ai/conversations/?context_type=TAG_DISCOVERY')
    historyConversations.value = response.data.results || response.data
  } catch (err) {
    console.error('Erreur chargement historique', err)
  }
}

const selectConversation = async (conv) => {
  activeConversationId.value = conv.id
  chatHistory.value = []
  if (window.innerWidth < 768) sidebarOpen.value = false
  
  try {
    const response = await axiosInstance.get(`/ai/conversations/${conv.id}/messages/`)
    const msgs = response.data.results || response.data
    if (msgs && msgs.length > 0) {
      chatHistory.value = msgs.map(m => ({
        role: m.role === 'USER' ? 'user' : 'assistant',
        content: m.content,
        time: new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }))
    }
  } catch (err) {
    console.error('Erreur chargement messages', err)
  }
  scrollToBottom()
}

const deleteConversation = async (convId) => {
  if (!confirm('Voulez-vous vraiment supprimer cette conversation ?')) return
  try {
    await axiosInstance.delete(`/ai/conversations/${convId}/`)
    historyConversations.value = historyConversations.value.filter(c => c.id !== convId)
    if (activeConversationId.value === convId) {
      resetChat()
    }
  } catch (err) {
    console.error('Erreur suppression conversation', err)
  }
}

const initialMessage = {
  role: 'assistant',
  content: 'Bonjour ! Je suis KAP AI. Je surveille vos données en temps réel. Comment puis-je vous aider aujourd\'hui ?',
  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const chatHistory = ref([ { ...initialMessage } ])

const resetChat = () => {
  chatHistory.value = [ { ...initialMessage } ]
  if (window.innerWidth < 768) {
    sidebarOpen.value = false
  }
}

// Polling and alert context from Store
const storeRecommendations = computed(() => aiStore.recommendations || [])
const hasRecommendations = computed(() => storeRecommendations.value.length > 0)

const severityClass = computed(() => {
  if (!storeRecommendations.value.length) return 'info'
  const hasCritical = storeRecommendations.value.some(r => r.priority === 'critical')
  const hasHigh = storeRecommendations.value.some(r => r.priority === 'high')
  if (hasCritical) return 'critical'
  if (hasHigh) return 'warning'
  return 'info'
})

// Quick Actions adapted for ChatGPT clone layout
const quickActions = ref([
  { id: 'resume', label: 'Résumé du jour', desc: 'Aperçu des performances', prompt: 'Donne-moi un résumé complet des performances d\'aujourd\'hui : production et équipements.' },
  { id: 'alertes', label: 'Mes alertes', desc: 'Problèmes en cours', prompt: 'Quelles sont les alertes ou recommandations actives actuelles ? Détaille les problèmes.' },
  { id: 'stock', label: 'État des stocks', desc: 'Niveaux critiques', prompt: 'Analyse l\'état actuel des stocks et identifie les niveaux critiques.' },
  { id: 'equipe', label: 'Performance équipes', desc: 'Comparaison de prod', prompt: 'Compare les performances des différentes équipes.' }
])

const triggerTooltip = computed(() => {
  if (!hasRecommendations.value) return 'KAP AI - Tout est optimal'
  const criticalCount = storeRecommendations.value.filter(r => r.priority === 'critical').length
  const count = storeRecommendations.value.length
  if (criticalCount > 0) return `${criticalCount} alerte(s) critique(s) - Action requise`
  return `${count} recommandation(s) disponible(s)`
})

onMounted(() => {
  if (props.autoStart) startPolling()
  loadHistory()
})

onUnmounted(() => {
  aiStore.stopRecommendationsPolling()
})

const startPolling = () => {
  const params = {}
  if (props.siteId) params.site_id = props.siteId
  aiStore.startRecommendationsPolling(params)
}

const askAboutAlerts = () => {
  sendToAI('Quelles sont les alertes actives actuelles et que me recommandes-tu de faire ?')
  if (window.innerWidth < 768) sidebarOpen.value = false
}

const formatMessage = (content) => {
  if (!content) return ''
  let textContent = content
  
  // Safeguard: if content is an array (e.g. Claude 3.5 block list) or object, extract text
  if (Array.isArray(content)) {
    textContent = content.map(block => block.text || '').join('\n')
  } else if (typeof content === 'object') {
    textContent = JSON.stringify(content)
  }
  
  if (typeof textContent !== 'string') textContent = String(textContent)

  const escaped = textContent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  
  let formatted = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>')
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/^\s*-\s+(.*)/gm, '<li>$1</li>')
  return formatted.replace(/\n/g, '<br>')
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight
    }
  })
}

const sendMessage = () => {
  if (!chatInput.value.trim() || isTyping.value) return
  const message = chatInput.value
  chatInput.value = ''
  sendToAI(message)
}

const sendQuickAction = (prompt) => {
  sendToAI(prompt)
}

const sendToAI = async (content) => {
  chatHistory.value.push({
    role: 'user',
    content,
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  })
  scrollToBottom()

  isTyping.value = true

  try {
    const payload = {
      content: content,
      context_type: props.contextType,
      context_data: props.contextData,
      site_id: props.siteId
    }
    
    if (activeConversationId.value) {
      payload.conversation_id = activeConversationId.value
    }

    const response = await axiosInstance.post('/ai/tag-discovery/quick-chat/', payload)

    if (response && response.data) {
      if (!activeConversationId.value && response.data.conversation_id) {
        activeConversationId.value = response.data.conversation_id
        loadHistory()
      }
      
      chatHistory.value.push({
        role: 'assistant',
        content: response.data.response || response.data.content || "Analyse terminée.",
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      })
    } else {
      throw new Error("No response")
    }
  } catch (error) {
    console.error('Erreur IA:', error)
    
    let errorMessage = 'Désolé, une erreur s\'est produite avec le serveur.'
    if (error.response && error.response.data && error.response.data.error) {
      errorMessage = error.response.data.error
    } else if (error.response && error.response.status === 503) {
      errorMessage = "KAP AI : Je suis en attente de configuration. Veuillez ajouter une clé API IA (Clients > Configuration IA) dans le système pour m'activer."
    }

    chatHistory.value.push({
      role: 'assistant',
      content: errorMessage,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    })
  } finally {
    isTyping.value = false
    scrollToBottom()
  }
}

watch(visible, (newVal) => {
  if (newVal) {
    hasNewRecommendations.value = false
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
.ai-trigger-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;

  &.critical .trigger-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 140px;
    height: 140px;
    background: rgba(239, 68, 68, 0.2);
    border-radius: 50%;
    animation: pulse-ring 2s infinite;
    pointer-events: none;
  }
}

.ai-trigger {
  width: 70px !important;
  height: 70px !important;
  border-radius: 50% !important;
  background-color: var(--surface-0) !important;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
  padding: 0 !important;
  border: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0,0,0,0.25) !important;
  }
  
  img {
    width: 60px !important;
    height: 60px !important;
    object-fit: contain;
  }
}

.trigger-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--red-500);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  transform: translate(25%, -25%);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* ChatGPT Clone Layout */
.chatgpt-clone-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--surface-0);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

/* Sidebar */
.chatgpt-sidebar {
  width: 260px;
  background-color: var(--kap-blue, #0B2B3C); /* KAP Blue */
  color: #ececec;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: transform 0.3s ease;
  z-index: 20;

  @media (max-width: 768px) {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    
    &.sidebar-open {
      transform: translateX(0);
      box-shadow: 4px 0 15px rgba(0,0,0,0.5);
    }
  }

  .sidebar-header {
    padding: 12px;
    display: flex;
    gap: 8px;
    align-items: center;

    .new-chat-btn {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background-color: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s;
      font-size: 0.875rem;
      font-weight: 500;
      
      &:hover {
        background-color: rgba(255,255,255,0.1);
      }

      .btn-logo-wrapper {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        
        img {
          width: 70%;
          height: 70%;
          object-fit: contain;
        }
      }

      .btn-text {
        flex: 1;
        text-align: left;
      }
    }

    .close-sidebar-mobile {
      display: none;
      background: transparent;
      border: none;
      color: white;
      padding: 10px;
      cursor: pointer;
      
      @media (max-width: 768px) {
        display: block;
      }
    }
  }

  .sidebar-history {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
    }

    .history-group {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .group-title {
        font-size: 0.75rem;
        color: #8e8ea0;
        font-weight: 600;
        padding: 8px 12px;
        margin-bottom: 4px;
      }

      .history-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        color: #ececec;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
        
        .history-title {
          flex-grow: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .delete-conv-btn {
          opacity: 0;
          color: #ef4444;
          transition: opacity 0.2s;
          &:hover {
            color: #b91c1c;
          }
        }

        &:hover {
          background-color: #2A2B32;
          .delete-conv-btn {
            opacity: 1;
          }
        }
        
        &.active {
          background-color: rgba(255,255,255,0.15);
        }

        i:not(.delete-conv-btn) {
          font-size: 0.875rem;
          opacity: 0.8;
        }
      }
    }
  }

  .sidebar-footer {
    padding: 12px;
    border-top: 1px solid rgba(255,255,255,0.1);

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: rgba(255,255,255,0.1);
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        background-color: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        
        i {
          color: #ececec;
        }
      }

      .user-info {
        display: flex;
        flex-direction: column;

        .user-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .user-plan {
          font-size: 0.75rem;
          color: #8e8ea0;
        }
      }
    }
  }
}

/* Main Area */
.chatgpt-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: var(--surface-0);
  min-width: 0; /* Important for flex child truncation */
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  border-bottom: 1px solid var(--surface-200);
  z-index: 10;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .menu-btn {
      display: none;
      background: transparent;
      border: none;
      color: var(--text-color);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 4px;
      
      @media (max-width: 768px) {
        display: block;
      }
    }
    
    .header-title {
      font-weight: 600;
      color: var(--text-color);
      font-size: 1rem;
    }
  }
}

.chat-messages-container {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
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
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    overflow: hidden;
    
    img {
      width: 75%;
      height: 75%;
      object-fit: contain;
    }
  }

  .welcome-title {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 3rem;
    text-align: center;
    color: var(--text-color);
  }

  .quick-prompts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    width: 100%;
    max-width: 750px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    .prompt-card {
      border: 1px solid var(--surface-200);
      border-radius: 12px;
      padding: 12px 16px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 0.2s;
      background-color: var(--surface-0);
      
      &:hover {
        background-color: var(--surface-50);
        .prompt-icon {
          opacity: 1;
        }
      }

      .prompt-text-group {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .prompt-label {
          font-size: 0.875rem;
          color: var(--text-color);
          font-weight: 600;
        }
        
        .prompt-desc {
          font-size: 0.8rem;
          color: var(--text-color-secondary);
        }
      }
      
      .prompt-icon {
        background-color: var(--surface-100);
        border-radius: 6px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
        
        i {
          color: var(--text-color);
          font-size: 0.75rem;
        }
      }
    }
  }
}

.messages-list {
  display: flex;
  flex-direction: column;
}

.chat-row {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 1.5rem 1rem;
  
  &.assistant {
    background-color: var(--surface-50);
  }

  .chat-content-wrapper {
    display: flex;
    gap: 1.5rem;
    width: 100%;
    max-width: 750px;
  }
}

.message-avatar {
  flex-shrink: 0;
  
  .ai-logo-bg, .user-logo-bg {
    width: 30px;
    height: 30px;
    border-radius: 4px; /* ChatGPT style slightly rounded squares */
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background-color: white;
    }
  }

  .user-logo-bg {
    background-color: var(--kap-green, #7AC943);
    color: white;
  }
}

.pulse-anim {
  animation: pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .7; }
}

.message-content {
  color: var(--text-color);
  font-size: 1rem;
  line-height: 1.6;
  flex: 1;
  min-width: 0; /* prevent flex overflow */
  
  .message-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
  }
  
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
      background-color: #0B2B3C;
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
      background-color: var(--surface-200);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'Fira Code', monospace;
      font-size: 0.875em;
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
  padding: 0 2rem 1.5rem;
  background: linear-gradient(0deg, var(--surface-0) 60%, rgba(255,255,255,0) 100%);
  position: relative;
  
  @media (max-width: 768px) {
    padding: 0 1rem 1rem;
  }
  
  .input-container-wrapper {
    max-width: 750px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .input-box {
    width: 100%;
    position: relative;
    background-color: var(--surface-0);
    border-radius: 1rem;
    border: 1px solid var(--surface-300);
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: flex-end;
    padding: 0.5rem;
    
    &:focus-within {
      border-color: #8e8ea0;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
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
      border-radius: 8px;
      border: none;
      background-color: var(--surface-300);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s;
      
      i {
        font-size: 0.875rem;
      }
      
      &.active {
        background-color: var(--kap-green, #7AC943); /* KAP Green */
        
        &:hover {
          background-color: #68ad39; /* Darker KAP Green */
        }
      }
      
      &:disabled {
        cursor: not-allowed;
      }
    }
  }
  
  .disclaimer {
    margin-top: 0.75rem;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    text-align: center;
  }
}
</style>
