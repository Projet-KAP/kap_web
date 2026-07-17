<template>
  <div class="project-financial-details">
    <Card class="details-card">
      <template #header>
        <div class="card-header">
          <h4>Détails Financiers par Projet</h4>
          <Button
            label="Actualiser"
            icon="pi pi-refresh"
            @click="loadProjectData"
            class="p-button-sm p-button-outlined"
            :loading="loading"
          />
        </div>
      </template>

      <template #content>
        <div v-if="loading" class="loading-content">
          <ProgressSpinner />
          <p>Chargement des données financières...</p>
        </div>

        <div v-else-if="projects.length === 0" class="empty-content">
          <i class="pi pi-folder-open"></i>
          <p>Aucun projet trouvé</p>
        </div>

        <div v-else class="projects-list">
          <Accordion :multiple="true" :activeIndex="[0]">
            <AccordionTab
              v-for="(project, index) in projects"
              :key="project.id"
              :header="getProjectHeader(project)"
            >
              <div class="project-details">
                <!-- KPI Cards -->
                <div class="kpi-grid">
                  <div class="kpi-card revenue">
                    <div class="kpi-value">{{ formatCurrency(project.revenue) }}</div>
                    <div class="kpi-label">Revenus</div>
                  </div>
                  <div class="kpi-card cost">
                    <div class="kpi-value">{{ formatCurrency(project.total_cost) }}</div>
                    <div class="kpi-label">Coûts Totaux</div>
                  </div>
                  <div class="kpi-card margin">
                    <div class="kpi-value">{{ formatCurrency(project.margin) }}</div>
                    <div class="kpi-label">Marge</div>
                  </div>
                  <div class="kpi-card roi">
                    <div class="kpi-value">{{ formatPercentage(project.roi) }}</div>
                    <div class="kpi-label">ROI</div>
                  </div>
                </div>

                <!-- Detailed Breakdown -->
                <div class="detailed-section">
                  <h5>Répartition des Coûts</h5>
                  <div class="cost-breakdown">
                    <div
                      v-for="cost in project.cost_breakdown"
                      :key="cost.category"
                      class="cost-item"
                    >
                      <div class="cost-category">{{ cost.category }}</div>
                      <div class="cost-amount">{{ formatCurrency(cost.amount) }}</div>
                      <div class="cost-percentage">{{ formatPercentage(cost.percentage) }}</div>
                    </div>
                  </div>
                </div>

                <!-- Revenue Sources -->
                <div class="detailed-section">
                  <h5>Sources de Revenus</h5>
                  <div class="revenue-sources">
                    <div
                      v-for="source in project.revenue_sources"
                      :key="source.source"
                      class="revenue-item"
                    >
                      <div class="revenue-source">{{ source.source }}</div>
                      <div class="revenue-amount">{{ formatCurrency(source.amount) }}</div>
                      <div class="revenue-status">
                        <Tag
                          :value="source.status"
                          :severity="getSourceSeverity(source.status)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Financial Timeline -->
                <div class="detailed-section">
                  <h5>Évolution Financière</h5>
                  <Chart
                    type="line"
                    :data="getFinancialChartData(project)"
                    :options="chartOptions"
                    class="financial-chart"
                  />
                </div>

                <!-- Actions -->
                <div class="project-actions">
                  <Button
                    label="Voir le détail"
                    icon="pi pi-eye"
                    @click="viewProjectDetails(project)"
                    class="p-button-outlined p-button-sm"
                  />
                  <Button
                    label="Exporter le rapport"
                    icon="pi pi-download"
                    @click="exportProjectReport(project)"
                    class="p-button-outlined p-button-sm"
                  />
                  <Button
                    label="Analyser le projet"
                    icon="pi pi-chart-line"
                    @click="analyzeProject(project)"
                    class="p-button-sm"
                  />
                </div>
              </div>
            </AccordionTab>
          </Accordion>
        </div>
      </template>
    </Card>

    <!-- Summary Statistics -->
    <Card class="summary-card">
      <template #header>
        <h4>Résumé Global</h4>
      </template>

      <template #content>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Revenu Total</div>
            <div class="summary-value">{{ formatCurrency(totalRevenue) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Coût Total</div>
            <div class="summary-value">{{ formatCurrency(totalCost) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Marge Totale</div>
            <div class="summary-value">{{ formatCurrency(totalMargin) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">ROI Moyen</div>
            <div class="summary-value">{{ formatPercentage(averageROI) }}</div>
          </div>
        </div>

        <!-- Global Chart -->
        <div class="global-chart-section">
          <h5>Comparaison des Projets</h5>
          <Chart
            type="bar"
            :data="getComparisonChartData()"
            :options="comparisonChartOptions"
            class="comparison-chart"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProjetStore } from '@/stores/projetStore'
import { useToast } from 'primevue/usetoast'

// Composables
const projetStore = useProjetStore()
const toast = useToast()

// State
const loading = ref(false)
const projects = ref([])

// Computed
const totalRevenue = computed(() => {
  return projects.value.reduce((sum, project) => sum + (project.revenue || 0), 0)
})

const totalCost = computed(() => {
  return projects.value.reduce((sum, project) => sum + (project.total_cost || 0), 0)
})

const totalMargin = computed(() => {
  return projects.value.reduce((sum, project) => sum + (project.margin || 0), 0)
})

const averageROI = computed(() => {
  if (projects.value.length === 0) return 0
  const totalROI = projects.value.reduce((sum, project) => sum + (project.roi || 0), 0)
  return totalROI / projects.value.length
})

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return formatCurrency(value)
        }
      }
    }
  }
}

const comparisonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return formatCurrency(value)
        }
      }
    }
  }
}

// Methods
const loadProjectData = async () => {
  loading.value = true
  try {
    // Simulate loading project data
    const mockProjects = [
      {
        id: 1,
        name: 'Projet A - Construction Bâtiment A',
        revenue: 2500000,
        total_cost: 1800000,
        margin: 700000,
        roi: 38.9,
        cost_breakdown: [
          { category: 'Main d\'œuvre', amount: 800000, percentage: 44.4 },
          { category: 'Matériaux', amount: 600000, percentage: 33.3 },
          { category: 'Équipement', amount: 300000, percentage: 16.7 },
          { category: 'Sous-traitants', amount: 100000, percentage: 5.6 }
        ],
        revenue_sources: [
          { source: 'Client Principal', amount: 2000000, status: 'Payé' },
          { source: 'Prestations Additionnelles', amount: 500000, status: 'En attente' }
        ],
        financial_timeline: [
          { month: 'Jan', revenue: 200000, cost: 150000 },
          { month: 'Fev', revenue: 300000, cost: 200000 },
          { month: 'Mar', revenue: 400000, cost: 250000 },
          { month: 'Avr', revenue: 500000, cost: 300000 },
          { month: 'Mai', revenue: 600000, cost: 400000 },
          { month: 'Jun', revenue: 500000, cost: 500000 }
        ]
      },
      {
        id: 2,
        name: 'Projet B - Réseau Routier',
        revenue: 1800000,
        total_cost: 1500000,
        margin: 300000,
        roi: 20.0,
        cost_breakdown: [
          { category: 'Main d\'œuvre', amount: 700000, percentage: 46.7 },
          { category: 'Matériaux', amount: 500000, percentage: 33.3 },
          { category: 'Équipement', amount: 200000, percentage: 13.3 },
          { category: 'Sous-traitants', amount: 100000, percentage: 6.7 }
        ],
        revenue_sources: [
          { source: 'Municipalité', amount: 1500000, status: 'Payé' },
          { source: 'Travaux Supplémentaires', amount: 300000, status: 'Payé' }
        ],
        financial_timeline: [
          { month: 'Jan', revenue: 150000, cost: 120000 },
          { month: 'Fev', revenue: 250000, cost: 200000 },
          { month: 'Mar', revenue: 300000, cost: 250000 },
          { month: 'Avr', revenue: 350000, cost: 300000 },
          { month: 'Mai', revenue: 400000, cost: 350000 },
          { month: 'Jun', revenue: 350000, cost: 280000 }
        ]
      },
      {
        id: 3,
        name: 'Projet C - Infrastructure Eau',
        revenue: 3200000,
        total_cost: 2400000,
        margin: 800000,
        roi: 33.3,
        cost_breakdown: [
          { category: 'Main d\'œuvre', amount: 1000000, percentage: 41.7 },
          { category: 'Matériaux', amount: 800000, percentage: 33.3 },
          { category: 'Équipement', amount: 400000, percentage: 16.7 },
          { category: 'Sous-traitants', amount: 200000, percentage: 8.3 }
        ],
        revenue_sources: [
          { source: 'Gouvernement', amount: 2800000, status: 'Payé' },
          { source: 'Maintenance', amount: 400000, status: 'En attente' }
        ],
        financial_timeline: [
          { month: 'Jan', revenue: 300000, cost: 200000 },
          { month: 'Fev', revenue: 400000, cost: 300000 },
          { month: 'Mar', revenue: 500000, cost: 400000 },
          { month: 'Avr', revenue: 600000, cost: 450000 },
          { month: 'Mai', revenue: 700000, cost: 550000 },
          { month: 'Jun', revenue: 700000, cost: 500000 }
        ]
      }
    ]

    projects.value = mockProjects
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des données projets',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const getProjectHeader = (project) => {
  return `${project.name} (ROI: ${formatPercentage(project.roi)})`
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatPercentage = (value) => {
  return `${(value || 0).toFixed(1)}%`
}

const getSourceSeverity = (status) => {
  switch (status.toLowerCase()) {
    case 'payé':
      return 'success'
    case 'en attente':
      return 'warning'
    case 'en retard':
      return 'danger'
    default:
      return 'info'
  }
}

const getFinancialChartData = (project) => {
  return {
    labels: project.financial_timeline.map(item => item.month),
    datasets: [
      {
        label: 'Revenus',
        data: project.financial_timeline.map(item => item.revenue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'Coûts',
        data: project.financial_timeline.map(item => item.cost),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }
    ]
  }
}

const getComparisonChartData = () => {
  return {
    labels: projects.value.map(p => p.name.split(' - ')[0]),
    datasets: [
      {
        label: 'Revenus',
        data: projects.value.map(p => p.revenue),
        backgroundColor: '#3b82f6'
      },
      {
        label: 'Coûts',
        data: projects.value.map(p => p.total_cost),
        backgroundColor: '#ef4444'
      },
      {
        label: 'Marge',
        data: projects.value.map(p => p.margin),
        backgroundColor: '#10b981'
      }
    ]
  }
}

const viewProjectDetails = (project) => {
  toast.add({
    severity: 'info',
    summary: 'Détails du projet',
    detail: `Affichage des détails pour ${project.name}`,
    life: 3000
  })
}

const exportProjectReport = (project) => {
  toast.add({
    severity: 'success',
    summary: 'Export en cours',
    detail: `Génération du rapport pour ${project.name}`,
    life: 3000
  })
}

const analyzeProject = (project) => {
  toast.add({
    severity: 'info',
    summary: 'Analyse',
    detail: `Lancement de l'analyse pour ${project.name}`,
    life: 3000
  })
}

// Lifecycle
onMounted(() => {
  loadProjectData()
})
</script>

<style scoped>
.project-financial-details {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.details-card,
.summary-card {
  border: none;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h4 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.loading-content,
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6c757d;
}

.loading-content i,
.empty-content i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.projects-list {
  margin-top: 1rem;
}

.project-details {
  padding: 1rem 0;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #dee2e6;
}

.kpi-card.revenue {
  border-left: 4px solid #10b981;
}

.kpi-card.cost {
  border-left: 4px solid #ef4444;
}

.kpi-card.margin {
  border-left: 4px solid #3b82f6;
}

.kpi-card.roi {
  border-left: 4px solid #3b82f6;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.kpi-label {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.detailed-section {
  margin-bottom: 2rem;
}

.detailed-section h5 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.cost-breakdown,
.revenue-sources {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cost-item,
.revenue-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.cost-category,
.revenue-source {
  font-weight: 500;
  color: #2c3e50;
}

.cost-amount,
.revenue-amount {
  text-align: right;
  font-weight: 600;
  color: #2c3e50;
}

.cost-percentage,
.revenue-status {
  text-align: right;
}

.financial-chart,
.comparison-chart {
  height: 300px;
  margin-top: 1rem;
}

.project-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-item {
  text-align: center;
  padding: 1.5rem;
  background: #2563eb;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.summary-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.global-chart-section {
  margin-top: 2rem;
}

.global-chart-section h5 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .cost-item,
  .revenue-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .cost-amount,
  .revenue-amount,
  .cost-percentage,
  .revenue-status {
    text-align: left;
  }

  .project-actions {
    flex-direction: column;
  }

  .project-actions .p-button {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>