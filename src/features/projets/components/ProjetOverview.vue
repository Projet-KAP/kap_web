<template>
  <div class="projet-overview">
    <!-- Header du projet -->
    <div class="overview-header">
      <div class="project-info">
        <div class="project-badge">
          <Tag :value="getStatutLabel(projet.statut)" :severity="getStatutSeverity(projet.statut)" />
          <Tag
            v-if="projet.sous_type"
            :value="getTypeLabel(projet.sous_type)"
            :severity="getTypeSeverity(projet.sous_type)"
            class="ml-2"
          />
        </div>
        <h2>{{ projet.nom }}</h2>
        <p class="project-code">{{ projet.code }} - {{ projet.ville || 'Non defini' }}</p>
      </div>
      <div class="project-progress">
        <div class="progress-info">
          <span class="progress-label">Avancement du delai</span>
          <span class="progress-value" :class="{ 'danger': projet.est_en_retard }">
            {{ Math.round(projet.taux_avancement_temps || 0) }}%
          </span>
        </div>
        <ProgressBar :value="projet.taux_avancement_temps || 0" :showValue="false" />
        <span class="progress-status" :class="{ 'danger': projet.est_en_retard }">
          {{ projet.est_en_retard ? 'En retard' : 'Dans les delais' }}
        </span>
      </div>
    </div>

    <!-- Informations generales -->
    <div class="overview-section">
      <div class="section-header">
        <div class="section-title">
          <i class="pi pi-info-circle"></i>
          <span>Informations Generales</span>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Responsable</span>
          <span class="info-value">{{ projet.responsable_name || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Adresse</span>
          <span class="info-value">{{ projet.adresse || '-' }}</span>
        </div>
        <div class="info-item full-width" v-if="projet.description">
          <span class="info-label">Description</span>
          <span class="info-value">{{ projet.description }}</span>
        </div>
      </div>
    </div>

    <!-- Informations financieres du projet -->
    <div class="overview-section financial">
      <div class="section-header">
        <div class="section-title">
          <i class="pi pi-wallet"></i>
          <span>Informations Financieres</span>
        </div>
      </div>
      <div class="kpi-grid financial-grid">
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #e0f2fe; color: #0284c7;">
            <i class="pi pi-file"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Montant Marche</span>
            <span class="kpi-value">{{ formatMontant(projet.montant_marche) }}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #fef3c7; color: #d97706;">
            <i class="pi pi-calculator"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Budget Previsionnel</span>
            <span class="kpi-value">{{ formatMontant(projet.budget_previsionnel) }}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" :style="{ background: margePrevisionnelle >= 0 ? '#dcfce7' : '#fee2e2', color: margePrevisionnelle >= 0 ? '#16a34a' : '#dc2626' }">
            <i :class="margePrevisionnelle >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Marge Previsionnelle</span>
            <span class="kpi-value" :class="{ 'positive': margePrevisionnelle >= 0, 'negative': margePrevisionnelle < 0 }">
              {{ formatMontant(margePrevisionnelle) }}
            </span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #e0e7ff; color: #4f46e5;">
            <i class="pi pi-percentage"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Taux de Marge</span>
            <span class="kpi-value">{{ tauxMarge }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Planning -->
    <div class="overview-section">
      <div class="section-header">
        <div class="section-title">
          <i class="pi pi-calendar"></i>
          <span>Planning</span>
        </div>
      </div>
      <div class="kpi-grid planning-grid">
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #dcfce7; color: #16a34a;">
            <i class="pi pi-play"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Date Debut Prevue</span>
            <span class="kpi-value">{{ formatDate(projet.date_debut_prevue) }}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #fee2e2; color: #dc2626;">
            <i class="pi pi-stop"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Date Fin Prevue</span>
            <span class="kpi-value">{{ formatDate(projet.date_fin_prevue) }}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #e0f2fe; color: #0284c7;">
            <i class="pi pi-clock"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Duree Prevue</span>
            <span class="kpi-value">{{ projet.duree_prevue_jours || 0 }} jours</span>
          </div>
        </div>
        <div class="kpi-card" v-if="projet.date_debut_reelle">
          <div class="kpi-icon" style="background: #d1fae5; color: #059669;">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Date Debut Reelle</span>
            <span class="kpi-value">{{ formatDate(projet.date_debut_reelle) }}</span>
          </div>
        </div>
        <div class="kpi-card" v-if="projet.date_fin_reelle">
          <div class="kpi-icon" style="background: #fecaca; color: #dc2626;">
            <i class="pi pi-flag"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Date Fin Reelle</span>
            <span class="kpi-value">{{ formatDate(projet.date_fin_reelle) }}</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #fef3c7; color: #d97706;">
            <i class="pi pi-hourglass"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Jours Consommes</span>
            <span class="kpi-value">{{ projet.jours_consommes || 0 }} jours</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #dbeafe; color: #2563eb;">
            <i class="pi pi-forward"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Jours Restants</span>
            <span class="kpi-value">{{ projet.jours_restants || 0 }} jours</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #f3e8ff; color: #7c3aed;">
            <i class="pi pi-history"></i>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Duree Reelle</span>
            <span class="kpi-value">{{ projet.duree_reelle_jours || 0 }} jours</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Echelons -->
    <div class="overview-section" v-if="projet.echelons && projet.echelons.length > 0">
      <div class="section-header">
        <div class="section-title">
          <i class="pi pi-list"></i>
          <span>Echelons ({{ projet.echelons.length }})</span>
        </div>
      </div>
      <DataTable :value="projet.echelons" stripedRows size="small" class="data-table">
        <Column field="code" header="Code" :sortable="true"></Column>
        <Column field="nom" header="Nom" :sortable="true"></Column>
        <Column field="pk_debut" header="PK Debut" :sortable="true"></Column>
        <Column field="pk_fin" header="PK Fin" :sortable="true"></Column>
        <Column field="ordre" header="Ordre" :sortable="true"></Column>
      </DataTable>
    </div>

    <!-- Zones -->
    <div class="overview-section" v-if="projet.zones && projet.zones.length > 0">
      <div class="section-header">
        <div class="section-title">
          <i class="pi pi-map"></i>
          <span>Zones ({{ projet.zones.length }})</span>
        </div>
      </div>
      <DataTable :value="projet.zones" stripedRows size="small" class="data-table">
        <Column field="code" header="Code" :sortable="true"></Column>
        <Column field="nom" header="Nom" :sortable="true"></Column>
        <Column field="superficie" header="Superficie (m2)" :sortable="true"></Column>
      </DataTable>
    </div>

    <!-- Liens vers les suivis de production -->
    <div class="overview-section">
      <div class="section-header">
        <div class="section-title">
          <i class="pi pi-chart-bar"></i>
          <span>Suivis de Production</span>
        </div>
      </div>
      <div class="production-links">
        <router-link
          :to="`/production/terrassement?projet=${projet.id}`"
          class="production-link"
        >
          <i class="pi pi-chart-bar"></i>
          <span>Terrassement</span>
          <i class="pi pi-arrow-right"></i>
        </router-link>
        <router-link
          :to="`/production/beton?projet=${projet.id}`"
          class="production-link"
        >
          <i class="pi pi-box"></i>
          <span>Beton</span>
          <i class="pi pi-arrow-right"></i>
        </router-link>
        <router-link
          :to="`/production/transport?projet=${projet.id}`"
          class="production-link"
        >
          <i class="pi pi-truck"></i>
          <span>Transport</span>
          <i class="pi pi-arrow-right"></i>
        </router-link>
        <router-link
          :to="`/production/financier?projet=${projet.id}`"
          class="production-link"
        >
          <i class="pi pi-wallet"></i>
          <span>Financier</span>
          <i class="pi pi-arrow-right"></i>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  projet: {
    type: Object,
    required: true
  }
})

// Calculs derives des donnees du projet
const margePrevisionnelle = computed(() => {
  const montant = props.projet?.montant_marche || 0
  const budget = props.projet?.budget_previsionnel || 0
  return montant - budget
})

const tauxMarge = computed(() => {
  const montant = props.projet?.montant_marche || 0
  if (montant === 0) return 0
  return ((margePrevisionnelle.value / montant) * 100).toFixed(1)
})

// Helpers
const getTypeLabel = (type) => {
  const labels = {
    'TERRASSEMENT': 'Terrassement',
    'BETON': 'Beton',
    'TRANSPORT': 'Transport',
    'FINANCIER': 'Financier',
    'MIXTE': 'Mixte',
    'AUTRE': 'Autre'
  }
  return labels[type] || type || 'Non defini'
}

const getTypeSeverity = (type) => {
  const severities = {
    'TERRASSEMENT': 'info',
    'BETON': 'warning',
    'TRANSPORT': 'success',
    'FINANCIER': 'secondary',
    'MIXTE': 'contrast',
    'AUTRE': 'secondary'
  }
  return severities[type] || 'secondary'
}

const getStatutLabel = (statut) => {
  const labels = {
    'PREPARATION': 'Preparation',
    'EN_COURS': 'En cours',
    'SUSPENDU': 'Suspendu',
    'TERMINE': 'Termine',
    'ABANDONNE': 'Abandonne'
  }
  return labels[statut] || statut
}

const getStatutSeverity = (statut) => {
  const severities = {
    'PREPARATION': 'info',
    'EN_COURS': 'success',
    'SUSPENDU': 'warning',
    'TERMINE': 'secondary',
    'ABANDONNE': 'danger'
  }
  return severities[statut] || 'secondary'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

const formatMontant = (montant) => {
  if (!montant && montant !== 0) return '-'
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA'
}
</script>

<style scoped>
.projet-overview {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.project-info h2 {
  margin: 0.75rem 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.project-code {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.project-badge {
  display: flex;
  gap: 0.5rem;
}

.project-progress {
  text-align: right;
  min-width: 200px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.75rem;
  color: #64748b;
}

.progress-value {
  font-size: 1rem;
  font-weight: 700;
  color: #16a34a;
}

.progress-value.danger {
  color: #dc2626;
}

.progress-status {
  font-size: 0.75rem;
  color: #16a34a;
  font-weight: 500;
}

.progress-status.danger {
  color: #dc2626;
}

/* Sections */
.overview-section {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: #374151;
}

.section-title i {
  font-size: 1rem;
  color: #6b7280;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
}

.info-value {
  font-size: 0.95rem;
  color: #1e293b;
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.financial-grid {
  grid-template-columns: repeat(4, 1fr);
}

.planning-grid {
  grid-template-columns: repeat(4, 1fr);
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 10px;
  transition: all 0.2s;
}

.kpi-card:hover {
  background: #f1f5f9;
}

.kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon i {
  font-size: 1rem;
}

.kpi-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.kpi-label {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.kpi-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value.positive {
  color: #16a34a;
}

.kpi-value.negative {
  color: #dc2626;
}

/* Production Links */
.production-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.production-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 10px;
  text-decoration: none;
  color: #374151;
  transition: all 0.2s;
}

.production-link:hover {
  background: var(--primary-color);
  color: white;
}

.production-link i:first-child {
  font-size: 1.25rem;
}

.production-link span {
  flex: 1;
  font-weight: 500;
}

.production-link i:last-child {
  font-size: 0.875rem;
  opacity: 0.7;
}

/* Data Table */
.data-table {
  margin-top: 0.5rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .financial-grid,
  .planning-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .production-links {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .overview-header {
    flex-direction: column;
    gap: 1.5rem;
  }

  .project-progress {
    width: 100%;
    text-align: left;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .kpi-grid,
  .financial-grid,
  .planning-grid,
  .production-links {
    grid-template-columns: 1fr;
  }
}
</style>
