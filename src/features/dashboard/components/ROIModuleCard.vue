<template>
  <div class="roi-module-card">
    <div class="module-header">
      <div class="module-icon">
        <i class="pi pi-calculator"></i>
      </div>
      <div class="module-info">
        <h3>KAP ROI</h3>
        <p>Calculatrice ROI et estimation des gains</p>
      </div>
      <Button 
        icon="pi pi-external-link" 
        class="module-link-btn"
        text
        rounded
        @click="openROICalculator"
      />
    </div>
    
    <div class="module-stats">
      <div class="stat-item">
        <span class="stat-value">{{ roiData?.estimatedROI || 0 }}%</span>
        <span class="stat-label">ROI estimé</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ formatCurrency(roiData?.netGain || 0) }}</span>
        <span class="stat-label">Gain net total</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ roiData?.paybackPeriod || 0 }} mois</span>
        <span class="stat-label">Retour invest.</span>
      </div>
    </div>
    
    <div class="module-actions">
      <Button 
        label="Calculer ROI"
        icon="pi pi-calculator"
        @click="openROICalculator"
        class="p-button-sm"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useROIStore } from '../stores/roiStore'

const roiStore = useROIStore()

const roiData = computed(() => {
  if (roiStore.lastCalculation) {
    return {
      estimatedROI: roiStore.lastCalculation.roi_global || roiStore.lastCalculation.roi6Mois || roiStore.lastCalculation.roi_6_mois || 0,
      netGain: roiStore.lastCalculation.net_total_gain || roiStore.lastCalculation.gainNet6Mois || roiStore.lastCalculation.gain_net_6_mois || 0,
      paybackPeriod: roiStore.lastCalculation.drci_months || roiStore.lastCalculation.paybackPeriod || roiStore.lastCalculation.payback_period || 0
    }
  }
  return null
})

const formatCurrency = (amount) => {
  if (!amount) return '0 F CFA'
  // Formatage manuel pour éviter les espaces insécables
  const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return formatted + ' F CFA'
}

const openROICalculator = () => {
  roiStore.showCalculator = true
}
</script>

<style scoped>
.roi-module-card {
  background: #3b82f6;
  border-radius: 12px;
  padding: 20px;
  color: white;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
}

.roi-module-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.4);
}

.module-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.module-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.module-icon i {
  font-size: 24px;
  color: white;
}

.module-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.module-info p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.module-link-btn {
  margin-left: auto;
  color: white !important;
}

.module-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.module-actions {
  display: flex;
  justify-content: center;
}

.module-actions .p-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.module-actions .p-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}
</style>
