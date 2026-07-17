<template>
  <div class="metrics-panel" :class="{ 'panel-visible': visible }">
    <div class="panel-header">
      <h3>Métriques Qualité</h3>
      <Button
        icon="pi pi-times"
        text
        rounded
        severity="secondary"
        @click="$emit('close')"
      />
    </div>

    <div class="panel-content">
      <div v-if="loading" class="loading-state">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        <p>Chargement des métriques...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <i class="pi pi-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <Button label="Réessayer" size="small" @click="loadMetrics" />
      </div>

      <div v-else-if="metrics" class="metrics-content">
        <!-- Résumé global -->
        <div class="metrics-summary">
          <div class="summary-card conformity">
            <div class="card-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="card-content">
              <div class="card-label">Taux de conformité</div>
              <div class="card-value">{{ metrics.conformity_rate }}%</div>
            </div>
          </div>

          <div class="summary-card checks">
            <div class="card-icon">
              <i class="pi pi-list"></i>
            </div>
            <div class="card-content">
              <div class="card-label">Total contrôles</div>
              <div class="card-value">{{ metrics.total_checks }}</div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-item conforming">
              <i class="pi pi-check"></i>
              <span class="item-label">Conformes (final)</span>
              <span class="item-value">{{ metrics.conforming }}</span>
            </div>
            <div class="summary-item non-conforming">
              <i class="pi pi-times"></i>
              <span class="item-label">Non conformes</span>
              <span class="item-value">{{ metrics.non_conforming }}</span>
            </div>
          </div>
          <div v-if="metrics.fpy_rate != null" class="summary-card fpy">
            <div class="card-icon">
              <i class="pi pi-star"></i>
            </div>
            <div class="card-content">
              <div class="card-label">Conformes sans retouche</div>
              <div class="card-value">{{ metrics.fpy_rate }}%</div>
            </div>
          </div>
        </div>

        <!-- Métriques par champ -->
        <div v-if="metrics.fields_metrics && metrics.fields_metrics.length > 0" class="fields-metrics">
          <h4>Détails par mesure</h4>

          <div
            v-for="field in metrics.fields_metrics"
            :key="field.field_id"
            class="field-metric-card"
          >
            <div class="field-header">
              <h5>{{ field.label }}</h5>
              <span class="field-type-badge" :class="getTypeBadgeClass(field.type)">
                {{ getTypeLabel(field.type) }}
              </span>
            </div>

            <div class="field-stats">
              <!-- QUALITY_MEASURE -->
              <div v-if="field.type === 'QUALITY_MEASURE'" class="measure-stats">
                <div class="stat-row">
                  <span class="stat-label">Mesures</span>
                  <span class="stat-value">{{ field.total_measurements }}</span>
                </div>
                <div v-if="field.mean !== undefined" class="stat-row">
                  <span class="stat-label">Moyenne</span>
                  <span class="stat-value">{{ field.mean.toFixed(2) }}</span>
                </div>
                <div v-if="field.min !== undefined" class="stat-row">
                  <span class="stat-label">Min - Max</span>
                  <span class="stat-value">{{ field.min.toFixed(2) }} - {{ field.max.toFixed(2) }}</span>
                </div>
                <div v-if="field.std_dev !== undefined" class="stat-row">
                  <span class="stat-label">Écart-type</span>
                  <span class="stat-value">{{ field.std_dev.toFixed(2) }}</span>
                </div>
                <div v-if="field.conformity_rate !== undefined" class="stat-row highlight">
                  <span class="stat-label">Taux de conformité</span>
                  <span class="stat-value">{{ field.conformity_rate.toFixed(1) }}%</span>
                </div>
              </div>

              <!-- QUALITY_VISUAL -->
              <div v-if="field.type === 'QUALITY_VISUAL'" class="visual-stats">
                <div class="stat-row">
                  <span class="stat-label">Inspections</span>
                  <span class="stat-value">{{ field.total_measurements }}</span>
                </div>
                <div class="stat-row conforming">
                  <i class="pi pi-check"></i>
                  <span class="stat-label">Conformes (1ère passe)</span>
                  <span class="stat-value">{{ field.conforming }}</span>
                </div>
                <div v-if="field.retouched" class="stat-row retouched">
                  <i class="pi pi-refresh"></i>
                  <span class="stat-label">Après retouche</span>
                  <span class="stat-value">{{ field.retouched }}</span>
                </div>
                <div class="stat-row non-conforming">
                  <i class="pi pi-times"></i>
                  <span class="stat-label">Non conformes</span>
                  <span class="stat-value">{{ field.non_conforming }}</span>
                </div>
                <div v-if="field.to_review" class="stat-row review">
                  <i class="pi pi-exclamation-triangle"></i>
                  <span class="stat-label">À revoir</span>
                  <span class="stat-value">{{ field.to_review }}</span>
                </div>
                <div v-if="field.fpy_rate != null" class="stat-row highlight-fpy">
                  <span class="stat-label">Conformes sans retouche</span>
                  <span class="stat-value">{{ field.fpy_rate.toFixed(1) }}%</span>
                </div>
                <div v-if="field.conformity_rate != null" class="stat-row highlight">
                  <span class="stat-label">Taux final (avec retouches)</span>
                  <span class="stat-value">{{ field.conformity_rate.toFixed(1) }}%</span>
                </div>
              </div>

              <!-- QUALITY_COUNT (Non-conformités) -->
              <div v-if="field.type === 'QUALITY_COUNT'" class="count-stats">
                <div class="stat-row">
                  <span class="stat-label">Total pièces du lot</span>
                  <span class="stat-value">{{ field.total_pieces ?? '—' }}</span>
                </div>
                <div class="stat-row non-conforming">
                  <i class="pi pi-times"></i>
                  <span class="stat-label">Pièces non conformes</span>
                  <span class="stat-value">{{ field.total_nc }}</span>
                </div>
                <div v-if="field.conforming_pieces !== undefined" class="stat-row conforming">
                  <i class="pi pi-check"></i>
                  <span class="stat-label">Pièces conformes</span>
                  <span class="stat-value">{{ field.conforming_pieces }}</span>
                </div>
                <div v-if="field.nc_rate !== undefined" class="stat-row highlight" :class="field.is_conforming ? '' : 'highlight-danger'">
                  <span class="stat-label">Taux NC</span>
                  <span class="stat-value">{{ field.nc_rate }}%</span>
                </div>
                <div v-if="field.threshold_pct !== undefined" class="stat-row">
                  <span class="stat-label">Seuil acceptable</span>
                  <span class="stat-value">{{ field.threshold_pct }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-data">
          <i class="pi pi-info-circle"></i>
          <p>Aucune donnée qualité disponible</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { useQualityStore } from '../stores/qualityStore'

const props = defineProps({
  instanceId: {
    type: Number,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  },
  localMetrics: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const qualityStore = useQualityStore()

const remoteMetrics = ref(null)
const loading = ref(false)
const error = ref(null)

// Utiliser les métriques locales (temps réel) si disponibles, sinon fallback API
const metrics = computed(() => props.localMetrics || remoteMetrics.value)

const loadMetrics = async () => {
  // Pas besoin d'appeler le backend si on a des métriques locales
  if (props.localMetrics) return

  loading.value = true
  error.value = null

  try {
    const result = await qualityStore.fetchQualityMetrics(props.instanceId)

    if (result.success) {
      remoteMetrics.value = result.data
    } else {
      error.value = result.error || 'Erreur lors du chargement des métriques'
    }
  } catch (err) {
    console.error('Erreur loadMetrics:', err)
    error.value = 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}

const getTypeLabel = (type) => {
  const labels = {
    'QUALITY_MEASURE': 'Mesure',
    'QUALITY_VISUAL': 'Visuel',
    'QUALITY_COUNT': 'Non-conf.'
  }
  return labels[type] || type
}

const getTypeBadgeClass = (type) => {
  const classes = {
    'QUALITY_MEASURE': 'badge-measure',
    'QUALITY_VISUAL': 'badge-visual',
    'QUALITY_COUNT': 'badge-count'
  }
  return classes[type] || ''
}

// Charger les métriques quand le panneau devient visible
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadMetrics()
  }
})

// Charger au montage si déjà visible
onMounted(() => {
  if (props.visible) {
    loadMetrics()
  }
})
</script>

<style scoped>
.metrics-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 420px;
  background: white;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.metrics-panel.panel-visible {
  transform: translateX(0);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.75rem 2rem;
  border-bottom: none;
  background: #334155;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.loading-state,
.error-state,
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #64748b;
}

.error-state i,
.no-data i {
  font-size: 3rem;
  color: #94a3b8;
}

.metrics-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  background: #f1f5f9;
  transition: background 0.15s ease;
}

.summary-card:hover {
  background: #e9eef4;
}

.summary-card.conformity {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.summary-card.checks {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.summary-card.fpy {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #e2e8f0;
  border-radius: 8px;
  font-size: 1.125rem;
  color: #475569;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  font-weight: 600;
}

.card-value {
  font-size: 1.375rem;
  font-weight: 700;
  margin-top: 0.2rem;
  line-height: 1;
  color: #1e293b;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  border: 1px solid transparent;
}

.summary-item.conforming {
  background: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}

.summary-item.non-conforming {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

.summary-item i {
  font-size: 1rem;
}

.item-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}

.item-value {
  font-size: 1.125rem;
  font-weight: 700;
}

.fields-metrics h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-metric-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
}

.field-metric-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f1f5f9;
}

.field-header h5 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  flex: 1;
}

.field-type-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.badge-measure {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.badge-visual {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.badge-count {
  background: #fce7f3;
  color: #831843;
  border: 1px solid #f9a8d4;
}

.field-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: background 0.15s ease;
}

.stat-row:hover {
  background: #f1f5f9;
}

.stat-row.highlight {
  background: #dbeafe;
  border: 1px solid #93c5fd;
  font-weight: 600;
}

.stat-row.highlight-danger {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  font-weight: 600;
  color: #991b1b;
}

.stat-row.conforming {
  color: #166534;
  background: #f0fdf4;
}

.stat-row.conforming:hover {
  background: #dcfce7;
}

.stat-row.non-conforming {
  color: #991b1b;
  background: #fef2f2;
}

.stat-row.non-conforming:hover {
  background: #fee2e2;
}

.stat-row.review {
  color: #ea580c;
  background: #fff7ed;
}

.stat-row.review:hover {
  background: #ffedd5;
}

.stat-row.retouched {
  color: #1d4ed8;
  background: #eff6ff;
}

.stat-row.retouched:hover {
  background: #dbeafe;
}

.stat-row.highlight-fpy {
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  font-weight: 600;
  color: #334155;
}

.stat-row i {
  margin-right: 0.5rem;
  font-size: 0.875rem;
}

.stat-label {
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-value {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}
</style>
