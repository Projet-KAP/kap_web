<template>
  <main class="populate-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">Outil d’administration caché</span>
        <h1>Peuplement des données</h1>
        <p>
          Importez un CSV relationnel pour remplir les modules du client avec des données
          cohérentes. Une simulation complète est obligatoire avant l’import réel.
        </p>
      </div>
      <a class="template-link" href="/templates/tefix_population.csv" download>
        <i class="pi pi-download" aria-hidden="true"></i>
        CSV Tefix prêt à l’emploi
      </a>
    </header>

    <Message severity="warn" :closable="false">
      Créez d’abord le client <strong>Tefix</strong>. Le nom du client dans le manifeste CSV
      doit correspondre exactement au client ciblé. L’import est idempotent : rejouer le même
      fichier met à jour les données sans les dupliquer.
    </Message>

    <section class="panel">
      <div v-if="authStore.isSuperAdmin" class="field">
        <label for="population-client">Client cible</label>
        <Select
          id="population-client"
          v-model="selectedClientId"
          :options="clients"
          option-label="name"
          option-value="id"
          placeholder="Choisir le client Tefix"
          :loading="clientsLoading"
          filter
          class="control"
          @change="resetValidation"
        />
      </div>
      <div v-else class="client-context">
        <span>Client cible</span>
        <strong>{{ currentClientName }}</strong>
      </div>

      <div class="field">
        <label for="population-file">Fichier CSV</label>
        <label
          for="population-file"
          class="drop-zone"
          :class="{ selected: selectedFile }"
          @dragover.prevent
          @drop.prevent="onDrop"
        >
          <i :class="selectedFile ? 'pi pi-file-check' : 'pi pi-cloud-upload'" aria-hidden="true"></i>
          <span v-if="selectedFile">
            <strong>{{ selectedFile.name }}</strong>
            <small>{{ formatSize(selectedFile.size) }}</small>
          </span>
          <span v-else>
            <strong>Déposez le CSV ici ou cliquez pour le choisir</strong>
            <small>UTF-8, 5 Mo maximum</small>
          </span>
        </label>
        <input
          id="population-file"
          ref="fileInput"
          class="sr-only"
          type="file"
          accept=".csv,text/csv"
          @change="onFileChange"
        />
      </div>

      <div class="actions">
        <Button
          label="Simuler l’import"
          icon="pi pi-search"
          severity="secondary"
          :loading="loading && mode === 'preview'"
          :disabled="!canSubmit || loading"
          @click="submit(true)"
        />
        <Button
          label="Importer les données"
          icon="pi pi-database"
          :loading="loading && mode === 'import'"
          :disabled="!previewValid || loading"
          @click="submit(false)"
        />
      </div>
    </section>

    <Message v-if="errorMessage" severity="error" :closable="false">
      {{ errorMessage }}
    </Message>

    <section v-if="result" class="result-panel">
      <div class="result-header">
        <div>
          <span class="eyebrow">{{ result.dry_run ? 'Simulation validée' : 'Import terminé' }}</span>
          <h2>{{ result.total }} objets traités</h2>
        </div>
        <Tag
          :value="result.dry_run ? 'Aucune écriture effectuée' : 'Données enregistrées'"
          :severity="result.dry_run ? 'info' : 'success'"
        />
      </div>

      <div class="summary-grid">
        <article v-for="item in summaryRows" :key="item.entity" class="summary-card">
          <span>{{ entityLabel(item.entity) }}</span>
          <strong>{{ item.total }}</strong>
          <small>{{ item.created }} créé(s) · {{ item.updated }} mis à jour</small>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { axiosInstance } from '@/main'
import { useAuthStore } from '@/features/auth/stores/authStore'

const authStore = useAuthStore()
const clients = ref([])
const clientsLoading = ref(false)
const selectedClientId = ref(null)
const selectedFile = ref(null)
const fileInput = ref(null)
const loading = ref(false)
const mode = ref(null)
const result = ref(null)
const errorMessage = ref('')
const previewSignature = ref(null)

const currentUser = computed(() => authStore.getCurrentUser || {})
const currentClientName = computed(() => {
  const client = currentUser.value.client
  return client?.name || currentUser.value.client_name || 'Votre client'
})
const canSubmit = computed(() => {
  return Boolean(selectedFile.value && (!authStore.isSuperAdmin || selectedClientId.value))
})
const signature = computed(() => {
  if (!selectedFile.value) return null
  return [selectedClientId.value || 'own', selectedFile.value.name, selectedFile.value.size, selectedFile.value.lastModified].join(':')
})
const previewValid = computed(() => canSubmit.value && previewSignature.value === signature.value)
const summaryRows = computed(() => {
  if (!result.value) return []
  return Object.entries(result.value.by_entity || {}).map(([entity, total]) => ({
    entity,
    total,
    created: result.value.created?.[entity] || 0,
    updated: result.value.updated?.[entity] || 0,
  }))
})

const entityLabels = {
  manifest: 'Manifeste', module: 'Modules', site: 'Sites', workplace: 'Postes de charge',
  user: 'Collaborateurs', project: 'Projets', team: 'Équipes', team_member: 'Membres',
  team_kpi: 'Indicateurs d’équipe', team_evaluation: 'Évaluations', team_task: 'Tâches',
  machine: 'Engins', product: 'Produits', work_order: 'Ordres de fabrication',
  operation: 'Opérations MES', mes_task: 'Tâches MES', session: 'Sessions MES',
  performance: 'Performances', warehouse: 'Magasins', spare_part: 'Matériaux et stock',
  stock_movement: 'Mouvements de stock', stock_alert: 'Alertes de stock',
  collect_template: 'Modèles de collecte', collect: 'Collectes', pointage: 'Pointages',
}

function entityLabel(entity) {
  return entityLabels[entity] || entity
}

function resetValidation() {
  previewSignature.value = null
  result.value = null
  errorMessage.value = ''
}

function acceptFile(file) {
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.csv')) {
    errorMessage.value = 'Veuillez choisir un fichier au format CSV.'
    return
  }
  selectedFile.value = file
  resetValidation()
}

function onFileChange(event) {
  acceptFile(event.target.files?.[0])
}

function onDrop(event) {
  acceptFile(event.dataTransfer.files?.[0])
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} o`
  return `${(bytes / 1024).toFixed(1)} Ko`
}

async function loadClients() {
  if (!authStore.isSuperAdmin) return
  clientsLoading.value = true
  try {
    const { data } = await axiosInstance.get('accounts/clients/?ordering=name')
    clients.value = Array.isArray(data) ? data : (data.results || [])
    const tefix = clients.value.find((client) => client.name?.toLowerCase() === 'tefix')
    if (tefix) selectedClientId.value = tefix.id
  } catch (error) {
    errorMessage.value = 'Impossible de charger la liste des clients.'
  } finally {
    clientsLoading.value = false
  }
}

async function submit(dryRun) {
  if (!canSubmit.value) return
  loading.value = true
  mode.value = dryRun ? 'preview' : 'import'
  errorMessage.value = ''
  try {
    const form = new FormData()
    form.append('file', selectedFile.value)
    form.append('dry_run', String(dryRun))
    if (authStore.isSuperAdmin) form.append('client_id', selectedClientId.value)
    const { data } = await axiosInstance.post('accounts/populate/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    result.value = { ...data, dry_run: dryRun }
    if (dryRun) previewSignature.value = signature.value
    else previewSignature.value = null
  } catch (error) {
    result.value = null
    errorMessage.value = error.response?.data?.detail || error.response?.data?.error || 'L’import a échoué. Vérifiez le fichier et réessayez.'
    if (dryRun) previewSignature.value = null
  } finally {
    loading.value = false
    mode.value = null
  }
}

onMounted(loadClients)
</script>

<style scoped>
.populate-page { max-width: 1180px; margin: 0 auto; padding: 2rem; color: var(--text-color); }
.page-header, .result-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; margin-bottom: 1.5rem; }
.page-header h1, .result-header h2 { margin: .25rem 0 .5rem; font-weight: 800; }
.page-header p { max-width: 720px; margin: 0; color: var(--text-color-secondary); line-height: 1.6; }
.eyebrow { color: var(--primary-color); font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.template-link { display: inline-flex; align-items: center; gap: .6rem; flex: 0 0 auto; padding: .8rem 1rem; color: var(--primary-color); border: 1px solid var(--primary-color); border-radius: 10px; text-decoration: none; font-weight: 700; }
.panel, .result-panel { margin-top: 1.25rem; padding: 1.5rem; border: 1px solid var(--surface-border); border-radius: 14px; background: var(--surface-card); }
.field { display: grid; gap: .6rem; margin-bottom: 1.25rem; }
.field > label:first-child, .client-context span { font-weight: 700; }
.control { width: min(100%, 520px); }
.client-context { display: flex; justify-content: space-between; max-width: 520px; margin-bottom: 1.25rem; padding: .9rem 1rem; border-radius: 10px; background: var(--surface-ground); }
.drop-zone { display: flex; align-items: center; justify-content: center; gap: 1rem; min-height: 155px; padding: 1.5rem; border: 2px dashed var(--surface-border); border-radius: 12px; text-align: center; cursor: pointer; transition: .2s ease; }
.drop-zone:hover, .drop-zone.selected { border-color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 5%, transparent); }
.drop-zone i { color: var(--primary-color); font-size: 2rem; }
.drop-zone span { display: grid; gap: .35rem; }
.drop-zone small { color: var(--text-color-secondary); }
.actions { display: flex; justify-content: flex-end; gap: .75rem; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(185px, 1fr)); gap: .75rem; }
.summary-card { display: grid; gap: .25rem; padding: 1rem; border: 1px solid var(--surface-border); border-radius: 10px; }
.summary-card span { color: var(--text-color-secondary); font-size: .85rem; }
.summary-card strong { font-size: 1.6rem; }
.summary-card small { color: var(--text-color-secondary); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (max-width: 720px) { .populate-page { padding: 1rem; } .page-header, .result-header { flex-direction: column; } .actions { flex-direction: column; } .actions :deep(.p-button) { width: 100%; } }
</style>
