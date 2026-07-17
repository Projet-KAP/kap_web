import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNavigationStore = defineStore('navigation', () => {
  const activeSection = ref('dashboard')

  const setActiveSection = (section) => {
    activeSection.value = section
  }

  const handleNavClick = (section) => {
    setActiveSection(section)
  }

  const getCurrentPageInfo = computed(() => {
    const pageInfo = {
      'dashboard': { title: 'Tableau de bord', breadcrumb: ['Accueil', 'Tableau de bord'] },
      'collect': { title: 'Collect', breadcrumb: ['Modules', 'Collect'] },
      'mes': { title: 'MES', breadcrumb: ['Modules', 'MES'] },
      'engins': { title: 'Engins', breadcrumb: ['Modules', 'Engins'] }
    }
    return pageInfo[activeSection.value] || { title: 'KAP CONSEIL', breadcrumb: [] }
  })

  const isMenuItemActive = computed(() => (itemId) => {
    return activeSection.value === itemId
  })

  return {
    activeSection,
    setActiveSection,
    handleNavClick,
    getCurrentPageInfo,
    isMenuItemActive
  }
}) 