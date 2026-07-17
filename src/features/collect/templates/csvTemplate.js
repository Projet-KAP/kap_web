// Template CSV pour les collectes de données
export const collecteCSVTemplate = {
  // Structure du fichier CSV requis
  structure: {
    filename: 'modele-collecte.csv',
    headers: [
      'ID_Collecte',
      'Date_Collecte',
      'Type_Collecte',
      'Localisation',
      'Operateur',
      'Equipement_ID',
      'Equipement_Nom',
      'Valeur_Mesuree',
      'Unite_Mesure',
      'Statut_Conformite',
      'Observations',
      'Timestamp'
    ],
    requiredColumns: [
      'ID_Collecte',
      'Date_Collecte',
      'Type_Collecte',
      'Localisation',
      'Operateur',
      'Equipement_ID',
      'Valeur_Mesuree'
    ]
  },
  
  // Validation des données
  validation: {
    allowedFileTypes: ['text/csv', 'application/csv', 'text/plain'],
    allowedExtensions: ['.csv'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxRows: 10000,
    encoding: 'UTF-8'
  },

  // Règles de validation pour chaque colonne
  columnValidation: {
    'ID_Collecte': {
      type: 'string',
      required: true,
      pattern: /^[A-Z0-9_-]+$/,
      maxLength: 50
    },
    'Date_Collecte': {
      type: 'date',
      required: true,
      format: ['DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY']
    },
    'Type_Collecte': {
      type: 'enum',
      required: true,
      values: ['Manuelle', 'Semi-automatique', 'Automatique', 'Inspection', 'Maintenance']
    },
    'Localisation': {
      type: 'string',
      required: true,
      maxLength: 100
    },
    'Operateur': {
      type: 'string',
      required: true,
      maxLength: 100
    },
    'Equipement_ID': {
      type: 'string',
      required: true,
      pattern: /^[A-Z0-9_-]+$/,
      maxLength: 50
    },
    'Equipement_Nom': {
      type: 'string',
      required: false,
      maxLength: 150
    },
    'Valeur_Mesuree': {
      type: 'number',
      required: true,
      min: 0,
      max: 999999
    },
    'Unite_Mesure': {
      type: 'enum',
      required: false,
      values: ['kg', 'L', 'h', 'm', 'm²', 'm³', 'pcs', '%', '°C', 'bar', 'kW', 'V', 'A']
    },
    'Statut_Conformite': {
      type: 'enum',
      required: false,
      values: ['Conforme', 'Non-conforme', 'A-verifier', 'En-attente'],
      default: 'A-verifier'
    },
    'Observations': {
      type: 'string',
      required: false,
      maxLength: 500
    },
    'Timestamp': {
      type: 'datetime',
      required: false,
      format: ['DD/MM/YYYY HH:mm', 'YYYY-MM-DD HH:mm:ss', 'DD-MM-YYYY HH:mm']
    }
  },

  // Messages d'erreur
  errorMessages: {
    invalidFileType: 'Le fichier doit être au format CSV (.csv)',
    fileTooLarge: 'Le fichier est trop volumineux (maximum 5MB)',
    invalidStructure: 'La structure du fichier CSV ne correspond pas au modèle requis',
    missingHeaders: 'En-têtes manquants dans le fichier CSV',
    invalidData: 'Données invalides détectées',
    tooManyRows: 'Trop de lignes dans le fichier (maximum 10,000)',
    encodingError: 'Erreur d\'encodage du fichier. Utilisez UTF-8.'
  },

  // Données d'exemple pour le template
  sampleData: [
    {
      'ID_Collecte': 'COL_001',
      'Date_Collecte': '15/08/2024',
      'Type_Collecte': 'Manuelle',
      'Localisation': 'Atelier A - Zone 1',
      'Operateur': 'Jean Dupont',
      'Equipement_ID': 'EQ_PRESS_01',
      'Equipement_Nom': 'Presse hydraulique #1',
      'Valeur_Mesuree': '150',
      'Unite_Mesure': 'kg',
      'Statut_Conformite': 'Conforme',
      'Observations': 'Fonctionnement normal',
      'Timestamp': '15/08/2024 14:30'
    },
    {
      'ID_Collecte': 'COL_002',
      'Date_Collecte': '15/08/2024',
      'Type_Collecte': 'Inspection',
      'Localisation': 'Atelier B - Zone 2',
      'Operateur': 'Marie Martin',
      'Equipement_ID': 'EQ_CONV_02',
      'Equipement_Nom': 'Convoyeur #2',
      'Valeur_Mesuree': '2.5',
      'Unite_Mesure': 'm/s',
      'Statut_Conformite': 'A-verifier',
      'Observations': 'Vitesse légèrement élevée',
      'Timestamp': '15/08/2024 15:45'
    }
  ]
}

/**
 * Génère un template CSV pour téléchargement
 */
export function generateCSVTemplate() {
  const template = collecteCSVTemplate
  const headers = template.structure.headers
  const sampleData = template.sampleData

  // Créer le contenu CSV
  let csvContent = headers.join(',') + '\n'
  
  // Ajouter les données d'exemple
  sampleData.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || ''
      // Échapper les virgules et guillemets
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csvContent += values.join(',') + '\n'
  })

  return {
    content: csvContent,
    filename: template.structure.filename,
    type: 'text/csv;charset=utf-8;'
  }
}

/**
 * Parse un fichier CSV
 */
export function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length === 0) return { headers: [], data: [] }

  // Parser simple pour CSV (peut être amélioré selon les besoins)
  const parseCSVLine = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseCSVLine(lines[0])
  const data = lines.slice(1).map(line => parseCSVLine(line))

  return { headers, data }
}

/**
 * Valide la structure du CSV
 */
export function validateCSVStructure(headers, data) {
  const template = collecteCSVTemplate
  const errors = []
  const warnings = []

  // Vérifier les en-têtes requis
  const missingHeaders = template.structure.requiredColumns.filter(
    col => !headers.includes(col)
  )

  if (missingHeaders.length > 0) {
    errors.push({
      type: 'missing_headers',
      message: `Colonnes requises manquantes: ${missingHeaders.join(', ')}`
    })
  }

  // Vérifier les en-têtes supplémentaires
  const extraHeaders = headers.filter(
    header => !template.structure.headers.includes(header)
  )

  if (extraHeaders.length > 0) {
    warnings.push({
      type: 'extra_headers',
      message: `Colonnes supplémentaires ignorées: ${extraHeaders.join(', ')}`
    })
  }

  // Vérifier le nombre de lignes
  if (data.length > template.validation.maxRows) {
    errors.push({
      type: 'too_many_rows',
      message: template.errorMessages.tooManyRows
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Valide le contenu du CSV
 */
export function validateCSVContent(data, headers) {
  const template = collecteCSVTemplate
  const errors = []
  const warnings = []

  data.forEach((row, rowIndex) => {
    headers.forEach((header, colIndex) => {
      const value = row[colIndex]
      const validation = template.columnValidation[header]

      if (!validation) return

      const actualRowNumber = rowIndex + 2 // +2 pour en-tête et index 0

      // Vérifier les champs requis
      if (validation.required && (!value || value.trim() === '')) {
        errors.push({
          type: 'required_field',
          message: `Champ requis manquant: ${header}`,
          row: actualRowNumber,
          column: header
        })
        return
      }

      // Skip validation si valeur vide et non requis
      if (!value || value.trim() === '') return

      // Validation selon le type
      switch (validation.type) {
        case 'number': {
          const num = parseFloat(value)
          if (isNaN(num)) {
            errors.push({
              type: 'invalid_number',
              message: `Valeur numérique invalide: ${value}`,
              row: actualRowNumber,
              column: header
            })
          } else {
            if (validation.min !== undefined && num < validation.min) {
              errors.push({
                type: 'number_too_small',
                message: `Valeur trop petite: ${value} (minimum: ${validation.min})`,
                row: actualRowNumber,
                column: header
              })
            }
            if (validation.max !== undefined && num > validation.max) {
              errors.push({
                type: 'number_too_large',
                message: `Valeur trop grande: ${value} (maximum: ${validation.max})`,
                row: actualRowNumber,
                column: header
              })
            }
          }
          break
        }

        case 'enum':
          if (!validation.values.includes(value)) {
            errors.push({
              type: 'invalid_enum',
              message: `Valeur non autorisée: ${value}. Valeurs autorisées: ${validation.values.join(', ')}`,
              row: actualRowNumber,
              column: header
            })
          }
          break

        case 'string':
          if (validation.maxLength && value.length > validation.maxLength) {
            errors.push({
              type: 'string_too_long',
              message: `Texte trop long: ${value.length} caractères (maximum: ${validation.maxLength})`,
              row: actualRowNumber,
              column: header
            })
          }
          if (validation.pattern && !validation.pattern.test(value)) {
            errors.push({
              type: 'invalid_pattern',
              message: `Format invalide: ${value}`,
              row: actualRowNumber,
              column: header
            })
          }
          break
      }
    })
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export default collecteCSVTemplate
