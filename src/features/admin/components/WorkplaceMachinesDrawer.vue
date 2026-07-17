<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :style="{ width: 'min(720px, 95vw)' }"
    class="machines-drawer"
  >
    <template #header>
      <div class="drawer-header">
        <div class="drawer-title-block">
          <h3>{{ workplace?.name }}</h3>
          <span class="drawer-subtitle">
            {{ workplace?.site_name }} -- {{ machines.length }} machine{{ machines.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </template>

    <div class="drawer-body">
      <!-- Assigned machines -->
      <div class="section">
        <div class="section-head">
          <span class="section-label">Machines assignees</span>
          <Button
            v-if="!showAssignPanel"
            label="Ajouter"
            icon="pi pi-plus"
            size="small"
            @click="showAssignPanel = true"
            class="btn-assign"
          />
        </div>

        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner"></i> Chargement...
        </div>

        <div v-else-if="machines.length === 0" class="empty-machines">
          <i class="pi pi-inbox"></i>
          <p>Aucune machine assignee a ce poste.</p>
          <Button
            label="Assigner des machines"
            icon="pi pi-plus"
            size="small"
            @click="showAssignPanel = true"
            class="btn-assign"
          />
        </div>

        <div v-else class="machine-list">
          <div
            v-for="machine in machines"
            :key="machine.id"
            class="machine-card"
          >
            <div class="machine-info">
              <div class="machine-name">
                <i :class="machine.type === 'ENGINE' ? 'pi pi-car' : 'pi pi-cog'"></i>
                {{ machine.name }}
              </div>
              <div class="machine-meta">
                <Tag
                  :value="statusLabel(machine.status)"
                  :severity="statusSeverity(machine.status)"
                  class="status-tag"
                />
                <span v-if="machine.serial_number" class="serial">{{ machine.serial_number }}</span>
              </div>
            </div>
            <div class="machine-actions">
              <Button
                icon="pi pi-arrow-right-arrow-left"
                text
                rounded
                size="small"
                v-tooltip.left="'Deplacer vers un autre poste'"
                @click="startMove(machine)"
                class="btn-move"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Assign panel -->
      <div v-if="showAssignPanel" class="section assign-section">
        <div class="section-head">
          <span class="section-label">Machines disponibles</span>
          <Button
            icon="pi pi-times"
            text
            rounded
            size="small"
            @click="showAssignPanel = false; selectedAvailable = []"
          />
        </div>

        <div class="assign-search">
          <InputText
            v-model="availableSearch"
            placeholder="Rechercher une machine..."
            style="width:100%"
          />
        </div>

        <div v-if="filteredAvailable.length === 0" class="empty-machines">
          <p>Aucune machine disponible a assigner.</p>
        </div>

        <div v-else class="machine-list">
          <div
            v-for="machine in filteredAvailable"
            :key="machine.id"
            class="machine-card machine-card--available"
            :class="{ 'machine-card--selected': selectedAvailable.includes(machine.id) }"
            @click="toggleSelect(machine.id)"
          >
            <div class="machine-info">
              <div class="machine-name">
                <i :class="machine.type === 'ENGINE' ? 'pi pi-car' : 'pi pi-cog'"></i>
                {{ machine.name }}
              </div>
              <div class="machine-meta">
                <Tag
                  :value="statusLabel(machine.status)"
                  :severity="statusSeverity(machine.status)"
                  class="status-tag"
                />
                <span class="from-workplace">{{ machine.workplace_name }}</span>
              </div>
            </div>
            <div class="machine-check">
              <i :class="selectedAvailable.includes(machine.id) ? 'pi pi-check-circle' : 'pi pi-circle'" />
            </div>
          </div>
        </div>

        <div v-if="selectedAvailable.length > 0" class="assign-footer">
          <Button
            :label="`Assigner ${selectedAvailable.length} machine${selectedAvailable.length > 1 ? 's' : ''}`"
            icon="pi pi-check"
            @click="assignMachines"
            :loading="assigning"
            class="btn-confirm-assign"
          />
        </div>
      </div>

      <!-- Move dialog -->
      <Dialog
        v-model:visible="showMoveDialog"
        :modal="true"
        :style="{ width: 'min(440px, 90vw)' }"
        class="move-dialog"
      >
        <template #header>
          <span class="modal-title">Deplacer "{{ movingMachine?.name }}"</span>
        </template>
        <div class="move-form">
          <label>Poste de charge cible</label>
          <Select
            v-model="moveTarget"
            :options="otherWorkplaces"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner un poste"
            style="width:100%"
          />
        </div>
        <template #footer>
          <Button label="Annuler" text @click="showMoveDialog = false" />
          <Button
            label="Deplacer"
            icon="pi pi-arrow-right-arrow-left"
            @click="confirmMove"
            :loading="moving"
            :disabled="!moveTarget"
            class="btn-confirm-assign"
          />
        </template>
      </Dialog>
    </div>
  </Drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { axiosInstance } from '@/main'

const props = defineProps({
  workplaceId: { type: Number, default: null },
  workplace: { type: Object, default: null },
  allWorkplaces: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:visible', 'refresh'])

const toast = useToast()
const visible = ref(false)
const loading = ref(false)
const assigning = ref(false)
const moving = ref(false)
const machines = ref([])
const available = ref([])
const showAssignPanel = ref(false)
const availableSearch = ref('')
const selectedAvailable = ref([])
const showMoveDialog = ref(false)
const movingMachine = ref(null)
const moveTarget = ref(null)

const otherWorkplaces = computed(() =>
  props.allWorkplaces
    .filter(w => w.id !== props.workplaceId)
    .map(w => ({ label: `${w.name} (${w.site_name || ''})`, value: w.id }))
)

const filteredAvailable = computed(() => {
  if (!availableSearch.value) return available.value
  const q = availableSearch.value.toLowerCase()
  return available.value.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.serial_number?.toLowerCase().includes(q) ||
    m.workplace_name?.toLowerCase().includes(q)
  )
})

const statusLabel = (s) => {
  const map = { ACTIVE: 'Actif', INACTIVE: 'Inactif', MAINTENANCE: 'Maintenance', BREAKDOWN: 'Panne', DEGRADED: 'Degrade', STOPPED: 'Arrete', OUT_OF_ORDER: 'Hors service' }
  return map[s] || s
}

const statusSeverity = (s) => {
  const map = { ACTIVE: 'success', INACTIVE: 'secondary', MAINTENANCE: 'warn', BREAKDOWN: 'danger', DEGRADED: 'warn', STOPPED: 'secondary', OUT_OF_ORDER: 'danger' }
  return map[s] || 'info'
}

const open = async (workplaceId) => {
  visible.value = true
  showAssignPanel.value = false
  selectedAvailable.value = []
  availableSearch.value = ''
  await loadMachines(workplaceId)
}

const loadMachines = async (wpId) => {
  loading.value = true
  try {
    const { data } = await axiosInstance.get(`/accounts/workplaces/${wpId}/machines/`)
    if (data.success) {
      machines.value = data.machines || []
      available.value = data.available || []
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les machines', life: 3000 })
  } finally {
    loading.value = false
  }
}

const toggleSelect = (id) => {
  const idx = selectedAvailable.value.indexOf(id)
  if (idx >= 0) selectedAvailable.value.splice(idx, 1)
  else selectedAvailable.value.push(id)
}

const assignMachines = async () => {
  assigning.value = true
  try {
    const { data } = await axiosInstance.post(`/accounts/workplaces/${props.workplaceId}/machines/`, {
      machine_ids: selectedAvailable.value
    })
    if (data.success) {
      toast.add({ severity: 'success', summary: 'Succès', detail: data.message, life: 3000 })
      selectedAvailable.value = []
      showAssignPanel.value = false
      await loadMachines(props.workplaceId)
      emit('refresh')
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'assigner les machines', life: 3000 })
  } finally {
    assigning.value = false
  }
}

const startMove = (machine) => {
  movingMachine.value = machine
  moveTarget.value = null
  showMoveDialog.value = true
}

const confirmMove = async () => {
  moving.value = true
  try {
    const { data } = await axiosInstance.delete(`/accounts/workplaces/${props.workplaceId}/machines/`, {
      data: {
        machine_ids: [movingMachine.value.id],
        target_workplace_id: moveTarget.value
      }
    })
    if (data.success) {
      toast.add({ severity: 'success', summary: 'Succès', detail: data.message, life: 3000 })
      showMoveDialog.value = false
      await loadMachines(props.workplaceId)
      emit('refresh')
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de deplacer la machine', life: 3000 })
  } finally {
    moving.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.drawer-header { display: flex; align-items: center; gap: 0.75rem; }
.drawer-title-block h3 { font-size: 1.1rem; font-weight: 700; color: #0B2B3C; margin: 0; }
.drawer-subtitle { font-size: 0.8rem; color: #94a3b8; }

.drawer-body { display: flex; flex-direction: column; gap: 1.5rem; }

.section { display: flex; flex-direction: column; gap: 0.75rem; }
.section-head { display: flex; justify-content: space-between; align-items: center; }
.section-label { font-size: 0.8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

.loading-state { text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.875rem; }
.loading-state i { margin-right: 0.5rem; }

.empty-machines { text-align: center; padding: 2rem 1rem; color: #94a3b8; }
.empty-machines i { font-size: 2rem; margin-bottom: 0.5rem; display: block; }
.empty-machines p { font-size: 0.875rem; margin: 0.5rem 0; }

.machine-list { display: flex; flex-direction: column; gap: 0.5rem; }

.machine-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  background: #fafbfc;
  transition: all 0.15s;
}
.machine-card:hover { border-color: #e2e8f0; background: white; }

.machine-card--available { cursor: pointer; }
.machine-card--available:hover { border-color: #7AC943; }
.machine-card--selected { border-color: #7AC943; background: rgba(122,201,67,0.05); }

.machine-info { display: flex; flex-direction: column; gap: 0.3rem; min-width: 0; }
.machine-name { font-weight: 500; color: #1e293b; font-size: 0.875rem; display: flex; align-items: center; gap: 0.4rem; }
.machine-name i { color: #94a3b8; font-size: 0.8rem; }
.machine-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

.status-tag { font-size: 0.7rem !important; padding: 2px 8px !important; }
.serial { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }
.from-workplace { font-size: 0.75rem; color: #94a3b8; }

.machine-actions { flex-shrink: 0; }
.btn-move { color: #64748b !important; }
.btn-move:hover { color: #7AC943 !important; }

.machine-check { flex-shrink: 0; font-size: 1.1rem; }
.machine-check .pi-check-circle { color: #7AC943; }
.machine-check .pi-circle { color: #cbd5e1; }

.assign-section { border-top: 1px solid #f1f5f9; padding-top: 1rem; }
.assign-search { margin-bottom: 0.5rem; }

.assign-footer {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 0.75rem 0;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
}

.btn-assign { background: transparent !important; border: 1px solid #7AC943 !important; color: #7AC943 !important; font-weight: 600; font-size: 0.8rem; }
.btn-assign:hover { background: rgba(122,201,67,0.05) !important; }

.btn-confirm-assign { background: #7AC943 !important; border-color: #7AC943 !important; color: white !important; font-weight: 600; }
.btn-confirm-assign:hover { background: #6bb835 !important; }

.modal-title { font-size: 1rem; font-weight: 600; color: #1e293b; }
.move-form { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.5rem 0; }
.move-form label { font-size: 0.8rem; font-weight: 500; color: #475569; }

@media (max-width: 480px) {
  .drawer-title-block h3 { font-size: 1rem; }
  .machine-card { padding: 0.625rem 0.75rem; }
  .machine-name { font-size: 0.8rem; }
  .section-head { flex-wrap: wrap; gap: 0.5rem; }
  .assign-footer { justify-content: stretch; }
  .assign-footer .btn-confirm-assign { width: 100%; }
}
</style>
