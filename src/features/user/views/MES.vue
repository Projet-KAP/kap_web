<template>
  <div class="mes-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">Manufacturing Execution System</h1>
          <p class="page-subtitle">Pilotage et suivi de la production en temps réel</p>
        </div>
        <div class="header-actions">
          <div class="period-selector">
            <div class="period-tabs">
              <button
                v-for="opt in periodOptions"
                :key="opt.value"
                :class="['period-tab', { 'period-tab--active': selectedPeriod === opt.value }]"
                @click="selectedPeriod = opt.value; onPeriodChange()"
              >{{ opt.label }}</button>
            </div>
            <template v-if="selectedPeriod === 'custom'">
              <input type="date" v-model="customStartDate" class="period-date" @change="onCustomDateChange" />
              <span class="period-sep">-</span>
              <input type="date" v-model="customEndDate" class="period-date" @change="onCustomDateChange" />
            </template>
          </div>
          <Button
            label="Nouvel ordre"
            icon="pi pi-plus"
            @click="showCreateOrderDialog = true"
            class="create-btn"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement du système MES...</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="!error" class="mes-content">

      <!-- Navigation Tabs -->
      <div class="mes-tabs-nav">
        <div class="mes-tabs-scroll">
          <button
            v-for="tab in mesTabs"
            :key="tab.id"
            class="mes-tab-item"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >{{ tab.label }}</button>
        </div>
      </div>

      <!-- ===== VUE FLOTTE ===== -->
      <div v-show="activeTab === 'flotte'">
      <div class="senico-trs-cards">
        <article
          v-for="card in siteTrsCards"
          :key="card.key"
          class="senico-trs-card"
          :class="card.tone"
        >
          <div class="senico-trs-title">{{ card.title }}</div>
          <div class="senico-trs-value">{{ card.trs.toFixed(1) }}%</div>
          <div class="senico-trs-breakdown">
            <div>
              <span>Disponibilité</span>
              <strong>{{ card.availability.toFixed(1) }}%</strong>
            </div>
            <div>
              <span>Performance</span>
              <strong>{{ card.performance.toFixed(1) }}%</strong>
            </div>
            <div>
              <span>Qualite</span>
              <strong>{{ card.quality.toFixed(1) }}%</strong>
            </div>
          </div>
          <div class="senico-trs-track">
            <div class="senico-trs-fill" :style="{ width: Math.min(card.trs, 100) + '%' }"></div>
          </div>
          <div class="senico-trs-note">Mis a jour {{ formatComputedAt(dashboardData?.meta?.computed_at) }}</div>
        </article>
      </div>

      <div class="senico-stats-row">
        <div class="senico-stat-card">
          <div class="senico-stat-icon" style="background:#ede9fe;color:#7c3aed"><i class="pi pi-percentage"></i></div>
          <div>
            <div class="senico-stat-value" :class="tauxRealisationClass">{{ tauxRealisation.toFixed(1) }}%</div>
            <div class="senico-stat-label">Taux de réalisation</div>
            <small style="font-size:0.72rem;color:#94a3b8">Global / PDP</small>
          </div>
        </div>
        <div class="senico-stat-card">
          <div class="senico-stat-icon"><i class="pi pi-th-large"></i></div>
          <div>
            <div class="senico-stat-value">{{ dashboardData?.active_orders || 0 }}</div>
            <div class="senico-stat-label">Ordres en cours</div>
          </div>
        </div>
        <div class="senico-stat-card">
          <div class="senico-stat-icon blue"><i class="pi pi-desktop"></i></div>
          <div>
            <div class="senico-stat-value">{{ dashboardData?.active_machines || 0 }}<small>/{{ dashboardData?.total_machines || 0 }}</small></div>
            <div class="senico-stat-label">Machines actives</div>
          </div>
        </div>
        <div class="senico-stat-card">
          <div class="senico-stat-icon amber"><i class="pi pi-exclamation-triangle"></i></div>
          <div>
            <div class="senico-stat-value amber">{{ dashboardData?.active_alerts || 0 }}</div>
            <div class="senico-stat-label">Alertes actives</div>
          </div>
        </div>
        <div class="senico-stat-card">
          <div class="senico-stat-icon green"><i class="pi pi-chart-line"></i></div>
          <div>
            <div class="senico-stat-value">{{ dashboardData?.daily_production || 0 }}</div>
            <div class="senico-stat-label">Pieces produites / jour</div>
          </div>
        </div>
      </div>

      <div class="senico-lines-grid">
        <div class="line-panel">
          <div class="line-panel-head">
            <h3>TRS par machine - Ligne Process</h3>
            <span>Temps réel</span>
          </div>
          <div class="line-rows">
            <div v-for="machine in processLineMachines" :key="machine.id" class="line-row">
              <div class="line-machine-name">{{ machine.name }}</div>
              <div class="line-machine-track">
                <div class="line-machine-fill" :style="{ width: machineTrsValue(machine) + '%' }"></div>
              </div>
              <div class="line-machine-val">{{ machineTrsValue(machine).toFixed(0) }}%</div>
            </div>
          </div>
        </div>

        <div class="line-panel">
          <div class="line-panel-head">
            <h3>TRS par machine - Ligne Conditionnement</h3>
            <span>Temps réel</span>
          </div>
          <div class="line-rows">
            <div v-for="machine in conditioningLineMachines" :key="machine.id" class="line-row">
              <div class="line-machine-name">{{ machine.name }}</div>
              <div class="line-machine-track">
                <div class="line-machine-fill amber" :style="{ width: machineTrsValue(machine) + '%' }"></div>
              </div>
              <div class="line-machine-val amber">{{ machineTrsValue(machine).toFixed(0) }}%</div>
            </div>
          </div>
        </div>
      </div>

      <div class="operations-grid">
      <!-- Production Orders Section -->
      <div class="orders-section senico-panel">
        <div class="section-header">
          <h2>Ordres de production</h2>
          <div class="section-actions">
            <Select 
              v-model="orderStatusFilter"
              :options="orderStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Filtrer par statut"
              class="filter-dropdown"
              showClear
            />
          </div>
        </div>

        <div class="orders-table-wrap">
          <table class="orders-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Produit</th>
                <th>Statut</th>
                <th>Progression</th>
                <th>Machine</th>
                <th>Opérateur</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="order in filteredOrdersPreview"
                :key="order.id"
                class="order-row"
                :class="order.status"
              >
                <td class="order-ref">{{ order.reference }}</td>
                <td class="order-product-name">{{ order.product_name }}</td>
                <td>
                  <span class="status-badge" :class="order.status">
                    {{ getOrderStatusLabel(order.status) }}
                  </span>
                </td>
                <td class="order-progress-cell">
                  <template v-if="order.status === 'en_cours'">
                    <div class="inline-progress">
                      <div class="inline-progress-bar">
                        <div class="inline-progress-fill" :style="{ width: order.completion_rate + '%' }"></div>
                      </div>
                      <span class="inline-progress-val">{{ order.completion_rate }}%</span>
                    </div>
                    <div class="inline-progress-qty">{{ order.actual_quantity }}/{{ order.planned_quantity }} pcs</div>
                  </template>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="text-sm">{{ order.machine_name || '—' }}</td>
                <td class="text-sm">{{ order.operator_name || '—' }}</td>
                <td class="text-sm text-muted">{{ formatDate(order.planned_start || order.creation_date) }}</td>
                <td class="order-row-actions">
                  <Button
                    v-if="order.status === 'planifie'"
                    icon="pi pi-play"
                    size="small"
                    rounded
                    class="action-btn primary"
                    v-tooltip.top="'Démarrer'"
                    @click="startOrder(order.id)"
                  />
                  <Button
                    v-if="order.status === 'en_cours'"
                    icon="pi pi-check"
                    size="small"
                    rounded
                    class="action-btn success"
                    v-tooltip.top="'Terminer'"
                    @click="completeOrder(order.id)"
                  />
                  <Button
                    icon="pi pi-eye"
                    size="small"
                    rounded
                    text
                    class="action-btn secondary"
                    v-tooltip.top="'Détails'"
                    @click="viewOrderDetails(order)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="filteredOrders.length > 3" class="orders-see-more">
          <Button label="Voir plus" icon="pi pi-list" text @click="showAllOrdersModal = true" />
          <span class="orders-see-more-count">{{ filteredOrders.length }} ordres au total</span>
        </div>
      </div>

      <!-- Alerts Section -->
      <div class="alerts-section senico-panel" v-if="activeAlerts.length">
        <div class="section-header">
          <h2>Alertes actives</h2>
          <Button label="Gérer toutes" text class="view-all-btn" />
        </div>

        <div class="alerts-list">
          <div 
            v-for="alert in activeAlerts.slice(0, 5)" 
            :key="alert.id" 
            class="alert-item"
            :class="alert.severity"
          >
            <div class="alert-icon">
              <i :class="getAlertIcon(alert.type)"></i>
            </div>
            <div class="alert-content">
              <div class="alert-message">{{ alert.message }}</div>
              <div class="alert-details">
                <span class="alert-machine">{{ alert.machine_name }}</span>
                <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
              </div>
            </div>
            <div class="alert-actions">
              <Button 
                icon="pi pi-check"
                size="small"
                text
                @click="acknowledgeAlert(alert.id)"
                class="ack-btn"
                title="Acquitter"
              />
              <Button 
                icon="pi pi-times"
                size="small"
                text
                @click="resolveAlert(alert.id)"
                class="resolve-btn"
                title="Résoudre"
              />
            </div>
          </div>
        </div>
      </div>
      </div>

      <div class="machines-state-section senico-panel">
        <div class="section-header">
          <h2>État des machines</h2>
          <span class="machines-detail-hint">
            Cliquez sur une machine pour voir ses détails
          </span>
        </div>

        <div class="machines-state-grid">
          <div
            v-for="machine in staticMachines"
            :key="machine.name"
            class="machine-state-item"
            :class="machine.chipClass"
          >
            <div class="msi-top">
              <div class="msi-icon-wrap">
                <i class="pi pi-cog msi-icon"></i>
              </div>
              <div class="msi-info">
                <div class="msi-name">{{ machine.name }}</div>
                <span class="msi-chip" :class="machine.chipClass">
                  <span class="msi-dot"></span>
                  {{ machine.status }}
                </span>
              </div>
            </div>
            <div class="msi-divider"></div>
            <div class="msi-metrics">
              <div class="msi-metric-row">
                <span class="msi-metric-label"><i class="pi pi-chart-line"></i> Ligne Process</span>
                <span class="msi-metric-nodata">— Pas de données</span>
              </div>
            </div>

            <div class="msi-actions">
              <Button
                label="Voir détail"
                icon="pi pi-eye"
                text
                size="small"
                class="machine-detail-btn"
                @click="openMachineDetails(machine)"
              />
            </div>
          </div>
        </div>
      </div>

      </div><!-- /vue flotte -->

      <!-- ===== UNITÉ 1 - Ligne Process ===== -->
      <div v-show="activeTab === 'unite1'">
        <div class="senico-trs-cards" style="grid-template-columns: 1fr 1fr;">
          <article class="senico-trs-card tone-process">
            <div class="senico-trs-title">TRS — Ligne Process</div>
            <div class="senico-trs-value" style="color:#205ea4">{{ lineTrsCards[0].trs.toFixed(1) }}%</div>
            <div class="senico-trs-breakdown">
              <div><span>Disponibilité</span><strong>{{ lineTrsCards[0].availability.toFixed(1) }}%</strong></div>
              <div><span>Performance</span><strong>{{ lineTrsCards[0].performance.toFixed(1) }}%</strong></div>
              <div><span>Qualité</span><strong>{{ lineTrsCards[0].quality.toFixed(1) }}%</strong></div>
            </div>
            <div class="senico-trs-track"><div class="senico-trs-fill" :style="{ width: Math.min(lineTrsCards[0].trs, 100) + '%' }"></div></div>
            <div class="senico-trs-note">Mis à jour {{ formatComputedAt(dashboardData?.meta?.computed_at) }}</div>
          </article>
          <article class="senico-trs-card tone-global">
            <div class="senico-trs-title">TRS Global — Unité 1 (moy. Flotte)</div>
            <div class="senico-trs-value">{{ lineTrsCards[2].trs.toFixed(1) }}%</div>
            <div class="senico-trs-breakdown">
              <div><span>Disponibilité</span><strong>{{ lineTrsCards[2].availability.toFixed(1) }}%</strong></div>
              <div><span>Performance</span><strong>{{ lineTrsCards[2].performance.toFixed(1) }}%</strong></div>
              <div><span>Qualité</span><strong>{{ lineTrsCards[2].quality.toFixed(1) }}%</strong></div>
            </div>
            <div class="senico-trs-track"><div class="senico-trs-fill" :style="{ width: Math.min(lineTrsCards[2].trs, 100) + '%' }"></div></div>
            <div class="senico-trs-note">Mis à jour {{ formatComputedAt(dashboardData?.meta?.computed_at) }}</div>
          </article>
        </div>
        <div class="senico-stats-row">
          <div class="senico-stat-card"><div class="senico-stat-icon"><i class="pi pi-th-large"></i></div><div><div class="senico-stat-value">{{ dashboardData?.active_orders || 0 }}</div><div class="senico-stat-label">Ordres en cours</div></div></div>
          <div class="senico-stat-card"><div class="senico-stat-icon blue"><i class="pi pi-desktop"></i></div><div><div class="senico-stat-value">{{ processLineMachines.length }}</div><div class="senico-stat-label">Machines Process</div></div></div>
          <div class="senico-stat-card"><div class="senico-stat-icon amber"><i class="pi pi-exclamation-triangle"></i></div><div><div class="senico-stat-value amber">{{ activeAlerts.length }}</div><div class="senico-stat-label">Alertes actives</div></div></div>
          <div class="senico-stat-card"><div class="senico-stat-icon green"><i class="pi pi-chart-line"></i></div><div><div class="senico-stat-value">{{ dailyProductionU1 }}</div><div class="senico-stat-label">Pièces / jour</div></div></div>
          <div class="senico-stat-card"><div class="senico-stat-icon" style="background:#ede9fe;color:#7c3aed"><i class="pi pi-percentage"></i></div><div><div class="senico-stat-value" :class="tauxClass(tauxRealisationU1)">{{ tauxRealisationU1.toFixed(1) }}%</div><div class="senico-stat-label">Taux de réalisation</div><small style="font-size:0.72rem;color:#94a3b8">Process / PDP</small></div></div>
        </div>
        <div class="senico-lines-grid" style="grid-template-columns: 1fr;">
          <div class="line-panel">
            <div class="line-panel-head"><h3>TRS par machine — Unité 1 (Ligne Process)</h3><span>Temps réel</span></div>
            <div class="line-rows">
              <div v-for="machine in processLineMachines" :key="machine.id" class="line-row">
                <div class="line-machine-name">{{ machine.name }}</div>
                <div class="line-machine-track"><div class="line-machine-fill" :style="{ width: machineTrsValue(machine) + '%' }"></div></div>
                <div class="line-machine-val">{{ machineTrsValue(machine).toFixed(0) }}%</div>
              </div>
            </div>
          </div>
        </div>
        <div class="orders-section senico-panel" style="margin-top:1rem">
          <div class="section-header"><h2>Ordres de production — Unité 1</h2></div>
          <div class="orders-table-wrap">
            <table class="orders-table">
              <thead><tr><th>Référence</th><th>Produit</th><th>Statut</th><th>Progression</th><th>Machine</th><th>Date</th></tr></thead>
              <tbody>
                <tr v-for="order in filteredOrdersPreview" :key="'u1-' + order.id" class="order-row" :class="order.status">
                  <td class="order-ref">{{ order.reference }}</td>
                  <td class="order-product-name">{{ order.product_name }}</td>
                  <td><span class="status-badge" :class="order.status">{{ getOrderStatusLabel(order.status) }}</span></td>
                  <td class="order-progress-cell">
                    <template v-if="order.status === 'en_cours'"><div class="inline-progress"><div class="inline-progress-bar"><div class="inline-progress-fill" :style="{ width: order.completion_rate + '%' }"></div></div><span class="inline-progress-val">{{ order.completion_rate }}%</span></div></template>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td class="text-sm">{{ order.machine_name || '—' }}</td>
                  <td class="text-sm text-muted">{{ formatDate(order.planned_start || order.creation_date) }}</td>
                </tr>
                <tr v-if="!filteredOrdersPreview.length"><td colspan="6" style="text-align:center;color:#94a3b8;padding:1.5rem">Aucun ordre</td></tr>
              </tbody>
            </table>
          </div>
          <div v-if="filteredOrders.length > 3" class="orders-see-more">
            <Button label="Voir plus" icon="pi pi-list" text @click="showAllOrdersModal = true" />
            <span class="orders-see-more-count">{{ filteredOrders.length }} ordres au total</span>
          </div>
        </div>
        <div class="machines-state-section senico-panel" style="margin-top:1rem">
          <div class="section-header"><h2>État des machines — Unité 1</h2></div>
          <div class="machines-state-grid">
            <div v-for="machine in staticMachines.slice(0, 4)" :key="'u1m-' + machine.name" class="machine-state-item" :class="machine.chipClass">
              <div class="msi-top"><div class="msi-icon-wrap"><i class="pi pi-cog msi-icon"></i></div><div class="msi-info"><div class="msi-name">{{ machine.name }}</div><span class="msi-chip" :class="machine.chipClass"><span class="msi-dot"></span>{{ machine.status }}</span></div></div>
              <div class="msi-divider"></div>
              <div class="msi-actions"><Button label="Voir détail" icon="pi pi-eye" text size="small" class="machine-detail-btn" @click="openMachineDetails(machine)" /></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== UNITÉ 2 - Ligne Conditionnement ===== -->
      <div v-show="activeTab === 'unite2'">
        <div class="senico-trs-cards" style="grid-template-columns: 1fr 1fr;">
          <article class="senico-trs-card tone-conditioning">
            <div class="senico-trs-title">TRS — Ligne Conditionnement</div>
            <div class="senico-trs-value">{{ lineTrsCards[1].trs.toFixed(1) }}%</div>
            <div class="senico-trs-breakdown">
              <div><span>Disponibilité</span><strong>{{ lineTrsCards[1].availability.toFixed(1) }}%</strong></div>
              <div><span>Performance</span><strong>{{ lineTrsCards[1].performance.toFixed(1) }}%</strong></div>
              <div><span>Qualité</span><strong>{{ lineTrsCards[1].quality.toFixed(1) }}%</strong></div>
            </div>
            <div class="senico-trs-track"><div class="senico-trs-fill" :style="{ width: Math.min(lineTrsCards[1].trs, 100) + '%' }"></div></div>
            <div class="senico-trs-note">Mis à jour {{ formatComputedAt(dashboardData?.meta?.computed_at) }}</div>
          </article>
          <article class="senico-trs-card tone-global">
            <div class="senico-trs-title">TRS Global — Unité 2 (moy. Flotte)</div>
            <div class="senico-trs-value">{{ lineTrsCards[2].trs.toFixed(1) }}%</div>
            <div class="senico-trs-breakdown">
              <div><span>Disponibilité</span><strong>{{ lineTrsCards[2].availability.toFixed(1) }}%</strong></div>
              <div><span>Performance</span><strong>{{ lineTrsCards[2].performance.toFixed(1) }}%</strong></div>
              <div><span>Qualité</span><strong>{{ lineTrsCards[2].quality.toFixed(1) }}%</strong></div>
            </div>
            <div class="senico-trs-track"><div class="senico-trs-fill" :style="{ width: Math.min(lineTrsCards[2].trs, 100) + '%' }"></div></div>
            <div class="senico-trs-note">Mis à jour {{ formatComputedAt(dashboardData?.meta?.computed_at) }}</div>
          </article>
        </div>
        <div class="senico-stats-row">
          <div class="senico-stat-card"><div class="senico-stat-icon"><i class="pi pi-th-large"></i></div><div><div class="senico-stat-value">{{ dashboardData?.active_orders || 0 }}</div><div class="senico-stat-label">Ordres en cours</div></div></div>
          <div class="senico-stat-card"><div class="senico-stat-icon blue"><i class="pi pi-desktop"></i></div><div><div class="senico-stat-value">{{ conditioningLineMachines.length }}</div><div class="senico-stat-label">Machines Conditionnement</div></div></div>
          <div class="senico-stat-card"><div class="senico-stat-icon amber"><i class="pi pi-exclamation-triangle"></i></div><div><div class="senico-stat-value amber">{{ activeAlerts.length }}</div><div class="senico-stat-label">Alertes actives</div></div></div>
          <div class="senico-stat-card"><div class="senico-stat-icon green"><i class="pi pi-chart-line"></i></div><div><div class="senico-stat-value">{{ dailyProductionU2 }}</div><div class="senico-stat-label">Pièces / jour</div></div></div>
          <div class="senico-stat-card"><div class="senico-stat-icon" style="background:#ede9fe;color:#7c3aed"><i class="pi pi-percentage"></i></div><div><div class="senico-stat-value" :class="tauxClass(tauxRealisationU2)">{{ tauxRealisationU2.toFixed(1) }}%</div><div class="senico-stat-label">Taux de réalisation</div><small style="font-size:0.72rem;color:#94a3b8">Conditionnement / PDP</small></div></div>
        </div>
        <div class="senico-lines-grid" style="grid-template-columns: 1fr;">
          <div class="line-panel">
            <div class="line-panel-head"><h3>TRS par machine — Unité 2 (Ligne Conditionnement)</h3><span>Temps réel</span></div>
            <div class="line-rows">
              <div v-for="machine in conditioningLineMachines" :key="machine.id" class="line-row">
                <div class="line-machine-name">{{ machine.name }}</div>
                <div class="line-machine-track"><div class="line-machine-fill amber" :style="{ width: machineTrsValue(machine) + '%' }"></div></div>
                <div class="line-machine-val amber">{{ machineTrsValue(machine).toFixed(0) }}%</div>
              </div>
            </div>
          </div>
        </div>
        <div class="orders-section senico-panel" style="margin-top:1rem">
          <div class="section-header"><h2>Ordres de production — Unité 2</h2></div>
          <div class="orders-table-wrap">
            <table class="orders-table">
              <thead><tr><th>Référence</th><th>Produit</th><th>Statut</th><th>Progression</th><th>Machine</th><th>Date</th></tr></thead>
              <tbody>
                <tr v-for="order in filteredOrdersPreview" :key="'u2-' + order.id" class="order-row" :class="order.status">
                  <td class="order-ref">{{ order.reference }}</td>
                  <td class="order-product-name">{{ order.product_name }}</td>
                  <td><span class="status-badge" :class="order.status">{{ getOrderStatusLabel(order.status) }}</span></td>
                  <td class="order-progress-cell">
                    <template v-if="order.status === 'en_cours'"><div class="inline-progress"><div class="inline-progress-bar"><div class="inline-progress-fill" :style="{ width: order.completion_rate + '%' }"></div></div><span class="inline-progress-val">{{ order.completion_rate }}%</span></div></template>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td class="text-sm">{{ order.machine_name || '—' }}</td>
                  <td class="text-sm text-muted">{{ formatDate(order.planned_start || order.creation_date) }}</td>
                </tr>
                <tr v-if="!filteredOrdersPreview.length"><td colspan="6" style="text-align:center;color:#94a3b8;padding:1.5rem">Aucun ordre</td></tr>
              </tbody>
            </table>
          </div>
          <div v-if="filteredOrders.length > 3" class="orders-see-more">
            <Button label="Voir plus" icon="pi pi-list" text @click="showAllOrdersModal = true" />
            <span class="orders-see-more-count">{{ filteredOrders.length }} ordres au total</span>
          </div>
        </div>
        <div class="machines-state-section senico-panel" style="margin-top:1rem">
          <div class="section-header"><h2>État des machines — Unité 2</h2></div>
          <div class="machines-state-grid">
            <div v-for="machine in staticMachines.slice(4)" :key="'u2m-' + machine.name" class="machine-state-item" :class="machine.chipClass">
              <div class="msi-top"><div class="msi-icon-wrap"><i class="pi pi-cog msi-icon"></i></div><div class="msi-info"><div class="msi-name">{{ machine.name }}</div><span class="msi-chip" :class="machine.chipClass"><span class="msi-dot"></span>{{ machine.status }}</span></div></div>
              <div class="msi-divider"></div>
              <div class="msi-actions"><Button label="Voir détail" icon="pi pi-eye" text size="small" class="machine-detail-btn" @click="openMachineDetails(machine)" /></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== UNITÉ 3 - Vue globale ===== -->
      <div v-show="activeTab === 'unite3'">
        <div class="senico-trs-cards">
          <article class="senico-trs-card tone-process">
            <div class="senico-trs-title">TRS — Ligne Process</div>
            <div class="senico-trs-value" style="color:#205ea4">{{ lineTrsCards[0].trs.toFixed(1) }}%</div>
            <div class="senico-trs-breakdown">
              <div><span>Disponibilité</span><strong>{{ lineTrsCards[0].availability.toFixed(1) }}%</strong></div>
              <div><span>Performance</span><strong>{{ lineTrsCards[0].performance.toFixed(1) }}%</strong></div>
              <div><span>Qualité</span><strong>{{ lineTrsCards[0].quality.toFixed(1) }}%</strong></div>
            </div>
            <div class="senico-trs-track"><div class="senico-trs-fill" :style="{ width: Math.min(lineTrsCards[0].trs, 100) + '%' }"></div></div>
          </article>
          <article class="senico-trs-card tone-conditioning">
            <div class="senico-trs-title">TRS — Ligne Conditionnement</div>
            <div class="senico-trs-value">{{ lineTrsCards[1].trs.toFixed(1) }}%</div>
            <div class="senico-trs-breakdown">
              <div><span>Disponibilité</span><strong>{{ lineTrsCards[1].availability.toFixed(1) }}%</strong></div>
              <div><span>Performance</span><strong>{{ lineTrsCards[1].performance.toFixed(1) }}%</strong></div>
              <div><span>Qualité</span><strong>{{ lineTrsCards[1].quality.toFixed(1) }}%</strong></div>
            </div>
            <div class="senico-trs-track"><div class="senico-trs-fill" :style="{ width: Math.min(lineTrsCards[1].trs, 100) + '%' }"></div></div>
          </article>
          <article class="senico-trs-card tone-global">
            <div class="senico-trs-title">TRS Global — Unité 3</div>
            <div class="senico-trs-value">{{ lineTrsCards[2].trs.toFixed(1) }}%</div>
            <div class="senico-trs-breakdown">
              <div><span>Disponibilité</span><strong>{{ lineTrsCards[2].availability.toFixed(1) }}%</strong></div>
              <div><span>Performance</span><strong>{{ lineTrsCards[2].performance.toFixed(1) }}%</strong></div>
              <div><span>Qualité</span><strong>{{ lineTrsCards[2].quality.toFixed(1) }}%</strong></div>
            </div>
            <div class="senico-trs-track"><div class="senico-trs-fill" :style="{ width: Math.min(lineTrsCards[2].trs, 100) + '%' }"></div></div>
          </article>
        </div>
        <div class="senico-stats-row">
          <div class="senico-stat-card"><div class="senico-stat-icon"><i class="pi pi-th-large"></i></div><div><div class="senico-stat-value">{{ dashboardData?.active_orders || 0 }}</div><div class="senico-stat-label">Ordres en cours</div></div></div>
          <div class="senico-stat-card"><div class="senico-stat-icon blue"><i class="pi pi-desktop"></i></div><div><div class="senico-stat-value">{{ dashboardData?.active_machines || 0 }}<small>/{{ dashboardData?.total_machines || 0 }}</small></div><div class="senico-stat-label">Machines actives</div></div></div>
          <div class="senico-stat-card"><div class="senico-stat-icon amber"><i class="pi pi-exclamation-triangle"></i></div><div><div class="senico-stat-value amber">{{ activeAlerts.length }}</div><div class="senico-stat-label">Alertes actives</div></div></div>
          <div class="senico-stat-card"><div class="senico-stat-icon green"><i class="pi pi-chart-line"></i></div><div><div class="senico-stat-value">{{ dashboardData?.daily_production || 0 }}</div><div class="senico-stat-label">Pièces / jour</div></div></div>
          <div class="senico-stat-card"><div class="senico-stat-icon" style="background:#ede9fe;color:#7c3aed"><i class="pi pi-percentage"></i></div><div><div class="senico-stat-value" :class="tauxRealisationClass">{{ tauxRealisation.toFixed(1) }}%</div><div class="senico-stat-label">Taux de réalisation</div><small style="font-size:0.72rem;color:#94a3b8">Global / PDP</small></div></div>
        </div>
        <div class="senico-lines-grid">
          <div class="line-panel">
            <div class="line-panel-head"><h3>TRS par machine — Process</h3><span>Temps réel</span></div>
            <div class="line-rows">
              <div v-for="machine in processLineMachines" :key="machine.id" class="line-row">
                <div class="line-machine-name">{{ machine.name }}</div>
                <div class="line-machine-track"><div class="line-machine-fill" :style="{ width: machineTrsValue(machine) + '%' }"></div></div>
                <div class="line-machine-val">{{ machineTrsValue(machine).toFixed(0) }}%</div>
              </div>
            </div>
          </div>
          <div class="line-panel">
            <div class="line-panel-head"><h3>TRS par machine — Conditionnement</h3><span>Temps réel</span></div>
            <div class="line-rows">
              <div v-for="machine in conditioningLineMachines" :key="machine.id" class="line-row">
                <div class="line-machine-name">{{ machine.name }}</div>
                <div class="line-machine-track"><div class="line-machine-fill amber" :style="{ width: machineTrsValue(machine) + '%' }"></div></div>
                <div class="line-machine-val amber">{{ machineTrsValue(machine).toFixed(0) }}%</div>
              </div>
            </div>
          </div>
        </div>
        <div class="orders-section senico-panel" style="margin-top:1rem">
          <div class="section-header"><h2>Tous les ordres — Unité 3</h2></div>
          <div class="orders-table-wrap">
            <table class="orders-table">
              <thead><tr><th>Référence</th><th>Produit</th><th>Statut</th><th>Progression</th><th>Machine</th><th>Date</th></tr></thead>
              <tbody>
                <tr v-for="order in filteredOrdersPreview" :key="'u3-' + order.id" class="order-row" :class="order.status">
                  <td class="order-ref">{{ order.reference }}</td>
                  <td class="order-product-name">{{ order.product_name }}</td>
                  <td><span class="status-badge" :class="order.status">{{ getOrderStatusLabel(order.status) }}</span></td>
                  <td class="order-progress-cell">
                    <template v-if="order.status === 'en_cours'"><div class="inline-progress"><div class="inline-progress-bar"><div class="inline-progress-fill" :style="{ width: order.completion_rate + '%' }"></div></div><span class="inline-progress-val">{{ order.completion_rate }}%</span></div></template>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td class="text-sm">{{ order.machine_name || '—' }}</td>
                  <td class="text-sm text-muted">{{ formatDate(order.planned_start || order.creation_date) }}</td>
                </tr>
                <tr v-if="!filteredOrdersPreview.length"><td colspan="6" style="text-align:center;color:#94a3b8;padding:1.5rem">Aucun ordre</td></tr>
              </tbody>
            </table>
          </div>
          <div v-if="filteredOrders.length > 3" class="orders-see-more">
            <Button label="Voir plus" icon="pi pi-list" text @click="showAllOrdersModal = true" />
            <span class="orders-see-more-count">{{ filteredOrders.length }} ordres au total</span>
          </div>
        </div>
        <div class="machines-state-section senico-panel" style="margin-top:1rem">
          <div class="section-header"><h2>État de toutes les machines</h2></div>
          <div class="machines-state-grid">
            <div v-for="machine in staticMachines" :key="'u3m-' + machine.name" class="machine-state-item" :class="machine.chipClass">
              <div class="msi-top"><div class="msi-icon-wrap"><i class="pi pi-cog msi-icon"></i></div><div class="msi-info"><div class="msi-name">{{ machine.name }}</div><span class="msi-chip" :class="machine.chipClass"><span class="msi-dot"></span>{{ machine.status }}</span></div></div>
              <div class="msi-divider"></div>
              <div class="msi-actions"><Button label="Voir détail" icon="pi pi-eye" text size="small" class="machine-detail-btn" @click="openMachineDetails(machine)" /></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== UNITÉ DYNAMIQUE ===== -->
      <div
        v-if="activeUnitTab && !['unite1', 'unite2', 'unite3'].includes(activeTab)"
      >
        <div class="senico-trs-cards">
          <article
            v-for="card in activeUnitTrsCards"
            :key="card.key"
            class="senico-trs-card"
            :class="card.tone"
          >
            <div class="senico-trs-title">{{ card.title }}</div>
            <div class="senico-trs-value">{{ Number(card.trs || 0).toFixed(1) }}%</div>
            <div class="senico-trs-breakdown">
              <div><span>Disponibilité</span><strong>{{ Number(card.availability || 0).toFixed(1) }}%</strong></div>
              <div><span>Performance</span><strong>{{ Number(card.performance || 0).toFixed(1) }}%</strong></div>
              <div><span>Qualité</span><strong>{{ Number(card.quality || 0).toFixed(1) }}%</strong></div>
            </div>
            <div class="senico-trs-track">
              <div class="senico-trs-fill" :style="{ width: Math.min(Number(card.trs || 0), 100) + '%' }"></div>
            </div>
            <div class="senico-trs-note">Mis à jour {{ formatComputedAt(dashboardData?.meta?.computed_at) }}</div>
          </article>
        </div>

        <div class="senico-stats-row">
          <div class="senico-stat-card">
            <div class="senico-stat-icon"><i class="pi pi-th-large"></i></div>
            <div>
              <div class="senico-stat-value">{{ activeUnitSummary.active_orders }}</div>
              <div class="senico-stat-label">Ordres en cours</div>
            </div>
          </div>
          <div class="senico-stat-card">
            <div class="senico-stat-icon blue"><i class="pi pi-desktop"></i></div>
            <div>
              <div class="senico-stat-value">{{ activeUnitSummary.active_machines }}<small>/{{ activeUnitSummary.total_machines }}</small></div>
              <div class="senico-stat-label">Machines actives</div>
            </div>
          </div>
          <div class="senico-stat-card">
            <div class="senico-stat-icon amber"><i class="pi pi-exclamation-triangle"></i></div>
            <div>
              <div class="senico-stat-value amber">{{ activeUnitSummary.active_alerts }}</div>
              <div class="senico-stat-label">Alertes actives</div>
            </div>
          </div>
          <div class="senico-stat-card">
            <div class="senico-stat-icon green"><i class="pi pi-chart-line"></i></div>
            <div>
              <div class="senico-stat-value">{{ activeUnitProduction }}</div>
              <div class="senico-stat-label">Pièces produites</div>
            </div>
          </div>
          <div class="senico-stat-card">
            <div class="senico-stat-icon" style="background:#ede9fe;color:#7c3aed"><i class="pi pi-percentage"></i></div>
            <div>
              <div class="senico-stat-value" :class="tauxClass(activeUnitTaux)">{{ activeUnitTaux.toFixed(1) }}%</div>
              <div class="senico-stat-label">Taux de réalisation</div>
              <small style="font-size:0.72rem;color:#94a3b8">Global / PDP</small>
            </div>
          </div>
        </div>

        <div class="orders-section senico-panel" style="margin-top:1rem">
          <div class="section-header">
            <h2>Ordres de production — {{ activeUnitTab.label }}</h2>
            <Select
              v-model="orderStatusFilter"
              :options="orderStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Filtrer par statut"
              class="filter-dropdown"
              showClear
            />
          </div>
          <div class="orders-table-wrap">
            <table class="orders-table">
              <thead><tr><th>Référence</th><th>Produit</th><th>Statut</th><th>Progression</th><th>Machine</th><th>Date</th></tr></thead>
              <tbody>
                <tr v-for="order in filteredOrders" :key="'dyn-' + order.id" class="order-row" :class="order.status">
                  <td class="order-ref">{{ order.reference }}</td>
                  <td class="order-product-name">{{ order.product_name }}</td>
                  <td><span class="status-badge" :class="order.status">{{ getOrderStatusLabel(order.status) }}</span></td>
                  <td class="order-progress-cell">
                    <div class="inline-progress">
                      <div class="inline-progress-bar">
                        <div class="inline-progress-fill" :style="{ width: order.completion_rate + '%' }"></div>
                      </div>
                      <span class="inline-progress-val">{{ order.completion_rate }}%</span>
                    </div>
                    <div class="inline-progress-qty">{{ order.actual_quantity }}/{{ order.planned_quantity }} pcs</div>
                  </td>
                  <td class="text-sm">{{ order.machine_name || '—' }}</td>
                  <td class="text-sm text-muted">{{ formatDate(order.planned_start || order.creation_date) }}</td>
                </tr>
                <tr v-if="!filteredOrders.length"><td colspan="6" style="text-align:center;color:#94a3b8;padding:1.5rem">Aucun ordre</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="machines-state-section senico-panel" style="margin-top:1rem">
          <div class="section-header"><h2>État des machines — {{ activeUnitTab.label }}</h2></div>
          <div class="machines-state-grid">
            <div v-for="machine in activeUnitMachines" :key="'dynm-' + machine.id" class="machine-state-item" :class="getMachineStatusClass(machine.status)">
              <div class="msi-top">
                <div class="msi-icon-wrap"><i class="pi pi-cog msi-icon"></i></div>
                <div class="msi-info">
                  <div class="msi-name">{{ machine.name }}</div>
                  <span class="msi-chip" :class="getMachineStatusClass(machine.status)">
                    <span class="msi-dot"></span>{{ getMachineStatusLabel(machine.status) }}
                  </span>
                </div>
              </div>
              <div class="msi-divider"></div>
              <div class="msi-metrics">
                <div class="msi-metric-row">
                  <span class="msi-metric-label"><i class="pi pi-chart-line"></i> TRS</span>
                  <span>{{ machineTrsValue(machine).toFixed(1) }}%</span>
                </div>
                <div class="msi-metric-row">
                  <span class="msi-metric-label"><i class="pi pi-percentage"></i> Réalisation</span>
                  <span>{{ Number(machine.realization_rate || 0).toFixed(1) }}%</span>
                </div>
              </div>
              <div class="msi-actions">
                <Button label="Voir détail" icon="pi pi-eye" text size="small" class="machine-detail-btn" @click="openMachineDetails(machine)" />
              </div>
            </div>
            <div v-if="!activeUnitMachines.length" class="empty-machines">
              Aucune machine pour cette unité
            </div>
          </div>
        </div>
      </div>

      <!-- Modal : Tous les ordres de production -->
      <Dialog
        v-model:visible="showAllOrdersModal"
        modal
        header="Tous les ordres de production"
        :style="{ width: 'min(1050px, 96vw)' }"
      >
        <div class="mes-modal-filters">
          <Select
            v-model="orderStatusFilter"
            :options="orderStatusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrer par statut"
            class="filter-dropdown"
            showClear
          />
          <span class="mes-modal-count">{{ filteredOrders.length }} ordre(s)</span>
        </div>
        <div style="overflow-x:auto;margin-top:0.75rem">
          <table class="orders-table">
            <thead>
              <tr><th>Référence</th><th>Produit</th><th>Statut</th><th>Progression</th><th>Machine</th><th>Opérateur</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="order in filteredOrders" :key="'modal-' + order.id" class="order-row" :class="order.status">
                <td class="order-ref">{{ order.reference }}</td>
                <td class="order-product-name">{{ order.product_name }}</td>
                <td><span class="status-badge" :class="order.status">{{ getOrderStatusLabel(order.status) }}</span></td>
                <td class="order-progress-cell">
                  <template v-if="order.status === 'en_cours'">
                    <div class="inline-progress"><div class="inline-progress-bar"><div class="inline-progress-fill" :style="{ width: order.completion_rate + '%' }"></div></div><span class="inline-progress-val">{{ order.completion_rate }}%</span></div>
                    <div class="inline-progress-qty">{{ order.actual_quantity }}/{{ order.planned_quantity }} pcs</div>
                  </template>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="text-sm">{{ order.machine_name || '—' }}</td>
                <td class="text-sm">{{ order.operator_name || '—' }}</td>
                <td class="text-sm text-muted">{{ formatDate(order.planned_start || order.creation_date) }}</td>
                <td class="order-row-actions">
                  <Button v-if="order.status === 'planifie'" icon="pi pi-play" size="small" rounded class="action-btn primary" v-tooltip.top="'Démarrer'" @click="startOrder(order.id)" />
                  <Button v-if="order.status === 'en_cours'" icon="pi pi-check" size="small" rounded class="action-btn success" v-tooltip.top="'Terminer'" @click="completeOrder(order.id)" />
                  <Button icon="pi pi-eye" size="small" rounded text class="action-btn secondary" v-tooltip.top="'Détails'" @click="viewOrderDetails(order); showAllOrdersModal = false" />
                </td>
              </tr>
              <tr v-if="!filteredOrders.length"><td colspan="8" style="text-align:center;color:#94a3b8;padding:2rem">Aucun ordre de production</td></tr>
            </tbody>
          </table>
        </div>
        <template #footer>
          <Button label="Fermer" text @click="showAllOrdersModal = false" />
        </template>
      </Dialog>

      <Dialog
        v-model:visible="showMachineDetailsDialog"
        modal
        :draggable="false"
        header="Détails machine"
        class="machine-details-dialog"
        :style="{ width: 'min(760px, 96vw)' }"
      >
        <div v-if="selectedMachineDetails" class="machine-details-content">
          <div class="machine-details-hero">
            <div class="machine-details-icon">
              <i class="pi pi-cog"></i>
            </div>
            <div>
              <h3>{{ selectedMachineDetails.name }}</h3>
              <p>{{ selectedMachineDetails.type }} • {{ selectedMachineDetails.line }}</p>
            </div>
            <Tag :value="selectedMachineDetails.status" :severity="selectedMachineDetails.tagSeverity" />
          </div>

          <div class="machine-details-grid">
            <div class="machine-detail-field">
              <label>Disponibilité</label>
              <strong>{{ selectedMachineDetails.availability }}%</strong>
            </div>
            <div class="machine-detail-field">
              <label>Performance</label>
              <strong>{{ selectedMachineDetails.performance }}%</strong>
            </div>
            <div class="machine-detail-field">
              <label>Qualité</label>
              <strong>{{ selectedMachineDetails.quality }}%</strong>
            </div>
            <div class="machine-detail-field">
              <label>TRS</label>
              <strong>{{ selectedMachineDetails.trs }}%</strong>
            </div>
            <div class="machine-detail-field">
              <label>Cible TRS</label>
              <strong>{{ selectedMachineDetails.targetTrs }}%</strong>
            </div>
            <div class="machine-detail-field">
              <label>Réalisation</label>
              <strong>{{ selectedMachineDetails.utilization }}%</strong>
            </div>
            <div class="machine-detail-field">
              <label>Cible réalisation</label>
              <strong>{{ selectedMachineDetails.targetRealization }}%</strong>
            </div>
            <div class="machine-detail-field">
              <label>Cadence</label>
              <strong>{{ selectedMachineDetails.cadence }}</strong>
            </div>
            <div class="machine-detail-field">
              <label>Production</label>
              <strong>{{ selectedMachineDetails.actualQuantity }}/{{ selectedMachineDetails.plannedQuantity }}</strong>
            </div>
            <div class="machine-detail-field">
              <label>Pièces conformes</label>
              <strong>{{ selectedMachineDetails.goodPieces }}</strong>
            </div>
            <div class="machine-detail-field">
              <label>Pièces rejetées</label>
              <strong>{{ selectedMachineDetails.scrapPieces }}</strong>
            </div>
            <div class="machine-detail-field">
              <label>Arrêts planifiés</label>
              <strong>{{ selectedMachineDetails.plannedDowntime }} min</strong>
            </div>
            <div class="machine-detail-field">
              <label>Arrêts non planifiés</label>
              <strong>{{ selectedMachineDetails.unplannedDowntime }} min</strong>
            </div>
            <div class="machine-detail-field">
              <label>Opérateur</label>
              <strong>{{ selectedMachineDetails.operator }}</strong>
            </div>
            <div class="machine-detail-field">
              <label>Statut ordre</label>
              <strong>{{ selectedMachineDetails.orderStatus }}</strong>
            </div>
          </div>

          <div class="machine-alert-banner" :class="selectedMachineDetails.alertTone">
            <i class="pi pi-bell"></i>
            <span>{{ selectedMachineDetails.alertMessage }}</span>
          </div>
        </div>

        <template #footer>
          <Button label="Fermer" text @click="showMachineDetailsDialog = false" />
        </template>
      </Dialog>
    </div>

    <!-- Error State -->
    <div v-else class="error-container">
      <div class="error-content">
        <i class="pi pi-exclamation-triangle error-icon"></i>
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <Button label="Réessayer" @click="loadMESData" />
      </div>
    </div>

    <!-- Order Details Dialog -->
    <Dialog
      v-model:visible="showOrderDetailsDialog"
      modal
      header="Détails de l'ordre de production"
      class="details-dialog"
      :style="{ width: '900px' }"
    >
      <div v-if="selectedOrder" class="order-details-content">
        <!-- Informations principales -->
        <div class="details-section">
          <h3>Informations générales</h3>
          <div class="details-grid">
            <div class="detail-field">
              <label>Référence</label>
              <p>{{ selectedOrder.reference }}</p>
            </div>
            <div class="detail-field">
              <label>Statut</label>
              <p><span class="status-badge" :class="selectedOrder.status">{{ getOrderStatusLabel(selectedOrder.status) }}</span></p>
            </div>
            <div class="detail-field">
              <label>Produit</label>
              <p>{{ selectedOrder.product_name || 'N/A' }}</p>
            </div>
            <div class="detail-field">
              <label>Poste de travail</label>
              <p>{{ selectedOrder.workplace_name || 'N/A' }}</p>
            </div>
            <div class="detail-field">
              <label>Quantité planifiée</label>
              <p>{{ selectedOrder.planned_quantity }} pcs</p>
            </div>
            <div class="detail-field">
              <label>Quantité réalisée</label>
              <p>{{ selectedOrder.actual_quantity || 0 }} pcs</p>
            </div>
            <div class="detail-field">
              <label>Taux de complétion</label>
              <p>{{ selectedOrder.completion_rate || 0 }}%</p>
            </div>
            <div class="detail-field">
              <label>Date de création</label>
              <p>{{ formatDate(selectedOrder.creation_date) }}</p>
            </div>
          </div>
        </div>

        <!-- Sessions de production -->
        <div class="details-section">
          <div class="section-header">
            <h3>Sessions de production</h3>
            <Button
              label="Nouvelle session"
              icon="pi pi-plus"
              size="small"
              @click="openCreateSessionDialog"
            />
          </div>

          <div v-if="orderSessions.length > 0" class="sessions-list">
            <div v-for="(session, index) in orderSessions" :key="session.id" class="session-item">
              <div class="session-number">
                <span>{{ index + 1 }}</span>
              </div>
              <div class="session-content">
                <div class="session-main">
                  <div class="session-machine">
                    <i class="pi pi-cog"></i>
                    <h4>{{ session.machine_name || 'Machine non assignée' }}</h4>
                  </div>
                  <span class="session-status-badge" :class="session.status.toLowerCase()">
                    {{ session.status === 'OPEN' ? 'En cours' : 'Terminée' }}
                  </span>
                </div>
                <div class="session-info-grid">
                  <div class="info-item">
                    <i class="pi pi-user"></i>
                    <span>{{ session.shift_code || 'Non assigné' }}</span>
                  </div>
                  <div class="info-item">
                    <i class="pi pi-tag"></i>
                    <span>Lot: {{ session.batch_number || 'N/A' }}</span>
                  </div>
                  <div class="info-item" v-if="session.ended_at">
                    <i class="pi pi-clock"></i>
                    <span>Durée: {{ calculateDuration(session.started_at, session.ended_at) }}</span>
                  </div>
                  <div class="info-item" v-else>
                    <i class="pi pi-clock"></i>
                    <span>En cours ({{ session.duration || 0 }} min)</span>
                  </div>
                  <div class="info-item">
                    <i class="pi pi-calendar"></i>
                    <span>{{ formatDate(session.started_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-sessions">
            <i class="pi pi-info-circle"></i>
            <p>Aucune session de production pour cet ordre</p>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Fermer" text @click="showOrderDetailsDialog = false" />
      </template>
    </Dialog>

    <!-- Create Session Dialog -->
    <Dialog
      v-model:visible="showCreateSessionDialog"
      modal
      header="Nouvelle session de production"
      class="create-dialog"
      :style="{ width: '600px' }"
    >
      <div class="dialog-content">
        <div class="form-group">
          <label for="session_machine">Machine *</label>
          <Select
            id="session_machine"
            v-model="newSession.machine"
            :options="machineOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner une machine"
            class="w-full"
            filter
          />
        </div>

        <div class="form-group">
          <label for="session_operator">Opérateur</label>
          <InputText
            id="session_operator"
            v-model="newSession.operator_note"
            placeholder="Nom de l'opérateur (optionnel)"
            class="w-full"
          />
          <small>Laissez vide pour utiliser votre nom automatiquement</small>
        </div>

        <div class="form-info-box">
          <i class="pi pi-info-circle"></i>
          <p>La session démarre immédiatement et sera associée à l'ordre sélectionné.</p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button label="Annuler" text @click="showCreateSessionDialog = false" />
          <Button
            label="Créer la session"
            icon="pi pi-check"
            :loading="creatingSession"
            @click="createSession"
          />
        </div>
      </template>
    </Dialog>

    <!-- Create Order Dialog -->
    <Dialog
      v-model:visible="showCreateOrderDialog"
      modal
      class="create-dialog"
      :style="{ width: '900px', maxHeight: '90vh' }"
    >
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span>Nouvel ordre de production</span>
        </div>
      </template>
      <div v-if="loadingOptions" class="loading-options">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #7AC943;"></i>
        <p>Chargement des options...</p>
      </div>

      <div v-else class="dialog-content scrollable">
        <!-- Étape 1: Informations de base -->
        <div class="form-section">
          <h4 class="section-title">
            <i class="pi pi-info-circle"></i>
            Informations de base
          </h4>

          <div class="form-row">
            <div class="form-group">
              <label for="reference">Référence de l'ordre *</label>
              <InputText
                id="reference"
                v-model="newOrder.reference"
                placeholder="OP-2025-001"
                class="w-full"
              />
            </div>

            <div class="form-group">
              <label for="planned_quantity">Quantité planifiée *</label>
              <InputNumber
                id="planned_quantity"
                v-model="newOrder.planned_quantity"
                :min="1"
                class="w-full"
                showButtons
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="workplace">Poste de travail *</label>
              <Select
                id="workplace"
                v-model="newOrder.workplace"
                :options="workplaceOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un poste"
                class="w-full"
                filter
              />
            </div>

            <div class="form-group">
              <label for="product">Produit *</label>
              <div style="display:flex;gap:0.5rem">
                <Select
                  id="product"
                  v-model="newOrder.product"
                  :options="productOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Sélectionner un produit"
                  class="w-full"
                  filter
                />
                <Button
                  icon="pi pi-plus"
                  v-tooltip.top="'Nouveau produit'"
                  @click="showCreateProductDialog = true"
                  text
                  rounded
                  size="small"
                />
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="priority">Priorité</label>
              <Select
                id="priority"
                v-model="newOrder.priority"
                :options="priorityOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Normale"
                class="w-full"
              />
            </div>

            <div class="form-group">
              <label for="deadline">Date limite (optionnel)</label>
              <input
                id="deadline"
                type="date"
                :value="formatDateForInput(newOrder.deadline)"
                @input="updateDeadline($event)"
                class="date-input-native"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="mes_date">Date MES</label>
              <input id="mes_date" type="date" v-model="newOrder.date" class="date-input-native" />
            </div>
            <div class="form-group">
              <label for="actual_quantity">Quantité produite</label>
              <InputNumber id="actual_quantity" v-model="newOrder.actual_quantity" :min="0" class="w-full" showButtons />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Pièces conformes</label>
              <InputNumber v-model="newOrder.good_pieces" :min="0" class="w-full" showButtons />
            </div>
            <div class="form-group">
              <label>Pièces rejetées</label>
              <InputNumber v-model="newOrder.scrap_pieces" :min="0" class="w-full" showButtons />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Cadence</label>
              <InputNumber v-model="newOrder.cadence" :min="0" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" />
            </div>
            <div class="form-group">
              <label>Unité cadence</label>
              <InputText v-model="newOrder.cadence_unit" placeholder="tonne/h, pcs/min..." class="w-full" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Ligne</label>
              <InputText v-model="newOrder.line_name" placeholder="Ligne A" class="w-full" />
            </div>
            <div class="form-group">
              <label>Emplacement</label>
              <InputText v-model="newOrder.location_name" placeholder="Process, Conditionnement..." class="w-full" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Statut machine</label>
              <Select v-model="newOrder.machine_status" :options="machineStatusOptions" optionLabel="label" optionValue="value" class="w-full" />
            </div>
            <div class="form-group">
              <label>Statut ordre</label>
              <Select v-model="newOrder.order_status" :options="orderStatusOptions" optionLabel="label" optionValue="value" class="w-full" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Temps d'ouverture (min)</label>
              <InputNumber v-model="newOrder.planned_time_minutes" :min="1" class="w-full" />
            </div>
            <div class="form-group">
              <label>Arrêts planifiés (min)</label>
              <InputNumber v-model="newOrder.planned_downtime_minutes" :min="0" class="w-full" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Arrêt non planifié (min)</label>
              <InputNumber v-model="newOrder.unplanned_downtime_minutes" :min="0" class="w-full" />
            </div>
            <div class="form-group">
              <label>Opérateur</label>
              <InputText v-model="newOrder.operator" placeholder="Nom opérateur" class="w-full" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Cible TRS (%)</label>
              <InputNumber v-model="newOrder.target_oee" :min="0" :max="100" suffix="%" class="w-full" />
            </div>
            <div class="form-group">
              <label>Cible taux de réalisation (%)</label>
              <InputNumber v-model="newOrder.target_realization" :min="0" :max="100" suffix="%" class="w-full" />
            </div>
          </div>

          <div class="form-group">
            <label for="notes">Notes / Instructions</label>
            <Textarea
              id="notes"
              v-model="newOrder.notes"
              rows="2"
              placeholder="Instructions particulières..."
              class="w-full"
            />
          </div>
        </div>

        <!-- Étape 2: Séquence de machines -->
        <div class="form-section">
          <div class="section-header">
            <h4 class="section-title">
              <i class="pi pi-cog"></i>
              Séquence de machines
            </h4>
            <Button
              label="Ajouter une machine"
              icon="pi pi-plus"
              size="small"
              outlined
              @click="addMachineToSequence"
            />
          </div>

          <div v-if="newOrder.machineSequence.length > 0" class="machine-sequence-list">
            <div
              v-for="(item, index) in newOrder.machineSequence"
              :key="index"
              class="machine-sequence-item"
            >
              <div class="sequence-number">{{ index + 1 }}</div>
              <div class="sequence-content">
                <div class="form-row">
                  <div class="form-group">
                    <label>Machine *</label>
                    <Select
                      v-model="item.machine"
                      :options="machineOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Sélectionner une machine"
                      class="w-full"
                      filter
                    />
                  </div>

                  <div class="form-group">
                    <label>Opérateur / Code Équipe</label>
                    <InputText
                      v-model="item.operator"
                      placeholder="Ex: Jean Dupont ou EQUIPE-A"
                      class="w-full"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label>Informations complémentaires</label>
                  <InputText
                    v-model="item.notes"
                    placeholder="Notes pour cette étape (optionnel)"
                    class="w-full"
                  />
                </div>
              </div>

              <div class="sequence-actions">
                <Button
                  icon="pi pi-arrow-up"
                  text
                  rounded
                  :disabled="index === 0"
                  @click="moveSequenceItem(index, -1)"
                  v-tooltip.top="'Monter'"
                />
                <Button
                  icon="pi pi-arrow-down"
                  text
                  rounded
                  :disabled="index === newOrder.machineSequence.length - 1"
                  @click="moveSequenceItem(index, 1)"
                  v-tooltip.top="'Descendre'"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  @click="removeSequenceItem(index)"
                  v-tooltip.top="'Supprimer'"
                />
              </div>
            </div>
          </div>

          <div v-else class="empty-sequence">
            <i class="pi pi-info-circle"></i>
            <p>Aucune machine ajoutée. Cliquez sur "Ajouter une machine" pour définir la séquence de production.</p>
          </div>
        </div>

      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <Button 
            label="Annuler" 
            text 
            @click="showCreateOrderDialog = false"
          />
          <Button 
            label="Créer"
            icon="pi pi-check"
            @click="createNewOrder"
            :loading="creating"
          />
        </div>
      </template>
    </Dialog>

    <!-- Toast Notifications -->
    <!-- Create Product Dialog -->
    <Dialog
      v-model:visible="showCreateProductDialog"
      modal
      :style="{ width: 'min(440px, 95vw)' }"
      :contentStyle="{ padding: '1rem 1.25rem' }"
    >
      <template #header>
        <span style="font-size:0.95rem;font-weight:600;color:#1e293b">Nouveau produit</span>
      </template>

      <div style="display:flex;flex-direction:column;gap:0.875rem">
        <div class="form-group">
          <label>Nom du produit *</label>
          <InputText v-model="newProduct.name" placeholder="Ex: Bride A-100, Axe B-200" class="w-full" />
        </div>
        <div class="form-group">
          <label>Famille</label>
          <InputText v-model="newProduct.family" placeholder="Ex: Pieces mecaniques, Assemblages" class="w-full" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <Textarea v-model="newProduct.description" placeholder="Description du produit" rows="2" autoResize class="w-full" />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button label="Annuler" text @click="showCreateProductDialog = false" />
          <Button label="Créer" @click="createProduct" :loading="creatingProduct" class="create-btn" />
        </div>
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useNavigationStore } from '@/shared'
import { useToast } from 'primevue/usetoast'
import { useMesStore } from '@/features/mes/stores/mesStore'
import { useNotificationsStore } from '@/stores/notificationsStore.js'
import { useImportEventsStore } from '@/stores/importEventsStore'
import { axiosInstance } from '@/main.js'

const navigationStore = useNavigationStore()
const toast = useToast()
const mesStore = useMesStore()
const notificationsStore = useNotificationsStore()
const importEventsStore = useImportEventsStore()

// Destructure store state avec storeToRefs pour garder la réactivité
const { 
  dashboardData, 
  machinesStatus, 
  activeAlerts: activeAlertsList,
  workOrders,
  loading: storeLoading,
  errors: storeErrors
} = storeToRefs(mesStore)

// Utiliser les getters du store
const oeeReport = computed(() => mesStore.oeeReport)
const productionMetrics = computed(() => mesStore.productionMetrics)

// Tabs MES (dynamic: load workplaces from API)
const activeTab = ref('flotte')
const mesTabs = ref([])

const loadWorkplacesTabs = async () => {
  // default fleet tab
  const previousActiveTab = activeTab.value
  mesTabs.value = [{ id: 'flotte', label: 'Vue Site' }]
  try {
    const resp = await axiosInstance.get('/accounts/workplaces/')
    const list = resp.data?.data || resp.data?.results || resp.data || []
    // Ensure workplaces exist
    if (Array.isArray(list) && list.length) {
      list.forEach(w => {
        let id = `workplace-${w.id}`
        mesTabs.value.push({ id, label: w.name, workplaceId: w.id })
      })
    } else {
      // Fallback to three sample units if API returns empty
      mesTabs.value.push({ id: 'unite1', label: 'Unité 1' })
      mesTabs.value.push({ id: 'unite2', label: 'Unité 2' })
      mesTabs.value.push({ id: 'unite3', label: 'Unité 3' })
    }
  } catch (err) {
    // On error, fallback to static tabs
    mesTabs.value = [
      { id: 'flotte', label: 'Vue Flotte' },
      { id: 'unite1', label: 'Unité 1' },
      { id: 'unite2', label: 'Unité 2' },
      { id: 'unite3', label: 'Unité 3' }
    ]
  }

  if (previousActiveTab && mesTabs.value.some(tab => tab.id === previousActiveTab)) {
    activeTab.value = previousActiveTab
  } else if (!mesTabs.value.some(tab => tab.id === activeTab.value)) {
    activeTab.value = 'flotte'
  }
}
const showAllOrdersModal = ref(false)

// Periode
const selectedPeriod = ref('30d')
const customStartDate = ref('')
const customEndDate = ref('')
const periodOptions = [
  { label: '24h', value: '24h' },
  { label: '7j', value: '7d' },
  { label: '30j', value: '30d' },
  { label: '90j', value: '90d' },
  { label: 'Personnalise', value: 'custom' },
]

// État local
const loading = ref(false)
const error = ref(null)
const showCreateOrderDialog = ref(false)
const showOrderDetailsDialog = ref(false)
const showCreateSessionDialog = ref(false)
const creating = ref(false)
const creatingSession = ref(false)
const loadingOptions = ref(false)
const orderStatusFilter = ref(null)
const selectedOrder = ref(null)
const orderSessions = ref([])
const showMachineDetailsDialog = ref(false)
const selectedMachineDetails = ref(null)

// Mapped data pour compatibilité avec le template
const productionOrders = computed(() => workOrders.value || [])
const machines = computed(() => machinesStatus.value || [])
const alerts = computed(() => activeAlertsList.value || [])

const staticMachines = computed(() =>
  (machines.value || []).map((machine) => ({
    ...machine,
    name: machine?.name || 'Machine sans nom',
    status: getMachineStatusLabel(machine?.status),
    chipClass: getMachineStatusClass(machine?.status)
  }))
)

const activeUnitTab = computed(() => {
  if (activeTab.value === 'flotte') return null
  return mesTabs.value.find(tab => tab.id === activeTab.value) || null
})

const activeWorkplaceId = computed(() => activeUnitTab.value?.workplaceId || null)

const dashboardUnits = computed(() => dashboardData.value?.units || [])
const activeUnitSummary = computed(() => {
  const found = dashboardUnits.value.find(unit => String(unit.id) === String(activeWorkplaceId.value))
  if (found) return found
  const unitOrders = (productionOrders.value || []).filter(orderBelongsToActiveUnit)
  const unitActual = unitOrders.reduce((sum, order) => sum + (Number(order.actual_quantity) || 0), 0)
  const unitPlanned = unitOrders.reduce((sum, order) => sum + (Number(order.planned_quantity) || 0), 0)
  return {
    active_orders: unitOrders.filter(order => order.status !== 'termine').length,
    active_machines: activeUnitMachines.value.filter(machine => ['ACTIVE', 'OPERATIONAL'].includes(String(machine.status).toUpperCase())).length,
    total_machines: activeUnitMachines.value.length,
    active_alerts: activeAlerts.value.filter(alert => String(alert?.workplace_id) === String(activeWorkplaceId.value)).length,
    daily_production: unitActual,
    taux_realisation: unitPlanned ? (unitActual / unitPlanned) * 100 : 0,
    trs_cards: [],
  }
})

const orderBelongsToActiveUnit = (order) => {
  if (!activeWorkplaceId.value) return true
  return String(order?.workplace) === String(activeWorkplaceId.value)
    || String(order?.workplace_id) === String(activeWorkplaceId.value)
}

const machineBelongsToActiveUnit = (machine) => {
  if (!activeWorkplaceId.value) return true
  return String(machine?.workplace) === String(activeWorkplaceId.value)
    || String(machine?.workplace_id) === String(activeWorkplaceId.value)
}

const activeUnitMachines = computed(() => (machines.value || []).filter(machineBelongsToActiveUnit))

const activeUnitProduction = computed(() =>
  Number(activeUnitSummary.value?.daily_production ?? (
    (productionOrders.value || [])
      .filter(orderBelongsToActiveUnit)
      .reduce((sum, order) => sum + (Number(order.actual_quantity) || 0), 0)
  ))
)

const activeUnitTaux = computed(() => {
  if (activeUnitSummary.value?.taux_realisation != null) {
    return clampPercent(activeUnitSummary.value.taux_realisation)
  }
  const orders = (productionOrders.value || []).filter(orderBelongsToActiveUnit)
  const totalPlanned = orders.reduce((sum, order) => sum + (Number(order.planned_quantity) || 0), 0)
  const totalActual = orders.reduce((sum, order) => sum + (Number(order.actual_quantity) || 0), 0)
  if (!totalPlanned) return 0
  return clampPercent((totalActual / totalPlanned) * 100)
})

// Calcul de la charge capacitaire
const capacityLoad = computed(() => {
  if (!dashboardData.value) return 0

  const activeMachines = dashboardData.value.active_machines || 0
  const totalMachines = dashboardData.value.total_machines || 1
  const activeOrders = dashboardData.value.active_orders || 0
  const dailyProduction = dashboardData.value.daily_production || 0

  // Formule : (Machines actives / Total machines) * (Production actuelle / Production planifiée) * 100
  // Simplifiée si pas de données de production planifiée
  const machineUtilization = (activeMachines / totalMachines) * 100

  // Si on a des ordres actifs, on pondère par la charge des ordres
  if (activeOrders > 0 && dailyProduction > 0) {
    // Estimation : capacité théorique = 1000 pcs/jour par machine
    const theoreticalCapacity = totalMachines * 1000
    const productionLoad = (dailyProduction / theoreticalCapacity) * 100

    // Moyenne pondérée (70% utilisation machines, 30% production)
    return Math.min((machineUtilization * 0.7 + productionLoad * 0.3), 100)
  }

  return Math.min(machineUtilization, 100)
})

// Form data pour nouvel ordre - Avec toutes les infos
const newOrder = ref({
  reference: '',
  product: null,
  planned_quantity: 1,
  actual_quantity: 0,
  good_pieces: 0,
  scrap_pieces: 0,
  workplace: null,
  priority: 'normal',
  deadline: null,
  date: new Date().toISOString().split('T')[0],
  cadence: null,
  cadence_unit: 'tonne/h',
  line_name: '',
  location_name: '',
  machine_status: 'ACTIVE',
  order_status: 'en_cours',
  planned_time_minutes: 1440,
  planned_downtime_minutes: 30,
  unplanned_downtime_minutes: 0,
  operator: '',
  target_oee: 80,
  target_realization: 90,
  notes: '',
  machineSequence: []
})

// Produits
const showCreateProductDialog = ref(false)
const creatingProduct = ref(false)
const newProduct = ref({ name: '', family: '', description: '' })

const loadProducts = async () => {
  try {
    const resp = await axiosInstance.get('/engins/products/')
    const data = Array.isArray(resp.data) ? resp.data : resp.data.results || []
    productOptions.value = data.map(p => ({
      label: p.version ? `${p.name} (v${p.version})` : p.name,
      value: p.id
    }))
  } catch {
    productOptions.value = []
  }
}

const createProduct = async () => {
  if (!newProduct.value.name?.trim()) {
    toast.add({ severity: 'warn', summary: 'Champ requis', detail: 'Le nom du produit est requis', life: 3000 })
    return
  }
  creatingProduct.value = true
  try {
    const resp = await axiosInstance.post('/engins/products/', {
      name: newProduct.value.name.trim(),
      family: newProduct.value.family || '',
      description: newProduct.value.description || '',
    })
    const created = resp.data
    toast.add({ severity: 'success', summary: 'Produit cree', detail: created.name, life: 3000 })
    showCreateProductDialog.value = false
    newProduct.value = { name: '', family: '', description: '' }
    await loadProducts()
    newOrder.value.product = created.id
  } catch (err) {
    const detail = err.response?.data ? JSON.stringify(err.response.data).slice(0, 200) : 'Erreur'
    toast.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 })
  } finally {
    creatingProduct.value = false
  }
}

// Options pour les dropdowns
const orderStatusOptions = [
  { label: 'Planifié', value: 'planifie' },
  { label: 'En cours', value: 'en_cours' },
  { label: 'Terminé', value: 'termine' },
  { label: 'Annulé', value: 'annule' }
]

// Options pour workplaces et products (à charger depuis l'API)
const workplaceOptions = ref([])
const productOptions = ref([])
const machineOptions = ref([])

const priorityOptions = [
  { label: 'Basse', value: 'low' },
  { label: 'Normale', value: 'normal' },
  { label: 'Haute', value: 'high' },
  { label: 'Urgente', value: 'urgent' }
]

const machineStatusOptions = [
  { label: 'En marche', value: 'ACTIVE' },
  { label: 'En panne', value: 'BREAKDOWN' },
  { label: 'En maintenance', value: 'MAINTENANCE' },
  { label: 'Arrêtée', value: 'STOPPED' },
  { label: 'Dégradée', value: 'DEGRADED' }
]

// Form data pour nouvelle session
const newSession = ref({
  machine: null,
  operator_note: ''
})

// Computed
const tauxRealisation = computed(() => {
  const orders = productionOrders.value || []
  const totalPlanned = orders.reduce((sum, o) => sum + (Number(o.planned_quantity) || 0), 0)
  const totalActual  = orders.reduce((sum, o) => sum + (Number(o.actual_quantity)  || 0), 0)
  if (!totalPlanned) return dashboardData.value?.taux_realisation ?? 0
  return clampPercent((totalActual / totalPlanned) * 100)
})

const tauxRealisationClass = computed(() => {
  const v = tauxRealisation.value
  if (v >= 90) return 'taux-excellent'
  if (v >= 75) return 'taux-good'
  if (v >= 50) return 'taux-average'
  return 'taux-poor'
})

// Pièces produites par unité — somme actual_quantity des ordres de chaque ligne
// Si aucun ordre n'est lié aux machines, répartition proportionnelle au TRS de la ligne
function calcProductionForMachines(machineList, trsWeight) {
  const total = dashboardData.value?.daily_production || 0
  const ids = new Set(machineList.map(m => m.id))
  const names = machineList.map(m => (m.name || '').toLowerCase())
  const orders = (productionOrders.value || []).filter(o => {
    if (o.machine_id && ids.has(o.machine_id)) return true
    if (o.machine_name) return names.some(n => n && o.machine_name.toLowerCase().includes(n.split(' ')[0]))
    return false
  })
  if (orders.length) {
    return orders.reduce((sum, o) => sum + (Number(o.actual_quantity) || 0), 0)
  }
  // fallback : répartition proportionnelle au TRS (poids passé en paramètre)
  return Math.round(total * trsWeight)
}

const dailyProductionU1 = computed(() => {
  const trsU1 = lineTrsCards.value[0]?.trs || 0
  const trsU2 = lineTrsCards.value[1]?.trs || 0
  const total = trsU1 + trsU2
  const weight = total > 0 ? trsU1 / total : 0.5
  return calcProductionForMachines(processLineMachines.value, weight)
})

const dailyProductionU2 = computed(() => {
  const trsU1 = lineTrsCards.value[0]?.trs || 0
  const trsU2 = lineTrsCards.value[1]?.trs || 0
  const total = trsU1 + trsU2
  const weight = total > 0 ? trsU2 / total : 0.5
  return calcProductionForMachines(conditioningLineMachines.value, weight)
})

// Taux de réalisation par unité — filtré sur les ordres des machines de chaque ligne
function calcTauxForMachines(machineList) {
  const ids = new Set(machineList.map(m => m.id))
  const names = machineList.map(m => (m.name || '').toLowerCase())
  const orders = (productionOrders.value || []).filter(o => {
    if (o.machine_id && ids.has(o.machine_id)) return true
    if (o.machine_name) return names.some(n => n && o.machine_name.toLowerCase().includes(n.split(' ')[0]))
    return false
  })
  if (!orders.length) return tauxRealisation.value // fallback sur global si pas d'ordres liés
  const totalPlanned = orders.reduce((sum, o) => sum + (Number(o.planned_quantity) || 0), 0)
  const totalActual  = orders.reduce((sum, o) => sum + (Number(o.actual_quantity)  || 0), 0)
  if (!totalPlanned) return 0
  return clampPercent((totalActual / totalPlanned) * 100)
}

const tauxRealisationU1 = computed(() => calcTauxForMachines(processLineMachines.value))
const tauxRealisationU2 = computed(() => calcTauxForMachines(conditioningLineMachines.value))

function tauxClass(v) {
  if (v >= 90) return 'taux-excellent'
  if (v >= 75) return 'taux-good'
  if (v >= 50) return 'taux-average'
  return 'taux-poor'
}

const filteredOrders = computed(() => {
  const scopedOrders = activeWorkplaceId.value
    ? productionOrders.value.filter(orderBelongsToActiveUnit)
    : productionOrders.value
  if (!orderStatusFilter.value) return scopedOrders
  return scopedOrders.filter(order => order.status === orderStatusFilter.value)
})

const filteredOrdersPreview = computed(() => filteredOrders.value.slice(0, 3))

const activeAlerts = computed(() =>
  [...(dashboardData.value?.alertes || []), ...(alerts.value || [])].filter((alert, index, list) => {
    const id = alert?.id ?? `${alert?.machine_id || ''}-${alert?.message || ''}`
    const firstIndex = list.findIndex(item => (item?.id ?? `${item?.machine_id || ''}-${item?.message || ''}`) === id)
    if (firstIndex !== index) return false
    const status = String(alert?.status || '').toLowerCase()
    const state = String(alert?.state || '').toLowerCase()
    const isResolved = alert?.is_resolved === true || status === 'resolved' || state === 'resolved'
    return !isResolved
  })
)

const activeUnitAlerts = computed(() => {
  if (!activeWorkplaceId.value) return activeAlerts.value
  return activeAlerts.value.filter(alert => String(alert?.workplace_id) === String(activeWorkplaceId.value))
})

const clampPercent = (value) => {
  const num = Number(value || 0)
  if (Number.isNaN(num)) return 0
  return Math.max(0, Math.min(num, 100))
}

const machineTrsValue = (machine) => {
  const direct = machine?.oee?.global ?? machine?.trs ?? machine?.oee_global
  return clampPercent(direct)
}

const averageMachineOee = (machineList, fallback) => {
  const values = {
    trs: [],
    availability: [],
    performance: [],
    quality: []
  }

  machineList.forEach((machine) => {
    const trs = machine?.oee?.global ?? machine?.trs ?? machine?.oee_global
    const availability = machine?.oee?.availability ?? machine?.availability ?? machine?.disponibilite
    const performance = machine?.oee?.performance ?? machine?.performance
    const quality = machine?.oee?.quality ?? machine?.quality ?? machine?.qualite

    if (trs != null) values.trs.push(clampPercent(trs))
    if (availability != null) values.availability.push(clampPercent(availability))
    if (performance != null) values.performance.push(clampPercent(performance))
    if (quality != null) values.quality.push(clampPercent(quality))
  })

  const averageOrFallback = (key) => {
    const nums = values[key]
    if (!nums.length) return fallback[key]
    return nums.reduce((sum, value) => sum + value, 0) / nums.length
  }

  return {
    trs: averageOrFallback('trs'),
    availability: averageOrFallback('availability'),
    performance: averageOrFallback('performance'),
    quality: averageOrFallback('quality')
  }
}

const machineDetailsByName = {
  'Volvo A25G': {
    type: 'Dumper articulé', line: 'Ligne Process', availability: 78, utilization: 52, mtbf: 96, mttr: 8.4,
    lastMaintenance: '22 avril 2026', nextMaintenance: '30 avril 2026', alertMessage: 'Maintenance préventive en cours', alertTone: 'warn'
  },
  'Caterpillar 320 GC': {
    type: 'Pelle hydraulique', line: 'Ligne Process', availability: 94, utilization: 77, mtbf: 225, mttr: 3.1,
    lastMaintenance: '14 avril 2026', nextMaintenance: '05 mai 2026', alertMessage: 'Fonctionnement nominal', alertTone: 'success'
  },
  'Komatsu PC200-8': {
    type: 'Pelle hydraulique', line: 'Ligne Process', availability: 92, utilization: 75, mtbf: 210, mttr: 3.8,
    lastMaintenance: '12 avril 2026', nextMaintenance: '07 mai 2026', alertMessage: 'Aucune alerte critique détectée', alertTone: 'success'
  },
  'JCB 3CX': {
    type: 'Tractopelle', line: 'Ligne Process', availability: 89, utilization: 70, mtbf: 172, mttr: 4.4,
    lastMaintenance: '10 avril 2026', nextMaintenance: '02 mai 2026', alertMessage: 'Niveau hydraulique à surveiller', alertTone: 'warn'
  },
  'CNC-001': {
    type: 'Machine CNC', line: 'Ligne Usinage', availability: 97, utilization: 83, mtbf: 260, mttr: 2.2,
    lastMaintenance: '20 avril 2026', nextMaintenance: '11 mai 2026', alertMessage: 'Production stable', alertTone: 'success'
  },
  'CNC-007': {
    type: 'Machine CNC', line: 'Ligne Usinage', availability: 95, utilization: 80, mtbf: 241, mttr: 2.6,
    lastMaintenance: '18 avril 2026', nextMaintenance: '08 mai 2026', alertMessage: 'Aucune dérive de qualité', alertTone: 'success'
  },
  'ROBOT-002': {
    type: 'Robot de palettisation', line: 'Conditionnement', availability: 76, utilization: 49, mtbf: 120, mttr: 7.7,
    lastMaintenance: '24 avril 2026', nextMaintenance: '29 avril 2026', alertMessage: 'Cellule robot en maintenance curative', alertTone: 'warn'
  },
  'ROBOT-008': {
    type: 'Robot de palettisation', line: 'Conditionnement', availability: 63, utilization: 31, mtbf: 88, mttr: 9.2,
    lastMaintenance: '15 avril 2026', nextMaintenance: '28 avril 2026', alertMessage: 'Machine à l’arrêt en attente de pièce', alertTone: 'danger'
  }
}

const scopedMachines = computed(() => {
  if (activeWorkplaceId.value) return activeUnitMachines.value || []
  return machines.value || []
})

const processLineMachines = computed(() => {
  const source = scopedMachines.value || []
  return source.slice(0, 6)
})

const conditioningLineMachines = computed(() => {
  const source = scopedMachines.value || []
  return source.slice(0, 5)
})

const lineTrsCards = computed(() => {
  const availability = clampPercent(oeeReport.value?.availability || 0)
  const performance  = clampPercent(oeeReport.value?.performance || 0)
  const quality      = clampPercent(oeeReport.value?.quality || 0)
  const dashboardTRS = clampPercent(oeeReport.value?.global ?? ((availability * performance * quality) / 10000))
  const globalMetrics = {
    trs: dashboardTRS,
    availability,
    performance,
    quality
  }
  const processMetrics = averageMachineOee(processLineMachines.value, globalMetrics)
  const conditioningMetrics = averageMachineOee(conditioningLineMachines.value, globalMetrics)

  return [
    {
      key: 'process',
      title: 'TRS - Ligne Process',
      ...processMetrics,
      tone: 'tone-process'
    },
    {
      key: 'conditioning',
      title: 'TRS - Ligne Conditionnement',
      ...conditioningMetrics,
      tone: 'tone-conditioning'
    },
    {
      key: 'global',
      title: 'TRS Global',
      ...globalMetrics,
      tone: 'tone-global'
    }
  ]
})

const siteTrsCards = computed(() => {
  const unitGlobalCards = dashboardUnits.value
    .map(unit => (unit.trs_cards || []).find(card => card.key === 'global'))
    .filter(Boolean)

  if (unitGlobalCards.length) {
    const average = (field) => {
      const values = unitGlobalCards.map(card => Number(card[field] || 0)).filter(value => value > 0)
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
    }
    const fromUnits = {
      key: 'site-global',
      title: 'TRS Global Site',
      trs: average('trs'),
      availability: average('availability'),
      performance: average('performance'),
      quality: average('quality'),
      tone: 'tone-global'
    }
    if (fromUnits.trs > 0 || !lineTrsCards.value[2]?.trs) return [fromUnits]
  }

  return [
    {
      ...lineTrsCards.value[2],
      key: 'site-global',
      title: 'TRS Global Site',
    }
  ]
})

const activeUnitTrsCards = computed(() => {
  const cards = activeUnitSummary.value?.trs_cards || []
  if (cards.length) {
    return cards.map((card) => ({
      ...card,
      tone: card.key === 'process' ? 'tone-process' : card.key === 'conditioning' ? 'tone-conditioning' : 'tone-global',
      title: String(card.title || '').replace(' - ', ' — '),
    }))
  }
  return [
    { ...lineTrsCards.value[0], title: 'TRS — Ligne Process' },
    { ...lineTrsCards.value[1], title: 'TRS — Ligne Conditionnement' },
    { ...lineTrsCards.value[2], title: `TRS Global — ${activeUnitTab.value?.label || 'Unité'}` },
  ]
})

// Méthodes utilitaires
const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  return date.toLocaleDateString('fr-FR')
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Helper functions for native date input
const formatDateForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const updateDeadline = (event) => {
  newOrder.value.deadline = event.target.value ? new Date(event.target.value) : null
}

const getOEEClass = (oee) => {
  if (oee >= 85) return 'excellent'
  if (oee >= 65) return 'good'
  if (oee >= 40) return 'average'
  return 'poor'
}

const getCapacityClass = (capacity) => {
  if (capacity >= 90) return 'critical' // Surcharge
  if (capacity >= 75) return 'high'     // Charge élevée
  if (capacity >= 50) return 'optimal'  // Charge optimale
  if (capacity >= 25) return 'low'      // Charge faible
  return 'very-low'                      // Sous-utilisation
}

const getOrderStatusLabel = (status) => {
  const labels = {
    'planifie': 'Planifié',
    'en_cours': 'En cours',
    'termine': 'Terminé',
    'annule': 'Annulé'
  }
  return labels[status] || status
}

const getMachineStatusLabel = (status) => {
  const labels = {
    'ACTIVE': 'Actif', 'OPERATIONAL': 'Operationnel', 'INACTIVE': 'Inactif',
    'MAINTENANCE': 'Maintenance', 'BREAKDOWN': 'Panne', 'DEGRADED': 'Degrade',
    'STOPPED': 'Arrete', 'OUT_OF_ORDER': 'Hors service',
  }
  return labels[status] || status
}

const getMachineStatusClass = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (['ACTIVE', 'OPERATIONAL'].includes(normalized)) return 'status-success'
  if (['MAINTENANCE', 'DEGRADED'].includes(normalized)) return 'status-warn'
  if (['BREAKDOWN', 'OUT_OF_ORDER'].includes(normalized)) return 'status-danger'
  return 'status-secondary'
}

const formatComputedAt = (isoDate) => {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    const now = new Date()
    const diffMin = Math.floor((now - d) / 60000)
    if (diffMin < 1) return "à l'instant"
    if (diffMin < 60) return `il y a ${diffMin} min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `il y a ${diffH}h`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

const getStatusSeverity = (status) => {
  const map = {
    'ACTIVE': 'success', 'OPERATIONAL': 'success', 'INACTIVE': 'secondary',
    'MAINTENANCE': 'warn', 'BREAKDOWN': 'danger', 'DEGRADED': 'warn',
    'STOPPED': 'secondary', 'OUT_OF_ORDER': 'danger',
  }
  return map[status] || 'info'
}

const getAlertIcon = (type) => {
  const icons = {
    'temperature': 'pi pi-sun',  // Utiliser pi-sun au lieu de pi-thermometer
    'pressure': 'pi pi-gauge',
    'quality': 'pi pi-shield',
    'maintenance': 'pi pi-wrench',
    'safety': 'pi pi-exclamation-triangle'
  }
  return icons[type] || 'pi pi-info-circle'
}

const getTagSeverityFromChip = (chipClass) => {
  if (chipClass === 'status-success') return 'success'
  if (chipClass === 'status-warn') return 'warning'
  if (chipClass === 'status-danger') return 'danger'
  return 'secondary'
}

const openMachineDetails = (machine) => {
  const alertsCount = Number(machine.alerts_count || machine.alerts?.length || 0)
  selectedMachineDetails.value = {
    name: machine.name,
    status: getMachineStatusLabel(machine.status),
    tagSeverity: getStatusSeverity(machine.status),
    type: machine.type || 'Machine industrielle',
    line: machine.line_name || machine.location_name || machine.workplace_name || 'Ligne non renseignée',
    availability: Number(machine.oee?.availability ?? machine.disponibilite ?? 0).toFixed(1),
    utilization: Number(machine.realization_rate || 0).toFixed(1),
    performance: Number(machine.oee?.performance ?? machine.performance ?? 0).toFixed(1),
    quality: Number(machine.oee?.quality ?? machine.qualite ?? 0).toFixed(1),
    trs: machineTrsValue(machine).toFixed(1),
    targetTrs: machine.target_trs != null ? Number(machine.target_trs).toFixed(1) : '-',
    targetRealization: machine.target_realization != null ? Number(machine.target_realization).toFixed(1) : '-',
    cadence: machine.cadence ? `${machine.cadence} ${machine.cadence_unit || ''}`.trim() : '-',
    plannedQuantity: machine.planned_quantity || 0,
    actualQuantity: machine.actual_quantity || 0,
    goodPieces: machine.good_pieces ?? '-',
    scrapPieces: machine.scrap_pieces ?? '-',
    plannedDowntime: machine.planned_downtime != null ? Math.round(machine.planned_downtime / 60) : '-',
    unplannedDowntime: machine.unplanned_downtime != null ? Math.round(machine.unplanned_downtime / 60) : '-',
    operator: machine.operator_label || '-',
    orderStatus: machine.order_status_label || '-',
    alertMessage: alertsCount ? `${alertsCount} alerte(s) KPI active(s)` : 'Aucune alerte KPI active',
    alertTone: alertsCount ? 'warn' : 'success'
  }
  showMachineDetailsDialog.value = true
}

const isStockRuptureAlert = (alert) => {
  const content = `${alert?.type || ''} ${alert?.category || ''} ${alert?.title || ''} ${alert?.message || ''}`.toLowerCase()
  return /rupture|stock|piece|pi[eè]ce|inventaire|spare/.test(content)
}

const isCriticalAlert = (alert) => {
  return String(alert?.severity || '').toLowerCase() === 'critical'
}

const buildSidebarNotificationFromAlert = (alert) => {
  const isStockAlert = isStockRuptureAlert(alert)
  const suffix = alert?.id ?? `${alert?.machine_name || 'machine'}-${alert?.timestamp || alert?.created_at || alert?.message || 'event'}`

  return {
    id: `mes-alert-${suffix}`,
    notification_type: isStockAlert ? 'STOCK' : 'ALERT',
    severity: isStockAlert ? 'warning' : (alert?.severity || 'critical'),
    title: isStockAlert ? 'Rupture de stock pièce' : 'Alerte critique machine',
    message: alert?.message || `Alerte détectée sur ${alert?.machine_name || 'une machine'}`,
    created_at: alert?.timestamp || alert?.created_at || new Date().toISOString(),
    read: false,
    metadata: {
      source: 'mes-alert',
      machine_name: alert?.machine_name || null,
      category: isStockAlert ? 'Stock critique' : 'Alerte critique',
      link: '/mes'
    }
  }
}

const syncSidebarNotificationsFromAlerts = (alertsList = []) => {
  alertsList
    .filter(alert => isCriticalAlert(alert) || isStockRuptureAlert(alert))
    .forEach(alert => notificationsStore.addNotification(buildSidebarNotificationFromAlert(alert)))
}

// Actions
const getPeriodParams = () => {
  if (selectedPeriod.value === 'custom' && customStartDate.value && customEndDate.value) {
    return { start_date: customStartDate.value, end_date: customEndDate.value }
  }
  return { period: selectedPeriod.value }
}

const loadMESData = async () => {
  loading.value = true
  try {
    const params = getPeriodParams()
    await mesStore.getDashboard(params)
    await Promise.allSettled([
      mesStore.getMachinesStatus(),
      mesStore.getActiveAlerts(),
      mesStore.getWorkOrders(),
      mesStore.getSessions(),
    ])

    syncSidebarNotificationsFromAlerts(activeAlerts.value)
  } catch {
    error.value = 'Erreur lors du chargement des données MES'
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données MES', life: 5000 })
  } finally {
    loading.value = false
  }
}

const onPeriodChange = () => {
  if (selectedPeriod.value !== 'custom') {
    loadMESData()
  }
}

const lastHandledImportTimestamp = ref(null)

const handleMesImportEvent = async (event) => {
  if (!event || event.type !== 'mes' || event.timestamp === lastHandledImportTimestamp.value) {
    return
  }
  lastHandledImportTimestamp.value = event.timestamp
  toast.add({
    severity: 'info',
    summary: 'Import MES détecté',
    detail: 'Les données MES ont été mises à jour. Rafraîchissement en cours...',
    life: 3000
  })
  await loadWorkplacesTabs()
  await loadMESData()

  // Try to detect workplace from import payload and switch tab
  try {
    const filename = event?.data?.file?.name || event?.data?.sourceFile || ''
    const payloadData = event?.data?.data || event?.data || {}

    const normalize = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, '')
    const fname = normalize(filename)

    const touchedWorkplaces = payloadData.touched_workplaces || payloadData.created_workplaces || []
    for (const workplace of touchedWorkplaces) {
      const found = mesTabs.value.find(tt =>
        (tt.workplaceId && String(tt.workplaceId) === String(workplace.id)) ||
        normalize(tt.label) === normalize(workplace.name)
      )
      if (found) {
        activeTab.value = found.id
        return
      }
    }

    // check tabs for label match
    for (const t of mesTabs.value) {
      if (!t.workplaceId) continue
      const label = normalize(t.label)
      if (label && (fname.includes(label) || fname.includes(label.replace('unite', 'u')))) {
        activeTab.value = t.id
        return
      }
    }

    // fallback: try to read workplace from payloadData (various possible paths)
    const possible = [payloadData.workplace, payloadData.workplace_name, payloadData.workplaceName, payloadData.sourceWorkplace]
    for (const p of possible) {
      if (!p) continue
      const np = normalize(p)
      const found = mesTabs.value.find(tt => normalize(tt.label) === np || (tt.workplaceId && String(tt.workplaceId) === String(p)))
      if (found) { activeTab.value = found.id; return }
    }
  } catch (e) {
    // ignore detection errors
  }
}

watch(
  () => importEventsStore.lastImportEvent?.timestamp,
  () => {
    handleMesImportEvent(importEventsStore.lastImportEvent)
  }
)

const onCustomDateChange = () => {
  if (customStartDate.value && customEndDate.value) {
    loadMESData()
  }
}


const addMachineToSequence = () => {
  newOrder.value.machineSequence.push({
    machine: null,
    operator: '',
    estimatedDuration: 8,
    notes: ''
  })
}

const removeSequenceItem = (index) => {
  newOrder.value.machineSequence.splice(index, 1)
}

const moveSequenceItem = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= newOrder.value.machineSequence.length) return

  const item = newOrder.value.machineSequence[index]
  newOrder.value.machineSequence.splice(index, 1)
  newOrder.value.machineSequence.splice(newIndex, 0, item)
}

const createNewOrder = async () => {
  // Validation des champs obligatoires
  if (!newOrder.value.reference?.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Champ manquant',
      detail: 'La référence est obligatoire',
      life: 3000
    })
    return
  }

  if (!newOrder.value.workplace) {
    toast.add({
      severity: 'warn',
      summary: 'Champ manquant',
      detail: 'Le poste de travail est obligatoire',
      life: 3000
    })
    return
  }

  if (!newOrder.value.product) {
    toast.add({
      severity: 'warn',
      summary: 'Champ manquant',
      detail: 'Le produit est obligatoire',
      life: 3000
    })
    return
  }

  if (!newOrder.value.planned_quantity || newOrder.value.planned_quantity < 1) {
    toast.add({
      severity: 'warn',
      summary: 'Quantité invalide',
      detail: 'La quantité planifiée doit être au moins 1',
      life: 3000
    })
    return
  }

  // Valider les machines dans la séquence
  for (let i = 0; i < newOrder.value.machineSequence.length; i++) {
    if (!newOrder.value.machineSequence[i].machine) {
      toast.add({
        severity: 'warn',
        summary: 'Machine manquante',
        detail: `Veuillez sélectionner une machine pour l'étape ${i + 1}`,
        life: 3000
      })
      return
    }
  }

  creating.value = true
  try {
    // Créer l'ordre via le store (seulement les champs de base)
    const orderData = {
      reference: newOrder.value.reference,
      workplace: newOrder.value.workplace,
      product: newOrder.value.product,
      planned_quantity: newOrder.value.planned_quantity
    }

    const createdOrder = await mesStore.createWorkOrder(orderData)

    // Créer les sessions pour chaque machine de la séquence
    if (newOrder.value.machineSequence.length > 0) {
      for (const [index, item] of newOrder.value.machineSequence.entries()) {
        try {
          const sessionRef = `${createdOrder.reference}-S${index + 1}`

          const sessionData = {
            reference: sessionRef,
            workplace: newOrder.value.workplace,
            workorder: createdOrder.id,
            machine: item.machine,
            started_at: new Date().toISOString(),
            status: 'OPEN',
            shift_code: item.operator || null,
            batch_number: `BATCH-${Date.now()}-${index + 1}`
          }

          await axiosInstance.post('/engins/sessions/', sessionData)
        } catch (sessionErr) {
          console.error('Error creating session:', sessionErr)
          toast.add({
            severity: 'warn',
            summary: 'Attention',
            detail: `Erreur lors de la création de la session ${index + 1}: ${sessionErr.response?.data?.message || sessionErr.message}`,
            life: 5000
          })
        }
      }
    }

    const primaryMachine = newOrder.value.machineSequence[0]?.machine
    if (primaryMachine) {
      await axiosInstance.post(`/engins/work-orders/${createdOrder.id}/record_mes_data/`, {
        machine: primaryMachine,
        date: newOrder.value.date,
        actual_quantity: newOrder.value.actual_quantity || 0,
        good_pieces: newOrder.value.good_pieces || newOrder.value.actual_quantity || 0,
        scrap_pieces: newOrder.value.scrap_pieces || 0,
        cadence: newOrder.value.cadence,
        cadence_unit: newOrder.value.cadence_unit,
        line_name: newOrder.value.line_name,
        location_name: newOrder.value.location_name,
        machine_status: newOrder.value.machine_status,
        order_status: newOrder.value.order_status,
        planned_time_minutes: newOrder.value.planned_time_minutes,
        planned_downtime_minutes: newOrder.value.planned_downtime_minutes,
        unplanned_downtime_minutes: newOrder.value.unplanned_downtime_minutes,
        operator: newOrder.value.operator || newOrder.value.machineSequence[0]?.operator || '',
        target_oee: newOrder.value.target_oee,
        target_realization: newOrder.value.target_realization,
      })
    }

    toast.add({
      severity: 'success',
      summary: 'Ordre créé',
      detail: `L'ordre de production a été créé${newOrder.value.machineSequence.length > 0 ? ` avec ${newOrder.value.machineSequence.length} session(s)` : ''}`,
      life: 3000
    })

    showCreateOrderDialog.value = false
    resetForm()

    // Recharger les données
    await mesStore.getWorkOrders()
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err.response?.data?.message || err.response?.data?.error || 'Impossible de créer l\'ordre',
      life: 5000
    })
  } finally {
    creating.value = false
  }
}

const resetForm = () => {
  newOrder.value = {
    reference: '',
    product: null,
    planned_quantity: 1,
    actual_quantity: 0,
    good_pieces: 0,
    scrap_pieces: 0,
    workplace: null,
    priority: 'normal',
    deadline: null,
    date: new Date().toISOString().split('T')[0],
    cadence: null,
    cadence_unit: 'tonne/h',
    line_name: '',
    location_name: '',
    machine_status: 'ACTIVE',
    order_status: 'en_cours',
    planned_time_minutes: 1440,
    planned_downtime_minutes: 30,
    unplanned_downtime_minutes: 0,
    operator: '',
    target_oee: 80,
    target_realization: 90,
    notes: '',
    machineSequence: []
  }
}

// Charger les options pour les dropdowns
const loadFormOptions = async () => {
  loadingOptions.value = true
  try {
    // Charger les postes de travail (endpoint corrigé)
    const workplacesResponse = await axiosInstance.get('/accounts/workplaces/')

    // Traiter les postes de travail
    const workplacesData = workplacesResponse.data?.data || workplacesResponse.data?.results || workplacesResponse.data || []
    if (Array.isArray(workplacesData)) {
      workplaceOptions.value = workplacesData.map(w => ({
        label: w.name,
        value: w.id
      }))
    }

    await loadProducts()

    // Charger les machines disponibles
    try {
      const machinesResponse = await axiosInstance.get('/engins/machines/?type=MACHINE')
      // L'endpoint DRF retourne soit un array, soit { results: [...] }
      const machinesData = Array.isArray(machinesResponse.data)
        ? machinesResponse.data
        : machinesResponse.data.results || machinesResponse.data.data || []

      machineOptions.value = machinesData
        .filter(m => m.status === 'ACTIVE')
        .map(m => ({
          label: m.name || m.nom,
          value: m.id
        }))
    } catch (machineErr) {
      console.error('Could not load machines:', machineErr)
    }

    // Vérifier si des options sont vides
    if (workplaceOptions.value.length === 0 || productOptions.value.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Données manquantes',
        detail: 'Aucun poste de travail ou produit trouvé. Créez-les d\'abord dans la section Collect.',
        life: 7000
      })
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les options du formulaire',
      life: 5000
    })
  } finally {
    loadingOptions.value = false
  }
}

const startOrder = async (orderId) => {
  const order = productionOrders.value.find(o => o.id === orderId)
  if (order) {
    order.status = 'en_cours'
    toast.add({
      severity: 'success',
      summary: 'Ordre démarré',
      detail: 'L\'ordre de production a été démarré',
      life: 3000
    })
  }
}

const completeOrder = async (orderId) => {
  const order = productionOrders.value.find(o => o.id === orderId)
  if (order) {
    order.status = 'termine'
    order.progress = 100
    order.produced_quantity = order.planned_quantity
    toast.add({
      severity: 'success',
      summary: 'Ordre terminé',
      detail: 'L\'ordre de production a été marqué comme terminé',
      life: 3000
    })
  }
}

const viewOrderDetails = async (order) => {
  selectedOrder.value = order
  orderSessions.value = []

  // Charger les sessions de cet ordre
  try {
    const sessionsResponse = await axiosInstance.get(`/engins/sessions/?workorder=${order.id}`)
    // L'endpoint DRF retourne soit un array, soit { results: [...] }
    orderSessions.value = Array.isArray(sessionsResponse.data)
      ? sessionsResponse.data
      : sessionsResponse.data.results || sessionsResponse.data.data || []
  } catch (err) {
    console.error('Error loading sessions:', err)
  }

  showOrderDetailsDialog.value = true
}

const openCreateSessionDialog = async () => {
  // Charger les machines disponibles
  if (machineOptions.value.length === 0) {
    try {
      const machinesResponse = await axiosInstance.get('/engins/machines/?type=MACHINE')
      // L'endpoint DRF retourne soit un array, soit { results: [...] }
      const machinesData = Array.isArray(machinesResponse.data)
        ? machinesResponse.data
        : machinesResponse.data.results || machinesResponse.data.data || []

      machineOptions.value = machinesData
        .filter(m => m.status === 'ACTIVE')
        .map(m => ({
          label: m.name || m.nom,
          value: m.id
        }))
    } catch (err) {
      console.error('Error loading machines:', err)
    }
  }

  showCreateSessionDialog.value = true
}

const createSession = async () => {
  if (!newSession.value.machine) {
    toast.add({
      severity: 'warn',
      summary: 'Machine requise',
      detail: 'Veuillez sélectionner une machine',
      life: 3000
    })
    return
  }

  creatingSession.value = true
  try {
    // Compter le nombre de sessions existantes pour cette commande
    const sessionNumber = orderSessions.value.length + 1
    const sessionRef = `${selectedOrder.value.reference}-S${sessionNumber}`

    const sessionData = {
      reference: sessionRef,
      workplace: selectedOrder.value.workplace,
      workorder: selectedOrder.value.id,
      machine: newSession.value.machine,
      started_at: new Date().toISOString(),
      status: 'OPEN',
      shift_code: newSession.value.operator_note || null,
      batch_number: `BATCH-${Date.now()}`
    }

    const response = await axiosInstance.post('/engins/sessions/', sessionData)
    // DRF retourne directement l'objet cree
    const createdSession = response.data.data || response.data

    toast.add({
      severity: 'success',
      summary: 'Session creee',
      detail: 'La session de production a été créée avec succès',
      life: 3000
    })

    // Recharger les sessions
    orderSessions.value.push(createdSession)
    showCreateSessionDialog.value = false
    newSession.value = { machine: null, operator_note: '' }

    // Recharger les ordres pour mettre a jour les infos
    await mesStore.getWorkOrders()
  } catch (err) {
    console.error('Session error details:', err.response?.data)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err.response?.data?.message || err.response?.data?.error || 'Impossible de créer la session',
      life: 5000
    })
  } finally {
    creatingSession.value = false
  }
}

const calculateDuration = (start, end) => {
  const diff = new Date(end) - new Date(start)
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}min`
}

const acknowledgeAlert = async (alertId) => {
  const alert = alerts.value.find(a => a.id === alertId)
  if (alert) {
    alert.acknowledged = true
    toast.add({
      severity: 'info',
      summary: 'Alerte acquittée',
      detail: 'L\'alerte a été acquittée',
      life: 3000
    })
  }
}

const resolveAlert = async (alertId) => {
  const alertIndex = alerts.value.findIndex(a => a.id === alertId)
  if (alertIndex !== -1) {
    alerts.value.splice(alertIndex, 1)
    toast.add({
      severity: 'success',
      summary: 'Alerte résolue',
      detail: 'L\'alerte a été résolue',
      life: 3000
    })
  }
}

// Watchers
watch(showCreateOrderDialog, async (newValue) => {
  if (newValue) {
    await loadFormOptions()
  } else {
    resetForm()
  }
})

watch(activeAlerts, (newAlerts) => {
  syncSidebarNotificationsFromAlerts(newAlerts || [])
}, { deep: true })

// Lifecycle
onMounted(async () => {
  navigationStore.setActiveSection('mes')
  await loadWorkplacesTabs()
  await loadMESData()
  await handleMesImportEvent(importEventsStore.lastImportEvent)
})
</script>

<style scoped>
.mes-page {
  min-height: 100vh;
  background: #f3f5f7;
}

.mes-hero-shell {
  background: #082c3f;
  color: #e2edf4;
}

.shell-top {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.85rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.shell-brand h2 {
  margin: 0;
  color: #79cc43;
  font-size: 1.65rem;
  letter-spacing: 0.02em;
}

.shell-brand p {
  margin: 0.15rem 0 0;
  font-size: 0.87rem;
  color: #b6c6d1;
}

.shell-status {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.status-pill-live {
  border: 1px solid #2d7f4f;
  color: #8fe65a;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(31, 115, 70, 0.15);
}

.status-pill-live i {
  font-size: 0.5rem;
}

.status-user {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #7AC943;
  color: #0B2B3C;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.status-name {
  font-size: 0.9rem;
}

.shell-tabs {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.25rem;
  display: flex;
  gap: 0.4rem;
}

.unit-tab {
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #b9c9d3;
  font-size: 0.9rem;
  padding: 0.65rem 0.8rem;
  cursor: pointer;
}

.unit-tab.active {
  color: #86dc4f;
  border-bottom-color: #86dc4f;
}

.senico-trs-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 0.9rem;
}

.senico-trs-card {
  border: 1px solid #d6e1ea;
  border-radius: 14px;
  padding: 1rem 1.1rem;
  background: #ffffff;
}

.senico-trs-card.tone-process {
  background: #dfe9f3;
  border-color: #b8cfe3;
}

.senico-trs-card.tone-conditioning {
  background: #f4ead9;
  border-color: #e6bf73;
}

.senico-trs-card.tone-global {
  background: #0a3347;
  border-color: #145f7e;
  color: #d9eefa;
}

.senico-trs-title {
  font-size: 0.88rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 0.35rem;
  letter-spacing: 0.03em;
}

.senico-trs-value {
  font-size: 2.55rem;
  line-height: 1;
  margin-bottom: 0.7rem;
  color: #205ea4;
  font-weight: 800;
}

.tone-conditioning .senico-trs-value {
  color: #b26d11;
}

.tone-global .senico-trs-value {
  color: #74da45;
}

.senico-trs-breakdown {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  margin-bottom: 0.55rem;
}

.senico-trs-breakdown span {
  display: block;
  font-size: 0.73rem;
  opacity: 0.85;
}

.senico-trs-breakdown strong {
  font-size: 0.96rem;
}

.senico-trs-track {
  height: 5px;
  background: rgba(148, 163, 184, 0.3);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.45rem;
}

.senico-trs-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 999px;
}

.tone-conditioning .senico-trs-fill {
  background: #f59e0b;
}

.tone-global .senico-trs-fill {
  background: #74da45;
}

.senico-trs-note {
  font-size: 0.73rem;
  opacity: 0.78;
  font-style: italic;
}

.senico-stats-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.senico-stat-card {
  background: #ffffff;
  border: 1px solid #dfe6ec;
  border-radius: 12px;
  padding: 0.8rem 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.senico-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #dff2e9;
  color: #178f63;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.senico-stat-icon.blue { background: #dbeafe; color: #1d4ed8; }
.senico-stat-icon.amber { background: #fef3c7; color: #b45309; }
.senico-stat-icon.green { background: #e4f8dd; color: #5aa02c; }

.senico-stat-value {
  font-size: 2rem;
  line-height: 1;
  color: #08253b;
  font-weight: 800;
}

.senico-stat-value small {
  font-size: 1.45rem;
  color: #6b7280;
  font-weight: 600;
}

.senico-stat-value.amber {
  color: #b45309;
}

.taux-excellent { color: #16a34a; }
.taux-good      { color: #0284c7; }
.taux-average   { color: #b45309; }
.taux-poor      { color: #dc2626; }

.senico-stat-label {
  font-size: 0.82rem;
  color: #64748b;
}

.senico-lines-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
  margin-bottom: 1rem;
}

.line-panel {
  border: 1px solid #dde5eb;
  background: #ffffff;
  border-radius: 14px;
  padding: 0.85rem 1rem;
}

.line-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.line-panel-head h3 {
  margin: 0;
  font-size: 1rem;
  color: #08253b;
}

.line-panel-head span {
  background: #f3f4f6;
  color: #64748b;
  font-size: 0.72rem;
  border-radius: 10px;
  padding: 0.18rem 0.6rem;
}

.line-rows {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.line-row {
  display: grid;
  grid-template-columns: 130px 1fr 36px;
  align-items: center;
  gap: 0.7rem;
}

.line-machine-name {
  font-size: 0.92rem;
  color: #0f172a;
}

.line-machine-track {
  height: 7px;
  background: #eceff1;
  border-radius: 999px;
  overflow: hidden;
}

.line-machine-fill {
  height: 100%;
  background: #73c842;
  border-radius: 999px;
}

.line-machine-fill.amber {
  background: #e39a23;
}

.line-machine-val {
  font-size: 0.95rem;
  font-weight: 700;
  color: #4d7c0f;
}

.line-machine-val.amber {
  color: #b45309;
}
/* ── État des machines ── */
.machines-state-section {
  margin-top: 1.5rem;
}
.machines-state-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 0.75rem;
}

/* card */
.machine-state-item {
  border-radius: 14px;
  background: #ffffff;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04);
  border: 1.5px solid #e2e8f0;
  transition: box-shadow 0.2s, transform 0.2s;
  cursor: default;
}
.machine-state-item:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}
/* left accent by status */
.machine-state-item.status-success { border-left: 4px solid #22c55e; }
.machine-state-item.status-warn    { border-left: 4px solid #f59e0b; }
.machine-state-item.status-danger  { border-left: 4px solid #ef4444; }
.machine-state-item.status-secondary { border-left: 4px solid #94a3b8; }

/* top row */
.msi-top {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}
.msi-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.msi-icon {
  font-size: 1.1rem;
  color: #0B2B3C;
}
.msi-info {
  flex: 1;
  min-width: 0;
}
.msi-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.3rem;
  line-height: 1.2;
}
/* badge */
.msi-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.18rem 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.msi-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.msi-chip.status-success { background: #dcfce7; color: #166534; }
.msi-chip.status-success .msi-dot { background: #22c55e; }
.msi-chip.status-warn    { background: #fef3c7; color: #92400e; }
.msi-chip.status-warn .msi-dot    { background: #f59e0b; }
.msi-chip.status-danger  { background: #fee2e2; color: #991b1b; }
.msi-chip.status-danger .msi-dot  { background: #ef4444; }
.msi-chip.status-secondary { background: #e2e8f0; color: #334155; }
.msi-chip.status-secondary .msi-dot { background: #94a3b8; }

/* divider */
.msi-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 0.75rem 0;
}

/* metrics */
.msi-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.msi-metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.73rem;
}
.msi-metric-label {
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.msi-metric-label .pi {
  font-size: 0.7rem;
}
.msi-metric-nodata {
  color: #cbd5e1;
  font-style: italic;
  font-size: 0.7rem;
}
.msi-actions {
  margin-top: 0.65rem;
  display: flex;
  justify-content: flex-end;
}
.machine-state-empty {
  color: #64748b;
  font-size: 0.9rem;
}

.machines-detail-hint {
  display: inline-flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.machine-detail-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #3b82f6;
  text-decoration: none;
  margin-top: 0.4rem;
  transition: color 0.2s;
}

.machine-detail-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.machine-details-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.machine-details-hero {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.95rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #edf5ff 100%);
  border: 1px solid #dbeafe;
}

.machine-details-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #0B2B3C;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.machine-details-hero h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #0f172a;
}

.machine-details-hero p {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

.machine-details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.machine-detail-field {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 0.8rem;
  background: #ffffff;
}

.machine-detail-field label {
  display: block;
  font-size: 0.77rem;
  color: #64748b;
  margin-bottom: 0.22rem;
}

.machine-detail-field strong {
  color: #0f172a;
  font-size: 0.95rem;
}

.machine-alert-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  font-size: 0.88rem;
  font-weight: 600;
}

.machine-alert-banner.success {
  background: #dcfce7;
  color: #166534;
}

.machine-alert-banner.warn {
  background: #fef3c7;
  color: #92400e;
}

.machine-alert-banner.danger {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 768px) {
  .machine-details-grid {
    grid-template-columns: 1fr;
  }
}

/* Page Header */
.page-header {
  background: #FFFFFF;
  border-bottom: 1px solid #f1f5f9;
  padding: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #0B2B3C;
  margin: 0 0 0.5rem 0;
  font-family: 'Inter', sans-serif;
}

.page-subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
  font-weight: 400;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.period-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.period-tabs {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 3px;
}

.period-tab {
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: #64748b;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.period-tab:hover { color: #1e293b; }

.period-tab--active {
  background: white;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.period-date {
  font-size: 0.78rem;
  padding: 0.3rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #475569;
  width: 125px;
}

.period-date:focus { border-color: #7AC943; outline: none; }

.period-sep { color: #94a3b8; font-size: 0.8rem; }

@media (max-width: 768px) {
  .header-content { flex-direction: column; gap: 1rem; }
  .header-actions { flex-wrap: wrap; }
  .period-selector { flex-wrap: wrap; }
}

.create-btn {
  background: #7AC943 !important;
  border: none !important;
  color: #FFFFFF !important;
  font-weight: 600 !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 10px !important;
  transition: all 0.2s ease !important;
}

.create-btn:hover {
  background: #65a335 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(122, 201, 67, 0.3);
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f1f5f9;
  border-top: 4px solid #7AC943;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Main Content */
.mes-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* OEE Dashboard */
.oee-dashboard {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.main-oee {
  background: #0B2B3C;
  color: #FFFFFF;
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
}

.oee-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.oee-title { font-size: 1rem; font-weight: 600; margin: 0; }

.oee-period {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.5);
  margin-top: 0.15rem;
}

.oee-value {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1;
}

.oee-value.excellent { color: #7AC943; }
.oee-value.good { color: #3b82f6; }
.oee-value.average { color: #f59e0b; }
.oee-value.poor { color: #ef4444; }

.oee-breakdown {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.875rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.breakdown-item { text-align: center; flex: 1; }

.breakdown-label {
  display: block;
  font-size: 0.68rem;
  opacity: 0.5;
  margin-bottom: 0.2rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.breakdown-value { display: block; font-size: 1rem; font-weight: 600; }
.breakdown-value.availability { color: #7AC943; }
.breakdown-value.performance { color: #3b82f6; }
.breakdown-value.quality { color: #f59e0b; }

.oee-detail-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.625rem;
}

.oee-detail-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.oee-detail-label { font-size: 0.65rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.03em; }
.oee-detail-val { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.85); }
.oee-detail-val.trend-up { color: #7AC943; }
.oee-detail-val.trend-down { color: #ef4444; }

.oee-source {
  font-size: 0.65rem;
  color: rgba(255,255,255,0.3);
  text-align: right;
}

@media (max-width: 480px) {
  .oee-top { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .oee-breakdown { flex-direction: column; gap: 0.5rem; }
  .oee-detail-row { flex-wrap: wrap; }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.metric-card {
  background: #FFFFFF;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.metric-card:hover {
  border-color: #7AC943;
  box-shadow: 0 4px 6px rgba(122, 201, 67, 0.1);
  transform: translateY(-2px);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #FFFFFF;
  flex-shrink: 0;
}

.metric-icon.production {
  background: #7AC943;
}

.metric-icon.machines {
  background: #3b82f6;
}

.metric-icon.alerts {
  background: #f59e0b;
}

.metric-icon.output {
  background: #3b82f6;
}

.metric-icon.capacity {
  background: #06b6d4;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0B2B3C;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.metric-value.warning {
  color: #f59e0b;
}

.metric-value.critical {
  color: #dc2626;
}

.metric-value.high {
  color: #f59e0b;
}

.metric-value.optimal {
  color: #10b981;
}

.metric-value.low {
  color: #3b82f6;
}

.metric-value.very-low {
  color: #64748b;
}

.metric-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* Barre de charge capacitaire */
.capacity-bar {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.capacity-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.capacity-fill.critical {
  background: #dc2626;
}

.capacity-fill.high {
  background: #f59e0b;
}

.capacity-fill.optimal {
  background: #7AC943;
}

.capacity-fill.low {
  background: #3b82f6;
}

.capacity-fill.very-low {
  background: #64748b;
}

/* Sections */
.operations-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.9rem;
}

.orders-section {
  width: 100%;
}

.alerts-section {
  margin-bottom: 0;
}

.senico-panel {
  border: 1px solid #dde5eb;
  border-radius: 14px;
  padding: 0.9rem 1rem;
  background: #ffffff;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0B2B3C;
  margin: 0;
}

.section-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-dropdown {
  min-width: 180px;
}

.view-all-btn {
  color: #7AC943 !important;
  font-weight: 600 !important;
}

/* Orders Table */
.orders-table-wrap {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.orders-table thead tr {
  border-bottom: 2px solid #e2e8f0;
}

.orders-table th {
  padding: 0.6rem 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  white-space: nowrap;
}

.order-row {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}

.order-row:hover {
  background: #f8fafc;
}

.order-row.en_cours td:first-child {
  border-left: 3px solid #7AC943;
}

.order-row.planifie td:first-child {
  border-left: 3px solid #3b82f6;
}

.order-row.termine td:first-child {
  border-left: 3px solid #10b981;
}

.orders-table td {
  padding: 0.65rem 0.75rem;
  vertical-align: middle;
}

.order-ref {
  font-weight: 600;
  color: #0B2B3C;
  white-space: nowrap;
}

.order-product-name {
  color: #475569;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.status-badge.planifie {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge.en_cours {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.termine {
  background: #d1fae5;
  color: #059669;
}

.order-progress-cell {
  min-width: 130px;
}

.inline-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.inline-progress-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.inline-progress-fill {
  height: 100%;
  background: #7AC943;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.inline-progress-val {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0B2B3C;
  white-space: nowrap;
}

.inline-progress-qty {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.2rem;
}

.text-sm {
  font-size: 0.8125rem;
  color: #475569;
}

.text-muted {
  color: #94a3b8;
}

.order-row-actions {
  display: flex;
  gap: 0.25rem;
  white-space: nowrap;
}

.action-btn.primary {
  background: #7AC943 !important;
  border: none !important;
  color: #FFFFFF !important;
  width: 1.8rem !important;
  height: 1.8rem !important;
}

.action-btn.success {
  background: #10b981 !important;
  border: none !important;
  color: #FFFFFF !important;
  width: 1.8rem !important;
  height: 1.8rem !important;
}

.action-btn.secondary {
  color: #64748b !important;
  width: 1.8rem !important;
  height: 1.8rem !important;
}

/* Machines Grid */
.machines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

.machine-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  transition: border-color 0.15s;
}
.machine-card:hover { border-color: #7AC943; }

.mc-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.mc-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}

.mc-tag { font-size: 0.65rem !important; padding: 2px 8px !important; }

.mc-metrics {
  display: flex;
  gap: 0.75rem;
}

.mc-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.mc-val {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
}

.mc-val--muted { color: #cbd5e1; }

.mc-label {
  font-size: 0.65rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.mc-metric--empty { flex: 1; }

.metric-value {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #0B2B3C;
}

.metric-value.excellent {
  color: #7AC943;
}

.metric-value.good {
  color: #3b82f6;
}

.metric-value.average {
  color: #f59e0b;
}

.metric-value.poor {
  color: #ef4444;
}

.machine-order {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #64748b;
}

.machine-order i {
  color: #7AC943;
}

/* Alerts Section */
.alerts-list {
  background: #FFFFFF;
  border: 1px solid #eef2f6;
  border-radius: 12px;
  overflow: hidden;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s ease;
}

.alert-item:hover {
  background: #f8fafc;
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-item.warning {
  border-left: 4px solid #f59e0b;
}

.alert-item.error {
  border-left: 4px solid #ef4444;
}

.alert-item.info {
  border-left: 4px solid #3b82f6;
}

.alert-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.alert-item.warning .alert-icon {
  background: #fef3c7;
  color: #f59e0b;
}

.alert-item.error .alert-icon {
  background: #fee2e2;
  color: #ef4444;
}

.alert-item.info .alert-icon {
  background: #dbeafe;
  color: #3b82f6;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-message {
  font-size: 0.875rem;
  color: #0B2B3C;
  margin: 0 0 0.25rem 0;
  font-weight: 500;
}

.alert-details {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #64748b;
}

.alert-actions {
  display: flex;
  gap: 0.5rem;
}

.ack-btn, .resolve-btn {
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  border-radius: 6px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.ack-btn {
  color: #7AC943 !important;
  background: transparent !important;
  border: 1px solid #7AC943 !important;
}

.ack-btn:hover {
  background: #7AC943 !important;
  color: #FFFFFF !important;
}

.resolve-btn {
  color: #ef4444 !important;
  background: transparent !important;
  border: 1px solid #ef4444 !important;
}

.resolve-btn:hover {
  background: #ef4444 !important;
  color: #FFFFFF !important;
}

/* Error State */
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0B2B3C;
  margin: 0 0 0.5rem 0;
}

.error-content p {
  color: #64748b;
  margin: 0 0 1.5rem 0;
}

/* Dialog Styles */
.create-dialog :deep(.p-dialog-header) {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.create-dialog :deep(.p-dialog-title) {
  color: #0B2B3C;
  font-weight: 600;
}

.loading-options {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: #64748b;
}

.loading-options p {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #64748b;
}

.dialog-content {
  padding: 1.5rem 0;
}

.dialog-content.scrollable {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

/* Form Sections */
.form-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #0B2B3C;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
}

.section-title i {
  color: #7AC943;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header .section-title {
  margin: 0;
}

/* Machine Sequence */
.machine-sequence-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.machine-sequence-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  position: relative;
}

.sequence-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #7AC943;
  color: white;
  font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
}

.sequence-content {
  flex: 1;
}

.sequence-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.empty-sequence {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
  background: white;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
}

.empty-sequence i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #cbd5e1;
}

.empty-sequence p {
  margin: 0;
  font-size: 0.875rem;
}

.form-info-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #e0f2fe;
  border: 1px solid #7dd3fc;
  border-radius: 8px;
  margin-top: 1rem;
}

.form-info-box i {
  color: #0284c7;
  font-size: 1.125rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.form-info-box p {
  margin: 0;
  font-size: 0.875rem;
  color: #0c4a6e;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 1.5rem;
}

/* Order Details Dialog */
.order-details-content {
  max-height: 70vh;
  overflow-y: auto;
}

.details-section {
  margin-bottom: 2rem;
}

.details-section h3 {
  color: #0B2B3C;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.details-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.details-section .section-header h3 {
  margin: 0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.detail-field label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.detail-field p {
  margin: 0;
  color: #0B2B3C;
  font-size: 1rem;
  font-weight: 500;
}

/* Sessions List */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Sessions List Styles */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-item {
  display: flex;
  gap: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.session-item:hover {
  background: white;
  border-color: #7AC943;
  box-shadow: 0 2px 8px rgba(122, 201, 67, 0.1);
}

.session-number {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #7AC943;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.session-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-machine {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.session-machine i {
  font-size: 1.25rem;
  color: #7AC943;
}

.session-machine h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0B2B3C;
}

.session-status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.session-status-badge.open {
  background: #dcfce7;
  color: #166534;
}

.session-status-badge.closed {
  background: #e2e8f0;
  color: #475569;
}

.session-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.info-item i {
  color: #94a3b8;
  font-size: 0.875rem;
  width: 16px;
}

.info-item span {
  font-weight: 500;
}

.no-sessions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: #94a3b8;
  text-align: center;
}

.no-sessions i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
}

.no-sessions p {
  margin: 0;
  font-size: 0.875rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0B2B3C;
  margin-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .senico-trs-cards,
  .senico-stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .senico-lines-grid,
  .operations-grid {
    grid-template-columns: 1fr;
  }

  .machines-state-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .shell-tabs {
    overflow-x: auto;
  }

  .page-header {
    padding: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .mes-content {
    padding: 1rem;
  }

  .senico-trs-cards,
  .senico-stats-row {
    grid-template-columns: 1fr;
  }

  .machines-state-grid {
    grid-template-columns: 1fr;
  }

  .machine-state-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .line-row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .line-machine-val {
    text-align: right;
  }

  .section-header {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }

  .detail-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-header,
  .mes-content {
    padding: 0.85rem;
  }

  .page-title {
    font-size: 1.3rem;
  }

  .senico-stat-value {
    font-size: 1.6rem;
  }

  .order-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}

/* ── Navigation Tabs MES ── */
.mes-tabs-nav {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.35rem 0.5rem;
  margin-bottom: 1.25rem;
  overflow-x: auto;
}
.mes-tabs-scroll {
  display: flex;
  gap: 0.25rem;
  min-width: max-content;
}
.mes-tab-item {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 500;
  padding: 0.5rem 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.mes-tab-item:hover {
  background: #f1f5f9;
  color: #1e293b;
}
.mes-tab-item.active {
  background: #0B2B3C;
  color: #7AC943;
  font-weight: 700;
}

/* ── Ordres — Voir plus ── */
.orders-see-more {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.5rem 0.1rem;
  border-top: 1px dashed #e2e8f0;
  margin-top: 0.5rem;
}
.orders-see-more-count {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* ── Modal tous les ordres ── */
.mes-modal-filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
}
.mes-modal-count {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  margin-left: auto;
}

/* Native Date Input Styles */
.date-input-native {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #0B2B3C;
  background: #FFFFFF;
  transition: all 0.2s ease;
  font-family: inherit;
}

.date-input-native:hover {
  border-color: #cbd5e1;
}

.date-input-native:focus {
  outline: none;
  border-color: #7AC943;
  box-shadow: 0 0 0 3px rgba(122, 201, 67, 0.15);
}

.date-input-native::-webkit-calendar-picker-indicator {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.date-input-native::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
  background: rgba(122, 201, 67, 0.1);
}

/* Date input in dark theme cards */
.form-section .date-input-native {
  background: #FFFFFF;
}
</style>
