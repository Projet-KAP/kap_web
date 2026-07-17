<template>
  <div class="tags-view">

    <!-- Page Header — AI First -->
    <div class="page-header">
      <div class="header-content">
        <h1>Configuration des Données</h1>
        <p class="subtitle">Définissez vos indicateurs et colonnes de suivi</p>
      </div>
      <div class="header-actions">
        <Button
          label="Créer avec l'IA"
          icon="pi pi-sparkles"
          class="btn-ai"
          @click="showAIAssistant = true"
        />
        <Button
          label="Ajouter manuellement"
          icon="pi pi-plus"
          outlined
          class="btn-manual"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <!-- AI Assistant Dialog -->
    <Dialog
      v-model:visible="showAIAssistant"
      header="Assistant de Création de Données"
      :style="{ width: '800px', maxHeight: '90vh' }"
      :modal="true"
      :dismissableMask="true"
      class="ai-assistant-dialog"
    >
      <TagDiscoveryAssistant
        :showClose="false"
        @tags-selected="handleTagsSelected"
        @configuration-complete="handleConfigurationComplete"
      />
    </Dialog>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-icon stat-icon--blue">
          <i class="pi pi-database"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ tags.length }}</span>
          <span class="stat-label">Données configurées</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--green">
          <i class="pi pi-chart-line"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ kpis.length }}</span>
          <span class="stat-label">Indicateurs KPI</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--orange">
          <i class="pi pi-calculator"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ formulaKPIs.length }}</span>
          <span class="stat-label">Formules</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--purple">
          <i class="pi pi-microchip"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ iotDevicesOnline }} / {{ iotDevices.length }}</span>
          <span class="stat-label">Capteurs en ligne</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="view-tabs">
      <button
        v-for="opt in viewOptions"
        :key="opt.value"
        class="tab-btn"
        :class="{ active: currentView === opt.value }"
        @click="currentView = opt.value"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Tab: Mes Données -->
    <div v-if="currentView === 'tags'" class="tab-content">
      <div class="tab-toolbar">
        <div class="toolbar-left">
          <Select
            v-model="selectedModule"
            :options="moduleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Module"
            style="width: 180px"
            @change="applyFilters"
          />
          <Select
            v-model="selectedTagType"
            :options="tagTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Type"
            style="width: 160px"
            @change="applyFilters"
          />
          <InputText
            v-model="searchQuery"
            placeholder="Rechercher..."
            class="search-input"
            @input="applyFilters"
          />
          <Button
            icon="pi pi-filter-slash"
            severity="secondary"
            outlined
            @click="resetFilters"
            v-tooltip.top="'Réinitialiser les filtres'"
          />
        </div>
        <div class="toolbar-right">
          <div v-if="selectedTags.length > 0" class="bulk-actions">
            <span class="bulk-label">{{ selectedTags.length }} sélectionné(s)</span>
            <Button icon="pi pi-check" severity="success" size="small" outlined @click="bulkActivate" v-tooltip.top="'Activer'" />
            <Button icon="pi pi-times" severity="warning" size="small" outlined @click="bulkDeactivate" v-tooltip.top="'Désactiver'" />
            <Button icon="pi pi-trash" severity="danger" size="small" outlined @click="bulkDelete" v-tooltip.top="'Supprimer'" />
          </div>
          <Button
            label="Colonnes Excel"
            icon="pi pi-link"
            severity="secondary"
            outlined
            @click="openColumnMappingDialog"
          />
        </div>
      </div>

      <div class="table-card">
        <div v-if="loading" class="loading-container">
          <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
          <p>Chargement...</p>
        </div>
        <template v-else>
          <DataTable
            v-model:selection="selectedTags"
            :value="tags"
            :loading="loading"
            stripedRows
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="{first}–{last} sur {totalRecords}"
          >
            <template #empty>
              <div class="empty-state">
                <div class="empty-icon">
                  <i class="pi pi-sparkles"></i>
                </div>
                <h3>Aucune donnée configurée</h3>
                <p>Utilisez l'assistant IA pour créer vos données automatiquement</p>
                <div class="empty-actions">
                  <Button
                    label="Créer avec l'IA"
                    icon="pi pi-sparkles"
                    class="btn-ai"
                    @click="showAIAssistant = true"
                  />
                  <Button
                    label="Ajouter manuellement"
                    icon="pi pi-plus"
                    outlined
                    @click="showCreateDialog = true"
                  />
                </div>
              </div>
            </template>

            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

            <Column field="display_name" header="Nom" :sortable="true" style="min-width: 200px">
              <template #body="{ data }">
                <div class="tag-name-cell">
                  <span class="display-name">{{ data.display_name || data.column_name }}</span>
                  <span
                    v-if="isTagUsedInKPI(data.id)"
                    class="kpi-badge"
                    v-tooltip.top="getKPIUsageTooltip(data.id)"
                  >KPI</span>
                </div>
              </template>
            </Column>

            <Column header="Module · Type" style="min-width: 180px">
              <template #body="{ data }">
                <div class="module-type-cell">
                  <Tag :value="data.module_display" severity="info" />
                  <Tag :value="data.tag_type_display" severity="secondary" />
                </div>
              </template>
            </Column>

            <Column field="column_name" header="Colonne Excel" :sortable="true" style="min-width: 130px"></Column>

            <Column field="data_type" header="Format" :sortable="true" style="min-width: 100px">
              <template #body="{ data }">
                <Tag :value="data.data_type_display" :severity="getDataTypeSeverity(data.data_type)" />
              </template>
            </Column>

            <Column field="is_active" header="Statut" style="min-width: 90px">
              <template #body="{ data }">
                <Tag
                  :value="data.is_active ? 'Actif' : 'Inactif'"
                  :severity="data.is_active ? 'success' : 'danger'"
                />
              </template>
            </Column>

            <Column header="Actions" style="width: 140px">
              <template #body="{ data }">
                <div class="row-actions">
                  <button
                    class="action-btn"
                    @click="previewTagValues(data)"
                    v-tooltip.top="'Aperçu'"
                    :disabled="data.data_type === 'TEXT' || data.data_type === 'BOOLEAN'"
                  >
                    <i class="pi pi-eye"></i>
                  </button>
                  <button
                    class="action-btn"
                    :class="{ 'action-btn--active-iot': getTagIoTMapping(data.id) }"
                    @click="openIoTMappingForTag(data)"
                    v-tooltip.top="getTagIoTMapping(data.id) ? 'Modifier mapping IoT' : 'Lier IoT'"
                  >
                    <i class="pi pi-wifi"></i>
                  </button>
                  <button
                    class="action-btn action-btn--edit"
                    @click="editTag(data)"
                    v-tooltip.top="'Modifier'"
                  >
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button
                    class="action-btn action-btn--delete"
                    @click="confirmDelete(data)"
                    v-tooltip.top="'Supprimer'"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </div>
    </div>

    <!-- Tab: Indicateurs KPI -->
    <div v-if="currentView === 'kpi'" class="tab-content">
      <div class="tab-toolbar">
        <div class="toolbar-left">
          <InputText
            v-model="kpiSearchQuery"
            placeholder="Rechercher un indicateur..."
            class="search-input"
            @input="applyKPIFilters"
          />
        </div>
        <div class="toolbar-right">
          <div v-if="selectedKPIs.length > 0" class="bulk-actions">
            <span class="bulk-label">{{ selectedKPIs.length }} sélectionné(s)</span>
            <Button icon="pi pi-trash" severity="danger" size="small" outlined @click="bulkDeleteKPIs" v-tooltip.top="'Supprimer'" />
          </div>
          <Button
            label="Nouvel indicateur"
            icon="pi pi-plus"
            @click="showCreateKPIDialog = true"
          />
        </div>
      </div>

      <div class="table-card">
        <div v-if="loadingKPIs" class="loading-container">
          <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
          <p>Chargement...</p>
        </div>
        <div v-else-if="kpis.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="pi pi-chart-line"></i>
          </div>
          <h3>Aucun indicateur configuré</h3>
          <p>Créez des KPIs à partir de vos données pour suivre vos performances</p>
          <Button
            label="Créer mon premier indicateur"
            icon="pi pi-plus"
            @click="showCreateKPIDialog = true"
          />
        </div>
        <DataTable
          v-else
          v-model:selection="selectedKPIs"
          :value="filteredKPIs"
          :loading="loadingKPIs"
          stripedRows
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first}–{last} sur {totalRecords}"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column field="name" header="Nom" :sortable="true" style="min-width: 200px">
            <template #body="{ data }">
              <span class="kpi-name">{{ data.name }}</span>
            </template>
          </Column>
          <Column field="type" header="Calcul" :sortable="true">
            <template #body="{ data }">
              <Tag :value="getKPITypeLabel(data.type)" severity="success" />
            </template>
          </Column>
          <Column field="model_name" header="Document source" :sortable="true">
            <template #body="{ data }">
              <span v-if="data.model_name">{{ data.model_name }}</span>
              <span v-else class="text-muted">—</span>
            </template>
          </Column>
          <Column field="unit" header="Unité">
            <template #body="{ data }">
              <span v-if="data.unit" class="unit-badge">{{ data.unit }}</span>
              <span v-else class="text-muted">—</span>
            </template>
          </Column>
          <Column header="Actions" style="width: 100px">
            <template #body="{ data }">
              <div class="row-actions">
                <button class="action-btn action-btn--edit" @click="editKPI(data)" v-tooltip.top="'Modifier'">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="action-btn action-btn--delete" @click="confirmDeleteKPI(data)" v-tooltip.top="'Supprimer'">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Tab: Formules -->
    <div v-if="currentView === 'formulas'" class="tab-content">
      <div class="tab-toolbar">
        <div class="toolbar-left"></div>
        <div class="toolbar-right">
          <Button
            label="Nouvelle formule"
            icon="pi pi-plus"
            @click="showCreateFormulaDialog = true"
          />
        </div>
      </div>
      <div class="table-card">
        <div v-if="loadingFormulaKPIs" class="loading-container">
          <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
          <p>Chargement...</p>
        </div>
        <div v-else-if="formulaKPIs.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="pi pi-calculator"></i>
          </div>
          <h3>Aucune formule définie</h3>
          <p>Combinez plusieurs KPIs avec des formules mathématiques</p>
          <Button
            label="Créer ma première formule"
            icon="pi pi-plus"
            @click="showCreateFormulaDialog = true"
          />
        </div>
        <DataTable
          v-else
          :value="formulaKPIs"
          :loading="loadingFormulaKPIs"
          stripedRows
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first}–{last} sur {totalRecords}"
        >
          <Column field="name" header="Nom de la formule" :sortable="true" style="min-width: 200px">
            <template #body="{ data }">
              <span class="formula-kpi-name">{{ data.name }}</span>
            </template>
          </Column>
          <Column field="formula" header="Formule" style="min-width: 300px">
            <template #body="{ data }">
              <code class="formula-display">{{ data.formula }}</code>
            </template>
          </Column>
          <Column header="Actions" style="width: 100px">
            <template #body="{ data }">
              <div class="row-actions">
                <button class="action-btn action-btn--edit" @click="editFormulaKPI(data)" v-tooltip.top="'Modifier'">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="action-btn action-btn--delete" @click="confirmDeleteFormulaKPI(data)" v-tooltip.top="'Supprimer'">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Tab: Capteurs IoT -->
    <div v-if="currentView === 'iot'" class="tab-content">
      <div class="tab-toolbar">
        <div class="toolbar-left">
          <InputText
            v-model="iotSearchQuery"
            placeholder="Rechercher un capteur..."
            class="search-input"
          />
          <Select
            v-model="iotStatusFilter"
            :options="iotStatusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Statut"
            style="width: 160px"
          />
        </div>
        <div class="toolbar-right">
          <Button
            label="Actualiser"
            icon="pi pi-refresh"
            outlined
            @click="refreshIoTData"
            :loading="loadingIoTTab"
          />
        </div>
      </div>

      <div class="table-card">
        <div v-if="loadingIoTTab" class="loading-container">
          <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
          <p>Chargement des capteurs...</p>
        </div>
        <div v-else-if="iotDevices.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="pi pi-microchip"></i>
          </div>
          <h3>Aucun capteur configure</h3>
          <p>Ajoutez des capteurs IoT depuis la page Sites pour commencer à recevoir des données</p>
        </div>
        <div v-else class="iot-devices-list">
          <div
            v-for="device in filteredIoTDevices"
            :key="device.id"
            class="iot-device-row"
            :class="{ expanded: expandedDevice === device.id }"
            @click="toggleDeviceExpand(device)"
          >
            <div class="device-summary">
              <div class="device-status-dot" :class="device.status"></div>
              <div class="device-info">
                <span class="device-name">{{ device.name }}</span>
                <span class="device-id">{{ device.device_id }}</span>
              </div>
              <div class="device-meta">
                <Tag
                  :value="device.status === 'online' ? 'En ligne' : device.status === 'offline' ? 'Hors ligne' : device.status"
                  :severity="device.status === 'online' ? 'success' : device.status === 'error' ? 'danger' : 'warn'"
                />
                <span class="device-type"><i class="pi pi-microchip"></i> {{ device.device_type }}</span>
                <span v-if="device.last_seen" class="device-last-seen">
                  <i class="pi pi-clock"></i> {{ formatTimeAgo(device.last_seen) }}
                </span>
              </div>
              <i class="pi expand-icon" :class="expandedDevice === device.id ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </div>

            <div v-if="expandedDevice === device.id" class="device-details" @click.stop>
              <div v-if="loadingDeviceData" class="loading-container" style="padding: 1rem">
                <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
              </div>
              <div v-else-if="expandedDeviceData.length === 0" class="device-no-data">
                <i class="pi pi-info-circle"></i> Aucune donnee recue pour ce capteur
              </div>
              <div v-else class="device-metrics-grid">
                <div v-for="metric in expandedDeviceMetrics" :key="metric.name" class="metric-card">
                  <div class="metric-header">
                    <span class="metric-name">{{ metric.display_name || metric.name }}</span>
                    <span class="metric-unit">{{ metric.unit }}</span>
                  </div>
                  <div class="metric-value">{{ metric.latest_value != null ? metric.latest_value.toFixed(2) : '—' }}</div>
                  <div class="metric-time">{{ metric.latest_time ? formatTimeAgo(metric.latest_time) : '' }}</div>
                </div>
              </div>
              <div v-if="expandedDeviceData.length > 0" class="device-data-table">
                <h4>Dernières données reçues</h4>
                <DataTable
                  :value="expandedDeviceData"
                  :rows="10"
                  :paginator="expandedDeviceData.length > 10"
                  stripedRows
                  size="small"
                >
                  <Column field="metric_name" header="Metrique" style="width: 25%" />
                  <Column header="Valeur" style="width: 25%">
                    <template #body="{ data }">
                      {{ typeof data.value === 'number' ? data.value.toFixed(3) : data.value ?? '—' }}
                    </template>
                  </Column>
                  <Column header="Date" style="width: 30%">
                    <template #body="{ data }">
                      {{ new Date(data.timestamp).toLocaleString() }}
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog Créer/Modifier IoT Mapping -->
    <Dialog
      v-model:visible="showCreateIoTMappingDialog"
      :modal="true"
      :style="{ width: '43.75rem', maxWidth: '95vw' }"
      :header="iotMappingDialogTitle"
    >
      <div class="iot-mapping-form">
        <!-- Tag info banner -->
        <div class="selected-tag-banner" v-if="selectedTagForIoT">
          <i class="pi pi-tag"></i>
          <div class="tag-info">
            <span class="tag-label">Tag sélectionné</span>
            <span class="tag-value">{{ selectedTagForIoT.tag_name }}</span>
          </div>
          <Tag :value="selectedTagForIoT.tag_type_display" severity="info" />
        </div>

        <div class="form-grid">
          <div class="form-field">
            <label>Device IoT <span class="required">*</span></label>
            <Select
              v-model="iotMappingForm.iot_device"
              :options="iotDevices"
              optionLabel="name"
              optionValue="id"
              placeholder="Sélectionner un device"
              class="w-full"
              filter
              @change="onIoTDeviceSelected"
            >
              <template #option="{ option }">
                <div class="device-option">
                  <i class="pi pi-microchip"></i>
                  <span>{{ option.name }}</span>
                  <small class="text-gray-500 ml-2">({{ option.device_id }})</small>
                </div>
              </template>
            </Select>
          </div>

          <div class="form-field">
            <label>Métrique <span class="required">*</span></label>
            <Select
              v-model="iotMappingForm.device_metric"
              :options="iotDeviceMetrics"
              optionLabel="display_name"
              optionValue="id"
              placeholder="Sélectionner une métrique"
              class="w-full"
              :disabled="!iotMappingForm.iot_device"
            >
              <template #option="{ option }">
                <span>{{ option.display_name }} <small>({{ option.unit }})</small></span>
              </template>
            </Select>
          </div>

          <div class="form-field">
            <label>Agrégation</label>
            <Select
              v-model="iotMappingForm.aggregation"
              :options="aggregationOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label>Période</label>
            <Select
              v-model="iotMappingForm.aggregation_period"
              :options="periodOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label>Description</label>
            <InputText
              v-model="iotMappingForm.description"
              placeholder="Description du mapping"
              class="w-full"
            />
          </div>
        </div>

        <Divider />

        <div class="form-section-title">
          <i class="pi pi-bell"></i>
          Seuils d'alerte (optionnel)
        </div>
        <div class="form-grid form-grid-4">
          <div class="form-field">
            <label>Alerte Min</label>
            <InputNumber v-model="iotMappingForm.alert_min" mode="decimal" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" />
          </div>
          <div class="form-field">
            <label>Alerte Max</label>
            <InputNumber v-model="iotMappingForm.alert_max" mode="decimal" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" />
          </div>
          <div class="form-field">
            <label>Avertissement Min</label>
            <InputNumber v-model="iotMappingForm.warning_min" mode="decimal" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" />
          </div>
          <div class="form-field">
            <label>Avertissement Max</label>
            <InputNumber v-model="iotMappingForm.warning_max" mode="decimal" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" />
          </div>
        </div>

        <div class="checkbox-field">
          <Checkbox v-model="iotMappingForm.is_active" :binary="true" inputId="is_active_create" />
          <label for="is_active_create">Mapping actif</label>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer dialog-footer-iot">
          <Button
            v-if="editingIoTMapping"
            label="Supprimer"
            icon="pi pi-trash"
            severity="danger"
            outlined
            @click="confirmDeleteIoTMapping(editingIoTMapping)"
          />
          <div class="dialog-footer-right">
            <Button label="Annuler" severity="secondary" @click="showCreateIoTMappingDialog = false; selectedTagForIoT = null" />
            <Button
              :label="editingIoTMapping ? 'Enregistrer' : 'Créer'"
              icon="pi pi-check"
              @click="handleIoTMappingCreate"
              :disabled="!iotMappingForm.iot_device || !iotMappingForm.device_metric"
            />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Dialog Modifier IoT Mapping (deprecated - using single dialog now) -->
    <Dialog
      v-model:visible="showEditIoTMappingDialog"
      :modal="true"
      :style="{ width: '43.75rem', maxWidth: '95vw' }"
      header="Modifier le Mapping IoT"
    >
      <div class="iot-mapping-form">
        <div class="form-grid">
          <div class="form-field">
            <label>Donnee</label>
            <Select
              v-model="iotMappingForm.mes_tag"
              :options="iotMesTagsAvailable"
              optionLabel="name"
              optionValue="id"
              class="w-full"
              disabled
            />
          </div>

          <div class="form-field">
            <label>Device IoT</label>
            <Select
              v-model="iotMappingForm.iot_device"
              :options="iotDevices"
              optionLabel="name"
              optionValue="id"
              class="w-full"
              disabled
            />
          </div>

          <div class="form-field">
            <label>Métrique</label>
            <Select
              v-model="iotMappingForm.device_metric"
              :options="iotDeviceMetrics"
              optionLabel="display_name"
              optionValue="id"
              class="w-full"
              disabled
            />
          </div>

          <div class="form-field">
            <label>Agrégation</label>
            <Select
              v-model="iotMappingForm.aggregation"
              :options="aggregationOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label>Période</label>
            <Select
              v-model="iotMappingForm.aggregation_period"
              :options="periodOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label>Description</label>
            <InputText
              v-model="iotMappingForm.description"
              placeholder="Description du mapping"
              class="w-full"
            />
          </div>
        </div>

        <Divider />

        <div class="form-section-title">
          <i class="pi pi-bell"></i>
          Seuils d'alerte
        </div>
        <div class="form-grid form-grid-4">
          <div class="form-field">
            <label>Alerte Min</label>
            <InputNumber v-model="iotMappingForm.alert_min" mode="decimal" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" />
          </div>
          <div class="form-field">
            <label>Alerte Max</label>
            <InputNumber v-model="iotMappingForm.alert_max" mode="decimal" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" />
          </div>
          <div class="form-field">
            <label>Avertissement Min</label>
            <InputNumber v-model="iotMappingForm.warning_min" mode="decimal" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" />
          </div>
          <div class="form-field">
            <label>Avertissement Max</label>
            <InputNumber v-model="iotMappingForm.warning_max" mode="decimal" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" />
          </div>
        </div>

        <Divider />

        <div class="form-section-title">
          <i class="pi pi-sliders-h"></i>
          Transformation
        </div>
        <div class="form-grid form-grid-3">
          <div class="form-field">
            <label>Facteur d'échelle</label>
            <InputNumber v-model="iotMappingForm.scale_factor" mode="decimal" :minFractionDigits="0" :maxFractionDigits="4" class="w-full" />
          </div>
          <div class="form-field">
            <label>Offset</label>
            <InputNumber v-model="iotMappingForm.offset" mode="decimal" :minFractionDigits="0" :maxFractionDigits="4" class="w-full" />
          </div>
          <div class="form-field">
            <label>Unité personnalisée</label>
            <InputText v-model="iotMappingForm.unit_override" placeholder="Ex: kWh" class="w-full" />
          </div>
        </div>

        <div class="checkbox-field">
          <Checkbox v-model="iotMappingForm.is_active" :binary="true" inputId="is_active_edit" />
          <label for="is_active_edit">Mapping actif</label>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button label="Annuler" severity="secondary" @click="showEditIoTMappingDialog = false" />
          <Button label="Enregistrer" icon="pi pi-check" @click="handleIoTMappingUpdate" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showCreateDialog"
      :modal="true"
      :style="{ width: '43.75rem' }"
    >
      <template #header>
        <h3>Nouvelle donnee</h3>
      </template>
      <TagForm
        ref="tagFormRef"
        :available-columns="allAvailableColumns"
        :document-models="documentModels"
        @save="handleCreate"
        @cancel="showCreateDialog = false"
      />
    </Dialog>

    <Dialog
      v-model:visible="showEditDialog"
      header="Modifier la donnee"
      :modal="true"
      :style="{ width: '43.75rem' }"
    >
      <TagForm
        :tag="selectedTag"
        :available-columns="allAvailableColumns"
        :document-models="documentModels"
        @save="handleUpdate"
        @cancel="showEditDialog = false"
      />
    </Dialog>

    <Dialog
      v-model:visible="showCreateKPIDialog"
      :modal="true"
      :style="{ width: '43.75rem' }"
      header="Nouvel indicateur"
    >
      <KPIManagementForm
        :kpi="editingKPI"
        :models="documentModels"
        :tags="tags"
        @save="handleKPISave"
        @cancel="showCreateKPIDialog = false"
      />
    </Dialog>

    <Dialog
      v-model:visible="showEditKPIDialog"
      :modal="true"
      :style="{ width: '43.75rem' }"
      header="Modifier l'indicateur"
    >
      <KPIManagementForm
        :kpi="editingKPI"
        :models="documentModels"
        :tags="tags"
        @save="handleKPIUpdate"
        @cancel="showEditKPIDialog = false"
      />
    </Dialog>

    <Dialog
      v-model:visible="showCreateFormulaDialog"
      :modal="true"
      :style="{ width: '56.25rem' }"
      header="Nouvelle formule"
    >
      <FormulaKPIForm
        :formula-kpi="editingFormulaKPI"
        :kpis="kpis"
        @save="handleFormulaKPISave"
        @cancel="showCreateFormulaDialog = false"
      />
    </Dialog>

    <Dialog
      v-model:visible="showEditFormulaDialog"
      :modal="true"
      :style="{ width: '56.25rem' }"
      header="Modifier la formule"
    >
      <FormulaKPIForm
        :formula-kpi="editingFormulaKPI"
        :kpis="kpis"
        @save="handleFormulaKPIUpdate"
        @cancel="showEditFormulaDialog = false"
      />
    </Dialog>

    <Dialog
      v-model:visible="showColumnMapping"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '75rem' }"
      header="Associer les colonnes Excel aux données"
      :maximizable="true"
    >
      <!-- Sélecteur de modèle de document -->
      <div class="document-selector-inline">
        <label class="selector-label">Modèle de document (template définissant les colonnes)</label>
        <Select
          v-model="selectedDocument"
          :options="documentModels"
          optionLabel="nom"
          placeholder="Sélectionnez un modèle de document"
          class="w-full"
          filter
          showClear
          @change="onSingleDocumentSelected"
        >
          <template #option="slotProps">
            <div class="document-option">
              <i class="pi pi-file-excel"></i>
              <div>
                <div class="option-name">{{ slotProps.option.nom }}</div>
                <div class="option-meta">{{ slotProps.option.document_fields?.length || 0 }} champs</div>
              </div>
            </div>
          </template>
        </Select>
      </div>

      <!-- Loading state -->
      <div v-if="loadingMappings" class="loading-container">
        <ProgressSpinner style="width: 3.125rem; height: 3.125rem" strokeWidth="4" />
        <p>Chargement des mappings...</p>
      </div>

      <div v-else-if="selectedDocument" class="column-mapping-container">
        <div class="mapping-header">
          <div class="document-header-info">
            <i class="pi pi-file-excel text-2xl"></i>
            <div>
              <h3>{{ selectedDocument.nom }}</h3>
              <p class="text-sm text-muted">{{ selectedDocument.document_fields?.length || 0 }} colonnes à mapper</p>
            </div>
          </div>

          <div class="mapping-stats">
            <div class="stat-item">
              <span class="stat-value">{{ getMappedColumnsCount() }}</span>
              <span class="stat-label">Mappées</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ getUnmappedColumnsCount() }}</span>
              <span class="stat-label">Non mappées</span>
            </div>
            <div class="stat-actions">
              <Button
                label="Créer tous les tags"
                icon="pi pi-plus-circle"
                severity="success"
                :disabled="getUnmappedColumnsCount() === 0 || creatingBulkTags"
                :loading="creatingBulkTags"
                @click="createTagsForAllUnmappedColumns"
                v-tooltip.top="'Créer automatiquement un tag pour toutes les colonnes non mappées'"
              />
            </div>
          </div>
        </div>

        <Divider />

        <DataTable
          :value="selectedDocument?.document_fields || []"
          :scrollable="true"
          scrollHeight="31.25rem"
          stripedRows
          class="mapping-table"
        >
          <Column field="label" header="Colonne" style="min-width: 12.5rem">
            <template #body="{ data }">
              <div class="column-info">
                <i class="pi pi-table text-primary"></i>
                <div>
                  <div class="column-label">{{ data.label }}</div>
                  <div class="column-name">{{ data.name }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="field_type" header="Type" style="min-width: 7.5rem">
            <template #body="{ data }">
              <Tag :value="data.field_type" severity="secondary" />
            </template>
          </Column>

          <Column header="Données associées" style="min-width: 18.75rem">
            <template #body="{ data }">
              <MultiSelect
                v-model="columnTagMapping[data.id]"
                :options="availableMESTags"
                optionLabel="name"
                optionValue="id"
                placeholder="Sélectionner des données"
                :filter="true"
                display="chip"
                class="w-full"
                @change="onColumnMappingChange(data.id)"
              >
                <template #option="slotProps">
                  <div class="tag-option-detailed">
                    <div class="tag-option-name">{{ slotProps.option.name }}</div>
                    <div class="tag-option-meta">
                      <Tag :value="slotProps.option.tag_type" severity="info" class="text-xs" />
                      <Tag :value="slotProps.option.mes_indicator" severity="success" class="text-xs" />
                    </div>
                  </div>
                </template>
              </MultiSelect>
            </template>
          </Column>

          <Column header="Actions" style="min-width: 9.375rem">
            <template #body="{ data }">
              <div class="actions-cell">
                <Button
                  icon="pi pi-plus"
                  label="Créer Tag"
                  severity="success"
                  size="small"
                  outlined
                  @click="createTagForColumn(data)"
                  v-tooltip.top="'Créer une nouvelle donnée pour cette colonne'"
                />
                <Button
                  icon="pi pi-chart-line"
                  label="KPI"
                  severity="info"
                  size="small"
                  outlined
                  @click="createKPIForColumn(data)"
                  v-tooltip.top="'Créer un KPI basé sur cette colonne'"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <div class="mapping-actions">
          <Button
            label="Annuler"
            severity="secondary"
            @click="showColumnMapping = false"
          />
          <Button
            label="Enregistrer les mappings"
            icon="pi pi-save"
            @click="saveColumnMappings"
            :loading="savingMappings"
          />
        </div>
      </div>
    </Dialog>

    <!-- Tag Values Preview Drawer -->
    <TagValuesPreview
      v-model="showTagValuesDialog"
      :tag="selectedTagForPreview"
      :iotMappings="iotMappings"
    />

    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMappingStore } from '@/stores/mappingStore.js'
import { useDocumentStore } from '@/features/documents/stores/documentStore'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { axiosInstance } from '@/main'

import TagForm from '../components/TagForm.vue'
import TagValuesPreview from '../components/TagValuesPreview.vue'
import TagDiscoveryAssistant from '@/features/ai/components/TagDiscoveryAssistant.vue'
import SelectButton from 'primevue/selectbutton'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import InputText from 'primevue/inputtext'
import KPIManagementForm from '../components/KPIManagementForm.vue'
import FormulaKPIForm from '../components/FormulaKPIForm.vue'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'

const mappingStore = useMappingStore()
const documentStore = useDocumentStore()
const { tags, loading, choices } = storeToRefs(mappingStore)
const confirm = useConfirm()
const toast = useToast()

const currentView = ref('tags')
const viewOptions = ref([
  { label: 'Mes données', value: 'tags' },
  { label: 'Indicateurs', value: 'kpi' },
  { label: 'Formules', value: 'formulas' },
  { label: 'Capteurs', value: 'iot' }
])

// IoT tab state
const iotSearchQuery = ref('')
const iotStatusFilter = ref(null)
const iotStatusOptions = ref([
  { label: 'Tous', value: null },
  { label: 'En ligne', value: 'online' },
  { label: 'Hors ligne', value: 'offline' },
  { label: 'Erreur', value: 'error' },
])
const loadingIoTTab = ref(false)
const expandedDevice = ref(null)
const expandedDeviceData = ref([])
const expandedDeviceMetrics = ref([])
const loadingDeviceData = ref(false)

const iotDevicesOnline = computed(() => iotDevices.value.filter(d => d.status === 'online').length)

const filteredIoTDevices = computed(() => {
  let list = iotDevices.value
  if (iotStatusFilter.value) {
    list = list.filter(d => d.status === iotStatusFilter.value)
  }
  if (iotSearchQuery.value) {
    const q = iotSearchQuery.value.toLowerCase()
    list = list.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.device_id.toLowerCase().includes(q)
    )
  }
  return list
})

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showAIAssistant = ref(false)
const selectedTag = ref(null)
const tagFormRef = ref(null)

const selectedModule = ref(null)
const selectedTagType = ref(null)
const searchQuery = ref('')
const selectedTags = ref([])

// Document and Column Mapping
const selectedDocument = ref(null)
const selectedDocuments = ref([])
const showColumnMapping = ref(false)
const columnTagMapping = ref({})
const savingMappings = ref(false)
const availableMESTags = ref([])
const creatingBulkTags = ref(false)
const loadingMappings = ref(false)

// Ouvrir le dialog de mapping des colonnes
const openColumnMappingDialog = () => {
  showColumnMapping.value = true
}

// Gestionnaire pour la sélection d'un seul document (mapping colonnes)
const onSingleDocumentSelected = async () => {
  if (selectedDocument.value) {
    await loadColumnMappings()
  } else {
    columnTagMapping.value = {}
  }
}

// KPI Management
const kpis = ref([])
const selectedKPIs = ref([])
const loadingKPIs = ref(true)
const showCreateKPIDialog = ref(false)
const showEditKPIDialog = ref(false)
const editingKPI = ref(null)
const documentModels = ref([])
const kpiSearchQuery = ref('')

// Tag Values Preview
const showTagValuesDialog = ref(false)
const selectedTagForPreview = ref(null)

// Formula KPI Management
const formulaKPIs = ref([])
const loadingFormulaKPIs = ref(true)
const showCreateFormulaDialog = ref(false)
const showEditFormulaDialog = ref(false)
const editingFormulaKPI = ref(null)

// IoT Tag Mapping Management
const iotMappings = ref([])
const loadingIoTMappings = ref(false)
const showCreateIoTMappingDialog = ref(false)
const showEditIoTMappingDialog = ref(false)
const editingIoTMapping = ref(null)
const selectedTagForIoT = ref(null)
const iotDevices = ref([])
const iotDeviceMetrics = ref([])
const iotMesTagsAvailable = ref([])
const iotKpiSummary = ref({})

// IoT compatible tag types
const iotCompatibleTagTypes = ['COURANT', 'TEMPERATURE', 'HUMIDITE', 'ACCELERATION', 'PRESSION', 'VIBRATION']

// Computed for IoT dialog title
const iotMappingDialogTitle = computed(() => {
  if (selectedTagForIoT.value) {
    const existingMapping = getTagIoTMapping(selectedTagForIoT.value.id)
    return existingMapping ? 'Modifier le Mapping IoT' : 'Lier à un Capteur IoT'
  }
  return 'Nouveau Mapping IoT'
})

// Check if tag has IoT mapping
const getTagIoTMapping = (tagId) => {
  return iotMappings.value.find(m => m.mes_tag === tagId)
}

// Check if tag is IoT compatible
const isIoTCompatibleTag = (tag) => {
  return iotCompatibleTagTypes.includes(tag.tag_type) ||
         (tag.data_type === 'DECIMAL' || tag.data_type === 'NUMBER')
}

// Open IoT mapping dialog for a specific tag
const openIoTMappingForTag = async (tag) => {
  selectedTagForIoT.value = tag
  const existingMapping = getTagIoTMapping(tag.id)

  // Load IoT devices if not already loaded
  if (iotDevices.value.length === 0) {
    await loadIoTDevices()
  }

  if (existingMapping) {
    // Edit existing mapping
    editingIoTMapping.value = existingMapping
    iotMappingForm.value = {
      mes_tag: existingMapping.mes_tag,
      iot_device: existingMapping.iot_device,
      device_metric: existingMapping.device_metric,
      aggregation: existingMapping.aggregation,
      aggregation_period: existingMapping.aggregation_period,
      alert_min: existingMapping.alert_min,
      alert_max: existingMapping.alert_max,
      warning_min: existingMapping.warning_min,
      warning_max: existingMapping.warning_max,
      scale_factor: existingMapping.scale_factor || 1.0,
      offset: existingMapping.offset || 0.0,
      unit_override: existingMapping.unit_override || '',
      description: existingMapping.description || '',
      is_active: existingMapping.is_active
    }
    // Load device metrics
    if (existingMapping.iot_device) {
      await onIoTDeviceSelected()
    }
  } else {
    // Create new mapping
    editingIoTMapping.value = null
    iotMappingForm.value = {
      mes_tag: tag.id,
      iot_device: null,
      device_metric: null,
      aggregation: 'LAST',
      aggregation_period: 'REALTIME',
      alert_min: null,
      alert_max: null,
      warning_min: null,
      warning_max: null,
      scale_factor: 1.0,
      offset: 0.0,
      unit_override: tag.unit || '',
      description: '',
      is_active: true
    }
    iotDeviceMetrics.value = []
  }

  showCreateIoTMappingDialog.value = true
}
const iotMappingForm = ref({
  mes_tag: null,
  iot_device: null,
  device_metric: null,
  aggregation: 'LAST',
  aggregation_period: 'REALTIME',
  alert_min: null,
  alert_max: null,
  warning_min: null,
  warning_max: null,
  scale_factor: 1.0,
  offset: 0.0,
  unit_override: '',
  description: '',
  is_active: true
})
const aggregationOptions = ref([
  { label: 'Dernière valeur', value: 'LAST' },
  { label: 'Moyenne', value: 'AVG' },
  { label: 'Somme', value: 'SUM' },
  { label: 'Minimum', value: 'MIN' },
  { label: 'Maximum', value: 'MAX' },
  { label: 'Comptage', value: 'COUNT' },
  { label: 'Variation (delta)', value: 'DELTA' },
  { label: 'Taux de variation', value: 'RATE' }
])
const periodOptions = ref([
  { label: 'Temps réel', value: 'REALTIME' },
  { label: 'Par minute', value: 'MINUTE' },
  { label: 'Par heure', value: 'HOUR' },
  { label: 'Par équipe (8h)', value: 'SHIFT' },
  { label: 'Par jour', value: 'DAY' },
  { label: 'Par semaine', value: 'WEEK' },
  { label: 'Par mois', value: 'MONTH' }
])

const moduleOptions = computed(() => {
  return [
    { label: 'Tous', value: null },
    ...(choices.value.module_choices || [])
  ]
})

const tagTypeOptions = computed(() => {
  return [
    { label: 'Tous', value: null },
    ...(choices.value.tag_type_choices || [])
  ]
})

// Computed property pour le nombre total de colonnes de tous les documents sélectionnés
const totalColumnsFromSelectedDocs = computed(() => {
  if (!selectedDocuments.value || selectedDocuments.value.length === 0) return 0
  return selectedDocuments.value.reduce((total, doc) => {
    return total + (doc.document_fields?.length || 0)
  }, 0)
})

// Computed property pour combiner les colonnes de tous les documents sélectionnés
const combinedColumnsFromDocs = computed(() => {
  if (!selectedDocuments.value || selectedDocuments.value.length === 0) return []

  const allColumns = []
  selectedDocuments.value.forEach(doc => {
    if (doc.document_fields) {
      doc.document_fields.forEach(field => {
        allColumns.push({
          ...field,
          documentName: doc.nom,
          documentId: doc.id
        })
      })
    }
  })
  return allColumns
})

// Computed pour obtenir TOUTES les colonnes de tous les documentModels (pour le formulaire de tag)
const allAvailableColumns = computed(() => {
  if (!documentModels.value || documentModels.value.length === 0) return []

  const allColumns = []
  documentModels.value.forEach(doc => {
    if (doc.document_fields) {
      doc.document_fields.forEach(field => {
        allColumns.push({
          ...field,
          documentName: doc.nom,
          documentId: doc.id
        })
      })
    }
  })
  return allColumns
})

const applyFilters = async () => {
  const filters = {}
  if (selectedModule.value) filters.module = selectedModule.value
  if (selectedTagType.value) filters.tag_type = selectedTagType.value
  if (searchQuery.value) filters.search = searchQuery.value
  
  await mappingStore.loadTags(filters)
}

const resetFilters = async () => {
  selectedModule.value = null
  selectedTagType.value = null
  searchQuery.value = ''
  await mappingStore.loadTags()
}

// AI Assistant handlers
const handleTagsSelected = (tags) => {
  console.log('Tags selectionnes:', tags)
  // Refresh the tags list after AI configuration
  mappingStore.loadTags()
}

const handleConfigurationComplete = (config) => {
  console.log('Configuration complete:', config)
  showAIAssistant.value = false
  mappingStore.loadTags()
  toast.add({
    severity: 'success',
    summary: 'Configuration terminee',
    detail: 'Vos tags ont été configurés avec succès',
    life: 3000
  })
}

const editTag = (tag) => {
  selectedTag.value = tag
  showEditDialog.value = true
}

const confirmDelete = (tag) => {
  confirm.require({
    message: `Etes-vous sur de vouloir supprimer la donnee "${tag.tag_name}" ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: () => handleDelete(tag.id)
  })
}

const handleCreate = async (tagData) => {
  try {
    await mappingStore.createTag(tagData)
    // Recharger la liste des tags pour afficher le nouveau tag
    await mappingStore.loadTags()
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Donnée créée avec succès',
      life: 3000
    })
    showCreateDialog.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.tag_name?.[0] || error.response?.data?.display_name?.[0] || 'Erreur lors de la creation',
      life: 3000
    })
  }
}

const handleUpdate = async (tagData) => {
  try {
    await mappingStore.updateTag(selectedTag.value.id, tagData)
    // Recharger la liste des tags pour afficher les modifications
    await mappingStore.loadTags()
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Donnée modifiée avec succès',
      life: 3000
    })
    showEditDialog.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la modification',
      life: 3000
    })
  }
}

const handleDelete = async (id) => {
  try {
    await mappingStore.deleteTag(id)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Donnée supprimée avec succès',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la suppression',
      life: 3000
    })
  }
}

const getDataTypeSeverity = (dataType) => {
  const severities = {
    'NUMBER': 'info',
    'DECIMAL': 'info',
    'TEXT': 'secondary',
    'DATE': 'success',
    'DATETIME': 'success',
    'BOOLEAN': 'warning',
    'PERCENTAGE': 'info',
    'DURATION': 'warning',
    'RELATION': 'contrast'
  }
  return severities[dataType] || 'secondary'
}

const getKPITypeLabel = (type) => {
  const labels = {
    'SUM': 'Somme',
    'AVG': 'Moyenne',
    'COUNT': 'Compte',
    'RATIO': 'Rapport/Ratio',
    'FORMULA': 'Formule personnalisée'
  }
  return labels[type] || type
}

// Check if a tag is used in any KPI
const isTagUsedInKPI = (tagId) => {
  return kpis.value.some(kpi => {
    if (kpi.source_tags && kpi.source_tags.includes(tagId)) return true
    if (kpi.numerator_tag && kpi.numerator_tag.id === tagId) return true
    if (kpi.denominator_tag && kpi.denominator_tag.id === tagId) return true
    return false
  })
}

// Get tooltip showing which KPIs use this tag
const getKPIUsageTooltip = (tagId) => {
  const usedInKPIs = kpis.value.filter(kpi => {
    if (kpi.source_tags && kpi.source_tags.includes(tagId)) return true
    if (kpi.numerator_tag && kpi.numerator_tag.id === tagId) return true
    if (kpi.denominator_tag && kpi.denominator_tag.id === tagId) return true
    return false
  })

  if (usedInKPIs.length === 0) return ''

  const kpiNames = usedInKPIs.map(kpi => kpi.name).join(', ')
  return `Utilisé dans: ${kpiNames}`
}

// Get chart suggestions based on data type and tag type
const getChartSuggestions = (dataType, tagType) => {
  const suggestions = []

  // Numeric data types
  if (dataType === 'NUMBER' || dataType === 'DECIMAL' || dataType === 'PERCENTAGE') {
    suggestions.push({
      type: 'bar',
      label: 'Barre',
      icon: 'pi pi-chart-bar',
      severity: 'info',
      description: 'Graphique en barres - Compare des valeurs entre catégories'
    })
    suggestions.push({
      type: 'line',
      label: 'Ligne',
      icon: 'pi pi-chart-line',
      severity: 'success',
      description: 'Graphique linéaire - Montre les tendances dans le temps'
    })

    if (dataType === 'PERCENTAGE') {
      suggestions.push({
        type: 'pie',
        label: 'Camembert',
        icon: 'pi pi-chart-pie',
        severity: 'warning',
        description: 'Graphique circulaire - Montre les proportions'
      })
    }
  }

  // Date/DateTime data types
  if (dataType === 'DATE' || dataType === 'DATETIME') {
    suggestions.push({
      type: 'timeline',
      label: 'Timeline',
      icon: 'pi pi-clock',
      severity: 'secondary',
      description: 'Timeline - Visualise la chronologie des événements'
    })
  }

  // Production/Quality specific
  if (tagType === 'PRODUCTION' || tagType === 'QUALITE') {
    suggestions.push({
      type: 'gauge',
      label: 'Jauge',
      icon: 'pi pi-gauge',
      severity: 'contrast',
      description: 'Jauge - Affiche la performance par rapport à un objectif'
    })
  }

  return suggestions
}

// Preview tag values - opens the drawer with tag data preview
const previewTagValues = (tag) => {
  selectedTagForPreview.value = tag
  showTagValuesDialog.value = true
}

// Create a KPI from tag - pre-fills the KPI form with tag data
const createKPIFromTag = (tag) => {
  editingKPI.value = {
    name: `KPI - ${tag.display_name || tag.tag_name}`,
    type: 'SUM',
    source_tags: [tag.id],
    unit: tag.unit || '',
    description: `KPI généré à partir du tag ${tag.tag_name}`
  }
  showCreateKPIDialog.value = true
}

// Document and Column Mapping functions
const onDocumentSelected = async () => {
  if (selectedDocument.value) {
    // Load existing mappings for this document
    await loadColumnMappings()
  }
}

// Gestionnaire pour la sélection multiple de documents
const onDocumentsSelected = async () => {
  if (selectedDocuments.value && selectedDocuments.value.length > 0) {
    // Utiliser le premier document sélectionné comme document principal pour la compatibilité
    selectedDocument.value = selectedDocuments.value[0]
    // Charger les mappings pour tous les documents sélectionnés
    await loadColumnMappingsForAllDocs()
  } else {
    selectedDocument.value = null
    columnTagMapping.value = {}
  }
}

// Charger les mappings pour tous les documents sélectionnés
const loadColumnMappingsForAllDocs = async () => {
  loadingMappings.value = true
  try {
    columnTagMapping.value = {}

    // Charger tous les mappings en parallèle pour plus de rapidité
    const promises = selectedDocuments.value.map(doc =>
      axiosInstance.get(`/documents/field-tags/?document_modele=${doc.id}`)
    )

    const responses = await Promise.all(promises)

    responses.forEach((response, index) => {
      const doc = selectedDocuments.value[index]
      const fieldTags = response.data.results || response.data || []

      // Initialiser les mappings pour chaque champ de ce document
      doc.document_fields?.forEach(field => {
        const existingTags = fieldTags
          .filter(ft => ft.document_field === field.id)
          .map(ft => ft.mes_tag)
        columnTagMapping.value[field.id] = existingTags
      })
    })
  } catch (error) {
    console.error('Error loading column mappings:', error)
  } finally {
    loadingMappings.value = false
  }
}

const loadColumnMappings = async () => {
  loadingMappings.value = true
  try {
    const response = await axiosInstance.get(`/documents/field-tags/?document_modele=${selectedDocument.value.id}`)
    const fieldTags = response.data.results || response.data || []

    // Initialize columnTagMapping with existing tags
    columnTagMapping.value = {}
    selectedDocument.value.document_fields?.forEach(field => {
      const existingTags = fieldTags
        .filter(ft => ft.document_field === field.id)
        .map(ft => ft.mes_tag)
      columnTagMapping.value[field.id] = existingTags
    })
  } catch (error) {
    console.error('Error loading column mappings:', error)
  } finally {
    loadingMappings.value = false
  }
}

const loadMESTags = async () => {
  try {
    const response = await axiosInstance.get('/collect/mes-tags/')
    let allTags = response.data.results || response.data || []
    
    // Gérer la pagination si nécessaire
    if (response.data.count && response.data.count > allTags.length) {
      const pageSize = response.data.results?.length || 25
      const totalPages = Math.ceil(response.data.count / pageSize)
      const additionalRequests = []
      
      for (let page = 2; page <= totalPages; page++) {
        additionalRequests.push(
          axiosInstance.get('/collect/mes-tags/', {
            params: { page: page }
          })
        )
      }
      
      if (additionalRequests.length > 0) {
        const additionalResponses = await Promise.all(additionalRequests)
        additionalResponses.forEach(res => {
          const pageTags = res.data.results || []
          allTags = allTags.concat(pageTags)
        })
      }
    }
    
    availableMESTags.value = allTags
  } catch (error) {
    console.error('Error loading MES tags:', error)
    availableMESTags.value = []
  }
}

const onColumnMappingChange = (columnId) => {
  // Mapping changed
}

const getMappedColumnsCount = () => {
  return Object.values(columnTagMapping.value).filter(tags => tags && tags.length > 0).length
}

const getUnmappedColumnsCount = () => {
  // Compter les colonnes du document sélectionné
  const totalColumns = selectedDocument.value?.document_fields?.length || 0
  return totalColumns - getMappedColumnsCount()
}

const createTagForColumn = (column) => {
  // Pre-fill tag form with column information
  showColumnMapping.value = false
  showCreateDialog.value = true

  // Wait for next tick to access tagFormRef
  setTimeout(() => {
    if (tagFormRef.value?.fillFormData) {
      tagFormRef.value.fillFormData({
        tag_name: column.name.toUpperCase().replace(/\s+/g, '_'),
        column_name: column.label,
        data_type: mapFieldTypeToDataType(column.field_type),
        module: 'MES',
        tag_type: 'PRODUCTION',
        is_active: true
      })
    }
  }, 100)
}

const createTagsForAllUnmappedColumns = async () => {
  if (!selectedDocument.value) {
    return
  }

  // Récupérer toutes les colonnes non mappées du document sélectionné
  const unmappedColumns = (selectedDocument.value.document_fields || []).filter(field => {
    const mappedTags = columnTagMapping.value[field.id]
    return !mappedTags || mappedTags.length === 0
  })

  if (unmappedColumns.length === 0) {
    toast.add({
      severity: 'info',
      summary: 'Information',
      detail: 'Toutes les colonnes sont déjà mappées',
      life: 3000
    })
    return
  }

  creatingBulkTags.value = true
  let successCount = 0
  let errorCount = 0
  const errors = []

  try {
    // Recharger les tags pour avoir la liste à jour AVANT de commencer
    await mappingStore.loadTags()
    await loadMESTags() // Recharger aussi les tags MES
    // Attendre un peu pour s'assurer que les tags sont bien chargés
    await new Promise(resolve => setTimeout(resolve, 200))

    for (const column of unmappedColumns) {
      try {
        // Générer un nom de tag à partir du nom de la colonne
        let tagName = (column.field_id || column.name || column.label || 'COLUMN')
          .toUpperCase()
          .replace(/\s+/g, '_')
          .replace(/[^A-Z0-9_]/g, '')
        
        // S'assurer que le nom du tag n'est pas vide
        if (!tagName || tagName.length === 0) {
          tagName = `COLUMN_${column.id || Date.now()}`
        }
        
        // Chercher si un MESCollectTag existe déjà par name dans availableMESTags
        let existingTag = availableMESTags.value.find(tag => tag.name === tagName)
        
        // Si pas trouvé par name, chercher par nom similaire (normalisé)
        if (!existingTag) {
          const normalizedTagName = tagName.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
          existingTag = availableMESTags.value.find(tag => {
            if (!tag.name) return false
            const normalizedExisting = tag.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
            return normalizedExisting === normalizedTagName ||
                   tag.name.toUpperCase() === tagName ||
                   tag.name.toUpperCase().replace(/\s+/g, '_') === tagName
          })
        }
        
        // Si aucun tag n'existe, créer un MESCollectTag (pas un ColumnTag)
        if (!existingTag) {
          const tagData = {
            name: tagName,
            tag_type: 'PRODUCTION',
            description: `Donnee creee automatiquement pour la colonne "${column.label || column.field_id || column.id}"`
          }
          
          try {
            // Créer via l'endpoint /collect/mes-tags/ (MESCollectTag)
            const response = await axiosInstance.post('/collect/mes-tags/', tagData)
            existingTag = response.data
            successCount++
            
            // Ajouter au tableau availableMESTags
            availableMESTags.value.push(existingTag)
          } catch (createError) {
            // Si le tag existe déjà (erreur 400), recharger et chercher à nouveau
            if (createError.response?.status === 400) {
              // Recharger les tags MES pour avoir la liste à jour (avec pagination)
              await loadMESTags()
              
              // Attendre un peu pour s'assurer que les tags sont bien chargés
              await new Promise(resolve => setTimeout(resolve, 300))
              
              // Chercher le tag existant par name (exact match)
              existingTag = availableMESTags.value.find(tag => tag.name === tagName)
              
              // Si toujours pas trouvé, chercher par nom similaire (normalisé)
              if (!existingTag) {
                const normalizedTagName = tagName.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
                
                existingTag = availableMESTags.value.find(tag => {
                  if (!tag.name) return false
                  const normalizedExisting = tag.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
                  return normalizedExisting === normalizedTagName ||
                         tag.name.toUpperCase() === tagName ||
                         tag.name.toUpperCase().replace(/\s+/g, '_') === tagName
                })
              }
              
              if (existingTag) {
                // Tag existe déjà, utiliser celui-ci (overwrite)
                successCount++
              } else {
                errorCount++
                const errorMsg = createError.response?.data?.name?.[0] || 
                                createError.response?.data?.non_field_errors?.[0] ||
                                'Tag existe mais impossible de le trouver après rechargement'
                errors.push(`${column.label || column.field_id}: ${errorMsg}`)
              }
            } else {
              errorCount++
              errors.push(`${column.label || column.field_id}: ${createError.message || 'Erreur inconnue'}`)
            }
          }
        } else {
          // Tag existe déjà, compter comme succès
          successCount++
        }
        
        // Mapper automatiquement le tag créé/trouvé à la colonne
        if (existingTag) {
          if (!columnTagMapping.value[column.id]) {
            columnTagMapping.value[column.id] = []
          }
          if (!columnTagMapping.value[column.id].includes(existingTag.id)) {
            columnTagMapping.value[column.id].push(existingTag.id)
          }
        } else {
          // Pas de tag trouvé ni créé
          errorCount++
          errors.push(`${column.label || column.field_id}: Impossible de trouver ou créer le tag`)
        }
      } catch (error) {
        errorCount++
        errors.push(`${column.label || column.field_id}: ${error.message || 'Erreur inconnue'}`)
      }
    }

    // Recharger les tags pour afficher les nouveaux
    await mappingStore.loadTags()
    await loadMESTags()

    // Sauvegarder les mappings pour créer les DocumentFieldTag en base de données
    if (successCount > 0) {
      try {
        await saveColumnMappings()
      } catch (saveError) {
        toast.add({
          severity: 'warn',
          summary: 'Avertissement',
          detail: 'Les tags ont été créés mais les mappings n\'ont pas pu être sauvegardés. Veuillez les sauvegarder manuellement.',
          life: 5000
        })
      }
    }

    // Afficher le résultat
    if (errorCount === 0) {
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: `${successCount} tag(s) créé(s) et mappé(s) avec succès`,
        life: 5000
      })
    } else {
      toast.add({
        severity: successCount > 0 ? 'warn' : 'error',
        summary: successCount > 0 ? 'Partiellement réussi' : 'Erreur',
        detail: `${successCount} créé(s), ${errorCount} erreur(s). ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`,
        life: 7000
      })
    }
  } catch (error) {
    console.error('Error creating bulk tags:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la création en masse des tags',
      life: 5000
    })
  } finally {
    creatingBulkTags.value = false
  }
}

const mapFieldTypeToDataType = (fieldType) => {
  if (!fieldType) return 'TEXT'
  
  const normalizedType = fieldType.toUpperCase()
  
  // Mapping direct pour les types en majuscules
  const directMapping = {
    'NUMBER': 'NUMBER',
    'DECIMAL': 'DECIMAL',
    'TEXT': 'TEXT',
    'TEXTAREA': 'TEXT',
    'DATE': 'DATE',
    'DATETIME': 'DATETIME',
    'BOOLEAN': 'BOOLEAN',
    'PERCENTAGE': 'PERCENTAGE',
    'SELECT': 'TEXT',
    'MULTISELECT': 'TEXT'
  }
  
  if (directMapping[normalizedType]) {
    return directMapping[normalizedType]
  }
  
  // Mapping pour les types en minuscules
  const lowerMapping = {
    'number': 'NUMBER',
    'decimal': 'DECIMAL',
    'text': 'TEXT',
    'textarea': 'TEXT',
    'date': 'DATE',
    'datetime': 'DATETIME',
    'boolean': 'BOOLEAN',
    'percentage': 'PERCENTAGE',
    'select': 'TEXT',
    'multiselect': 'TEXT'
  }
  
  return lowerMapping[fieldType.toLowerCase()] || 'TEXT'
}

const createKPIForColumn = async (column) => {
  try {
    // Générer un nom de tag à partir du nom de la colonne
    const tagName = column.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')

    // Chercher si un tag existe déjà pour cette colonne dans les tags chargés
    let existingTag = tags.value.find(tag =>
      tag.tag_name === tagName ||
      tag.column_name === column.label ||
      tag.column_name === column.name
    )

    // Si aucun tag n'existe localement, essayer de le créer
    if (!existingTag) {
      const tagData = {
        tag_name: tagName,
        display_name: column.label,
        column_name: column.label,
        data_type: mapFieldTypeToDataType(column.field_type),
        module: 'MES',
        tag_type: 'PRODUCTION',
        is_active: true,
        description: `Donnee creee automatiquement pour la colonne ${column.label}`
      }

      try {
        // Créer le tag
        existingTag = await mappingStore.createTag(tagData)

        // Recharger les tags pour s'assurer qu'ils sont à jour
        await mappingStore.loadTags()

        toast.add({
          severity: 'success',
          summary: 'Donnee creee',
          detail: `Tag "${tagName}" créé automatiquement pour la colonne "${column.label}"`,
          life: 3000
        })
      } catch (createError) {
        // Si l'erreur indique que le tag existe déjà (doublon), chercher à nouveau
        if (createError.response?.status === 400 &&
            (createError.response?.data?.tag_name || createError.response?.data?.non_field_errors)) {
          // Recharger les tags et chercher à nouveau
          await mappingStore.loadTags()
          existingTag = tags.value.find(tag =>
            tag.tag_name === tagName ||
            tag.column_name === column.label ||
            tag.column_name === column.name
          )

          if (existingTag) {
            toast.add({
              severity: 'info',
              summary: 'Tag existant',
              detail: `Le tag "${tagName}" existe déjà, utilisation du tag existant`,
              life: 3000
            })
          } else {
            throw createError
          }
        } else {
          throw createError
        }
      }
    }

    // Utiliser le documentId de la colonne si disponible, sinon le premier document sélectionné
    const documentId = column.documentId || selectedDocument.value?.id

    // Pré-remplir le formulaire KPI avec le tag trouvé ou créé
    editingKPI.value = {
      name: `KPI - ${column.label}`,
      type: 'SUM',
      model: documentId,
      source_tags: existingTag ? [existingTag.id] : [], // Utiliser le tag trouvé ou créé
      unit: existingTag?.unit || '',
      description: `KPI généré à partir de la colonne ${column.label}${column.documentName ? ` (${column.documentName})` : ''}`
    }

    showColumnMapping.value = false
    showCreateKPIDialog.value = true
  } catch (error) {
    console.error('Error creating tag for column:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.tag_name?.[0] || error.response?.data?.non_field_errors?.[0] || 'Erreur lors de la creation',
      life: 5000
    })

    // Utiliser le documentId de la colonne si disponible
    const documentId = column.documentId || selectedDocument.value?.id

    // En cas d'erreur, ouvrir quand même le formulaire KPI sans tag pré-rempli
    // L'utilisateur pourra sélectionner manuellement un tag
    editingKPI.value = {
      name: `KPI - ${column.label}`,
      type: 'SUM',
      model: documentId,
      source_tags: [],
      unit: '',
      description: `KPI généré à partir de la colonne ${column.label}${column.documentName ? ` (${column.documentName})` : ''}`
    }
    showColumnMapping.value = false
    showCreateKPIDialog.value = true
  }
}

const saveColumnMappings = async () => {
  savingMappings.value = true

  try {
    const mappingsToSave = []

    for (const [fieldId, tagIds] of Object.entries(columnTagMapping.value)) {
      if (tagIds && tagIds.length > 0) {
        for (const tagId of tagIds) {
          mappingsToSave.push({
            document_field: fieldId,
            mes_tag: tagId
          })
        }
      }
    }

    // Supprimer les mappings existants pour le document sélectionné
    await axiosInstance.delete(`/documents/field-tags/bulk-delete/?document_modele=${selectedDocument.value.id}`)

    // Create new mappings
    if (mappingsToSave.length > 0) {
      await axiosInstance.post('/documents/field-tags/bulk-create/', {
        mappings: mappingsToSave
      })
    }

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `${mappingsToSave.length} mapping(s) enregistré(s) pour "${selectedDocument.value.nom}"`,
      life: 3000
    })

    showColumnMapping.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de l\'enregistrement des mappings',
      life: 3000
    })
  } finally {
    savingMappings.value = false
  }
}

// Bulk operations
const bulkActivate = async () => {
  try {
    const promises = selectedTags.value.map(tag =>
      mappingStore.updateTag(tag.id, { ...tag, is_active: true })
    )
    await Promise.all(promises)

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `${selectedTags.value.length} tag(s) activé(s)`,
      life: 3000
    })

    selectedTags.value = []
    await mappingStore.loadTags()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de l\'activation des tags',
      life: 3000
    })
  }
}

const bulkDeactivate = async () => {
  try {
    const promises = selectedTags.value.map(tag =>
      mappingStore.updateTag(tag.id, { ...tag, is_active: false })
    )
    await Promise.all(promises)

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `${selectedTags.value.length} tag(s) désactivé(s)`,
      life: 3000
    })

    selectedTags.value = []
    await mappingStore.loadTags()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la désactivation des tags',
      life: 3000
    })
  }
}

const exportSelectedTags = () => {
  const dataToExport = selectedTags.value.map(tag => ({
    tag_name: tag.tag_name,
    display_name: tag.display_name,
    column_name: tag.column_name,
    module: tag.module_display,
    tag_type: tag.tag_type_display,
    data_type: tag.data_type_display,
    unit: tag.unit || '',
    is_active: tag.is_active ? 'Actif' : 'Inactif'
  }))

  const csv = [
    Object.keys(dataToExport[0]).join(','),
    ...dataToExport.map(row => Object.values(row).map(val => `"${val}"`).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `tags_export_${new Date().toISOString().split('T')[0]}.csv`
  link.click()

  toast.add({
    severity: 'success',
    summary: 'Succès',
    detail: `${selectedTags.value.length} tag(s) exporté(s)`,
    life: 3000
  })
}

const bulkDelete = () => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer ${selectedTags.value.length} tag(s) ?`,
    header: 'Confirmation de suppression multiple',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        const promises = selectedTags.value.map(tag => mappingStore.deleteTag(tag.id))
        await Promise.all(promises)

        toast.add({
          severity: 'success',
          summary: 'Succès',
          detail: `${selectedTags.value.length} tag(s) supprimé(s)`,
          life: 3000
        })

        selectedTags.value = []
        await mappingStore.loadTags()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la suppression des tags',
          life: 3000
        })
      }
    }
  })
}

const loadKPIs = async () => {
  loadingKPIs.value = true
  try {
    const response = await axiosInstance.get('/documents/kpis/')
    kpis.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Error loading KPIs:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des KPI',
      life: 3000
    })
  } finally {
    loadingKPIs.value = false
  }
}

const filteredKPIs = computed(() => {
  if (!kpiSearchQuery.value || kpiSearchQuery.value.trim() === '') {
    return kpis.value
  }
  
  const query = kpiSearchQuery.value.toLowerCase().trim()
  return kpis.value.filter(kpi => {
    // Recherche dans le nom
    if (kpi.name && kpi.name.toLowerCase().includes(query)) return true
    // Recherche dans la description
    if (kpi.description && kpi.description.toLowerCase().includes(query)) return true
    // Recherche dans le type
    if (kpi.type && getKPITypeLabel(kpi.type).toLowerCase().includes(query)) return true
    // Recherche dans le modèle associé
    if (kpi.model_name && kpi.model_name.toLowerCase().includes(query)) return true
    // Recherche dans l'unité
    if (kpi.unit && kpi.unit.toLowerCase().includes(query)) return true
    return false
  })
})

const applyKPIFilters = () => {
  // Le filtrage est fait automatiquement via computed filteredKPIs
  // Cette fonction est appelée pour déclencher la réactivité
}

const loadDocumentModels = async () => {
  try {
    await documentStore.getModeles()
    documentModels.value = documentStore.modeles || []
  } catch (error) {
    console.error('Error loading document models:', error)
  }
}

const editKPI = (kpi) => {
  editingKPI.value = { ...kpi }
  showEditKPIDialog.value = true
}

const confirmDeleteKPI = (kpi) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer le KPI "${kpi.name}" ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: () => handleKPIDelete(kpi.id)
  })
}

const handleKPISave = async (kpiData) => {
  try {
    const response = await axiosInstance.post('/documents/kpis/', kpiData)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'KPI créé avec succès',
      life: 3000
    })
    showCreateKPIDialog.value = false
    editingKPI.value = null
    await loadKPIs()
  } catch (error) {
    console.error('Error creating KPI:', error.response?.data)
    // Afficher toutes les erreurs de validation
    let errorMessage = 'Erreur lors de la création du KPI'
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors
      const errorMessages = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('; ')
      errorMessage = errorMessages || errorMessage
    } else if (error.response?.data) {
      // Si les erreurs sont directement dans data
      const errors = error.response.data
      const errorMessages = Object.entries(errors)
        .filter(([key]) => key !== 'success')
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('; ')
      if (errorMessages) errorMessage = errorMessages
    }
    
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: errorMessage,
      life: 5000
    })
  }
}

const handleKPIUpdate = async (kpiData) => {
  try {
    await axiosInstance.patch(`/documents/kpis/${editingKPI.value.id}/`, kpiData)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'KPI modifié avec succès',
      life: 3000
    })
    showEditKPIDialog.value = false
    editingKPI.value = null
    await loadKPIs()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la modification du KPI',
      life: 3000
    })
  }
}

const handleKPIDelete = async (id) => {
  try {
    await axiosInstance.delete(`/documents/kpis/${id}/`)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'KPI supprimé avec succès',
      life: 3000
    })
    await loadKPIs()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la suppression du KPI',
      life: 3000
    })
  }
}

const bulkDeleteKPIs = () => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer ${selectedKPIs.value.length} KPI ?`,
    header: 'Confirmation de suppression multiple',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        const promises = selectedKPIs.value.map(kpi => axiosInstance.delete(`/documents/kpis/${kpi.id}/`))
        await Promise.all(promises)

        toast.add({
          severity: 'success',
          summary: 'Succès',
          detail: `${selectedKPIs.value.length} KPI supprimé(s)`,
          life: 3000
        })

        selectedKPIs.value = []
        await loadKPIs()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la suppression des KPI',
          life: 3000
        })
      }
    }
  })
}

// Formula KPI Management Functions
const loadFormulaKPIs = async () => {
  loadingFormulaKPIs.value = true
  try {
    const response = await axiosInstance.get('/documents/formula-kpis/')
    formulaKPIs.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Error loading formula KPIs:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des formules KPI',
      life: 3000
    })
  } finally {
    loadingFormulaKPIs.value = false
  }
}

const editFormulaKPI = (formulaKPI) => {
  editingFormulaKPI.value = { ...formulaKPI }
  showEditFormulaDialog.value = true
}

const confirmDeleteFormulaKPI = (formulaKPI) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer la formule "${formulaKPI.name}" ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: () => handleFormulaKPIDelete(formulaKPI.id)
  })
}

const handleFormulaKPISave = async (formulaData) => {
  try {
    const response = await axiosInstance.post('/documents/formula-kpis/', formulaData)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Formule KPI créée avec succès',
      life: 3000
    })
    showCreateFormulaDialog.value = false
    editingFormulaKPI.value = null
    await loadFormulaKPIs()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.name?.[0] || 'Erreur lors de la création de la formule',
      life: 3000
    })
  }
}

const handleFormulaKPIUpdate = async (formulaData) => {
  try {
    const response = await axiosInstance.patch(`/documents/formula-kpis/${editingFormulaKPI.value.id}/`, formulaData)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Formule KPI mise à jour avec succès',
      life: 3000
    })
    showEditFormulaDialog.value = false
    editingFormulaKPI.value = null
    await loadFormulaKPIs()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.name?.[0] || 'Erreur lors de la mise à jour de la formule',
      life: 3000
    })
  }
}

const handleFormulaKPIDelete = async (id) => {
  try {
    await axiosInstance.delete(`/documents/formula-kpis/${id}/`)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Formule KPI supprimée avec succès',
      life: 3000
    })
    await loadFormulaKPIs()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la suppression de la formule',
      life: 3000
    })
  }
}

// ============================================================================
// IOT TAG MAPPING FUNCTIONS
// ============================================================================

const loadIoTMappings = async () => {
  loadingIoTMappings.value = true
  try {
    const response = await axiosInstance.get('/documents/iot-mappings/')
    iotMappings.value = response.data.results || []
  } catch (error) {
    console.error('Error loading IoT mappings:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des mappings IoT',
      life: 3000
    })
  } finally {
    loadingIoTMappings.value = false
  }
}

const loadIoTDevices = async () => {
  try {
    const response = await axiosInstance.get('/iot/devices/')
    iotDevices.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Error loading IoT devices:', error)
    iotDevices.value = []
  }
}

const loadIoTMesTags = async () => {
  try {
    const response = await axiosInstance.get('/documents/mes-tags-iot/')
    iotMesTagsAvailable.value = response.data.results || []
  } catch (error) {
    console.error('Error loading IoT MES tags:', error)
    iotMesTagsAvailable.value = []
  }
}

const loadIoTKpiSummary = async () => {
  try {
    const response = await axiosInstance.get('/documents/iot-kpi-summary/')
    iotKpiSummary.value = response.data.summary || {}
  } catch (error) {
    console.error('Error loading IoT KPI summary:', error)
    iotKpiSummary.value = {}
  }
}

const onIoTDeviceSelected = async () => {
  if (iotMappingForm.value.iot_device) {
    try {
      const response = await axiosInstance.get(`/iot/metrics/`, {
        params: { device: iotMappingForm.value.iot_device }
      })
      iotDeviceMetrics.value = response.data.results || response.data || []
    } catch (error) {
      console.error('Error loading device metrics:', error)
      iotDeviceMetrics.value = []
    }
  } else {
    iotDeviceMetrics.value = []
  }
  iotMappingForm.value.device_metric = null
}

const handleIoTMappingCreate = async () => {
  try {
    if (editingIoTMapping.value) {
      // Update existing mapping
      await axiosInstance.patch(`/documents/iot-mappings/${editingIoTMapping.value.id}/`, iotMappingForm.value)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Mapping IoT modifié avec succès',
        life: 3000
      })
    } else {
      // Create new mapping
      await axiosInstance.post('/documents/iot-mappings/', iotMappingForm.value)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Mapping IoT créé avec succès',
        life: 3000
      })
    }
    showCreateIoTMappingDialog.value = false
    selectedTagForIoT.value = null
    await loadIoTMappings()
  } catch (error) {
    console.error('Error saving IoT mapping:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.errors?.non_field_errors?.[0] || 'Erreur lors de la sauvegarde du mapping',
      life: 5000
    })
  }
}

const handleIoTMappingUpdate = async () => {
  try {
    await axiosInstance.patch(`/documents/iot-mappings/${editingIoTMapping.value.id}/`, iotMappingForm.value)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Mapping IoT modifié avec succès',
      life: 3000
    })
    showEditIoTMappingDialog.value = false
    showCreateIoTMappingDialog.value = false
    selectedTagForIoT.value = null
    await loadIoTMappings()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la modification du mapping',
      life: 3000
    })
  }
}

const confirmDeleteIoTMapping = (mapping) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer le mapping "${mapping.mes_tag_name}" ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: () => handleIoTMappingDelete(mapping.id)
  })
}

const handleIoTMappingDelete = async (id) => {
  try {
    await axiosInstance.delete(`/documents/iot-mappings/${id}/`)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Mapping IoT supprimé avec succès',
      life: 3000
    })
    await loadIoTMappings()
    await loadIoTKpiSummary()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la suppression du mapping',
      life: 3000
    })
  }
}

onMounted(() => {
  // Tout en parallèle — pas de await pour ne pas bloquer le rendu
  Promise.all([
    mappingStore.loadChoices(),
    mappingStore.loadTags(),
    loadDocumentModels(),
    loadKPIs(),
    loadMESTags(),
    loadFormulaKPIs(),
    loadIoTMappings(),
    loadIoTDevices(),
    loadIoTMesTags(),
    loadIoTKpiSummary(),
  ])
})

// === IoT Tab functions ===

const toggleDeviceExpand = async (device) => {
  if (expandedDevice.value === device.id) {
    expandedDevice.value = null
    expandedDeviceData.value = []
    expandedDeviceMetrics.value = []
    return
  }
  expandedDevice.value = device.id
  loadingDeviceData.value = true
  try {
    const [dataRes, metricsRes] = await Promise.all([
      axiosInstance.get(`/iot/devices/${device.id}/data/`, { params: { limit: 50 } }),
      axiosInstance.get('/iot/metrics/', { params: { device: device.id } })
    ])
    const rawData = dataRes.data.results || dataRes.data || []
    expandedDeviceData.value = rawData

    const metrics = metricsRes.data.results || metricsRes.data || []
    expandedDeviceMetrics.value = metrics.map(m => {
      const latestData = rawData.find(d => d.metric === m.id)
      return {
        ...m,
        latest_value: latestData ? (typeof latestData.value === 'number' ? latestData.value : parseFloat(latestData.value)) : null,
        latest_time: latestData?.timestamp || null,
      }
    })
  } catch {
    expandedDeviceData.value = []
    expandedDeviceMetrics.value = []
  } finally {
    loadingDeviceData.value = false
  }
}

const refreshIoTData = async () => {
  loadingIoTTab.value = true
  await loadIoTDevices()
  if (expandedDevice.value) {
    const device = iotDevices.value.find(d => d.id === expandedDevice.value)
    if (device) await toggleDeviceExpand(device)
  }
  loadingIoTTab.value = false
}

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'A l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return new Date(dateStr).toLocaleDateString()
}
</script>

<style scoped lang="scss">
// ============== KAP DA — Page Layout ==============

.tags-view {
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

// Header
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.75rem;

  .header-content {
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 0.25rem 0;
      color: #0B2B3C;
    }
    .subtitle {
      margin: 0;
      color: #64748b;
      font-size: 0.9375rem;
    }
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
}

.btn-ai {
  background: #7AC943 !important;
  border-color: #7AC943 !important;
  color: #fff !important;
  font-weight: 600;

  &:hover {
    background: #6ab535 !important;
    border-color: #6ab535 !important;
  }
}

.btn-manual {
  color: #0B2B3C !important;
  border-color: #0B2B3C !important;
  font-weight: 500;
}

// Stats Bar
.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: #fff;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i { font-size: 1.1rem; }

  &--blue  { background: #dbeafe; i { color: #2563eb; } }
  &--green { background: #dcfce7; i { color: #16a34a; } }
  &--orange { background: #ffedd5; i { color: #ea580c; } }
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0B2B3C;
    line-height: 1;
  }
  .stat-label {
    font-size: 0.8125rem;
    color: #64748b;
    font-weight: 500;
  }
}

// Tabs
.view-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.25rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  padding: 0.25rem;
  width: fit-content;
}

.tab-btn {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: #64748b;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #f1f5f9;
    color: #0B2B3C;
  }

  &.active {
    background: #0B2B3C;
    color: #fff;
    font-weight: 600;
  }
}

// Tab content
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

// Toolbar inside tab
.tab-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    flex: 1;

    .search-input { min-width: 200px; flex: 1; max-width: 280px; }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }
}

.bulk-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  .bulk-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    margin-right: 0.25rem;
  }
}

// Table card
.table-card {
  background: #fff;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

// Table cells
.tag-name-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.display-name {
  font-weight: 500;
  color: #0B2B3C;
}

.kpi-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 0.875rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: default;
}

.module-type-cell {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  align-items: center;
}

// Row actions
.row-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.action-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  padding: 0;

  i { font-size: 0.875rem; }

  &:hover {
    background: #f1f5f9;
    color: #0B2B3C;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    &:hover { background: transparent; color: #94a3b8; }
  }

  &--active-iot {
    color: #16a34a;
    &:hover { background: #dcfce7; color: #16a34a; }
  }

  &--edit:hover  { background: #fef3c7; color: #d97706; }
  &--delete:hover { background: #fee2e2; color: #dc2626; }
}

// Empty state
.empty-state {
  text-align: center;
  padding: 3.5rem 2rem;
  color: #64748b;

  .empty-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #f0fdf4;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.25rem;

    i { font-size: 1.75rem; color: #7AC943; }
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #0B2B3C;
    margin: 0 0 0.5rem 0;
  }

  p {
    font-size: 0.9375rem;
    margin: 0 0 1.5rem 0;
    color: #64748b;
  }

  .empty-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }
}

// Misc
.unit-badge {
  background: #dbeafe;
  color: #2563eb;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
}

.text-muted {
  color: #94a3b8;
}

.kpi-name, .formula-kpi-name {
  font-weight: 600;
  color: #0B2B3C;
}

.formula-display {
  display: inline-block;
  padding: 0.375rem 0.625rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #7AC943;
  font-weight: 600;
}

:deep(.p-datatable) {
  .p-datatable-thead > tr > th {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
}

.document-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  i {
    font-size: 1.5rem;
    color: var(--primary-color);
  }

  .option-name {
    font-weight: 600;
    color: var(--text-color);
  }

  .option-meta {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
  }
}

// Document selector in dialog
.document-selector-inline {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);

  .selector-label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-color);
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;

  p {
    color: var(--text-color-secondary);
    font-size: 0.9rem;
  }
}

// Column Mapping Dialog
.column-mapping-container {
  padding: 1rem 0;
}

.mapping-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.document-header-info {
  display: flex;
  gap: 1rem;
  align-items: center;

  i {
    color: var(--green-500);
  }

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
  }

  p {
    margin: 0.25rem 0 0 0;
  }
}

.mapping-stats {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
  }
}

.stat-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.column-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  i {
    font-size: 1.25rem;
  }

  .column-label {
    font-weight: 600;
    color: var(--text-color);
  }

  .column-name {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    font-family: monospace;
  }
}

.tag-option-detailed {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .tag-option-name {
    font-weight: 600;
    color: var(--text-color);
  }

  .tag-option-meta {
    display: flex;
    gap: 0.5rem;
  }
}

.mapping-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.mapping-table {
  :deep(.p-datatable-wrapper) {
    border-radius: 0.5rem;
    border: 1px solid var(--surface-border);
  }
}

.text-2xl {
  font-size: 2rem;
}

.text-sm {
  font-size: 0.875rem;
}

.text-xs {
  font-size: 0.75rem;
}

.text-muted {
  color: var(--text-color-secondary);
}

.text-primary {
  color: var(--primary-color);
}

.w-full {
  width: 100%;
}

// Tag Values Preview Dialog
.tag-values-preview {
  padding: 1rem 0;
}

.preview-header-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.tag-header {
  display: flex;
  gap: 1rem;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
    font-family: 'Courier New', monospace;
  }

  .tag-description {
    margin: 0.25rem 0 0 0;
    color: var(--text-color-secondary);
    font-size: 0.95rem;
  }
}

.tag-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;

  p {
    color: var(--text-color-secondary);
    font-size: 1rem;
  }
}

.values-content {
  padding: 1rem 0;
}

.data-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15.625rem, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 0.5rem;
  border: 1px solid var(--surface-border);

  i {
    font-size: 2rem;
    color: var(--primary-color);
  }

  .stat-label {
    display: block;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.031rem;
    margin-bottom: 0.25rem;
  }

  .stat-value {
    display: block;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-color);
  }
}

.metrics-card {
  margin-top: 1rem;
}

.metric-name {
  font-weight: 600;
  color: var(--text-color);
}

.metric-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-color);
}

.empty-values-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-color-secondary);

  i {
    opacity: 0.3;
    margin-bottom: 1.5rem;
  }

  h3 {
    font-size: 1.5rem;
    margin: 0 0 1rem 0;
    color: var(--text-color);
  }

  p {
    font-size: 1rem;
    margin: 0;
    line-height: 1.6;
  }

  ol {
    text-align: left;
    max-width: 31.25rem;
    margin: 0 auto;
    line-height: 1.8;

    li {
      margin-bottom: 0.5rem;
    }
  }
}

.text-6xl {
  font-size: 4rem;
}

.mt-4 {
  margin-top: 1.5rem;
}

// Formula KPI Styles
.formula-kpi-card {
  margin-top: 1.5rem;
}

.formula-kpi-name {
  font-weight: 600;
  color: var(--text-color);
}

.formula-display {
  display: inline-block;
  padding: 0.5rem 0.75rem;
  background: var(--surface-50);
  border: 1px solid var(--surface-border);
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: var(--primary-color);
  font-weight: 600;
}

// IoT Mapping Styles
.iot-summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15.625rem, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.iot-summary-card {
  background: white;
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.05);

  .summary-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;

    i {
      font-size: 1.5rem;
      color: var(--primary-color);
    }

    .summary-title {
      font-weight: 600;
      font-size: 1rem;
      color: var(--text-color);
    }
  }

  .summary-stats {
    display: flex;
    gap: 1.5rem;

    .stat {
      .stat-value {
        display: block;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-color);

        &.stat-alert {
          color: var(--red-500);
        }
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
      }
    }
  }
}

.empty-summary {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  background: var(--surface-50);
  border-radius: 0.75rem;

  p {
    margin-top: 1rem;
    color: var(--text-color-secondary);
  }
}

.iot-mapping-card {
  margin-top: 1rem;
}

.tag-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .tag-name {
    font-weight: 600;
  }
}

.device-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: var(--primary-color);
  }
}

.current-value {
  font-weight: 600;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
}

.selected-tag-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--blue-50) 100%);
  border: 1px solid var(--primary-200);
  border-radius: 0.625rem;
  margin-bottom: 1.5rem;

  > i {
    font-size: 1.5rem;
    color: var(--primary-color);
  }

  .tag-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .tag-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.031rem;
      color: var(--text-color-secondary);
      font-weight: 600;
    }

    .tag-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-color);
      font-family: 'Courier New', monospace;
    }
  }
}

.iot-mapping-form {
  overflow-x: hidden;

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;

    &.form-grid-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    &.form-grid-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .form-field {
    min-width: 0;

    label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-color);

      .required {
        color: var(--red-500);
      }
    }
  }

  .form-section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-color-secondary);
    margin-bottom: 1rem;

    i {
      color: var(--primary-color);
    }
  }
}

.tag-option, .device-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-gray-500 {
  color: #6b7280;
}

.text-4xl {
  font-size: 2.5rem;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 0.5rem;
}

// Checkbox field styling
.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--surface-50);
  border-radius: 0.5rem;
  border: 1px solid var(--surface-border);

  label {
    cursor: pointer;
    font-weight: 500;
    color: var(--text-color);
    user-select: none;
  }
}

// Dialog footer styling
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;

  &.dialog-footer-iot {
    justify-content: space-between;
  }

  .dialog-footer-right {
    display: flex;
    gap: 0.75rem;
  }
}

// Fix dialog content overflow
:deep(.p-dialog) {
  max-width: 95vw;
}

:deep(.p-dialog-content) {
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(80vh - 7.5rem);
}

// Form field improvements
.iot-mapping-form {
  padding: 0.5rem 0;
  overflow-x: hidden;

  :deep(.p-divider) {
    margin: 1.5rem 0;
  }
}

// ============== RESPONSIVE STYLES ==============

// Tablet (max-width: 1024px)
@media (max-width: 1024px) {
  .tags-view {
    padding: 1.5rem;
  }

  .iot-summary-cards {
    grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  }

  .iot-mapping-form {
    .form-grid {
      &.form-grid-4,
      &.form-grid-3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  }

}

// Mobile (max-width: 768px)
@media (max-width: 768px) {
  .tags-view {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;

    .header-content h1 { font-size: 1.375rem; }
    .header-actions { width: 100%; }
  }

  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }

  .view-tabs {
    width: 100%;
    .tab-btn { flex: 1; text-align: center; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
  }

  .tab-toolbar {
    flex-direction: column;
    align-items: stretch;
    .toolbar-left, .toolbar-right { width: 100%; }
    .search-input { max-width: 100% !important; }
  }

  .iot-summary-cards {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .iot-summary-card {
    padding: 1rem;

    .summary-stats {
      flex-wrap: wrap;
      gap: 1rem;
    }
  }

  .iot-mapping-form {
    .form-grid {
      grid-template-columns: 1fr !important;

      &.form-grid-4,
      &.form-grid-3,
      &.form-grid-2 {
        grid-template-columns: 1fr !important;
      }
    }
  }

  .checkbox-field {
    margin-top: 1rem;
    padding: 0.5rem 0.75rem;
  }

  .selected-tag-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 1rem;

    > i {
      font-size: 1.25rem;
    }

    .tag-info {
      .tag-value {
        font-size: 1rem;
      }
    }
  }

  .dialog-footer {
    flex-direction: column-reverse;
    gap: 0.5rem;

    .p-button {
      width: 100%;
    }

    &.dialog-footer-iot {
      flex-direction: column;

      .dialog-footer-right {
        flex-direction: column-reverse;
        gap: 0.5rem;

        .p-button {
          width: 100%;
        }
      }
    }
  }

  // DataTable responsive
  :deep(.p-datatable) {
    .p-datatable-thead > tr > th,
    .p-datatable-tbody > tr > td {
      padding: 0.5rem;
      font-size: 0.875rem;
    }
  }

  .row-actions { flex-wrap: wrap; justify-content: center; }
}

// Small mobile (max-width: 480px)
@media (max-width: 480px) {
  .tags-view {
    padding: 0.75rem;
  }

  .page-header .header-content h1 { font-size: 1.125rem; }

  .iot-summary-card {
    .summary-header {
      i {
        font-size: 1.25rem;
      }

      .summary-title {
        font-size: 0.875rem;
      }
    }

    .summary-stats {
      .stat {
        .stat-value {
          font-size: 1rem;
        }

        .stat-label {
          font-size: 0.7rem;
        }
      }
    }
  }

  .current-value {
    font-size: 0.875rem;
  }

  .tag-cell,
  .device-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}

// Dialog responsive
:deep(.p-dialog) {
  @media (max-width: 768px) {
    width: 95vw !important;
    max-width: 95vw !important;
    margin: 0.5rem;
  }

  @media (max-width: 480px) {
    width: 100vw !important;
    max-width: 100vw !important;
    margin: 0;
    border-radius: 0;

    .p-dialog-header {
      padding: 1rem;
    }

    .p-dialog-content {
      padding: 1rem;
    }

    .p-dialog-footer {
      padding: 1rem;
    }
  }
}

/* === IoT Capteurs Tab === */

.stat-icon--purple {
  background: #f3e8ff;
  color: #7c3aed;
}

.iot-devices-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.iot-device-row {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.iot-device-row:hover {
  border-color: #7AC943;
}

.iot-device-row.expanded {
  border-color: #7AC943;
  box-shadow: 0 2px 8px rgba(122, 201, 67, 0.15);
}

.device-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
}

.device-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.device-status-dot.online {
  background: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.2);
}

.device-status-dot.offline {
  background: #94a3b8;
}

.device-status-dot.error {
  background: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
}

.device-info {
  flex: 1;
  min-width: 0;
}

.device-name {
  display: block;
  font-weight: 600;
  color: #0B2B3C;
}

.device-id {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  font-family: monospace;
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.device-type,
.device-last-seen {
  font-size: 0.8rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.expand-icon {
  color: #94a3b8;
  font-size: 0.85rem;
  transition: transform 0.2s;
}

/* Device expanded details */
.device-details {
  border-top: 1px solid #e2e8f0;
  padding: 1.25rem;
  background: #f8fafc;
}

.device-no-data {
  text-align: center;
  color: #94a3b8;
  padding: 1.5rem;
}

.device-no-data i {
  margin-right: 0.5rem;
}

.device-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.metric-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.metric-name {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.metric-unit {
  font-size: 0.7rem;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0B2B3C;
}

.metric-time {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

.device-data-table h4 {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .device-summary {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .device-meta {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .device-metrics-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
