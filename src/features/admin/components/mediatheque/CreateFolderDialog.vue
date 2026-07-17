<template>
  <Dialog
    :visible="modelValue"
    @update:visible="$emit('update:modelValue', $event)"
    header="Nouveau dossier"
    modal
    :style="{ width: '25rem' }"
  >
    <div class="folder-form">
      <div class="form-group">
        <label for="folderName">Nom du dossier *</label>
        <InputText
          id="folderName"
          v-model="folderName"
          placeholder="Ex: Documents techniques"
          class="w-full"
          @keyup.enter="create"
          autofocus
        />
      </div>
    </div>
    <template #footer>
      <Button label="Annuler" text @click="close" />
      <Button label="Créer" @click="create" :loading="creating" :disabled="!folderName.trim()" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useMediathequeStore } from '../../stores/mediathequeStore'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const store = useMediathequeStore()
const toast = useToast()
const folderName = ref('')
const creating = ref(false)

watch(() => props.modelValue, (val) => {
  if (val) folderName.value = ''
})

const create = async () => {
  if (!folderName.value.trim()) return
  creating.value = true
  try {
    await store.createFolder({
      name: folderName.value.trim(),
      parent: store.currentFolder || null
    })
    toast.add({ severity: 'success', summary: 'Dossier créé', life: 2000 })
    close()
    // Rafraichir le contenu
    await store.navigateToFolder(store.currentFolder)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err.response?.data?.name?.[0] || 'Impossible de créer le dossier',
      life: 3000
    })
  } finally {
    creating.value = false
  }
}

const close = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.folder-form {
  padding: 0.5rem 0;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.5rem;
}
</style>
