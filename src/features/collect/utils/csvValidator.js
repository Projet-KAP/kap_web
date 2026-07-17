import { collecteCSVTemplate, parseCSV, validateCSVStructure, validateCSVContent } from '../templates/csvTemplate.js'

/**
 * Classe pour valider les fichiers CSV de collecte
 */
export class CSVValidator {
  constructor() {
    this.template = collecteCSVTemplate
  }

  /**
   * Valide un fichier CSV complet
   * @param {File} file - Le fichier CSV à valider
   * @returns {Promise<Object>} Résultat de la validation
   */
  async validateFile(file) {
    try {
      // Validation du fichier lui-même
      const fileValidation = this.validateFileProperties(file)
      if (!fileValidation.isValid) {
        return fileValidation
      }

      // Lecture du fichier CSV
      const csvContent = await this.readCSVFile(file);
      
      // Parse du CSV
      const { headers, data } = parseCSV(csvContent)
      
      // Validation de la structure
      const structureValidation = validateCSVStructure(headers, data)
      if (!structureValidation.isValid) {
        return {
          isValid: false,
          errors: structureValidation.errors,
          warnings: structureValidation.warnings || []
        }
      }

      // Validation du contenu
      const contentValidation = validateCSVContent(data, headers)
      
      return {
        isValid: contentValidation.isValid,
        errors: contentValidation.errors,
        warnings: [...(structureValidation.warnings || []), ...(contentValidation.warnings || [])],
        data: {
          headers,
          rows: data,
          totalRows: data.length
        }
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          type: 'file_error',
          message: `Erreur lors de la lecture du fichier: ${error.message}`
        }]
      }
    }
  }

  /**
   * Valide les propriétés du fichier (taille, type, etc.)
   * @param {File} file 
   * @returns {Object}
   */
  validateFileProperties(file) {
    const errors = []

    // Vérifier le type de fichier
    if (!this.template.validation.allowedFileTypes.includes(file.type)) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!this.template.validation.allowedExtensions.includes(`.${extension}`)) {
        errors.push({
          type: 'invalid_file_type',
          message: this.template.errorMessages.invalidFileType
        })
      }
    }

    // Vérifier la taille du fichier
    if (file.size > this.template.validation.maxFileSize) {
      errors.push({
        type: 'file_too_large',
        message: this.template.errorMessages.fileTooLarge
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Lit un fichier CSV et retourne le contenu
   * @param {File} file 
   * @returns {Promise<string>}
   */
  readCSVFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target.result
          resolve(content)
        } catch (error) {
          reject(new Error('Format de fichier CSV invalide'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'))
      }
      
      reader.readAsText(file, 'UTF-8')
    })
  }

  /**
   * Génère un rapport de validation détaillé
   * @param {Object} validationResult 
   * @returns {Object}
   */
  generateValidationReport(validationResult) {
    const { isValid, errors = [], warnings = [], data = {} } = validationResult

    const report = {
      status: isValid ? 'valid' : 'invalid',
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        totalRows: data.totalRows || 0,
        hasData: (data.totalRows || 0) > 0
      },
      details: {
        errors: errors.map(error => ({
          type: error.type,
          message: error.message,
          row: error.row || null,
          column: error.column || null
        })),
        warnings: warnings.map(warning => ({
          type: warning.type,
          message: warning.message,
          row: warning.row || null,
          column: warning.column || null
        }))
      },
      data: data || null
    }

    return report
  }

  /**
   * Formate les données validées pour l'import
   * @param {Array} headers 
   * @param {Array} data 
   * @returns {Array}
   */
  formatDataForImport(headers, data) {
    return data.map((row, index) => {
      const formattedRow = { _rowIndex: index + 2 } // +2 pour tenir compte de l'en-tête
      
      headers.forEach((header, colIndex) => {
        formattedRow[header] = row[colIndex] || ''
      })
      
      return formattedRow
    })
  }

  /**
   * Convertit les données formatées au format attendu par le service
   * @param {Array} formattedData 
   * @returns {Array}
   */
  convertToServiceFormat(formattedData) {
    return formattedData.map(row => ({
      id: `imported_${Date.now()}_${row._rowIndex}`,
      collecte_id: row.ID_Collecte,
      date_collecte: row.Date_Collecte,
      type_collecte: row.Type_Collecte,
      localisation: row.Localisation,
      operateur: row.Operateur,
      equipement_id: row.Equipement_ID,
      equipement_nom: row.Equipement_Nom || '',
      valeur_mesuree: parseFloat(row.Valeur_Mesuree) || 0,
      unite_mesure: row.Unite_Mesure || '',
      statut_conformite: row.Statut_Conformite || 'A-verifier',
      observations: row.Observations || '',
      timestamp: row.Timestamp || new Date().toISOString(),
      imported_at: new Date().toISOString(),
      row_index: row._rowIndex
    }))
  }
}

export default new CSVValidator()
