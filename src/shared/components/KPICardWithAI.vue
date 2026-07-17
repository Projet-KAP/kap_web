<template>
  <div class="kpi-card-with-ai">
    <KPICard 
      :title="title"
      :value="value"
      :icon="icon"
      :variant="variant"
      :gradient="gradient"
      :format="format"
      :meta="meta"
    >
      <template #meta v-if="$slots.meta">
        <slot name="meta"></slot>
      </template>
    </KPICard>
    
    <!-- Indicateur de recommandations IA -->
    <div 
      v-if="hasRecommendations" 
      class="ai-indicator"
      @click="showRecommendations = !showRecommendations"
      v-tooltip.left="'Recommandations IA disponibles'"
    >
      <i class="pi pi-lightbulb"></i>
      <span class="ai-count">{{ recommendations.length }}</span>
    </div>
    
    <!-- Mini panel de recommandations -->
    <Transition name="slide-up">
      <div v-if="showRecommendations && hasRecommendations" class="mini-recommendations">
        <div class="mini-header">
          <i class="pi pi-sparkles"></i>
          <span>Recommandations IA</span>
          <Button 
            icon="pi pi-times" 
            @click="showRecommendations = false"
            text
            size="small"
            class="close-btn"
          />
        </div>
        
        <div class="mini-list">
          <div 
            v-for="(rec, index) in recommendations.slice(0, 2)" 
            :key="index"
            :class="['mini-recommendation', rec.priority]"
          >
            <div class="mini-rec-header">
              <i :class="getPriorityIcon(rec.priority)"></i>
              <span class="mini-title">{{ rec.title }}</span>
            </div>
            <p class="mini-description">{{ rec.description }}</p>
            <div class="mini-actions">
              <Button 
                label="Voir plus" 
                @click="$emit('show-full-recommendations')"
                size="small"
                text
                class="view-more-btn"
              />
            </div>
          </div>
          
          <div v-if="recommendations.length > 2" class="more-recommendations">
            <Button 
              :label="`+${recommendations.length - 2} autres recommandations`"
              @click="$emit('show-full-recommendations')"
              size="small"
              text
              class="show-all-btn"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import KPICard from './KPICard.vue'

// Props
const props = defineProps({
  title: String,
  value: [Number, String],
  icon: String,
  variant: String,
  gradient: Boolean,
  format: String,
  meta: String,
  recommendations: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['show-full-recommendations'])

// State
const showRecommendations = ref(false)

// Computed
const hasRecommendations = computed(() => props.recommendations && props.recommendations.length > 0)

// Methods
const getPriorityIcon = (priority) => {
  const icons = {
    critical: 'pi pi-exclamation-triangle',
    high: 'pi pi-exclamation-circle',
    medium: 'pi pi-info-circle',
    low: 'pi pi-lightbulb'
  }
  return icons[priority] || 'pi pi-info-circle'
}
</script>

<style scoped>
.kpi-card-with-ai {
  position: relative;
}

.ai-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  background: #f59e0b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  z-index: 5;
}

.ai-indicator:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.ai-indicator i {
  color: white;
  font-size: 0.875rem;
}

.ai-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #dc2626;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.mini-recommendations {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 10;
  margin-top: 0.5rem;
  max-width: 350px;
}

.mini-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
  border-radius: 12px 12px 0 0;
}

.mini-header i {
  color: #f59e0b;
}

.mini-header span {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  flex: 1;
}

.close-btn {
  color: #6b7280 !important;
  width: 24px !important;
  height: 24px !important;
}

.mini-list {
  padding: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.mini-recommendation {
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  border-left: 3px solid;
  background: #f9fafb;
}

.mini-recommendation:last-child {
  margin-bottom: 0;
}

.mini-recommendation.critical {
  border-left-color: #dc2626;
}

.mini-recommendation.high {
  border-left-color: #d97706;
}

.mini-recommendation.medium {
  border-left-color: #2563eb;
}

.mini-recommendation.low {
  border-left-color: #059669;
}

.mini-rec-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.mini-rec-header i {
  font-size: 0.75rem;
}

.mini-recommendation.critical .mini-rec-header i {
  color: #dc2626;
}

.mini-recommendation.high .mini-rec-header i {
  color: #d97706;
}

.mini-recommendation.medium .mini-rec-header i {
  color: #2563eb;
}

.mini-recommendation.low .mini-rec-header i {
  color: #059669;
}

.mini-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.mini-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.mini-actions {
  display: flex;
  justify-content: flex-end;
}

.view-more-btn {
  color: #2563eb !important;
  font-size: 0.75rem !important;
  padding: 0.25rem 0.5rem !important;
}

.more-recommendations {
  text-align: center;
  padding: 0.5rem;
  border-top: 1px solid #f1f5f9;
  margin-top: 0.5rem;
}

.show-all-btn {
  color: #6b7280 !important;
  font-size: 0.75rem !important;
}

/* Transitions */
.slide-up-enter-active {
  transition: all 0.3s ease-out;
}

.slide-up-leave-active {
  transition: all 0.2s ease-in;
}

.slide-up-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .mini-recommendations {
    max-width: 280px;
  }
  
  .ai-indicator {
    top: 0.75rem;
    right: 0.75rem;
    width: 28px;
    height: 28px;
  }
  
  .ai-indicator i {
    font-size: 0.75rem;
  }
}
</style>
