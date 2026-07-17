<template>
  <div class="welcome-banner">
    <div class="banner-content">
      <div class="brand-section">
        <img src="@/assets/logo_kap.png" alt="KAP CONSEIL" class="brand-logo" />
        <h1 class="brand-title">KAP CONSEIL</h1>
      </div>
      
      <div class="welcome-content">
        <h2 class="welcome-title">
          KAP, la solution IA pour piloter votre <span class="highlight">performance industrielle</span>
        </h2>
        <p class="welcome-description">
          Accompagnement terrain et plateforme digitale intelligente pour les entreprises africaines. 
          De la collecte manuelle au pilotage connecté, adaptée à votre niveau de maturité.
        </p>
        
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">
              <i class="pi pi-database"></i>
            </div>
            <span>Collecte manuelle ou Excel</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <i class="pi pi-sitemap"></i>
            </div>
            <span>Suivi de vos KPIs industriels</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <i class="pi pi-cog"></i>
            </div>
            <span>Analyse de l'utilisation des engins</span>
          </div>
        </div>
        
        <div class="company-info">
          <p class="company-description">
            <strong>KAP Conseil</strong> - Bureau d'études industriel spécialisé dans la structuration, 
            l'analyse et l'optimisation des opérations en usine et sur chantier.
          </p>
        </div>
      </div>
    </div>
    
    <div class="background-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>
  </div>
</template>

<script setup>
// Composant statique moderne - pas besoin de logique complexe
</script>

<style scoped>
.welcome-banner {
  position: relative;
  min-height: 400px;
  display: flex;
  align-items: center;
  padding: 2rem;
  background: #f8fafc;
  overflow: hidden;
}

.banner-content {
  width: 100%;
  z-index: 2;
  position: relative;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.brand-logo {
  width: 3.5rem;
  height: 3.5rem;
  object-fit: contain;
}

.brand-title {
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  font-family: 'Inter', sans-serif;
  letter-spacing: -0.025em;
}

.welcome-content {
  max-width: 500px;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.75rem 0;
  line-height: 1.2;
  font-family: 'Inter', sans-serif;
}

.highlight {
  background: #7AC943;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-description {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  font-weight: 400;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateX(4px);
  border-color: #059669;
}

.feature-icon {
  width: 2rem;
  height: 2rem;
  background: #7AC943;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.feature-item span {
  color: #374151;
  font-weight: 500;
  font-size: 0.8rem;
}

.company-info {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(11, 43, 60, 0.05);
  border-radius: 8px;
  border-left: 4px solid #0B2B3C;
}

.company-description {
  color: #475569;
  font-size: 0.8rem;
  line-height: 1.5;
  margin: 0;
  font-style: italic;
}

.company-description strong {
  color: #0B2B3C;
  font-weight: 700;
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(122, 201, 67, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 120px;
  height: 120px;
  top: 10%;
  right: 15%;
  animation-delay: 0s;
}

.circle-2 {
  width: 80px;
  height: 80px;
  top: 60%;
  right: 25%;
  animation-delay: 2s;
}

.circle-3 {
  width: 60px;
  height: 60px;
  top: 35%;
  right: 5%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

@media (max-width: 768px) {
  .welcome-banner {
    min-height: 350px;
    padding: 1.5rem;
  }
  
  .brand-section {
    margin-bottom: 1.5rem;
  }
  
  .brand-logo {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .brand-title {
    font-size: 1.25rem;
  }
  
  .welcome-title {
    font-size: 1.5rem;
  }

  .welcome-description {
    font-size: 0.85rem;
    margin-bottom: 1.25rem;
  }
  
  .company-info {
    margin-top: 1.5rem;
    padding: 1rem;
  }
  
  .company-description {
    font-size: 0.8rem;
  }
  
  .circle-1 {
    width: 80px;
    height: 80px;
  }
  
  .circle-2 {
    width: 60px;
    height: 60px;
  }
  
  .circle-3 {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 480px) {
  .welcome-title {
    font-size: 1.25rem;
  }

  .welcome-description {
    font-size: 0.8rem;
  }
  
  .brand-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .company-info {
    margin-top: 1rem;
    padding: 0.75rem;
  }
  
  .company-description {
    font-size: 0.75rem;
  }
}
</style> 