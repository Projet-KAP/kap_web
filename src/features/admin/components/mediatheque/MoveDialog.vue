<template>
  <Dialog
    :visible="modelValue"
    @update:visible="$emit('update:modelValue', $event)"
    :header="'Deplacer : ' + (target?.name || '')"
    modal
    :style="{ width: '30rem' }"
  >
    <div class="move-form">
      <p class="move-hint">Sélectionnez le dossier de destination :</p>

      <!-- Racine -->
      <div
        class="move-item"
        :class="{ selected: selectedFolder === null }"
        @click="selectedFolder = null"
      >
        <i class="pi pi-home"></i>
        <span>Racine (Tous les fichiers)</span>
      </div>

      <!-- Arbre de dossiers -->
      <div v-if="store.folderTree.length" class="move-tree">
        <MoveTreeNode
          v-for="folder in store.folderTree"
          :key="folder.id"
          :folder="folder"
          :selected-id="selectedFolder"
          :disabled-id="disabledId"
          :depth="0"
          @select="(id) => selectedFolder = id"
        />
      </div>

      <div v-else class="no-folders">
        <p>Aucun dossier disponible</p>
      </div>
    </div>

    <template #footer>
      <Button label="Annuler" text @click="$emit('update:modelValue', false)" />
      <Button label="Deplacer" @click="doMove" :loading="moving" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useMediathequeStore } from '../../stores/mediathequeStore'
import MoveTreeNode from './MoveTreeNode.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  target: { type: Object, default: null },
  targetType: { type: String, default: 'file' } // 'file' ou 'folder'
})

const emit = defineEmits(['update:modelValue', 'moved'])

const store = useMediathequeStore()
const toast = useToast()
const selectedFolder = ref(null)
const moving = ref(false)

// Ne pas permettre de deplacer un dossier dans lui-meme
const disabledId = computed(() => {
  if (props.targetType === 'folder' && props.target) {
    return props.target.id
  }
  return null
})

watch(() => props.modelValue, (val) => {
  if (val) {
    selectedFolder.value = null
    store.fetchFolderTree()
  }
})

const doMove = async () => {
  moving.value = true
  try {
    if (props.targetType === 'file') {
      await store.moveFile(props.target.id, selectedFolder.value)
    } else {
      await store.moveFolder(props.target.id, selectedFolder.value)
    }
    toast.add({ severity: 'success', summary: 'Déplacé avec succès', life: 2000 })
    emit('moved')
    emit('update:modelValue', false)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err.response?.data?.error || 'Impossible de deplacer',
      life: 3000
    })
  } finally {
    moving.value = false
  }
}
</script>

<style scoped>
.move-form {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.move-hint {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 0.5rem;
}

.move-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #475569;
  transition: background 0.15s;
}

.move-item:hover {
  background: #f1f5f9;
}

.move-item.selected {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
}

.move-tree {
  max-height: 300px;
  overflow-y: auto;
}

.no-folders {
  text-align: center;
  padding: 1rem;
}

.no-folders p {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}
</style>
