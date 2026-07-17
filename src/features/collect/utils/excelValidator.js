import { collecteExcelTemplate, validateExcelStructure, validateExcelContent } from '../templates/excelTemplate.js'

/**
 * Classe pour valider les fichiers Excel de collecte
 */
export class ExcelValidator {
  constructor() {
    this.template = collecteExcelTemplate
    this.XLSX = null
  }

  /**
   * Charge XLSX de manière asynchrone
   */
  async loadXLSX() {
    if (!this.XLSX) {
      this.XLSX = await import('xlsx')
    }
    return this.XLSX
  }

  /**
   * Valide un fichier Excel complet
   * @param {File} file - Le fichier Excel à valider
   * @returns {Promise<Object>} Résultat de la validation
   */
  async validateFile(file) {
    try {
      // Validation du fichier lui-même
      const fileValidation = this.validateFileProperties(file)
      if (!fileValidation.isValid) {
        return fileValidation
      }

      // Lecture du fichier Excel
      const workbook = await this.readExcelFile(file);
      
      // Validation de la structure
      const structureValidation = this.validateWorkbookStructure(workbook)
      if (!structureValidation.isValid) {
        return structureValidation
      }

      // Extraction des données
      const { headers, data } = await this.extractDataFromWorkbook(workbook);
      
      // Validation du contenu
      const contentValidation = this.validateContent(headers, data)
      
      return {
        isValid: contentValidation.isValid,
        errors: contentValidation.errors,
        warnings: contentValidation.warnings || [],
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
   * Lit un fichier Excel et retourne le workbook
   * @param {File} file 
   * @returns {Promise<Object>}
   */
  async readExcelFile(file) {
    const XLSX = await this.loadXLSX();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          resolve(workbook)
        } catch (error) {
          reject(new Error('Format de fichier Excel invalide'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Valide la structure du workbook Excel
   * @param {Object} workbook 
   * @returns {Object}
   */
  validateWorkbookStructure(workbook) {
    const errors = []

    // Vérifier qu'il y a au moins une feuille
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      errors.push({
        type: 'no_sheets',
        message: 'Le fichier Excel ne contient aucune feuille'
      })
      return { isValid: false, errors }
    }

    // Vérifier que la feuille attendue existe (soit par nom, soit prendre la première)
    const expectedSheetName = this.template.structure.sheetName
    const hasExpectedSheet = workbook.SheetNames.includes(expectedSheetName)
    
    if (!hasExpectedSheet && workbook.SheetNames.length > 1) {
      // Si plusieurs feuilles et pas la bonne, avertir
      errors.push({
        type: 'wrong_sheet_name',
        message: `Feuille "${expectedSheetName}" non trouvée. Utilisation de la première feuille: "${workbook.SheetNames[0]}"`
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: errors // Les erreurs de structure peuvent être des avertissements
    }
  }

  /**
   * Extrait les données de la première feuille du workbook
   * @param {Object} workbook 
   * @returns {Object}
   */
  async extractDataFromWorkbook(workbook) {
    const XLSX = await this.loadXLSX();
    
    // Prendre la première feuille ou celle avec le nom attendu
    const expectedSheetName = this.template.structure.sheetName
    const sheetName = workbook.SheetNames.includes(expectedSheetName) 
      ? expectedSheetName 
      : workbook.SheetNames[0]
    
    const worksheet = workbook.Sheets[sheetName]
    
    // Convertir en tableau JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // Retourne un tableau de tableaux
      defval: '' // Valeur par défaut pour les cellules vides
    })

    if (jsonData.length === 0) {
      return { headers: [], data: [] }
    }

    // Première ligne = en-têtes, reste = données
    const headers = jsonData[0] || []
    const data = jsonData.slice(1).filter(row => 
      // Filtrer les lignes complètement vides
      row.some(cell => cell !== '' && cell !== null && cell !== undefined)
    )

    return { headers, data }
  }

  /**
   * Valide le contenu des données extraites
   * @param {Array} headers 
   * @param {Array} data 
   * @returns {Object}
   */
  validateContent(headers, data) {
    // Validation de la structure
    const structureValidation = validateExcelStructure(headers, data)
    
    if (!structureValidation.isValid) {
      return structureValidation
    }

    // Validation du contenu
    const contentValidation = validateExcelContent(data, headers)
    
    return contentValidation
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
          row: error.row || null
        })),
        warnings: warnings.map(warning => ({
          type: warning.type,
          message: warning.message,
          row: warning.row || null
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
}

export default new ExcelValidator()
