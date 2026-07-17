<template>
  <div class="published-dashboards">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Chargement des tableaux de bord...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!publishedDashboards.length" class="empty-state">
      <div class="empty-icon">
        <i class="pi pi-chart-line"></i>
      </div>
      <h3>Aucun tableau de bord publié</h3>
      <p>Les tableaux de bord analytics publiés apparaîtront ici</p>
    </div>

    <!-- Dashboard content -->
    <div v-else-if="publishedDashboards.length > 0" class="published-dashboards-container">
      <!-- Loading indicator -->
      <ProgressSpinner
        v-if="isLoadingDateFilter"
        class="loading-indicator"
        style="width: 24px; height: 24px"
        strokeWidth="4"
      />

      <!-- Full Dashboard Display -->
      <div v-if="selectedDashboard" ref="dashboardContent" class="full-dashboard-direct">
        <div class="dashboard-section">
          <div class="widgets-grid-full">
            <div
              v-for="widget in selectedDashboard.widgets"
              :key="widget.id"
            class="widget-full"
            :class="[
              `widget-size-${widget.size || 'medium'}`,
              `widget-color-${widget.color || 'default'}`
            ]"
            :style="getWidgetStyle(widget)"
          >
            <!-- Widget Actions -->
            <div class="widget-actions-full">
              <Button
                icon="pi pi-window-maximize"
                class="p-button-text p-button-sm"
                @click="openFullscreen(widget)"
                v-tooltip.top="'Plein écran'"
              />
            </div>

            <!-- KPI Widget Full -->
            <div v-if="widget.type === 'kpi'" class="kpi-widget-full">
              <div class="widget-header-full">
                <div class="widget-icon" :style="{ color: widget.color || '#7AC943' }">
                  <i :class="widget.icon || 'pi pi-chart-bar'"></i>
                </div>
                <span class="widget-title-full">{{ widget.title }}</span>
              </div>
              <div class="widget-value-full">
                {{ widget.value !== undefined ? widget.value : '--' }}
                <span v-if="widget.unit" class="widget-unit">{{ widget.unit }}</span>
              </div>
            </div>

            <!-- Stat Widget Full (Tag-based KPI) -->
            <div v-else-if="widget.type === 'stat'" class="stat-widget-full">
              <div class="widget-header-full">
                <div class="widget-icon" :style="{ color: getStatColor(widget.color) }">
                  <i class="pi pi-chart-bar"></i>
                </div>
                <span class="widget-title-full">{{ widget.title }}</span>
              </div>
              <div class="widget-value-full">
                {{ formatStatValue(widget.value) }}
                <span v-if="widget.unit" class="widget-unit">{{ widget.unit }}</span>
              </div>
              <div v-if="widget.description" class="widget-description">{{ widget.description }}</div>
            </div>

            <!-- Formula Widget Full -->
            <div v-else-if="widget.type === 'formula'" class="formula-widget-full">
              <div class="widget-header-full">
                <div class="widget-icon" :style="{ color: widget.color || '#3b82f6' }">
                  <i class="pi pi-calculator"></i>
                </div>
                <span class="widget-title-full">{{ widget.title }}</span>
              </div>
              <div class="widget-value-full">
                {{ widget.value !== undefined ? widget.value : '--' }}
                <span v-if="widget.unit" class="widget-unit">{{ widget.unit }}</span>
              </div>
            </div>

            <!-- Chart Widget Full -->
            <div v-if="widget.type === 'chart'" class="chart-widget-full">
              <div class="chart-header-full">
                <span class="chart-title-full">{{ widget.title }}</span>
              </div>
              <div class="chart-content-full">
                <div v-if="widget.chartData && widget.chartData.length > 0" class="chart-display">
                  <VuePlotly
                    :key="'chart-' + widget.id + '-' + Date.now()"
                    :data="cleanChartData(widget.chartData)"
                    :layout="cleanChartLayout(widget.chartLayout)"
                    :config="plotlyConfig"
                  />
                </div>
                <div v-else class="chart-placeholder">
                  <i class="pi pi-chart-line"></i>
                  <span>Graphique {{ getChartTypeLabel(widget.chartType) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- Drawer: Widget en plein écran -->
    <Drawer
      v-model:visible="showFullscreen"
      :header="fullscreenWidget?.title || 'Widget'"
      position="full"
      class="fullscreen-widget-drawer"
    >
      <div v-if="fullscreenWidget" class="fullscreen-widget-content">
        <!-- KPI/Formula/Stat Widget -->
        <div v-if="fullscreenWidget.type === 'kpi' || fullscreenWidget.type === 'formula' || fullscreenWidget.type === 'stat'" class="fullscreen-kpi-widget">
          <div class="fullscreen-kpi-value">{{ formatStatValue(fullscreenWidget.value) }}</div>
          <div class="fullscreen-kpi-unit">{{ fullscreenWidget.unit }}</div>
          <div class="fullscreen-kpi-description">{{ fullscreenWidget.description || fullscreenWidget.title }}</div>
        </div>

        <!-- Chart Widget -->
        <div v-else-if="fullscreenWidget.type === 'chart'" class="fullscreen-chart-widget">
          <VuePlotly
            v-if="fullscreenWidget.chartData && fullscreenWidget.chartData.length > 0"
            :data="cleanChartData(fullscreenWidget.chartData)"
            :layout="cleanChartLayout(fullscreenChartLayout)"
            :config="plotlyConfig"
          />
          <div v-else class="fullscreen-chart-placeholder">
            <i class="pi pi-chart-line"></i>
            <p>Graphique {{ getChartTypeLabel(fullscreenWidget.chartType) }}</p>
          </div>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import VuePlotly from 'vue3-plotly-ts'
import ProgressSpinner from 'primevue/progressspinner'
import Drawer from 'primevue/drawer'
import Button from 'primevue/button'
import { useAnalyticsStore } from '@/features/analytics/stores/analyticsStore'
import { axiosInstance } from '@/main.js'

// Props
const props = defineProps({
  dateRange: {
    type: Array,
    default: () => [
      new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1),
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    ]
  },
  selectedDashboardId: {
    type: Number,
    default: null
  }
})

const analyticsStore = useAnalyticsStore()

// State
const loading = ref(false)
const publishedDashboards = ref([])
const dashboardContent = ref(null)
const isLoadingDateFilter = ref(false)
let dateFilterTimeout = null
const showFullscreen = ref(false)
const fullscreenWidget = ref(null)

// Computed
const selectedDashboard = computed(() => {
  return publishedDashboards.value.find(d => d.id === props.selectedDashboardId)
})

const isDateRangeValid = computed(() => {
  return props.dateRange && props.dateRange[0] && props.dateRange[1]
})

// Plotly config
const plotlyConfig = {
  responsive: true,
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: [
    'pan2d',
    'select2d',
    'lasso2d',
    'autoScale2d',
    'toggleSpikelines',
    'hoverClosestCartesian',
    'hoverCompareCartesian'
  ],
  modeBarButtonsToKeep: ['zoom2d', 'zoomIn2d', 'zoomOut2d', 'resetScale2d']
}

// Palette de couleurs sobre: Vert KAP + Bleu
const chartColorPalette = [
  '#7AC943', // Vert KAP (primaire)
  '#3B82F6', // Bleu
  '#6BB835', // Vert fonce
  '#60A5FA', // Bleu clair
  '#4CAF50', // Vert moyen
  '#2563EB', // Bleu profond
  '#8BC34A', // Vert lime
  '#1D4ED8'  // Bleu marine
]

// Nettoyer les chartData (appliquer couleurs et styles)
const cleanChartData = (chartData) => {
  if (!chartData || !Array.isArray(chartData)) return chartData
  return chartData.map((trace, index) => {
    const t = { ...trace }
    const color = chartColorPalette[index % chartColorPalette.length]

    // Supprimer les textes
    delete t.text
    delete t.textfont
    delete t.texttemplate
    delete t.textposition

    // Appliquer les couleurs selon le type
    if (t.type === 'bar') {
      t.textposition = 'none'
      t.marker = { ...t.marker, color: color, opacity: 0.85 }
    } else if (t.type === 'scatter') {
      t.line = { ...t.line, color: color, width: 2.5 }
      t.marker = { ...t.marker, color: color, size: 6 }
      if (t.fill && color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        t.fillcolor = `rgba(${r}, ${g}, ${b}, 0.15)`
      }
    } else if (t.type === 'pie') {
      t.textinfo = 'percent'
      t.textfont = { size: 12, color: '#fff' }
      t.marker = {
        colors: chartColorPalette.slice(0, t.values?.length || 5),
        line: { color: '#fff', width: 2 }
      }
    }

    // Tronquer les noms trop longs
    if (t.name && t.name.length > 25) {
      t.name = t.name.substring(0, 22) + '...'
    }

    return t
  })
}

// Nettoyer le layout (legendes, marges, overflow)
const cleanChartLayout = (chartLayout) => {
  if (!chartLayout) return chartLayout
  const l = JSON.parse(JSON.stringify(chartLayout))

  // Pas de titre
  l.title = ''
  delete l.annotations

  // Marges optimisees
  l.margin = { l: 55, r: 20, b: 50, t: 15, pad: 4 }

  // Style des axes
  if (l.xaxis) {
    l.xaxis.title = { text: '' }
    l.xaxis.tickfont = { size: 11, color: '#64748b' }
    l.xaxis.gridcolor = '#f1f5f9'
    l.xaxis.linecolor = '#e2e8f0'
    l.xaxis.nticks = 8
  }

  if (l.yaxis) {
    l.yaxis.title = { text: '' }
    l.yaxis.tickfont = { size: 11, color: '#64748b' }
    l.yaxis.gridcolor = '#f1f5f9'
    l.yaxis.linecolor = '#e2e8f0'
    l.yaxis.zeroline = false
  }

  // Legende intelligente
  const numTraces = l._traceCount || 3
  l.showlegend = true

  if (numTraces <= 3) {
    l.legend = {
      orientation: 'h',
      y: -0.18,
      x: 0.5,
      xanchor: 'center',
      yanchor: 'top',
      font: { size: 11, color: '#475569' },
      bgcolor: 'rgba(255,255,255,0.9)',
      bordercolor: 'transparent'
    }
    l.margin.b = 60
  } else if (numTraces <= 6) {
    l.legend = {
      orientation: 'h',
      y: -0.22,
      x: 0.5,
      xanchor: 'center',
      yanchor: 'top',
      font: { size: 10, color: '#475569' },
      bgcolor: 'rgba(255,255,255,0.9)',
      bordercolor: 'transparent'
    }
    l.margin.b = 75
  } else {
    l.legend = {
      orientation: 'v',
      y: 0.5,
      x: 1.02,
      xanchor: 'left',
      yanchor: 'middle',
      font: { size: 10, color: '#475569' },
      bgcolor: 'rgba(255,255,255,0.95)',
      bordercolor: '#e2e8f0',
      borderwidth: 1
    }
    l.margin.r = 130
  }

  // Style general
  l.paper_bgcolor = 'transparent'
  l.plot_bgcolor = 'transparent'
  l.hovermode = 'x unified'
  l.hoverlabel = {
    bgcolor: '#1e293b',
    font: { size: 12, color: '#fff' },
    bordercolor: 'transparent'
  }

  return l
}

// Helper pour formater les dates en ISO
const formatDateForAPI = (date) => {
  if (!date) return null
  const d = new Date(date)
  return d.toISOString().split('T')[0] // Format: YYYY-MM-DD
}

// Récupérer les dashboards publiés
const loadPublishedDashboards = async () => {
  loading.value = true
  try {
    // Récupérer tous les dashboards
    const allDashboards = await analyticsStore.getDashboards()

    // Filtrer uniquement les dashboards publiés
    const published = allDashboards.filter(d => d.is_shared)

    // Pour chaque dashboard publié, récupérer les détails complets avec widgets
    const dashboardsWithDetails = await Promise.all(
      published.map(async (dashboard) => {
        try {
          const response = await axiosInstance.get(`accounts/dashboards/${dashboard.id}/`)
          const fullDashboard = response.data

          // Charger les valeurs des widgets avec les dates
          const widgetsWithValues = await loadWidgetValuesWithDates(fullDashboard.widgets || [])

          return { ...fullDashboard, widgets: widgetsWithValues }
        } catch (error) {
          return null
        }
      })
    )

    // Filtrer les dashboards qui ont été chargés avec succès
    publishedDashboards.value = dashboardsWithDetails.filter(d => d !== null)
  } catch (error) {
    // Error loading published dashboards
  } finally {
    loading.value = false
  }
}

// Construire une trace Plotly à partir des données d'un tag
const buildChartTrace = (tagId, tagName, values, timestamps, chartType) => {
  if (!values || values.length === 0) return null

  const useTimestamps = timestamps.length === values.length
  const x = useTimestamps ? timestamps : Array.from({ length: values.length }, (_, i) => i + 1)
  const minLen = Math.min(x.length, values.length)
  const trace = { x: x.slice(0, minLen), y: values.slice(0, minLen), name: tagName }

  switch (chartType) {
    case 'bar':
      trace.type = 'bar'
      trace.textposition = 'none'
      break
    case 'area':
      trace.type = 'scatter'
      trace.mode = 'lines'
      trace.fill = 'tozeroy'
      trace.line = { width: 2 }
      break
    case 'pie':
    case 'doughnut':
      trace.type = 'pie'
      trace.values = values.slice(0, minLen)
      trace.labels = x.slice(0, minLen).map(String)
      trace.textinfo = 'percent'
      trace.hole = chartType === 'doughnut' ? 0.4 : 0
      delete trace.x
      delete trace.y
      break
    default:
      trace.type = 'scatter'
      trace.mode = 'lines+markers'
      trace.line = { width: 2 }
      trace.textposition = 'none'
  }
  return trace
}

// Charger les valeurs des widgets avec filtrage par date
const loadWidgetValuesWithDates = async (widgets) => {
  const startDate = props.dateRange?.[0] ? formatDateForAPI(props.dateRange[0]) : null
  const endDate = props.dateRange?.[1] ? formatDateForAPI(props.dateRange[1]) : null

  // Collecter tous les tagIds des widgets stat
  const statTagIds = widgets
    .filter(w => w.type === 'stat' && w.tagId)
    .map(w => Number(w.tagId))

  // Charger les données des tags en une seule requête
  let allTagsData = {}
  if (statTagIds.length > 0) {
    allTagsData = await analyticsStore.getMultipleTagsData(statTagIds, startDate, endDate)
  }

  const widgetsWithValues = await Promise.all(
    widgets.map(async (widget) => {
      if (widget.type === 'kpi' && widget.kpiId) {
        const value = await analyticsStore.getKPIValue(widget.kpiId, startDate, endDate)
        return { ...widget, value: value !== null ? value : '--' }
      } else if (widget.type === 'formula' && widget.formulaId) {
        const value = await analyticsStore.getFormulaValue(widget.formulaId, startDate, endDate)
        return { ...widget, value: value !== null ? value : '--' }
      } else if (widget.type === 'stat' && widget.tagId) {
        // Stat widget - utilise les données déjà chargées
        const tagData = allTagsData[Number(widget.tagId)]
        let value = '--'
        if (tagData) {
          const aggregation = widget.aggregation || 'sum'
          if (aggregation === 'sum' && tagData.sum !== undefined) {
            value = tagData.sum
          } else if (aggregation === 'avg' && tagData.avg !== undefined) {
            value = tagData.avg
          } else if (aggregation === 'count' && tagData.count !== undefined) {
            value = tagData.count
          } else if (tagData.values && tagData.values.length > 0) {
            // Fallback: calculer localement
            const numValues = tagData.values
              .filter(v => v !== null && v !== undefined && v !== '')
              .map(v => parseFloat(v))
              .filter(v => !isNaN(v))
            if (numValues.length > 0) {
              if (aggregation === 'sum') {
                value = numValues.reduce((a, b) => a + b, 0)
              } else if (aggregation === 'avg') {
                value = numValues.reduce((a, b) => a + b, 0) / numValues.length
              } else if (aggregation === 'count') {
                value = numValues.length
              }
            }
          }
        }
        return { ...widget, value }
      } else if (widget.type === 'chart') {
        const cleanedWidget = { ...widget }
        // Si pas de chartData sauvegardé mais des tags sélectionnés → charger dynamiquement
        if ((!cleanedWidget.chartData || cleanedWidget.chartData.length === 0) && cleanedWidget.selectedTags?.length > 0) {
          try {
            const tagSource = cleanedWidget.tagSource || 'MES'
            const chartType = cleanedWidget.chartType || 'line'
            const traces = []
            for (const tagId of cleanedWidget.selectedTags.slice(0, 5)) {
              const tagData = await analyticsStore.getTagData(tagId, startDate, endDate, tagSource)
              const values = (tagData.values || []).map(v => parseFloat(v)).filter(v => !isNaN(v))
              if (values.length === 0) continue
              const timestamps = tagData.timestamps || []
              const trace = buildChartTrace(tagId, tagData.display_name || `Tag ${tagId}`, values, timestamps, chartType)
              if (trace) traces.push(trace)
            }
            if (traces.length > 0) {
              cleanedWidget.chartData = traces
              cleanedWidget.chartLayout = {
                height: 300, autosize: true,
                margin: { l: 50, r: 20, b: 50, t: 10, pad: 4 },
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                xaxis: { title: { text: '' }, tickfont: { size: 11 }, gridcolor: '#f1f5f9' },
                yaxis: { title: { text: '' }, tickfont: { size: 11 }, gridcolor: '#f1f5f9' },
                showlegend: traces.length > 1,
                legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center' }
              }
            }
          } catch (_) { /* silent */ }
        }
        return cleanedWidget
      }
      return widget
    })
  )

  return widgetsWithValues
}

// Recharger les valeurs des widgets du dashboard sélectionné
const reloadWidgetValues = async () => {
  if (!selectedDashboard.value || !isDateRangeValid.value) return

  isLoadingDateFilter.value = true
  const startTime = Date.now()

  try {
    const dashboardIndex = publishedDashboards.value.findIndex(d => d.id === selectedDashboard.value.id)
    if (dashboardIndex === -1) return

    const updatedWidgets = await loadWidgetValuesWithDates(selectedDashboard.value.widgets || [])
    publishedDashboards.value[dashboardIndex].widgets = updatedWidgets

    // Attendre au minimum 500ms pour que le spinner soit visible
    const elapsed = Date.now() - startTime
    if (elapsed < 500) {
      await new Promise(resolve => setTimeout(resolve, 500 - elapsed))
    }
  } finally {
    isLoadingDateFilter.value = false
  }
}

// Watcher pour recharger les données quand le dashboard change
watch(() => props.selectedDashboardId, async (newId, oldId) => {
  if (newId && newId !== oldId && selectedDashboard.value) {
    await reloadWidgetValues()
  }
})

// Watcher pour recharger automatiquement quand la plage de dates change (depuis le parent)
watch(() => props.dateRange, async (newRange, oldRange) => {
  // Annuler le timeout precedent si existe
  if (dateFilterTimeout) {
    clearTimeout(dateFilterTimeout)
  }

  // Verifier que les deux dates sont selectionnees
  if (newRange && newRange[0] && newRange[1]) {
    // Debounce de 300ms pour eviter les declenchements multiples
    dateFilterTimeout = setTimeout(async () => {
      await reloadWidgetValues()
    }, 300)
  }
}, { deep: true })

// Obtenir le label du type de chart
const getChartTypeLabel = (type) => {
  const labels = {
    line: 'Ligne',
    bar: 'Barres',
    area: 'Aire',
    scatter: 'Nuage de points'
  }
  return labels[type] || type
}

// Style du widget pour la grille
const getWidgetStyle = (widget) => {
  // Utiliser widget.w si défini, sinon calculer à partir de size
  const sizeSpan = widget.w || (widget.size === 'small' ? 3 : widget.size === 'large' ? 6 : 4)
  const heightSpan = widget.h || widget.heightSpan || 1

  // Si le widget a une position définie dans la grille, l'utiliser
  if (widget.gridPosition) {
    return {
      gridColumn: `${widget.gridPosition.col} / span ${sizeSpan}`,
      gridRow: `${widget.gridPosition.row} / span ${heightSpan}`
    }
  }

  // Sinon, juste définir le span (auto-placement)
  return {
    gridColumn: `span ${sizeSpan}`,
    gridRow: `span ${heightSpan}`
  }
}

// Obtenir la couleur pour les widgets stat
const getStatColor = (colorName) => {
  const colors = {
    blue: '#2196F3',
    green: '#4CAF50',
    purple: '#9C27B0',
    orange: '#FF9800',
    pink: '#E91E63',
    cyan: '#00BCD4',
    lavender: '#673AB7',
    amber: '#FFC107',
    default: '#64748b'
  }
  return colors[colorName] || colors.default
}

// Formater la valeur des widgets stat
const formatStatValue = (value) => {
  if (value === null || value === undefined || value === '--') {
    return '--'
  }
  const num = parseFloat(value)
  if (isNaN(num)) {
    return value
  }
  // Formater avec séparateur de milliers
  return num.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

// Export to PDF
const exportToPDF = async () => {
  if (!dashboardContent.value || !selectedDashboard.value) return

  exportingPDF.value = true

  try {
    // Attendre un peu pour que tout soit bien rendu
    await new Promise(resolve => setTimeout(resolve, 500))

    // Capturer le contenu du dashboard avec html2canvas
    const canvas = await html2canvas(dashboardContent.value, {
      scale: 2, // Meilleure qualité
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: dashboardContent.value.scrollWidth,
      windowHeight: dashboardContent.value.scrollHeight
    })

    // Créer le PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // Dimensions A4 en paysage
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    // Calculer les dimensions de l'image pour qu'elle tienne dans la page
    const imgWidth = pdfWidth - 20 // Marges de 10mm de chaque côté
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Ajouter un en-tête
    pdf.setFontSize(16)
    pdf.setTextColor(11, 43, 60) // #0B2B3C
    pdf.text(selectedDashboard.value.name, pdfWidth / 2, 15, { align: 'center' })

    // Ajouter la date d'export
    pdf.setFontSize(10)
    pdf.setTextColor(100, 116, 139) // #64748b
    const exportDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    pdf.text(`Exporté le ${exportDate}`, pdfWidth / 2, 22, { align: 'center' })

    // Si l'image est plus haute que la page, on peut gérer plusieurs pages
    let heightLeft = imgHeight
    let position = 28 // Position après l'en-tête

    // Première page
    if (heightLeft <= pdfHeight - position - 10) {
      // L'image tient sur une seule page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    } else {
      // L'image nécessite plusieurs pages
      let pageCount = 0
      while (heightLeft > 0) {
        if (pageCount > 0) {
          pdf.addPage()
          position = 10
        }

        const availableHeight = pdfHeight - position - 10
        const sliceHeight = Math.min(availableHeight, heightLeft)

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)

        heightLeft -= availableHeight
        pageCount++
      }
    }

    // Ajouter un pied de page sur toutes les pages
    const pageCount = pdf.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(148, 163, 184) // #94a3b8
      pdf.text(
        `Page ${i} sur ${pageCount} - KAP Analytics`,
        pdfWidth / 2,
        pdfHeight - 5,
        { align: 'center' }
      )
    }

    // Télécharger le PDF
    const fileName = `${selectedDashboard.value.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`
    pdf.save(fileName)

  } catch (error) {
    alert('Une erreur est survenue lors de l\'export PDF. Veuillez réessayer.')
  } finally {
    exportingPDF.value = false
  }
}

// Ouvrir un widget en plein écran
const openFullscreen = (widget) => {
  fullscreenWidget.value = { ...widget }
  showFullscreen.value = true
}

// Layout adapté pour le plein écran (charts plus grands)
const fullscreenChartLayout = computed(() => {
  if (!fullscreenWidget.value || !fullscreenWidget.value.chartLayout) {
    return {
      height: typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600,
      autosize: true
    }
  }

  // Adapter le layout existant pour le plein écran
  const baseLayout = fullscreenWidget.value.chartLayout
  
  // Calculer les marges de manière responsive
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  
  // Marges adaptatives selon la taille de l'écran
  const isMobile = screenWidth < 768
  const isTablet = screenWidth < 1024 && screenWidth >= 768
  
  const margins = isMobile 
    ? { t: 40, r: 40, b: 60, l: 80 }
    : isTablet
    ? { t: 50, r: 60, b: 70, l: 100 }
    : { t: 60, r: 80, b: 80, l: 120 }
  
  return {
    ...baseLayout,
    height: screenHeight * 0.8, // 80% de la hauteur de l'écran
    autosize: true,
    margin: margins
  }
})

onMounted(() => {
  loadPublishedDashboards()
})
</script>

<style scoped>
.published-dashboards {
  padding: 0;
  height: 100%;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f1f5f9;
  border-top: 4px solid #7AC943;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: #7AC943;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0B2B3C;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #64748b;
  margin: 0 0 2rem 0;
}

/* Published Dashboards Container */
.published-dashboards-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Loading indicator */
.loading-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.loading-indicator :deep(circle) {
  stroke: #7AC943 !important;
}

/* Full Dashboard Display */
.full-dashboard-direct {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.dashboard-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widgets-grid-full {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
  padding: 1rem;
}

.widget-full {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.widget-size-small {
  grid-column: span 3;
}

.widget-size-medium {
  grid-column: span 4;
}

.widget-size-large {
  grid-column: span 6;
}

/* Widget Icon */
.widget-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.widget-unit {
  font-size: 1rem;
  font-weight: 500;
  color: #64748b;
}

/* KPI/Formula/Stat Widget Full */
.kpi-widget-full,
.formula-widget-full,
.stat-widget-full {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.widget-description {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: auto;
}

.widget-header-full {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.widget-title-full {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
}

.widget-value-full {
  font-size: 2.5rem;
  font-weight: 700;
  color: #0B2B3C;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

/* Chart Widget Full */
.chart-widget-full {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.chart-header-full {
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.75rem;
}

.chart-title-full {
  font-size: 1rem;
  font-weight: 600;
  color: #0B2B3C;
}

.chart-content-full {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
}

.chart-display {
  flex: 1;
  min-height: 300px;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.chart-display :deep(.js-plotly-plot) {
  height: 100% !important;
  width: 100% !important;
}

.chart-display :deep(.plotly) {
  width: 100% !important;
  height: 100% !important;
}

/* Ameliorer le rendu des legendes */
.chart-display :deep(.legend) {
  max-height: 80px;
  overflow-y: auto;
}

/* Style des tooltips */
.chart-display :deep(.hoverlayer) {
  z-index: 1000;
}

/* Eviter le debordement des labels */
.chart-display :deep(.xaxislayer-above text),
.chart-display :deep(.yaxislayer-above text) {
  font-size: 11px !important;
}

/* Marge pour les barres de mode */
.chart-display :deep(.modebar-container) {
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
}

.chart-display :deep(.modebar) {
  background: rgba(255, 255, 255, 0.9) !important;
  border-radius: 4px;
  padding: 2px;
}

.chart-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 12px;
  color: #94a3b8;
  gap: 1rem;
}

.chart-placeholder i {
  font-size: 3rem;
}

/* Responsive */
@media (max-width: 768px) {
  .widgets-grid-full {
    grid-template-columns: 1fr;
    padding: 0.5rem;
  }

  .widget-size-small,
  .widget-size-medium,
  .widget-size-large {
    grid-column: span 1;
  }

  .widget-value-full {
    font-size: 2rem;
  }
}

/* Widget Theme Variations - Bordure colorée subtile */

/* Bleu ciel */
.widget-color-blue .widget-full {
  background: white;
  border-left: 4px solid #2196F3;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-blue .widget-header-full {
  background: #fafbfc;
  border-bottom-color: #E3F2FD;
}
.widget-color-blue .widget-title-full {
  color: #64748b;
}
.widget-color-blue .widget-value-full {
  color: #2196F3;
}
.widget-color-blue .widget-icon {
  background: #f8fafc;
  color: #2196F3;
}

/* Vert menthe */
.widget-color-green .widget-full {
  background: white;
  border-left: 4px solid #4CAF50;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-green .widget-header-full {
  background: #fafbfc;
  border-bottom-color: #E8F5E9;
}
.widget-color-green .widget-title-full {
  color: #64748b;
}
.widget-color-green .widget-value-full {
  color: #4CAF50;
}
.widget-color-green .widget-icon {
  background: #f8fafc;
  color: #4CAF50;
}

/* Violet doux */
.widget-color-purple .widget-full {
  background: white;
  border-left: 4px solid #9C27B0;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-purple .widget-header-full {
  background: #fafbfc;
  border-bottom-color: #F3E5F5;
}
.widget-color-purple .widget-title-full {
  color: #64748b;
}
.widget-color-purple .widget-value-full {
  color: #9C27B0;
}
.widget-color-purple .widget-icon {
  background: #f8fafc;
  color: #9C27B0;
}

/* Orange pêche */
.widget-color-orange .widget-full {
  background: white;
  border-left: 4px solid #FF9800;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-orange .widget-header-full {
  background: #fafbfc;
  border-bottom-color: #FFF3E0;
}
.widget-color-orange .widget-title-full {
  color: #64748b;
}
.widget-color-orange .widget-value-full {
  color: #FF9800;
}
.widget-color-orange .widget-icon {
  background: #f8fafc;
  color: #FF9800;
}

/* Rose pâle */
.widget-color-pink .widget-full {
  background: white;
  border-left: 4px solid #E91E63;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-pink .widget-header-full {
  background: #fafbfc;
  border-bottom-color: #FCE4EC;
}
.widget-color-pink .widget-title-full {
  color: #64748b;
}
.widget-color-pink .widget-value-full {
  color: #E91E63;
}
.widget-color-pink .widget-icon {
  background: #f8fafc;
  color: #E91E63;
}

/* Turquoise */
.widget-color-cyan .widget-full {
  background: white;
  border-left: 4px solid #00BCD4;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-cyan .widget-header-full {
  background: #fafbfc;
  border-bottom-color: #E0F7FA;
}
.widget-color-cyan .widget-title-full {
  color: #64748b;
}
.widget-color-cyan .widget-value-full {
  color: #00BCD4;
}
.widget-color-cyan .widget-icon {
  background: #f8fafc;
  color: #00BCD4;
}

/* Lavande */
.widget-color-lavender .widget-full {
  background: white;
  border-left: 4px solid #673AB7;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-lavender .widget-header-full {
  background: #fafbfc;
  border-bottom-color: #EDE7F6;
}
.widget-color-lavender .widget-title-full {
  color: #64748b;
}
.widget-color-lavender .widget-value-full {
  color: #673AB7;
}
.widget-color-lavender .widget-icon {
  background: #f8fafc;
  color: #673AB7;
}

/* Ambre */
.widget-color-amber .widget-full {
  background: white;
  border-left: 4px solid #FFC107;
  border-top: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.widget-color-amber .widget-header-full {
  background: #fafbfc;
  border-bottom-color: #FFF8E1;
}
.widget-color-amber .widget-title-full {
  color: #64748b;
}
.widget-color-amber .widget-value-full {
  color: #FFC107;
}
.widget-color-amber .widget-icon {
  background: #f8fafc;
  color: #FFC107;
}

/* Widget Actions */
.widget-actions-full {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 10;
}

.widget-full {
  position: relative;
}

/* Styles pour le drawer plein écran */
.fullscreen-widget-drawer :deep(.p-drawer-content) {
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

.fullscreen-widget-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

/* Widget KPI en plein écran */
.fullscreen-kpi-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  max-width: 800px;
}

.fullscreen-kpi-value {
  font-size: 8rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
  line-height: 1;
}

.fullscreen-kpi-unit {
  font-size: 2.5rem;
  color: #64748b;
  margin-bottom: 2rem;
}

.fullscreen-kpi-description {
  font-size: 1.5rem;
  color: #94a3b8;
  max-width: 600px;
}

/* Widget Chart en plein écran */
.fullscreen-chart-widget {
  width: 100%;
  height: 100%;
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.fullscreen-chart-widget :deep(.js-plotly-plot) {
  width: 100% !important;
  height: 100% !important;
  min-height: 600px;
}

.fullscreen-chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 600px;
  color: #94a3b8;
  text-align: center;
}

.fullscreen-chart-placeholder i {
  font-size: 5rem;
  margin-bottom: 2rem;
  color: #cbd5e1;
}

.fullscreen-chart-placeholder p {
  font-size: 1.25rem;
}

/* Responsive pour le drawer plein écran */
@media (max-width: 768px) {
  .fullscreen-kpi-value {
    font-size: 4rem;
  }

  .fullscreen-kpi-unit {
    font-size: 1.5rem;
  }

  .fullscreen-kpi-description {
    font-size: 1rem;
  }

  .fullscreen-chart-widget,
  .fullscreen-chart-widget :deep(.js-plotly-plot),
  .fullscreen-chart-placeholder {
    min-height: 400px;
  }
}

@media (max-width: 480px) {
  .fullscreen-widget-drawer :deep(.p-drawer-content) {
    padding: 1rem;
  }

  .fullscreen-kpi-value {
    font-size: 3rem;
  }

  .fullscreen-kpi-unit {
    font-size: 1.25rem;
  }

  .fullscreen-kpi-description {
    font-size: 0.875rem;
  }

  .fullscreen-chart-widget,
  .fullscreen-chart-widget :deep(.js-plotly-plot),
  .fullscreen-chart-placeholder {
    min-height: 300px;
  }

  .fullscreen-chart-placeholder i {
    font-size: 3rem;
  }

  .fullscreen-chart-placeholder p {
    font-size: 1rem;
  }
}
</style>
