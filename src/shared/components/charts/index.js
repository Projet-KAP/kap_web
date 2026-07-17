// Composants Plotly avancés pour dashboards KAP
// Tous les types de graphiques supportés

export { default as PlotlyChart } from './PlotlyChart.vue'
export { default as GaugeChart } from './GaugeChart.vue'
export { default as HeatmapChart } from './HeatmapChart.vue'
export { default as TreemapChart } from './TreemapChart.vue'
export { default as SankeyChart } from './SankeyChart.vue'
export { default as WaterfallChart } from './WaterfallChart.vue'
export { default as BulletChart } from './BulletChart.vue'
export { default as AreaChart } from './AreaChart.vue'
export { default as StackedBarChart } from './StackedBarChart.vue'
export { default as ScatterChart } from './ScatterChart.vue'

/**
 * Types de graphiques disponibles:
 *
 * 1. GaugeChart - Jauge avec seuils de couleur
 *    Props: value, min, max, suffix, thresholds, colors
 *
 * 2. HeatmapChart - Carte de chaleur
 *    Props: xLabels, yLabels, values, colorscale
 *
 * 3. TreemapChart - Treemap hiérarchique
 *    Props: labels, parents, values, colors
 *
 * 4. SankeyChart - Diagramme de flux Sankey
 *    Props: nodes, links, orientation
 *
 * 5. WaterfallChart - Graphique en cascade
 *    Props: labels, values, measure, colors
 *
 * 6. BulletChart - Graphique bullet avec cible
 *    Props: value, target, ranges, rangeColors
 *
 * 7. AreaChart - Graphique en aires (empilées ou non)
 *    Props: labels, datasets, stacked
 *
 * 8. StackedBarChart - Barres empilées
 *    Props: labels, datasets, orientation, percentMode
 *
 * 9. ScatterChart - Nuage de points avec régression
 *    Props: datasets, xAxisTitle, yAxisTitle, showTrendline
 *
 * 10. PlotlyChart - Wrapper générique pour tout type Plotly
 *     Props: data, layout, config
 */
