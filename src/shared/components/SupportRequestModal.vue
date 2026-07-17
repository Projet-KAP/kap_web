<template>
  <Dialog
    v-model:visible="visible"
    modal
    class="support-dialog"
    :style="{ width: 'min(92vw, 46rem)' }"
    @hide="handleClose"
  >
    <template #header>
      <div class="support-dialog-header">
        <div class="support-dialog-badge">
          <img src="/support.png" alt="Support" class="support-dialog-badge-icon">
        </div>
        <div>
          <h2>Contacter le support</h2>
          <p>Signalez un bug, une anomalie ou partagez une suggestion avec l'équipe KAP.</p>
        </div>
      </div>
    </template>

    <div class="support-dialog-body">
      <div class="support-identity-card">
        <div class="support-identity-heading">Demandeur connecté</div>
        <div class="support-identity-grid">
          <div class="field-group field-group--wide">
            <label for="supportRequester">Utilisateur</label>
            <InputText id="supportRequester" :model-value="requesterLabel" disabled />
          </div>
          <div class="field-group field-group--wide">
            <label for="supportRequesterEmail">Email</label>
            <InputText id="supportRequesterEmail" :model-value="requesterEmail" disabled />
          </div>
        </div>
      </div>

      <div class="support-form-grid">
        <div class="field-group field-group--wide">
          <label for="supportCategory">Objet</label>
          <Select
            id="supportCategory"
            v-model="form.category"
            :options="categoryOptions"
            option-label="label"
            option-value="value"
            placeholder="Sélectionner un type de demande"
            class="w-full"
          />
        </div>

        <div v-if="requiresDiscoveryDate" class="field-group field-group--wide">
          <label for="supportDiscoveryDate">Date de découverte</label>
          <DatePicker
            id="supportDiscoveryDate"
            v-model="form.discoveryDate"
            date-format="dd/mm/yy"
            show-icon
            fluid
            :max-date="new Date()"
            placeholder="Quand l'anomalie a-t-elle été constatée ?"
          />
        </div>

        <div class="field-group field-group--wide">
          <label for="supportDescription">Description</label>
          <Textarea
            id="supportDescription"
            v-model="form.description"
            rows="6"
            auto-resize
            placeholder="Décrivez précisément le contexte, ce que vous attendiez, ce que vous observez et l'impact métier éventuel."
          />
        </div>
      </div>

      <div class="support-upload-panel">
        <div class="support-upload-copy">
          <div class="support-upload-title">Captures optionnelles</div>
          <p>Ajoutez jusqu'à 5 captures ou PDF pour illustrer le problème.</p>
        </div>

        <div class="support-upload-actions">
          <input
            ref="fileInput"
            type="file"
            class="support-file-input"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            multiple
            @change="onFileSelect"
          >
          <Button
            label="Ajouter des fichiers"
            icon="pi pi-paperclip"
            outlined
            @click="openFilePicker"
          />
          <span class="support-upload-limit">PNG, JPG, WEBP ou PDF • 10 Mo max / fichier</span>
        </div>

        <div v-if="selectedFiles.length" class="support-file-list">
          <div v-for="(file, index) in selectedFiles" :key="`${file.name}-${index}`" class="support-file-item">
            <div class="support-file-meta">
              <i class="pi" :class="file.type === 'application/pdf' ? 'pi-file-pdf' : 'pi-image'"></i>
              <div>
                <div class="support-file-name">{{ file.name }}</div>
                <div class="support-file-size">{{ formatFileSize(file.size) }}</div>
              </div>
            </div>
            <Button icon="pi pi-times" text rounded severity="danger" @click="removeFile(index)" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="support-dialog-footer">
        <Button label="Annuler" text @click="handleClose" />
        <Button label="Envoyer" icon="pi pi-send" :loading="submitting" @click="submitSupportRequest" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { axiosInstance } from '@/main'
import { useAuthStore } from '@/features/auth/stores/authStore'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const authStore = useAuthStore()
const toast = useToast()

const fileInput = ref(null)
const submitting = ref(false)
const selectedFiles = ref([])
const form = ref(getEmptyForm())

const categoryOptions = [
  { label: 'Signalement problème', value: 'PROBLEM' },
  { label: 'Anomalie / Bug', value: 'BUG' },
  { label: 'Suggestion', value: 'SUGGESTION' },
  { label: 'Question / Assistance', value: 'QUESTION' },
  { label: 'Autre', value: 'AUTRE' },
]

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const currentUser = computed(() => authStore.getCurrentUser)
const requesterLabel = computed(() => {
  const user = currentUser.value
  return user?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Utilisateur connecté'
})
const requesterEmail = computed(() => currentUser.value?.email_address || currentUser.value?.email || '')
const requiresDiscoveryDate = computed(() => form.value.category === 'BUG')

function getEmptyForm() {
  return {
    category: null,
    description: '',
    discoveryDate: null,
  }
}

function openFilePicker() {
  fileInput.value?.click()
}

function onFileSelect(event) {
  const incomingFiles = Array.from(event.target.files || [])
  const nextFiles = [...selectedFiles.value]

  for (const file of incomingFiles) {
    const extension = file.name.toLowerCase()
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'].some((suffix) => extension.endsWith(suffix))
    if (!allowed) {
      toast.add({ severity: 'warn', summary: 'Format non pris en charge', detail: 'Utilisez uniquement PNG, JPG, WEBP ou PDF.', life: 3500 })
      continue
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.add({ severity: 'warn', summary: 'Fichier trop volumineux', detail: `${file.name} dépasse 10 Mo.`, life: 3500 })
      continue
    }
    if (nextFiles.length >= 5) {
      toast.add({ severity: 'warn', summary: 'Limite atteinte', detail: 'Vous pouvez joindre au maximum 5 fichiers.', life: 3500 })
      break
    }
    nextFiles.push(file)
  }

  selectedFiles.value = nextFiles
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function removeFile(index) {
  selectedFiles.value.splice(index, 1)
}

function formatFileSize(size) {
  if (!size) return '0 Ko'
  if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} Ko`
  return `${Math.round(size / (1024 * 102.4)) / 10} Mo`
}

function formatDate(dateValue) {
  if (!dateValue) return null
  const date = new Date(dateValue)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function resetState() {
  form.value = getEmptyForm()
  selectedFiles.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function handleClose() {
  if (submitting.value) return
  resetState()
  visible.value = false
}

async function submitSupportRequest() {
  if (!form.value.category) {
    toast.add({ severity: 'warn', summary: 'Objet requis', detail: 'Sélectionnez le type de demande.', life: 3000 })
    return
  }

  if (!form.value.description.trim()) {
    toast.add({ severity: 'warn', summary: 'Description requise', detail: 'Décrivez votre demande pour que le support puisse la traiter.', life: 3000 })
    return
  }

  if (requiresDiscoveryDate.value && !form.value.discoveryDate) {
    toast.add({ severity: 'warn', summary: 'Date requise', detail: 'Ajoutez la date de découverte pour une anomalie ou un bug.', life: 3000 })
    return
  }

  submitting.value = true
  try {
    const selectedCategory = categoryOptions.find((item) => item.value === form.value.category)
    const payload = new FormData()
    payload.append('category', form.value.category)
    payload.append('subject', selectedCategory?.label || form.value.category)
    payload.append('description', form.value.description.trim())

    const discoveryDate = formatDate(form.value.discoveryDate)
    if (discoveryDate) {
      payload.append('discovery_date', discoveryDate)
    }

    selectedFiles.value.forEach((file) => {
      payload.append('attachments', file)
    })

    await axiosInstance.post('support-requests/', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    toast.add({
      severity: 'success',
      summary: 'Demande envoyée',
      detail: 'Votre demande a bien été reçue. Vous serez contacté pour prise en charge.',
      life: 5000,
    })
    emit('submitted')
    submitting.value = false
    handleClose()
  } catch (error) {
    const detail = error?.response?.data?.detail || error?.response?.data?.description?.[0] || 'Impossible d\'envoyer la demande pour le moment.'
    toast.add({ severity: 'error', summary: 'Envoi impossible', detail, life: 4200 })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.support-dialog-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.support-dialog-badge {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 1rem;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #0b2b3c 0%, #114b66 100%);
  box-shadow: 0 12px 30px rgba(17, 75, 102, 0.25);
  flex-shrink: 0;
}

.support-dialog-badge-icon {
  width: 1.7rem;
  height: 1.7rem;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.support-dialog-header h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0b2b3c;
}

.support-dialog-header p {
  margin: 0.25rem 0 0;
  color: #64748b;
  line-height: 1.45;
}

.support-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.support-identity-card,
.support-upload-panel {
  border: 1px solid #dbe7ee;
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at top left, rgba(122, 201, 67, 0.08), transparent 34%),
    #f8fbfd;
  padding: 1rem;
}

.support-identity-heading,
.support-upload-title {
  font-weight: 700;
  color: #0b2b3c;
  margin-bottom: 0.75rem;
}

.support-identity-grid,
.support-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.field-group--wide {
  grid-column: 1 / -1;
}

.field-group label {
  font-size: 0.84rem;
  font-weight: 700;
  color: #334155;
}

.support-upload-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.support-upload-copy p,
.support-upload-limit {
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
}

.support-upload-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.support-file-input {
  display: none;
}

.support-file-list {
  display: grid;
  gap: 0.75rem;
}

.support-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.85rem;
  border-radius: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
}

.support-file-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.support-file-meta i {
  color: #0b2b3c;
  font-size: 1.1rem;
}

.support-file-name {
  font-weight: 600;
  color: #1e293b;
  word-break: break-word;
}

.support-file-size {
  font-size: 0.82rem;
  color: #64748b;
}

.support-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

:deep(.support-dialog .p-dialog-header) {
  padding-bottom: 0.5rem;
}

:deep(.support-dialog .p-inputtext),
:deep(.support-dialog .p-textarea),
:deep(.support-dialog .p-select),
:deep(.support-dialog .p-datepicker-input) {
  width: 100%;
}

@media (max-width: 768px) {
  .support-identity-grid,
  .support-form-grid {
    grid-template-columns: 1fr;
  }

  .support-dialog-header {
    align-items: flex-start;
  }
}
</style>