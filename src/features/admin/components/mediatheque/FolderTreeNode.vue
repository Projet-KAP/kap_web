<template>
  <div class="tree-node">
    <div
      class="tree-item"
      :class="{ active: selectedId === folder.id }"
      :style="{ paddingLeft: `${depth * 1 + 0.75}rem` }"
      @click="$emit('select', folder.id)"
    >
      <i :class="expanded ? 'pi pi-folder-open' : 'pi pi-folder'" class="folder-icon"></i>
      <span class="folder-name">{{ folder.name }}</span>
      <span v-if="folder.files_count" class="folder-count">{{ folder.files_count }}</span>
      <Button
        v-if="folder.children && folder.children.length"
        :icon="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
        text
        rounded
        size="small"
        class="expand-btn"
        @click.stop="expanded = !expanded"
      />
    </div>

    <div v-if="expanded && folder.children && folder.children.length" class="tree-children">
      <FolderTreeNode
        v-for="child in folder.children"
        :key="child.id"
        :folder="child"
        :selected-id="selectedId"
        :depth="depth + 1"
        @select="(id) => $emit('select', id)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  folder: { type: Object, required: true },
  selectedId: { type: [Number, String], default: null },
  depth: { type: Number, default: 0 }
})

defineEmits(['select'])

const expanded = ref(props.depth < 1)
</script>

<style scoped>
.tree-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
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

.folder-icon {
  font-size: 0.9rem;
  color: #f59e0b;
}

.tree-item.active .folder-icon {
  color: #3b82f6;
}

.folder-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-count {
  font-size: 0.7rem;
  background: #e2e8f0;
  color: #64748b;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  min-width: 1.2rem;
  text-align: center;
}

.expand-btn {
  width: 1.25rem !important;
  height: 1.25rem !important;
  padding: 0 !important;
}

.expand-btn :deep(.pi) {
  font-size: 0.65rem;
}
</style>
