<template>
  <div class="column-group-manager">
    <div v-if="!hideHeader" class="manager-header">
      <div class="header-info">
        <i class="pi pi-sitemap"></i>
        <div>
          <h3>Gestion des groupes de colonnes</h3>
          <p>Créez des structures de tableaux complexes avec des colonnes multi-niveaux</p>
        </div>
      </div>
      <div class="header-controls">
        <div class="header-actions">
          <Button
            label="Groupe racine"
            icon="pi pi-folder-plus"
            @click="addRootGroup"
            class="p-button-sm p-button-success"
          />
          <Button
            label="Champ racine"
            icon="pi pi-file-plus"
            @click="addRootField"
            class="p-button-sm p-button-primary"
          />
        </div>
      </div>
    </div>

    <div class="manager-content">
      <!-- Liste des groupes et champs (formulaires inline) -->
      <div class="root-items-list">
        <div
          v-for="(item, index) in displayItems"
          :key="item.field_id"
          class="root-item-card"
        >
          <div class="item-header">
            <div class="item-title">
              <i :class="item.is_column_group ? 'pi pi-folder' : 'pi pi-file'"></i>
              <span>{{ item.is_column_group ? 'Groupe' : 'Champ' }} {{ index + 1 }}</span>
            </div>
            <Button
              icon="pi pi-trash"
              @click="showDeleteConfirm(item)"
              class="p-button-sm p-button-danger p-button-text"
              v-tooltip.top="'Supprimer'"
            />
          </div>

          <div class="item-form">
            <div class="form-grid">
              <div class="form-field">
                <label>Libellé *</label>
                <InputText
                  v-model="item.label"
                  placeholder="Ex: Production par équipe"
                />
              </div>

              <div class="form-field">
                <label>Identifiant (field_id) *</label>
                <InputText
                  v-model="item.field_id"
                  placeholder="Ex: production_equipe"
                />
              </div>

              <!-- Champs spécifiques aux groupes -->
              <template v-if="item.is_column_group">
                <div class="form-field">
                  <label>Niveau de groupement</label>
                  <InputNumber
                    v-model="item.group_level"
                    :min="0"
                    :max="5"
                    :disabled="true"
                  />
                  <small class="field-hint">Calculé automatiquement</small>
                </div>

                <div class="form-field">
                  <label>Nombre de colonnes (span)</label>
                  <InputNumber
                    v-model="item.column_span"
                    :min="1"
                    :max="50"
                  />
                  <small class="field-hint">Nombre de colonnes enfants</small>
                </div>
              </template>

              <!-- Champs spécifiques aux champs de données -->
              <template v-else>
                <div class="form-field">
                  <label>Type de champ *</label>
                  <Select
                    v-model="item.type"
                    :options="fieldTypeOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Sélectionner un type"
                  />
                </div>

                <div class="form-field">
                  <div class="checkbox-field">
                    <Checkbox
                      v-model="item.required"
                      :binary="true"
                      inputId="required-check"
                    />
                    <label for="required-check">Champ obligatoire</label>
                  </div>
                </div>

                <div class="form-field">
                  <div class="checkbox-field">
                    <Checkbox
                      v-model="item.repeatable"
                      :binary="true"
                      inputId="repeatable-check"
                    />
                    <label for="repeatable-check">Champ répétable</label>
                  </div>
                </div>

                <template v-if="item.repeatable">
                  <div class="form-field">
                    <label>Nombre de répétitions</label>
                    <InputNumber
                      v-model="item.repetitions"
                      :min="1"
                      :max="20"
                    />
                  </div>

                  <div class="form-field">
                    <label>Libellé des répétitions</label>
                    <InputText
                      v-model="item.repetition_label"
                      placeholder="Ex: Horaire, Point, Machine"
                    />
                  </div>
                </template>
              </template>

              <div class="form-field">
                <label>Ordre d'affichage</label>
                <InputNumber
                  v-model="item.group_order"
                  :min="0"
                />
                <small class="field-hint">Ordre de gauche à droite</small>
              </div>
            </div>

            <!-- Actions pour ajouter des enfants (seulement pour les groupes) -->
            <div v-if="item.is_column_group" class="item-children-section">
              <div class="children-header">
                <span>Enfants du groupe</span>
                <div class="children-actions">
                  <Button
                    label="Ajouter sous-groupe"
                    icon="pi pi-folder-plus"
                    @click="addChildGroup(item)"
                    class="p-button-sm p-button-success"
                  />
                  <Button
                    label="Ajouter champ"
                    icon="pi pi-file-plus"
                    @click="addChildField(item)"
                    class="p-button-sm p-button-primary"
                  />
                </div>
              </div>

              <!-- Vue Tree pour les enfants -->
              <div v-if="getChildrenOf(item.field_id).length > 0" class="children-tree">
                <Tree
                  :key="`tree-${item.field_id}-${getChildrenOf(item.field_id).length}`"
                  :value="getChildrenTree(item.field_id)"
                  selectionMode="single"
                  v-model:selectionKeys="selectedNodeKey"
                  @nodeSelect="onNodeSelect"
                  class="column-tree"
                >
                  <template #default="{ node }">
                    <div class="tree-node-content">
                      <div class="node-info">
                        <i :class="node.data.is_column_group ? 'pi pi-folder' : 'pi pi-file'"></i>
                        <span class="node-label">{{ node.label }}</span>
                        <Tag
                          v-if="node.data.is_column_group"
                          :value="`${node.data.column_span || 0} col${node.data.column_span > 1 ? 's' : ''}`"
                          severity="info"
                          class="node-tag"
                        />
                        <Tag
                          v-else
                          :value="node.data.type"
                          severity="success"
                          class="node-tag"
                        />
                      </div>
                      <div class="node-actions">
                        <Button
                          icon="pi pi-pencil"
                          @click.stop="editItem(node.data)"
                          class="p-button-sm p-button-info p-button-rounded p-button-text"
                          v-tooltip.top="'Modifier'"
                        />
                        <Button
                          icon="pi pi-trash"
                          @click.stop="showDeleteConfirm(node.data)"
                          class="p-button-sm p-button-danger p-button-rounded p-button-text"
                          v-tooltip.top="'Supprimer'"
                        />
                      </div>
                    </div>
                  </template>
                </Tree>
              </div>
              <div v-else class="empty-children">
                <p>Aucun enfant. Ajoutez un sous-groupe ou un champ.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Message si aucun groupe/champ -->
        <div v-if="displayItems.length === 0" class="empty-state">
          <i class="pi pi-info-circle"></i>
          <p v-if="hideHeader">Aucun enfant défini</p>
          <p v-else>Aucun groupe ou champ racine défini</p>
          <p class="hint" v-if="!hideHeader">Créez un groupe racine ou un champ racine pour commencer</p>
        </div>
      </div>
    </div>

    <!-- Dialog d'édition -->
    <Dialog
      v-model:visible="showEditDialog"
      :header="editingItem ? (isNewItem ? (editingItem.is_column_group ? 'Nouveau groupe de colonnes' : 'Nouveau champ') : `Modifier ${editingItem.is_column_group ? 'le groupe' : 'le champ'} : ${editingItem.label}`) : ''"
      :style="{ width: '600px' }"
      :modal="true"
      :closable="true"
      @hide="cancelEdit"
    >
      <div v-if="editingItem" class="edit-dialog-content">
          <div class="form-field">
            <label>Libellé *</label>
            <InputText
              v-model="editingItem.label"
              placeholder="Ex: Production par équipe"
            />
          </div>

          <div class="form-field">
            <label>Identifiant (field_id) *</label>
            <InputText
              v-model="editingItem.field_id"
              placeholder="Ex: production_equipe"
              :disabled="!isNewItem"
            />
            <small v-if="!isNewItem" class="field-hint">L'identifiant ne peut pas être modifié</small>
          </div>

          <!-- Champs spécifiques aux groupes -->
          <template v-if="editingItem.is_column_group">
            <div class="form-field">
              <label>Niveau de groupement</label>
              <InputNumber
                v-model="editingItem.group_level"
                :min="1"
                :max="5"
                :disabled="true"
              />
              <small class="field-hint">Calculé automatiquement selon la position dans l'arbre</small>
            </div>

            <div class="form-field">
              <label>Nombre de colonnes (span)</label>
              <InputNumber
                v-model="editingItem.column_span"
                :min="1"
                :max="50"
              />
              <small class="field-hint">Nombre de colonnes enfants que ce groupe contient</small>
            </div>
          </template>

          <!-- Champs spécifiques aux champs de données -->
          <template v-else>
            <div class="form-field">
              <label>Type de champ *</label>
              <Select
                v-model="editingItem.type"
                :options="fieldTypeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un type"
              />
            </div>

            <div class="form-field">
              <div class="checkbox-field">
                <Checkbox
                  v-model="editingItem.required"
                  :binary="true"
                  inputId="required-check"
                />
                <label for="required-check">Champ obligatoire</label>
              </div>
            </div>

            <div class="form-field">
              <div class="checkbox-field">
                <Checkbox
                  v-model="editingItem.repeatable"
                  :binary="true"
                  inputId="repeatable-check"
                />
                <label for="repeatable-check">Champ répétable</label>
              </div>
            </div>

            <template v-if="editingItem.repeatable">
              <div class="form-field">
                <label>Nombre de répétitions</label>
                <InputNumber
                  v-model="editingItem.repetitions"
                  :min="1"
                  :max="20"
                />
              </div>

              <div class="form-field">
                <label>Libellé des répétitions</label>
                <InputText
                  v-model="editingItem.repetition_label"
                  placeholder="Ex: Horaire, Point, Machine"
                />
              </div>
            </template>

          </template>

          <div class="form-field">
            <label>Ordre d'affichage</label>
            <InputNumber
              v-model="editingItem.group_order"
              :min="0"
            />
            <small class="field-hint">Ordre dans le groupe parent (de gauche à droite)</small>
        </div>
          </div>

      <template #footer>
            <Button
              label="Annuler"
              icon="pi pi-times"
              @click="cancelEdit"
              class="p-button-text"
            />
            <Button
              label="Sauvegarder"
              icon="pi pi-check"
              @click="saveItem"
              class="p-button-primary"
            />
      </template>
    </Dialog>

    <!-- Dialog de confirmation de suppression -->
    <Dialog
      v-model:visible="showDeleteDialog"
      modal
      :header="itemToDelete?.is_column_group ? 'Supprimer le groupe' : 'Supprimer le champ'"
      :style="{ width: '450px' }"
      :closable="true"
    >
      <div class="delete-dialog-content">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: #e74c3c; margin-bottom: 1rem;"></i>
        <p v-if="itemToDelete">
          Êtes-vous sûr de vouloir supprimer <strong>"{{ itemToDelete.label }}"</strong> ?
        </p>
        <p v-if="itemToDelete && hasChildren(itemToDelete)" class="warning-text">
          <i class="pi pi-info-circle"></i>
          Cet élément contient des sous-éléments qui seront également supprimés.
        </p>
      </div>
      <template #footer>
        <Button
          label="Annuler"
          icon="pi pi-times"
          @click="cancelDelete"
          class="p-button-text"
        />
        <Button
          label="Supprimer"
          icon="pi pi-trash"
          @click="confirmDelete"
          class="p-button-danger"
          autofocus
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Tree from 'primevue/tree'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  hideHeader: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const toast = useToast()

// State
const columnGroups = ref([])
const editingItem = ref(null)
const isNewItem = ref(false)
const selectedNodeKey = ref({})
const showDeleteDialog = ref(false)
const itemToDelete = ref(null)
const showEditDialog = ref(false)
const isInternalUpdate = ref(false)

// Field type options
const fieldTypeOptions = [
  { label: 'Texte', value: 'TEXT' },
  { label: 'Nombre', value: 'NUMBER' },
  { label: 'Date', value: 'DATE' },
  { label: 'Date et heure', value: 'DATETIME' },
  { label: 'Liste déroulante', value: 'SELECT' },
  { label: 'Case à cocher', value: 'CHECKBOX' }
]

// Computed: Build tree structure for Tree component
const treeNodes = computed(() => {
  console.log('🌳 Building tree nodes from columnGroups:', columnGroups.value.length, columnGroups.value)
  
  const buildTree = (items, parentId = null, level = 0) => {
    const filtered = items.filter(item => {
      // Pour les groupes racines, parent_group doit être null ou undefined
      const matches = parentId === null 
        ? (item.parent_group === null || item.parent_group === undefined)
        : item.parent_group === parentId
      
      return matches
    })
    
    console.log(`🌳 Level ${level}, parentId: ${parentId}, filtered items:`, filtered.length, filtered.map(i => i.label))
    
    return filtered
      .sort((a, b) => (a.group_order || 0) - (b.group_order || 0))
      .map(item => ({
        key: item.field_id,
        label: item.label || item.field_id,
        data: item,
        children: item.is_column_group ? buildTree(items, item.field_id, level + 1) : []
      }))
  }

  const result = buildTree(columnGroups.value)
  console.log('🌳 Final tree nodes:', result.length, result)
  return result
})


// Computed: Get root items (groups and fields without parent)
const rootItems = computed(() => {
  const items = columnGroups.value.filter(item => {
    // Accept null, undefined, or empty string as "no parent"
    return item.parent_group === null || item.parent_group === undefined || item.parent_group === ''
  })
  console.log('🌳 rootItems computed:', items.length, 'from', columnGroups.value.length, 'total items')
  console.log('🌳 All columnGroups:', columnGroups.value.map(c => ({ id: c.field_id, label: c.label, parent: c.parent_group })))
  return items.sort((a, b) => (a.group_order || 0) - (b.group_order || 0))
})

// Computed: Get items to display (root items if hideHeader is false, all items if hideHeader is true)
const displayItems = computed(() => {
  // If hideHeader is true, we're displaying children, so show all items
  if (props.hideHeader) {
    return columnGroups.value.sort((a, b) => (a.group_order || 0) - (b.group_order || 0))
  }
  // Otherwise, show only root items
  return rootItems.value
})

// Helper: Get children of a parent
const getChildrenOf = (parentId) => {
  return columnGroups.value
    .filter(item => item.parent_group === parentId)
    .sort((a, b) => (a.group_order || 0) - (b.group_order || 0))
}

// Helper: Build tree for children of a specific parent
const getChildrenTree = (parentId) => {
  const buildTree = (items, currentParentId) => {
    return items
      .filter(item => item.parent_group === currentParentId)
      .sort((a, b) => (a.group_order || 0) - (b.group_order || 0))
      .map(item => ({
        key: item.field_id,
        label: item.label || item.field_id,
        data: item,
        children: item.is_column_group ? buildTree(items, item.field_id) : []
      }))
  }
  
  return buildTree(columnGroups.value, parentId)
}

// Methods
const addRootGroup = () => {
  console.log('➕ Adding root group, current rootItems:', rootItems.value.length)
  const newGroup = {
    field_id: `group_${Date.now()}`,
    label: 'Nouveau groupe',
    type: 'TEXT', // Type par défaut pour les groupes
    is_column_group: true,
    parent_group: null,
    group_level: 0,
    column_span: 0,
    group_order: rootItems.value.length,
    required: false
  }

  console.log('➕ New group:', newGroup)
  columnGroups.value.push(newGroup)
  console.log('➕ columnGroups after push:', columnGroups.value.length, columnGroups.value)
  console.log('➕ rootItems after push:', rootItems.value.length, rootItems.value)
  
  // Force immediate emit without debounce
  isInternalUpdate.value = true
  const groupsCopy = JSON.parse(JSON.stringify(columnGroups.value))
  emit('update:modelValue', groupsCopy)
  emit('change', groupsCopy)
  isInternalUpdate.value = false
}

const addRootField = () => {
  console.log('➕ Adding root field, current rootItems:', rootItems.value.length)
  const newField = {
    field_id: `field_${Date.now()}`,
    label: 'Nouveau champ',
    type: 'TEXT',
    is_column_group: false,
    parent_group: null,
    group_level: 0,
    column_span: 1,
    group_order: rootItems.value.length,
    required: false,
    repeatable: false,
    repetitions: 1,
    repetition_label: ''
  }

  console.log('➕ New field:', newField)
  columnGroups.value.push(newField)
  console.log('➕ columnGroups after push:', columnGroups.value.length, columnGroups.value)
  console.log('➕ rootItems after push:', rootItems.value.length, rootItems.value)
  
  // Force immediate emit without debounce
  isInternalUpdate.value = true
  const groupsCopy = JSON.parse(JSON.stringify(columnGroups.value))
  emit('update:modelValue', groupsCopy)
  emit('change', groupsCopy)
  isInternalUpdate.value = false
}

const addChildGroup = (parentGroup) => {
  const newItem = {
    field_id: `group_${Date.now()}`,
    label: 'Nouveau sous-groupe',
    type: 'TEXT',
    is_column_group: true,
    parent_group: parentGroup.field_id,
    group_level: (parentGroup.group_level || 0) + 1,
    column_span: 0,
    group_order: columnGroups.value.filter(c => c.parent_group === parentGroup.field_id).length,
    required: false
  }

  editingItem.value = newItem
  isNewItem.value = true
  showEditDialog.value = true
}

const addChildField = (parentGroup) => {
  const newItem = {
    field_id: `field_${Date.now()}`,
    label: 'Nouveau champ',
    type: 'TEXT',
    is_column_group: false,
    parent_group: parentGroup.field_id,
    group_level: (parentGroup.group_level || 0) + 1,
    column_span: 1,
    group_order: columnGroups.value.filter(c => c.parent_group === parentGroup.field_id).length,
    required: false,
    repeatable: false,
    repetitions: 1,
    repetition_label: ''
  }

  editingItem.value = newItem
  isNewItem.value = true
  showEditDialog.value = true
}

const editItem = (item) => {
  editingItem.value = { ...item }
  isNewItem.value = false
  showEditDialog.value = true
}

const showDeleteConfirm = (item) => {
  itemToDelete.value = item
  showDeleteDialog.value = true
}

const confirmDelete = () => {
  if (!itemToDelete.value) return

  const item = itemToDelete.value

  // Remove item and all its children recursively
  const removeRecursive = (fieldId) => {
    const children = columnGroups.value.filter(c => c.parent_group === fieldId)
    children.forEach(child => removeRecursive(child.field_id))
    columnGroups.value = columnGroups.value.filter(c => c.field_id !== fieldId)
  }

  removeRecursive(item.field_id)

  // Update parent's column_span if needed
  if (item.parent_group) {
    updateColumnSpan(item.parent_group)
  }

  emitChanges()

  // Clear editing if deleting the item being edited
  if (editingItem.value && editingItem.value.field_id === item.field_id) {
    editingItem.value = null
    isNewItem.value = false
  }

  showDeleteDialog.value = false
  itemToDelete.value = null

  toast.add({
    severity: 'success',
    summary: 'Supprimé',
    detail: `"${item.label}" a été supprimé`,
    life: 3000
  })
}

const cancelDelete = () => {
  showDeleteDialog.value = false
  itemToDelete.value = null
}

const hasChildren = (item) => {
  return columnGroups.value.some(c => c.parent_group === item.field_id)
}

const handleReorder = (draggedId, targetId, position) => {
  const draggedItem = columnGroups.value.find(c => c.field_id === draggedId)
  const targetItem = columnGroups.value.find(c => c.field_id === targetId)
  
  if (!draggedItem || !targetItem) return
  
  // Prevent dropping a parent into its own child
  if (isDescendant(draggedItem.field_id, targetItem.field_id)) {
    toast.add({
      severity: 'warn',
      summary: 'Opération invalide',
      detail: 'Impossible de déplacer un parent dans son propre enfant',
      life: 3000
    })
    return
  }
  
  // Update parent_group and group_level
  draggedItem.parent_group = targetItem.is_column_group ? targetItem.field_id : targetItem.parent_group
  draggedItem.group_level = targetItem.is_column_group ? (targetItem.group_level + 1) : targetItem.group_level
  
  // Update group_order
  const siblings = columnGroups.value.filter(c => c.parent_group === draggedItem.parent_group)
  const targetIndex = siblings.findIndex(s => s.field_id === targetId)
  const newOrder = position === 'after' ? targetIndex + 1 : targetIndex
  
  siblings.forEach((sib, idx) => {
    if (sib.field_id === draggedId) {
      sib.group_order = newOrder
    } else if (idx >= newOrder && sib.field_id !== draggedId) {
      sib.group_order = idx + 1
    } else {
      sib.group_order = idx
    }
  })
  
  // Update column spans
  updateColumnSpan(draggedItem.parent_group)
  if (targetItem.parent_group) {
    updateColumnSpan(targetItem.parent_group)
  }
  
  // Recursively update group_level for all descendants
  updateDescendantsLevel(draggedItem.field_id)
  
  emitChanges()
  
  toast.add({
    severity: 'success',
    summary: 'Déplacé',
    detail: `"${draggedItem.label}" a été déplacé`,
    life: 2000
  })
}

const saveItem = () => {
  // Validation
  if (!editingItem.value || !editingItem.value.label || !editingItem.value.field_id) {
    toast.add({
      severity: 'error',
      summary: 'Erreur de validation',
      detail: 'Le libellé et l\'identifiant sont obligatoires',
      life: 3000
    })
    return
  }

  // Check for duplicate field_id
  if (isNewItem.value && columnGroups.value.some(c => c.field_id === editingItem.value.field_id)) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Cet identifiant existe déjà',
      life: 3000
    })
    return
  }

  // Save reference to parent_group before clearing editingItem
  const savedParentGroup = editingItem.value.parent_group

  if (isNewItem.value) {
    columnGroups.value.push({ ...editingItem.value })
  } else {
    const index = columnGroups.value.findIndex(c => c.field_id === editingItem.value.field_id)
    if (index !== -1) {
      columnGroups.value[index] = { ...editingItem.value }
    }
  }

  // Update parent's column_span
  if (savedParentGroup) {
    updateColumnSpan(savedParentGroup)
  }

  emitChanges()

  // Clear editing state
  editingItem.value = null
  isNewItem.value = false
  showEditDialog.value = false

  toast.add({
    severity: 'success',
    summary: 'Sauvegardé',
    detail: 'Les modifications ont été enregistrées',
    life: 3000
  })
}

const cancelEdit = () => {
  editingItem.value = null
  isNewItem.value = false
  showEditDialog.value = false
}

const updateColumnSpan = (parentFieldId) => {
  const parent = columnGroups.value.find(c => c.field_id === parentFieldId)
  if (!parent || !parent.is_column_group) return

  const children = columnGroups.value.filter(c => c.parent_group === parentFieldId)

  let totalSpan = 0
  children.forEach(child => {
    if (child.is_column_group) {
      totalSpan += child.column_span || 1
    } else if (child.repeatable) {
      totalSpan += child.repetitions || 1
    } else {
      totalSpan += 1
    }
  })

  parent.column_span = totalSpan

  // Recursively update parent's parent
  if (parent.parent_group) {
    updateColumnSpan(parent.parent_group)
  }
}

const onNodeSelect = (node) => {
  editItem(node.data)
}

const onNodeExpand = (node) => {
  // Handle node expansion if needed
}

const onNodeCollapse = (node) => {
  // Handle node collapse if needed
}

let draggedNode = null

const onNodeDragStart = (event) => {
  draggedNode = event.node
}

const onNodeDragEnd = (event) => {
  draggedNode = null
}

const onNodeDrop = (event) => {
  const droppedNode = event.dragNode
  const dropNode = event.dropNode
  const dropIndex = event.dropIndex

  if (!droppedNode || !dropNode) return

  const droppedItem = columnGroups.value.find(c => c.field_id === droppedNode.key)
  const dropItem = columnGroups.value.find(c => c.field_id === dropNode.key)

  if (!droppedItem || !dropItem) return

  // Prevent dropping a parent into its own child
  if (isDescendant(droppedItem.field_id, dropItem.field_id)) {
    toast.add({
      severity: 'warn',
      summary: 'Opération invalide',
      detail: 'Impossible de déplacer un parent dans son propre enfant',
      life: 3000
    })
    return
  }

  // Update parent_group and group_level
  droppedItem.parent_group = dropItem.is_column_group ? dropItem.field_id : dropItem.parent_group
  droppedItem.group_level = dropItem.is_column_group ? (dropItem.group_level + 1) : dropItem.group_level

  // Update group_order based on drop position
  const siblings = columnGroups.value.filter(c => c.parent_group === droppedItem.parent_group)
  siblings.forEach((sib, idx) => {
    sib.group_order = idx
  })

  // Update column spans for affected parents
  updateColumnSpan(droppedItem.parent_group)
  if (dropItem.parent_group) {
    updateColumnSpan(dropItem.parent_group)
  }

  // Recursively update group_level for all descendants
  updateDescendantsLevel(droppedItem.field_id)

  emitChanges()

  toast.add({
    severity: 'success',
    summary: 'Déplacé',
    detail: `"${droppedItem.label}" a été déplacé`,
    life: 2000
  })
}

const isDescendant = (parentFieldId, childFieldId) => {
  let current = columnGroups.value.find(c => c.field_id === childFieldId)

  while (current) {
    if (current.field_id === parentFieldId) return true
    current = columnGroups.value.find(c => c.field_id === current.parent_group)
  }

  return false
}

const updateDescendantsLevel = (fieldId) => {
  const parent = columnGroups.value.find(c => c.field_id === fieldId)
  if (!parent) return

  const children = columnGroups.value.filter(c => c.parent_group === fieldId)
  children.forEach(child => {
    child.group_level = parent.group_level + 1
    updateDescendantsLevel(child.field_id)
  })
}

const emitChanges = () => {
  // Set flag to prevent watch from resetting our changes
  isInternalUpdate.value = true
  // Emit a deep copy to ensure reactivity
  const groupsCopy = JSON.parse(JSON.stringify(columnGroups.value))
  emit('update:modelValue', groupsCopy)
  emit('change', groupsCopy)
}

// Watch rootItems changes to emit updates when inline forms are modified (debounced)
let emitTimeout = null
watch(rootItems, () => {
  // Skip if this is an internal update (we're syncing from props)
  if (isInternalUpdate.value) {
    return
  }
  
  // Debounce to avoid too many emissions
  if (emitTimeout) clearTimeout(emitTimeout)
  emitTimeout = setTimeout(() => {
    emitChanges()
  }, 500)
}, { deep: true })

// Initialize from modelValue - only sync if the arrays are actually different
// Use a flag to prevent infinite loops when emitting changes
watch(() => props.modelValue, (newValue) => {
  // Skip if this is an internal update (we're emitting the change)
  if (isInternalUpdate.value) {
    isInternalUpdate.value = false
    return
  }
  
  if (newValue && Array.isArray(newValue)) {
    // Only update if the arrays are different (by comparing lengths and IDs)
    const currentIds = columnGroups.value.map(c => c.field_id).sort().join(',')
    const newIds = newValue.map(c => c.field_id).sort().join(',')
    
    console.log('🔄 Watch modelValue:', {
      currentLength: columnGroups.value.length,
      newLength: newValue.length,
      currentIds,
      newIds,
      shouldUpdate: currentIds !== newIds || columnGroups.value.length !== newValue.length
    })
    
    if (currentIds !== newIds || columnGroups.value.length !== newValue.length) {
      console.log('🔄 Updating columnGroups from modelValue')
      columnGroups.value = JSON.parse(JSON.stringify(newValue))
    }
  } else if (!newValue && columnGroups.value.length > 0) {
    // Only clear if we have data and newValue is empty/null
    console.log('🔄 Clearing columnGroups (newValue is empty)')
    columnGroups.value = []
  }
}, { immediate: true })

onMounted(() => {
  // Initialization if needed
})
</script>

<style scoped lang="scss">
.column-group-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9fa;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-bottom: 2px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .header-info {
    display: flex;
    align-items: center;
    gap: 1rem;

    i {
      font-size: 2rem;
      color: #3b82f6;
    }

    h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #2c3e50;
    }

    p {
      margin: 0;
      color: #6c757d;
      font-size: 0.875rem;
    }
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .view-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    label {
      font-size: 0.875rem;
      color: #6c757d;
      font-weight: 500;
    }
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }
}

.manager-content {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.root-items-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #6c757d;
    text-align: center;
    background: white;
    border-radius: 8px;
    border: 1px solid #e9ecef;

    i {
      font-size: 3rem;
      color: #cbd5e1;
      margin-bottom: 1rem;
    }

    p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
    }

    .hint {
      color: #94a3b8;
      font-size: 0.75rem;
    }
  }
}

.root-item-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;

  .item-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    font-size: 1rem;
    color: #2c3e50;

    i {
      font-size: 1.25rem;
      color: #3b82f6;
    }
  }
}

.item-form {
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-weight: 500;
      font-size: 0.875rem;
      color: #495057;
    }

    .field-hint {
      font-size: 0.75rem;
      color: #6c757d;
      margin-top: -0.25rem;
    }

    .checkbox-field {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;

      label {
        font-weight: normal;
        margin: 0;
      }
    }
  }
}

.item-children-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e9ecef;

  .children-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    span {
      font-weight: 600;
      color: #495057;
    }

    .children-actions {
      display: flex;
      gap: 0.5rem;
    }
  }

  .children-tree {
    margin-top: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .empty-children {
    padding: 1rem;
    text-align: center;
    color: #6c757d;
    font-size: 0.875rem;
    background: #f8f9fa;
    border-radius: 4px;
  }
}

.tree-view {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  padding: 1rem;
  overflow-y: auto;
  flex: 1;

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #6c757d;
    text-align: center;

    i {
      font-size: 3rem;
      color: #cbd5e1;
      margin-bottom: 1rem;
    }

    p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
    }

    .hint {
      color: #94a3b8;
      font-size: 0.75rem;
    }
  }
}

.column-tree {
  :deep(.p-tree) {
    border: none;
    padding: 0;
  }

  :deep(.p-tree-node-content) {
    padding: 0;
  }

  :deep(.p-tree-node-content:hover) {
    background: #f1f5f9;
  }

  :deep(.p-tree-node-dragover) {
    background: #dbeafe !important;
    border: 2px dashed #3b82f6;
  }

  :deep(.p-tree-dragpoint-top),
  :deep(.p-tree-dragpoint-bottom) {
    background: #3b82f6;
    height: 2px;
  }
}

.tree-node-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: #f8f9fa;
  }

  .node-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;

    i {
      color: #3b82f6;
    }

    .node-label {
      font-weight: 500;
      color: #2c3e50;
    }

    .node-tag {
      font-size: 0.75rem;
    }
  }

  .node-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 1;
    margin-left: auto;
    align-items: center;

    .add-buttons-group {
      display: flex;
      gap: 0.25rem;
      margin-right: 0.5rem;
      padding-right: 0.5rem;
      border-right: 1px solid #e9ecef;
  }
}
}


.form-field {
  margin-bottom: 1.25rem;

  label {
    display: block;
    font-weight: 600;
    color: #495057;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  :deep(.p-inputtext),
  :deep(.p-select),
  :deep(.p-multiselect),
  :deep(.p-inputnumber) {
    width: 100%;
  }

  .field-hint {
    display: block;
    color: #6c757d;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    font-style: italic;
  }
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;

  label {
    margin: 0;
    font-weight: 500;
    cursor: pointer;
  }
}


.delete-dialog-content {
  text-align: center;
  padding: 1rem 0;

  p {
    margin: 0.5rem 0;
    color: #495057;
    line-height: 1.6;

    strong {
      color: #2c3e50;
  }
}

  .warning-text {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #fff3cd;
    border-radius: 6px;
    color: #856404;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;

    i {
      font-size: 1rem;
    }
  }
}

.edit-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  .form-field {
    margin-bottom: 0;
  }
}

</style>
