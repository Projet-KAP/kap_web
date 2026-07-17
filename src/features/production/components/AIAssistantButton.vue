<template>
  <div class="ai-assistant-button" @click="$emit('click')">
    <div class="button-content">
      <img src="/chatbot.png" alt="Assistant IA" class="chatbot-icon" />
    </div>
    <Transition name="tooltip">
      <div v-if="showTooltip" class="button-tooltip">
        Assistant IA
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

defineEmits(['click'])

const showTooltip = ref(false)

onMounted(() => {
  // Afficher le tooltip brievement au montage
  setTimeout(() => {
    showTooltip.value = true
    setTimeout(() => {
      showTooltip.value = false
    }, 3000)
  }, 1000)
})
</script>

<style scoped lang="scss">
.ai-assistant-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;

  .button-content {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #7AC943;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(122, 201, 67, 0.4);
    transition: all 0.3s ease;

    i {
      font-size: 1.5rem;
      color: white;
    }

    .chatbot-icon {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(122, 201, 67, 0.5);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .button-tooltip {
    position: absolute;
    right: 70px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--surface-800);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

    &::after {
      content: '';
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      border: 6px solid transparent;
      border-left-color: var(--surface-800);
    }
  }
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.3s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(10px);
}
</style>
