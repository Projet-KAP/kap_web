<template>
  <div class="date-cell-editor">
    <DatePicker
      v-model="dateValue"
      dateFormat="dd/mm/yy"
      showIcon
      @date-select="onDateSelect"
      @hide="onHide"
      :manualInput="true"
      :showOnFocus="true"
      class="date-picker-editor"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import DatePicker from 'primevue/datepicker'

const props = defineProps({
  value: {
    type: [String, Date],
    default: null
  }
})

const emit = defineEmits(['save', 'cancel'])

const dateValue = ref(null)

// Convertir la valeur initiale en Date si c'est une string
watch(() => props.value, (newValue) => {
  if (newValue) {
    if (typeof newValue === 'string') {
      // Tenter de parser différentes formats de date
      const parsed = new Date(newValue)
      if (!isNaN(parsed.getTime())) {
        dateValue.value = parsed
      } else {
        // Essayer le format DD/MM/YYYY
        const parts = newValue.split('/')
        if (parts.length === 3) {
          dateValue.value = new Date(parts[2], parts[1] - 1, parts[0])
        } else {
          dateValue.value = null
        }
      }
    } else if (newValue instanceof Date) {
      dateValue.value = newValue
    }
  } else {
    dateValue.value = null
  }
}, { immediate: true })

const onDateSelect = (event) => {
  if (dateValue.value) {
    // Formater la date en YYYY-MM-DD pour le stockage
    const year = dateValue.value.getFullYear()
    const month = String(dateValue.value.getMonth() + 1).padStart(2, '0')
    const day = String(dateValue.value.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`
    emit('save', formattedDate)
  }
}

const onHide = () => {
  // Ne rien faire, on laisse l'utilisateur continuer à éditer
}

onMounted(() => {
  // Focus automatique sur le date picker
  const picker = document.querySelector('.date-picker-editor input')
  if (picker) {
    picker.focus()
  }
})
</script>

<style scoped>
.date-cell-editor {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.date-picker-editor {
  width: 100%;
}

.date-picker-editor :deep(.p-inputtext) {
  width: 100%;
  height: 100%;
  border: none;
  padding: 4px 8px;
}
</style>

