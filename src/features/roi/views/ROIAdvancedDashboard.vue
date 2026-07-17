<template>
  <div class="roi-advanced-dashboard">
    <div class="page-header">
      <div class="header-content">
        <h1>Tableau de Bord Financier Unifié</h1>
        <p class="subtitle">Consolidation automatique des coûts et analyse ROI</p>
      </div>
      <div class="header-actions">
        <Button
          label="Actualiser"
          icon="pi pi-refresh"
          @click="loadAllData"
        />
        <Button
          label="Exporter Rapport"
          icon="pi pi-download"
          @click="exportReport"
        />
      </div>
    </div>

    <!-- Filtres principaux -->
    <Card class="filters-card">
      <template #content>
        <div class="filters-grid">
          <div class="filter-group">
            <label>Période d'analyse</label>
            <div class="date-range">
              <DatePicker
                v-model="filters.date_debut"
                placeholder="Date début"
                dateFormat="dd/mm/yy"
                :showIcon="true"
                @date-select="loadAllData"
              />
              <span>au</span>
              <DatePicker
                v-model="filters.date_fin"
                placeholder="Date fin"
                dateFormat="dd/mm/yy"
                :showIcon="true"
                @date-select="loadAllData"
              />
            </div>
          </div>

          <div class="filter-group">
            <label>Projet</label>
            <Select
              v-model="filters.projet"
              :options="projets"
              optionLabel="nom"
              optionValue="id"
              placeholder="Tous les projets"
              showClear
              filter
              @change="loadAllData"
            />
          </div>

          <div class="filter-group">
            <label>Type d'analyse</label>
            <Select
              v-model="filters.type_analyse"
              :options="typesAnalyse"
              optionLabel="label"
              optionValue="value"
              placeholder="Analyse globale"
              @change="loadAllData"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- KPIs principaux -->
    <div class="kpis-grid" v-if="kpis">
      <Card class="kpi-card">
        <template #content>
          <div class="kpi-content">
            <div class="kpi-icon primary">
              <i class="pi pi-euro"></i>
            </div>
            <div class="kpi-info">
              <div class="kpi-value">{{ formatCurrency(kpis.chiffre_affaires) }}</div>
              <div class="kpi-label">Chiffre d'Affaires</div>
              <div class="kpi-trend" :class="getTrendClass(kpis.ca_trend)">
                <i :class="getTrendIcon(kpis.ca_trend)"></i>
                {{ Math.abs(kpis.ca_trend) }}%
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="kpi-card">
        <template #content>
          <div class="kpi-content">
            <div class="kpi-icon success">
              <i class="pi pi-chart-line"></i>
            </div>
            <div class="kpi-info">
              <div class="kpi-value">{{ formatCurrency(kpis.cout_total) }}</div>
              <div class="kpi-label">Coût Total</div>
              <div class="kpi-breakdown">
                MO: {{ formatCurrency(kpis.cout_mo) }} | Mat: {{ formatCurrency(kpis.cout_materiaux) }}
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="kpi-card">
        <template #content>
          <div class="kpi-content">
            <div class="kpi-icon info">
              <i class="pi pi-percentage"></i>
            </div>
            <div class="kpi-info">
              <div class="kpi-value">{{ kpis.marge_nette }}%</div>
              <div class="kpi-label">Marge Nette</div>
              <div class="kpi-amount">{{ formatCurrency(kpis.montant_marge) }}</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="kpi-card">
        <template #content>
          <div class="kpi-content">
            <div class="kpi-icon warning">
              <i class="pi pi-bolt"></i>
            </div>
            <div class="kpi-info">
              <div class="kpi-value">{{ kpis.roi }}%</div>
              <div class="kpi-label">ROI</div>
              <div class="kpi-detail">Rentabilité sur investissement</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Graphiques d'analyse -->
    <div class="charts-section">
      <div class="charts-row">
        <Card class="chart-card large">
          <template #header>
            <div class="chart-header">
              <h3>Évolution Financière</h3>
              <div class="chart-controls">
                <Select
                  v-model="chartPeriod"
                  :options="chartPeriods"
                  optionLabel="label"
                  optionValue="value"
                  @change="updateFinancialChart"
                />
              </div>
            </div>
          </template>
          <template #content>
            <Chart type="line" :data="financialChart" :options="chartOptions" />
          </template>
        </Card>

        <Card class="chart-card">
          <template #header>
            <div class="chart-header">
              <h3>Répartition des Coûts</h3>
            </div>
          </template>
          <template #content>
            <Chart type="doughnut" :data="costRepartitionChart" :options="chartOptions" />
          </template>
        </Card>
      </div>

      <div class="charts-row">
        <Card class="chart-card">
          <template #header>
            <div class="chart-header">
              <h3>Marge par Projet</h3>
            </div>
          </template>
          <template #content>
            <Chart type="bar" :data="projectMarginChart" :options="chartOptions" />
          </template>
        </Card>

        <Card class="chart-card">
          <template #header>
            <div class="chart-header">
              <h3>Performance vs Objectif</h3>
            </div>
          </template>
          <template #content>
            <Chart type="radar" :data="performanceChart" :options="chartOptions" />
          </template>
        </Card>

        <Card class="chart-card">
          <template #header>
            <div class="chart-header">
              <h3>Taux de Productivité</h3>
            </div>
          </template>
          <template #content>
            <Chart type="bar" :data="productivityChart" :options="chartOptions" />
          </template>
        </Card>
      </div>
    </div>

    <!-- Tableau détaillé -->
    <Card class="details-card">
      <template #header>
        <div class="card-header">
          <h2>Analyse Détaillée par Projet</h2>
          <div class="header-actions">
            <Button
              icon="pi pi-file-excel"
              label="Exporter Excel"
              class="p-button-outlined"
              @click="exportExcel"
            />
          </div>
        </div>
      </template>

      <template #content>
        <DataTable
          :value="detailedData"
          :loading="loading"
          :paginator="true"
          :rows="20"
          :globalFilterFields="['projet_nom', 'client_nom']"
          v-model:filters="filters"
          filterDisplay="menu"
          :rowsPerPageOptions="[10, 20, 50]"
          class="p-datatable-sm"
        >
          <template #header>
            <div class="table-header">
              <span class="table-title">Analyse financière détaillée</span>
              <IconField iconPosition="left">
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Recherche..." />
              </IconField>
            </div>
          </template>

          <Column field="projet_nom" header="Projet" :sortable="true" style="min-width: 200px">
            <template #body="{ data }">
              <div class="project-cell">
                <Avatar
                  :label="data.projet_nom[0]"
                  size="small"
                  :style="{ backgroundColor: '#3b82f6', color: 'white' }"
                  shape="circle"
                />
                <div>
                  <div class="project-name">{{ data.projet_nom }}</div>
                  <div class="project-client">{{ data.client_nom }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="chiffre_affaires" header="CA" :sortable="true" style="min-width: 120px">
            <template #body="{ data }">
              <span class="number-cell text-primary-600">
                {{ formatCurrency(data.chiffre_affaires) }}
              </span>
            </template>
          </Column>

          <Column field="cout_mo" header="Coût MO" :sortable="true" style="min-width: 120px">
            <template #body="{ data }">
              <span class="number-cell">{{ formatCurrency(data.cout_mo) }}</span>
            </template>
          </Column>

          <Column field="cout_materiaux" header="Coût Matériaux" :sortable="true" style="min-width: 130px">
            <template #body="{ data }">
              <span class="number-cell">{{ formatCurrency(data.cout_materiaux) }}</span>
            </template>
          </Column>

          <Column field="cout_engins" header="Coût Engins" :sortable="true" style="min-width: 120px">
            <template #body="{ data }">
              <span class="number-cell">{{ formatCurrency(data.cout_engins) }}</span>
            </template>
          </Column>

          <Column field="cout_autres" header="Autres Coûts" :sortable="true" style="min-width: 120px">
            <template #body="{ data }">
              <span class="number-cell">{{ formatCurrency(data.cout_autres) }}</span>
            </template>
          </Column>

          <Column field="cout_total" header="Coût Total" :sortable="true" style="min-width: 120px">
            <template #body="{ data }">
              <span class="number-cell font-bold text-danger-600">
                {{ formatCurrency(data.cout_total) }}
              </span>
            </template>
          </Column>

          <Column field="marge_nette" header="Marge %" :sortable="true" style="min-width: 100px">
            <template #body="{ data }">
              <span class="number-cell" :class="getMarginClass(data.marge_nette)">
                {{ data.marge_nette }}%
              </span>
            </template>
          </Column>

          <Column field="montant_marge" header="Marge €" :sortable="true" style="min-width: 120px">
            <template #body="{ data }">
              <span class="number-cell font-bold" :class="getMarginClass(data.marge_nette)">
                {{ formatCurrency(data.montant_marge) }}
              </span>
            </template>
          </Column>

          <Column field="roi" header="ROI" :sortable="true" style="min-width: 80px">
            <template #body="{ data }">
              <span class="number-cell" :class="getROIClass(data.roi)">
                {{ data.roi }}%
              </span>
            </template>
          </Column>

          <Column header="Actions" style="min-width: 100px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  icon="pi pi-eye"
                  size="small"
                  text
                  rounded
                  @click="viewProjectDetails(data)"
                  v-tooltip="'Voir détails'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Dialog détails projet -->
    <Dialog
      v-model:visible="showDetailsDialog"
      :header="`Détails financiers - ${selectedProject?.projet_nom}`"
      :modal="true"
      :style="{ width: '80%' }"
      maximizable
    >
      <ProjectFinancialDetails
        :project="selectedProject"
        @close="showDetailsDialog = false"
      />
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProjetStore } from '@/stores/projetStore'
import { useToast } from 'primevue/usetoast'
import ProjectFinancialDetails from '../components/ProjectFinancialDetails.vue'

// Stores
const projetStore = useProjetStore()
const toast = useToast()

// État réactif
const loading = ref(false)
const kpis = ref(null)
const detailedData = ref([])
const showDetailsDialog = ref(false)
const selectedProject = ref(null)
const chartPeriod = ref('month')

// Filtres
const filters = ref({
  date_debut: new Date(new Date().setMonth(new Date().getMonth() - 1)),
  date_fin: new Date(),
  projet: null,
  type_analyse: 'global'
})

// Options
const projets = computed(() => projetStore.projets)

const typesAnalyse = ref([
  { label: 'Analyse globale', value: 'global' },
  { label: 'Par projet', value: 'projet' },
  { label: 'Par client', value: 'client' },
  { label: 'Par type de projet', value: 'type' }
])

const chartPeriods = ref([
  { label: 'Dernière semaine', value: 'week' },
  { label: 'Dernier mois', value: 'month' },
  { label: 'Dernier trimestre', value: 'quarter' },
  { label: 'Dernière année', value: 'year' }
])

// Graphiques
const financialChart = ref({
  labels: [],
  datasets: [
    {
      label: 'Chiffre d\'affaires',
      data: [],
      borderColor: '#10b981',
      backgroundColor: '#10b981',
      tension: 0.4
    },
    {
      label: 'Coûts totaux',
      data: [],
      borderColor: '#ef4444',
      backgroundColor: '#ef4444',
      tension: 0.4
    },
    {
      label: 'Marge',
      data: [],
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f6',
      tension: 0.4
    }
  ]
})

const costRepartitionChart = ref({
  labels: ['Main d\'œuvre', 'Matériaux', 'Engins', 'Autres'],
  datasets: [{
    data: [],
    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
  }]
})

const projectMarginChart = ref({
  labels: [],
  datasets: [{
    label: 'Marge en %',
    data: [],
    backgroundColor: []
  }]
})

const performanceChart = ref({
  labels: ['Objectif CA', 'Objectif Coûts', 'Objectif Marge', 'Objectif ROI'],
  datasets: [
    {
      label: 'Réalisé',
      data: [],
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f6'
    },
    {
      label: 'Objectif',
      data: [],
      borderColor: '#10b981',
      backgroundColor: '#10b981'
    }
  ]
})

const productivityChart = ref({
  labels: [],
  datasets: [
    {
      label: 'Productivité',
      data: [],
      backgroundColor: '#10b981'
    }
  ]
})

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
})

// Méthodes
const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadKPIs(),
      loadDetailedData()
    ])
    updateCharts()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des données financières',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const loadKPIs = async () => {
  // Simulation - à remplacer par appel API réel
  kpis.value = {
    chiffre_affaires: 250000000,
    ca_trend: 12.5,
    cout_total: 185000000,
    cout_mo: 75000000,
    cout_materiaux: 85000000,
    cout_engins: 15000000,
    cout_autres: 10000000,
    marge_nette: 26,
    montant_marge: 65000000,
    roi: 35.1
  }
}

const loadDetailedData = async () => {
  // Simulation - à remplacer par appel API réel
  detailedData.value = [
    {
      id: 1,
      projet_nom: 'Autoroute Dakar-Diamniadio',
      client_nom: 'APIX',
      chiffre_affaires: 85000000,
      cout_mo: 25000000,
      cout_materiaux: 35000000,
      cout_engins: 8000000,
      cout_autres: 5000000,
      cout_total: 73000000,
      marge_nette: 14.1,
      montant_marge: 12000000,
      roi: 16.4
    },
    {
      id: 2,
      projet_nom: 'Complexe Sportif Diamniadio',
      client_nom: 'État du Sénégal',
      chiffre_affaires: 120000000,
      cout_mo: 35000000,
      cout_materiaux: 40000000,
      cout_engins: 5000000,
      cout_autres: 3000000,
      cout_total: 83000000,
      marge_nette: 30.8,
      montant_marge: 37000000,
      roi: 44.6
    },
    {
      id: 3,
      projet_nom: 'Travaux VRD Pikine',
      client_nom: 'Mairie de Pikine',
      chiffre_affaires: 45000000,
      cout_mo: 15000000,
      cout_materiaux: 10000000,
      cout_engins: 2000000,
      cout_autres: 2000000,
      cout_total: 29000000,
      marge_nette: 35.6,
      montant_marge: 16000000,
      roi: 55.2
    }
  ]
}

const updateCharts = () => {
  updateFinancialChart()
  updateCostRepartitionChart()
  updateProjectMarginChart()
  updatePerformanceChart()
  updateProductivityChart()
}

const updateFinancialChart = () => {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  })

  financialChart.value = {
    labels: last30Days,
    datasets: [
      {
        label: 'Chiffre d\'affaires',
        data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10000000) + 5000000),
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.4
      },
      {
        label: 'Coûts totaux',
        data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 8000000) + 4000000),
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        tension: 0.4
      },
      {
        label: 'Marge',
        data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 3000000) + 1000000),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.4
      }
    ]
  }
}

const updateCostRepartitionChart = () => {
  if (kpis.value) {
    costRepartitionChart.value = {
      labels: ['Main d\'œuvre', 'Matériaux', 'Engins', 'Autres'],
      datasets: [{
        data: [
          kpis.value.cout_mo,
          kpis.value.cout_materiaux,
          kpis.value.cout_engins,
          kpis.value.cout_autres
        ],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      }]
    }
  }
}

const updateProjectMarginChart = () => {
  projectMarginChart.value = {
    labels: detailedData.value.map(p => p.projet_nom),
    datasets: [{
      label: 'Marge en %',
      data: detailedData.value.map(p => p.marge_nette),
      backgroundColor: detailedData.value.map(p =>
        p.marge_nette > 30 ? '#10b981' : p.marge_nette > 15 ? '#f59e0b' : '#ef4444'
      )
    }]
  }
}

const updatePerformanceChart = () => {
  const avgCA = detailedData.value.reduce((sum, p) => sum + p.chiffre_affaires, 0) / detailedData.value.length
  const avgCost = detailedData.value.reduce((sum, p) => sum + p.cout_total, 0) / detailedData.value.length
  const avgMargin = detailedData.value.reduce((sum, p) => sum + p.marge_nette, 0) / detailedData.value.length
  const avgROI = detailedData.value.reduce((sum, p) => sum + p.roi, 0) / detailedData.value.length

  performanceChart.value = {
    labels: ['Objectif CA', 'Objectif Coûts', 'Objectif Marge', 'Objectif ROI'],
    datasets: [
      {
        label: 'Réalisé',
        data: [avgCA / 1000000, avgCost / 1000000, avgMargin, avgROI],
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6'
      },
      {
        label: 'Objectif',
        data: [avgCA / 1000000 * 1.1, avgCost / 1000000 * 0.9, 25, 30],
        borderColor: '#10b981',
        backgroundColor: '#10b981'
      }
    ]
  }
}

const updateProductivityChart = () => {
  productivityChart.value = {
    labels: detailedData.value.map(p => p.projet_nom),
    datasets: [{
      label: 'Productivité (CA/coûts)',
      data: detailedData.value.map(p => ((p.chiffre_affaires / p.cout_total) * 100).toFixed(1)),
      backgroundColor: detailedData.value.map(p =>
        p.roi > 40 ? '#10b981' : p.roi > 25 ? '#f59e0b' : '#ef4444'
      )
    }]
  }
}

// Utilitaires
const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const getTrendClass = (trend) => {
  return trend > 0 ? 'text-green-600' : 'text-red-600'
}

const getTrendIcon = (trend) => {
  return trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'
}

const getMarginClass = (margin) => {
  if (margin > 30) return 'text-green-600 font-bold'
  if (margin > 15) return 'text-yellow-600 font-semibold'
  return 'text-red-600 font-bold'
}

const getROIClass = (roi) => {
  if (roi > 40) return 'text-green-600 font-bold'
  if (roi > 25) return 'text-yellow-600 font-semibold'
  return 'text-red-600 font-bold'
}

// Actions
const viewProjectDetails = (project) => {
  selectedProject.value = project
  showDetailsDialog.value = true
}

const exportReport = () => {
  toast.add({
    severity: 'info',
    summary: 'Export en cours',
    detail: 'Génération du rapport financier en cours...',
    life: 3000
  })
  // Implémentation de l'export PDF
}

const exportExcel = () => {
  toast.add({
    severity: 'info',
    summary: 'Export Excel',
    detail: 'Export des données financières vers Excel...',
    life: 3000
  })
  // Implémentation de l'export Excel
}

// Cycle de vie
onMounted(async () => {
  await projetStore.loadProjets()
  await loadAllData()
})
</script>

<style scoped>
.roi-advanced-dashboard {
  padding: 1.5rem;
  background-color: #f8fafc;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.header-content .subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.filters-card {
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border-radius: 0.75rem;
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-range span {
  font-size: 0.875rem;
  color: #6b7280;
}

.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.kpi-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
}

.kpi-icon {
  width: 50px;
  height: 50px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
  flex-shrink: 0;
}

.kpi-icon.primary { background: #f1f5f9; color: #2563eb; }
.kpi-icon.success { background: rgba(122, 201, 67, 0.1); color: #7AC943; }
.kpi-icon.info { background: #f0f9ff; color: #0891b2; }
.kpi-icon.warning { background: #fffbeb; color: #d97706; }

.kpi-info {
  flex: 1;
}

.kpi-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.kpi-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.kpi-breakdown {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.kpi-amount {
  font-size: 0.875rem;
  color: #6b7280;
}

.kpi-detail {
  font-size: 0.75rem;
  color: #6b7280;
}

.charts-section {
  margin-bottom: 2rem;
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.charts-row:last-child {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.chart-card {
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border-radius: 0.75rem;
}

.chart-card.large {
  min-height: 400px;
}

.chart-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.chart-controls {
  display: flex;
  gap: 0.5rem;
}

.details-card {
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border-radius: 0.75rem;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-title {
  font-weight: 600;
  color: #1f2937;
}

.project-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.project-name {
  font-weight: 500;
  color: #1f2937;
}

.project-client {
  font-size: 0.875rem;
  color: #6b7280;
}

.number-cell {
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', monospace;
}

.text-primary-600 {
  color: #2563eb;
}

.text-danger-600 {
  color: #dc2626;
}

.text-green-600 {
  color: #059669;
}

.text-yellow-600 {
  color: #d97706;
}

.text-red-600 {
  color: #dc2626;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 1200px) {
  .charts-row {
    grid-template-columns: 1fr;
  }

  .charts-row:last-child {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .kpis-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .date-range {
    flex-direction: column;
    align-items: stretch;
  }

  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}
</style>