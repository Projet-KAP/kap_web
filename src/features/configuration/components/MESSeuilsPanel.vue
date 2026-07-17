<template>
  <div class="seuils-panel">
    <div class="panel-layout">
      <!-- Sidebar Categories -->
      <div class="categories-sidebar">
        <h3 class="sidebar-title">CATÉGORIES KAP MES</h3>
        <div class="categories-list">
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-item"
            :class="{ active: selectedCategory === category.id }"
            @click="selectedCategory = category.id"
          >
            <div class="category-header">
              <i :class="category.icon"></i>
              <span class="category-name">{{ category.name }}</span>
              <span v-if="category.status" class="category-badge" :class="category.status">
                {{ category.status.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- KPIs Content -->
      <div class="kpis-content">
        <div v-if="currentCategory">
          <div class="category-header-block">
            <div class="category-info">
              <i :class="currentCategory.icon" class="icon-lg"></i>
              <div>
                <h2>{{ currentCategory.name }}</h2>
                <p>{{ currentCategory.description }}</p>
              </div>
            </div>
            <Button 
              label="Tout activer" 
              icon="pi pi-check"
              text
              severity="success"
              @click="enableAll"
            />
          </div>

          <!-- KPIs Table -->
          <div class="kpis-table">
            <div v-for="kpi in currentCategory.kpis" :key="kpi.id" class="kpi-row">
              <div class="kpi-info">
                <div class="kpi-header">
                  <h4>{{ kpi.name }}</h4>
                  <p class="kpi-description">{{ kpi.description }}</p>
                </div>
              </div>

              <div class="kpi-values">
                <div class="value-item current">
                  <label>VALEUR ACTUELLE</label>
                  <span class="value" :class="getValueClass(kpi)">{{ kpi.currentValue }}</span>
                </div>

                <div class="value-item threshold">
                  <label>AVERTISSEMENT</label>
                  <div class="input-group">
                    <input v-model.number="kpi.warningThreshold" type="number" />
                    <span class="unit">{{ kpi.unit }}</span>
                  </div>
                </div>

                <div class="value-item threshold critical">
                  <label>CRITIQUE</label>
                  <div class="input-group">
                    <input v-model.number="kpi.criticalThreshold" type="number" />
                    <span class="unit">{{ kpi.unit }}</span>
                  </div>
                </div>

                <div class="value-item status">
                  <label>STATUT</label>
                  <Tag :value="kpi.status" :severity="getStatusSeverity(kpi.status)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

export default {
  name: 'MESSeuilsPanel',
  components: {
    Button,
    Tag,
  },
  setup() {
    const selectedCategory = ref(1)

    const categories = ref([
      {
        id: 1,
        name: 'TRS & Performance',
        icon: 'pi pi-chart-line',
        description: 'Taux de Rendement Synthétique — Disponibilité, Performance, Qualité',
        status: 'ok',
        kpis: [
          {
            id: 1,
            name: 'TRS Global',
            description: 'D = P × Q en %',
            currentValue: '80.3%',
            warningThreshold: 75,
            criticalThreshold: 65,
            unit: '%',
            notifications: ['app', 'sms', 'email'],
            status: 'Normal'
          },
          {
            id: 2,
            name: 'Disponibilité (D)',
            description: 'Temps machine / Temps calendaire - %',
            currentValue: '68.2%',
            warningThreshold: 75,
            criticalThreshold: 65,
            unit: '%',
            notifications: ['app', 'sms', 'email'],
            status: 'Avertissement'
          },
          {
            id: 3,
            name: 'Performance (P)',
            description: 'Cadence réelle / Cadence théorique - %',
            currentValue: '92.1%',
            warningThreshold: 85,
            criticalThreshold: 75,
            unit: '%',
            notifications: ['app', 'sms', 'email'],
            status: 'Normal'
          },
          {
            id: 4,
            name: 'Qualité (Q)',
            description: 'Pièces bonnes / Total produit - %',
            currentValue: '99.7%',
            warningThreshold: 97,
            criticalThreshold: 95,
            unit: '%',
            notifications: ['app', 'sms', 'email'],
            status: 'Normal'
          },
        ]
      },
      {
        id: 2,
        name: 'Arrêts machines',
        icon: 'pi pi-exclamation-circle',
        description: 'Durée et fréquence des arrêts non planifiés',
        status: 'warning',
        kpis: [
          {
            id: 5,
            name: 'Durée arrêt continu',
            description: 'Temps de dernier arrêt - minutes',
            currentValue: '12 min',
            warningThreshold: 30,
            criticalThreshold: 60,
            unit: 'min',
            notifications: ['app', 'sms', 'email'],
            status: 'Normal'
          },
          {
            id: 6,
            name: 'Heures arrêts / mois',
            description: 'Total arrêts non planifiés - heures',
            currentValue: '28h',
            warningThreshold: 35,
            criticalThreshold: 50,
            unit: 'h',
            notifications: ['app', 'sms', 'email'],
            status: 'Normal'
          },
          {
            id: 7,
            name: 'Nb. arrêts / semaine',
            description: 'Fréquence des arrêts - nombre',
            currentValue: '18',
            warningThreshold: 15,
            criticalThreshold: 25,
            unit: '/sem',
            notifications: ['app', 'sms', 'email'],
            status: 'Avertissement'
          },
        ]
      },
      {
        id: 3,
        name: 'Qualité & Rebuts',
        icon: 'pi pi-check-circle',
        description: 'Taux de non-conformité et coût des rebuts',
        status: 'ok',
        kpis: [
          {
            id: 8,
            name: 'Taux de rebuts',
            description: 'Pièces non conformes / coût des rebuts - %',
            currentValue: '4.8%',
            warningThreshold: 2,
            criticalThreshold: 4,
            unit: '%',
            notifications: ['app', 'sms', 'email'],
            status: 'Critique'
          },
          {
            id: 9,
            name: 'Coût rebuts / mois',
            description: 'Valeur matière perdue - FCFA',
            currentValue: '840K',
            warningThreshold: 500,
            criticalThreshold: 1000,
            unit: 'k FCFA',
            notifications: ['app', 'sms', 'email'],
            status: 'Avertissement'
          },
          {
            id: 10,
            name: 'Désynchronisation Process/Cond.',
            description: 'Écart de cadence entre deux lignes - %',
            currentValue: '3.2%',
            warningThreshold: 10,
            criticalThreshold: 20,
            unit: '%',
            notifications: ['app', 'sms', 'email'],
            status: 'Normal'
          },
        ]
      },
      {
        id: 4,
        name: 'Production',
        icon: 'pi pi-chart-bar',
        description: 'Volume produit et cadence de production',
        status: 'ok',
        kpis: [
          {
            id: 11,
            name: 'Volume produit/jour',
            description: 'Nombre de pièces produites',
            currentValue: '2450',
            warningThreshold: 2000,
            criticalThreshold: 1500,
            unit: 'pcs',
            notifications: ['app', 'sms', 'email'],
            status: 'Normal'
          },
          {
            id: 12,
            name: 'Cadence moyenne',
            description: 'Pièces par heure en production',
            currentValue: '305',
            warningThreshold: 250,
            criticalThreshold: 200,
            unit: 'pcs/h',
            notifications: ['app', 'sms', 'email'],
            status: 'Normal'
          },
        ]
      },
    ])

    const currentCategory = computed(() => 
      categories.value.find(c => c.id === selectedCategory.value)
    )

    const getValueClass = (kpi) => {
      if (kpi.status === 'Critique') return 'critical'
      if (kpi.status === 'Avertissement') return 'warning'
      return 'normal'
    }

    const getStatusSeverity = (status) => {
      switch (status) {
        case 'Normal': return 'success'
        case 'Avertissement': return 'warning'
        case 'Critique': return 'danger'
        default: return 'info'
      }
    }

    const enableAll = () => {
      if (currentCategory.value) {
        currentCategory.value.kpis.forEach(kpi => {
          kpi.status = 'Normal'
        })
      }
    }

    return {
      selectedCategory,
      categories,
      currentCategory,
      getValueClass,
      getStatusSeverity,
      enableAll,
    }
  },
}
</script>

<style scoped lang="scss">
.seuils-panel {
  width: 100%;

  .panel-layout {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  .categories-sidebar {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    height: fit-content;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .sidebar-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 1rem 0;
    }

    .categories-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .category-item {
      padding: 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:hover {
        background: #f5f5f5;
      }

      &.active {
        background: #e8f5e9;
        border-color: #7AC943;

        .category-header {
          color: #002060;
          font-weight: 600;
        }
      }

      .category-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transition: all 0.3s ease;

        i {
          font-size: 1.1rem;
        }

        .category-name {
          flex: 1;
          font-size: 0.9rem;
        }

        .category-badge {
          font-size: 0.65rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;

          &.ok {
            background: #e8f5e9;
            color: #2e7d32;
          }

          &.warning {
            background: #fff3e0;
            color: #e65100;
          }

          &.critical {
            background: #ffebee;
            color: #c62828;
          }
        }
      }
    }
  }

  .kpis-content {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .category-header-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #f0f0f0;

      .category-info {
        display: flex;
        align-items: flex-start;
        gap: 1.5rem;

        .icon-lg {
          font-size: 2.5rem;
          color: #7AC943;
          margin-top: 0.5rem;
        }

        h2 {
          margin: 0 0 0.5rem 0;
          color: #002060;
          font-size: 1.5rem;
        }

        p {
          margin: 0;
          color: #999;
          font-size: 0.95rem;
        }
      }
    }

    .kpis-table {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .kpi-row {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 2rem;
      padding: 1.5rem;
      background: #f9f9f9;
      border-radius: 8px;
      border-left: 4px solid #7AC943;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .kpi-info {
        .kpi-header {
          h4 {
            margin: 0 0 0.5rem 0;
            color: #002060;
            font-size: 1.05rem;
            font-weight: 600;
          }

          .kpi-description {
            margin: 0;
            color: #999;
            font-size: 0.85rem;
          }
        }
      }

      .kpi-values {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1rem;

        @media (max-width: 1200px) {
          grid-template-columns: repeat(3, 1fr);
        }

        @media (max-width: 768px) {
          grid-template-columns: repeat(2, 1fr);
        }

        .value-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;

          label {
            font-size: 0.7rem;
            font-weight: 600;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          &.current {
            .value {
              font-size: 1.3rem;
              font-weight: 700;
              color: #002060;

              &.warning {
                color: #ff9800;
              }

              &.critical {
                color: #f44336;
              }
            }
          }

          &.threshold {
            .input-group {
              display: flex;
              align-items: center;
              gap: 0.5rem;

              input {
                flex: 1;
                padding: 0.6rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.95rem;
                font-weight: 600;

                &:focus {
                  outline: none;
                  border-color: #7AC943;
                  box-shadow: 0 0 0 2px rgba(122, 201, 67, 0.1);
                }
              }

              .unit {
                color: #999;
                font-size: 0.85rem;
                min-width: 30px;
              }
            }

            &.critical {
              .input-group input {
                border-color: #ff9800;

                &:focus {
                  border-color: #f44336;
                  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.1);
                }
              }
            }
          }

          &.notifications {
            .notification-badges {
              display: flex;
              gap: 0.5rem;
              flex-wrap: wrap;

              :deep(.p-badge) {
                background: #7AC943;
                color: white;
                font-weight: 600;
                font-size: 0.75rem;
                padding: 0.25rem 0.5rem;
                border-radius: 3px;
              }
            }
          }

          &.status {
            :deep(.p-tag) {
              font-weight: 600;
            }
          }
        }
      }
    }
  }
}
</style>
