<template>
  <div class="ai-assistant-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>
          <i class="pi pi-sparkles"></i>
          Assistant IA
        </h1>
        <p>Analysez vos KPIs, gérez les alertes et obtenez des insights intelligents</p>
      </div>

      <!-- Stats Cards -->
      <div v-if="dashboardStats" class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon conversations">
            <i class="pi pi-comments"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ dashboardStats.conversations?.active || 0 }}</span>
            <span class="stat-label">Conversations actives</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon insights">
            <i class="pi pi-lightbulb"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ dashboardStats.insights?.new || 0 }}</span>
            <span class="stat-label">Nouveaux insights</span>
          </div>
        </div>

        <div class="stat-card critical" v-if="dashboardStats.insights?.critical > 0">
          <div class="stat-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ dashboardStats.insights.critical }}</span>
            <span class="stat-label">Alertes critiques</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon usage">
            <i class="pi pi-bolt"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatNumber(dashboardStats.usage?.tokens_this_week || 0) }}</span>
            <span class="stat-label">Tokens cette semaine</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Tabs -->
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="chat">
            <i class="pi pi-comments"></i>
            <span>Chat</span>
          </Tab>
          <Tab value="insights">
            <i class="pi pi-lightbulb"></i>
            <span>Insights</span>
            <Badge v-if="newInsightsCount > 0" :value="newInsightsCount" severity="danger" />
          </Tab>
          <Tab value="history">
            <i class="pi pi-history"></i>
            <span>Historique</span>
          </Tab>
        </TabList>

        <TabPanels>
          <!-- Chat Tab -->
          <TabPanel value="chat">
            <div class="chat-layout">
              <!-- Conversation List (sidebar) -->
              <div class="conversations-sidebar">
                <div class="sidebar-header">
                  <h3>Conversations</h3>
                  <Button
                    icon="pi pi-plus"
                    text
                    rounded
                    @click="startNewConversation"
                    v-tooltip="'Nouvelle conversation'"
                  />
                </div>

                <div class="conversations-list">
                  <div
                    v-for="conv in conversations"
                    :key="conv.id"
                    :class="['conversation-item', { active: currentConversation?.id === conv.id }]"
                    @click="selectConversation(conv)"
                  >
                    <div class="conv-icon">
                      <i :class="contextIcon(conv.context_type)"></i>
                    </div>
                    <div class="conv-content">
                      <span class="conv-title">{{ conv.title || 'Sans titre' }}</span>
                      <span class="conv-preview">{{ conv.last_message_preview || 'Aucun message' }}</span>
                    </div>
                    <span class="conv-time">{{ formatRelativeTime(conv.last_message_at) }}</span>
                  </div>

                  <div v-if="conversations.length === 0" class="no-conversations">
                    <i class="pi pi-inbox"></i>
                    <p>Aucune conversation</p>
                    <Button label="Commencer" icon="pi pi-plus" @click="startNewConversation" />
                  </div>
                </div>
              </div>

              <!-- Chat Area -->
              <div class="chat-area">
                <AIChatbox
                  :context-type="selectedContextType"
                  :context-data="selectedContextData"
                />
              </div>
            </div>
          </TabPanel>

          <!-- Insights Tab -->
          <TabPanel value="insights">
            <div class="insights-panel">
              <!-- Filters -->
              <div class="insights-filters">
                <div class="filter-group">
                  <label>Sévérité</label>
                  <Select
                    v-model="insightFilters.severity"
                    :options="severityOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Toutes"
                    showClear
                    @change="fetchInsights"
                  />
                </div>

                <div class="filter-group">
                  <label>Type</label>
                  <Select
                    v-model="insightFilters.type"
                    :options="typeOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Tous"
                    showClear
                    @change="fetchInsights"
                  />
                </div>

                <div class="filter-group">
                  <label>Statut</label>
                  <Select
                    v-model="insightFilters.status"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Tous"
                    showClear
                    @change="fetchInsights"
                  />
                </div>
              </div>

              <!-- Insights Summary -->
              <div v-if="insightsSummary" class="insights-summary">
                <div class="summary-item critical">
                  <span class="count">{{ insightsSummary.by_severity?.CRITICAL || 0 }}</span>
                  <span class="label">Critiques</span>
                </div>
                <div class="summary-item high">
                  <span class="count">{{ insightsSummary.by_severity?.HIGH || 0 }}</span>
                  <span class="label">Hautes</span>
                </div>
                <div class="summary-item medium">
                  <span class="count">{{ insightsSummary.by_severity?.MEDIUM || 0 }}</span>
                  <span class="label">Moyennes</span>
                </div>
                <div class="summary-item low">
                  <span class="count">{{ insightsSummary.by_severity?.LOW || 0 }}</span>
                  <span class="label">Basses</span>
                </div>
              </div>

              <!-- Insights List -->
              <div class="insights-grid">
                <AIInsightCard
                  v-for="insight in insights"
                  :key="insight.id"
                  :insight="insight"
                  @view-details="viewInsightDetails"
                  @updated="fetchInsights"
                />

                <div v-if="insights.length === 0 && !loading" class="no-insights">
                  <i class="pi pi-check-circle"></i>
                  <h3>Aucun insight</h3>
                  <p>Tout semble fonctionner correctement!</p>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- History Tab -->
          <TabPanel value="history">
            <div class="history-panel">
              <DataTable
                :value="allConversations"
                :loading="loading"
                paginator
                :rows="10"
                :rowsPerPageOptions="[10, 25, 50]"
                stripedRows
              >
                <Column field="title" header="Titre" sortable>
                  <template #body="{ data }">
                    <span class="conv-title-link" @click="selectConversation(data)">
                      {{ data.title || 'Sans titre' }}
                    </span>
                  </template>
                </Column>
                <Column field="context_type_display" header="Contexte" sortable />
                <Column field="message_count" header="Messages" sortable />
                <Column field="created_at" header="Créée le" sortable>
                  <template #body="{ data }">
                    {{ formatDate(data.created_at) }}
                  </template>
                </Column>
                <Column field="last_message_at" header="Dernière activité" sortable>
                  <template #body="{ data }">
                    {{ formatRelativeTime(data.last_message_at) }}
                  </template>
                </Column>
                <Column header="Actions">
                  <template #body="{ data }">
                    <Button
                      icon="pi pi-eye"
                      text
                      rounded
                      @click="selectConversation(data)"
                      v-tooltip="'Voir'"
                    />
                    <Button
                      v-if="data.status === 'ACTIVE'"
                      icon="pi pi-inbox"
                      text
                      rounded
                      severity="secondary"
                      @click="archiveConversation(data.id)"
                      v-tooltip="'Archiver'"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <!-- Insight Details Dialog -->
    <Dialog
      v-model:visible="showInsightDialog"
      :header="selectedInsight?.title"
      :style="{ width: '600px' }"
      modal
    >
      <div v-if="selectedInsight" class="insight-details">
        <div class="detail-section">
          <h4>Description</h4>
          <p>{{ selectedInsight.description }}</p>
        </div>

        <div v-if="selectedInsight.detailed_analysis" class="detail-section">
          <h4>Analyse détaillée</h4>
          <p>{{ selectedInsight.detailed_analysis }}</p>
        </div>

        <div v-if="selectedInsight.recommended_actions?.length" class="detail-section">
          <h4>Actions recommandées</h4>
          <ul>
            <li v-for="(action, idx) in selectedInsight.recommended_actions" :key="idx">
              {{ action }}
            </li>
          </ul>
        </div>

        <div v-if="selectedInsight.potential_impact" class="detail-section">
          <h4>Impact potentiel</h4>
          <p>{{ selectedInsight.potential_impact }}</p>
        </div>

        <div class="detail-meta">
          <Tag :severity="getSeverityColor(selectedInsight.severity)" :value="selectedInsight.severity_display" />
          <Tag :value="selectedInsight.category_display" />
          <span class="confidence">
            Confiance: {{ Math.round((selectedInsight.confidence_score || 0) * 100) }}%
          </span>
        </div>
      </div>

      <template #footer>
        <Button label="Fermer" @click="showInsightDialog = false" />
        <Button
          v-if="selectedInsight?.status === 'NEW'"
          label="Marquer comme lu"
          icon="pi pi-check"
          @click="markSelectedInsightRead"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAIStore } from '../stores/aiStore'
import AIChatbox from '../components/AIChatbox.vue'
import AIInsightCard from '../components/AIInsightCard.vue'

// Store
const aiStore = useAIStore()

// State
const activeTab = ref('chat')
const showInsightDialog = ref(false)
const selectedInsight = ref(null)
const selectedContextType = ref('GENERAL')
const selectedContextData = ref({})

// Filters
const insightFilters = ref({
  severity: null,
  type: null,
  status: null
})

// Filter Options
const severityOptions = [
  { label: 'Critique', value: 'CRITICAL' },
  { label: 'Haute', value: 'HIGH' },
  { label: 'Moyenne', value: 'MEDIUM' },
  { label: 'Basse', value: 'LOW' }
]

const typeOptions = [
  { label: 'Anomalie', value: 'ANOMALY' },
  { label: 'Tendance', value: 'TREND' },
  { label: 'Prédiction', value: 'PREDICTION' },
  { label: 'Recommandation', value: 'RECOMMENDATION' },
  { label: 'Alerte', value: 'ALERT' },
  { label: 'Optimisation', value: 'OPTIMIZATION' }
]

const statusOptions = [
  { label: 'Nouveau', value: 'NEW' },
  { label: 'Lu', value: 'READ' },
  { label: 'Pris en compte', value: 'ACKNOWLEDGED' },
  { label: 'Traité', value: 'ACTED_UPON' },
  { label: 'Ignoré', value: 'DISMISSED' }
]

// Computed
const conversations = computed(() => aiStore.activeConversations)
const allConversations = computed(() => aiStore.conversations)
const currentConversation = computed(() => aiStore.currentConversation)
const insights = computed(() => aiStore.insights)
const insightsSummary = computed(() => aiStore.insightsSummary)
const dashboardStats = computed(() => aiStore.dashboardStats)
const loading = computed(() => aiStore.loading)
const newInsightsCount = computed(() => aiStore.newInsights.length)

// Methods
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 7) return `Il y a ${days}j`
  return formatDate(dateStr)
}

const contextIcon = (type) => {
  const icons = {
    'GENERAL': 'pi pi-comments',
    'DASHBOARD': 'pi pi-chart-bar',
    'MES': 'pi pi-cog',
    'ENGINS': 'pi pi-car',
    'COLLECT': 'pi pi-clipboard',
    'DOCUMENTS': 'pi pi-file',
    'ALERTS': 'pi pi-bell',
    'KPI': 'pi pi-chart-line',
    'TEAMS': 'pi pi-users',
    'STOCK': 'pi pi-box',
    'ROI': 'pi pi-dollar'
  }
  return icons[type] || 'pi pi-comments'
}

const getSeverityColor = (severity) => {
  const colors = {
    'CRITICAL': 'danger',
    'HIGH': 'warn',
    'MEDIUM': 'info',
    'LOW': 'secondary'
  }
  return colors[severity] || 'info'
}

const startNewConversation = async () => {
  aiStore.resetCurrentState()
  await aiStore.createConversation({
    context_type: selectedContextType.value,
    context_data: selectedContextData.value
  })
}

const selectConversation = async (conv) => {
  await aiStore.fetchConversation(conv.id)
  activeTab.value = 'chat'
}

const archiveConversation = async (id) => {
  await aiStore.archiveConversation(id)
}

const fetchInsights = async () => {
  const params = {}
  if (insightFilters.value.severity) params.severity = insightFilters.value.severity
  if (insightFilters.value.type) params.type = insightFilters.value.type
  if (insightFilters.value.status) params.status = insightFilters.value.status

  await aiStore.fetchInsights(params)
}

const viewInsightDetails = (insight) => {
  selectedInsight.value = insight
  showInsightDialog.value = true
}

const markSelectedInsightRead = async () => {
  if (selectedInsight.value) {
    await aiStore.markInsightRead(selectedInsight.value.id)
    selectedInsight.value.status = 'READ'
    await fetchInsights()
  }
}

// Watch tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'insights') {
    fetchInsights()
    aiStore.fetchInsightsSummary()
  } else if (newTab === 'history') {
    aiStore.fetchConversations()
  }
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    aiStore.fetchConversations({ status: 'ACTIVE' }),
    aiStore.fetchDashboardStats(),
    aiStore.fetchInsights({ status: 'NEW' })
  ])
})
</script>

<style scoped lang="scss">
.ai-assistant-page {
  padding: 1.5rem;
  min-height: 100vh;
  background: var(--surface-ground);
}

.page-header {
  margin-bottom: 1.5rem;

  .header-content {
    margin-bottom: 1rem;

    h1 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0 0 0.5rem;
      font-size: 1.75rem;
      color: var(--text-color);

      i {
        color: var(--primary-color);
      }
    }

    p {
      margin: 0;
      color: var(--text-color-secondary);
    }
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--surface-card);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &.critical {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, var(--surface-card) 100%);
    border: 1px solid var(--red-200);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-100);

    i {
      font-size: 1.25rem;
      color: var(--text-color-secondary);
    }

    &.conversations {
      background: var(--primary-100);
      i { color: var(--primary-color); }
    }

    &.insights {
      background: var(--yellow-100);
      i { color: var(--yellow-600); }
    }

    &.usage {
      background: var(--green-100);
      i { color: var(--green-600); }
    }
  }

  .stat-content {
    display: flex;
    flex-direction: column;

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }
  }
}

.main-content {
  background: var(--surface-card);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

:deep(.p-tabs) {
  .p-tablist {
    background: var(--surface-50);
    border-bottom: 1px solid var(--surface-border);
    padding: 0 1rem;
  }

  .p-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.25rem;

    .p-badge {
      margin-left: 0.25rem;
    }
  }

  .p-tabpanels {
    padding: 0;
  }

  .p-tabpanel {
    padding: 0;
  }
}

// Chat Layout
.chat-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: calc(100vh - 300px);
  min-height: 500px;
}

.conversations-sidebar {
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--surface-border);

    h3 {
      margin: 0;
      font-size: 1rem;
    }
  }
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid var(--surface-50);
  transition: background 0.2s;

  &:hover {
    background: var(--surface-50);
  }

  &.active {
    background: var(--primary-50);
    border-left: 3px solid var(--primary-color);
  }

  .conv-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--surface-100);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      font-size: 1rem;
      color: var(--text-color-secondary);
    }
  }

  .conv-content {
    flex: 1;
    min-width: 0;

    .conv-title {
      display: block;
      font-weight: 500;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conv-preview {
      display: block;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .conv-time {
    font-size: 0.7rem;
    color: var(--text-color-secondary);
    flex-shrink: 0;
  }
}

.no-conversations {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);

  i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  p {
    margin: 0 0 1rem;
  }
}

.chat-area {
  height: 100%;
}

// Insights Panel
.insights-panel {
  padding: 1.5rem;
}

.insights-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    label {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    :deep(.p-select) {
      min-width: 150px;
    }
  }
}

.insights-summary {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;

  .summary-item {
    text-align: center;

    .count {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .label {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    &.critical .count { color: var(--red-500); }
    &.high .count { color: var(--orange-500); }
    &.medium .count { color: var(--blue-500); }
    &.low .count { color: var(--surface-500); }
  }
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.no-insights {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);

  i {
    font-size: 3rem;
    color: var(--green-500);
    margin-bottom: 1rem;
  }

  h3 {
    margin: 0 0 0.5rem;
    color: var(--text-color);
  }

  p {
    margin: 0;
  }
}

// History Panel
.history-panel {
  padding: 1.5rem;

  .conv-title-link {
    color: var(--primary-color);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

// Insight Details Dialog
.insight-details {
  .detail-section {
    margin-bottom: 1.5rem;

    h4 {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      text-transform: uppercase;
    }

    p {
      margin: 0;
      line-height: 1.6;
    }

    ul {
      margin: 0;
      padding-left: 1.25rem;

      li {
        padding: 0.25rem 0;
      }
    }
  }

  .detail-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--surface-border);

    .confidence {
      margin-left: auto;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }
  }
}

// Responsive
@media (max-width: 992px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }

  .conversations-sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }
}
</style>
