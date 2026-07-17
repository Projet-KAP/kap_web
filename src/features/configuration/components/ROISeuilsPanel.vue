<template>
  <div class="seuils-panel">
    <div class="category-header-block">
      <div class="category-info">
        <i class="pi pi-calculator icon-lg"></i>
        <div>
          <h2>Configuration des Seuils ROI</h2>
          <p>Définissez les seuils de rentabilité et retour sur investissement</p>
        </div>
      </div>
    </div>

    <div class="simple-kpis-table">
      <div class="kpi-row">
        <div class="kpi-info">
          <h4>Marge Brute</h4>
          <p class="kpi-description">Marge brute sur les ventes</p>
        </div>
        <div class="kpi-values">
          <div class="value-item current">
            <label>VALEUR ACTUELLE</label>
            <span class="value">32.5%</span>
          </div>
          <div class="value-item threshold">
            <label>AVERTISSEMENT</label>
            <div class="input-group">
              <input type="number" value="25" />
              <span class="unit">%</span>
            </div>
          </div>
          <div class="value-item threshold critical">
            <label>CRITIQUE</label>
            <div class="input-group">
              <input type="number" value="15" />
              <span class="unit">%</span>
            </div>
          </div>
          <div class="value-item status">
            <label>STATUT</label>
            <Tag value="Normal" severity="success" />
          </div>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-info">
          <h4>ROI Projets</h4>
          <p class="kpi-description">Retour sur investissement des projets</p>
        </div>
        <div class="kpi-values">
          <div class="value-item current">
            <label>VALEUR ACTUELLE</label>
            <span class="value">18.5%</span>
          </div>
          <div class="value-item threshold">
            <label>AVERTISSEMENT</label>
            <div class="input-group">
              <input type="number" value="12" />
              <span class="unit">%</span>
            </div>
          </div>
          <div class="value-item threshold critical">
            <label>CRITIQUE</label>
            <div class="input-group">
              <input type="number" value="5" />
              <span class="unit">%</span>
            </div>
          </div>
          <div class="value-item status">
            <label>STATUT</label>
            <Tag value="Normal" severity="success" />
          </div>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-info">
          <h4>Coût Opérationnel</h4>
          <p class="kpi-description">Pourcentage des coûts opérationnels sur CA</p>
        </div>
        <div class="kpi-values">
          <div class="value-item current">
            <label>VALEUR ACTUELLE</label>
            <span class="value warning">42.3%</span>
          </div>
          <div class="value-item threshold">
            <label>AVERTISSEMENT</label>
            <div class="input-group">
              <input type="number" value="40" />
              <span class="unit">%</span>
            </div>
          </div>
          <div class="value-item threshold critical">
            <label>CRITIQUE</label>
            <div class="input-group">
              <input type="number" value="50" />
              <span class="unit">%</span>
            </div>
          </div>
          <div class="value-item status">
            <label>STATUT</label>
            <Tag value="Avertissement" severity="warning" />
          </div>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-info">
          <h4>Délai de Récupération</h4>
          <p class="kpi-description">Temps pour récupérer l'investissement initial</p>
        </div>
        <div class="kpi-values">
          <div class="value-item current">
            <label>VALEUR ACTUELLE</label>
            <span class="value">18 mois</span>
          </div>
          <div class="value-item threshold">
            <label>AVERTISSEMENT</label>
            <div class="input-group">
              <input type="number" value="24" />
              <span class="unit">mois</span>
            </div>
          </div>
          <div class="value-item threshold critical">
            <label>CRITIQUE</label>
            <div class="input-group">
              <input type="number" value="36" />
              <span class="unit">mois</span>
            </div>
          </div>
          <div class="value-item status">
            <label>STATUT</label>
            <Tag value="Normal" severity="success" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Tag from 'primevue/tag'

export default {
  name: 'ROISeuilsPanel',
  components: {
    Tag,
  },
}
</script>

<style scoped lang="scss">
.seuils-panel {
  width: 100%;

  .category-header-block {
    display: flex;
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
        color: #9B59B6;
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

  .simple-kpis-table {
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
    border-left: 4px solid #9B59B6;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .kpi-info {
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

    .kpi-values {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;

      @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
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
                border-color: #9B59B6;
                box-shadow: 0 0 0 2px rgba(155, 89, 182, 0.1);
              }
            }

            .unit {
              color: #999;
              font-size: 0.85rem;
              min-width: 50px;
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
</style>
