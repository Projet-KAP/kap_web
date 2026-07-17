<template>
  <div class="media-grid">
    <!-- Dossiers en premier -->
    <div v-if="folders.length" class="folders-section">
      <h4 class="section-title" v-if="files.length">Dossiers</h4>
      <div class="folders-grid">
        <MediaFolderCard
          v-for="folder in folders"
          :key="'folder-' + folder.id"
          :folder="folder"
          @open="(id) => $emit('open-folder', id)"
          @move="(f) => $emit('move-folder', f)"
          @share="(f) => $emit('share-folder', f)"
          @rename="(f) => $emit('rename-folder', f)"
          @delete="(f) => $emit('delete-folder', f)"
        />
      </div>
    </div>

    <!-- Fichiers -->
    <div v-if="files.length" class="files-section">
      <h4 class="section-title" v-if="folders.length">Fichiers</h4>

      <div v-if="viewMode === 'grid'" class="files-grid">
        <MediaFileCard
          v-for="file in files"
          :key="'file-' + file.id"
          :file="file"
          @preview="(f) => $emit('preview', f)"
          @download="(f) => $emit('download', f)"
          @edit="(f) => $emit('edit', f)"
          @delete="(f) => $emit('delete', f)"
          @import="(f) => $emit('import', f)"
          @share="(f) => $emit('share-file', f)"
          @move="(f) => $emit('move-file', f)"
        />
      </div>

      <div v-else class="files-list">
        <div
          v-for="file in files"
          :key="'file-' + file.id"
          class="file-list-item"
        >
          <div class="file-list-icon">
            <i :class="getFileIcon(file.mime_type)"></i>
          </div>
          <div class="file-list-info">
            <span class="file-list-name">{{ file.name }}</span>
            <span class="file-list-meta">
              {{ file.formatted_size }} &middot; {{ formatDate(file.uploaded_at) }}
            </span>
          </div>
          <div class="file-list-actions">
            <Button
              v-if="file.is_importable"
              icon="pi pi-upload"
              text
              size="small"
              @click="$emit('import', file)"
              v-tooltip.top="file.is_imported ? 'Réimporter les données' : 'Importer les données'"
            />
            <Button icon="pi pi-eye" text size="small" @click="$emit('preview', file)" />
            <Button icon="pi pi-download" text size="small" @click="$emit('download', file)" />
            <Button icon="pi pi-arrows-alt" text size="small" @click="$emit('move-file', file)" />
            <Button icon="pi pi-share-alt" text size="small" @click="$emit('share-file', file)" />
            <Button icon="pi pi-pencil" text size="small" @click="$emit('edit', file)" />
            <Button icon="pi pi-trash" text size="small" severity="danger" @click="$emit('delete', file)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!folders.length && !files.length && !loading" class="empty-state">
      <i class="pi pi-folder-open empty-icon"></i>
      <h3>Ce dossier est vide</h3>
      <p>Ajoutez des fichiers ou créez des sous-dossiers</p>
    </div>
  </div>
</template>

<script setup>
import { useMediathequeStore } from '../../stores/mediathequeStore'
import MediaFolderCard from './MediaFolderCard.vue'
import MediaFileCard from './MediaFileCard.vue'

const store = useMediathequeStore()

defineProps({
  folders: { type: Array, default: () => [] },
  files: { type: Array, default: () => [] },
  viewMode: { type: String, default: 'grid' },
  loading: { type: Boolean, default: false }
})

defineEmits([
  'open-folder', 'move-folder', 'share-folder', 'rename-folder', 'delete-folder',
  'preview', 'download', 'edit', 'delete', 'import', 'share-file', 'move-file'
])

const getFileIcon = (mimeType) => store.getFileIcon(mimeType)

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR')
</script>

<style scoped>
.media-grid {
  flex: 1;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.75rem;
}

.folders-section {
  margin-bottom: 1.5rem;
}

.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

/* List view */
.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  transition: background 0.15s;
}

.file-list-item:hover {
  background: #f8fafc;
}

.file-list-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 6px;
  flex-shrink: 0;
}

.file-list-icon i {
  font-size: 1rem;
  color: #64748b;
}

.file-list-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.file-list-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-list-meta {
  font-size: 0.75rem;
  color: #94a3b8;
}

.file-list-actions {
  display: flex;
  gap: 0.125rem;
  opacity: 0;
  transition: opacity 0.15s;
}

.file-list-item:hover .file-list-actions {
  opacity: 1;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1rem;
  color: #475569;
  margin: 0 0 0.25rem;
}

.empty-state p {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}
</style>
