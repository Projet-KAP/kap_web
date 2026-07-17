<template>
  <div class="tag-discovery-assistant">
    <!-- Header -->
    <div class="assistant-header">
      <div class="header-content">
        <i class="pi pi-database"></i>
        <div class="header-text">
          <h3>Assistant de Creation de Donnees</h3>
          <span class="subtitle">Créez et organisez vos données avec l'aide de l'IA</span>
        </div>
      </div>
      <Button
        v-if="showClose"
        icon="pi pi-times"
        text
        rounded
        severity="secondary"
        @click="$emit('close')"
      />
    </div>

    <!-- Content -->
    <div class="assistant-content">
      <!-- Welcome State -->
      <div v-if="!hasStarted" class="welcome-state">
        <div class="welcome-icon">
          <i class="pi pi-sparkles"></i>
        </div>
        <h3>Bienvenue dans l'assistant de creation</h3>
        <p>Je vous aide a creer et organiser les donnees que vous souhaitez suivre.</p>

        <div class="quick-start">
          <h4>Quel type de donnees voulez-vous creer?</h4>
          <div class="quick-options">
            <Card
              v-for="option in quickStartOptions"
              :key="option.id"
              class="option-card"
              @click="selectQuickOption(option)"
            >
              <template #content>
                <div class="option-content">
                  <i :class="option.icon"></i>
                  <div class="option-text">
                    <span class="option-title">{{ option.title }}</span>
                    <span class="option-desc">{{ option.description }}</span>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>

        <div class="activity-input">
          <h4>Ou decrivez les donnees que vous souhaitez suivre</h4>
          <div class="input-group">
            <InputText
              v-model="activityDescription"
              placeholder="Ex: suivi de production, consommation carburant, heures de travail..."
              class="activity-field"
            />
            <Button
              label="Analyser"
              icon="pi pi-search"
              :loading="loading"
              :disabled="!activityDescription.trim()"
              @click="analyzeActivity"
            />
          </div>
        </div>
      </div>

      <!-- Chat Interface -->
      <div v-else class="chat-interface">
        <!-- Messages -->
        <div class="messages-list" ref="messagesContainer">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message', msg.role]"
          >
            <div class="message-avatar">
              <i :class="msg.role === 'user' ? 'pi pi-user' : 'pi pi-android'"></i>
            </div>
            <div class="message-body">
              <div class="message-text" v-html="formatMessage(msg.content)"></div>
              <div v-if="msg.actions && msg.actions.length > 0" class="message-actions">
                <Tag
                  v-for="action in msg.actions"
                  :key="action.type"
                  :severity="getActionSeverity(action.type)"
                >
                  {{ getActionLabel(action) }}
                </Tag>
              </div>
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="loading" class="message assistant">
            <div class="message-avatar">
              <i class="pi pi-android"></i>
            </div>
            <div class="message-body">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="chat-input">
          <Textarea
            v-model="userInput"
            placeholder="Posez votre question sur vos données..."
            :autoResize="true"
            rows="1"
            :disabled="loading"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <Button
            icon="pi pi-send"
            :loading="loading"
            :disabled="!userInput.trim() || loading"
            @click="sendMessage"
            rounded
          />
        </div>
      </div>
    </div>

    <!-- Suggested Tags Panel -->
    <div v-if="suggestedTags.length > 0" class="suggested-tags-panel">
      <div class="panel-header">
        <h4>Donnees suggerees</h4>
        <Button
          label="Tout sélectionner"
          text
          size="small"
          @click="selectAllTags"
        />
      </div>
      <div class="tags-list">
        <div
          v-for="tag in suggestedTags"
          :key="tag.id"
          :class="['tag-item', { selected: selectedTags.includes(tag.id) }]"
          @click="toggleTag(tag.id)"
        >
          <Checkbox
            :modelValue="selectedTags.includes(tag.id)"
            :binary="true"
          />
          <div class="tag-info">
            <span class="tag-name">{{ tag.display_name }}</span>
            <span class="tag-type">{{ tag.tag_type }} | {{ tag.data_type }}</span>
          </div>
          <Tag
            :severity="tag.relevance === 'high' ? 'success' : 'info'"
            :value="tag.relevance === 'high' ? 'Recommande' : 'Compatible'"
          />
        </div>
      </div>
      <div class="panel-actions">
        <Button
          label="Confirmer la selection"
          icon="pi pi-check"
          :disabled="selectedTags.length === 0"
          severity="secondary"
          @click="confirmSelection"
        />
        <Button
          label="Creation complete"
          icon="pi pi-sparkles"
          :disabled="selectedTags.length === 0"
          :loading="workflowLoading"
          @click="runCompleteWorkflow"
          v-tooltip.top="'Cree automatiquement modele + Excel + tableau de bord'"
        />
      </div>
    </div>

    <!-- Workflow Results Dialog -->
    <Dialog
      v-model:visible="showWorkflowResults"
      header="Creation terminee"
      :modal="true"
      :closable="true"
      :style="{ width: '500px' }"
    >
      <div v-if="workflowResults" class="workflow-results">
        <div class="result-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <h3>Vos donnees sont pretes!</h3>

        <div class="results-list">
          <!-- Template -->
          <div v-if="workflowResults.template" class="result-item success">
            <i class="pi pi-file"></i>
            <div class="result-info">
              <span class="result-title">Modele de donnees cree</span>
              <span class="result-detail">{{ workflowResults.template.template_name }}</span>
            </div>
            <i class="pi pi-check"></i>
          </div>
          <div v-else class="result-item warning">
            <i class="pi pi-file"></i>
            <span class="result-title">Modele de donnees</span>
            <i class="pi pi-times"></i>
          </div>

          <!-- Excel -->
          <div v-if="workflowResults.excel_file" class="result-item success">
            <i class="pi pi-file-excel"></i>
            <div class="result-info">
              <span class="result-title">Fichier Excel genere</span>
              <span class="result-detail">{{ workflowResults.excel_file.filename }}</span>
            </div>
            <Button
              icon="pi pi-download"
              text
              rounded
              size="small"
              @click="downloadExcel"
            />
          </div>
          <div v-else class="result-item warning">
            <i class="pi pi-file-excel"></i>
            <span class="result-title">Fichier Excel</span>
            <i class="pi pi-times"></i>
          </div>

          <!-- Dashboard -->
          <div v-if="workflowResults.dashboard" class="result-item success">
            <i class="pi pi-chart-bar"></i>
            <div class="result-info">
              <span class="result-title">Tableau de bord cree</span>
              <span class="result-detail">{{ workflowResults.dashboard.dashboard_name }}</span>
            </div>
            <Button
              icon="pi pi-external-link"
              text
              rounded
              size="small"
              @click="openDashboard"
            />
          </div>
          <div v-else class="result-item warning">
            <i class="pi pi-chart-bar"></i>
            <span class="result-title">Tableau de bord</span>
            <i class="pi pi-times"></i>
          </div>
        </div>

        <div class="result-summary">
          <p>
            <strong>{{ workflowResults.summary?.tags_count || 0 }}</strong> donnees creees
            pour la categorie <strong>{{ workflowResults.summary?.module || 'N/A' }}</strong>
          </p>
        </div>
      </div>

      <template #footer>
        <Button
          label="Terminer"
          icon="pi pi-check"
          @click="closeWorkflowResults"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { axiosInstance } from '@/main'

// Props & Emits
const props = defineProps({
  showClose: {
    type: Boolean,
    default: false
  },
  initialActivity: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'tags-selected', 'configuration-complete'])

// State
const hasStarted = ref(false)
const loading = ref(false)
const workflowLoading = ref(false)
const activityDescription = ref(props.initialActivity)
const userInput = ref('')
const messages = ref([])
const suggestedTags = ref([])
const selectedTags = ref([])
const messagesContainer = ref(null)
const conversationId = ref(null)
const showWorkflowResults = ref(false)
const workflowResults = ref(null)

// Quick start options
const quickStartOptions = [
  {
    id: 'production',
    title: 'Données de production',
    description: 'Quantites, volumes, rendements',
    icon: 'pi pi-chart-bar',
    activity: 'données de production : quantités produites, volumes, rendements'
  },
  {
    id: 'temps',
    title: 'Temps et heures',
    description: 'Heures travaillees, durees, pointage',
    icon: 'pi pi-clock',
    activity: 'données temporelles : heures de travail, durées, temps de cycle'
  },
  {
    id: 'ressources',
    title: 'Ressources et consommation',
    description: 'Carburant, materiaux, energie',
    icon: 'pi pi-box',
    activity: 'données de consommation : carburant, matériaux, énergie'
  },
  {
    id: 'custom',
    title: 'Autre type',
    description: 'Décrivez vos données',
    icon: 'pi pi-pencil',
    activity: ''
  }
]

// Methods
const selectQuickOption = (option) => {
  if (option.activity) {
    activityDescription.value = option.activity
    analyzeActivity()
  } else {
    // Focus on the input for custom activity
    hasStarted.value = false
  }
}

const analyzeActivity = async () => {
  if (!activityDescription.value.trim()) return

  hasStarted.value = true
  loading.value = true

  // Add user message
  messages.value.push({
    role: 'user',
    content: `Je souhaite creer les donnees suivantes: ${activityDescription.value}. Quelles donnees me recommandes-tu?`
  })

  try {
    const response = await axiosInstance.post('/ai/tag-discovery/quick-chat/', {
      content: `Je souhaite creer les donnees suivantes: ${activityDescription.value}. Quelles donnees me recommandes-tu de creer?`
    })

    conversationId.value = response.data.conversation_id

    messages.value.push({
      role: 'assistant',
      content: response.data.response,
      actions: response.data.actions_performed || []
    })

    // Extract suggested tags from the response if any
    if (response.data.data_context?.tags_with_data) {
      suggestedTags.value = response.data.data_context.tags_with_data
    }

    scrollToBottom()
  } catch (error) {
    console.error('Erreur analyse activite:', error)
    const errorMessage = error.response?.data?.error
      || error.response?.data?.detail
      || error.message
      || 'Une erreur inconnue s\'est produite'
    messages.value.push({
      role: 'assistant',
      content: `Desole, une erreur s'est produite: ${errorMessage}`
    })
  } finally {
    loading.value = false
  }
}

const sendMessage = async () => {
  const content = userInput.value.trim()
  if (!content || loading.value) return

  userInput.value = ''
  loading.value = true

  messages.value.push({
    role: 'user',
    content: content
  })

  try {
    const response = await axiosInstance.post('/ai/tag-discovery/quick-chat/', {
      content: content
    })

    messages.value.push({
      role: 'assistant',
      content: response.data.response,
      actions: response.data.actions_performed || []
    })

    scrollToBottom()
  } catch (error) {
    console.error('Erreur envoi message:', error)
    const errorMessage = error.response?.data?.error
      || error.response?.data?.detail
      || error.message
      || 'Une erreur inconnue s\'est produite'
    messages.value.push({
      role: 'assistant',
      content: `Desole, une erreur s'est produite: ${errorMessage}`
    })
  } finally {
    loading.value = false
  }
}

const formatMessage = (content) => {
  if (!content) return ''
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(/\n/g, '<br>')
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const getActionSeverity = (type) => {
  const severities = {
    'tag_created': 'success',
    'tags_suggested': 'info',
    'tags_searched': 'secondary',
    'template_created': 'success',
    'excel_generated': 'success',
    'dashboard_created': 'success'
  }
  return severities[type] || 'info'
}

const getActionLabel = (action) => {
  const labels = {
    'tag_created': `Donnee creee: ${action.tag_name || ''}`,
    'tags_suggested': `${action.count || 0} donnees suggerees`,
    'tags_searched': `${action.count || 0} donnees trouvees`,
    'template_created': `Modele cree: ${action.template_name || ''}`,
    'excel_generated': `Excel genere: ${action.filename || ''}`,
    'dashboard_created': `Tableau de bord cree: ${action.dashboard_name || ''}`
  }
  return labels[action.type] || action.type
}

const toggleTag = (tagId) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index === -1) {
    selectedTags.value.push(tagId)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

const selectAllTags = () => {
  selectedTags.value = suggestedTags.value.map(t => t.id)
}

const confirmSelection = () => {
  const selected = suggestedTags.value.filter(t => selectedTags.value.includes(t.id))
  emit('tags-selected', selected)
  emit('configuration-complete', {
    tags: selected,
    conversationId: conversationId.value
  })
}

const runCompleteWorkflow = async () => {
  if (selectedTags.value.length === 0) return

  workflowLoading.value = true

  // Add message to chat
  messages.value.push({
    role: 'user',
    content: 'Lance la creation complete: cree le modele, genere le fichier Excel et cree le tableau de bord.'
  })

  try {
    const response = await axiosInstance.post('/ai/tag-discovery/complete-workflow/', {
      activity_description: activityDescription.value,
      tag_ids: selectedTags.value,
      generate_excel: true
    })

    workflowResults.value = response.data

    // Add response to chat
    messages.value.push({
      role: 'assistant',
      content: response.data.success
        ? 'Création terminée avec succès ! J\'ai créé le modèle de données, généré un fichier Excel d\'exemple et créé un tableau de bord avec vos indicateurs.'
        : 'Il y a eu des problemes lors de la creation. Veuillez verifier les resultats.',
      actions: [
        ...(response.data.template ? [{ type: 'template_created', ...response.data.template }] : []),
        ...(response.data.excel_file ? [{ type: 'excel_generated', ...response.data.excel_file }] : []),
        ...(response.data.dashboard ? [{ type: 'dashboard_created', ...response.data.dashboard }] : [])
      ]
    })

    scrollToBottom()

    // Show results dialog
    showWorkflowResults.value = true

  } catch (error) {
    console.error('Erreur workflow complet:', error)
    const errorMessage = error.response?.data?.error
      || error.response?.data?.detail
      || error.message
      || 'Une erreur inconnue s\'est produite'
    messages.value.push({
      role: 'assistant',
      content: `Desole, une erreur s'est produite lors de la configuration: ${errorMessage}`
    })
  } finally {
    workflowLoading.value = false
  }
}

const downloadExcel = () => {
  if (workflowResults.value?.excel_file?.download_url) {
    window.open(workflowResults.value.excel_file.download_url, '_blank')
  }
}

const openDashboard = () => {
  if (workflowResults.value?.dashboard?.dashboard_id) {
    // Navigate to dashboard
    window.location.href = `/dashboard/${workflowResults.value.dashboard.dashboard_id}`
  }
}

const closeWorkflowResults = () => {
  showWorkflowResults.value = false
  emit('configuration-complete', {
    tags: suggestedTags.value.filter(t => selectedTags.value.includes(t.id)),
    conversationId: conversationId.value,
    workflowResults: workflowResults.value
  })
}

// Lifecycle
onMounted(() => {
  if (props.initialActivity) {
    activityDescription.value = props.initialActivity
    analyzeActivity()
  }
})
</script>

<style scoped lang="scss">
.tag-discovery-assistant {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-ground);
}

.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: #0B2B3C;
  color: white;

  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;

    > i {
      font-size: 1.5rem;
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .subtitle {
        font-size: 0.875rem;
        opacity: 0.8;
      }
    }
  }

  :deep(.p-button) {
    color: white;
  }
}

.assistant-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.welcome-state {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;

  .welcome-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #0B2B3C;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;

    i {
      font-size: 2rem;
      color: white;
    }
  }

  h3 {
    margin: 0 0 0.5rem;
    color: var(--text-color);
    font-size: 1.5rem;
  }

  > p {
    color: var(--text-color-secondary);
    margin-bottom: 2rem;
  }

  h4 {
    margin: 0 0 1rem;
    font-size: 1rem;
    color: var(--text-color);
  }
}

.quick-start {
  margin-bottom: 2rem;

  .quick-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;

    @media (max-width: 576px) {
      grid-template-columns: 1fr;
    }
  }
}

.option-card {
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;

  &:hover {
    border-color: #0B2B3C;
    transform: translateY(-2px);
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-align: left;

    > i {
      font-size: 1.5rem;
      color: #0B2B3C;
    }

    .option-text {
      display: flex;
      flex-direction: column;

      .option-title {
        font-weight: 600;
        color: var(--text-color);
      }

      .option-desc {
        font-size: 0.875rem;
        color: var(--text-color-secondary);
      }
    }
  }
}

.activity-input {
  .input-group {
    display: flex;
    gap: 0.5rem;

    .activity-field {
      flex: 1;
    }
  }
}

.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1rem;
}

.message {
  display: flex;
  gap: 0.75rem;
  max-width: 85%;

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;

    .message-avatar {
      background: #0B2B3C;
      color: white;
    }

    .message-body {
      background: #0B2B3C;
      color: white;
      border-radius: 16px 16px 4px 16px;
    }
  }

  &.assistant {
    align-self: flex-start;

    .message-avatar {
      background: var(--surface-200);
    }

    .message-body {
      background: var(--surface-card);
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
}

.message-body {
  padding: 0.75rem 1rem;

  .message-text {
    line-height: 1.5;
  }

  .message-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 0.5rem 0;

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

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);

  :deep(.p-textarea) {
    flex: 1;
    max-height: 120px;
    resize: none;
  }
}

.suggested-tags-panel {
  border-top: 1px solid var(--surface-border);
  background: var(--surface-card);
  max-height: 300px;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--surface-border);

    h4 {
      margin: 0;
      font-size: 1rem;
    }
  }

  .tags-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 1.5rem;
  }

  .tag-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: var(--surface-hover);
    }

    &.selected {
      background: rgba(11, 43, 60, 0.08);
    }

    .tag-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .tag-name {
        font-weight: 500;
      }

      .tag-type {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
      }
    }
  }

  .panel-actions {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--surface-border);
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
}

.workflow-results {
  text-align: center;

  .result-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #7AC943;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;

    i {
      font-size: 2.5rem;
      color: white;
    }
  }

  h3 {
    margin: 0 0 1.5rem;
    color: var(--text-color);
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .result-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    text-align: left;

    > i:first-child {
      font-size: 1.25rem;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .result-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .result-title {
        font-weight: 500;
      }

      .result-detail {
        font-size: 0.875rem;
        color: var(--text-color-secondary);
      }
    }

    > i:last-child {
      font-size: 1rem;
    }

    &.success {
      background: rgba(122, 201, 67, 0.1);
      border: 1px solid rgba(122, 201, 67, 0.3);

      > i:first-child {
        background: rgba(122, 201, 67, 0.2);
        color: #5a9e33;
      }

      > i:last-child {
        color: #7AC943;
      }
    }

    &.warning {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);

      > i:first-child {
        background: rgba(255, 193, 7, 0.2);
        color: #d4a106;
      }

      > i:last-child {
        color: #ffc107;
      }
    }
  }

  .result-summary {
    padding: 1rem;
    background: var(--surface-100);
    border-radius: 8px;

    p {
      margin: 0;
      color: var(--text-color-secondary);
    }
  }
}
</style>
