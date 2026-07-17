<template>
  <div class="move-node">
    <div
      class="move-item"
      :class="{ selected: selectedId === folder.id, disabled: disabledId === folder.id }"
      :style="{ paddingLeft: `${depth * 1 + 0.75}rem` }"
      @click="disabledId !== folder.id && $emit('select', folder.id)"
    >
      <i :class="expanded ? 'pi pi-folder-open' : 'pi pi-folder'" class="folder-icon"></i>
      <span class="folder-name">{{ folder.name }}</span>
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
    <div v-if="expanded && folder.children && folder.children.length">
      <MoveTreeNode
        v-for="child in folder.children"
        :key="child.id"
        :folder="child"
        :selected-id="selectedId"
        :disabled-id="disabledId"
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
  disabledId: { type: [Number, String], default: null },
  depth: { type: Number, default: 0 }
})

defineEmits(['select'])

const expanded = ref(props.depth < 2)
</script>

<style scoped>
.move-item {
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

.move-item:hover:not(.disabled) {
  background: #f1f5f9;
}

.move-item.selected {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
}

.move-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.folder-icon {
  font-size: 0.9rem;
  color: #f59e0b;
}

.folder-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expand-btn {
  width: 1.25rem !important;
  height: 1.25rem !important;
  padding: 0 !important;
}
</style>
