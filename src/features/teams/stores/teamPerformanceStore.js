import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main'

export const useTeamPerformanceStore = defineStore('teamPerformance', () => {
  // State
  const loading = ref(false)
  const error = ref(null)

  // Performance data
  const performanceData = ref(null)
  const evaluations = ref([])

  // KPIs and Objectives data
  const teamKPIs = ref([])
  const teamObjectives = ref([])
  const teamMembers = ref([])
  const currentTeam = ref(null)
  const allTeams = ref([])

  // Getters
  const overallScore = computed(() => {
    if (!performanceData.value) return 0
    const { productivity, quality, efficiency } = performanceData.value
    return Math.round((productivity + quality + efficiency) / 3)
  })

  const latestEvaluation = computed(() => {
    return evaluations.value.length > 0 ? evaluations.value[0] : null
  })

  const performanceTrend = computed(() => {
    if (evaluations.value.length < 2) return 0
    const latest = evaluations.value[0]?.overall_score || 0
    const previous = evaluations.value[1]?.overall_score || 0
    return Math.round(((latest - previous) / previous) * 100)
  })

  // Actions
  const fetchTeamPerformanceData = async (teamId, days = 30) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/teams/${teamId}/performance-data/`, {
        params: { days, period_type: 'DAY' }
      })

      performanceData.value = response.data
      return response.data
    } catch (err) {
      error.value = 'Erreur lors du chargement des données de performance'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTeamEvaluations = async (teamId) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/teams/${teamId}/evaluations/`)

      evaluations.value = response.data.evaluations || []
      return response.data
    } catch (err) {
      error.value = 'Erreur lors du chargement des évaluations'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTeamMembers = async (teamId) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/teams/${teamId}/members/`)

      teamMembers.value = response.data || []
      return response.data
    } catch (err) {
      error.value = 'Erreur lors du chargement des membres'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createEvaluation = async (teamId, evaluationData) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post(`/teams/${teamId}/evaluations/create/`, evaluationData)

      // Ajouter la nouvelle évaluation au début de la liste
      evaluations.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = 'Erreur lors de la création de l\'évaluation'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTeamById = async (teamId) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/teams/${teamId}/`)

      currentTeam.value = response.data
      return response.data
    } catch (err) {
      error.value = 'Erreur lors du chargement de l\'équipe'
      throw err
    } finally {
      loading.value = false
    }
  }

  // KPIs Management
  const fetchTeamKPIs = async (teamId) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/teams/${teamId}/kpis/`)

      teamKPIs.value = response.data || []
      return response.data
    } catch (err) {
      error.value = 'Erreur lors du chargement des KPIs'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createTeamKPI = async (teamId, kpiData) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post(`/teams/${teamId}/kpis/`, kpiData)

      teamKPIs.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = 'Erreur lors de la création du KPI'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTeamKPI = async (teamId, kpiId, kpiData) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(`/teams/${teamId}/kpis/${kpiId}/`, kpiData)

      const index = teamKPIs.value.findIndex(kpi => kpi.id === kpiId)
      if (index !== -1) {
        teamKPIs.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = 'Erreur lors de la modification du KPI'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteTeamKPI = async (teamId, kpiId) => {
    loading.value = true
    error.value = null
    try {
      await axiosInstance.delete(`/teams/${teamId}/kpis/${kpiId}/`)

      teamKPIs.value = teamKPIs.value.filter(kpi => kpi.id !== kpiId)
    } catch (err) {
      error.value = 'Erreur lors de la suppression du KPI'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Objectives Management
  const fetchTeamObjectives = async (teamId) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get(`/teams/${teamId}/objectives/`)

      teamObjectives.value = response.data || []
      return response.data
    } catch (err) {
      error.value = 'Erreur lors du chargement des objectifs'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createTeamObjective = async (teamId, objectiveData) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.post(`/teams/${teamId}/objectives/`, objectiveData)

      teamObjectives.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = 'Erreur lors de la création de l\'objectif'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTeamObjective = async (teamId, objectiveId, objectiveData) => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.put(`/teams/${teamId}/objectives/${objectiveId}/`, objectiveData)

      const index = teamObjectives.value.findIndex(obj => obj.id === objectiveId)
      if (index !== -1) {
        teamObjectives.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = 'Erreur lors de la modification de l\'objectif'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteTeamObjective = async (teamId, objectiveId) => {
    loading.value = true
    error.value = null
    try {
      await axiosInstance.delete(`/teams/${teamId}/objectives/${objectiveId}/`)

      teamObjectives.value = teamObjectives.value.filter(obj => obj.id !== objectiveId)
    } catch (err) {
      error.value = 'Erreur lors de la suppression de l\'objectif'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch all teams avec leurs données
  const fetchAllTeams = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axiosInstance.get('/teams/teams/')

      // Gérer différents formats de réponse
      if (Array.isArray(response.data)) {
        allTeams.value = response.data
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        allTeams.value = response.data.results
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        allTeams.value = response.data.data
      } else {
        allTeams.value = []
      }

      return allTeams.value
    } catch (err) {
      error.value = 'Erreur lors du chargement des équipes'
      allTeams.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  // Charger les détails de toutes les équipes en arrière-plan
  const loadTeamsDetails = async (teams) => {

    // Charger par batch de 2 équipes à la fois
    for (let i = 0; i < teams.length; i += 2) {
      const batch = teams.slice(i, i + 2)

      await Promise.all(
        batch.map(async (team) => {
          try {
            // Charger toutes les données de cette équipe en parallèle
            const [kpis, objectives, members, evaluations] = await Promise.all([
              axiosInstance.get(`/teams/${team.id}/kpis/`).catch(() => ({ data: [] })),
              axiosInstance.get(`/teams/${team.id}/objectives/`).catch(() => ({ data: [] })),
              axiosInstance.get(`/teams/${team.id}/members/`).catch(() => ({ data: [] })),
              axiosInstance.get(`/teams/${team.id}/evaluations/`).catch(() => ({ data: { evaluations: [] } }))
            ])

            // Mettre à jour l'équipe dans allTeams
            const index = allTeams.value.findIndex(t => t.team.id === team.id)
            if (index !== -1) {
              allTeams.value[index] = {
                team,
                kpis: kpis.data || [],
                objectives: objectives.data || [],
                members: members.data || [],
                evaluations: evaluations.data?.evaluations || evaluations.data || []
              }
            }
          } catch (err) {
          }
        })
      )

      // Petit délai entre les batchs pour éviter surcharge
      if (i + 2 < teams.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

  }

  const refreshAll = async (teamId) => {
    try {
      await Promise.all([
        fetchTeamById(teamId),
        fetchTeamPerformanceData(teamId),
        fetchTeamEvaluations(teamId),
        fetchTeamMembers(teamId),
        fetchTeamKPIs(teamId),
        fetchTeamObjectives(teamId)
      ])
    } catch (err) {
      throw err
    }
  }

  const clearData = () => {
    performanceData.value = null
    evaluations.value = []
    teamMembers.value = []
    currentTeam.value = null
    teamKPIs.value = []
    teamObjectives.value = []
    allTeams.value = []
    error.value = null
  }

  return {
    // State
    loading,
    error,
    performanceData,
    evaluations,
    teamMembers,
    currentTeam,
    teamKPIs,
    teamObjectives,
    allTeams,

    // Getters
    overallScore,
    latestEvaluation,
    performanceTrend,

    // Actions
    fetchTeamPerformanceData,
    fetchTeamEvaluations,
    fetchTeamMembers,
    createEvaluation,
    fetchTeamById,
    fetchTeamKPIs,
    createTeamKPI,
    updateTeamKPI,
    deleteTeamKPI,
    fetchTeamObjectives,
    createTeamObjective,
    updateTeamObjective,
    deleteTeamObjective,
    fetchAllTeams,
    refreshAll,
    clearData
  }
})
