<template>
  <div class="obd-page">
    <div class="obd-header">
      <div>
        <h1>OBD USB Diagnostic</h1>
        <p>Lecture brute du port série USB (9600).</p>
      </div>
      <div class="status-wrap">
        <span class="status-pill" :class="modeClass">{{ modeLabel }}</span>
      </div>
    </div>

    <div class="controls">
      <Button
        label="Connecter USB 9600"
        icon="pi pi-plug"
        @click="connectSerial"
        :disabled="isConnecting"
      />
      <Button
        label="Deconnecter"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="disconnectSerial"
        :disabled="!port"
      />
      <Button
        label="Effacer"
        icon="pi pi-trash"
        text
        @click="clearLogs"
      />
    </div>

    <Message v-if="errorMessage" severity="warn" :closable="false">
      {{ errorMessage }}
    </Message>

    <div class="meta-grid">
      <div class="meta-card">
        <span class="meta-label">Source active</span>
        <strong>{{ modeLabel }}</strong>
      </div>
      <div class="meta-card">
        <span class="meta-label">Baud rate</span>
        <strong>9600</strong>
      </div>
      <div class="meta-card">
        <span class="meta-label">Dernière trame réelle</span>
        <strong>{{ lastRealDataLabel }}</strong>
      </div>
      <div class="meta-card">
        <span class="meta-label">Total lignes</span>
        <strong>{{ logs.length }}</strong>
      </div>
    </div>

    <div class="decoded-grid">
      <div class="decoded-card" :class="metricStatuses.engineRpm">
        <span class="decoded-label">Regime moteur</span>
        <span class="diagnostic-chip" :class="metricStatuses.engineRpm">{{ statusLabel(metricStatuses.engineRpm) }}</span>
        <strong>{{ decoded.engineRpm !== null ? `${decoded.engineRpm} tr/min` : '--' }}</strong>
      </div>
      <div class="decoded-card" :class="metricStatuses.vehicleSpeedKmh">
        <span class="decoded-label">Vitesse</span>
        <span class="diagnostic-chip" :class="metricStatuses.vehicleSpeedKmh">{{ statusLabel(metricStatuses.vehicleSpeedKmh) }}</span>
        <strong>{{ decoded.vehicleSpeedKmh !== null ? `${decoded.vehicleSpeedKmh} km/h` : '--' }}</strong>
      </div>
      <div class="decoded-card" :class="metricStatuses.coolantTempC">
        <span class="decoded-label">Temp. refroidissement</span>
        <span class="diagnostic-chip" :class="metricStatuses.coolantTempC">{{ statusLabel(metricStatuses.coolantTempC) }}</span>
        <strong>{{ decoded.coolantTempC !== null ? `${decoded.coolantTempC} deg C` : '--' }}</strong>
      </div>
      <div class="decoded-card" :class="metricStatuses.mapKpa">
        <span class="decoded-label">Pression admission (MAP)</span>
        <span class="diagnostic-chip" :class="metricStatuses.mapKpa">{{ statusLabel(metricStatuses.mapKpa) }}</span>
        <strong>{{ decoded.mapKpa !== null ? `${decoded.mapKpa} kPa` : '--' }}</strong>
      </div>
      <div class="decoded-card" :class="metricStatuses.batteryVoltageV">
        <span class="decoded-label">Batterie</span>
        <span class="diagnostic-chip" :class="metricStatuses.batteryVoltageV">{{ statusLabel(metricStatuses.batteryVoltageV) }}</span>
        <strong>{{ decoded.batteryVoltageV !== null ? `${decoded.batteryVoltageV} V` : '--' }}</strong>
      </div>
      <div class="decoded-card decoded-dtc" :class="metricStatuses.dtcCodes">
        <span class="decoded-label">Codes DTC actifs</span>
        <span class="diagnostic-chip" :class="metricStatuses.dtcCodes">{{ statusLabel(metricStatuses.dtcCodes) }}</span>
        <strong>{{ decoded.dtcCodes.length ? decoded.dtcCodes.join(', ') : 'Aucun' }}</strong>
      </div>
    </div>

    <div class="logs-panel">
      <div class="logs-header">
        <h2>Flux OBD</h2>
        <small>Affichage des lignes telles que recues</small>
      </div>

      <div class="logs-list" ref="logsContainer">
        <div v-if="logs.length === 0" class="empty-state">
          Aucune trame pour le moment.
        </div>
        <div v-for="entry in logs" :key="entry.id" class="log-line" :class="entry.source">
          <span class="time">{{ entry.time }}</span>
          <span class="source">{{ entry.source.toUpperCase() }}</span>
          <code class="payload">{{ entry.payload }}</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

const BAUD_RATE = 9600
const MAX_LOGS = 400
const REAL_DATA_TIMEOUT_MS = 5000
const USB_SERIAL_FILTERS = [
  { usbVendorId: 0x2341 }, // Arduino SA
  { usbVendorId: 0x2A03 }, // Arduino LLC
  { usbVendorId: 0x1A86 }, // QinHeng CH340
  { usbVendorId: 0x10C4 }, // Silicon Labs CP210x
  { usbVendorId: 0x0403 }, // FTDI
  { usbVendorId: 0x067B }  // Prolific
]

const port = ref(null)
const reader = ref(null)
const isConnecting = ref(false)
const errorMessage = ref('')
const logs = ref([])
const logsContainer = ref(null)
const decoded = ref({
  engineRpm: null,
  vehicleSpeedKmh: null,
  coolantTempC: null,
  mapKpa: null,
  batteryVoltageV: null,
  dtcCodes: []
})

const activeMode = ref('value')
const lastRealDataAt = ref(null)
let simulationInterval = null
let noDataTimer = null
let readLoopActive = false
let logId = 0

const modeLabel = computed(() => (activeMode.value === 'serial' ? 'Données réelles (USB)' : 'Données OBD'))
const modeClass = computed(() => (activeMode.value === 'serial' ? 'serial' : 'value'))
const lastRealDataLabel = computed(() => {
  if (!lastRealDataAt.value) return 'Aucune'
  return new Date(lastRealDataAt.value).toLocaleTimeString('fr-FR')
})

const getStatusFromThresholds = (value, limits) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'unknown'
  if (typeof limits.criticalLow === 'number' && value <= limits.criticalLow) return 'critical'
  if (typeof limits.criticalHigh === 'number' && value >= limits.criticalHigh) return 'critical'
  if (typeof limits.warnLow === 'number' && value <= limits.warnLow) return 'warn'
  if (typeof limits.warnHigh === 'number' && value >= limits.warnHigh) return 'warn'
  return 'ok'
}

const metricStatuses = computed(() => ({
  engineRpm: getStatusFromThresholds(decoded.value.engineRpm, { warnHigh: 2200, criticalHigh: 2600 }),
  vehicleSpeedKmh: getStatusFromThresholds(decoded.value.vehicleSpeedKmh, { warnHigh: 95, criticalHigh: 110 }),
  coolantTempC: getStatusFromThresholds(decoded.value.coolantTempC, { warnLow: -10, warnHigh: 100, criticalHigh: 110 }),
  mapKpa: getStatusFromThresholds(decoded.value.mapKpa, { warnHigh: 140, criticalHigh: 180 }),
  batteryVoltageV: getStatusFromThresholds(decoded.value.batteryVoltageV, { criticalLow: 11.8, warnLow: 12.2, warnHigh: 14.8, criticalHigh: 15.2 }),
  dtcCodes: decoded.value.dtcCodes.length ? 'critical' : 'ok'
}))

const statusLabel = (status) => {
  if (status === 'ok') return 'Normal'
  if (status === 'warn') return 'Attention'
  if (status === 'critical') return 'Critique'
  return 'En attente'
}

const pushLog = (payload, source) => {
  logId += 1
  logs.value.push({
    id: logId,
    time: new Date().toLocaleTimeString('fr-FR'),
    source,
    payload
  })

  if (logs.value.length > MAX_LOGS) {
    logs.value.splice(0, logs.value.length - MAX_LOGS)
  }

  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  })
}

const toHexByte = (value) => value.toString(16).toUpperCase().padStart(2, '0')

const buildIdleStoppedFrames = () => {
  const rpm = 680 + Math.floor(Math.random() * 81) - 40
  const speed = 0
  const coolantTemp = 81 + Math.floor(Math.random() * 5)
  const map = 98 + Math.floor(Math.random() * 7)
  const battery = (13.7 + (Math.random() * 0.4)).toFixed(1)

  const rpmRaw = rpm * 4
  const rpmA = toHexByte((rpmRaw >> 8) & 0xFF)
  const rpmB = toHexByte(rpmRaw & 0xFF)

  return [
    `010C ${rpmA} ${rpmB}`,
    `010D ${toHexByte(speed)}`,
    `0105 ${toHexByte(coolantTemp + 40)}`,
    `010B ${toHexByte(map)}`,
    `ATRV ${battery}V`
  ]
}

const startSimulation = () => {
  stopSimulation()
  activeMode.value = 'value'

  // Profil simulation: camion a l'arret depuis 5 min (moteur au ralenti, sans code defaut)
  decoded.value.dtcCodes = []
  let frameCursor = 0
  let currentFrames = buildIdleStoppedFrames()

  simulationInterval = setInterval(() => {
    if (frameCursor === 0) {
      currentFrames = buildIdleStoppedFrames()
    }
    const frame = currentFrames[frameCursor]
    frameCursor = (frameCursor + 1) % currentFrames.length

    pushLog(frame, 'value')
    decodeObdLine(frame)
  }, 1000)
}

const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
}

const resetNoDataTimer = () => {
  if (noDataTimer) clearTimeout(noDataTimer)
  noDataTimer = setTimeout(() => {
    activeMode.value = 'value'
    startSimulation()
    errorMessage.value = 'Connexion USB etablie, mais aucune donnee recue. Affichage des Données obd.'
  }, REAL_DATA_TIMEOUT_MS)
}

const stopNoDataTimer = () => {
  if (noDataTimer) {
    clearTimeout(noDataTimer)
    noDataTimer = null
  }
}

const parseAndLogChunk = (chunk) => {
  const lines = chunk.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (!lines.length) return

  stopSimulation()
  activeMode.value = 'serial'
  lastRealDataAt.value = Date.now()
  stopNoDataTimer()
  errorMessage.value = ''

  lines.forEach((line) => {
    pushLog(line, 'serial')
    decodeObdLine(line)
  })
  resetNoDataTimer()
}

const decodeObdLine = (line) => {
  const normalized = line.trim().toUpperCase().replace(/[^A-Z0-9. ]/g, ' ')
  const tokens = normalized.split(/\s+/).filter(Boolean)
  if (!tokens.length) return

  if (tokens[0] === 'ATRV' && tokens[1]) {
    const volts = Number.parseFloat(tokens[1].replace('V', ''))
    if (!Number.isNaN(volts)) {
      decoded.value.batteryVoltageV = Number(volts.toFixed(2))
    }
    return
  }

  const findPidStart = () => {
    for (let i = 0; i < tokens.length - 1; i += 1) {
      if (tokens[i] === '41') return i
      if (tokens[i] === '010C' || tokens[i] === '010D' || tokens[i] === '0105' || tokens[i] === '010B') return -1
    }
    return -2
  }

  if (tokens[0] === '03') {
    const detectedCodes = tokens.slice(1).filter((t) => /^P[0-9A-F]{4}$/.test(t))
    if (detectedCodes.length) {
      const merged = new Set([...decoded.value.dtcCodes, ...detectedCodes])
      decoded.value.dtcCodes = Array.from(merged)
    }
    return
  }

  if (tokens[0] === '010C' && tokens.length >= 3) {
    const a = Number.parseInt(tokens[1], 16)
    const b = Number.parseInt(tokens[2], 16)
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      decoded.value.engineRpm = Math.round((((a * 256) + b) / 4))
    }
    return
  }

  if (tokens[0] === '010D' && tokens.length >= 2) {
    const a = Number.parseInt(tokens[1], 16)
    if (!Number.isNaN(a)) {
      decoded.value.vehicleSpeedKmh = a
    }
    return
  }

  if (tokens[0] === '0105' && tokens.length >= 2) {
    const a = Number.parseInt(tokens[1], 16)
    if (!Number.isNaN(a)) {
      decoded.value.coolantTempC = a - 40
    }
    return
  }

  if (tokens[0] === '010B' && tokens.length >= 2) {
    const a = Number.parseInt(tokens[1], 16)
    if (!Number.isNaN(a)) {
      decoded.value.mapKpa = a
    }
    return
  }

  const pidStart = findPidStart()
  if (pidStart < 0) return

  const pid = tokens[pidStart + 1]
  const data = tokens.slice(pidStart + 2)

  if (pid === '0C' && data.length >= 2) {
    const a = Number.parseInt(data[0], 16)
    const b = Number.parseInt(data[1], 16)
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      decoded.value.engineRpm = Math.round((((a * 256) + b) / 4))
    }
    return
  }

  if (pid === '0D' && data.length >= 1) {
    const a = Number.parseInt(data[0], 16)
    if (!Number.isNaN(a)) {
      decoded.value.vehicleSpeedKmh = a
    }
    return
  }

  if (pid === '05' && data.length >= 1) {
    const a = Number.parseInt(data[0], 16)
    if (!Number.isNaN(a)) {
      decoded.value.coolantTempC = a - 40
    }
    return
  }

  if (pid === '0B' && data.length >= 1) {
    const a = Number.parseInt(data[0], 16)
    if (!Number.isNaN(a)) {
      decoded.value.mapKpa = a
    }
  }
}

const startReadLoop = async () => {
  if (!port.value || !port.value.readable) return

  readLoopActive = true
  let textBuffer = ''
  reader.value = port.value.readable.getReader()
  resetNoDataTimer()

  try {
    while (readLoopActive) {
      const { value, done } = await reader.value.read()
      if (done) break
      if (!value) continue

      const decoded = new TextDecoder().decode(value)
      textBuffer += decoded

      const parts = textBuffer.split(/\r?\n/)
      textBuffer = parts.pop() || ''

      parts.forEach((line) => parseAndLogChunk(line))
    }
  } catch (err) {
    errorMessage.value = `Erreur de lecture série : ${err?.message || 'inconnue'}`
    startSimulation()
  } finally {
    stopNoDataTimer()
    if (reader.value) {
      try {
        await reader.value.cancel()
      } catch (e) {
        // Ignore cancel errors while cleaning up.
      }
      try {
        reader.value.releaseLock()
      } catch (e) {
        // Ignore release errors while cleaning up.
      }
      reader.value = null
    }
  }
}

const connectSerial = async () => {
  if (!('serial' in navigator)) {
    errorMessage.value = 'Web Serial non supporte par ce navigateur. Affichage des Données obd.'
    startSimulation()
    return
  }

  isConnecting.value = true
  errorMessage.value = ''

  try {
    await disconnectSerial()
    let selectedPort = null

    // 1) Reuse already authorized ports when available.
    const authorizedPorts = await navigator.serial.getPorts()
    if (authorizedPorts.length > 0) {
      selectedPort = authorizedPorts[0]
    }

    // 2) Ask chooser with common Arduino/USB-serial filters.
    if (!selectedPort) {
      try {
        selectedPort = await navigator.serial.requestPort({ filters: USB_SERIAL_FILTERS })
      } catch (filterErr) {
        // 3) Fallback: ask without filter for unknown USB adapters.
        if (filterErr?.name === 'NotFoundError') {
          selectedPort = await navigator.serial.requestPort()
        } else {
          throw filterErr
        }
      }
    }

    const portInfo = selectedPort?.getInfo?.() || {}
    if (!portInfo.usbVendorId) {
      errorMessage.value = 'Aucun port USB série valide détecté.'
      startSimulation()
      return
    }

    await selectedPort.open({ baudRate: BAUD_RATE })
    port.value = selectedPort

    stopSimulation()
    activeMode.value = 'serial'
    pushLog('Connexion USB 9600 etablie', 'serial')
    startReadLoop()
  } catch (err) {
    if (err?.name === 'NotFoundError') {
      errorMessage.value = 'Aucun port série sélectionné. Vérifiez le câble USB de données, fermez le moniteur série Arduino IDE, puis réessayez. Sur Linux, vérifiez aussi les droits du port (/dev/ttyUSB* ou /dev/ttyACM*).'
    } else {
      errorMessage.value = `Impossible d'ouvrir le port série 9600 : ${err?.message || 'erreur inconnue'}`
    }
    startSimulation()
  } finally {
    isConnecting.value = false
  }
}

const disconnectSerial = async () => {
  readLoopActive = false
  stopNoDataTimer()

  if (reader.value) {
    try {
      await reader.value.cancel()
    } catch (e) {
      // Ignore cancel errors while disconnecting.
    }
    try {
      reader.value.releaseLock()
    } catch (e) {
      // Ignore release errors while disconnecting.
    }
    reader.value = null
  }

  if (port.value) {
    try {
      await port.value.close()
    } catch (e) {
      // Ignore close errors while disconnecting.
    }
    port.value = null
  }

  startSimulation()
}

const clearLogs = () => {
  logs.value = []
  decoded.value = {
    engineRpm: null,
    vehicleSpeedKmh: null,
    coolantTempC: null,
    mapKpa: null,
    batteryVoltageV: null,
    dtcCodes: []
  }
}

startSimulation()

onBeforeUnmount(async () => {
  await disconnectSerial()
  stopSimulation()
})
</script>

<style scoped>
.obd-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.obd-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.obd-header h1 {
  margin: 0;
  font-size: 1.4rem;
}

.obd-header p {
  margin: 0.35rem 0 0;
  opacity: 0.8;
}

.status-pill {
  display: inline-flex;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-pill.serial {
  background: #d5f3e1;
  color: #0f5132;
}

.status-pill.value {
  background: #ffe6cc;
  color: #8a4b08;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.8rem;
}

.decoded-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.8rem;
}

.decoded-card {
  border: 1px solid rgba(120, 120, 120, 0.25);
  border-radius: 0.75rem;
  padding: 0.85rem;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.decoded-card strong {
  font-size: 1.05rem;
}

.decoded-card.ok {
  border-color: #87d6a8;
  background: #ecfdf3;
}

.decoded-card.warn {
  border-color: #f0bf6a;
  background: #fff8ea;
}

.decoded-card.critical {
  border-color: #ef8d9b;
  background: #fff1f3;
}

.decoded-card.unknown {
  border-color: rgba(120, 120, 120, 0.25);
  background: rgba(255, 255, 255, 0.7);
}

.decoded-label {
  font-size: 0.78rem;
  opacity: 0.75;
}

.diagnostic-chip {
  width: fit-content;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  font-size: 0.74rem;
  font-weight: 600;
}

.diagnostic-chip.ok {
  color: #0f5132;
  background: #d5f3e1;
}

.diagnostic-chip.warn {
  color: #8a4b08;
  background: #ffe6cc;
}

.diagnostic-chip.critical {
  color: #842029;
  background: #f8d7da;
}

.diagnostic-chip.unknown {
  color: #334155;
  background: #e2e8f0;
}

.decoded-dtc {
  grid-column: span 2;
}

.meta-card {
  border: 1px solid rgba(120, 120, 120, 0.25);
  border-radius: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.meta-label {
  font-size: 0.78rem;
  opacity: 0.75;
}

.logs-panel {
  border: 1px solid rgba(120, 120, 120, 0.25);
  border-radius: 0.9rem;
  background: #0d1117;
  color: #f0f6fc;
  overflow: hidden;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(240, 246, 252, 0.12);
}

.logs-header h2 {
  margin: 0;
  font-size: 1rem;
}

.logs-list {
  max-height: 58vh;
  overflow: auto;
  padding: 0.5rem 0;
}

.log-line {
  display: grid;
  grid-template-columns: 88px 86px 1fr;
  gap: 0.6rem;
  padding: 0.35rem 1rem;
  align-items: baseline;
  font-size: 0.85rem;
}

.log-line.serial {
  border-left: 2px solid #2ea043;
}

.log-line.value {
  border-left: 2px solid #d29922;
}

.time {
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
}

.source {
  font-weight: 600;
}

.payload {
  color: inherit;
  background: transparent;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.empty-state {
  padding: 1rem;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .obd-header {
    flex-direction: column;
  }

  .decoded-dtc {
    grid-column: span 1;
  }

  .log-line {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }
}
</style>
