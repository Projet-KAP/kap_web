<template>
  <Drawer
    v-model:visible="internalVisible"
    position="full"
    class="ai-assistant-drawer"
  >
    <template #header>
      <div class="drawer-header">
        <i class="pi pi-sparkles header-icon"></i>
        <div class="header-text">
          <h2>Assistant IA Production</h2>
          <p>Votre copilote intelligent pour le suivi de production</p>
        </div>
      </div>
    </template>

    <div class="drawer-content">
      <div class="assistant-container">
        <!-- Chat Messages -->
        <div class="chat-messages" ref="messagesContainer">
          <!-- Message de bienvenue -->
          <div class="message assistant">
            <div class="message-avatar">
              <i class="pi pi-sparkles"></i>
            </div>
            <div class="message-content">
              <p>
                Bonjour ! Je suis votre assistant IA pour le suivi de production.
                Je peux vous aider a :
              </p>
              <ul>
                <li>Analyser vos données</li>
                <li>Suggerer de nouveaux indicateurs</li>
                <li>Créer des modèles d'import</li>
                <li>Generer des tableaux de bord</li>
              </ul>
              <p>Comment puis-je vous aider ?</p>
            </div>
          </div>

          <!-- Messages de la conversation -->
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['message', message.role]"
          >
            <div class="message-avatar">
              <i :class="message.role === 'user' ? 'pi pi-user' : 'pi pi-sparkles'"></i>
            </div>
            <div class="message-content">
              <p v-html="formatMessage(message.content)"></p>

              <!-- Actions effectuees -->
              <div v-if="message.actions?.length" class="message-actions">
                <Tag
                  v-for="(action, i) in message.actions"
                  :key="i"
                  :value="getActionLabel(action)"
                  :severity="getActionSeverity(action.type)"
                  class="action-tag"
                />
              </div>
            </div>
          </div>

          <!-- Loading indicator -->
          <div v-if="loading" class="message assistant loading">
            <div class="message-avatar">
              <i class="pi pi-sparkles"></i>
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

        <!-- Quick Actions -->
        <div v-if="messages.length === 0" class="quick-actions">
          <Button
            v-for="action in quickActions"
            :key="action.id"
            :label="action.label"
            :icon="action.icon"
            severity="secondary"
            size="small"
            outlined
            @click="sendQuickAction(action)"
          />
        </div>

        <!-- Input Area -->
        <div class="input-area">
          <InputText
            v-model="userInput"
            placeholder="Posez votre question..."
            class="chat-input"
            @keyup.enter="sendMessage"
            :disabled="loading"
          />
          <Button
            icon="pi pi-send"
            :loading="loading"
            :disabled="!userInput.trim()"
            @click="sendMessage"
          />
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

// Computed pour le v-model du Drawer
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
  { id: 'suggest', label: 'Suggerer des indicateurs', icon: 'pi pi-lightbulb' },
  { id: 'import', label: 'Aide a l\'import', icon: 'pi pi-upload' },
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
  if (!userInput.value.trim() || loading.value) return

  const content = userInput.value.trim()
  userInput.value = ''

  // Ajouter le message utilisateur
  messages.value.push({
    role: 'user',
    content
  })
  scrollToBottom()

  loading.value = true

  try {
    // Construire le contexte
    let contextMessage = content
    if (props.projetId) {
      contextMessage += ` [Projet: ${props.projetId}]`
    }
    if (props.tagType) {
      contextMessage += ` [Type: ${props.tagType}]`
    }

    const response = await axiosInstance.post('/ai/tag-discovery/quick-chat/', {
      content: contextMessage
    })

    // Ajouter la reponse
    messages.value.push({
      role: 'assistant',
      content: response.data.response || "Je n'ai pas pu traiter votre demande.",
      actions: response.data.actions_performed || []
    })
  } catch (error) {
    console.error('Error sending message:', error)
    messages.value.push({
      role: 'assistant',
      content: "Desole, une erreur s'est produite. Veuillez reessayer."
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

const sendQuickAction = (action) => {
  const prompts = {
    analyze: "Analyse les données que j'ai importées et dis-moi ce que tu observes.",
    suggest: "Quels indicateurs me suggeres-tu de suivre pour mon activite ?",
    import: "Comment dois-je formater mon fichier Excel pour l'import ?",
    kpis: "Comment puis-je optimiser mes KPIs actuels ?"
  }

  userInput.value = prompts[action.id] || action.label
  sendMessage()
}

const formatMessage = (content) => {
  // Convertir les retours a la ligne en <br>
  return content.replace(/\n/g, '<br>')
}

const getActionLabel = (action) => {
  const labels = {
    tag_created: `Tag créé : ${action.tag_name || ''}`,
    tags_suggested: `${action.count || 0} tags suggeres`,
    template_created: `Template: ${action.template_name || ''}`,
    dashboard_created: `Dashboard: ${action.dashboard_name || ''}`,
    excel_generated: `Excel genere`
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

// Reset messages quand le dialog est ferme
watch(() => props.visible, (visible) => {
  if (!visible) {
    // Garder l'historique pour la prochaine ouverture
  }
})
</script>

<style lang="scss">
/* Styles globaux pour le Drawer (rendu via portal en dehors du composant) */
.ai-assistant-drawer.p-drawer {
  background: #f8fafc !important;
}

.ai-assistant-drawer .p-drawer-header {
  padding: 1rem 1.5rem !important;
  border: none !important;
  background: white !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.ai-assistant-drawer .p-drawer-content {
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 70px) !important;
  overflow: hidden !important;
}
</style>

<style scoped lang="scss">
/* Styles scoped pour les elements internes */
.drawer-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;

  .header-icon {
    font-size: 1.75rem;
    color: #7AC943;
    background: linear-gradient(135deg, #7AC943 0%, #5a9c32 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header-text {
    h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }

    p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #64748b;
    }
  }
}

.drawer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1.5rem;
  height: 100%;
  min-height: 0;
}

.assistant-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 1rem;
  min-height: 0;
}

.message {
  display: flex;
  gap: 0.75rem;
  max-width: 85%;

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;

    .message-content {
      background: #0B2B3C;
      color: white;
      border-radius: 16px 16px 4px 16px;
    }

    .message-avatar {
      background: #e0e7ff;

      i {
        color: #0B2B3C;
      }
    }
  }

  &.assistant {
    align-self: flex-start;

    .message-content {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .message-avatar {
      background: #7AC943;

      i {
        color: white;
      }
    }
  }

  .message-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    i {
      font-size: 1.125rem;
    }
  }

  .message-content {
    padding: 1rem 1.25rem;

    p {
      margin: 0;
      line-height: 1.6;
      font-size: 0.9375rem;

      &:not(:last-child) {
        margin-bottom: 0.5rem;
      }
    }

    ul {
      margin: 0.5rem 0;
      padding-left: 1.25rem;

      li {
        margin: 0.375rem 0;
        line-height: 1.5;
      }
    }

    .message-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.75rem;

      .action-tag {
        font-size: 0.75rem;
      }
    }
  }

  &.loading {
    .typing-indicator {
      display: flex;
      gap: 6px;
      padding: 0.5rem 0;

      span {
        width: 10px;
        height: 10px;
        background: #7AC943;
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;

        &:nth-child(2) {
          animation-delay: 0.2s;
        }

        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
    }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1rem 0;
  justify-content: center;
  flex-shrink: 0;

  :deep(.p-button) {
    border-radius: 20px;
    font-weight: 500;
  }
}

.input-area {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;

  .chat-input {
    flex: 1;
    border-radius: 24px;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;

    &:focus {
      box-shadow: 0 0 0 2px rgba(122, 201, 67, 0.2);
      border-color: #7AC943;
    }
  }

  :deep(.p-button) {
    border-radius: 50%;
    width: 48px;
    height: 48px;
    background: #7AC943;
    border-color: #7AC943;

    &:hover {
      background: #5a9c32;
      border-color: #5a9c32;
    }

    &:disabled {
      background: #e2e8f0;
      border-color: #e2e8f0;
    }
  }
}

@media (max-width: 768px) {
  .drawer-content {
    padding: 1rem;
  }

  .message {
    max-width: 95%;
  }

  .assistant-container {
    max-width: 100%;
  }

  .input-area {
    padding: 1rem;
  }
}
</style>
