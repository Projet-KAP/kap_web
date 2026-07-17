<template>
  <div class="collect-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">Rapports de Collecte</h1>
          <p class="page-subtitle">Consultez les rapports de collecte générés</p>
        </div>
        <div class="header-actions">
          <Button
            label="Nouveau rapport"
            icon="pi pi-plus"
            class="create-btn"
            @click="showCreateDialog = true"
          />
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="showCreateDialog"
      modal
      :showHeader="false"
      class="report-modal-improved"
      :style="{ width: '760px', maxWidth: '95vw' }"
    >
      <div class="modal-improved">
        <div class="modal-header-custom">
          <div class="header-left">
            <div class="report-type-icon">
              <i class="pi pi-file-o"></i>
            </div>
            <div class="header-info">
              <h2 class="modal-title">Nouveau rapport</h2>
              <p class="header-subtitle">Renseignez les informations essentielles puis ajoutez les pièces jointes utiles</p>
            </div>
          </div>
          <Button
            icon="pi pi-times"
            class="close-btn"
            text
            rounded
            @click="showCreateDialog = false"
          />
        </div>

        <div class="data-section-improved compact-modal-section">
          <div class="section-header">
            <i class="pi pi-info-circle"></i>
            <h3>Informations principales</h3>
          </div>

          <div class="form-grid">
            <div class="form-field full-width">
              <label>Modèle <span class="required-dot">*</span></label>
              <div class="input-with-action">
                <select v-model="newCollect.template" class="filter-input">
                  <option value="" disabled>Choisir un modèle</option>
                  <option
                    v-for="template in collectStore.templates"
                    :key="template.id"
                    :value="template.id"
                  >
                    {{ template.name }}
                  </option>
                </select>
                <Button
                  icon="pi pi-plus"
                  class="inline-icon-action"
                  rounded
                  aria-label="Créer un modèle"
                  @click="openCreateTemplateDialog"
                />
              </div>
            </div>

            <div class="form-field">
              <label>Titre <span class="required-dot">*</span></label>
              <InputText
                v-model="newCollect.title"
                placeholder="Ex. Inspection ligne A"
                class="filter-input"
              />
            </div>

            <div class="form-field">
              <label>Poste de travail <span class="required-dot">*</span></label>
              <select v-model="newCollect.workplace" class="filter-input">
                <option :value="null" disabled>Choisir un poste</option>
                <option
                  v-for="workplace in workplaceOptions"
                  :key="workplace.id"
                  :value="workplace.id"
                >
                  {{ workplace.name }}
                </option>
              </select>
            </div>

            <div class="form-field">
              <label>Priorité</label>
              <select v-model="newCollect.priority" class="filter-input">
                <option value="NORMALE">Normale</option>
                <option value="FAIBLE">Faible</option>
                <option value="ELEVEE">Élevée</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>

            <div class="form-field full-width">
              <label>Description</label>
              <textarea
                v-model="newCollect.description"
                rows="3"
                class="filter-input"
                placeholder="Objectif, consignes ou contexte du rapport"
              ></textarea>
            </div>

            <div v-if="selectedTemplateFields.length" class="form-field full-width template-preview">
              <div class="template-preview-header">
                <span>Champs du modèle</span>
                <strong>{{ selectedTemplateFields.length }}</strong>
              </div>
              <div class="template-preview-list">
                <div
                  v-for="(field, index) in selectedTemplateFields"
                  :key="field.id || field.field_id || `${field.label}-${index}`"
                  class="template-preview-item"
                >
                  <span class="field-index">{{ index + 1 }}</span>
                  <div class="template-preview-field">
                    <label>
                      {{ field.label || field.name || field.field_label || `Champ ${index + 1}` }}
                      <span v-if="isTemplateFieldRequired(field)" class="required-dot">*</span>
                    </label>
                    <small>{{ getTemplateFieldTypeLabel(field.type || field.field_type) }}</small>
                    <select
                      v-if="isBooleanTemplateField(field)"
                      v-model="newCollect.collected_data[getTemplateFieldKey(field, index)]"
                      class="filter-input"
                    >
                      <option :value="null">Non renseigné</option>
                      <option :value="true">Oui</option>
                      <option :value="false">Non</option>
                    </select>
                    <select
                      v-else-if="Array.isArray(field.options) && field.options.length"
                      v-model="newCollect.collected_data[getTemplateFieldKey(field, index)]"
                      class="filter-input"
                    >
                      <option value="">Choisir</option>
                      <option v-for="option in field.options" :key="option" :value="option">
                        {{ option }}
                      </option>
                    </select>
                    <input
                      v-else
                      v-model="newCollect.collected_data[getTemplateFieldKey(field, index)]"
                      :type="getTemplateInputType(field)"
                      class="filter-input"
                      placeholder="Renseigner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="data-section-improved compact-modal-section modal-section-muted">
          <div class="section-header">
            <i class="pi pi-paperclip"></i>
            <h3>Pièces jointes</h3>
            <span class="data-count">{{ selectedFiles.length }}</span>
          </div>

          <label class="file-drop-zone">
            <i class="pi pi-cloud-upload"></i>
            <span>Ajouter PDF ou Excel</span>
            <input
              type="file"
              accept=".pdf,.xls,.xlsx"
              multiple
              @change="handleFileSelect"
            />
          </label>

          <div v-if="selectedFiles.length" class="selected-files">
            <div v-for="(file, index) in selectedFiles" :key="`${file.name}-${file.size}`" class="file-chip">
              <i class="pi pi-file"></i>
              <span>{{ file.name }}</span>
              <button type="button" @click="removeSelectedFile(index)" aria-label="Retirer le fichier">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer-improved">
          <Button
            label="Créer"
            icon="pi pi-check"
            class="btn-validate"
            :loading="creating"
            :disabled="!canCreateCollect"
            @click="createNewCollect"
          />
          <Button
            label="Annuler"
            icon="pi pi-times"
            class="btn-close"
            outlined
            @click="showCreateDialog = false"
          />
        </div>
      </div>
    </Dialog>

    <!-- Create Template Dialog -->
    <Dialog
      v-model:visible="showCreateTemplateDialog"
      modal
      :showHeader="false"
      class="report-modal-improved"
      :style="{ width: '700px', maxWidth: '95vw' }"
    >
      <div class="modal-improved">
        <div class="modal-header-custom">
          <div class="header-left">
            <div class="report-type-icon">
              <i class="pi pi-book"></i>
            </div>
            <div class="header-info">
              <h2 class="modal-title">Nouveau modèle</h2>
              <p class="header-subtitle">Préparez la structure qui servira aux futurs rapports</p>
            </div>
          </div>
          <Button
            icon="pi pi-times"
            class="close-btn"
            text
            rounded
            @click="showCreateTemplateDialog = false"
          />
        </div>

        <div class="data-section-improved compact-modal-section">
          <div class="section-header">
            <i class="pi pi-book"></i>
            <h3>Identité du modèle</h3>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>Nom <span class="required-dot">*</span></label>
              <InputText v-model="newTemplate.name" placeholder="Ex. Contrôle sécurité hebdo" class="filter-input" />
            </div>
            <div class="form-field">
              <label>Type <span class="required-dot">*</span></label>
              <select v-model="newTemplate.collect_type" class="filter-input">
                <option value="" disabled>Choisir une catégorie</option>
                <option v-for="opt in availableTypes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="form-field full-width">
              <label>Description</label>
              <textarea v-model="newTemplate.description" rows="2" class="filter-input" placeholder="Usage prévu ou périmètre du modèle"></textarea>
            </div>
          </div>
        </div>

        <div class="data-section-improved compact-modal-section modal-section-muted">
          <div class="section-header">
            <i class="pi pi-list"></i>
            <h3>Champs à collecter</h3>
            <span class="data-count">{{ newTemplate.checklist_items.length }}</span>
          </div>

          <div class="template-fields">
            <div v-for="(field, idx) in newTemplate.checklist_items" :key="idx" class="template-field-row">
              <span class="field-index">{{ idx + 1 }}</span>
              <InputText v-model="field.label" class="filter-input field-label-input" placeholder="Libellé du champ" />
              <select v-model="field.type" class="filter-input">
                <option v-for="opt in templateFieldTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <Button
                icon="pi pi-trash"
                class="field-delete-btn"
                text
                rounded
                :disabled="newTemplate.checklist_items.length <= 1"
                @click="removeTemplateField(idx)"
              />
            </div>
          </div>

          <div class="add-field-row">
            <Button label="Ajouter un champ" icon="pi pi-plus" class="p-button-text" @click="addTemplateField" />
          </div>
        </div>

        <div class="modal-footer-improved">
          <Button label="Créer" icon="pi pi-check" class="btn-validate" :loading="creatingTemplate" :disabled="!canCreateTemplate" @click="createNewTemplate" />
          <Button label="Annuler" icon="pi pi-times" class="btn-close" outlined @click="showCreateTemplateDialog = false" />
        </div>
      </div>
    </Dialog>

    <div class="overview-badges">
      <button
        type="button"
        class="overview-card overview-card-total"
        :class="{ active: !statusFilter }"
        @click="applyStatFilter('all')"
      >
        <div class="stat-header">
          <i class="pi pi-file"></i>
          <span class="overview-title">Total Rapports</span>
        </div>
        <strong>{{ totalCollects }}</strong>
      </button>
      <button
        type="button"
        class="overview-card overview-card-conform"
        :class="{ active: statusFilter === 'VALIDEE' }"
        @click="applyStatFilter('status', 'VALIDEE')"
      >
        <div class="stat-header">
          <i class="pi pi-check-circle"></i>
          <span class="overview-title">Conformes</span>
        </div>
        <strong>{{ conformCollectCount }}</strong>
      </button>
      <button
        type="button"
        class="overview-card overview-card-non-conform"
        :class="{ active: statusFilter === 'NON_CONFORME' }"
        @click="applyStatFilter('status', 'NON_CONFORME')"
      >
        <div class="stat-header">
          <i class="pi pi-exclamation-circle"></i>
          <span class="overview-title">Non Conformes</span>
        </div>
        <strong>{{ nonConformCollectCount }}</strong>
      </button>
      <button
        type="button"
        class="overview-card overview-card-pending"
        :class="{ active: statusFilter === 'PLANIFIEE' }"
        @click="applyStatFilter('status', 'PLANIFIEE')"
      >
        <div class="stat-header">
          <i class="pi pi-clock"></i>
          <span class="overview-title">En attente</span>
        </div>
        <strong>{{ pendingCollectCount }}</strong>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement des collectes...</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="!error" class="collect-content">

      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="filter-group">
          <div class="search-wrapper">
            <i class="pi pi-search search-icon"></i>
            <InputText
              v-model="searchTerm"
              placeholder="Rechercher par référence, titre, affectation..."
              class="search-input"
            />
            <i
              v-if="searchTerm"
              class="pi pi-times clear-icon"
              @click="searchTerm = ''"
            ></i>
          </div>

          <button type="button" class="clear-filters" @click="clearFilters">
            Effacer
          </button>
        </div>

        <div class="search-stats">
          <span class="stats-count">{{ filteredCollects.length }}</span>
          <span class="stats-label">collecte{{ filteredCollects.length > 1 ? 's' : '' }}</span>
        </div>
      </div>

      <!-- Collects List -->
      <div class="reports-grid">
        <div
          v-for="report in paginatedCollects"
          :key="report.id"
          class="report-card"
        >
          <!-- Icon & Status -->
          <div class="report-icon">
            <i class="pi pi-clipboard"></i>
            <span class="report-badge" :class="getStatusClass(report.status)">{{ formatStatus(report.status) }}</span>
          </div>

          <!-- Content -->
          <div class="report-content">
            <h3 class="report-title">{{ report.title || report.reference }}</h3>
            <div class="report-meta">
              <span class="meta-tag" v-if="report.template_name">
                <i class="pi pi-book"></i>
                {{ report.template_name }}
              </span>
              <span class="meta-tag" v-if="report.collect_type">
                <i class="pi pi-sitemap"></i>
                {{ getTypeLabel(report.collect_type) }}
              </span>
            </div>
            <div class="report-meta report-meta-small">
              <span class="meta-date" v-if="report.scheduled_start">
                <i class="pi pi-calendar"></i>
                {{ formatDate(report.scheduled_start) }}
              </span>
              <span class="meta-date" v-if="report.assigned_to_name">
                <i class="pi pi-user"></i>
                {{ report.assigned_to_name }}
              </span>
            </div>
            <p class="report-generated" v-if="report.site_name || report.workplace_name">
              <i class="pi pi-map-marker"></i>
              {{ report.site_name || '' }}<span v-if="report.site_name && report.workplace_name"> · </span>{{ report.workplace_name || '' }}
            </p>
          </div>

          <!-- Progress -->
          <div class="report-progress-container">
            <div class="report-progress-bar">
              <div
                class="report-progress-fill"
                :style="{ width: (report.progress || 0) + '%' }"
              ></div>
            </div>
            <span class="progress-label">{{ report.progress || 0 }}%</span>
          </div>

          <!-- Actions -->
          <div class="report-actions">
            <Button
              icon="pi pi-eye"
              @click.stop="viewReport(report)"
              class="btn-view"
              rounded
              tooltip="Voir"
            />
            <Button
              icon="pi pi-download"
              @click.stop="downloadAllAttachments(report)"
              class="btn-download"
              rounded
              tooltip="Télécharger"
              :disabled="!hasAttachments(report)"
            />
            <Button
              v-if="canReviewReport(report)"
              icon="pi pi-check"
              @click.stop="openValidateDialog(report, 'VALIDEE')"
              class="btn-validate"
              rounded
              tooltip="Valider"
            />
            <Button
              v-if="canReviewReport(report)"
              icon="pi pi-times-circle"
              @click.stop="openValidateDialog(report, 'NON_CONFORME')"
              class="btn-nonconform"
              rounded
              tooltip="Rejeter"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredCollects.length === 0" class="empty-state">
        <div class="empty-content">
          <i class="pi pi-inbox empty-icon"></i>
          <h3>Aucun rapport disponible</h3>
          <p>{{ searchTerm ? 'Aucun résultat pour votre recherche' : 'Aucun rapport de collecte n\'a encore été généré' }}</p>
        </div>
      </div>
      <!-- Pagination -->
      <div class="pagination-controls" style="display:flex;justify-content:center;align-items:center;margin:1rem 0">
        <Button label="«" class="p-button-text" :disabled="page <= 1" @click="updatePage(page - 1)" />
        <div style="margin:0 12px">Page {{ page }} / {{ totalPages }}</div>
        <Button label="»" class="p-button-text" :disabled="page >= totalPages" @click="updatePage(page + 1)" />
        <div style="margin-left:16px">
          <label style="margin-right:6px">Lignes :</label>
          <select v-model.number="rowsPerPage" @change="updatePage(1)">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error-container">
      <div class="error-content">
        <i class="pi pi-exclamation-triangle error-icon"></i>
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <Button label="Réessayer" @click="triggerLoad" />
      </div>
    </div>

    <Dialog
      v-model:visible="showShareDialog"
      modal
      :showHeader="false"
      class="report-modal-improved"
      :style="{ width: '600px', maxWidth: '95vw' }"
    >
      <div class="modal-improved">
        <div class="modal-header-custom">
          <div class="header-left">
            <div class="report-type-icon">
              <i class="pi pi-share-alt"></i>
            </div>
            <div class="header-info">
              <h2 class="modal-title">Partager le rapport</h2>
              <p class="header-subtitle">Envoyer le lien du rapport par e-mail</p>
            </div>
          </div>
          <Button
            icon="pi pi-times"
            class="close-btn"
            text
            rounded
            @click="showShareDialog = false"
          />
        </div>

        <div class="data-section-improved">
          <div class="form-field full-width">
            <label>Destinataires (séparés par des virgules)</label>
            <InputText
              v-model="shareRecipients"
              placeholder="ex: contact@entreprise.com, audit@kap.com"
              class="filter-input"
            />
          </div>

          <div class="form-field full-width">
            <label>Message</label>
            <textarea
              v-model="shareMessage"
              rows="4"
              class="filter-input"
              placeholder="Message facultatif"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer-improved">
          <Button
            label="Envoyer"
            icon="pi pi-paper-plane"
            class="btn-validate"
            @click="submitShare"
          />
          <Button
            label="Annuler"
            icon="pi pi-times"
            class="btn-close"
            outlined
            @click="showShareDialog = false"
          />
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showValidateDialog"
      modal
      :showHeader="false"
      class="report-modal-improved"
      :style="{ width: '600px', maxWidth: '95vw' }"
    >
      <div class="modal-improved">
        <div class="modal-header-custom">
          <div class="header-left">
            <div class="report-type-icon">
              <i class="pi pi-info-circle"></i>
            </div>
            <div class="header-info">
              <h2 class="modal-title">{{ validationStatus === 'NON_CONFORME' ? 'Rejeter le rapport' : 'Valider le rapport' }}</h2>
              <p class="header-subtitle">
                {{ validationStatus === 'NON_CONFORME' ? 'Précisez le motif du rejet avant confirmation' : 'Confirmez que ce rapport est conforme' }}
              </p>
            </div>
          </div>
          <Button
            icon="pi pi-times"
            class="close-btn"
            text
            rounded
            @click="showValidateDialog = false"
          />
        </div>

        <div class="data-section-improved">
          <div class="form-field full-width">
            <label>Statut</label>
            <select v-model="validationStatus" class="filter-input">
              <option value="VALIDEE">Validée</option>
              <option value="NON_CONFORME">Rejetée / non conforme</option>
            </select>
          </div>

          <div class="form-field full-width">
            <label>Motif du rejet <span v-if="validationStatus === 'NON_CONFORME'" class="required-dot">*</span></label>
            <textarea
              v-model="validationComments"
              rows="4"
              class="filter-input"
              :placeholder="validationStatus === 'NON_CONFORME' ? 'Expliquez pourquoi le rapport est rejeté' : 'Commentaire facultatif'"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer-improved">
          <Button
            label="Enregistrer"
            icon="pi pi-check"
            class="btn-validate"
            @click="submitValidation"
          />
          <Button
            label="Annuler"
            icon="pi pi-times"
            class="btn-close"
            outlined
            @click="showValidateDialog = false"
          />
        </div>
      </div>
    </Dialog>

    <!-- Report Details Modal - Improved UX -->
    <Dialog
      v-model:visible="showReportModal"
      modal
      :showHeader="false"
      class="report-modal-improved"
      :style="{ width: '900px', maxWidth: '95vw' }"
    >
      <div v-if="selectedReport" class="modal-improved">
        <!-- Custom Header -->
        <div class="modal-header-custom">
          <div class="header-left">
            <div class="report-type-icon">
              <i class="pi pi-clipboard"></i>
            </div>
            <div class="header-info">
              <h2 class="modal-title">{{ selectedReport.title || selectedReport.reference }}</h2>
              <div class="header-meta">
                <span class="meta-chip" v-if="selectedReport.template_name">
                  <i class="pi pi-book"></i>
                  {{ selectedReport.template_name }}
                </span>
                <span class="meta-chip" v-if="selectedReport.reference">
                  <i class="pi pi-hashtag"></i>
                  {{ selectedReport.reference }}
                </span>
                <span class="meta-chip" v-if="selectedReport.scheduled_start">
                  <i class="pi pi-calendar"></i>
                  {{ formatDateFull(selectedReport.scheduled_start) }}
                </span>
              </div>
            </div>
          </div>
          <Button
            icon="pi pi-times"
            class="close-btn"
            text
            rounded
            @click="showReportModal = false"
          />
        </div>

        <!-- Quick Stats Bar -->
        <div class="quick-stats">
          <div class="stat-item">
            <div class="stat-icon user">
              <i class="pi pi-user"></i>
            </div>
            <div class="stat-content">
              <span class="stat-label">Affecté à</span>
              <span class="stat-value">{{ selectedReport.assigned_to_name || 'Non assigné' }}</span>
            </div>
          </div>
          <div class="stat-item" v-if="selectedReport.site_name">
            <div class="stat-icon site">
              <i class="pi pi-map-marker"></i>
            </div>
            <div class="stat-content">
              <span class="stat-label">Site</span>
              <span class="stat-value">{{ selectedReport.site_name }}</span>
            </div>
          </div>
          <div class="stat-item" v-if="selectedReport.workplace_name">
            <div class="stat-icon workplace">
              <i class="pi pi-building"></i>
            </div>
            <div class="stat-content">
              <span class="stat-label">Poste</span>
              <span class="stat-value">{{ selectedReport.workplace_name }}</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon status" :class="getStatusColor(selectedReport.status)">
              <i class="pi pi-circle-fill"></i>
            </div>
            <div class="stat-content">
              <span class="stat-label">Statut</span>
              <span class="stat-value status-text" :class="getStatusColor(selectedReport.status)">
                {{ formatStatus(selectedReport.status) }}
              </span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon priority">
              <i class="pi pi-flag"></i>
            </div>
            <div class="stat-content">
              <span class="stat-label">Priorité</span>
              <span class="stat-value">{{ getPriorityLabel(selectedReport.priority) }}</span>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section-modal">
          <div class="progress-header-modal">
            <span class="progress-title">Progression</span>
            <span class="progress-percentage">{{ selectedReport.progress || 0 }}%</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill-modal"
              :style="{ width: (selectedReport.progress || 0) + '%' }"
              :class="getProgressColor(selectedReport.progress || 0)"
            ></div>
          </div>
        </div>

        <div class="data-section-improved">
          <div class="section-header">
            <i class="pi pi-info-circle"></i>
            <h3>Description</h3>
          </div>
          <div class="data-table">
            <div class="data-row">
              <div class="data-key">Résumé</div>
              <div class="data-val">{{ selectedReport.description || 'Aucune description disponible' }}</div>
            </div>
          </div>
        </div>

        <div v-if="hasAttachments(selectedReport)" class="data-section-improved modal-section-muted">
          <div class="section-header">
            <i class="pi pi-paperclip"></i>
            <h3>Pièces jointes</h3>
            <span class="data-count">{{ selectedReport.attachments.length }}</span>
          </div>

          <div class="attachment-list">
            <div
              v-for="attachment in selectedReport.attachments"
              :key="attachment.url || attachment.name"
              class="attachment-row"
            >
              <div class="attachment-info">
                <i :class="getAttachmentIcon(attachment)"></i>
                <div>
                  <strong>{{ attachment.name || 'Pièce jointe' }}</strong>
                  <span v-if="attachment.size">{{ formatFileSize(attachment.size) }}</span>
                </div>
              </div>
              <Button
                icon="pi pi-download"
                label="Télécharger"
                class="btn-download attachment-download"
                rounded
                @click="downloadAttachment(attachment)"
              />
            </div>
          </div>
        </div>

        <div v-if="selectedReport.collected_data && Object.keys(selectedReport.collected_data).length" class="data-section-improved">
          <div class="section-header">
            <i class="pi pi-database"></i>
            <h3>Données collectées</h3>
            <span class="data-count">{{ Object.keys(selectedReport.collected_data).length }} champs</span>
          </div>

          <div class="data-table">
            <div
              v-for="(value, key) in selectedReport.collected_data"
              :key="key"
              class="data-row"
            >
              <div class="data-key">
                <i class="pi pi-angle-right"></i>
                {{ formatDataKey(key) }}
              </div>
              <div class="data-val" :class="{ 'numeric': isNumeric(value) }">
                {{ formatDataValue(value) }}
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="selectedReport.data_entries && selectedReport.data_entries.length" class="data-section-improved">
          <div class="section-header">
            <i class="pi pi-database"></i>
            <h3>Données collectées</h3>
            <span class="data-count">{{ selectedReport.data_entries.length }} entrées</span>
          </div>

          <div class="data-table">
            <div
              v-for="entry in selectedReport.data_entries"
              :key="entry.id"
              class="data-row"
            >
              <div class="data-key">
                <i class="pi pi-angle-right"></i>
                {{ entry.field_label || entry.field_id }}
              </div>
              <div class="data-val" :class="{ 'numeric': isNumeric(entry.value) }">
                {{ formatDataValue(entry.value) }}
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-data">
          <i class="pi pi-inbox"></i>
          <p>Aucune donnée collectée pour cette collecte</p>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer-improved">
          <Button
            v-if="hasAttachments(selectedReport)"
            label="Télécharger les pièces"
            icon="pi pi-download"
            class="btn-download"
            rounded
            @click="downloadAllAttachments(selectedReport)"
          />
          <Button
            label="Fermer"
            icon="pi pi-times"
            class="btn-close"
            outlined
            @click="showReportModal = false"
          />
        </div>
      </div>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNavigationStore } from '@/shared'
import { useToast } from 'primevue/usetoast'
import { useCollectStore } from '@/features/collect/stores/collectStore'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { useAccountsStore } from '@/shared/stores/accountsStore'
import { axiosInstance } from '@/main.js'
import { storeToRefs } from 'pinia'

const router = useRouter()
const navigationStore = useNavigationStore()
const toast = useToast()

// Reactive data - utiliser le store centralisé
const collectStore = useCollectStore()
const authStore = useAuthStore()
const accountsStore = useAccountsStore()
const { collects, loading, error } = storeToRefs(collectStore)
const { workplaces } = storeToRefs(accountsStore)
const searchTerm = ref('')
const typeFilter = ref(null)
const statusFilter = ref(null)
const priorityFilter = ref(null)
const authorFilter = ref(null)
const periodFilter = ref(null)
const dateStart = ref('')
const dateEnd = ref('')
const showReportModal = ref(false)
const selectedReport = ref(null)
const showCreateDialog = ref(false)
const showCreateTemplateDialog = ref(false)
const showShareDialog = ref(false)
const showValidateDialog = ref(false)
const selectedFiles = ref([])
const creating = ref(false)
const creatingTemplate = ref(false)
const shareRecipients = ref('')
const shareMessage = ref('')
const validationStatus = ref('VALIDEE')
const validationComments = ref('')
const currentActionReport = ref(null)
const page = ref(1)
const rowsPerPage = ref(10)
const newTemplate = ref({
  name: '',
  description: '',
  collect_type: null,
  checklist_items: [{ label: '', type: 'text' }],
  required_fields: []
})
const templateFieldTypeOptions = [
  { label: 'Texte', value: 'text' },
  { label: 'Nombre', value: 'number' },
  { label: 'Date', value: 'date' },
  { label: 'Oui / Non', value: 'boolean' }
]

// Computed
const filteredCollects = computed(() => {
  if (!Array.isArray(collects.value)) return []

  let filtered = collects.value

  if (searchTerm.value) {
    const s = searchTerm.value.toLowerCase()
    filtered = filtered.filter(r => (
      (r.title && r.title.toLowerCase().includes(s)) ||
      (r.reference && r.reference.toLowerCase().includes(s)) ||
      (r.description && r.description.toLowerCase().includes(s)) ||
      (r.assigned_to_name && r.assigned_to_name.toLowerCase().includes(s)) ||
      (r.template_name && r.template_name.toLowerCase().includes(s)) ||
      (r.created_by_name && r.created_by_name.toLowerCase().includes(s))
    ))
  }

  if (authorFilter.value) {
    const author = authorFilter.value.toString().toLowerCase()
    filtered = filtered.filter(r => (r.created_by_name || '').toLowerCase().includes(author))
  }

  if (typeFilter.value) {
    filtered = filtered.filter(r => r.collect_type === typeFilter.value)
  }

  if (statusFilter.value) {
    filtered = filtered.filter(r => (r.status || '').toString().toLowerCase() === String(statusFilter.value).toLowerCase())
  }

  if (priorityFilter.value) {
    filtered = filtered.filter(r => (r.priority || '').toString().toLowerCase() === String(priorityFilter.value).toLowerCase())
  }

  if (periodFilter.value) {
    const now = new Date()
    let from = null
    let to = new Date(now)

    if (periodFilter.value === 'today') {
      from = new Date(now.setHours(0, 0, 0, 0))
      to = new Date(now.setHours(23, 59, 59, 999))
    } else if (periodFilter.value === 'this_week') {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      from = new Date(now.setDate(diff))
      from.setHours(0, 0, 0, 0)
      to = new Date(from)
      to.setDate(from.getDate() + 6)
      to.setHours(23, 59, 59, 999)
    } else if (periodFilter.value === 'this_month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else if (periodFilter.value === 'last_month') {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    }

    if (from && to) {
      filtered = filtered.filter(r => {
        const created = r.created_at ? new Date(r.created_at) : null
        return created && created >= from && created <= to
      })
    }
  }

  return filtered
})

const newCollect = ref({
  template: null,
  title: '',
  description: '',
  collect_type: null,
  workplace: null,
  priority: 'NORMALE',
  collected_data: {}
})

const availableTypes = [
  { label: 'Maintenance', value: 'MAINTENANCE' },
  { label: 'Production', value: 'PRODUCTION' },
  { label: 'Qualité', value: 'QUALITE' },
  { label: 'Sécurité', value: 'SECURITE' },
  { label: 'Audit', value: 'AUDIT' },
  { label: 'Autre', value: 'AUTRE' }
]

const selectedTemplate = computed(() => {
  const templateId = Number(newCollect.value.template)
  return (collectStore.templates || []).find(template => Number(template.id) === templateId) || null
})

const selectedTemplateFields = computed(() => {
  const fields = selectedTemplate.value?.checklist_items
  return Array.isArray(fields) ? fields.filter(field => field && (field.label || field.name || field.field_label)) : []
})

const requiredTemplateFieldsFilled = computed(() => {
  return selectedTemplateFields.value.every((field, index) => {
    if (!isTemplateFieldRequired(field)) return true
    const value = newCollect.value.collected_data[getTemplateFieldKey(field, index)]
    return value !== null && value !== undefined && value !== ''
  })
})

const canValidate = computed(() => {
  const role = (authStore.getUserRole || '').toString().toLowerCase()
  return authStore.isAdmin || authStore.isSuperAdmin || role.includes('admin') || role.includes('superadmin')
})

const canReviewReport = (report) => {
  return canValidate.value && (report.status || '').toString().toUpperCase() === 'PLANIFIEE'
}

// Options pour le filtre de type
const typeOptions = computed(() => {
  if (!Array.isArray(collects.value)) return []
  const types = [...new Set(collects.value.map(r => r.collect_type).filter(Boolean))]
  return types.map(type => ({ label: getTypeLabel(type), value: type }))
})

const workplaceOptions = computed(() => {
  const list = Array.isArray(workplaces.value?.data)
    ? workplaces.value.data
    : Array.isArray(workplaces.value?.results)
      ? workplaces.value.results
      : Array.isArray(workplaces.value)
        ? workplaces.value
        : []
  return list.filter(workplace => workplace && workplace.id)
})

const getApiErrorMessage = (err, fallback) => {
  const data = err?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.error) return data.error
  if (data.message) return data.message
  if (data.detail) return data.detail
  const firstValue = Object.values(data)[0]
  if (Array.isArray(firstValue)) return firstValue.join(', ')
  if (typeof firstValue === 'string') return firstValue
  return fallback
}

const canCreateCollect = computed(() => (
  Boolean(newCollect.value.title?.trim()) &&
  Boolean(newCollect.value.template) &&
  Boolean(newCollect.value.collect_type) &&
  Boolean(newCollect.value.workplace) &&
  requiredTemplateFieldsFilled.value &&
  !creating.value
))

const canCreateTemplate = computed(() => {
  const fields = newTemplate.value.checklist_items || []
  return Boolean(newTemplate.value.name?.trim()) &&
    Boolean(newTemplate.value.collect_type) &&
    fields.some(field => field.label?.trim()) &&
    !creatingTemplate.value
})

const getTemplateFieldTypeLabel = (type) => {
  const normalizedType = (type || 'text').toString().toLowerCase()
  const option = templateFieldTypeOptions.find(item => item.value.toLowerCase() === normalizedType)
  if (option) return option.label
  const labels = {
    select: 'Liste',
    checkbox: 'Case à cocher',
    signature: 'Signature',
    file: 'Fichier'
  }
  return labels[normalizedType] || normalizedType
}

const slugifyFieldKey = (value) => {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const getTemplateFieldKey = (field, index) => {
  return field.id || field.field_id || slugifyFieldKey(field.label || field.name || field.field_label) || `field_${index + 1}`
}

const getTemplateInputType = (field) => {
  const type = (field.type || field.field_type || 'text').toString().toLowerCase()
  if (type === 'number') return 'number'
  if (type === 'date') return 'date'
  return 'text'
}

const isBooleanTemplateField = (field) => {
  const type = (field.type || field.field_type || '').toString().toLowerCase()
  return type === 'boolean' || type === 'checkbox'
}

const isTemplateFieldRequired = (field) => {
  if (field.required === true) return true
  const required = selectedTemplate.value?.required_fields
  const label = field.label || field.name || field.field_label
  const key = field.id || field.field_id || label
  return Array.isArray(required) && (required.includes(label) || required.includes(key))
}

// Helper functions
const formatTime = (timestamp) => {
  if (!timestamp) {
    console.warn('📄 formatTime: No timestamp provided')
    return 'Date inconnue'
  }

  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      console.warn('📄 formatTime: Invalid date:', timestamp)
      return 'Date invalide'
    }

    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'à l\'instant'
    if (diffMins < 60) return `il y a ${diffMins} min`
    if (diffHours < 24) return `il y a ${diffHours}h`
    if (diffDays < 7) return `il y a ${diffDays}j`
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (error) {
    console.error('📄 formatTime error:', error)
    return 'Date invalide'
  }
}

const getStatusLabel = (status) => {
  const labels = {
    'PLANIFIEE': 'En attente',
    'EN_COURS': 'En cours',
    'EN_PAUSE': 'En pause',
    'TERMINEE': 'Terminée',
    'NON_CONFORME': 'Non conforme',
    'VALIDEE': 'Validée',
    'ANNULEE': 'Annulée'
  }
  if (!status) return 'Inconnu'
  return labels[status.toString().toUpperCase()] || status
}

const getTypeLabel = (type) => {
  const labels = {
    'MAINTENANCE': 'Maintenance',
    'PRODUCTION': 'Production',
    'QUALITE': 'Qualité',
    'SECURITE': 'Sécurité',
    'AUDIT': 'Audit',
    'AUTRE': 'Autre'
  }
  if (!type) return ''
  return labels[type.toString().toUpperCase()] || type
}

const priorityOptions = [
  { label: 'Toutes priorités', value: null },
  { label: 'Faible', value: 'FAIBLE' },
  { label: 'Normale', value: 'NORMALE' },
  { label: 'Élevée', value: 'ELEVEE' },
  { label: 'Urgente', value: 'URGENTE' }
]

const statusOptions = [
  { label: 'Tous statuts', value: null },
  { label: 'En attente', value: 'PLANIFIEE' },
  { label: 'Conforme', value: 'VALIDEE' },
  { label: 'Non conforme', value: 'NON_CONFORME' }
]

const totalCollects = computed(() => collects.value.length)
const nonConformCollectCount = computed(() => collects.value.filter(r => (r.status || '').toString().toUpperCase() === 'NON_CONFORME').length)
const conformCollectCount = computed(() => collects.value.filter(r => (r.status || '').toString().toUpperCase() === 'VALIDEE').length)
const pendingCollectCount = computed(() => collects.value.filter(r => (r.status || '').toString().toUpperCase() === 'PLANIFIEE').length)
const categoryCount = computed(() => new Set(collects.value.map(r => r.collect_type).filter(Boolean)).size)
const inProgressCollectCount = computed(() => collects.value.filter(r => (r.status || '').toString().toUpperCase() === 'EN_COURS').length)
const plannedCollectCount = computed(() => collects.value.filter(r => (r.status || '').toString().toUpperCase() === 'PLANIFIEE').length)
const completedCollectCount = computed(() => collects.value.filter(r => ['TERMINEE', 'VALIDEE'].includes((r.status || '').toString().toUpperCase())).length)
const authorOptions = computed(() => {
  const authors = collects.value
    .map(r => r.created_by_name || 'Inconnu')
    .filter(Boolean)
  return [...new Set(authors)].map(value => ({ label: value, value }))
})
const periodOptions = [
  { label: 'Aucune période', value: null },
  { label: 'Aujourd’hui', value: 'today' },
  { label: 'Cette semaine', value: 'this_week' },
  { label: 'Ce mois', value: 'this_month' },
  { label: 'Mois dernier', value: 'last_month' }
]
const paginatedCollects = computed(() => {
  const all = filteredCollects.value
  const start = (page.value - 1) * rowsPerPage.value
  return all.slice(start, start + rowsPerPage.value)
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredCollects.value.length / rowsPerPage.value)))

const getPriorityIcon = (priority) => {
  const icons = {
    'low': 'text-gray-400',
    'medium': 'text-blue-500',
    'high': 'text-orange-500',
    'urgent': 'text-red-500'
  }
  return icons[priority] || ''
}

// Nouvelles méthodes pour l'affichage simplifié
const getStatusClass = (status) => {
  const classes = {
    'PLANIFIEE': 'status-planned',
    'EN_COURS': 'status-active', 
    'EN_PAUSE': 'status-paused',
    'TERMINEE': 'status-completed',
    'VALIDEE': 'status-validated',
    'NON_CONFORME': 'status-non-conform',
    'ANNULEE': 'status-cancelled'
  }
  return classes[status] || 'status-default'
}

const getPriorityLabel = (priority) => {
  const labels = {
    'LOW': 'Basse',
    'MEDIUM': 'Moyenne', 
    'HIGH': 'Haute',
    'URGENT': 'Urgente'
  }
  return labels[priority] || priority
}

const getPriorityClass = (priority) => {
  const classes = {
    'LOW': 'priority-low',
    'MEDIUM': 'priority-medium',
    'HIGH': 'priority-high', 
    'URGENT': 'priority-urgent'
  }
  return classes[priority] || 'priority-medium'
}

const getAssignedName = (assigned_to) => {
  if (typeof assigned_to === 'object' && assigned_to) {
    return `${assigned_to.first_name || ''} ${assigned_to.last_name || ''}`.trim()
  }
  return assigned_to || 'Non assigné'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  })
}

const isOverdue = (dateString) => {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

// Charger les rapports depuis l'API documents
// Chargement via le store avec filtres côté serveur lorsque possible
let loadTimer = null
const triggerLoad = (opts = {}) => {
  if (loadTimer) clearTimeout(loadTimer)
  loadTimer = setTimeout(() => {
    const params = {}
    if (searchTerm.value) params.search = searchTerm.value
    if (typeFilter.value) params.collect_type = typeFilter.value
    if (statusFilter.value) params.status = statusFilter.value
    if (priorityFilter.value) params.priority = priorityFilter.value
    if (dateStart.value) params.date_from = dateStart.value
    if (dateEnd.value) params.date_to = dateEnd.value
    collectStore.loadCollects(params)
  }, 250)
}

const viewReport = (report) => {
  // Ouvrir le modal avec les détails du rapport
  selectedReport.value = report
  showReportModal.value = true
}

// Helper functions for improved modal
const formatDateFull = (timestamp) => {
  if (!timestamp) return 'Date inconnue'
  try {
    const date = new Date(timestamp)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Date invalide'
  }
}

const getStatusColor = (status) => {
  if (!status) return 'default'
  const s = status.toUpperCase()
  const statusMap = {
    'VALIDEE': 'success',
    'VALIDATED': 'success',
    'TERMINEE': 'success',
    'COMPLETED': 'success',
    'EN_COURS': 'info',
    'IN_PROGRESS': 'info',
    'ACTIVE': 'info',
    'EN_PAUSE': 'warning',
    'PAUSED': 'warning',
    'PLANIFIEE': 'warning',
    'PLANNED': 'warning',
    'DRAFT': 'warning',
    'BROUILLON': 'warning',
    'NON_CONFORME': 'danger',
    'ANNULEE': 'danger',
    'CANCELLED': 'danger',
    'ERREUR': 'danger',
    'ERROR': 'danger'
  }
  return statusMap[s] || 'default'
}

const formatStatus = (status) => {
  if (!status) return 'Inconnu'
  const s = status.toUpperCase()
  const statusLabels = {
    'VALIDEE': 'Conforme',
    'VALIDATED': 'Conforme',
    'TERMINEE': 'Terminé',
    'COMPLETED': 'Terminé',
    'EN_COURS': 'En cours',
    'IN_PROGRESS': 'En cours',
    'ACTIVE': 'Actif',
    'EN_PAUSE': 'En pause',
    'PAUSED': 'En pause',
    'PLANIFIEE': 'En attente',
    'PLANNED': 'En attente',
    'NON_CONFORME': 'Non conforme',
    'DRAFT': 'Brouillon',
    'BROUILLON': 'Brouillon',
    'ANNULEE': 'Annulé',
    'CANCELLED': 'Annulé',
    'ERREUR': 'Erreur',
    'ERROR': 'Erreur'
  }
  return statusLabels[s] || status
}

const resetCreateForm = () => {
  newCollect.value = {
    template: null,
    title: '',
    description: '',
    collect_type: null,
    workplace: workplaceOptions.value[0]?.id || null,
    priority: 'NORMALE',
    collected_data: {}
  }
  selectedFiles.value = []
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files || [])
  const allowedExtensions = ['.pdf', '.xls', '.xlsx']
  const validFiles = [...selectedFiles.value]

  for (const file of files) {
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowedExtensions.includes(extension)) {
      toast.add({
        severity: 'warn',
        summary: 'Format non supporté',
        detail: `Seuls les fichiers PDF et Excel sont autorisés : ${file.name}`,
        life: 4000
      })
      continue
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.add({
        severity: 'warn',
        summary: 'Fichier trop volumineux',
        detail: `Le fichier ${file.name} dépasse 10MB et a été ignoré.`,
        life: 4000
      })
      continue
    }
    const alreadySelected = validFiles.some(selected => (
      selected.name === file.name && selected.size === file.size
    ))
    if (!alreadySelected) validFiles.push(file)
  }

  selectedFiles.value = validFiles
  event.target.value = ''
}

const removeSelectedFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const openCreateTemplateDialog = () => {
  showCreateTemplateDialog.value = true
  newTemplate.value = {
    name: '',
    description: '',
    collect_type: null,
    checklist_items: [{ label: '', type: 'text' }],
    required_fields: []
  }
}

const addTemplateField = () => {
  newTemplate.value.checklist_items.push({ label: '', type: 'text' })
}

const removeTemplateField = (index) => {
  if (newTemplate.value.checklist_items.length > 1) {
    newTemplate.value.checklist_items.splice(index, 1)
  }
}

const createNewTemplate = async () => {
  const filledFields = newTemplate.value.checklist_items.filter(item => item.label?.trim())

  if (!newTemplate.value.name || !newTemplate.value.collect_type || !filledFields.length) {
    toast.add({
      severity: 'warn',
      summary: 'Template incomplet',
      detail: 'Veuillez renseigner le nom, la catégorie et au moins un champ.',
      life: 4000
    })
    return
  }

  creatingTemplate.value = true
  try {
    const payload = {
      ...newTemplate.value,
      checklist_items: filledFields,
      required_fields: filledFields.map(item => item.label.trim())
    }
    const response = await axiosInstance.post('/collect/templates/', payload)
    const createdTemplate = response.data?.data || response.data
    collectStore.templates.unshift(createdTemplate)
    newCollect.value.template = createdTemplate.id
    showCreateTemplateDialog.value = false
    toast.add({
      severity: 'success',
      summary: 'Template créé',
      detail: `Le template ${createdTemplate.name} a été créé.`,
      life: 4000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: getApiErrorMessage(err, 'Impossible de créer le template.'),
      life: 4000
    })
  } finally {
    creatingTemplate.value = false
  }
}

const updatePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return
  page.value = newPage
}

const resetFilters = () => {
  authorFilter.value = null
  periodFilter.value = null
  dateStart.value = ''
  dateEnd.value = ''
  clearFilters()
}

const createNewCollect = async () => {
  if (!newCollect.value.title || !newCollect.value.template || !newCollect.value.collect_type || !newCollect.value.workplace) {
    toast.add({
      severity: 'warn',
      summary: 'Informations manquantes',
      detail: 'Veuillez fournir le titre, le modèle et le poste de travail.',
      life: 3000
    })
    return
  }

  if (!requiredTemplateFieldsFilled.value) {
    toast.add({
      severity: 'warn',
      summary: 'Champs obligatoires',
      detail: 'Veuillez remplir les champs obligatoires du modèle.',
      life: 3000
    })
    return
  }

  creating.value = true

  const collectPayload = {
    title: newCollect.value.title,
    description: newCollect.value.description,
    template: newCollect.value.template,
    collect_type: newCollect.value.collect_type,
    workplace: newCollect.value.workplace,
    priority: newCollect.value.priority,
    collected_data: newCollect.value.collected_data,
    attachments: selectedFiles.value
  }

  const result = await collectStore.createCollect(collectPayload)
  creating.value = false

  if (result) {
    toast.add({
      severity: 'success',
      summary: 'Collecte créée',
      detail: 'Le rapport a bien été créé et est en attente de validation.',
      life: 3000
    })
    showCreateDialog.value = false
    resetCreateForm()
    triggerLoad()
  } else {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: collectStore.error || 'Impossible de créer le rapport.',
      life: 3000
    })
  }
}

const openShareDialog = (report) => {
  currentActionReport.value = report
  shareRecipients.value = ''
  shareMessage.value = ''
  showShareDialog.value = true
}

const submitShare = async () => {
  if (!currentActionReport.value || !shareRecipients.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Destinataires requis',
      detail: 'Veuillez indiquer au moins un destinataire.',
      life: 3000
    })
    return
  }

  const recipients = shareRecipients.value.split(',').map(email => email.trim()).filter(Boolean)
  const result = await collectStore.shareCollect(currentActionReport.value.id, recipients, shareMessage.value)

  if (result) {
    toast.add({
      severity: 'success',
      summary: 'Partage réussi',
      detail: 'Le rapport a été partagé par e-mail.',
      life: 3000
    })
    showShareDialog.value = false
  } else {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de partager le rapport.',
      life: 3000
    })
  }
}

const openValidateDialog = (report, status) => {
  currentActionReport.value = report
  validationStatus.value = status
  validationComments.value = ''
  showValidateDialog.value = true
}

const submitValidation = async () => {
  if (!currentActionReport.value) return

  if (validationStatus.value === 'NON_CONFORME' && !validationComments.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Motif requis',
      detail: 'Le motif est obligatoire pour rejeter un rapport.',
      life: 3000
    })
    return
  }

  const payload = {
    status: validationStatus.value,
    comments: validationComments.value
  }

  const result = await collectStore.validateCollect(currentActionReport.value.id, payload)
  if (result) {
    toast.add({
      severity: 'success',
      summary: 'Mise à jour OK',
      detail: validationStatus.value === 'NON_CONFORME' ? 'Le rapport a été rejeté.' : 'Le rapport a été validé.',
      life: 3000
    })
    showValidateDialog.value = false
    triggerLoad()
  } else {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: collectStore.error || 'Impossible de mettre à jour le statut.',
      life: 3000
    })
  }
}

const deleteCollect = async (report) => {
  if (!report) return

  if (!confirm(`Supprimer le rapport ${report.reference || report.title} ?`)) {
    return
  }

  const result = await collectStore.deleteCollect(report.id)
  if (result !== null) {
    toast.add({
      severity: 'success',
      summary: 'Supprimé',
      detail: 'Le rapport a été supprimé.',
      life: 3000
    })
    triggerLoad()
  } else {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le rapport.',
      life: 3000
    })
  }
}

const resolveAttachmentUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url

  const baseURL = axiosInstance.defaults.baseURL || window.location.origin
  const apiRoot = baseURL.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '')
  return `${apiRoot}${url.startsWith('/') ? url : `/${url}`}`
}

const downloadAttachment = (attachment) => {
  if (!attachment || !attachment.url) return
  const link = document.createElement('a')
  link.href = resolveAttachmentUrl(attachment.url)
  link.download = attachment.name || 'document'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const hasAttachments = (report) => {
  return Array.isArray(report?.attachments) && report.attachments.length > 0
}

const downloadAllAttachments = (report) => {
  if (!hasAttachments(report)) {
    toast.add({
      severity: 'warn',
      summary: 'Aucun document',
      detail: 'Aucune pièce jointe à télécharger pour ce rapport.',
      life: 3000
    })
    return
  }
  report.attachments.forEach((attachment, index) => {
    setTimeout(() => downloadAttachment(attachment), index * 150)
  })
}

const getAttachmentIcon = (attachment) => {
  const extension = (attachment?.extension || attachment?.name?.split('.').pop() || '').toLowerCase()
  if (extension.includes('pdf')) return 'pi pi-file-pdf'
  if (extension.includes('xls')) return 'pi pi-file-excel'
  return 'pi pi-file'
}

const formatFileSize = (bytes) => {
  const size = Number(bytes)
  if (!Number.isFinite(size) || size <= 0) return ''
  if (size < 1024) return `${size} o`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`
}

const downloadReport = async (report) => {
  if (report.attachments && report.attachments.length) {
    downloadAttachment(report.attachments[0])
    return
  }

  if (report.pdf_file) {
    const link = document.createElement('a')
    link.href = report.pdf_file
    link.download = report.name || 'rapport.pdf'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return
  }

  toast.add({
    severity: 'warn',
    summary: 'Aucun document',
    detail: 'Aucun fichier à télécharger pour ce rapport.',
    life: 3000
  })
}

const getProgressColor = (progress) => {
  if (progress >= 100) return 'complete'
  if (progress >= 75) return 'high'
  if (progress >= 50) return 'medium'
  if (progress >= 25) return 'low'
  return 'start'
}

const formatDataKey = (key) => {
  // Convert snake_case or camelCase to readable format
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\w/, c => c.toUpperCase())
    .trim()
}

const formatDataValue = (value) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (typeof value === 'number') return value.toLocaleString('fr-FR')
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

const isNumeric = (value) => {
  return typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value))
}

const applyStatFilter = (kind, value = null) => {
  searchTerm.value = ''
  priorityFilter.value = null
  authorFilter.value = null
  periodFilter.value = null
  dateStart.value = ''
  dateEnd.value = ''

  if (kind === 'status') {
    statusFilter.value = value
    typeFilter.value = null
  } else {
    statusFilter.value = null
    typeFilter.value = null
  }

  page.value = 1
  triggerLoad()
}

// Lifecycle
onMounted(async () => {
  navigationStore.setActiveSection('collect')
  // charger templates/column tags initialement
  collectStore.loadTemplates()
  collectStore.loadColumnTags()
  try {
    await accountsStore.loadWorkplaces()
    if (!newCollect.value.workplace && workplaceOptions.value.length) {
      newCollect.value.workplace = workplaceOptions.value[0].id
    }
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'Postes indisponibles',
      detail: 'Impossible de charger les postes de travail pour le moment.',
      life: 4000
    })
  }
  // load initial collects
  triggerLoad()
})

const clearFilters = () => {
  searchTerm.value = ''
  typeFilter.value = null
  statusFilter.value = null
  priorityFilter.value = null
  dateStart.value = ''
  dateEnd.value = ''
  triggerLoad()
}

// Watch filters -> reload
watch([searchTerm, typeFilter, statusFilter, priorityFilter, dateStart, dateEnd], () => {
  page.value = 1
  triggerLoad()
})

watch(selectedTemplate, (template) => {
  newCollect.value.collect_type = template?.collect_type || null

  const nextData = {}
  selectedTemplateFields.value.forEach((field, index) => {
    const key = getTemplateFieldKey(field, index)
    nextData[key] = newCollect.value.collected_data?.[key] ?? (isBooleanTemplateField(field) ? null : '')
  })
  newCollect.value.collected_data = nextData
})
</script>

<style scoped>
.collect-page {
  min-height: 100vh;
  background: #FFFFFF;
}

/* Page Header */
.page-header {
  background: linear-gradient(135deg, #FFFFFF 0%, #f8fafb 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 1.5rem 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
  font-family: 'Inter', sans-serif;
}

.page-subtitle {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
  font-weight: 400;
}

.create-btn {
  background: var(--kap-green) !important;
  border: none !important;
  color: var(--kap-white) !important;
  font-weight: 600 !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 10px !important;
  transition: all 0.2s ease !important;
}

.create-btn:hover {
  background: var(--green-600) !important;
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
.collect-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.overview-badges {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  width: 100%;
  max-width: 1400px;
  margin: 1.25rem auto 1.5rem;
  padding: 0 2rem;
  box-sizing: border-box;
}

.overview-card {
  appearance: none;
  border: 0;
  border-radius: 10px;
  padding: 0.75rem 0.875rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.625rem;
  min-width: 0;
  min-height: 64px;
  text-align: left;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.overview-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  border-radius: 50%;
  opacity: 0.05;
  pointer-events: none;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.overview-card.active {
  outline: 3px solid rgba(15, 23, 42, 0.18);
  outline-offset: 2px;
}

.overview-card-total {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
}

.overview-card-conform {
  background: linear-gradient(135deg, #10b981 0%, #047857 100%);
}

.overview-card-non-conform {
  background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%);
}

.overview-card-pending {
  background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%);
}

.overview-card-base {
  background: linear-gradient(135deg, #6b7280 0%, #374151 100%);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.stat-header i {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
}

.overview-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin: 0;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.overview-card strong {
  color: white;
  font-size: 1.4rem;
  line-height: 1;
  font-weight: 700;
  flex-shrink: 0;
}

.overview-card small {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
  margin: 0;
}


/* Filters Section */
.filters-section {
  background: linear-gradient(135deg, #FFFFFF 0%, #f8fafb 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 250px;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 1.1rem;
  pointer-events: none;
  z-index: 1;
}

.clear-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  z-index: 1;
}

.clear-icon:hover {
  color: #64748b;
  background: #f1f5f9;
}

.search-input {
  width: 100% !important;
  padding: 0.625rem 2rem 0.625rem 2.5rem !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  font-size: 0.875rem !important;
  transition: all 0.2s ease !important;
  background: #f8fafc !important;
}

.search-input:hover {
  border-color: #cbd5e1 !important;
  background: #ffffff !important;
}

.search-input:focus {
  border-color: #7AC943 !important;
  background: #ffffff !important;
  box-shadow: 0 0 0 4px rgba(122, 201, 67, 0.12) !important;
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-stats {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border-radius: 8px;
  flex-shrink: 0;
}

.stats-count {
  font-weight: 700;
  font-size: 1.125rem;
  color: #3b82f6;
}

.stats-label {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
}

.filter-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.filter-dropdown {
  min-width: 130px;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
}

.filter-input {
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  padding: 0.5rem 0.75rem !important;
  font-size: 0.85rem !important;
  background: #f8fafc !important;
  color: #1e293b !important;
  transition: all 0.2s ease !important;
}

.filter-input:hover {
  border-color: #cbd5f0 !important;
  background: white !important;
}

.filter-input:focus {
  border-color: #3b82f6 !important;
  background: white !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* Reports Grid */
.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0.5rem 0;
}

.report-card {
  background: linear-gradient(135deg, #FFFFFF 0%, #f8fafb 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.report-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #1e40af);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.report-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.12);
  transform: translateY(-2px);
  background: linear-gradient(135deg, #FFFFFF 0%, #f0f4ff 100%);
}

.report-card:hover::before {
  transform: scaleX(1);
}

/* Report Icon */
.report-icon {
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.125rem;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.report-badge {
  position: absolute;
  bottom: -6px;
  right: -6px;
  background: white;
  color: #3b82f6;
  font-size: 0.5rem;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  border: 1.5px solid #3b82f6;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.2);
}

.report-badge.status-planned {
  color: #b45309;
  border-color: #f59e0b;
}

.report-badge.status-validated {
  color: #047857;
  border-color: #10b981;
}

.report-badge.status-non-conform {
  color: #b91c1c;
  border-color: #ef4444;
}

/* Report Content */
.report-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.report-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.report-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  background: linear-gradient(135deg, #f0f4ff, #e0e7ff);
  color: #3b5bdb;
  border-radius: 5px;
  font-weight: 500;
  border: 0.5px solid #cbd5f0;
}

.meta-tag i {
  font-size: 0.625rem;
}

.meta-date {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #64748b;
  font-weight: 500;
  font-size: 0.7rem;
}

.meta-date i {
  font-size: 0.625rem;
}

.report-generated {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

.report-generated i {
  font-size: 0.625rem;
  color: #94a3b8;
}

/* Report Actions */
.report-actions {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.report-actions .btn-view,
.report-actions .btn-download,
.report-actions .btn-share,
.report-actions .btn-validate,
.report-actions .btn-nonconform,
.report-actions .btn-delete {
  background: transparent !important;
  border: 1px solid #e2e8f0 !important;
  color: #64748b !important;
  width: 36px !important;
  height: 36px !important;
  padding: 0 !important;
  transition: all 0.2s ease !important;
  box-shadow: none !important;
  font-size: 0.875rem !important;
}

.report-actions .btn-view:hover,
.report-actions .btn-download:hover,
.report-actions .btn-share:hover {
  background: #f0f4ff !important;
  border-color: #3b82f6 !important;
  color: #3b82f6 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1) !important;
}

.report-actions .btn-validate:hover {
  background: #dcfce7 !important;
  border-color: #16a34a !important;
  color: #16a34a !important;
}

.report-actions .btn-nonconform:hover {
  background: #fecaca !important;
  border-color: #dc2626 !important;
  color: #dc2626 !important;
}

.report-actions .btn-delete:hover {
  background: #fee2e2 !important;
  border-color: #dc2626 !important;
  color: #dc2626 !important;
}

.status-badge.status-validated {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.card-content {
  margin-top: 1rem;
}

.collect-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.meta-item .label {
  color: #6b7280;
  font-weight: 500;
}

.meta-item .value {
  color: #111827;
  font-weight: 600;
}

.priority-low {
  color: #6b7280;
}

.priority-medium {
  color: #2563eb;
}

.priority-high {
  color: #d97706;
}

.priority-urgent {
  color: #dc2626;
}

.progress-section {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #22c55e;
  transition: width 0.3s ease;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.time-item {
  display: flex;
  justify-content: space-between;
}

.time-value.overdue {
  color: #dc2626;
  font-weight: 600;
}

/* Report Modal Styles */
.report-modal .modal-content {
  padding: 1rem 0;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.info-row .label {
  font-weight: 600;
  color: #374151;
  width: 180px;
  flex-shrink: 0;
}

.info-row .value {
  color: #6b7280;
  flex: 1;
}

.info-row .status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-submitted {
  background: #dbeafe;
  color: #2563eb;
}

.status-draft {
  background: #f3f4f6;
  color: #6b7280;
}

.status-validated {
  background: #d1fae5;
  color: #059669;
}

.data-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.data-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.data-item {
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.data-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.data-value {
  display: block;
  font-size: 0.875rem;
  color: #111827;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.card-content {
  padding: 0;
}

.collect-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.detail-item i {
  width: 16px;
  color: #7AC943;
  flex-shrink: 0;
}

.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.type-badge.maintenance {
  background: #fef3c7;
  color: #d97706;
}

.type-badge.production {
  background: #e0e7ff;
  color: #4f46e5;
}

.type-badge.qualite {
  background: #ecfdf5;
  color: #059669;
}

.type-badge.securite {
  background: #fee2e2;
  color: #dc2626;
}

.progress-section {
  background: #f8fafc;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.progress-value {
  font-size: 0.875rem;
  color: #0B2B3C;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #7AC943;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.equipment-progress {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.time-item i {
  width: 14px;
  color: #7AC943;
}

.card-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  font-size: 0.8125rem !important;
  padding: 0.5rem 1rem !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.2s ease !important;
}

.action-btn.primary {
  background: #7AC943 !important;
  border: none !important;
  color: #FFFFFF !important;
}

.action-btn.primary:hover {
  background: #65a335 !important;
  transform: translateY(-1px);
}

.action-btn.success {
  background: #10b981 !important;
  border: none !important;
  color: #FFFFFF !important;
}

.action-btn.success:hover {
  background: #059669 !important;
  transform: translateY(-1px);
}

.action-btn.secondary {
  color: #64748b !important;
  border: 1px solid #e2e8f0 !important;
  background: transparent !important;
}

.action-btn.secondary:hover {
  color: #0B2B3C !important;
  border-color: #cbd5e1 !important;
  background: #f8fafc !important;
}

.action-btn.info {
  color: #2563eb !important;
  border: 1px solid #dbeafe !important;
  background: transparent !important;
}

.action-btn.info:hover {
  color: #1d4ed8 !important;
  background: #dbeafe !important;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0B2B3C;
  margin: 0 0 0.5rem 0;
}

.empty-content p {
  color: #64748b;
  margin: 0 0 1.5rem 0;
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

.dialog-content {
  padding: 1.5rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
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
@media (max-width: 1100px) {
  .overview-badges {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .collect-content {
    padding: 1.5rem;
  }

  .overview-badges {
    padding: 0 1.5rem;
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    min-width: auto;
  }

  .filter-group {
    justify-content: stretch;
  }

  .filter-dropdown {
    flex: 1;
    min-width: auto;
  }

  .collects-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-header, .collect-content {
    padding: 1rem;
  }

  .overview-badges {
    grid-template-columns: minmax(0, 1fr);
    padding: 0 1rem;
    gap: 0.625rem;
    margin-top: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }



  .collect-details {
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}

/* ==================== IMPROVED MODAL STYLES ==================== */

.report-modal-improved :deep(.p-dialog-content) {
  padding: 0 !important;
  border-radius: 16px;
  overflow: hidden;
}

.modal-improved {
  background: #ffffff;
}

/* Modal Header */
.modal-header-custom {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.5rem 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}

.header-left {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.report-type-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.report-type-icon i {
  font-size: 1.25rem;
  color: white;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.3;
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.meta-chip i {
  font-size: 0.6875rem;
  color: #94a3b8;
}

.close-btn {
  color: white !important;
  width: 36px !important;
  height: 36px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border: none !important;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

/* Quick Stats */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #fafbfc;
}

.stat-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon i {
  font-size: 0.875rem;
}

.stat-icon.user {
  background: #dbeafe;
  color: #2563eb;
}

.stat-icon.site {
  background: #fef3c7;
  color: #d97706;
}

.stat-icon.workplace {
  background: #e0e7ff;
  color: #4f46e5;
}

.stat-icon.status {
  background: #f1f5f9;
}

.stat-icon.status.success {
  background: #dcfce7;
  color: #16a34a;
}

.stat-icon.status.info {
  background: #dbeafe;
  color: #2563eb;
}

.stat-icon.status.warning {
  background: #fef3c7;
  color: #d97706;
}

.stat-icon.status.danger {
  background: #fee2e2;
  color: #dc2626;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.stat-label {
  font-size: 0.6875rem;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.stat-value {
  font-size: 0.8125rem;
  color: #1e293b;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-text.success { color: #16a34a; }
.status-text.info { color: #2563eb; }
.status-text.warning { color: #d97706; }
.status-text.danger { color: #dc2626; }

/* Progress Section Modal */
.progress-section-modal {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.progress-header-modal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
}

.progress-percentage {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
}

.progress-track {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill-modal {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill-modal.start { background: #94a3b8; }
.progress-fill-modal.low { background: #f59e0b; }
.progress-fill-modal.medium { background: #3b82f6; }
.progress-fill-modal.high { background: #22c55e; }
.progress-fill-modal.complete { background: linear-gradient(90deg, #22c55e, #16a34a); }

/* Data Section Improved */
.data-section-improved {
  padding: 1.25rem 1.5rem;
}

.compact-modal-section {
  padding: 1rem 1.5rem;
}

.modal-section-muted {
  background: #f8fafc;
  border-top: 1px solid #eef2f7;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1rem;
}

.section-header i {
  font-size: 1rem;
  color: #3b82f6;
}

.section-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.875rem 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  color: #334155;
  font-size: 0.8125rem;
  font-weight: 700;
}

.required-dot {
  color: #dc2626;
}

.input-with-action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px;
  gap: 0.5rem;
  align-items: center;
}

.inline-icon-action {
  width: 38px !important;
  height: 38px !important;
  background: #e0f2fe !important;
  border: 1px solid #bae6fd !important;
  color: #0369a1 !important;
}

.inline-icon-action:hover {
  background: #bae6fd !important;
  color: #0c4a6e !important;
}

.file-drop-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 74px;
  border: 1.5px dashed #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s ease;
}

.file-drop-zone:hover {
  border-color: #3b82f6;
  color: #1d4ed8;
  background: #eff6ff;
}

.file-drop-zone i {
  font-size: 1.2rem;
}

.file-drop-zone input {
  display: none;
}

.selected-files {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.file-chip {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.5rem 0.45rem 0.65rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #334155;
  font-size: 0.8125rem;
  font-weight: 600;
}

.file-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-chip button {
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
}

.file-chip button:hover {
  background: #fee2e2;
  color: #dc2626;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.attachment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.attachment-info i {
  color: #2563eb;
  font-size: 1.25rem;
}

.attachment-info div {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.attachment-info strong {
  color: #0f172a;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-info span {
  color: #64748b;
  font-size: 0.75rem;
}

.attachment-download {
  width: auto !important;
  padding: 0.45rem 0.8rem !important;
}

.template-fields {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.template-field-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 150px 36px;
  gap: 0.5rem;
  align-items: center;
}

.field-index {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.78rem;
  font-weight: 800;
}

.field-label-input {
  width: 100%;
}

.field-delete-btn {
  color: #64748b !important;
}

.field-delete-btn:hover:not(:disabled) {
  background: #fee2e2 !important;
  color: #dc2626 !important;
}

.template-preview {
  padding: 0.875rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.template-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: #334155;
  font-size: 0.8125rem;
  font-weight: 800;
}

.template-preview-header strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.45rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.75rem;
}

.template-preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.5rem;
}

.template-preview-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.template-preview-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.template-preview-field label {
  color: #0f172a;
  font-size: 0.8125rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-preview-field small {
  color: #64748b;
  font-size: 0.72rem;
}

.add-field-row {
  margin-top: 0.75rem;
}

.data-count {
  font-size: 0.75rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.25rem 0.625rem;
  border-radius: 12px;
  font-weight: 500;
}

.data-table {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-height: 350px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.data-table::-webkit-scrollbar {
  width: 6px;
}

.data-table::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.data-table::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.data-row {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  transition: all 0.15s ease;
}

.data-row:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.data-key {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
}

.data-key i {
  font-size: 0.625rem;
  color: #94a3b8;
}

.data-val {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 600;
  text-align: right;
  max-width: 50%;
  word-break: break-word;
}

.data-val.numeric {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  color: #3b82f6;
}

/* Empty Data */
.empty-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  color: #94a3b8;
}

.empty-data i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-data p {
  font-size: 0.875rem;
  margin: 0;
}

/* Modal Footer Improved */
.modal-footer-improved {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 1rem 1.5rem;
  background: #fafbfc;
  border-top: 1px solid #f1f5f9;
}

.modal-footer-improved .p-button {
  margin: 0 !important;
}

.btn-close {
  border-color: #e2e8f0 !important;
  color: #64748b !important;
}

.btn-close:hover {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
  color: #374151 !important;
}

/* Responsive Modal */
@media (max-width: 640px) {
  .modal-header-custom {
    flex-direction: column;
    gap: 1rem;
  }

  .header-left {
    width: 100%;
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }

  .quick-stats {
    grid-template-columns: 1fr 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .template-field-row {
    grid-template-columns: 28px minmax(0, 1fr) 36px;
  }

  .template-field-row select {
    grid-column: 2 / 4;
  }

  .field-delete-btn {
    grid-column: 3;
    grid-row: 1;
  }

  .data-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.375rem;
  }

  .data-val {
    text-align: left;
    max-width: 100%;
  }
}
</style>
