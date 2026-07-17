<template>
  <div class="pointage-dashboard">
    <div class="page-header">
      <div class="header-content">
        <h1>Pointage du Personnel</h1>
        <p class="subtitle">Suivi des présences et calcul des coûts de main-d'oeuvre</p>
      </div>
      <div class="header-actions">
        <Button
          label="Nouveau Pointage"
          icon="pi pi-plus"
          class="primary-btn"
          @click="showCreateDialog = true"
        />
        <Button
          label="Actualiser"
          icon="pi pi-refresh"
          class="secondary-btn"
          text
          @click="loadPointages"
        />
      </div>
    </div>

    <!-- Stats compactes -->
    <div class="stats-bar" v-if="stats">
      <div class="stat-item">
        <div class="stat-icon primary">
          <i class="pi pi-users"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.total_employes }}</span>
          <span class="stat-label">Employes</span>
        </div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-icon success">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value accent">{{ stats.employes_presents }}</span>
          <span class="stat-label">Presents</span>
        </div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-icon muted">
          <i class="pi pi-times-circle"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value muted">{{ stats.employes_absents }}</span>
          <span class="stat-label">Absents</span>
        </div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-icon primary">
          <i class="pi pi-percentage"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.taux_presence }}%</span>
          <span class="stat-label">Taux Presence</span>
        </div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-icon primary">
          <i class="pi pi-clock"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ formatNumber(stats.total_heures) }}h</span>
          <span class="stat-label">Heures</span>
        </div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-icon success">
          <i class="pi pi-money-bill"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value accent">{{ formatNumber(stats.cout_total) }} F</span>
          <span class="stat-label">Coût total</span>
        </div>
      </div>
    </div>

    <!-- Tableau détaillé -->
    <div class="details-card">
      <div class="card-header">
        <h2>Detail des Pointages</h2>
        <div class="header-filters">
          <Select
            v-model="selectedProjet"
            :options="projets"
            optionLabel="nom"
            placeholder="Filtrer par projet"
            class="filter-dropdown"
            @change="loadPointages"
          />
          <input
            type="date"
            v-model="selectedDateStr"
            class="date-input"
            @change="onDateChange"
          />
          <Select
            v-model="selectedFonction"
            :options="fonctions"
            placeholder="Filtrer par fonction"
            class="filter-dropdown"
            @change="loadPointages"
          />
        </div>
      </div>

      <div class="card-content">
        <DataTable
          :value="filteredPointages"
          :loading="loading"
          :paginator="true"
          :rows="20"
          :globalFilterFields="['nom_personnel', 'fonction', 'corps_etat']"
          v-model:filters="filters"
          filterDisplay="menu"
          :rowsPerPageOptions="[10, 20, 50]"
          class="p-datatable-sm"
        >
          <template #header>
            <div class="table-header">
              <span class="table-title">Détail des pointages du personnel</span>
              <IconField iconPosition="left">
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="filters['global'].value" placeholder="Recherche..." />
              </IconField>
            </div>
          </template>

          <Column field="date_pointage" header="Date" :sortable="true" style="min-width: 120px">
            <template #body="{ data }">
              {{ formatDate(data.date_pointage || data.date) }}
            </template>
          </Column>

          <Column field="nom_personnel" header="Nom & Prénom" :sortable="true" style="min-width: 180px">
            <template #body="{ data }">
              <div class="personne-info">
                <Avatar
                  :label="getInitials(data.nom_personnel)"
                  size="small"
                  :style="getAvatarStyle(data.presence)"
                  shape="circle"
                />
                <span class="personne-nom">{{ data.nom_personnel }}</span>
              </div>
            </template>
          </Column>

          <Column field="fonction" header="Fonction" :sortable="true" style="min-width: 150px">
            <template #body="{ data }">
              <Tag :value="data.fonction" :severity="getFonctionSeverity(data.fonction)" />
            </template>
          </Column>

          <Column field="corps_etat" header="Corps d'État" :sortable="true" style="min-width: 150px"></Column>

          <Column field="presence" header="Présence" :sortable="true" style="min-width: 100px">
            <template #body="{ data }">
              <Tag
                :value="(data.presence_bool || data.presence === 'PRESENT') ? 'Présent' : (data.presence_display || 'Absent')"
                :severity="(data.presence_bool || data.presence === 'PRESENT') ? 'success' : 'danger'"
              />
            </template>
          </Column>

          <Column field="heures_travaillees" header="Heures" :sortable="true" style="min-width: 100px">
            <template #body="{ data }">
              <span class="number-cell" v-if="data.presence_bool || data.presence === 'PRESENT'">
                {{ data.heures_travaillees || 0 }}h
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </Column>

          <Column field="heures_supplementaires" header="Supp." :sortable="true" style="min-width: 100px">
            <template #body="{ data }">
              <span class="number-cell text-orange-600" v-if="(data.presence_bool || data.presence === 'PRESENT') && (parseFloat(data.heures_supplementaires) || 0) > 0">
                +{{ data.heures_supplementaires }}h
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </Column>

          <Column field="salaire_horaire" header="Taux Horaire" :sortable="true" style="min-width: 120px">
            <template #body="{ data }">
              <span class="number-cell" v-if="data.presence_bool || data.presence === 'PRESENT'">
                {{ formatNumber(data.salaire_horaire || data.cout_horaire) }} F/h
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </Column>

          <Column field="cout_journalier" header="Coût Journalier" :sortable="true" style="min-width: 130px">
            <template #body="{ data }">
              <span class="number-cell font-bold text-primary-600" v-if="data.presence_bool || data.presence === 'PRESENT'">
                {{ formatNumber(data.cout_journalier || data.cout_total) }} F
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </Column>

          <Column header="Actions" style="min-width: 100px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  icon="pi pi-pencil"
                  size="small"
                  text
                  rounded
                  @click="editPointage(data)"
                  v-tooltip="'Modifier'"
                />
                <Button
                  icon="pi pi-trash"
                  size="small"
                  text
                  rounded
                  severity="danger"
                  @click="confirmDelete(data)"
                  v-tooltip="'Supprimer'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Dialog de création -->
    <Dialog
      v-model:visible="showCreateDialog"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <template #header>
        <h3>Nouveau Pointage</h3>
      </template>
      <PointageForm
        ref="pointageFormRef"
        :pointage="selectedPointage"
        @save="onSavePointage"
        @cancel="showCreateDialog = false"
      />
    </Dialog>

    <!-- Dialog de confirmation -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmation de suppression"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: var(--red-500)"></i>
        <span>Êtes-vous sûr de vouloir supprimer le pointage de <strong>{{ pointageToDelete?.nom_personnel }}</strong> ?</span>
      </div>
      <template #footer>
        <Button label="Non" icon="pi pi-times" text @click="showDeleteDialog = false" />
        <Button label="Oui" icon="pi pi-check" severity="danger" @click="deletePointageConfirmed" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePointageStore } from '../stores/pointageStore'
import { useProjetStore } from '@/stores/projetStore'
import { useToast } from 'primevue/usetoast'
import PointageForm from '../components/PointageForm.vue'

// Store et services
const pointageStore = usePointageStore()
const projetStore = useProjetStore()
const toast = useToast()

// État réactif
const loading = ref(false)
const selectedProjet = ref(null)
const selectedDateStr = ref('') // Format YYYY-MM-DD pour input date natif
const selectedFonction = ref(null)
const selectedPointage = ref(null)
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const pointageToDelete = ref(null)
const pointageFormRef = ref(null)

// Filtres
const filters = ref({
  global: { value: null },
})

// Computed
const pointages = computed(() => pointageStore.pointages)
const projets = computed(() => projetStore.projets)

const fonctions = computed(() => {
  const fonctionsSet = new Set(pointages.value.map(p => p.fonction).filter(Boolean))
  return Array.from(fonctionsSet)
})


const filteredPointages = computed(() => {
  let filtered = [...pointages.value] // Créer une copie pour éviter les problèmes de réactivité

  if (selectedProjet.value) {
    const projetId = selectedProjet.value.id || selectedProjet.value
    filtered = filtered.filter(p => {
      const pProjetId = p.projet_id || p.projet
      return pProjetId === projetId || (typeof pProjetId === 'object' && pProjetId?.id === projetId)
    })
  }

  if (selectedDateStr.value) {
    filtered = filtered.filter(p => {
      const pDate = p.date_pointage || p.date
      return pDate === selectedDateStr.value || (pDate && pDate.split('T')[0] === selectedDateStr.value)
    })
  }

  if (selectedFonction.value) {
    filtered = filtered.filter(p => p.fonction === selectedFonction.value)
  }

  console.log('🔍 [POINTAGE] Filtered pointages:', {
    total: pointages.value.length,
    filtered: filtered.length,
    selectedProjet: selectedProjet.value,
    selectedDate: selectedDateStr.value,
    selectedFonction: selectedFonction.value
  })

  return filtered
})

// Calculer les stats basées sur les pointages filtrés (affichés)
const stats = computed(() => {
  // Utiliser les pointages filtrés qui correspondent à ce qui est affiché dans le tableau
  const pointagesToAnalyze = filteredPointages.value
  
  if (!pointagesToAnalyze.length) {
    return {
      total_employes: 0,
      employes_presents: 0,
      employes_absents: 0,
      taux_presence: 0,
      total_heures: 0,
      cout_total: 0
    }
  }

  // Filtrer les pointages actifs (exclure les congés du calcul)
  const pointagesActifs = pointagesToAnalyze.filter(p => {
    const presence = p.presence_bool !== undefined ? p.presence_bool : (p.presence === 'PRESENT')
    const absence = p.presence_bool === false || (p.presence && p.presence === 'ABSENT')
    return presence || absence // Inclure seulement présents et absents, pas les congés
  })

  // Compter les employés uniques (utiliser nom_personnel en priorité, sinon nom + prenom)
  const getEmployeKey = (p) => {
    if (p.nom_personnel) return p.nom_personnel.trim()
    if (p.nom || p.prenom) return `${p.nom || ''} ${p.prenom || ''}`.trim()
    return null
  }

  const employesUniques = new Set()
  pointagesActifs.forEach(p => {
    const key = getEmployeKey(p)
    if (key) {
      employesUniques.add(key)
    }
  })

  const presents = pointagesActifs.filter(p => p.presence_bool === true || p.presence === 'PRESENT')
  const absents = pointagesActifs.filter(p => p.presence_bool === false || p.presence === 'ABSENT')
  
  // Compter les employés présents uniques
  const employesPresentsUniques = new Set()
  presents.forEach(p => {
    const key = getEmployeKey(p)
    if (key) {
      employesPresentsUniques.add(key)
    }
  })
  
  // Compter les employés absents uniques
  const employesAbsentsUniques = new Set()
  absents.forEach(p => {
    const key = getEmployeKey(p)
    if (key) {
      employesAbsentsUniques.add(key)
    }
  })

  const totalHeures = presents.reduce((sum, p) => sum + (parseFloat(p.heures_travaillees) || 0), 0)
  const coutTotal = presents.reduce((sum, p) => sum + (parseFloat(p.cout_journalier || p.cout_total) || 0), 0)

  const totalEmployes = employesUniques.size
  const employesPresents = employesPresentsUniques.size
  const employesAbsents = employesAbsentsUniques.size

  const tauxPresence = totalEmployes > 0
    ? Math.round((employesPresents / totalEmployes) * 100)
    : 0

  console.log('📊 [POINTAGE STATS] Calcul:', {
    total_pointages: pointagesToAnalyze.length,
    pointages_actifs: pointagesActifs.length,
    total_employes: totalEmployes,
    employes_presents: employesPresents,
    employes_absents: employesAbsents,
    total_heures: totalHeures,
    cout_total: coutTotal
  })

  return {
    total_employes: totalEmployes,
    employes_presents: employesPresents,
    employes_absents: employesAbsents,
    taux_presence: tauxPresence,
    total_heures: totalHeures,
    cout_total: coutTotal
  }
})


// Méthodes
const loadPointages = async () => {
  loading.value = true
  try {
    const params = {}
    if (selectedProjet.value) params.projet = selectedProjet.value.id || selectedProjet.value
    if (selectedDateStr.value) params.date = selectedDateStr.value
    if (selectedFonction.value) params.fonction = selectedFonction.value

    console.log('🔄 [POINTAGE DASHBOARD] Chargement avec params:', params)
    await pointageStore.loadPointages(params)
    console.log('✅ [POINTAGE DASHBOARD] Pointages chargés depuis store:', pointageStore.pointages.length)
    console.log('📊 [POINTAGE DASHBOARD] Premier pointage:', pointageStore.pointages[0])
    console.log('🔍 [POINTAGE DASHBOARD] Filtered pointages length:', filteredPointages.value.length)
    console.log('📈 [POINTAGE DASHBOARD] Stats:', stats.value)
  } catch (error) {
    // Ne pas afficher d'erreur si c'est juste que le backend n'est pas disponible
    if (error.response?.status !== 404 && error.code !== 'ERR_NETWORK') {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des pointages',
      life: 3000
    })
    }
  } finally {
    loading.value = false
  }
}

const onDateChange = () => {
  loadPointages()
}

// Utilitaires
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatNumber = (num) => {
  if (!num) return '0'
  return parseInt(num).toLocaleString('fr-FR')
}

const getInitials = (nom) => {
  if (!nom) return '?'
  return nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getAvatarStyle = (presence) => {
  return presence
    ? { backgroundColor: '#7AC943', color: 'white' }
    : { backgroundColor: '#ef4444', color: 'white' }
}

const getFonctionSeverity = (fonction) => {
  const severityMap = {
    'Chauffeur': 'info',
    'Conducteur travaux': 'success',
    'Maçon': 'warning',
    'Électricien': 'danger',
    'Plombier': 'secondary',
    'Menuisier': 'primary'
  }
  return severityMap[fonction] || 'info'
}

// Actions
const editPointage = (pointage) => {
  selectedPointage.value = pointage
  showCreateDialog.value = true
}

const confirmDelete = (pointage) => {
  pointageToDelete.value = pointage
  showDeleteDialog.value = true
}

const deletePointageConfirmed = async () => {
  if (pointageToDelete.value) {
    try {
      await pointageStore.deletePointage(pointageToDelete.value.id)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Pointage supprimé avec succès',
        life: 3000
      })
      // Recharger les pointages et mettre à jour les graphiques
      await loadPointages()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: error.response?.data?.message || error.message || 'Erreur lors de la suppression du pointage',
        life: 3000
      })
    }
  }
  showDeleteDialog.value = false
  pointageToDelete.value = null
}

const onSavePointage = async (pointageData) => {
  try {
    if (selectedPointage.value) {
      await pointageStore.updatePointage(selectedPointage.value.id, pointageData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Pointage mis à jour avec succès',
        life: 3000
      })
    } else {
      const newPointage = await pointageStore.createPointage(pointageData)
      console.log('✅ [POINTAGE DASHBOARD] Pointage créé, nouveau pointage:', newPointage)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Pointage créé avec succès',
        life: 3000
      })
    }
    
    // Forcer le rechargement complet des pointages pour s'assurer que tout est à jour
    console.log('🔄 [POINTAGE DASHBOARD] Rechargement des pointages...')
    await loadPointages()
    
    // Vérifier que les données sont bien présentes
    console.log('📊 [POINTAGE DASHBOARD] Pointages dans le store:', pointageStore.pointages.length)
    console.log('📊 [POINTAGE DASHBOARD] Pointages filtrés:', filteredPointages.value.length)
    
    showCreateDialog.value = false
    selectedPointage.value = null
  } catch (error) {
    if (error.response?.data) {
      console.error('   Détails erreur:', error.response.data)
    }
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.message || error.response?.data?.detail || error.message || 'Erreur lors de l\'enregistrement du pointage',
      life: 3000
    })
  }
}

// Watchers pour debug
watch(() => pointages.value, (newVal) => {
  console.log('👀 [WATCH] pointages changed:', newVal.length, 'items')
}, { deep: true })

watch(() => filteredPointages.value, (newVal) => {
  console.log('👀 [WATCH] filteredPointages changed:', newVal.length, 'items')
}, { deep: true })

watch(() => stats.value, (newVal) => {
  console.log('👀 [WATCH] stats changed:', newVal)
}, { deep: true })

// Cycle de vie
onMounted(async () => {
  try {
  await projetStore.loadProjets()
  } catch (error) {
    // Continuer même si les projets ne se chargent pas
  }
  
  try {
  await loadPointages()
  } catch (error) {
    // L'erreur est déjà gérée dans loadPointages
  }
})
</script>

<style scoped>
.pointage-dashboard {
  padding: 1.5rem;
  background-color: #f8fafc;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem 1.25rem;
}

.header-content h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--kap-blue);
}

.header-content .subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.primary-btn {
  background: var(--kap-blue);
  border-color: var(--kap-blue);
}

.primary-btn:hover {
  background: #0a2431;
  border-color: #0a2431;
}

.secondary-btn {
  color: var(--kap-blue);
}

.secondary-btn:hover {
  background: rgba(11, 43, 60, 0.1);
}

/* Stats bar compact */
.stats-bar {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.875rem 1.25rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.stat-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.stat-icon.primary {
  background: rgba(11, 43, 60, 0.1);
  color: var(--kap-blue);
}

.stat-icon.success {
  background: rgba(122, 201, 67, 0.15);
  color: var(--kap-green);
}

.stat-icon.muted {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--kap-blue);
  line-height: 1;
}

.stat-value.accent {
  color: var(--kap-green);
}

.stat-value.muted {
  color: #9ca3af;
}

.stat-label {
  font-size: 0.6875rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 2rem;
  background: #e5e7eb;
}

.details-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.card-content {
  padding: 1rem 1.25rem;
}

.card-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--kap-blue);
}

.header-filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-dropdown {
  min-width: 160px;
}

.date-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--kap-blue);
  background: #fff;
  min-width: 140px;
  cursor: pointer;
}

.date-input:hover {
  border-color: #d1d5db;
}

.date-input:focus {
  outline: none;
  border-color: var(--kap-blue);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-title {
  font-weight: 500;
  color: var(--kap-blue);
  font-size: 0.875rem;
}

.personne-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.personne-nom {
  font-weight: 500;
  color: var(--kap-blue);
}

.number-cell {
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.8125rem;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.action-buttons :deep(.p-button:hover) {
  background: var(--kap-green);
  color: white;
}

.action-buttons :deep(.p-button[severity="danger"]:hover) {
  background: #ef4444;
}

.confirmation-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.text-primary-600 {
  color: var(--kap-blue);
}

.text-orange-600 {
  color: #d97706;
}

.text-gray-400 {
  color: #9ca3af;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .header-actions {
    justify-content: flex-end;
  }

  .stats-bar {
    gap: 0.75rem;
  }

  .stat-divider {
    display: none;
  }

  .stat-item {
    flex: 1 1 auto;
    min-width: 100px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-filters {
    flex-direction: column;
  }

  .filter-dropdown {
    width: 100%;
  }
}
</style>
