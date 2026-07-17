/**
 * AI Store
 *
 * Store Pinia pour la gestion des conversations IA,
 * insights et interactions avec l'assistant.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'

export const useAIStore = defineStore('ai', () => {
  // ==================
  // State
  // ==================

  // Conversations
  const conversations = ref([])
  const currentConversation = ref(null)
  const messages = ref([])

  // Insights
  const insights = ref([])
  const insightsSummary = ref(null)

  // Recommendations (polling)
  const recommendations = ref([])
  const recommendationsSummary = ref(null)
  const recommendationsLoading = ref(false)
  const lastRecommendationsUpdate = ref(null)
  const pollingInterval = ref(null)
  const initialTimeoutId = ref(null)  // séparé pour pouvoir l'annuler proprement
  const recommendationsPagination = ref({
    page: 1,
    page_size: 5,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false
  })

  // UI State
  const loading = ref(false)
  const sending = ref(false)
  const error = ref(null)

  // Dashboard stats
  const dashboardStats = ref(null)

  // Available tools
  const availableTools = ref([])

  // Threads (LangGraph avec PostgresSaver)
  const threads = ref([])
  const currentThread = ref(null)
  const threadMessages = ref([])

  // ==================
  // Computed
  // ==================

  const hasConversations = computed(() => conversations.value.length > 0)

  const activeConversations = computed(() =>
    conversations.value.filter(c => c.status === 'ACTIVE')
  )

  const newInsights = computed(() =>
    insights.value.filter(i => i.status === 'NEW')
  )

  const criticalInsights = computed(() =>
    insights.value.filter(i => i.severity === 'CRITICAL' && i.status === 'NEW')
  )

  const sortedMessages = computed(() =>
    [...messages.value].sort((a, b) =>
      new Date(a.created_at) - new Date(b.created_at)
    )
  )

  const hasThreads = computed(() => threads.value.length > 0)

  const activeThreads = computed(() =>
    threads.value.filter(t => t.status === 'ACTIVE')
  )

  // ==================
  // Actions - Conversations
  // ==================

  /**
   * Charge la liste des conversations
   */
  async function fetchConversations(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get('ai/conversations/', { params })
      conversations.value = response.data.results || response.data
      return conversations.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des conversations'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Charge une conversation spécifique avec ses messages
   */
  async function fetchConversation(id) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get(`ai/conversations/${id}/`)
      currentConversation.value = response.data
      messages.value = response.data.messages || []
      return currentConversation.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement de la conversation'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Crée une nouvelle conversation
   */
  async function createConversation(data = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.post('ai/conversations/', {
        context_type: data.context_type || 'GENERAL',
        context_data: data.context_data || {},
        title: data.title || ''
      })

      currentConversation.value = response.data
      messages.value = []

      // Ajouter à la liste des conversations
      conversations.value.unshift(response.data)

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la création de la conversation'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Envoie un message dans une conversation
   */
  async function sendMessage(conversationId, content) {
    sending.value = true
    error.value = null

    // Ajouter le message utilisateur en local pour feedback instantané
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content,
      created_at: new Date().toISOString()
    }
    messages.value.push(tempUserMessage)

    try {
      const response = await axiosInstance.post(
        `ai/conversations/${conversationId}/chat/`,
        { content }
      )

      // Remplacer le message temp par le vrai
      const userMsgIndex = messages.value.findIndex(m => m.id === tempUserMessage.id)
      if (userMsgIndex !== -1) {
        messages.value.splice(userMsgIndex, 1)
      }

      // Ajouter le message utilisateur et la réponse
      if (response.data.message) {
        // Ajouter d'abord le message utilisateur confirmé si retourné
        messages.value.push({
          role: 'USER',
          content,
          created_at: new Date().toISOString()
        })
        // Puis la réponse de l'assistant
        messages.value.push(response.data.message)
      }

      return response.data
    } catch (err) {
      // Supprimer le message temp en cas d'erreur
      const userMsgIndex = messages.value.findIndex(m => m.id === tempUserMessage.id)
      if (userMsgIndex !== -1) {
        messages.value.splice(userMsgIndex, 1)
      }

      error.value = err.response?.data?.message || 'Erreur lors de l\'envoi du message'
      throw err
    } finally {
      sending.value = false
    }
  }

  /**
   * Chat rapide sans conversation persistante
   */
  async function quickChat(content, contextType = 'GENERAL', contextData = {}) {
    sending.value = true
    error.value = null

    try {
      const response = await axiosInstance.post('ai/quick-chat/', {
        content,
        context_type: contextType,
        context_data: contextData
      })

      // Si une conversation a été créée, la définir comme courante
      if (response.data.conversation_id) {
        await fetchConversation(response.data.conversation_id)
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la requête'
      throw err
    } finally {
      sending.value = false
    }
  }

  /**
   * Archive une conversation
   */
  async function archiveConversation(id) {
    try {
      await axiosInstance.post(`ai/conversations/${id}/archive/`)

      // Mettre à jour localement
      const conv = conversations.value.find(c => c.id === id)
      if (conv) {
        conv.status = 'ARCHIVED'
      }

      if (currentConversation.value?.id === id) {
        currentConversation.value = null
        messages.value = []
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de l\'archivage'
      throw err
    }
  }

  // ==================
  // Actions - Insights
  // ==================

  /**
   * Charge les insights
   */
  async function fetchInsights(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get('ai/insights/', { params })
      insights.value = response.data.results || response.data
      return insights.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des insights'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Charge le résumé des insights
   */
  async function fetchInsightsSummary() {
    try {
      const response = await axiosInstance.get('ai/insights/summary/')
      insightsSummary.value = response.data
      return insightsSummary.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement du résumé'
      throw err
    }
  }

  /**
   * Marque un insight comme lu
   */
  async function markInsightRead(id) {
    try {
      const response = await axiosInstance.post(`ai/insights/${id}/mark_read/`)

      // Mettre à jour localement
      const insight = insights.value.find(i => i.id === id)
      if (insight) {
        insight.status = 'READ'
        insight.read_at = new Date().toISOString()
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour'
      throw err
    }
  }

  /**
   * Met à jour le statut d'un insight
   */
  async function updateInsightStatus(id, status) {
    try {
      const response = await axiosInstance.post(`ai/insights/${id}/update_status/`, { status })

      // Mettre à jour localement
      const insight = insights.value.find(i => i.id === id)
      if (insight) {
        insight.status = status
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour'
      throw err
    }
  }

  // ==================
  // Actions - Dashboard & Stats
  // ==================

  /**
   * Charge les stats du dashboard IA
   */
  async function fetchDashboardStats() {
    try {
      const response = await axiosInstance.get('ai/dashboard-stats/')
      dashboardStats.value = response.data
      return dashboardStats.value
    } catch {
      // Silently fail for dashboard stats
      return null
    }
  }

  /**
   * Charge les outils disponibles
   */
  async function fetchAvailableTools() {
    try {
      const response = await axiosInstance.get('ai/tools/')
      availableTools.value = response.data
      return availableTools.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des outils'
      throw err
    }
  }

  // ==================
  // Actions - Knowledge Base
  // ==================

  /**
   * Valide une recommandation et l'enregistre dans la base de connaissances
   */
  async function validateRecommendation(recommendation, contextData = {}) {
    try {
      const response = await axiosInstance.post('ai/knowledge/feedback/', {
        recommendation_id: recommendation.id,
        title: recommendation.title,
        description: recommendation.description,
        priority: recommendation.priority,
        impact: recommendation.impact,
        category: mapPriorityToCategory(recommendation),
        cause: recommendation.details?.cause || '',
        actions: recommendation.details?.actions || [],
        timeline: recommendation.details?.timeline || '',
        context_data: contextData,
        feedback: 'VALIDATED'
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la validation'
      throw err
    }
  }

  /**
   * Refuse une recommandation et l'enregistre dans la base de connaissances
   */
  async function rejectRecommendation(recommendation, reason = '', contextData = {}) {
    try {
      const response = await axiosInstance.post('ai/knowledge/feedback/', {
        recommendation_id: recommendation.id,
        title: recommendation.title,
        description: recommendation.description,
        priority: recommendation.priority,
        impact: recommendation.impact,
        category: mapPriorityToCategory(recommendation),
        cause: recommendation.details?.cause || '',
        actions: recommendation.details?.actions || [],
        timeline: recommendation.details?.timeline || '',
        context_data: contextData,
        feedback: 'REJECTED',
        feedback_reason: reason
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du refus'
      throw err
    }
  }

  /**
   * Récupère les statistiques de la base de connaissances
   */
  async function fetchKnowledgeStats() {
    try {
      const response = await axiosInstance.get('ai/knowledge/stats/')
      return response.data
    } catch {
      return null
    }
  }

  /**
   * Met à jour l'efficacité d'une recommandation validée
   */
  async function updateKnowledgeEffectiveness(knowledgeId, data) {
    try {
      const response = await axiosInstance.post(`ai/knowledge/${knowledgeId}/effectiveness/`, data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour'
      throw err
    }
  }

  /**
   * Mappe une recommandation vers une catégorie
   */
  function mapPriorityToCategory(recommendation) {
    const id = recommendation.id || ''
    if (id.includes('trs') || id.includes('mes') || id.includes('production')) return 'PRODUCTION'
    if (id.includes('quality') || id.includes('rebuts')) return 'QUALITY'
    if (id.includes('maintenance') || id.includes('reliability')) return 'MAINTENANCE'
    if (id.includes('performance') || id.includes('team')) return 'PERFORMANCE'
    if (id.includes('alert')) return 'ALERTS'
    if (id.includes('collect')) return 'COLLECT'
    if (id.includes('engin') || id.includes('equipment')) return 'ENGINS'
    return 'PRODUCTION'
  }

  // ==================
  // Actions - Recommendations (Polling)
  // ==================

  /**
   * Récupère les recommandations temps réel depuis le backend
   * @param {Object} params - Paramètres optionnels (site_id, page, page_size)
   */
  async function fetchRecommendations(params = {}) {
    recommendationsLoading.value = true

    // Merge avec la pagination actuelle si page non spécifiée
    const queryParams = {
      page: params.page || recommendationsPagination.value.page,
      page_size: params.page_size || recommendationsPagination.value.page_size,
      ...params
    }

    try {
      const response = await axiosInstance.get('ai/recommendations/', { params: queryParams })

      recommendations.value = response.data.recommendations || []
      recommendationsSummary.value = response.data.summary || null
      lastRecommendationsUpdate.value = new Date()

      // Update pagination state
      if (response.data.pagination) {
        recommendationsPagination.value = response.data.pagination
      }

      return response.data
    } catch (err) {
      console.error('Erreur fetch recommandations:', err)
      // En cas d'erreur, ne pas effacer les recommandations existantes
      return null
    } finally {
      recommendationsLoading.value = false
    }
  }

  /**
   * Change de page pour les recommandations
   * @param {number} page - Numéro de page
   */
  async function setRecommendationsPage(page, additionalParams = {}) {
    return await fetchRecommendations({ ...additionalParams, page })
  }

  /**
   * Change la taille de page pour les recommandations
   * @param {number} pageSize - Nombre d'éléments par page
   */
  async function setRecommendationsPageSize(pageSize, additionalParams = {}) {
    return await fetchRecommendations({ ...additionalParams, page: 1, page_size: pageSize })
  }

  /**
   * Démarre le polling des recommandations toutes les 30 minutes
   * @param {Object} params - Paramètres pour le polling (site_id, limit)
   */
  function startRecommendationsPolling(params = {}) {
    // Si déjà chargé récemment (< 1h), ne pas refetcher
    if (lastRecommendationsUpdate.value) {
      const age = (Date.now() - lastRecommendationsUpdate.value.getTime()) / 1000
      if (age < 3600 && recommendations.value.length > 0) {
        return
      }
    }

    // Arrêter le polling existant s'il y en a un
    stopRecommendationsPolling()

    // Fetch initial immédiat — le backend répond maintenant < 100ms depuis le cache DB
    fetchRecommendations(params)

    // Repolling toutes les 30 minutes pour récupérer les données fraîches générées en background
    pollingInterval.value = setInterval(() => {
      fetchRecommendations(params)
    }, 1800000)
  }

  /**
   * Arrête le polling des recommandations
   */
  function stopRecommendationsPolling() {
    if (initialTimeoutId.value) {
      clearTimeout(initialTimeoutId.value)
      initialTimeoutId.value = null
    }
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }

  /**
   * Force un refresh des recommandations
   */
  async function refreshRecommendations(params = {}) {
    return await fetchRecommendations(params)
  }

  function removeRecommendation(index) {
    if (index >= 0 && index < recommendations.value.length) {
      recommendations.value.splice(index, 1)
    }
  }

  // ==================
  // Actions - Threads (LangGraph)
  // ==================

  async function fetchThreads(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get('ai/threads/', { params })
      threads.value = response.data.results || response.data
      return threads.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des threads'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createThread(data = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.post('ai/threads/', {
        workflow_type: data.workflow_type || 'CONVERSATIONAL',
        site_id: data.site_id || null,
        title: data.title || '',
        context_data: data.context_data || {}
      })

      currentThread.value = response.data
      threadMessages.value = []
      threads.value.unshift(response.data)

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la creation du thread'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchThread(threadId) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get(`ai/threads/${threadId}/`)
      currentThread.value = response.data
      return currentThread.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement du thread'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchThreadMessages(threadId) {
    loading.value = true
    error.value = null

    try {
      const response = await axiosInstance.get(`ai/threads/${threadId}/messages/`)
      threadMessages.value = response.data.messages || []
      return threadMessages.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des messages'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function sendThreadMessage(threadId, content) {
    sending.value = true
    error.value = null

    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      role: 'human',
      content,
      created_at: new Date().toISOString()
    }
    threadMessages.value.push(tempUserMessage)

    try {
      const response = await axiosInstance.post(
        `ai/threads/${threadId}/chat/`,
        { content }
      )

      const userMsgIndex = threadMessages.value.findIndex(m => m.id === tempUserMessage.id)
      if (userMsgIndex !== -1) {
        threadMessages.value.splice(userMsgIndex, 1)
      }

      threadMessages.value.push({
        role: 'human',
        content,
        created_at: new Date().toISOString()
      })

      if (response.data.response) {
        threadMessages.value.push({
          role: 'ai',
          content: response.data.response,
          created_at: new Date().toISOString()
        })
      }

      if (currentThread.value && currentThread.value.id === threadId) {
        currentThread.value.message_count = response.data.messages_count || (currentThread.value.message_count + 2)
        currentThread.value.last_user_message = content.substring(0, 500)
      }

      return response.data
    } catch (err) {
      const userMsgIndex = threadMessages.value.findIndex(m => m.id === tempUserMessage.id)
      if (userMsgIndex !== -1) {
        threadMessages.value.splice(userMsgIndex, 1)
      }

      error.value = err.response?.data?.message || 'Erreur lors de l\'envoi du message'
      throw err
    } finally {
      sending.value = false
    }
  }

  async function threadQuickChat(content, workflowType = 'CONVERSATIONAL', existingThreadId = null) {
    sending.value = true
    error.value = null

    try {
      const response = await axiosInstance.post('ai/threads/quick-chat/', {
        content,
        workflow_type: workflowType,
        thread_id: existingThreadId
      })

      if (response.data.thread_id && !existingThreadId) {
        await fetchThreads()
        const newThread = threads.value.find(t => t.thread_id === response.data.thread_id)
        if (newThread) {
          currentThread.value = newThread
        }
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la requete'
      throw err
    } finally {
      sending.value = false
    }
  }

  async function archiveThread(threadId) {
    try {
      await axiosInstance.post(`ai/threads/${threadId}/archive/`)

      const thread = threads.value.find(t => t.id === threadId)
      if (thread) {
        thread.status = 'ARCHIVED'
      }

      if (currentThread.value?.id === threadId) {
        currentThread.value = null
        threadMessages.value = []
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de l\'archivage'
      throw err
    }
  }

  async function deleteThread(threadId) {
    try {
      await axiosInstance.delete(`ai/threads/${threadId}/`)

      threads.value = threads.value.filter(t => t.id !== threadId)

      if (currentThread.value?.id === threadId) {
        currentThread.value = null
        threadMessages.value = []
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression'
      throw err
    }
  }

  function selectThread(thread) {
    currentThread.value = thread
    threadMessages.value = []
    if (thread) {
      fetchThreadMessages(thread.id)
    }
  }

  function resetThreadState() {
    currentThread.value = null
    threadMessages.value = []
  }

  // ==================
  // Utility Actions
  // ==================

  /**
   * Réinitialise l'état courant
   */
  function resetCurrentState() {
    currentConversation.value = null
    messages.value = []
    error.value = null
  }

  /**
   * Efface toutes les erreurs
   */
  function clearError() {
    error.value = null
  }

  // ==================
  // Return
  // ==================

  return {
    // State
    conversations,
    currentConversation,
    messages,
    insights,
    insightsSummary,
    loading,
    sending,
    error,
    dashboardStats,
    availableTools,

    // State - Recommendations
    recommendations,
    recommendationsSummary,
    recommendationsLoading,
    lastRecommendationsUpdate,
    recommendationsPagination,

    // State - Threads
    threads,
    currentThread,
    threadMessages,

    // Computed
    hasConversations,
    activeConversations,
    newInsights,
    criticalInsights,
    sortedMessages,
    hasThreads,
    activeThreads,

    // Actions - Conversations
    fetchConversations,
    fetchConversation,
    createConversation,
    sendMessage,
    quickChat,
    archiveConversation,

    // Actions - Insights
    fetchInsights,
    fetchInsightsSummary,
    markInsightRead,
    updateInsightStatus,

    // Actions - Dashboard
    fetchDashboardStats,
    fetchAvailableTools,

    // Actions - Knowledge Base
    validateRecommendation,
    rejectRecommendation,
    fetchKnowledgeStats,
    updateKnowledgeEffectiveness,

    // Actions - Recommendations Polling
    fetchRecommendations,
    startRecommendationsPolling,
    stopRecommendationsPolling,
    refreshRecommendations,
    removeRecommendation,
    setRecommendationsPage,
    setRecommendationsPageSize,

    // Actions - Threads
    fetchThreads,
    createThread,
    fetchThread,
    fetchThreadMessages,
    sendThreadMessage,
    threadQuickChat,
    archiveThread,
    deleteThread,
    selectThread,
    resetThreadState,

    // Utility
    resetCurrentState,
    clearError
  }
})
