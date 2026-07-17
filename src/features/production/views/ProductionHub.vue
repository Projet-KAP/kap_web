<template>
  <div class="production-hub">
    <!-- Header -->
    <div class="hub-header">
      <div class="header-content">
        <h1>Suivi Production</h1>
        <p class="subtitle">Suivez vos indicateurs et données en temps réel</p>
      </div>

      <div class="header-actions">
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          @click="loadData"
          :loading="loading"
          v-tooltip.top="'Actualiser'"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !hasData" class="loading-state">
      <ProgressSpinner />
      <p>Chargement des données...</p>
    </div>

    <!-- Empty State - No data -->
    <div v-else-if="!hasData" class="empty-state">
      <i class="pi pi-inbox empty-icon"></i>
      <h2>Aucune donnee disponible</h2>
      <p>
        Commencez par importer vos données ou utilisez l'assistant IA pour configurer vos indicateurs.
      </p>

      <div class="empty-actions">
        <Button
          icon="pi pi-upload"
          label="Importer des données"
          @click="goToImport"
        />
        <Button
          icon="pi pi-sparkles"
          label="Assistant IA"
          severity="secondary"
          @click="showSetupWizard = true"
        />
      </div>
    </div>

    <!-- Data Available - Types Grid -->
    <div v-else class="hub-content">
      <div class="section-header">
        <h2>Vos données</h2>
        <span class="types-count">{{ availableTypes.length }} type(s) de données</span>
      </div>

      <div class="types-grid">
        <DataTypeCard
          v-for="type in availableTypes"
          :key="type.tag_type"
          :type="type"
          @click="navigateToType"
        />

        <!-- Card pour ajouter un nouveau type -->
        <div class="add-type-card" @click="showSetupWizard = true">
          <i class="pi pi-plus-circle"></i>
          <span>Ajouter un suivi</span>
        </div>
      </div>

      <!-- Section stats rapides -->
      <div v-if="availableTypes.length > 0" class="quick-stats">
        <Card class="stat-card">
          <template #content>
            <div class="stat-content">
              <i class="pi pi-database"></i>
              <div>
                <span class="stat-value">{{ totalDataCount }}</span>
                <span class="stat-label">données importées</span>
              </div>
            </div>
          </template>
        </Card>

        <Card class="stat-card">
          <template #content>
            <div class="stat-content">
              <i class="pi pi-tags"></i>
              <div>
                <span class="stat-value">{{ totalTagsCount }}</span>
                <span class="stat-label">indicateurs suivis</span>
              </div>
            </div>
          </template>
        </Card>

        <Card class="stat-card">
          <template #content>
            <div class="stat-content">
              <i class="pi pi-clock"></i>
              <div>
                <span class="stat-value">{{ lastImportDate }}</span>
                <span class="stat-label">dernière mise à jour</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- AI Setup Wizard Dialog -->
    <Dialog
      v-model:visible="showSetupWizard"
      :modal="true"
      :closable="true"
      :draggable="false"
      header="Assistant de configuration"
      :style="{ width: '90vw', maxWidth: '900px' }"
      class="setup-wizard-dialog"
    >
      <TagDiscoveryAssistant
        v-if="showSetupWizard"
        @close="showSetupWizard = false"
        @configuration-complete="onConfigurationComplete"
      />
    </Dialog>

    <!-- AI Assistant Button -->
    <AIAssistantButton
      v-if="hasData"
      @click="showAIDialog = true"
    />

    <!-- AI Assistant Dialog -->
    <AIAssistantDialog
      v-model:visible="showAIDialog"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProductionStore } from '../stores/productionStore'
import { useToast } from 'primevue/usetoast'
import DataTypeCard from '../components/DataTypeCard.vue'
import TagDiscoveryAssistant from '@/features/ai/components/TagDiscoveryAssistant.vue'
import AIAssistantButton from '../components/AIAssistantButton.vue'
import AIAssistantDialog from '../components/AIAssistantDialog.vue'

const productionStore = useProductionStore()
const router = useRouter()
const toast = useToast()

const { availableTypes, loading, hasData } = storeToRefs(productionStore)

const showSetupWizard = ref(false)
const showAIDialog = ref(false)

// Stats calculees
const totalDataCount = computed(() => {
  return availableTypes.value.reduce((sum, t) => sum + (t.data_count || 0), 0)
})

const totalTagsCount = computed(() => {
  return availableTypes.value.reduce((sum, t) => sum + (t.tags?.length || 0), 0)
})

const lastImportDate = computed(() => {
  const dates = availableTypes.value
    .map(t => t.last_import)
    .filter(d => d)
    .sort()
    .reverse()

  if (dates.length === 0) return '-'

  try {
    const date = new Date(dates[0])
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short'
    }).format(date)
  } catch {
    return dates[0]
  }
})

const loadData = async () => {
  try {
    await productionStore.loadAvailableTypes()
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

const navigateToType = (type) => {
  router.push(`/production/${type.tag_type}`)
}

const goToImport = () => {
  router.push('/tags')
}

const onConfigurationComplete = async () => {
  showSetupWizard.value = false

  toast.add({
    severity: 'success',
    summary: 'Configuration terminee',
    detail: 'Vos indicateurs sont prêts à être utilisés',
    life: 5000
  })

  // Recharger les donnees
  await loadData()
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped lang="scss">
.production-hub {
  padding: 1.5rem;
  min-height: 100%;
}

.hub-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  .header-content {
    h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 700;
    }

    .subtitle {
      margin: 0;
      color: var(--text-color-secondary);
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;

  .empty-icon {
    font-size: 3rem;
    color: var(--text-color-secondary);
    margin-bottom: 1.5rem;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--text-color-secondary);
    max-width: 400px;
  }

  .empty-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
}

.hub-content {
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;

    h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .types-count {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }
  }

  .types-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .add-type-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
    border: 2px dashed var(--surface-border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 120px;

    &:hover {
      border-color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 5%, transparent);
    }

    i {
      font-size: 2rem;
      color: var(--text-color-secondary);
    }

    span {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      font-weight: 500;
    }
  }

  .quick-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 1rem;

        > i {
          font-size: 1.5rem;
          color: var(--primary-color);
          opacity: 0.7;
        }

        .stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-color-secondary);
        }
      }
    }
  }
}

.setup-wizard-dialog {
  :deep(.p-dialog-content) {
    padding: 0;
  }
}
</style>
