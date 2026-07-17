<template>
  <div class="module-card collect-module">
    <div class="card-header">
      <div class="header-left">
        <div class="module-icon collect">
          <i class="pi pi-database"></i>
        </div>
        <div class="module-info">
          <h3>KAP Collect</h3>
          <p>Collecte manuelle des données</p>
        </div>
      </div>
      <div class="header-actions">
        <Button 
          icon="pi pi-external-link" 
          text 
          rounded
          @click="navigateToModule"
          v-tooltip="'Accéder au module'"
          class="action-btn"
        />
      </div>
    </div>

    <div class="card-content">
      <!-- KPIs principaux -->
      <div class="kpi-row">
        <div class="kpi-item">
          <div class="kpi-value">{{ data?.total || 0 }}</div>
          <div class="kpi-label">Collectes totales</div>
        </div>
        <div class="kpi-item success">
          <div class="kpi-value">{{ data?.actives || 0 }}</div>
          <div class="kpi-label">En cours</div>
        </div>
        <div class="kpi-item">
          <div class="kpi-value">{{ data?.terminees || 0 }}</div>
          <div class="kpi-label">Terminées</div>
        </div>
      </div>

      <!-- Progression et statut -->
      <div class="progress-section" v-if="data?.progressions">
        <div class="section-title">Progression des collectes actives</div>
        <div class="progress-list">
          <div 
            v-for="collecte in data.progressions.slice(0, 3)" 
            :key="collecte.id"
            class="progress-item"
          >
            <div class="progress-header">
              <span class="collecte-name">{{ collecte.title }}</span>
              <span class="progress-percent">{{ collecte.progress }}%</span>
            </div>
            <ProgressBar 
              :value="collecte.progress" 
              :showValue="false"
              class="progress-bar"
            />
          </div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="quick-actions">
        <Button 
          label="Nouvelle collecte"
          icon="pi pi-plus"
          size="small"
          @click="createNewCollect"
          class="action-btn primary"
        />
        <Button 
          label="Import CSV"
          icon="pi pi-upload"
          size="small"
          outlined
          @click="showImportDialog"
          class="action-btn"
        />
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading" class="loading-overlay">
      <ProgressSpinner style="width:30px;height:30px" strokeWidth="4" />
    </div>

    <!-- Modal d'import CSV -->
    <CSVUploadModal 
      v-model:visible="showCSVUpload"
      @data-imported="onDataImported"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useCollectStore } from '@/features/collect/stores/collectStore.js'
import CSVUploadModal from '@/features/collect/components/CSVUploadModal.vue'

// Props
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Composables
const router = useRouter()
const toast = useToast()
const collectStore = useCollectStore()

// State
const showCSVUpload = ref(false)

// Methods
const navigateToModule = () => {
  router.push('/user/collect')
}

const createNewCollect = () => {
  // Simuler la création d'une nouvelle collecte
  toast.add({
    severity: 'info',
    summary: 'Nouvelle collecte',
    detail: 'Redirection vers la création de collecte...',
    life: 2000
  })
  router.push('/user/collect?action=create')
}

const showImportDialog = () => {
  showCSVUpload.value = true
}

const onDataImported = async (csvData) => {
  try {
    // Pour l'import depuis le dashboard, on peut créer une collecte générique
    // ou rediriger vers la page de création de collecte
    toast.add({
      severity: 'success',
      summary: 'Import réussi',
      detail: `${csvData.totalRows} lignes importées. Création d'une nouvelle collecte...`,
      life: 3000
    })
    
    // Rediriger vers la page de collecte pour finaliser
    router.push('/user/collect?action=create&imported=true')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur d\'import',
      detail: 'Impossible d\'importer les données',
      life: 3000
    })
  }
}
</script>

<style scoped>
.module-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.module-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  background: #ffffff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.module-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  color: white;
}

.module-icon.collect {
  background: #374151;
}

.module-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
}

.module-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  transition: all 0.2s ease;
}

.card-content {
  padding: 1.5rem;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.kpi-item {
  text-align: center;
  padding: 1.25rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.kpi-item:hover {
  background: #f3f4f6;
}

.kpi-item.success {
  background: #f9fafb;
  border-color: #f3f4f6;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.kpi-item.success .kpi-value {
  color: #374151;
}

.kpi-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.progress-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-item {
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.collecte-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.progress-percent {
  font-size: 0.875rem;
  font-weight: 600;
  color: #3b82f6;
}

.progress-bar {
  height: 12px;
  border-radius: 6px;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.action-btn.primary {
  background: #374151;
  border-color: #374151;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

/* Responsive */
@media (max-width: 768px) {
  .kpi-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .card-header {
    padding: 1rem;
  }
  
  .card-content {
    padding: 1rem;
  }
}
</style>
