import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAIRecommendationsStore = defineStore('aiRecommendations', () => {
  // State
  const recommendations = ref([])
  const loading = ref(false)

  // Computed
  const criticalRecommendations = computed(() =>
    recommendations.value.filter(r => r.priority === 'critical')
  )

  const highPriorityRecommendations = computed(() =>
    recommendations.value.filter(r => r.priority === 'high')
  )

  const sortedRecommendations = computed(() => {
    return [...recommendations.value].sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.impact - a.impact
    })
  })

  // Actions - Recommandations globales
  const getGlobalRecommendations = (globalStats) => {
    const recs = []

    // Analyse du TRS Global
    if (globalStats.trs_global > 0 && globalStats.trs_global < 75) {
      recs.push({
        id: 'trs-improvement',
        title: 'Optimisation du TRS Global',
        description: `Votre TRS de ${globalStats.trs_global}% est en dessous du seuil optimal de 75%.`,
        priority: globalStats.trs_global < 60 ? 'critical' : 'high',
        impact: 85,
        details: {
          cause: 'Temps d\'arrêt non planifiés élevés et efficacité des équipements sous-optimale',
          actions: [
            'Mettre en place une maintenance prédictive',
            'Former les opérateurs aux bonnes pratiques',
            'Analyser les causes racines des pannes récurrentes',
            'Optimiser les changements d\'équipes'
          ],
          timeline: '2-3 mois pour voir une amélioration significative'
        }
      })
    }

    // Analyse des alertes actives
    if (globalStats.alertes_actives > 3) {
      recs.push({
        id: 'alerts-reduction',
        title: 'Réduction des Alertes Critiques',
        description: `${globalStats.alertes_actives} alertes actives nécessitent une attention immédiate.`,
        priority: 'critical',
        impact: 70,
        details: {
          cause: 'Accumulation d\'alertes non traitées et maintenance différée',
          actions: [
            'Prioriser les alertes par criticité',
            'Mettre en place un système d\'escalade',
            'Planifier des interventions préventives',
            'Former l\'équipe à la résolution rapide'
          ],
          timeline: '1-2 semaines pour stabiliser la situation'
        }
      })
    }

    // Analyse de la disponibilité des engins
    if (globalStats.disponibilite_engins > 0 && globalStats.disponibilite_engins < 85) {
      recs.push({
        id: 'equipment-availability',
        title: 'Amélioration de la Disponibilité',
        description: `Disponibilité des engins à ${globalStats.disponibilite_engins}%, objectif recommandé: 90%+`,
        priority: 'medium',
        impact: 60,
        details: {
          cause: 'Maintenance corrective trop fréquente et pièces de rechange indisponibles',
          actions: [
            'Optimiser le stock de pièces détachées',
            'Implémenter un planning de maintenance préventive',
            'Négocier des contrats de maintenance avec les fournisseurs'
          ],
          timeline: '1-2 mois pour optimiser la disponibilité'
        }
      })
    }

    return recs
  }

  // Recommandations pour les équipes
  const getTeamRecommendations = (teamsData) => {
    const recs = []

    if (!teamsData || teamsData.length === 0) {
      return recs
    }

    // Analyse des performances d'équipe
    const avgPerformance = teamsData.reduce((sum, team) => sum + team.performance_score, 0) / teamsData.length

    if (avgPerformance > 0 && avgPerformance < 80) {
      recs.push({
        id: 'team-performance',
        title: 'Optimisation des Performances d\'Équipe',
        description: `Performance moyenne des équipes: ${Math.round(avgPerformance)}%. Objectif: 85%+`,
        priority: 'high',
        impact: 75,
        details: {
          cause: 'Manque de formation, processus non optimisés et communication insuffisante',
          actions: [
            'Organiser des sessions de formation ciblées',
            'Mettre en place des indicateurs de performance individuels',
            'Améliorer la communication inter-équipes',
            'Implémenter un système de reconnaissance'
          ],
          timeline: '6-8 semaines pour voir une amélioration'
        }
      })
    }

    // Identifier les équipes sous-performantes
    const underperformingTeams = teamsData.filter(team => team.performance_score < 70)
    if (underperformingTeams.length > 0) {
      recs.push({
        id: 'underperforming-teams',
        title: 'Support des Équipes en Difficulté',
        description: `${underperformingTeams.length} équipe(s) nécessitent un accompagnement renforcé`,
        priority: 'medium',
        impact: 65,
        details: {
          cause: 'Ressources insuffisantes, formation inadéquate ou problèmes organisationnels',
          actions: [
            'Audit approfondi des équipes concernées',
            'Plan de formation personnalisé',
            'Réallocation des ressources si nécessaire',
            'Mentorat par les équipes performantes'
          ],
          timeline: '4-6 semaines pour stabiliser les performances'
        }
      })
    }

    return recs
  }

  // Recommandations pour les engins
  const getEnginsRecommendations = (enginsData) => {
    const recs = []

    // Analyse de la fiabilité
    if (enginsData.averageReliability > 0 && enginsData.averageReliability < 85) {
      recs.push({
        id: 'reliability-improvement',
        title: 'Amélioration de la Fiabilité',
        description: `Fiabilité moyenne: ${enginsData.averageReliability}%. Objectif recommandé: 90%+`,
        priority: 'high',
        impact: 80,
        details: {
          cause: 'Vieillissement des équipements et maintenance insuffisante',
          actions: [
            'Audit technique complet des engins critiques',
            'Mise à jour du plan de maintenance préventive',
            'Formation des opérateurs aux bonnes pratiques',
            'Investissement dans des équipements plus récents'
          ],
          timeline: '3-4 mois pour améliorer significativement'
        }
      })
    }

    // Analyse des alertes critiques
    if (enginsData.criticalAlerts > 2) {
      recs.push({
        id: 'critical-alerts',
        title: 'Traitement des Alertes Critiques',
        description: `${enginsData.criticalAlerts} alertes critiques nécessitent une intervention immédiate`,
        priority: 'critical',
        impact: 90,
        details: {
          cause: 'Défaillances techniques majeures ou conditions d\'utilisation inadéquates',
          actions: [
            'Intervention technique immédiate',
            'Analyse des causes racines',
            'Mise en place de mesures correctives',
            'Renforcement de la surveillance'
          ],
          timeline: 'Action immédiate requise'
        }
      })
    }

    // Analyse du taux de panne
    if (enginsData.averageBreakdownRate > 15) {
      recs.push({
        id: 'breakdown-reduction',
        title: 'Réduction du Taux de Panne',
        description: `Taux de panne élevé: ${enginsData.averageBreakdownRate}%. Objectif: <10%`,
        priority: 'medium',
        impact: 70,
        details: {
          cause: 'Maintenance préventive insuffisante et conditions d\'exploitation difficiles',
          actions: [
            'Renforcer la maintenance préventive',
            'Améliorer les conditions de stockage',
            'Former les opérateurs à la détection précoce',
            'Optimiser les cycles d\'utilisation'
          ],
          timeline: '2-3 mois pour réduire significativement'
        }
      })
    }

    return recs
  }

  // Recommandations pour le module Collect
  const getCollectRecommendations = (collectData) => {
    const recs = []

    if (collectData.progression_globale > 0 && collectData.progression_globale < 80) {
      recs.push({
        id: 'collect-efficiency',
        title: 'Accélération des Collectes',
        description: `Progression globale: ${collectData.progression_globale}%. Optimisation possible.`,
        priority: 'medium',
        impact: 60,
        details: {
          cause: 'Processus de collecte non optimisés et formation insuffisante',
          actions: [
            'Automatiser certaines étapes de collecte',
            'Former les équipes aux outils digitaux',
            'Optimiser les circuits de collecte',
            'Mettre en place des contrôles qualité'
          ],
          timeline: '3-4 semaines pour optimiser'
        }
      })
    }

    if (collectData.en_retard > 0) {
      recs.push({
        id: 'collect-delays',
        title: 'Gestion des Retards',
        description: `${collectData.en_retard} collecte(s) en retard nécessitent une attention`,
        priority: 'high',
        impact: 55,
        details: {
          cause: 'Planification inadéquate ou ressources insuffisantes',
          actions: [
            'Réajuster la planification',
            'Allouer des ressources supplémentaires',
            'Identifier les goulots d\'étranglement',
            'Mettre en place des alertes préventives'
          ],
          timeline: '1-2 semaines pour rattraper'
        }
      })
    }

    return recs
  }

  // Recommandations pour le module MES
  const getMESRecommendations = (mesData) => {
    const recs = []

    if (mesData.trs > 0 && mesData.trs < 75) {
      recs.push({
        id: 'mes-trs-optimization',
        title: 'Optimisation TRS Production',
        description: `TRS actuel: ${mesData.trs}%. Potentiel d'amélioration significatif.`,
        priority: 'high',
        impact: 85,
        details: {
          cause: 'Temps de cycle non optimisés et arrêts micro fréquents',
          actions: [
            'Analyse détaillée des temps de cycle',
            'Optimisation des changements de série',
            'Réduction des micro-arrêts',
            'Formation des opérateurs à l\'excellence opérationnelle'
          ],
          timeline: '6-8 semaines pour amélioration notable'
        }
      })
    }

    if (mesData.taux_rebuts > 3) {
      recs.push({
        id: 'quality-improvement',
        title: 'Amélioration Qualité',
        description: `Taux de rebuts: ${mesData.taux_rebuts}%. Objectif: <2%`,
        priority: 'medium',
        impact: 70,
        details: {
          cause: 'Dérives process et contrôles qualité insuffisants',
          actions: [
            'Renforcer les contrôles en cours de production',
            'Calibrer régulièrement les équipements',
            'Former aux techniques de résolution de problèmes',
            'Mettre en place un système poka-yoke'
          ],
          timeline: '4-6 semaines pour stabiliser'
        }
      })
    }

    return recs
  }

  // Fonction principale pour obtenir toutes les recommandations
  const getAllRecommendations = (moduleData, globalStats, teamsData, enginsData) => {
    loading.value = true
    const allRecs = []

    try {
      // Recommandations globales
      if (globalStats) {
        allRecs.push(...getGlobalRecommendations(globalStats))
      }

      // Recommandations par module
      if (moduleData?.collect) {
        allRecs.push(...getCollectRecommendations(moduleData.collect))
      }

      if (moduleData?.mes) {
        allRecs.push(...getMESRecommendations(moduleData.mes))
      }

      if (teamsData && teamsData.length > 0) {
        allRecs.push(...getTeamRecommendations(teamsData))
      }

      if (enginsData) {
        allRecs.push(...getEnginsRecommendations(enginsData))
      }

      // Trier par priorité et impact
      recommendations.value = allRecs.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        return b.impact - a.impact
      })

      return recommendations.value
    } finally {
      loading.value = false
    }
  }

  // Recommandations spécifiques par contexte
  const getContextualRecommendations = (context, data) => {
    loading.value = true
    try {
      switch (context) {
        case 'teams':
          recommendations.value = getTeamRecommendations(data)
          break
        case 'engins':
          recommendations.value = getEnginsRecommendations(data)
          break
        case 'collect':
          recommendations.value = getCollectRecommendations(data)
          break
        case 'mes':
          recommendations.value = getMESRecommendations(data)
          break
        default:
          recommendations.value = []
      }
      return recommendations.value
    } finally {
      loading.value = false
    }
  }

  const clearRecommendations = () => {
    recommendations.value = []
  }

  return {
    // State
    recommendations,
    loading,

    // Computed
    criticalRecommendations,
    highPriorityRecommendations,
    sortedRecommendations,

    // Actions
    getAllRecommendations,
    getContextualRecommendations,
    getGlobalRecommendations,
    getTeamRecommendations,
    getEnginsRecommendations,
    getCollectRecommendations,
    getMESRecommendations,
    clearRecommendations
  }
})
