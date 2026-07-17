<template>
  <div class="file-card" :class="file.file_type">
    <div class="file-preview">
      <div v-if="file.file_type === 'IMAGE'" class="image-preview">
        <img v-if="imageSrc" :src="imageSrc" :alt="file.name" />
        <div v-else class="image-placeholder">
          <i class="pi pi-picture"></i>
        </div>
      </div>
      <div v-else-if="file.file_type === 'VIDEO'" class="video-preview">
        <i class="pi pi-video"></i>
        <div class="type-badge">VIDEO</div>
      </div>
      <div v-else-if="file.file_type === 'AUDIO'" class="audio-preview">
        <i class="pi pi-volume-up"></i>
      </div>
      <div v-else-if="file.file_type === 'REPORT'" class="report-preview">
        <i class="pi pi-file-pdf"></i>
        <div class="type-badge">PDF</div>
      </div>
      <div v-else class="document-preview">
        <i :class="getFileIcon(file.mime_type)"></i>
      </div>

      <div class="file-overlay">
        <div class="file-actions">
          <Button
            v-if="file.is_importable"
            icon="pi pi-upload"
            text
            size="small"
            @click.stop="$emit('import', file)"
            v-tooltip.top="file.is_imported ? 'Réimporter les données' : 'Importer les données'"
          />
          <Button
            icon="pi pi-eye"
            text
            size="small"
            @click.stop="$emit('preview', file)"
          />
          <Button
            icon="pi pi-download"
            text
            size="small"
            @click.stop="$emit('download', file)"
          />
          <Button
            icon="pi pi-arrows-alt"
            text
            size="small"
            @click.stop="$emit('move', file)"
            v-tooltip.top="'Deplacer'"
          />
          <Button
            icon="pi pi-share-alt"
            text
            size="small"
            @click.stop="$emit('share', file)"
          />
          <Button
            icon="pi pi-pencil"
            text
            size="small"
            @click.stop="$emit('edit', file)"
          />
          <Button
            icon="pi pi-trash"
            text
            size="small"
            severity="danger"
            @click.stop="$emit('delete', file)"
          />
        </div>
      </div>
    </div>

    <div class="file-info">
      <h4 class="file-name" :title="file.name">{{ file.name }}</h4>
      <p class="file-category">{{ file.category_name || 'Non classe' }}</p>
      <div class="file-meta">
        <span class="file-size">{{ file.formatted_size }}</span>
        <span class="file-date">{{ formatDate(file.uploaded_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, toRef } from 'vue'
import { axiosInstance } from '@/main.js'
import { useMediathequeStore } from '../../stores/mediathequeStore'

// Define props first
const props = defineProps({
  file: { type: Object, required: true }
})

defineEmits(['preview', 'download', 'edit', 'delete', 'import', 'share', 'move'])

// Create reactive reference to file prop
const file = toRef(props, 'file')

const store = useMediathequeStore()
const imageSrc = ref('')
let imageObjectUrl = null

const cleanupImage = () => {
  if (imageObjectUrl) {
    URL.revokeObjectURL(imageObjectUrl)
    imageObjectUrl = null
  }
  imageSrc.value = ''
}

const loadImage = async () => {
  cleanupImage()

  if (!file.value || file.value.file_type !== 'IMAGE') {
    return
  }

  const sourcePath = file.value.thumbnail_content_url || file.value.content_url || file.value.thumbnail_url || file.value.file_url
  if (!sourcePath) {
    return
  }

  try {
    const response = await axiosInstance.get(store.getMediaUrl(sourcePath), {
      responseType: 'blob'
    })
    imageObjectUrl = URL.createObjectURL(response.data)
    imageSrc.value = imageObjectUrl
  } catch (error) {
    console.error('Erreur chargement image mediathèque:', error)
    cleanupImage()
  }
}

onMounted(loadImage)
watch(
  () => [file.value?.thumbnail_content_url, file.value?.content_url, file.value?.thumbnail_url, file.value?.file_url, file.value?.file_type],
  loadImage,
  { immediate: true }
)
onBeforeUnmount(cleanupImage)

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR')
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'pi pi-file'
  
  if (mimeType.startsWith('image/')) return 'pi pi-image'
  if (mimeType.startsWith('video/')) return 'pi pi-video'
  if (mimeType.startsWith('audio/')) return 'pi pi-volume-up'
  
  switch(true) {
    case mimeType.includes('pdf'): return 'pi pi-file-pdf'
    case mimeType.includes('word') || mimeType.includes('document'):
      return 'pi pi-file-word'
    case mimeType.includes('sheet') || mimeType.includes('excel'):
      return 'pi pi-file-excel'
    case mimeType.includes('presentation') || mimeType.includes('powerpoint'):
      return 'pi pi-file-powerpoint'
    case mimeType.includes('csv'): return 'pi pi-table'
    case mimeType.includes('text') || mimeType.includes('plain'):
      return 'pi pi-file-text'
    case mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive'):
      return 'pi pi-folder'
    default: return 'pi pi-file'
  }
}
</script>

<style scoped>
.file-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.15s;
}

.file-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.file-preview {
  position: relative;
  height: 140px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-preview,
.audio-preview,
.report-preview,
.document-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.video-preview i,
.audio-preview i,
.report-preview i,
.document-preview i {
  font-size: 2.5rem;
  color: #94a3b8;
}

.type-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: #e2e8f0;
  color: #475569;
}

.file-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.file-card:hover .file-overlay {
  opacity: 1;
}

.file-actions {
  display: flex;
  gap: 0.25rem;
}

.file-actions :deep(.p-button) {
  color: white !important;
}

.file-info {
  padding: 0.75rem;
}

.file-name {
  font-size: 0.825rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-category {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 0.4rem;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #94a3b8;
}
</style>
