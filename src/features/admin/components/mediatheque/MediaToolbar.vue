<template>
  <div class="media-toolbar">
    <div class="toolbar-left">
      <InputGroup class="search-group">
        <InputGroupAddon>
          <i class="pi pi-search"></i>
        </InputGroupAddon>
        <InputText
          :modelValue="searchQuery"
          @update:modelValue="$emit('update:searchQuery', $event)"
          placeholder="Rechercher..."
          class="search-input"
        />
      </InputGroup>

      <Select
        :modelValue="typeFilter"
        @update:modelValue="$emit('update:typeFilter', $event)"
        :options="typeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Type"
        class="filter-select"
        showClear
      />

      <Select
        :modelValue="categoryFilter"
        @update:modelValue="$emit('update:categoryFilter', $event)"
        :options="categories"
        optionLabel="name"
        optionValue="id"
        placeholder="Catégorie"
        class="filter-select"
        showClear
        :filter="true"
        filterPlaceholder="Rechercher..."
      />
    </div>

    <div class="toolbar-right">
      <Button
        icon="pi pi-folder-plus"
        label="Nouveau dossier"
        text
        size="small"
        @click="$emit('create-folder')"
      />
      <Button
        icon="pi pi-upload"
        label="Importer / Ajouter"
        size="small"
        @click="$emit('upload')"
      />
      <SelectButton
        :modelValue="viewMode"
        @update:modelValue="$emit('update:viewMode', $event)"
        :options="['grid', 'list']"
        :allowEmpty="false"
        class="view-toggle"
      >
        <template #option="{ option }">
          <i :class="option === 'grid' ? 'pi pi-th-large' : 'pi pi-bars'" />
        </template>
      </SelectButton>
    </div>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: { type: String, default: '' },
  typeFilter: { type: String, default: null },
  categoryFilter: { type: [Number, String], default: null },
  viewMode: { type: String, default: 'grid' },
  categories: { type: Array, default: () => [] }
})

defineEmits([
  'update:searchQuery', 'update:typeFilter', 'update:categoryFilter',
  'update:viewMode', 'upload', 'create-folder'
])

const typeOptions = [
  { label: 'Images', value: 'IMAGE' },
  { label: 'Videos', value: 'VIDEO' },
  { label: 'Audio', value: 'AUDIO' },
  { label: 'Documents', value: 'DOCUMENT' },
  { label: 'Rapports PDF', value: 'REPORT' },
  { label: 'Comptes Rendus', value: 'MINUTES' },
  { label: 'Tableurs', value: 'SPREADSHEET' }
]
</script>

<style scoped>
.media-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.search-group {
  max-width: 280px;
}

.search-input {
  font-size: 0.85rem;
}

.filter-select {
  min-width: 140px;
  font-size: 0.85rem;
}

.toolbar-right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.view-toggle {
  margin-left: 0.25rem;
}
</style>
