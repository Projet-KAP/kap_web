<template>
  <div class="modular-dashboard" :class="{ 'compact-view': isCompactView }">
    <!-- Header avec filtres -->
    <div class="dashboard-header-clean">
      <h1 class="page-title">Tableau de bord</h1>

      <div class="header-filters">
        <!-- Dashboard selector -->
        <Select
          v-model="selectedDashboardId"
          :options="publishedDashboards"
          optionLabel="name"
          optionValue="id"
          placeholder="Sélectionner"
          class="dashboard-select"
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="select-value">
              <i class="pi pi-chart-line"></i>
              <span>{{ publishedDashboards.find(d => d.id === slotProps.value)?.name }}</span>
            </div>
            <span v-else>{{ slotProps.placeholder }}</span>
          </template>
        </Select>

        <!-- Quick period selectors -->
        <div class="quick-periods">
          <button
            v-for="period in quickPeriods"
            :key="period.key"
            class="period-chip"
            :class="{ active: selectedPeriod === period.key }"
            @click="selectQuickPeriod(period.key)"
          >
            {{ period.label }}
          </button>
        </div>

        <!-- Custom date button -->
        <button class="date-btn" @click="toggleDatePopover">
          <i class="pi pi-calendar"></i>
          <span>{{ formattedDateRange }}</span>
        </button>
        <Popover ref="datePopover">
          <DatePicker
            v-model="dateRange"
            selectionMode="range"
            :inline="true"
            dateFormat="dd/mm/yy"
            @date-select="onDateSelect"
          />
        </Popover>
      </div>
    </div>

    <!-- Contenu du dashboard - Analytics direct -->
    <div class="dashboard-content">
      <!-- Analytics View - Affichage direct -->
      <div class="analytics-view">
        <PublishedDashboards
          :dateRange="dateRange"
          :selectedDashboardId="selectedDashboardId"
        />
      </div>

      <!-- Code demo masqué -->
      <div v-if="false && isDemoEnabled && activeTab === 'overview'" class="overview-mode hidden">
        <!-- KPIs Globaux -->
        <div class="global-kpis">
          <div class="kpi-row">
            <div v-if="isMetricSelected('trs')" class="global-kpi-card neutral">
              <div class="kpi-icon">
                <i class="pi pi-chart-line"></i>
              </div>
              <div class="kpi-content">
                <div class="kpi-value">{{ globalStats.trs_global || 0 }}%</div>
                <div class="kpi-label">TRS Global</div>
                <div v-if="showTrends && globalStats.trs_trend" class="kpi-trend" :class="globalStats.trs_trend > 0 ? 'up' : 'down'">
                  <i :class="globalStats.trs_trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                  {{ globalStats.trs_trend > 0 ? '+' : '' }}{{ globalStats.trs_trend }}%
                </div>
              </div>
            </div>

            <div v-if="isMetricSelected('disponibilite')" class="global-kpi-card neutral">
              <div class="kpi-icon">
                <i class="pi pi-cog"></i>
              </div>
              <div class="kpi-content">
                <div class="kpi-value">{{ globalStats.machines_actives || 0 }}</div>
                <div class="kpi-label">Machines actives</div>
                <div class="kpi-desc">sur {{ globalStats.machines_total || 0 }} total</div>
              </div>
            </div>

            <div v-if="isMetricSelected('disponibilite_engins')" class="global-kpi-card neutral">
              <div class="kpi-icon">
                <i class="pi pi-truck"></i>
              </div>
              <div class="kpi-content">
                <div class="kpi-value">{{ globalStats.engins_operationnels || 0 }}</div>
                <div class="kpi-label">Engins opérationnels</div>
                <div class="kpi-desc">{{ globalStats.disponibilite_engins || 0 }}% disponibilité</div>
              </div>
            </div>

            <div class="global-kpi-card neutral">
              <div class="kpi-icon">
                <i class="pi pi-exclamation-triangle"></i>
              </div>
              <div class="kpi-content">
                <div class="kpi-value">{{ globalStats.alertes_actives || 0 }}</div>
                <div class="kpi-label">Alertes actives</div>
                <div class="kpi-desc">{{ globalStats.alertes_critiques || 0 }} critique{{ globalStats.alertes_critiques > 1 ? 's' : '' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Teams Section -->
        <div v-if="teamsData && teamsData.length > 0" class="teams-section">
          <h2>Gestion des Équipes</h2>
          
          <!-- Team Overview Cards -->
          <TeamOverviewCards
            :teams="teamsData"
            @create-team="handleCreateTeam"
            @evaluate-kpis="handleEvaluateKPIs"
            @view-media="handleViewMedia"
            @view-all-activities="handleViewAllActivities"
            class="team-overview"
          />
          
          <!-- Charts Grid -->
          <div class="charts-grid">
            <TeamPerformanceChart 
              :teams="teamsData"
              class="performance-chart-container"
            />
            <TeamKPIChart 
              :teams="teamsData"
              class="kpi-chart-container"
            />
          </div>
        </div>

        <!-- Engins Section -->
        <div class="engins-section">
          <h2>Gestion des Engins</h2>
          
          <!-- Engins Overview Cards -->
          <EnginsOverviewCards
            :engins-data="enginsData"
            @refresh-data="handleRefreshEnginsData"
            @view-location="handleViewLocation"
            @manage-engins="handleManageEngins"
            @view-alerts="handleViewAlerts"
            @view-maintenance-history="handleViewMaintenanceHistory"
            @schedule-maintenance="handleScheduleMaintenance"
            class="engins-overview"
          />
          
          <!-- Engins Charts and Maps -->
          <div class="engins-grid">
            <EnginsReliabilityChart 
              :engins="enginsRawData"
              class="reliability-chart-container"
            />
            <EnginsLocationMap 
              :engins="enginsRawData"
              @engin-selected="handleEnginSelected"
              @refresh-locations="handleRefreshLocations"
              class="location-map-container"
            />
          </div>
          
          <!-- Alerts Panel -->
          <div class="alerts-panel-container">
            <EnginsAlertsPanel 
              :engins="enginsRawData"
              @view-engin="handleViewEngin"
              @refresh-alerts="handleRefreshAlerts"
              @alert-dismissed="handleAlertDismissed"
              @alert-read="handleAlertRead"
            />
          </div>
        </div>

        <!-- Modules Overview -->
        <div class="modules-overview">
          <h2>Modules actifs</h2>
          <div class="modules-grid-overview">
            <!-- KAP Collect -->
            <div v-if="isModuleVisible('collect')" class="module-overview-card collect">
              <div class="module-header">
                <div class="module-icon">
                  <i class="pi pi-database"></i>
                </div>
                <div class="module-info">
                  <h3>KAP Collect</h3>
                  <p>Collecte manuelle des données</p>
                </div>
                <Button 
                  icon="pi pi-external-link" 
                  class="module-link-btn"
                  text
                  rounded
                  @click="activeTab = 'collect'"
                />
              </div>
              
              <div class="module-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ moduleData.collect?.total || 0 }}</span>
                  <span class="stat-label">Collectes totales</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ moduleData.collect?.actives || 0 }}</span>
                  <span class="stat-label">En cours</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ moduleData.collect?.terminees || 0 }}</span>
                  <span class="stat-label">Terminées</span>
                </div>
              </div>
              
              <div v-if="moduleData.collect?.progression_globale" class="module-progress">
                <div class="progress-header">
                  <span>Progression globale</span>
                  <span class="progress-value">{{ moduleData.collect.progression_globale }}%</span>
                </div>
                <ProgressBar :value="moduleData.collect.progression_globale" class="module-progress-bar" />
              </div>
            </div>

            <!-- KAP MES -->
            <div v-if="isModuleVisible('mes')" class="module-overview-card mes">
              <div class="module-header">
                <div class="module-icon">
                  <i class="pi pi-sitemap"></i>
                </div>
                <div class="module-info">
                  <h3>KAP MES</h3>
                  <p>Suivi KPIs industriels</p>
                </div>
                <Button 
                  icon="pi pi-external-link" 
                  class="module-link-btn"
                  text
                  rounded
                  @click="activeTab = 'mes'"
                />
              </div>
              
              <div class="module-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ moduleData.mes?.trs || 0 }}%</span>
                  <span class="stat-label">TRS Moyen</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ moduleData.mes?.disponibilite || 0 }}%</span>
                  <span class="stat-label">Disponibilité</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ moduleData.mes?.taux_qualite || 0 }}%</span>
                  <span class="stat-label">Qualité</span>
                </div>
              </div>
              
              <!-- Charge Capa KPI -->
              <div class="module-capacity" v-if="moduleData.mes">
                <div class="capacity-header">
                  <i class="pi pi-gauge"></i>
                  <span>Charge Capa</span>
                </div>
                <div class="capacity-kpi">
                  <div class="capacity-value-large">{{ moduleData.mes?.charge_capa || 0 }}%</div>
                  <div class="capacity-description">Charge capacitaire des machines</div>
                </div>
              </div>
              
              <div class="module-alerts" v-if="moduleData.mes?.alertes?.length">
                <div class="alerts-header">
                  <i class="pi pi-bell"></i>
                  <span>{{ moduleData.mes.alertes.length }} alertes actives</span>
                </div>
                <div class="alerts-preview">
                  <div 
                    v-for="alerte in moduleData.mes.alertes.slice(0, 2)" 
                    :key="alerte.id"
                    class="alert-preview" 
                    :class="alerte.severity">
                    <i :class="alerte.severity === 'critical' ? 'pi pi-times-circle' : 'pi pi-exclamation-triangle'"></i>
                    <span>{{ alerte.message }}</span>
                  </div>
                </div>
              </div>
              <div class="module-alerts" v-else>
                <div class="alerts-header">
                  <i class="pi pi-check-circle"></i>
                  <span>Aucune alerte</span>
                </div>
                <div class="alerts-preview">
                  <p class="no-alerts-message">Tous les systèmes fonctionnent normalement</p>
                </div>
              </div>
            </div>

            <!-- KAP Engins -->
            <div v-if="isModuleVisible('engins')" class="module-overview-card engins">
              <div class="module-header">
                <div class="module-icon">
                  <i class="pi pi-cog"></i>
                </div>
                <div class="module-info">
                  <h3>KAP Engins</h3>
                  <p>Analyse utilisation engins</p>
                </div>
                <Button 
                  icon="pi pi-external-link" 
                  class="module-link-btn"
                  text
                  rounded
                  @click="activeTab = 'engins'"
                />
              </div>
      
              <div class="module-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ moduleData.engins?.total || 0 }}</span>
                  <span class="stat-label">Engins totaux</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ moduleData.engins?.operationnels || 0 }}</span>
                  <span class="stat-label">Opérationnels</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ moduleData.engins?.en_maintenance || 0 }}</span>
                  <span class="stat-label">En maintenance</span>
                </div>
              </div>
              
              <!-- Charge Capa KPI -->
              <div class="module-capacity" v-if="moduleData.engins">
                <div class="capacity-header">
                  <i class="pi pi-chart-bar"></i>
                  <span>Charge Capa</span>
                </div>
                <div class="capacity-kpi">
                  <div class="capacity-value-large">{{ moduleData.engins?.charge_capa || 0 }}%</div>
                  <div class="capacity-description">Charge capacitaire de la flotte</div>
                </div>
              </div>
              
              <!-- TBD - Engins en mode dégradé -->
              <div class="module-tbd" v-if="degradedEngins.length > 0">
                <div class="tbd-header">
                  <i class="pi pi-exclamation-triangle"></i>
                  <span>Engins en mode dégradé ({{ degradedEngins.length }})</span>
                </div>
                <div class="tbd-threshold-info">
                  <span class="threshold-label">Seuil configuré:</span>
                  <span class="threshold-value">{{ formatDegradedModeRatio(thresholdConfigStore.getThresholdById('degradedMode')?.currentValue || 0.020) }}</span>
                </div>
                <div class="tbd-list">
                  <div
                    v-for="engin in degradedEngins.slice(0, 2)"
                    :key="engin.id"
                    class="tbd-item"
                    :class="getEnginTbdSeverity(engin.status)"
                  >
                    <div class="tbd-header-item">
                      <span class="engin-name">{{ engin.name }}</span>
                      <span class="engin-status">{{ getEnginStatusLabel(engin.status) }}</span>
                    </div>
                    <div class="tbd-time">
                      <i class="pi pi-clock"></i>
                      <span>TBD: {{ calculateEnginTBD(engin) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="module-reliability">
                <div class="reliability-items">
                  <div class="reliability-item">
                    <span class="reliability-label">MTTR</span>
                    <span class="reliability-value">{{ moduleData.engins?.mttr || 0 }}h</span>
                  </div>
                  <div class="reliability-item">
                    <span class="reliability-label">MTBF</span>
                    <span class="reliability-value">{{ moduleData.engins?.mtbf || 0 }}h</span>
                  </div>
                  <div class="reliability-item">
                    <span class="reliability-label">Fiabilité</span>
                    <span class="reliability-value">{{ moduleData.engins?.fiabilite || 0 }}%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Activités récentes -->
        <div class="recent-activities-overview">
          <div class="activities-header">
          <h2>Activités récentes</h2>
          <Button 
            label="Voir tout" 
              icon="pi pi-arrow-right" 
            text 
            @click="viewAllActivities"
          />
        </div>
        <RecentActivities 
          :activities="recentActivities"
          :loading="loading"
          :compact="false"
        />
      </div>
    </div>

      <!-- Vue spécifique Collect - masqué -->
      <div v-if="false && isDemoEnabled && activeTab === 'collect'" class="module-specific collect-view hidden">
        <div class="module-hero">
          <div class="hero-content">
            <div class="hero-icon">
              <i class="pi pi-database"></i>
            </div>
            <div class="hero-text">
              <h1>KAP Collect</h1>
              <p>Collecte manuelle des données pour digitaliser vos processus</p>
            </div>
          </div>
        </div>
        
        <div class="module-dashboard">
          <div class="dashboard-grid">
            <!-- KPIs principaux -->
            <div class="kpi-section">
              <h2>Vue d'ensemble</h2>
              <div class="kpi-cards">
                <div class="kpi-card neutral">
                  <div class="kpi-icon">
                    <i class="pi pi-list"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.collect?.total || 0 }}</div>
                    <div class="kpi-label">Collectes totales</div>
                  </div>
                </div>
                <div class="kpi-card neutral">
                  <div class="kpi-icon">
                    <i class="pi pi-play"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.collect?.actives || 0 }}</div>
                    <div class="kpi-label">En cours</div>
                  </div>
                </div>
                <div class="kpi-card neutral">
                  <div class="kpi-icon">
                    <i class="pi pi-check"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.collect?.terminees || 0 }}</div>
                    <div class="kpi-label">Terminées</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Progressions -->
            <div class="progress-section">
              <h2>Collectes en cours</h2>
              <div class="progress-cards">
                <div 
                  v-for="collecte in moduleData.collect?.progressions || []" 
                  :key="collecte.id"
                  class="progress-card"
                >
                  <div class="progress-header">
                    <span class="collecte-name">{{ collecte.title }}</span>
                    <span class="progress-percent">{{ collecte.progress }}%</span>
                  </div>
                  <ProgressBar 
                    :value="collecte.progress" 
                    :showValue="false"
                    class="progress-bar-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vue spécifique MES - masqué -->
      <div v-if="false && isDemoEnabled && activeTab === 'mes'" class="module-specific mes-view hidden">
        <div class="module-hero">
          <div class="hero-content">
            <div class="hero-icon">
              <i class="pi pi-sitemap"></i>
            </div>
            <div class="hero-text">
              <h1>KAP MES</h1>
              <p>Suivi de vos KPIs industriels et recommandations d'optimisation</p>
            </div>
          </div>
        </div>
        
        <div class="module-dashboard">
          <div class="dashboard-grid">
            <!-- KPIs principaux -->
            <div class="kpi-section">
              <h2>TRS & Performances</h2>
              <div class="kpi-cards">
                <div class="kpi-card neutral">
                  <div class="kpi-icon">
                    <i class="pi pi-chart-line"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value" :class="getThresholdClass(moduleData.mes?.trs, 'trs')">{{ moduleData.mes?.trs || 0 }}%</div>
                    <div class="kpi-label">TRS Global</div>
                    <div v-if="showTrends" class="kpi-trend" :class="getTrendClass(moduleData.mes?.trs_trend)">
                      <i :class="getTrendIcon(moduleData.mes?.trs_trend)"></i>
                      {{ Math.abs(moduleData.mes?.trs_trend || 0) }}%
                    </div>
                  </div>
                </div>
                <div class="kpi-card neutral">
                  <div class="kpi-icon">
                    <i class="pi pi-clock"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.mes?.disponibilite || 0 }}%</div>
                    <div class="kpi-label">Disponibilité</div>
                    <div class="kpi-desc">Temps fonctionnement / Temps planifié</div>
                  </div>
                </div>
                <div class="kpi-card neutral">
                  <div class="kpi-icon">
                    <i class="pi pi-gauge"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.mes?.performance || 0 }}%</div>
                    <div class="kpi-label">Performance</div>
                    <div class="kpi-desc">Production réelle vs idéale</div>
                  </div>
                </div>
                <div class="kpi-card neutral">
                  <div class="kpi-icon">
                    <i class="pi pi-check-circle"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.mes?.taux_qualite || 0 }}%</div>
                    <div class="kpi-label">Qualité</div>
                    <div class="kpi-desc">Produits conformes / Total</div>
                  </div>
                </div>
                <div class="kpi-card primary">
                  <div class="kpi-icon">
                    <i class="pi pi-gauge"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.mes?.charge_capa || 0 }}%</div>
                    <div class="kpi-label">Charge Capa</div>
                    <div class="kpi-desc">Charge capacitaire des machines</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Production & Efficacité -->
            <div class="production-section">
              <h2>Production & Efficacité</h2>
              <div class="kpi-cards">
                <div class="kpi-card danger">
                  <div class="kpi-icon">
                    <i class="pi pi-exclamation-circle"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value" :class="getThresholdClass(moduleData.mes?.taux_rebuts, 'rebuts')">{{ moduleData.mes?.taux_rebuts || 0 }}%</div>
                    <div class="kpi-label">Taux de rebuts</div>
                    <div class="kpi-desc">Produits non conformes</div>
                  </div>
                </div>
                <div class="kpi-card primary">
                  <div class="kpi-icon">
                    <i class="pi pi-cog"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.mes?.productivite_machine || 0 }}</div>
                    <div class="kpi-label">Productivité</div>
                    <div class="kpi-desc">pcs/h conformes</div>
                  </div>
                </div>
                <div class="kpi-card info">
                  <div class="kpi-icon">
                    <i class="pi pi-forward"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.mes?.temps_arret || 0 }}</div>
                    <div class="kpi-label">Temps d'arrêt</div>
                    <div class="kpi-desc">pcs/h actuelles</div>
                  </div>
                </div>
                <div class="kpi-card success">
                  <div class="kpi-icon">
                    <i class="pi pi-play"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.mes?.demarrages_journaliers || 0 }}</div>
                    <div class="kpi-label">Démarrages/jour</div>
                    <div class="kpi-desc">Nombre de démarrages</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Temps d'arrêt & Maintenance -->
            <div class="downtime-section">
              <h2>Temps d'arrêt & Maintenance</h2>
              <div class="downtime-cards">
                <div class="downtime-card">
                  <div class="downtime-header">
                    <div class="downtime-icon">
                      <i class="pi pi-pause"></i>
                    </div>
                    <div class="downtime-content">
                      <div class="downtime-value">{{ moduleData.mes?.temps_arret_total || 0 }}h</div>
                      <div class="downtime-label">Temps d'arrêt total</div>
                    </div>
                  </div>
                  <div class="downtime-breakdown">
                    <div class="breakdown-item">
                      <span class="breakdown-label">Planifiés</span>
                      <span class="breakdown-value">{{ moduleData.mes?.temps_arret_planifies || 0 }}h</span>
                    </div>
                    <div class="breakdown-item">
                      <span class="breakdown-label">Non planifiés</span>
                      <span class="breakdown-value">{{ moduleData.mes?.temps_arret_non_planifies || 0 }}h</span>
                    </div>
                  </div>
                </div>
                <div class="machines-active-card">
                  <div class="machines-header">
                    <div class="machines-icon">
                      <i class="pi pi-cog"></i>
                    </div>
                    <div class="machines-content">
                      <div class="machines-value">{{ moduleData.mes?.machines_actives || 0 }}</div>
                      <div class="machines-label">Machines actives</div>
                    </div>
                  </div>
                  <div class="machines-status">
                    <div class="status-item active">
                      <span class="status-dot"></span>
                      <span>{{ moduleData.mes?.machines_operationnelles || 0 }} Opérationnelles</span>
                    </div>
                    <div class="status-item maintenance">
                      <span class="status-dot"></span>
                      <span>{{ moduleData.mes?.machines_maintenance || 0 }} En maintenance</span>
                    </div>
                    <div class="status-item error">
                      <span class="status-dot"></span>
                      <span>{{ moduleData.mes?.machines_arret || 0 }} En panne</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Alertes -->
            <div v-if="showAlerts && moduleData.mes?.alertes?.length" class="alerts-section">
              <h2>Alertes actives</h2>
              <div class="alert-cards">
                <div
                  v-for="alerte in moduleData.mes.alertes"
                  :key="alerte.id"
                  class="alert-card"
                  :class="alerte.severity"
                >
                  <div class="alert-icon">
                    <i :class="getAlertIcon(alerte.severity)"></i>
                  </div>
                  <div class="alert-content">
                    <div class="alert-message">{{ alerte.message }}</div>
                    <div class="alert-time">{{ formatTime(alerte.timestamp) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Machines -->
            <div class="machines-section">
              <h2>État des machines</h2>
              <div class="machine-cards">
                <div 
                  v-for="machine in (moduleData.mes?.machines || []).filter(m => m.type === 'MACHINE')" 
                  :key="machine.id"
                  class="machine-card"
                  :class="machine.status"
                >
                  <div class="machine-header">
                    <span class="machine-name">{{ machine.name }}</span>
                    <Tag 
                      :value="machine.status" 
                      :severity="getStatusSeverity(machine.status)"
                    />
                  </div>
                  <div class="machine-metrics">
                    <div class="metric">
                      <span class="metric-label">OEE</span>
                      <span class="metric-value">{{ getOEEValue(machine, 'global') }}%</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Disponibilité</span>
                      <span class="metric-value">{{ getOEEValue(machine, 'availability') }}%</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Performance</span>
                      <span class="metric-value">{{ getOEEValue(machine, 'performance') }}%</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Qualité</span>
                      <span class="metric-value">{{ getOEEValue(machine, 'quality') }}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="(moduleData.mes?.machines || []).filter(m => m.type === 'MACHINE').length === 0" class="empty-state">
                <i class="pi pi-info-circle"></i>
                <p>Aucune machine de production disponible</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vue spécifique Engins - masqué -->
      <div v-if="false && activeTab === 'engins'" class="module-specific engins-view hidden">
        <div class="module-hero">
          <div class="hero-content">
            <div class="hero-icon">
              <i class="pi pi-cog"></i>
            </div>
            <div class="hero-text">
              <h1>KAP Engins</h1>
              <p>Analyse de l'utilisation et de l'efficacité des engins de chantier</p>
            </div>
          </div>
        </div>
        
        <div class="module-dashboard">
          <div class="dashboard-grid">
            <!-- KPIs principaux -->
            <div v-if="isMetricSelected('disponibilite_engins') || isMetricSelected('utilisation_reelle') || isMetricSelected('fiabilite_chantier')" class="kpi-section">
              <h2>Flotte</h2>
              <div class="kpi-cards">
                <div class="kpi-card neutral">
                  <div class="kpi-icon">
                    <i class="pi pi-truck"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.engins?.total || 0 }}</div>
                    <div class="kpi-label">Engins totaux</div>
                  </div>
                </div>
                <div class="kpi-card neutral">
                  <div class="kpi-icon">
                    <i class="pi pi-check"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.engins?.operationnels || 0 }}</div>
                    <div class="kpi-label">Opérationnels</div>
                  </div>
                </div>
                <div class="kpi-card neutral">
                  <div class="kpi-icon">
                    <i class="pi pi-wrench"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.engins?.en_maintenance || 0 }}</div>
                    <div class="kpi-label">En maintenance</div>
                  </div>
                </div>
                <div class="kpi-card neutral">
                  <div class="kpi-icon">
                    <i class="pi pi-times-circle"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.engins?.en_panne || 0 }}</div>
                    <div class="kpi-label">En panne</div>
                  </div>
                </div>
                <div class="kpi-card neutral">
                  <div class="kpi-icon">
                    <i class="pi pi-exclamation-triangle"></i>
                  </div>
                  <div class="kpi-content">
                    <div class="kpi-value">{{ moduleData.engins?.degrades || 0 }}</div>
                    <div class="kpi-label">Dégradés</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Performances & Disponibilité -->
            <div v-if="isMetricSelected('disponibilite_engins') || isMetricSelected('utilisation_reelle') || isMetricSelected('fiabilite_chantier')" class="performance-section">
              <h2>Performances & Disponibilité</h2>
              <div class="performance-cards">
                <div v-if="isMetricSelected('disponibilite_engins')" class="performance-card">
                  <div class="performance-header">
                    <span class="performance-name">Disponibilité</span>
                    <span class="performance-value" :class="getThresholdClass(moduleData.engins?.disponibilite, 'disponibilite_engins')">{{ moduleData.engins?.disponibilite || 0 }}%</span>
                  </div>
                  <ProgressBar
                    :value="moduleData.engins?.disponibilite || 0"
                    :showValue="false"
                    class="performance-bar"
                  />
                  <div class="performance-desc">Heures moteur ON / Heures planifiées</div>
                </div>
                <div v-if="isMetricSelected('utilisation_reelle')" class="performance-card">
                  <div class="performance-header">
                    <span class="performance-name">Utilisation réelle</span>
                    <span class="performance-value">{{ moduleData.engins?.utilisation_reelle || 0 }}%</span>
                  </div>
                  <ProgressBar
                    :value="moduleData.engins?.utilisation_reelle || 0"
                    :showValue="false"
                    class="performance-bar"
                  />
                  <div class="performance-desc">Heures utilisées / Heures disponibles</div>
                </div>
                <div v-if="isMetricSelected('fiabilite_chantier')" class="performance-card">
                  <div class="performance-header">
                    <span class="performance-name">Fiabilité</span>
                    <span class="performance-value" :class="getThresholdClass(moduleData.engins?.fiabilite, 'fiabilite_machine')">{{ moduleData.engins?.fiabilite || 0 }}%</span>
                  </div>
                  <ProgressBar
                    :value="moduleData.engins?.fiabilite || 0"
                    :showValue="false"
                    class="performance-bar"
                  />
                  <div class="performance-desc">MTBF / (MTBF + MTTR) × 100</div>
                </div>
                <div class="performance-card">
                  <div class="performance-header">
                    <span class="performance-name">Charge Capa</span>
                    <span class="performance-value">{{ moduleData.engins?.charge_capa || 0 }}%</span>
                  </div>
                  <ProgressBar
                    :value="moduleData.engins?.charge_capa || 0"
                    :showValue="false"
                    class="performance-bar"
                  />
                  <div class="performance-desc">Charge capacitaire de la flotte</div>
                </div>
              </div>
            </div>

            <!-- Temps de fonctionnement -->
            <div class="operating-time-section">
              <h2>Temps de fonctionnement</h2>
              <div class="operating-cards">
                <div class="operating-card on">
                  <div class="operating-header">
                    <div class="operating-icon">
                      <i class="pi pi-play-circle"></i>
                    </div>
                    <div class="operating-content">
                      <div class="operating-value">{{ moduleData.engins?.heures_moteur_on || 0 }}h</div>
                      <div class="operating-label">Moteur ON</div>
                    </div>
                  </div>
                  <div class="operating-details">
                    <div class="detail-item">
                      <span class="detail-label">Aujourd'hui</span>
                      <span class="detail-value">{{ moduleData.engins?.heures_on_today || 0 }}h</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Cette semaine</span>
                      <span class="detail-value">{{ moduleData.engins?.heures_on_week || 0 }}h</span>
                    </div>
                  </div>
                </div>
                <div class="operating-card off">
                  <div class="operating-header">
                    <div class="operating-icon">
                      <i class="pi pi-pause-circle"></i>
                    </div>
                    <div class="operating-content">
                      <div class="operating-value">{{ moduleData.engins?.heures_off_week || 0 }}h</div>
                      <div class="operating-label">Moteur OFF</div>
                    </div>
                  </div>
                  <div class="operating-details">
                    <div class="detail-item">
                      <span class="detail-label">Aujourd'hui</span>
                      <span class="detail-value">{{ moduleData.engins?.heures_off_today || 0 }}h</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Cette semaine</span>
                      <span class="detail-value">{{ moduleData.engins?.heures_off_week || 0 }}h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fiabilité & Maintenance -->
            <div v-if="isMetricSelected('mttr') || isMetricSelected('mtbf')" class="reliability-section">
              <h2>Fiabilité & Maintenance</h2>
              <div class="reliability-cards">
                <div v-if="isMetricSelected('mttr')" class="reliability-card">
                  <div class="reliability-icon">
                    <i class="pi pi-wrench"></i>
                  </div>
                  <div class="reliability-content">
                    <div class="reliability-value" :class="getThresholdClass(moduleData.engins?.mttr, 'mttr')">{{ moduleData.engins?.mttr || 0 }}min</div>
                    <div class="reliability-label">MTTR</div>
                    <div class="reliability-desc">Temps moyen de réparation</div>
                  </div>
                </div>
                <div v-if="isMetricSelected('mtbf')" class="reliability-card">
                  <div class="reliability-icon">
                    <i class="pi pi-clock"></i>
                  </div>
                  <div class="reliability-content">
                    <div class="reliability-value" :class="getThresholdClass(moduleData.engins?.mtbf, 'mtbf')">{{ moduleData.engins?.mtbf || 0 }}h</div>
                    <div class="reliability-label">MTBF</div>
                    <div class="reliability-desc">Temps moyen entre pannes</div>
                  </div>
                </div>
                <div class="reliability-card">
                  <div class="reliability-icon">
                    <i class="pi pi-exclamation-triangle"></i>
                  </div>
                  <div class="reliability-content">
                    <div class="reliability-value">{{ moduleData.engins?.alertes_moteur || 0 }}</div>
                    <div class="reliability-label">Alertes moteur</div>
                    <div class="reliability-desc">Surchauffe, surconsommation</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mode Dégradé -->
            <div class="degraded-mode-section">
              <h2>Mode Dégradé</h2>
              <div class="degraded-mode-cards">
                <div class="degraded-mode-card">
                  <div class="degraded-mode-header">
                    <div class="degraded-mode-icon">
                      <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div class="degraded-mode-content">
                      <div class="degraded-mode-value" :class="getDegradedModeClass(moduleData.engins?.ratio_pannes_utilisation)">
                        {{ formatDegradedModeRatio(moduleData.engins?.ratio_pannes_utilisation) }}
                      </div>
                      <div class="degraded-mode-label">Ratio Pannes/Utilisation</div>
                      <div class="degraded-mode-desc">{{ getDegradedModeStatus(moduleData.engins?.ratio_pannes_utilisation) }}</div>
                    </div>
                  </div>
                  <div class="degraded-mode-details">
                    <div class="degraded-detail">
                      <span class="detail-label">Pannes:</span>
                      <span class="detail-value">{{ moduleData.engins?.nombre_pannes || 0 }}</span>
                    </div>
                    <div class="degraded-detail">
                      <span class="detail-label">Utilisation:</span>
                      <span class="detail-value">{{ moduleData.engins?.heures_utilisation || 0 }}h</span>
                    </div>
                    <div class="degraded-detail">
                      <span class="detail-label">Seuil configuré:</span>
                      <span class="detail-value">{{ formatDegradedModeRatio(thresholdConfigStore.getThresholdById('degradedMode')?.currentValue) }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="threshold-config-card">
                  <div class="threshold-header">
                    <div class="threshold-icon">
                      <i class="pi pi-cog"></i>
                    </div>
                    <div class="threshold-content">
                      <div class="threshold-label">Configuration Seuil</div>
                      <div class="threshold-desc">Ajuster le seuil de déclenchement</div>
                    </div>
                  </div>
                  <div class="threshold-controls">
                    <div class="threshold-input-group">
                      <label for="degraded-threshold">Seuil (ratio):</label>
                      <input 
                        id="degraded-threshold"
                        type="number" 
                        :value="thresholdConfigStore.getThresholdById('degradedMode')?.currentValue || 0.020"
                        @input="updateDegradedModeThreshold($event.target.value)"
                        :min="thresholdConfigStore.getThresholdById('degradedMode')?.minValue || 0.001"
                        :max="thresholdConfigStore.getThresholdById('degradedMode')?.maxValue || 0.500"
                        :step="thresholdConfigStore.getThresholdById('degradedMode')?.step || 0.001"
                        class="threshold-input"
                      />
                    </div>
                    <div class="threshold-levels">
                      <div class="level-indicator normal">
                        <span class="level-dot"></span>
                        <span class="level-text">Normal (≤ {{ formatDegradedModeRatio(thresholdConfigStore.getThresholdById('degradedMode')?.currentValue) }})</span>
                      </div>
                      <div class="level-indicator degraded">
                        <span class="level-dot"></span>
                        <span class="level-text">Dégradé (> {{ formatDegradedModeRatio(thresholdConfigStore.getThresholdById('degradedMode')?.currentValue) }})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Consommation & Alertes -->
            <div v-if="isMetricSelected('consommation_carburant') || showAlerts" class="consumption-section">
              <h2>Consommation & Alertes</h2>
              <div class="consumption-cards">
                <div v-if="isMetricSelected('consommation_carburant')" class="consumption-card">
                  <div class="consumption-header">
                    <div class="consumption-icon">
                      <i class="pi pi-bolt"></i>
                    </div>
                    <div class="consumption-content">
                      <div class="consumption-value">{{ moduleData.engins?.consommation_carburant || 0 }}</div>
                      <div class="consumption-label">Consommation carburant</div>
                      <div class="consumption-unit">L/h</div>
                    </div>
                  </div>
                  <div class="consumption-trend" v-if="showTrends">
                    <div class="trend-item">
                      <span class="trend-label">Moyenne</span>
                      <span class="trend-value">{{ moduleData.engins?.consommation_moyenne || 0 }} L/h</span>
                    </div>
                    <div class="trend-item">
                      <span class="trend-label">Optimale</span>
                      <span class="trend-value">{{ moduleData.engins?.consommation_optimale || 0 }} L/h</span>
                    </div>
                  </div>
                </div>
                <div v-if="showAlerts" class="alerts-moteur-card">
                  <div class="alerts-header">
                    <h3>Alertes actives</h3>
                    <Badge :value="moduleData.engins?.alertes_actives || 0" severity="secondary" />
                  </div>
                  <div class="alerts-list">
                    <div
                      v-for="alerte in moduleData.engins?.alertes_actives_list || []"
                      :key="alerte.id"
                      class="alert-item"
                      :class="alerte.type || alerte.priority"
                    >
                      <div class="alert-icon">
                        <i :class="getEngineAlertIcon(alerte.type)"></i>
                      </div>
                      <div class="alert-content">
                        <div class="alert-message">{{ alerte.message }}</div>
                        <div class="alert-engin">{{ alerte.engin_name }}</div>
                      </div>
                      <div class="alert-time">{{ formatTime(alerte.timestamp) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vue spécifique Analytics - maintenant affichée en haut directement -->
      <!-- Supprimé car PublishedDashboards est affiché directement -->

    </div>

    <!-- État de chargement global -->
    <div v-if="loading && !moduleData" class="loading-container">
      <ProgressSpinner />
      <p>Chargement du tableau de bord...</p>
    </div>

    <!-- État d'erreur -->
    <div v-if="error" class="error-container">
      <Message severity="error" :closable="false">
        <div class="error-content">
          <h3>Erreur de chargement</h3>
          <p>{{ error }}</p>
          <Button 
            label="Réessayer" 
            icon="pi pi-refresh"
            @click="refreshData"
          />
        </div>
      </Message>
    </div>

  </div>


  <!-- Activities Drawer -->
  <Drawer
    v-model:visible="showActivitiesDrawer"
    position="full"
    header="Activités récentes"
    class="activities-drawer"
  >
    <div class="activities-drawer-content">
      <div class="drawer-header-info">
        <p class="drawer-subtitle">Historique complet des activités sur tous les modules</p>
        <div class="drawer-stats">
          <div class="stat-chip">
            <i class="pi pi-list"></i>
            <span>{{ recentActivities.length }} activités</span>
          </div>
          <div class="stat-chip">
            <i class="pi pi-clock"></i>
            <span>Dernières 24h</span>
          </div>
        </div>
      </div>

      <div class="activities-full-list">
        <div
          v-for="activity in recentActivities"
          :key="activity.id"
          class="activity-card"
          :class="activity.severity"
          @click="viewActivityDetails(activity)"
        >
          <div class="activity-card-header">
            <div class="activity-icon-large" :class="activity.severity">
              <i :class="getActivityIcon(activity.type, activity.severity)"></i>
            </div>
            <div class="activity-main-info">
              <h3 class="activity-title">{{ activity.message }}</h3>
              <div class="activity-meta-full">
                <Tag :value="getModuleName(activity.module)" severity="secondary" />
                <span class="meta-item">
                  <i class="pi pi-map-marker"></i>
                  {{ activity.location }}
                </span>
                <span class="meta-item">
                  <i class="pi pi-clock"></i>
                  {{ formatTime(activity.timestamp) }}
                </span>
              </div>
            </div>
            <Button
              icon="pi pi-chevron-right"
              text
              rounded
              class="view-details-btn"
            />
          </div>

          <div v-if="selectedActivity?.id === activity.id" class="activity-details-panel">
            <div class="details-grid">
              <div
                v-for="(value, key) in activity.details"
                :key="key"
                class="detail-item"
              >
                <span class="detail-label">{{ formatDetailLabel(key) }}</span>
                <span class="detail-value">{{ value }}</span>
              </div>
            </div>
            <div class="details-actions">
              <Button
                v-if="activity.actionable"
                label="Voir plus"
                icon="pi pi-external-link"
                size="small"
                @click="handleActivityAction(activity)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Drawer>

</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { axiosInstance } from '@/main.js'
import { useClientConfigStore } from '../stores/clientConfigStore.js'
import { useDashboardStore } from '../stores/dashboardStore.js'
import { useThresholdConfigStore } from '../stores/thresholdConfigStore.js'
import DashboardFilters from '../components/DashboardFilters.vue'
import CollectModuleCard from '../components/CollectModuleCard.vue'
import MESModuleCard from '../components/MESModuleCard.vue'
import EnginsModuleCard from '../components/EnginsModuleCard.vue'
import RecentActivities from '../components/RecentActivities.vue'
import TeamOverviewCards from '../components/TeamOverviewCards.vue'
import TeamPerformanceChart from '../components/TeamPerformanceChart.vue'
import TeamKPIChart from '../components/TeamKPIChart.vue'
import EnginsOverviewCards from '../components/EnginsOverviewCards.vue'
import EnginsReliabilityChart from '../components/EnginsReliabilityChart.vue'
import EnginsLocationMap from '../components/EnginsLocationMap.vue'
import EnginsAlertsPanel from '../components/EnginsAlertsPanel.vue'
import { useAIRecommendationsStore } from '@/features/dashboard/stores/aiRecommendationsStore.js'
import PublishedDashboards from '@/features/analytics/components/PublishedDashboards.vue'
import { useModuleAccess } from '@/shared/composables/useModuleAccess'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Popover from 'primevue/popover'
import { useAnalyticsStore } from '@/features/analytics/stores/analyticsStore'

// Composables
const router = useRouter()
const { hasModule } = useModuleAccess()
const toast = useToast()
const clientConfigStore = useClientConfigStore()
const dashboardStore = useDashboardStore()
const thresholdConfigStore = useThresholdConfigStore()
const aiRecommendationsStore = useAIRecommendationsStore()

// Store state
const {
  clientConfig,
  loading: configLoading,
  enabledModules,
  isModuleEnabled
} = storeToRefs(clientConfigStore)

const {
  stats,
  activities,
  loading: dashboardLoading,
  error
} = storeToRefs(dashboardStore)

// Local state
const activeTabIndex = ref(0)
const dashboardFilters = ref({
  period: 'week',
  selectedModules: [],
  selectedMetrics: ['trs', 'performance', 'qualite'],
  selectedStatuses: ['active', 'warning', 'error', 'maintenance', 'stopped'],
  groupBy: null,
  displayPreferences: ['showTrends', 'showAlerts'],
  showAdvanced: false,
  compactView: false,
  showAlerts: true,
  autoRefresh: false,
  showTrends: true
})
const moduleData = ref({})
const recentActivities = ref([])
const aiRecommendations = ref([])
const globalStats = ref({
  trs_global: 0,
  machines_actives: 0,
  machines_total: 0,
  engins_operationnels: 0,
  disponibilite_engins: 0,
  alertes_actives: 0,
  alertes_critiques: 0
})

// Teams data - chargées depuis le backend
const teamsData = ref([])

// Analytics store
const analyticsStore = useAnalyticsStore()

// Published dashboards state
const publishedDashboards = ref([])
const selectedDashboardId = ref(null)

// Date filter state
const dateRange = ref([
  new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1),
  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
])
const selectedPeriod = ref('12months')
const datePopover = ref(null)

// Formatted date range for display
const formattedDateRange = computed(() => {
  if (!dateRange.value || !dateRange.value[0]) return 'Période'
  const start = dateRange.value[0]
  const end = dateRange.value[1] || start
  const fmt = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${fmt(start)} - ${fmt(end)}`
})

// Toggle date popover
const toggleDatePopover = (event) => {
  datePopover.value.toggle(event)
}

// Load published dashboards
const loadPublishedDashboards = async () => {
  try {
    const allDashboards = await analyticsStore.getDashboards()
    publishedDashboards.value = allDashboards.filter(d => d.is_shared)
    if (publishedDashboards.value.length > 0 && !selectedDashboardId.value) {
      selectedDashboardId.value = publishedDashboards.value[0].id
    }
  } catch (error) {
    console.error('Error loading dashboards:', error)
  }
}

// Quick period options
const quickPeriods = [
  { key: '7days', label: '7 jours' },
  { key: '30days', label: '30 jours' },
  { key: '3months', label: '3 mois' },
  { key: '12months', label: '12 mois' },
  { key: 'ytd', label: 'Annee' }
]

// Select quick period
const selectQuickPeriod = (periodKey) => {
  selectedPeriod.value = periodKey
  const today = new Date()
  let startDate, endDate

  switch (periodKey) {
    case '7days':
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 7)
      endDate = today
      break
    case '30days':
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 30)
      endDate = today
      break
    case '3months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      break
    case '12months':
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      break
    case 'ytd':
      startDate = new Date(today.getFullYear(), 0, 1)
      endDate = today
      break
    default:
      return
  }
  dateRange.value = [startDate, endDate]
}

// Handle date selection from picker
const onDateSelect = () => {
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    selectedPeriod.value = 'custom'
  }
}

// Import du store engins
import { useEnginsStore } from '@/features/engins/stores/enginsStore.js'
const enginsStore = useEnginsStore()

// Données des engins (utilisation du store)
const enginsRawData = computed(() => enginsStore.engins)

// Données formatées pour les cartes d'aperçu
const enginsData = computed(() => {
  const engins = enginsStore.engins
  const globalKPIs = enginsStore.globalKPIs
  const criticalAlerts = enginsStore.criticalAlerts.length
  const allAlerts = enginsStore.allAlerts.length
  
  // Calculer les trackers actifs (seulement ceux avec isActive = true)
  const activeTrackers = engins.filter(e => e.tracker?.isActive === true).length
  
  // Calculer la moyenne du signal et de la batterie seulement pour les trackers actifs
  const activeTrackersList = engins.filter(e => e.tracker?.isActive === true)
  const averageSignalStrength = activeTrackersList.length > 0 
    ? Math.round(activeTrackersList.reduce((sum, e) => sum + (e.tracker?.signalStrength || 0), 0) / activeTrackersList.length * 20) // Convertir en pourcentage (0-5 -> 0-100)
    : 0
  const averageBatteryLevel = activeTrackersList.length > 0
    ? Math.round(activeTrackersList.reduce((sum, e) => sum + (e.tracker?.batteryLevel || 0), 0) / activeTrackersList.length)
    : 0
  
  return {
    totalCount: enginsStore.enginsCount,
    activeCount: enginsStore.activeEngins.length,
    operationalCount: enginsStore.operationalEngins?.length || enginsStore.activeEngins.length, // Engins opérationnels
    inactiveCount: enginsStore.inactiveEngins.length,
    maintenanceCount: enginsStore.maintenanceEngins.length,
    averageReliability: globalKPIs.reliability || 0,
    averageUptime: globalKPIs.uptime || 0,
    averageBreakdownRate: globalKPIs.breakdownRate || 0,
    averageRepairRate: globalKPIs.repairRate || 0,
    averageMaintenanceScore: globalKPIs.maintenanceScore || 0,
    averageFuelEfficiency: globalKPIs.fuelEfficiency || 0,
    criticalAlerts,
    totalAlerts: allAlerts,
    breakdownTrend: globalKPIs.breakdownTrend || null,
    breakdownTrendValue: globalKPIs.breakdownTrendValue || 0,
    activeTrackers,
    averageSignalStrength,
    averageBatteryLevel,
    locationsCount: engins.filter(e => e.location?.latitude && e.location?.longitude).length
  }
})

// Computed pour les engins en mode dégradé
const degradedEngins = computed(() => {
  const engins = enginsStore.engins
  return engins.filter(engin => 
    ['MAINTENANCE', 'INACTIVE', 'BREAKDOWN', 'STOPPED', 'DEGRADED'].includes(engin.status)
  )
})

// Computed
const loading = computed(() => configLoading.value || dashboardLoading.value)

// Vérifie si le mode demo est activé pour le client
const isDemoEnabled = computed(() => hasModule('demo'))

const tabItems = computed(() => {
  const items = []

  // Vue d'ensemble - uniquement si demo est activé
  if (isDemoEnabled.value && enabledModules.value.length > 1) {
    items.push({
      label: 'Vue d\'ensemble',
      icon: 'pi pi-th-large',
      value: 'overview'
    })
  }

  // Afficher les modules (Kap Collect, Kap MES) uniquement si demo est activé
  if (isDemoEnabled.value) {
    enabledModules.value.forEach(moduleId => {
      const moduleConfig = clientConfigStore.getModuleMetadata(moduleId)
      if (moduleConfig) {
        items.push({
          label: moduleConfig.name,
          icon: moduleConfig.icon,
          value: moduleId
        })
      }
    })
  }

  // Analytics toujours disponible (pas un dashboard par défaut)
  items.push({
    label: 'Analytics',
    icon: 'pi pi-chart-line',
    value: 'analytics'
  })

  return items
})

// Afficher la navigation par onglets seulement s'il y a plus d'un onglet
const showTabNavigation = computed(() => tabItems.value.length > 1)

const activeTab = computed(() => {
  const currentTab = tabItems.value[activeTabIndex.value]
  // Si l'onglet actuel n'existe pas, prendre le premier onglet disponible
  if (!currentTab && tabItems.value.length > 0) {
    return tabItems.value[0].value
  }
  return currentTab ? currentTab.value : 'analytics'
})

// Methods
const isMetricSelected = (metricValue) => {
  return dashboardFilters.value.selectedMetrics && dashboardFilters.value.selectedMetrics.includes(metricValue)
}

const isStatusIncluded = (status) => {
  return dashboardFilters.value.selectedStatuses && dashboardFilters.value.selectedStatuses.includes(status)
}

const isCompactView = computed(() => {
  return dashboardFilters.value.displayPreferences && dashboardFilters.value.displayPreferences.includes('compactView')
})

const showAlerts = computed(() => {
  return dashboardFilters.value.displayPreferences && dashboardFilters.value.displayPreferences.includes('showAlerts')
})

const showTrends = computed(() => {
  return dashboardFilters.value.displayPreferences && dashboardFilters.value.displayPreferences.includes('showTrends')
})

// Team event handlers
const handleCreateTeam = () => {
  router.push('/teams')
}

const handleEvaluateKPIs = () => {
  router.push('/team-performance')
}

const handleViewMedia = () => {
  router.push('/mediatheque')
}

const handleViewAllActivities = () => {
  // Navigate to activities page or show modal
  toast.add({
    severity: 'info',
    summary: 'Navigation',
    detail: 'Redirection vers la page des activités...',
    life: 2000
  })
}


const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Helper pour parser les valeurs OEE (gère les chaînes JSON ou objets)
const getOEEValue = (machine, property) => {
  if (!machine) return 0
  
  // Si machine.oee est une chaîne JSON, la parser
  let oee = machine.oee
  if (typeof oee === 'string') {
    try {
      oee = JSON.parse(oee)
    } catch {
      oee = null
    }
  }
  
  // Si oee est toujours un objet (pas null), extraire la valeur
  if (oee && typeof oee === 'object' && oee !== null && !Array.isArray(oee)) {
    const value = oee[property]
    if (value !== undefined && value !== null) {
      const numValue = typeof value === 'number' ? value : parseFloat(value)
      if (!isNaN(numValue)) {
        return Math.round(numValue * 10) / 10 // Arrondir à 1 décimale
      }
    }
  }
  
  // Fallback vers les propriétés directes de la machine
  const fallbackMap = {
    global: machine.trs,
    availability: machine.disponibilite,
    performance: machine.performance,
    quality: machine.qualite
  }
  
  const fallbackValue = fallbackMap[property]
  if (fallbackValue !== undefined && fallbackValue !== null) {
    const numValue = typeof fallbackValue === 'number' ? fallbackValue : parseFloat(fallbackValue)
    if (!isNaN(numValue)) {
      return Math.round(numValue * 10) / 10
    }
  }
  
  return 0
}

const isModuleVisible = (moduleId) => {
  const isEnabled = isModuleEnabled.value(moduleId)
  const selectedModules = dashboardFilters.value.selectedModules || []
  
  // Si aucun module spécifiquement sélectionné, montrer tous les modules activés
  if (selectedModules.length === 0) {
    return isEnabled
  }
  
  return isEnabled && selectedModules.includes(moduleId)
}

const onTabChange = (event) => {
  activeTabIndex.value = event.index
}

const onModuleAction = (action) => {
  switch (action.type) {
    case 'navigate':
      router.push(action.route)
      break
    case 'create':
      // Logique de création
      break
    default:
  }
}

const refreshData = async () => {
  try {
    await Promise.all([
      dashboardStore.loadDashboardData(),
      loadModuleSpecificData()
    ])
    
    // Recharger les recommandations IA après mise à jour des données
    loadAIRecommendations()
    
    toast.add({
      severity: 'success',
      summary: 'Données actualisées',
      detail: 'Le tableau de bord a été mis à jour',
      life: 2000
    })
  } catch {
    // Erreur silencieuse - les données seront rechargées au prochain refresh
  }
}

const loadModuleSpecificData = async () => {
  // Charger les données spécifiques à chaque module activé
  const promises = enabledModules.value.map(async (moduleId) => {
    try {
      switch (moduleId) {
        case 'collect':
          moduleData.value.collect = await loadCollectData()
          break
        case 'mes':
          moduleData.value.mes = await loadMESData()
          break
        case 'engins':
          moduleData.value.engins = await loadEnginsData()
          break
      }
    } catch {
      // Erreur silencieuse - les modules non chargés garderont leurs données par défaut
    }
  })
  
  await Promise.all(promises)
}

const loadCollectData = async () => {
  try {
    // Essayer d'abord l'endpoint dashboard pour les collectes
    try {
      const response = await axiosInstance.get('/collect/collects/dashboard/')
      const data = response.data
      
      // Calculer les collectes en cours avec progression
      const enCours = data.recent_collects?.filter(c => c.status === 'EN_COURS') || []
      const progressions = enCours.map(c => ({
        id: c.id,
        title: c.title,
        progress: c.progress || 0
      }))
      
      return {
        total: data.total || 0,
        actives: data.by_status?.find(s => s.status === 'EN_COURS')?.count || 0,
        terminees: (data.by_status?.find(s => s.status === 'TERMINEE')?.count || 0) + 
                   (data.by_status?.find(s => s.status === 'VALIDEE')?.count || 0),
        en_retard: data.overdue || 0,
        progressions: progressions,
        progression_globale: data.avg_progress || 0
      }
    } catch (collectError) {
      // Fallback sur dashboard stats
      const response = await axiosInstance.get('/dashboard/stats/')
      const stats = response.data?.data?.collectes || {}
      
      return {
        total: stats.total || 0,
        actives: stats.actives || 0,
        terminees: stats.terminees || 0,
        en_retard: stats.en_retard || 0,
        progressions: [],
        progression_globale: 0
      }
    }
  } catch {
    return {
      total: 0,
      actives: 0,
      terminees: 0,
      en_retard: 0,
      progressions: [],
      progression_globale: 0
    }
  }
}

const loadMESData = async () => {
  try {
    // Appeler le backend pour les données MES réelles
    const response = await axiosInstance.get('/engins/mes-dashboard/')
    const data = response.data || {
      trs: 0,
      trs_trend: 0,
      machines_actives: 0,
      machines_total: 0,
      machines_operationnelles: 0,
      machines_en_maintenance: 0,
      machines_en_panne: 0,
      taux_qualite: 0,
      charge_capa: 0,
      disponibilite: 0,
      performance: 0,
      taux_rebuts: 0,
      productivite_machine: 0,
      temps_arret: 0,
      demarrages_journaliers: 0,
      temps_arret_total: 0,
      temps_arret_planifies: 0,
      temps_arret_non_planifies: 0,
      alertes: [],
      machines: []
    }
    
    // Parser les valeurs OEE des machines si elles sont des chaînes JSON
    if (data.machines && Array.isArray(data.machines)) {
      data.machines = data.machines.map(machine => {
        if (machine.oee && typeof machine.oee === 'string') {
          try {
            machine.oee = JSON.parse(machine.oee)
          } catch {
            // OEE reste en string si parsing échoue
          }
        }
        return machine
      })
    }
    
    return data
  } catch {
    return {
      trs: 0,
      trs_trend: 0,
      machines_actives: 0,
      machines_total: 0,
      machines_operationnelles: 0,
      machines_en_maintenance: 0,
      machines_en_panne: 0,
      taux_qualite: 0,
      charge_capa: 0,
      disponibilite: 0,
      performance: 0,
      taux_rebuts: 0,
      productivite_machine: 0,
      temps_arret: 0,
      demarrages_journaliers: 0,
      temps_arret_total: 0,
      temps_arret_planifies: 0,
      temps_arret_non_planifies: 0,
      alertes: [],
      machines: []
    }
  }
}

const loadEnginsData = async () => {
  // Charger les données depuis le store
  try {
    await enginsStore.loadEngins()
  } catch {
    // Erreur silencieuse - utilisation des données par défaut
  }

  const engins = enginsStore.engins || []
  const globalKPIs = enginsStore.globalKPIs || {}
  const activeEngins = enginsStore.activeEngins || []
  const operationalEngins = enginsStore.operationalEngins || activeEngins // Engins opérationnels (ACTIVE + DEGRADED)
  const maintenanceEngins = enginsStore.maintenanceEngins || []

  // Si aucun engin, retourner des données par défaut
  if (engins.length === 0) {
    return {
      total: 0,
      operationnels: 0,
      en_maintenance: 0,
      en_panne: 0,
      degrades: 0,
      disponibilite: 0,
      utilisation: 0,
      charge_capa: 0,
      fiabilite: 0,
      heures_moteur_on: 0,
      heures_moteur_off: 0,
      heures_on_today: 0,
      heures_on_week: 0,
      heures_off_today: 0,
      heures_off_week: 0,
      mttr: 0,
      mtbf: 0,
      alertes_moteur: 0,
      alertes_actives: 0,
      alertes_actives_list: [],
      consommation_carburant: 0,
      consommation_moyenne: 0,
      consommation_optimale: 0,
      ratio_pannes_utilisation: 0,
      nombre_pannes: 0,
      heures_utilisation: 0,
      message: 'Aucun engin trouvé. Exécutez les fixtures pour générer des données de test.'
    }
  }


  // Calculer les heures moteur ON (total des heures de fonctionnement)
  const heuresMoteurON = engins.reduce((sum, e) => sum + (e.operatingHours || 0), 0)

  // Calculer les heures planifiées en fonction du nombre d'engins opérationnels (8h/jour * 30 jours)
  // Utiliser les engins opérationnels (ACTIVE + DEGRADED) plutôt que seulement ACTIVE
  const heuresPlanifiees = operationalEngins.length > 0 ? operationalEngins.length * 8 * 30 : engins.length * 8 * 30

  // Calculer la disponibilité réelle (limiter à 100%)
  const disponibilite = heuresPlanifiees > 0 ? Math.min(100, Math.round((heuresMoteurON / heuresPlanifiees) * 100)) : 0

  // Calculer MTTR et MTBF
  // MTTR = Temps moyen de réparation (en heures)
  // MTBF = Temps moyen entre pannes (en heures)
  const nombrePannes = maintenanceEngins.length || 1

  const mttr = 0

  // MTBF calculé depuis les heures de fonctionnement
  const mtbf = nombrePannes > 0 ? Math.round(heuresMoteurON / nombrePannes) : 0

  // Calculer le taux d'utilisation réelle
  const heuresUtilisees = heuresMoteurON
  const heuresDisponibles = operationalEngins.length > 0 ? operationalEngins.length * 8 * 30 : heuresPlanifiees
  const utilisationReelle = heuresDisponibles > 0 ? Math.min(100, Math.round((heuresUtilisees / heuresDisponibles) * 100)) : 0

  // Calculer la fiabilité: MTBF / (MTBF + MTTR) × 100
  const fiabilite = (mtbf + mttr) > 0 ? Math.round((mtbf / (mtbf + mttr)) * 100) : 0

  // Collecter les alertes moteur
  const alertesMoteur = engins.flatMap(e => e.alerts || []).filter(a =>
    a.type === 'CRITICAL' || a.message.toLowerCase().includes('moteur')
  )

  // Calculer la consommation carburant moyenne (15L/h par engin)
  const consommationMoyenne = engins.length > 0 ? Math.round((heuresMoteurON * 15) / engins.length) : 0
  const consommationOptimale = Math.round(consommationMoyenne * 0.8) // 20% moins que la moyenne

  // Calculer le ratio pannes/utilisation
  const ratioPannesUtilisation = heuresMoteurON > 0 ? nombrePannes / heuresMoteurON : 0

  // Calculer la charge capacitaire de la flotte
  // Basée sur le ratio entre heures utilisées et heures disponibles pour tous les engins
  const totalEngins = engins.length
  const heuresDisponiblesTotal = totalEngins > 0 ? totalEngins * 8 * 30 : 1 // 8h/jour × 30 jours par engin
  const chargeCapa = heuresDisponiblesTotal > 0 
    ? Math.min(100, Math.round((heuresMoteurON / heuresDisponiblesTotal) * 100))
    : 0

  // Charger les statistiques d'heures ON/OFF pour aujourd'hui et cette semaine
  let heuresOnToday = 0
  let heuresOnWeek = 0
  let heuresOffToday = 0
  let heuresOffWeek = 0
  
  try {
    // Utiliser axiosInstance qui est déjà disponible dans le scope
    const hoursStatsResponse = await axiosInstance.get('engins/machines/operating_hours_stats/')
    if (hoursStatsResponse.data) {
      heuresOnToday = hoursStatsResponse.data.heures_on_today || 0
      heuresOnWeek = hoursStatsResponse.data.heures_on_week || 0
      heuresOffToday = hoursStatsResponse.data.heures_off_today || 0
      heuresOffWeek = hoursStatsResponse.data.heures_off_week || 0
    }
  } catch {
    // Fallback : estimer basé sur le statut des engins
    const operationalCount = operationalEngins.length || engins.length
    heuresOnToday = operationalCount * 8  // 8h par engin opérationnel aujourd'hui
    heuresOnWeek = operationalCount * 8 * 7  // 8h par engin × 7 jours
    heuresOffToday = Math.max(0, (operationalCount * 8) - heuresOnToday)
    heuresOffWeek = Math.max(0, (operationalCount * 8 * 7) - heuresOnWeek)
  }

  // Calculer heures moteur OFF (utiliser les heures OFF de la semaine pour cohérence)
  // Le total affiché représente les heures OFF de la semaine, cohérent avec les détails
  const heuresMoteurOFF = heuresOffWeek > 0 ? heuresOffWeek : Math.max(0, heuresPlanifiees - heuresMoteurON)

  const breakdownEngins = engins.filter(e => e.status === 'BREAKDOWN')
  const degradedEnginsCount = engins.filter(e => e.status === 'DEGRADED')
  
  // Compter les alertes actives (non résolues)
  const allAlerts = engins.flatMap(e => e.alerts || [])
  const activeAlerts = allAlerts.filter(a => 
    a.status === 'OPEN' || 
    a.status === 'ACTIVE' || 
    (!a.resolved && !a.status?.includes('RESOLVED') && !a.status?.includes('CLOSED'))
  )

  return {
    total: engins.length,
    operationnels: operationalEngins.length, // Engins opérationnels (ACTIVE + DEGRADED)
    en_maintenance: maintenanceEngins.length,
    en_panne: breakdownEngins.length,
    degrades: degradedEnginsCount.length,
    disponibilite,
    utilisation: utilisationReelle,
    charge_capa: Math.round(chargeCapa), // Charge Capa KPI
    mttr: Math.round(mttr * 10) / 10, // Arrondi à 1 décimale, en heures
    mtbf, // en heures
    fiabilite,
    heures_moteur: Math.round(heuresMoteurON), // Ajout pour l'affichage
    heures_moteur_on: Math.round(heuresMoteurON),
    heures_moteur_off: Math.round(heuresMoteurOFF),
    heures_on_today: Math.round(heuresOnToday),
    heures_on_week: Math.round(heuresOnWeek),
    heures_off_today: Math.round(heuresOffToday),
    heures_off_week: Math.round(heuresOffWeek),
    heures_utilisation: Math.round(heuresMoteurON),
    nombre_pannes: nombrePannes,
    ratio_pannes_utilisation: ratioPannesUtilisation,
    alertes_moteur: alertesMoteur.length,
    alertes_actives: activeAlerts.length, // Nombre d'alertes actives
    alertes_actives_list: activeAlerts, // Liste des alertes actives
    consommation_carburant: consommationMoyenne,
    consommation_moyenne: consommationMoyenne,
    consommation_optimale: consommationOptimale
  }
}


const applyFilters = async () => {
  // Appliquer les filtres et recharger les données
  await loadModuleSpecificData()
}

const onFiltersChanged = async (filters) => {
  dashboardFilters.value = filters
  await applyFilters()
  
  // Appliquer les filtres aux engins aussi
  if (filters.selectedMetrics && filters.selectedMetrics.length > 0) {
    // Filtrer les métriques des engins selon les filtres sélectionnés
    const enginsMetrics = filters.selectedMetrics.filter(metric => 
      ['mttr', 'mtbf', 'disponibilite_engins', 'heures_moteur_on', 'heures_moteur_off', 
       'utilisation_reelle', 'consommation_carburant', 'fiabilite_chantier', 'alertes_moteur',
       'planification', 'efficacite_chantier'].includes(metric)
    )
    
    if (enginsMetrics.length > 0) {
      // Recharger les données des engins avec les filtres appliqués
      await enginsStore.loadEngins()
    }
  }
}

const showActivitiesDrawer = ref(false)
const selectedActivity = ref(null)

const viewAllActivities = () => {
  showActivitiesDrawer.value = true
}

const viewActivityDetails = (activity) => {
  if (selectedActivity.value?.id === activity.id) {
    selectedActivity.value = null
  } else {
    selectedActivity.value = activity
  }
}

const getActivityIcon = (type, severity) => {
  const icons = {
    collect: 'pi pi-database',
    alert: 'pi pi-exclamation-triangle',
    maintenance: 'pi pi-wrench',
    production: 'pi pi-cog',
    quality: 'pi pi-check-circle'
  }

  if (severity === 'critical') return 'pi pi-times-circle'
  if (severity === 'warning') return 'pi pi-exclamation-triangle'

  return icons[type] || 'pi pi-info-circle'
}

const getModuleName = (moduleId) => {
  const modules = {
    collect: 'KAP Collect',
    mes: 'KAP MES',
    engins: 'KAP Engins'
  }
  return modules[moduleId] || moduleId
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffMins = Math.floor((now - date) / 60000)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Il y a ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `Il y a ${diffDays}j`
}

const formatDetailLabel = (key) => {
  const labels = {
    user: 'Utilisateur',
    items: 'Articles',
    duration: 'Durée',
    status: 'Statut',
    machine: 'Machine',
    temperature: 'Température',
    threshold: 'Seuil',
    action: 'Action',
    equipment: 'Équipement',
    scheduled: 'Planifié',
    technician: 'Technicien',
    type: 'Type',
    target: 'Objectif',
    actual: 'Réalisé',
    efficiency: 'Efficacité',
    shift: 'Équipe',
    lot: 'Lot',
    defects: 'Défauts',
    total: 'Total',
    rate: 'Taux',
    started: 'Démarré',
    estimatedDuration: 'Durée estimée',
    issue: 'Problème',
    partsUsed: 'Pièces utilisées',
    item: 'Article',
    current: 'Stock actuel',
    unit: 'Unité'
  }
  return labels[key] || key
}

const handleActivityAction = (activity) => {
  showActivitiesDrawer.value = false

  switch (activity.type) {
    case 'collect':
      router.push('/collect')
      break
    case 'alert':
      router.push('/mes')
      break
    case 'maintenance':
      router.push('/engins')
      break
    case 'production':
      router.push('/mes')
      break
    case 'quality':
      router.push('/mes')
      break
    default:
  }
}

// Methods pour les vues spécifiques
const createNewCollect = () => {
  toast.add({
    severity: 'info',
    summary: 'Nouvelle collecte',
    detail: 'Redirection vers la création de collecte...',
    life: 2000
  })
  router.push('/user/collect?action=create')
}

const showImportDialog = () => {
  toast.add({
    severity: 'info',
    summary: 'Import CSV',
    detail: 'Fonctionnalité d\'import CSV...',
    life: 2000
  })
}

const getTrendClass = (trend) => {
  if (!trend) return ''
  return trend > 0 ? 'up' : 'down'
}

const getTrendIcon = (trend) => {
  if (!trend) return 'pi pi-minus'
  return trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'
}

const getAlertIcon = (severity) => {
  const icons = {
    'critical': 'pi pi-times-circle',
    'warning': 'pi pi-exclamation-triangle',
    'info': 'pi pi-info-circle'
  }
  return icons[severity] || 'pi pi-info-circle'
}

const getStatusSeverity = (status) => {
  const severities = {
    'active': 'secondary',
    'warning': 'secondary',
    'error': 'secondary',
    'maintenance': 'secondary'
  }
  return severities[status] || 'secondary'
}

// Fonction pour appliquer les classes de seuil selon la documentation métier
const getThresholdClass = (value, metric) => {
  if (!value) return ''
  
  const thresholds = {
    'trs': { excellent: 85, acceptable: 60 },
    'rebuts': { excellent: 2, acceptable: 5, inverse: true }, // Inverse car plus bas = mieux
    'mttr': { excellent: 30, acceptable: 60, inverse: true, unit: 'min' },
    'mtbf': { excellent: 20, acceptable: 10, unit: 'h' },
    'disponibilite_engins': { excellent: 90, acceptable: 70 },
    'fiabilite_machine': { excellent: 90, acceptable: 75 }
  }
  
  const threshold = thresholds[metric]
  if (!threshold) return ''
  
  if (threshold.inverse) {
    // Pour les métriques où plus bas = mieux (rebuts, MTTR)
    if (value <= threshold.excellent) return 'excellent'
    if (value <= threshold.acceptable) return 'acceptable'
    return 'faible'
  } else {
    // Pour les métriques où plus haut = mieux (TRS, disponibilité, etc.)
    if (value >= threshold.excellent) return 'excellent'
    if (value >= threshold.acceptable) return 'acceptable'
    return 'faible'
  }
}

// Fonction pour les icônes d'alertes moteur
const getEngineAlertIcon = (type) => {
  const icons = {
    'surchauffe': 'pi pi-sun',
    'surconsommation': 'pi pi-bolt',
    'arrets_frequents': 'pi pi-pause',
    'maintenance': 'pi pi-wrench',
    'panne': 'pi pi-times-circle'
  }
  return icons[type] || 'pi pi-exclamation-triangle'
}

// Fonctions pour le mode dégradé
const getDegradedModeClass = (ratio) => {
  if (!ratio) return ''
  const evaluation = thresholdConfigStore.evaluateValue('degradedMode', ratio)
  return evaluation.level
}

const getDegradedModeStatus = (ratio) => {
  if (!ratio) return 'Non défini'
  const evaluation = thresholdConfigStore.evaluateValue('degradedMode', ratio)
  return evaluation.label
}

const formatDegradedModeRatio = (ratio) => {
  if (!ratio) return '0.000'
  return (ratio * 1000).toFixed(1) + '‰' // Pour mille
}

const updateDegradedModeThreshold = (newValue) => {
  const value = parseFloat(newValue)
  if (thresholdConfigStore.updateThreshold('degradedMode', value)) {
    toast.add({
      severity: 'success',
      summary: 'Seuil mis à jour',
      detail: `Nouveau seuil mode dégradé: ${formatDegradedModeRatio(value)}`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de mettre à jour le seuil',
      life: 3000
    })
  }
}

// Méthodes pour les engins
const handleRefreshEnginsData = async () => {
  await enginsStore.loadEngins()
  toast.add({
    severity: 'success',
    summary: 'Données actualisées',
    detail: 'Les données des engins ont été mises à jour',
    life: 3000
  })
}

const handleViewLocation = () => {
  toast.add({
    severity: 'info',
    summary: 'Localisation',
    detail: 'Affichage de la carte des engins...',
    life: 3000
  })
}

const handleManageEngins = () => {
  router.push('/engins')
}

const handleViewAlerts = () => {
  toast.add({
    severity: 'info',
    summary: 'Alertes',
    detail: 'Affichage du panneau d\'alertes...',
    life: 3000
  })
}

const handleViewMaintenanceHistory = () => {
  router.push('/user/engins')
  setTimeout(() => {
    toast.add({
      severity: 'info',
      summary: 'Historique de maintenance',
      detail: 'Consultez l\'historique de maintenance de vos engins',
      life: 3000
    })
  }, 500)
}

const handleScheduleMaintenance = () => {
  toast.add({
    severity: 'info',
    summary: 'Planification',
    detail: 'Ouverture du planificateur de maintenance...',
    life: 3000
  })
}

const handleEnginSelected = (engin) => {
  toast.add({
    severity: 'info',
    summary: 'Engin sélectionné',
    detail: `Détails de ${engin.name}`,
    life: 3000
  })
}

const handleRefreshLocations = async () => {
  toast.add({
    severity: 'info',
    summary: 'Actualisation',
    detail: 'Mise à jour des positions GPS...',
    life: 3000
  })
}

const handleViewEngin = (enginId) => {
  router.push(`/engins/${enginId}`)
}

const handleRefreshAlerts = async () => {
  await enginsStore.loadEngins()
  toast.add({
    severity: 'success',
    summary: 'Alertes actualisées',
    detail: 'Les alertes ont été mises à jour',
    life: 3000
  })
}

const handleAlertDismissed = async (alert) => {
  await enginsStore.dismissAlert(alert.enginId, alert.id)
  toast.add({
    severity: 'success',
    summary: 'Alerte ignorée',
    detail: 'L\'alerte a été supprimée',
    life: 3000
  })
}

const handleAlertRead = (alert) => {
  toast.add({
    severity: 'info',
    summary: 'Alerte marquée comme lue',
    detail: `Alerte de ${alert.enginName} traitée`,
    life: 3000
  })
}

// Méthodes pour les recommandations IA
const loadAIRecommendations = () => {
  try {
    const recommendations = aiRecommendationsStore.getAllRecommendations(
      moduleData.value,
      globalStats.value,
      teamsData.value,
      enginsData.value
    )
    aiRecommendations.value = recommendations
  } catch {
    aiRecommendations.value = []
  }
}

const handleRecommendationApplied = (recommendation) => {
  // Ici, on pourrait déclencher des actions spécifiques selon la recommandation
  // Par exemple, ouvrir un modal de configuration, naviguer vers une page, etc.
  
  // Simuler l'application de la recommandation
  setTimeout(() => {
    loadAIRecommendations() // Recharger les recommandations
  }, 1000)
}

const handleRecommendationDismissed = (index) => {
  aiRecommendations.value.splice(index, 1)
}

// Fonctions utilitaires pour les engins en mode dégradé
const getEnginTbdSeverity = (status) => {
  const severities = {
    'MAINTENANCE': 'warning',
    'INACTIVE': 'warning',
    'BREAKDOWN': 'danger',
    'STOPPED': 'danger'
  }
  return severities[status] || 'info'
}

const getEnginStatusLabel = (status) => {
  const labels = {
    'MAINTENANCE': 'Maintenance',
    'INACTIVE': 'Inactif',
    'BREAKDOWN': 'Panne',
    'STOPPED': 'Arrêté'
  }
  return labels[status] || status
}

const calculateEnginTBD = (engin) => {
  // Utiliser la date de dernière maintenance ou la date de mise à jour du tracker
  const stateChangeTime = engin.lastMaintenance || engin.tracker?.lastPing || engin.location?.lastUpdate

  if (!stateChangeTime) {
    return 'Durée inconnue'
  }

  const now = new Date()
  const changeDate = new Date(stateChangeTime)
  const diffMs = now - changeDate

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays}j ${diffHours % 24}h`
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}min`
  } else {
    return `${diffMinutes}min`
  }
}

// Lifecycle
onMounted(async () => {
  // Initialiser le store des seuils
  thresholdConfigStore.initialize()

  // Charger la configuration client
  await clientConfigStore.loadClientConfig()

  // Charger les dashboards publiés
  await loadPublishedDashboards()

  // Charger les données initiales
  await refreshData()
  
  // Charger les recommandations IA
  loadAIRecommendations()
  
  // Charger les activités récentes depuis le backend
  try {
    await dashboardStore.refreshActivities()
    recentActivities.value = dashboardStore.activities || []
  } catch {
    recentActivities.value = []
  }
  
  // Démarrer l'auto-refresh si activé
  if (clientConfig.value?.preferences?.autoRefresh) {
    dashboardStore.startAutoRefresh(
      clientConfig.value.preferences.refreshInterval || 30000
    )
  }
})

// Watchers
watch(enabledModules, async (newModules) => {
  if (newModules.length > 0) {
    // Initialiser les modules sélectionnés avec tous les modules activés
    if (dashboardFilters.value.selectedModules.length === 0) {
      dashboardFilters.value.selectedModules = [...newModules]
    }
    await loadModuleSpecificData()
    
    // Recharger les recommandations IA après changement de modules
    loadAIRecommendations()
  }
  
  // Charger les données des engins
  await enginsStore.loadEngins()
}, { immediate: true })

// Watcher pour recharger les recommandations quand les données changent
watch([moduleData, globalStats, teamsData], () => {
  loadAIRecommendations()
}, { deep: true })

// Synchroniser globalStats avec les données MES
watch(() => moduleData.value.mes, (mesData) => {
  if (mesData) {
    globalStats.value.trs_global = mesData.trs || 0
    globalStats.value.trs_trend = mesData.trs_trend || 0
    globalStats.value.machines_actives = mesData.machines_actives || 0
    globalStats.value.machines_total = mesData.machines_total || 0
    
    // Initialiser les alertes MES
    if (mesData.alertes && Array.isArray(mesData.alertes)) {
      const mesActiveAlerts = mesData.alertes.filter(a => a.status === 'OPEN' || a.status === 'ACTIVE').length
      const mesCriticalAlerts = mesData.alertes.filter(a => 
        (a.status === 'OPEN' || a.status === 'ACTIVE') && 
        (a.severity === 'CRITICAL' || a.severity === 'critical')
      ).length
      
      globalStats.value.alertes_actives = mesActiveAlerts
      globalStats.value.alertes_critiques = mesCriticalAlerts
    } else {
      // Si pas d'alertes MES, initialiser à 0
      globalStats.value.alertes_actives = 0
      globalStats.value.alertes_critiques = 0
    }
  }
}, { immediate: true, deep: true })

// Synchroniser globalStats avec les données des engins (après les données MES)
watch(enginsData, (newData) => {
  globalStats.value.engins_operationnels = newData.operationalCount || newData.activeCount || 0
  globalStats.value.disponibilite_engins = newData.averageUptime || 0
  
  // Additionner les alertes des engins aux alertes MES (qui sont déjà initialisées)
  globalStats.value.alertes_actives = (globalStats.value.alertes_actives || 0) + (newData.totalAlerts || 0)
  globalStats.value.alertes_critiques = (globalStats.value.alertes_critiques || 0) + (newData.criticalAlerts || 0)
}, { immediate: true, deep: true })

watch(() => clientConfig.value?.preferences?.autoRefresh, (enabled) => {
  if (enabled) {
    dashboardStore.startAutoRefresh(
      clientConfig.value.preferences.refreshInterval || 30000
    )
  } else {
    dashboardStore.stopAutoRefresh()
  }
})
</script>

<style scoped>
/* Elements masqués */
.hidden {
  display: none !important;
}

.modular-dashboard {
  min-height: 100vh;
  background: #f9fafb;
}

/* Clean header with date filter */
.dashboard-header-clean {
  display: flex;
  align-items: center;
  background: white;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  gap: 1.5rem;
}

.dashboard-header-clean .page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0B2B3C;
  margin: 0;
  white-space: nowrap;
}

/* Header filters - spread across remaining space */
.dashboard-header-clean .header-filters {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.dashboard-header-clean .quick-periods {
  display: flex;
  gap: 0.5rem;
}

.dashboard-header-clean .period-chip {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.dashboard-header-clean .period-chip:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #0B2B3C;
}

.dashboard-header-clean .period-chip.active {
  background: #7AC943;
  border-color: #7AC943;
  color: white;
}

/* Custom date button */
.dashboard-header-clean .date-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #0B2B3C;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.dashboard-header-clean .date-btn:hover {
  border-color: #7AC943;
  background: #f8fff5;
}

.dashboard-header-clean .date-btn i {
  color: #7AC943;
  font-size: 0.875rem;
}

/* Clean date popover - remove ALL borders */
:deep(.p-popover) {
  border: none !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  border-radius: 12px !important;
}

:deep(.p-popover-content) {
  padding: 0 !important;
}

:deep(.p-datepicker),
:deep(.p-datepicker-panel),
:deep(.p-datepicker-header),
:deep(.p-datepicker-calendar-container),
:deep(.p-datepicker-calendar) {
  border: none !important;
}

/* Dashboard Select */
.dashboard-header-clean .dashboard-select {
  min-width: 200px;
}

.dashboard-header-clean .dashboard-select :deep(.p-select-label) {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
}

.dashboard-header-clean .select-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dashboard-header-clean .select-value i {
  color: #7AC943;
}

@media (max-width: 1100px) {
  .dashboard-header-clean .header-filters {
    flex-wrap: wrap;
  }
}

@media (max-width: 900px) {
  .dashboard-header-clean {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .dashboard-header-clean .header-filters {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .dashboard-header-clean .quick-periods {
    justify-content: center;
    flex-wrap: wrap;
  }

  .dashboard-header-clean .dashboard-select {
    width: 100%;
  }

  .dashboard-header-clean .date-btn {
    width: 100%;
    justify-content: center;
  }
}

.dashboard-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 2rem;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  gap: 2rem;
}

.header-left {
  flex: 1;
}

.welcome-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0B2B3C;
  margin: 0;
}

.page-subtitle {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.tabs-navigation {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem 2rem 0.5rem 2rem;
  position: relative;
}

.tabs-navigation::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent 0%, #e2e8f0 50%, transparent 100%);
}

.module-tabs {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.analytics-view {
  min-height: calc(100vh - 150px);
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.modules-grid.compact {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.module-card-wrapper {
  height: fit-content;
}

/* Styles pour la vue d'ensemble */
.overview-mode {
  padding: 2rem;
  background: #f9fafb;
  min-height: calc(100vh - 200px);
}

/* Teams Section */
.teams-section {
  margin-bottom: 3rem;
}

.teams-section h2 {
  margin: 0 0 2rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.team-overview {
  margin-bottom: 2rem;
}

/* Engins Section */
.engins-section {
  margin-bottom: 3rem;
}

.engins-section h2 {
  margin: 0 0 2rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.engins-overview {
  margin-bottom: 2rem;
}

.engins-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.reliability-chart-container,
.location-map-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.alerts-panel-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.performance-chart-container,
.kpi-chart-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

/* KPIs Globaux */
.global-kpis {
  margin-bottom: 3rem;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.global-kpi-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.2s ease;
}

.global-kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.global-kpi-card .kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.global-kpi-card.primary .kpi-icon {
  background: #f1f5f9;
  color: #3b82f6;
}

.global-kpi-card.success .kpi-icon {
  background: rgba(122, 201, 67, 0.1);
  color: #7AC943;
}

.global-kpi-card.info .kpi-icon {
  background: #f0f9ff;
  color: #0891b2;
}

.global-kpi-card.warning .kpi-icon {
  background: #fffbeb;
  color: #d97706;
}

.global-kpi-card.neutral .kpi-icon {
  background: #f8fafc;
  color: #2563eb;
  border: 1px solid #e2e8f0;
}

.global-kpi-card .kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
  line-height: 1;
}

.global-kpi-card .kpi-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.global-kpi-card .kpi-desc {
  font-size: 0.875rem;
  color: #9ca3af;
}

.global-kpi-card .kpi-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.global-kpi-card .kpi-trend.up {
  color: #10b981;
}

/* Modules Overview */
.modules-overview {
  margin-bottom: 3rem;
}

.modules-overview h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2rem;
}

.modules-grid-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.module-overview-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.module-overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.module-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.module-overview-card .module-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.module-overview-card.collect .module-icon {
  background: #ffffff;
  color: #2563eb;
  border: 2px solid #e2e8f0;
}

.module-overview-card.mes .module-icon {
  background: #ffffff;
  color: #059669;
  border: 2px solid #e2e8f0;
}

.module-overview-card.engins .module-icon {
  background: #ffffff;
  color: #0ea5e9;
  border: 2px solid #e2e8f0;
}

.module-info {
  flex: 1;
}

.module-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.module-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.module-link-btn {
  color: #6b7280 !important;
  transition: all 0.2s ease !important;
}

.module-link-btn:hover {
  color: #374151 !important;
  background: #f3f4f6 !important;
}

/* Module Stats */
.module-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* Module Progress */
.module-progress {
  margin-top: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  min-height: 1.5rem;
}

.progress-header span:first-child {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.progress-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
}

.module-progress-bar {
  height: 16px;
  border-radius: 8px;
}

/* Module Alerts */
.module-alerts {
  margin-top: 1.5rem;
}

.alerts-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.alerts-preview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid;
  font-size: 0.875rem;
}

.alert-preview.critical {
  border-left-color: #ef4444;
  color: #dc2626;
}

.alert-preview.warning {
  border-left-color: #f59e0b;
  color: #d97706;
}

.alert-preview i {
  flex-shrink: 0;
}

/* Module Reliability */
.module-reliability {
  margin-top: 1.5rem;
}

.reliability-items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.reliability-item {
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}

.reliability-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.reliability-value {
  font-size: 1rem;
  font-weight: 700;
  color: #374151;
}

/* Recent Activities Overview */
.recent-activities-overview {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.activities-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.activities-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

/* Styles pour les vues spécifiques pleine page */
.module-specific {
  min-height: calc(100vh - 200px);
  background: #f9fafb;
}

.module-hero {
  background: #374151;
  color: white;
  padding: 3rem 2rem;
  margin-bottom: 2rem;
}

.hero-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.hero-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  backdrop-filter: blur(10px);
}

.hero-text h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.hero-text p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.module-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2.5rem;
  margin-bottom: 2rem;
}

/* Sections communes */
.kpi-section,
.progress-section,
.actions-section,
.alerts-section,
.machines-section,
.performance-section,
.reliability-section,
.production-section,
.downtime-section,
.operating-time-section,
.consumption-section {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
}

/* Section machines sur toute la largeur */
.machines-section {
  grid-column: 1 / -1;
}

.kpi-section h2,
.progress-section h2,
.actions-section h2,
.alerts-section h2,
.machines-section h2,
.performance-section h2,
.reliability-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

/* KPI Cards */
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 2rem;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  transition: all 0.2s ease;
  min-height: 120px;
}

.kpi-card:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.kpi-card.primary .kpi-icon {
  background: #2563eb;
}

.kpi-card.success .kpi-icon {
  background: #10b981;
}

.kpi-card.info .kpi-icon {
  background: #06b6d4;
}

.kpi-card.warning .kpi-icon {
  background: #f59e0b;
}

.kpi-card.danger .kpi-icon {
  background: #ef4444;
}

.kpi-card.neutral .kpi-icon {
  background: #ffffff;
  color: #2563eb;
  border: 2px solid #e2e8f0;
}

.kpi-content {
  flex: 1;
}

.kpi-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.kpi-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.kpi-trend.up {
  color: #10b981;
}

.kpi-trend.down {
  color: #ef4444;
}

/* Progress Cards */
.progress-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-card {
  padding: 2rem;
  background: #f9fafb;
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  margin-bottom: 1rem;
}

.progress-card .progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  min-height: 1.75rem;
}

.collecte-name {
  font-weight: 600;
  color: #374151;
}

.progress-percent {
  font-weight: 600;
  color: #374151;
}

.progress-bar-full {
  height: 16px;
  border-radius: 8px;
}

/* Action Cards */
.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 100px;
}

.action-card:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.action-icon {
  width: 56px;
  height: 56px;
  background: #ffffff;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #2563eb;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid #e2e8f0;
}

.action-content h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.action-content p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Styles pour les boutons d'action */
.module-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.action-btn {
  padding: 0.75rem 1.5rem !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
  min-width: 140px;
}

.action-btn.primary {
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: white !important;
}

.action-btn.primary:hover {
  background: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3) !important;
}

.action-btn.secondary {
  border-color: #d1d5db !important;
  color: #374151 !important;
}

.action-btn.secondary:hover {
  background: #f9fafb !important;
  border-color: #9ca3af !important;
  transform: translateY(-1px);
}

.action-btn.warning {
  border-color: #f59e0b !important;
  color: #f59e0b !important;
}

.action-btn.warning:hover {
  background: #fffbeb !important;
  border-color: #d97706 !important;
  transform: translateY(-1px);
}

/* Alert Cards */
.alert-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid;
}

.alert-card.critical {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.alert-card.warning {
  background: #fffbeb;
  border-color: #fed7aa;
  color: #d97706;
}

.alert-card.info {
  background: #eff6ff;
  border-color: #dbeafe;
  color: #2563eb;
}

.alert-icon {
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.alert-time {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* Machine Cards */
.machine-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.machine-card {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}

.machine-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.machine-name {
  font-weight: 500;
  color: #374151;
}

.machine-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

/* Performance Cards */
.performance-cards {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.performance-card {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
}

.performance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.performance-name {
  font-weight: 600;
  color: #374151;
}

.performance-value {
  font-weight: 600;
  color: #374151;
}

.performance-bar {
  height: 8px;
}

/* Reliability Cards */
.reliability-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.reliability-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
}

.reliability-icon {
  width: 48px;
  height: 48px;
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #2563eb;
  flex-shrink: 0;
  border: 2px solid #e2e8f0;
}

.reliability-content {
  flex: 1;
}

.reliability-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.reliability-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.reliability-desc {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Styles pour les seuils de performance */
.kpi-value.excellent,
.performance-value.excellent,
.reliability-value.excellent {
  color: #10b981 !important;
}

.kpi-value.acceptable,
.performance-value.acceptable,
.reliability-value.acceptable {
  color: #f59e0b !important;
}

.kpi-value.faible,
.performance-value.faible,
.reliability-value.faible {
  color: #ef4444 !important;
}

/* Descriptions des KPIs */
.kpi-desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Styles pour les nouvelles sections MES */
.downtime-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.downtime-card,
.machines-active-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #f3f4f6;
}

.downtime-header,
.machines-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.downtime-icon,
.machines-icon {
  width: 48px;
  height: 48px;
  background: #374151;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.downtime-value,
.machines-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.downtime-label,
.machines-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.downtime-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.breakdown-item:last-child {
  border-bottom: none;
}

.breakdown-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.breakdown-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.machines-status {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-item.active .status-dot {
  background: #10b981;
}

.status-item.maintenance .status-dot {
  background: #f59e0b;
}

.status-item.error .status-dot {
  background: #ef4444;
}

/* Styles pour les nouvelles sections Engins */
.operating-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.operating-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #f3f4f6;
}

.operating-card.on {
  border-left: 4px solid #10b981;
}

.operating-card.off {
  border-left: 4px solid #6b7280;
}

.operating-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.operating-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.operating-card.on .operating-icon {
  background: #10b981;
}

.operating-card.off .operating-icon {
  background: #6b7280;
}

.operating-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.operating-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.operating-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.detail-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.detail-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

.performance-desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

/* Styles pour consommation et alertes */
.consumption-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.consumption-card,
.alerts-moteur-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #f3f4f6;
}

.consumption-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.consumption-icon {
  width: 48px;
  height: 48px;
  background: #3b82f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.consumption-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.consumption-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.consumption-unit {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.consumption-trend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.trend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.trend-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.trend-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.alerts-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}

.alert-item.surchauffe {
  border-left: 3px solid #ef4444;
}

.alert-item.surconsommation {
  border-left: 3px solid #f59e0b;
}

.alert-item.arrets_frequents {
  border-left: 3px solid #6b7280;
}

.alert-item .alert-icon {
  flex-shrink: 0;
  color: #6b7280;
}

.alert-item .alert-content {
  flex: 1;
}

.alert-message {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.alert-engin {
  font-size: 0.75rem;
  color: #6b7280;
}

.alert-time {
  font-size: 0.75rem;
  color: #6b7280;
  flex-shrink: 0;
}

/* Styles pour la section Mode Dégradé */
.degraded-mode-section {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
}

.degraded-mode-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.degraded-mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.degraded-mode-card,
.threshold-config-card {
  background: #f9fafb;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.degraded-mode-card:hover,
.threshold-config-card:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.degraded-mode-header,
.threshold-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.degraded-mode-icon,
.threshold-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.degraded-mode-icon {
  background: #f59e0b;
}

.threshold-icon {
  background: #ffffff;
  color: #2563eb;
  border: 2px solid #e2e8f0;
}

.degraded-mode-content,
.threshold-content {
  flex: 1;
}

.degraded-mode-value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.degraded-mode-value.normal {
  color: #10b981 !important;
}

.degraded-mode-value.degraded {
  color: #f59e0b !important;
}

.degraded-mode-value.critical {
  color: #ef4444 !important;
}

.degraded-mode-label,
.threshold-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.degraded-mode-desc,
.threshold-desc {
  font-size: 0.75rem;
  color: #6b7280;
}

.degraded-mode-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.degraded-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.threshold-controls {
  margin-top: 1rem;
}

.threshold-input-group {
  margin-bottom: 1.5rem;
}

.threshold-input-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.threshold-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s ease;
}

.threshold-input:focus {
  outline: none;
  border-color: #374151;
  box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
}

.threshold-levels {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.level-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}

.level-indicator.normal {
  border-left: 3px solid #10b981;
}

.level-indicator.degraded {
  border-left: 3px solid #f59e0b;
}

.level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.level-indicator.normal .level-dot {
  background: #10b981;
}

.level-indicator.degraded .level-dot {
  background: #f59e0b;
}

.level-text {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.activities-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #64748b;
  gap: 1rem;
}

.error-container {
  padding: 2rem;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  text-align: center;
}

.error-content h3 {
  margin: 0;
  color: #dc2626;
}

/* Responsive */
@media (max-width: 1024px) {
  .modules-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .tabs-navigation {
    padding: 1rem 1rem 0.25rem 1rem;
  }

  /* Responsive pour vues spécifiques */
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .hero-content {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
  }
  
  .hero-text h1 {
    font-size: 2rem;
  }
  
  .module-dashboard {
    padding: 0 1rem 2rem;
  }
  
  .kpi-cards {
    grid-template-columns: 1fr;
  }
  
  .action-cards {
    grid-template-columns: 1fr;
  }
  
  .machine-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .reliability-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 1rem;
  }
  
  .dashboard-content {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .header-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .tabs-navigation {
    padding: 0.75rem 1rem 0.25rem 1rem;
  }
}

/* Styles pour les onglets modernisés */
:deep(.p-tabmenu) {
  background: transparent;
  border: none;
}

:deep(.p-tabmenu .p-tabmenu-nav) {
  border: none;
  background: transparent;
  display: flex;
  gap: 0.5rem;
  padding: 0 0 1rem 0;
}

:deep(.p-tabmenu .p-tabmenuitem) {
  background: transparent;
  border: none;
}

:deep(.p-tabmenu .p-tabmenuitem .p-menuitem-link) {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  font-weight: 500;
  transition: all 0.2s ease;
  margin: 0;
  gap: 0.5rem;
  display: flex;
  align-items: center;
  text-decoration: none;
  min-height: 44px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

:deep(.p-tabmenu .p-tabmenuitem .p-menuitem-link:hover) {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
}

:deep(.p-tabmenu .p-tabmenuitem.p-highlight .p-menuitem-link) {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}

:deep(.p-tabmenu .p-tabmenuitem.p-highlight .p-menuitem-link:hover) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

:deep(.p-tabmenu .p-tabmenuitem .p-menuitem-icon) {
  color: currentColor;
  font-size: 1rem;
}

:deep(.p-tabmenu .p-tabmenuitem .p-menuitem-text) {
  font-size: 0.875rem;
  font-weight: 600;
}

/* Responsive pour les onglets */
@media (max-width: 768px) {
  :deep(.p-tabmenu .p-tabmenu-nav) {
    flex-wrap: wrap;
    gap: 0.375rem;
    padding: 0 0 0.75rem 0;
  }
  
  :deep(.p-tabmenu .p-tabmenuitem .p-menuitem-link) {
    padding: 0.625rem 1rem;
    font-size: 0.8rem;
    min-height: 40px;
    flex: 1;
    justify-content: center;
    text-align: center;
  }
  
  :deep(.p-tabmenu .p-tabmenuitem .p-menuitem-text) {
    font-size: 0.8rem;
  }
  
  :deep(.p-tabmenu .p-tabmenuitem .p-menuitem-icon) {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  :deep(.p-tabmenu .p-tabmenu-nav) {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  :deep(.p-tabmenu .p-tabmenuitem .p-menuitem-link) {
    padding: 0.75rem;
    justify-content: flex-start;
    gap: 0.75rem;
  }
}

@media (min-width: 1200px) {
  :deep(.p-tabmenu .p-tabmenu-nav) {
    gap: 1rem;
  }
  
  :deep(.p-tabmenu .p-tabmenuitem .p-menuitem-link) {
    padding: 1rem 2rem;
    font-size: 0.9rem;
  }
  
  :deep(.p-tabmenu .p-tabmenuitem .p-menuitem-text) {
    font-size: 0.9rem;
  }
}

/* Styles pour les vues spécifiques des modules */
.module-specific {
  min-height: calc(100vh - 200px);
}

.module-hero {
  background: #1e293b;
  color: white;
  padding: 3rem 2rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.module-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  pointer-events: none;
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.hero-text h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hero-text p {
  margin: 0;
  font-size: 1.125rem;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.module-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

/* Style unifié pour toutes les bannières de modules */
.collect-view .module-hero,
.mes-view .module-hero,
.engins-view .module-hero {
  background: #1e293b;
}

/* Accent subtil spécifique par module via l'overlay */
.collect-view .module-hero::before {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%);
}

.mes-view .module-hero::before {
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(4, 120, 87, 0.08) 100%);
}

.engins-view .module-hero::before {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(2, 132, 199, 0.08) 100%);
}

/* Activities Drawer */
.activities-drawer-content {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.drawer-header-info {
  margin-bottom: 2rem;
}

.drawer-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0 0 1rem 0;
}

.drawer-stats {
  display: flex;
  gap: 1rem;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #475569;
}

.stat-chip i {
  color: #3b82f6;
}

.activities-full-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.activity-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.activity-card.success {
  border-left: 4px solid #10b981;
}

.activity-card.warning {
  border-left: 4px solid #f59e0b;
}

.activity-card.info {
  border-left: 4px solid #3b82f6;
}

.activity-card.critical {
  border-left: 4px solid #ef4444;
}

.activity-card-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.activity-icon-large {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.activity-icon-large.success {
  background: #10b981;
}

.activity-icon-large.warning {
  background: #f59e0b;
}

.activity-icon-large.info {
  background: #3b82f6;
}

.activity-icon-large.critical {
  background: #ef4444;
}

.activity-main-info {
  flex: 1;
  min-width: 0;
}

.activity-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.activity-meta-full {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #64748b;
}

.meta-item i {
  font-size: 0.875rem;
}

.view-details-btn {
  flex-shrink: 0;
}

.activity-details-panel {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1e293b;
}

.details-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .activities-drawer-content {
    padding: 1rem;
  }

  .activity-card {
    padding: 1rem;
  }

  .activity-card-header {
    gap: 1rem;
  }

  .activity-icon-large {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }

  .activity-title {
    font-size: 1rem;
  }

  .activity-meta-full {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}

/* Vue compacte */
.modular-dashboard.compact-view .kpi-card {
  padding: 0.75rem !important;
}

.modular-dashboard.compact-view .kpi-value {
  font-size: 1.5rem !important;
}

.modular-dashboard.compact-view .kpi-label {
  font-size: 0.75rem !important;
}

.modular-dashboard.compact-view .kpi-desc {
  font-size: 0.7rem !important;
}

.modular-dashboard.compact-view .global-kpi-card {
  padding: 1rem !important;
}

.modular-dashboard.compact-view .activity-card {
  padding: 1rem !important;
}

.modular-dashboard.compact-view .team-card {
  padding: 1rem !important;
}

/* Styles pour la section TBD des engins */
.module-tbd {
  margin: 1rem 0;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
}

.tbd-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #92400e;
}

.tbd-header i {
  color: #f59e0b;
}

.tbd-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tbd-item {
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid;
}

.tbd-item.warning {
  background: #fff7ed;
  border-color: #f59e0b;
}

.tbd-item.danger {
  background: #fef2f2;
  border-color: #ef4444;
}

.tbd-header-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.engin-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.engin-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.tbd-item.warning .engin-status {
  background: #fef3c7;
  color: #92400e;
}

.tbd-item.danger .engin-status {
  background: #fee2e2;
  color: #991b1b;
}

.tbd-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.813rem;
  color: #64748b;
  font-weight: 600;
}

.tbd-time i {
  font-size: 0.875rem;
}

/* Styles pour les informations de seuil */
.tbd-threshold-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #f59e0b;
}

.threshold-label {
  font-size: 0.75rem;
  color: #92400e;
  font-weight: 500;
}

.threshold-value {
  font-size: 0.875rem;
  color: #92400e;
  font-weight: 600;
  background: #fef3c7;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

/* Styles pour la section charge Capa */
.module-capacity {
  margin: 1rem 0;
  padding: 1rem;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
}

.capacity-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #0c4a6e;
}

.capacity-header i {
  color: #0ea5e9;
}

.capacity-kpi {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e0f2fe;
}

.capacity-value-large {
  font-size: 2rem;
  font-weight: 700;
  color: #0c4a6e;
  margin-bottom: 0.5rem;
}

.capacity-description {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  text-align: center;
}

/* ROI Module Styles */
.module-overview-card.roi {
  background: #3b82f6;
  color: white;
}

.module-overview-card.roi .module-icon {
  background: rgba(255, 255, 255, 0.2);
}

.module-overview-card.roi .module-link-btn {
  color: white;
}

.module-overview-card.roi .stat-value {
  color: white;
}

.module-overview-card.roi .stat-label {
  color: rgba(255, 255, 255, 0.9);
}

.roi-view .module-hero {
  background: #3b82f6;
  color: white;
}

.actions-section {
  margin-bottom: 2rem;
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 56px;
  height: 56px;
  background: #3b82f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.action-content h3 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.action-content p {
  margin: 0 0 1rem 0;
  color: #64748b;
  font-size: 14px;
}

.history-section {
  margin-bottom: 2rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.history-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
}

.history-date {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  min-width: 150px;
}

.history-details {
  flex: 1;
  display: flex;
  gap: 2rem;
}

.history-roi {
  font-size: 18px;
  font-weight: 700;
  color: #3b82f6;
}

.history-gain {
  font-size: 16px;
  font-weight: 600;
  color: #7AC943;
}

.history-actions {
  display: flex;
  gap: 0.5rem;
}
</style>

<!-- Global styles for date popover (not scoped) -->
<style>
.p-popover {
  border: none !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  border-radius: 12px !important;
  overflow: hidden;
}

.p-popover-content {
  padding: 0 !important;
  border: none !important;
}

.p-datepicker {
  border: none !important;
  background: white !important;
}

.p-datepicker-panel {
  border: none !important;
}

.p-datepicker-header {
  border: none !important;
  border-bottom: none !important;
}

.p-datepicker-calendar-container {
  border: none !important;
}

.p-datepicker-calendar {
  border: none !important;
}
</style>
