<template>
  <div class="folder-sidebar">
    <div class="sidebar-header">
      <h3>Dossiers</h3>
      <Button
        icon="pi pi-plus"
        text
        rounded
        size="small"
        @click="$emit('create-folder')"
        v-tooltip.top="'Nouveau dossier'"
      />
    </div>

    <div class="sidebar-tree">
      <!-- Racine -->
      <div
        class="tree-item root-item"
        :class="{ active: !store.currentFolder }"
        @click="$emit('select-folder', null)"
      >
        <i class="pi pi-home"></i>
        <span>Tous les fichiers</span>
      </div>

      <!-- Arbre des dossiers -->
      <div v-if="store.folderTree.length" class="tree-nodes">
        <FolderTreeNode
          v-for="folder in store.folderTree"
          :key="folder.id"
          :folder="folder"
          :selected-id="store.currentFolder"
          :depth="0"
          @select="(id) => $emit('select-folder', id)"
        />
      </div>

      <div v-else-if="!store.loading" class="empty-tree">
        <p>Aucun dossier</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useMediathequeStore } from '../../stores/mediathequeStore'
import FolderTreeNode from './FolderTreeNode.vue'

const store = useMediathequeStore()

defineEmits(['select-folder', 'create-folder'])

onMounted(() => {
  store.fetchFolderTree()
})
</script>

<style scoped>
.folder-sidebar {
  width: 260px;
  min-width: 260px;
  border-right: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.sidebar-header h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sidebar-tree {
  flex: 1;
  padding: 0.5rem;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #475569;
  transition: background 0.15s;
}

.tree-item:hover {
  background: #e2e8f0;
}

.tree-item.active {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
}

.tree-item i {
  font-size: 1rem;
}

.empty-tree {
  padding: 1rem;
  text-align: center;
}

.empty-tree p {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
}
</style>
