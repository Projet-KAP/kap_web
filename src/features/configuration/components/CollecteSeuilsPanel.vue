<template>
  <div class="seuils-panel">
    <div class="category-header-block">
      <div class="category-info">
        <i class="pi pi-cloud-upload icon-lg"></i>
        <div>
          <h2>Configuration des Seuils Collecte</h2>
          <p>Définissez les seuils de qualité et de fréquence de collecte de données</p>
        </div>
      </div>
    </div>

    <div class="simple-kpis-table">
      <div class="kpi-row">
        <div class="kpi-info">
          <h4>Taux de Complétude</h4>
          <p class="kpi-description">Pourcentage de données collectées par rapport aux données attendues</p>
        </div>
        <div class="kpi-values">
          <div class="value-item current">
            <label>VALEUR ACTUELLE</label>
            <span class="value">94.2%</span>
          </div>
          <div class="value-item threshold">
            <label>AVERTISSEMENT</label>
            <div class="input-group">
              <input type="number" value="90" />
              <span class="unit">%</span>
            </div>
          </div>
          <div class="value-item threshold critical">
            <label>CRITIQUE</label>
            <div class="input-group">
              <input type="number" value="80" />
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
          <h4>Anomalies Détectées</h4>
          <p class="kpi-description">Nombre d'anomalies dans les données collectées</p>
        </div>
        <div class="kpi-values">
          <div class="value-item current">
            <label>VALEUR ACTUELLE</label>
            <span class="value warning">23 anomalies</span>
          </div>
          <div class="value-item threshold">
            <label>AVERTISSEMENT</label>
            <div class="input-group">
              <input type="number" value="10" />
              <span class="unit">anomalies</span>
            </div>
          </div>
          <div class="value-item threshold critical">
            <label>CRITIQUE</label>
            <div class="input-group">
              <input type="number" value="30" />
              <span class="unit">anomalies</span>
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
          <h4>Délai de Synchronisation</h4>
          <p class="kpi-description">Délai maximum entre la collecte et la synchronisation en cloud</p>
        </div>
        <div class="kpi-values">
          <div class="value-item current">
            <label>VALEUR ACTUELLE</label>
            <span class="value">2.3 minutes</span>
          </div>
          <div class="value-item threshold">
            <label>AVERTISSEMENT</label>
            <div class="input-group">
              <input type="number" value="5" />
              <span class="unit">min</span>
            </div>
          </div>
          <div class="value-item threshold critical">
            <label>CRITIQUE</label>
            <div class="input-group">
              <input type="number" value="10" />
              <span class="unit">min</span>
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
          <h4>Disponibilité des Capteurs</h4>
          <p class="kpi-description">Pourcentage des capteurs actifs et opérationnels</p>
        </div>
        <div class="kpi-values">
          <div class="value-item current">
            <label>VALEUR ACTUELLE</label>
            <span class="value">98.7%</span>
          </div>
          <div class="value-item threshold">
            <label>AVERTISSEMENT</label>
            <div class="input-group">
              <input type="number" value="95" />
              <span class="unit">%</span>
            </div>
          </div>
          <div class="value-item threshold critical">
            <label>CRITIQUE</label>
            <div class="input-group">
              <input type="number" value="85" />
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
          <h4>Volume Données/jour</h4>
          <p class="kpi-description">Volume de données collectées quotidiennement</p>
        </div>
        <div class="kpi-values">
          <div class="value-item current">
            <label>VALEUR ACTUELLE</label>
            <span class="value">2.4 GB</span>
          </div>
          <div class="value-item threshold">
            <label>AVERTISSEMENT</label>
            <div class="input-group">
              <input type="number" value="3" />
              <span class="unit">GB</span>
            </div>
          </div>
          <div class="value-item threshold critical">
            <label>CRITIQUE</label>
            <div class="input-group">
              <input type="number" value="5" />
              <span class="unit">GB</span>
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
  name: 'CollecteSeuilsPanel',
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
        color: #00BCD4;
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
    border-left: 4px solid #00BCD4;

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
                border-color: #00BCD4;
                box-shadow: 0 0 0 2px rgba(0, 188, 212, 0.1);
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
