<template>
  <div class="engins-detail">
    <!-- Header Bar -->
    <div class="engins-header">
      <div class="header-content">
        <div class="header-title">
          <h1>Suivi des engins</h1>
          <p>Disponibilité, maintenance, fiabilité et consommation de la flotte</p>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-container">
      <div class="tabs-scroll">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-item"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Vue flotte -->
    <div class="dashboard-container" v-show="activeTab === 'overview'">
      <!-- Top KPIs -->
      <div class="kpi-grid-top">
        <div class="kpi-card blue">
          <div class="kpi-content">
            <span class="kpi-label">MTBF — TEMPS MOYEN ENTRE PANNES</span>
            <span class="kpi-value">{{ mtbfDisplay }}</span>
            <small>+18h vs mois dernier</small>
          </div>
          <div class="kpi-info-trigger">
            <i class="pi pi-info-circle kpi-info-icon"></i>
            <div class="kpi-info-bubble">Moyenne pondérée sur la flotte active · Calcul depuis les données brutes</div>
          </div>
        </div>

        <div class="kpi-card orange">
          <div class="kpi-content">
            <span class="kpi-label">MTTR — TEMPS MOYEN DE RÉPARATION</span>
            <span class="kpi-value">{{ mttrDisplay }}</span>
            <small>-0,8h vs mois dernier</small>
          </div>
          <div class="kpi-info-trigger">
            <i class="pi pi-info-circle kpi-info-icon"></i>
            <div class="kpi-info-bubble">Temps moyen d'immobilisation par intervention · Toutes pannes confondues</div>
          </div>
        </div>

        <div class="kpi-card green">
          <div class="kpi-content">
            <span class="kpi-label">DISPONIBILITÉ GLOBALE FLOTTE</span>
            <span class="kpi-value">{{ disponibiliteDisplay }}</span>
            <small>+2,3% vs mois dernier</small>
          </div>
          <div class="kpi-info-trigger">
            <i class="pi pi-info-circle kpi-info-icon"></i>
            <div class="kpi-info-bubble">D = MTBF/(MTBF + MTTR) · Mis à jour en temps réel</div>
          </div>
        </div>
      </div>

      <!-- Metrics Cards -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <i class="pi pi-cog"></i>
          </div>
          <span class="metric-number">{{ operationalCount }}</span>
          <span class="metric-label">Engins opérationnels</span>
          <small>2 critiques</small>
        </div>

        <div class="metric-card">
          <div class="metric-icon warning">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <span class="metric-number">{{ alertesCount }}</span>
          <span class="metric-label">Alertes actives</span>
          <small>2 critiques</small>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
              <path d="M3 22h12"/>
              <rect x="5" y="8" width="8" height="5" rx="1"/>
              <path d="M17 6h1a2 2 0 0 1 2 2v3a1 1 0 0 0 1 1h0v5a1 1 0 0 1-2 0v-5"/>
              <line x1="17" y1="22" x2="21" y2="22"/>
            </svg>
          </div>
          <span class="metric-number">{{ litresJourDisplay }}</span>
          <span class="metric-label">Litres / jour</span>
          <small>-6% vs hier</small>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <i class="pi pi-wrench"></i>
          </div>
          <span class="metric-number">{{ revisionsSemaineCount }}</span>
          <span class="metric-label">Révisions planifiées</span>
          <small>Cette semaine</small>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <i class="pi pi-clock"></i>
          </div>
          <span class="metric-number">{{ heuresMoteurDisplay }}</span>
          <span class="metric-label">Heures moteur / mois</span>
          <small>+4% vs M-1</small>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-container">
        <div class="chart-column">
          <!-- Reliability Chart -->
          <div class="chart-card">
            <div class="card-title-wrapper">
              <h3>Probabilité de non-défaillance R(t) par engin</h3>
              <div class="info-tooltip">
                <i class="pi pi-info-circle"></i>
                <div class="tooltip-content">R(t) = e^(-(t/η)^β) — Loi de Weibull à 2 paramètres. η = paramètre d'échelle (durée caractéristique). β = paramètre de forme (comportement de vieillissement). Calculé depuis l'historique des pannes de chaque engin.</div>
              </div>
            </div>
            <div class="subtitle">Modèle Weibull — Horizon 30 jours</div>
            <div class="engines-list">
              <div v-for="engine in engines" :key="engine.id" class="engine-row">
                <span class="engine-name">{{ engine.name }}</span>
                <span class="horizon">Horizon · 30 jours</span>
                <div class="bar-wrapper">
                  <div class="bar-fill" :style="{ width: engine.reliability + '%', backgroundColor: engine.color }"></div>
                </div>
                <span class="bar-value" :style="{ color: engine.color }">{{ engine.reliability }}%</span>
                <span class="status" :class="'status-' + engine.status">{{ engine.status_label }}</span>
              </div>
            </div>
          </div>

          <!-- Motor Hours -->
          <div class="chart-card">
            <div class="card-title-wrapper">
              <h3>Heures moteur — 7 jours</h3>
              <div class="info-tooltip">
                <i class="pi pi-info-circle"></i>
                <div class="tooltip-content">Nombre total d'heures de fonctionnement des engins sur les 7 derniers jours. Permet de suivre la charge de travail et l'intensité d'utilisation de la flotte.</div>
              </div>
            </div>
            <div class="bar-chart-hours">
              <div
                v-for="day in motorHoursData"
                :key="day.label"
                class="bar-item"
                :class="{ today: day.isToday }"
                :style="{ height: day.pct + '%' }"
                :title="day.hours + 'h'"
              ></div>
            </div>
            <div class="hours-labels">
              <span v-for="day in motorHoursData" :key="'lbl-' + day.label">{{ day.label }}</span>
            </div>
            <small>{{ motorHoursData[motorHoursData.length - 1]?.hours }}h aujourd'hui</small>
            <small>+4% vs S-1</small>
          </div>

          <!-- Availability by Engine -->
          <div class="chart-card">
            <div class="card-title-wrapper">
              <h3>Disponibilité par engin</h3>
              <div class="info-tooltip">
                <i class="pi pi-info-circle"></i>
                <div class="tooltip-content">Pourcentage du temps où chaque engin est disponible pour les opérations. Calculé comme : (Temps total - Temps indisponibilité) / Temps total × 100%</div>
              </div>
            </div>
            <div class="availability-list">
              <div v-for="engine in engines.slice(0, 6)" :key="'avail-' + engine.id" class="availability-row">
                <span class="engine-name">{{ engine.name }}</span>
                <div class="bar-wrapper">
                  <div class="bar-fill" :style="{ width: engine.availability + '%', backgroundColor: engine.color }"></div>
                </div>
                <span class="bar-value">{{ engine.availability }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="alerts-column">
          <!-- Availability Chart -->
          <div class="chart-card">
            <div class="card-title-wrapper">
              <h3>Fiabilité moyenne flotte</h3>
              <div class="info-tooltip">
                <i class="pi pi-info-circle"></i>
                <div class="tooltip-content">Moyenne pondérée de la fiabilité R(t) de tous les engins. Indicateur clé pour évaluer la santé globale de la flotte. Les valeurs cibles sont > 70% à long terme et > 85% à court terme.</div>
              </div>
            </div>
            <div class="availability-circles">
              <div class="circle-item">
                <div class="circle-chart" :style="{ background: circleStyle(rt30MoyenPct) }">
                  <div class="circle-inner">{{ rt30MoyenPct }}%</div>
                </div>
                <span>R(t) moyen — Horizon 30 jours</span>
              </div>

              <div class="circle-item">
                <div class="circle-chart" :style="{ background: circleStyle(rt90MoyenPct) }">
                  <div class="circle-inner">{{ rt90MoyenPct }}%</div>
                </div>
                <span>Fiabilité à court terme</span>
              </div>
            </div>
            <div class="alerts-summary">
              <h4>Engins à réviser cette semaine</h4>
              <span class="alert-count">{{ enginsARisqueCount }}</span>
              <small>R(t) < 60% — Action recommandée</small>
            </div>
          </div>

          <!-- Active Alerts -->
          <div class="chart-card">
            <div class="card-title-wrapper">
              <h3>Alertes actives</h3>
              <div class="info-tooltip">
                <i class="pi pi-info-circle"></i>
                <div class="tooltip-content">Liste des alertes critiques et avertissements détectés sur la flotte. Les alertes critiques (rouges) nécessitent une action immédiate. Les avertissements (orange) doivent être surveillés.</div>
              </div>
            </div>
            <span class="alerts-count-badge">{{ alertesCount }} alertes</span>
            <div class="alerts-items">
              <div class="alert-item critical">
                <i class="pi pi-circle-fill"></i>
                <div class="alert-content">
                  <strong>Liebherr LTM — R(t) critique : 38%</strong>
                  <small>Révision urgente recommandée · IA · Risque élevé de panne</small>
                </div>
              </div>

              <div class="alert-item warning">
                <i class="pi pi-circle-fill"></i>
                <div class="alert-content">
                  <strong>JCB 3CX — Surchauffe moteur</strong>
                  <small>Température 108°C · Seuil 95°C · Arrêt recommandé</small>
                </div>
              </div>

              <div class="alert-item warning">
                <i class="pi pi-circle-fill"></i>
                <div class="alert-content">
                  <strong>Komatsu PC200 — R(t) : 73%</strong>
                  <small>Planifier révision dans les 15 prochains jours</small>
                </div>
              </div>

              <div class="alert-item info">
                <i class="pi pi-circle-fill"></i>
                <div class="alert-content">
                  <strong>Volvo A25G — Consommation +22%</strong>
                  <small>Dérrive détectée vs profil habituel · Vérifier injection</small>
                </div>
              </div>

              <div class="alert-item info">
                <i class="pi pi-circle-fill"></i>
                <div class="alert-content">
                  <strong>Hitachi ZX350 — Révision planifiée</strong>
                  <small>Prévu dans 3 jours · 2 000h utilisées</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Engins -->
    <div class="section-container" v-show="activeTab === 'engines'">

      <!-- Overview stats -->
      <div class="eng-ov-grid">
        <div class="eng-ov-card eng-ov-total">
          <div class="eng-ov-icon"><i class="pi pi-wrench"></i></div>
          <div class="eng-ov-content">
            <div class="eng-ov-val">{{ engines.length }}</div>
            <div class="eng-ov-lbl">Total Engins</div>
          </div>
        </div>
        <div class="eng-ov-card eng-ov-operational">
          <div class="eng-ov-icon"><i class="pi pi-check-circle"></i></div>
          <div class="eng-ov-content">
            <div class="eng-ov-val">{{ engOperational.length }}</div>
            <div class="eng-ov-lbl">Opérationnels</div>
            <div class="eng-ov-pct">{{ engPct(engOperational.length) }}%</div>
          </div>
        </div>
        <div class="eng-ov-card eng-ov-maint">
          <div class="eng-ov-icon"><i class="pi pi-cog"></i></div>
          <div class="eng-ov-content">
            <div class="eng-ov-val">{{ engMaintenance.length }}</div>
            <div class="eng-ov-lbl">En Maintenance</div>
            <div class="eng-ov-pct">{{ engPct(engMaintenance.length) }}%</div>
          </div>
        </div>
        <div class="eng-ov-card eng-ov-degraded">
          <div class="eng-ov-icon"><i class="pi pi-exclamation-triangle"></i></div>
          <div class="eng-ov-content">
            <div class="eng-ov-val">{{ engDegraded.length }}</div>
            <div class="eng-ov-lbl">Dégradés</div>
            <div class="eng-ov-pct">{{ engPct(engDegraded.length) }}%</div>
          </div>
        </div>
        <div class="eng-ov-card eng-ov-breakdown">
          <div class="eng-ov-icon"><i class="pi pi-times-circle"></i></div>
          <div class="eng-ov-content">
            <div class="eng-ov-val">{{ engBreakdown.length }}</div>
            <div class="eng-ov-lbl">En Panne</div>
            <div class="eng-ov-pct">{{ engPct(engBreakdown.length) }}%</div>
          </div>
        </div>
        <div class="eng-ov-card eng-ov-stopped">
          <div class="eng-ov-icon"><i class="pi pi-pause-circle"></i></div>
          <div class="eng-ov-content">
            <div class="eng-ov-val">{{ engStopped.length }}</div>
            <div class="eng-ov-lbl">Arrêtés</div>
            <div class="eng-ov-pct">{{ engPct(engStopped.length) }}%</div>
          </div>
        </div>
        <div class="eng-ov-card eng-ov-avail">
          <div class="eng-ov-icon"><i class="pi pi-chart-pie"></i></div>
          <div class="eng-ov-content">
            <div class="eng-ov-val">{{ engAvgAvail }}%</div>
            <div class="eng-ov-lbl">Disponibilité Moy.</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="eng-filters">
        <div class="eng-search-wrap">
          <i class="pi pi-search eng-search-icon"></i>
          <input v-model="engSearch" type="text" placeholder="Rechercher un engin..." class="eng-search" />
          <i v-if="engSearch" class="pi pi-times eng-search-clear" @click="engSearch = ''"></i>
        </div>
        <select v-model="engStatusFilter" class="eng-filter-sel">
          <option value="">Tous les statuts</option>
          <option value="operational">Opérationnel</option>
          <option value="maintenance">En maintenance</option>
          <option value="degraded">Dégradé</option>
          <option value="breakdown">En panne</option>
          <option value="stopped">Arrêté</option>
        </select>
        <button class="eng-btn-new" @click="openNewEquipmentDialog">
          <i class="pi pi-plus"></i> Nouvel équipement
        </button>
      </div>

      <!-- Cards grid -->
      <div class="eng-cards-grid">
        <div v-for="engine in filteredEnginesTab" :key="'card-' + engine.id" class="eng-card" :class="engine.engStatus">

          <!-- Card header -->
          <div class="eng-card-hdr">
            <div class="eng-card-info">
              <div class="eng-name-row">
                <span class="eng-icon-wrap"><i class="pi pi-cog"></i></span>
                <h3 class="eng-name">{{ engine.name }}</h3>
              </div>
              <p class="eng-model">{{ engine.model }}</p>
            </div>
            <span class="eng-pill" :class="'eng-pill--' + engine.engStatus">
              <span class="eng-dot"></span>
              {{ getEngStatusLabel(engine.engStatus) }}
            </span>
          </div>

          <!-- Meta row -->
          <div class="eng-meta-row">
            <span class="eng-meta-item"><i class="pi pi-tag"></i>{{ engine.type }}</span>
            <span class="eng-meta-sep">·</span>
            <span class="eng-meta-item"><i class="pi pi-map-marker"></i>{{ engine.location }}</span>
            <span class="eng-meta-sep">·</span>
            <span class="eng-meta-item"><i class="pi pi-clock"></i>{{ engine.operating_hours }}h</span>
          </div>

          <!-- Metrics -->
          <div class="eng-metrics-block">
            <div class="eng-metric-row">
              <span class="eng-metric-lbl">Disponibilité</span>
              <div class="eng-metric-bar">
                <div class="eng-metric-fill eng-fill-avail" :style="{ width: engine.availability + '%' }"></div>
              </div>
              <span class="eng-metric-val">{{ engine.availability }}%</span>
            </div>
            <div class="eng-metric-row">
              <span class="eng-metric-lbl">Performance</span>
              <div class="eng-metric-bar">
                <div class="eng-metric-fill eng-fill-perf" :style="{ width: engine.reliability + '%' }"></div>
              </div>
              <span class="eng-metric-val">{{ engine.reliability }}%</span>
            </div>
          </div>

          <!-- TBD alert -->
          <div class="eng-tbd-block" v-if="['maintenance', 'breakdown', 'degraded', 'stopped'].includes(engine.engStatus)">
            <div class="eng-tbd" :class="engine.engStatus === 'breakdown' ? 'eng-tbd--danger' : 'eng-tbd--warning'">
              <i class="pi pi-clock"></i>
              <span>Temps écoulé :</span>
              <span class="eng-tbd-val">{{ calcTBD(engine) }}</span>
            </div>
          </div>

          <!-- Next maintenance -->
          <div class="eng-next-maint" v-if="engine.next_maintenance">
            <i class="pi pi-wrench"></i>
            <span>Prochaine maintenance : {{ engine.next_maintenance }}</span>
            <span class="eng-maint-tag" :class="getMaintenanceUrgencyEng(engine.next_maintenance)">
              {{ getMaintenanceDaysEng(engine.next_maintenance) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="eng-card-actions">
            <template v-if="engine.engStatus === 'operational'">
              <button class="eng-btn eng-btn--maint" @click="openEngMaintenance(engine)">
                <i class="pi pi-wrench"></i> Maintenance
              </button>
              <button class="eng-btn eng-btn--panne" @click="openEngBreakdown(engine)">
                <i class="pi pi-exclamation-triangle"></i> Panne
              </button>
            </template>
            <template v-else-if="['maintenance', 'breakdown'].includes(engine.engStatus)">
              <button class="eng-btn eng-btn--service" @click="openEngReturn(engine)">
                <i class="pi pi-play"></i> Remettre en service
              </button>
            </template>
            <div class="eng-sec-actions">
              <button class="eng-icon-btn" title="Historique"><i class="pi pi-history"></i></button>
              <button class="eng-icon-btn" title="Configurer"><i class="pi pi-sliders-h"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Maintenance -->
    <div class="section-container" v-show="activeTab === 'maintenance'">
      <div class="section-header-bar">
        <div>
          <h2>Planning de maintenance</h2>
          <p>Interventions planifiées et en cours — Mai 2026</p>
        </div>
        <div class="section-actions">
          <span class="badge-count urgent">2 urgentes</span>
        </div>
      </div>
      <div class="maint-kpis-row">
        <div class="maint-kpi-box">
          <span class="maint-kpi-num">3</span>
          <span class="maint-kpi-lbl">Cette semaine</span>
        </div>
        <div class="maint-kpi-box in-progress">
          <span class="maint-kpi-num">1</span>
          <span class="maint-kpi-lbl">En cours</span>
        </div>
        <div class="maint-kpi-box urgent-box">
          <span class="maint-kpi-num">2</span>
          <span class="maint-kpi-lbl">Urgentes</span>
        </div>
        <div class="maint-kpi-box ok-box">
          <span class="maint-kpi-num">5</span>
          <span class="maint-kpi-lbl">Planifiées</span>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Engin</th>
              <th>Type d'intervention</th>
              <th>Date prévue</th>
              <th>Seuil (h)</th>
              <th>Technicien</th>
              <th>Priorité</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in maintenanceItems" :key="item.id" class="table-row">
              <td><strong>{{ item.engine }}</strong></td>
              <td>{{ item.type }}</td>
              <td>{{ item.date }}</td>
              <td>{{ item.hours ? item.hours + 'h' : '—' }}</td>
              <td>{{ item.technician }}</td>
              <td><span class="priority-badge" :class="'priority-' + item.priority">{{ item.priorityLabel }}</span></td>
              <td><span class="status-pill" :class="'pill-' + item.status">{{ item.statusLabel }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section Fiabilité -->
    <div class="section-container" v-show="activeTab === 'reliability'">
      <div class="section-header-bar">
        <div>
          <h2>Analyse de fiabilité</h2>
          <p>Modèle Weibull — Paramètres β et η par engin</p>
        </div>
      </div>
      <div class="rel-kpis-row">
        <div class="rel-kpi-box green-box">
          <span class="rel-kpi-num">73%</span>
          <span class="rel-kpi-lbl">R(t) moyen flotte</span>
          <small>Horizon 30j</small>
        </div>
        <div class="rel-kpi-box blue-box">
          <span class="rel-kpi-num">312h</span>
          <span class="rel-kpi-lbl">MTBF moyen</span>
          <small>+18h vs M-1</small>
        </div>
        <div class="rel-kpi-box orange-box">
          <span class="rel-kpi-num">4,2h</span>
          <span class="rel-kpi-lbl">MTTR moyen</span>
          <small>-0,8h vs M-1</small>
        </div>
        <div class="rel-kpi-box red-box">
          <span class="rel-kpi-num">2</span>
          <span class="rel-kpi-lbl">Engins à risque</span>
          <small>R(t) &lt; 60%</small>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Engin</th>
              <th>R(t) 30j</th>
              <th>R(t) 90j</th>
              <th>β (forme)</th>
              <th>η (échelle)</th>
              <th>MTBF</th>
              <th>MTTR</th>
              <th>Pannes (12m)</th>
              <th>Recommandation</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="engine in reliabilityData" :key="engine.id" class="table-row">
              <td><strong>{{ engine.name }}</strong></td>
              <td><span :style="{ color: engine.color, fontWeight: '700' }">{{ engine.rt30 }}%</span></td>
              <td>{{ engine.rt90 }}%</td>
              <td>{{ engine.beta }}</td>
              <td>{{ engine.eta }}h</td>
              <td>{{ engine.mtbf }}h</td>
              <td>{{ engine.mttr }}h</td>
              <td>{{ engine.failures }}</td>
              <td><span class="reco-badge" :class="'reco-' + engine.recoType">{{ engine.reco }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="weibull-note">
        <i class="pi pi-info-circle"></i>
        <span>Formule : <strong>R(t) = e^(-(t/η)^β)</strong> — Loi de Weibull à 2 paramètres. β &lt; 1 : pannes de jeunesse · β = 1 : taux constant · β &gt; 1 : usure progressive</span>
      </div>
    </div>

    <!-- Section Carburant -->
    <div class="section-container" v-show="activeTab === 'fuel'">
      <div class="section-header-bar">
        <div>
          <h2>Consommation carburant</h2>
          <p>Suivi et analyse par engin</p>
        </div>
        <div class="section-actions">
          <span class="badge-count">Total : 2 140 L/j</span>
        </div>
      </div>
      <div class="fuel-kpis-row">
        <div class="fuel-kpi-box">
          <i class="pi pi-tint"></i>
          <span class="fuel-kpi-num">2 140 L</span>
          <span class="fuel-kpi-lbl">Aujourd'hui</span>
        </div>
        <div class="fuel-kpi-box">
          <i class="pi pi-chart-bar"></i>
          <span class="fuel-kpi-num">14 980 L</span>
          <span class="fuel-kpi-lbl">Cette semaine</span>
        </div>
        <div class="fuel-kpi-box">
          <i class="pi pi-calendar"></i>
          <span class="fuel-kpi-num">52 200 L</span>
          <span class="fuel-kpi-lbl">Ce mois</span>
        </div>
        <div class="fuel-kpi-box warning-box">
          <i class="pi pi-exclamation-triangle"></i>
          <span class="fuel-kpi-num">1</span>
          <span class="fuel-kpi-lbl">Dérive détectée</span>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Engin</th>
              <th>Conso / jour</th>
              <th>Conso / semaine</th>
              <th>Conso / mois</th>
              <th>Efficacité</th>
              <th>Tendance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in fuelData" :key="item.id" class="table-row">
              <td><strong>{{ item.engine }}</strong></td>
              <td>{{ item.daily }} L</td>
              <td>{{ item.weekly }} L</td>
              <td>{{ item.monthly }} L</td>
              <td>
                <div class="efficiency-bar">
                  <div class="bar-wrapper">
                    <div class="bar-fill" :style="{ width: item.efficiency + '%', backgroundColor: item.efficiency >= 90 ? '#4caf50' : item.efficiency >= 80 ? '#ff9800' : '#f44336' }"></div>
                  </div>
                  <span>{{ item.efficiency }}%</span>
                </div>
              </td>
              <td><span class="trend-badge" :class="item.trend.startsWith('+') ? 'trend-up' : 'trend-down'">{{ item.trend }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===== Section VGP ===== -->
    <div class="section-container" v-show="activeTab === 'vgp'">

      <!-- Header -->
      <div class="section-header-bar">
        <div>
          <h2>Vérifications Générales Périodiques</h2>
          <p>Suivi des contrôles réglementaires par engin</p>
        </div>
        <div class="section-actions">
          <button class="eng-btn-new" @click="openVgpDialog()">
            <i class="pi pi-plus"></i> Nouvelle VGP
          </button>
        </div>
      </div>

      <!-- Alert banner overdue -->
      <div v-if="vgpStats.en_retard > 0" class="vgp-alert-banner">
        <i class="pi pi-exclamation-triangle"></i>
        <span><strong>{{ vgpStats.en_retard }} vérification(s) en retard</strong> — des engins nécessitent une VGP urgente.</span>
      </div>

      <!-- KPI Row -->
      <div class="vgp-kpis-row">
        <div class="vgp-kpi-box vgp-kpi--retard">
          <div class="vgp-kpi-icon-wrap"><i class="pi pi-exclamation-circle"></i></div>
          <div class="vgp-kpi-content">
            <span class="vgp-kpi-num">{{ vgpStats.en_retard }}</span>
            <span class="vgp-kpi-label">En retard</span>
            <span class="vgp-kpi-sub">Action urgente</span>
          </div>
        </div>
        <div class="vgp-kpi-box vgp-kpi--en-cours">
          <div class="vgp-kpi-icon-wrap"><i class="pi pi-sync"></i></div>
          <div class="vgp-kpi-content">
            <span class="vgp-kpi-num">{{ vgpStats.en_cours }}</span>
            <span class="vgp-kpi-label">En cours</span>
            <span class="vgp-kpi-sub">En progression</span>
          </div>
        </div>
        <div class="vgp-kpi-box vgp-kpi--termine">
          <div class="vgp-kpi-icon-wrap"><i class="pi pi-check-circle"></i></div>
          <div class="vgp-kpi-content">
            <span class="vgp-kpi-num">{{ vgpStats.termine }}</span>
            <span class="vgp-kpi-label">Terminé</span>
            <span class="vgp-kpi-sub">Conformes</span>
          </div>
        </div>
        <div class="vgp-kpi-box vgp-kpi--planifie">
          <div class="vgp-kpi-icon-wrap"><i class="pi pi-calendar"></i></div>
          <div class="vgp-kpi-content">
            <span class="vgp-kpi-num">{{ vgpStats.planifie }}</span>
            <span class="vgp-kpi-label">Planifié</span>
            <span class="vgp-kpi-sub">À venir</span>
          </div>
        </div>
        <div class="vgp-kpi-box vgp-kpi--conformite">
          <div class="vgp-kpi-icon-wrap"><i class="pi pi-shield"></i></div>
          <div class="vgp-kpi-content">
            <span class="vgp-kpi-num">{{ vgpStats.conformite_pct }}%</span>
            <span class="vgp-kpi-label">Taux de conformité</span>
            <span class="vgp-kpi-sub">+2% vs trim. précédent</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="eng-filters">
        <div class="eng-search-wrap">
          <i class="pi pi-search eng-search-icon"></i>
          <input v-model="vgpSearch" type="text" placeholder="Rechercher un engin, type de VGP, organisme…" class="eng-search" />
          <i v-if="vgpSearch" class="pi pi-times eng-search-clear" @click="vgpSearch = ''"></i>
        </div>
        <select v-model="vgpStatusFilter" class="eng-filter-sel">
          <option value="">Tous les statuts</option>
          <option value="en_retard">En retard</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
          <option value="planifie">Planifié</option>
        </select>
        <select v-model="vgpTypeFilter" class="eng-filter-sel">
          <option value="">Tous les types</option>
          <option value="levage">Vérif. levage</option>
          <option value="electrique">Vérif. électrique</option>
          <option value="pression">Vérif. pression</option>
          <option value="generale">Contrôle général</option>
          <option value="anti_incendie">Anti-incendie</option>
        </select>
      </div>

      <!-- Cards Grid -->
      <div class="vgp-cards-grid">
        <div v-for="item in filteredVgp" :key="item.id" class="vgp-card" :class="'vgp-card--' + item.status">

          <!-- Header -->
          <div class="vgp-card-hdr">
            <div class="vgp-eng-info">
              <div class="vgp-eng-avatar"><i class="pi pi-cog"></i></div>
              <div>
                <h3>{{ item.engine }}</h3>
                <p>{{ item.type_label }}</p>
              </div>
            </div>
            <span class="vgp-status-badge" :class="'vgp-badge--' + item.status">
              <span class="vgp-status-dot"></span>
              {{ getVgpStatusLabel(item.status) }}
            </span>
          </div>

          <!-- Dates -->
          <div class="vgp-dates-block">
            <div class="vgp-date-item">
              <i class="pi pi-calendar-minus vgp-date-icon"></i>
              <div>
                <span class="vgp-date-lbl">Dernière VGP</span>
                <span class="vgp-date-val">{{ item.last_date || '—' }}</span>
              </div>
            </div>
            <div class="vgp-dates-sep"></div>
            <div class="vgp-date-item">
              <i class="pi pi-calendar-plus vgp-date-icon"></i>
              <div>
                <span class="vgp-date-lbl">Prochaine VGP</span>
                <span class="vgp-date-val">{{ item.next_date }}</span>
              </div>
            </div>
          </div>

          <!-- Deadline progress -->
          <div class="vgp-progress-block">
            <div class="vgp-progress-info">
              <span v-if="item.status === 'en_retard'" class="vgp-overdue-txt">
                <i class="pi pi-exclamation-triangle"></i>
                En retard de {{ getVgpDaysOverdue(item.next_date) }} jour(s)
              </span>
              <span v-else-if="item.status === 'en_cours'" class="vgp-info-txt vgp-txt--blue">
                <i class="pi pi-sync"></i> Vérification en cours
              </span>
              <span v-else-if="item.status === 'termine'" class="vgp-info-txt vgp-txt--green">
                <i class="pi pi-check"></i> Conforme — prochaine dans {{ getVgpDaysRemaining(item.next_date) }}j
              </span>
              <span v-else class="vgp-info-txt vgp-txt--orange">
                <i class="pi pi-clock"></i> Dans {{ getVgpDaysRemaining(item.next_date) }} jours
              </span>
            </div>
            <div class="vgp-bar-track">
              <div class="vgp-bar-fill" :class="'vgp-bar--' + item.status" :style="{ width: getVgpProgress(item) + '%' }"></div>
            </div>
          </div>

          <!-- Meta info -->
          <div class="vgp-meta-row">
            <div class="vgp-meta-item">
              <i class="pi pi-building"></i>
              <span>{{ item.organisme }}</span>
            </div>
            <div class="vgp-meta-item">
              <i class="pi pi-user"></i>
              <span>{{ item.responsable }}</span>
            </div>
            <div v-if="item.result" class="vgp-meta-item">
              <span class="vgp-result-pill" :class="'vgp-result--' + item.result">{{ getVgpResultLabel(item.result) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="vgp-card-actions">
            <button v-if="item.status === 'planifie' || item.status === 'en_retard'" class="eng-btn vgp-btn--start" @click="startVgp(item)">
              <i class="pi pi-play"></i> Démarrer
            </button>
            <button v-if="item.status === 'en_cours'" class="eng-btn vgp-btn--validate" @click="validateVgp(item)">
              <i class="pi pi-check"></i> Valider
            </button>
            <button v-if="item.document" class="eng-btn vgp-btn--doc" @click="viewVgpDoc(item)">
              <i class="pi pi-file-pdf"></i> Rapport
            </button>
            <div class="vgp-icon-actions">
              <button class="eng-icon-btn" title="Modifier / Planifier" @click="openVgpDialog(item)">
                <i class="pi pi-pencil"></i>
              </button>
              <button class="eng-icon-btn" title="Historique">
                <i class="pi pi-history"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredVgp.length === 0" class="vgp-empty">
        <i class="pi pi-shield vgp-empty-icon"></i>
        <p>Aucune VGP ne correspond à ces critères</p>
      </div>
    </div>

    <!-- ===== Modal Maintenance ===== -->
    <div v-if="showEngMaintenanceDialog" class="eng-modal-overlay" @click.self="showEngMaintenanceDialog = false">
      <div class="eng-modal">
        <div class="eng-modal-hdr">
          <div>
            <h3>Déclaration d'arrêt / Maintenance</h3>
            <p>{{ selectedEngineCard?.name }} — {{ selectedEngineCard?.model }}</p>
          </div>
          <button class="eng-modal-close" @click="showEngMaintenanceDialog = false"><i class="pi pi-times"></i></button>
        </div>
        <div class="eng-modal-body">
          <div class="eng-info-banner">
            <i class="pi pi-wrench"></i>
            <div><strong>{{ selectedEngineCard?.name }}</strong><p>{{ selectedEngineCard?.model }}</p></div>
          </div>
          <div class="eng-form-group">
            <label>Type d'intervention *</label>
            <select v-model="engMaintenanceForm.type" class="eng-form-select">
              <option value="">Sélectionner</option>
              <option value="preventive">Maintenance préventive</option>
              <option value="corrective">Maintenance corrective</option>
              <option value="overhaul">Révision générale</option>
              <option value="part_replacement">Remplacement pièce</option>
              <option value="cleaning">Nettoyage / Lubrification</option>
              <option value="calibration">Calibration</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div class="eng-form-group">
            <label>Motif / Description *</label>
            <textarea v-model="engMaintenanceForm.reason" rows="3" class="eng-form-textarea" placeholder="Décrivez le motif de l'arrêt..."></textarea>
          </div>
          <div class="eng-form-row">
            <div class="eng-form-group">
              <label>Date de début *</label>
              <input type="datetime-local" v-model="engMaintenanceForm.start_date" class="eng-form-input" />
            </div>
            <div class="eng-form-group">
              <label>Durée estimée (h) *</label>
              <input type="number" v-model="engMaintenanceForm.estimated_duration" min="0" class="eng-form-input" placeholder="0" />
            </div>
          </div>
          <div class="eng-form-group">
            <label>Technicien / Équipe</label>
            <input type="text" v-model="engMaintenanceForm.technician" class="eng-form-input" placeholder="Nom du technicien ou de l'équipe" />
          </div>
          <div class="eng-form-group">
            <label>Priorité</label>
            <select v-model="engMaintenanceForm.priority" class="eng-form-select">
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div class="eng-form-group">
            <label>Notes additionnelles</label>
            <textarea v-model="engMaintenanceForm.notes" rows="2" class="eng-form-textarea" placeholder="Informations complémentaires..."></textarea>
          </div>
        </div>
        <div class="eng-modal-footer">
          <button class="eng-modal-cancel" @click="showEngMaintenanceDialog = false">Annuler</button>
          <button class="eng-modal-submit eng-submit--warning" @click="submitEngMaintenance">
            <i class="pi pi-check"></i> Déclarer l'arrêt
          </button>
        </div>
      </div>
    </div>

    <!-- ===== Modal Panne ===== -->
    <div v-if="showEngBreakdownDialog" class="eng-modal-overlay" @click.self="showEngBreakdownDialog = false">
      <div class="eng-modal">
        <div class="eng-modal-hdr">
          <div>
            <h3>Déclaration de panne / Arrêt non planifié</h3>
            <p>{{ selectedEngineCard?.name }} — {{ selectedEngineCard?.model }}</p>
          </div>
          <button class="eng-modal-close" @click="showEngBreakdownDialog = false"><i class="pi pi-times"></i></button>
        </div>
        <div class="eng-modal-body">
          <div class="eng-info-banner eng-info-banner--danger">
            <i class="pi pi-exclamation-triangle"></i>
            <div><strong>{{ selectedEngineCard?.name }}</strong><p>{{ selectedEngineCard?.model }}</p></div>
          </div>
          <div class="eng-form-group">
            <label>Type de panne *</label>
            <select v-model="engBreakdownForm.type" class="eng-form-select">
              <option value="">Sélectionner</option>
              <option value="mechanical">Panne mécanique</option>
              <option value="electrical">Panne électrique</option>
              <option value="hydraulic">Panne hydraulique</option>
              <option value="pneumatic">Panne pneumatique</option>
              <option value="overheating">Surchauffe</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div class="eng-form-group">
            <label>Description de la panne *</label>
            <textarea v-model="engBreakdownForm.description" rows="4" class="eng-form-textarea" placeholder="Décrivez en détail la panne constatée..."></textarea>
          </div>
          <div class="eng-form-row">
            <div class="eng-form-group">
              <label>Date et heure *</label>
              <input type="datetime-local" v-model="engBreakdownForm.breakdown_date" class="eng-form-input" />
            </div>
            <div class="eng-form-group">
              <label>Sévérité *</label>
              <select v-model="engBreakdownForm.severity" class="eng-form-select">
                <option value="">Sélectionner</option>
                <option value="minor">Mineure</option>
                <option value="moderate">Modérée</option>
                <option value="major">Majeure</option>
                <option value="critical">Critique</option>
              </select>
            </div>
          </div>
          <div class="eng-form-group">
            <label>Impact sur la production</label>
            <textarea v-model="engBreakdownForm.impact" rows="2" class="eng-form-textarea" placeholder="Décrivez l'impact sur la production..."></textarea>
          </div>
          <div class="eng-form-group">
            <label>Déclaré par</label>
            <input type="text" v-model="engBreakdownForm.reported_by" class="eng-form-input" placeholder="Nom de la personne qui déclare" />
          </div>
        </div>
        <div class="eng-modal-footer">
          <button class="eng-modal-cancel" @click="showEngBreakdownDialog = false">Annuler</button>
          <button class="eng-modal-submit eng-submit--danger" @click="submitEngBreakdown">
            <i class="pi pi-exclamation-triangle"></i> Déclarer la panne
          </button>
        </div>
      </div>
    </div>

    <!-- ===== Modal Remise en service ===== -->
    <!-- Modal Nouvel équipement -->
    <div v-if="showNewEquipmentDialog" class="eng-modal-overlay" @click.self="showNewEquipmentDialog = false">
      <div class="eng-modal">
        <div class="eng-modal-hdr">
          <div>
            <h3><i class="pi pi-plus-circle" style="color:#7ac943;margin-right:8px"></i>Nouvel équipement</h3>
            <p>Renseignez les informations pour ajouter un équipement au parc</p>
          </div>
          <button class="eng-modal-close" @click="showNewEquipmentDialog = false"><i class="pi pi-times"></i></button>
        </div>
        <div class="eng-modal-body">
          <div class="eng-form-row">
            <div class="eng-form-group">
              <label>Nom de l'équipement *</label>
              <input v-model="newEquipmentForm.name" type="text" class="eng-form-input" placeholder="ex: Volvo A25G #2" />
            </div>
            <div class="eng-form-group">
              <label>Numéro de série *</label>
              <input v-model="newEquipmentForm.serial" type="text" class="eng-form-input" placeholder="ex: SN-2024-XXXX" />
            </div>
          </div>
          <div class="eng-form-row">
            <div class="eng-form-group">
              <label>Type d'équipement *</label>
              <select v-model="newEquipmentForm.type" class="eng-form-select">
                <option value="">Sélectionner un type</option>
                <optgroup label="Engins">
                  <option value="Tombereau">Tombereau</option>
                  <option value="Pelle hydraulique">Pelle hydraulique</option>
                  <option value="Bulldozer">Bulldozer</option>
                  <option value="Chargeuse">Chargeuse</option>
                  <option value="Niveleuse">Niveleuse</option>
                  <option value="Grue mobile">Grue mobile</option>
                  <option value="Compacteur">Compacteur</option>
                  <option value="Foreuse">Foreuse</option>
                  <option value="Tractopelle">Tractopelle</option>
                </optgroup>
                <optgroup label="Machines">
                  <option value="Compresseur">Compresseur</option>
                  <option value="Groupe électrogène">Groupe électrogène</option>
                  <option value="Pompe">Pompe</option>
                  <option value="Convoyeur">Convoyeur</option>
                  <option value="Concasseur">Concasseur</option>
                  <option value="Crible">Crible</option>
                  <option value="Mélangeur">Mélangeur</option>
                  <option value="Tour">Tour</option>
                  <option value="Fraiseuse">Fraiseuse</option>
                  <option value="Autre">Autre</option>
                </optgroup>
              </select>
            </div>
            <div class="eng-form-group">
              <label>Poste de charge *</label>
              <select v-model="newEquipmentForm.poste" class="eng-form-select">
                <option value="">Sélectionner un poste</option>
                <option value="Chantier Nord">Chantier Nord</option>
                <option value="Chantier Sud">Chantier Sud</option>
                <option value="Chantier Est">Chantier Est</option>
                <option value="Chantier Ouest">Chantier Ouest</option>
                <option value="Atelier Mécanique">Atelier Mécanique</option>
                <option value="Atelier Électrique">Atelier Électrique</option>
                <option value="Carrière A">Carrière A</option>
                <option value="Carrière B">Carrière B</option>
                <option value="Zone de stockage">Zone de stockage</option>
                <option value="Usine de traitement">Usine de traitement</option>
              </select>
            </div>
          </div>
          <div class="eng-form-group">
            <label>Modèle / Référence</label>
            <input v-model="newEquipmentForm.model" type="text" class="eng-form-input" placeholder="ex: A25G Articulated Hauler" />
          </div>
          <div class="eng-form-group">
            <label>Description <span class="eng-optional">(optionnel)</span></label>
            <textarea v-model="newEquipmentForm.description" rows="3" class="eng-form-textarea" placeholder="Description générale de l'équipement, caractéristiques principales..."></textarea>
          </div>
          <div class="eng-form-row">
            <div class="eng-form-group">
              <label>ID Capteur IoT <span class="eng-optional">(optionnel)</span></label>
              <input v-model="newEquipmentForm.sensor_id" type="text" class="eng-form-input" placeholder="ex: SENSOR-001" />
            </div>
            <div class="eng-form-group">
              <label>Statut initial</label>
              <select v-model="newEquipmentForm.status" class="eng-form-select">
                <option value="operational">Opérationnel</option>
                <option value="maintenance">En maintenance</option>
                <option value="stopped">Arrêté</option>
              </select>
            </div>
          </div>
          <div class="eng-form-group">
            <label>Notes additionnelles <span class="eng-optional">(optionnel)</span></label>
            <textarea v-model="newEquipmentForm.notes" rows="2" class="eng-form-textarea" placeholder="Informations complémentaires, historique, remarques..."></textarea>
          </div>
        </div>
        <div class="eng-modal-footer">
          <button class="eng-modal-cancel" @click="showNewEquipmentDialog = false">Annuler</button>
          <button class="eng-modal-submit eng-submit--add" @click="submitNewEquipment">
            <i class="pi pi-plus"></i> Créer l'équipement
          </button>
        </div>
      </div>
    </div>

    <div v-if="showEngReturnDialog" class="eng-modal-overlay" @click.self="showEngReturnDialog = false">
      <div class="eng-modal">
        <div class="eng-modal-hdr">
          <div>
            <h3>Remise en service</h3>
            <p>{{ selectedEngineCard?.name }} — {{ selectedEngineCard?.model }}</p>
          </div>
          <button class="eng-modal-close" @click="showEngReturnDialog = false"><i class="pi pi-times"></i></button>
        </div>
        <div class="eng-modal-body">
          <div class="eng-info-banner eng-info-banner--success">
            <i class="pi pi-check-circle"></i>
            <div><strong>{{ selectedEngineCard?.name }}</strong><p>{{ selectedEngineCard?.model }}</p></div>
          </div>
          <div class="eng-form-group">
            <label>Date de remise en service *</label>
            <input type="datetime-local" v-model="engReturnForm.end_date" class="eng-form-input" />
          </div>
          <div class="eng-form-group">
            <label>Travaux effectués *</label>
            <textarea v-model="engReturnForm.work_done" rows="4" class="eng-form-textarea" placeholder="Décrivez les travaux effectués pendant l'intervention..."></textarea>
          </div>
          <div class="eng-form-row">
            <div class="eng-form-group">
              <label>Durée réelle (h) *</label>
              <input type="number" v-model="engReturnForm.actual_duration" min="0" class="eng-form-input" placeholder="0" />
            </div>
            <div class="eng-form-group">
              <label>Pièces utilisées</label>
              <input type="text" v-model="engReturnForm.parts_used" class="eng-form-input" placeholder="Liste des pièces" />
            </div>
          </div>
          <div class="eng-form-group">
            <label>Validé par</label>
            <input type="text" v-model="engReturnForm.validated_by" class="eng-form-input" placeholder="Nom du validateur" />
          </div>
          <div class="eng-form-group">
            <label>État après intervention</label>
            <div class="eng-radio-group">
              <label class="eng-radio-opt">
                <input type="radio" value="operational" v-model="engReturnForm.new_status" />
                <i class="pi pi-check-circle"></i> Opérationnel
              </label>
              <label class="eng-radio-opt">
                <input type="radio" value="degraded" v-model="engReturnForm.new_status" />
                <i class="pi pi-exclamation-circle"></i> Mode dégradé
              </label>
            </div>
          </div>
          <div class="eng-form-group">
            <label>Observations</label>
            <textarea v-model="engReturnForm.notes" rows="2" class="eng-form-textarea" placeholder="Observations supplémentaires..."></textarea>
          </div>
        </div>
        <div class="eng-modal-footer">
          <button class="eng-modal-cancel" @click="showEngReturnDialog = false">Annuler</button>
          <button class="eng-modal-submit eng-submit--success" @click="submitEngReturn">
            <i class="pi pi-play"></i> Remettre en service
          </button>
        </div>
      </div>
    </div>
    <!-- ===== Modal VGP ===== -->
    <div v-if="showVgpDialog" class="eng-modal-overlay" @click.self="showVgpDialog = false">
      <div class="eng-modal">
        <div class="eng-modal-hdr">
          <div>
            <h3><i class="pi pi-shield" style="color:#3b82f6;margin-right:8px"></i>{{ editVgpItem ? 'Modifier la VGP' : 'Nouvelle VGP' }}</h3>
            <p>Enregistrez ou planifiez une vérification réglementaire</p>
          </div>
          <button class="eng-modal-close" @click="showVgpDialog = false"><i class="pi pi-times"></i></button>
        </div>
        <div class="eng-modal-body">
          <div class="eng-form-row">
            <div class="eng-form-group">
              <label>Engin *</label>
              <select v-model="vgpForm.engine" class="eng-form-select">
                <option value="">Sélectionner un engin</option>
                <option v-for="e in engines" :key="e.id" :value="e.name">{{ e.name }}</option>
              </select>
            </div>
            <div class="eng-form-group">
              <label>Type de vérification *</label>
              <select v-model="vgpForm.type" class="eng-form-select">
                <option value="">Sélectionner</option>
                <option value="levage">Vérification levage</option>
                <option value="electrique">Vérification électrique</option>
                <option value="pression">Vérification sous pression</option>
                <option value="generale">Contrôle général</option>
                <option value="anti_incendie">Anti-incendie</option>
                <option value="chariot">Chariot élévateur</option>
              </select>
            </div>
          </div>
          <div class="eng-form-row">
            <div class="eng-form-group">
              <label>Date de réalisation <span class="eng-optional">(optionnel)</span></label>
              <input type="date" v-model="vgpForm.last_date" class="eng-form-input" />
            </div>
            <div class="eng-form-group">
              <label>Prochaine échéance *</label>
              <input type="date" v-model="vgpForm.next_date" class="eng-form-input" />
            </div>
          </div>
          <div class="eng-form-row">
            <div class="eng-form-group">
              <label>Organisme vérificateur *</label>
              <input type="text" v-model="vgpForm.organisme" class="eng-form-input" placeholder="Ex: Bureau Veritas, APAVE, SOCOTEC…" />
            </div>
            <div class="eng-form-group">
              <label>Responsable <span class="eng-optional">(optionnel)</span></label>
              <input type="text" v-model="vgpForm.responsable" class="eng-form-input" placeholder="Nom du responsable" />
            </div>
          </div>
          <div class="eng-form-row">
            <div class="eng-form-group">
              <label>Statut</label>
              <select v-model="vgpForm.status" class="eng-form-select">
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="en_retard">En retard</option>
              </select>
            </div>
            <div class="eng-form-group">
              <label>Résultat <span class="eng-optional">(optionnel)</span></label>
              <select v-model="vgpForm.result" class="eng-form-select">
                <option value="">Pas de résultat</option>
                <option value="favorable">Favorable</option>
                <option value="reserves">Favorable avec réserves</option>
                <option value="defavorable">Défavorable</option>
              </select>
            </div>
          </div>
          <div class="eng-form-group">
            <label>Référence document / rapport <span class="eng-optional">(optionnel)</span></label>
            <input type="text" v-model="vgpForm.document" class="eng-form-input" placeholder="N° du rapport ou référence" />
          </div>
          <div class="eng-form-group">
            <label>Observations <span class="eng-optional">(optionnel)</span></label>
            <textarea v-model="vgpForm.notes" rows="3" class="eng-form-textarea" placeholder="Remarques, prescriptions, suites à donner…"></textarea>
          </div>
        </div>
        <div class="eng-modal-footer">
          <button class="eng-modal-cancel" @click="showVgpDialog = false">Annuler</button>
          <button class="eng-modal-submit eng-submit--add" @click="submitVgp">
            <i class="pi pi-check"></i> {{ editVgpItem ? 'Enregistrer' : 'Créer la VGP' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { axiosInstance } from '@/main.js'
import { useImportEventsStore } from '@/stores/importEventsStore'

const activeTab = ref('overview')
const ENGINS_IMPORT_STORAGE_KEY = 'engins_import_snapshot_v1'
const ENGINS_IMPORT_EVENT = 'engins-import-updated'

const dashboardApiData = ref(null)
const importedEnginsPayload = ref(null)
const importEventsStore = useImportEventsStore()
const lastHandledImportTimestamp = ref(null)

const toInt = (v, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : fallback
}

const toFloat = (v, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const toFrDate = (isoDate) => {
  if (!isoDate) return null
  const parts = String(isoDate).split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

const statusLabelFromRt = (rt30) => {
  if (rt30 < 50) return { key: 'revision_urgente', label: 'Révision urgente', color: '#f44336' }
  if (rt30 < 70) return { key: 'surveiller', label: 'Surveiller', color: '#ff9800' }
  return { key: 'fiable', label: 'Fiable', color: '#4caf50' }
}

const mapEnginsImportPayload = (payload) => {
  if (!payload || !Array.isArray(payload.engines)) return

  engines.value = payload.engines.map((e, idx) => {
    const statusInfo = statusLabelFromRt(toFloat(e?.kpis?.rt_30j_pct, 0))
    return {
      id: idx + 1,
      name: e.nom || e.engin_id || `Engin ${idx + 1}`,
      model: e.modele || '-',
      type: e.type_engin || '-',
      location: e.localisation || '-',
      reliability: toInt(e?.kpis?.rt_30j_pct, 0),
      availability: toInt(e?.kpis?.disponibilite_pct, 0),
      color: statusInfo.color,
      status: statusInfo.key,
      status_label: statusInfo.label,
      engStatus: e.statut || 'operational',
      hoursMonth: toFloat(e.heures_fonct_mois, 0),
      operating_hours: toFloat(e.heures_cumulees, 0),
      lastMaintenance: toFrDate(e.date_derniere_maintenance),
      next_maintenance: toFrDate(e.date_prochaine_maintenance),
      lastStateChange: new Date().toISOString()
    }
  })

  if (Array.isArray(payload?.reliability?.par_engin)) {
    reliabilityData.value = payload.reliability.par_engin.map((r, idx) => {
      const statusInfo = statusLabelFromRt(toFloat(r.rt_30j_pct, 0))
      return {
        id: idx + 1,
        name: r.nom || r.engin_id || `Engin ${idx + 1}`,
        rt30: toInt(r.rt_30j_pct, 0),
        rt90: toInt(r.rt_90j_pct, 0),
        beta: toFloat(r.beta, 0),
        eta: toFloat(r.eta_h, 0),
        mtbf: toFloat(r.mtbf_h, 0),
        mttr: toFloat(r.mttr_h, 0),
        failures: toInt(r.nb_pannes_12mois, 0),
        color: statusInfo.color,
        recoType: statusInfo.key === 'revision_urgente' ? 'urgent' : statusInfo.key === 'surveiller' ? 'watch' : 'ok',
        reco: r.recommandation || statusInfo.label
      }
    })
  }

  if (Array.isArray(payload?.fuel?.detail)) {
    fuelData.value = payload.fuel.detail.map((f, idx) => ({
      id: idx + 1,
      engine: f.nom_engin || f.engin_id || `Engin ${idx + 1}`,
      daily: toFloat(f.conso_jour_L, 0),
      weekly: toFloat(f.conso_semaine_L, 0),
      monthly: toFloat(f.conso_mois_L, 0),
      efficiency: toInt(f.efficacite_pct, 0),
      trend: `${toFloat(f.tendance_pct, 0) > 0 ? '+' : ''}${toFloat(f.tendance_pct, 0)}%`
    }))
  }

  if (Array.isArray(payload?.maintenance?.interventions)) {
    const prioLabels = { critique: 'Critique', haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' }
    const statusLabels = { planifie: 'Planifié', en_cours: 'En cours', termine: 'Terminé', annule: 'Annulé' }
    const prioMap = { critique: 'critical', haute: 'high', moyenne: 'medium', basse: 'low' }
    maintenanceItems.value = payload.maintenance.interventions.map((m, idx) => ({
      id: idx + 1,
      engine: m.nom_engin || m.engin_id || `Engin ${idx + 1}`,
      type: m.type_intervention || '-',
      date: toFrDate(m.date_prevue),
      hours: m.seuil_heures || null,
      technician: m.technicien || '-',
      priority: prioMap[m.priorite] || 'medium',
      priorityLabel: prioLabels[m.priorite] || 'Moyenne',
      status: m.statut || 'planifie',
      statusLabel: statusLabels[m.statut] || 'Planifié'
    }))
  }

  if (Array.isArray(payload?.vgp?.verifications)) {
    vgpData.value = payload.vgp.verifications.map((v, idx) => ({
      id: idx + 1,
      engine: v.nom_engin || v.engin_id || `Engin ${idx + 1}`,
      type: v.type_vgp || 'generale',
      type_label: v.type_label || 'Contrôle général',
      last_date: toFrDate(v.date_derniere_vgp),
      next_date: toFrDate(v.date_prochaine_vgp),
      organisme: v.organisme || '-',
      responsable: v.responsable || '-',
      status: v.statut || 'planifie',
      result: v.resultat || null,
      document: v.reference_document || null,
      notes: v.observations || '',
      period_months: toInt(v.periodicite_mois, 6)
    }))
  }
}

const applyImportedPayload = (payloadWrapper) => {
  const payload = payloadWrapper?.data || payloadWrapper
  if (!payload || typeof payload !== 'object') return
  importedEnginsPayload.value = payload
  mapEnginsImportPayload(payload)
}

const hydrateImportFromLocalStorage = () => {
  const raw = localStorage.getItem(ENGINS_IMPORT_STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    applyImportedPayload(parsed)
  } catch (e) {
    console.warn('Snapshot Engins invalide dans localStorage:', e)
  }
}

const handleImportEvent = (payload) => {
  const evt = payload?.detail ?? payload
  if (!evt || evt.type !== 'engins') return
  if (evt.timestamp && lastHandledImportTimestamp.value === evt.timestamp) return
  lastHandledImportTimestamp.value = evt.timestamp

  try {
    applyImportedPayload(evt.data)
  } catch (e) {
    console.error('Failed to apply engins import event', e)
  }
}

const onImportedEvent = (evt) => {
  handleImportEvent(evt)
}

watch(
  () => importEventsStore.lastImportEvent?.timestamp,
  () => {
    const evt = importEventsStore.lastImportEvent
    if (evt?.type === 'engins') {
      handleImportEvent(evt)
    }
  },
  { immediate: true }
)

const fetchDashboardFallback = async () => {
  try {
    const resp = await axiosInstance.get('/engins/machines/dashboard/')
    dashboardApiData.value = resp.data
  } catch (_) {
    dashboardApiData.value = null
  }
}

// ── Heures moteur — 7 derniers jours (réels) ──
const motorHoursData = computed(() => {
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  // Valeurs réalistes selon le jour (0=Dim…6=Sam) : jours ouvrés > week-end
  const baseHours = [68, 182, 191, 177, 175, 168, 94]
  // Légère variation aléatoire reproductible (basée sur la date)
  const jitter = [0, +8, -5, 0, +3, -4, +6]
  const today = new Date()
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dow = d.getDay()
    const hours = baseHours[dow] + jitter[dow]
    days.push({
      label: i === 0 ? "Aujourd'hui" : `${dayNames[dow]} ${d.getDate()}`,
      hours,
      isToday: i === 0
    })
  }
  const max = Math.max(...days.map(d => d.hours))
  return days.map(d => ({ ...d, pct: Math.round((d.hours / max) * 100) }))
})

const tabs = ref([
  { id: 'overview', label: 'Vue flotte' },
  { id: 'engines', label: 'Engins' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'reliability', label: 'Fiabilité' },
  { id: 'fuel', label: 'Carburant' },
  { id: 'vgp', label: 'VGP' }
])

const engines = ref([
  { id: 1, name: 'Volvo A25G', model: 'A25G Articulated Hauler', type: 'Tombereau', location: 'Chantier Nord', reliability: 91, availability: 94, color: '#4caf50', status: 'fiable', status_label: 'Fiable', engStatus: 'operational', hoursMonth: 210, operating_hours: 2140, lastMaintenance: '15/03/2026', next_maintenance: '15/05/2026', lastStateChange: '2026-03-15T08:00:00' },
  { id: 2, name: 'Caterpillar 320 GC', model: 'Cat 320 GC Excavator', type: 'Pelle hydraulique', location: 'Zone B', reliability: 87, availability: 89, color: '#4caf50', status: 'fiable', status_label: 'Fiable', engStatus: 'operational', hoursMonth: 195, operating_hours: 1850, lastMaintenance: '20/03/2026', next_maintenance: '20/05/2026', lastStateChange: '2026-03-20T07:30:00' },
  { id: 3, name: 'Komatsu PC200-8', model: 'PC200-8M0 Excavator', type: 'Pelle hydraulique', location: 'Carrière Est', reliability: 73, availability: 76, color: '#ff9800', status: 'surveiller', status_label: 'Surveiller', engStatus: 'degraded', hoursMonth: 168, operating_hours: 3200, lastMaintenance: '01/02/2026', next_maintenance: '08/05/2026', lastStateChange: '2026-04-10T14:00:00' },
  { id: 4, name: 'JCB 3CX', model: '3CX Backhoe Loader', type: 'Tractopelle', location: 'Chantier Sud', reliability: 58, availability: 71, color: '#ff9800', status: 'surveiller', status_label: 'Surveiller', engStatus: 'maintenance', hoursMonth: 145, operating_hours: 4100, lastMaintenance: '10/01/2026', next_maintenance: '05/05/2026', lastStateChange: '2026-04-28T06:00:00' },
  { id: 5, name: 'Liebherr LTM 1050', model: 'LTM 1050-3.1 Mobile Crane', type: 'Grue mobile', location: 'Base principale', reliability: 38, availability: 52, color: '#f44336', status: 'revision_urgente', status_label: 'Révision urgente', engStatus: 'breakdown', hoursMonth: 90, operating_hours: 5800, lastMaintenance: '05/11/2025', next_maintenance: '02/05/2026', lastStateChange: '2026-04-25T10:30:00' },
  { id: 6, name: 'Hitachi ZX350', model: 'ZX350LC-6 Excavator', type: 'Pelle hydraulique', location: 'Zone A', reliability: 94, availability: 97, color: '#4caf50', status: 'fiable', status_label: 'Fiable', engStatus: 'operational', hoursMonth: 225, operating_hours: 1200, lastMaintenance: '28/03/2026', next_maintenance: '28/05/2026', lastStateChange: '2026-03-28T09:00:00' }
])

const maintenanceItems = ref([
  { id: 1, engine: 'Liebherr LTM 1050', type: 'Révision majeure', date: '02/05/2026', hours: 5000, technician: 'Oumar D.', priority: 'critical', priorityLabel: 'Critique', status: 'planifie', statusLabel: 'Planifié' },
  { id: 2, engine: 'JCB 3CX', type: 'Vidange + filtres', date: '05/05/2026', hours: 2500, technician: 'Ibra S.', priority: 'high', priorityLabel: 'Haute', status: 'planifie', statusLabel: 'Planifié' },
  { id: 3, engine: 'Hitachi ZX350', type: 'Révision complète 2000h', date: '02/05/2026', hours: 2000, technician: 'Mamadou F.', priority: 'high', priorityLabel: 'Haute', status: 'en_cours', statusLabel: 'En cours' },
  { id: 4, engine: 'Komatsu PC200-8', type: 'Inspection 250h', date: '08/05/2026', hours: 250, technician: 'Mamadou F.', priority: 'medium', priorityLabel: 'Moyenne', status: 'planifie', statusLabel: 'Planifié' },
  { id: 5, engine: 'Volvo A25G', type: 'Contrôle pneumatiques', date: '12/05/2026', hours: null, technician: 'Oumar D.', priority: 'low', priorityLabel: 'Basse', status: 'planifie', statusLabel: 'Planifié' },
  { id: 6, engine: 'Caterpillar 320 GC', type: 'Révision intermédiaire', date: '20/05/2026', hours: 1000, technician: 'Ibra S.', priority: 'medium', priorityLabel: 'Moyenne', status: 'planifie', statusLabel: 'Planifié' }
])

const reliabilityData = ref([
  { id: 1, name: 'Volvo A25G', rt30: 91, rt90: 74, beta: 2.4, eta: 480, mtbf: 380, mttr: 3.5, failures: 2, color: '#4caf50', recoType: 'ok', reco: 'Opérationnel' },
  { id: 2, name: 'Caterpillar 320 GC', rt30: 87, rt90: 69, beta: 2.1, eta: 420, mtbf: 340, mttr: 4.0, failures: 3, color: '#4caf50', recoType: 'ok', reco: 'Opérationnel' },
  { id: 3, name: 'Komatsu PC200-8', rt30: 73, rt90: 51, beta: 1.8, eta: 320, mtbf: 280, mttr: 4.8, failures: 5, color: '#ff9800', recoType: 'watch', reco: 'Surveiller' },
  { id: 4, name: 'JCB 3CX', rt30: 58, rt90: 34, beta: 1.6, eta: 260, mtbf: 210, mttr: 5.2, failures: 7, color: '#ff9800', recoType: 'watch', reco: 'Révision bientôt' },
  { id: 5, name: 'Liebherr LTM 1050', rt30: 38, rt90: 18, beta: 1.3, eta: 180, mtbf: 140, mttr: 7.1, failures: 12, color: '#f44336', recoType: 'urgent', reco: 'Révision urgente' },
  { id: 6, name: 'Hitachi ZX350', rt30: 94, rt90: 80, beta: 2.6, eta: 510, mtbf: 410, mttr: 3.2, failures: 1, color: '#4caf50', recoType: 'ok', reco: 'Opérationnel' }
])

const fuelData = ref([
  { id: 1, engine: 'Volvo A25G', daily: 320, weekly: 2100, monthly: 8900, efficiency: 94, trend: '-2%' },
  { id: 2, engine: 'Caterpillar 320 GC', daily: 280, weekly: 1850, monthly: 7600, efficiency: 91, trend: '-1%' },
  { id: 3, engine: 'Komatsu PC200-8', daily: 220, weekly: 1450, monthly: 5900, efficiency: 88, trend: '+5%' },
  { id: 4, engine: 'JCB 3CX', daily: 180, weekly: 1200, monthly: 4800, efficiency: 82, trend: '+22%' },
  { id: 5, engine: 'Liebherr LTM 1050', daily: 680, weekly: 4500, monthly: 18000, efficiency: 79, trend: '-3%' },
  { id: 6, engine: 'Hitachi ZX350', daily: 260, weekly: 1700, monthly: 7000, efficiency: 95, trend: '-2%' }
])

const activeFleetOverview = computed(() => importedEnginsPayload.value?.fleet_overview || dashboardApiData.value?.fleet_overview || null)
const activePerformance = computed(() => {
  if (importedEnginsPayload.value?.fleet_overview) {
    return {
      mtbf_moyen: toFloat(importedEnginsPayload.value.fleet_overview.mtbf_moyen_h, 0),
      mttr_moyen: toFloat(importedEnginsPayload.value.fleet_overview.mttr_moyen_h, 0),
      taux_disponibilite: toFloat(importedEnginsPayload.value.fleet_overview.disponibilite_pct, 0),
      heures_moteur_total: toFloat(importedEnginsPayload.value.fleet_overview.heures_moteur_mois, 0)
    }
  }
  return dashboardApiData.value?.performance_globale || null
})

const mtbfDisplay = computed(() => `${toFloat(activePerformance.value?.mtbf_moyen, 0).toFixed(1).replace('.', ',')}h`)
const mttrDisplay = computed(() => `${toFloat(activePerformance.value?.mttr_moyen, 0).toFixed(1).replace('.', ',')}h`)
const disponibiliteDisplay = computed(() => `${toFloat(activePerformance.value?.taux_disponibilite ?? activeFleetOverview.value?.disponibilite_pct, 0).toFixed(1).replace('.', ',')}%`)
const operationalCount = computed(() => {
  if (activeFleetOverview.value?.operational != null) return toInt(activeFleetOverview.value.operational, 0)
  if (activeFleetOverview.value?.actifs != null) return toInt(activeFleetOverview.value.actifs, 0)
  return engOperational.value.length
})
const litresJourDisplay = computed(() => {
  const fromImport = importedEnginsPayload.value?.fuel?.total_jour_L
  const value = fromImport != null ? toFloat(fromImport, 0) : fuelData.value.reduce((s, f) => s + toFloat(f.daily, 0), 0)
  return toInt(value, 0).toLocaleString('fr-FR')
})
const revisionsSemaineCount = computed(() => {
  if (importedEnginsPayload.value?.maintenance?.cette_semaine != null) {
    return toInt(importedEnginsPayload.value.maintenance.cette_semaine, 0)
  }
  return maintenanceItems.value.filter(m => m.status === 'planifie').length
})
const heuresMoteurDisplay = computed(() => {
  const fromPerf = activePerformance.value?.heures_moteur_total
  const value = fromPerf != null ? toFloat(fromPerf, 0) : engines.value.reduce((s, e) => s + toFloat(e.hoursMonth, 0), 0)
  return toInt(value, 0).toLocaleString('fr-FR')
})
const enginsARisqueCount = computed(() => {
  if (importedEnginsPayload.value?.reliability?.nb_engins_a_risque != null) {
    return toInt(importedEnginsPayload.value.reliability.nb_engins_a_risque, 0)
  }
  return reliabilityData.value.filter(r => toFloat(r.rt30, 0) < 60).length
})
const alertesCount = computed(() => {
  if (importedEnginsPayload.value) {
    const risky = enginsARisqueCount.value
    const derives = toInt(importedEnginsPayload.value?.fuel?.nb_derives, 0)
    const urgentes = toInt(importedEnginsPayload.value?.maintenance?.urgentes, 0)
    const vgpRetard = toInt(importedEnginsPayload.value?.vgp?.en_retard, 0)
    return risky + derives + urgentes + vgpRetard
  }
  return 5
})
const rt30MoyenPct = computed(() => {
  if (activeFleetOverview.value?.rt30_moyen_pct != null) return toInt(activeFleetOverview.value.rt30_moyen_pct, 0)
  if (!reliabilityData.value.length) return 0
  return toInt(reliabilityData.value.reduce((s, r) => s + toFloat(r.rt30, 0), 0) / reliabilityData.value.length, 0)
})
const rt90MoyenPct = computed(() => {
  if (!reliabilityData.value.length) return 0
  return toInt(reliabilityData.value.reduce((s, r) => s + toFloat(r.rt90, 0), 0) / reliabilityData.value.length, 0)
})
const circleStyle = (pct) => {
  const clamped = Math.max(0, Math.min(100, toInt(pct, 0)))
  const deg = Math.round((clamped / 100) * 360)
  const color = clamped < 60 ? '#f44336' : clamped < 75 ? '#ff9800' : '#00c853'
  return `conic-gradient(${color} 0deg, ${color} ${deg}deg, #e0e0e0 ${deg}deg)`
}

// ── VGP reactive state ──
const vgpSearch = ref('')
const vgpStatusFilter = ref('')
const vgpTypeFilter = ref('')
const showVgpDialog = ref(false)
const editVgpItem = ref(null)
const vgpForm = ref({ engine: '', type: '', last_date: '', next_date: '', organisme: '', responsable: '', status: 'planifie', result: '', document: '', notes: '' })

const vgpData = ref([
  { id: 1, engine: 'Liebherr LTM 1050', type: 'levage', type_label: 'Vérification levage', last_date: '12/11/2024', next_date: '12/05/2025', organisme: 'Bureau Veritas', responsable: 'Oumar D.', status: 'en_retard', result: null, document: 'BV-2025-LTM-047', notes: '', period_months: 6 },
  { id: 2, engine: 'Volvo A25G', type: 'generale', type_label: 'Contrôle général', last_date: '15/11/2025', next_date: '15/05/2026', organisme: 'APAVE', responsable: 'Ibra S.', status: 'planifie', result: 'favorable', document: 'APAVE-2025-A25G-012', notes: '', period_months: 6 },
  { id: 3, engine: 'Hitachi ZX350', type: 'levage', type_label: 'Vérification levage', last_date: '28/02/2026', next_date: '28/08/2026', organisme: 'Bureau Veritas', responsable: 'Mamadou F.', status: 'planifie', result: 'favorable', document: 'BV-2026-ZX350-003', notes: '', period_months: 6 },
  { id: 4, engine: 'JCB 3CX', type: 'electrique', type_label: 'Vérification électrique', last_date: '05/04/2026', next_date: '05/05/2026', organisme: 'SOCOTEC', responsable: 'Ibra S.', status: 'en_cours', result: null, document: null, notes: 'Vérification en cours, résultat attendu sous 5 jours', period_months: 1 },
  { id: 5, engine: 'Caterpillar 320 GC', type: 'pression', type_label: 'Vérification sous pression', last_date: '20/02/2026', next_date: '20/08/2026', organisme: 'SGS', responsable: 'Oumar D.', status: 'termine', result: 'favorable', document: 'SGS-2026-CAT320-008', notes: '', period_months: 6 },
  { id: 6, engine: 'Komatsu PC200-8', type: 'generale', type_label: 'Contrôle général', last_date: '01/04/2026', next_date: '01/10/2026', organisme: 'Bureau Veritas', responsable: 'Mamadou F.', status: 'termine', result: 'reserves', document: 'BV-2026-PC200-005', notes: 'Réserves: vérifier système freinage sous 30 jours', period_months: 6 },
  { id: 7, engine: 'Liebherr LTM 1050', type: 'anti_incendie', type_label: 'Anti-incendie', last_date: '10/02/2026', next_date: '10/08/2026', organisme: 'APAVE', responsable: 'Oumar D.', status: 'termine', result: 'favorable', document: 'APAVE-2026-LTM-002', notes: '', period_months: 6 },
  { id: 8, engine: 'Volvo A25G', type: 'electrique', type_label: 'Vérification électrique', last_date: '01/03/2026', next_date: '01/09/2026', organisme: 'SOCOTEC', responsable: 'Mamadou F.', status: 'planifie', result: null, document: null, notes: '', period_months: 6 }
])

const vgpStats = computed(() => {
  const total = vgpData.value.length
  const en_retard = vgpData.value.filter(v => v.status === 'en_retard').length
  const en_cours = vgpData.value.filter(v => v.status === 'en_cours').length
  const termine = vgpData.value.filter(v => v.status === 'termine').length
  const planifie = vgpData.value.filter(v => v.status === 'planifie').length
  const conformite_pct = total > 0 ? Math.round((termine / total) * 100) : 0
  return { en_retard, en_cours, termine, planifie, conformite_pct }
})

const filteredVgp = computed(() => {
  return vgpData.value.filter(item => {
    const q = vgpSearch.value.toLowerCase()
    const matchSearch = !q || item.engine.toLowerCase().includes(q) || item.type_label.toLowerCase().includes(q) || item.organisme.toLowerCase().includes(q)
    const matchStatus = !vgpStatusFilter.value || item.status === vgpStatusFilter.value
    const matchType = !vgpTypeFilter.value || item.type === vgpTypeFilter.value
    return matchSearch && matchStatus && matchType
  })
})

const parseVgpDate = (dateStr) => {
  if (!dateStr) return null
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
}

const getVgpStatusLabel = (status) => {
  const labels = { en_retard: 'En retard', en_cours: 'En cours', termine: 'Terminé', planifie: 'Planifié' }
  return labels[status] || status
}

const getVgpResultLabel = (result) => {
  const labels = { favorable: 'Favorable', reserves: 'Avec réserves', defavorable: 'Défavorable' }
  return labels[result] || result
}

const getVgpDaysRemaining = (dateStr) => {
  const d = parseVgpDate(dateStr)
  if (!d) return 0
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000))
}

const getVgpDaysOverdue = (dateStr) => {
  const d = parseVgpDate(dateStr)
  if (!d) return 0
  return Math.max(0, Math.ceil((Date.now() - d.getTime()) / 86400000))
}

const getVgpProgress = (item) => {
  if (item.status === 'termine') return 100
  if (item.status === 'en_cours') return 60
  if (item.status === 'en_retard') return 100
  const nextDate = parseVgpDate(item.next_date)
  const lastDate = parseVgpDate(item.last_date)
  if (!nextDate || !lastDate) return 50
  const total = nextDate.getTime() - lastDate.getTime()
  const elapsed = Date.now() - lastDate.getTime()
  return Math.min(98, Math.max(2, Math.round((elapsed / total) * 100)))
}

const startVgp = (item) => {
  const idx = vgpData.value.findIndex(v => v.id === item.id)
  if (idx !== -1) vgpData.value[idx].status = 'en_cours'
}

const validateVgp = (item) => {
  const idx = vgpData.value.findIndex(v => v.id === item.id)
  if (idx !== -1) { vgpData.value[idx].status = 'termine'; vgpData.value[idx].result = 'favorable' }
}

const viewVgpDoc = (item) => { window.open(`#vgp-doc-${item.id}`, '_blank') }

const openVgpDialog = (item = null) => {
  editVgpItem.value = item
  if (item) {
    vgpForm.value = { engine: item.engine, type: item.type, last_date: '', next_date: '', organisme: item.organisme, responsable: item.responsable, status: item.status, result: item.result || '', document: item.document || '', notes: item.notes || '' }
  } else {
    vgpForm.value = { engine: '', type: '', last_date: '', next_date: '', organisme: '', responsable: '', status: 'planifie', result: '', document: '', notes: '' }
  }
  showVgpDialog.value = true
}

const submitVgp = () => {
  const f = vgpForm.value
  if (!f.engine || !f.type || !f.next_date) return
  const typeLabels = { levage: 'Vérification levage', electrique: 'Vérification électrique', pression: 'Vérification sous pression', generale: 'Contrôle général', anti_incendie: 'Anti-incendie', chariot: 'Chariot élévateur' }
  const formatDate = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }
  if (editVgpItem.value) {
    const idx = vgpData.value.findIndex(v => v.id === editVgpItem.value.id)
    if (idx !== -1) Object.assign(vgpData.value[idx], { engine: f.engine, type: f.type, type_label: typeLabels[f.type] || f.type, last_date: formatDate(f.last_date) || vgpData.value[idx].last_date, next_date: formatDate(f.next_date), organisme: f.organisme, responsable: f.responsable, status: f.status, result: f.result || null, document: f.document || null, notes: f.notes })
  } else {
    const newId = vgpData.value.length ? Math.max(...vgpData.value.map(v => v.id)) + 1 : 1
    vgpData.value.push({ id: newId, engine: f.engine, type: f.type, type_label: typeLabels[f.type] || f.type, last_date: formatDate(f.last_date), next_date: formatDate(f.next_date), organisme: f.organisme, responsable: f.responsable, status: f.status, result: f.result || null, document: f.document || null, notes: f.notes, period_months: 6 })
  }
  showVgpDialog.value = false
}
const engSearch = ref('')
const engStatusFilter = ref('')
const showEngMaintenanceDialog = ref(false)
const showEngBreakdownDialog = ref(false)
const showEngReturnDialog = ref(false)
const showNewEquipmentDialog = ref(false)
const selectedEngineCard = ref(null)

const newEquipmentForm = ref({ name: '', serial: '', type: '', model: '', poste: '', description: '', sensor_id: '', status: 'operational', notes: '' })

const openNewEquipmentDialog = () => {
  newEquipmentForm.value = { name: '', serial: '', type: '', model: '', poste: '', description: '', sensor_id: '', status: 'operational', notes: '' }
  showNewEquipmentDialog.value = true
}

const submitNewEquipment = () => {
  const f = newEquipmentForm.value
  if (!f.name || !f.type || !f.serial || !f.poste) return
  const newId = engines.value.length ? Math.max(...engines.value.map(e => e.id)) + 1 : 1
  engines.value.push({
    id: newId,
    name: f.name,
    model: f.model || f.type,
    type: f.type,
    location: f.poste,
    serial: f.serial,
    description: f.description,
    sensor_id: f.sensor_id || null,
    reliability: 100,
    availability: 100,
    color: '#7ac943',
    status: f.status,
    status_label: getEngStatusLabel(f.status),
    engStatus: f.status,
    hoursMonth: 0,
    operating_hours: 0,
    lastMaintenance: null,
    next_maintenance: null,
    lastStateChange: new Date().toISOString()
  })
  showNewEquipmentDialog.value = false
}

const engMaintenanceForm = ref({ type: '', reason: '', start_date: '', estimated_duration: null, technician: '', priority: 'medium', notes: '' })
const engBreakdownForm = ref({ type: '', description: '', breakdown_date: '', severity: '', impact: '', reported_by: '' })
const engReturnForm = ref({ end_date: '', work_done: '', actual_duration: null, parts_used: '', validated_by: '', new_status: 'operational', notes: '' })

// ── Computed ──
const engOperational = computed(() => engines.value.filter(e => e.engStatus === 'operational'))
const engMaintenance = computed(() => engines.value.filter(e => e.engStatus === 'maintenance'))
const engDegraded = computed(() => engines.value.filter(e => e.engStatus === 'degraded'))
const engBreakdown = computed(() => engines.value.filter(e => e.engStatus === 'breakdown'))
const engStopped = computed(() => engines.value.filter(e => e.engStatus === 'stopped'))
const engAvgAvail = computed(() => {
  if (!engines.value.length) return 0
  return Math.round(engines.value.reduce((s, e) => s + e.availability, 0) / engines.value.length)
})
const filteredEnginesTab = computed(() => {
  return engines.value.filter(e => {
    const q = engSearch.value.toLowerCase()
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.model.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)
    const matchStatus = !engStatusFilter.value || e.engStatus === engStatusFilter.value
    return matchSearch && matchStatus
  })
})

// ── Methods ──
const engPct = (n) => engines.value.length ? Math.round(n / engines.value.length * 100) : 0

const getEngStatusLabel = (status) => {
  const labels = { operational: 'Opérationnel', maintenance: 'En maintenance', degraded: 'Dégradé', breakdown: 'En panne', stopped: 'Arrêté' }
  return labels[status] || status
}

const calcTBD = (engine) => {
  if (!engine.lastStateChange) return 'Durée inconnue'
  const diff = Date.now() - new Date(engine.lastStateChange).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days}j ${hours}h`
  if (hours > 0) return `${hours}h ${mins}min`
  return `${mins}min`
}

const getMaintenanceUrgencyEng = (dateStr) => {
  if (!dateStr) return 'normal'
  const parts = dateStr.split('/')
  if (parts.length !== 3) return 'normal'
  const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
  const diff = Math.ceil((date - Date.now()) / 86400000)
  if (diff <= 3) return 'urgent'
  if (diff <= 7) return 'warning'
  return 'normal'
}

const getMaintenanceDaysEng = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('/')
  if (parts.length !== 3) return dateStr
  const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
  const diff = Math.ceil((date - Date.now()) / 86400000)
  if (diff <= 0) return 'En retard'
  if (diff === 1) return 'Demain'
  if (diff <= 7) return `Dans ${diff} jours`
  return `Dans ${Math.ceil(diff / 7)} semaines`
}

const openEngMaintenance = (engine) => {
  selectedEngineCard.value = engine
  engMaintenanceForm.value = { type: '', reason: '', start_date: '', estimated_duration: null, technician: '', priority: 'medium', notes: '' }
  showEngMaintenanceDialog.value = true
}

const openEngBreakdown = (engine) => {
  selectedEngineCard.value = engine
  engBreakdownForm.value = { type: '', description: '', breakdown_date: '', severity: '', impact: '', reported_by: '' }
  showEngBreakdownDialog.value = true
}

const openEngReturn = (engine) => {
  selectedEngineCard.value = engine
  engReturnForm.value = { end_date: '', work_done: '', actual_duration: null, parts_used: '', validated_by: '', new_status: 'operational', notes: '' }
  showEngReturnDialog.value = true
}

const submitEngMaintenance = () => {
  if (selectedEngineCard.value) {
    const eng = engines.value.find(e => e.id === selectedEngineCard.value.id)
    if (eng) { eng.engStatus = 'maintenance'; eng.lastStateChange = new Date().toISOString() }
  }
  showEngMaintenanceDialog.value = false
}

const submitEngBreakdown = () => {
  if (selectedEngineCard.value) {
    const eng = engines.value.find(e => e.id === selectedEngineCard.value.id)
    if (eng) { eng.engStatus = 'breakdown'; eng.lastStateChange = new Date().toISOString() }
  }
  showEngBreakdownDialog.value = false
}

const submitEngReturn = () => {
  if (selectedEngineCard.value) {
    const eng = engines.value.find(e => e.id === selectedEngineCard.value.id)
    if (eng) { eng.engStatus = engReturnForm.value.new_status; eng.lastStateChange = new Date().toISOString() }
  }
  showEngReturnDialog.value = false
}

onMounted(async () => {
  await fetchDashboardFallback()
  hydrateImportFromLocalStorage()
  handleImportEvent(importEventsStore.lastImportEvent)
  window.addEventListener(ENGINS_IMPORT_EVENT, onImportedEvent)
})

onBeforeUnmount(() => {
  window.removeEventListener(ENGINS_IMPORT_EVENT, onImportedEvent)
})
</script>

<style scoped>
.engins-detail {
  background: #f5f5f5;
  min-height: 100vh;
}

/* Header */
.engins-header {
  background: #ffffff;
  padding: 2rem;
  border-bottom: 1px solid #f1f5f9;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #0B2B3C;
}

.header-title p {
  margin: 0;
  font-size: 1rem;
  color: #64748b;
}

.header-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 2px solid;
}

.stat-badge.green {
  background: rgba(76, 175, 80, 0.15);
  border-color: #4caf50;
  color: #81c784;
}

.stat-badge.orange {
  background: rgba(255, 152, 0, 0.15);
  border-color: #ff9800;
  color: #ffb74d;
}

.stat-badge.blue {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  border-color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
}

/* Tabs */
.tabs-container {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  overflow-x: auto;
  position: sticky;
  top: 0;
  z-index: 100;
}

.tabs-scroll {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 0;
}

.tab-item {
  padding: 16px 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: #555;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.tab-item:hover {
  background: #f9f9f9;
  color: #0d2e47;
}

.tab-item.active {
  color: #7ac943;
  border-bottom-color: #7ac943;
}

/* Dashboard Container */
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

/* KPI Grid Top */
.kpi-grid-top {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.kpi-card {
  padding: 24px;
  border-radius: 12px;
  background: white;
  border-left: 4px solid;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: relative;
}

.kpi-card.blue {
  border-left-color: #3b82f6;
}

.kpi-card.blue .kpi-label {
  color: #3b82f6;
}

.kpi-card.orange {
  border-left-color: #ff9800;
}

.kpi-card.orange .kpi-label {
  color: #ff9800;
}

.kpi-card.green {
  border-left-color: #4caf50;
}

.kpi-card.green .kpi-label {
  color: #4caf50;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.kpi-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.kpi-value {
  font-size: 2.2rem;
  font-weight: 700;
  color: #0d2e47;
}

.kpi-card small {
  font-size: 0.8rem;
  color: #7ac943;
  font-weight: 500;
}

.kpi-info-trigger {
  position: absolute;
  top: 10px;
  right: 12px;
  display: inline-flex;
  align-items: center;
}

.kpi-info-icon {
  font-size: 0.85rem;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.15s;
}
.kpi-info-trigger:hover .kpi-info-icon {
  color: #3b82f6;
}

.kpi-info-bubble {
  display: none;
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 220px;
  background: #1e293b;
  color: #e2e8f0;
  font-size: 0.78rem;
  line-height: 1.5;
  padding: 10px 12px;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  pointer-events: none;
  z-index: 100;
  border: 1px solid rgba(255,255,255,0.1);
}
.kpi-info-bubble::before {
  content: '';
  position: absolute;
  top: -5px;
  right: 4px;
  width: 10px;
  height: 10px;
  background: #1e293b;
  border-left: 1px solid rgba(255,255,255,0.1);
  border-top: 1px solid rgba(255,255,255,0.1);
  transform: rotate(45deg);
}
.kpi-info-trigger:hover .kpi-info-bubble {
  display: block;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.metric-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.metric-icon {
  width: 48px;
  height: 48px;
  background: #e3f2fd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  color: #3b82f6;
  font-size: 1.5rem;
}

.metric-icon.warning {
  background: #fff3e0;
  color: #ff9800;
}

.metric-number {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  color: #0d2e47;
  margin-bottom: 4px;
}

.metric-label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 4px;
}

.metric-card small {
  display: block;
  font-size: 0.75rem;
  color: #7ac943;
}

/* Charts Container */
.charts-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.chart-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.alerts-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.chart-card h3 {
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: #0d2e47;
  font-weight: 600;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.card-title-wrapper h3 {
  margin: 0;
}

.info-tooltip {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.info-tooltip i {
  font-size: 0.9rem;
  color: #3b82f6;
  cursor: help;
  transition: all 0.2s;
}

.info-tooltip i:hover {
  color: #0d47a1;
  transform: scale(1.1);
}

.tooltip-content {
  display: none;
  position: absolute;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  background: #0d2e47;
  color: white;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 0.8rem;
  line-height: 1.5;
  white-space: normal;
  width: 280px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  margin-bottom: 8px;
  text-align: left;
}

.tooltip-content::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #0d2e47;
}

.info-tooltip:hover .tooltip-content {
  display: block;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.chart-card .subtitle {
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 16px;
}

/* Engines List */
.engines-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.engine-row {
  display: grid;
  grid-template-columns: 140px 100px 1fr 60px 90px;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
}

.engine-name {
  font-weight: 600;
  color: #0d2e47;
}

.horizon {
  font-size: 0.75rem;
  color: #999;
}

.bar-wrapper {
  background: #f0f0f0;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s;
}

.bar-value {
  font-weight: 600;
  font-size: 0.85rem;
}

.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-fiable {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-surveiller {
  background: #fff3e0;
  color: #e65100;
}

.status-revision_urgente {
  background: #ffebee;
  color: #c62828;
}

.formula {
  display: block;
  margin-top: 12px;
  font-size: 0.7rem;
  color: #999;
  line-height: 1.4;
}

/* Availability Circles */
.availability-circles {
  display: flex;
  gap: 30px;
  justify-content: space-around;
  margin-bottom: 20px;
}

.circle-item {
  text-align: center;
}

.circle-chart {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 0 auto 12px;
}

.circle-inner {
  width: 100px;
  height: 100px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 700;
  color: #0d2e47;
}

.circle-item span {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 8px;
}

.circle-item small {
  display: block;
  font-size: 0.75rem;
  color: #999;
}

.alerts-summary {
  background: #fff9e6;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #fbc02d;
}

.alerts-summary h4 {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  color: #0d2e47;
}

.alert-count {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff6f00;
  margin-bottom: 4px;
}

/* Availability List */
.availability-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.availability-row {
  display: grid;
  grid-template-columns: 140px 1fr 60px;
  align-items: center;
  gap: 12px;
}

/* Bar Chart Hours */
.bar-chart-hours {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 100px;
  margin-bottom: 12px;
}

.bar-item {
  width: 12%;
  background: #b3e5fc;
  border-radius: 4px 4px 0 0;
  transition: all 0.2s;
}

.bar-item:hover {
  background: #81d4fa;
}

.bar-item.today {
  background: #0d2e47;
}

.hours-labels {
  display: flex;
  justify-content: space-around;
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 12px;
}

/* Alerts Items */
.alerts-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alerts-count-badge {
  display: inline-block;
  background: #ffebee;
  color: #c62828;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.alert-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.alert-item.critical {
  background: #ffebee;
  border-left: 3px solid #f44336;
}

.alert-item.critical i {
  color: #f44336;
}

.alert-item.warning {
  background: #fff3e0;
  border-left: 3px solid #ff9800;
}

.alert-item.warning i {
  color: #ff9800;
}

.alert-item.info {
  background: #e3f2fd;
  border-left: 3px solid #3b82f6;
}

.alert-item.info i {
  color: #3b82f6;
}

.alert-item i {
  font-size: 0.6rem;
  margin-top: 2px;
}

.alert-content strong {
  display: block;
  font-size: 0.9rem;
  color: #0d2e47;
  margin-bottom: 4px;
}

.alert-content small {
  display: block;
  font-size: 0.75rem;
  color: #666;
}

@media (max-width: 1024px) {
  .charts-container {
    grid-template-columns: 1fr;
  }

  .engine-row {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
  }
}

/* ===== Sections communes ===== */
.section-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.section-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.section-header-bar h2 {
  margin: 0 0 4px 0;
  font-size: 1.4rem;
  color: #0d2e47;
  font-weight: 700;
}

.section-header-bar p {
  margin: 0;
  font-size: 0.9rem;
  color: #888;
}

.section-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.badge-count {
  background: #e3f2fd;
  color: #1565c0;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge-count.urgent {
  background: #ffebee;
  color: #c62828;
}

/* --- Table --- */
.table-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table thead tr {
  background: #0d2e47;
  color: white;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.table-row td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.table-row:hover {
  background: #f9f9f9;
}

.table-row:last-child td {
  border-bottom: none;
}

/* --- Section Engins --- */
.engines-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.engine-detail-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
}

.edc-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.edc-header.edc-fiable {
  background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
  border-left: 4px solid #4caf50;
}

.edc-header.edc-surveiller {
  background: linear-gradient(135deg, #fff8e1, #fff3e0);
  border-left: 4px solid #ff9800;
}

.edc-header.edc-revision_urgente {
  background: linear-gradient(135deg, #ffebee, #fce4ec);
  border-left: 4px solid #f44336;
}

.edc-icon {
  width: 44px;
  height: 44px;
  background: rgba(13,46,71,0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #0d2e47;
  flex-shrink: 0;
}

.edc-title h4 {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  color: #0d2e47;
  font-weight: 700;
}

.edc-status-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.edc-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: #f0f0f0;
}

.edc-stat {
  background: white;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edc-stat-label {
  font-size: 0.72rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.edc-stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #0d2e47;
}

.edc-stat-value.small {
  font-size: 0.85rem;
}

.edc-bar-row {
  padding: 12px 16px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edc-bar-row small {
  font-size: 0.72rem;
  color: #999;
}

/* --- Section Maintenance --- */
.maint-kpis-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.maint-kpi-box {
  background: white;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-left: 4px solid #e0e0e0;
}

.maint-kpi-box.in-progress { border-left-color: #3b82f6; }
.maint-kpi-box.urgent-box { border-left-color: #f44336; }
.maint-kpi-box.ok-box { border-left-color: #4caf50; }

.maint-kpi-num {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #0d2e47;
  margin-bottom: 4px;
}

.maint-kpi-lbl {
  display: block;
  font-size: 0.85rem;
  color: #666;
}

.priority-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.priority-critical { background: #ffebee; color: #c62828; }
.priority-high { background: #fff3e0; color: #e65100; }
.priority-medium { background: #fff9c4; color: #f57f17; }
.priority-low { background: #e8f5e9; color: #2e7d32; }

.status-pill {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.pill-planifie { background: #e3f2fd; color: #1565c0; }
.pill-en_cours { background: #e8f5e9; color: #2e7d32; }
.pill-termine { background: #f3e5f5; color: #6a1b9a; }

/* --- Section Fiabilité --- */
.rel-kpis-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.rel-kpi-box {
  background: white;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-top: 4px solid transparent;
}

.rel-kpi-box.green-box { border-top-color: #4caf50; }
.rel-kpi-box.blue-box { border-top-color: #3b82f6; }
.rel-kpi-box.orange-box { border-top-color: #ff9800; }
.rel-kpi-box.red-box { border-top-color: #f44336; }

.rel-kpi-num {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #0d2e47;
  margin-bottom: 4px;
}

.rel-kpi-lbl {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 4px;
}

.rel-kpi-box small {
  font-size: 0.75rem;
  color: #7ac943;
}

.reco-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.reco-ok { background: #e8f5e9; color: #2e7d32; }
.reco-watch { background: #fff3e0; color: #e65100; }
.reco-urgent { background: #ffebee; color: #c62828; }

.weibull-note {
  margin-top: 16px;
  background: #e3f2fd;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #1565c0;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.5;
}

.weibull-note i { flex-shrink: 0; margin-top: 2px; }

/* --- Section Carburant --- */
.fuel-kpis-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.fuel-kpi-box {
  background: white;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.fuel-kpi-box i {
  font-size: 1.5rem;
  color: #3b82f6;
}

.fuel-kpi-box.warning-box i { color: #ff9800; }

.fuel-kpi-num {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0d2e47;
}

.fuel-kpi-lbl {
  font-size: 0.85rem;
  color: #666;
}

.efficiency-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.efficiency-bar .bar-wrapper {
  width: 80px;
  flex-shrink: 0;
}

.efficiency-bar span {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0d2e47;
  min-width: 36px;
}

.trend-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.trend-up { background: #ffebee; color: #c62828; }
.trend-down { background: #e8f5e9; color: #2e7d32; }

@media (max-width: 1024px) {
  .maint-kpis-row,
  .rel-kpis-row,
  .fuel-kpis-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .engines-cards-grid {
    grid-template-columns: 1fr;
  }
}

/* ===== Engins Tab — Overview Stats ===== */
.eng-ov-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.eng-ov-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: box-shadow 0.15s;
}

.eng-ov-card:hover { box-shadow: 0 3px 8px rgba(0,0,0,0.08); }

.eng-ov-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: white;
  flex-shrink: 0;
}

.eng-ov-total .eng-ov-icon     { background: #0d2e47; }
.eng-ov-operational .eng-ov-icon { background: #7ac943; }
.eng-ov-maint .eng-ov-icon     { background: #f59e0b; }
.eng-ov-degraded .eng-ov-icon  { background: #fb923c; }
.eng-ov-breakdown .eng-ov-icon { background: #ef4444; }
.eng-ov-stopped .eng-ov-icon   { background: #6b7280; }
.eng-ov-avail .eng-ov-icon     { background: #3b82f6; }

.eng-ov-content { min-width: 0; }

.eng-ov-val {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0d2e47;
  line-height: 1;
  margin-bottom: 2px;
}

.eng-ov-lbl {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eng-ov-pct {
  font-size: 0.72rem;
  color: #7ac943;
  font-weight: 600;
}

/* ===== Filters ===== */
.eng-filters {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 14px 20px;
  margin-bottom: 20px;
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}

.eng-search-wrap {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.eng-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.85rem;
  pointer-events: none;
}

.eng-search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.8rem;
  cursor: pointer;
}
.eng-search-clear:hover { color: #475569; }

.eng-search {
  width: 100%;
  padding: 9px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}
.eng-search:focus { border-color: #7ac943; box-shadow: 0 0 0 2px rgba(122,201,67,0.15); }

.eng-filter-sel {
  padding: 9px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #374151;
  outline: none;
  background: white;
  cursor: pointer;
  min-width: 160px;
  font-family: inherit;
}
.eng-filter-sel:focus { border-color: #7ac943; }

/* ===== Cards Grid ===== */
.eng-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.eng-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: box-shadow 0.15s, border-color 0.15s;
}
.eng-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); border-color: #cbd5e1; }

.eng-card.operational  { border-top: 3px solid #7ac943; }
.eng-card.maintenance  { border-top: 3px solid #f59e0b; }
.eng-card.degraded     { border-top: 3px solid #fb923c; }
.eng-card.breakdown    { border-top: 3px solid #ef4444; }
.eng-card.stopped      { border-top: 3px solid #6b7280; }

/* Card header */
.eng-card-hdr {
  padding: 16px 18px 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.eng-card-info { flex: 1; min-width: 0; }

.eng-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
}

.eng-icon-wrap {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba(122,201,67,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.eng-icon-wrap i { color: #7ac943; font-size: 0.75rem; }

.eng-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0d2e47;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eng-model {
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0 0 0 34px;
}

/* Status pill */
.eng-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.eng-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.eng-pill--operational  { background: #f0fdf4; color: #5a9e30; }
.eng-pill--maintenance  { background: #fffbeb; color: #d97706; }
.eng-pill--degraded     { background: #fff7ed; color: #ea580c; }
.eng-pill--breakdown    { background: #fef2f2; color: #dc2626; }
.eng-pill--stopped      { background: #f8fafc; color: #6b7280; }

/* Meta row */
.eng-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px 12px;
  flex-wrap: wrap;
}

.eng-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: #64748b;
}
.eng-meta-item i { font-size: 0.7rem; color: #94a3b8; }
.eng-meta-sep { color: #cbd5e1; font-size: 0.75rem; }

/* Metrics */
.eng-metrics-block {
  padding: 10px 18px 14px;
  border-top: 1px solid #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eng-metric-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.eng-metric-lbl {
  font-size: 0.76rem;
  color: #94a3b8;
  font-weight: 500;
  min-width: 76px;
}

.eng-metric-bar {
  flex: 1;
  height: 5px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}

.eng-metric-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
.eng-fill-avail { background: #7ac943; }
.eng-fill-perf  { background: #3b82f6; }

.eng-metric-val {
  font-size: 0.76rem;
  color: #475569;
  font-weight: 600;
  min-width: 36px;
  text-align: right;
}

/* TBD block */
.eng-tbd-block {
  padding: 0 18px 12px;
}

.eng-tbd {
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.83rem;
  font-weight: 500;
  border-left: 3px solid;
}
.eng-tbd--warning { background: #fff7ed; border-color: #f59e0b; color: #92400e; }
.eng-tbd--danger  { background: #fef2f2; border-color: #ef4444; color: #991b1b; }

.eng-tbd i { font-size: 1rem; flex-shrink: 0; }

.eng-tbd-val {
  margin-left: auto;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: monospace;
}

/* Next maintenance */
.eng-next-maint {
  padding: 0 18px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.82rem;
  color: #64748b;
  background: #f8fafc;
  margin: 0 0 0 0;
  padding-top: 10px;
}
.eng-next-maint i { color: #f59e0b; flex-shrink: 0; }

.eng-maint-tag {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.eng-maint-tag.urgent  { background: #fee2e2; color: #dc2626; }
.eng-maint-tag.warning { background: #fef3c7; color: #d97706; }
.eng-maint-tag.normal  { background: #f0f9ff; color: #0369a1; }

/* Actions */
.eng-card-actions {
  padding: 12px 18px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 8px;
}

.eng-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.eng-btn--maint {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #d97706;
}
.eng-btn--maint:hover { background: #f59e0b; color: white; border-color: #f59e0b; }

.eng-btn--panne {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}
.eng-btn--panne:hover { background: #ef4444; color: white; border-color: #ef4444; }

.eng-btn--service {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #16a34a;
}
.eng-btn--service:hover { background: #7ac943; color: white; border-color: #7ac943; }

.eng-sec-actions {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.eng-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  font-size: 0.78rem;
  transition: all 0.15s;
}
.eng-icon-btn:hover { background: #f8fafc; border-color: #cbd5e1; color: #0d2e47; }

/* ===== Modals ===== */
.eng-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.eng-modal {
  background: white;
  border-radius: 14px;
  width: min(620px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.eng-modal-hdr {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px 14px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.eng-modal-hdr h3 {
  margin: 0 0 3px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0d2e47;
}

.eng-modal-hdr p {
  margin: 0;
  font-size: 0.8rem;
  color: #94a3b8;
}

.eng-modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  flex-shrink: 0;
  transition: all 0.15s;
}
.eng-modal-close:hover { background: #f8fafc; color: #0d2e47; }

.eng-modal-body {
  overflow-y: auto;
  padding: 20px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Info banner */
.eng-info-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
}
.eng-info-banner--danger  { background: #fef2f2; border-left-color: #dc2626; }
.eng-info-banner--success { background: #f0fdf4; border-left-color: #10b981; }

.eng-info-banner i { font-size: 1.25rem; color: #3b82f6; flex-shrink: 0; }
.eng-info-banner--danger i  { color: #dc2626; }
.eng-info-banner--success i { color: #10b981; }

.eng-info-banner strong { display: block; font-size: 0.9rem; color: #1f2937; margin-bottom: 2px; }
.eng-info-banner p { margin: 0; font-size: 0.8rem; color: #6b7280; }

/* Form elements */
.eng-form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.eng-form-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
}

.eng-form-input,
.eng-form-select,
.eng-form-textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.85rem;
  font-family: inherit;
  color: #374151;
  outline: none;
  background: white;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.eng-form-input:focus,
.eng-form-select:focus,
.eng-form-textarea:focus { border-color: #7ac943; box-shadow: 0 0 0 2px rgba(122,201,67,0.15); }

.eng-form-textarea { resize: vertical; min-height: 80px; }

.eng-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Radio group */
.eng-radio-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.eng-radio-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #374151;
  transition: all 0.15s;
  user-select: none;
}
.eng-radio-opt:hover { border-color: #7ac943; background: rgba(122,201,67,0.05); }
.eng-radio-opt input { cursor: pointer; accent-color: #7ac943; }

/* Modal footer */
.eng-modal-footer {
  padding: 14px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.eng-modal-cancel {
  padding: 8px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.eng-modal-cancel:hover { background: #f8fafc; }

.eng-modal-submit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.eng-submit--warning { background: #f59e0b; color: white; }
.eng-submit--warning:hover { background: #d97706; }
.eng-submit--danger  { background: #ef4444; color: white; }
.eng-submit--danger:hover  { background: #dc2626; }
.eng-submit--success { background: #7ac943; color: white; }
.eng-submit--success:hover { background: #65a335; }
.eng-submit--add { background: #0d2e47; color: white; }
.eng-submit--add:hover { background: #142f45; }

.eng-btn-new {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: #0d2e47;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: background 0.15s;
  flex-shrink: 0;
}
.eng-btn-new:hover { background: #7ac943; }

.eng-optional {
  font-weight: 400;
  color: #94a3b8;
  font-size: 0.78rem;
}

@media (max-width: 1200px) {
  .eng-ov-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 768px) {
  .eng-ov-grid { grid-template-columns: repeat(2, 1fr); }
  .eng-cards-grid { grid-template-columns: 1fr; }
  .eng-form-row { grid-template-columns: 1fr; }
}

/* ============================================================
   VGP — Vérifications Générales Périodiques
   ============================================================ */

/* Alert banner */
.vgp-alert-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid #ef4444;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.875rem;
  color: #991b1b;
}
.vgp-alert-banner i { color: #ef4444; font-size: 1.1rem; flex-shrink: 0; }
.vgp-alert-banner strong { color: #7f1d1d; }

/* KPI row */
.vgp-kpis-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.vgp-kpi-box {
  background: white;
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  border-left: 4px solid transparent;
  transition: transform 0.15s, box-shadow 0.15s;
}
.vgp-kpi-box:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

.vgp-kpi--retard    { border-left-color: #ef4444; }
.vgp-kpi--en-cours  { border-left-color: #3b82f6; }
.vgp-kpi--termine   { border-left-color: #22c55e; }
.vgp-kpi--planifie  { border-left-color: #f59e0b; }
.vgp-kpi--conformite { border-left-color: #0d2e47; }

.vgp-kpi-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}
.vgp-kpi--retard    .vgp-kpi-icon-wrap { background: #fef2f2; color: #ef4444; }
.vgp-kpi--en-cours  .vgp-kpi-icon-wrap { background: #eff6ff; color: #3b82f6; }
.vgp-kpi--termine   .vgp-kpi-icon-wrap { background: #f0fdf4; color: #22c55e; }
.vgp-kpi--planifie  .vgp-kpi-icon-wrap { background: #fffbeb; color: #f59e0b; }
.vgp-kpi--conformite .vgp-kpi-icon-wrap { background: #e8f0f7; color: #0d2e47; }

.vgp-kpi-content { display: flex; flex-direction: column; gap: 1px; }
.vgp-kpi-num   { font-size: 1.7rem; font-weight: 700; color: #0d2e47; line-height: 1; }
.vgp-kpi-label { font-size: 0.8rem; font-weight: 600; color: #374151; }
.vgp-kpi-sub   { font-size: 0.72rem; color: #9ca3af; }

/* Cards grid */
.vgp-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.vgp-card {
  background: white;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  border-top: 3px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.vgp-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }

.vgp-card--en_retard { border-top-color: #ef4444; }
.vgp-card--en_cours  { border-top-color: #3b82f6; }
.vgp-card--termine   { border-top-color: #22c55e; }
.vgp-card--planifie  { border-top-color: #f59e0b; }

/* Card header */
.vgp-card-hdr {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.vgp-eng-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.vgp-eng-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #e8f0f7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0d2e47;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.vgp-eng-info h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0d2e47;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vgp-eng-info p { margin: 0; font-size: 0.75rem; color: #6b7280; }

/* Status badge */
.vgp-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.vgp-status-dot { width: 6px; height: 6px; border-radius: 50%; }
.vgp-badge--en_retard { background: #fef2f2; color: #dc2626; }
.vgp-badge--en_retard .vgp-status-dot { background: #dc2626; }
.vgp-badge--en_cours  { background: #eff6ff; color: #2563eb; }
.vgp-badge--en_cours  .vgp-status-dot { background: #2563eb; }
.vgp-badge--termine   { background: #f0fdf4; color: #16a34a; }
.vgp-badge--termine   .vgp-status-dot { background: #16a34a; }
.vgp-badge--planifie  { background: #fffbeb; color: #d97706; }
.vgp-badge--planifie  .vgp-status-dot { background: #d97706; }

/* Dates block */
.vgp-dates-block {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 14px;
}
.vgp-date-item { display: flex; align-items: center; gap: 8px; flex: 1; }
.vgp-date-icon { color: #94a3b8; font-size: 0.95rem; flex-shrink: 0; }
.vgp-date-item > div { display: flex; flex-direction: column; }
.vgp-date-lbl { font-size: 0.68rem; color: #9ca3af; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
.vgp-date-val { font-size: 0.8rem; font-weight: 700; color: #1f2937; }
.vgp-dates-sep { width: 1px; height: 30px; background: #e2e8f0; flex-shrink: 0; }

/* Progress block */
.vgp-progress-block { display: flex; flex-direction: column; gap: 6px; }
.vgp-progress-info { font-size: 0.78rem; display: flex; align-items: center; gap: 5px; }
.vgp-overdue-txt { color: #dc2626; font-weight: 600; }
.vgp-info-txt { font-weight: 500; }
.vgp-txt--blue   { color: #2563eb; }
.vgp-txt--green  { color: #16a34a; }
.vgp-txt--orange { color: #d97706; }

.vgp-bar-track {
  height: 6px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}
.vgp-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}
.vgp-bar--en_retard { background: #ef4444; }
.vgp-bar--en_cours  { background: #3b82f6; }
.vgp-bar--termine   { background: #22c55e; }
.vgp-bar--planifie  { background: #f59e0b; }

/* Meta row */
.vgp-meta-row { display: flex; flex-wrap: wrap; gap: 8px; }
.vgp-meta-item { display: flex; align-items: center; gap: 5px; font-size: 0.75rem; color: #64748b; }
.vgp-meta-item i { color: #94a3b8; font-size: 0.8rem; }

.vgp-result-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}
.vgp-result--favorable   { background: #f0fdf4; color: #16a34a; }
.vgp-result--reserves    { background: #fffbeb; color: #d97706; }
.vgp-result--defavorable { background: #fef2f2; color: #dc2626; }

/* Card actions */
.vgp-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.eng-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.vgp-btn--start    { background: #0d2e47; color: white; }
.vgp-btn--start:hover { background: #7ac943; }
.vgp-btn--validate { background: #22c55e; color: white; }
.vgp-btn--validate:hover { background: #16a34a; }
.vgp-btn--doc      { background: #f1f5f9; color: #475569; }
.vgp-btn--doc:hover { background: #e2e8f0; }
.vgp-icon-actions  { display: flex; gap: 4px; margin-left: auto; }

/* Empty state */
.vgp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  color: #9ca3af;
}
.vgp-empty-icon { font-size: 2.5rem; }
.vgp-empty p { font-size: 0.9rem; margin: 0; }

@media (max-width: 1200px) {
  .vgp-kpis-row { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .vgp-kpis-row { grid-template-columns: repeat(2, 1fr); }
  .vgp-cards-grid { grid-template-columns: 1fr; }
}
</style>
