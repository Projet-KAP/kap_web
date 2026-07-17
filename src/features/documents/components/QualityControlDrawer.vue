<template>
  <Drawer
    v-model:visible="isVisible"
    position="full"
    :header="drawerTitle"
    :style="{ width: '100%' }"
    @hide="handleClose"
  >
    <template #header>
      <div class="quality-drawer-header">
        <div class="header-left">
          <div class="header-text">
            <h2>Contrôle Qualité</h2>
            <p v-if="documentInstance">
              <i class="pi pi-file"></i>
              {{ documentInstance.modele_nom }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <Button
            label="Ajouter mesure"
            icon="pi pi-plus"
            @click="showAddFieldModal = true"
            class="add-measure-btn"
          />
          <Button
            :label="showMetrics ? 'Masquer métriques' : 'Afficher métriques'"
            icon="pi pi-chart-bar"
            severity="secondary"
            @click="toggleMetrics"
            class="metrics-btn"
          />
        </div>
      </div>
    </template>

    <div class="quality-drawer-content">
      <div v-if="loading" class="loading-overlay">
        <ProgressSpinner style="width: 60px; height: 60px" strokeWidth="4" />
        <p>Chargement des données qualité...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <i class="pi pi-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <Button label="Réessayer" @click="loadQualityData" />
      </div>

      <div v-else-if="documentInstance" class="quality-content">
        <!-- État vide -->
        <div v-if="!hasQualityFields" class="no-quality-fields">
          <i class="pi pi-info-circle"></i>
          <h3>Aucune mesure qualité configurée</h3>
          <p>Cliquez sur "Ajouter mesure" pour commencer à configurer les contrôles qualité pour ce document.</p>
          <Button label="Ajouter première mesure" icon="pi pi-plus" @click="showAddFieldModal = true" />
        </div>

        <!-- Liste des mesures (lecture seule — valeurs saisies dans la grille) -->
        <div v-else class="measures-list">
          <div
            v-for="field in qualityFields"
            :key="field.id"
            class="measure-row"
            :class="getMeasureRowClass(field)"
          >
            <!-- Indicateur statut -->
            <div class="measure-status-dot" :class="getMeasureStatusClass(field)"></div>

            <!-- Info mesure -->
            <div class="measure-info">
              <div class="measure-name">{{ field.label }}</div>
              <div class="measure-type-badge" :class="'type-' + field.type.toLowerCase()">
                {{ getTypeLabel(field.type) }}
              </div>
              <div v-if="field.type === 'QUALITY_MEASURE' && field.configuration" class="measure-tolerance">
                <span v-if="field.configuration.target_value != null">Cible : {{ field.configuration.target_value }} {{ field.configuration.unit }}</span>
                <span v-if="field.configuration.tolerance_min != null && field.configuration.tolerance_max != null">
                  [ {{ field.configuration.tolerance_min }} – {{ field.configuration.tolerance_max }} {{ field.configuration.unit }} ]
                </span>
              </div>
              <div v-if="field.type === 'QUALITY_COUNT' && field.configuration" class="measure-tolerance">
                Lot : {{ field.configuration.total_pieces }} pièces · Seuil NC : {{ field.configuration.threshold_pct ?? 5 }}%
              </div>
            </div>

            <!-- Valeur saisie dans la grille (lecture seule — résumé) -->
            <div class="measure-value-display">
              <template v-if="getValues(field).length > 0">
                <!-- QUALITY_MEASURE : affiche min / max / count -->
                <template v-if="field.type === 'QUALITY_MEASURE'">
                  <span class="measure-value-summary">
                    <span class="summary-count">{{ getValues(field).length }} mesure{{ getValues(field).length > 1 ? 's' : '' }}</span>
                    <span class="summary-range">
                      {{ Math.min(...getValues(field).map(v => parseFloat(v)).filter(v => !isNaN(v))).toFixed(1) }}
                      –
                      {{ Math.max(...getValues(field).map(v => parseFloat(v)).filter(v => !isNaN(v))).toFixed(1) }}
                      <span class="measure-unit">{{ field.configuration?.unit }}</span>
                    </span>
                  </span>
                </template>
                <!-- QUALITY_VISUAL : compte Conforme / NC / À revoir -->
                <template v-else-if="field.type === 'QUALITY_VISUAL'">
                  <span class="measure-value-summary">
                    <span class="summary-count">{{ getValues(field).length }} saisie{{ getValues(field).length > 1 ? 's' : '' }}</span>
                    <span class="summary-pills">
                      <span v-if="getValidation(field)?.conforming_count" class="pill-ok">{{ getValidation(field).conforming_count }} ✓</span>
                      <span v-if="getValidation(field)?.retouched_count" class="pill-retouche">{{ getValidation(field).retouched_count }} ↺</span>
                      <span v-if="getValidation(field)?.nc_count" class="pill-nok">{{ getValidation(field).nc_count }} ✗</span>
                      <span v-if="getValidation(field)?.review_count" class="pill-review">{{ getValidation(field).review_count }} ?</span>
                    </span>
                  </span>
                </template>
                <!-- QUALITY_COUNT : total NC -->
                <template v-else-if="field.type === 'QUALITY_COUNT'">
                  <span class="measure-value-summary">
                    <span class="summary-count">{{ getValues(field).length }} lot{{ getValues(field).length > 1 ? 's' : '' }}</span>
                    <span class="summary-range">
                      {{ getValues(field).reduce((s, v) => s + (parseInt(v) || 0), 0) }}
                      <span class="measure-unit">NC total</span>
                    </span>
                  </span>
                </template>
              </template>
              <span v-else class="measure-no-value">Non saisi</span>
            </div>

            <!-- Résultat qualité calculé -->
            <div class="measure-result">
              <div v-if="measureValues[field.id] != null" class="result-badge" :class="getValidationClass(field)">
                <i :class="getValidationIcon(field)"></i>
                <span>{{ getValidationLabel(field) }}</span>
              </div>
              <div v-else class="result-empty">—</div>
            </div>

            <!-- Actions -->
            <div class="measure-actions">
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                v-tooltip.top="'Supprimer cette mesure'"
                @click="deleteField(field)"
                :disabled="deletingFieldId === field.id"
              />
            </div>
          </div>

          <!-- Info : saisie dans la grille -->
          <div class="saisie-hint">
            <i class="pi pi-info-circle"></i>
            Les valeurs sont saisies directement dans le document via le bouton <strong>Saisir</strong>.
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'ajout de champ qualité -->
    <AddQualityFieldModal
      v-model:visible="showAddFieldModal"
      :instance-id="instanceId"
      @field-added="onFieldAdded"
    />

    <!-- Panneau métriques qualité -->
    <QualityMetricsPanel
      :instance-id="instanceId"
      :visible="showMetrics"
      :local-metrics="localMetrics"
      @close="showMetrics = false"
    />
  </Drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Drawer from 'primevue/drawer'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { useDocumentStore } from '../stores/documentStore'
import { useQualityStore } from '../stores/qualityStore'
import AddQualityFieldModal from './AddQualityFieldModal.vue'
import QualityMetricsPanel from './QualityMetricsPanel.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  instanceId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'refresh'])

const documentStore = useDocumentStore()
const qualityStore = useQualityStore()
const toast = useToast()

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const documentInstance = ref(null)
const loading = ref(false)
const error = ref(null)
const showAddFieldModal = ref(false)
const showMetrics = ref(false)
const measureValues = ref({})
const deletingFieldId = ref(null)

const getTypeLabel = (type) => {
  if (type === 'QUALITY_MEASURE') return 'Mesure'
  if (type === 'QUALITY_VISUAL') return 'Visuel'
  if (type === 'QUALITY_COUNT') return 'Non-conf.'
  return type
}

// Les valeurs dans donnees_remplies sont des tableaux (une valeur par ligne de grille)
const getValues = (field) => {
  const raw = measureValues.value[field.id]
  if (raw == null) return []
  const arr = Array.isArray(raw) ? raw : [raw]
  return arr.filter(v => v !== null && v !== undefined && v !== '')
}

const getValidation = (field) => {
  const values = getValues(field)
  if (values.length === 0) return null

  const cfg = field.configuration || {}

  if (field.type === 'QUALITY_MEASURE') {
    const nums = values.map(v => parseFloat(v)).filter(v => !isNaN(v))
    if (nums.length === 0) return null
    const { tolerance_min, tolerance_max } = cfg
    if (tolerance_min != null && tolerance_max != null) {
      const conforming = nums.filter(v => v >= tolerance_min && v <= tolerance_max).length
      const rate = Math.round(conforming / nums.length * 100)
      return {
        valid: true,
        conforming: conforming === nums.length,
        conforming_count: conforming,
        total: nums.length,
        rate,
        message: `${conforming}/${nums.length} conformes (${rate}%)`
      }
    }
    return { valid: true, conforming: true, total: nums.length, message: `${nums.length} mesures` }
  }

  if (field.type === 'QUALITY_VISUAL') {
    // Lire le tableau compagnon "retouche" (checkbox field_id + '_retouche')
    const retoucheRaw = measureValues.value[field.id + '_retouche']
    const retoucheFlags = Array.isArray(retoucheRaw) ? retoucheRaw : []

    let conformes = 0, retouches = 0, nc = 0, aRevoir = 0
    values.forEach((v, i) => {
      const isRetouche = !!retoucheFlags[i]
      if (v === 'Conforme') {
        if (isRetouche) retouches++
        else conformes++
      } else if (v === 'Non conforme') nc++
      else if (v === 'À revoir') aRevoir++
    })
    const counted = conformes + retouches + nc
    const finalOk = conformes + retouches
    const rate = counted > 0 ? Math.round(finalOk / counted * 100) : null
    const fpy = counted > 0 ? Math.round(conformes / counted * 100) : null
    return {
      valid: true,
      conforming: nc === 0 && finalOk > 0,
      conforming_count: conformes,
      retouched_count: retouches,
      nc_count: nc,
      review_count: aRevoir,
      total: values.length,
      rate,
      fpy,
      message: counted > 0
        ? `${finalOk}/${counted} OK (${fpy}% sans retouche)${aRevoir > 0 ? ` · ${aRevoir} à revoir` : ''}`
        : `${aRevoir} à revoir`
    }
  }

  if (field.type === 'QUALITY_COUNT') {
    const totalPieces = (cfg.total_pieces || 0) * values.length
    const totalNC = values.reduce((sum, v) => sum + (parseInt(v) || 0), 0)
    const threshold = cfg.threshold_pct ?? 5
    const rate = totalPieces > 0 ? Math.round(totalNC / totalPieces * 1000) / 10 : 0
    const isConforming = rate <= threshold
    return {
      valid: true,
      conforming: isConforming,
      total_nc: totalNC,
      total_pieces: totalPieces,
      rate,
      threshold,
      message: totalPieces > 0
        ? `${totalNC} NC / ${totalPieces} pièces → ${rate}%`
        : `${totalNC} NC total`
    }
  }

  return null
}

const getMeasureStatusClass = (field) => {
  const v = getValidation(field)
  if (!v) return 'status-empty'
  if (!v.valid) return 'status-invalid'
  return v.conforming ? 'status-ok' : 'status-nok'
}

const getMeasureRowClass = (field) => {
  const v = getValidation(field)
  if (!v) return ''
  if (!v.valid) return 'row-invalid'
  return v.conforming ? 'row-ok' : 'row-nok'
}

const getValidationClass = (field) => {
  const v = getValidation(field)
  if (!v) return ''
  if (!v.valid) return 'badge-invalid'
  return v.conforming ? 'badge-ok' : 'badge-nok'
}

const getValidationIcon = (field) => {
  const v = getValidation(field)
  if (!v) return ''
  if (!v.valid) return 'pi pi-times'
  return v.conforming ? 'pi pi-check' : 'pi pi-times'
}

const getValidationLabel = (field) => {
  const v = getValidation(field)
  if (!v) return ''
  return v.message || (v.conforming ? 'Conforme' : 'Non conforme')
}

const drawerTitle = computed(() => {
  if (!documentInstance.value) return 'Contrôle Qualité'
  return `Contrôle Qualité - ${documentInstance.value.modele_nom || ''}`
})

const qualityFields = computed(() => {
  if (!documentInstance.value) return []
  // Les champs qualité sont spécifiques à l'instance (liés via instance FK)
  return (documentInstance.value.quality_fields || [])
    .filter(f => ['QUALITY_MEASURE', 'QUALITY_VISUAL', 'QUALITY_COUNT'].includes(f.field_type))
    .map(f => ({ ...f, pk: f.id, id: f.field_id, type: f.field_type }))
})

const hasQualityFields = computed(() => qualityFields.value.length > 0)

// Métriques calculées localement (temps réel, sans appel backend)
const localMetrics = computed(() => {
  const fields = qualityFields.value
  if (fields.length === 0) return null

  let totalChecks = 0
  let totalConforming = 0
  let totalNC = 0
  let totalFPYConforming = 0
  let totalFPYCounted = 0
  const fieldsMetrics = []

  for (const field of fields) {
    const validation = getValidation(field)
    if (!validation) continue

    if (field.type === 'QUALITY_VISUAL') {
      const counted = (validation.conforming_count || 0) + (validation.retouched_count || 0) + (validation.nc_count || 0)
      totalChecks += counted
      totalConforming += (validation.conforming_count || 0) + (validation.retouched_count || 0)
      totalNC += validation.nc_count || 0
      totalFPYConforming += validation.conforming_count || 0
      totalFPYCounted += counted
      fieldsMetrics.push({ field_id: field.id, label: field.label, type: field.type, validation })
    } else if (field.type === 'QUALITY_MEASURE') {
      totalChecks += validation.total || 0
      totalConforming += validation.conforming_count || 0
      totalNC += (validation.total || 0) - (validation.conforming_count || 0)
      fieldsMetrics.push({ field_id: field.id, label: field.label, type: field.type, validation })
    } else if (field.type === 'QUALITY_COUNT') {
      totalChecks += validation.total_pieces || 0
      totalNC += validation.total_nc || 0
      totalConforming += (validation.total_pieces || 0) - (validation.total_nc || 0)
      fieldsMetrics.push({ field_id: field.id, label: field.label, type: field.type, validation })
    }
  }

  const conformityRate = totalChecks > 0 ? Math.round(totalConforming / totalChecks * 100) : 0
  const fpyRate = totalFPYCounted > 0 ? Math.round(totalFPYConforming / totalFPYCounted * 100) : null

  return {
    conformity_rate: conformityRate,
    total_checks: totalChecks,
    conforming: totalConforming,
    non_conforming: totalNC,
    fpy_rate: fpyRate,
    fields_metrics: fieldsMetrics,
  }
})

const loadQualityData = async () => {
  loading.value = true
  error.value = null

  try {
    const instanceResult = await documentStore.getInstance(props.instanceId)
    if (!instanceResult.success) {
      throw new Error(instanceResult.error || 'Impossible de charger l\'instance')
    }
    documentInstance.value = instanceResult.data

    // Initialiser measureValues depuis donnees_remplies
    // Toujours null (jamais undefined) pour éviter NaN dans InputNumber
    const filled = instanceResult.data.donnees_remplies || {}
    measureValues.value = {}
    for (const f of qualityFields.value) {
      const raw = filled[f.id]
      measureValues.value[f.id] = (raw !== undefined && raw !== null && raw !== '') ? raw : null
    }
  } catch (err) {
    console.error('Erreur loadQualityData:', err)
    error.value = err.message || 'Une erreur est survenue lors du chargement'
  } finally {
    loading.value = false
  }
}


const onFieldAdded = async (newField) => {
  toast.add({
    severity: 'success',
    summary: 'Champ ajouté',
    detail: `Le champ "${newField.label}" a été ajouté avec succès`,
    life: 3000
  })

  // Recharger en bypassant le cache pour voir le nouveau champ
  qualityStore.clearMetricsCache(props.instanceId)
  await loadQualityData()
}

const deleteField = async (field) => {
  deletingFieldId.value = field.id
  try {
    const modeleId = documentInstance.value?.modele
    if (!modeleId) throw new Error('Modèle introuvable')
    const result = await documentStore.deleteField(modeleId, field.pk)
    if (!result?.success) throw new Error(result?.error || 'Suppression échouée')
    toast.add({ severity: 'success', summary: 'Mesure supprimée', life: 2000 })
    qualityStore.clearMetricsCache(props.instanceId)
    await loadQualityData()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: err.message, life: 3000 })
  } finally {
    deletingFieldId.value = null
  }
}

const toggleMetrics = () => {
  showMetrics.value = !showMetrics.value
}

const handleClose = () => {
  showAddFieldModal.value = false
  showMetrics.value = false
  qualityStore.resetState()
}

// Charger les données quand le drawer s'ouvre
// immediate: true car le composant peut être créé avec visible=true d'emblée (batching Vue 3)
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadQualityData()
  } else {
    handleClose()
  }
}, { immediate: true })
</script>

<style scoped>
.quality-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1.5rem 2rem;
  background: #334155;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}


.header-text h2 {
  margin: 0;
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.header-text p {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0 0 0;
  font-size: 0.9375rem;
  opacity: 0.95;
  font-weight: 500;
}

.header-text p i {
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.add-measure-btn {
  background: #059669 !important;
  border-color: #059669 !important;
  font-weight: 600 !important;
  padding: 0.625rem 1.25rem !important;
  transition: all 0.2s ease !important;
}

.add-measure-btn:hover {
  background: #047857 !important;
  border-color: #047857 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
}

.metrics-btn {
  font-weight: 600 !important;
  padding: 0.625rem 1.25rem !important;
}

.quality-drawer-content {
  position: relative;
  height: calc(100vh - 120px);
  overflow: hidden;
}

.loading-overlay,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  height: 100%;
  color: #64748b;
}

.error-state i {
  font-size: 4rem;
  color: #ef4444;
}

.quality-grid-container {
  height: 100%;
  overflow: auto;
}

.no-quality-fields {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  height: 100%;
  padding: 3rem;
  text-align: center;
  color: #64748b;
}

.no-quality-fields i {
  font-size: 5rem;
  color: #cbd5e1;
  opacity: 0.7;
}

.no-quality-fields h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.no-quality-fields p {
  margin: 0;
  max-width: 550px;
  line-height: 1.7;
  font-size: 1rem;
  color: #64748b;
}

.no-quality-fields button {
  margin-top: 0.5rem;
  padding: 0.75rem 1.5rem !important;
  font-weight: 600 !important;
  font-size: 0.9375rem !important;
}

.quality-grid {
  height: 100%;
  padding: 1rem;
}

/* ---- MEASURES LIST ---- */
.quality-content {
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

.measures-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 960px;
  margin: 0 auto;
}

.measure-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.measure-row:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.measure-row.row-ok {
  border-left: 4px solid #10b981;
  background: #f0fdf4;
}

.measure-row.row-nok {
  border-left: 4px solid #ef4444;
  background: #fef2f2;
}

.measure-row.row-invalid {
  border-left: 4px solid #f59e0b;
  background: #fffbeb;
}

/* Status dot */
.measure-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-empty  { background: #cbd5e1; }
.status-ok     { background: #10b981; }
.status-nok    { background: #ef4444; }
.status-invalid { background: #f59e0b; }

/* Info section */
.measure-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.measure-name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.measure-type-badge {
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  width: fit-content;
}

.type-quality_measure { background: #dbeafe; color: #1d4ed8; }
.type-quality_visual  { background: #ede9fe; color: #7c3aed; }
.type-quality_count   { background: #fef3c7; color: #b45309; }

.measure-tolerance {
  font-size: 0.8125rem;
  color: #64748b;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Valeur affichée (lecture seule) */
.measure-value-display {
  flex-shrink: 0;
  min-width: 140px;
  text-align: right;
}

.measure-value-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.summary-count {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.summary-range {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  justify-content: flex-end;
}

.summary-pills {
  display: flex;
  gap: 0.3rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.pill-ok, .pill-nok, .pill-review {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
}

.pill-ok      { background: #d1fae5; color: #065f46; }
.pill-retouche { background: #dbeafe; color: #1d4ed8; }
.pill-nok     { background: #fee2e2; color: #991b1b; }
.pill-review  { background: #fef3c7; color: #92400e; }

.measure-no-value {
  font-size: 0.8125rem;
  color: #94a3b8;
  font-style: italic;
}

.measure-unit {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 400;
  white-space: nowrap;
}

/* Hint saisie grille */
.saisie-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #64748b;
  margin-top: 0.5rem;
}

.saisie-hint i {
  color: #3b82f6;
  flex-shrink: 0;
}

/* Result badge */
.measure-result {
  flex-shrink: 0;
  min-width: 110px;
  text-align: center;
}

.result-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
}

.badge-ok    { background: #d1fae5; color: #065f46; }
.badge-nok   { background: #fee2e2; color: #991b1b; }
.badge-invalid { background: #fef3c7; color: #92400e; }

.result-empty {
  color: #cbd5e1;
  font-size: 1.125rem;
}

/* Actions */
.measure-actions {
  flex-shrink: 0;
}

/* Save bar */
.save-bar {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 0;
  border-top: 1px solid #e2e8f0;
  margin-top: 0.5rem;
}
</style>
