<template>
  <div class="seuils-configuration">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <i class="pi pi-sliders-h"></i>
          <h1>Configuration des seuils d'alerte</h1>
        </div>
        <p class="header-subtitle">Définissez vos seuils d'avertissement et critiques par module.</p>
      </div>
      <div class="header-actions">
        <Button
          label="Notifications"
          icon="pi pi-bell"
          text
          severity="secondary"
          @click="notificationModalVisible = true"
        />
        <Button 
          label="Réinitialiser les défauts" 
          icon="pi pi-refresh"
          text
          severity="secondary"
          @click="resetDefaults"
        />
        <Button 
          label="Sauvegarder" 
          icon="pi pi-save"
          @click="saveSeuils"
          :loading="loading"
        />
      </div>
    </div>

    <div class="selector-shell">
      <div class="module-picker">
        <button
          v-for="module in moduleOptions"
          :key="module.code"
          type="button"
          class="module-pill"
          :class="{ active: selectedModule === module.code }"
          @click="selectedModule = module.code"
        >
          <i :class="module.icon"></i>
          <span>{{ module.label }}</span>
        </button>
      </div>
    </div>

    <div class="panel-stage">
      <Transition name="fade-slide" mode="out-in">
        <div :key="selectedModule" class="visible-panel">
          <div v-show="selectedModule === 'MES'" ref="mesPanelRef">
            <MESSeuilsPanel />
          </div>
          <div v-show="selectedModule === 'ENGINS'" ref="enginsPanelRef">
            <EnginsSeuilsPanel />
          </div>
          <div v-show="selectedModule === 'STOCK'" ref="stockPanelRef">
            <StockSeuilsPanel />
          </div>
          <div v-show="selectedModule === 'TEAM'" ref="teamPanelRef">
            <TeamSeuilsPanel />
          </div>
          <div v-show="selectedModule === 'ROI'" ref="roiPanelRef">
            <ROISeuilsPanel />
          </div>
          <div v-show="selectedModule === 'COLLECTE'" ref="collectePanelRef">
            <CollecteSeuilsPanel />
          </div>
        </div>
      </Transition>
    </div>

    <Dialog
      v-model:visible="notificationModalVisible"
      modal
      class="notifications-modal"
      :draggable="false"
      :closable="true"
      :style="{ width: 'min(920px, 96vw)' }"
      :header="`Notifications - ${selectedModuleLabel}`"
    >
      <div class="modal-body">
        <div class="modal-topbar">
          <div class="module-badge">
            <i class="pi pi-sitemap"></i>
            <span>{{ selectedModuleLabel }}</span>
          </div>
          <div class="quick-stats">
            <span class="stat-pill">
              <i class="pi pi-envelope"></i>
              {{ activeRecipientCount }} mail
            </span>
            <span class="stat-pill">
              <i class="pi pi-whatsapp"></i>
              {{ activeWhatsappCount }} WhatsApp
            </span>
          </div>
        </div>

        <div class="modal-channels">
          <button
            type="button"
            class="channel-card"
            :class="{ active: isChannelActive(selectedModule, 'email') }"
            @click="toggleChannel(selectedModule, 'email')"
          >
            <div class="channel-main">
              <i class="pi pi-envelope"></i>
              <div>
                <strong>Mail</strong>
                <small>Envoyer les alertes par email</small>
              </div>
            </div>
            <span class="channel-state">{{ isChannelActive(selectedModule, 'email') ? 'Actif' : 'Inactif' }}</span>
          </button>
          <button
            type="button"
            class="channel-card"
            :class="{ active: isChannelActive(selectedModule, 'whatsapp') }"
            @click="toggleChannel(selectedModule, 'whatsapp')"
          >
            <div class="channel-main">
              <i class="pi pi-whatsapp"></i>
              <div>
                <strong>WhatsApp</strong>
                <small>Envoyer les alertes sur WhatsApp</small>
              </div>
            </div>
            <span class="channel-state">{{ isChannelActive(selectedModule, 'whatsapp') ? 'Actif' : 'Inactif' }}</span>
          </button>
        </div>

        <div v-if="isChannelActive(selectedModule, 'email')" class="recipients-box">
          <div class="recipients-head">
            <span><i class="pi pi-users"></i> Destinataires Mail</span>
            <small>{{ activeRecipientCount }} sélectionné(s)</small>
          </div>

          <div class="recipients-search-row">
            <input
              v-model="recipientSearch"
              type="text"
              placeholder="Rechercher une personne..."
            />
            <input
              v-model="manualRecipientEmail"
              type="email"
              placeholder="Ajouter un email"
              @keyup.enter="addManualRecipient"
            />
            <button type="button" class="add-email-btn" @click="addManualRecipient">
              Ajouter
            </button>
          </div>

          <div class="recipients-list" v-if="filteredUsers.length">
            <button
              v-for="user in filteredUsers"
              :key="user.id"
              type="button"
              class="recipient-chip"
              :class="{ active: isRecipientSelected(selectedModule, user.email_address) }"
              @click="toggleRecipient(selectedModule, user.email_address)"
            >
              <span class="recipient-name">{{ user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email_address }}</span>
              <span class="recipient-mail">{{ user.email_address }}</span>
            </button>
          </div>

          <div v-else class="empty-state">
            <i class="pi pi-info-circle"></i>
            Aucun utilisateur disponible pour cette recherche.
          </div>

          <div class="manual-recipients" v-if="manualRecipients.length">
            <span class="manual-title">Ajouts manuels :</span>
            <button
              v-for="email in manualRecipients"
              :key="email"
              type="button"
              class="manual-chip"
              @click="toggleRecipient(selectedModule, email)"
            >
              {{ email }}
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>

        <div v-if="isChannelActive(selectedModule, 'whatsapp')" class="whatsapp-box">
          <div class="recipients-head">
            <span><i class="pi pi-whatsapp"></i> Contacts WhatsApp</span>
            <small>{{ activeWhatsappCount }} contact(s)</small>
          </div>

          <div class="whatsapp-form-row">
            <input v-model="whatsappFirstName" type="text" placeholder="Prénom" />
            <input v-model="whatsappLastName" type="text" placeholder="Nom" />
            <input v-model="whatsappNumber" type="text" placeholder="Numéro WhatsApp (+225...)" @keyup.enter="addWhatsappRecipient" />
            <button type="button" class="add-email-btn" @click="addWhatsappRecipient">Ajouter</button>
          </div>

          <div class="whatsapp-list" v-if="activeWhatsappRecipients.length">
            <div v-for="contact in activeWhatsappRecipients" :key="`${contact.whatsapp_number}-${contact.first_name}-${contact.last_name}`" class="whatsapp-item">
              <div class="who">{{ contact.first_name }} {{ contact.last_name }}</div>
              <div class="phone">{{ contact.whatsapp_number }}</div>
              <button type="button" class="remove-btn" @click="removeWhatsappRecipient(selectedModule, contact.whatsapp_number)">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>

          <div v-else class="empty-state">
            <i class="pi pi-comments"></i>
            Aucun contact WhatsApp ajouté pour ce module.
          </div>
        </div>

        <div class="modal-actions">
          <Button label="Fermer" text severity="secondary" @click="notificationModalVisible = false" />
          <Button label="Enregistrer" icon="pi pi-check" @click="saveNotificationModal" />
        </div>
      </div>
    </Dialog>

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import { axiosInstance } from '@/main.js'
import MESSeuilsPanel from '../components/MESSeuilsPanel.vue'
import EnginsSeuilsPanel from '../components/EnginsSeuilsPanel.vue'
import StockSeuilsPanel from '../components/StockSeuilsPanel.vue'
import TeamSeuilsPanel from '../components/TeamSeuilsPanel.vue'
import ROISeuilsPanel from '../components/ROISeuilsPanel.vue'
import CollecteSeuilsPanel from '../components/CollecteSeuilsPanel.vue'

const KPI_ORDER = {
  MES: [
    { code: 'trs_global', name: 'TRS Global' },
    { code: 'disponibilite_equipements', name: 'Disponibilité équipements' },
    { code: 'performance_lignes', name: 'Performance Lignes' },
    { code: 'taux_qualite', name: 'Taux qualité' },
    { code: 'arrets_non_planifies', name: 'Arrets Non Planifies' },
    { code: 'temps_arret_total', name: 'Temps Arret Total' },
    { code: 'frequence_pannes', name: 'Frequence Pannes' },
    { code: 'taux_rebut', name: 'Taux Rebut' },
    { code: 'conformite_production', name: 'Conformité production' },
    { code: 'cout_non_qualite', name: 'Coût de non-qualité' },
    { code: 'production_horaire', name: 'Production Horaire' },
    { code: 'respect_planning', name: 'Respect Planning' },
  ],
  ENGINS: [
    { code: 'disponibilite_flotte', name: 'Disponibilité flotte' },
    { code: 'mtbf', name: 'MTBF' },
    { code: 'mttr', name: 'MTTR' },
    { code: 'consommation_horaire', name: 'Consommation Horaire' },
    { code: 'depenses_carburant', name: 'Depenses Carburant' },
    { code: 'interventions_maintenance', name: 'Interventions Maintenance' },
    { code: 'cout_maintenance', name: 'Cout Maintenance' },
    { code: 'heures_productives', name: 'Heures Productives' },
    { code: 'taux_utilisation', name: 'Taux Utilisation' },
  ],
  STOCK: [
    { code: 'niveau_stock_minimum', name: 'Niveau Stock Minimum' },
    { code: 'rotation_stock', name: 'Rotation Stock' },
    { code: 'obsolescence_stock', name: 'Obsolescence Stock' },
  ],
  TEAM: [
    { code: 'productivite_equipe', name: 'Productivite Equipe' },
    { code: 'qualite_equipe', name: 'Qualité équipe' },
    { code: 'absenteisme', name: 'Absenteisme' },
    { code: 'heures_supplementaires', name: 'Heures Supplementaires' },
  ],
  ROI: [
    { code: 'marge_brute', name: 'Marge Brute' },
    { code: 'roi_projets', name: 'ROI Projets' },
    { code: 'cout_operationnel', name: 'Cout Operationnel' },
    { code: 'delai_recuperation', name: 'Delai de Recuperation' },
  ],
  COLLECTE: [
    { code: 'taux_completude', name: 'Taux de Completude' },
    { code: 'anomalies_detectees', name: 'Anomalies Detectees' },
    { code: 'delai_synchronisation', name: 'Delai de Synchronisation' },
    { code: 'disponibilite_capteurs', name: 'Disponibilité des capteurs' },
    { code: 'volume_donnees_jour', name: 'Volume de données/jour' },
  ],
}

const moduleOptions = [
  { code: 'MES', label: 'KAP MES', icon: 'pi pi-cog' },
  { code: 'ENGINS', label: 'KAP Engins', icon: 'pi pi-truck' },
  { code: 'STOCK', label: 'KAP Stock', icon: 'pi pi-box' },
  { code: 'TEAM', label: 'KAP Team', icon: 'pi pi-users' },
  { code: 'ROI', label: 'KAP ROI', icon: 'pi pi-calculator' },
  { code: 'COLLECTE', label: 'KAP Collecte', icon: 'pi pi-cloud-upload' },
]

const ALLOWED_NOTIFICATION_CHANNELS = ['email', 'whatsapp']

const buildDefaultNotificationState = () => {
  return moduleOptions.reduce((acc, module) => {
    acc[module.code] = ['email']
    return acc
  }, {})
}

const buildDefaultRecipientsState = () => {
  return moduleOptions.reduce((acc, module) => {
    acc[module.code] = []
    return acc
  }, {})
}

const buildDefaultWhatsappState = () => {
  return moduleOptions.reduce((acc, module) => {
    acc[module.code] = []
    return acc
  }, {})
}

export default {
  name: 'SeuilsConfiguration',
  components: {
    Button,
    Dialog,
    Toast,
    MESSeuilsPanel,
    EnginsSeuilsPanel,
    StockSeuilsPanel,
    TeamSeuilsPanel,
    ROISeuilsPanel,
    CollecteSeuilsPanel,
  },
  setup() {
    const toast = useToast()
    const loading = ref(false)
    const notificationModalVisible = ref(false)
    const selectedModule = ref('MES')
    const moduleNotifications = ref(buildDefaultNotificationState())
    const moduleRecipients = ref(buildDefaultRecipientsState())
    const moduleWhatsappRecipients = ref(buildDefaultWhatsappState())
    const users = ref([])
    const recipientSearch = ref('')
    const manualRecipientEmail = ref('')
    const whatsappFirstName = ref('')
    const whatsappLastName = ref('')
    const whatsappNumber = ref('')
    const mesPanelRef = ref(null)
    const enginsPanelRef = ref(null)
    const stockPanelRef = ref(null)
    const teamPanelRef = ref(null)
    const roiPanelRef = ref(null)
    const collectePanelRef = ref(null)

    const panelByModule = {
      MES: mesPanelRef,
      ENGINS: enginsPanelRef,
      STOCK: stockPanelRef,
      TEAM: teamPanelRef,
      ROI: roiPanelRef,
      COLLECTE: collectePanelRef,
    }

    const getInputsForModule = (moduleCode) => {
      const panel = panelByModule[moduleCode]?.value
      if (!panel) return []
      return Array.from(panel.querySelectorAll('input[type="number"]'))
    }

    const applyValuesToInputs = (apiRows) => {
      const rowsByKey = new Map(apiRows.map((row) => [`${row.module_code}:${row.kpi_code}`, row]))

      Object.entries(KPI_ORDER).forEach(([moduleCode, kpis]) => {
        const inputs = getInputsForModule(moduleCode)
        kpis.forEach((kpi, index) => {
          const row = rowsByKey.get(`${moduleCode}:${kpi.code}`)
          if (!row) return

          const warningInput = inputs[index * 2]
          const criticalInput = inputs[index * 2 + 1]

          if (warningInput) warningInput.value = row.warning_threshold
          if (criticalInput) criticalInput.value = row.critical_threshold
        })
      })
    }

    const collectPayloadFromInputs = () => {
      const items = []

      Object.entries(KPI_ORDER).forEach(([moduleCode, kpis]) => {
        const channels = moduleNotifications.value[moduleCode] || ['email']
        const recipients = moduleRecipients.value[moduleCode] || []
        const whatsappRecipients = moduleWhatsappRecipients.value[moduleCode] || []
        if (!channels.length) {
          throw new Error(`Selectionnez au moins une notification pour ${moduleCode}`)
        }
        if (channels.includes('email') && !recipients.length) {
          throw new Error(`Selectionnez au moins un destinataire email pour ${moduleCode}`)
        }
        if (channels.includes('whatsapp') && !whatsappRecipients.length) {
          throw new Error(`Ajoutez au moins un contact WhatsApp pour ${moduleCode}`)
        }

        const inputs = getInputsForModule(moduleCode)
        kpis.forEach((kpi, index) => {
          const warningInput = inputs[index * 2]
          const criticalInput = inputs[index * 2 + 1]

          const warning = Number(warningInput?.value)
          const critical = Number(criticalInput?.value)

          if (!Number.isFinite(warning) || !Number.isFinite(critical)) {
            throw new Error(`Valeur invalide pour ${kpi.name}`)
          }
          if (warning < 0 || critical < 0) {
            throw new Error(`Valeurs negatives interdites pour ${kpi.name}`)
          }

          items.push({
            module_code: moduleCode,
            kpi_code: kpi.code,
            kpi_name: kpi.name,
            warning_threshold: warning,
            critical_threshold: critical,
            notification_channels: channels,
            email_recipients: recipients,
            whatsapp_recipients: whatsappRecipients,
          })
        })
      })

      return items
    }

    const isChannelActive = (moduleCode, channel) => {
      return (moduleNotifications.value[moduleCode] || []).includes(channel)
    }

    const toggleChannel = (moduleCode, channel) => {
      if (!ALLOWED_NOTIFICATION_CHANNELS.includes(channel)) return

      const current = [...(moduleNotifications.value[moduleCode] || ['email'])]
      const exists = current.includes(channel)

      if (exists) {
        if (current.length === 1) {
          toast.add({
            severity: 'warn',
            summary: 'Notification requise',
            detail: 'Au moins un canal doit rester actif.',
            life: 2500,
          })
          return
        }
        moduleNotifications.value[moduleCode] = current.filter((item) => item !== channel)
        return
      }

      moduleNotifications.value[moduleCode] = [...current, channel]
    }

    const hydrateNotificationsFromRows = (apiRows) => {
      const nextState = buildDefaultNotificationState()

      apiRows.forEach((row) => {
        const moduleCode = row?.module_code
        if (!moduleCode || !nextState[moduleCode]) return

        const sanitizedChannels = (row.notification_channels || []).filter((channel) =>
          ALLOWED_NOTIFICATION_CHANNELS.includes(channel)
        )

        if (sanitizedChannels.length) {
          const merged = new Set([...nextState[moduleCode], ...sanitizedChannels])
          nextState[moduleCode] = [...merged]
        }
      })

      Object.keys(nextState).forEach((moduleCode) => {
        if (!nextState[moduleCode].length) {
          nextState[moduleCode] = ['email']
        }
      })

      moduleNotifications.value = nextState
    }

    const hydrateRecipientsFromRows = (apiRows) => {
      const nextState = buildDefaultRecipientsState()

      apiRows.forEach((row) => {
        const moduleCode = row?.module_code
        if (!moduleCode || !nextState[moduleCode]) return

        const recipients = Array.isArray(row.email_recipients)
          ? row.email_recipients.map((email) => String(email).trim().toLowerCase()).filter(Boolean)
          : []

        if (recipients.length) {
          const merged = new Set([...nextState[moduleCode], ...recipients])
          nextState[moduleCode] = [...merged]
        }
      })

      moduleRecipients.value = nextState
    }

    const hydrateWhatsappRecipientsFromRows = (apiRows) => {
      const nextState = buildDefaultWhatsappState()

      apiRows.forEach((row) => {
        const moduleCode = row?.module_code
        if (!moduleCode || !nextState[moduleCode]) return

        const contacts = Array.isArray(row.whatsapp_recipients)
          ? row.whatsapp_recipients
              .map((entry) => ({
                first_name: String(entry?.first_name || '').trim(),
                last_name: String(entry?.last_name || '').trim(),
                whatsapp_number: String(entry?.whatsapp_number || '').trim(),
              }))
              .filter((entry) => entry.first_name && entry.last_name && entry.whatsapp_number)
          : []

        if (contacts.length) {
          nextState[moduleCode] = contacts
        }
      })

      moduleWhatsappRecipients.value = nextState
    }

    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get('/accounts/users/', { params: { page_size: 300 } })
        const rows = response.data?.results || response.data || []
        users.value = rows
          .filter((item) => item?.email_address)
          .map((item) => ({
            id: item.id,
            first_name: item.first_name,
            last_name: item.last_name,
            full_name: item.full_name,
            email_address: String(item.email_address).trim().toLowerCase(),
          }))
      } catch (error) {
        users.value = []
      }
    }

    const filteredUsers = computed(() => {
      const term = recipientSearch.value.trim().toLowerCase()
      if (!term) return users.value.slice(0, 30)

      return users.value
        .filter((user) => {
          const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase()
          return fullName.includes(term) || (user.email_address || '').includes(term)
        })
        .slice(0, 30)
    })

    const isRecipientSelected = (moduleCode, email) => {
      return (moduleRecipients.value[moduleCode] || []).includes(String(email).trim().toLowerCase())
    }

    const toggleRecipient = (moduleCode, email) => {
      const normalized = String(email || '').trim().toLowerCase()
      if (!normalized) return

      const current = [...(moduleRecipients.value[moduleCode] || [])]
      const exists = current.includes(normalized)
      moduleRecipients.value[moduleCode] = exists
        ? current.filter((item) => item !== normalized)
        : [...current, normalized]
    }

    const addManualRecipient = () => {
      const normalized = String(manualRecipientEmail.value || '').trim().toLowerCase()
      if (!normalized) return

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(normalized)) {
        toast.add({
          severity: 'warn',
          summary: 'Email invalide',
          detail: 'Entrez une adresse email valide.',
          life: 2500,
        })
        return
      }

      toggleRecipient(selectedModule.value, normalized)
      manualRecipientEmail.value = ''
    }

    const addWhatsappRecipient = () => {
      const first = String(whatsappFirstName.value || '').trim()
      const last = String(whatsappLastName.value || '').trim()
      const number = String(whatsappNumber.value || '').trim()

      if (!first || !last || !number) {
        toast.add({
          severity: 'warn',
          summary: 'Contact incomplet',
          detail: 'Prénom, nom et numéro WhatsApp sont requis.',
          life: 2500,
        })
        return
      }

      const phoneRegex = /^\+?[0-9]{8,15}$/
      if (!phoneRegex.test(number.replace(/\s+/g, ''))) {
        toast.add({
          severity: 'warn',
          summary: 'Numéro invalide',
          detail: 'Entrez un numéro WhatsApp valide.',
          life: 2500,
        })
        return
      }

      const sanitized = number.replace(/\s+/g, '')
      const current = [...(moduleWhatsappRecipients.value[selectedModule.value] || [])]
      if (current.some((contact) => contact.whatsapp_number === sanitized)) {
        toast.add({
          severity: 'warn',
          summary: 'Déjà ajouté',
          detail: 'Ce numéro WhatsApp existe déjà pour ce module.',
          life: 2500,
        })
        return
      }

      moduleWhatsappRecipients.value[selectedModule.value] = [
        ...current,
        { first_name: first, last_name: last, whatsapp_number: sanitized },
      ]

      whatsappFirstName.value = ''
      whatsappLastName.value = ''
      whatsappNumber.value = ''
    }

    const removeWhatsappRecipient = (moduleCode, whatsappNumberToRemove) => {
      moduleWhatsappRecipients.value[moduleCode] = (moduleWhatsappRecipients.value[moduleCode] || []).filter(
        (entry) => entry.whatsapp_number !== whatsappNumberToRemove
      )
    }

    const activeRecipientCount = computed(() => {
      return (moduleRecipients.value[selectedModule.value] || []).length
    })

    const activeWhatsappRecipients = computed(() => {
      return moduleWhatsappRecipients.value[selectedModule.value] || []
    })

    const activeWhatsappCount = computed(() => {
      return activeWhatsappRecipients.value.length
    })

    const selectedModuleLabel = computed(() => {
      const selected = moduleOptions.find((module) => module.code === selectedModule.value)
      return selected?.label || selectedModule.value
    })

    const saveNotificationModal = () => {
      const channels = moduleNotifications.value[selectedModule.value] || []
      if (channels.includes('email') && !(moduleRecipients.value[selectedModule.value] || []).length) {
        toast.add({
          severity: 'warn',
          summary: 'Mail requis',
          detail: 'Ajoutez au moins un destinataire mail.',
          life: 2500,
        })
        return
      }

      if (channels.includes('whatsapp') && !(moduleWhatsappRecipients.value[selectedModule.value] || []).length) {
        toast.add({
          severity: 'warn',
          summary: 'WhatsApp requis',
          detail: 'Ajoutez au moins un contact WhatsApp.',
          life: 2500,
        })
        return
      }

      notificationModalVisible.value = false
      toast.add({
        severity: 'success',
        summary: 'Notifications prêtes',
        detail: `Configuration enregistrée pour ${selectedModuleLabel.value}.`,
        life: 2200,
      })
    }

    const manualRecipients = computed(() => {
      const known = new Set(users.value.map((user) => user.email_address))
      return (moduleRecipients.value[selectedModule.value] || []).filter((email) => !known.has(email))
    })

    const loadSeuils = async () => {
      loading.value = true
      try {
        const response = await axiosInstance.get('/configuration/seuils/')
        const rows = response.data?.results || response.data || []
        await nextTick()
        applyValuesToInputs(rows)
        hydrateNotificationsFromRows(rows)
        hydrateRecipientsFromRows(rows)
        hydrateWhatsappRecipientsFromRows(rows)
      } catch (error) {
        toast.add({
          severity: 'warn',
          summary: 'Information',
          detail: 'Impossible de charger les seuils sauvegardes. Les valeurs par defaut sont affichees.',
          life: 3500,
        })
      } finally {
        loading.value = false
      }
    }

    const saveSeuils = async () => {
      loading.value = true
      try {
        const items = collectPayloadFromInputs()
        await axiosInstance.post('/configuration/seuils/', { items })
        toast.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Les seuils ont été sauvegardés avec succès',
          life: 3000
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error?.message || 'Erreur lors de la sauvegarde des seuils',
          life: 3000
        })
      } finally {
        loading.value = false
      }
    }

    const resetDefaults = async () => {
      if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les seuils aux valeurs par défaut ?')) {
        loading.value = true
        try {
          await axiosInstance.post('/configuration/seuils/reset/')
          toast.add({
            severity: 'info',
            summary: 'Réinitialisation',
            detail: 'Les seuils ont été réinitialisés aux valeurs par défaut',
            life: 3000
          })
          await loadSeuils()
        } catch (error) {
          toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la réinitialisation des seuils',
            life: 3000
          })
        } finally {
          loading.value = false
        }
      }
    }

    onMounted(async () => {
      await fetchUsers()
      await nextTick()
      await loadSeuils()
    })

    return {
      moduleOptions,
      selectedModule,
      selectedModuleLabel,
      notificationModalVisible,
      isChannelActive,
      toggleChannel,
      recipientSearch,
      manualRecipientEmail,
      addManualRecipient,
      filteredUsers,
      isRecipientSelected,
      toggleRecipient,
      activeRecipientCount,
      manualRecipients,
      whatsappFirstName,
      whatsappLastName,
      whatsappNumber,
      addWhatsappRecipient,
      removeWhatsappRecipient,
      activeWhatsappRecipients,
      activeWhatsappCount,
      saveNotificationModal,
      loading,
      mesPanelRef,
      enginsPanelRef,
      stockPanelRef,
      teamPanelRef,
      roiPanelRef,
      collectePanelRef,
      saveSeuils,
      resetDefaults,
    }
  },
}
</script>

<style scoped lang="scss">
.seuils-configuration {
  padding: 1.2rem;
  background:
    radial-gradient(circle at 0% 0%, rgba(15, 66, 131, 0.08), transparent 36%),
    radial-gradient(circle at 100% 10%, rgba(122, 201, 67, 0.1), transparent 30%),
    linear-gradient(135deg, #f7fafc 0%, #e9eff6 100%);
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    background: white;
    padding: 1rem 1.1rem;
    border-radius: 10px;
    border: 1px solid #d9e2ef;
    box-shadow: 0 10px 22px rgba(18, 40, 80, 0.08);

    .header-content {
      flex: 1;

      .header-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.2rem;

        i {
          color: #002060;
          font-size: 1rem;
        }

        h1 {
          font-size: 1.05rem;
          color: #002060;
          margin: 0;
          font-weight: 700;
        }
      }

      .header-subtitle {
        color: #666;
        margin: 0;
        font-size: 0.78rem;
      }
    }

    .header-actions {
      display: flex;
      gap: 0.55rem;

      @media (max-width: 768px) {
        flex-direction: column;
        width: 100%;
        margin-top: 1rem;

        :deep(.p-button) {
          width: 100%;
        }
      }
    }
  }

  .selector-shell {
    background: white;
    border-radius: 12px;
    border: 1px solid #d9e2ef;
    box-shadow: 0 18px 45px rgba(17, 41, 79, 0.08);
    padding: 0.9rem;
    margin-bottom: 0.85rem;

    .module-picker {
      display: grid;
      grid-template-columns: repeat(6, minmax(96px, 1fr));
      gap: 0.45rem;
      margin-bottom: 0.7rem;

      @media (max-width: 1200px) {
        grid-template-columns: repeat(3, minmax(100px, 1fr));
      }

      @media (max-width: 700px) {
        grid-template-columns: repeat(2, minmax(95px, 1fr));
      }

      .module-pill {
        border: 1px solid #d1deef;
        background: linear-gradient(180deg, #ffffff 0%, #f4f8fd 100%);
        color: #244d7c;
        border-radius: 10px;
        height: 42px;
        font-weight: 600;
        font-size: 0.8rem;
        letter-spacing: 0.2px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(25, 70, 126, 0.12);
        }

        &.active {
          background: linear-gradient(135deg, #0f3a75 0%, #0d4b97 100%);
          color: #ffffff;
          border-color: #0f3a75;
          box-shadow: 0 10px 24px rgba(15, 58, 117, 0.25);
        }

        i {
          font-size: 0.84rem;
        }
      }
    }

  }

  .panel-stage {
    background: #ffffff;
    border: 1px solid #d9e2ef;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(18, 40, 80, 0.08);
    padding: 1rem;
    overflow: hidden;
  }

  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: opacity 0.22s ease, transform 0.22s ease;
  }

  .fade-slide-enter-from,
  .fade-slide-leave-to {
    opacity: 0;
    transform: translateY(6px);
  }
}

:deep(.notifications-modal) {
  .p-dialog-header {
    background: linear-gradient(125deg, #0f2f63 0%, #184c93 100%);
    color: #ffffff;
    border-bottom: none;
    padding: 0.9rem 1rem;

    .p-dialog-title {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    .p-dialog-header-icon {
      color: #ffffff;
    }
  }

  .p-dialog-content {
    background: linear-gradient(180deg, #f5f8fd 0%, #eef4fb 100%);
    padding: 0.9rem 1rem 1rem;
  }

  .modal-body {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .modal-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
    flex-wrap: wrap;

    .module-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border-radius: 999px;
      background: #e4edf9;
      border: 1px solid #c4d5ee;
      color: #184c93;
      height: 30px;
      padding: 0 0.7rem;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .quick-stats {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;

      .stat-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.33rem;
        height: 28px;
        border-radius: 999px;
        background: #ffffff;
        border: 1px solid #d2deef;
        color: #4d6487;
        padding: 0 0.62rem;
        font-size: 0.74rem;
        font-weight: 600;
      }
    }
  }

  .modal-channels {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;

    @media (max-width: 720px) {
      grid-template-columns: 1fr;
    }
  }

  .channel-card {
    border: 1px solid #ccdaef;
    background: #ffffff;
    border-radius: 12px;
    padding: 0.55rem 0.68rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 18px rgba(36, 77, 124, 0.12);
    }

    .channel-main {
      display: inline-flex;
      align-items: center;
      gap: 0.52rem;

      i {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background: #edf4ff;
        color: #184c93;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      strong {
        display: block;
        font-size: 0.81rem;
        color: #1a3f6e;
      }

      small {
        display: block;
        font-size: 0.7rem;
        color: #6580a6;
        margin-top: 0.08rem;
      }
    }

    .channel-state {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.3px;
      color: #7a8faa;
      border: 1px solid #d6e1ef;
      border-radius: 999px;
      padding: 0.18rem 0.46rem;
      background: #f8fbff;
    }

    &.active {
      border-color: #0d4b97;
      background: linear-gradient(155deg, #eaf2ff 0%, #f3f8ff 100%);
      box-shadow: 0 10px 20px rgba(13, 75, 151, 0.18);

      .channel-main i {
        background: #0d4b97;
        color: #fff;
      }

      .channel-state {
        color: #0d4b97;
        border-color: #b7cae6;
        background: #fff;
      }
    }
  }

  .recipients-box,
  .whatsapp-box {
    border: 1px solid #d7e2f1;
    border-radius: 12px;
    background: #ffffff;
    padding: 0.75rem;
    box-shadow: 0 8px 18px rgba(36, 77, 124, 0.08);
  }

  .recipients-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.62rem;

    span {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.82rem;
      font-weight: 700;
      color: #1a3f6e;

      i {
        color: #0d4b97;
      }
    }

    small {
      color: #6f85a5;
      font-size: 0.72rem;
      font-weight: 600;
    }
  }

  .recipients-search-row,
  .whatsapp-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.45rem;
    margin-bottom: 0.55rem;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  .whatsapp-form-row {
    grid-template-columns: 1fr 1fr 1.3fr auto;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  input {
    height: 36px;
    border: 1px solid #d0dced;
    border-radius: 8px;
    background: #f9fbff;
    padding: 0 0.68rem;
    font-size: 0.78rem;

    &:focus {
      outline: none;
      border-color: #0d4b97;
      box-shadow: 0 0 0 2px rgba(13, 75, 151, 0.1);
    }
  }

  .add-email-btn {
    height: 36px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(145deg, #0d4b97 0%, #0b3f7f 100%);
    color: #fff;
    font-weight: 700;
    font-size: 0.75rem;
    padding: 0 0.85rem;
    cursor: pointer;
    box-shadow: 0 7px 14px rgba(13, 75, 151, 0.22);
  }

  .recipients-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    max-height: 145px;
    overflow-y: auto;
    padding-right: 0.2rem;
  }

  .empty-state {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: #7388a7;
    font-size: 0.75rem;
    font-weight: 500;
    background: #f4f8ff;
    border: 1px dashed #cfdbef;
    border-radius: 8px;
    padding: 0.42rem 0.55rem;
  }

  .recipient-chip {
    border: 1px solid #d5e0ef;
    background: #fff;
    border-radius: 10px;
    padding: 0.42rem 0.56rem;
    min-width: 170px;
    text-align: left;
    display: flex;
    flex-direction: column;
    cursor: pointer;

    .recipient-name {
      font-size: 0.73rem;
      color: #1e436f;
      font-weight: 700;
    }

    .recipient-mail {
      font-size: 0.69rem;
      color: #5f7392;
    }

    &.active {
      border-color: #0d4b97;
      background: linear-gradient(145deg, #edf4ff 0%, #f7fbff 100%);
      box-shadow: 0 6px 14px rgba(13, 75, 151, 0.16);
    }
  }

  .manual-recipients {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.55rem;

    .manual-title {
      font-size: 0.72rem;
      color: #5f7392;
      font-weight: 700;
    }

    .manual-chip {
      border: 1px solid #b9cce6;
      background: #f4f8ff;
      color: #1e436f;
      border-radius: 999px;
      height: 26px;
      padding: 0 0.55rem;
      font-size: 0.7rem;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      cursor: pointer;
    }
  }

  .whatsapp-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .whatsapp-item {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.5rem;
    align-items: center;
    border: 1px solid #d5e0ef;
    border-radius: 8px;
    background: #f9fbff;
    padding: 0.42rem 0.55rem;

    .who {
      font-size: 0.77rem;
      font-weight: 700;
      color: #1e436f;
    }

    .phone {
      font-size: 0.75rem;
      color: #5f7392;
    }

    .remove-btn {
      border: none;
      background: transparent;
      color: #8a99b0;
      cursor: pointer;
    }
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.45rem;
    padding-top: 0.55rem;
    border-top: 1px solid #dbe4f1;
  }
}
</style>

<style lang="scss">
.p-dialog.notifications-modal {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #c7d7ee;
  box-shadow: 0 28px 70px rgba(13, 43, 86, 0.32);
}

.p-dialog.notifications-modal .p-dialog-header {
  background: linear-gradient(125deg, #0f2f63 0%, #184c93 100%);
  color: #ffffff;
  border-bottom: none;
  padding: 0.95rem 1rem;
}

.p-dialog.notifications-modal .p-dialog-title {
  font-size: 0.96rem;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.p-dialog.notifications-modal .p-dialog-header .p-dialog-header-icon {
  color: #ffffff;
}

.p-dialog.notifications-modal .p-dialog-content {
  background: linear-gradient(180deg, #f5f8fd 0%, #eef4fb 100%);
  padding: 0.9rem 1rem 1rem;
}

.p-dialog.notifications-modal .modal-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.p-dialog.notifications-modal .module-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  background: #e4edf9;
  border: 1px solid #c4d5ee;
  color: #184c93;
  height: 30px;
  padding: 0 0.7rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.p-dialog.notifications-modal .modal-channels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.p-dialog.notifications-modal .channel-card {
  border: 1px solid #ccdaef;
  background: #ffffff;
  border-radius: 12px;
  padding: 0.55rem 0.68rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.p-dialog.notifications-modal .channel-card.active {
  border-color: #0d4b97;
  background: linear-gradient(155deg, #eaf2ff 0%, #f3f8ff 100%);
  box-shadow: 0 10px 20px rgba(13, 75, 151, 0.18);
}

.p-dialog.notifications-modal .recipients-box,
.p-dialog.notifications-modal .whatsapp-box {
  border: 1px solid #d7e2f1;
  border-radius: 12px;
  background: #ffffff;
  padding: 0.75rem;
  box-shadow: 0 8px 18px rgba(36, 77, 124, 0.08);
}

.p-dialog.notifications-modal .recipients-search-row,
.p-dialog.notifications-modal .whatsapp-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.45rem;
  margin-bottom: 0.55rem;
}

.p-dialog.notifications-modal .whatsapp-form-row {
  grid-template-columns: 1fr 1fr 1.3fr auto;
}

.p-dialog.notifications-modal input {
  height: 36px;
  border: 1px solid #d0dced;
  border-radius: 8px;
  background: #f9fbff;
  padding: 0 0.68rem;
  font-size: 0.78rem;
}

.p-dialog.notifications-modal .add-email-btn {
  height: 36px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(145deg, #0d4b97 0%, #0b3f7f 100%);
  color: #fff;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0 0.85rem;
  cursor: pointer;
  box-shadow: 0 7px 14px rgba(13, 75, 151, 0.22);
}

@media (max-width: 900px) {
  .p-dialog.notifications-modal .modal-channels {
    grid-template-columns: 1fr;
  }

  .p-dialog.notifications-modal .recipients-search-row,
  .p-dialog.notifications-modal .whatsapp-form-row {
    grid-template-columns: 1fr;
  }
}
</style>
