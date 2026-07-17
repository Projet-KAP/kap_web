<template>
  <div class="dashboard-builder">
    <!-- Toast pour les notifications -->
    <Toast />

    <!-- Top toolbar -->
    <div class="builder-toolbar">
      <div class="toolbar-left">
        <button class="btn-back" @click="goBack">
          <i class="pi pi-arrow-left"></i>
        </button>
        <div class="toolbar-title">
          <h2>Analytiques</h2>
          <div v-if="editMode" class="dashboard-name-wrapper">
            <input
              type="text"
              v-model="currentDashboard.name"
              placeholder="Nom du tableau de bord"
              class="dashboard-name-input"
            />
          </div>
        </div>
      </div>

      <div class="toolbar-center" v-if="editMode">
        <div class="date-filter-group">
          <div class="date-input-wrapper">
            <input
              type="date"
              :value="formatDateForInput(filterStartDate)"
              @input="updateStartDate($event)"
              class="date-input"
            />
          </div>
          <span class="date-separator">-</span>
          <div class="date-input-wrapper">
            <input
              type="date"
              :value="formatDateForInput(filterEndDate)"
              @input="updateEndDate($event)"
              class="date-input"
            />
          </div>
          <button
            class="btn-load-data"
            :class="{ 'is-loading': isLoadingDateFilter }"
            @click="applyDateFilter"
            :disabled="isLoadingDateFilter"
          >
            <i :class="isLoadingDateFilter ? 'pi pi-spin pi-spinner' : 'pi pi-sync'"></i>
            <span>{{ isLoadingDateFilter ? 'Chargement...' : 'Charger les données' }}</span>
          </button>
        </div>
      </div>

      <div class="toolbar-right">
        <button
          v-if="editMode && currentDashboard.id"
          :class="['btn-publish', { 'is-shared': currentDashboard.is_shared }]"
          @click="togglePublish"
        >
          <i class="pi pi-globe"></i>
          <span>{{ currentDashboard.is_shared ? 'Depublier' : 'Publier' }}</span>
        </button>
        <button
          v-if="editMode"
          class="btn-save"
          @click="saveDashboard"
        >
          <i class="pi pi-save"></i>
          <span>Sauvegarder</span>
        </button>
        <button
          class="btn-outline"
          @click="showDashboardList = true"
        >
          <i class="pi pi-folder-open"></i>
          <span>Mes Tableaux de bord</span>
        </button>
      </div>
    </div>

    <!-- Main content -->
    <div class="builder-content">
      <!-- Sidebar avec les éléments draggables -->
      <div class="builder-sidebar">
        <h3>Éléments disponibles</h3>

        <!-- Champ de recherche -->
        <div class="search-box">
          <IconField iconPosition="left">
            <InputIcon>
              <i class="pi pi-search"></i>
            </InputIcon>
            <InputText
              v-model="searchQuery"
              placeholder="Rechercher KPIs, formules, tags..."
              class="w-full"
            />
          </IconField>
        </div>

        <!-- Skeleton while loading -->
        <div v-if="isInitialLoading" class="sidebar-skeleton">
          <div class="skeleton-section-header"></div>
          <div class="skeleton-item" v-for="i in 3" :key="`kpi-sk-${i}`"></div>
          <div class="skeleton-section-header" style="margin-top: 1rem"></div>
          <div class="skeleton-item" v-for="i in 2" :key="`form-sk-${i}`"></div>
          <div class="skeleton-section-header" style="margin-top: 1rem"></div>
          <div class="skeleton-item"></div>
        </div>

        <template v-else>
          <!-- KPIs -->
          <div class="element-section" v-if="filteredKPIs.length > 0">
            <div class="section-header" @click="toggleSection('kpis')">
              <i class="pi pi-chart-bar"></i>
              <span>KPIs ({{ filteredKPIs.length }})</span>
              <i :class="['pi', expandedSections.kpis ? 'pi-chevron-down' : 'pi-chevron-right']"></i>
            </div>
            <div v-show="expandedSections.kpis" class="section-content">
              <div class="draggable-list">
                <div
                  v-for="kpi in filteredKPIs"
                  :key="kpi.id"
                  class="sidebar-item kpi-item"
                  @click="addWidgetFromSidebar('kpi', kpi)"
                >
                  <i class="pi pi-chart-bar"></i>
                  <div class="item-info">
                    <span class="item-name">{{ kpi.name }}</span>
                    <span v-if="kpi.unit" class="item-unit">{{ kpi.unit }}</span>
                  </div>
                  <i class="pi pi-plus add-icon"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Formules -->
          <div class="element-section" v-if="filteredFormulas.length > 0">
            <div class="section-header" @click="toggleSection('formulas')">
              <i class="pi pi-calculator"></i>
              <span>Formules ({{ filteredFormulas.length }})</span>
              <i :class="['pi', expandedSections.formulas ? 'pi-chevron-down' : 'pi-chevron-right']"></i>
            </div>
            <div v-show="expandedSections.formulas" class="section-content">
              <div class="draggable-list">
                <div
                  v-for="formula in filteredFormulas"
                  :key="formula.id"
                  class="sidebar-item formula-item"
                  @click="addWidgetFromSidebar('formula', formula)"
                >
                  <i class="pi pi-calculator"></i>
                  <div class="item-info">
                    <span class="item-name">{{ formula.name }}</span>
                    <span v-if="formula.unit" class="item-unit">{{ formula.unit }}</span>
                  </div>
                  <i class="pi pi-plus add-icon"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Tags (pour charts) -->
          <div class="element-section">
            <div class="section-header" @click="toggleSection('tags')">
              <i class="pi pi-chart-line"></i>
              <span>Charts (Tags)</span>
              <i :class="['pi', expandedSections.tags ? 'pi-chevron-down' : 'pi-chevron-right']"></i>
            </div>
            <div v-show="expandedSections.tags" class="section-content">
              <div class="draggable-item chart-item" @click="addChartWidget">
                <i class="pi pi-chart-line"></i>
                <span>Nouveau Chart</span>
              </div>
            </div>
          </div>

          <!-- Message si aucun résultat -->
          <div v-if="searchQuery && filteredKPIs.length === 0 && filteredFormulas.length === 0" class="no-results">
            <i class="pi pi-search"></i>
            <p>Aucun résultat pour "{{ searchQuery }}"</p>
          </div>
        </template>
      </div>

      <!-- Zone de drop (grille) -->
      <div class="builder-canvas">
        <div class="drop-zone-wrapper" :class="{ 'edit-mode': editMode }">

          <!-- Loading skeleton — first load -->
          <div v-if="isInitialLoading" class="canvas-skeleton">
            <div class="canvas-skeleton-header">
              <div class="skeleton-title"></div>
              <div class="skeleton-subtitle"></div>
            </div>
            <div class="canvas-skeleton-grid">
              <div class="skeleton-widget" v-for="i in 4" :key="`w-sk-${i}`">
                <div class="skeleton-widget-header"></div>
                <div class="skeleton-widget-body"></div>
              </div>
            </div>
          </div>

          <!-- Welcome screen — après chargement, pas en mode édition -->
          <div v-else-if="!editMode" class="welcome-screen">
            <!-- Dashboards existants -->
            <template v-if="savedDashboards.length > 0">
              <div class="welcome-header">
                <div class="welcome-header-left">
                  <h2>Mes tableaux de bord</h2>
                  <span class="welcome-count">{{ savedDashboards.length }} tableau{{ savedDashboards.length > 1 ? 'x' : '' }}</span>
                </div>
                <div class="welcome-header-actions">
                  <button class="btn-ai" @click="openAIChat">
                    <i class="pi pi-sparkles"></i>
                    <span>Construction intelligente</span>
                  </button>
                  <button class="btn-primary" @click="createNewDashboard">
                    <i class="pi pi-plus"></i>
                    <span>Nouveau</span>
                  </button>
                </div>
              </div>
              <div class="dashboards-grid">
                <div
                  v-for="dashboard in savedDashboards"
                  :key="dashboard.id"
                  class="dashboard-card"
                  @click="loadDashboard(dashboard)"
                >
                  <div class="dashboard-card-icon">
                    <i class="pi pi-chart-bar"></i>
                  </div>
                  <div class="dashboard-card-body">
                    <h4>{{ dashboard.name }}</h4>
                    <div class="dashboard-card-meta">
                      <span><i class="pi pi-th-large"></i> {{ dashboard.widgets_count || 0 }} widgets</span>
                      <span v-if="dashboard.is_shared" class="badge-shared"><i class="pi pi-globe"></i> Publié</span>
                    </div>
                    <span class="dashboard-card-date">{{ formatDate(dashboard.updated_at) }}</span>
                  </div>
                  <div class="dashboard-card-actions" @click.stop>
                    <button class="card-action-btn" @click.stop="loadDashboard(dashboard)" v-tooltip.top="'Ouvrir'">
                      <i class="pi pi-arrow-right"></i>
                    </button>
                    <button class="card-action-btn card-action-btn--delete" @click.stop="deleteDashboard(dashboard)" v-tooltip.top="'Supprimer'">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <!-- Onboarding — aucun dashboard existant -->
            <div v-else class="onboarding-state">
              <div class="onboarding-illustration">
                <div class="onboarding-icon-wrap">
                  <i class="pi pi-chart-bar"></i>
                </div>
              </div>
              <h2>Votre studio analytique</h2>
              <p>Créez votre premier tableau de bord pour visualiser vos KPIs, formules et données de production</p>
              <div class="onboarding-actions">
                <button class="btn-ai btn-ai-lg" @click="openAIChat">
                  <i class="pi pi-sparkles"></i>
                  <span>Créer avec l'IA</span>
                </button>
                <button class="btn-outline btn-outline-lg" @click="createNewDashboard">
                  <i class="pi pi-plus"></i>
                  <span>Commencer manuellement</span>
                </button>
              </div>
              <div class="onboarding-hints">
                <div class="hint-item">
                  <i class="pi pi-chart-line"></i>
                  <span>{{ availableKPIs.length }} KPIs disponibles</span>
                </div>
                <div class="hint-item">
                  <i class="pi pi-calculator"></i>
                  <span>{{ availableFormulas.length }} formules</span>
                </div>
                <div class="hint-item">
                  <i class="pi pi-database"></i>
                  <span>{{ availableTags.length }} données</span>
                </div>
              </div>
            </div>
          </div>

          <div v-show="editMode" class="widgets-grid">
            <!-- Grid Layout Plus pour drag & drop fluide -->
            <GridLayout
              v-model:layout="layoutRef"
              :col-num="GRID_COLS"
              :row-height="MIN_ROW_HEIGHT"
              :is-draggable="true"
              :is-resizable="true"
              :vertical-compact="false"
              :use-css-transforms="true"
              :margin="[16, 16]"
              :prevent-collision="false"
            >
              <GridItem
                v-for="item in layoutRef"
                :key="item.i"
                :i="item.i"
                :x="item.x"
                :y="item.y"
                :w="item.w"
                :h="item.h"
                :min-w="2"
                :min-h="1"
                :max-w="12"
                :max-h="6"
                drag-allow-from=".widget-drag-handle"
              >
                <template v-if="getWidgetById(item.i)">
                  <div class="widget-card" :class="[`widget-color-${getWidgetById(item.i).color || 'default'}`]">
                    <div class="widget-header widget-drag-handle">
                      <div class="widget-header-left">
                        <i class="pi pi-bars drag-handle" v-tooltip.top="'Déplacer'"></i>
                        <span class="widget-title">{{ getWidgetById(item.i).title }}</span>
                      </div>
                      <div class="widget-actions" @mousedown.stop @touchstart.stop>
                        <Button
                          icon="pi pi-window-maximize"
                          class="p-button-text p-button-sm"
                          @click="openFullscreen(getWidgetById(item.i))"
                          v-tooltip.top="'Plein écran'"
                        />
                        <Button
                          v-if="getWidgetById(item.i).type === 'chart'"
                          icon="pi pi-cog"
                          class="p-button-text p-button-sm"
                          @click="configureChart(getWidgetById(item.i))"
                          v-tooltip.top="'Configurer'"
                        />
                        <Button
                          icon="pi pi-palette"
                          class="p-button-text p-button-sm"
                          @click="(e) => toggleColorMenu(e, getWidgetById(item.i))"
                          v-tooltip.top="'Couleur'"
                        />
                        <Button
                          icon="pi pi-arrows-alt"
                          class="p-button-text p-button-sm"
                          @click="(e) => toggleSizeMenu(e, getWidgetById(item.i))"
                          v-tooltip.top="'Taille'"
                        />
                        <Button
                          icon="pi pi-times"
                          class="p-button-text p-button-sm p-button-danger"
                          @click="removeWidget(getWidgetById(item.i))"
                          v-tooltip.top="'Supprimer'"
                        />
                      </div>
                    </div>
                    <div class="widget-body">
                      <!-- KPI/Formula Widget -->
                      <div v-if="getWidgetById(item.i).type === 'kpi' || getWidgetById(item.i).type === 'formula'" class="kpi-widget">
                        <div class="kpi-value">{{ getWidgetById(item.i).value || '--' }}</div>
                        <div class="kpi-unit">{{ getWidgetById(item.i).unit }}</div>
                        <div v-if="getWidgetById(item.i).subtitle" class="kpi-subtitle">{{ getWidgetById(item.i).subtitle }}</div>
                        <div v-if="getWidgetById(item.i).stats" class="kpi-stats-row">
                          <span class="kpi-stat">Min : {{ getWidgetById(item.i).stats.min }}</span>
                          <span class="kpi-stat-sep">|</span>
                          <span class="kpi-stat kpi-stat-highlight">Moy : {{ getWidgetById(item.i).stats.avg }}</span>
                          <span class="kpi-stat-sep">|</span>
                          <span class="kpi-stat">Max : {{ getWidgetById(item.i).stats.max }}</span>
                        </div>
                        <div v-else-if="getWidgetById(item.i).description" class="kpi-description">{{ getWidgetById(item.i).description }}</div>
                      </div>

                      <!-- Chart Widget -->
                      <div v-else-if="getWidgetById(item.i).type === 'chart'" class="chart-widget">
                        <VuePlotly
                          v-if="getWidgetById(item.i).chartData"
                          :data="cleanChartData(getWidgetById(item.i).chartData)"
                          :layout="cleanChartLayout(getWidgetById(item.i).chartLayout, false)"
                          :config="plotlyConfig"
                        />
                        <div v-else class="chart-placeholder">
                          <i class="pi pi-chart-line"></i>
                          <p>Cliquez sur l'icône de configuration pour sélectionner les tags à tracer</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </GridItem>
            </GridLayout>

            <!-- Message si aucun widget -->
            <div v-if="currentDashboard.widgets.length === 0" class="empty-grid-message">
              <i class="pi pi-plus-circle"></i>
              <p>Glissez des KPIs ou cliquez sur "Nouveau Chart" pour ajouter des widgets</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Menu contextuel pour la taille -->
    <Menu ref="sizeMenu" :model="sizeMenuItems" :popup="true" />

    <!-- Menu contextuel pour la couleur -->
    <Menu ref="colorMenu" :model="colorMenuItems" :popup="true" />

    <!-- Dialog: Liste des tableaux -->
    <Dialog
      v-model:visible="showDashboardList"
      header="Mes Tableaux de Bord"
      :style="{ width: '90vw', maxWidth: '600px' }"
      :modal="true"
      class="dashboard-list-dialog"
    >
      <!-- Overlay de chargement -->
      <div v-if="isLoadingDashboard" class="loading-overlay">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        <p>Chargement du tableau...</p>
      </div>
      <div class="dashboard-list" v-else>
        <div
          v-for="dashboard in savedDashboards"
          :key="dashboard.id"
          class="dashboard-item"
          @click="loadDashboard(dashboard)"
        >
          <div class="dashboard-info">
            <h4>{{ dashboard.name }}</h4>
            <p>{{ dashboard.widgets_count || 0 }} widgets</p>
            <span class="dashboard-date">{{ formatDate(dashboard.updated_at) }}</span>
          </div>
          <Button
            icon="pi pi-trash"
            class="p-button-text p-button-danger p-button-sm"
            @click.stop="deleteDashboard(dashboard)"
          />
        </div>
        <div v-if="savedDashboards.length === 0" class="empty-dashboards">
          <p>Aucun tableau sauvegardé</p>
        </div>
      </div>
    </Dialog>

    <!-- Dialog: Configuration Chart -->
    <Dialog
      v-model:visible="showChartConfig"
      :header="null"
      :style="{ width: '95vw', maxWidth: '1200px' }"
      :modal="true"
      class="chart-config-dialog"
      :showHeader="false"
    >
      <div v-if="editingChart" class="chart-config-layout">
        <!-- Panneau gauche: Configuration -->
        <div class="config-panel">
          <div class="config-header">
            <h2>Configurer le graphique</h2>
            <p>Personnalisez votre visualisation en quelques clics</p>
          </div>

          <!-- Titre -->
          <div class="config-section">
            <label class="section-label">
              <i class="pi pi-pencil"></i>
              Titre
            </label>
            <InputText
              v-model="editingChart.title"
              placeholder="Ex: Evolution de la production"
              class="title-input"
            />
          </div>

          <!-- Types de charts visuels -->
          <div class="config-section">
            <label class="section-label">
              <i class="pi pi-chart-bar"></i>
              Type de visualisation
            </label>
            <div class="chart-types-grid">
              <div
                v-for="chartType in chartTypesVisual"
                :key="chartType.value"
                class="chart-type-card"
                :class="{ active: editingChart.chartType === chartType.value }"
                @click="editingChart.chartType = chartType.value"
              >
                <div class="chart-type-icon">
                  <i :class="chartType.icon"></i>
                </div>
                <span class="chart-type-name">{{ chartType.label }}</span>
              </div>
            </div>
          </div>

          <!-- Selection des donnees -->
          <div class="config-section">
            <label class="section-label">
              <i class="pi pi-database"></i>
              Donnees
            </label>

            <div class="data-fields">
              <div class="field-group">
                <label class="field-label">Axe X (horizontal)</label>
                <Select
                  v-model="editingChart.xAxisTag"
                  :options="availableTags"
                  optionLabel="display_name"
                  optionValue="id"
                  placeholder="Temps, date, catégorie..."
                  class="w-full"
                  showClear
                />
              </div>

              <div class="field-group">
                <label class="field-label">Axe Y (valeurs) <span class="hint">max 5</span></label>
                <MultiSelect
                  v-model="editingChart.selectedTags"
                  :options="availableTags"
                  optionLabel="display_name"
                  option-value="id"
                  placeholder="Sélectionnez les données à tracer"
                  :maxSelectedLabels="2"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="config-actions">
            <Button
              label="Annuler"
              @click="showChartConfig = false"
              class="p-button-text btn-cancel"
            />
            <Button
              label="Appliquer"
              @click="applyChartConfig"
              class="btn-apply"
              icon="pi pi-check"
            />
          </div>
        </div>

        <!-- Panneau droit: Apercu -->
        <div class="preview-panel">
          <div class="preview-header">
            <h3>
              <i class="pi pi-eye"></i>
              Apercu
            </h3>
            <span v-if="editingChart.selectedTags?.length" class="tag-count">
              {{ editingChart.selectedTags.length }} serie(s)
            </span>
          </div>

          <div class="preview-content">
            <div v-if="isLoadingChartPreview" class="preview-loading">
              <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
              <p>Chargement des données...</p>
            </div>

            <div v-else-if="!editingChart.selectedTags?.length" class="preview-empty">
              <div class="empty-illustration">
                <i class="pi pi-chart-line"></i>
              </div>
              <p>Sélectionnez des données pour voir l'aperçu</p>
            </div>

            <VuePlotly
              v-else-if="chartPreviewData && chartPreviewData.length > 0"
              :data="cleanChartData(chartPreviewData)"
              :layout="cleanChartLayout(chartPreviewLayout, true)"
              :config="plotlyConfig"
              class="preview-chart"
            />

            <div v-else class="preview-no-data">
              <i class="pi pi-inbox"></i>
              <p>Aucune donnée pour cette période</p>
              <span class="hint-text">Essayez de modifier la plage de dates</span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Drawer: Widget en plein écran -->
    <Drawer
      v-model:visible="showFullscreen"
      :header="fullscreenWidget?.title || 'Widget'"
      position="full"
      class="fullscreen-widget-drawer"
    >
      <div v-if="fullscreenWidget" class="fullscreen-widget-content">
        <!-- KPI/Formula Widget -->
        <div v-if="fullscreenWidget.type === 'kpi' || fullscreenWidget.type === 'formula'" class="fullscreen-kpi-widget">
          <div class="fullscreen-kpi-value">{{ fullscreenWidget.value || '--' }}</div>
          <div class="fullscreen-kpi-unit">{{ fullscreenWidget.unit }}</div>
          <div class="fullscreen-kpi-description">{{ fullscreenWidget.description }}</div>
        </div>

        <!-- Chart Widget -->
        <div v-else-if="fullscreenWidget.type === 'chart'" class="fullscreen-chart-widget">
          <VuePlotly
            v-if="fullscreenWidget.chartData"
            :data="cleanChartData(fullscreenWidget.chartData)"
            :layout="cleanChartLayout(fullscreenChartLayout, true)"
            :config="plotlyConfig"
          />
          <div v-else class="fullscreen-chart-placeholder">
            <i class="pi pi-chart-line"></i>
            <p>Cliquez sur l'icône de configuration pour sélectionner les tags à tracer</p>
          </div>
        </div>
      </div>
    </Drawer>

    <!-- AI Dashboard Builder Chat -->
    <DashboardBuilderChat
      ref="aiChatRef"
      @open-dashboard="openDashboardById"
      @dashboard-updated="onDashboardUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import VuePlotly from 'vue3-plotly-ts'
import ProgressSpinner from 'primevue/progressspinner'
import Drawer from 'primevue/drawer'
import { useToast } from 'primevue/usetoast'
import { GridLayout, GridItem } from 'grid-layout-plus'
import { useAnalyticsStore } from '../stores/analyticsStore'
import { axiosInstance } from '@/main.js'
import DashboardBuilderChat from '../components/DashboardBuilderChat.vue'

const router = useRouter()
const toast = useToast()
const analyticsStore = useAnalyticsStore()

// Navigation
const goBack = () => {
  router.push('/dashboard')
}

// État
const editMode = ref(false)
const searchQuery = ref('')
const aiChatRef = ref(null)
const currentDashboard = ref({
  id: null,
  name: '',
  widgets: []
})
const savedDashboards = ref([])
const showDashboardList = ref(false)
const showChartConfig = ref(false)
const editingChart = ref(null)
const sizeMenu = ref(null)
const colorMenu = ref(null)
const currentWidget = ref(null)
const showFullscreen = ref(false)
const fullscreenWidget = ref(null)

// Date filter state - Default: janvier 2025 à aujourd'hui
const filterStartDate = ref(new Date(2025, 0, 1))  // 1er janvier 2025
const filterEndDate = ref(new Date())               // Aujourd'hui
const isLoadingDateFilter = ref(false)
const isLoadingDashboard = ref(false)
const isInitialLoading = ref(true)
let saveDashboardTimeout = null

// Helper functions for native date inputs
const formatDateForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const updateStartDate = (event) => {
  filterStartDate.value = new Date(event.target.value)
}

const updateEndDate = (event) => {
  filterEndDate.value = new Date(event.target.value)
}

// Éléments disponibles
const availableKPIs = ref([])
const availableFormulas = ref([])
const availableTags = ref([])

// Sections expand/collapse (fermées par défaut)
const expandedSections = ref({
  kpis: false,
  formulas: false,
  tags: false
})

// Computed pour filtrer les éléments en fonction de la recherche
const filteredKPIs = computed(() => {
  if (!searchQuery.value) return availableKPIs.value

  const query = searchQuery.value.toLowerCase()
  return availableKPIs.value.filter(kpi =>
    kpi.name.toLowerCase().includes(query) ||
    kpi.description?.toLowerCase().includes(query) ||
    kpi.unit?.toLowerCase().includes(query)
  )
})

const filteredFormulas = computed(() => {
  if (!searchQuery.value) return availableFormulas.value

  const query = searchQuery.value.toLowerCase()
  return availableFormulas.value.filter(formula =>
    formula.name.toLowerCase().includes(query) ||
    formula.description?.toLowerCase().includes(query) ||
    formula.unit?.toLowerCase().includes(query)
  )
})

const isDateRangeValid = computed(() => {
  return filterStartDate.value && filterEndDate.value
})

// Widget theme colors (plus douces et appliquées à toute la card)
const widgetColors = [
  { label: 'Défaut', value: 'default' },
  { label: 'Bleu ciel', value: 'blue', bg: '#E3F2FD', text: '#1565C0' },
  { label: 'Vert menthe', value: 'green', bg: '#E8F5E9', text: '#2E7D32' },
  { label: 'Violet doux', value: 'purple', bg: '#F3E5F5', text: '#6A1B9A' },
  { label: 'Orange pêche', value: 'orange', bg: '#FFF3E0', text: '#E65100' },
  { label: 'Rose pâle', value: 'pink', bg: '#FCE4EC', text: '#C2185B' },
  { label: 'Turquoise', value: 'cyan', bg: '#E0F7FA', text: '#00838F' },
  { label: 'Lavande', value: 'lavender', bg: '#EDE7F6', text: '#5E35B1' },
  { label: 'Ambre', value: 'amber', bg: '#FFF8E1', text: '#F57F17' }
]

// Menu items pour la sélection de taille
const sizeMenuItems = computed(() => [
  {
    label: 'Petit',
    icon: currentWidget.value?.size === 'small' ? 'pi pi-check' : 'pi pi-stop',
    command: () => changeWidgetSize('small')
  },
  {
    label: 'Moyen',
    icon: currentWidget.value?.size === 'medium' ? 'pi pi-check' : 'pi pi-stop',
    command: () => changeWidgetSize('medium')
  },
  {
    label: 'Grand',
    icon: currentWidget.value?.size === 'large' ? 'pi pi-check' : 'pi pi-stop',
    command: () => changeWidgetSize('large')
  }
])

// Menu items pour la sélection de couleur
const colorMenuItems = computed(() => {
  return widgetColors.map(color => ({
    label: color.label,
    icon: currentWidget.value?.color === color.value ? 'pi pi-check' : '',
    command: () => changeWidgetColor(color.value),
    style: color.bg ? {
      background: color.bg,
      color: color.text,
      borderLeft: `4px solid ${color.text}`
    } : {}
  }))
})

// Chart types - Tous les types disponibles
const chartTypes = [
  { label: 'Ligne (Line)', value: 'line' },
  { label: 'Barres (Bar)', value: 'bar' },
  { label: 'Aire (Area)', value: 'area' },
  { label: 'Points (Scatter)', value: 'scatter' },
  { label: 'Barres Empilees (Stacked)', value: 'stacked-bar' },
  { label: 'Aires Empilees (Stacked Area)', value: 'stacked-area' },
  { label: 'Camembert (Pie)', value: 'pie' },
  { label: 'Donut (Doughnut)', value: 'doughnut' },
  { label: 'Barres Horizontales', value: 'bar-horizontal' },
  { label: 'Ligne avec Tendance', value: 'line-trendline' }
]

// Chart types visuels avec icones
const chartTypesVisual = [
  { label: 'Ligne', value: 'line', icon: 'pi pi-chart-line' },
  { label: 'Barres', value: 'bar', icon: 'pi pi-chart-bar' },
  { label: 'Aire', value: 'area', icon: 'pi pi-stop' },
  { label: 'Points', value: 'scatter', icon: 'pi pi-circle' },
  { label: 'Empile', value: 'stacked-bar', icon: 'pi pi-bars' },
  { label: 'Camembert', value: 'pie', icon: 'pi pi-chart-pie' },
  { label: 'Donut', value: 'doughnut', icon: 'pi pi-circle' },
  { label: 'Tendance', value: 'line-trendline', icon: 'pi pi-arrow-up-right' }
]

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

// Nettoyer les données du chart (appliquer couleurs et styles)
const cleanChartData = (chartData) => {
  if (!chartData || !Array.isArray(chartData)) return chartData
  return chartData.map((trace, index) => {
    const t = { ...trace }
    const color = chartColorPalette[index % chartColorPalette.length]

    // Supprimer les textes au-dessus des elements
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
      if (t.fill) {
        t.fillcolor = color.replace(')', ', 0.15)').replace('rgb', 'rgba').replace('#', '')
        // Pour les hex, convertir en rgba
        if (color.startsWith('#')) {
          const r = parseInt(color.slice(1, 3), 16)
          const g = parseInt(color.slice(3, 5), 16)
          const b = parseInt(color.slice(5, 7), 16)
          t.fillcolor = `rgba(${r}, ${g}, ${b}, 0.15)`
        }
      }
    } else if (t.type === 'pie') {
      t.textinfo = t.textinfo || 'percent'
      t.textfont = { size: 11, color: '#fff' }
      // Garder les couleurs existantes si définies (ex: pie agrégé par tag)
      if (!t.marker?.colors) {
        t.marker = {
          colors: chartColorPalette.slice(0, t.values?.length || 5),
          line: { color: '#fff', width: 2 }
        }
      } else {
        t.marker = { ...t.marker, line: { color: '#fff', width: 2 } }
      }
    }

    // Tronquer les noms trop longs pour les legendes
    if (t.name && t.name.length > 18) {
      t.name = t.name.substring(0, 15) + '...'
    }

    return t
  })
}

// Nettoyer le layout (legendes, marges, overflow)
// isFullscreen: true = afficher légendes, false = masquer légendes (vue compacte grille)
const cleanChartLayout = (layout, isFullscreen = false) => {
  if (!layout) return layout
  const l = JSON.parse(JSON.stringify(layout))

  // Pas de titre sur le chart (deja dans le header du widget)
  l.title = ''

  // Déterminer si c'est un pie/doughnut (pas d'axes)
  const isPieChart = !l.xaxis && !l.yaxis

  // Configuration axes
  if (l.xaxis) {
    l.xaxis.title = { text: '' }
    l.xaxis.tickfont = { size: 9, color: '#64748b' }
    l.xaxis.gridcolor = '#f1f5f9'
    l.xaxis.linecolor = '#e2e8f0'
    l.xaxis.nticks = 6
    l.xaxis.tickangle = -45
    l.xaxis.automargin = true
  }

  if (l.yaxis) {
    l.yaxis.title = { text: '' }
    l.yaxis.tickfont = { size: 9, color: '#64748b' }
    l.yaxis.gridcolor = '#f1f5f9'
    l.yaxis.linecolor = '#e2e8f0'
    l.yaxis.zeroline = false
  }

  // Légende et marges selon mode compact ou fullscreen
  if (isPieChart) {
    l.margin = { l: 10, r: 10, b: 10, t: 10, pad: 0 }
    // Pie : pas de légende (les labels sont directement sur les segments)
    l.showlegend = false
  } else if (!isFullscreen) {
    // Vue compacte (grille) : PAS de légende, maximiser l'espace du graphique
    l.showlegend = false
    l.margin = { l: 40, r: 10, b: 55, t: 10, pad: 4 }
  } else {
    // Vue fullscreen ou preview : afficher la légende en haut
    l.showlegend = true
    l.margin = { l: 50, r: 20, b: 60, t: 35, pad: 4 }
    l.legend = {
      orientation: 'h',
      y: 1.08,
      x: 0,
      xanchor: 'left',
      yanchor: 'bottom',
      font: { size: 12, color: '#334155' },
      bgcolor: 'transparent',
      bordercolor: 'transparent'
    }
  }

  // Fond et style general
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

// Configuration de la grille
const GRID_COLS = 12
const MIN_ROW_HEIGHT = 180 // Hauteur minimale d'une ligne en px

// Flag pour éviter les mises à jour récursives
let isUpdatingFromWidgets = false
let isUpdatingFromLayout = false

// Layout ref pour grid-layout-plus (modifiable par la bibliothèque via v-model)
const layoutRef = ref([])

// Fonction pour générer le layout à partir des widgets
const generateLayoutFromWidgets = () => {
  return currentDashboard.value.widgets.map(widget => {
    const w = widget.gridWidth || (widget.size === 'small' ? 3 : widget.size === 'large' ? 6 : 4)
    const h = widget.gridHeight || widget.heightSpan || (widget.type === 'chart' ? 2 : 1)
    const x = widget.gridPosition ? widget.gridPosition.col - 1 : 0
    const y = widget.gridPosition ? widget.gridPosition.row - 1 : 0
    return { i: widget.id, x, y, w, h }
  })
}

// Computed qui représente UNIQUEMENT la structure du layout (pas les données)
// Ne change que si: ajout/suppression de widget, changement de taille/position
const widgetsLayoutKey = computed(() => {
  return currentDashboard.value.widgets.map(w =>
    `${w.id}|${w.size}|${w.gridPosition?.row}-${w.gridPosition?.col}|${w.heightSpan}`
  ).join(',')
})

// Watcher pour synchroniser widgets → layoutRef
// Ne se déclenche QUE si la structure change, PAS si les valeurs/données changent
watch(
  widgetsLayoutKey,
  () => {
    if (isUpdatingFromLayout) return
    isUpdatingFromWidgets = true
    layoutRef.value = generateLayoutFromWidgets()
    nextTick(() => {
      isUpdatingFromWidgets = false
    })
  },
  { immediate: true }
)

// Watcher pour synchroniser layoutRef → widgets (quand l'utilisateur drag/resize)
// DÉSACTIVÉ TEMPORAIREMENT pour debug - les widgets ne seront mis à jour que par drag/resize manuel
/*
watch(
  layoutRef,
  (newLayout) => {
    // Ne pas synchroniser pendant le chargement des données
    if (isUpdatingFromWidgets || isUpdatingWidgetData || !newLayout.length) return

    // Vérifier si quelque chose a VRAIMENT changé avant de mettre à jour
    let hasRealChanges = false

    newLayout.forEach(item => {
      const widget = currentDashboard.value.widgets.find(w => w.id === item.i)
      if (!widget) return

      const newRow = item.y + 1
      const newCol = item.x + 1

      // Ne mettre à jour que si les valeurs ont vraiment changé
      if (widget.gridPosition?.row !== newRow ||
          widget.gridPosition?.col !== newCol ||
          widget.gridWidth !== item.w ||
          widget.heightSpan !== item.h) {
        hasRealChanges = true
      }
    })

    // Si rien n'a changé, ne pas déclencher de mise à jour
    if (!hasRealChanges) return

    isUpdatingFromLayout = true

    newLayout.forEach(item => {
      const widget = currentDashboard.value.widgets.find(w => w.id === item.i)
      if (!widget) return

      // Mettre à jour les dimensions du widget
      widget.gridPosition = { row: item.y + 1, col: item.x + 1 }
      widget.gridWidth = item.w
      widget.gridHeight = item.h
      widget.heightSpan = item.h
    })

    // Sauvegarde automatique après modification
    if (currentDashboard.value.name) {
      autoSaveDashboard()
    }

    nextTick(() => {
      isUpdatingFromLayout = false
    })
  },
  { deep: true }
)
*/

// Helper pour récupérer un widget par son ID (utilisé dans le template)
const getWidgetById = (id) => {
  return currentDashboard.value.widgets.find(w => w.id === id)
}

// Sauvegarde automatique avec debounce (sans toast)
const autoSaveDashboard = () => {
  if (saveDashboardTimeout) {
    clearTimeout(saveDashboardTimeout)
  }

  saveDashboardTimeout = setTimeout(async () => {
    if (currentDashboard.value.name) {
      try {
        await saveDashboard(false)
      } catch {
        // Sauvegarde auto silencieuse — échec ignoré volontairement
      }
    }
    saveDashboardTimeout = null
  }, 1000)
}

// Détecter quand le drag commence/se termine via onDragOver
// onDragOver est appelé quand un élément est au-dessus de la zone

// Méthodes
const loadData = async () => {
  try {
    const [kpis, formulas, tags, dashboards] = await Promise.all([
      analyticsStore.getKPIs(),
      analyticsStore.getFormulas(),
      analyticsStore.getTags(),
      analyticsStore.getDashboards()
    ])

    availableKPIs.value = kpis
    availableFormulas.value = formulas
    availableTags.value = tags
    savedDashboards.value = dashboards
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données',
      life: 3000
    })
  } finally {
    isInitialLoading.value = false
  }
}

const toggleSection = (section) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

const createNewDashboard = () => {
  currentDashboard.value = {
    id: null,
    name: 'Nouveau Tableau',
    description: null,
    widgets: [],
    is_default: false,
    is_shared: false
  }
  editMode.value = true
  // Réinitialiser lastLoadedDates pour forcer le chargement quand des widgets seront ajoutés
  lastLoadedDates.start = null
  lastLoadedDates.end = null
}

const createWidgetFromItem = (type, item) => {
  if (type === 'kpi') {
    return {
      id: `kpi-${Date.now()}-${Math.random()}`,
      type: 'kpi',
      title: item.name,
      kpiId: item.id,
      value: '--', // Sera chargé via loadWidgetValues
      unit: item.unit,
      description: item.description,
      size: 'small',
      heightSpan: 1,
      color: 'default'
    }
  } else if (type === 'formula') {
    return {
      id: `formula-${Date.now()}-${Math.random()}`,
      type: 'formula',
      title: item.name,
      formulaId: item.id,
      value: '--', // Sera chargé via loadWidgetValues
      unit: item.unit || '%',
      description: item.description,
      size: 'small',
      heightSpan: 1,
      color: 'default'
    }
  }
  return null
}

// Ajouter un widget depuis la sidebar (click-to-add)
const addWidgetFromSidebar = async (type, item) => {
  // Vérifier si un tableau de bord est en cours d'édition
  if (!editMode.value) {
    toast.add({
      severity: 'warn',
      summary: 'Tableau de bord requis',
      detail: 'Veuillez d\'abord créer un nouveau tableau de bord',
      life: 4000
    })
    return
  }

  const newWidget = createWidgetFromItem(type, item)
  if (!newWidget) return

  // Trouver la prochaine position disponible (grid-layout-plus gère automatiquement)
  // On place le widget à x=0, y=Infinity pour le mettre en bas automatiquement
  const existingWidgets = currentDashboard.value.widgets
  const maxY = existingWidgets.length > 0
    ? Math.max(...existingWidgets.map(w => (w.gridPosition?.row || 1) + (w.heightSpan || 1) - 1))
    : 0

  newWidget.gridPosition = { row: maxY + 1, col: 1 }

  currentDashboard.value.widgets.push(newWidget)

  // Charger la valeur du widget (sans spinner de date)
  if ((type === 'kpi' && newWidget.kpiId) || (type === 'formula' && newWidget.formulaId)) {
    await loadWidgetValues(false)
  }

  toast.add({
    severity: 'success',
    summary: 'Widget ajouté',
    detail: `${item.name} a été ajouté au tableau`,
    life: 2000
  })

  // Sauvegarder automatiquement
  if (currentDashboard.value.name) {
    autoSaveDashboard()
  }
}

const addChartWidget = () => {
  // Vérifier si un tableau de bord est en cours d'édition
  if (!editMode.value) {
    toast.add({
      severity: 'warn',
      summary: 'Tableau de bord requis',
      detail: 'Veuillez d\'abord créer un nouveau tableau de bord avant d\'ajouter des charts',
      life: 4000
    })
    return
  }

  // Trouver une position libre en bas
  const existingWidgets = currentDashboard.value.widgets
  const maxRow = existingWidgets.length > 0
    ? Math.max(...existingWidgets.map(w => (w.gridPosition?.row || 1) + (w.heightSpan || 1) - 1))
    : 0

  const newChart = {
    id: `chart-${Date.now()}`,
    type: 'chart',
    title: 'Nouveau Chart',
    chartType: 'line',
    xAxisTag: null,
    selectedTags: [],
    chartData: null,
    chartLayout: null,
    size: 'large',
    heightSpan: 2,
    color: 'default',
    gridPosition: { row: maxRow + 1, col: 1 }
  }

  currentDashboard.value.widgets.push(newChart)
  configureChart(newChart)
}

const configureChart = async (chart) => {
  editingChart.value = { ...chart }
  showChartConfig.value = true
  
  // Charger les données si le chart a déjà des tags sélectionnés
  if (editingChart.value.selectedTags?.length) {
    await loadChartPreviewData()
  }
}

// Données de prévisualisation du chart (chargées dynamiquement)
const chartPreviewData = ref(null)
const isLoadingChartPreview = ref(false)

// ============================================================================
// UTILITAIRES POUR LA CONSTRUCTION DE GRAPHIQUES
// ============================================================================

/**
 * Détermine le type d'un tag basé sur ses données
 * @param {Object} tagData - Données du tag depuis l'API {timestamps, values}
 * @returns {Object} - {type: 'DATE'|'NUMERIC'|'TEXT', hasValues: boolean, hasTimestamps: boolean}
 */
const detectTagType = (tagData) => {
  const validValues = (tagData.values || []).filter(v => v !== null && v !== undefined && v !== '')
  const timestamps = (tagData.timestamps || [])
  
  // Vérifier si les valeurs sont numériques
  const numericValues = validValues.filter(v => {
    if (typeof v === 'number') return true
    if (typeof v === 'string') {
      // Essayer de convertir en nombre
      const num = Number(v)
      return !isNaN(num) && isFinite(num) && v.trim() !== ''
    }
    return false
  })
  
  // Un tag DATE a des timestamps mais pas de valeurs numériques valides
  // OU toutes les valeurs sont null/undefined/vides mais il y a des timestamps
  if (numericValues.length === 0 && timestamps.length > 0) {
    return { type: 'DATE', hasValues: false, hasTimestamps: true }
  }
  
  // Un tag NUMERIC a des valeurs numériques (peut avoir aussi des timestamps pour l'axe X)
  if (numericValues.length > 0) {
    return { type: 'NUMERIC', hasValues: true, hasTimestamps: timestamps.length > 0 }
  }
  
  // Sinon, c'est probablement du texte ou vide
  return { type: 'TEXT', hasValues: false, hasTimestamps: timestamps.length > 0 }
}

/**
 * Convertit une date string ISO en objet Date
 * @param {string} dateStr - Date au format ISO (YYYY-MM-DD)
 * @returns {Date}
 */
const parseDate = (dateStr) => {
  if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateStr + 'T00:00:00')
  }
  return new Date(dateStr)
}

/**
 * Construit les données X et Y pour une trace de graphique
 * @param {Object} tagData - Données du tag depuis l'API
 * @param {Object} tagType - Type détecté du tag
 * @param {Array} xAxisData - Données de l'axe X (si spécifié)
 * @param {boolean} hasDateOnYAxis - Si un autre tag Y est une date
 * @returns {Object} - {x: Array, y: Array}
 */
const buildTraceData = (tagData, tagType, xAxisData = null, hasDateOnYAxis = false) => {
      const validValues = (tagData.values || []).filter(v => v !== null && v !== undefined)
  const timestamps = (tagData.timestamps || [])
      
      let finalX = []
  let finalY = []
  
  // Construction de l'axe Y
  if (tagType.type === 'DATE') {
    // Pour les dates, convertir en timestamps numériques (millisecondes) pour que dtick fonctionne
    // Plotly peut formater les dates en millisecondes avec le type 'date'
    finalY = timestamps.map(ts => {
      // Convertir en timestamp en millisecondes
      const date = parseDate(ts)
      return date.getTime() // Timestamp en millisecondes
    })
  } else if (tagType.type === 'NUMERIC') {
    // Pour les valeurs numériques, utiliser directement les valeurs
    finalY = validValues
      } else {
    // Pas de données valides
    return { x: [], y: [] }
  }
  
  // Construction de l'axe X
      if (hasDateOnYAxis) {
    // Si Y est une date, X est toujours un index
    finalX = Array.from({ length: finalY.length }, (_, idx) => idx + 1)
  } else if (xAxisData && xAxisData.length > 0) {
    // Utiliser les données de l'axe X spécifié
        finalX = xAxisData
  } else if (tagType.type === 'NUMERIC' && timestamps.length > 0) {
    // Pour les valeurs numériques, utiliser les timestamps comme axe X
    finalX = timestamps.map(ts => parseDate(ts))
      } else {
    // Fallback: utiliser un index
    finalX = Array.from({ length: finalY.length }, (_, idx) => idx + 1)
      }
      
  // Aligner X et Y sur la même longueur
      const minLength = Math.min(finalX.length, finalY.length)
      finalX = finalX.slice(0, minLength)
      finalY = finalY.slice(0, minLength)
      
  return { x: finalX, y: finalY }
}

/**
 * Construit une trace Plotly pour un tag
 * @param {Object} tag - Tag object avec id, display_name, etc.
 * @param {Object} tagData - Données du tag depuis l'API
 * @param {string} chartType - Type de graphique ('line', 'bar', 'area', 'scatter')
 * @param {Object} options - Options {xAxisData, hasDateOnYAxis, isDateOnYAxis}
 * @returns {Object|null} - Trace Plotly ou null si pas de données
 */
const buildTrace = (tag, tagData, chartType, options = {}) => {
  const tagType = detectTagType(tagData)
  const { xAxisData = null, hasDateOnYAxis = false, isDateOnYAxis = false } = options
  
  // Si ce tag est une date et qu'on est en mode "date sur Y", on trace ses timestamps sur Y
  // Sinon, on trace normalement
  const { x, y } = buildTraceData(tagData, tagType, xAxisData, hasDateOnYAxis)
  
  if (y.length === 0) return null
  
  // Le nom de la trace doit toujours correspondre au tag qui est réellement tracé
  // Si c'est une date sur Y, le nom doit être celui du tag date
  // Si c'est une valeur numérique, le nom doit être celui du tag numérique
  const traceName = tag.display_name || tag.tag_name || tag.name || 'Tag'
  
  const trace = {
    x,
    y,
    name: traceName
  }
  
  // Configuration selon le type de chart
    switch (chartType) {
      case 'line':
        trace.type = 'scatter'
        trace.mode = 'lines+markers'
        trace.line = { width: 2 }
        trace.textposition = 'none'
        break
      case 'bar':
        trace.type = 'bar'
        trace.textposition = 'none'
        break
      case 'bar-horizontal':
        trace.type = 'bar'
        trace.orientation = 'h'
        trace.textposition = 'none'
        // Inverser x et y pour barres horizontales
        const tempX = trace.x
        trace.x = trace.y
        trace.y = tempX
        break
      case 'area':
        trace.type = 'scatter'
        trace.mode = 'lines'
        trace.fill = 'tozeroy'
        trace.line = { width: 2 }
        trace.textposition = 'none'
        break
      case 'stacked-bar':
        trace.type = 'bar'
        trace.textposition = 'none'
        // Le stackgroup sera geré dans buildChartLayout
        break
      case 'stacked-area':
        trace.type = 'scatter'
        trace.mode = 'lines'
        trace.fill = 'tonexty'
        trace.line = { width: 2 }
        trace.stackgroup = 'one'
        trace.textposition = 'none'
        break
      case 'scatter':
        trace.type = 'scatter'
        trace.mode = 'markers'
        trace.marker = { size: 8 }
        trace.textposition = 'none'
        break
      case 'line-trendline':
        trace.type = 'scatter'
        trace.mode = 'lines+markers'
        trace.line = { width: 2 }
        trace.textposition = 'none'
        // Ajouter la ligne de tendance sera gérée séparément
        break
      case 'pie':
      case 'doughnut':
        // Pour pie/doughnut, on utilise les valeurs Y comme valeurs et X comme labels
        trace.type = 'pie'
        trace.values = trace.y
        trace.labels = trace.x.map((val, idx) => `${traceName} - ${idx + 1}`)
        trace.textinfo = 'percent'
        trace.hole = chartType === 'doughnut' ? 0.4 : 0
        delete trace.x
        delete trace.y
        break
      default:
        trace.type = 'scatter'
        trace.mode = 'lines+markers'
        trace.textposition = 'none'
    }

    return trace
}

/**
 * Formate une date pour l'affichage avec le jour visible
 * @param {number|Date|string} dateValue - Date en timestamp, Date object ou string ISO
 * @returns {string} - Date formatée "15/11/2025"
 */
const formatDateForDisplay = (dateValue) => {
  let date
  if (typeof dateValue === 'number') {
    date = new Date(dateValue)
  } else if (dateValue instanceof Date) {
    date = dateValue
  } else if (typeof dateValue === 'string') {
    date = parseDate(dateValue)
  } else {
    return ''
  }
  
  // Format: "15/11/2025" avec le jour toujours visible
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Construit le layout Plotly pour un graphique
 * @param {Object} config - Configuration {xAxisTag, selectedTags, chartType, traces}
 * @returns {Object} - Layout Plotly
 */
const buildChartLayout = (config) => {
  const { xAxisTag, selectedTags, chartType, traces } = config
  
  // Détecter les types des axes
  let xAxisType = 'linear'
  let xAxisIsDate = false
  let yAxisType = 'linear'
  let yAxisIsDate = false
  let xAxisTitle = 'Index'
  let yAxisTitle = 'Valeur'
  let yAxisTickvals = null
  let yAxisTicktext = null
  
  // Vérifier si un tag Y est une date
  if (traces && traces.length > 0) {
    for (const trace of traces) {
      if (trace.y && trace.y.length > 0) {
        const firstY = trace.y[0]
        // Détecter les dates : objets Date, strings ISO (YYYY-MM-DD) ou timestamps numériques > 1000000000000
        const isDateObject = firstY instanceof Date
        const isDateString = typeof firstY === 'string' && firstY.match(/^\d{4}-\d{2}-\d{2}$/)
        const isDateTimestamp = typeof firstY === 'number' && firstY > 1000000000000
        if (isDateObject || isDateString || isDateTimestamp) {
          yAxisIsDate = true
          // Utiliser directement le nom de la trace (qui correspond au tag réellement tracé)
          // Le nom de la trace est déjà le display_name ou tag_name du tag date
          yAxisTitle = trace.name || 'Date'
          
          // FORCER les labels manuellement avec tickvals et ticktext pour garantir l'affichage des jours
          if (trace.y && trace.y.length > 0) {
            yAxisTickvals = trace.y // Les valeurs (timestamps)
            yAxisTicktext = trace.y.map(val => formatDateForDisplay(val)) // Les labels formatés avec jours
          }
          
          break
        }
      }
    }
  }
  
  // Vérifier si l'axe X est une date (seulement si Y n'est pas une date)
  if (!yAxisIsDate && xAxisTag) {
    const xTag = availableTags.value.find(t => t.id === xAxisTag)
    if (xTag) {
      xAxisTitle = xTag.display_name || xTag.tag_name || 'Temps'
      // Vérifier dans les traces si X contient des dates
      if (traces && traces.length > 0 && traces[0].x && traces[0].x.length > 0) {
        const firstX = traces[0].x[0]
        // Détecter si c'est une date: Date object, ou string ISO, ou timestamp numérique (mais pas un index simple)
        if (firstX instanceof Date) {
          xAxisIsDate = true
          xAxisType = 'date'
        } else if (typeof firstX === 'string' && firstX.match(/^\d{4}-\d{2}-\d{2}/)) {
          xAxisIsDate = true
          xAxisType = 'date'
        } else if (typeof firstX === 'object' && firstX !== null && typeof firstX.getTime === 'function') {
          xAxisIsDate = true
          xAxisType = 'date'
        }
      }
    }
  } else if (yAxisIsDate) {
    // Si Y est une date, X est toujours un index
    xAxisTitle = 'Index'
    xAxisType = 'linear'
  } else if (!xAxisTag && traces && traces.length > 0 && traces[0].x && traces[0].x.length > 0) {
    // Si pas de tag X spécifié, vérifier si les timestamps des tags Y sont utilisés pour X
    const firstX = traces[0].x[0]
    if (firstX instanceof Date || (typeof firstX === 'object' && firstX !== null && typeof firstX.getTime === 'function')) {
      xAxisIsDate = true
      xAxisType = 'date'
      xAxisTitle = 'Temps'
    } else if (typeof firstX === 'string' && firstX.match(/^\d{4}-\d{2}-\d{2}/)) {
      xAxisIsDate = true
      xAxisType = 'date'
      xAxisTitle = 'Temps'
    }
  }
  
  if (yAxisIsDate) {
    yAxisType = 'date'
  }

  // Calculer la marge gauche en fonction de la longueur des labels Y
  let leftMargin = 60
  if (yAxisIsDate && yAxisTicktext && yAxisTicktext.length > 0) {
    // Estimer la largeur nécessaire pour les labels de dates (environ 10px par caractère)
    const maxLabelLength = Math.max(...yAxisTicktext.map(t => t.length))
    leftMargin = Math.max(80, maxLabelLength * 7 + 20) // Au moins 80px, plus si nécessaire
  } else if (yAxisIsDate) {
    // Si on a des dates mais pas encore de ticktext, prévoir de l'espace
    leftMargin = 100
  }

  const layout = {
    height: chartType === 'bar' ? 380 : 400,
    autosize: true,
    margin: { t: 30, r: 20, b: 80, l: leftMargin },
    xaxis: {
      title: { text: xAxisTitle, font: { size: 11 }, standoff: 5 },
      type: xAxisType,
      tickformat: xAxisIsDate ? '%d %b' : undefined,
      tickangle: xAxisIsDate ? -45 : 'auto',
      tickfont: { size: 10 },
      automargin: true
    },
    yaxis: {
      title: {
        text: yAxisTitle,
        font: { size: 11 },
        ...(yAxisIsDate ? { standoff: 10 } : {})
      },
      type: yAxisType,
      tickfont: { size: 10 },
      ...(yAxisIsDate ? {
        tickmode: 'array',
        tickvals: yAxisTickvals,
        ticktext: yAxisTicktext,
        tickangle: 0,
        autorange: true,
        showgrid: true,
        automargin: true
      } : {})
    },
    showlegend: true,
    legend: {
      orientation: 'h',
      y: -0.3,
      x: 0.5,
      xanchor: 'center',
      font: { size: 10 }
    }
  }

  // Configuration specifique selon le type de chart
  if (chartType === 'bar') {
    layout.barmode = 'group'
  } else if (chartType === 'stacked-bar') {
    layout.barmode = 'stack'
  } else if (chartType === 'bar-horizontal') {
    layout.barmode = 'group'
    // Inverser les titres des axes pour barres horizontales
    const tempTitle = layout.xaxis.title
    layout.xaxis.title = layout.yaxis.title.text || layout.yaxis.title
    layout.yaxis.title = tempTitle
  } else if (chartType === 'pie' || chartType === 'doughnut') {
    // Pour pie/doughnut, supprimer les axes et ajuster le layout
    delete layout.xaxis
    delete layout.yaxis
    layout.showlegend = true
    layout.legend = {
      orientation: 'h',
      y: -0.15,
      x: 0.5,
      xanchor: 'center',
      font: { size: 10 }
    }
    layout.margin = { t: 20, r: 20, b: 60, l: 20 }
  }

  // Ajouter le nombre de traces pour le positionnement intelligent des legendes
  layout._traceCount = traces?.length || selectedTags?.length || 1

  return layout
}

// Charger les vraies données pour la prévisualisation du chart
const loadChartPreviewData = async () => {
  if (!editingChart.value || !editingChart.value.selectedTags?.length) {
    chartPreviewData.value = null
    return
  }

  isLoadingChartPreview.value = true
  const chartType = editingChart.value.chartType || 'line'

  try {
    const startDate = filterStartDate.value ? formatDateForAPI(filterStartDate.value) : null
    const endDate = filterEndDate.value ? formatDateForAPI(filterEndDate.value) : null

    // Source des tags (SENSOR par défaut car plus de données)
    const tagSource = editingChart.value.tagSource || 'SENSOR'

    // Détecter si un des tags Y est une date et identifier lequel
    let hasDateOnYAxis = false
    let dateTagId = null
    for (const tagId of editingChart.value.selectedTags.slice(0, 5)) {
      const tag = availableTags.value.find(t => t.id === tagId)
      if (!tag) continue
      const tagData = await analyticsStore.getTagData(tagId, startDate, endDate, tagSource)
      const tagType = detectTagType(tagData)
      if (tagType.type === 'DATE') {
        hasDateOnYAxis = true
        dateTagId = tagId
        break
      }
    }

    // Charger les données de l'axe X SEULEMENT si Y n'est pas une date
    let xAxisData = []
    if (!hasDateOnYAxis && editingChart.value.xAxisTag) {
      const xAxisTagData = await analyticsStore.getTagData(editingChart.value.xAxisTag, startDate, endDate, tagSource)
      const xTagType = detectTagType(xAxisTagData)
      
      if (xTagType.type === 'DATE' && xAxisTagData.timestamps?.length > 0) {
        xAxisData = xAxisTagData.timestamps.map(ts => parseDate(ts))
      } else if (xTagType.type === 'NUMERIC' && xAxisTagData.values?.length > 0) {
        const xValidValues = (xAxisTagData.values || []).filter(v => v !== null && v !== undefined)
        xAxisData = xValidValues
      }
    }
    
    // Charger les données pour chaque tag Y sélectionné
    // Si on a une date sur Y, on trace uniquement cette date (car on ne peut pas avoir plusieurs séries sur Y avec une date)
    // Sinon, on trace tous les tags sélectionnés normalement
    const tagsToTrace = hasDateOnYAxis
      ? [dateTagId] // Si on a une date sur Y, tracer uniquement cette date
      : editingChart.value.selectedTags
    
    const tracesPromises = tagsToTrace.slice(0, 5).map(async (tagId) => {
      const tag = availableTags.value.find(t => t.id === tagId)
      if (!tag) return null

      // Charger les données du tag (avec la source appropriée)
      const tagData = await analyticsStore.getTagData(tagId, startDate, endDate, tagSource)
      const tagType = detectTagType(tagData)
      
      // Si ce tag est la date sur Y, on trace ses timestamps sur Y
      const isDateOnYAxis = hasDateOnYAxis && tagId === dateTagId
      
      // Construire la trace avec les fonctions utilitaires
      return buildTrace(tag, tagData, chartType, {
        xAxisData: xAxisData.length > 0 ? xAxisData : null,
        hasDateOnYAxis,
        isDateOnYAxis
      })
  })

    const traces = await Promise.all(tracesPromises)
    let finalTraces = traces.filter(t => t !== null)

    // Ajouter les lignes de tendance si type line-trendline
    if (chartType === 'line-trendline' && finalTraces.length > 0) {
      const trendlineTraces = finalTraces.map(trace => {
        if (!trace.x || !trace.y || trace.y.length < 2) return null

        // Calculer regression lineaire
        const n = trace.y.length
        const xVals = trace.x.map((_, i) => i)
        const yVals = trace.y.filter(v => v !== null && !isNaN(v))
        if (yVals.length < 2) return null

        const sumX = xVals.reduce((a, b) => a + b, 0)
        const sumY = yVals.reduce((a, b) => a + b, 0)
        const sumXY = xVals.reduce((total, xi, i) => total + xi * (yVals[i] || 0), 0)
        const sumXX = xVals.reduce((total, xi) => total + xi * xi, 0)

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n

        const trendY = xVals.map(x => slope * x + intercept)

        return {
          x: trace.x,
          y: trendY,
          name: `Tendance ${trace.name}`,
          type: 'scatter',
          mode: 'lines',
          line: { width: 2, dash: 'dash' },
          showlegend: true
        }
      }).filter(t => t !== null)

      finalTraces = [...finalTraces, ...trendlineTraces]
    }

    chartPreviewData.value = finalTraces

    // Si pas de données, afficher un message
    if (chartPreviewData.value.length === 0) {
      chartPreviewData.value = null
    }
  } catch (error) {
        chartPreviewData.value = null
  } finally {
    isLoadingChartPreview.value = false
  }
}

// Watcher pour recharger les données quand la configuration du chart change
watch([() => editingChart.value?.selectedTags, () => editingChart.value?.chartType], () => {
  if (editingChart.value && editingChart.value.selectedTags?.length) {
    loadChartPreviewData()
  } else {
    chartPreviewData.value = null
  }
}, { deep: true })

const chartPreviewLayout = computed(() => {
  if (!editingChart.value) {
    return {
      height: 300,
      margin: { t: 40, r: 40, b: 60, l: 60 },
      xaxis: { title: 'Index' },
      yaxis: { title: 'Valeur' }
    }
  }

  return buildChartLayout({
    xAxisTag: editingChart.value.xAxisTag,
    selectedTags: editingChart.value.selectedTags,
    chartType: editingChart.value.chartType || 'line',
    traces: chartPreviewData.value
  })
})

const applyChartConfig = async () => {
  if (!editingChart.value) return

  // Recharger les données avant d'appliquer (au cas où elles n'ont pas été chargées)
  if (!chartPreviewData.value && editingChart.value.selectedTags?.length) {
    await loadChartPreviewData()
  }

  // Trouver et mettre à jour le widget dans le dashboard
  const widgetIndex = currentDashboard.value.widgets.findIndex(
    w => w.id === editingChart.value.id
  )

  if (widgetIndex !== -1) {
    // Créer le layout final avec la hauteur adaptée au type de chart
    const finalLayout = {
      ...chartPreviewLayout.value,
      height: editingChart.value.chartType === 'bar' ? 350 : 400,
      autosize: true
    }

    currentDashboard.value.widgets[widgetIndex] = {
      ...currentDashboard.value.widgets[widgetIndex],
      ...editingChart.value,
      chartData: chartPreviewData.value,
      chartLayout: finalLayout
    }
  }

  showChartConfig.value = false
  editingChart.value = null
  chartPreviewData.value = null
}

const removeWidget = (widget) => {
  const index = currentDashboard.value.widgets.findIndex(w => w.id === widget.id)
  if (index !== -1) {
    currentDashboard.value.widgets.splice(index, 1)
  }
}

const toggleSizeMenu = (event, widget) => {
  currentWidget.value = widget
  sizeMenu.value.toggle(event)
}

const changeWidgetSize = (size) => {
  if (!currentWidget.value) return
  
  const widgetIndex = currentDashboard.value.widgets.findIndex(w => w.id === currentWidget.value.id)
    if (widgetIndex !== -1) {
      currentDashboard.value.widgets[widgetIndex] = {
        ...currentDashboard.value.widgets[widgetIndex],
        size: size
      }
      // Mettre à jour également la référence currentWidget
      currentWidget.value = currentDashboard.value.widgets[widgetIndex]
    
    // Sauvegarder automatiquement après le changement de taille
    if (currentDashboard.value.name) {
      autoSaveDashboard()
    }
  }
  
  sizeMenu.value.hide()
  currentWidget.value = null
}

const toggleColorMenu = (event, widget) => {
  currentWidget.value = widget
  colorMenu.value.toggle(event)
}

const changeWidgetColor = (color) => {
  if (!currentWidget.value) return
  
  const widgetIndex = currentDashboard.value.widgets.findIndex(w => w.id === currentWidget.value.id)
    if (widgetIndex !== -1) {
      // Mettre à jour le widget de manière réactive en créant un nouvel objet
      currentDashboard.value.widgets[widgetIndex] = {
        ...currentDashboard.value.widgets[widgetIndex],
        color: color
      }
      // Mettre à jour également la référence currentWidget
      currentWidget.value = currentDashboard.value.widgets[widgetIndex]
    
    // Sauvegarder automatiquement après le changement de couleur
    if (currentDashboard.value.name) {
      autoSaveDashboard()
    }
  }
  
  colorMenu.value.hide()
  currentWidget.value = null
}

const saveDashboard = async (showToast = true) => {
  try {
    if (!currentDashboard.value.name) {
      if (showToast) {
      toast.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez donner un nom au tableau',
        life: 3000
      })
      }
      return
    }

    const saved = await analyticsStore.saveDashboard(currentDashboard.value)
    currentDashboard.value.id = saved.id

    if (showToast) {
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Tableau sauvegardé avec succès',
      life: 3000
    })
    }

    await loadData()
  } catch (error) {
        if (showToast) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder le tableau',
      life: 3000
    })
    }
  }
}

const loadDashboard = async (dashboard) => {
  // Empêcher les doubles clics
  if (isLoadingDashboard.value) {
    return
  }

  isLoadingDashboard.value = true

  try {
    // Récupérer les détails complets du dashboard (avec widgets)
    const response = await axiosInstance.get(`accounts/dashboards/${dashboard.id}/`)

    currentDashboard.value = { ...response.data }

    // Assurer que widgets est un tableau
    if (!currentDashboard.value.widgets) {
      currentDashboard.value.widgets = []
    }

    editMode.value = true
    showDashboardList.value = false

    // Marquer les dates comme non-chargées pour permettre le chargement
    lastLoadedDates.start = null
    lastLoadedDates.end = null

    // Auto-charger les données des widgets (KPIs, formules, charts)
    // pour que les graphiques avec selectedTags s'affichent immédiatement
    await loadWidgetValues(false)

    toast.add({
      severity: 'info',
      summary: 'Tableau chargé',
      detail: dashboard.name,
      life: 2000
    })
  } catch (error) {
        toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les détails du tableau',
      life: 3000
    })
  } finally {
    isLoadingDashboard.value = false
      }
}

// Helper pour formater les dates en format local (évite le décalage UTC)
const formatDateForAPI = (date) => {
  if (!date) return null
  const d = new Date(date)
  // Utiliser les méthodes locales pour éviter le décalage UTC
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}` // Format: YYYY-MM-DD en heure locale
}

let isLoadingWidgetValues = false // Protection contre les chargements simultanés
let pendingDateFilter = false // Indique qu'un filtre date est en attente
let isUpdatingWidgetData = false // Bloque la synchro layout pendant mise à jour des données
let lastLoadedDates = { start: null, end: null } // Évite rechargement inutile si mêmes dates

const loadWidgetValues = async (showDateSpinner = true, force = false) => {
  // Si un chargement est en cours et qu'on force (bouton Appliquer), marquer comme en attente
  if (isLoadingWidgetValues) {
    if (force) {
      // Vérifier si les dates sont différentes avant de mettre en attente
      const newStart = filterStartDate.value?.getTime()
      const newEnd = filterEndDate.value?.getTime()
      if (newStart !== lastLoadedDates.start || newEnd !== lastLoadedDates.end) {
                pendingDateFilter = true
      } else {
              }
    }
    return
  }

  
  if (!isDateRangeValid.value) {
        return
  }

  // Éviter les rechargements inutiles si les dates sont identiques (sauf si force=true)
  const currentStart = filterStartDate.value?.getTime() || null
  const currentEnd = filterEndDate.value?.getTime() || null
  if (!force && lastLoadedDates.start === currentStart && lastLoadedDates.end === currentEnd) {
        return
  }

  if (!currentDashboard.value?.widgets?.length) {
        return
  }

  // Marquer le chargement en cours
  isLoadingWidgetValues = true

  // Afficher le spinner de date seulement si demandé (pas lors du chargement initial)
  if (showDateSpinner) {
    isLoadingDateFilter.value = true
  }
  const startTime = Date.now()

  try {
    const startDate = filterStartDate.value ? formatDateForAPI(filterStartDate.value) : null
    const endDate = filterEndDate.value ? formatDateForAPI(filterEndDate.value) : null
    
    // ÉTAPE 1: Collecter tous les IDs uniques à charger
    const kpiIds = new Set()
    const formulaIds = new Set()
    // Grouper les tags par source (MES ou SENSOR)
    const tagsBySource = { MES: new Set(), SENSOR: new Set() }

    for (const widget of currentDashboard.value.widgets) {
      if (widget.isStatic) {
        // Widget statique (KPI calculé par l'IA) — pas de rechargement
        continue
      } else if (widget.type === 'kpi' && widget.tagId) {
        const source = widget.tagSource || 'SENSOR'
        tagsBySource[source].add(widget.tagId)
      } else if (widget.type === 'kpi' && widget.kpiId) {
        kpiIds.add(widget.kpiId)
      } else if (widget.type === 'formula' && widget.formulaId) {
        formulaIds.add(widget.formulaId)
      } else if (widget.type === 'chart' && widget.selectedTags?.length) {
        const source = widget.tagSource || 'SENSOR'
        widget.selectedTags.forEach(id => tagsBySource[source].add(id))
        if (widget.xAxisTag) tagsBySource[source].add(widget.xAxisTag)
      }
    }


    // ÉTAPE 2: Charger TOUT en parallèle
    const [kpiResults, formulaResults, tagResults] = await Promise.all([
      // Charger tous les KPIs en parallèle
      Promise.all(
        Array.from(kpiIds).map(async (kpiId) => {
          const value = await analyticsStore.getKPIValue(kpiId, startDate, endDate)
          return { kpiId, value }
        })
      ),
      // Charger toutes les formules en parallèle
      Promise.all(
        Array.from(formulaIds).map(async (formulaId) => {
          const value = await analyticsStore.getFormulaValue(formulaId, startDate, endDate)
          return { formulaId, value }
        })
      ),
      // Charger tous les tags par source (MES et SENSOR)
      analyticsStore.getMultipleTagsDataBySource({
        MES: Array.from(tagsBySource.MES),
        SENSOR: Array.from(tagsBySource.SENSOR)
      }, startDate, endDate)
    ])

    // Indexer les résultats pour accès rapide
    const kpiValues = new Map(kpiResults.map(r => [r.kpiId, r.value]))
    const formulaValues = new Map(formulaResults.map(r => [r.formulaId, r.value]))

    
    // ÉTAPE 3: Mettre à jour les widgets EN PLACE (sans remplacer le tableau)
    // Bloquer la synchro layout pendant la mise à jour des données
    isUpdatingWidgetData = true

    for (const widget of currentDashboard.value.widgets) {
      if (widget.type === 'kpi' && widget.tagId) {
        // KPI basé sur un tag — calculer stats
        const tagData = tagResults[widget.tagId]
        const vals = (tagData?.values || tagData?.y || []).filter(v => v != null)
        if (vals.length > 0) {
          const last = vals[vals.length - 1]
          const avg = vals.reduce((s, v) => s + v, 0) / vals.length
          const min = Math.min(...vals)
          const max = Math.max(...vals)
          widget.value = Number(avg.toFixed(1))
          widget.subtitle = `Moy. sur ${vals.length} points`
          widget.stats = {
            last: Number(last.toFixed(1)),
            avg: Number(avg.toFixed(1)),
            min: Number(min.toFixed(1)),
            max: Number(max.toFixed(1)),
            count: vals.length
          }
        } else {
          widget.value = '--'
          widget.subtitle = 'Aucune donnée'
          widget.stats = null
        }
      } else if (widget.type === 'kpi' && widget.kpiId) {
        // KPI classique (DocumentKPI)
        const value = kpiValues.get(widget.kpiId)
        widget.value = value !== null ? value : '--'
      } else if (widget.type === 'formula' && widget.formulaId) {
        // Formule: mettre à jour UNIQUEMENT la valeur
        const value = formulaValues.get(widget.formulaId)
        widget.value = value !== null ? value : '--'
      } else if (widget.type === 'chart' && widget.selectedTags?.length) {
        // Chart avec selectedTags

        if (widget.chartData && widget.chartData.length > 0) {
          // Chart EXISTANT: mettre à jour UNIQUEMENT les données x/y des traces
          // NE PAS reconstruire chartData ou chartLayout pour préserver la configuration

          for (let i = 0; i < widget.chartData.length; i++) {
            const trace = widget.chartData[i]
            // Trouver le tag correspondant à cette trace
            const tagId = widget.selectedTags[i]
            if (!tagId) continue

            const tagData = tagResults[tagId]
            if (!tagData) continue

            // Détecter le type de tag
            const tagType = detectTagType(tagData)

            // Construire les nouvelles données x/y
            const { x, y } = buildTraceData(tagData, tagType, null, false)

            // Mettre à jour UNIQUEMENT x et y, garder tout le reste (type, mode, colors, etc.)
            if (trace.x !== undefined) trace.x = x
            if (trace.y !== undefined) trace.y = y
            // Pour les pie/doughnut charts
            if (trace.values !== undefined) trace.values = y
            if (trace.labels !== undefined && x.length > 0) {
              trace.labels = x.map((val, idx) => `${trace.name || 'Tag'} - ${idx + 1}`)
            }
          }
        } else {
          // Chart NOUVEAU (créé par l'IA sans chartData): construire chartData depuis zéro
          const chartType = widget.chartType || 'line'
          const traces = []
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

          for (let i = 0; i < widget.selectedTags.length; i++) {
            const tagId = widget.selectedTags[i]
            const tagData = tagResults[tagId]
            if (!tagData) continue

            const tagType = detectTagType(tagData)
            const { x, y } = buildTraceData(tagData, tagType, null, false)

            // Trouver le nom du tag et créer un nom court pour la légende
            const tagFullName = tagData.tag_name || tagData.tag_code ||
                           availableTags.value.find(t => t.id === tagId)?.name ||
                           `Tag ${tagId}`
            // Raccourcir : supprimer le préfixe commun (ex: "Carburant " de "Carburant CAT 320" -> "CAT 320")
            const parts = tagFullName.split(' ')
            const tagShortName = parts.length > 1 ? parts.slice(1).join(' ') : tagFullName

            // Construire la trace selon le type de graphique
            const trace = {
              name: tagShortName,
              x: x,
              y: y,
              marker: { color: colors[i % colors.length] }
            }

            // Type de trace selon chartType
            if (chartType === 'bar' || chartType === 'bar-horizontal') {
              trace.type = 'bar'
              if (chartType === 'bar-horizontal') trace.orientation = 'h'
            } else if (chartType === 'area' || chartType === 'stacked-area') {
              trace.type = 'scatter'
              trace.mode = 'lines'
              trace.fill = 'tozeroy'
            } else if (chartType === 'pie' || chartType === 'doughnut') {
              // Pour pie/doughnut : on ne push PAS ici, on accumule pour construire un seul trace
              // Les données seront agrégées après la boucle
              continue
            } else if (chartType === 'scatter') {
              trace.type = 'scatter'
              trace.mode = 'markers'
            } else {
              // line, line-trendline, etc.
              trace.type = 'scatter'
              trace.mode = 'lines+markers'
            }

            traces.push(trace)
          }
          // Pour pie/doughnut : construire un seul trace avec somme par tag
          if (chartType === 'pie' || chartType === 'doughnut') {
            const pieLabels = []
            const pieValues = []
            const pieColors = []

            for (let j = 0; j < widget.selectedTags.length; j++) {
              const tid = widget.selectedTags[j]
              const td = tagResults[tid]
              if (!td) continue

              const tType = detectTagType(td)
              const { y: yVals } = buildTraceData(td, tType, null, false)
              const tFullName = td.tag_name || td.display_name ||
                           availableTags.value.find(t => t.id === tid)?.name ||
                           `Tag ${tid}`
              // Raccourcir le nom
              const tParts = tFullName.split(' ')
              const tShortName = tParts.length > 1 ? tParts.slice(1).join(' ') : tFullName

              // Somme des valeurs pour ce tag
              const total = yVals.reduce((sum, v) => sum + (Number(v) || 0), 0)
              pieLabels.push(tShortName)
              pieValues.push(Math.round(total * 10) / 10)
              pieColors.push(colors[j % colors.length])
            }

            if (pieLabels.length > 0) {
              const pieTrace = {
                type: 'pie',
                labels: pieLabels,
                values: pieValues,
                marker: { colors: pieColors },
                textinfo: 'label+percent',
                textposition: 'inside',
                insidetextorientation: 'horizontal',
                hovertemplate: '%{label}<br>%{value}<br>%{percent}<extra></extra>'
              }
              if (chartType === 'doughnut') pieTrace.hole = 0.4
              traces.push(pieTrace)
            }
          }

          widget.chartData = traces
          widget.chartLayout = buildChartLayout({
            chartType: chartType,
            selectedTags: widget.selectedTags,
            traces: traces
          })
        }
      }
    }

    // Débloquer la synchro layout après un cycle de rendu
    nextTick(() => {
      isUpdatingWidgetData = false
    })

    // Mémoriser les dates chargées pour éviter les rechargements inutiles
    lastLoadedDates.start = filterStartDate.value?.getTime() || null
    lastLoadedDates.end = filterEndDate.value?.getTime() || null

    
  } finally {
    isLoadingWidgetValues = false
    isLoadingDateFilter.value = false

    // Si un filtre date était en attente, le traiter maintenant
    if (pendingDateFilter) {
            pendingDateFilter = false
      await loadWidgetValues(true, false)
    }
  }
}

// Fonction appelée quand l'utilisateur clique sur "Appliquer" pour le filtre de dates
const applyDateFilter = async () => {
  if (!filterStartDate.value || !filterEndDate.value) {
    return
  }
  // Reset safety: si un chargement précédent a crashé, débloquer
  if (isLoadingWidgetValues) {
    isLoadingWidgetValues = false
  }
  isLoadingDateFilter.value = true
  await loadWidgetValues(true, true)
}

const togglePublish = async () => {
  if (!currentDashboard.value.id) return

  try {
    // Inverser l'état de publication
    currentDashboard.value.is_shared = !currentDashboard.value.is_shared

    // Sauvegarder automatiquement
    await analyticsStore.saveDashboard(currentDashboard.value)

    toast.add({
      severity: 'success',
      summary: currentDashboard.value.is_shared ? 'Tableau publié' : 'Tableau dépublié',
      detail: currentDashboard.value.is_shared
        ? 'Le tableau est maintenant visible sur le Dashboard public'
        : 'Le tableau n\'est plus visible sur le Dashboard public',
      life: 3000
    })

    await loadData()
  } catch (error) {
        toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de modifier le statut de publication',
      life: 3000
    })
  }
}

const deleteDashboard = async (dashboard) => {
  if (!confirm(`Supprimer le tableau "${dashboard.name}" ?`)) return

  try {
    await analyticsStore.deleteDashboard(dashboard.id)
    await loadData()

    toast.add({
      severity: 'success',
      summary: 'Supprimé',
      detail: 'Tableau supprimé avec succès',
      life: 3000
    })
  } catch (error) {
        toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le tableau',
      life: 3000
    })
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
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

// ============================================
// Dashboard Builder AI Chat Handlers
// ============================================

/**
 * Ouvre le chat AI pour la construction intelligente
 */
const openAIChat = () => {
  if (aiChatRef.value) {
    aiChatRef.value.openChat()
  }
}

/**
 * Ouvre un dashboard par son ID (depuis le chat AI)
 */
const openDashboardById = async (dashboardId) => {
  if (!dashboardId) return

  try {
    // Fermer le chat AI d'abord pour voir le dashboard
    if (aiChatRef.value) {
      aiChatRef.value.closeChat()
    }

    // Charger la liste des dashboards si pas déjà fait
    if (savedDashboards.value.length === 0) {
      await loadData()
    }

    // Trouver le dashboard dans la liste
    const dashboard = savedDashboards.value.find(d => d.id === dashboardId)

    if (dashboard) {
      await loadDashboard(dashboard)
    } else {
      // Si pas dans la liste, essayer de le charger directement
      const response = await axiosInstance.get(`accounts/dashboards/${dashboardId}/`)
      await loadDashboard(response.data)
    }

    toast.add({
      severity: 'success',
      summary: 'Dashboard ouvert',
      detail: `Dashboard #${dashboardId} charge avec succes`,
      life: 2000
    })
  } catch (error) {
    console.error('Erreur ouverture dashboard depuis AI:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: `Impossible d'ouvrir le dashboard #${dashboardId}`,
      life: 3000
    })
  }
}

/**
 * Handler quand le chat AI modifie des dashboards
 */
const onDashboardUpdated = async (actions) => {
  if (!actions || actions.length === 0) return

  // Recharger la liste des dashboards
  await loadData()

  // Si un dashboard est actuellement ouvert et a été modifié, le recharger
  const modifiedDashboard = actions.find(
    a => a.type === 'dashboard' && a.id === currentDashboard.value?.id
  )

  if (modifiedDashboard) {
    // Recharger le dashboard actuel pour avoir les dernières modifications
    const response = await axiosInstance.get(`accounts/dashboards/${currentDashboard.value.id}/`)
    currentDashboard.value = { ...response.data }

    if (!currentDashboard.value.widgets) {
      currentDashboard.value.widgets = []
    }

    toast.add({
      severity: 'info',
      summary: 'Tableau de bord mis à jour',
      detail: 'Le tableau de bord a été modifié par l\'assistant IA',
      life: 3000
    })
  }

  // Notifier si un nouveau dashboard a été créé
  const createdDashboard = actions.find(
    a => a.type === 'dashboard' && a.action === 'created'
  )

  if (createdDashboard) {
    toast.add({
      severity: 'success',
      summary: 'Nouveau dashboard',
      detail: `Tableau de bord #${createdDashboard.id} créé par l'assistant IA`,
      life: 4000
    })
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard-builder {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.builder-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 1rem;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-back:hover {
  border-color: #7AC943;
  color: #7AC943;
  background: #f8fff5;
}

.btn-back i {
  font-size: 1rem;
}

.toolbar-left h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
}

/* AI Builder Button - KAP Blue */
.ai-builder-btn {
  background: #0B2B3C !important;
  border-color: #0B2B3C !important;
  color: white !important;
}

.ai-builder-btn:hover {
  background: #0a2330 !important;
  border-color: #0a2330 !important;
  color: white !important;
}

.ai-builder-btn:focus {
  box-shadow: 0 0 0 2px white, 0 0 0 4px #0B2B3C !important;
}

.dashboard-name-input {
  width: 100%;
  max-width: 300px;
  min-width: 200px;
}

.toolbar-center {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  margin: 0 1rem;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-filter :deep(.p-datepicker-input) {
  width: 115px;
  font-size: 0.85rem;
}

.date-filter :deep(.p-button) {
  font-size: 0.85rem;
}

.toolbar-right {
  display: flex;
  gap: 1rem;
}

.builder-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.builder-sidebar {
  width: 100%;
  max-width: 320px;
  min-width: 280px;
  background: white;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  flex-shrink: 0;
}

.builder-sidebar h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  color: #1e293b;
}

.search-box {
  position: relative;
  margin-bottom: 1.5rem;
}


.element-section {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.section-header:hover {
  background: #f1f5f9;
}

.section-header span {
  flex: 1;
  font-weight: 600;
  color: #475569;
}

.section-content {
  padding-top: 0.75rem;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 50px;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.chart-item:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateX(4px);
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: #94a3b8;
}

.no-results i {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  color: #cbd5e1;
}

.no-results p {
  margin: 0;
  font-size: 0.875rem;
}

.builder-canvas {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.drop-zone-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ============ SKELETON LOADING ============ */
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

.skeleton-base {
  background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: 6px;
}

/* Sidebar skeleton */
.sidebar-skeleton {
  padding: 0.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-section-header {
  height: 36px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite linear;
}

.skeleton-item {
  height: 44px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite linear;
}

/* Canvas skeleton */
.canvas-skeleton {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  gap: 2rem;
}

.canvas-skeleton-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.skeleton-title {
  width: 240px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite linear;
}

.skeleton-subtitle {
  width: 160px;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite linear;
}

.canvas-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
  max-width: 700px;
}

.skeleton-widget {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.skeleton-widget-header {
  height: 40px;
  background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite linear;
}

.skeleton-widget-body {
  height: 100px;
  background: linear-gradient(90deg, #f8fafc 25%, #f0f4f8 50%, #f8fafc 75%);
  background-size: 600px 100%;
  animation: shimmer 1.6s infinite linear;
}

/* ============ WELCOME SCREEN ============ */
.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  overflow-y: auto;
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.welcome-header-left {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;

  h2 {
    margin: 0;
    font-size: 1.375rem;
    font-weight: 700;
    color: #0B2B3C;
  }
}

.welcome-count {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.welcome-header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Dashboard cards grid */
.dashboards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.dashboard-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  cursor: pointer;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  position: relative;

  &:hover {
    border-color: #7AC943;
    box-shadow: 0 4px 12px rgba(122, 201, 67, 0.12);
    transform: translateY(-1px);

    .dashboard-card-actions { opacity: 1; }
  }
}

.dashboard-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 0.625rem;
  background: #f0fdf4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i { font-size: 1.125rem; color: #7AC943; }
}

.dashboard-card-body {
  flex: 1;
  min-width: 0;

  h4 {
    margin: 0 0 0.375rem 0;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #0B2B3C;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.dashboard-card-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 0.25rem;

  i { font-size: 0.75rem; margin-right: 0.25rem; }
}

.badge-shared {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: #dbeafe;
  color: #2563eb;
  border-radius: 0.875rem;
  font-size: 0.6875rem;
  font-weight: 600;
}

.dashboard-card-date {
  font-size: 0.75rem;
  color: #94a3b8;
}

.dashboard-card-actions {
  display: flex;
  gap: 0.375rem;
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.card-action-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 0.375rem;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  padding: 0;

  i { font-size: 0.8125rem; }

  &:hover { background: #e2e8f0; color: #0B2B3C; }

  &--delete:hover { background: #fee2e2; color: #dc2626; }
}

/* Onboarding (no dashboards) */
.onboarding-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  gap: 1rem;
}

.onboarding-illustration {
  margin-bottom: 0.5rem;
}

.onboarding-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;

  i { font-size: 2rem; color: #7AC943; }
}

.onboarding-state h2 {
  margin: 0;
  font-size: 1.625rem;
  font-weight: 700;
  color: #0B2B3C;
}

.onboarding-state p {
  margin: 0;
  color: #64748b;
  font-size: 1rem;
  max-width: 440px;
  line-height: 1.6;
}

.onboarding-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.btn-ai-lg {
  padding: 0.75rem 1.75rem !important;
  font-size: 1rem !important;
  gap: 0.625rem !important;
}

.btn-outline-lg {
  padding: 0.75rem 1.75rem;
  font-size: 1rem;
  display: flex;
  gap: 0.625rem;
  align-items: center;
}

.onboarding-hints {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;

  i { color: #94a3b8; font-size: 0.875rem; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: #64748b;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: #cbd5e1;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #1e293b;
}

.empty-state p {
  margin: 0 0 2rem 0;
  font-size: 1rem;
}

.widgets-grid {
  flex: 1;
  padding: 1rem;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  transition: all 0.3s;
  min-height: calc(100vh - 200px);
  background: #fafbfc;
  position: relative;
  overflow: visible;
}

/* Message quand la grille est vide */
.empty-grid-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #94a3b8;
  text-align: center;
}

.empty-grid-message i {
  font-size: 3rem;
  color: #cbd5e1;
}

.empty-grid-message p {
  margin: 0;
  font-size: 1rem;
}

/* ==========================================
   GRID LAYOUT PLUS - Styles
   ========================================== */

/* Container du grid layout */
.widgets-grid :deep(.vgl-layout) {
  min-height: calc(100vh - 250px) !important;
  height: auto !important;
}

/* Style de chaque item du grid */
.widgets-grid :deep(.vgl-item) {
  transition: transform 0.2s ease !important;
}

.widgets-grid :deep(.vgl-item.vgl-item--placeholder) {
  background: rgba(59, 130, 246, 0.15) !important;
  border: 2px dashed #3b82f6 !important;
  border-radius: 12px !important;
}

.widgets-grid :deep(.vgl-item.vgl-item--resizing),
.widgets-grid :deep(.vgl-item.vgl-item--dragging) {
  opacity: 0.85;
  z-index: 1000 !important;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
}

/* Handle de redimensionnement - Style visible en bas à droite */
.widgets-grid :deep(.vgl-item) {
  /* S'assurer que le handle est visible */
  overflow: visible !important;
}

.widgets-grid :deep(.vgl-item__resizer) {
  position: absolute !important;
  width: 24px !important;
  height: 24px !important;
  bottom: 0 !important;
  right: 0 !important;
  cursor: se-resize !important;
  background: transparent !important;
  z-index: 10 !important;
}

/* Indicateur visuel du handle de redimensionnement */
.widgets-grid :deep(.vgl-item__resizer)::before {
  content: '' !important;
  position: absolute !important;
  bottom: 6px !important;
  right: 6px !important;
  width: 14px !important;
  height: 14px !important;
  border-right: 3px solid #94a3b8 !important;
  border-bottom: 3px solid #94a3b8 !important;
  border-radius: 0 0 4px 0 !important;
  opacity: 0.6 !important;
  transition: all 0.2s !important;
}

.widgets-grid :deep(.vgl-item:hover .vgl-item__resizer)::before {
  opacity: 1 !important;
  border-color: #3b82f6 !important;
  transform: scale(1.1) !important;
}

.widgets-grid :deep(.vgl-item__resizer:hover)::before {
  border-color: #2563eb !important;
  transform: scale(1.2) !important;
}

/* ==========================================
   WIDGET CARD - Styles
   ========================================== */

.widget-card {
  height: 100%;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s, transform 0.3s;
  overflow: hidden;
}

.widget-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
  cursor: grab;
  user-select: none;
}

.widget-header:active {
  cursor: grabbing;
}

.widget-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.drag-handle {
  font-size: 1rem;
  color: #94a3b8;
  transition: color 0.2s;
}

.widget-header:hover .drag-handle {
  color: #3b82f6;
}

.widget-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widget-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  cursor: default;
}

.widget-actions :deep(.p-button) {
  width: 32px;
  height: 32px;
  padding: 0;
}

.widget-body {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

/* ==========================================
   WIDGET COLORS - Thèmes de couleur
   ========================================== */

/* Bleu */
.widget-color-blue {
  border-left: 4px solid #2196F3;
}
.widget-color-blue .widget-header {
  border-bottom-color: #E3F2FD;
}
.widget-color-blue .drag-handle {
  color: #2196F3;
}

/* Vert */
.widget-color-green {
  border-left: 4px solid #4CAF50;
}
.widget-color-green .widget-header {
  border-bottom-color: #E8F5E9;
}
.widget-color-green .drag-handle {
  color: #4CAF50;
}

/* Violet */
.widget-color-purple {
  border-left: 4px solid #9C27B0;
}
.widget-color-purple .widget-header {
  border-bottom-color: #F3E5F5;
}
.widget-color-purple .drag-handle {
  color: #9C27B0;
}

/* Orange */
.widget-color-orange {
  border-left: 4px solid #FF9800;
}
.widget-color-orange .widget-header {
  border-bottom-color: #FFF3E0;
}
.widget-color-orange .drag-handle {
  color: #FF9800;
}

/* Rose */
.widget-color-pink {
  border-left: 4px solid #E91E63;
}
.widget-color-pink .widget-header {
  border-bottom-color: #FCE4EC;
}
.widget-color-pink .drag-handle {
  color: #E91E63;
}

/* Cyan */
.widget-color-cyan {
  border-left: 4px solid #00BCD4;
}
.widget-color-cyan .widget-header {
  border-bottom-color: #E0F7FA;
}
.widget-color-cyan .drag-handle {
  color: #00BCD4;
}

/* Lavande */
.widget-color-lavender {
  border-left: 4px solid #673AB7;
}
.widget-color-lavender .widget-header {
  border-bottom-color: #EDE7F6;
}
.widget-color-lavender .drag-handle {
  color: #673AB7;
}

/* Ambre */
.widget-color-amber {
  border-left: 4px solid #FFC107;
}
.widget-color-amber .widget-header {
  border-bottom-color: #FFF8E1;
}
.widget-color-amber .drag-handle {
  color: #FFC107;
}

/* ==========================================
   SIDEBAR ITEMS - Éléments cliquables
   ========================================== */

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.sidebar-item:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateX(4px);
}

.sidebar-item .item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.sidebar-item .item-name {
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-item .item-unit {
  font-size: 0.75rem;
  color: #64748b;
}

.sidebar-item .add-icon {
  color: #94a3b8;
  transition: color 0.2s;
}

.sidebar-item:hover .add-icon {
  color: #3b82f6;
}

/* Styles KPI widget */

.kpi-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
}

.kpi-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.kpi-unit {
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.kpi-subtitle {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.kpi-stats-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #94a3b8;
}

.kpi-stat {
  font-weight: 500;
}

.kpi-stat-highlight {
  color: #7AC943;
  font-weight: 700;
}

.kpi-stat-sep {
  color: #cbd5e1;
}

.kpi-description {
  font-size: 0.875rem;
  color: #94a3b8;
}

/* Styles de thème pour les widgets KPI/Formula */
.widget-color-blue .kpi-value,
.widget-color-blue .kpi-unit,
.widget-color-blue .kpi-description {
  color: #1565C0;
}

.widget-color-green .kpi-value,
.widget-color-green .kpi-unit,
.widget-color-green .kpi-description {
  color: #2E7D32;
}

.widget-color-purple .kpi-value,
.widget-color-purple .kpi-unit,
.widget-color-purple .kpi-description {
  color: #6A1B9A;
}

.widget-color-orange .kpi-value,
.widget-color-orange .kpi-unit,
.widget-color-orange .kpi-description {
  color: #E65100;
}

.widget-color-pink .kpi-value,
.widget-color-pink .kpi-unit,
.widget-color-pink .kpi-description {
  color: #C2185B;
}

.widget-color-cyan .kpi-value,
.widget-color-cyan .kpi-unit,
.widget-color-cyan .kpi-description {
  color: #00838F;
}

.widget-color-lavender .kpi-value,
.widget-color-lavender .kpi-unit,
.widget-color-lavender .kpi-description {
  color: #5E35B1;
}

.widget-color-amber .kpi-value,
.widget-color-amber .kpi-unit,
.widget-color-amber .kpi-description {
  color: #F57F17;
}

.chart-widget {
  flex: 1;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.chart-widget :deep(.js-plotly-plot) {
  flex: 1;
  width: 100% !important;
  height: 100% !important;
}

.chart-widget :deep(.plotly) {
  width: 100% !important;
  height: 100% !important;
}

/* Ameliorer le rendu des legendes */
.chart-widget :deep(.legend) {
  max-height: 80px;
  overflow-y: auto;
}

.chart-widget :deep(.legend .traces) {
  transform: none !important;
}

/* Style des tooltips */
.chart-widget :deep(.hoverlayer) {
  z-index: 1000;
}

/* Eviter le debordement des labels */
.chart-widget :deep(.xaxislayer-above text),
.chart-widget :deep(.yaxislayer-above text) {
  font-size: 11px !important;
}

/* Marge pour les barres de mode */
.chart-widget :deep(.modebar-container) {
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
}

.chart-widget :deep(.modebar) {
  background: rgba(255, 255, 255, 0.9) !important;
  border-radius: 4px;
  padding: 2px;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  text-align: center;
}

.chart-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
}

/* Styles de thème pour les chart placeholders */
.widget-color-blue .chart-placeholder,
.widget-color-blue .chart-placeholder p {
  color: #1565C0;
  opacity: 0.7;
}

.widget-color-green .chart-placeholder,
.widget-color-green .chart-placeholder p {
  color: #2E7D32;
  opacity: 0.7;
}

.widget-color-purple .chart-placeholder,
.widget-color-purple .chart-placeholder p {
  color: #6A1B9A;
  opacity: 0.7;
}

.widget-color-orange .chart-placeholder,
.widget-color-orange .chart-placeholder p {
  color: #E65100;
  opacity: 0.7;
}

.widget-color-pink .chart-placeholder,
.widget-color-pink .chart-placeholder p {
  color: #C2185B;
  opacity: 0.7;
}

.widget-color-cyan .chart-placeholder,
.widget-color-cyan .chart-placeholder p {
  color: #00838F;
  opacity: 0.7;
}

.widget-color-lavender .chart-placeholder,
.widget-color-lavender .chart-placeholder p {
  color: #5E35B1;
  opacity: 0.7;
}

.widget-color-amber .chart-placeholder,
.widget-color-amber .chart-placeholder p {
  color: #F57F17;
  opacity: 0.7;
}

.dashboard-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 500px;
  overflow-y: auto;
}

.dashboard-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.dashboard-item:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.dashboard-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #1e293b;
}

.dashboard-info p {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  color: #64748b;
}

.dashboard-date {
  font-size: 0.75rem;
  color: #94a3b8;
}

.empty-dashboards {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.loading-overlay p {
  color: #64748b;
  font-size: 0.95rem;
}

/* === NOUVEAU STYLE CHART CONFIG DIALOG === */
.chart-config-dialog :deep(.p-dialog-content) {
  padding: 0 !important;
  overflow: hidden;
}

.chart-config-dialog :deep(.p-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.chart-config-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  min-height: 600px;
}

/* Panneau de configuration */
.config-panel {
  background: #f8fafc;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  max-height: 80vh;
}

.config-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.config-header h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.config-header p {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.section-label i {
  font-size: 0.875rem;
  color: #7AC943;
}

.title-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.title-input:focus {
  border-color: #7AC943;
  box-shadow: 0 0 0 3px rgba(122, 201, 67, 0.1);
  outline: none;
}

/* Grille des types de charts */
.chart-types-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.chart-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.75rem 0.5rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-type-card:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.chart-type-card.active {
  border-color: #7AC943;
  background: rgba(122, 201, 67, 0.08);
}

.chart-type-card.active .chart-type-icon {
  color: #7AC943;
}

.chart-type-icon {
  font-size: 1.25rem;
  color: #64748b;
  transition: color 0.2s;
}

.chart-type-name {
  font-size: 0.7rem;
  font-weight: 500;
  color: #475569;
  text-align: center;
}

/* Champs de donnees */
.data-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-label .hint {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 400;
}

/* Actions */
.config-actions {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-cancel {
  color: #64748b !important;
}

.btn-apply {
  background: #7AC943 !important;
  border-color: #7AC943 !important;
  padding: 0.625rem 1.5rem !important;
}

.btn-apply:hover {
  background: #6bb835 !important;
  border-color: #6bb835 !important;
}

/* Panneau apercu */
.preview-panel {
  background: white;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.preview-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-header h3 i {
  color: #7AC943;
}

.tag-count {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 20px;
}

.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: #fafbfc;
  border-radius: 12px;
  border: 1px dashed #e2e8f0;
}

.preview-chart {
  width: 100%;
  height: 100%;
}

.preview-loading,
.preview-empty,
.preview-no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  text-align: center;
  padding: 2rem;
}

.preview-loading p,
.preview-empty p,
.preview-no-data p {
  margin: 0.75rem 0 0 0;
  font-size: 0.9rem;
}

.empty-illustration {
  width: 80px;
  height: 80px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.empty-illustration i {
  font-size: 2rem;
  color: #cbd5e1;
}

.preview-no-data i {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.hint-text {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

/* Responsive pour le nouveau dialog */
@media (max-width: 900px) {
  .chart-config-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .config-panel {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    max-height: none;
  }

  .chart-types-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .preview-content {
    min-height: 300px;
  }
}

/* Transitions */
.widget-enter-active, .widget-leave-active {
  transition: all 0.3s ease;
}

.widget-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.widget-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Color picker menu */
.color-picker-menu {
  padding: 0.5rem;
  min-width: 250px;
}

.color-picker-menu h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.color-option {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid transparent;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.color-option i {
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Fix z-index pour les menus */
:deep(.p-overlaypanel) {
  z-index: 1100 !important;
}

:deep(.p-menu) {
  z-index: 1100 !important;
}

/* Éviter que les charts interfèrent avec les menus */
.chart-widget {
  position: relative;
  z-index: 1;
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

/* ============================================================================
   RESPONSIVE DESIGN - Media Queries
   ============================================================================ */

/* Tablettes (max-width: 1024px) */
@media (max-width: 1024px) {
  .builder-toolbar {
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem 1.5rem;
  }

  .toolbar-left {
    flex: 1 1 100%;
    order: 1;
  }

  .toolbar-center {
    flex: 1 1 auto;
    order: 2;
    margin: 0;
  }

  .toolbar-right {
    flex: 1 1 100%;
    order: 3;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .builder-sidebar {
    max-width: 280px;
    min-width: 250px;
  }

  .builder-canvas {
    padding: 1rem;
  }

  .widgets-grid {
    gap: 1rem;
  }

  .fullscreen-kpi-value {
    font-size: 6rem;
  }

  .fullscreen-kpi-unit {
    font-size: 2rem;
  }

  .fullscreen-kpi-description {
    font-size: 1.25rem;
  }
}

/* Tablettes petites et mobiles grands (max-width: 768px) */
@media (max-width: 768px) {
  .builder-toolbar {
    padding: 1rem;
  }

  .toolbar-left h2 {
    font-size: 1.25rem;
  }

  .dashboard-name-input {
    max-width: 100%;
    min-width: 150px;
  }

  .date-filter :deep(.p-datepicker) {
    width: 100px;
  }

  .builder-content {
    flex-direction: column;
  }

  .builder-sidebar {
    width: 100%;
    max-width: 100%;
    min-width: 100%;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    max-height: 40vh;
    overflow-y: auto;
  }

  .builder-canvas {
    padding: 1rem 0.5rem;
  }

  .widgets-container {
    gap: 1rem;
    grid-template-columns: repeat(6, 1fr); /* 6 colonnes sur tablette */
  }

  /* Ajuster les spans des widgets sur tablette */
  .widgets-container :deep(.widget-size-small) {
    grid-column: span 3 !important; /* small = 3 colonnes sur 6 */
  }

  .widgets-container :deep(.widget-size-medium) {
    grid-column: span 4 !important; /* medium = 4 colonnes sur 6 */
  }

  .widgets-container :deep(.widget-size-large) {
    grid-column: span 6 !important; /* large = toute la largeur */
  }

  .kpi-value {
    font-size: 2rem;
  }

  .kpi-unit {
    font-size: 0.875rem;
  }

  .kpi-description {
    font-size: 0.75rem;
  }

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

/* Mobiles (max-width: 480px) */
@media (max-width: 480px) {
  .builder-toolbar {
    padding: 0.75rem;
  }

  .toolbar-left {
    gap: 0.75rem;
  }

  .toolbar-left h2 {
    font-size: 1.125rem;
  }

  .toolbar-right {
    gap: 0.5rem;
  }

  .toolbar-right :deep(.p-button) {
    padding: 0.5rem;
    font-size: 0.875rem;
  }

  .toolbar-right :deep(.p-button-label) {
    display: none; /* Cacher les labels sur mobile, garder juste les icônes */
  }

  .builder-sidebar {
    padding: 1rem;
    max-height: 35vh;
  }

  .builder-sidebar h3 {
    font-size: 1rem;
  }

  .builder-canvas {
    padding: 0.5rem;
  }

  .widgets-container {
    grid-template-columns: repeat(4, 1fr); /* 4 colonnes sur mobile */
    gap: 0.75rem;
  }

  /* Ajuster les spans des widgets sur mobile */
  .widgets-container :deep(.widget-container) {
    grid-column: span 4 !important; /* Tous les widgets prennent toute la largeur sur mobile */
  }

  .widget-header {
    padding: 1rem;
  }

  .widget-title {
    font-size: 0.875rem;
  }

  .widget-actions {
    gap: 0.25rem;
  }

  .widget-actions :deep(.p-button) {
    padding: 0.375rem;
    width: 2rem;
    height: 2rem;
  }

  .widget-body {
    padding: 1.5rem 1rem;
  }

  .kpi-value {
    font-size: 1.75rem;
  }

  .kpi-unit {
    font-size: 0.75rem;
  }

  .kpi-description {
    font-size: 0.7rem;
  }

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

  /* Dialog responsive */
  .chart-config-dialog {
    width: 95vw !important;
    max-width: 95vw !important;
  }

  .chart-config-dialog :deep(.p-dialog-content) {
    padding: 1rem;
  }

  .chart-preview {
    min-height: 250px;
  }
}

/* Très petits écrans (max-width: 360px) */
@media (max-width: 360px) {
  .widgets-container {
    grid-template-columns: repeat(2, 1fr); /* 2 colonnes sur très petits écrans */
  }

  /* Tous les widgets prennent toute la largeur sur très petits écrans */
  .widgets-container :deep(.widget-container) {
    grid-column: span 2 !important;
  }

  .toolbar-right :deep(.p-button) {
    padding: 0.375rem;
  }

  .fullscreen-kpi-value {
    font-size: 2.5rem;
  }
}

/* Orientation paysage sur mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .builder-sidebar {
    max-height: 30vh;
  }

  .fullscreen-chart-widget,
  .fullscreen-chart-widget :deep(.js-plotly-plot),
  .fullscreen-chart-placeholder {
    min-height: 50vh;
  }
}

/* Dialog responsive */
.dashboard-list-dialog {
  width: 90vw !important;
  max-width: 600px !important;
}

@media (max-width: 480px) {
  .dashboard-list-dialog {
    width: 95vw !important;
    max-width: 95vw !important;
  }
}

/* ============================================= */
/* Custom Toolbar Buttons - KAP Design System   */
/* ============================================= */

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dashboard-name-wrapper {
  margin-left: 0.5rem;
}

.dashboard-name-input {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.2s;
  min-width: 200px;
}

.dashboard-name-input:focus {
  outline: none;
  border-color: #0B2B3C;
  background: white;
  box-shadow: 0 0 0 3px rgba(11, 43, 60, 0.1);
}

.toolbar-actions-left {
  display: flex;
  gap: 0.75rem;
}

/* Base button styles */
.btn-primary,
.btn-ai,
.btn-load-data,
.btn-save,
.btn-publish,
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  white-space: nowrap;
}

/* Primary button - KAP Blue */
.btn-primary {
  background: #0B2B3C;
  color: white;
}

.btn-primary:hover {
  background: #0a2330;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(11, 43, 60, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

/* AI button */
.btn-ai {
  background: #7AC943;
  color: white;
}

.btn-ai:hover {
  background: #6bb835;
}

/* Start button - same green */
.btn-start {
  background: #7AC943 !important;
  border-color: #7AC943 !important;
}

.btn-start:hover {
  background: #6bb835 !important;
  border-color: #6bb835 !important;
}

.btn-ai i {
  font-size: 1rem;
}

/* Date filter group */
.date-filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.date-input-wrapper {
  position: relative;
}

.date-input {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  color: #1e293b;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  width: 130px;
}

.date-input:focus {
  outline: none;
  border-color: #0B2B3C;
  box-shadow: 0 0 0 2px rgba(11, 43, 60, 0.1);
}

.date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.date-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.date-separator {
  color: #94a3b8;
  font-weight: 500;
}

/* Load data button */
.btn-load-data {
  background: #0B2B3C;
  color: white;
  padding: 0.4rem 0.75rem;
}

.btn-load-data:hover:not(:disabled) {
  background: #0a2330;
}

.btn-load-data:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-load-data:active:not(:disabled) {
  transform: scale(0.95);
}

.btn-load-data.is-loading {
  background: #7AC943;
  animation: pulse-load 1.2s ease-in-out infinite;
}

@keyframes pulse-load {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.btn-load-data i {
  font-size: 0.9rem;
}

/* Save button */
.btn-save {
  background: #16a34a;
  color: white;
}

.btn-save:hover {
  background: #15803d;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

/* Publish button */
.btn-publish {
  background: #0284c7;
  color: white;
}

.btn-publish:hover {
  background: #0369a1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
}

.btn-publish.is-shared {
  background: #dc2626;
}

.btn-publish.is-shared:hover {
  background: #b91c1c;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

/* Outline button */
.btn-outline {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-outline:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
}

/* Toolbar right section */
.toolbar-right {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Responsive adjustments for toolbar */
@media (max-width: 1200px) {
  .date-filter-group {
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn-load-data span {
    display: none;
  }
}

@media (max-width: 900px) {
  .builder-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-center {
    width: 100%;
    margin: 0;
  }

  .toolbar-right {
    width: 100%;
    justify-content: flex-end;
  }

  .toolbar-actions-left {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .btn-primary span,
  .btn-ai span,
  .btn-save span,
  .btn-publish span,
  .btn-outline span {
    display: none;
  }

  .btn-primary,
  .btn-ai,
  .btn-save,
  .btn-publish,
  .btn-outline {
    padding: 0.6rem;
  }

  .date-input {
    width: 110px;
    font-size: 0.8rem;
  }
}
</style>
