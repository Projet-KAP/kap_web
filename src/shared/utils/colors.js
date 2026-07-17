// Palette de couleurs centralisée pour toute l'application - Thème harmonisé et professionnel
export const colors = {
  // Couleurs principales - thème bleu moderne et élégant
  primary: '#2563eb',      // Bleu principal moderne
  primaryDark: '#1d4ed8',  // Bleu foncé
  primaryLight: '#3b82f6', // Bleu clair
  neutral: '#ffffff',
  neutralDark: '#f8fafc',
  
  // Palette harmonisée - tons bleus et neutres uniquement
  secondary: '#64748b',    // Gris-bleu
  accent: '#0ea5e9',       // Bleu cyan
  success: '#059669',      // Vert émeraude
  warning: '#d97706',      // Orange ambre
  error: '#dc2626',        // Rouge
  
  // Gradients harmonisés - tons bleus uniquement
  gradients: {
    primary: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    secondary: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    accent: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    success: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    warning: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    neutral: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    subtle: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
  },

  // Couleurs pour les graphiques - palette harmonieuse limitée
  chart: [
    '#2563eb', // Bleu principal
    '#3b82f6', // Bleu clair
    '#0ea5e9', // Cyan
    '#64748b', // Gris-bleu
    '#059669', // Vert
    '#d97706', // Orange
    '#dc2626', // Rouge
    '#14b8a6'  // Teal (remplacement du violet)
  ],

  // Couleurs par catégorie - harmonisées avec le thème bleu
  teams: {
    primary: '#2563eb',
    performance: '#3b82f6',
    kpis: '#0ea5e9',
    objectives: '#059669'
  },

  engins: {
    reliability: '#059669',
    alerts: '#d97706',
    breakdown: '#dc2626',
    maintenance: '#2563eb'
  },

  // Couleurs de statut - harmonisées
  status: {
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',
    neutral: '#64748b'
  },

  // Couleurs pour les types d'engins - palette cohérente
  enginTypes: {
    'EXCAVATRICE': '#2563eb',
    'BULLDOZER': '#3b82f6',
    'GRUE': '#0ea5e9',
    'COMPACTEUR': '#059669',
    'GLOBAL': '#1d4ed8'
  },

  // Couleurs KPI - tons professionnels harmonisés
  kpi: {
    productivity: '#2563eb',
    quality: '#059669', 
    efficiency: '#0ea5e9',
    satisfaction: '#3b82f6',
    collaboration: '#d97706'
  },

  // Couleurs neutres pour les éléments uniformes
  lightNeutral: '#ffffff',
  lightNeutralDark: '#f8fafc',
  
  // Nouvelles couleurs pour les surfaces
  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    border: '#e2e8f0',
    borderLight: '#f1f5f9'
  }
}

// Utilitaires pour les couleurs
export const colorUtils = {
  // Obtenir une couleur avec transparence
  withOpacity: (color, opacity) => {
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    return color
  },

  // Obtenir une couleur de graphique par index
  getChartColor: (index) => {
    return colors.chart[index % colors.chart.length]
  },

  // Obtenir un gradient CSS
  getGradient: (type) => {
    return colors.gradients[type] || colors.gradients.primary
  },

  // Obtenir une couleur de statut
  getStatusColor: (status) => {
    const statusMap = {
      'ACTIVE': colors.status.success,
      'INACTIVE': colors.status.neutral,
      'MAINTENANCE': colors.status.warning,
      'ERROR': colors.status.error,
      'SUCCESS': colors.status.success,
      'WARNING': colors.status.warning,
      'INFO': colors.status.info
    }
    return statusMap[status] || colors.status.neutral
  }
}
