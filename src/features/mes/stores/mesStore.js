import { defineStore } from 'pinia'
import { axiosInstance } from '@/main.js'

export const useMesStore = defineStore('mes', {
  state: () => ({
    // Dashboard data
    dashboardData: null,
    machinesStatus: [],
    activeAlerts: [],
    workOrders: [],
    sessions: [],
    
    // Loading states
    loading: {
      dashboard: false,
      machines: false,
      alerts: false,
      workOrders: false,
      sessions: false
    },
    
    // Error states
    errors: {
      dashboard: null,
      machines: null,
      alerts: null,
      workOrders: null,
      sessions: null
    }
  }),

  getters: {
    // OEE metrics
    oeeReport: (state) => state.dashboardData?.oee || {
      global: 0,
      availability: 0,
      performance: 0,
      quality: 0
    },
    
    // Production metrics
    productionMetrics: (state) => ({
      daily_output: state.dashboardData?.daily_production || 0,
      active_orders: state.dashboardData?.active_orders || 0,
      active_machines: state.dashboardData?.active_machines || 0,
      total_machines: state.dashboardData?.total_machines || 0
    }),
    
    // Filtered work orders
    activeWorkOrders: (state) => state.workOrders.filter(order => 
      order.actual_quantity < order.planned_quantity
    ),
    
    completedWorkOrders: (state) => state.workOrders.filter(order => 
      order.actual_quantity >= order.planned_quantity
    ),
    
    // Active sessions
    openSessions: (state) => state.sessions.filter(session => 
      session.status === 'OPEN'
    ),
    
    // Machines by status
    runningMachines: (state) => state.machinesStatus.filter(m => 
      m.status === 'ACTIVE' && m.current_state === 'RUNNING'
    ),
    
    idleMachines: (state) => state.machinesStatus.filter(m => 
      m.status === 'ACTIVE' && m.current_state === 'IDLE'
    ),
    
    maintenanceMachines: (state) => state.machinesStatus.filter(m => 
      m.status === 'MAINTENANCE'
    )
  },

  actions: {
    /**
     * Récupère les données du dashboard MES
     */
    async getDashboard(params = {}) {
      this.loading.dashboard = true
      this.errors.dashboard = null

      try {
        const response = await axiosInstance.get('/engins/mes-dashboard/', { params })
        const data = response.data
        
        // Mapper les champs pour compatibilité avec le frontend
        this.dashboardData = {
          ...data,
          // Mapper les champs pour compatibilité
          active_orders: data.ordres_actifs || 0,
          total_orders: data.ordres_production || 0,
          active_machines: data.machines_actives || 0,
          total_machines: data.machines_total || 0,
          active_alerts: data.alertes_actives ?? (data.alertes?.length || 0),
          daily_production: data.production_jour || 0,
          units: data.units || [],
          taux_realisation: data.taux_realisation || 0,
          // OEE metrics
          oee: {
            global: data.trs || 0,
            availability: data.disponibilite || 0,
            performance: data.performance || 0,
            quality: data.taux_qualite || 0
          },
          // Alias pour compatibilité
          availability: data.disponibilite || 0,
          performance: data.performance || 0,
          quality: data.taux_qualite || 0
        }
      } catch (error) {
                this.errors.dashboard = error.response?.data?.message || error.message
        // Ne pas throw l'erreur, juste la logger
        this.dashboardData = {
          active_orders: 0,
          total_orders: 0,
          active_machines: 0,
          total_machines: 0,
          active_alerts: 0,
          daily_production: 0,
          oee: {
            global: 0,
            availability: 0,
            performance: 0,
            quality: 0
          }
        }
      } finally {
        this.loading.dashboard = false
      }
    },

    /**
     * Récupère le statut de toutes les machines MES (type MACHINE uniquement)
     */
    async getMachinesStatus() {
      this.loading.machines = true
      this.errors.machines = null

      try {
        // Utiliser les machines depuis mes-dashboard qui retourne uniquement les machines MES (type MACHINE)
        const response = await axiosInstance.get('/engins/mes-dashboard/')
        // Les machines sont dans response.data.machines et sont déjà filtrées pour type='MACHINE'
        this.machinesStatus = response.data?.machines || []
      } catch (error) {
                this.errors.machines = error.response?.data?.message || error.message
        // En cas d'erreur, utiliser un endpoint de fallback avec filtre type=MACHINE
        try {
          const fallbackResponse = await axiosInstance.get('/engins/machines/?type=MACHINE')
          this.machinesStatus = Array.isArray(fallbackResponse.data) 
            ? fallbackResponse.data 
            : fallbackResponse.data.results || []
        } catch (fallbackError) {
                    this.machinesStatus = []
        }
      } finally {
        this.loading.machines = false
      }
    },

    /**
     * Récupère les alertes actives
     */
    async getActiveAlerts() {
      this.loading.alerts = true
      this.errors.alerts = null

      try {
        const response = await axiosInstance.get('/alerts/alert-instances/')
        this.activeAlerts = Array.isArray(response.data) ? response.data : response.data.results || []
      } catch (error) {
                this.errors.alerts = error.response?.data?.message || error.message
        // Ne pas throw l'erreur, juste la logger
      } finally {
        this.loading.alerts = false
      }
    },

    /**
     * Récupère les ordres de production
     */
    async getWorkOrders(filters = {}) {
      this.loading.workOrders = true
      this.errors.workOrders = null

      try {
        const params = new URLSearchParams(filters).toString()
        const url = params ? `/engins/work-orders/?${params}` : '/engins/work-orders/'
        const response = await axiosInstance.get(url)
        this.workOrders = Array.isArray(response.data) ? response.data : response.data.results || []
      } catch (error) {
                this.errors.workOrders = error.response?.data?.message || error.message
        // Ne pas throw l'erreur, juste la logger
      } finally {
        this.loading.workOrders = false
      }
    },

    /**
     * Crée un nouvel ordre de production
     */
    async createWorkOrder(orderData) {
      try {
        const response = await axiosInstance.post('/engins/work-orders/', orderData)
        const created = response.data?.data || response.data
        this.workOrders.unshift(created)
        return created
      } catch (error) {
                throw error
      }
    },

    /**
     * Met à jour un ordre de production
     */
    async updateWorkOrder(orderId, orderData) {
      try {
        const response = await axiosInstance.put(`/engins/work-orders/${orderId}/`, orderData)
        
        if (response.data.success) {
          const index = this.workOrders.findIndex(o => o.id === orderId)
          if (index !== -1) {
            this.workOrders[index] = response.data.data
          }
          return response.data.data
        } else {
          throw new Error(response.data.message || 'Erreur lors de la mise à jour de l\'ordre')
        }
      } catch (error) {
                throw error
      }
    },

    /**
     * Supprime un ordre de production
     */
    async deleteWorkOrder(orderId) {
      try {
        const response = await axiosInstance.delete(`/engins/work-orders/${orderId}/`)
        
        if (response.data.success) {
          this.workOrders = this.workOrders.filter(o => o.id !== orderId)
          return true
        } else {
          throw new Error(response.data.message || 'Erreur lors de la suppression de l\'ordre')
        }
      } catch (error) {
                throw error
      }
    },

    /**
     * Récupère les sessions de production
     */
    async getSessions(filters = {}) {
      this.loading.sessions = true
      this.errors.sessions = null

      try {
        const params = new URLSearchParams(filters).toString()
        const url = params ? `/engins/sessions/?${params}` : '/engins/sessions/'
        const response = await axiosInstance.get(url)
        this.sessions = Array.isArray(response.data) ? response.data : response.data.results || []
      } catch (error) {
                this.errors.sessions = error.response?.data?.message || error.message
        // Ne pas throw l'erreur, juste la logger
      } finally {
        this.loading.sessions = false
      }
    },

    /**
     * Recharge toutes les données MES
     */
    async refreshAll() {
      // Promise.allSettled ne throw jamais, donc pas besoin de try/catch
      await Promise.allSettled([
        this.getDashboard(),
        this.getMachinesStatus(),
        this.getActiveAlerts(),
        this.getWorkOrders(),
        this.getSessions()
      ])
    },

    async createSession(sessionData) {
      try {
        const response = await axiosInstance.post('/engins/sessions/', sessionData)
        this.sessions.unshift(response.data)
        return response.data
      } catch (error) {
                throw error
      }
    }
  }
})
