<template>
  <div class="wizard-step-dashboard">
    <!-- Dashboard name input -->
    <div class="name-section">
      <label for="dashboard-name">Nom du tableau de bord</label>
      <InputText
        id="dashboard-name"
        v-model="localName"
        placeholder="Ex: Dashboard Production Journaliere"
        class="w-full"
      />
    </div>

    <!-- Chart type selection -->
    <div class="chart-type-section">
      <label>Type de visualisation par defaut</label>
      <div class="chart-options">
        <div
          v-for="option in chartOptions"
          :key="option.value"
          class="chart-option"
          :class="{ selected: wizardStore.chartType === option.value }"
          @click="wizardStore.chartType = option.value"
        >
          <i :class="option.icon"></i>
          <span>{{ option.label }}</span>
        </div>
      </div>
    </div>

    <!-- Preview section -->
    <div class="preview-section">
      <div class="preview-header">
        <h4>Aperçu du tableau de bord</h4>
        <Button
          label="Actualiser"
          icon="pi pi-refresh"
          text
          size="small"
          @click="refreshPreview"
        />
      </div>

      <div class="preview-container">
        <div class="preview-grid">
          <!-- KPI Widgets -->
          <div
            v-for="widget in kpiWidgets"
            :key="widget.id"
            class="preview-widget kpi-widget"
          >
            <div class="widget-icon">
              <i class="pi pi-chart-bar"></i>
            </div>
            <div class="widget-content">
              <span class="widget-value">{{ widget.value || '--' }}<small v-if="widget.unit"> {{ widget.unit }}</small></span>
              <span class="widget-label">{{ widget.title }}</span>
            </div>
          </div>
        </div>

        <!-- Chart Widget -->
        <div v-if="chartWidget" class="preview-widget chart-widget">
          <div class="widget-header">
            <span>{{ chartWidget.title }}</span>
            <i :class="getChartIcon(chartWidget.chartType)"></i>
          </div>
          <div class="chart-placeholder">
            <svg viewBox="0 0 400 150" class="chart-svg">
              <template v-if="wizardStore.chartType === 'line'">
                <polyline
                  points="20,120 80,80 140,100 200,60 260,70 320,40 380,50"
                  fill="none"
                  stroke="var(--primary-400)"
                  stroke-width="2"
                />
              </template>
              <template v-else-if="wizardStore.chartType === 'bar'">
                <rect x="30" y="80" width="40" height="60" fill="var(--primary-400)" rx="4"/>
                <rect x="90" y="50" width="40" height="90" fill="var(--primary-400)" rx="4"/>
                <rect x="150" y="70" width="40" height="70" fill="var(--primary-400)" rx="4"/>
                <rect x="210" y="30" width="40" height="110" fill="var(--primary-400)" rx="4"/>
                <rect x="270" y="60" width="40" height="80" fill="var(--primary-400)" rx="4"/>
                <rect x="330" y="40" width="40" height="100" fill="var(--primary-400)" rx="4"/>
              </template>
              <template v-else>
                <circle cx="200" cy="75" r="60" fill="none" stroke="var(--primary-400)" stroke-width="20" stroke-dasharray="188 377"/>
                <circle cx="200" cy="75" r="60" fill="none" stroke="var(--blue-400)" stroke-width="20" stroke-dasharray="94 377" stroke-dashoffset="-188"/>
                <circle cx="200" cy="75" r="60" fill="none" stroke="var(--green-400)" stroke-width="20" stroke-dasharray="94 377" stroke-dashoffset="-282"/>
              </template>
            </svg>
            <div class="chart-legend">
              <span v-for="(tag, idx) in chartWidget.tags?.slice(0, 3)" :key="idx" class="legend-item">
                <span class="legend-dot" :style="{ background: getLegendColor(idx) }"></span>
                {{ getTagName(tag) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Empty preview -->
        <div v-if="!wizardStore.previewWidgets.length" class="empty-preview">
          <i class="pi pi-th-large"></i>
          <p>Sélectionnez des indicateurs pour voir l'aperçu</p>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="summary-section">
      <div class="summary-item summary-main">
        <span class="summary-value">{{ wizardStore.previewWidgets.length }}</span>
        <span class="summary-label">Widgets à créer</span>
      </div>
      <div class="summary-info" v-if="kpiCount > 0">
        <i class="pi pi-check-circle" style="color: #7AC943"></i>
        <span>Dont {{ kpiCount }} KPI(s) calculé(s) depuis les données du rapport</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useDashboardWizardStore } from '@/features/ai/stores/dashboardWizardStore'

const wizardStore = useDashboardWizardStore()

const localName = ref(wizardStore.dashboardName)

const chartOptions = [
  { value: 'line', label: 'Ligne', icon: 'pi pi-chart-line' },
  { value: 'bar', label: 'Barres', icon: 'pi pi-chart-bar' },
  { value: 'pie', label: 'Camembert', icon: 'pi pi-chart-pie' }
]

const legendColors = ['var(--primary-400)', 'var(--blue-400)', 'var(--green-400)']

const kpiWidgets = computed(() =>
  wizardStore.previewWidgets.filter(w => w.type === 'kpi')
)

const chartWidget = computed(() =>
  wizardStore.previewWidgets.find(w => w.type === 'chart')
)

const kpiCount = computed(() =>
  wizardStore.previewWidgets.filter(w => w.type === 'kpi' && w.sourceKPI).length
)

function getChartIcon(chartType) {
  const icons = {
    line: 'pi pi-chart-line',
    bar: 'pi pi-chart-bar',
    pie: 'pi pi-chart-pie'
  }
  return icons[chartType] || 'pi pi-chart-line'
}

function getLegendColor(index) {
  return legendColors[index % legendColors.length]
}

function getTagName(tagId) {
  const tag = wizardStore.suggestedTags.find(t => t.id === tagId)
  return tag?.display_name || tag?.tag_name || `Tag ${tagId}`
}

function refreshPreview() {
  wizardStore.generatePreview()
}

// Sync name with store
watch(localName, (newValue) => {
  wizardStore.dashboardName = newValue
})

watch(() => wizardStore.dashboardName, (newValue) => {
  if (newValue !== localName.value) {
    localName.value = newValue
  }
})

// Generate preview on mount and when chart type changes
onMounted(() => {
  wizardStore.generatePreview()
})

watch(() => wizardStore.chartType, () => {
  wizardStore.generatePreview()
})
</script>

<style lang="scss" scoped>
.wizard-step-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.name-section {
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-color);
  }

  :deep(.p-inputtext) {
    font-size: 1rem;
    border-radius: 8px;
  }
}

.chart-type-section {
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-color);
  }

  .chart-options {
    display: flex;
    gap: 0.75rem;
  }

  .chart-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: var(--surface-50);
    border: 2px solid var(--surface-200);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;

    i {
      font-size: 1.5rem;
      color: var(--text-color-secondary);
    }

    span {
      font-size: 0.85rem;
      color: var(--text-color-secondary);
    }

    &:hover {
      background: var(--surface-100);
      border-color: var(--surface-300);
    }

    &.selected {
      background: var(--primary-50);
      border-color: var(--primary-400);

      i, span {
        color: var(--primary-600);
      }
    }
  }
}

.preview-section {
  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;

    h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color);
    }
  }

  .preview-container {
    background: var(--surface-100);
    border: 1px solid var(--surface-200);
    border-radius: 12px;
    padding: 1rem;
    min-height: 200px;
  }
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.preview-widget {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  &.kpi-widget {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;

    .widget-icon {
      width: 36px;
      height: 36px;
      background: var(--primary-100);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        color: var(--primary-600);
        font-size: 1rem;
      }
    }

    .widget-content {
      display: flex;
      flex-direction: column;

      .widget-value {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-color);
      }

      .widget-label {
        font-size: 0.7rem;
        color: var(--text-color-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 80px;
      }
    }
  }

  &.chart-widget {
    grid-column: 1 / -1;

    .widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--surface-100);
      font-weight: 500;
      color: var(--text-color);

      i {
        color: var(--text-color-secondary);
      }
    }

    .chart-placeholder {
      padding: 1rem;

      .chart-svg {
        width: 100%;
        height: 120px;
      }

      .chart-legend {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 0.75rem;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-color-secondary);

          .legend-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
        }
      }
    }
  }
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-color-secondary);

  i {
    font-size: 2.5rem;
    opacity: 0.5;
    margin-bottom: 0.5rem;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
  }
}

.summary-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 10px;

  .summary-main {
    display: flex;
    flex-direction: column;
    align-items: center;

    .summary-value {
      font-size: 2rem;
      font-weight: 700;
      color: #7AC943;
    }

    .summary-label {
      font-size: 0.85rem;
      color: var(--text-color-secondary);
    }
  }

  .summary-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--text-color-secondary);
    font-style: italic;

    i { color: var(--blue-400); }
  }
}
</style>
