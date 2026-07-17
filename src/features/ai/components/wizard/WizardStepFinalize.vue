<template>
  <div class="wizard-step-finalize">
    <!-- Loading state -->
    <div v-if="wizardStore.creationLoading" class="loading-state">
      <ProgressSpinner strokeWidth="3" />
      <h3>Creation en cours...</h3>
      <p>Votre tableau de bord est en cours de creation</p>
    </div>

    <!-- Success state -->
    <template v-else-if="wizardStore.createdDashboard">
      <div class="success-state">
        <div class="success-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <h2>Tableau de bord créé avec succès !</h2>
        <p class="success-message">
          Votre tableau de bord "{{ wizardStore.createdDashboard.name }}" est pret a etre utilise.
        </p>

        <!-- Stats -->
        <div class="creation-stats">
          <div class="stat-item">
            <span class="stat-value">{{ wizardStore.previewWidgets.length }}</span>
            <span class="stat-label">widgets</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ wizardStore.totalSelectedItems }}</span>
            <span class="stat-label">indicateurs</span>
          </div>
        </div>

        <!-- Primary action -->
        <Button
          label="Ouvrir le tableau de bord"
          icon="pi pi-external-link"
          class="p-button-lg primary-action"
          @click="openDashboard"
        />

        <!-- Secondary actions -->
        <div class="secondary-actions">
          <Button
            label="Continuer a editer"
            icon="pi pi-pencil"
            text
            @click="editDashboard"
          />
          <Button
            label="Fermer"
            icon="pi pi-times"
            text
            severity="secondary"
            @click="close"
          />
        </div>
      </div>
    </template>

    <!-- Error state -->
    <div v-else-if="creationError" class="error-state">
      <div class="error-icon">
        <i class="pi pi-times-circle"></i>
      </div>
      <h3>Erreur lors de la creation</h3>
      <p>{{ creationError }}</p>
      <Button
        label="Reessayer"
        icon="pi pi-refresh"
        @click="retryCreation"
      />
    </div>

    <!-- Ready to create state -->
    <div v-else class="ready-state">
      <div class="ready-icon">
        <i class="pi pi-check-square"></i>
      </div>
      <h3>Prêt à créer votre tableau de bord</h3>
      <p>Cliquez sur le bouton ci-dessous pour finaliser la creation.</p>

      <div class="recap-section">
        <h4>Recapitulatif</h4>
        <ul class="recap-list">
          <li>
            <i class="pi pi-file"></i>
            <span>Nom: <strong>{{ wizardStore.dashboardName }}</strong></span>
          </li>
          <li>
            <i class="pi pi-tag"></i>
            <span>{{ wizardStore.selectedTagIds.length }} indicateur(s) sélectionné(s)</span>
          </li>
          <li>
            <i class="pi pi-calculator"></i>
            <span>{{ wizardStore.selectedKPIIds.length }} KPI(s) sélectionné(s)</span>
          </li>
          <li>
            <i class="pi pi-th-large"></i>
            <span>{{ wizardStore.previewWidgets.length }} widget(s) à créer</span>
          </li>
        </ul>
      </div>

      <Button
        label="Créer le tableau de bord"
        icon="pi pi-sparkles"
        class="p-button-lg create-button"
        :loading="wizardStore.creationLoading"
        @click="createDashboard"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import { useDashboardWizardStore } from '@/features/ai/stores/dashboardWizardStore'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const wizardStore = useDashboardWizardStore()
const toast = useToast()

const creationError = ref(null)

async function createDashboard() {
  creationError.value = null
  const result = await wizardStore.createDashboard()

  if (!result.success) {
    creationError.value = result.error || 'Une erreur est survenue'
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: creationError.value,
      life: 5000
    })
  } else {
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Tableau de bord créé avec succès !',
      life: 3000
    })
  }
}

function retryCreation() {
  creationError.value = null
  createDashboard()
}

function openDashboard() {
  const dashboardId = wizardStore.createdDashboard?.id
  wizardStore.closeWizard()

  if (dashboardId) {
    router.push({
      name: 'analytics',
      query: {
        fromWizard: 'true',
        dashboardId: dashboardId
      }
    })
  } else {
    router.push({ name: 'analytics' })
  }

  // Reset after navigation
  setTimeout(() => {
    wizardStore.resetState()
  }, 500)
}

function editDashboard() {
  const dashboardId = wizardStore.createdDashboard?.id
  wizardStore.closeWizard()

  router.push({
    name: 'analytics',
    query: {
      fromWizard: 'true',
      dashboardId: dashboardId,
      edit: 'true'
    }
  })

  setTimeout(() => {
    wizardStore.resetState()
  }, 500)
}

function close() {
  wizardStore.closeWizard()
  wizardStore.resetState()
}
</script>

<style lang="scss" scoped>
.wizard-step-finalize {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  min-height: 400px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  h3 {
    margin: 1rem 0 0.5rem;
    font-weight: 600;
    color: var(--text-color);
  }

  p {
    margin: 0;
    color: var(--text-color-secondary);
  }
}

.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: fadeInUp 0.4s ease-out;

  .success-icon {
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, var(--green-100) 0%, var(--green-200) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    animation: scaleIn 0.3s ease-out 0.1s both;

    i {
      font-size: 3.5rem;
      color: var(--green-600);
    }
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .success-message {
    margin: 0 0 1.5rem;
    color: var(--text-color-secondary);
    max-width: 400px;
  }

  .creation-stats {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem 1.5rem;
      background: var(--surface-50);
      border-radius: 10px;

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary-600);
      }

      .stat-label {
        font-size: 0.85rem;
        color: var(--text-color-secondary);
      }
    }
  }

  .primary-action {
    margin-bottom: 1rem;
    padding: 0.75rem 2rem;
  }

  .secondary-actions {
    display: flex;
    gap: 0.5rem;
  }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  .error-icon {
    width: 80px;
    height: 80px;
    background: var(--red-100);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;

    i {
      font-size: 3rem;
      color: var(--red-500);
    }
  }

  h3 {
    margin: 0 0 0.5rem;
    font-weight: 600;
    color: var(--text-color);
  }

  p {
    margin: 0 0 1.5rem;
    color: var(--text-color-secondary);
  }
}

.ready-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 450px;

  .ready-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;

    i {
      font-size: 2.5rem;
      color: var(--primary-600);
    }
  }

  h3 {
    margin: 0 0 0.5rem;
    font-weight: 600;
    color: var(--text-color);
  }

  p {
    margin: 0 0 1.5rem;
    color: var(--text-color-secondary);
  }

  .recap-section {
    width: 100%;
    background: var(--surface-50);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
    text-align: left;

    h4 {
      margin: 0 0 0.75rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .recap-list {
      list-style: none;
      margin: 0;
      padding: 0;

      li {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0;
        font-size: 0.9rem;
        color: var(--text-color-secondary);
        border-bottom: 1px solid var(--surface-200);

        &:last-child {
          border-bottom: none;
        }

        i {
          color: var(--primary-500);
          width: 20px;
        }

        strong {
          color: var(--text-color);
        }
      }
    }
  }

  .create-button {
    padding: 0.875rem 2.5rem;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
