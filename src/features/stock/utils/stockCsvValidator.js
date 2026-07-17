import { stockCSVTemplate, parseCSV, validateCSVStructure, validateCSVContent } from '../templates/stockCsvTemplate.js'

/**
 * Classe pour valider les fichiers CSV d'import stock
 */
export class StockCSVValidator {
  constructor() {
    this.template = stockCSVTemplate
  }

  /**
   * Valide un fichier CSV complet
   * @param {File} file - Le fichier CSV a valider
   * @returns {Promise<Object>} Resultat de la validation
   */
  async validateFile(file) {
    try {
      const fileValidation = this.validateFileProperties(file)
      if (!fileValidation.isValid) {
        return fileValidation
      }

      const csvContent = await this.readCSVFile(file)
      const { headers, data } = parseCSV(csvContent)

      const structureValidation = validateCSVStructure(headers, data)
      if (!structureValidation.isValid) {
        return {
          isValid: false,
          errors: structureValidation.errors,
          warnings: structureValidation.warnings || []
        }
      }

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
   * Valide les proprietes du fichier (taille, type, etc.)
   */
  validateFileProperties(file) {
    const errors = []

    if (!this.template.validation.allowedFileTypes.includes(file.type)) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!this.template.validation.allowedExtensions.includes(`.${extension}`)) {
        errors.push({
          type: 'invalid_file_type',
          message: this.template.errorMessages.invalidFileType
        })
      }
    }

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
   */
  readCSVFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          resolve(e.target.result)
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
   * Formate les donnees validees pour l'apercu
   */
  formatDataForImport(headers, data) {
    return data.map((row, index) => {
      const formattedRow = { _rowIndex: index + 2 }

      headers.forEach((header, colIndex) => {
        formattedRow[header] = row[colIndex] || ''
      })

      return formattedRow
    })
  }
}

export default new StockCSVValidator()
