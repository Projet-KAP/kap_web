<template>
  <div class="stock-detail">
    <!-- Header -->
    <div class="stock-header">
      <div class="header-wrapper">
        <div class="header-left">
          <div class="header-text">
            <h1>Matériaux &amp; stock</h1>
            <p>Réceptions, mouvements et suivi des stocks</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn" @click="showImportDialog = true">
            <i class="pi pi-upload"></i> Importer Stock
          </button>
          <button class="action-btn" @click="openMovementDialog">
            <i class="pi pi-arrows-h"></i> Mouvement
          </button>
          <button class="action-btn primary" @click="openArticleDialog">
            <i class="pi pi-plus"></i> Nouvel article
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="dashboard-container">
      <!-- Top KPIs -->
      <div class="kpi-grid-top">
        <div class="kpi-card">
          <div class="kpi-icon">
            <i class="pi pi-list"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-number">{{ kpiTotalReferences }}</span>
            <span class="kpi-label">Références</span>
            <small>{{ kpiAvailable }} disponibles</small>
          </div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-icon warning">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-number">{{ kpiAlertCount }}</span>
            <span class="kpi-label">En alerte stock</span>
            <small>{{ kpiRuptures }} rupture(s)</small>
          </div>
        </div>

        <div class="kpi-card info">
          <div class="kpi-icon info">
            <i class="pi pi-wallet"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-number">{{ formatCurrency(kpiStockValue) }}</span>
            <span class="kpi-label">Valeur stock (FCFA)</span>
            <small>Mis à jour en temps réel</small>
          </div>
        </div>

        <div class="kpi-card secondary">
          <div class="kpi-icon secondary">
            <i class="pi pi-folder-open"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-number">{{ kpiLowStock }}</span>
            <span class="kpi-label">Articles sous ROP</span>
            <small><button type="button" class="inline-link" @click="scrollToROPTable">Commander maintenant</button></small>
          </div>
        </div>
      </div>

      <!-- Metrics Row -->
      <div class="metrics-row">
        <div class="metric-box">
          <div class="metric-header">
            <span class="metric-title">TAUX DE ROTATION</span>
            <span class="metric-label">e / an</span>
          </div>
          <div class="metric-value">{{ kpiRotationRate }}</div>
          <small>Renouvellement annuel moyen du stock</small>
          <span class="metric-change" :class="kpiRotationRate > 0 ? 'positive' : ''">Calculé sur le stock courant</span>
        </div>

        <div class="metric-box">
          <div class="metric-header">
            <span class="metric-title">TAUX DE RUPTURE</span>
            <span class="metric-label">%</span>
          </div>
          <div class="metric-value" :class="{ negative: kpiRuptureRate > 0 }">{{ kpiRuptureRate }}</div>
          <small>Demandes non satisfaites / total demandes</small>
          <span class="metric-change" :class="kpiRuptureRate > 0 ? 'negative' : 'success'">{{ kpiRuptures }} rupture(s)</span>
        </div>

        <div class="metric-box">
          <div class="metric-header">
            <span class="metric-title">COUVERTURE STOCK</span>
            <span class="metric-label">jours</span>
          </div>
          <div class="metric-value">{{ kpiCoverageDays }}</div>
          <small>Jours de stock restant à conso. actuelle</small>
          <span class="metric-change success">Basé sur seuils et quantités</span>
        </div>

        <div class="metric-box">
          <div class="metric-header">
            <span class="metric-title">TAUX DE SERVICE</span>
            <span class="metric-label">%</span>
          </div>
          <div class="metric-value">{{ kpiServiceRate }}</div>
          <small>Commandes servies sans rupture</small>
          <span class="metric-change" :class="kpiServiceRate >= 95 ? 'positive' : 'negative'">Depuis les niveaux de stock</span>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Left Column -->
        <div class="left-column">
          <!-- Stock Alerts -->
          <div class="card">
            <div class="card-header">
              <i class="pi pi-bell"></i>
              <span>Alertes de stock</span>
              <span class="badge red">{{ kpiAlertCount }} alertes</span>
            </div>

            <div class="alerts-section">
              <div v-if="outOfStockParts.length > 0" class="alert-group">
                <h4 class="alert-type rupture">RUPTURE</h4>
                <div v-for="part in outOfStockParts.slice(0, 3)" :key="part.id" class="alert-item">
                  <span class="alert-code">{{ part.reference }}</span>
                  <span class="alert-name">{{ part.name }}</span>
                  <span class="qty">{{ part.quantity }} / {{ part.min_stock }}</span>
                </div>
              </div>

              <div v-if="lowStockParts.length > 0" class="alert-group">
                <h4 class="alert-type warning">STOCK BAS</h4>
                <div v-for="part in lowStockParts.slice(0, 3)" :key="part.id" class="alert-item">
                  <span class="alert-code">{{ part.reference }}</span>
                  <span class="alert-name">{{ part.name }}</span>
                  <span class="qty">{{ part.quantity }} / {{ part.min_stock }}</span>
                </div>
              </div>

              <div v-if="kpiAlertCount === 0" class="no-alerts">
                <i class="pi pi-check-circle" style="color: #10b981; font-size: 2rem;"></i>
                <p>Aucune alerte — Stock normal</p>
              </div>
            </div>

            <button v-if="kpiAlertCount > 0" type="button" @click="showAllAlerts = true" class="view-all">Voir toutes les alertes ({{ kpiAlertCount }}) →</button>
          </div>

          <!-- Pareto Chart -->
          <div class="card">
            <div class="card-header">
              <h3>Diagramme de Pareto — Valeur du stock</h3>
              <span class="badge">Top {{ paretoItems.length }} articles</span>
            </div>
            <div class="pareto-container">
              <svg
                v-if="paretoItems.length"
                viewBox="0 0 680 310"
                class="pareto-svg"
                role="img"
                aria-label="Diagramme de Pareto de la valeur du stock"
              >
                <line
                  v-for="tick in paretoTicks"
                  :key="`grid-${tick.value}`"
                  x1="56"
                  :y1="tick.y"
                  x2="620"
                  :y2="tick.y"
                  stroke="#e5e7eb"
                  stroke-width="1"
                />
                <line x1="56" y1="28" x2="56" y2="240" stroke="#475569" stroke-width="1.2" />
                <line x1="56" y1="240" x2="620" y2="240" stroke="#475569" stroke-width="1.2" />
                <line x1="620" y1="28" x2="620" y2="240" stroke="#475569" stroke-width="1.2" />

                <g v-for="tick in paretoTicks" :key="`left-${tick.value}`">
                  <text x="48" :y="tick.y + 4" text-anchor="end" font-size="10" fill="#64748b">
                    {{ tick.label }}
                  </text>
                  <text x="628" :y="tick.y + 4" text-anchor="start" font-size="10" fill="#64748b">
                    {{ tick.percentLabel }}
                  </text>
                </g>

                <g v-for="item in paretoItems" :key="item.reference">
                  <rect
                    :x="item.x"
                    :y="item.y"
                    :width="item.barWidth"
                    :height="item.height"
                    fill="#173c9f"
                    rx="1.5"
                  />
                  <text
                    :x="item.x + item.barWidth / 2"
                    :y="item.y - 6"
                    text-anchor="middle"
                    font-size="10"
                    font-weight="700"
                    fill="#0f172a"
                  >
                    {{ item.percentLabel }}
                  </text>
                  <text
                    :x="item.x + item.barWidth / 2"
                    y="258"
                    text-anchor="middle"
                    font-size="9"
                    fill="#0f172a"
                  >
                    {{ item.shortLabel }}
                  </text>
                </g>

                <polyline
                  :points="paretoLinePoints"
                  fill="none"
                  stroke="#ff5a1f"
                  stroke-width="2"
                />
                <circle
                  v-for="item in paretoItems"
                  :key="`point-${item.reference}`"
                  :cx="item.pointX"
                  :cy="item.pointY"
                  r="3.5"
                  fill="#ff5a1f"
                  stroke="#ffffff"
                  stroke-width="1.5"
                />
                <line
                  x1="56"
                  :y1="paretoThresholdY"
                  x2="620"
                  :y2="paretoThresholdY"
                  stroke="#f59e0b"
                  stroke-width="1.4"
                  stroke-dasharray="5 4"
                />
                <text x="64" :y="paretoThresholdY - 6" font-size="10" fill="#b45309" font-weight="700">
                  Seuil 80%
                </text>
              </svg>
              <div v-else class="no-data-message compact">
                <i class="pi pi-chart-bar"></i>
                <p>Aucune valeur de stock disponible</p>
              </div>
            </div>
            <div class="pareto-info">
              <i class="pi pi-info-circle" style="color:#f59e0b"></i>
              <strong>{{ paretoSummary }}</strong>
            </div>
          </div>

          <!-- KPI Economics -->
          <div class="card">
            <h3 class="card-title">KPI économiques</h3>
            <div class="kpi-economics">
              <div class="econ-item">
                <span class="econ-label">EOQ MOYEN</span>
                <span class="econ-value">{{ kpiAverageEoq }}</span>
                <small>Quantité optimale de commande</small>
              </div>
              <div class="econ-item">
                <span class="econ-label">COÛT DE POSSESSION</span>
                <span class="econ-value">{{ kpiHoldingCostRate }}</span>
                <small>Du stock moyen / an</small>
              </div>
              <div class="econ-item">
                <span class="econ-label">STOCK DE SÉCURITÉ</span>
                <span class="econ-value">{{ kpiSafetyStock }}</span>
                <small>ref.</small>
              </div>
              <div class="econ-item">
                <span class="econ-label">VALEUR STOCK MORT</span>
                <span class="econ-value">{{ formatCurrency(kpiDeadStockValue) }}</span>
                <small>{{ deadStockParts.length }} articles immobilisés</small>
              </div>
            </div>
          </div>

          <!-- Recent Movements -->
          <div class="card">
            <div class="card-header">
              <h3>Derniers mouvements</h3>
            </div>
            <div class="movements-list">
              <div v-for="movement in recentMovements" :key="movement.id" class="movement-item">
                <div class="movement-icon" :class="getMovementIconClass(movement.movement_type)">
                  <i :class="getMovementIcon(movement.movement_type)"></i>
                </div>
                <div class="movement-info">
                  <strong>{{ getMovementLabel(movement.movement_type) }} — {{ movement.spare_part_ref || movement.reference }}</strong>
                  <small>{{ movement.spare_part_name || 'Article' }} · {{ movement.quantity }} unités</small>
                  <span class="time">{{ formatRelativeDate(movement.movement_date || movement.creation_date) }}</span>
                </div>
              </div>
              <div v-if="!recentMovements.length" class="no-data-message compact">
                <i class="pi pi-history"></i>
                <p>Aucun mouvement enregistré</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="right-column">
          <!-- ROP Articles Table -->
          <div class="card">
            <div class="card-header">
              <h3>Articles sous ROP — Reorder Point</h3>
              <span class="badge">{{ kpiLowStock }} articles</span>
            </div>
            <div v-if="kpiLowStock > 0">
              <table class="rop-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Article</th>
                    <th>Stock</th>
                    <th>Min.</th>
                    <th>Max.</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="part in lowCoverageParts.slice(0, 10)" :key="part.id">
                    <td>{{ part.reference }}</td>
                    <td>{{ part.name }}</td>
                    <td class="number">{{ part.quantity }}</td>
                    <td class="number">{{ part.min_stock }}</td>
                    <td class="number">{{ part.max_stock || '-' }}</td>
                    <td>
                      <span v-if="isOutOfStockPart(part)" class="status rupture">Rupture</span>
                      <span v-else-if="isLowStockPart(part)" class="status info">Sous ROP</span>
                      <span v-else class="status warning">Stock bas</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <button v-if="kpiLowStock > 10" type="button" @click="showAllAlerts = true" class="view-all">Voir tous les articles sous ROP ({{ kpiLowStock }}) →</button>
            </div>
            <div v-else class="no-data-message" style="text-align: center; padding: 2rem;">
              <i class="pi pi-check-circle" style="font-size: 2rem; color: #10b981;"></i>
              <p>Aucun article sous ROP</p>
            </div>
          </div>

          <!-- Stock Distribution -->
          <div class="card">
            <h3 class="card-title">Répartition du stock</h3>
            <div class="distribution-chart">
              <div v-for="item in stockDistribution" :key="item.status" class="dist-item">
                <span class="dist-label-left">{{ item.label }}</span>
                <div class="dist-bar-wrap"><div class="dist-bar" :class="item.className" :style="{ width: item.percent + '%' }"></div></div>
                <strong class="dist-count">{{ item.count }}</strong>
              </div>
            </div>
          </div>

          <!-- Dead Stock -->
          <div class="card">
            <div class="card-header">
              <h3>Stock mort — Sans mouvement > 6 mois</h3>
            </div>
            <div class="dead-stock-box">
              <span class="dead-count">{{ deadStockParts.length }} articles</span>
              <small>Valeur immobilisée : {{ formatCurrency(kpiDeadStockValue) }}</small>
              <button type="button" class="view-all" @click="showDeadStock = true">Voir la liste →</button>
            </div>

            <div class="card-header low-coverage">
              <h3>Articles sous couverture minimale (< 7 jours)</h3>
            </div>
            <div class="low-coverage-box">
              <span class="low-count">{{ lowCoverageParts.length }} articles</span>
              <small>{{ lowCoverageActionLabel }}</small>
              <button type="button" class="view-all" @click="showLowCoverage = true">Commander →</button>
            </div>
          </div>

          <!-- Performance Suppliers -->
          <div class="card">
            <h3 class="card-title">Performance fournisseurs</h3>
            <div class="suppliers-list">
              <div v-for="supplier in supplierPerformance" :key="supplier.name" class="supplier-item">
                <span class="supplier-name"><span>{{ supplier.name }}</span><span class="supplier-perf">{{ supplier.score }}%</span></span>
                <div class="perf-bar">
                  <div class="perf-fill" :style="{ width: supplier.score + '%', background: supplier.color }"></div>
                </div>
                <small>{{ supplier.parts }} article(s) · {{ formatCurrency(supplier.value) }}</small>
              </div>
              <div v-if="!supplierPerformance.length" class="no-data-message compact">
                <i class="pi pi-truck"></i>
                <p>Aucun fournisseur renseigné</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════ -->
    <!-- DIALOG : NOUVEL ARTICLE                 -->
    <!-- ═══════════════════════════════════════ -->
    <Dialog v-model:visible="showArticleDialog" header="Nouvel article" :modal="true" :closable="true" :style="{ width: '900px' }">
      <form @submit.prevent="submitArticle" class="sd-form">
        <!-- Identification -->
        <div class="sd-section">
          <h3 class="sd-section-title">Identification</h3>
          <div class="sd-grid">
            <div class="sd-field required">
              <label>Référence</label>
              <InputText v-model="articleForm.reference" :class="{ 'p-invalid': articleErrors.reference }" placeholder="Ex: SH66172" />
              <small v-if="articleErrors.reference" class="p-error">{{ articleErrors.reference }}</small>
            </div>
            <div class="sd-field">
              <label>Code alternatif</label>
              <InputText v-model="articleForm.alternative_code" placeholder="Ex: ALT-001" />
            </div>
            <div class="sd-field">
              <label>Référence personnelle</label>
              <InputText v-model="articleForm.personal_reference" placeholder="Ex: REF-PERSO-001" />
            </div>
            <div class="sd-field">
              <label>Code-barres</label>
              <InputText v-model="articleForm.barcode" placeholder="Ex: 455115875" />
            </div>
            <div class="sd-field required sd-full">
              <label>Nom de l'article</label>
              <InputText v-model="articleForm.name" :class="{ 'p-invalid': articleErrors.name }" placeholder="Ex: FILTRE HYDRAULIQUE HIFI" />
              <small v-if="articleErrors.name" class="p-error">{{ articleErrors.name }}</small>
            </div>
            <div class="sd-field sd-full">
              <label>Description</label>
              <Textarea v-model="articleForm.description" rows="3" placeholder="Description détaillée de l'article" />
            </div>
          </div>
        </div>

        <!-- Fabricant & Spécifications -->
        <div class="sd-section">
          <h3 class="sd-section-title">Fabricant &amp; Spécifications</h3>
          <div class="sd-grid">
            <div class="sd-field"><label>Fabricant</label><InputText v-model="articleForm.manufacturer" placeholder="Ex: HIFI" /></div>
            <div class="sd-field"><label>Réf. Fabricant</label><InputText v-model="articleForm.manufacturer_ref" placeholder="Ex: SH66172" /></div>
            <div class="sd-field"><label>Modèle</label><InputText v-model="articleForm.model" placeholder="Ex: Series 2000" /></div>
            <div class="sd-field"><label>Famille d'équipement</label><InputText v-model="articleForm.equipment_family" placeholder="Ex: Filtration" /></div>
          </div>
        </div>

        <!-- Stock & Quantités -->
        <div class="sd-section">
          <h3 class="sd-section-title">Stock &amp; Quantités</h3>
          <div class="sd-grid">
            <div class="sd-field required">
              <label>Unité de stock</label>
              <Select v-model="articleForm.stock_unit" :options="stockUnits" optionLabel="label" optionValue="value" placeholder="Sélectionner" :class="{ 'p-invalid': articleErrors.stock_unit }" />
              <small v-if="articleErrors.stock_unit" class="p-error">{{ articleErrors.stock_unit }}</small>
            </div>
            <div class="sd-field required">
              <label>Quantité en stock</label>
              <InputNumber v-model="articleForm.quantity" :min="0" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00" />
            </div>
            <div class="sd-field required">
              <label>Stock minimum</label>
              <InputNumber v-model="articleForm.min_stock" :min="0" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00" />
            </div>
            <div class="sd-field">
              <label>Stock maximum</label>
              <InputNumber v-model="articleForm.max_stock" :min="0" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00" />
            </div>
          </div>
        </div>

        <!-- Prix -->
        <div class="sd-section">
          <h3 class="sd-section-title">Prix</h3>
          <div class="sd-grid">
            <div class="sd-field required">
              <label>Prix unitaire (XOF)</label>
              <InputNumber v-model="articleForm.unit_price" :min="0" :minFractionDigits="0" mode="currency" currency="XOF" locale="fr-FR" placeholder="0" />
            </div>
            <div class="sd-field">
              <label>Valeur totale (calculée)</label>
              <div class="sd-calc-value">{{ formatCurrency(calculatedTotalValue) }}</div>
            </div>
          </div>
        </div>

        <!-- Localisation -->
        <div class="sd-section">
          <h3 class="sd-section-title">Localisation</h3>
          <div class="sd-grid">
            <div class="sd-field required">
              <label>Site</label>
              <Select v-model="articleForm.site" :options="sites" optionLabel="name" optionValue="id" placeholder="Sélectionner un site" :class="{ 'p-invalid': articleErrors.site }" />
              <small v-if="articleErrors.site" class="p-error">{{ articleErrors.site }}</small>
            </div>
            <div class="sd-field">
              <label>Site de consommation</label>
              <MultiSelect v-model="articleForm.warehouse" :options="warehouses" optionLabel="name" optionValue="id" placeholder="Sélectionner" display="chip" :filter="true" />
            </div>
            <div class="sd-field"><label>Emplacement</label><InputText v-model="articleForm.location_in_warehouse" placeholder="Ex: Allée A, Rayon 3" /></div>
            <div class="sd-field"><label>Équipement de stockage</label><InputText v-model="articleForm.storage_equipment" placeholder="Ex: Palette P-001" /></div>
          </div>
        </div>

        <!-- Statut -->
        <div class="sd-section">
          <h3 class="sd-section-title">Statut &amp; Options</h3>
          <div class="sd-grid">
            <div class="sd-field">
              <label>Statut</label>
              <Select v-model="articleForm.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Statut" />
            </div>
            <div class="sd-field sd-checkbox">
              <Checkbox id="art_alerts" v-model="articleForm.stock_alerts_enabled" :binary="true" />
              <label for="art_alerts">Alertes de stock activées</label>
            </div>
            <div class="sd-field sd-checkbox">
              <Checkbox id="art_replen" v-model="articleForm.auto_replenishment" :binary="true" />
              <label for="art_replen">Réapprovisionnement automatique</label>
            </div>
            <div class="sd-field sd-full">
              <label>Remarques</label>
              <Textarea v-model="articleForm.remarks" rows="2" placeholder="Notes supplémentaires" />
            </div>
          </div>
        </div>
      </form>

      <template #footer>
        <div class="sd-footer">
          <Button label="Annuler" icon="pi pi-times" text @click="showArticleDialog = false" />
          <Button label="Créer l'article" icon="pi pi-check" @click="submitArticle" :loading="articleLoading" />
        </div>
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════ -->
    <!-- DIALOG : MOUVEMENT DE STOCK             -->
    <!-- ═══════════════════════════════════════ -->
    <Dialog v-model:visible="showMovementDialog" header="Nouveau Mouvement de Stock" :modal="true" :closable="true" :style="{ width: '700px' }">
      <form @submit.prevent="submitMovement" class="sd-form">
        <!-- Type -->
        <div class="sd-section">
          <h3 class="sd-section-title">Type de mouvement</h3>
          <div class="sd-mv-types">
            <div v-for="t in movementTypes" :key="t.value" class="sd-mv-card" :class="{ active: movementForm.movement_type === t.value }" @click="movementForm.movement_type = t.value">
              <i :class="t.icon" class="sd-mv-icon"></i>
              <div class="sd-mv-label">{{ t.label }}</div>
              <div class="sd-mv-desc">{{ t.description }}</div>
            </div>
          </div>
        </div>

        <!-- Article -->
        <div class="sd-section">
          <h3 class="sd-section-title">Article</h3>
          <div class="sd-grid">
            <div class="sd-field required sd-full">
              <label>Sélectionner un article</label>
              <div class="sd-row-gap">
                <Select v-model="movementForm.spare_part" :options="articleOptions" optionLabel="label" optionValue="value" placeholder="Choisir un article" filter :class="{ 'p-invalid': movementErrors.spare_part }" @change="handleArticleChange" class="sd-flex1" />
                <Button icon="pi pi-qrcode" label="Scanner" @click="startBarcodeScan" severity="secondary" outlined />
              </div>
              <div v-if="barcodeInput !== null" class="sd-mt">
                <InputText v-model="barcodeInput" placeholder="Scannez ou saisissez le code-barres" @keyup.enter="searchByBarcode" class="sd-full-w" />
                <Button label="Rechercher" icon="pi pi-search" size="small" class="sd-mt-sm" @click="searchByBarcode" />
              </div>
              <small v-if="movementErrors.spare_part" class="p-error">{{ movementErrors.spare_part }}</small>
            </div>
            <div v-if="selectedArticleInfo" class="sd-stock-info sd-full">
              <div class="sd-info-row"><span>Stock actuel :</span><strong>{{ selectedArticleInfo.quantity }} {{ selectedArticleInfo.stock_unit }}</strong></div>
              <div class="sd-info-row"><span>Stock minimum :</span><strong>{{ selectedArticleInfo.min_stock }} {{ selectedArticleInfo.stock_unit }}</strong></div>
              <div class="sd-info-row"><span>Site actuel :</span><strong>{{ selectedArticleInfo.site_name || '—' }}</strong></div>
            </div>
          </div>
        </div>

        <!-- Détails -->
        <div class="sd-section">
          <h3 class="sd-section-title">Détails du mouvement</h3>
          <div class="sd-grid">
            <div class="sd-field required">
              <label>Quantité</label>
              <InputNumber v-model="movementForm.quantity" :min="0.01" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00" :class="{ 'p-invalid': movementErrors.quantity }" />
              <small v-if="movementErrors.quantity" class="p-error">{{ movementErrors.quantity }}</small>
            </div>
            <div class="sd-field">
              <label>Prix unitaire (optionnel)</label>
              <InputNumber v-model="movementForm.unit_price" :min="0" mode="currency" currency="XOF" locale="fr-FR" placeholder="0" />
            </div>
            <div class="sd-field sd-full">
              <label>Raison</label>
              <Select v-model="movementForm.reason" :options="reasonOptions" optionLabel="label" optionValue="value" placeholder="Sélectionner une raison" />
            </div>
            <div class="sd-field sd-full">
              <label>Notes / Commentaires</label>
              <Textarea v-model="movementForm.notes" rows="3" placeholder="Informations supplémentaires..." />
            </div>
          </div>
        </div>

        <!-- Transfert -->
        <div v-if="movementForm.movement_type === 'TRANSFER'" class="sd-section">
          <h3 class="sd-section-title">Destination du transfert</h3>
          <div class="sd-grid">
            <div class="sd-field required">
              <label>Site de destination</label>
              <Select v-model="movementForm.destination_site" :options="sites" optionLabel="name" optionValue="id" placeholder="Sélectionner un site" :class="{ 'p-invalid': movementErrors.destination_site }" />
              <small v-if="movementErrors.destination_site" class="p-error">{{ movementErrors.destination_site }}</small>
            </div>
            <div class="sd-field">
              <label>Site de consommation destination</label>
              <MultiSelect v-model="movementForm.destination_warehouse" :options="warehouses" optionLabel="name" optionValue="id" placeholder="Sélectionner" display="chip" :filter="true" />
            </div>
          </div>
        </div>

        <!-- Récapitulatif -->
        <div v-if="movementForm.spare_part && movementForm.quantity" class="sd-summary">
          <h4>Récapitulatif</h4>
          <div class="sd-summary-row"><span>Type :</span><Tag :severity="getMovementSeverity(movementForm.movement_type)" :value="getMovementLabel(movementForm.movement_type)" /></div>
          <div class="sd-summary-row"><span>Quantité :</span><strong>{{ movementForm.quantity }} {{ selectedArticleInfo?.stock_unit }}</strong></div>
          <div v-if="movementForm.movement_type === 'OUT'" class="sd-summary-row">
            <span>Stock après sortie :</span>
            <strong :class="getStockAfterClass()">{{ calculateStockAfter() }} {{ selectedArticleInfo?.stock_unit }}</strong>
          </div>
          <div v-if="movementForm.unit_price" class="sd-summary-row"><span>Valeur totale :</span><strong>{{ formatCurrency(movementForm.quantity * movementForm.unit_price) }}</strong></div>
        </div>
      </form>

      <template #footer>
        <div class="sd-footer">
          <Button label="Annuler" icon="pi pi-times" text @click="showMovementDialog = false" />
          <Button label="Enregistrer le mouvement" icon="pi pi-check" @click="submitMovement" :loading="movementLoading" :disabled="!movementForm.spare_part || !movementForm.quantity" />
        </div>
      </template>
    </Dialog>

    <FileUploadDialog
      v-model="showImportDialog"
      stock-only
      @uploaded="handleStockImportUploaded"
    />

    <!-- Modal: All Alerts -->
    <Dialog
      v-model:visible="showAllAlerts"
      header="Toutes les alertes de stock"
      :modal="true"
      :style="{ width: '80vw' }"
      @hide="showAllAlerts = false"
    >
      <div v-if="stockAlertParts.length > 0" class="alerts-modal-content">
        <div v-if="outOfStockParts.length > 0" class="alert-section">
          <h4 class="alert-type rupture" style="margin-bottom: 1rem;">RUPTURE ({{ outOfStockParts.length }})</h4>
          <DataTable :value="outOfStockParts" :paginator="true" :rows="10" responsiveLayout="scroll">
            <Column field="reference" header="Référence" sortable></Column>
            <Column field="name" header="Article" sortable></Column>
            <Column field="quantity" header="Stock" sortable></Column>
            <Column field="min_stock" header="Minimum" sortable></Column>
            <Column header="Action">
              <template #body="{ data }">
                <Button icon="pi pi-pencil" severity="warning" text rounded @click="openArticleEditDialog(data)" />
              </template>
            </Column>
          </DataTable>
        </div>

        <div v-if="lowStockParts.length > 0" class="alert-section" style="margin-top: 2rem;">
          <h4 class="alert-type warning" style="margin-bottom: 1rem;">STOCK BAS ({{ lowStockParts.length }})</h4>
          <DataTable :value="lowStockParts" :paginator="true" :rows="10" responsiveLayout="scroll">
            <Column field="reference" header="Référence" sortable></Column>
            <Column field="name" header="Article" sortable></Column>
            <Column field="quantity" header="Stock" sortable></Column>
            <Column field="min_stock" header="Minimum" sortable></Column>
            <Column header="Action">
              <template #body="{ data }">
                <Button icon="pi pi-pencil" severity="warning" text rounded @click="openArticleEditDialog(data)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
      <div v-else class="no-data-message">
        <i class="pi pi-check-circle" style="font-size: 3rem; color: #10b981;"></i>
        <p>Aucune alerte de stock</p>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showDeadStock"
      header="Stock mort"
      :modal="true"
      :style="{ width: '75vw' }"
    >
      <DataTable :value="deadStockParts" :paginator="true" :rows="10" responsiveLayout="scroll">
        <Column field="reference" header="Référence" sortable></Column>
        <Column field="name" header="Article" sortable></Column>
        <Column field="quantity" header="Stock" sortable></Column>
        <Column field="unit_price" header="Prix unitaire" sortable>
          <template #body="{ data }">{{ formatCurrency(data.unit_price) }}</template>
        </Column>
        <Column header="Valeur">
          <template #body="{ data }">{{ formatCurrency(getPartValue(data)) }}</template>
        </Column>
      </DataTable>
    </Dialog>

    <Dialog
      v-model:visible="showLowCoverage"
      header="Articles à commander"
      :modal="true"
      :style="{ width: '75vw' }"
    >
      <DataTable :value="lowCoverageParts" :paginator="true" :rows="10" responsiveLayout="scroll">
        <Column field="reference" header="Référence" sortable></Column>
        <Column field="name" header="Article" sortable></Column>
        <Column field="quantity" header="Stock" sortable></Column>
        <Column field="min_stock" header="Minimum" sortable></Column>
        <Column field="threshold" header="Seuil" sortable></Column>
        <Column header="Action">
          <template #body="{ data }">
            <Button label="Mouvement" icon="pi pi-arrows-h" size="small" @click="openMovementForArticle(data)" />
          </template>
        </Column>
      </DataTable>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useStockStore } from '@/features/stock/stores/stockStore'
import { useImportEventsStore } from '@/stores/importEventsStore'
import { useToast } from 'primevue/usetoast'
import { axiosInstance } from '@/main.js'
import FileUploadDialog from '@/features/admin/components/mediatheque/FileUploadDialog.vue'

const stockStore = useStockStore()
const importEvents = useImportEventsStore()
const toast = useToast()
const route = useRoute()

const handleGlobalStockImport = async (event) => {
  if (!event?.detail?.key || event.detail.key !== 'stock') return
  await refreshStockData(event.detail)
}

const getStoredStockImport = () => {
  try {
    const raw = localStorage.getItem('kap-last-stock-import')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ── Sites ──
const sites = ref([
  { id: 1, name: 'Siège Principal' },
  { id: 2, name: 'Magasin Pièces Détachées' },
  { id: 3, name: 'Chantier A' },
  { id: 4, name: 'Atelier Principal' },
  { id: 5, name: 'Chantier B' }
])

const warehouses = computed(() => {
  const wh = stockStore.warehouses
  return Array.isArray(wh) ? wh : []
})

const toNumber = (value) => {
  const num = Number.parseFloat(value)
  return Number.isFinite(num) ? num : 0
}

const getPartValue = (part) => {
  const storedValue = toNumber(part?.total_value)
  if (storedValue > 0) return storedValue
  return toNumber(part?.quantity) * toNumber(part?.unit_price)
}

const getThreshold = (part) => {
  const threshold = toNumber(part?.threshold)
  if (threshold > 0) return threshold
  return toNumber(part?.min_stock)
}

const isOutOfStockPart = (part) => toNumber(part?.quantity) <= 0
const isLowStockPart = (part) => !isOutOfStockPart(part) && toNumber(part?.quantity) <= getThreshold(part)

const stockAlertParts = computed(() => {
  const byReference = new Map()
  stockStore.spareParts.forEach((part) => {
    if (isOutOfStockPart(part) || isLowStockPart(part) || part.is_low_stock || part.is_out_of_stock) {
      byReference.set(part.reference || part.id, part)
    }
  })
  return Array.from(byReference.values())
})
const outOfStockParts = computed(() => stockStore.spareParts.filter(isOutOfStockPart))
const lowStockParts = computed(() => stockStore.spareParts.filter(isLowStockPart))

// ── KPI Computed Properties ──
const kpiTotalReferences = computed(() => stockStore.spareParts.length)
const kpiAvailable = computed(() => stockStore.spareParts.filter(p => p.status === 'DISPONIBLE' && toNumber(p.quantity) > 0).length)
const kpiAlertCount = computed(() => stockAlertParts.value.length)
const kpiStockValue = computed(() => stockStore.spareParts.reduce((sum, part) => sum + getPartValue(part), 0))
const kpiLowStock = computed(() => lowCoverageParts.value.length)
const kpiOutOfStock = computed(() => outOfStockParts.value.length)
const kpiRuptures = computed(() => outOfStockParts.value.length)
const recentMovements = computed(() => {
  const list = Array.isArray(stockStore.movements) ? stockStore.movements : []
  return [...list].sort((a, b) => new Date(b.movement_date || b.creation_date || 0) - new Date(a.movement_date || a.creation_date || 0)).slice(0, 5)
})
const stockQuantityTotal = computed(() => stockStore.spareParts.reduce((sum, part) => sum + toNumber(part.quantity), 0))
const thresholdQuantityTotal = computed(() => stockStore.spareParts.reduce((sum, part) => sum + Math.max(getThreshold(part), 1), 0))
const kpiRotationRate = computed(() => {
  if (!stockQuantityTotal.value || !thresholdQuantityTotal.value) return '0,0'
  return ((thresholdQuantityTotal.value / stockQuantityTotal.value) * 12).toFixed(1).replace('.', ',')
})
const kpiRuptureRate = computed(() => {
  if (!kpiTotalReferences.value) return '0,0'
  return ((kpiRuptures.value / kpiTotalReferences.value) * 100).toFixed(1).replace('.', ',')
})
const kpiCoverageDays = computed(() => {
  if (!thresholdQuantityTotal.value) return 0
  const estimatedDailyNeed = thresholdQuantityTotal.value / 30
  return Math.round(stockQuantityTotal.value / estimatedDailyNeed)
})
const kpiServiceRate = computed(() => {
  if (!kpiTotalReferences.value) return '0,0'
  return (100 - (kpiRuptures.value / kpiTotalReferences.value) * 100).toFixed(1).replace('.', ',')
})
const kpiAverageEoq = computed(() => {
  if (!stockStore.spareParts.length) return 0
  const total = stockStore.spareParts.reduce((sum, part) => {
    const min = toNumber(part.min_stock)
    const max = toNumber(part.max_stock)
    return sum + Math.max(max - min, min)
  }, 0)
  return Math.round(total / stockStore.spareParts.length)
})
const kpiHoldingCostRate = computed(() => {
  const stockValue = kpiStockValue.value
  if (!stockValue) return '0%'
  const deadRate = Math.min(100, (kpiDeadStockValue.value / stockValue) * 100)
  return `${deadRate.toFixed(1).replace('.', ',')}%`
})
const kpiSafetyStock = computed(() => stockStore.spareParts.filter((part) => toNumber(part.min_stock) > 0).length)
const deadStockParts = computed(() => {
  const movementRefs = new Set(recentMovements.value.map((movement) => movement.spare_part_ref).filter(Boolean))
  return stockStore.spareParts.filter((part) => toNumber(part.quantity) > 0 && !movementRefs.has(part.reference))
})
const kpiDeadStockValue = computed(() => deadStockParts.value.reduce((sum, part) => sum + getPartValue(part), 0))
const lowCoverageParts = computed(() => stockStore.spareParts.filter((part) => isOutOfStockPart(part) || isLowStockPart(part)))
const lowCoverageActionLabel = computed(() => lowCoverageParts.value.length ? 'Action recommandée sous 48h' : 'Aucune action urgente')
const stockDistribution = computed(() => {
  const items = [
    { status: 'DISPONIBLE', label: 'Disponible', className: 'available' },
    { status: 'EN_COMMANDE', label: 'En commande', className: 'reserved' },
    { status: 'RESERVE', label: 'Réservé', className: 'unavailable' },
    { status: 'INDISPONIBLE', label: 'Indisponible', className: 'obsolete' }
  ]
  const total = Math.max(kpiTotalReferences.value, 1)
  return items.map((item) => {
    const count = stockStore.spareParts.filter((part) => part.status === item.status).length
    return { ...item, count, percent: Math.round((count / total) * 100) }
  })
})
const paretoItems = computed(() => {
  const total = stockStore.spareParts.reduce((sum, part) => sum + getPartValue(part), 0)
  if (!total) return []
  let cumulative = 0
  const chart = { left: 56, right: 620, top: 28, bottom: 240 }
  const width = chart.right - chart.left
  const height = chart.bottom - chart.top
  const source = [...stockStore.spareParts]
    .map((part) => ({
      reference: part.reference,
      name: part.name,
      value: getPartValue(part)
    }))
    .filter((part) => part.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
  const maxValue = Math.max(...source.map((part) => part.value), 1)
  const slotWidth = width / Math.max(source.length, 1)
  const barWidth = Math.min(56, slotWidth * 0.58)

  return source
    .map((part, index) => {
      const percent = (part.value / total) * 100
      cumulative += percent
      const barHeight = Math.max(2, (part.value / maxValue) * height)
      const x = chart.left + index * slotWidth + (slotWidth - barWidth) / 2
      const y = chart.bottom - barHeight
      const pointX = x + barWidth / 2
      const pointY = chart.bottom - (Math.min(100, cumulative) / 100) * height
      return {
        ...part,
        percent: Number(percent.toFixed(1)),
        percentLabel: `${percent.toFixed(1).replace('.', ',')}%`,
        cumulative: Math.min(100, Number(cumulative.toFixed(1))),
        x,
        y,
        height: barHeight,
        barWidth,
        pointX,
        pointY,
        shortLabel: part.reference?.length > 10 ? `${part.reference.slice(0, 9)}…` : part.reference
      }
    })
})
const paretoLinePoints = computed(() => paretoItems.value.map((item) => `${item.pointX},${item.pointY}`).join(' '))
const paretoMaxValue = computed(() => Math.max(...paretoItems.value.map((item) => item.value), 1))
const paretoTicks = computed(() => {
  const chartTop = 28
  const chartBottom = 240
  const height = chartBottom - chartTop
  return [100, 80, 60, 40, 20, 0].map((percent) => {
    const y = chartBottom - (percent / 100) * height
    const value = (paretoMaxValue.value * percent) / 100
    return {
      value: percent,
      y,
      label: formatCompactNumber(value),
      percentLabel: `${percent.toFixed(1)}%`
    }
  })
})
const paretoThresholdY = computed(() => 240 - 0.8 * (240 - 28))
const paretoSummary = computed(() => {
  if (!paretoItems.value.length) return 'Importez un fichier Stock pour alimenter cette analyse.'
  const top = paretoItems.value.slice(0, 3)
  const cumulative = top.reduce((sum, item) => sum + item.percent, 0)
  return `${top.length} articles (${top.map((item) => item.reference).join(', ')}) représentent ${Math.min(100, cumulative).toFixed(1).replace('.', ',')}% de la valeur totale du stock.`
})
const supplierPerformance = computed(() => {
  const suppliers = new Map()
  stockStore.spareParts.forEach((part) => {
    const name = part.manufacturer || 'Non renseigné'
    const current = suppliers.get(name) || { name, parts: 0, value: 0, alerts: 0 }
    current.parts += 1
    current.value += getPartValue(part)
    if (isOutOfStockPart(part) || isLowStockPart(part)) current.alerts += 1
    suppliers.set(name, current)
  })
  return Array.from(suppliers.values())
    .map((supplier) => {
      const score = supplier.parts ? Math.max(0, Math.round(((supplier.parts - supplier.alerts) / supplier.parts) * 100)) : 0
      return {
        ...supplier,
        score,
        color: score >= 90 ? '#4caf50' : score >= 70 ? '#ff9800' : '#f44336'
      }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
})

// ─────────────────────────────────────────────
// MODAL : NOUVEL ARTICLE
// ─────────────────────────────────────────────
const showArticleDialog = ref(false)
const articleLoading = ref(false)
const articleErrors = ref({})

const articleForm = ref({
  reference: '', alternative_code: '', personal_reference: '', barcode: '',
  name: '', description: '', manufacturer: '', manufacturer_ref: '',
  model: '', equipment_family: '',
  stock_unit: 'PC', quantity: 0, min_stock: 0, max_stock: null, unit_price: 0,
  site: null, warehouse: [], location_in_warehouse: '', storage_equipment: '',
  status: 'DISPONIBLE', stock_alerts_enabled: true, auto_replenishment: false, remarks: ''
})

const calculatedTotalValue = computed(() =>
  (articleForm.value.quantity || 0) * (articleForm.value.unit_price || 0)
)

const stockUnits = [
  { label: 'Pièce (PC)', value: 'PC' },
  { label: 'Kilogramme (KG)', value: 'KG' },
  { label: 'Litre (L)', value: 'L' },
  { label: 'Mètre (M)', value: 'M' },
  { label: 'Mètre carré (M2)', value: 'M2' },
  { label: 'Mètre cube (M3)', value: 'M3' },
  { label: 'Boîte (BOX)', value: 'BOX' },
  { label: 'Set/Ensemble (SET)', value: 'SET' }
]

const statusOptions = [
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'En commande', value: 'EN_COMMANDE' },
  { label: 'Réservé', value: 'RESERVE' },
  { label: 'Indisponible', value: 'INDISPONIBLE' }
]

const formatCurrency = (value) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(value || 0)

const formatCompactNumber = (value) =>
  new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value || 0)

const openArticleDialog = () => {
  articleForm.value = {
    reference: '', alternative_code: '', personal_reference: '', barcode: '',
    name: '', description: '', manufacturer: '', manufacturer_ref: '',
    model: '', equipment_family: '',
    stock_unit: 'PC', quantity: 0, min_stock: 0, max_stock: null, unit_price: 0,
    site: null, warehouse: [], location_in_warehouse: '', storage_equipment: '',
    status: 'DISPONIBLE', stock_alerts_enabled: true, auto_replenishment: false, remarks: ''
  }
  articleErrors.value = {}
  showArticleDialog.value = true
}

const validateArticleForm = () => {
  articleErrors.value = {}
  if (!articleForm.value.reference) articleErrors.value.reference = 'La référence est obligatoire'
  if (!articleForm.value.name) articleErrors.value.name = 'Le nom est obligatoire'
  if (!articleForm.value.stock_unit) articleErrors.value.stock_unit = "L'unité est obligatoire"
  if (!articleForm.value.site) articleErrors.value.site = 'Le site est obligatoire'
  return Object.keys(articleErrors.value).length === 0
}

const submitArticle = async () => {
  if (!validateArticleForm()) {
    toast.add({ severity: 'warn', summary: 'Validation', detail: 'Veuillez remplir tous les champs obligatoires', life: 3000 })
    return
  }
  articleLoading.value = true
  try {
    const data = { ...articleForm.value, total_value: calculatedTotalValue.value, current_site: articleForm.value.site }
    await stockStore.createSparePart(data)
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Article créé avec succès', life: 3000 })
    showArticleDialog.value = false
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: err.response?.data?.message || 'Une erreur est survenue', life: 5000 })
  } finally {
    articleLoading.value = false
  }
}

// ─────────────────────────────────────────────
// MODAL : MOUVEMENT
// ─────────────────────────────────────────────
const showMovementDialog = ref(false)
const movementLoading = ref(false)
const movementErrors = ref({})
const barcodeInput = ref(null)

const movementForm = ref({
  movement_type: 'IN', spare_part: null, quantity: 0,
  unit_price: null, reason: null, notes: '',
  destination_site: null, destination_warehouse: []
})

const movementTypes = [
  { value: 'IN',       label: 'Entrée',    description: 'Ajout de stock',     icon: 'pi pi-arrow-down' },
  { value: 'OUT',      label: 'Sortie',    description: 'Retrait de stock',    icon: 'pi pi-arrow-up' },
  { value: 'TRANSFER', label: 'Transfert', description: 'Entre sites',         icon: 'pi pi-arrow-right-arrow-left' }
]

const reasonOptions = computed(() => {
  if (movementForm.value.movement_type === 'IN')
    return [
      { label: 'Achat / Réception', value: 'PURCHASE' },
      { label: 'Retour client', value: 'RETURN' },
      { label: 'Ajustement inventaire', value: 'ADJUSTMENT' },
      { label: 'Autre', value: 'OTHER' }
    ]
  if (movementForm.value.movement_type === 'OUT')
    return [
      { label: 'Consommation', value: 'CONSUMPTION' },
      { label: 'Vente', value: 'SALE' },
      { label: 'Perte / Casse', value: 'LOSS' },
      { label: 'Maintenance', value: 'MAINTENANCE' },
      { label: 'Ajustement inventaire', value: 'ADJUSTMENT' },
      { label: 'Autre', value: 'OTHER' }
    ]
  return [{ label: 'Transfert entre sites', value: 'TRANSFER' }]
})

const articleOptions = computed(() =>
  stockStore.spareParts.map(p => ({
    label: `${p.reference} — ${p.name} (Stock: ${p.quantity} ${p.stock_unit})`,
    value: p.id,
    data: p
  }))
)

const selectedArticleInfo = computed(() => {
  if (!movementForm.value.spare_part) return null
  return articleOptions.value.find(a => a.value === movementForm.value.spare_part)?.data || null
})

const calculateStockAfter = () => {
  if (!selectedArticleInfo.value) return 0
  return selectedArticleInfo.value.quantity - movementForm.value.quantity
}

const getStockAfterClass = () => {
  const after = calculateStockAfter()
  if (after < 0) return 'text-red'
  if (selectedArticleInfo.value && after < selectedArticleInfo.value.min_stock) return 'text-orange'
  return 'text-green'
}

const getMovementSeverity = (type) => ({ IN: 'success', OUT: 'danger', TRANSFER: 'info', ADJUSTMENT: 'warning' }[type] || 'secondary')
const getMovementLabel = (type) => ({ IN: 'Entrée', OUT: 'Sortie', TRANSFER: 'Transfert', ADJUSTMENT: 'Ajustement' }[type] || type)
const getMovementIconClass = (type) => ({ IN: 'reception', OUT: 'issue', TRANSFER: 'transfer', ADJUSTMENT: 'adjustment' }[type] || 'reception')
const getMovementIcon = (type) => ({ IN: 'pi pi-arrow-down', OUT: 'pi pi-arrow-up', TRANSFER: 'pi pi-arrow-right-arrow-left', ADJUSTMENT: 'pi pi-refresh' }[type] || 'pi pi-arrows-h')

const formatRelativeDate = (value) => {
  if (!value) return 'Date inconnue'
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return "À l'instant"
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Il y a ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR')
}

const handleArticleChange = () => {
  if (selectedArticleInfo.value?.unit_price)
    movementForm.value.unit_price = selectedArticleInfo.value.unit_price
}

const startBarcodeScan = () => { barcodeInput.value = '' }
const searchByBarcode = async () => {
  if (!barcodeInput.value?.trim()) return
  try {
    const res = await axiosInstance.get(`/stock/spare-parts/by_barcode/?barcode=${encodeURIComponent(barcodeInput.value.trim())}`)
    if (res.data.success && res.data.spare_part) {
      movementForm.value.spare_part = res.data.spare_part.id
      handleArticleChange()
      barcodeInput.value = null
      await stockStore.loadSpareParts()
    } else {
      toast.add({ severity: 'error', summary: 'Introuvable', detail: res.data.error || 'Article non trouvé', life: 3000 })
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: err.response?.data?.error || 'Erreur de recherche', life: 3000 })
  }
}

const openMovementDialog = async () => {
  movementForm.value = { movement_type: 'IN', spare_part: null, quantity: 0, unit_price: null, reason: null, notes: '', destination_site: null, destination_warehouse: [] }
  movementErrors.value = {}
  barcodeInput.value = null
  if (stockStore.spareParts.length === 0) await stockStore.loadSpareParts()
  if (warehouses.value.length === 0) await stockStore.loadWarehouses()
  showMovementDialog.value = true
}

const openMovementForArticle = async (article) => {
  await openMovementDialog()
  movementForm.value.spare_part = article.id
  handleArticleChange()
}

const validateMovementForm = () => {
  movementErrors.value = {}
  if (!movementForm.value.spare_part) movementErrors.value.spare_part = 'Sélectionnez un article'
  if (!movementForm.value.quantity || movementForm.value.quantity <= 0) movementErrors.value.quantity = 'La quantité doit être > 0'
  if (movementForm.value.movement_type === 'OUT' && selectedArticleInfo.value)
    if (movementForm.value.quantity > selectedArticleInfo.value.quantity)
      movementErrors.value.quantity = `Stock insuffisant (dispo: ${selectedArticleInfo.value.quantity})`
  if (movementForm.value.movement_type === 'TRANSFER') {
    if (!movementForm.value.destination_site) movementErrors.value.destination_site = 'Site de destination requis'
  }
  return Object.keys(movementErrors.value).length === 0
}

const submitMovement = async () => {
  if (!validateMovementForm()) {
    toast.add({ severity: 'warn', summary: 'Validation', detail: 'Veuillez corriger les erreurs', life: 3000 })
    return
  }
  movementLoading.value = true
  try {
    if (movementForm.value.movement_type === 'TRANSFER') {
      await stockStore.transferBetweenSites({
        spare_part: movementForm.value.spare_part,
        quantity: movementForm.value.quantity,
        from_site: selectedArticleInfo.value?.current_site,
        to_site: movementForm.value.destination_site,
        to_warehouse: movementForm.value.destination_warehouse,
        notes: movementForm.value.notes
      })
      toast.add({ severity: 'success', summary: 'Transfert effectué', detail: 'Le transfert a été enregistré', life: 3000 })
    } else {
      await stockStore.createMovement({
        spare_part: movementForm.value.spare_part,
        movement_type: movementForm.value.movement_type,
        quantity: movementForm.value.quantity,
        unit_price: movementForm.value.unit_price,
        reason: movementForm.value.reason,
        notes: movementForm.value.notes
      })
      toast.add({ severity: 'success', summary: 'Mouvement enregistré', detail: `${getMovementLabel(movementForm.value.movement_type)} de ${movementForm.value.quantity} enregistrée`, life: 3000 })
    }
    showMovementDialog.value = false
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: err.response?.data?.message || 'Une erreur est survenue', life: 5000 })
  } finally {
    movementLoading.value = false
  }
}

const showImportDialog = ref(false)

// ─────────────────────────────────────────────
// MODAL : ALERTES
// ─────────────────────────────────────────────
const showAllAlerts = ref(false)
const showDeadStock = ref(false)
const showLowCoverage = ref(false)

const handleStockImportUploaded = async (payload) => {
  if (payload?.type !== 'stock-import') return
  await refreshStockData({
    key: 'stock',
    payload: payload.data,
    timestamp: Date.now()
  })
}

// ─────────────────────────────────────────────
// Load initial data
// ─────────────────────────────────────────────
const refreshStockData = async (event = null) => {
  try {
    await Promise.all([
      stockStore.loadSpareParts(),
      stockStore.loadDashboardData(),
      stockStore.loadWarehouses(),
      stockStore.loadMovements(),
      stockStore.loadAlerts()
    ])
    if (event) {
      toast.add({
        severity: 'success',
        summary: 'Stock actualisé',
        detail: 'Les données de la page Matériaux ont été rafraîchies après import.',
        life: 3500
      })
    }
  } catch (err) {
    console.error('Erreur de rafraîchissement du stock après import', err)
  }
}

onMounted(async () => {
  await Promise.all([
    stockStore.loadSpareParts(),
    stockStore.loadWarehouses(),
    stockStore.loadDashboardData(),
    stockStore.loadMovements(),
    stockStore.loadAlerts()
  ])
  try {
    const res = await axiosInstance.get('sites/')
    if (res.data?.length) sites.value = res.data?.results || res.data
  } catch {}

  const lastEvent = importEvents.getLastImport('stock')
  if (lastEvent) {
    await refreshStockData(lastEvent)
  }

  const storedEvent = getStoredStockImport()
  if (storedEvent) {
    await refreshStockData(storedEvent)
    localStorage.removeItem('kap-last-stock-import')
  }

  window.addEventListener('kap-import-event', handleGlobalStockImport)
})

onBeforeUnmount(() => {
  window.removeEventListener('kap-import-event', handleGlobalStockImport)
})

watch(
  () => importEvents.lastImportEvent,
  async (event) => {
    if (event?.type === 'stock') {
      await refreshStockData(event)
    }
  }
)

watch(
  () => route.query.importedAt,
  async (importedAt) => {
    if (importedAt) {
      await refreshStockData({ key: 'stock', importedAt })
    }
  }
)

// ── Watcher for refresh after import ──
watch(
  () => stockStore.spareParts.length,
  async (newLength, oldLength) => {
    if (newLength > oldLength && oldLength > 0) {
      toast.add({
        severity: 'success',
        summary: 'Stock mis à jour',
        detail: `${newLength} articles disponibles`,
        life: 3000
      })
    }
  }
)

// ── Methods ──
const scrollToROPTable = (e) => {
  e.preventDefault()
  const element = document.querySelector('.rop-table')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const openArticleEditDialog = (article) => {
  articleForm.value = { ...article }
  articleErrors.value = {}
  showArticleDialog.value = true
}
</script>

<style scoped>
/* ─────────────────────────────────────────── */
/* BASE                                        */
/* ─────────────────────────────────────────── */
.stock-detail {
  background: #f0f2f8;
  min-height: 100vh;
  font-family: inherit;
}

/* ─────────────────────────────────────────── */
/* HEADER                                      */
/* ─────────────────────────────────────────── */
.stock-header {
  padding: 20px 28px;
  position: relative;
  overflow: hidden;
}
.stock-header::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at top right, rgba(99,102,241,.15) 0%, transparent 60%);
  pointer-events: none;
}

.header-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  position: relative;
}

.header-left { display: flex; align-items: center; gap: 14px; }

.header-icon {
  width: 46px; height: 46px;
  background: rgba(99,102,241,.2);
  border: 1px solid rgba(99,102,241,.4);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #a5b4fc; font-size: 1.4rem; flex-shrink: 0;
}

.header-text h1 { margin: 0; font-size: 1.35rem; font-weight: 700; color: #0B2B3C; letter-spacing: -0.01em; }
.header-text p  { margin: 3px 0 0; font-size: 0.8rem; color: #64748b; }

.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }

.action-btn {
  padding: 8px 18px;
  border: 1.5px solid rgba(255,255,255,.55);
  background: rgba(214, 243, 208, 0.73);
  border-radius: 7px;
  cursor: pointer;
  font-size: 0.83rem;
  font-weight: 600;
  color: #2b9e20;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.18s;
  backdrop-filter: blur(4px);
}
.action-btn:hover {
  border-color: rgba(23, 55, 85, 0.85);
  background: rgba(6, 36, 92, 0.89);
  color: #ffffff;
  box-shadow: 0 0 0 1px rgba(255,255,255,.2);
}
.action-btn.primary { background: #22c55e; border-color: #22c55e; color: #fff; }
.action-btn.primary:hover { background: #16a34a; border-color: #16a34a; box-shadow: 0 0 0 2px rgba(34,197,94,.35); }

/* ─────────────────────────────────────────── */
/* DASHBOARD CONTAINER                         */
/* ─────────────────────────────────────────── */
.dashboard-container { max-width: 1400px; margin: 0 auto; padding: 24px; }

/* ─────────────────────────────────────────── */
/* TOP KPI CARDS                               */
/* ─────────────────────────────────────────── */
.kpi-grid-top {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.kpi-card {
  background: white;
  padding: 18px 20px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
  display: flex;
  gap: 14px;
  align-items: center;
  border-top: 3px solid #3b82f6;
  transition: transform 0.2s, box-shadow 0.2s;
}
.kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.1); }
.kpi-card.warning  { border-top-color: #f59e0b; }
.kpi-card.info     { border-top-color: #8b5cf6; }
.kpi-card.secondary{ border-top-color: #0f172a; }

.kpi-icon {
  width: 48px; height: 48px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #2563eb; font-size: 1.4rem; flex-shrink: 0;
}
.kpi-icon.warning  { background: linear-gradient(135deg,#fef3c7,#fde68a); color: #d97706; }
.kpi-icon.info     { background: linear-gradient(135deg,#ede9fe,#ddd6fe); color: #7c3aed; }
.kpi-icon.secondary{ background: linear-gradient(135deg,#e2e8f0,#cbd5e1); color: #334155; }

.kpi-content { flex: 1; min-width: 0; }
.kpi-number  { display: block; font-size: 1.6rem; font-weight: 800; color: #0f172a; line-height: 1.1; margin-bottom: 2px; }
.kpi-label   { display: block; font-size: 0.72rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 3px; }
.kpi-card small { display: block; font-size: 0.72rem; color: #22c55e; font-weight: 500; }

.inline-link {
  appearance: none;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

/* ─────────────────────────────────────────── */
/* METRICS ROW                                 */
/* ─────────────────────────────────────────── */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.metric-box {
  background: white;
  padding: 16px 18px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  border-left: 4px solid #e2e8f0;
  transition: transform 0.2s;
}
.metric-box:hover { transform: translateY(-1px); }
.metric-box:nth-child(1) { border-left-color: #3b82f6; }
.metric-box:nth-child(2) { border-left-color: #ef4444; }
.metric-box:nth-child(3) { border-left-color: #10b981; }
.metric-box:nth-child(4) { border-left-color: #8b5cf6; }

.metric-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.metric-title  { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; }
.metric-label  { font-size: 0.65rem; color: #94a3b8; font-weight: 600; }
.metric-value  { font-size: 1.9rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; line-height: 1; }
.metric-value.negative { color: #dc2626; }
.metric-box small { display: block; font-size: 0.72rem; color: #64748b; margin-bottom: 5px; }
.metric-change {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 0.72rem; font-weight: 600;
  padding: 2px 6px; border-radius: 4px;
}
.metric-change.positive { color: #16a34a; background: #dcfce7; }
.metric-change.negative { color: #dc2626; background: #fee2e2; }
.metric-change.success  { color: #2563eb; background: #dbeafe; }

/* ─────────────────────────────────────────── */
/* CONTENT GRID                                */
/* ─────────────────────────────────────────── */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.left-column, .right-column { display: flex; flex-direction: column; gap: 18px; }

/* ─────────────────────────────────────────── */
/* CARDS                                       */
/* ─────────────────────────────────────────── */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.03);
  overflow: hidden;
  border: 1px solid rgba(226,232,240,.6);
}

.card-header {
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #fafbfc;
}
.card-header i     { color: #6366f1; font-size: 1.1rem; }
.card-header span  { font-weight: 600; color: #0f172a; font-size: 0.9rem; }
.card-header h3    { margin: 0; font-size: 0.9rem; font-weight: 600; color: #0f172a; }

.card-title {
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
  background: #fafbfc;
}

.badge { background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.badge.red { background: #fee2e2; color: #dc2626; }

/* ─────────────────────────────────────────── */
/* ALERTS                                      */
/* ─────────────────────────────────────────── */
.alerts-section { padding: 14px 18px; }
.alert-group { margin-bottom: 16px; }
.alert-group:last-child { margin-bottom: 0; }

.alert-type {
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;
}
.alert-type.rupture { background: #fee2e2; color: #dc2626; }
.alert-type.warning { background: #fef3c7; color: #d97706; }
.alert-type.info    { background: #dbeafe; color: #2563eb; }

.alert-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid #f8fafc;
  align-items: center;
  font-size: 0.83rem;
}
.alert-item:last-child { border-bottom: none; }
.alert-code  { font-weight: 700; color: #0f172a; font-family: monospace; font-size: 0.82rem; }
.alert-name  { color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qty         { color: #64748b; font-weight: 600; white-space: nowrap; }

.view-all {
  display: block;
  width: 100%;
  appearance: none;
  border: 0;
  padding: 10px 18px;
  background: transparent;
  color: #6366f1;
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  border-top: 1px solid #f1f5f9;
  transition: background 0.15s;
}
.view-all:hover { background: #f8fafc; }

/* ─────────────────────────────────────────── */
/* PARETO CHART                                */
/* ─────────────────────────────────────────── */
.pareto-container {
  padding: 12px 12px 0;
  background: #ffffff;
}
.pareto-svg {
  display: block;
  width: 100%;
  height: auto;
  min-height: 220px;
}
.pareto-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(90deg, #fffbeb, #fefce8);
  font-size: 0.82rem;
  border-top: 1px solid #fde68a;
  color: #78350f;
}
.pareto-info strong { color: #92400e; }

/* ─────────────────────────────────────────── */
/* KPI ECONOMICS                               */
/* ─────────────────────────────────────────── */
.kpi-economics { padding: 16px 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.econ-item {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.econ-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 6px; }
.econ-value { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin-bottom: 3px; }
.econ-item small { font-size: 0.7rem; color: #94a3b8; }

/* ─────────────────────────────────────────── */
/* ROP TABLE                                   */
/* ─────────────────────────────────────────── */
.rop-table { width: 100%; font-size: 0.83rem; border-collapse: collapse; }
.rop-table thead { background: #f8fafc; }
.rop-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 700;
  color: #475569;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 2px solid #e2e8f0;
}
.rop-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
.rop-table tbody tr:hover { background: #f8fafc; }
.rop-table .number { text-align: right; font-weight: 600; }

.status {
  display: inline-flex; align-items: center;
  padding: 3px 8px; border-radius: 20px;
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.3px;
}
.status.rupture { background: #fee2e2; color: #dc2626; }
.status.warning { background: #fef3c7; color: #d97706; }
.status.info    { background: #dbeafe; color: #2563eb; }

/* ─────────────────────────────────────────── */
/* DISTRIBUTION CHART                          */
/* ─────────────────────────────────────────── */
.distribution-chart { padding: 16px 18px; }

.dist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.dist-item:last-child { margin-bottom: 0; }

.dist-label-left { width: 90px; min-width: 90px; font-size: 0.8rem; color: #475569; }

.dist-bar-wrap {
  flex: 1;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}
.dist-bar { height: 8px; border-radius: 4px; min-width: 2px; transition: width 0.4s ease; }
.dist-bar.available  { background: linear-gradient(90deg, #22c55e, #16a34a); }
.dist-bar.reserved   { background: linear-gradient(90deg, #f59e0b, #d97706); }
.dist-bar.unavailable{ background: linear-gradient(90deg, #3b82f6, #2563eb); }
.dist-bar.obsolete   { background: linear-gradient(90deg, #ef4444, #dc2626); }

.dist-count { width: 28px; text-align: right; font-size: 0.82rem; font-weight: 700; color: #0f172a; flex-shrink: 0; }

/* ─────────────────────────────────────────── */
/* DEAD STOCK & LOW COVERAGE                   */
/* ─────────────────────────────────────────── */
.dead-stock-box {
  padding: 16px 18px;
  display: flex; flex-direction: column; gap: 4px;
  border-left: 4px solid #ef4444;
  background: linear-gradient(90deg, rgba(254,226,226,.45), white);
}
.dead-count { display: block; font-size: 1.4rem; font-weight: 800; color: #dc2626; }
.dead-stock-box small { font-size: 0.75rem; color: #991b1b; }

.low-coverage { border-top: 1px solid #f1f5f9; }
.low-coverage-box {
  padding: 16px 18px;
  display: flex; flex-direction: column; gap: 4px;
  border-left: 4px solid #f59e0b;
  background: linear-gradient(90deg, rgba(254,243,199,.45), white);
}
.low-count { display: block; font-size: 1.4rem; font-weight: 800; color: #d97706; }
.low-coverage-box small { font-size: 0.75rem; color: #92400e; }

/* ─────────────────────────────────────────── */
/* SUPPLIERS                                   */
/* ─────────────────────────────────────────── */
.suppliers-list { padding: 14px 18px; display: flex; flex-direction: column; gap: 14px; }
.supplier-item { display: flex; flex-direction: column; gap: 5px; }
.supplier-name { display: flex; justify-content: space-between; font-size: 0.85rem; color: #0f172a; font-weight: 500; }
.supplier-perf { font-weight: 700; }
.perf-bar { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.perf-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
.supplier-item small { font-size: 0.72rem; color: #94a3b8; }

/* ─────────────────────────────────────────── */
/* MOVEMENTS (timeline)                        */
/* ─────────────────────────────────────────── */
.movements-list { padding: 14px 18px; display: flex; flex-direction: column; }
.movement-item {
  display: flex; gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f8fafc;
}
.movement-item:last-child { border-bottom: none; }

.movement-icon {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 0.85rem; flex-shrink: 0;
}
.movement-icon.reception { background: linear-gradient(135deg, #22c55e, #16a34a); }
.movement-icon.issue     { background: linear-gradient(135deg, #f59e0b, #d97706); }
.movement-icon.transfer  { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.movement-icon.adjustment { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }

.movement-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.movement-info strong { font-size: 0.85rem; color: #0f172a; font-weight: 600; }
.movement-info small  { font-size: 0.75rem; color: #64748b; }
.time { font-size: 0.68rem; color: #94a3b8; font-weight: 500; }

.no-data-message.compact {
  padding: 1.25rem;
  color: #94a3b8;
  text-align: center;
}

.no-data-message.compact i {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 1.4rem;
}

.no-data-message.compact p {
  margin: 0;
  font-size: 0.82rem;
}

/* ─────────────────────────────────────────── */
/* MISC / RESPONSIVE                           */
/* ─────────────────────────────────────────── */
.search-container { background: white; border-bottom: 1px solid #e2e8f0; padding: 12px 24px; }
.search-wrapper { max-width: 1400px; margin: 0 auto; position: relative; display: flex; align-items: center; }
.search-wrapper i { position: absolute; left: 12px; color: #94a3b8; }
.search-wrapper input { width: 300px; padding: 8px 12px 8px 36px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; }

@media (max-width: 1024px) {
  .content-grid { grid-template-columns: 1fr; }
}

/* ═══════════════════════════════════════════ */
/* Shared Dialog styles (sd-*)                 */
/* ═══════════════════════════════════════════ */
.sd-form { padding: 1rem 0; }

.sd-section { margin-bottom: 1.75rem; }
.sd-section:last-child { margin-bottom: 0; }

.sd-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.sd-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.sd-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.sd-field label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}
.sd-field.required label::after { content: ' *'; color: #ef4444; }
.sd-field.sd-full { grid-column: 1 / -1; }
.sd-field.sd-checkbox { flex-direction: row; align-items: center; gap: 0.75rem; }
.sd-field.sd-checkbox label { margin: 0; cursor: pointer; }

.sd-calc-value {
  padding: 0.7rem 1rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-weight: 600;
  color: #111827;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
}

.sd-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

/* Movement type selector */
.sd-mv-types {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.sd-mv-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  text-align: center;
}
.sd-mv-card:hover { border-color: #3b82f6; background: #eff6ff; }
.sd-mv-card.active { border-color: #3b82f6; background: #dbeafe; }
.sd-mv-card.active .sd-mv-icon { color: #3b82f6; }

.sd-mv-icon { font-size: 2rem; color: #6b7280; margin-bottom: 0.4rem; }
.sd-mv-label { font-weight: 600; color: #111827; font-size: 0.9rem; margin-bottom: 0.15rem; }
.sd-mv-desc { font-size: 0.8rem; color: #6b7280; }

.sd-row-gap { display: flex; gap: 8px; align-items: center; }
.sd-flex1 { flex: 1; }
.sd-full-w { width: 100%; }
.sd-mt { margin-top: 10px; }
.sd-mt-sm { margin-top: 6px; }
.sd-mb { margin-bottom: 1rem; }

.sd-stock-info {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
}
.sd-info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0;
  font-size: 0.85rem;
  border-bottom: 1px solid #f1f5f9;
}
.sd-info-row:last-child { border-bottom: none; }
.sd-info-row span { color: #6b7280; }
.sd-info-row strong { color: #111827; }

.sd-summary {
  background: #f0f9ff;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  padding: 1.25rem;
  margin-top: 1.25rem;
}
.sd-summary h4 { margin: 0 0 0.75rem; font-size: 0.9rem; font-weight: 600; color: #111827; }
.sd-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  padding: 0.3rem 0;
}
.sd-summary-row span { color: #374151; }
.text-red { color: #dc2626; }
.text-orange { color: #ea580c; }
.text-green { color: #16a34a; }

/* Import dialog */
.sd-import-hdr { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #3b82f6; }

.sd-upload-area {
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  background: #f8fafc;
  margin-bottom: 1rem;
  transition: border-color 0.2s;
}
.sd-upload-area.has-file { border-color: #22c55e; }
.sd-upload-hint { margin-top: 1rem; }

.sd-file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.sd-error-list {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}
.sd-error-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: #dc2626;
  padding: 4px 0;
}

.sd-preview { margin-top: 1rem; }
.sd-preview-table {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .sd-grid { grid-template-columns: 1fr; }
  .sd-field.sd-full { grid-column: 1; }
  .sd-mv-types { grid-template-columns: 1fr; }
  .kpi-grid-top { grid-template-columns: repeat(2, 1fr); }
  .metrics-row  { grid-template-columns: repeat(2, 1fr); }
}
</style>
