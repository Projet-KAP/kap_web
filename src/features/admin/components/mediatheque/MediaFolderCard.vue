<template>
  <div class="folder-card" @dblclick="$emit('open', folder.id)">
    <div class="folder-icon-area">
      <i class="pi pi-folder folder-icon"></i>
    </div>
    <div class="folder-info">
      <h4 class="folder-name">{{ folder.name }}</h4>
      <span class="folder-meta">
        {{ folder.files_count || 0 }} fichier{{ (folder.files_count || 0) !== 1 ? 's' : '' }}
        <template v-if="folder.children_count"> &middot; {{ folder.children_count }} dossier{{ folder.children_count !== 1 ? 's' : '' }}</template>
      </span>
    </div>
    <div class="folder-actions">
      <Button
        icon="pi pi-arrows-alt"
        text
        rounded
        size="small"
        @click.stop="$emit('move', folder)"
        v-tooltip.top="'Deplacer'"
      />
      <Button
        icon="pi pi-share-alt"
        text
        rounded
        size="small"
        @click.stop="$emit('share', folder)"
        v-tooltip.top="'Partager'"
      />
      <Button
        icon="pi pi-pencil"
        text
        rounded
        size="small"
        @click.stop="$emit('rename', folder)"
        v-tooltip.top="'Renommer'"
      />
      <Button
        icon="pi pi-trash"
        text
        rounded
        size="small"
        severity="danger"
        @click.stop="$emit('delete', folder)"
        v-tooltip.top="'Supprimer'"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  folder: { type: Object, required: true }
})

defineEmits(['open', 'move', 'share', 'rename', 'delete'])
</script>

<style scoped>
.folder-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.folder-card:hover {
  border-color: #3b82f6;
  background: #f0f7ff;
  box-shadow: 0 1px 4px rgba(59, 130, 246, 0.1);
}

.folder-icon-area {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef3c7;
  border-radius: 8px;
  flex-shrink: 0;
}

.folder-icon {
  font-size: 1.25rem;
  color: #f59e0b;
}

.folder-info {
  flex: 1;
  min-width: 0;
}

.folder-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-meta {
  font-size: 0.75rem;
  color: #94a3b8;
}

.folder-actions {
  display: flex;
  gap: 0.125rem;
  opacity: 0;
  transition: opacity 0.15s;
}

.folder-card:hover .folder-actions {
  opacity: 1;
}
</style>
