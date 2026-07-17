<template>
  <div class="wizard-step-analysis">
    <!-- Loading state -->
    <div v-if="wizardStore.analysisLoading" class="loading-state">
      <ProgressSpinner strokeWidth="3" />
      <h3>Analyse en cours...</h3>
      <p>L'IA analyse vos données et recherche les indicateurs pertinents</p>
    </div>

    <!-- Results -->
    <template v-else-if="wizardStore.analysisResult">
      <!-- AI Response -->
      <div class="ai-response">
        <div class="response-header">
          <i class="pi pi-sparkles"></i>
          <span>Recommandations de l'IA</span>
        </div>
        <div class="response-content">
          {{ wizardStore.analysisResult }}
        </div>
      </div>

      <!-- Tags Section -->
      <div v-if="realTags.length > 0" class="selection-section">
        <div class="section-header">
          <h4>Données disponibles (avec mesures réelles)</h4>
          <div class="section-actions">
            <Button
              label="Tout sélectionner"
              icon="pi pi-check-square"
              text
              size="small"
              @click="wizardStore.selectAllTags()"
            />
            <Button
              label="Effacer"
              icon="pi pi-times"
              text
              size="small"
              severity="secondary"
              @click="wizardStore.clearTagSelection()"
            />
          </div>
        </div>

        <div class="items-grid">
          <div
            v-for="tag in realTags"
            :key="tag.id"
            class="selection-item"
            :class="{
              selected: wizardStore.selectedTagIds.includes(tag.id),
              'high-relevance': tag.relevance === 'high'
            }"
            @click="wizardStore.toggleTagSelection(tag.id)"
          >
            <Checkbox
              :modelValue="wizardStore.selectedTagIds.includes(tag.id)"
              :binary="true"
              @click.stop
              @update:modelValue="wizardStore.toggleTagSelection(tag.id)"
            />
            <div class="item-content">
              <span class="item-name">{{ tag.display_name || tag.tag_name }}</span>
              <span v-if="tag.last_value" class="item-value">{{ tag.last_value }} {{ tag.unit }}</span>
              <div class="item-meta">
                <Tag :value="tag.source || tag.module" :severity="tag.source === 'SENSOR' ? 'success' : tag.source === 'AI' ? 'warning' : 'info'" />
                <Tag v-if="tag.unit" :value="tag.unit" severity="secondary" />
                <Tag v-if="tag.tag_type === 'CHART'" :value="tag.data_type" severity="contrast" />
              </div>
            </div>
            <Badge
              v-if="tag.relevance === 'high'"
              value="Recommande"
              severity="success"
              class="relevance-badge"
            />
          </div>
        </div>
      </div>

      <!-- KPIs Section -->
      <div v-if="computedKPIs.length > 0" class="selection-section">
        <div class="section-header">
          <h4>KPIs calcules depuis le rapport</h4>
          <div class="section-actions">
            <Button
              label="Tout sélectionner"
              icon="pi pi-check-square"
              text
              size="small"
              @click="wizardStore.selectAllKPIs()"
            />
            <Button
              label="Effacer"
              icon="pi pi-times"
              text
              size="small"
              severity="secondary"
              @click="wizardStore.clearKPISelection()"
            />
          </div>
        </div>

        <div class="items-grid">
          <div
            v-for="kpi in computedKPIs"
            :key="kpi.id"
            class="selection-item"
            :class="{
              selected: wizardStore.selectedKPIIds.includes(kpi.id),
              'high-relevance': kpi.relevance === 'high'
            }"
            @click="wizardStore.toggleKPISelection(kpi.id)"
          >
            <Checkbox
              :modelValue="wizardStore.selectedKPIIds.includes(kpi.id)"
              :binary="true"
              @click.stop
              @update:modelValue="wizardStore.toggleKPISelection(kpi.id)"
            />
            <div class="item-content">
              <div class="item-name-row">
                <span class="item-name">{{ kpi.name }}</span>
                <span v-if="kpi.computed_value != null" class="item-computed-value">{{ kpi.computed_value }} {{ kpi.unit }}</span>
              </div>
              <span v-if="kpi.formula" class="item-formula">
                {{ kpi.formula }}
              </span>
              <div class="item-meta">
                <Tag value="Calculé depuis le rapport" severity="success" />
                <Tag v-if="kpi.unit" :value="kpi.unit" severity="secondary" />
              </div>
            </div>
            <Badge
              v-if="kpi.relevance === 'high'"
              value="Recommande"
              severity="success"
              class="relevance-badge"
            />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!wizardStore.suggestedTags.length && !wizardStore.suggestedKPIs.length" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>Aucun indicateur trouve. Essayez de reformuler votre objectif.</p>
        <Button
          label="Retour a l'objectif"
          icon="pi pi-arrow-left"
          @click="wizardStore.previousStep()"
        />
      </div>

      <!-- Selection summary -->
      <div v-if="wizardStore.totalSelectedItems > 0" class="selection-summary">
        <i class="pi pi-check-circle"></i>
        <span>{{ wizardStore.totalSelectedItems }} élément(s) sélectionné(s)</span>
      </div>

      <!-- Feedback / Refine -->
      <div class="refine-section">
        <div class="refine-header">
          <i class="pi pi-comments"></i>
          <span>Affiner les suggestions</span>
        </div>
        <div class="refine-input-row">
          <InputText
            v-model="feedbackMessage"
            placeholder="Ex. : ajoute un KPI pour le taux de conformité, enlève les alertes..."
            class="refine-input"
            @keyup.enter="refineSuggestions"
          />
          <Button
            icon="pi pi-send"
            @click="refineSuggestions"
            :loading="wizardStore.analysisLoading"
            :disabled="!feedbackMessage.trim()"
          />
        </div>
      </div>
    </template>

    <!-- Initial state (before analysis) -->
    <div v-else class="initial-state">
      <i class="pi pi-search"></i>
      <p>Cliquez sur "Analyser" pour lancer l'analyse IA</p>
      <Button
        label="Analyser"
        icon="pi pi-sparkles"
        @click="runAnalysis"
        :loading="wizardStore.analysisLoading"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import { useDashboardWizardStore } from '@/features/ai/stores/dashboardWizardStore'
import { useToast } from 'primevue/usetoast'

const wizardStore = useDashboardWizardStore()
const toast = useToast()
const feedbackMessage = ref('')

// Tags avec données réelles (exclure suggestions AI)
const realTags = computed(() =>
  wizardStore.suggestedTags.filter(t => t.source !== 'AI' && t.tag_type !== 'CHART')
)

// KPIs calculés avec valeur réelle (exclure ceux sans données)
const computedKPIs = computed(() =>
  wizardStore.suggestedKPIs.filter(k => k.has_data && k.computed_value != null)
)

async function runAnalysis() {
  const result = await wizardStore.runAnalysis()
  if (!result.success) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: result.error || 'Erreur lors de l\'analyse',
      life: 5000
    })
  }
}

async function refineSuggestions() {
  if (!feedbackMessage.value.trim()) return

  // Append feedback to objective and re-run
  const original = wizardStore.userObjective
  wizardStore.userObjective = `${original}\n\nPrecisions: ${feedbackMessage.value}`

  const result = await wizardStore.runAnalysis()
  feedbackMessage.value = ''

  // Restore original objective (keep it clean)
  wizardStore.userObjective = original

  if (!result.success) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: result.error || 'Erreur lors de l\'affinage',
      life: 5000
    })
  }
}

// Auto-run analysis on mount if not already done
onMounted(() => {
  if (!wizardStore.analysisResult && !wizardStore.analysisLoading) {
    runAnalysis()
  }
})
</script>

<style lang="scss" scoped>
.wizard-step-analysis {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
  min-height: 300px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;

  h3 {
    margin: 1rem 0 0.5rem;
    font-weight: 600;
    color: var(--text-color);
  }

  p {
    margin: 0;
    color: var(--text-color-secondary);
    font-size: 0.9rem;
  }
}

.ai-response {
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-50) 100%);
  border: 1px solid var(--primary-200);
  border-radius: 12px;
  overflow: hidden;

  .response-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--primary-100);
    font-weight: 500;
    color: var(--primary-700);

    i {
      font-size: 1rem;
    }
  }

  .response-content {
    padding: 1rem;
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--text-color);
    white-space: pre-wrap;
  }
}

.selection-section {
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;

    h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .section-actions {
      display: flex;
      gap: 0.25rem;
    }
  }
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.selection-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--surface-50);
  border: 1px solid var(--surface-200);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--surface-100);
    border-color: var(--surface-300);
  }

  &.selected {
    background: var(--primary-50);
    border-color: var(--primary-300);
  }

  &.high-relevance {
    border-left: 3px solid var(--green-500);
  }

  .item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .item-name {
      font-weight: 500;
      color: var(--text-color);
    }

    .item-description {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .item-name-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .item-computed-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #7AC943;
      white-space: nowrap;
    }

    .item-formula {
      font-size: 0.75rem;
      color: var(--primary-600);
      font-family: monospace;
      background: var(--surface-100);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .item-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--primary-700);
    }

    .item-meta {
      display: flex;
      gap: 0.25rem;
      margin-top: 0.25rem;
    }
  }

  .relevance-badge {
    flex-shrink: 0;
  }
}

.selection-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--green-50);
  border: 1px solid var(--green-200);
  border-radius: 8px;
  color: var(--green-700);
  font-weight: 500;

  i {
    color: var(--green-500);
  }
}

.suggestion-section {
  opacity: 0.7;
  border: 1px dashed var(--surface-300);
  border-radius: 10px;
  padding: 1rem;

  h4 {
    color: var(--text-color-secondary);
    font-style: italic;
  }
}

.refine-section {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 10px;
  border: 1px solid var(--surface-200);

  .refine-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    margin-bottom: 0.75rem;

    i { color: var(--primary-500); }
  }

  .refine-input-row {
    display: flex;
    gap: 0.5rem;

    .refine-input {
      flex: 1;
      font-size: 0.875rem;
    }
  }
}

.empty-state,
.initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-color-secondary);

  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  p {
    margin: 0 0 1rem;
  }
}
</style>
