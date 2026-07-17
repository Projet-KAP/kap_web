<template>
  <div class="ai-assistant">
    <!-- Trigger Button - Floating AI Button Enhanced -->
    <div :class="['ai-trigger-container', { 'has-alerts': hasRecommendations, [severityClass]: true }]">
      <!-- Pulse ring for critical alerts -->
      <div v-if="severityClass === 'critical'" class="trigger-pulse"></div>

      <Button
        :icon="visible ? 'pi pi-times' : undefined"
        :class="['ai-trigger', { 'expanded': visible, [severityClass]: true, 'has-new': hasNewRecommendations }]"
        @click="visible = true"
        v-tooltip.left="triggerTooltip"
        text
        rounded
      >
        <template v-if="!visible" #icon>
          <img src="/chatbot.png" alt="Assistant IA" style="width:120px;height:120px;object-fit:contain;" />
        </template>
      </Button>

      <!-- Badge count amélioré -->
      <Transition name="badge-pop">
        <div v-if="hasRecommendations && !visible" :class="['trigger-badge', severityClass]">
          {{ storeRecommendations.length > 9 ? '9+' : storeRecommendations.length }}
        </div>
      </Transition>

      <!-- Mini label pour les alertes critiques -->
      <Transition name="label-slide">
        <div v-if="severityClass === 'critical' && !visible" class="trigger-label">
          Action requise
        </div>
      </Transition>
    </div>

    <!-- Full Screen Drawer -->
    <Drawer
      v-model:visible="visible"
      position="full"
      class="ai-drawer"
    >
      <template #header>
        <div class="drawer-header">
          <i class="pi pi-sparkles header-icon"></i>
          <div class="header-text">
            <h2>Votre copilote IA</h2>
            <p>Assistant intelligent pour optimiser vos performances industrielles</p>
          </div>
        </div>
      </template>

      <div class="drawer-content">
        <!-- Action Templates Section - Organisées par catégories -->
        <div class="templates-section">
          <div class="section-header">
            <h3>
              <i class="pi pi-bolt"></i>
              Actions rapides
            </h3>
            <p>Sélectionnez une catégorie puis une action</p>
          </div>

          <!-- Catégories -->
          <div class="categories-grid">
            <div
              v-for="category in actionCategories"
              :key="category.id"
              :class="['category-card', { 'active': selectedCategory === category.id }]"
              @click="selectCategory(category.id)"
            >
              <div class="category-icon" :style="{ background: category.color }">
                <i :class="category.icon"></i>
              </div>
              <div class="category-content">
                <h4>{{ category.title }}</h4>
                <span class="action-count">{{ category.actions.length }} actions</span>
              </div>
              <div class="category-chevron">
                <i :class="selectedCategory === category.id ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
              </div>
            </div>
          </div>

          <!-- Actions de la catégorie sélectionnée -->
          <Transition name="slide-fade">
            <div v-if="selectedCategory && getSelectedCategory" class="actions-panel">
              <div class="actions-header">
                <div class="actions-title">
                  <i :class="getSelectedCategory.icon" :style="{ color: getSelectedCategory.color }"></i>
                  <span>{{ getSelectedCategory.title }}</span>
                </div>
                <Button
                  icon="pi pi-times"
                  text
                  rounded
                  size="small"
                  @click="selectedCategory = null"
                />
              </div>
              <div class="actions-grid">
                <div
                  v-for="action in displayedActions"
                  :key="action.id"
                  class="action-card"
                  @click="selectTemplate(action)"
                >
                  <div class="action-icon" :style="{ background: getSelectedCategory.color + '15', color: getSelectedCategory.color }">
                    <i :class="action.icon"></i>
                  </div>
                  <div class="action-content">
                    <h5>{{ action.title }}</h5>
                    <p>{{ action.description }}</p>
                  </div>
                  <div class="action-arrow">
                    <i class="pi pi-arrow-right"></i>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Active Recommendations Section (Polling temps réel) -->
        <div class="recommendations-section">
          <div class="section-header-enhanced">
            <div class="header-left">
              <div class="title-row">
                <div class="title-icon" :class="severityClass">
                  <i class="pi pi-bell"></i>
                </div>
                <h3>Recommandations</h3>
                <Tag
                  v-if="hasRecommendations"
                  :value="pagination.total_count || storeRecommendations.length"
                  :severity="tagSeverity"
                  class="count-badge"
                />
              </div>
              <p class="section-subtitle">Alertes et optimisations détectées par l'IA</p>
            </div>
            <div class="header-actions-enhanced">
              <div v-if="lastUpdate" class="last-update-chip">
                <i class="pi pi-clock"></i>
                <span>{{ formatTime(lastUpdate) }}</span>
              </div>
              <Button
                icon="pi pi-refresh"
                text
                rounded
                size="small"
                :loading="recommendationsLoading"
                @click="refreshRecommendations"
                v-tooltip.left="'Actualiser'"
                class="refresh-btn"
              />
            </div>
          </div>

          <!-- Loading state - Improved -->
          <div v-if="recommendationsLoading && !hasRecommendations" class="recommendations-loading-enhanced">
            <div class="loading-animation">
              <div class="pulse-ring"></div>
              <div class="loading-icon">
                <i class="pi pi-cog pi-spin"></i>
              </div>
            </div>
            <h4>Analyse en cours</h4>
            <p>L'IA examine vos données pour détecter des anomalies...</p>
            <div class="loading-steps">
              <span class="step active"><i class="pi pi-check"></i> Collecte des données</span>
              <span class="step active"><i class="pi pi-check"></i> Analyse des tendances</span>
              <span class="step"><i class="pi pi-spin pi-spinner"></i> Generation des recommandations</span>
            </div>
          </div>

          <!-- Empty state - Improved -->
          <div v-else-if="!hasRecommendations" class="recommendations-empty-enhanced">
            <div class="empty-illustration">
              <div class="check-circle">
                <i class="pi pi-check"></i>
              </div>
              <div class="sparkles">
                <span class="sparkle s1"></span>
                <span class="sparkle s2"></span>
                <span class="sparkle s3"></span>
              </div>
            </div>
            <h4>Tout est optimal !</h4>
            <p>Aucune anomalie détectée. Vos opérations fonctionnent correctement.</p>
            <div class="next-check">
              <i class="pi pi-clock"></i>
              Prochaine analyse dans 30 minutes
            </div>
          </div>

          <!-- Recommendations list - Enhanced -->
          <div v-else class="recommendations-list">
            <!-- Summary bar -->
            <div class="recommendations-summary" v-if="storeRecommendations.length > 0">
              <div class="summary-item critical" v-if="criticalCount > 0">
                <i class="pi pi-exclamation-triangle"></i>
                <span>{{ criticalCount }} critique{{ criticalCount > 1 ? 's' : '' }}</span>
              </div>
              <div class="summary-item high" v-if="highCount > 0">
                <i class="pi pi-exclamation-circle"></i>
                <span>{{ highCount }} important{{ highCount > 1 ? 's' : '' }}</span>
              </div>
              <div class="summary-item medium" v-if="mediumCount > 0">
                <i class="pi pi-info-circle"></i>
                <span>{{ mediumCount }} moyen{{ mediumCount > 1 ? 's' : '' }}</span>
              </div>
            </div>

            <TransitionGroup name="rec-list" tag="div" class="recommendations-grid-enhanced">
              <div
                v-for="(recommendation, index) in storeRecommendations"
                :key="recommendation.id || `rec-${index}`"
                :class="['recommendation-card-enhanced', recommendation.priority, { 'expanded': expandedCard === index }]"
              >
                <!-- Card Header -->
                <div class="card-header" @click="toggleCard(index)">
                  <div class="priority-indicator">
                    <div :class="['priority-dot', recommendation.priority]">
                      <i :class="getPriorityIcon(recommendation.priority)"></i>
                    </div>
                    <span class="priority-label">{{ getPriorityLabel(recommendation.priority) }}</span>
                  </div>

                  <div class="card-content">
                    <h4 class="card-title">{{ recommendation.title }}</h4>
                    <p class="card-description">{{ recommendation.description }}</p>
                  </div>

                  <div class="card-meta">
                    <div class="impact-indicator" :class="getImpactClass(recommendation.impact)">
                      <div class="impact-bar">
                        <div class="impact-fill" :style="{ width: recommendation.impact + '%' }"></div>
                      </div>
                      <span class="impact-text">{{ recommendation.impact }}%</span>
                    </div>
                    <i :class="['expand-icon', 'pi', expandedCard === index ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
                  </div>
                </div>

                <!-- Card Details (Expandable) -->
                <Transition name="expand">
                  <div v-if="expandedCard === index && recommendation.details" class="card-details">
                    <div v-if="recommendation.details.cause" class="detail-block">
                      <div class="detail-icon cause">
                        <i class="pi pi-search"></i>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">Cause identifiée</span>
                        <p>{{ recommendation.details.cause }}</p>
                      </div>
                    </div>

                    <div v-if="recommendation.details.actions && recommendation.details.actions.length" class="detail-block">
                      <div class="detail-icon actions">
                        <i class="pi pi-list-check"></i>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">Actions recommandées</span>
                        <ul class="actions-list">
                          <li v-for="(action, actionIdx) in recommendation.details.actions" :key="actionIdx">
                            <i class="pi pi-arrow-right"></i>
                            {{ action }}
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div v-if="recommendation.details.timeline" class="detail-block">
                      <div class="detail-icon timeline">
                        <i class="pi pi-clock"></i>
                      </div>
                      <div class="detail-content">
                        <span class="detail-label">Délai suggéré</span>
                        <p>{{ recommendation.details.timeline }}</p>
                      </div>
                    </div>
                  </div>
                </Transition>

                <!-- Card Footer Actions -->
                <div class="card-footer">
                  <Button
                    label="Appliquer"
                    icon="pi pi-check"
                    size="small"
                    class="btn-apply"
                    @click.stop="validateRecommendation(recommendation, index)"
                  />
                  <Button
                    label="Ignorer"
                    icon="pi pi-times"
                    size="small"
                    text
                    class="btn-dismiss"
                    @click.stop="rejectRecommendation(recommendation, index)"
                  />
                </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.total_pages > 1" class="recommendations-pagination-enhanced">
            <div class="pagination-info">
              Page {{ pagination.page }} sur {{ pagination.total_pages }}
            </div>
            <Paginator
              :rows="pagination.page_size"
              :totalRecords="pagination.total_count"
              :first="(pagination.page - 1) * pagination.page_size"
              :rowsPerPageOptions="[3, 5, 10]"
              @page="onPageChange"
              template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            />
          </div>
        </div>

        <!-- Chat Interface Section -->
        <div class="chat-section" ref="chatSection">
          <div class="section-header">
            <h3>
              <i class="pi pi-comments"></i>
              Discussion avec l'IA
            </h3>
            <p>Posez vos questions ou demandez des analyses personnalisées</p>
          </div>

          <div class="chat-container">
            <!-- Chat Messages -->
            <div class="chat-messages" ref="chatMessages">
              <div
                v-for="(message, index) in chatHistory"
                :key="index"
                :class="['chat-message', message.role]"
              >
                <div class="message-avatar">
                  <i :class="message.role === 'user' ? 'pi pi-user' : 'pi pi-sparkles'"></i>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-sender">{{ message.role === 'user' ? 'Vous' : 'Assistant IA' }}</span>
                    <span class="message-time">{{ message.time }}</span>
                  </div>
                  <div class="message-text">{{ message.content }}</div>
                </div>
              </div>

              <!-- Loading indicator -->
              <div v-if="isTyping" class="chat-message assistant typing">
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

            <!-- Chat Input -->
            <div class="chat-input-container">
              <div class="quick-actions">
                <Button
                  v-for="quick in quickActions"
                  :key="quick.id"
                  :label="quick.label"
                  size="small"
                  text
                  @click="sendQuickAction(quick.prompt)"
                  class="quick-action-btn"
                />
              </div>
              <div class="chat-input-wrapper">
                <InputText
                  v-model="chatInput"
                  placeholder="Posez votre question..."
                  @keydown.enter="sendMessage"
                  class="chat-input"
                />
                <Button
                  icon="pi pi-send"
                  @click="sendMessage"
                  :disabled="!chatInput.trim()"
                  class="send-btn"
                />
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

// Props
const props = defineProps({
  kpiType: {
    type: String,
    default: 'general'
  },
  contextType: {
    type: String,
    default: 'DASHBOARD'
  },
  contextData: {
    type: Object,
    default: () => ({})
  },
  siteId: {
    type: [Number, String],
    default: null
  },
  autoStart: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['recommendation-applied', 'recommendation-dismissed', 'refresh-analysis'])

// Composables
const toast = useToast()
const aiStore = useAIStore()

// Recommandations depuis le store (polling)
const storeRecommendations = computed(() => aiStore.recommendations)
const recommendationsLoading = computed(() => aiStore.recommendationsLoading)
const lastUpdate = computed(() => aiStore.lastRecommendationsUpdate)
const pagination = computed(() => aiStore.recommendationsPagination)

// State
const visible = ref(false)
const hasNewRecommendations = ref(false)
const chatInput = ref('')
const chatHistory = ref([
  {
    role: 'assistant',
    content: 'Bonjour ! Je suis votre assistant IA KAP. Comment puis-je vous aider à optimiser vos performances aujourd\'hui ?',
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
])
const isTyping = ref(false)
const chatMessages = ref(null)
const chatSection = ref(null)
const chatInputRef = ref(null)
const conversationId = ref(null)
const expandedCard = ref(null)

// Computed pour le resume des recommandations par priorite
const criticalCount = computed(() => storeRecommendations.value.filter(r => r.priority === 'critical').length)
const highCount = computed(() => storeRecommendations.value.filter(r => r.priority === 'high').length)
const mediumCount = computed(() => storeRecommendations.value.filter(r => r.priority === 'medium' || r.priority === 'low').length)

// Methode pour basculer l'expansion d'une carte
const toggleCard = (index) => {
  expandedCard.value = expandedCard.value === index ? null : index
}

// Methode pour obtenir le label de priorite
const getPriorityLabel = (priority) => {
  const labels = {
    critical: 'Critique',
    high: 'Important',
    medium: 'Moyen',
    low: 'Faible'
  }
  return labels[priority] || 'Info'
}

// Action Templates Data - Organisées par catégories
const actionCategories = ref([
  {
    id: 'production',
    title: 'Production & Performance',
    icon: 'pi pi-chart-line',
    color: '#3b82f6',
    actions: [
      {
        id: 'mes-analysis',
        title: 'Analyse MES',
        description: 'Données MES en temps réel',
        icon: 'pi pi-chart-bar',
        prompt: 'Effectue une analyse complète des données MES des dernières 24 heures. Donne-moi les métriques clés de production.'
      },
      {
        id: 'production-kpi',
        title: 'KPIs Production',
        description: 'Performance et goulets d\'étranglement',
        icon: 'pi pi-box',
        prompt: 'Analyse les KPIs de production actuels et identifie les goulets d\'étranglement potentiels.'
      },
      {
        id: 'shift-analysis',
        title: 'Analyse par Équipe',
        description: 'Production par shift/poste',
        icon: 'pi pi-clock',
        prompt: 'Analyse la production par shift/poste de travail et compare les performances entre équipes.'
      }
    ]
  },
  {
    id: 'equipment',
    title: 'Équipements & Maintenance',
    icon: 'pi pi-cog',
    color: '#f59e0b',
    actions: [
      {
        id: 'machine-status',
        title: 'État Machines',
        description: 'Statut actuel des équipements',
        icon: 'pi pi-server',
        prompt: 'Donne-moi l\'état actuel de toutes les machines avec leurs métriques de performance.'
      },
      {
        id: 'downtime-analysis',
        title: 'Analyse Arrêts',
        description: 'Causes et impacts des arrêts',
        icon: 'pi pi-exclamation-triangle',
        prompt: 'Analyse les temps d\'arrêt machine récents. Identifie les causes principales et leur impact sur la production.'
      },
      {
        id: 'maintenance-planning',
        title: 'Planning Maintenance',
        description: 'Maintenances prévues et historique',
        icon: 'pi pi-wrench',
        prompt: 'Présente le planning de maintenance à venir et l\'historique des interventions récentes.'
      }
    ]
  },
  {
    id: 'stock',
    title: 'Gestion des Stocks',
    icon: 'pi pi-warehouse',
    color: '#10b981',
    actions: [
      {
        id: 'stock-status',
        title: 'État des Stocks',
        description: 'Niveaux actuels et alertes',
        icon: 'pi pi-inbox',
        prompt: 'Analyse l\'état actuel des stocks. Identifie les articles en rupture, en surstock, et les niveaux critiques.'
      },
      {
        id: 'stock-movements',
        title: 'Mouvements Stock',
        description: 'Entrées/sorties récentes',
        icon: 'pi pi-arrow-right-arrow-left',
        prompt: 'Analyse les mouvements de stock récents (entrées, sorties, transferts). Identifie les tendances et anomalies.'
      },
      {
        id: 'stock-optimization',
        title: 'Optimisation Stock',
        description: 'Recommandations de réapprovisionnement',
        icon: 'pi pi-sync',
        prompt: 'Génère des recommandations d\'optimisation des stocks basées sur l\'historique des mouvements et les niveaux actuels.'
      }
    ]
  },
  {
    id: 'alerts',
    title: 'Alertes & Monitoring',
    icon: 'pi pi-bell',
    color: '#ef4444',
    actions: [
      {
        id: 'active-alerts',
        title: 'Alertes Actives',
        description: 'Alertes en cours non résolues',
        icon: 'pi pi-exclamation-circle',
        prompt: 'Liste toutes les alertes actives non résolues et priorise-les par criticité.'
      },
      {
        id: 'alert-analysis',
        title: 'Analyse Causes',
        description: 'Analyse des causes racines',
        icon: 'pi pi-search',
        prompt: 'Analyse les causes racines des alertes récentes et identifie les patterns récurrents.'
      },
      {
        id: 'alert-stats',
        title: 'Statistiques Alertes',
        description: 'Tendances et fréquences',
        icon: 'pi pi-chart-pie',
        prompt: 'Présente les statistiques des alertes: fréquence par type, temps de résolution moyen et tendances.'
      }
    ]
  },
  {
    id: 'teams',
    title: 'Équipes & Ressources',
    icon: 'pi pi-users',
    color: '#8b5cf6',
    actions: [
      {
        id: 'team-performance',
        title: 'Performance Équipes',
        description: 'Comparaison des équipes',
        icon: 'pi pi-chart-bar',
        prompt: 'Compare les performances des différentes équipes. Analyse la productivité, qualité et efficacité par équipe.'
      },
      {
        id: 'pointage-analysis',
        title: 'Analyse Pointage',
        description: 'Présences et heures travaillées',
        icon: 'pi pi-calendar',
        prompt: 'Analyse les données de pointage: présences, absences, heures supplémentaires et tendances.'
      }
    ]
  },
  {
    id: 'projects',
    title: 'Projets & ROI',
    icon: 'pi pi-folder',
    color: '#06b6d4',
    actions: [
      {
        id: 'project-status',
        title: 'État des Projets',
        description: 'Avancement et délais',
        icon: 'pi pi-flag',
        prompt: 'Présente l\'état d\'avancement des projets en cours. Identifie les retards et les points d\'attention.'
      },
      {
        id: 'roi-analysis',
        title: 'Analyse ROI',
        description: 'Retour sur investissement',
        icon: 'pi pi-dollar',
        prompt: 'Analyse le retour sur investissement des projets et équipements. Calcule les gains réalisés.'
      }
    ]
  }
])

// État pour la catégorie sélectionnée
const selectedCategory = ref(null)

// Computed pour les actions à afficher
const displayedActions = computed(() => {
  if (selectedCategory.value) {
    const category = actionCategories.value.find(c => c.id === selectedCategory.value)
    return category ? category.actions : []
  }
  return []
})

// Méthodes pour la navigation des catégories
const selectCategory = (categoryId) => {
  selectedCategory.value = selectedCategory.value === categoryId ? null : categoryId
}

const getSelectedCategory = computed(() => {
  return actionCategories.value.find(c => c.id === selectedCategory.value)
})

// Quick Actions for Chat - Actions contextuelles rapides
const quickActions = ref([
  { id: 1, label: 'Résumé du jour', prompt: 'Donne-moi un résumé complet des performances d\'aujourd\'hui: production, alertes, équipements.' },
  { id: 2, label: 'Alertes critiques', prompt: 'Quelles sont les alertes critiques en cours qui nécessitent une attention immédiate ?' },
  { id: 3, label: 'Top 3 problèmes', prompt: 'Identifie les 3 principaux problèmes actuels et propose des actions correctives.' },
  { id: 4, label: 'Actions prioritaires', prompt: 'Quelles sont les actions prioritaires à entreprendre maintenant pour optimiser la production ?' }
])

// Computed - Recommandations depuis le store (polling temps réel)
const hasRecommendations = computed(() => storeRecommendations.value && storeRecommendations.value.length > 0)

const severityClass = computed(() => {
  if (!storeRecommendations.value.length) return 'info'
  const hasCritical = storeRecommendations.value.some(r => r.priority === 'critical')
  const hasHigh = storeRecommendations.value.some(r => r.priority === 'high')
  if (hasCritical) return 'critical'
  if (hasHigh) return 'warning'
  return 'info'
})

const tagSeverity = computed(() => {
  switch (severityClass.value) {
    case 'critical': return 'danger'
    case 'warning': return 'warning'
    default: return 'info'
  }
})

// Tooltip contextuel pour le bouton flottant
const triggerTooltip = computed(() => {
  if (!hasRecommendations.value) {
    return 'Assistant IA - Tout est optimal'
  }
  const count = storeRecommendations.value.length
  if (criticalCount.value > 0) {
    return `${criticalCount.value} alerte${criticalCount.value > 1 ? 's' : ''} critique${criticalCount.value > 1 ? 's' : ''} - Action requise`
  }
  if (highCount.value > 0) {
    return `${count} recommandation${count > 1 ? 's' : ''} dont ${highCount.value} importante${highCount.value > 1 ? 's' : ''}`
  }
  return `${count} recommandation${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}`
})

// Lifecycle - Démarrage/arrêt du polling
onMounted(() => {
  if (props.autoStart) {
    startPolling()
  }
})

onUnmounted(() => {
  aiStore.stopRecommendationsPolling()
})

// Démarrer le polling avec les paramètres du composant
const startPolling = () => {
  const params = {}
  if (props.siteId) {
    params.site_id = props.siteId
  }
  aiStore.startRecommendationsPolling(params)
}

// Forcer un refresh manuel
const refreshRecommendations = async () => {
  const params = {}
  if (props.siteId) {
    params.site_id = props.siteId
  }
  await aiStore.refreshRecommendations(params)
  toast.add({
    severity: 'info',
    summary: 'Actualisation',
    detail: 'Recommandations mises à jour',
    life: 2000
  })
}

// Gestion de la pagination
const onPageChange = async (event) => {
  const params = {}
  if (props.siteId) {
    params.site_id = props.siteId
  }

  // PrimeVue Paginator renvoie 'first' (index du premier élément) et 'rows' (nombre par page)
  const page = Math.floor(event.first / event.rows) + 1
  await aiStore.setRecommendationsPage(page, { ...params, page_size: event.rows })
}

// Methods
const selectTemplate = (template) => {
  sendToAI(template.prompt)
  // Scroller vers la section chat
  scrollToChatSection()
}

const scrollToChatSection = () => {
  nextTick(() => {
    if (chatSection.value) {
      chatSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

const sendMessage = () => {
  if (!chatInput.value.trim()) return
  const message = chatInput.value
  chatInput.value = ''
  sendToAI(message)
}

const sendQuickAction = (prompt) => {
  sendToAI(prompt)
}

/**
 * Envoie un message au backend IA
 */
const sendToAI = async (content) => {
  // Ajouter le message utilisateur localement
  chatHistory.value.push({
    role: 'user',
    content,
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  })
  scrollToBottom()

  isTyping.value = true

  try {
    // Utiliser quickChat du store pour une conversation légère
    const response = await aiStore.quickChat(
      content,
      props.contextType,
      props.contextData
    )

    // Ajouter la réponse de l'IA
    const assistantContent = response.message?.content || response.response || 'Je n\'ai pas pu traiter votre demande.'

    chatHistory.value.push({
      role: 'assistant',
      content: assistantContent,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      toolCalls: response.message?.tool_calls || null
    })

    // Sauvegarder l'ID de conversation si retourné
    if (response.conversation_id) {
      conversationId.value = response.conversation_id
    }

  } catch (error) {
    const apiError = error.response?.data?.error || error.response?.data?.message
    const friendlyError = apiError || 'Veuillez réessayer.'
    // Message d'erreur convivial
    chatHistory.value.push({
      role: 'assistant',
      content: `Désolé, une erreur s'est produite lors du traitement de votre demande. ${friendlyError}`,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    })

    toast.add({
      severity: 'error',
      summary: 'Erreur IA',
      detail: friendlyError,
      life: 5000
    })
  } finally {
    isTyping.value = false
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight
    }
  })
}

const getPriorityIcon = (priority) => {
  const icons = {
    critical: 'pi pi-exclamation-triangle',
    high: 'pi pi-exclamation-circle',
    medium: 'pi pi-info-circle',
    low: 'pi pi-lightbulb'
  }
  return icons[priority] || 'pi pi-info-circle'
}

const getImpactClass = (impact) => {
  if (impact >= 70) return 'high-impact'
  if (impact >= 40) return 'medium-impact'
  return 'low-impact'
}

// Formater l'heure de la dernière mise à jour
const formatTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const validateRecommendation = async (recommendation, index) => {
  try {
    await aiStore.validateRecommendation(recommendation, props.contextData)
    // Retirer de la liste locale
    aiStore.removeRecommendation(index)
    emit('recommendation-applied', recommendation)
    toast.add({
      severity: 'success',
      summary: 'Recommandation validée',
      detail: `"${recommendation.title}" enregistrée dans la base de connaissances`,
      life: 3000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de valider la recommandation',
      life: 3000
    })
  }
}

const rejectRecommendation = async (recommendation, index) => {
  try {
    await aiStore.rejectRecommendation(recommendation, '', props.contextData)
    // Retirer de la liste locale
    aiStore.removeRecommendation(index)
    emit('recommendation-dismissed', index)
    toast.add({
      severity: 'info',
      summary: 'Recommandation refusée',
      detail: 'Feedback enregistré pour améliorer les futures suggestions',
      life: 3000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de refuser la recommandation',
      life: 3000
    })
  }
}

// Watch for new recommendations (depuis le store polling)
watch(storeRecommendations, (newRecs, oldRecs) => {
  const newCount = newRecs ? newRecs.length : 0
  const oldCount = oldRecs ? oldRecs.length : 0

  if (newCount > oldCount && oldCount > 0) {
    hasNewRecommendations.value = true
    setTimeout(() => {
      hasNewRecommendations.value = false
    }, 3000)

    const criticalRecs = newRecs.filter(r => r.priority === 'critical')
    if (criticalRecs.length > 0) {
      toast.add({
        severity: 'warn',
        summary: 'Nouvelle recommandation critique',
        detail: criticalRecs[0].title,
        life: 5000
      })
    }
  }
}, { deep: true })
</script>

<style scoped>
/* Floating Trigger Container */
.ai-trigger-container {
  position: fixed !important;
  bottom: 1.5rem !important;
  right: 1.5rem !important;
  z-index: 1000 !important;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: calc(100vw - 2rem);
  overflow: visible;
}

/* Pulse ring for critical alerts */
.trigger-pulse {
  position: absolute;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #dc2626;
  animation: trigger-pulse-anim 2s ease-out infinite;
  pointer-events: none;
}

@keyframes trigger-pulse-anim {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* Floating Trigger Button */
.ai-trigger {
  position: relative !important;
  width: 60px !important;
  height: 60px !important;
  border-radius: 50% !important;
  box-shadow: none !important;
  transition: all 0.25s ease !important;
  font-size: 1.25rem !important;
  background: transparent !important;
  color: white !important;
  border: none !important;
  padding: 0 !important;
}

.ai-trigger:hover {
  transform: translateY(-3px) scale(1.08);
  box-shadow: none !important;
  background: transparent !important;
}

.ai-trigger.info {
  background: transparent !important;
}

.ai-trigger.warning {
  background: transparent !important;
  box-shadow: none !important;
}

.ai-trigger.warning:hover {
  box-shadow: none !important;
}

.ai-trigger.critical {
  background: transparent !important;
  box-shadow: none !important;
}

.ai-trigger.critical:hover {
  box-shadow: none !important;
}

.ai-trigger.expanded {
  transform: none;
  background: transparent !important;
  box-shadow: none !important;
}

/* Trigger Badge */
.trigger-badge {
  position: absolute;
  top: -6px;
  right: -4px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.trigger-badge.info {
  background: #3b82f6;
}

.trigger-badge.warning {
  background: #f59e0b;
}

.trigger-badge.critical {
  background: #dc2626;
  animation: badge-bounce 1s ease infinite;
}

@keyframes badge-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* Trigger Label for critical alerts */
.trigger-label {
  position: absolute;
  right: 60px;
  background: #dc2626;
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

@media (max-width: 480px) {
  .trigger-label { display: none; }
  .ai-trigger-container { right: 1rem !important; bottom: 1rem !important; }
}

.trigger-label::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-left-color: #dc2626;
}

/* Badge transitions */
.badge-pop-enter-active {
  animation: badge-pop-in 0.3s ease;
}

.badge-pop-leave-active {
  animation: badge-pop-in 0.2s ease reverse;
}

@keyframes badge-pop-in {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* Label transitions */
.label-slide-enter-active {
  animation: label-slide-in 0.3s ease;
}

.label-slide-leave-active {
  animation: label-slide-in 0.2s ease reverse;
}

@keyframes label-slide-in {
  0% { transform: translateX(10px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

/* Drawer */
:deep(.ai-drawer .p-drawer) {
  background: #f8fafc;
}

:deep(.ai-drawer .p-drawer-header) {
  padding: 0 !important;
  border: none !important;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.drawer-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  width: 100%;
}

.header-icon {
  font-size: 1.75rem;
  color: #0B2B3C;
}

.header-text h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.header-text p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Drawer Content */
.drawer-content {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* Section Headers */
.section-header {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.section-header .header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.section-header h3 i {
  color: #3b82f6;
}

.section-header p {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.last-update {
  font-size: 0.8rem;
  color: #9ca3af;
}

/* Recommendations Loading & Empty States */
.recommendations-loading,
.recommendations-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 16px;
  border: 2px dashed #e5e7eb;
  text-align: center;
}

.recommendations-loading i {
  font-size: 2rem;
  color: #3b82f6;
  margin-bottom: 1rem;
}

.recommendations-loading span {
  color: #6b7280;
  font-size: 0.95rem;
}

.recommendations-empty i {
  font-size: 3rem;
  color: #10b981;
  margin-bottom: 1rem;
}

.recommendations-empty h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.recommendations-empty p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  max-width: 400px;
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.category-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-card:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.category-card.active {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.category-content {
  flex: 1;
}

.category-content h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
}

.action-count {
  font-size: 0.8rem;
  color: #6b7280;
}

.category-chevron {
  color: #9ca3af;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.category-card.active .category-chevron {
  color: #3b82f6;
}

/* Actions Panel */
.actions-panel {
  margin-top: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}

.actions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.actions-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  color: #374151;
}

.actions-title i {
  font-size: 1.25rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  border-right: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.action-card:hover {
  background: #f8fafc;
}

.action-card:active {
  background: #f1f5f9;
}

.action-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
  min-width: 0;
}

.action-content h5 {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

.action-content p {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-arrow {
  color: #d1d5db;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.action-card:hover .action-arrow {
  color: #3b82f6;
  transform: translateX(3px);
}

/* Transition pour le panneau d'actions */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Recommendations Grid */
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.recommendation-card {
  background: white;
  border-radius: 16px;
  padding: 1.75rem;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.recommendation-card.critical { border-left-color: #dc2626; }
.recommendation-card.high { border-left-color: #f59e0b; }
.recommendation-card.medium { border-left-color: #3b82f6; }
.recommendation-card.low { border-left-color: #10b981; }

.recommendation-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.rec-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.priority-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recommendation-card.critical .priority-badge {
  background: #fef2f2;
  color: #dc2626;
}

.recommendation-card.high .priority-badge {
  background: #fffbeb;
  color: #f59e0b;
}

.recommendation-card.medium .priority-badge {
  background: #eff6ff;
  color: #3b82f6;
}

.recommendation-card.low .priority-badge {
  background: #f0fdf4;
  color: #10b981;
}

.rec-content {
  flex: 1;
}

.rec-content h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.rec-content p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.impact-badge {
  text-align: center;
  padding: 0.5rem;
  border-radius: 8px;
  flex-shrink: 0;
}

.impact-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.impact-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
}

.impact-badge.high-impact {
  background: #fef2f2;
  color: #dc2626;
}

.impact-badge.medium-impact {
  background: #fffbeb;
  color: #f59e0b;
}

.impact-badge.low-impact {
  background: #f0fdf4;
  color: #10b981;
}

.rec-details {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.875rem;
}

.detail-item {
  margin-bottom: 0.75rem;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #374151;
}

.detail-item ul {
  margin: 0.5rem 0 0 1rem;
  padding: 0;
}

.detail-item li {
  margin-bottom: 0.25rem;
  color: #6b7280;
}

.rec-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* Pagination */
.recommendations-pagination {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  background: white;
  border-radius: 12px;
  padding: 0.75rem;
}

.recommendations-pagination :deep(.p-paginator) {
  background: transparent;
  border: none;
  padding: 0;
}

.recommendations-pagination :deep(.p-paginator-element) {
  min-width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  margin: 0 0.125rem;
}

.recommendations-pagination :deep(.p-paginator-page.p-highlight) {
  background: #3b82f6;
  color: white;
}

/* Chat Section */
.chat-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 600px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chat-message {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.125rem;
}

.chat-message.user .message-avatar {
  background: #3b82f6;
  color: white;
}

.chat-message.assistant .message-avatar {
  background: #f3f4f6;
  color: #3b82f6;
}

.message-content {
  flex: 1;
  max-width: 75%;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.message-sender {
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
}

.message-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.message-text {
  background: #f3f4f6;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #374151;
  white-space: pre-line;
}

.chat-message.user .message-text {
  background: #3b82f6;
  color: white;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  background: #f3f4f6;
  border-radius: 12px;
  width: fit-content;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

/* Chat Input */
.chat-input-container {
  border-top: 1px solid #e5e7eb;
  padding: 1.5rem;
  background: #fafafa;
}

.quick-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.quick-action-btn {
  background: white !important;
  border: 1px solid #e5e7eb !important;
  color: #3b82f6 !important;
  font-size: 0.875rem !important;
  padding: 0.5rem 1rem !important;
}

.quick-action-btn:hover {
  background: #f3f4f6 !important;
  border-color: #3b82f6 !important;
}

.chat-input-wrapper {
  display: flex;
  gap: 0.75rem;
}

.chat-input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 0.95rem;
}

.chat-input:focus {
  border-color: #3b82f6;
  outline: none;
}

.send-btn {
  width: 48px !important;
  height: 48px !important;
  background: #3b82f6 !important;
  color: white !important;
  border: none !important;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scrollbar */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ==================== ENHANCED RECOMMENDATIONS UI ==================== */

/* Section Header Enhanced */
.section-header-enhanced {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.section-header-enhanced .header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-header-enhanced .title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.title-icon.info {
  background: #dbeafe;
  color: #2563eb;
}

.title-icon.warning {
  background: #fef3c7;
  color: #d97706;
}

.title-icon.critical {
  background: #fee2e2;
  color: #dc2626;
  animation: pulse-icon 2s infinite;
}

@keyframes pulse-icon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.section-header-enhanced h3 {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: #1f2937;
}

.count-badge {
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  padding: 0.25rem 0.625rem !important;
}

.section-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.header-actions-enhanced {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.last-update-chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 0.75rem;
  color: #64748b;
}

.last-update-chip i {
  font-size: 0.6875rem;
}

.refresh-btn {
  background: #f1f5f9 !important;
  color: #64748b !important;
}

.refresh-btn:hover {
  background: #e2e8f0 !important;
  color: #475569 !important;
}

/* Loading State Enhanced */
.recommendations-loading-enhanced {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.loading-animation {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 1.5rem;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border: 3px solid #3b82f6;
  border-radius: 50%;
  animation: pulse-ring 1.5s ease-out infinite;
  opacity: 0;
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.4); opacity: 0; }
}

.loading-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  border-radius: 50%;
  font-size: 2rem;
  color: #3b82f6;
}

.recommendations-loading-enhanced h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.recommendations-loading-enhanced p {
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
  color: #6b7280;
  max-width: 300px;
}

.loading-steps {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.loading-steps .step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #9ca3af;
}

.loading-steps .step.active {
  color: #10b981;
}

.loading-steps .step i {
  font-size: 0.75rem;
}

/* Empty State Enhanced */
.recommendations-empty-enhanced {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.empty-illustration {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 1.5rem;
}

.check-circle {
  width: 80px;
  height: 80px;
  background: #dcfce7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px;
  animation: check-bounce 0.5s ease;
}

@keyframes check-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.check-circle i {
  font-size: 2.5rem;
  color: #16a34a;
}

.sparkles {
  position: absolute;
  inset: 0;
}

.sparkle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fbbf24;
  border-radius: 50%;
  animation: sparkle 1.5s ease-in-out infinite;
}

.sparkle.s1 { top: 5px; left: 20px; animation-delay: 0s; }
.sparkle.s2 { top: 25px; right: 5px; animation-delay: 0.3s; }
.sparkle.s3 { bottom: 15px; left: 5px; animation-delay: 0.6s; }

@keyframes sparkle {
  0%, 100% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1); opacity: 1; }
}

.recommendations-empty-enhanced h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: #1f2937;
}

.recommendations-empty-enhanced p {
  margin: 0 0 1.5rem 0;
  font-size: 0.9375rem;
  color: #6b7280;
  max-width: 340px;
}

.next-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 0.8125rem;
  color: #64748b;
}

.next-check i {
  font-size: 0.75rem;
}

/* Recommendations Summary */
.recommendations-summary {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.summary-item.critical {
  background: #fee2e2;
  color: #dc2626;
}

.summary-item.high {
  background: #fef3c7;
  color: #d97706;
}

.summary-item.medium {
  background: #dbeafe;
  color: #2563eb;
}

.summary-item i {
  font-size: 0.875rem;
}

/* Recommendations Grid Enhanced */
.recommendations-grid-enhanced {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Recommendation Card Enhanced */
.recommendation-card-enhanced {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;
}

.recommendation-card-enhanced:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.recommendation-card-enhanced.critical {
  border-left: 4px solid #dc2626;
}

.recommendation-card-enhanced.high {
  border-left: 4px solid #f59e0b;
}

.recommendation-card-enhanced.medium {
  border-left: 4px solid #3b82f6;
}

.recommendation-card-enhanced.low {
  border-left: 4px solid #10b981;
}

.recommendation-card-enhanced.critical.expanded {
  background: #fef2f2;
}

.recommendation-card-enhanced.high.expanded {
  background: #fffbeb;
}

/* Card Header */
.recommendation-card-enhanced .card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.recommendation-card-enhanced .card-header:hover {
  background: #f8fafc;
}

.priority-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 60px;
}

.priority-dot {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.priority-dot.critical {
  background: #fee2e2;
  color: #dc2626;
  animation: pulse-critical 2s infinite;
}

.priority-dot.high {
  background: #fef3c7;
  color: #d97706;
}

.priority-dot.medium {
  background: #dbeafe;
  color: #2563eb;
}

.priority-dot.low {
  background: #dcfce7;
  color: #16a34a;
}

.priority-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #6b7280;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  margin: 0 0 0.375rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.card-description {
  margin: 0;
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.impact-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.impact-bar {
  width: 50px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.impact-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.impact-indicator.high-impact .impact-fill {
  background: #dc2626;
}

.impact-indicator.medium-impact .impact-fill {
  background: #f59e0b;
}

.impact-indicator.low-impact .impact-fill {
  background: #10b981;
}

.impact-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: #374151;
  min-width: 32px;
  text-align: right;
}

.expand-icon {
  font-size: 0.875rem;
  color: #9ca3af;
  transition: transform 0.2s ease;
}

/* Card Details */
.card-details {
  padding: 0 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-top: 1px solid #f1f5f9;
  margin-top: 0;
  padding-top: 1rem;
}

.detail-block {
  display: flex;
  gap: 0.75rem;
}

.detail-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.detail-icon.cause {
  background: #fef3c7;
  color: #d97706;
}

.detail-icon.actions {
  background: #dbeafe;
  color: #2563eb;
}

.detail-icon.timeline {
  background: #dcfce7;
  color: #16a34a;
}

.detail-content {
  flex: 1;
}

.detail-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.detail-content p {
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
}

.actions-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.actions-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.375rem;
}

.actions-list li i {
  font-size: 0.625rem;
  color: #3b82f6;
  margin-top: 0.375rem;
}

/* Card Footer */
.card-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 0.75rem 1.25rem;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.btn-apply {
  background: #16a34a !important;
  border-color: #16a34a !important;
  color: white !important;
}

.btn-apply:hover {
  background: #15803d !important;
  border-color: #15803d !important;
}

.btn-dismiss {
  color: #64748b !important;
}

.btn-dismiss:hover {
  background: #fee2e2 !important;
  color: #dc2626 !important;
}

/* Pagination Enhanced */
.recommendations-pagination-enhanced {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.pagination-info {
  font-size: 0.8125rem;
  color: #6b7280;
}

.recommendations-pagination-enhanced :deep(.p-paginator) {
  background: transparent;
  border: none;
  padding: 0;
}

.recommendations-pagination-enhanced :deep(.p-paginator-element) {
  min-width: 2.25rem;
  height: 2.25rem;
  border-radius: 6px;
  margin: 0 0.125rem;
}

.recommendations-pagination-enhanced :deep(.p-paginator-page.p-highlight) {
  background: #3b82f6;
  color: white;
}

/* Transitions */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* List transitions */
.rec-list-enter-active,
.rec-list-leave-active {
  transition: all 0.3s ease;
}

.rec-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.rec-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.rec-list-move {
  transition: transform 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .drawer-header {
    padding: 1.5rem;
  }

  .drawer-content {
    padding: 1.5rem;
    gap: 2rem;
  }

  .categories-grid,
  .actions-grid,
  .recommendations-grid {
    grid-template-columns: 1fr;
  }

  .category-card {
    padding: 1rem;
  }

  .action-card {
    padding: 1rem;
  }

  .message-content {
    max-width: 85%;
  }

  .quick-actions {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .quick-action-btn {
    flex-shrink: 0;
  }

  /* Enhanced Recommendations Responsive */
  .section-header-enhanced {
    flex-direction: column;
    gap: 1rem;
  }

  .header-actions-enhanced {
    width: 100%;
    justify-content: space-between;
  }

  .recommendations-summary {
    flex-direction: column;
    gap: 0.5rem;
  }

  .recommendation-card-enhanced .card-header {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .priority-indicator {
    flex-direction: row;
    min-width: auto;
    gap: 0.5rem;
  }

  .card-meta {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }

  .card-footer {
    flex-direction: column;
  }

  .card-footer .p-button {
    width: 100%;
    justify-content: center;
  }

  .recommendations-pagination-enhanced {
    flex-direction: column;
    gap: 1rem;
  }

  .pagination-info {
    order: 1;
  }
}
</style>
