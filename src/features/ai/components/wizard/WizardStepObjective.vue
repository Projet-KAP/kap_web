<template>
  <div class="wizard-step-objective">
    <!-- Illustration -->
    <div class="step-header">
      <div class="illustration">
        <i class="pi pi-lightbulb"></i>
      </div>
      <h2>Que souhaitez-vous suivre?</h2>
      <p class="subtitle">
        Decrivez les indicateurs que vous voulez visualiser dans votre tableau de bord.
      </p>
    </div>

    <!-- Quick suggestions -->
    <div class="quick-suggestions">
      <span class="label">Suggestions rapides:</span>
      <div class="suggestion-chips">
        <Chip
          v-for="suggestion in suggestions"
          :key="suggestion.value"
          :label="suggestion.label"
          :class="{ selected: selectedSuggestion === suggestion.value }"
          @click="selectSuggestion(suggestion)"
        />
      </div>
    </div>

    <!-- Text area -->
    <div class="objective-input">
      <Textarea
        v-model="localObjective"
        :placeholder="placeholder"
        rows="4"
        autoResize
        class="w-full"
      />
      <div class="char-count">
        {{ localObjective.length }} / 500 caracteres
      </div>
    </div>

    <!-- Contextual info -->
    <div v-if="documentInfo" class="document-context">
      <i class="pi pi-file"></i>
      <span>Document source: <strong>{{ documentInfo }}</strong></span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Textarea from 'primevue/textarea'
import Chip from 'primevue/chip'
import { useDashboardWizardStore } from '@/features/ai/stores/dashboardWizardStore'

const wizardStore = useDashboardWizardStore()

const suggestions = [
  { value: 'production', label: 'Production', text: 'Je veux suivre la production journaliere, les volumes et les cadences de mes equipes.' },
  { value: 'qualite', label: 'Qualité', text: 'Je souhaite surveiller les indicateurs qualité, le taux de rebut et la conformité.' },
  { value: 'ressources', label: 'Ressources', text: 'Je veux suivre l\'utilisation des ressources, le personnel et les equipements.' },
  { value: 'finance', label: 'Financier', text: 'Je souhaite visualiser les indicateurs financiers, les couts et les recettes.' }
]

const selectedSuggestion = ref(null)
const localObjective = ref(wizardStore.userObjective)

const placeholder = computed(() => {
  return 'Ex: Je veux suivre la production journaliere et comparer les performances par equipe. Je souhaite aussi voir l\'evolution des rebuts et le taux de rendement global...'
})

const documentInfo = computed(() => {
  if (wizardStore.sourceData?.modele_structure?.nom) {
    return wizardStore.sourceData.modele_structure.nom
  }
  return null
})

function selectSuggestion(suggestion) {
  selectedSuggestion.value = suggestion.value
  localObjective.value = suggestion.text
}

// Sync with store
watch(localObjective, (newValue) => {
  wizardStore.userObjective = newValue
})

watch(() => wizardStore.userObjective, (newValue) => {
  if (newValue !== localObjective.value) {
    localObjective.value = newValue
  }
})
</script>

<style lang="scss" scoped>
.wizard-step-objective {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.step-header {
  text-align: center;

  .illustration {
    width: 80px;
    height: 80px;
    margin: 0 auto 1rem;
    background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 2.5rem;
      color: var(--primary-600);
    }
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .subtitle {
    margin: 0;
    color: var(--text-color-secondary);
    font-size: 0.95rem;
  }
}

.quick-suggestions {
  .label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
  }

  .suggestion-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    :deep(.p-chip) {
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--surface-100);
      border: 1px solid var(--surface-200);

      &:hover {
        background: var(--primary-50);
        border-color: var(--primary-200);
      }

      &.selected {
        background: var(--primary-100);
        border-color: var(--primary-400);
        color: var(--primary-700);
      }
    }
  }
}

.objective-input {
  :deep(.p-textarea) {
    width: 100%;
    font-size: 0.95rem;
    border-radius: 8px;
    border-color: var(--surface-300);

    &:focus {
      border-color: var(--primary-400);
      box-shadow: 0 0 0 3px var(--primary-100);
    }
  }

  .char-count {
    text-align: right;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    margin-top: 0.25rem;
  }
}

.document-context {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border: 1px solid var(--surface-200);
  font-size: 0.875rem;
  color: var(--text-color-secondary);

  i {
    color: var(--primary-500);
  }

  strong {
    color: var(--text-color);
  }
}
</style>
