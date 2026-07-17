<template>
  <div class="chart-showcase">
    <div class="page-header">
      <h1>Showcase - Tous les Types de Graphiques</h1>
      <p>Demonstration de toutes les visualisations disponibles dans KAP</p>
    </div>

    <!-- Section 1: Graphiques Chart.js existants -->
    <section class="chart-section">
      <h2>Graphiques Chart.js (existants)</h2>
      <div class="charts-grid">
        <!-- Line Chart -->
        <BaseChart
          title="Line Chart - Evolution"
          subtitle="Courbe d'evolution mensuelle"
          type="line"
          :data="lineChartData"
          height="300px"
        />

        <!-- Bar Chart -->
        <BaseChart
          title="Bar Chart - Comparaison"
          subtitle="Histogramme comparatif"
          type="bar"
          :data="barChartData"
          height="300px"
        />

        <!-- Doughnut Chart -->
        <BaseChart
          title="Doughnut Chart - Distribution"
          subtitle="Répartition des catégories"
          type="doughnut"
          :data="doughnutChartData"
          height="300px"
        />

        <!-- Pie Chart -->
        <BaseChart
          title="Pie Chart - Parts"
          subtitle="Repartition en secteurs"
          type="pie"
          :data="pieChartData"
          height="300px"
        />

        <!-- Radar Chart -->
        <BaseChart
          title="Radar Chart - Performance"
          subtitle="Analyse multidimensionnelle"
          type="radar"
          :data="radarChartData"
          height="300px"
        />
      </div>
    </section>

    <!-- Section 2: Nouveaux graphiques Plotly -->
    <section class="chart-section">
      <h2>Graphiques Plotly (nouveaux)</h2>
      <div class="charts-grid">
        <!-- Gauge Chart -->
        <GaugeChart
          title="Gauge - Taux d'execution"
          subtitle="Progression du projet"
          :value="42"
          :thresholds="{ danger: 25, warning: 50, success: 75 }"
          height="280px"
        />

        <!-- Bullet Chart -->
        <BulletChart
          title="Bullet - Objectif vs Realisation"
          subtitle="Performance par rapport a la cible"
          :value="68"
          :target="80"
          :ranges="[30, 60, 100]"
          height="180px"
        />

        <!-- Heatmap -->
        <HeatmapChart
          title="Heatmap - Activite par jour/heure"
          subtitle="Intensité des opérations"
          :xLabels="heatmapData.x"
          :yLabels="heatmapData.y"
          :values="heatmapData.z"
          colorscale="YlOrRd"
          height="350px"
        />

        <!-- Treemap -->
        <TreemapChart
          title="Treemap - Repartition Budget"
          subtitle="Structure hiérarchique des dépenses"
          :labels="treemapData.labels"
          :parents="treemapData.parents"
          :values="treemapData.values"
          height="400px"
        />

        <!-- Sankey -->
        <SankeyChart
          title="Sankey - Flux Financiers"
          subtitle="Origine et destination des fonds"
          :nodes="sankeyData.nodes"
          :links="sankeyData.links"
          height="400px"
        />

        <!-- Waterfall -->
        <WaterfallChart
          title="Waterfall - Evolution Tresorerie"
          subtitle="Cascade des mouvements financiers"
          :labels="waterfallData.labels"
          :values="waterfallData.values"
          height="350px"
        />

        <!-- Area Chart -->
        <AreaChart
          title="Area Chart - Evolution Cumulee"
          subtitle="Tendances empilees dans le temps"
          :labels="areaChartData.labels"
          :datasets="areaChartData.datasets"
          :stacked="true"
          height="350px"
        />

        <!-- Stacked Bar -->
        <StackedBarChart
          title="Barres empilées - Dépenses par catégorie"
          subtitle="Repartition mensuelle"
          :labels="stackedBarData.labels"
          :datasets="stackedBarData.datasets"
          height="350px"
        />

        <!-- Stacked Bar Horizontal 100% -->
        <StackedBarChart
          title="Stacked Bar 100% - Proportions"
          subtitle="Mode pourcentage horizontal"
          :labels="stackedBarData.labels"
          :datasets="stackedBarData.datasets"
          orientation="h"
          :percentMode="true"
          height="300px"
        />

        <!-- Scatter Plot -->
        <ScatterChart
          title="Scatter - Correlation Heures/Carburant"
          subtitle="Analyse de correlation avec tendance"
          :datasets="scatterData"
          xAxisTitle="Heures de travail"
          yAxisTitle="Consommation (L)"
          :showTrendline="true"
          height="350px"
        />
      </div>
    </section>

    <!-- Section 3: Resume des types disponibles -->
    <section class="summary-section">
      <Card>
        <template #header>
          <div class="summary-header">
            <h2>Résumé - Types de graphiques disponibles</h2>
          </div>
        </template>
        <template #content>
          <div class="chart-types-grid">
            <div class="chart-type-card existing">
              <i class="pi pi-chart-line"></i>
              <h4>Line</h4>
              <span class="badge">Chart.js</span>
            </div>
            <div class="chart-type-card existing">
              <i class="pi pi-chart-bar"></i>
              <h4>Bar</h4>
              <span class="badge">Chart.js</span>
            </div>
            <div class="chart-type-card existing">
              <i class="pi pi-chart-pie"></i>
              <h4>Doughnut</h4>
              <span class="badge">Chart.js</span>
            </div>
            <div class="chart-type-card existing">
              <i class="pi pi-chart-pie"></i>
              <h4>Pie</h4>
              <span class="badge">Chart.js</span>
            </div>
            <div class="chart-type-card existing">
              <i class="pi pi-star"></i>
              <h4>Radar</h4>
              <span class="badge">Chart.js</span>
            </div>
            <div class="chart-type-card new">
              <i class="pi pi-compass"></i>
              <h4>Gauge</h4>
              <span class="badge new">Plotly</span>
            </div>
            <div class="chart-type-card new">
              <i class="pi pi-minus"></i>
              <h4>Bullet</h4>
              <span class="badge new">Plotly</span>
            </div>
            <div class="chart-type-card new">
              <i class="pi pi-th-large"></i>
              <h4>Heatmap</h4>
              <span class="badge new">Plotly</span>
            </div>
            <div class="chart-type-card new">
              <i class="pi pi-sitemap"></i>
              <h4>Treemap</h4>
              <span class="badge new">Plotly</span>
            </div>
            <div class="chart-type-card new">
              <i class="pi pi-arrows-h"></i>
              <h4>Sankey</h4>
              <span class="badge new">Plotly</span>
            </div>
            <div class="chart-type-card new">
              <i class="pi pi-sort-amount-down"></i>
              <h4>Waterfall</h4>
              <span class="badge new">Plotly</span>
            </div>
            <div class="chart-type-card new">
              <i class="pi pi-chart-line"></i>
              <h4>Area</h4>
              <span class="badge new">Plotly</span>
            </div>
            <div class="chart-type-card new">
              <i class="pi pi-chart-bar"></i>
              <h4>Stacked Bar</h4>
              <span class="badge new">Plotly</span>
            </div>
            <div class="chart-type-card new">
              <i class="pi pi-circle"></i>
              <h4>Scatter</h4>
              <span class="badge new">Plotly</span>
            </div>
          </div>

          <div class="stats-summary">
            <div class="stat">
              <span class="number">5</span>
              <span class="label">Chart.js (existants)</span>
            </div>
            <div class="stat">
              <span class="number">9</span>
              <span class="label">Plotly (nouveaux)</span>
            </div>
            <div class="stat highlight">
              <span class="number">14</span>
              <span class="label">Total disponibles</span>
            </div>
          </div>
        </template>
      </Card>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseChart from '@/shared/components/BaseChart.vue'
import {
  GaugeChart,
  HeatmapChart,
  TreemapChart,
  SankeyChart,
  WaterfallChart,
  BulletChart,
  AreaChart,
  StackedBarChart,
  ScatterChart
} from '@/shared/components/charts'

// Donnees Chart.js existants
const lineChartData = ref({
  labels: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun'],
  datasets: [
    {
      label: 'Realise',
      data: [65, 78, 82, 95, 88, 105],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Prevu',
      data: [70, 75, 85, 90, 95, 100],
      borderColor: '#10b981',
      borderDash: [5, 5],
      fill: false,
      tension: 0.4
    }
  ]
})

const barChartData = ref({
  labels: ['Site A', 'Site B', 'Site C', 'Site D'],
  datasets: [
    {
      label: 'Production (m3)',
      data: [1200, 890, 1450, 1100],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    }
  ]
})

const doughnutChartData = ref({
  labels: ['Carburant', 'Main d\'oeuvre', 'Materiaux', 'Location', 'Autres'],
  datasets: [
    {
      data: [35, 25, 20, 12, 8],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    }
  ]
})

const pieChartData = ref({
  labels: ['Terrassement', 'Beton', 'Transport', 'Finitions'],
  datasets: [
    {
      data: [40, 30, 20, 10],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    }
  ]
})

const radarChartData = ref({
  labels: ['Productivité', 'Qualité', 'Sécurité', 'Délais', 'Budget', 'RH'],
  datasets: [
    {
      label: 'Actuel',
      data: [85, 78, 92, 65, 70, 88],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.2)'
    },
    {
      label: 'Objectif',
      data: [90, 85, 95, 80, 75, 90],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.2)'
    }
  ]
})

// Donnees Plotly nouveaux
const heatmapData = ref({
  x: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  y: ['6h', '8h', '10h', '12h', '14h', '16h', '18h'],
  z: [
    [10, 15, 20, 25, 30, 5],
    [40, 45, 50, 55, 60, 20],
    [70, 75, 80, 85, 90, 40],
    [50, 55, 60, 65, 70, 30],
    [80, 85, 90, 95, 100, 50],
    [60, 65, 70, 75, 80, 35],
    [30, 35, 40, 45, 50, 15]
  ]
})

const treemapData = ref({
  labels: [
    'Budget Total',
    'Personnel', 'Salaires', 'Primes', 'Charges',
    'Equipements', 'Carburant', 'Maintenance', 'Location',
    'Materiaux', 'Granulats', 'Ciment', 'Acier'
  ],
  parents: [
    '',
    'Budget Total', 'Personnel', 'Personnel', 'Personnel',
    'Budget Total', 'Equipements', 'Equipements', 'Equipements',
    'Budget Total', 'Materiaux', 'Materiaux', 'Materiaux'
  ],
  values: [
    0,
    0, 45000000, 8000000, 12000000,
    0, 25000000, 15000000, 20000000,
    0, 30000000, 18000000, 22000000
  ]
})

const sankeyData = ref({
  nodes: {
    label: [
      'BOAD', 'Etat', 'Fonds Propres',
      'Budget Projet',
      'Personnel', 'Equipements', 'Materiaux', 'Sous-traitance'
    ],
    color: [
      '#3b82f6', '#10b981', '#f59e0b',
      '#6366f1',
      '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'
    ]
  },
  links: {
    source: [0, 1, 2, 3, 3, 3, 3],
    target: [3, 3, 3, 4, 5, 6, 7],
    value: [800, 150, 50, 300, 250, 300, 150],
    color: 'rgba(100, 100, 100, 0.2)'
  }
})

const waterfallData = ref({
  labels: ['Budget Initial', 'Revenus', 'Personnel', 'Carburant', 'Materiaux', 'Autres', 'Solde Final'],
  values: [500000000, 150000000, -120000000, -80000000, -95000000, -55000000, 300000000]
})

const areaChartData = ref({
  labels: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun'],
  datasets: [
    {
      label: 'Terrassement',
      data: [120, 150, 180, 200, 220, 250],
      color: 'rgba(59, 130, 246, 0.6)'
    },
    {
      label: 'Beton',
      data: [80, 90, 100, 120, 140, 160],
      color: 'rgba(16, 185, 129, 0.6)'
    },
    {
      label: 'Transport',
      data: [50, 60, 70, 80, 90, 100],
      color: 'rgba(245, 158, 11, 0.6)'
    }
  ]
})

const stackedBarData = ref({
  labels: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun'],
  datasets: [
    {
      label: 'Carburant',
      data: [25, 30, 28, 35, 32, 38],
      color: '#3b82f6'
    },
    {
      label: 'Maintenance',
      data: [15, 12, 18, 14, 20, 16],
      color: '#10b981'
    },
    {
      label: 'Personnel',
      data: [45, 48, 50, 52, 55, 58],
      color: '#f59e0b'
    },
    {
      label: 'Autres',
      data: [10, 8, 12, 9, 11, 10],
      color: '#8b5cf6'
    }
  ]
})

const scatterData = ref([
  {
    label: 'Engins',
    x: [8, 10, 12, 9, 11, 14, 7, 13, 10, 8],
    y: [160, 200, 240, 180, 220, 280, 140, 260, 200, 160],
    color: '#3b82f6'
  },
  {
    label: 'Camions',
    x: [6, 8, 10, 7, 9, 12, 5, 11, 8, 6],
    y: [80, 100, 130, 90, 115, 150, 70, 140, 100, 80],
    color: '#10b981'
  }
])
</script>

<style scoped>
.chart-showcase {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #6b7280;
  font-size: 1rem;
}

.chart-section {
  margin-bottom: 3rem;
}

.chart-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 1.5rem;
}

.summary-section {
  margin-top: 3rem;
}

.summary-header h2 {
  padding: 1.5rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.chart-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  padding: 0 1.5rem;
}

.chart-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.chart-type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chart-type-card.existing {
  border-color: #3b82f6;
  background: #eff6ff;
}

.chart-type-card.new {
  border-color: #10b981;
  background: #ecfdf5;
}

.chart-type-card i {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #374151;
}

.chart-type-card h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.chart-type-card .badge {
  font-size: 0.625rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  background: #3b82f6;
  color: white;
  font-weight: 500;
}

.chart-type-card .badge.new {
  background: #10b981;
}

.stats-summary {
  display: flex;
  justify-content: center;
  gap: 3rem;
  padding: 2rem 1.5rem;
  margin-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.stat {
  text-align: center;
}

.stat .number {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  color: #3b82f6;
}

.stat.highlight .number {
  color: #10b981;
}

.stat .label {
  font-size: 0.875rem;
  color: #6b7280;
}

@media (max-width: 768px) {
  .chart-showcase {
    padding: 1rem;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-types-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .stats-summary {
    flex-direction: column;
    gap: 1.5rem;
  }
}
</style>
