<template>
  <div class="collect-grid-wrapper">
    <!-- Barre d'outils de la grille -->
    <div class="grid-toolbar" :class="{ 'readonly-toolbar': readonly }">
      <div class="toolbar-info">
        <div class="info-badge">
          <i class="pi pi-list"></i>
          <span class="badge-value">{{ currentRowCount }}</span>
          <span class="badge-label">lignes</span>
        </div>
        <div class="info-badge columns">
          <i class="pi pi-table"></i>
          <span class="badge-value">{{ columns.length }}</span>
          <span class="badge-label">colonnes</span>
        </div>
        <div v-if="readonly" class="readonly-indicator">
          <i class="pi pi-lock"></i>
          <span>Lecture seule</span>
        </div>
      </div>
      <div v-if="!readonly" class="toolbar-actions">
        <span class="actions-label">Ajouter :</span>
        <button
          type="button"
          class="btn-add-rows primary"
          @click="addRows(5)"
          title="Ajouter 5 lignes"
        >
          <i class="pi pi-plus"></i>
          5 lignes
        </button>
        <button
          type="button"
          class="btn-add-rows"
          @click="addRows(10)"
          title="Ajouter 10 lignes"
        >
          +10
        </button>
        <button
          type="button"
          class="btn-add-rows"
          @click="addRows(50)"
          title="Ajouter 50 lignes"
        >
          +50
        </button>
      </div>
    </div>

    <ag-grid-vue
      v-if="columnDefs.length > 0"
      ref="gridRef"
      :key="gridKey"
      class="ag-theme-quartz collect-grid"
      theme="legacy"
      :columnDefs="columnDefs"
      :rowData="initialRowData"
      :defaultColDef="defaultColDef"
      :getRowId="getRowId"
      :rowBuffer="10"
      @grid-ready="onGridReady"
      @first-data-rendered="onFirstDataRendered"
      @grid-size-changed="onGridSizeChanged"
      @cell-value-changed="onCellValueChanged"
    />
    <div v-else class="grid-loading">
      <i class="pi pi-info-circle"></i>
      <span>Aucune colonne configurée — veuillez définir le modèle de collecte.</span>
    </div>

    <!-- DatePicker overlay pour les cellules de date -->
    <Teleport to="body">
      <div v-if="showDatePicker" class="datepicker-backdrop" @click="hideDatePicker">
        <div
          class="date-picker-overlay"
          :style="datePickerStyle"
          @click.stop
        >
          <DatePicker
            v-model="datePickerValue"
            dateFormat="dd/mm/yy"
            showIcon
            :inline="true"
            @date-select="onDateSelect"
            :manualInput="false"
            inputId="date-picker-cell"
            class="enhanced-datepicker"
          />
          <div class="datepicker-actions">
            <button @click="onDateConfirm" class="btn-confirm">Valider</button>
            <button @click="hideDatePicker" class="btn-cancel">Annuler</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import DatePicker from 'primevue/datepicker'
import { useToast } from 'primevue/usetoast'
import './ag-grid-theme.css'

// Best Practice: Register only required modules
ModuleRegistry.registerModules([AllCommunityModule])

const props = defineProps({
  columns: {
    type: Array,
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: true
  },
  initialData: {
    type: Object,
    default: () => ({})
  },
  maxRows: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['data-changed'])

const toast = useToast()

const gridRef = ref(null)
const gridData = ref({})
const gridApi = ref(null)
const additionalRows = ref(0) // Lignes supplémentaires ajoutées par l'utilisateur

// Clé unique pour forcer le re-render de la grille quand les colonnes changent
const gridKey = computed(() => `grid-${props.columns.length}-${props.maxRows}`)

// Best Practice: Performance - Debounce timer pour les mises à jour
let dataChangeTimeout = null

// Hauteur dynamique des lignes
let minRowHeight = 48 // Valeur par défaut, sera mise à jour depuis le thème
let currentRowHeight = minRowHeight

// Best Practice: getRowId pour identifier de manière unique chaque ligne
const getRowId = (params) => {
  return params.data._rowIndex.toString()
}

// Best Practice: Hauteur dynamique basée sur le viewport
const getRowHeight = (params) => {
  return currentRowHeight
}

// Calculer la hauteur optimale des lignes
const updateRowHeight = (api) => {
  if (!api) return

  const bodyViewport = document.querySelector('.ag-body-viewport')
  if (!bodyViewport) return

  const gridHeight = bodyViewport.clientHeight
  const renderedRowCount = api.getDisplayedRowCount()

  if (!renderedRowCount) return

  // Si lignes * hauteur min > hauteur disponible, utiliser min et laisser scroll
  if (renderedRowCount * minRowHeight >= gridHeight) {
    if (currentRowHeight !== minRowHeight) {
      currentRowHeight = minRowHeight
      api.resetRowHeights()
    }
  } else {
    // Sinon, répartir l'espace disponible
    currentRowHeight = Math.floor(gridHeight / renderedRowCount)
    api.resetRowHeights()
  }
}

// Best Practice: Performance - Fonction helper pour émettre les changements avec debounce
const emitDataChanged = (immediate = false) => {
  if (dataChangeTimeout) {
    clearTimeout(dataChangeTimeout)
  }

  // Inclure le nombre total de lignes dans les données émises
  const dataToEmit = {
    ...gridData.value,
    _rowCount: maxRowsComputed.value
  }

  if (immediate) {
    emit('data-changed', dataToEmit)
  } else {
    // Debounce de 300ms pour éviter trop d'émissions
    dataChangeTimeout = setTimeout(() => {
      emit('data-changed', dataToEmit)
    }, 300)
  }
}

// DatePicker pour les champs DATE
const showDatePicker = ref(false)
const datePickerValue = ref(null)
const datePickerStyle = ref({})
const editingDateCell = ref({ rowIndex: null, field: null, fieldId: null })

// Note: Les watches sur les colonnes ont été supprimés
// La clé :key="gridKey" force un re-render complet quand les colonnes changent

// Best Practice: Lifecycle - Initialiser les données au mount
onMounted(() => {
  if (Object.keys(props.initialData).length > 0) {
    Object.keys(props.initialData).forEach(key => {
      gridData.value[key] = Array.isArray(props.initialData[key])
        ? [...props.initialData[key]]
        : props.initialData[key]
    })

    // Restaurer le nombre de lignes sauvegardé
    if (props.initialData._rowCount && props.initialData._rowCount > props.maxRows) {
      const savedRowCount = props.initialData._rowCount
      const baseRowCount = props.maxRows || 10
      // Calculer combien de lignes additionnelles étaient sauvegardées
      additionalRows.value = Math.max(0, savedRowCount - baseRowCount)
    }
  }
})

// Best Practice: Lifecycle - Cleanup au unmount
onBeforeUnmount(() => {
  // Nettoyer le debounce timer
  if (dataChangeTimeout) {
    clearTimeout(dataChangeTimeout)
    dataChangeTimeout = null
  }

  // Détruire l'instance AG Grid
  if (gridApi.value) {
    gridApi.value.destroy()
    gridApi.value = null
  }
})

// Helper: Formater les nombres avec séparateurs de milliers
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const num = parseFloat(value)
  if (isNaN(num)) return value
  // Format français avec espace comme séparateur de milliers
  return num.toLocaleString('fr-FR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2
  })
}

// Helper: Parser les nombres depuis le format français
const parseFormattedNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  // Enlever les espaces et remplacer la virgule par un point
  const cleaned = String(value).replace(/\s/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

// Best Practice: Configuration optimisée des colonnes
const defaultColDef = {
  minWidth: 140, // Largeur minimum pour permettre le scroll horizontal
  width: 180, // Largeur par défaut
  editable: !props.readonly,
  resizable: true,
  suppressHeaderMenuButton: true, // Performance: désactiver le menu si non utilisé
  suppressMovable: true, // Performance: désactiver le déplacement de colonnes si non nécessaire
  wrapText: false,
  autoHeight: false
}

// Construire les définitions de colonnes avec support des groupes
const buildColumnDefs = () => {
  const colDefs = []
  const processedFields = new Set()

  // Ajouter la colonne de numéro de ligne en premier
  colDefs.push({
    headerName: '#',
    field: '_rowIndex',
    width: 55,
    minWidth: 55,
    maxWidth: 55,
    pinned: 'left',
    editable: false,
    resizable: false,
    suppressMovable: true,
    cellClass: 'cell-row-index',
    valueFormatter: (params) => {
      return params.value !== undefined ? params.value + 1 : ''
    }
  })

  const buildGroupTree = (groupField) => {
    const children = props.columns
      .filter(col => col.parent_group === groupField.id)
      .sort((a, b) => (a.group_order || a.order || 0) - (b.group_order || b.order || 0))

    if (children.length === 0) {
      return buildFieldColumns(groupField)
    }

    const childColumns = []
    children.forEach(child => {
      processedFields.add(child.id)
      if (child.is_column_group) {
        const subGroup = buildGroupTree(child)
        if (Array.isArray(subGroup)) {
          childColumns.push(...subGroup)
        } else {
          childColumns.push(subGroup)
        }
      } else {
        const fieldCols = buildFieldColumns(child)
        childColumns.push(...fieldCols)
      }
    })

    return {
      headerName: groupField.label || groupField.name,
      headerClass: 'ag-header-group-cell-label',
      children: childColumns
    }
  }

  const buildFieldColumns = (field) => {
    const cols = []

    if (field.repeatable && field.repetitions > 1) {
      for (let i = 1; i <= field.repetitions; i++) {
        const fieldDef = {
          field: `${field.id}_${i}`,
          headerName: `${field.repetition_label || field.label} ${i}`,
          context: {
            fieldId: field.id,
            fieldType: field.type,
            repetitionIndex: i - 1
          }
        }

        if (field.type === 'DATE') {
          // Renderer simple en attendant
          fieldDef.cellRenderer = (params) => {
            const value = params.value
            let displayValue = 'Cliquez pour sélectionner'

            if (value) {
              if (typeof value === 'string' && value.includes('-')) {
                const [year, month, day] = value.split('-')
                displayValue = `${day}/${month}/${year}`
              } else if (value instanceof Date) {
                const day = String(value.getDate()).padStart(2, '0')
                const month = String(value.getMonth() + 1).padStart(2, '0')
                const year = value.getFullYear()
                displayValue = `${day}/${month}/${year}`
              } else {
                displayValue = value
              }
            }

            return `<span style="display: flex; align-items: center; cursor: pointer; height: 100%; padding: 0 8px;">
              <i class="pi pi-calendar" style="margin-right: 8px;"></i>
              <span style="flex: 1;">${displayValue}</span>
            </span>`
          }
          fieldDef.onCellClicked = (params) => {
            if (!props.readonly) {
              openDatePicker(params, params.event)
            }
          }
          fieldDef.editable = false
        } else if (field.type === 'NUMBER' || field.type === 'DECIMAL') {
          fieldDef.cellClass = 'cell-number'
          fieldDef.cellEditor = 'agTextCellEditor'
          fieldDef.valueParser = (params) => parseFormattedNumber(params.newValue)
          fieldDef.valueFormatter = (params) => formatNumber(params.value)
        } else if (field.type === 'SELECT' && field.options && field.options.length > 0) {
          fieldDef.cellEditor = 'agSelectCellEditor'
          fieldDef.cellEditorParams = {
            values: field.options
          }
        } else if (field.type === 'TEXTAREA') {
          fieldDef.cellEditor = 'agLargeTextCellEditor'
          fieldDef.cellEditorParams = {
            maxLength: 1000,
            rows: 5,
            cols: 50
          }
        } else if (field.type === 'QUALITY_MEASURE') {
          fieldDef.cellClass = 'cell-number cell-quality'
          fieldDef.headerClass = 'header-quality'
          fieldDef.cellEditor = 'agTextCellEditor'
          fieldDef.valueParser = (params) => parseFormattedNumber(params.newValue)
          fieldDef.valueFormatter = (params) => formatNumber(params.value)
        } else if (field.type === 'QUALITY_VISUAL') {
          fieldDef.cellClass = 'cell-quality'
          fieldDef.headerClass = 'header-quality'
          fieldDef.cellEditor = 'agSelectCellEditor'
          fieldDef.cellEditorParams = { values: ['Conforme', 'Non conforme', 'À revoir'] }
        } else if (field.type === 'QUALITY_COUNT') {
          fieldDef.cellClass = 'cell-number cell-quality'
          fieldDef.headerClass = 'header-quality'
          fieldDef.cellEditor = 'agTextCellEditor'
          fieldDef.valueParser = (params) => parseFormattedNumber(params.newValue)
          fieldDef.valueFormatter = (params) => formatNumber(params.value)
        }

        cols.push(fieldDef)

        // Colonne checkbox "Retouche" compagnon pour QUALITY_VISUAL
        if (field.type === 'QUALITY_VISUAL') {
          cols.push({
            field: field.id + '_retouche',
            headerName: 'Retouche',
            headerTooltip: 'Cocher si la pièce a nécessité une retouche avant d\'être conforme',
            headerClass: 'header-quality header-retouche',
            cellClass: 'cell-quality cell-retouche',
            editable: false,
            cellRenderer: (params) => {
              const checked = params.value ? 'checked' : ''
              return `<input type="checkbox" ${checked} style="cursor:pointer;width:16px;height:16px" />`
            },
            onCellClicked: (params) => {
              if (props.readonly) return
              const newVal = !params.value
              params.node.setDataValue(params.colDef.field, newVal)
            },
            width: 110,
            minWidth: 110,
            maxWidth: 130,
            suppressSizeToFit: true,
            context: { fieldId: field.id + '_retouche', fieldType: 'QUALITY_RETOUCHE' }
          })
        }
      }
    } else {
      const fieldDef = {
        field: field.id,
        headerName: field.label || field.name,
        context: {
          fieldId: field.id,
          fieldType: field.type
        }
      }

      if (field.type === 'DATE') {
        // Renderer simple en attendant
        fieldDef.cellRenderer = (params) => {
          const value = params.value
          let displayValue = 'Cliquez pour sélectionner'

          if (value) {
            if (typeof value === 'string' && value.includes('-')) {
              const [year, month, day] = value.split('-')
              displayValue = `${day}/${month}/${year}`
            } else if (value instanceof Date) {
              const day = String(value.getDate()).padStart(2, '0')
              const month = String(value.getMonth() + 1).padStart(2, '0')
              const year = value.getFullYear()
              displayValue = `${day}/${month}/${year}`
            } else {
              displayValue = value
            }
          }

          return `<span style="display: flex; align-items: center; cursor: pointer; height: 100%; padding: 0 8px;">
            <i class="pi pi-calendar" style="margin-right: 8px;"></i>
            <span style="flex: 1;">${displayValue}</span>
          </span>`
        }
        fieldDef.onCellClicked = (params) => {
          if (!props.readonly) {
            openDatePicker(params, params.event)
          }
        }
        fieldDef.editable = false
      } else if (field.type === 'NUMBER' || field.type === 'DECIMAL') {
        fieldDef.cellClass = 'cell-number'
        fieldDef.cellEditor = 'agTextCellEditor'
        fieldDef.valueParser = (params) => parseFormattedNumber(params.newValue)
        fieldDef.valueFormatter = (params) => formatNumber(params.value)
      } else if (field.type === 'SELECT' && field.options && field.options.length > 0) {
        fieldDef.cellEditor = 'agSelectCellEditor'
        fieldDef.cellEditorParams = {
          values: field.options
        }
      } else if (field.type === 'TEXTAREA') {
        fieldDef.cellEditor = 'agLargeTextCellEditor'
        fieldDef.cellEditorParams = {
          maxLength: 1000,
          rows: 5,
          cols: 50
        }
      } else if (field.type === 'QUALITY_MEASURE') {
        fieldDef.cellClass = 'cell-number cell-quality'
        fieldDef.headerClass = 'header-quality'
        fieldDef.cellEditor = 'agTextCellEditor'
        fieldDef.valueParser = (params) => parseFormattedNumber(params.newValue)
        fieldDef.valueFormatter = (params) => {
          if (params.value == null || params.value === '') return ''
          const cfg = field.configuration || {}
          const val = formatNumber(params.value)
          const unit = cfg.unit ? ` ${cfg.unit}` : ''
          if (cfg.tolerance_min != null && cfg.tolerance_max != null) {
            const num = parseFloat(params.value)
            const ok = num >= cfg.tolerance_min && num <= cfg.tolerance_max
            return val + unit + (ok ? ' ✓' : ' ✗')
          }
          return val + unit
        }
      } else if (field.type === 'QUALITY_VISUAL') {
        fieldDef.cellClass = 'cell-quality'
        fieldDef.headerClass = 'header-quality'
        fieldDef.cellEditor = 'agSelectCellEditor'
        fieldDef.cellEditorParams = {
          values: ['Conforme', 'Non conforme', 'À revoir']
        }
        fieldDef.cellRenderer = (params) => {
          if (!params.value) return ''
          const colors = {
            'Conforme': '#10b981',
            'Non conforme': '#ef4444',
            'À revoir': '#f59e0b'
          }
          const color = colors[params.value] || '#64748b'
          return `<span style="color:${color};font-weight:600">${params.value}</span>`
        }
      } else if (field.type === 'QUALITY_COUNT') {
        fieldDef.cellClass = 'cell-number cell-quality'
        fieldDef.headerClass = 'header-quality'
        fieldDef.cellEditor = 'agTextCellEditor'
        fieldDef.valueParser = (params) => parseFormattedNumber(params.newValue)
        fieldDef.valueFormatter = (params) => {
          if (params.value == null || params.value === '') return ''
          const cfg = field.configuration || {}
          const total = cfg.total_pieces || 0
          const threshold = cfg.threshold_pct ?? 5
          if (total > 0) {
            const rate = (parseFloat(params.value) / total * 100).toFixed(1)
            const ok = parseFloat(rate) <= threshold
            return `${params.value} NC (${rate}%${ok ? ' ✓' : ' ✗'})`
          }
          return `${params.value} NC`
        }
      }

      cols.push(fieldDef)

      // Colonne checkbox "Retouche" compagnon pour QUALITY_VISUAL
      if (field.type === 'QUALITY_VISUAL') {
        cols.push({
          field: field.id + '_retouche',
          headerName: 'Retouche',
          headerTooltip: 'Cocher si la pièce a nécessité une retouche avant d\'être conforme',
          headerClass: 'header-quality header-retouche',
          cellClass: 'cell-quality cell-retouche',
          editable: false,
          cellRenderer: (params) => {
            const checked = params.value ? 'checked' : ''
            return `<input type="checkbox" ${checked} style="cursor:pointer;width:16px;height:16px" />`
          },
          onCellClicked: (params) => {
            if (props.readonly) return
            const newVal = !params.value
            params.node.setDataValue(params.colDef.field, newVal)
          },
          width: 90,
          minWidth: 80,
          maxWidth: 100,
          suppressSizeToFit: true,
          context: { fieldId: field.id + '_retouche', fieldType: 'QUALITY_RETOUCHE' }
        })
      }
    }

    return cols
  }

  const rootFields = props.columns
    .filter(col => !col.parent_group)
    .sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : (a.group_order !== undefined ? a.group_order : 0)
      const orderB = b.order !== undefined ? b.order : (b.group_order !== undefined ? b.group_order : 0)
      return orderA - orderB
    })

  rootFields.forEach(field => {
    if (processedFields.has(field.id)) return

    processedFields.add(field.id)

    if (field.is_column_group) {
      const groupTree = buildGroupTree(field)
      colDefs.push(groupTree)
    } else {
      const cols = buildFieldColumns(field)
      colDefs.push(...cols)
    }
  })

  return colDefs
}

// Best Practice: Performance - Mémoïzer les définitions de colonnes
// Elles ne changent que si props.columns change
const columnDefs = computed(() => {
  // Ne recalculer que si les colonnes changent vraiment
  if (props.columns.length === 0) return []
  return buildColumnDefs()
})

// Calculer le nombre maximum de lignes
const maxRowsComputed = computed(() => {
  let max = props.maxRows || 10

  Object.values(gridData.value).forEach(val => {
    if (Array.isArray(val)) {
      max = Math.max(max, val.length)
    }
  })

  Object.values(props.initialData).forEach(val => {
    if (Array.isArray(val)) {
      max = Math.max(max, val.length)
    }
  })

  // Ajouter les lignes supplémentaires demandées par l'utilisateur
  return max + additionalRows.value
})

// Nombre actuel de lignes pour l'affichage
const currentRowCount = computed(() => maxRowsComputed.value)

// Helper: Extraire tous les champs des colonnes (y compris imbriqués)
const extractAllFields = (colDefs) => {
  const fields = []

  const traverse = (cols) => {
    if (!cols || !Array.isArray(cols)) return

    cols.forEach(col => {
      if (col.children && col.children.length > 0) {
        // C'est un groupe, parcourir les enfants
        traverse(col.children)
      } else if (col.field && col.field !== '_rowIndex') {
        // C'est une colonne avec un field
        fields.push(col.field)
      }
    })
  }

  traverse(colDefs)
  return fields
}

// Fonction pour générer les données de lignes
const generateRowData = () => {
  const cols = columnDefs.value
  if (!cols || cols.length === 0) {
    return []
  }

  // Extraire tous les champs des colonnes
  const allFields = extractAllFields(cols)
  const rows = []
  const rowCount = maxRowsComputed.value

  // silent in production: generation details omitted

  for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
    const row = { _rowIndex: rowIdx }
    allFields.forEach(field => {
      row[field] = getCellValue(field, rowIdx)
    })
    rows.push(row)
  }

  return rows
}

// Données initiales pour la grille
const initialRowData = computed(() => {
  return generateRowData()
})

// Fonction pour ajouter des lignes
const addRows = (count) => {
  const previousRowCount = maxRowsComputed.value
  additionalRows.value += count

  // Utiliser setTimeout pour s'assurer que maxRowsComputed est recalculé
  setTimeout(() => {
    if (gridApi.value) {
      // Générer les nouvelles données et mettre à jour la grille
      const newRowData = generateRowData()
      gridApi.value.setGridOption('rowData', newRowData)

      // Scroller vers les nouvelles lignes
      setTimeout(() => {
        if (gridApi.value) {
          gridApi.value.ensureIndexVisible(previousRowCount, 'top')
        }
      }, 100)
    }

    // Émettre les données avec le nouveau nombre de lignes
    emitDataChanged(true)
  }, 50)

  // Afficher un toast de confirmation
  toast.add({
    severity: 'success',
    summary: 'Lignes ajoutées',
    detail: `${count} ligne(s) ajoutée(s). Total: ${previousRowCount + count} lignes`,
    life: 2000
  })
}

// Helper pour obtenir la valeur d'une cellule
const getCellValue = (field, rowIdx) => {
  // Priorité aux données de la grille (modifiées par l'utilisateur)
  if (gridData.value[field] !== undefined) {
    const colData = gridData.value[field]
    if (Array.isArray(colData)) {
      // Retourner la valeur si elle existe dans le tableau, sinon vide
      return rowIdx < colData.length ? (colData[rowIdx] ?? '') : ''
    }
    // Valeur scalaire : seulement pour la première ligne
    return rowIdx === 0 ? colData : ''
  }

  // Fallback sur les données initiales
  if (props.initialData[field] !== undefined) {
    const colData = props.initialData[field]
    if (Array.isArray(colData)) {
      return rowIdx < colData.length ? (colData[rowIdx] ?? '') : ''
    }
    // Valeur scalaire : seulement pour la première ligne
    return rowIdx === 0 ? colData : ''
  }

  return ''
}

// Best Practice: Lifecycle - gridReady pour initialisation
const onGridReady = (params) => {
  gridApi.value = params.api

  // Les données sont déjà passées via :rowData="initialRowData"
  // Donc pas besoin de les re-setter ici
}

// Best Practice: Lifecycle - firstDataRendered pour actions post-initialisation
const onFirstDataRendered = (params) => {
  updateRowHeight(params.api)
  // Ne pas ajuster les colonnes pour permettre le scroll horizontal
  // params.api.sizeColumnsToFit()
}

// Best Practice: Réajuster les hauteurs quand la grille change de taille
const onGridSizeChanged = (params) => {
  updateRowHeight(params.api)
}

// Best Practice: Performance - mise à jour optimisée avec refreshCells
const onCellValueChanged = (params) => {
  const field = params.colDef.field
  const rowIndex = params.node.rowIndex
  const newValue = params.newValue

  if (!Array.isArray(gridData.value[field])) {
    gridData.value[field] = []
  }

  while (gridData.value[field].length <= rowIndex) {
    gridData.value[field].push(undefined)
  }

  gridData.value[field][rowIndex] = newValue

  // Émettre les changements avec debounce pour performance
  emitDataChanged()
}

// Événement déclenché quand l'édition d'une cellule se termine
const onCellEditingStopped = (params) => {
  // Ne rien faire - l'utilisateur peut naviguer manuellement
  // L'autofocus automatique a été désactivé à la demande de l'utilisateur
}

// Ouvrir le DatePicker pour une cellule de date
const openDatePicker = (params, event) => {
  if (props.readonly) return

  const field = params.colDef.field
  const rowIndex = params.node.rowIndex
  const currentValue = params.value

  // Utiliser l'event passé ou créer un rect par défaut
  const rect = event ? event.target.getBoundingClientRect() : params.eGridCell.getBoundingClientRect()
  
  // Dimensions approximatives du calendrier (ajustez selon votre design)
  const calendarHeight = 350 // Hauteur approximative du calendrier
  const calendarWidth = 340 // Largeur approximative du calendrier
  const padding = 10 // Espacement
  
  // Calculer la position optimale
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  
  // Vérifier si on peut placer le calendrier en dessous
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  
  let top, left
  
  // Position verticale : préférer en dessous, sinon au-dessus
  if (spaceBelow >= calendarHeight + padding) {
    // Assez d'espace en dessous
    top = rect.bottom + padding
  } else if (spaceAbove >= calendarHeight + padding) {
    // Assez d'espace au-dessus
    top = rect.top - calendarHeight - padding
  } else {
    // Pas assez d'espace ni en haut ni en bas, centrer verticalement
    top = Math.max(padding, Math.min(viewportHeight - calendarHeight - padding, (rect.top + rect.bottom) / 2 - calendarHeight / 2))
  }
  
  // Position horizontale : s'assurer que le calendrier reste dans la vue
  if (rect.left + calendarWidth > viewportWidth) {
    // Le calendrier sort à droite, l'aligner à droite du champ
    left = Math.max(padding, viewportWidth - calendarWidth - padding)
  } else if (rect.left < 0) {
    // Le champ est trop à gauche
    left = padding
  } else {
    // Position normale
    left = rect.left
  }
  
  datePickerStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 10000
  }

  if (currentValue) {
    if (typeof currentValue === 'string') {
      const parsed = new Date(currentValue)
      if (!isNaN(parsed.getTime())) {
        datePickerValue.value = parsed
      } else {
        const parts = currentValue.split('/')
        if (parts.length === 3) {
          datePickerValue.value = new Date(parts[2], parts[1] - 1, parts[0])
        } else {
          datePickerValue.value = new Date()
        }
      }
    } else if (currentValue instanceof Date) {
      datePickerValue.value = currentValue
    } else {
      datePickerValue.value = new Date()
    }
  } else {
    datePickerValue.value = new Date()
  }

  editingDateCell.value = {
    rowIndex,
    field,
    fieldId: params.colDef._fieldId
  }

  showDatePicker.value = true
}

const onDateSelect = () => {
  // Ne rien faire ici, attendre la confirmation
}

const onDateConfirm = () => {
  if (!datePickerValue.value || editingDateCell.value.rowIndex === null) {
    hideDatePicker()
    return
  }

  const rowIndex = editingDateCell.value.rowIndex
  const field = editingDateCell.value.field

  if (!field) {
    hideDatePicker()
    return
  }

  const year = datePickerValue.value.getFullYear()
  const month = String(datePickerValue.value.getMonth() + 1).padStart(2, '0')
  const day = String(datePickerValue.value.getDate()).padStart(2, '0')
  const formattedDate = `${year}-${month}-${day}`

  if (!Array.isArray(gridData.value[field])) {
    gridData.value[field] = []
  }

  while (gridData.value[field].length <= rowIndex) {
    gridData.value[field].push(undefined)
  }

  gridData.value[field][rowIndex] = formattedDate

  // Best Practice: Performance - Mettre à jour seulement la cellule modifiée
  if (gridApi.value) {
    const rowNode = gridApi.value.getRowNode(rowIndex.toString())
    if (rowNode) {
      rowNode.setDataValue(field, formattedDate)
      // Rafraîchir seulement cette cellule au lieu de toute la grille
      gridApi.value.refreshCells({
        rowNodes: [rowNode],
        columns: [field],
        force: true
      })
    }
  }

  // Émettre immédiatement pour les dates (action utilisateur explicite)
  emitDataChanged(true)
  hideDatePicker()
}

const hideDatePicker = () => {
  showDatePicker.value = false
  editingDateCell.value = { rowIndex: null, field: null, fieldId: null }
  datePickerValue.value = null
}

// Méthode exposée pour obtenir les données
const getGridData = () => {
  const cleanedData = {}

  Object.keys(gridData.value).forEach(key => {
    const value = gridData.value[key]
    if (Array.isArray(value)) {
      let lastValidIndex = -1
      for (let i = value.length - 1; i >= 0; i--) {
        if (value[i] !== '' && value[i] !== null && value[i] !== undefined) {
          lastValidIndex = i
          break
        }
      }

      if (lastValidIndex >= 0) {
        cleanedData[key] = value.slice(0, lastValidIndex + 1)
      }
    } else if (value !== '' && value !== null && value !== undefined) {
      cleanedData[key] = value
    }
  })

  // Inclure le nombre total de lignes pour la persistance
  cleanedData._rowCount = maxRowsComputed.value

  return cleanedData
}

// Méthode pour valider les champs obligatoires
const validateRequiredFields = () => {
  const errors = []

  if (!props.columns || props.columns.length === 0) {
    return errors
  }

  // Parcourir tous les champs pour trouver ceux qui sont obligatoires
  props.columns.forEach(field => {
    // Ignorer les groupes de colonnes
    if (field.is_column_group) {
      return
    }

    // Vérifier si le champ est obligatoire
    if (field.required) {
      // Vérifier si le champ est rempli
      const fieldId = field.id
      const fieldData = gridData.value[fieldId] || props.initialData[fieldId]

      // Vérifier si des données existent
      let hasValue = false

      if (Array.isArray(fieldData)) {
        // Pour les tableaux, vérifier s'il y a au moins une valeur non vide
        hasValue = fieldData.some(val => val !== '' && val !== null && val !== undefined)
      } else {
        // Pour les valeurs scalaires
        hasValue = fieldData !== '' && fieldData !== null && fieldData !== undefined
      }

      if (!hasValue) {
        errors.push({
          field: fieldId,
          label: field.label || field.name,
          message: `Le champ "${field.label || field.name}" est obligatoire`
        })
      }
    }
  })

  return errors
}

defineExpose({
  getGridData,
  validateRequiredFields
})
</script>

<style scoped>
.collect-grid-wrapper {
  width: 100%;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  min-height: 400px;
}

.collect-grid {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.grid-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #64748b;
  font-size: 0.9rem;
}

.grid-loading i {
  font-size: 2rem;
  color: #3b82f6;
}

/* ========================================
   TOOLBAR STYLES - Barre d'outils moderne
   ======================================== */
.grid-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid #e2e8f0;
  min-height: 56px;
  gap: 1rem;
}

.grid-toolbar.readonly-toolbar {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.toolbar-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.info-badge i {
  font-size: 0.875rem;
  color: #3b82f6;
}

.info-badge.columns i {
  color: #8b5cf6;
}

.info-badge .badge-value {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
}

.info-badge .badge-label {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
}

.readonly-indicator {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 0.375rem;
  color: #92400e;
  font-size: 0.8125rem;
  font-weight: 600;
}

.readonly-indicator i {
  font-size: 0.75rem;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.actions-label {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
  margin-right: 0.25rem;
}

.btn-add-rows {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-add-rows:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.btn-add-rows.primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.btn-add-rows.primary:hover {
  background: #2563eb;
  border-color: #2563eb;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.btn-add-rows i {
  font-size: 0.6875rem;
}

/* ========================================
   CELL STYLES - Styles des cellules
   ======================================== */

/* Numéro de ligne */
:deep(.cell-row-index) {
  background: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0 !important;
  justify-content: center !important;
  font-weight: 600;
  color: #64748b;
  font-size: 0.8125rem;
}

/* Cellules numériques - alignement à droite */
:deep(.cell-number) {
  justify-content: flex-end !important;
  text-align: right !important;
  font-variant-numeric: tabular-nums;
}

/* Backdrop pour le DatePicker - Style moderne */
.datepicker-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.date-picker-overlay {
  position: fixed;
  z-index: 10000;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 0;
  overflow: hidden;
  min-width: 21.25rem;
  animation: slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from {
    transform: translateY(-1rem) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.enhanced-datepicker {
  padding: 1.25rem;
}

.enhanced-datepicker :deep(.p-datepicker) {
  border: none;
  box-shadow: none;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.enhanced-datepicker :deep(.p-datepicker table) {
  font-size: 0.925rem;
}

.enhanced-datepicker :deep(.p-datepicker .p-datepicker-header) {
  background: #475569;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  color: white;
}

.enhanced-datepicker :deep(.p-datepicker .p-datepicker-title) {
  font-weight: 600;
  color: white;
  font-size: 1rem;
}

.enhanced-datepicker :deep(.p-datepicker .p-datepicker-prev),
.enhanced-datepicker :deep(.p-datepicker .p-datepicker-next) {
  color: white !important;
}

.enhanced-datepicker :deep(.p-datepicker .p-datepicker-prev:hover),
.enhanced-datepicker :deep(.p-datepicker .p-datepicker-next:hover) {
  background: rgba(255, 255, 255, 0.2) !important;
}

.enhanced-datepicker :deep(.p-datepicker table td) {
  padding: 0.35rem;
}

.enhanced-datepicker :deep(.p-datepicker table td > span) {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.enhanced-datepicker :deep(.p-datepicker table td > span:hover) {
  background: #475569;
  color: white;
  transform: scale(1.05);
}

.enhanced-datepicker :deep(.p-datepicker table td > span.p-highlight) {
  background: #475569;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 6px -1px rgba(71, 85, 105, 0.4);
}

.enhanced-datepicker :deep(.p-datepicker table td.p-datepicker-today > span) {
  background: #fef3c7;
  color: #92400e;
  font-weight: 600;
  border: 2px solid #fbbf24;
}

.enhanced-datepicker :deep(.p-datepicker table th) {
  color: #64748b;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.5rem;
}

.datepicker-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  justify-content: flex-end;
}

.datepicker-actions button {
  padding: 0.625rem 1.75rem;
  border: none;
  border-radius: 0.625rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  letter-spacing: 0.02em;
}

.btn-confirm {
  background: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.btn-confirm:hover {
  background: #2563eb;
  transform: translateY(-0.125rem);
  box-shadow: 0 0.5rem 0.75rem rgba(59, 130, 246, 0.3);
}

.btn-cancel {
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-cancel:hover {
  background: #f8fafc;
  color: #475569;
  border-color: #cbd5e1;
}

/* ========================================
   RESPONSIVE STYLES
   ======================================== */
@media (max-width: 768px) {
  .grid-toolbar {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    min-height: auto;
  }

  .toolbar-info {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .info-badge {
    padding: 0.375rem 0.625rem;
  }

  .info-badge .badge-label {
    display: none;
  }

  .actions-label {
    display: none;
  }

  .btn-add-rows {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }

  .date-picker-overlay {
    min-width: auto;
    max-width: 95vw;
    left: 50% !important;
    transform: translateX(-50%);
  }
}

@media (max-width: 480px) {
  .toolbar-info {
    gap: 0.5rem;
  }

  .toolbar-actions {
    gap: 0.375rem;
  }

  .info-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .info-badge i {
    font-size: 0.75rem;
  }

  .info-badge .badge-value {
    font-size: 0.8125rem;
  }

  .readonly-indicator {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .readonly-indicator span {
    display: none;
  }
}
</style>

<style>
/* Colonnes qualité — styles globaux (pas scoped pour atteindre AG Grid) */
.ag-header-cell.header-quality .ag-header-cell-text {
  color: #7c3aed;
  font-weight: 700;
}
.ag-header-cell.header-quality {
  background-color: #f5f3ff !important;
  border-left: 3px solid #7c3aed !important;
}
.ag-cell.cell-quality {
  background-color: #faf5ff !important;
  border-left: 2px solid #ede9fe !important;
}
/* Checkbox retouche : même style que les colonnes qualité */
.ag-header-cell.header-retouche {
  background-color: #f5f3ff !important;
  border-left: 2px solid #ede9fe !important;
}
.ag-header-cell.header-retouche .ag-header-cell-text {
  color: #7c3aed;
  font-weight: 700;
}
.ag-cell.cell-retouche {
  background-color: #f0f9ff !important;
  border-left: 2px solid #bae6fd !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
</style>
