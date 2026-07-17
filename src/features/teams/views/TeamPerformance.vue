<template>
  <div class="team-performance-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/teams" class="breadcrumb-link">Équipes</router-link>
          <i class="pi pi-chevron-right"></i>
          <span class="breadcrumb-current">Performance</span>
        </div>
        <h1 class="page-title">Performance des Équipes</h1>
        <p class="page-subtitle">Suivez les performances, KPIs et objectifs de vos équipes</p>
      </div>
      <div class="header-actions">
        <Button
          label="Nouvelle Évaluation"
          icon="pi pi-plus"
          @click="showEvaluationDialog = true"
        />
      </div>
    </div>

    <!-- Statistics Bar -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ store.allTeams?.length || 0 }}</span>
        <span class="stat-label">Équipes</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ totalDepartments }}</span>
        <span class="stat-label">Departements</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value accent">{{ totalManagers }}</span>
        <span class="stat-label">Managers</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value muted">{{ recentTeamsCount }}</span>
        <span class="stat-label">Recentes</span>
      </div>
    </div>

    <!-- Teams DataView with Filters -->
    <Card class="teams-card">
      <template #header>
        <div class="card-header-custom">
          <h2>Toutes les Équipes</h2>
          <div class="filters">
            <IconField iconPosition="left">
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText
                v-model="searchQuery"
                placeholder="Rechercher une équipe..."
                class="search-input"
              />
            </IconField>
            <Select
              v-model="sortKey"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Trier par"
              class="sort-select"
            />
            <SelectButton
              v-model="layout"
              :options="layoutOptions"
              optionLabel="icon"
              optionValue="value"
              dataKey="value"
            >
              <template #option="slotProps">
                <i :class="slotProps.option.icon"></i>
              </template>
            </SelectButton>
          </div>
        </div>
      </template>

      <template #content>
        <DataView
          :value="filteredTeams"
          :layout="layout"
          :paginator="true"
          :rows="layout === 'grid' ? 9 : 10"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucune équipe trouvée</p>
            </div>
          </template>

          <template #list="slotProps">
            <div class="flex flex-col">
              <div v-for="item in slotProps.items" :key="item.id" class="team-list-item">
                <div class="team-avatar">
                  <i class="pi pi-users"></i>
                </div>
                <div class="team-details">
                  <h3>{{ item.name }}</h3>
                  <div class="team-meta">
                    <span><i class="pi pi-building"></i> {{ item.department || 'Non assigné' }}</span>
                    <span><i class="pi pi-user"></i> {{ item.manager ? item.manager.first_name + ' ' + item.manager.last_name : 'Non assigné' }}</span>
                  </div>
                </div>
                <div class="team-list-stats">
                  <span><i class="pi pi-users"></i> {{ item.members_count || 0 }} membres</span>
                  <span v-if="item.active_kpis_count"><i class="pi pi-chart-line"></i> {{ item.active_kpis_count }} KPIs</span>
                  <span v-if="item.latest_evaluation_score"><i class="pi pi-star-fill"></i> {{ item.latest_evaluation_score.toFixed(1) }}</span>
                </div>
                <div class="team-actions">
                  <button class="action-btn action-kpi" @click="manageKPIs(item.id)">
                    <i class="pi pi-chart-line"></i> KPIs
                  </button>
                  <button class="action-btn action-objectives" @click="manageObjectives(item.id)">
                    <i class="pi pi-target"></i> Objectifs
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template #grid="slotProps">
            <div class="teams-grid-container">
              <div v-for="item in slotProps.items" :key="item.id" class="team-card">
                <div class="team-card-top">
                  <div class="team-avatar">
                    <i class="pi pi-users"></i>
                  </div>
                  <div class="team-card-info">
                    <h3 class="team-card-name">{{ item.name || 'Équipe sans nom' }}</h3>
                    <p class="team-card-dept"><i class="pi pi-building"></i> {{ item.department || 'Non assigné' }}</p>
                    <p class="team-card-manager"><i class="pi pi-user"></i> {{ item.manager ? item.manager.first_name + ' ' + item.manager.last_name : 'Non assigné' }}</p>
                  </div>
                  <button class="icon-btn" @click="openHistoryDialog(item.id)" v-tooltip.bottom="'Historique'">
                    <i class="pi pi-history"></i>
                  </button>
                </div>
                <div class="team-card-stats">
                  <div class="mini-stat">
                    <span class="mini-value">{{ item.members_count || 0 }}</span>
                    <span class="mini-label">Membres</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-value">{{ item.active_kpis_count || 0 }}</span>
                    <span class="mini-label">KPIs</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-value">{{ item.active_objectives_count || 0 }}</span>
                    <span class="mini-label">Objectifs</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-value" :class="item.latest_evaluation_score ? 'score' : 'muted'">
                      {{ item.latest_evaluation_score ? item.latest_evaluation_score.toFixed(1) : '—' }}
                    </span>
                    <span class="mini-label">Score</span>
                  </div>
                </div>
                <div class="team-card-actions">
                  <button class="action-btn action-kpi" @click="manageKPIs(item.id)">
                    <i class="pi pi-chart-line"></i> KPIs
                  </button>
                  <button class="action-btn action-objectives" @click="manageObjectives(item.id)">
                    <i class="pi pi-target"></i> Objectifs
                  </button>
                </div>
              </div>
            </div>
          </template>
        </DataView>
      </template>
    </Card>

    <!-- Create Evaluation Dialog -->
    <Dialog
      v-model:visible="showEvaluationDialog"
      modal
      :style="{ width: '700px' }"
      class="evaluation-dialog"
    >
      <template #header>
        <h3>Nouvelle Évaluation de Performance</h3>
      </template>
      <div class="evaluation-form">
        <div class="form-field">
          <label for="team">Équipe</label>
          <Select
            id="team"
            v-model="evaluationForm.teamId"
            :options="store.allTeams"
            optionLabel="name"
            optionValue="id"
            placeholder="Sélectionner une équipe"
            class="w-full"
          />
        </div>

        <div class="form-field">
          <label for="type">Type d'évaluation</label>
          <Select
            id="type"
            v-model="evaluationForm.evaluation_type"
            :options="evaluationTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner le type"
            class="w-full"
          />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="period_start">Début de période</label>
            <DatePicker
              id="period_start"
              v-model="evaluationForm.period_start"
              dateFormat="yy-mm-dd"
              class="w-full"
            />
          </div>
          <div class="form-field">
            <label for="period_end">Fin de période</label>
            <DatePicker
              id="period_end"
              v-model="evaluationForm.period_end"
              dateFormat="yy-mm-dd"
              class="w-full"
            />
          </div>
        </div>

        <Divider />

        <!-- Section KPIs et Objectifs -->
        <div v-if="store.teamKPIs.length > 0 || store.teamObjectives.length > 0" class="evaluation-context">
          <h4>Contexte de l'Évaluation</h4>
          
          <!-- KPIs Actifs -->
          <div v-if="store.teamKPIs.length > 0" class="context-section">
            <h5><i class="pi pi-chart-line"></i> KPIs Actifs ({{ store.teamKPIs.filter(k => k.status === 'ACTIVE').length }})</h5>
            <div class="kpi-list">
              <div v-for="kpi in store.teamKPIs.filter(k => k.status === 'ACTIVE')" :key="kpi.id" class="kpi-item">
                <div class="kpi-info">
                  <strong>{{ kpi.name }}</strong>
                  <span class="kpi-category">{{ kpiCategories.find(c => c.value === kpi.category)?.label || kpi.category }}</span>
                </div>
                <div v-if="kpi.description" class="kpi-description">
                  {{ kpi.description }}
                </div>
                <div class="kpi-evaluation">
                  <label class="kpi-evaluation-label">Valeur actuelle :</label>
                  <div class="kpi-input-group">
                    <InputNumber
                      v-model="kpi.current_value"
                      :min="0"
                      :maxFractionDigits="2"
                      :suffix="kpi.unit || ''"
                      class="kpi-value-input"
                      @update:modelValue="updateKPIValue(kpi)"
                    />
                    <span class="kpi-target">sur {{ kpi.target_value }} {{ kpi.unit || '' }}</span>
                  </div>
                </div>
                <div class="kpi-progress">
                  <ProgressBar 
                    :value="calculateKPIProgress(kpi)" 
                    :showValue="false"
                    :class="kpi.is_achieved ? 'success' : ''"
                  />
                  <span class="kpi-values">
                    {{ (kpi.current_value || 0).toFixed(2) }} / {{ kpi.target_value }} {{ kpi.unit || '' }}
                    <span v-if="kpi.is_achieved" class="achieved-badge">✓ Atteint</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Objectifs Actifs -->
          <div v-if="store.teamObjectives.length > 0" class="context-section">
            <h5><i class="pi pi-target"></i> Objectifs Actifs ({{ store.teamObjectives.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length }})</h5>
            <div class="objectives-list">
              <div 
                v-for="objective in store.teamObjectives.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED')" 
                :key="objective.id" 
                class="objective-item"
              >
                <div class="objective-info">
                  <strong>{{ objective.title }}</strong>
                  <Tag 
                    :value="getObjectiveStatusLabel(objective.status)" 
                    :severity="getObjectiveStatusSeverity(objective.status)"
                    size="small"
                  />
                  <Tag 
                    :value="getPriorityLabel(objective.priority)" 
                    severity="info"
                    size="small"
                  />
                </div>
                <div v-if="objective.description" class="objective-description">
                  {{ objective.description }}
                </div>
                <div class="objective-evaluation">
                  <label class="objective-evaluation-label">Progression :</label>
                  <div class="objective-input-group">
                    <InputNumber
                      v-model="objective.progress"
                      :min="0"
                      :max="100"
                      :suffix="'%'"
                      class="objective-progress-input"
                      @update:modelValue="updateObjectiveProgress(objective)"
                    />
                    <span class="objective-status-hint">{{ getProgressHint(objective.progress) }}</span>
                  </div>
                </div>
                <div class="objective-progress">
                  <ProgressBar :value="objective.progress" />
                  <span class="progress-text">{{ objective.progress }}%</span>
                </div>
                <div v-if="objective.is_overdue" class="overdue-badge">
                  <i class="pi pi-exclamation-triangle"></i> En retard
                </div>
              </div>
            </div>
          </div>
        </div>

        <Divider />

        <h4>Évaluation des Critères</h4>
        <div class="scores-grid">
          <div class="score-field">
            <label>Productivité</label>
            <div class="score-input">
              <Rating v-model="evaluationForm.productivity_score" :stars="10" :cancel="false" />
              <span class="score-display">{{ evaluationForm.productivity_score }}/10</span>
            </div>
          </div>

          <div class="score-field">
            <label>Qualité</label>
            <div class="score-input">
              <Rating v-model="evaluationForm.quality_score" :stars="10" :cancel="false" />
              <span class="score-display">{{ evaluationForm.quality_score }}/10</span>
            </div>
          </div>

          <div class="score-field">
            <label>Efficacité</label>
            <div class="score-input">
              <Rating v-model="evaluationForm.efficiency_score" :stars="10" :cancel="false" />
              <span class="score-display">{{ evaluationForm.efficiency_score }}/10</span>
            </div>
          </div>

          <div class="score-field">
            <label>Collaboration</label>
            <div class="score-input">
              <Rating v-model="evaluationForm.collaboration_score" :stars="10" :cancel="false" />
              <span class="score-display">{{ evaluationForm.collaboration_score }}/10</span>
            </div>
          </div>

          <div class="score-field">
            <label>Innovation</label>
            <div class="score-input">
              <Rating v-model="evaluationForm.innovation_score" :stars="10" :cancel="false" />
              <span class="score-display">{{ evaluationForm.innovation_score }}/10</span>
            </div>
          </div>

          <div class="score-field">
            <label>Respect des délais</label>
            <div class="score-input">
              <Rating v-model="evaluationForm.timeliness_score" :stars="10" :cancel="false" />
              <span class="score-display">{{ evaluationForm.timeliness_score }}/10</span>
            </div>
          </div>
        </div>

        <div class="form-field">
          <label for="notes">Notes</label>
          <Textarea
            id="notes"
            v-model="evaluationForm.notes"
            rows="4"
            placeholder="Commentaires sur l'évaluation..."
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Annuler" text @click="showEvaluationDialog = false" />
        <Button label="Créer l'évaluation" @click="submitEvaluation" :loading="isSubmitting" :disabled="isSubmitting" />
      </template>
    </Dialog>

    <!-- KPI Management Dialog -->
    <Dialog
      v-model:visible="showKPIDialog"
      modal
      :header="editingKPI ? 'Modifier le KPI' : 'KPIs de l\'équipe'"
      :style="{ width: '1000px', maxHeight: '90vh' }"
      class="kpi-dialog"
    >
      <!-- Vue Liste des KPIs -->
      <div v-if="!showKPIForm" class="kpi-management">
        <div class="kpi-toolbar">
          <div class="kpi-toolbar-left">
            <h3>{{ store.teamKPIs?.length || 0 }} KPI(s) actif(s)</h3>
          </div>
          <Button
            label="Nouveau KPI"
            icon="pi pi-plus"
            @click="openKPIForm()"
          />
        </div>

        <div v-if="store.loading" class="kpi-loading">
          <ProgressSpinner />
        </div>

        <div v-else-if="!store.teamKPIs?.length" class="kpi-empty">
          <i class="pi pi-chart-line"></i>
          <p>Aucun KPI défini pour cette équipe</p>
          <Button
            label="Créer le premier KPI"
            icon="pi pi-plus"
            @click="openKPIForm()"
          />
        </div>

        <div v-else class="kpi-grid">
          <Card v-for="kpi in store.teamKPIs" :key="kpi.id" class="kpi-card">
            <template #header>
              <div class="kpi-card-header">
                <Tag :value="kpi.category" />
                <div class="kpi-actions">
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    @click="openKPIForm(kpi)"
                  />
                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    @click="confirmDeleteKPI(kpi.id)"
                  />
                </div>
              </div>
            </template>
            <template #title>
              {{ kpi.name }}
            </template>
            <template #content>
              <div class="kpi-card-content">
                <div class="kpi-values">
                  <div class="kpi-value-item">
                    <span class="label">Valeur actuelle</span>
                    <span class="value">{{ kpi.current_value || 0 }}</span>
                  </div>
                  <div class="kpi-value-item">
                    <span class="label">Objectif</span>
                    <span class="value target">{{ kpi.target_value }}</span>
                  </div>
                  <div class="kpi-value-item">
                    <span class="label">Unité</span>
                    <span class="value">{{ kpi.unit || '-' }}</span>
                  </div>
                </div>
                <div class="kpi-progress-section">
                  <div class="kpi-progress-header">
                    <span>Progression</span>
                    <span class="percentage">{{ calculateKPIProgress(kpi).toFixed(0) }}%</span>
                  </div>
                  <ProgressBar :value="calculateKPIProgress(kpi)" :showValue="false" />
                </div>
                <p v-if="kpi.description" class="kpi-description">{{ kpi.description }}</p>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Formulaire Création/Modification KPI -->
      <div v-else class="kpi-form">
        <div class="form-grid">
          <div class="form-field">
            <label for="kpi-name">Nom du KPI *</label>
            <InputText
              id="kpi-name"
              v-model="kpiForm.name"
              placeholder="Ex: Taux de production"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="kpi-category">Catégorie *</label>
            <Select
              id="kpi-category"
              v-model="kpiForm.category"
              :options="kpiCategories"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner une catégorie"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="kpi-current">Valeur actuelle</label>
            <InputNumber
              id="kpi-current"
              v-model="kpiForm.current_value"
              :minFractionDigits="0"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="kpi-target">Valeur cible *</label>
            <InputNumber
              id="kpi-target"
              v-model="kpiForm.target_value"
              :minFractionDigits="0"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="kpi-unit">Unité</label>
            <InputText
              id="kpi-unit"
              v-model="kpiForm.unit"
              placeholder="Ex: %, unités, heures..."
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="kpi-frequency">Fréquence de mesure</label>
            <Select
              id="kpi-frequency"
              v-model="kpiForm.measurement_frequency"
              :options="frequencyOptions"
              placeholder="Sélectionner"
              class="w-full"
            />
          </div>
        </div>

        <div class="form-field full-width">
          <label for="kpi-desc">Description</label>
          <Textarea
            id="kpi-desc"
            v-model="kpiForm.description"
            rows="3"
            placeholder="Décrivez ce KPI et comment il est mesuré..."
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <div v-if="showKPIForm" class="dialog-footer">
          <Button label="Annuler" text @click="closeKPIForm" />
          <Button
            :label="editingKPI ? 'Mettre à jour' : 'Créer'"
            @click="saveKPI"
            :loading="store.loading"
          />
        </div>
        <div v-else class="dialog-footer">
          <Button label="Fermer" @click="showKPIDialog = false" />
        </div>
      </template>
    </Dialog>

    <!-- Objectives Management Dialog -->
    <Dialog
      v-model:visible="showObjectivesDialog"
      modal
      :header="editingObjective ? 'Modifier l\'objectif' : 'Objectifs de l\'équipe'"
      :style="{ width: '1000px', maxHeight: '90vh' }"
      class="objectives-dialog"
    >
      <!-- Vue Liste des Objectifs -->
      <div v-if="!showObjectiveForm" class="objectives-management">
        <div class="objectives-toolbar">
          <div class="objectives-toolbar-left">
            <h3>{{ store.teamObjectives?.length || 0 }} Objectif(s)</h3>
          </div>
          <Button
            label="Nouvel Objectif"
            icon="pi pi-plus"
            @click="openObjectiveForm()"
          />
        </div>

        <div v-if="store.loading" class="objectives-loading">
          <ProgressSpinner />
        </div>

        <div v-else-if="!store.teamObjectives?.length" class="objectives-empty">
          <i class="pi pi-target"></i>
          <p>Aucun objectif défini pour cette équipe</p>
          <Button
            label="Créer le premier objectif"
            icon="pi pi-plus"
            @click="openObjectiveForm()"
          />
        </div>

        <div v-else class="objectives-grid">
          <Card v-for="obj in store.teamObjectives" :key="obj.id" class="objective-card">
            <template #header>
              <div class="objective-card-header">
                <Tag :value="obj.status" :severity="getObjectiveStatusSeverity(obj.status)" />
                <div class="objective-actions">
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    @click="openObjectiveForm(obj)"
                  />
                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    @click="confirmDeleteObjective(obj.id)"
                  />
                </div>
              </div>
            </template>
            <template #title>
              {{ obj.title }}
            </template>
            <template #content>
              <div class="objective-card-content">
                <p v-if="obj.description" class="objective-description">{{ obj.description }}</p>

                <div class="objective-dates">
                  <div class="date-item">
                    <i class="pi pi-calendar"></i>
                    <span>Début: {{ formatDateShort(obj.start_date) }}</span>
                  </div>
                  <div class="date-item">
                    <i class="pi pi-calendar-times"></i>
                    <span>Échéance: {{ formatDateShort(obj.target_date) }}</span>
                  </div>
                </div>

                <div class="objective-progress-section">
                  <div class="objective-progress-header">
                    <span>Progression</span>
                    <span class="percentage">{{ obj.progress || 0 }}%</span>
                  </div>
                  <ProgressBar :value="obj.progress || 0" :showValue="false" />
                </div>

                <div v-if="obj.assigned_to" class="objective-assigned">
                  <i class="pi pi-user"></i>
                  <span>Assigné à: {{ obj.assigned_to_name || 'N/A' }}</span>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Formulaire Création/Modification Objectif -->
      <div v-else class="objective-form">
        <div class="form-grid">
          <div class="form-field full-width">
            <label for="obj-title">Titre de l'objectif *</label>
            <InputText
              id="obj-title"
              v-model="objectiveForm.title"
              placeholder="Ex: Augmenter la production de 15%"
              class="w-full"
            />
          </div>

          <div class="form-field full-width">
            <label for="obj-desc">Description</label>
            <Textarea
              id="obj-desc"
              v-model="objectiveForm.description"
              rows="3"
              placeholder="Décrivez cet objectif en détail..."
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="obj-start">Date de début *</label>
            <DatePicker
              id="obj-start"
              v-model="objectiveForm.start_date"
              dateFormat="dd/mm/yy"
              showIcon
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="obj-target">Date d'échéance *</label>
            <DatePicker
              id="obj-target"
              v-model="objectiveForm.target_date"
              dateFormat="dd/mm/yy"
              showIcon
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="obj-priority">Priorité</label>
            <Select
              id="obj-priority"
              v-model="objectiveForm.priority"
              :options="priorityOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="obj-status">Statut</label>
            <Select
              id="obj-status"
              v-model="objectiveForm.status"
              :options="objectiveStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="obj-progress">Progression (%)</label>
            <InputNumber
              id="obj-progress"
              v-model="objectiveForm.progress"
              :min="0"
              :max="100"
              suffix="%"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div v-if="showObjectiveForm" class="dialog-footer">
          <Button label="Annuler" text @click="closeObjectiveForm" />
          <Button
            :label="editingObjective ? 'Mettre à jour' : 'Créer'"
            @click="saveObjective"
            :loading="store.loading"
          />
        </div>
        <div v-else class="dialog-footer">
          <Button label="Fermer" @click="showObjectivesDialog = false" />
        </div>
      </template>
    </Dialog>

    <!-- History Dialog -->
    <Dialog
      v-model:visible="showHistoryDialog"
      modal
      header="Historique de l'équipe"
      :style="{ width: '90vw', maxWidth: '1200px', maxHeight: '90vh' }"
      class="history-dialog"
    >
      <TabView v-if="selectedTeamId">
        <!-- Historique des Évaluations -->
        <TabPanel header="Évaluations">
          <div v-if="store.loading" class="loading-container">
            <ProgressSpinner />
          </div>
          <div v-else-if="!store.evaluations?.length" class="empty-history">
            <i class="pi pi-inbox"></i>
            <p>Aucune évaluation enregistrée</p>
          </div>
          <div v-else class="history-grid">
            <Card v-for="evaluation in store.evaluations" :key="evaluation.id" class="history-card">
              <template #header>
                <div class="history-card-header">
                  <Tag :value="getEvaluationTypeLabel(evaluation.evaluation_type)" />
                  <span class="history-date">{{ formatDateShort(evaluation.created_at) }}</span>
                </div>
              </template>
              <template #content>
                <div class="evaluation-details">
                  <div class="eval-period">
                    <strong>Période:</strong> {{ formatDateShort(evaluation.period_start) }} - {{ formatDateShort(evaluation.period_end) }}
                  </div>
                  <Divider />
                  <div class="eval-scores">
                    <div class="score-row">
                      <span>Productivité:</span>
                      <Rating :modelValue="evaluation.productivity_score" :readonly="true" :cancel="false" />
                      <span>{{ evaluation.productivity_score }}/10</span>
                    </div>
                    <div class="score-row">
                      <span>Qualité:</span>
                      <Rating :modelValue="evaluation.quality_score" :readonly="true" :cancel="false" />
                      <span>{{ evaluation.quality_score }}/10</span>
                    </div>
                    <div class="score-row">
                      <span>Efficacité:</span>
                      <Rating :modelValue="evaluation.efficiency_score" :readonly="true" :cancel="false" />
                      <span>{{ evaluation.efficiency_score }}/10</span>
                    </div>
                    <div class="score-row">
                      <span>Collaboration:</span>
                      <Rating :modelValue="evaluation.collaboration_score" :readonly="true" :cancel="false" />
                      <span>{{ evaluation.collaboration_score }}/10</span>
                    </div>
                    <div class="score-row">
                      <span>Innovation:</span>
                      <Rating :modelValue="evaluation.innovation_score" :readonly="true" :cancel="false" />
                      <span>{{ evaluation.innovation_score }}/10</span>
                    </div>
                    <div class="score-row">
                      <span>Ponctualité:</span>
                      <Rating :modelValue="evaluation.timeliness_score" :readonly="true" :cancel="false" />
                      <span>{{ evaluation.timeliness_score }}/10</span>
                    </div>
                  </div>
                  <Divider />
                  <div class="eval-overall">
                    <strong>Score global:</strong>
                    <Tag :value="evaluation.overall_score.toFixed(1)" severity="success" class="score-tag-large" />
                  </div>
                  <div v-if="evaluation.notes" class="eval-notes">
                    <strong>Notes:</strong>
                    <p>{{ evaluation.notes }}</p>
                  </div>
                  
                  <!-- KPIs et Objectifs au moment de l'évaluation -->
                  <div v-if="getKPIsForEvaluation(evaluation).length > 0 || getObjectivesForEvaluation(evaluation).length > 0" class="eval-context">
                    <Divider />
                    <h5 class="eval-context-title">Contexte de l'Évaluation</h5>
                    
                    <!-- KPIs Actifs -->
                    <div v-if="getKPIsForEvaluation(evaluation).length > 0" class="eval-kpis">
                      <h6><i class="pi pi-chart-line"></i> KPIs Actifs ({{ getKPIsForEvaluation(evaluation).length }})</h6>
                      <div class="eval-kpi-list">
                        <div v-for="kpi in getKPIsForEvaluation(evaluation)" :key="kpi.id" class="eval-kpi-item">
                          <div class="eval-kpi-name">
                            <strong>{{ kpi.name }}</strong>
                            <span class="eval-kpi-category">{{ kpiCategories.find(c => c.value === kpi.category)?.label || kpi.category }}</span>
                          </div>
                          <div class="eval-kpi-value">
                            {{ (kpi.current_value || 0).toFixed(2) }} / {{ kpi.target_value }} {{ kpi.unit || '' }}
                            <span v-if="kpi.is_achieved" class="achieved-badge-small">✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Objectifs Actifs -->
                    <div v-if="getObjectivesForEvaluation(evaluation).length > 0" class="eval-objectives">
                      <h6><i class="pi pi-target"></i> Objectifs Actifs ({{ getObjectivesForEvaluation(evaluation).length }})</h6>
                      <div class="eval-objective-list">
                        <div v-for="obj in getObjectivesForEvaluation(evaluation)" :key="obj.id" class="eval-objective-item">
                          <div class="eval-objective-name">
                            <strong>{{ obj.title }}</strong>
                            <Tag 
                              :value="getObjectiveStatusLabel(obj.status)" 
                              :severity="getObjectiveStatusSeverity(obj.status)"
                              size="small"
                            />
                          </div>
                          <div class="eval-objective-progress">
                            <ProgressBar :value="obj.progress" :showValue="false" style="height: 6px;" />
                            <span class="eval-progress-text">{{ obj.progress }}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="eval-meta">
                    <small><i class="pi pi-user"></i> Évalué par: {{ evaluation.evaluator_name }}</small>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- Historique des KPIs -->
        <TabPanel header="KPIs">
          <div v-if="store.loading" class="loading-container">
            <ProgressSpinner />
          </div>
          <div v-else-if="!store.teamKPIs?.length" class="empty-history">
            <i class="pi pi-inbox"></i>
            <p>Aucun KPI enregistré</p>
          </div>
          <DataTable v-else :value="store.teamKPIs" paginator :rows="10" class="history-table">
            <Column field="name" header="Nom" sortable />
            <Column field="category" header="Catégorie" sortable>
              <template #body="slotProps">
                <Tag :value="kpiCategories.find(c => c.value === slotProps.data.category)?.label || slotProps.data.category" />
              </template>
            </Column>
            <Column field="current_value" header="Valeur actuelle" sortable />
            <Column field="target_value" header="Objectif" sortable />
            <Column field="unit" header="Unité" />
            <Column header="Progression">
              <template #body="slotProps">
                <ProgressBar :value="calculateKPIProgress(slotProps.data)" :showValue="false" />
                <small>{{ calculateKPIProgress(slotProps.data).toFixed(0) }}%</small>
              </template>
            </Column>
            <Column field="status" header="Statut">
              <template #body="slotProps">
                <Tag :value="slotProps.data.status === 'ACTIVE' ? 'Actif' : slotProps.data.status === 'INACTIVE' ? 'Inactif' : 'Archivé'" :severity="slotProps.data.status === 'ACTIVE' ? 'success' : 'secondary'" />
              </template>
            </Column>
            <Column field="created_at" header="Créé le" sortable>
              <template #body="slotProps">
                {{ formatDateShort(slotProps.data.created_at) }}
              </template>
            </Column>
          </DataTable>
        </TabPanel>

        <!-- Historique des Objectifs -->
        <TabPanel header="Objectifs">
          <div v-if="store.loading" class="loading-container">
            <ProgressSpinner />
          </div>
          <div v-else-if="!store.teamObjectives?.length" class="empty-history">
            <i class="pi pi-inbox"></i>
            <p>Aucun objectif enregistré</p>
          </div>
          <DataTable v-else :value="store.teamObjectives" paginator :rows="10" class="history-table">
            <Column field="title" header="Titre" sortable style="min-width: 200px" />
            <Column field="priority" header="Priorité" sortable>
              <template #body="slotProps">
                <Tag
                  :value="getPriorityLabel(slotProps.data.priority)"
                  :severity="slotProps.data.priority === 'HIGH' ? 'danger' : slotProps.data.priority === 'MEDIUM' ? 'warning' : 'info'"
                />
              </template>
            </Column>
            <Column field="status" header="Statut" sortable>
              <template #body="slotProps">
                <Tag
                  :value="getObjectiveStatusLabel(slotProps.data.status)"
                  :severity="slotProps.data.status === 'COMPLETED' ? 'success' : slotProps.data.status === 'IN_PROGRESS' ? 'info' : 'secondary'"
                />
              </template>
            </Column>
            <Column header="Progression">
              <template #body="slotProps">
                <ProgressBar :value="slotProps.data.progress || 0" :showValue="false" />
                <small>{{ slotProps.data.progress || 0 }}%</small>
              </template>
            </Column>
            <Column field="start_date" header="Début" sortable>
              <template #body="slotProps">
                {{ formatDateShort(slotProps.data.start_date) }}
              </template>
            </Column>
            <Column field="end_date" header="Échéance" sortable>
              <template #body="slotProps">
                {{ formatDateShort(slotProps.data.end_date) }}
              </template>
            </Column>
            <Column field="created_at" header="Créé le" sortable>
              <template #body="slotProps">
                {{ formatDateShort(slotProps.data.created_at) }}
              </template>
            </Column>
          </DataTable>
        </TabPanel>
      </TabView>

      <template #footer>
        <Button label="Fermer" @click="showHistoryDialog = false" />
      </template>
    </Dialog>

    <!-- Team Details Drawer -->
    <Drawer
      v-model:visible="showTeamDetails"
      position="right"
      class="team-details-drawer"
      header="Détails de l'équipe"
    >
      <template #header>
        <h2>{{ store.currentTeam?.name }}</h2>
      </template>

      <div v-if="store.currentTeam" class="team-details-content">
        <div class="detail-section">
          <h3>Informations</h3>
          <div class="detail-item">
            <span class="label">Département:</span>
            <span class="value">{{ store.currentTeam.department || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Manager:</span>
            <span class="value">{{ store.currentTeam.manager_name || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Membres:</span>
            <span class="value">{{ store.teamMembers?.length || 0 }}</span>
          </div>
        </div>

        <Divider />

        <div class="detail-section">
          <h3>Performance</h3>
          <div class="performance-chart">
            <div v-for="kpi in (store.teamKPIs || []).slice(0, 5)" :key="kpi.id" class="kpi-bar">
              <div class="kpi-label">{{ kpi.name }}</div>
              <ProgressBar :value="calculateKPIProgress(kpi)" />
              <div class="kpi-values">
                {{ kpi.current_value }} / {{ kpi.target_value }}
              </div>
            </div>
          </div>
        </div>

        <Divider />

        <div class="detail-section">
          <h3>Objectifs Actifs</h3>
          <div v-for="obj in (store.teamObjectives || []).filter(o => o.status !== 'COMPLETED')" :key="obj.id" class="objective-item">
            <div class="objective-header">
              <span class="objective-title">{{ obj.title }}</span>
              <Tag :value="obj.status" :severity="getObjectiveStatusSeverity(obj.status)" />
            </div>
            <ProgressBar :value="obj.progress || 0" />
          </div>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTeamPerformanceStore } from '../stores/teamPerformanceStore'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()
const store = useTeamPerformanceStore()

// State
const layout = ref('grid')
const searchQuery = ref('')
const sortKey = ref('team.name')
const showEvaluationDialog = ref(false)
const showKPIDialog = ref(false)
const showKPIForm = ref(false)
const showObjectivesDialog = ref(false)
const showObjectiveForm = ref(false)
const showHistoryDialog = ref(false)
const showTeamDetails = ref(false)
const selectedTeamId = ref(null)
const editingKPI = ref(null)
const editingObjective = ref(null)
const isSubmitting = ref(false)

// Layout options
const layoutOptions = ref([
  { icon: 'pi pi-th-large', value: 'grid' },
  { icon: 'pi pi-bars', value: 'list' }
])

// Sort options
const sortOptions = ref([
  { label: 'Nom', value: 'team.name' },
  { label: 'Score', value: 'score' },
  { label: 'Membres', value: 'members' },
  { label: 'KPIs', value: 'kpis' }
])

// Evaluation types
const evaluationTypes = ref([
  { label: 'Mensuelle', value: 'monthly' },
  { label: 'Trimestrielle', value: 'quarterly' },
  { label: 'Annuelle', value: 'annual' },
  { label: 'Projet', value: 'project' },
  { label: 'Personnalisée', value: 'custom' }
])

// Evaluation form
const evaluationForm = ref({
  teamId: null,
  evaluation_type: 'monthly',
  period_start: new Date(),
  period_end: new Date(),
  productivity_score: 5,
  quality_score: 5,
  efficiency_score: 5,
  collaboration_score: 5,
  innovation_score: 5,
  timeliness_score: 5,
  notes: ''
})

// KPI form
const kpiForm = ref({
  name: '',
  description: '',
  category: '',
  current_value: 0,
  target_value: 0,
  unit: '',
  measurement_frequency: 'monthly'
})

// KPI categories
const kpiCategories = ref([
  { label: 'Productivité', value: 'productivity' },
  { label: 'Qualité', value: 'quality' },
  { label: 'Efficacité', value: 'efficiency' },
  { label: 'Satisfaction', value: 'satisfaction' },
  { label: 'Performance', value: 'performance' },
  { label: 'Sécurité', value: 'safety' },
  { label: 'Coût', value: 'cost' },
  { label: 'Livraison', value: 'delivery' }
])

// Frequency options
const frequencyOptions = ref([
  'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
])

// Objective form
const objectiveForm = ref({
  title: '',
  description: '',
  start_date: new Date(),
  target_date: new Date(),
  priority: 'MEDIUM',
  status: 'PENDING',
  progress: 0
})

// Priority options
const priorityOptions = ref([
  { label: 'Basse', value: 'LOW' },
  { label: 'Moyenne', value: 'MEDIUM' },
  { label: 'Haute', value: 'HIGH' },
  { label: 'Urgente', value: 'URGENT' }
])

// Objective status options
const objectiveStatusOptions = ref([
  { label: 'En attente', value: 'PENDING' },
  { label: 'En cours', value: 'IN_PROGRESS' },
  { label: 'Terminé', value: 'COMPLETED' },
  { label: 'Annulé', value: 'CANCELLED' },
  { label: 'En pause', value: 'ON_HOLD' }
])

// Computed
const filteredTeams = computed(() => {
  let teams = [...(store.allTeams || [])]

  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    teams = teams.filter(t =>
      t.name?.toLowerCase().includes(query) ||
      t.department?.toLowerCase().includes(query) ||
      t.manager?.first_name?.toLowerCase().includes(query) ||
      t.manager?.last_name?.toLowerCase().includes(query)
    )
  }

  // Tri
  if (sortKey.value) {
    teams.sort((a, b) => {
      let aVal, bVal

      switch(sortKey.value) {
        case 'team.name':
          aVal = a.name?.toLowerCase() || ''
          bVal = b.name?.toLowerCase() || ''
          return aVal.localeCompare(bVal)

        case 'score':
          aVal = a.latest_evaluation_score || 0
          bVal = b.latest_evaluation_score || 0
          return bVal - aVal // Ordre décroissant

        case 'members':
          aVal = a.members_count || 0
          bVal = b.members_count || 0
          return bVal - aVal // Ordre décroissant

        case 'kpis':
          aVal = a.active_kpis_count || 0
          bVal = b.active_kpis_count || 0
          return bVal - aVal // Ordre décroissant

        default:
          return 0
      }
    })
  }

  return teams
})

const totalDepartments = computed(() => {
  const teams = store.allTeams || []
  const departments = new Set(teams.map(t => t.department).filter(Boolean))
  return departments.size
})

const totalManagers = computed(() => {
  const teams = store.allTeams || []
  const managers = new Set(teams.map(t => t.manager?.first_name).filter(Boolean))
  return managers.size
})

const recentTeamsCount = computed(() => {
  const teams = store.allTeams || []
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  return teams.filter(t => {
    const createdAt = new Date(t.created_at)
    return createdAt >= oneMonthAgo
  }).length
})

// Methods

const getTeamScore = (teamData) => {
  if (!teamData) return 'N/A'

  // Gérer les différents formats de structure
  let evaluation = null

  if (Array.isArray(teamData.evaluations) && teamData.evaluations.length > 0) {
    evaluation = teamData.evaluations[0]
  } else if (teamData.evaluations?.evaluations?.[0]) {
    evaluation = teamData.evaluations.evaluations[0]
  }

  return evaluation?.overall_score?.toFixed(1) || 'N/A'
}

const getScoreSeverity = (score) => {
  if (score === 'N/A') return 'secondary'
  const numScore = parseFloat(score)
  if (numScore >= 8) return 'success'
  if (numScore >= 6) return 'warning'
  return 'danger'
}

const getActiveObjectives = (teamData) => {
  if (!teamData || !teamData.objectives) return 0
  return teamData.objectives.filter(o => o.status === 'IN_PROGRESS').length
}

const calculateKPIProgress = (kpi) => {
  if (!kpi || !kpi.target_value || kpi.target_value === 0) return 0
  return Math.min(100, ((kpi.current_value || 0) / kpi.target_value) * 100)
}

const getObjectiveStatusSeverity = (status) => {
  const severities = {
    'PENDING': 'secondary',
    'IN_PROGRESS': 'info',
    'COMPLETED': 'success',
    'CANCELLED': 'danger',
    'ON_HOLD': 'warning'
  }
  return severities[status] || 'secondary'
}

const getObjectiveStatusLabel = (status) => {
  const labels = {
    'PENDING': 'En attente',
    'IN_PROGRESS': 'En cours',
    'COMPLETED': 'Terminé',
    'CANCELLED': 'Annulé',
    'ON_HOLD': 'En pause'
  }
  return labels[status] || status
}

const getPriorityLabel = (priority) => {
  const labels = {
    'LOW': 'Basse',
    'MEDIUM': 'Moyenne',
    'HIGH': 'Haute',
    'CRITICAL': 'Critique'
  }
  return labels[priority] || priority
}

const viewTeamDetails = async (teamId) => {
  selectedTeamId.value = teamId
  await store.refreshAll(teamId)
  showTeamDetails.value = true
}

const manageKPIs = async (teamId) => {
  selectedTeamId.value = teamId
  await store.fetchTeamKPIs(teamId)
  showKPIDialog.value = true
}

const manageObjectives = async (teamId) => {
  selectedTeamId.value = teamId
  await store.fetchTeamObjectives(teamId)
  showObjectivesDialog.value = true
}

// Debounce pour éviter trop de requêtes
let kpiUpdateTimeout = null
const updateKPIValue = async (kpi) => {
  // Annuler le timeout précédent
  if (kpiUpdateTimeout) {
    clearTimeout(kpiUpdateTimeout)
  }
  
  // Attendre 500ms avant de mettre à jour
  kpiUpdateTimeout = setTimeout(async () => {
    try {
      await store.updateTeamKPI(selectedTeamId.value, kpi.id, {
        current_value: kpi.current_value,
        name: kpi.name,
        description: kpi.description,
        category: kpi.category,
        target_value: kpi.target_value,
        unit: kpi.unit,
        status: kpi.status
      })
      // Recalculer la progression
      kpi.achievement_percentage = calculateKPIProgress(kpi)
      kpi.is_achieved = (kpi.current_value || 0) >= kpi.target_value
      
      // Recharger les KPIs si l'historique est ouvert
      if (showHistoryDialog.value) {
        await store.fetchTeamKPIs(selectedTeamId.value)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du KPI:', error)
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors de la mise à jour du KPI',
        life: 3000
      })
    }
  }, 500)
}

// Debounce pour éviter trop de requêtes
let objectiveUpdateTimeout = null
const updateObjectiveProgress = async (objective) => {
  // Annuler le timeout précédent
  if (objectiveUpdateTimeout) {
    clearTimeout(objectiveUpdateTimeout)
  }
  
  // Attendre 500ms avant de mettre à jour
  objectiveUpdateTimeout = setTimeout(async () => {
    try {
      // Mettre à jour le statut si la progression atteint 100%
      const newStatus = objective.progress >= 100 ? 'COMPLETED' : 
                        objective.progress > 0 ? 'IN_PROGRESS' : 
                        objective.status
      
      await store.updateTeamObjective(selectedTeamId.value, objective.id, {
        title: objective.title,
        description: objective.description,
        start_date: objective.start_date,
        end_date: objective.end_date,
        priority: objective.priority,
        status: newStatus,
        progress: objective.progress
      })
      
      // Mettre à jour le statut localement
      objective.status = newStatus
      
      // Recharger les objectifs si l'historique est ouvert
      if (showHistoryDialog.value) {
        await store.fetchTeamObjectives(selectedTeamId.value)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'objectif:', error)
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors de la mise à jour de l\'objectif',
        life: 3000
      })
    }
  }, 500)
}

const getProgressHint = (progress) => {
  if (progress >= 100) return '✓ Terminé'
  if (progress >= 75) return 'Presque terminé'
  if (progress >= 50) return 'À mi-parcours'
  if (progress > 0) return 'En cours'
  return 'Non commencé'
}

const getEvaluationTypeLabel = (type) => {
  const labels = {
    'monthly': 'Mensuelle',
    'quarterly': 'Trimestrielle',
    'annual': 'Annuelle',
    'project': 'Projet',
    'custom': 'Personnalisée'
  }
  return labels[type] || type
}

const openObjectiveForm = (objective = null) => {
  if (objective) {
    // Mode édition
    editingObjective.value = objective
    objectiveForm.value = {
      title: objective.title,
      description: objective.description || '',
      start_date: objective.start_date ? new Date(objective.start_date) : new Date(),
      target_date: objective.end_date ? new Date(objective.end_date) : new Date(),
      priority: objective.priority || 'MEDIUM',
      status: objective.status || 'PENDING',
      progress: objective.progress || 0
    }
  } else {
    // Mode création
    editingObjective.value = null
    objectiveForm.value = {
      title: '',
      description: '',
      start_date: new Date(),
      target_date: new Date(),
      priority: 'MEDIUM',
      status: 'PENDING',
      progress: 0
    }
  }
  showObjectiveForm.value = true
}

const closeObjectiveForm = () => {
  showObjectiveForm.value = false
  editingObjective.value = null
  objectiveForm.value = {
    title: '',
    description: '',
    start_date: new Date(),
    target_date: new Date(),
    priority: 'MEDIUM',
    status: 'PENDING',
    progress: 0
  }
}

const saveObjective = async () => {
  try {
    if (!objectiveForm.value.title || !objectiveForm.value.start_date || !objectiveForm.value.target_date) {
      toast.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez remplir tous les champs obligatoires',
        life: 3000
      })
      return
    }

    const data = {
      title: objectiveForm.value.title,
      description: objectiveForm.value.description || '',
      start_date: formatDate(objectiveForm.value.start_date),
      end_date: formatDate(objectiveForm.value.target_date),
      priority: objectiveForm.value.priority || 'MEDIUM',
      status: objectiveForm.value.status || 'PENDING',
      progress: objectiveForm.value.progress || 0
    }

    if (editingObjective.value) {
      // Update existing objective
      await store.updateTeamObjective(selectedTeamId.value, editingObjective.value.id, data)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Objectif mis à jour avec succès',
        life: 3000
      })
    } else {
      // Create new objective
      await store.createTeamObjective(selectedTeamId.value, data)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Objectif créé avec succès',
        life: 3000
      })
    }

    closeObjectiveForm()
    await store.fetchTeamObjectives(selectedTeamId.value)

    // Recharger les équipes pour mettre à jour les compteurs sur les cards
    setTimeout(async () => {
      await store.fetchAllTeams()
    }, 500)
  } catch (error) {
    let errorMessage = `Erreur lors de ${editingObjective.value ? 'la mise à jour' : 'la création'} de l'objectif`
    
    if (error.response?.data) {
      const errorData = error.response.data
      if (typeof errorData === 'object') {
        const errors = Object.values(errorData).flat()
        if (errors.length > 0) {
          errorMessage = errors.join(', ')
        }
      } else if (typeof errorData === 'string') {
        errorMessage = errorData
      }
    }
    
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: errorMessage,
      life: 5000
    })
  }
}

const confirmDeleteObjective = (objectiveId) => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir supprimer cet objectif ?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    accept: () => deleteObjective(objectiveId)
  })
}

const deleteObjective = async (objectiveId) => {
  try {
    await store.deleteTeamObjective(selectedTeamId.value, objectiveId)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Objectif supprimé avec succès',
      life: 3000
    })
    await store.fetchTeamObjectives(selectedTeamId.value)

    // Recharger les équipes pour mettre à jour les compteurs sur les cards
    setTimeout(async () => {
      await store.fetchAllTeams()
    }, 500)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la suppression de l\'objectif',
      life: 3000
    })
  }
}

const openEvaluationDialog = async (team) => {
  evaluationForm.value.teamId = team.id
  selectedTeamId.value = team.id

  // Charger les KPIs et objectifs de l'équipe
  await Promise.all([
    store.fetchTeamKPIs(team.id),
    store.fetchTeamObjectives(team.id)
  ])

  // Définir des dates par défaut (début du mois en cours, fin du mois en cours)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  evaluationForm.value.period_start = startOfMonth
  evaluationForm.value.period_end = endOfMonth
  evaluationForm.value.evaluation_type = 'monthly'

  // Réinitialiser les scores
  evaluationForm.value.productivity_score = 5
  evaluationForm.value.quality_score = 5
  evaluationForm.value.efficiency_score = 5
  evaluationForm.value.collaboration_score = 5
  evaluationForm.value.innovation_score = 5
  evaluationForm.value.timeliness_score = 5
  evaluationForm.value.notes = ''

  showEvaluationDialog.value = true
}

const submitEvaluation = async () => {
  // Empêcher les soumissions multiples
  if (isSubmitting.value) return

  // Vérifier qu'une équipe est sélectionnée
  if (!evaluationForm.value.teamId) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez sélectionner une équipe',
      life: 3000
    })
    return
  }

  isSubmitting.value = true

  try {
    const formData = {
      evaluation_type: evaluationForm.value.evaluation_type,
      period_start: formatDate(evaluationForm.value.period_start),
      period_end: formatDate(evaluationForm.value.period_end),
      productivity_score: evaluationForm.value.productivity_score,
      quality_score: evaluationForm.value.quality_score,
      efficiency_score: evaluationForm.value.efficiency_score,
      collaboration_score: evaluationForm.value.collaboration_score,
      innovation_score: evaluationForm.value.innovation_score,
      timeliness_score: evaluationForm.value.timeliness_score,
      notes: evaluationForm.value.notes
    }

    await store.createEvaluation(evaluationForm.value.teamId, formData)

    showEvaluationDialog.value = false

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Évaluation créée avec succès',
      life: 3000
    })

    // Recharger les évaluations de l'équipe et toutes les équipes
    await Promise.all([
      store.fetchTeamEvaluations(evaluationForm.value.teamId),
      store.fetchAllTeams()
    ])
  } catch (error) {
    let errorMessage = 'Erreur lors de la création de l\'évaluation'

    if (error.response?.data?.non_field_errors) {
      errorMessage = 'Une évaluation existe déjà pour cette équipe avec ces mêmes paramètres (type, période)'
    } else if (error.response?.data) {
      errorMessage = Object.values(error.response.data).flat().join(', ')
    }

    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: errorMessage,
      life: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}

const openKPIForm = (kpi = null) => {
  if (kpi) {
    // Mode édition
    editingKPI.value = kpi
    kpiForm.value = {
      name: kpi.name,
      description: kpi.description || '',
      category: kpi.category,
      current_value: kpi.current_value || 0,
      target_value: kpi.target_value,
      unit: kpi.unit || '',
      measurement_frequency: kpi.measurement_frequency || 'monthly'
    }
  } else {
    // Mode création
    editingKPI.value = null
    kpiForm.value = {
      name: '',
      description: '',
      category: '',
      current_value: 0,
      target_value: 0,
      unit: '',
      measurement_frequency: 'monthly'
    }
  }
  showKPIForm.value = true
}

const closeKPIForm = () => {
  showKPIForm.value = false
  editingKPI.value = null
  kpiForm.value = {
    name: '',
    description: '',
    category: '',
    current_value: 0,
    target_value: 0,
    unit: '',
    measurement_frequency: 'monthly'
  }
}

const saveKPI = async () => {
  try {
    if (!kpiForm.value.name || !kpiForm.value.category || !kpiForm.value.target_value) {
      toast.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez remplir tous les champs obligatoires',
        life: 3000
      })
      return
    }

    const data = {
      name: kpiForm.value.name,
      description: kpiForm.value.description || '',
      category: kpiForm.value.category,
      current_value: kpiForm.value.current_value || 0,
      target_value: kpiForm.value.target_value,
      unit: kpiForm.value.unit || '',
      status: 'ACTIVE'
    }

    if (editingKPI.value) {
      // Update existing KPI
      await store.updateTeamKPI(selectedTeamId.value, editingKPI.value.id, data)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'KPI mis à jour avec succès',
        life: 3000
      })
    } else {
      // Create new KPI
      await store.createTeamKPI(selectedTeamId.value, data)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'KPI créé avec succès',
        life: 3000
      })
    }

    closeKPIForm()
    await store.fetchTeamKPIs(selectedTeamId.value)

    // Recharger les équipes pour mettre à jour les compteurs sur les cards
    setTimeout(async () => {
      await store.fetchAllTeams()
    }, 500)
  } catch (error) {
    let errorMessage = `Erreur lors de ${editingKPI.value ? 'la mise à jour' : 'la création'} du KPI`
    
    if (error.response?.data) {
      const errorData = error.response.data
      if (typeof errorData === 'object') {
        const errors = Object.values(errorData).flat()
        if (errors.length > 0) {
          errorMessage = errors.join(', ')
        }
      } else if (typeof errorData === 'string') {
        errorMessage = errorData
      }
    }
    
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: errorMessage,
      life: 5000
    })
  }
}

const confirmDeleteKPI = (kpiId) => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir supprimer ce KPI ?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui, supprimer',
    rejectLabel: 'Annuler',
    accept: () => deleteKPI(kpiId)
  })
}

const deleteKPI = async (kpiId) => {
  try {
    await store.deleteTeamKPI(selectedTeamId.value, kpiId)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'KPI supprimé avec succès',
      life: 3000
    })
    await store.fetchTeamKPIs(selectedTeamId.value)

    // Recharger les équipes pour mettre à jour les compteurs sur les cards
    setTimeout(async () => {
      await store.fetchAllTeams()
    }, 500)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la suppression du KPI',
      life: 3000
    })
  }
}

const openHistoryDialog = async (teamId) => {
  selectedTeamId.value = teamId
  showHistoryDialog.value = true

  // Charger toutes les données d'historique
  await Promise.all([
    store.fetchTeamEvaluations(teamId),
    store.fetchTeamKPIs(teamId),
    store.fetchTeamObjectives(teamId)
  ])
}

// Fonction pour obtenir les KPIs actifs au moment d'une évaluation
const getKPIsForEvaluation = (evaluation) => {
  if (!store.teamKPIs || !evaluation) return []
  const evalStartDate = new Date(evaluation.period_start)
  const evalEndDate = new Date(evaluation.period_end)
  const evalCreatedDate = new Date(evaluation.created_at)
  
  return store.teamKPIs.filter(kpi => {
    // KPI doit être actif
    if (kpi.status !== 'ACTIVE') return false
    
    // KPI créé avant ou pendant la période d'évaluation
    const kpiCreated = new Date(kpi.created_at)
    if (kpiCreated > evalCreatedDate) return false
    
    // Si le KPI a des dates de période, vérifier qu'elles chevauchent la période d'évaluation
    if (kpi.start_date && kpi.end_date) {
      const kpiStart = new Date(kpi.start_date)
      const kpiEnd = new Date(kpi.end_date)
      // Vérifier si les périodes se chevauchent
      return (kpiStart <= evalEndDate && kpiEnd >= evalStartDate)
    }
    
    // Si pas de dates de période, inclure le KPI
    return true
  })
}

// Fonction pour obtenir les objectifs actifs au moment d'une évaluation
const getObjectivesForEvaluation = (evaluation) => {
  if (!store.teamObjectives || !evaluation) return []
  const evalStartDate = new Date(evaluation.period_start)
  const evalEndDate = new Date(evaluation.period_end)
  const evalCreatedDate = new Date(evaluation.created_at)
  
  return store.teamObjectives.filter(obj => {
    // Objectif ne doit pas être terminé ou annulé
    if (obj.status === 'COMPLETED' || obj.status === 'CANCELLED') return false
    
    // Objectif créé avant ou pendant la période d'évaluation
    const objCreated = new Date(obj.created_at)
    if (objCreated > evalCreatedDate) return false
    
    // Vérifier si les dates de l'objectif chevauchent la période d'évaluation
    if (obj.start_date && obj.end_date) {
      const objStart = new Date(obj.start_date)
      const objEnd = new Date(obj.end_date)
      // Vérifier si les périodes se chevauchent
      return (objStart <= evalEndDate && objEnd >= evalStartDate)
    }
    
    // Si pas de dates, inclure l'objectif
    return true
  })
}

const exportReport = () => {
  toast.add({
    severity: 'info',
    summary: 'Export',
    detail: 'Fonctionnalité en développement',
    life: 3000
  })
}

const formatDate = (date) => {
  if (!date) return null
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const formatDateShort = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Lifecycle
onMounted(async () => {
  await store.fetchAllTeams()

  // Gérer le paramètre d'ID depuis la recherche globale
  const teamId = route.params.id
  if (teamId) {
    const team = store.teams.find(t => String(t.id) === String(teamId))
    if (team) {
      viewTeamDetails(team.id)
    }
  }
})
</script>

<style scoped>
.team-performance-page {
  padding: 1.5rem;
  background: var(--bg-secondary, #f8fafc);
  min-height: 100vh;
}

/* Page Header - Modern Design */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, var(--kap-blue) 0%, #0a3a52 100%);
  padding: 1.75rem 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(11, 43, 60, 0.15);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(122, 201, 67, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.header-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.8125rem;
}

.breadcrumb-link {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--kap-green);
}

.breadcrumb i {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
}

.breadcrumb-current {
  color: var(--kap-green);
  font-weight: 500;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.025em;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  position: relative;
  z-index: 1;
}

.header-actions :deep(.p-button) {
  background: var(--kap-green);
  border-color: var(--kap-green);
  color: var(--kap-blue);
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(122, 201, 67, 0.3);
}

.header-actions :deep(.p-button:hover) {
  background: #8fd94f;
  border-color: #8fd94f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(122, 201, 67, 0.4);
}

/* Statistics Bar - Modern Cards */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background: #fff;
  padding: 1.25rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--border-primary, #e2e8f0);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--kap-blue);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-item:hover::before {
  transform: scaleX(1);
}

.stat-item:nth-child(2)::before {
  background: #3b82f6;
}

.stat-item:nth-child(3)::before {
  background: var(--kap-green);
}

.stat-item:nth-child(4)::before {
  background: #f59e0b;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--kap-blue);
  line-height: 1;
}

.stat-value.accent {
  color: var(--kap-green);
}

.stat-value.muted {
  color: #94a3b8;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.stat-divider {
  display: none;
}

/* Teams Card */
.teams-card {
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  overflow: hidden;
}

.teams-card :deep(.p-card-body) {
  padding: 0;
}

.teams-card :deep(.p-card-content) {
  padding: 0;
}

.card-header-custom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  background: #fff;
  border-bottom: 1px solid var(--border-primary, #e2e8f0);
}

.card-header-custom h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--kap-blue);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-header-custom h2::before {
  content: '';
  width: 4px;
  height: 20px;
  background: var(--kap-green);
  border-radius: 2px;
}

.filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.filters :deep(.p-inputtext) {
  border-radius: 8px;
  border-color: var(--border-primary, #e2e8f0);
  transition: all 0.2s;
}

.filters :deep(.p-inputtext:focus) {
  border-color: var(--kap-blue);
  box-shadow: 0 0 0 3px rgba(11, 43, 60, 0.1);
}

.search-input {
  min-width: 280px;
}

/* DataView List Layout */
.team-list-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid var(--border-primary, #e2e8f0);
  transition: background 0.2s;
}

.team-list-item:last-child {
  border-bottom: none;
}

.team-list-item:hover {
  background: #f8fafc;
}

.team-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(122, 201, 67, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kap-green);
  font-size: 1.125rem;
  flex-shrink: 0;
  transition: all 0.2s;
}

.team-list-item:hover .team-avatar,
.team-card:hover .team-avatar {
  background: var(--kap-green);
  color: #fff;
}

.team-details {
  flex: 1;
  min-width: 0;
}

.team-details h3 {
  margin: 0 0 0.25rem 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--kap-blue);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.team-meta span {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.team-meta i {
  color: var(--kap-green);
  font-size: 0.75rem;
}

.team-list-stats {
  display: flex;
  gap: 1.25rem;
  flex-shrink: 0;
}

.team-list-stats span {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: #64748b;
  white-space: nowrap;
}

.team-list-stats i {
  color: var(--kap-blue);
  font-size: 0.8125rem;
}

.team-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* DataView Grid Layout */
.teams-grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.25rem;
  background: #f8fafc;
}

@media (min-width: 1024px) {
  .teams-grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1536px) {
  .teams-grid-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Team Card (grid) */
.team-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
}

.team-card:hover {
  box-shadow: 0 8px 24px rgba(11, 43, 60, 0.1);
  border-color: transparent;
  transform: translateY(-3px);
}

.team-card-top {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1.125rem 1.125rem 0.875rem;
}

.team-card-info {
  flex: 1;
  min-width: 0;
}

.team-card-name {
  margin: 0 0 0.25rem 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--kap-blue, #0B2B3C);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-card-dept,
.team-card-manager {
  margin: 0.125rem 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #64748b;
}

.team-card-dept i,
.team-card-manager i {
  color: var(--kap-green);
  font-size: 0.75rem;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: 0.8125rem;
}

.icon-btn:hover {
  background: var(--kap-blue);
  color: #fff;
}

.team-card-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.625rem 0.25rem;
  gap: 0.125rem;
}

.mini-stat + .mini-stat {
  border-left: 1px solid #f1f5f9;
}

.mini-value {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--kap-blue);
  line-height: 1;
}

.mini-value.score {
  color: var(--kap-green);
}

.mini-value.muted {
  color: #94a3b8;
  font-weight: 400;
}

.mini-label {
  font-size: 0.6875rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.team-card-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.125rem;
  margin-top: auto;
}

/* Shared action buttons */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.875rem;
  border: 1px solid;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
}

.action-kpi {
  border-color: rgba(122, 201, 67, 0.4);
  color: #4a8e1a;
}

.action-kpi:hover {
  background: rgba(122, 201, 67, 0.1);
  border-color: var(--kap-green);
  color: #3a7a12;
}

.action-objectives {
  border-color: rgba(11, 43, 60, 0.25);
  color: var(--kap-blue);
}

.action-objectives:hover {
  background: rgba(11, 43, 60, 0.06);
  border-color: var(--kap-blue);
}


/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary, #64748b);
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: var(--kap-blue);
  opacity: 0.2;
}

.empty-state p {
  font-size: 1rem;
  margin: 0;
}

/* Evaluation Dialog */
.evaluation-form {
  padding: 1rem 0;
}

.form-field {
  margin-bottom: 1.5rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.scores-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin: 1rem 0;
}

.score-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
}

.score-input {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.score-display {
  font-weight: 600;
  color: var(--text-color);
  min-width: 50px;
}

/* Team Details Drawer */
.team-details-drawer {
  width: 600px !important;
}

.team-details-content {
  padding: 1rem 0;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.detail-item .label {
  font-weight: 500;
  color: var(--text-color-secondary);
}

.detail-item .value {
  color: var(--text-color);
}

.performance-chart {
  margin-top: 1rem;
}

.kpi-bar {
  margin-bottom: 1rem;
}

.kpi-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: var(--text-color);
}

.kpi-values {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

/* Evaluation Context Section */
.evaluation-context {
  margin: 1.5rem 0;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.evaluation-context h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  font-size: 1rem;
}

.context-section {
  margin-bottom: 1.5rem;
}

.context-section:last-child {
  margin-bottom: 0;
}

.context-section h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.context-section h5 i {
  color: var(--primary-color);
}

.kpi-list,
.objectives-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.kpi-item,
.objective-item {
  padding: 0.75rem;
  background: var(--surface-card);
  border-radius: 6px;
  border: 1px solid var(--surface-border);
}

.kpi-info,
.objective-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.kpi-info strong,
.objective-info strong {
  font-size: 0.875rem;
  color: var(--text-color);
}

.kpi-category {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  background: var(--surface-ground);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.kpi-description,
.objective-description {
  font-size: 0.8125rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: 4px;
  border-left: 3px solid var(--primary-color);
}

.kpi-evaluation,
.objective-evaluation {
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: var(--surface-50);
  border-radius: 6px;
  border: 1px dashed var(--primary-color);
}

.kpi-evaluation-label,
.objective-evaluation-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.kpi-input-group,
.objective-input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.kpi-value-input,
.objective-progress-input {
  flex: 1;
  min-width: 120px;
}

.kpi-target {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
}

.objective-status-hint {
  font-size: 0.75rem;
  color: var(--primary-color);
  font-weight: 500;
  white-space: nowrap;
}

.kpi-progress,
.objective-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.kpi-progress .p-progressbar {
  flex: 1;
  height: 8px;
}

.objective-progress .p-progressbar {
  flex: 1;
  height: 8px;
}

.kpi-values {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
  min-width: 40px;
}

.achieved-badge {
  color: var(--green-500);
  font-weight: 600;
  font-size: 0.7rem;
}

.overdue-badge {
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: var(--red-50);
  color: var(--red-600);
  border-radius: 4px;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.objective-item {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.objective-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.objective-title {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-color);
}

/* Responsive */
@media (max-width: 768px) {
  .team-performance-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
    border-radius: 12px;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .header-actions {
    width: 100%;
    justify-content: stretch;
  }

  .header-actions > * {
    flex: 1;
  }

  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-item {
    padding: 1rem 0.75rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .filters {
    flex-direction: column;
    width: 100%;
  }

  .search-input {
    min-width: 100%;
  }

  .teams-grid-container {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .team-list-item {
    flex-direction: column;
    align-items: stretch;
    margin: 0.5rem 1rem;
    padding: 1rem;
  }

  .team-metrics {
    justify-content: space-around;
  }

  .team-actions {
    justify-content: stretch;
  }

  .scores-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

/* KPI Dialog Styles */
.kpi-dialog .kpi-management {
  min-height: 400px;
}

.kpi-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.kpi-toolbar-left h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.kpi-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 0;
}

.kpi-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.kpi-empty i {
  font-size: 4rem;
  color: var(--text-color-secondary);
  opacity: 0.3;
  margin-bottom: 1rem;
}

.kpi-empty p {
  color: var(--text-color-secondary);
  margin-bottom: 1.5rem;
  font-size: 1.125rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.kpi-card {
  transition: all 0.3s;
}

.kpi-card:hover {
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.kpi-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1rem 0.5rem;
}

.kpi-actions {
  display: flex;
  gap: 0.25rem;
}

.kpi-card-content {
  padding: 0;
}

.kpi-values {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.kpi-value-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.kpi-value-item .label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  font-weight: 500;
}

.kpi-value-item .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.kpi-value-item .value.target {
  color: var(--primary-color);
}

.kpi-progress-section {
  margin-bottom: 1rem;
}

.kpi-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.kpi-progress-header .percentage {
  color: var(--primary-color);
  font-weight: 700;
}

.kpi-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

/* KPI Form Styles */
.kpi-form {
  padding: 1rem 0;
}

.auto-generate-section {
  text-align: center;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.auto-generate-section small {
  display: block;
  margin-top: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.kpi-form .form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.kpi-form .form-field.full-width {
  grid-column: 1 / -1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* History Dialog Styles */
.history-dialog .loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.empty-history {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.empty-history i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.history-card {
  height: 100%;
}

.history-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--surface-50);
  border-bottom: 1px solid var(--surface-border);
}

.history-date {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.evaluation-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.eval-period {
  padding: 0.5rem 1rem;
  background: var(--surface-50);
  border-radius: 6px;
  font-size: 0.875rem;
}

.eval-scores {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
}

.score-row > span:first-child {
  min-width: 120px;
  font-weight: 500;
}

.score-row > span:last-child {
  margin-left: auto;
  font-weight: 600;
  color: var(--primary-color);
}

.eval-overall {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 6px;
}

.score-tag-large {
  font-size: 1.25rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
}

.eval-notes {
  padding: 1rem;
  background: var(--surface-100);
  border-radius: 6px;
  border-left: 3px solid var(--primary-color);
}

.eval-notes p {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.eval-meta {
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
  color: var(--text-color-secondary);
  font-size: 0.8125rem;
}

.eval-meta i {
  color: var(--primary-color);
  margin-right: 0.25rem;
}

/* Contexte de l'évaluation dans l'historique */
.eval-context {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.eval-context-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

.eval-kpis,
.eval-objectives {
  margin-bottom: 1rem;
}

.eval-kpis:last-child,
.eval-objectives:last-child {
  margin-bottom: 0;
}

.eval-kpis h6,
.eval-objectives h6 {
  margin: 0 0 0.5rem 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.eval-kpis h6 i,
.eval-objectives h6 i {
  color: var(--primary-color);
  font-size: 0.75rem;
}

.eval-kpi-list,
.eval-objective-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.eval-kpi-item,
.eval-objective-item {
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: 4px;
  border-left: 2px solid var(--primary-color);
}

.eval-kpi-name,
.eval-objective-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
}

.eval-kpi-name strong,
.eval-objective-name strong {
  font-size: 0.8125rem;
  color: var(--text-color);
}

.eval-kpi-category {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  background: var(--surface-card);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
}

.eval-kpi-value {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.achieved-badge-small {
  color: var(--green-500);
  font-weight: 600;
  font-size: 0.7rem;
}

.eval-objective-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.eval-objective-progress .p-progressbar {
  flex: 1;
  height: 6px;
}

.eval-progress-text {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
  min-width: 35px;
}

.history-table {
  margin-top: 1rem;
}

.history-table .p-progressbar {
  height: 0.5rem;
  margin-bottom: 0.25rem;
}

/* Objectives Dialog Styles - Réutilise les mêmes styles que KPI */
.objectives-dialog .objectives-management {
  min-height: 400px;
}

.objectives-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.objectives-toolbar-left h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.objectives-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 0;
}

.objectives-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.objectives-empty i {
  font-size: 4rem;
  color: var(--text-color-secondary);
  opacity: 0.3;
  margin-bottom: 1rem;
}

.objectives-empty p {
  color: var(--text-color-secondary);
  margin-bottom: 1.5rem;
  font-size: 1.125rem;
}

.objectives-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.objective-card {
  transition: all 0.3s;
}

.objective-card:hover {
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.objective-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1rem 0.5rem;
}

.objective-actions {
  display: flex;
  gap: 0.25rem;
}

.objective-card-content {
  padding: 0;
}

.objective-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.objective-dates {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.objective-dates .date-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.objective-dates .date-item i {
  color: var(--primary-color);
}

.objective-progress-section {
  margin-bottom: 1rem;
}

.objective-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.objective-progress-header .percentage {
  color: var(--primary-color);
  font-weight: 700;
}

.objective-assigned {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.objective-assigned i {
  color: var(--primary-color);
}

/* Objective Form Styles */
.objective-form {
  padding: 1rem 0;
}

.objective-form .form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.objective-form .form-field.full-width {
  grid-column: 1 / -1;
}
</style>
