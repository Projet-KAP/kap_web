// Template CSV pour l'import de pieces detachees en stock
export const stockCSVTemplate = {
  structure: {
    filename: 'modele-import-stock.csv',
    headers: [
      'reference',
      'name',
      'description',
      'manufacturer',
      'manufacturer_ref',
      'stock_unit',
      'quantity',
      'min_stock',
      'max_stock',
      'threshold',
      'unit_price',
      'warehouse_code',
      'location_in_warehouse',
      'equipment_family',
      'status'
    ],
    requiredColumns: [
      'reference',
      'name',
      'warehouse_code'
    ]
  },

  validation: {
    allowedFileTypes: ['text/csv', 'application/csv', 'text/plain'],
    allowedExtensions: ['.csv'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxRows: 10000,
    encoding: 'UTF-8'
  },

  columnValidation: {
    'reference': {
      type: 'string',
      required: true,
      maxLength: 100
    },
    'name': {
      type: 'string',
      required: true,
      maxLength: 255
    },
    'description': {
      type: 'string',
      required: false,
      maxLength: 1000
    },
    'manufacturer': {
      type: 'string',
      required: false,
      maxLength: 200
    },
    'manufacturer_ref': {
      type: 'string',
      required: false,
      maxLength: 100
    },
    'stock_unit': {
      type: 'enum',
      required: false,
      values: ['PC', 'KG', 'L', 'M', 'M2', 'M3', 'BOX', 'SET'],
      default: 'PC'
    },
    'quantity': {
      type: 'number',
      required: false,
      min: 0,
      max: 999999
    },
    'min_stock': {
      type: 'number',
      required: false,
      min: 0,
      max: 999999
    },
    'max_stock': {
      type: 'number',
      required: false,
      min: 0,
      max: 999999
    },
    'threshold': {
      type: 'number',
      required: false,
      min: 0,
      max: 999999
    },
    'unit_price': {
      type: 'number',
      required: false,
      min: 0,
      max: 999999999
    },
    'warehouse_code': {
      type: 'string',
      required: true,
      maxLength: 50
    },
    'location_in_warehouse': {
      type: 'string',
      required: false,
      maxLength: 100
    },
    'equipment_family': {
      type: 'string',
      required: false,
      maxLength: 100
    },
    'status': {
      type: 'enum',
      required: false,
      values: ['DISPONIBLE', 'EN_COMMANDE', 'RESERVE', 'INDISPONIBLE'],
      default: 'DISPONIBLE'
    }
  },

  errorMessages: {
    invalidFileType: 'Le fichier doit être au format CSV (.csv)',
    fileTooLarge: 'Le fichier est trop volumineux (maximum 5MB)',
    invalidStructure: 'La structure du fichier CSV ne correspond pas au modèle requis',
    missingHeaders: 'En-tetes manquants dans le fichier CSV',
    invalidData: 'Données invalides détectées',
    tooManyRows: 'Trop de lignes dans le fichier (maximum 10 000)',
    encodingError: "Erreur d'encodage du fichier. Utilisez UTF-8."
  },

  sampleData: [
    {
      'reference': 'PDR-HYD-001',
      'name': 'Filtre hydraulique',
      'description': 'Filtre pour circuit hydraulique principal',
      'manufacturer': 'Parker',
      'manufacturer_ref': 'PAR-FH-200',
      'stock_unit': 'PC',
      'quantity': '10',
      'min_stock': '3',
      'max_stock': '20',
      'threshold': '5',
      'unit_price': '15000',
      'warehouse_code': 'WH-DKR-01',
      'location_in_warehouse': 'Etagere A-01',
      'equipment_family': 'Hydraulique',
      'status': 'DISPONIBLE'
    },
    {
      'reference': 'PDR-ELE-002',
      'name': 'Contacteur 3 phases',
      'description': 'Contacteur electrique triphasé 40A',
      'manufacturer': 'Schneider',
      'manufacturer_ref': 'LC1D25',
      'stock_unit': 'PC',
      'quantity': '5',
      'min_stock': '2',
      'max_stock': '10',
      'threshold': '3',
      'unit_price': '25000',
      'warehouse_code': 'WH-DKR-01',
      'location_in_warehouse': 'Etagere B-03',
      'equipment_family': 'Electrique',
      'status': 'DISPONIBLE'
    }
  ]
}

/**
 * Genere un template CSV pour telechargement
 */
export function generateCSVTemplate() {
  const template = stockCSVTemplate
  const headers = template.structure.headers
  const sampleData = template.sampleData

  let csvContent = headers.join(',') + '\n'

  sampleData.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || ''
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
          i++
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
  const template = stockCSVTemplate
  const errors = []
  const warnings = []

  const missingHeaders = template.structure.requiredColumns.filter(
    col => !headers.includes(col)
  )

  if (missingHeaders.length > 0) {
    errors.push({
      type: 'missing_headers',
      message: `Colonnes requises manquantes: ${missingHeaders.join(', ')}`
    })
  }

  const extraHeaders = headers.filter(
    header => !template.structure.headers.includes(header)
  )

  if (extraHeaders.length > 0) {
    warnings.push({
      type: 'extra_headers',
      message: `Colonnes supplementaires ignorees: ${extraHeaders.join(', ')}`
    })
  }

  if (data.length > template.validation.maxRows) {
    errors.push({
      type: 'too_many_rows',
      message: template.errorMessages.tooManyRows
    })
  }

  if (data.length === 0) {
    errors.push({
      type: 'no_data',
      message: 'Le fichier ne contient aucune ligne de données'
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
  const template = stockCSVTemplate
  const errors = []
  const warnings = []
  const seenReferences = new Set()

  data.forEach((row, rowIndex) => {
    headers.forEach((header, colIndex) => {
      const value = row[colIndex]
      const validation = template.columnValidation[header]

      if (!validation) return

      const actualRowNumber = rowIndex + 2

      if (validation.required && (!value || value.trim() === '')) {
        errors.push({
          type: 'required_field',
          message: `Champ requis manquant: ${header}`,
          row: actualRowNumber,
          column: header
        })
        return
      }

      if (!value || value.trim() === '') return

      switch (validation.type) {
        case 'number': {
          const num = parseFloat(value)
          if (isNaN(num)) {
            errors.push({
              type: 'invalid_number',
              message: `Valeur numerique invalide: ${value}`,
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
          if (!validation.values.includes(value.toUpperCase())) {
            errors.push({
              type: 'invalid_enum',
              message: `Valeur non autorisee: ${value}. Valeurs autorisees: ${validation.values.join(', ')}`,
              row: actualRowNumber,
              column: header
            })
          }
          break

        case 'string':
          if (validation.maxLength && value.length > validation.maxLength) {
            errors.push({
              type: 'string_too_long',
              message: `Texte trop long: ${value.length} caracteres (maximum: ${validation.maxLength})`,
              row: actualRowNumber,
              column: header
            })
          }
          break
      }
    })

    // Detecter les doublons de reference dans le fichier
    const refIndex = headers.indexOf('reference')
    if (refIndex !== -1 && row[refIndex]) {
      const ref = row[refIndex].trim()
      if (seenReferences.has(ref)) {
        warnings.push({
          type: 'duplicate_reference',
          message: `Reference en doublon dans le fichier: ${ref}`,
          row: rowIndex + 2,
          column: 'reference'
        })
      }
      seenReferences.add(ref)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export default stockCSVTemplate
