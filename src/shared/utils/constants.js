// Couleurs de la marque KAP CONSEIL
export const BRAND_COLORS = {
  PRIMARY: '#0B2B3C',
  SECONDARY: '#7AC943',
  WHITE: '#FFFFFF',
  ERROR: '#ef4444',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b'
}

// Configuration de l'API
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api/',
  TIMEOUT: 1200000,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login/',
      LOGOUT: '/auth/logout/',
      CHANGE_PASSWORD: '/auth/change-password/'
    },
    USERS: {
      LIST: '/accounts/users/',
      DETAIL: '/accounts/users/{id}/',
      STATS: '/accounts/users/stats/'
    }
  }
}

// Messages d'erreur communs
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion au serveur',
  UNAUTHORIZED: 'Non autorisé',
  FORBIDDEN: 'Accès interdit',
  NOT_FOUND: 'Ressource introuvable',
  VALIDATION_ERROR: 'Erreur de validation',
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite'
}

// Messages de succès
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Connexion réussie',
  LOGOUT_SUCCESS: 'Déconnexion réussie',
  PASSWORD_CHANGED: 'Mot de passe modifié avec succès',
  USER_CREATED: 'Utilisateur créé avec succès',
  USER_UPDATED: 'Utilisateur modifié avec succès',
  USER_DELETED: 'Utilisateur supprimé avec succès'
}

// Configuration de l'application
export const APP_CONFIG = {
  NAME: 'KAP CONSEIL',
  SLOGAN: 'L\'excellence industrielle par la donnée et l\'action',
  VERSION: '1.0.0'
} 