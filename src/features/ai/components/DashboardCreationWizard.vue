<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    :closable="!wizardStore.creationLoading"
    :dismissableMask="!wizardStore.creationLoading"
    :style="{ width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh', margin: 0, borderRadius: 0 }"
    :contentStyle="{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }"
    :pt="{
      header: { class: 'wizard-dialog-header' },
      content: { class: 'wizard-dialog-content' }
    }"
    @hide="onDialogHide"
  >
    <template #header>
      <div class="wizard-header">
        <div class="header-title">
          <i class="pi pi-sparkles"></i>
          <span>Créer un tableau de bord</span>
        </div>
        <!-- Stepper -->
        <div class="wizard-stepper">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="stepper-item"
            :class="{
              active: wizardStore.currentStep === index,
              completed: wizardStore.currentStep > index,
              disabled: !canAccessStep(index)
            }"
          >
            <div class="stepper-indicator">
              <i v-if="wizardStore.currentStep > index" class="pi pi-check"></i>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="stepper-label">{{ step.label }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Step content -->
    <div class="wizard-content">
      <Transition name="fade-slide" mode="out-in">
        <WizardStepObjective v-if="wizardStore.currentStep === 0" key="step0" />
        <WizardStepAnalysis v-else-if="wizardStore.currentStep === 1" key="step1" />
        <WizardStepDashboard v-else-if="wizardStore.currentStep === 2" key="step2" />
        <WizardStepFinalize v-else-if="wizardStore.currentStep === 3" key="step3" />
      </Transition>
    </div>

    <!-- Footer navigation -->
    <template #footer>
      <div class="wizard-footer" v-if="wizardStore.currentStep < 3 || !wizardStore.createdDashboard">
        <Button
          v-if="wizardStore.currentStep > 0"
          label="Retour"
          icon="pi pi-arrow-left"
          text
          :disabled="wizardStore.analysisLoading || wizardStore.creationLoading"
          @click="previousStep"
        />
        <div class="footer-spacer"></div>
        <Button
          v-if="wizardStore.currentStep === 0"
          label="Annuler"
          text
          severity="secondary"
          @click="cancel"
        />
        <Button
          v-if="wizardStore.currentStep < 3"
          :label="getNextButtonLabel()"
          :icon="getNextButtonIcon()"
          iconPos="right"
          :disabled="!canProceed"
          :loading="wizardStore.analysisLoading"
          @click="nextStep"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import WizardStepObjective from './wizard/WizardStepObjective.vue'
import WizardStepAnalysis from './wizard/WizardStepAnalysis.vue'
import WizardStepDashboard from './wizard/WizardStepDashboard.vue'
import WizardStepFinalize from './wizard/WizardStepFinalize.vue'
import { useDashboardWizardStore } from '@/features/ai/stores/dashboardWizardStore'

const wizardStore = useDashboardWizardStore()

const steps = [
  { label: 'Objectif', key: 'objective' },
  { label: 'Analyse', key: 'analysis' },
  { label: 'Dashboard', key: 'dashboard' },
  { label: 'Finalisation', key: 'finalize' }
]

const dialogVisible = computed({
  get: () => wizardStore.isWizardOpen,
  set: (value) => {
    if (!value) {
      wizardStore.closeWizard()
    }
  }
})

const canProceed = computed(() => {
  switch (wizardStore.currentStep) {
    case 0:
      return wizardStore.canProceedToStep2
    case 1:
      return wizardStore.canProceedToStep3
    case 2:
      return wizardStore.canProceedToStep4
    default:
      return true
  }
})

function canAccessStep(stepIndex) {
  if (stepIndex === 0) return true
  if (stepIndex === 1) return wizardStore.canProceedToStep2
  if (stepIndex === 2) return wizardStore.canProceedToStep3 && wizardStore.analysisResult
  if (stepIndex === 3) return wizardStore.canProceedToStep4
  return false
}

function getNextButtonLabel() {
  if (wizardStore.currentStep === 0) return 'Analyser'
  if (wizardStore.currentStep === 1) return 'Configurer'
  if (wizardStore.currentStep === 2) return 'Finaliser'
  return 'Suivant'
}

function getNextButtonIcon() {
  if (wizardStore.currentStep === 0) return 'pi pi-sparkles'
  return 'pi pi-arrow-right'
}

function nextStep() {
  wizardStore.nextStep()
}

function previousStep() {
  wizardStore.previousStep()
}

function cancel() {
  wizardStore.closeWizard()
}

function onDialogHide() {
  // Only reset if we haven't created a dashboard
  if (!wizardStore.createdDashboard) {
    // Optional: keep state for potential return
  }
}

// Watch for step changes to trigger analysis
watch(() => wizardStore.currentStep, (newStep, oldStep) => {
  // When entering step 1 (Analysis) from step 0
  if (newStep === 1 && oldStep === 0) {
    // Analysis will be triggered automatically by the component
  }
  // When entering step 2 (Dashboard), generate preview
  if (newStep === 2) {
    wizardStore.generatePreview()
  }
})
</script>

<style lang="scss" scoped>
:deep(.p-dialog) {
  display: flex;
  flex-direction: column;
}

:deep(.wizard-dialog-header) {
  padding: 0 !important;
  border-bottom: 1px solid var(--surface-200);
  flex-shrink: 0;
}

:deep(.wizard-dialog-content) {
  padding: 0 !important;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.wizard-header {
  width: 100%;
  padding: 1rem 1.5rem;

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color);

    i {
      color: var(--primary-500);
    }
  }
}

.wizard-stepper {
  display: flex;
  justify-content: space-between;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 14px;
    left: 30px;
    right: 30px;
    height: 2px;
    background: var(--surface-200);
    z-index: 0;
  }

  .stepper-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    z-index: 1;
    flex: 1;

    .stepper-indicator {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-100);
      border: 2px solid var(--surface-300);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      transition: all 0.2s ease;
    }

    .stepper-label {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      text-align: center;
      transition: all 0.2s ease;
    }

    &.active {
      .stepper-indicator {
        background: var(--primary-500);
        border-color: var(--primary-500);
        color: white;
      }

      .stepper-label {
        color: var(--primary-600);
        font-weight: 500;
      }
    }

    &.completed {
      .stepper-indicator {
        background: var(--green-500);
        border-color: var(--green-500);
        color: white;
      }

      .stepper-label {
        color: var(--green-600);
      }
    }

    &.disabled {
      .stepper-indicator {
        opacity: 0.5;
      }

      .stepper-label {
        opacity: 0.5;
      }
    }
  }
}

.wizard-content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.wizard-footer {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--surface-200);

  .footer-spacer {
    flex: 1;
  }

  :deep(.p-button) {
    &:not(:last-child) {
      margin-right: 0.5rem;
    }
  }
}

// Transitions
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
