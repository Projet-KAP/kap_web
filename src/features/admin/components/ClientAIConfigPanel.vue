<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '44rem' }"
    class="ai-config-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <i class="pi pi-microchip header-icon"></i>
        <div>
          <h3 class="header-title">Configuration IA</h3>
          <span class="header-subtitle">{{ client?.name }}</span>
        </div>
      </div>
    </template>

    <form class="panel-content" autocomplete="off" @submit.prevent>
      <!-- Token Usage Bar -->
      <TokenUsageBar
        v-if="usage"
        :usage="usage"
        :showDetails="true"
      />

      <div v-else class="no-usage">
        <i class="pi pi-chart-bar"></i>
        <span>Aucune donnee d'utilisation</span>
      </div>

      <!-- Configuration Form -->
      <div class="config-section">
        <h4 class="section-title">Configuration du provider</h4>

        <div class="form-grid">
          <div class="form-group">
            <label>Provider</label>
            <InputText
              modelValue="Anthropic (Claude)"
              disabled
              class="form-input"
              autocomplete="off"
            />
          </div>

          <div class="form-group">
            <label>Modele</label>
            <InputText
              modelValue="claude-opus-4-6-20250205"
              disabled
              class="form-input"
              autocomplete="off"
            />
          </div>

          <div class="form-group full-width">
            <label>Cle API Anthropic</label>
            <div class="api-key-field">
              <InputText
                v-model="form.api_key"
                :type="showApiKey ? 'text' : 'password'"
                :placeholder="config?.api_key_masked || 'sk-ant-api03-...'"
                class="form-input"
                autocomplete="off"
                data-1p-ignore
                data-lpignore="true"
              />
              <Button
                :icon="showApiKey ? 'pi pi-eye-slash' : 'pi pi-eye'"
                text
                size="small"
                @click="showApiKey = !showApiKey"
                class="toggle-key-btn"
              />
            </div>
            <small v-if="config?.has_api_key" class="key-hint">
              Cle configuree. Laisser vide pour conserver l'actuelle.
            </small>
          </div>
        </div>
      </div>

      <!-- Quotas -->
      <div class="config-section">
        <h4 class="section-title">Quotas et limites</h4>

        <div class="form-grid">
          <div class="form-group">
            <label>Quota mensuel (tokens)</label>
            <InputNumber
              v-model="form.monthly_token_limit"
              :min="0"
              :step="100000"
              class="form-input"
              :useGrouping="false"
              autocomplete="off"
            />
            <small class="field-hint">{{ formatTokens(form.monthly_token_limit) }} tokens/mois</small>
          </div>

          <div class="form-group">
            <label>Quota journalier (tokens)</label>
            <InputNumber
              v-model="form.daily_token_limit"
              :min="0"
              :step="10000"
              class="form-input"
              :useGrouping="false"
              autocomplete="off"
            />
            <small class="field-hint">{{ formatTokens(form.daily_token_limit) }} tokens/jour</small>
          </div>

          <div class="form-group">
            <label>Seuil d'alerte (% restant)</label>
            <div class="threshold-input">
              <InputNumber
                v-model="form.alert_threshold_pct"
                :min="5"
                :max="80"
                suffix="%"
                class="form-input"
                autocomplete="off"
              />
            </div>
            <small class="field-hint">Alerte quand il reste {{ form.alert_threshold_pct }}%</small>
          </div>

          <div class="form-group">
            <label>Statut</label>
            <div class="status-toggle">
              <InputSwitch v-model="form.is_active" />
              <span :class="form.is_active ? 'status-active' : 'status-inactive'">
                {{ form.is_active ? 'Actif' : 'Inactif' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced -->
      <div class="config-section collapsible" :class="{ expanded: showAdvanced }">
        <h4 class="section-title clickable" @click="showAdvanced = !showAdvanced">
          Parametres avances
          <i :class="showAdvanced ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="collapse-icon"></i>
        </h4>
        <div v-if="showAdvanced" class="form-grid">
          <div class="form-group">
            <label>Temperature</label>
            <InputNumber
              v-model="form.temperature"
              :min="0"
              :max="2"
              :step="0.1"
              :minFractionDigits="1"
              class="form-input"
              autocomplete="off"
            />
          </div>
          <div class="form-group">
            <label>Max tokens par reponse</label>
            <InputNumber
              v-model="form.max_tokens"
              :min="100"
              :max="16000"
              :step="500"
              class="form-input"
              :useGrouping="false"
              autocomplete="off"
            />
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="dialog-footer">
        <Button label="Annuler" text @click="close" />
        <Button
          label="Enregistrer"
          @click="save"
          :loading="clientStore.aiConfigLoading"
          class="save-btn"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useClientStore } from '../stores/clientStore'
import TokenUsageBar from './TokenUsageBar.vue'

const props = defineProps({
  client: { type: Object, default: null }
})

const visible = defineModel('visible', { type: Boolean, default: false })
const emit = defineEmits(['saved'])

const toast = useToast()
const clientStore = useClientStore()

const showApiKey = ref(false)
const showAdvanced = ref(false)

const config = computed(() => props.client ? clientStore.aiConfigs[props.client.id] : null)
const usage = computed(() => props.client ? clientStore.tokenUsage[props.client.id] : null)

const defaultForm = {
  provider: 'anthropic',
  model_name: 'claude-opus-4-6-20250205',
  api_key: '',
  monthly_token_limit: 3000000,
  daily_token_limit: 100000,
  alert_threshold_pct: 30,
  temperature: 0.7,
  max_tokens: 2000,
  is_active: true
}

const form = ref({ ...defaultForm })

watch(visible, async (val) => {
  if (val && props.client) {
    showApiKey.value = false
    showAdvanced.value = false

    // Load config and usage in parallel
    await Promise.all([
      clientStore.fetchClientAIConfig(props.client.id),
      clientStore.fetchClientTokenUsage(props.client.id)
    ])

    // Populate form from existing config (always anthropic)
    const cfg = clientStore.aiConfigs[props.client.id]
    if (cfg) {
      form.value = {
        provider: 'anthropic',
        model_name: 'claude-opus-4-6-20250205',
        api_key: '',
        monthly_token_limit: cfg.monthly_token_limit || 3000000,
        daily_token_limit: cfg.daily_token_limit || 100000,
        alert_threshold_pct: cfg.alert_threshold_pct || 30,
        temperature: cfg.temperature || 0.7,
        max_tokens: cfg.max_tokens || 2000,
        is_active: cfg.is_active !== false
      }
    } else {
      form.value = { ...defaultForm }
    }
  }
})

const save = async () => {
  try {
    const data = { ...form.value }
    // Don't send empty api_key (means keep existing)
    if (!data.api_key) {
      delete data.api_key
    }
    await clientStore.saveClientAIConfig(props.client.id, data)
    // Refresh usage after save
    await clientStore.fetchClientTokenUsage(props.client.id)
    toast.add({ severity: 'success', summary: 'Enregistré', detail: 'Configuration IA mise à jour', life: 3000 })
    emit('saved')
    close()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder la configuration', life: 3000 })
  }
}

const close = () => {
  visible.value = false
}

const formatTokens = (count) => {
  if (!count) return '0'
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
  if (count >= 1000) return (count / 1000).toFixed(0) + 'k'
  return count.toString()
}
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 1.25rem;
  color: #7AC943;
  background: #f0fdf4;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0B2B3C;
}

.header-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.no-usage {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 0.8125rem;
}

.config-section {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
}

.section-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.section-title.clickable {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
}

.collapsible:not(.expanded) {
  padding-bottom: 0.75rem;
}

.collapse-icon {
  font-size: 0.75rem;
  color: #94a3b8;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0B2B3C;
}

.form-input {
  width: 100%;
}

.field-hint {
  font-size: 0.6875rem;
  color: #94a3b8;
}

.key-hint {
  font-size: 0.6875rem;
  color: #7AC943;
}

.api-key-field {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.api-key-field .form-input {
  flex: 1;
}

.toggle-key-btn {
  color: #64748b;
}

.status-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.25rem;
}

.status-active {
  font-size: 0.8125rem;
  color: #7AC943;
  font-weight: 500;
}

.status-inactive {
  font-size: 0.8125rem;
  color: #94a3b8;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.save-btn {
  background: #7AC943;
  border: none;
  font-weight: 600;
}

.save-btn:hover {
  background: #65a335;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
