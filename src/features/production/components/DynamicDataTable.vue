<template>
  <Card class="data-table-card">
    <template #header>
      <div class="table-header">
        <h3>{{ title }}</h3>
        <div class="table-actions">
          <Button
            v-if="showExport"
            icon="pi pi-download"
            label="Exporter"
            severity="secondary"
            size="small"
            @click="exportData"
          />
        </div>
      </div>
    </template>

    <template #content>
      <DataTable
        :value="tableData"
        :paginator="paginator"
        :rows="rows"
        :rowsPerPageOptions="[10, 25, 50]"
        :loading="loading"
        stripedRows
        responsiveLayout="scroll"
        class="dynamic-table"
        :globalFilterFields="filterFields"
      >
        <!-- Colonnes generees dynamiquement depuis les tags -->
        <Column
          v-for="tag in displayColumns"
          :key="tag.tag_name"
          :field="tag.tag_name"
          :header="tag.display_name || tag.tag_name"
          :sortable="true"
        >
          <template #body="{ data }">
            <span :class="getCellClass(data[tag.tag_name], tag)">
              {{ formatCellValue(data[tag.tag_name], tag) }}
            </span>
          </template>
        </Column>

        <!-- Colonne actions optionnelle -->
        <Column v-if="showActions" header="Actions" :exportable="false" style="width: 100px">
          <template #body="{ data }">
            <Button
              icon="pi pi-eye"
              severity="secondary"
              text
              rounded
              size="small"
              @click="$emit('view', data)"
            />
          </template>
        </Column>

        <!-- Template pour etat vide -->
        <template #empty>
          <div class="empty-table">
            <i class="pi pi-inbox"></i>
            <p>Aucune donnee disponible</p>
          </div>
        </template>
      </DataTable>
    </template>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { useToast } from 'primevue/usetoast'

const props = defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  data: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: 'Détail des données'
  },
  loading: {
    type: Boolean,
    default: false
  },
  paginator: {
    type: Boolean,
    default: true
  },
  rows: {
    type: Number,
    default: 10
  },
  maxColumns: {
    type: Number,
    default: 8
  },
  showExport: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

defineEmits(['view', 'export'])

const toast = useToast()

// Limiter le nombre de colonnes affichees
const displayColumns = computed(() => {
  // Prioriser: DATE, puis TEXT, puis NUMBER
  const sorted = [...props.tags].sort((a, b) => {
    const priority = { DATE: 0, DATETIME: 0, TEXT: 1, NUMBER: 2, DECIMAL: 2, PERCENTAGE: 2 }
    return (priority[a.data_type] || 3) - (priority[b.data_type] || 3)
  })
  return sorted.slice(0, props.maxColumns)
})

// Transformer les donnees pour le DataTable
const tableData = computed(() => {
  return props.data.map((row) => {
    const flatRow = {}
    // Si les donnees sont dans row.data (format ImportedData)
    const rowData = row.data || row
    for (const tag of displayColumns.value) {
      flatRow[tag.tag_name] = rowData[tag.tag_name]?.value ?? rowData[tag.tag_name] ?? null
    }
    return flatRow
  })
})

const filterFields = computed(() => displayColumns.value.map((t) => t.tag_name))

const formatCellValue = (value, tag) => {
  if (value === null || value === undefined) return '-'

  switch (tag.data_type) {
    case 'DATE':
      return formatDate(value)
    case 'DATETIME':
      return formatDateTime(value)
    case 'NUMBER':
    case 'DECIMAL':
      return formatNumber(value)
    case 'PERCENTAGE':
      return formatNumber(value) + '%'
    case 'BOOLEAN':
      return value ? 'Oui' : 'Non'
    default:
      return String(value)
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  try {
    const date = new Date(value)
    return new Intl.DateTimeFormat('fr-FR').format(date)
  } catch {
    return value
  }
}

const formatDateTime = (value) => {
  if (!value) return '-'
  try {
    const date = new Date(value)
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date)
  } catch {
    return value
  }
}

const formatNumber = (value) => {
  if (value === null || value === undefined) return '-'
  try {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(value))
  } catch {
    return value
  }
}

const getCellClass = (value, tag) => {
  // Classes conditionnelles pour certains types
  if (tag.data_type === 'PERCENTAGE') {
    const num = Number(value)
    if (num >= 80) return 'cell-success'
    if (num >= 50) return 'cell-warning'
    if (num < 50) return 'cell-danger'
  }
  return ''
}

const exportData = () => {
  // TODO: Implementer l'export CSV/Excel
  toast.add({
    severity: 'info',
    summary: 'Export',
    detail: 'Fonctionnalite en cours de developpement',
    life: 3000
  })
}
</script>

<style scoped lang="scss">
.data-table-card {
  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--surface-border);

    h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .table-actions {
      display: flex;
      gap: 0.5rem;
    }
  }
}

.dynamic-table {
  :deep(.p-datatable-header) {
    background: transparent;
    border: none;
    padding: 1rem;
  }

  :deep(.p-datatable-thead > tr > th) {
    background: var(--surface-ground);
    font-weight: 600;
    font-size: 0.875rem;
    padding: 0.75rem 1rem;
  }

  :deep(.p-datatable-tbody > tr > td) {
    padding: 0.75rem 1rem;
  }
}

.cell-success {
  color: #22c55e;
  font-weight: 600;
}

.cell-warning {
  color: #f59e0b;
  font-weight: 600;
}

.cell-danger {
  color: #ef4444;
  font-weight: 600;
}

.empty-table {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-color-secondary);

  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 1rem;
  }
}
</style>
