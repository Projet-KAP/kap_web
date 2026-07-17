import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main'

export const useTeamStore = defineStore('team', () => {
  // State
  const teams = ref([])
  const currentTeam = ref(null)
  const teamMembers = ref([])
  const teamObjectives = ref([])
  const teamTasks = ref([])
  const teamPerformance = ref([])
  const loading = ref(false)
  const searchQuery = ref('')
  const selectedTeams = ref([])
  const requestErrors = ref([])

  // Computed
  const totalTeams = computed(() => teams.value.length)
  
  const activeTeams = computed(() => 
    teams.value.filter(team => team.status === 'ACTIVE')
  )

  const inactiveTeams = computed(() => 
    teams.value.filter(team => team.status === 'INACTIVE')
  )

  const filteredTeams = computed(() => {
    if (!searchQuery.value) return teams.value
    return teams.value.filter(team => 
      team.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })

  const teamsByDepartment = computed(() => {
    const departmentStats = {}
    teams.value.forEach(team => {
      const dept = team.department || 'Non assigné'
      if (!departmentStats[dept]) {
        departmentStats[dept] = 0
      }
      departmentStats[dept]++
    })
    return departmentStats
  })

  const hasSelectedTeams = computed(() => selectedTeams.value.length > 0)

  // Actions
  const setCurrentTeam = (team) => {
    currentTeam.value = team
  }

  const clearCurrentTeam = () => {
    currentTeam.value = null
  }

  const setRequestErrors = (errors) => {
    requestErrors.value = errors
  }

  const resetRequestErrors = () => {
    requestErrors.value = []
  }

  const setSelectedTeams = (teams) => {
    selectedTeams.value = teams
  }

  const clearSelectedTeams = () => {
    selectedTeams.value = []
  }

  const setSearchQuery = (query) => {
    searchQuery.value = query
  }

  // Team CRUD Operations
  const getTeams = async (params = {}) => {
    loading.value = true
    try {
      const response = await axiosInstance.get('/teams/teams/', { params })
      teams.value = response.data.results || response.data || []
      return teams.value
    } catch (error) {
      setRequestErrors(['Erreur lors du chargement des équipes'])
      throw error
    } finally {
      loading.value = false
    }
  }

  const getTeamById = async (id) => {
    loading.value = true
    try {
      const response = await axiosInstance.get(`/teams/teams/${id}/`)
      setCurrentTeam(response.data)
      return response.data
    } catch (error) {
      setRequestErrors(['Erreur lors du chargement de l\'équipe'])
      throw error
    } finally {
      loading.value = false
    }
  }

  const createTeam = async (teamData) => {
    loading.value = true
    try {
      const response = await axiosInstance.post('/teams/teams/', teamData)
      // Ne pas ajouter automatiquement à la liste, laisser le rechargement gérer
      return response.data
    } catch (error) {
      
      let errorMessages = ['Erreur lors de la création de l\'équipe']
      
      if (error.response?.data) {
        const errorData = error.response.data
        
        if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
          errorMessages = errorData.non_field_errors.map(msg => {
            if (msg.includes('name, site must make a unique set')) {
              return 'Une équipe avec ce nom existe déjà sur ce site. Veuillez choisir un autre nom.'
            }
            return msg
          })
        } else {
          errorMessages = Object.values(errorData).flat()
        }
      }
      
      setRequestErrors(errorMessages)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateTeam = async (id, teamData) => {
    loading.value = true
    try {
      const response = await axiosInstance.put(`/teams/teams/${id}/`, teamData)
      const index = teams.value.findIndex(team => team.id === id)
      if (index !== -1) {
        teams.value[index] = response.data
      }
      if (currentTeam.value?.id === id) {
        setCurrentTeam(response.data)
      }
      return response.data
    } catch (error) {
      if (error.response?.data) {
        setRequestErrors(Object.values(error.response.data).flat())
      } else {
        setRequestErrors(['Erreur lors de la modification de l\'équipe'])
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteTeam = async (id) => {
    loading.value = true
    try {
      await axiosInstance.delete(`/teams/teams/${id}/`)
      teams.value = teams.value.filter(team => team.id !== id)
      if (currentTeam.value?.id === id) {
        clearCurrentTeam()
      }
    } catch (error) {
      setRequestErrors(['Erreur lors de la suppression de l\'équipe'])
      throw error
    } finally {
      loading.value = false
    }
  }

  // Team Members Management
  const getTeamMembers = async (teamId) => {
    loading.value = true
    try {
      const response = await axiosInstance.get(`/teams/teams/${teamId}/members/`)
      teamMembers.value = response.data.results || response.data || []
      return teamMembers.value
    } catch (error) {
      setRequestErrors(['Erreur lors du chargement des membres'])
      throw error
    } finally {
      loading.value = false
    }
  }

  const addTeamMember = async (teamId, userId, role = 'MEMBER') => {
    loading.value = true
    try {
      const response = await axiosInstance.post(`/teams/teams/${teamId}/members/`, {
        user_id: userId,
        role: role
      })
      teamMembers.value.push(response.data)
      return response.data
    } catch (error) {
      setRequestErrors(['Erreur lors de l\'ajout du membre'])
      throw error
    } finally {
      loading.value = false
    }
  }

  const removeTeamMember = async (teamId, userId) => {
    loading.value = true
    try {
      await axiosInstance.delete(`/teams/teams/${teamId}/remove_member/`, {
        data: { user_id: userId }
      })
      teamMembers.value = teamMembers.value.filter(member => member.user.id !== userId)
    } catch (error) {
      setRequestErrors(['Erreur lors de la suppression du membre'])
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateMemberRole = async (teamId, userId, role) => {
    loading.value = true
    try {
      const response = await axiosInstance.put(`/teams/teams/${teamId}/update_member_role/`, {
        user_id: userId,
        role: role
      })
      const index = teamMembers.value.findIndex(member => member.user.id === userId)
      if (index !== -1) {
        teamMembers.value[index] = response.data
      }
      return response.data
    } catch (error) {
      setRequestErrors(['Erreur lors de la modification du rôle'])
      throw error
    } finally {
      loading.value = false
    }
  }

// Team Objectives Management
  const getTeamObjectives = async (teamId) => {
    loading.value = true
    try {
      const response = await axiosInstance.get(`/teams/teams/${teamId}/objectives/`)
      teamObjectives.value = response.data.results || response.data || []
      return teamObjectives.value
    } catch (error) {
      setRequestErrors(['Erreur lors du chargement des objectifs'])
      throw error
    } finally {
      loading.value = false
    }
  }

  const createTeamObjective = async (teamId, objectiveData) => {
    loading.value = true
    try {
      const response = await axiosInstance.post(`/teams/teams/${teamId}/objectives/`, objectiveData)
      teamObjectives.value.push(response.data)
      return response.data
    } catch (error) {
      setRequestErrors(['Erreur lors de la création de l\'objectif'])
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateTeamObjective = async (teamId, objectiveId, objectiveData) => {
    loading.value = true
    try {
      const response = await axiosInstance.put(`/teams/teams/${teamId}/objectives/${objectiveId}/`, objectiveData)
      const index = teamObjectives.value.findIndex(obj => obj.id === objectiveId)
      if (index !== -1) {
        teamObjectives.value[index] = response.data
      }
      return response.data
    } catch (error) {
      setRequestErrors(['Erreur lors de la modification de l\'objectif'])
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteTeamObjective = async (teamId, objectiveId) => {
    loading.value = true
    try {
      await axiosInstance.delete(`/teams/teams/${teamId}/objectives/${objectiveId}/`)
      teamObjectives.value = teamObjectives.value.filter(obj => obj.id !== objectiveId)
    } catch (error) {
      setRequestErrors(['Erreur lors de la suppression de l\'objectif'])
      throw error
    } finally {
      loading.value = false
    }
  }

  // Team Performance Analytics
  const getTeamPerformance = async (teamId, period = 'month') => {
    loading.value = true
    try {
      const response = await axiosInstance.get(`/teams/teams/${teamId}/performance/`, {
        params: { period }
      })
      teamPerformance.value = response.data
      return teamPerformance.value
    } catch (error) {
      setRequestErrors(['Erreur lors du chargement des performances'])
      throw error
    } finally {
      loading.value = false
    }
  }

  // Team Tasks Management
  const getTeamTasks = async (teamId) => {
    loading.value = true
    try {
      const response = await axiosInstance.get(`/teams/teams/${teamId}/tasks/`)
      teamTasks.value = response.data.results || response.data || []
      return teamTasks.value
    } catch (error) {
      setRequestErrors(['Erreur lors du chargement des tâches'])
      throw error
    } finally {
      loading.value = false
    }
  }

  const assignTaskToTeam = async (teamId, taskData) => {
    loading.value = true
    try {
      const response = await axiosInstance.post(`/teams/teams/${teamId}/tasks/`, taskData)
      teamTasks.value.push(response.data)
      return response.data
    } catch (error) {
      setRequestErrors(['Erreur lors de l\'assignation de la tâche'])
      throw error
    } finally {
      loading.value = false
    }
  }

  // Initialize team data
  const initializeTeamData = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      return
    }
    
    loading.value = true
    try {
      await getTeams()
    } catch (err) {
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    teams,
    currentTeam,
    teamMembers,
    teamObjectives,
    teamTasks,
    teamPerformance,
    loading,
    searchQuery,
    selectedTeams,
    requestErrors,

    // Computed
    totalTeams,
    activeTeams,
    inactiveTeams,
    filteredTeams,
    teamsByDepartment,
    hasSelectedTeams,

    // Actions
    setCurrentTeam,
    clearCurrentTeam,
    setRequestErrors,
    resetRequestErrors,
    setSelectedTeams,
    clearSelectedTeams,
    setSearchQuery,

    // Team CRUD
    getTeams,
    getTeamById,
    createTeam,
    updateTeam,
    deleteTeam,

    // Team Members
    getTeamMembers,
    addTeamMember,
    removeTeamMember,
    updateMemberRole,


    // Team Objectives
    getTeamObjectives,
    createTeamObjective,
    updateTeamObjective,
    deleteTeamObjective,

    // Team Performance
    getTeamPerformance,

    // Team Tasks
    getTeamTasks,
    assignTaskToTeam,

    // Initialize
    initializeTeamData
  }
})
