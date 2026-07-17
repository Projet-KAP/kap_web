<template>
  <Transition name="slide-up">
    <div v-if="wizardStore.showPrompt" class="post-submit-prompt">
      <div class="prompt-content">
        <div class="prompt-icon">
          <i class="pi pi-sparkles"></i>
        </div>

        <div class="prompt-text">
          <h4>Données enregistrées !</h4>
          <p>Souhaitez-vous créer un tableau de bord pour visualiser ces données ?</p>
        </div>
      </div>

      <div class="prompt-actions">
        <Button
          label="Créer un tableau de bord"
          icon="pi pi-chart-bar"
          size="small"
          @click="openWizard"
        />
        <Button
          label="Plus tard"
          text
          size="small"
          severity="secondary"
          @click="dismiss"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import Button from 'primevue/button'
import { useDashboardWizardStore } from '@/features/ai/stores/dashboardWizardStore'

const wizardStore = useDashboardWizardStore()

function openWizard() {
  wizardStore.openWizard('document', wizardStore.sourceData)
}

function dismiss() {
  wizardStore.dismissPrompt()
}
</script>

<style lang="scss" scoped>
.post-submit-prompt {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 360px;
  max-width: calc(100vw - 48px);
  background: white;
  border-radius: 16px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 20px 25px -5px rgba(0, 0, 0, 0.1);
  z-index: 1100;
  overflow: hidden;
  border: 1px solid var(--surface-200);

}

.prompt-content {
  display: flex;
  gap: 1rem;
  padding: 1.25rem 1.25rem 1rem;

  .prompt-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 1.5rem;
      color: var(--primary-600);
    }
  }

  .prompt-text {
    h4 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color);
    }

    p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      line-height: 1.4;
    }
  }
}

.prompt-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0 1.25rem 1.25rem;

  :deep(.p-button) {
    &:first-child {
      flex: 1;
    }
  }
}

// Transition
.slide-up-enter-active {
  animation: slideDown 0.35s ease-out;
}

.slide-up-leave-active {
  animation: slideDown 0.25s ease-in reverse;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
