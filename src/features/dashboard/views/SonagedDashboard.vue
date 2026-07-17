<template>
  <div class="sonaged-page">
    <div class="tabs-container">
      <div class="tabs-scroll">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-item"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="period-switch">
        <button
          v-for="option in periodOptions"
          :key="option.value"
          class="period-pill"
          :class="{ active: selectedPeriod === option.value }"
          @click="selectedPeriod = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <section class="kpi-grid">
      <article v-for="item in headlineKpis" :key="item.label" class="kpi-card">
        <span class="kpi-label">{{ item.label }}</span>
        <span class="kpi-value">{{ item.value }}</span>
      </article>
    </section>

    <section v-if="activeTab === 'overview'" class="layout-grid overview-grid">
      <article class="panel overview-hero">
        <div>
          <p class="hero-kicker">Vue rapide</p>
          <h2>Synthèse opérationnelle</h2>
          <p>Lecture immédiate des zones en tension et de l'engagement citoyen.</p>
        </div>
        <div class="hero-metrics">
          <div>
            <span>Zones en surcharge</span>
            <strong>{{ surchargeCount }}</strong>
          </div>
          <div>
            <span>Zones en deficit</span>
            <strong>{{ deficitCount }}</strong>
          </div>
          <div>
            <span>Points actifs</span>
            <strong>{{ activePointsCount }}</strong>
          </div>
        </div>
      </article>

      <article class="panel panel-feature">
        <div class="panel-head">
          <h2>Inscrits par zone</h2>
          <span class="chip">Deficit &lt; 50 | Surcharge &gt; 200</span>
        </div>

        <div class="chart-canvas-wrap">
          <canvas ref="zoneChartCanvas"></canvas>
        </div>
      </article>

      <article class="panel panel-soft">
        <div class="panel-head">
          <h2>Répartition des langues</h2>
        </div>
        <div class="pie-box">
          <div class="chart-canvas-wrap pie-canvas-wrap">
            <canvas ref="languageChartCanvas"></canvas>
          </div>
          <ul class="pie-legend">
            <li v-for="lang in languageSplit" :key="lang.name">
              <span class="dot" :style="{ background: lang.color }"></span>
              <span>{{ lang.name }}</span>
              <strong>{{ lang.value }}%</strong>
            </li>
          </ul>
        </div>
      </article>

      <article class="panel panel-soft">
        <div class="panel-head">
          <h2>Alertes zones</h2>
        </div>
        <ul class="alerts-list">
          <li v-for="alert in zoneAlerts" :key="alert.title" :class="alert.tone">
            <p>{{ alert.title }}</p>
            <small>{{ alert.detail }}</small>
          </li>
          <li v-if="!zoneAlerts.length" class="success">
            <p>Aucune alerte critique</p>
            <small>Toutes les zones actives sont dans la plage normale.</small>
          </li>
        </ul>
      </article>

      <article class="panel panel-soft">
        <div class="panel-head">
          <h2>KPI citoyens</h2>
        </div>
        <div class="mini-kpis">
          <div v-for="item in citizenKpis" :key="item.code" class="mini-kpi">
            <span>{{ item.code }}</span>
            <strong>{{ item.value }}</strong>
            <small>{{ item.name }}</small>
          </div>
        </div>
      </article>
    </section>

    <section v-else-if="activeTab === 'diagnostic'" class="single-col">
      <article class="panel">
        <div class="panel-head">
          <h2>Diagnostic zones inscriptions</h2>
          <div class="actions-row">
            <span class="chip">Tri: surcharge, deficit, normal</span>
            <button class="add-btn" @click="openAddModal">Ajouter zone</button>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quartier</th>
                <th>Point de collecte</th>
                <th>Coordonnées</th>
                <th>Inscrits</th>
                <th>Statut</th>
                <th>Action recommandee</th>
                <th>Actif</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in diagnosticRows" :key="row.id" :class="{ muted: !row.active }">
                <td>{{ row.zone }}</td>
                <td>{{ row.point }}</td>
                <td>{{ row.coords }}</td>
                <td>{{ row.inscrits }}</td>
                <td><span class="badge" :class="row.statusTone">{{ row.statusLabel }}</span></td>
                <td>{{ row.action }}</td>
                <td>
                  <button class="toggle-btn" :class="{ off: !row.active }" @click="toggleActive(row.id)">
                    {{ row.active ? 'Actif' : 'Desactive' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section v-else class="single-col">
      <article class="panel">
        <div class="panel-head">
          <h2>Referentiel KPI</h2>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>KPI</th>
                <th>Cible</th>
                <th>Seuil alerte</th>
                <th>Frequence</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="kpi in referenceKpis" :key="kpi.code">
                <td>{{ kpi.code }}</td>
                <td>{{ kpi.name }}</td>
                <td>{{ kpi.target }}</td>
                <td>{{ kpi.alert }}</td>
                <td>{{ kpi.frequency }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <div v-if="showAddModal" class="modal-backdrop" @click.self="closeAddModal">
      <div class="modal-card">
        <h3>Ajouter une zone</h3>
        <div class="form-grid">
          <label>
            Quartier
            <input v-model="newZone.zone" class="field" type="text" placeholder="Ex: Medina" />
          </label>
          <label>
            Point de collecte
            <input v-model="newZone.point" class="field" type="text" placeholder="Ex: Medina Rue 8" />
          </label>
          <label>
            Coordonnees
            <input v-model="newZone.coords" class="field" type="text" placeholder="Ex: 14.6925, -17.4467" />
          </label>
          <label>
            Inscrits
            <input v-model.number="newZone.inscrits" class="field" type="number" min="0" />
          </label>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeAddModal">Annuler</button>
          <button class="btn-primary" @click="addZone">Valider</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'

const activeTab = ref('overview')
const selectedPeriod = ref('today')
const showAddModal = ref(false)
const formError = ref('')
const zoneChartCanvas = ref(null)
const languageChartCanvas = ref(null)

let zoneChart = null
let languageChart = null

const tabs = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'diagnostic', label: 'Diagnostic' },
  { id: 'reference', label: 'Referentiel' }
]

const periodOptions = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: '7 jours' },
  { value: 'month', label: '30 jours' }
]

const periodSnapshot = {
  today: { coverage: '94.1%', punctuality: '88.3%', citizens: '84 230', registration: '28%', openRate: '74%', satisfaction: '87%' },
  week: { coverage: '95.0%', punctuality: '89.4%', citizens: '84 230', registration: '29%', openRate: '73%', satisfaction: '86%' },
  month: { coverage: '94.7%', punctuality: '88.8%', citizens: '84 230', registration: '28%', openRate: '72%', satisfaction: '86%' }
}

const collectionPoints = ref([
  { id: 'mermoz-1', zone: 'Mermoz', point: 'Mermoz 1', coords: '14.7065, -17.4851', inscrits: 58, active: true },
  { id: 'mermoz-2', zone: 'Mermoz', point: 'Mermoz 2', coords: '14.7061, -17.4842', inscrits: 41, active: true },
  { id: 'mermoz-3', zone: 'Mermoz', point: 'Mermoz 3', coords: '14.7058, -17.4838', inscrits: 69, active: true },
  { id: 'mermoz-4', zone: 'Mermoz', point: 'Mermoz 4', coords: '14.7054, -17.4829', inscrits: 33, active: false },
  { id: 'medina-sahm', zone: 'Médina', point: 'Médina SAHM', coords: '14.6867, -17.4508', inscrits: 77, active: true },
  { id: 'medina-corniche', zone: 'Médina', point: 'Médina Corniche', coords: '14.6835, -17.4479', inscrits: 54, active: true },
  { id: 'medina-rue-6', zone: 'Médina', point: 'Médina Rue 6', coords: '14.6874, -17.4524', inscrits: 48, active: true },
  { id: 'plateau-1', zone: 'Dakar Plateau', point: 'Plateau 1', coords: '14.6707, -17.4352', inscrits: 115, active: true },
  { id: 'plateau-2', zone: 'Dakar Plateau', point: 'Plateau 2', coords: '14.6698, -17.4346', inscrits: 96, active: true },
  { id: 'plateau-3', zone: 'Dakar Plateau', point: 'Plateau 3', coords: '14.6689, -17.4337', inscrits: 82, active: true },
  { id: 'pikine-est-1', zone: 'Pikine Est', point: 'Pikine Est 1', coords: '14.7548, -17.3819', inscrits: 91, active: true },
  { id: 'pikine-est-2', zone: 'Pikine Est', point: 'Pikine Est 2', coords: '14.7556, -17.3827', inscrits: 76, active: true },
  { id: 'pikine-est-3', zone: 'Pikine Est', point: 'Pikine Est 3', coords: '14.7562, -17.3834', inscrits: 58, active: true },
  { id: 'guediawaye-10', zone: 'Guediawaye', point: 'Unité 10', coords: '14.7779, -17.3910', inscrits: 72, active: true },
  { id: 'guediawaye-11', zone: 'Guediawaye', point: 'Unité 11', coords: '14.7784, -17.3918', inscrits: 51, active: true },
  { id: 'guediawaye-12', zone: 'Guediawaye', point: 'Unité 12', coords: '14.7791, -17.3924', inscrits: 47, active: true },
  { id: 'gueule-tapee-1', zone: 'Gueule Tapée', point: 'Gueule Tapée 1', coords: '14.6922, -17.4686', inscrits: 64, active: true },
  { id: 'fass-1', zone: 'Fass', point: 'Fass 1', coords: '14.6891, -17.4598', inscrits: 57, active: true },
  { id: 'colobane-1', zone: 'Colobane', point: 'Colobane 1', coords: '14.6939, -17.4453', inscrits: 49, active: true },
  { id: 'sicap-1', zone: 'Sicap', point: 'Sicap 1', coords: '14.7168, -17.4639', inscrits: 71, active: true },
  { id: 'point-e-1', zone: 'Point E', point: 'Point E 1', coords: '14.6977, -17.4644', inscrits: 62, active: true }
])

const newZone = ref({ zone: '', point: '', coords: '', inscrits: 0 })

const languageSplit = [
  { name: 'Wolof', value: 54, color: '#0f766e' },
  { name: 'Francais', value: 26, color: '#0ea5e9' },
  { name: 'Pulaar', value: 13, color: '#f59e0b' },
  { name: 'Serere', value: 7, color: '#f97316' }
]

const citizenKpis = [
  { code: '3.1', name: 'Citoyens inscrits', value: '84 230' },
  { code: '3.2', name: "Taux d'inscription", value: '28%' },
  { code: '3.3', name: 'Ouverture notifications', value: '74%' },
  { code: '3.4', name: 'Presentation au passage', value: '58%' }
]

const referenceKpis = [
  { code: '1.1', name: 'Taux de couverture par quartier', target: '>= 95%', alert: '< 80%', frequency: 'Quotidienne' },
  { code: '1.2', name: 'Taux de ponctualite des passages', target: '>= 90%', alert: '< 75%', frequency: 'Quotidienne' },
  { code: '1.3', name: 'Nombre de passages par camion/jour', target: '>= 8 zones', alert: '< 5 zones', frequency: 'Quotidienne' },
  { code: '1.4', name: 'Temps moyen par zone de collecte', target: '15 - 25 min', alert: '< 10 min ou > 40 min', frequency: 'Hebdomadaire' },
  { code: '1.5', name: 'Taux de zones manquees', target: '< 5%', alert: '>= 10%', frequency: 'Quotidienne' },
  { code: '3.1', name: 'Nombre de citoyens inscrits', target: 'Croissance +5%/sem', alert: 'Stagnation 2 sem.', frequency: 'Hebdomadaire' },
  { code: '3.2', name: "Taux d'inscription par quartier", target: '>= 30%', alert: '< 15%', frequency: 'Mensuelle' },
  { code: '3.3', name: "Taux d'ouverture des notifications", target: '>= 70%', alert: '< 50%', frequency: 'Hebdomadaire' },
  { code: '3.4', name: 'Taux de presentation au passage', target: '>= 60%', alert: '< 40%', frequency: 'Hebdomadaire' },
  { code: '3.5', name: 'Délai moyen de notification avant passage', target: '10 - 20 min', alert: '< 5 min ou > 30 min', frequency: 'Hebdomadaire' },
  { code: '3.6', name: 'Taux de satisfaction citoyenne', target: '>= 85%', alert: '< 70%', frequency: 'Hebdomadaire' },
  { code: '3.7', name: "Taux d'engagement communautaire", target: '>= 200/mois', alert: '< 50/mois', frequency: 'Mensuelle' },
  { code: '3.8', name: 'Repartition par langue choisie', target: 'Couverture 4 langues', alert: '-', frequency: 'Mensuelle' },
  { code: '5.2', name: 'Reduction des klaxons', target: '>= 50% des mois 3', alert: '< 30% mois 3', frequency: 'Mensuelle' },
  { code: '5.3', name: 'Taux de couverture multilingue', target: '>= 80%', alert: '< 60%', frequency: 'Mensuelle' },
  { code: '5.5', name: 'ROI solution SONAGED Connect', target: '>= 150% a 12 mois', alert: '< 100% a 12 mois', frequency: 'Trimestrielle' }
]

const headlineKpis = computed(() => {
  const s = periodSnapshot[selectedPeriod.value]
  return [
    { label: 'Couverture', value: s.coverage },
    { label: 'Ponctualite', value: s.punctuality },
    { label: 'Inscrits', value: s.citizens },
    { label: "Inscription", value: s.registration },
    { label: 'Ouverture', value: s.openRate },
    { label: 'Satisfaction', value: s.satisfaction }
  ]
})

const pointsWithStatus = computed(() => {
  return collectionPoints.value.map((item) => {
    if (item.inscrits < 50) {
      return {
        ...item,
        statusLabel: 'Deficit',
        statusTone: 'danger',
        action: 'Renforcer sensibilisation locale et relais communautaires'
      }
    }

    if (item.inscrits > 200) {
      return {
        ...item,
        statusLabel: 'Surcharge',
        statusTone: 'warning',
        action: 'Augmenter capacite de collecte sur le point'
      }
    }

    return {
      ...item,
      statusLabel: 'Normal',
      statusTone: 'success',
      action: 'Maintenir le suivi de routine'
    }
  })
})

const diagnosticRows = computed(() => {
  const priority = { warning: 0, danger: 1, success: 2 }

  return [...pointsWithStatus.value].sort((a, b) => {
    const byPriority = priority[a.statusTone] - priority[b.statusTone]
    if (byPriority !== 0) return byPriority
    return a.zone.localeCompare(b.zone)
  })
})

const zoneTotals = computed(() => {
  const activePoints = pointsWithStatus.value.filter((item) => item.active)
  const map = new Map()

  activePoints.forEach((item) => {
    const current = map.get(item.zone) || 0
    map.set(item.zone, current + item.inscrits)
  })

  const rows = Array.from(map.entries()).map(([zone, inscrits]) => ({ zone, inscrits }))
  const max = Math.max(...rows.map((r) => r.inscrits), 1)

  return rows.map((item) => {
    let statusLabel = 'Normal'
    let statusTone = 'success'

    if (item.inscrits < 50) {
      statusLabel = 'Deficit'
      statusTone = 'danger'
    } else if (item.inscrits > 200) {
      statusLabel = 'Surcharge'
      statusTone = 'warning'
    }

    return {
      ...item,
      statusLabel,
      statusTone,
    }
  })
})

const zoneAlerts = computed(() => {
  return zoneTotals.value
    .filter((item) => item.statusTone !== 'success')
    .map((item) => ({
      tone: item.statusTone,
      title: `${item.zone} - ${item.statusLabel}`,
      detail: `${item.inscrits} inscrits (zones actives).`
    }))
})

  const surchargeCount = computed(() => zoneTotals.value.filter((item) => item.statusTone === 'warning').length)
  const deficitCount = computed(() => zoneTotals.value.filter((item) => item.statusTone === 'danger').length)
  const activePointsCount = computed(() => collectionPoints.value.filter((item) => item.active).length)

const renderZoneChart = () => {
  if (!zoneChartCanvas.value) return

  if (zoneChart) {
    zoneChart.destroy()
    zoneChart = null
  }

  zoneChart = new Chart(zoneChartCanvas.value, {
    type: 'bar',
    data: {
      labels: zoneTotals.value.map((item) => item.zone),
      datasets: [
        {
          label: 'Inscrits',
          data: zoneTotals.value.map((item) => item.inscrits),
          borderRadius: 8,
          maxBarThickness: 56,
          backgroundColor: zoneTotals.value.map((item) => {
            if (item.statusTone === 'danger') return '#dc2626'
            if (item.statusTone === 'warning') return '#f59e0b'
            return '#0f766e'
          })
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#334155', font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#64748b', font: { size: 11 } },
          grid: { color: 'rgba(148, 163, 184, 0.25)' }
        }
      }
    }
  })
}

const renderLanguageChart = () => {
  if (!languageChartCanvas.value) return

  if (languageChart) {
    languageChart.destroy()
    languageChart = null
  }

  languageChart = new Chart(languageChartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: languageSplit.map((item) => item.name),
      datasets: [
        {
          data: languageSplit.map((item) => item.value),
          backgroundColor: languageSplit.map((item) => item.color),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      }
    }
  })
}

onMounted(async () => {
  await nextTick()
  renderZoneChart()
  renderLanguageChart()
})

watch(zoneTotals, async () => {
  await nextTick()
  renderZoneChart()
}, { deep: true })

watch(activeTab, async (value) => {
  if (value !== 'overview') return
  await nextTick()
  renderZoneChart()
  renderLanguageChart()
})

onBeforeUnmount(() => {
  if (zoneChart) zoneChart.destroy()
  if (languageChart) languageChart.destroy()
})

const openAddModal = () => {
  formError.value = ''
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
}

const addZone = () => {
  const zone = newZone.value.zone.trim()
  const point = newZone.value.point.trim()
  const coords = newZone.value.coords.trim()
  const inscrits = Number(newZone.value.inscrits)

  if (!zone || !point || !coords) {
    formError.value = 'Le nom du quartier, le point et les coordonnées sont obligatoires.'
    return
  }

  if (Number.isNaN(inscrits) || inscrits < 0) {
    formError.value = "Le nombre d'inscrits doit être un nombre positif."
    return
  }

  const id = `${zone.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
  collectionPoints.value.push({ id, zone, point, coords, inscrits, active: true })

  newZone.value = { zone: '', point: '', coords: '', inscrits: 0 }
  showAddModal.value = false
}

const toggleActive = (id) => {
  collectionPoints.value = collectionPoints.value.map((item) => {
    if (item.id !== id) return item
    return { ...item, active: !item.active }
  })
}
</script>

<style scoped>
.sonaged-page {
  min-height: 100%;
  display: grid;
  gap: 0.9rem;
  padding: 0.9rem;
  background:
    radial-gradient(circle at 10% 0%, rgba(14, 165, 233, 0.12), transparent 30%),
    radial-gradient(circle at 95% 15%, rgba(20, 184, 166, 0.12), transparent 34%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

.tabs-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.tabs-scroll {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.tab-item {
  border: 1px solid #d6e0ea;
  background: #ffffff;
  color: #0f172a;
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.tab-item.active {
  background: #0f766e;
  border-color: #0f766e;
  color: #f8fafc;
}

.period-switch {
  display: flex;
  gap: 0.4rem;
}

.period-pill {
  border: 1px solid #d6e0ea;
  background: #ffffff;
  color: #334155;
  border-radius: 999px;
  padding: 0.38rem 0.68rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.period-pill.active {
  background: #0f172a;
  border-color: #0f172a;
  color: #f8fafc;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.6rem;
}

.kpi-card,
.panel,
.mini-kpi,
.modal-card {
  background: #ffffff;
  border: 1px solid #d6e0ea;
  border-radius: 0.9rem;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}

.kpi-card {
  padding: 0.65rem;
  display: grid;
  gap: 0.18rem;
}

.kpi-label {
  font-size: 0.76rem;
  color: #64748b;
}

.kpi-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.layout-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 0.7rem;
}

.overview-grid {
  grid-template-columns: 1.4fr 1fr;
}

.single-col {
  display: grid;
}

.panel {
  padding: 0.85rem;
}

.overview-hero {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  background: linear-gradient(135deg, #0f172a 0%, #0f766e 100%);
  color: #f8fafc;
  border: none;
}

.hero-kicker {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.8);
}

.overview-hero h2 {
  margin: 0.2rem 0;
  font-size: 1.2rem;
}

.overview-hero p {
  margin: 0;
  color: rgba(226, 232, 240, 0.9);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(110px, 1fr));
  gap: 0.5rem;
}

.hero-metrics div {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.7rem;
  padding: 0.45rem 0.55rem;
  display: grid;
  gap: 0.1rem;
}

.hero-metrics span {
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.88);
}

.hero-metrics strong {
  font-size: 1.1rem;
}

.panel-feature {
  background: linear-gradient(180deg, #ffffff 0%, #f8fcff 100%);
  border-color: #bfdbfe;
}

.panel-soft {
  background: #ffffff;
  border-color: #dbe7f1;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.65rem;
}

.panel-head h2 {
  margin: 0;
  font-size: 0.98rem;
  color: #0f172a;
}

.chip {
  border-radius: 999px;
  background: #e0f2fe;
  color: #0c4a6e;
  padding: 0.2rem 0.52rem;
  font-size: 0.72rem;
  font-weight: 700;
}

.chart-canvas-wrap {
  position: relative;
  min-height: 250px;
  border: 1px solid #e2e8f0;
  border-radius: 0.8rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 0.5rem;
}

.pie-box {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;
  justify-items: center;
}

.pie-canvas-wrap {
  min-height: 170px;
  width: min(260px, 100%);
}

.pie-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  justify-content: center;
  white-space: nowrap;
}

.pie-legend li {
  display: inline-flex;
  gap: 0.32rem;
  align-items: center;
}

.dot {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
}

.alerts-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
}

.alerts-list li {
  border-left: 4px solid #cbd5e1;
  background: #f8fafc;
  border-radius: 0.65rem;
  padding: 0.55rem;
}

.alerts-list li p {
  margin: 0;
  font-weight: 700;
}

.alerts-list li small {
  color: #64748b;
}

.alerts-list li.warning {
  border-left-color: #d97706;
}

.alerts-list li.danger {
  border-left-color: #dc2626;
}

.alerts-list li.success {
  border-left-color: #0f766e;
}

.mini-kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}

.mini-kpi {
  padding: 0.56rem;
  display: grid;
  gap: 0.2rem;
}

.mini-kpi span {
  font-size: 0.72rem;
  color: #0f766e;
  font-weight: 700;
}

.mini-kpi strong {
  font-size: 1.1rem;
}

.mini-kpi small {
  color: #64748b;
  font-size: 0.75rem;
}

.actions-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-btn,
.toggle-btn,
.btn-primary,
.btn-secondary {
  border: 1px solid #d6e0ea;
  border-radius: 0.6rem;
  background: #ffffff;
  padding: 0.34rem 0.62rem;
  font-weight: 700;
  cursor: pointer;
}

.add-btn,
.btn-primary {
  background: #0f766e;
  border-color: #0f766e;
  color: #f8fafc;
}

.toggle-btn.off {
  background: #f1f5f9;
  color: #64748b;
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

th,
td {
  padding: 0.46rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

th {
  color: #64748b;
  font-weight: 700;
}

.badge {
  border-radius: 999px;
  padding: 0.2rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 800;
}

.badge.success {
  background: #ccfbf1;
  color: #115e59;
}

.badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.badge.danger {
  background: #fee2e2;
  color: #991b1b;
}

.muted {
  opacity: 0.56;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
  display: grid;
  place-items: center;
  z-index: 50;
  padding: 1rem;
}

.modal-card {
  width: min(560px, 100%);
  padding: 1rem;
}

.modal-card h3 {
  margin: 0 0 0.7rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.form-grid label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.84rem;
  color: #334155;
}

.field {
  border: 1px solid #d6e0ea;
  border-radius: 0.6rem;
  padding: 0.48rem;
}

.form-error {
  color: #b91c1c;
  font-size: 0.8rem;
  margin: 0.6rem 0 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-top: 0.8rem;
}

@media (max-width: 1300px) {
  .kpi-grid,
  .layout-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .overview-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-metrics {
    width: 100%;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .kpi-grid,
  .layout-grid,
  .mini-kpis,
  .pie-box,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .hero-metrics {
    grid-template-columns: 1fr;
  }

  .tabs-container {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
