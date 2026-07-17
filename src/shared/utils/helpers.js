import { ERROR_MESSAGES } from './constants'

/**
 * Formate une erreur API en message utilisateur
 * @param {Error} error - L'erreur à formater
 * @returns {string} Le message d'erreur formaté
 */
export const formatApiError = (error) => {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR
  
  if (error.response) {
    const { status, data } = error.response
    
    switch (status) {
      case 400:
        return data.error || data.detail || ERROR_MESSAGES.VALIDATION_ERROR
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED
      case 403:
        return ERROR_MESSAGES.FORBIDDEN
      case 404:
        return ERROR_MESSAGES.NOT_FOUND
      case 500:
        return ERROR_MESSAGES.UNKNOWN_ERROR
      default:
        return data.error || data.detail || ERROR_MESSAGES.UNKNOWN_ERROR
    }
  }
  
  if (error.request) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }
  
  return error.message || ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Valide un email
 * @param {string} email - L'email à valider
 * @returns {boolean} True si l'email est valide
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valide un mot de passe (minimum 8 caractères)
 * @param {string} password - Le mot de passe à valider
 * @returns {boolean} True si le mot de passe est valide
 */
export const isValidPassword = (password) => {
  return password && password.length >= 8
}

/**
 * Formate un nom complet
 * @param {string} firstName - Le prénom
 * @param {string} lastName - Le nom
 * @returns {string} Le nom complet formaté
 */
export const formatFullName = (firstName, lastName) => {
  if (!firstName && !lastName) return 'Utilisateur'
  return `${firstName || ''} ${lastName || ''}`.trim()
}

/**
 * Débounce une fonction
 * @param {Function} func - La fonction à débouncer
 * @param {number} wait - Le délai d'attente en ms
 * @returns {Function} La fonction débouncée
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Formate une date
 * @param {Date|string} date - La date à formater
 * @returns {string} La date formatée
 */
export const formatDate = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Formate une date et heure
 * @param {Date|string} date - La date à formater
 * @returns {string} La date et heure formatées
 */
export const formatDateTime = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
} 