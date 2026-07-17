<template>
  <div class="dynamic-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-title">
          <Button
            icon="pi pi-arrow-left"
            severity="secondary"
            text
            rounded
            @click="goBack"
            class="back-button"
          />
          <div>
            <h1>{{ typeDisplayName }}</h1>
            <p class="subtitle">{{ typeDescription }}</p>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <Select
          v-model="selectedProjet"
          :options="projets"
          optionLabel="nom"
          optionValue="id"
          placeholder="Tous les projets"
          :showClear="true"
          class="projet-select"
          @change="onProjetChange"
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="projet-value">
              <i class="pi pi-briefcase"></i>
              <span>{{ getProjetName(slotProps.value) }}</span>
            </div>
            <span v-else>Tous les projets</span>
          </template>
          <template #option="slotProps">
            <div class="projet-option">
              <i class="pi pi-briefcase"></i>
              <span>{{ slotProps.option.nom }}</span>
            </div>
          </template>
        </Select>
        <Button
          icon="pi pi-refresh"
          label="Actualiser"
          @click="loadData"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !hasConfig" class="loading-state">
      <ProgressSpinner />
      <p>Chargement des données...</p>
    </div>

    <!-- Empty State - Select a report -->
    <div v-else-if="!hasConfig || typeConfig.total_rows === 0" class="setup-state">
      <!-- Demander de selectionner un projet d'abord -->
      <div v-if="!selectedProjet" class="select-project-first">
        <div class="select-project-icon">
          <i class="pi pi-briefcase"></i>
        </div>
        <h2>Sélectionnez un projet</h2>
        <p>Pour configurer le suivi {{ typeDisplayName }}, vous devez d'abord sélectionner un projet.</p>
        <div class="select-project-actions">
          <Select
            v-model="selectedProjet"
            :options="projets"
            optionLabel="nom"
            optionValue="id"
            placeholder="Choisir un projet..."
            class="large-projet-select"
            @change="onProjetChange"
          />
          <span class="or-text">ou</span>
          <Button
            label="Créer un projet"
            icon="pi pi-plus"
            severity="secondary"
            @click="goToProjects"
          />
        </div>
      </div>

      <!-- Configuration pour le projet selectionne -->
      <div v-else class="setup-header">
        <i class="pi pi-file-edit"></i>
        <div>
          <h2>Configurer {{ typeDisplayName }}</h2>
          <p>
            Configuration pour le projet
            <Tag :value="getProjetName(selectedProjet)" severity="info" class="projet-tag" />
          </p>
          <p class="hint">Les données importées seront liées à ce projet</p>
        </div>
      </div>

      <!-- Loading reports -->
      <div v-if="selectedProjet && loadingReports" class="loading-reports">
        <ProgressSpinner style="width: 40px; height: 40px" />
        <span>Chargement des rapports...</span>
      </div>

      <!-- Reports list -->
      <div v-else-if="selectedProjet && availableReports.length > 0" class="reports-section">
        <h3>Rapports disponibles</h3>
        <div class="reports-grid">
          <Card
            v-for="report in availableReports"
            :key="report.id"
            :class="['report-card', { selected: selectedReports.includes(report.id) }]"
            @click="toggleReportSelection(report)"
          >
            <template #content>
              <div class="report-content">
                <Checkbox
                  :modelValue="selectedReports.includes(report.id)"
                  :binary="true"
                  @click.stop
                  @update:modelValue="toggleReportSelection(report)"
                />
                <div class="report-info">
                  <span class="report-name">{{ report.name || report.nom }}</span>
                  <span class="report-meta">
                    {{ report.rows_count || 0 }} lignes
                    <span v-if="report.columns_count"> | {{ report.columns_count }} colonnes</span>
                  </span>
                </div>
                <Tag
                  v-if="report.status"
                  :value="report.status"
                  :severity="getStatusSeverity(report.status)"
                />
              </div>
            </template>
          </Card>
        </div>

        <div class="setup-actions">
          <Button
            label="Analyser avec l'IA"
            icon="pi pi-sparkles"
            :disabled="selectedReports.length === 0"
            :loading="analyzing"
            @click="analyzeSelectedReports"
          />
          <span v-if="selectedReports.length > 0" class="selection-count">
            {{ selectedReports.length }} rapport(s) selectionne(s)
          </span>
        </div>
      </div>

      <!-- No reports available for the selected project -->
      <div v-else-if="selectedProjet" class="no-reports">
        <i class="pi pi-inbox"></i>
        <p>Aucun rapport disponible</p>
        <p class="hint">Créez d'abord des rapports dans la section Documents ou Collecte</p>
        <div class="no-reports-actions">
          <Button
            label="Créer un rapport"
            icon="pi pi-plus"
            @click="goToDocuments"
          />
          <Button
            label="Utiliser l'assistant IA"
            icon="pi pi-sparkles"
            severity="secondary"
            @click="showAIDialog = true"
          />
        </div>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- KPI Grid dynamique -->
      <DynamicKPIGrid
        :tags="typeConfig.kpi_tags || []"
        :aggregations="aggregations"
        :max-cards="4"
      />

      <!-- Data Table dynamique -->
      <DynamicDataTable
        :tags="typeConfig.table_tags || []"
        :data="dashboardData"
        :title="`Detail ${typeDisplayName}`"
        :loading="loading"
      />
    </div>

    <!-- AI Assistant Button -->
    <AIAssistantButton @click="showAIDialog = true" />

    <!-- AI Assistant Dialog -->
    <AIAssistantDialog
      v-model:visible="showAIDialog"
      :tag-type="type"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProductionStore } from '../stores/productionStore'
import { useToast } from 'primevue/usetoast'
import { axiosInstance } from '@/main'
import DynamicKPIGrid from '../components/DynamicKPIGrid.vue'
import DynamicDataTable from '../components/DynamicDataTable.vue'
import AIAssistantButton from '../components/AIAssistantButton.vue'
import AIAssistantDialog from '../components/AIAssistantDialog.vue'

const props = defineProps({
  type: {
    type: String,
    required: true
  }
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const productionStore = useProductionStore()

const { typeConfig, loading, dashboard, aggregated } = storeToRefs(productionStore)

const showAIDialog = ref(false)
const loadingReports = ref(false)
const availableReports = ref([])
const selectedReports = ref([])
const analyzing = ref(false)

// Projets
const projets = ref([])
const selectedProjet = ref(null)

// Normaliser le type en majuscules
const normalizedType = computed(() => {
  return props.type?.toUpperCase() || ''
})

// Computed
const hasConfig = computed(() => {
  return typeConfig.value && Object.keys(typeConfig.value).length > 0
})

const aggregations = computed(() => {
  return typeConfig.value?.aggregations || aggregated.value || {}
})

const dashboardData = computed(() => {
  return dashboard.value?.data || []
})

const typeDisplayName = computed(() => {
  const names = {
    TERRASSEMENT: 'Suivi Terrassement',
    BETON: 'Suivi Beton',
    FINANCIER: 'Suivi Financier',
    PLANNING: 'Suivi Planning',
    MATERIAUX: 'Suivi Materiaux',
    TRANSPORT: 'Suivi Transport',
    PRODUCTION: 'Suivi Production',
    QUALITE: 'Suivi Qualité',
    MAINTENANCE: 'Suivi Maintenance',
    ENERGIE: 'Suivi Energie',
    SECURITE: 'Suivi Sécurité'
  }
  return names[normalizedType.value] || typeConfig.value?.type_display || normalizedType.value
})

const typeDescription = computed(() => {
  const descriptions = {
    TERRASSEMENT: 'Volumes deblai/remblai et heures engin par chantier',
    BETON: 'Coulages, résistances et conformité par chantier',
    FINANCIER: 'Factures, dépenses et marge par chantier',
    PLANNING: 'Avancement et jalons du chantier',
    MATERIAUX: 'Receptions et mouvements de materiaux',
    TRANSPORT: 'Suivi des livraisons et rotations',
    PRODUCTION: 'Indicateurs de production',
    QUALITE: 'Contrôles et conformité',
    MAINTENANCE: 'Interventions et disponibilité',
    ENERGIE: 'Consommations energetiques',
    SECURITE: 'Incidents et conformité sécurité'
  }
  return descriptions[normalizedType.value] || 'Suivi des indicateurs'
})

// Methods
const loadProjets = async () => {
  try {
    const response = await axiosInstance.get('/projets/projets/', {
      params: { page_size: 100 }
    })
    // DRF pagination returns { results: [...] }, sinon c'est un array direct
    const data = response.data.results || response.data
    projets.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error loading projets:', error)
    projets.value = []
  }
}

const getProjetName = (projetId) => {
  const projet = projets.value.find(p => p.id === projetId)
  return projet?.nom || `Projet #${projetId}`
}

const onProjetChange = async () => {
  await loadData()
  // Recharger les rapports si on est dans l'etat de configuration
  if (!hasConfig.value || typeConfig.value.total_rows === 0) {
    await loadAvailableReports()
  }
}

const loadData = async () => {
  try {
    const projetId = selectedProjet.value || null

    // Charger la configuration du type
    await productionStore.loadTypeConfig(projetId, normalizedType.value)

    // Charger les donnees du dashboard
    await productionStore.loadDashboard(projetId, 'CHANTIER', normalizedType.value)
  } catch (error) {
    console.error('Error loading data:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données',
      life: 3000
    })
  }
}

const goBack = () => {
  router.push('/production')
}

const goToDocuments = () => {
  router.push('/documents')
}

const goToProjects = () => {
  router.push('/projets')
}

const loadAvailableReports = async () => {
  loadingReports.value = true
  try {
    const params = {
      status: 'SUBMITTED',
      page_size: 50
    }

    // Filtrer par projet si un projet est selectionne
    if (selectedProjet.value) {
      params.projet_id = selectedProjet.value
    }

    // Charger les documents instances (rapports soumis)
    const response = await axiosInstance.get('/documents/instances/', { params })
    // L'API retourne { success: true, data: [...], pagination: {...} }
    const documents = response.data.data || response.data.results || []
    availableReports.value = Array.isArray(documents) ? documents.map(doc => ({
      id: doc.id,
      name: doc.nom || doc.modele_nom || `Rapport #${doc.id}`,
      rows_count: doc.rows_count || (doc.donnees_remplies ? Object.keys(doc.donnees_remplies).length : 0),
      columns_count: doc.columns_count || 0,
      status: doc.status,
      type: 'document',
      projet_id: doc.projet_id || doc.workplace?.projet_id,
      created_at: doc.date_creation
    })) : []
  } catch (error) {
    console.error('Error loading reports:', error)
    availableReports.value = []
  } finally {
    loadingReports.value = false
  }
}

const toggleReportSelection = (report) => {
  const index = selectedReports.value.indexOf(report.id)
  if (index === -1) {
    selectedReports.value.push(report.id)
  } else {
    selectedReports.value.splice(index, 1)
  }
}

const getStatusSeverity = (status) => {
  const severities = {
    'SUBMITTED': 'success',
    'VALIDATED': 'success',
    'DRAFT': 'warning',
    'REJECTED': 'danger'
  }
  return severities[status] || 'secondary'
}

const analyzeSelectedReports = async () => {
  if (selectedReports.value.length === 0 || !selectedProjet.value) return

  analyzing.value = true
  try {
    // Appeler l'endpoint AI pour analyser les rapports
    const response = await axiosInstance.post('/ai/tag-discovery/analyze/', {
      document_ids: selectedReports.value,
      target_type: normalizedType.value,
      projet_id: selectedProjet.value
    })

    if (response.data.success) {
      toast.add({
        severity: 'success',
        summary: 'Analyse terminee',
        detail: 'Les colonnes ont été analysées et associées',
        life: 3000
      })
      // Recharger les donnees
      await loadData()
    } else {
      // Ouvrir l'assistant IA pour continuer manuellement
      showAIDialog.value = true
    }
  } catch (error) {
    console.error('Error analyzing reports:', error)
    toast.add({
      severity: 'info',
      summary: 'Assistant IA',
      detail: 'Utilisez l\'assistant pour configurer manuellement',
      life: 3000
    })
    showAIDialog.value = true
  } finally {
    analyzing.value = false
  }
}

// Watch pour le changement de type via la route
watch(
  () => props.type,
  () => {
    loadData()
  }
)

// Lifecycle
onMounted(async () => {
  // Charger les projets disponibles
  await loadProjets()

  // Charger les donnees du dashboard
  await loadData()

  // Si pas de donnees, charger les rapports disponibles
  if (!hasConfig.value || typeConfig.value.total_rows === 0) {
    await loadAvailableReports()
  }
})
</script>

<style scoped lang="scss">
@use '../styles/dashboard-common.scss' as *;

.dynamic-dashboard {
  min-height: 100%;
}

.dashboard-header {
  .header-content {
    .header-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .back-button {
        margin-right: 0.5rem;
      }

      h1 {
        margin: 0;
      }

      .subtitle {
        margin: 0.25rem 0 0;
        color: var(--text-color-secondary);
        font-size: 0.875rem;
      }
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;

    .projet-select {
      min-width: 220px;
    }
  }
}

.projet-value,
.projet-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: var(--primary-color);
  }
}

// Select project first state
.select-project-first {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;

  .select-project-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;

    i {
      font-size: 2.5rem;
      color: white;
    }
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
  }

  p {
    margin: 0 0 1.5rem;
    color: var(--text-color-secondary);
    max-width: 400px;
  }

  .select-project-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;

    .large-projet-select {
      min-width: 280px;
    }

    .or-text {
      color: var(--text-color-secondary);
      font-size: 0.875rem;
    }
  }
}

// Projet tag in setup header
.setup-header {
  .projet-tag {
    margin-left: 0.25rem;
  }

  .hint {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: var(--text-color-secondary);
    font-style: italic;
  }
}
</style>
