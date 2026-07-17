import { faker } from '@faker-js/faker/locale/fr'

// Enable demo data generators only when VITE_ENABLE_DEMO_DATA is explicitly set to 'true'
const ENABLE_DEMO_DATA = (import.meta.env.VITE_ENABLE_DEMO_DATA === 'true') || false

/**
 * Service de génération de données cohérentes pour les formulaires
 */
class DataGeneratorService {
  /**
   * Génère des données pour un nouvel utilisateur
   */
  generateUser() {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const email = faker.internet.email({ firstName, lastName }).toLowerCase()

    return {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_number: faker.phone.number('06 ## ## ## ##'),
      username: email.split('@')[0],
      password: 'Test123!',
      password_confirm: 'Test123!'
    }
  }

  /**
   * Génère des données pour une machine/engin
   */
  generateMachine() {
    const types = ['Bulldozer', 'Excavatrice', 'Chargeuse', 'Niveleuse', 'Compacteur', 'Rouleau', 'Pelle mécanique']
    const marques = ['Caterpillar', 'Komatsu', 'Volvo', 'Liebherr', 'JCB', 'Hitachi', 'Doosan']
    const type = faker.helpers.arrayElement(types)
    const marque = faker.helpers.arrayElement(marques)

    return {
      nom: `${marque} ${type} ${faker.string.alphanumeric(4).toUpperCase()}`,
      numero_serie: faker.string.alphanumeric(12).toUpperCase(),
      marque: marque,
      modele: `${type}-${faker.number.int({ min: 100, max: 999 })}`,
      annee_fabrication: faker.number.int({ min: 2015, max: 2024 }),
      date_acquisition: faker.date.between({ from: '2020-01-01', to: new Date() }).toISOString().split('T')[0],
      numero_immatriculation: faker.vehicle.vrm(),
      capacite: `${faker.number.int({ min: 5, max: 50 })} tonnes`,
      puissance_nominale: faker.number.int({ min: 100, max: 500 }),
      heures_fonctionnement: faker.number.int({ min: 100, max: 10000 }),
      statut: faker.helpers.arrayElement(['ACTIF', 'MAINTENANCE', 'INACTIF']),
      cout_acquisition: faker.number.int({ min: 50000, max: 500000 }),
      valeur_residuelle: faker.number.int({ min: 20000, max: 300000 }),
      taux_disponibilite: faker.number.float({ min: 0.7, max: 0.99, fractionDigits: 2 }),
      taux_utilisation: faker.number.float({ min: 0.6, max: 0.95, fractionDigits: 2 }),
      consommation_carburant: faker.number.float({ min: 5, max: 50, fractionDigits: 1 }),
      notes: faker.lorem.sentence()
    }
  }

  /**
   * Génère des données pour un poste de charge
   */
  generateWorkplace() {
    const types = ['Production', 'Maintenance', 'Assemblage', 'Contrôle Qualité', 'Emballage', 'Stockage']
    const type = faker.helpers.arrayElement(types)

    return {
      nom: `Poste ${type} ${faker.string.alphanumeric(3).toUpperCase()}`,
      code: faker.string.alphanumeric(8).toUpperCase(),
      type: type,
      description: faker.lorem.sentence(),
      capacite_production: faker.number.int({ min: 10, max: 1000 }),
      nombre_operateurs: faker.number.int({ min: 1, max: 10 }),
      cout_horaire: faker.number.float({ min: 25, max: 150, fractionDigits: 2 }),
      temps_cycle: faker.number.int({ min: 5, max: 60 }),
      taux_disponibilite: faker.number.float({ min: 0.7, max: 0.99, fractionDigits: 2 }),
      statut: faker.helpers.arrayElement(['ACTIF', 'MAINTENANCE', 'INACTIF'])
    }
  }

  /**
   * Génère des données pour un projet
   */
  generateProjet() {
    const types = ['Construction', 'Terrassement', 'Voirie', 'Bâtiment', 'Infrastructure']
    const statuts = ['EN_COURS', 'PLANIFIE', 'TERMINE', 'SUSPENDU']

    return {
      nom: `Projet ${faker.location.city()} - ${faker.helpers.arrayElement(types)}`,
      code: `PRJ-${faker.string.alphanumeric(6).toUpperCase()}`,
      type: faker.helpers.arrayElement(types),
      description: faker.lorem.paragraph(),
      date_debut: faker.date.future({ years: 0.5 }).toISOString().split('T')[0],
      date_fin_prevue: faker.date.future({ years: 1 }).toISOString().split('T')[0],
      budget: faker.number.int({ min: 100000, max: 5000000 }),
      localisation: faker.location.streetAddress() + ', ' + faker.location.city(),
      statut: faker.helpers.arrayElement(statuts),
      progression: faker.number.int({ min: 0, max: 100 }),
      priorite: faker.helpers.arrayElement(['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE'])
    }
  }

  /**
   * Génère des données pour une équipe
   */
  generateTeam() {
    const types = ['Production', 'Maintenance', 'Logistique', 'Qualité', 'Sécurité']
    const shifts = ['Matin', 'Après-midi', 'Nuit', 'Journée']

    return {
      nom: `Équipe ${faker.helpers.arrayElement(types)} ${faker.string.alphanumeric(2).toUpperCase()}`,
      code: `EQ-${faker.string.alphanumeric(6).toUpperCase()}`,
      type: faker.helpers.arrayElement(types),
      shift: faker.helpers.arrayElement(shifts),
      description: faker.lorem.sentence(),
      nombre_membres: faker.number.int({ min: 3, max: 15 }),
      objectif_journalier: faker.number.int({ min: 100, max: 1000 }),
      taux_performance: faker.number.float({ min: 0.7, max: 0.99, fractionDigits: 2 }),
      statut: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE'])
    }
  }

  /**
   * Génère des données pour un document
   */
  generateDocument() {
    const types = ['Contrat', 'Facture', 'Devis', 'Bon de commande', 'Rapport', 'Plan', 'Certificat']
    const categories = ['Administratif', 'Technique', 'Commercial', 'Financier', 'Qualité', 'Sécurité']

    return {
      titre: `${faker.helpers.arrayElement(types)} ${faker.string.alphanumeric(6).toUpperCase()}`,
      type: faker.helpers.arrayElement(types),
      categorie: faker.helpers.arrayElement(categories),
      reference: `DOC-${faker.string.alphanumeric(8).toUpperCase()}`,
      description: faker.lorem.paragraph(),
      date_creation: faker.date.past({ years: 1 }).toISOString().split('T')[0],
      date_validite: faker.date.future({ years: 1 }).toISOString().split('T')[0],
      version: `${faker.number.int({ min: 1, max: 5 })}.${faker.number.int({ min: 0, max: 9 })}`,
      statut: faker.helpers.arrayElement(['BROUILLON', 'EN_COURS', 'VALIDE', 'ARCHIVE']),
      confidentialite: faker.helpers.arrayElement(['PUBLIC', 'INTERNE', 'CONFIDENTIEL'])
    }
  }

  /**
   * Génère des données pour un fichier médiathèque
   */
  generateMediaFile() {
    const types = ['Image', 'Video', 'Document', 'Audio']
    const categories = ['Photos chantier', 'Plans', 'Rapports', 'Formations', 'Procédures']

    return {
      nom: `${faker.word.noun()}_${faker.string.alphanumeric(6)}`,
      titre: faker.lorem.words(3),
      type: faker.helpers.arrayElement(types),
      categorie: faker.helpers.arrayElement(categories),
      description: faker.lorem.sentence(),
      tags: [faker.word.noun(), faker.word.noun(), faker.word.noun()].join(', '),
      auteur: faker.person.fullName(),
      date_creation: faker.date.past({ years: 1 }).toISOString().split('T')[0]
    }
  }

  /**
   * Génère des données pour un stock/pièce détachée
   */
  generateSparePart() {
    const categories = ['Mécanique', 'Électrique', 'Hydraulique', 'Pneumatique', 'Électronique']
    const unites = ['Pièce', 'Lot', 'Kg', 'Mètre', 'Litre']

    return {
      reference: `REF-${faker.string.alphanumeric(8).toUpperCase()}`,
      designation: faker.commerce.productName(),
      categorie: faker.helpers.arrayElement(categories),
      description: faker.commerce.productDescription(),
      unite: faker.helpers.arrayElement(unites),
      quantite_stock: faker.number.int({ min: 0, max: 500 }),
      seuil_alerte: faker.number.int({ min: 5, max: 50 }),
      seuil_critique: faker.number.int({ min: 1, max: 20 }),
      prix_unitaire: faker.number.float({ min: 10, max: 5000, fractionDigits: 2 }),
      fournisseur: faker.company.name(),
      delai_livraison: faker.number.int({ min: 1, max: 30 }),
      emplacement: `A${faker.number.int({ min: 1, max: 20 })}-R${faker.number.int({ min: 1, max: 10 })}`
    }
  }

  /**
   * Génère des données pour un client
   */
  generateClient() {
    const types = ['Entreprise', 'Administration', 'Particulier', 'Association']
    const secteurs = ['Construction', 'Industrie', 'Services', 'Agriculture', 'Transport']

    return {
      nom: faker.company.name(),
      type: faker.helpers.arrayElement(types),
      secteur: faker.helpers.arrayElement(secteurs),
      email: faker.internet.email().toLowerCase(),
      telephone: faker.phone.number('01 ## ## ## ##'),
      adresse: faker.location.streetAddress(),
      ville: faker.location.city(),
      code_postal: faker.location.zipCode('#####'),
      pays: 'Sénégal',
      contact_principal: faker.person.fullName(),
      siret: faker.string.numeric(14),
      tva: `SN${faker.string.numeric(11)}`,
      conditions_paiement: faker.helpers.arrayElement(['30 jours', '45 jours', '60 jours']),
      notes: faker.lorem.sentence()
    }
  }

  /**
   * Génère des données pour un site
   */
  generateSite() {
    const types = ['Chantier', 'Usine', 'Entrepôt', 'Bureau', 'Carrière']

    return {
      nom: `Site ${faker.location.city()} ${faker.helpers.arrayElement(types)}`,
      code: `SITE-${faker.string.alphanumeric(6).toUpperCase()}`,
      type: faker.helpers.arrayElement(types),
      adresse: faker.location.streetAddress(),
      ville: faker.location.city(),
      code_postal: faker.location.zipCode('#####'),
      pays: 'Sénégal',
      latitude: faker.location.latitude({ min: 12, max: 16, precision: 6 }),
      longitude: faker.location.longitude({ min: -17, max: -11, precision: 6 }),
      surface: faker.number.int({ min: 100, max: 50000 }),
      responsable: faker.person.fullName(),
      telephone: faker.phone.number('01 ## ## ## ##'),
      email: faker.internet.email().toLowerCase(),
      statut: faker.helpers.arrayElement(['ACTIF', 'INACTIF', 'EN_CONSTRUCTION'])
    }
  }

  /**
   * Génère des données pour une session de pointage
   */
  generatePointageSession() {
    const date = faker.date.recent({ days: 7 })
    const fonctions = [
      'Chauffeur', 'Conducteur travaux', 'Chef de chantier', 'Maçon',
      'Électricien', 'Plombier', 'Menuisier', 'Ferronnier', 'Peintre',
      'Carreleur', 'Manœuvre'
    ]
    const corpsEtats = [
      'Gros œuvre', 'Second œuvre', 'Électricité', 'Plomberie',
      'Menuiserie', 'Peinture', 'Carrelage', 'Transport', 'Maçonnerie'
    ]
    const presence = faker.datatype.boolean(0.85) // 85% de chance d'être présent
    const heuresTravail = presence ? faker.number.int({ min: 6, max: 10 }) : 0
    const heuresSup = presence ? faker.number.int({ min: 0, max: 3 }) : 0
    const salaireHoraire = faker.number.int({ min: 2000, max: 8000 })

    return {
      nom_personnel: `${faker.person.lastName().toUpperCase()} ${faker.person.firstName()}`,
      fonction: faker.helpers.arrayElement(fonctions),
      corps_etat: faker.helpers.arrayElement(corpsEtats),
      date_pointage: date.toISOString().split('T')[0],
      presence: presence,
      heures_travaillees: heuresTravail,
      heures_supplementaires: heuresSup,
      salaire_horaire: salaireHoraire,
      observations: presence ? faker.lorem.sentence() : 'Absent'
    }
  }

  /**
   * Génère des données pour une activité de production terrassement
   */
  generateProductionTP() {
    const activites = ['Décapage', 'Terrassement', 'Remblai', 'Compactage', 'Nivellement']
    const unites = ['m³', 'm²', 'ml', 'tonnes']

    return {
      date: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
      activite: faker.helpers.arrayElement(activites),
      quantite_prevue: faker.number.int({ min: 100, max: 1000 }),
      quantite_realisee: faker.number.int({ min: 80, max: 950 }),
      unite: faker.helpers.arrayElement(unites),
      duree_travail: faker.number.float({ min: 4, max: 10, fractionDigits: 1 }),
      nombre_engins: faker.number.int({ min: 1, max: 5 }),
      observations: faker.lorem.sentence()
    }
  }

  /**
   * Génère des données pour un ROI Calculator
   */
  generateROIData() {
    return {
      cout_acquisition: faker.number.int({ min: 100000, max: 1000000 }),
      duree_amortissement: faker.number.int({ min: 3, max: 10 }),
      cout_maintenance_annuel: faker.number.int({ min: 5000, max: 50000 }),
      cout_carburant_annuel: faker.number.int({ min: 10000, max: 100000 }),
      autres_couts_annuels: faker.number.int({ min: 2000, max: 20000 }),
      revenus_annuels: faker.number.int({ min: 50000, max: 500000 }),
      taux_utilisation: faker.number.float({ min: 0.6, max: 0.95, fractionDigits: 2 }),
      valeur_residuelle: faker.number.int({ min: 20000, max: 300000 })
    }
  }

  /**
   * Génère des données pour un tag de colonne
   */
  generateColumnTag() {
    const modules = ['MES', 'CHANTIER', 'STOCK', 'FINANCE']
    const tagTypesByModule = {
      'MES': ['PRODUCTION', 'TEMPS_ARRET', 'QUALITE', 'MAINTENANCE'],
      'CHANTIER': ['TERRASSEMENT', 'BETON', 'MATERIEL', 'PERSONNEL', 'TRANSPORT', 'PLANNING', 'FINANCIER'],
      'STOCK': ['ENTREE', 'SORTIE', 'INVENTAIRE', 'TRANSFERT'],
      'FINANCE': ['DEPENSE', 'RECETTE', 'FACTURE', 'PAIEMENT']
    }
    const dataTypes = ['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'DECIMAL']
    const unites = ['m³', 'kg', 'heures', 'tonnes', 'litres', 'm²', 'ml', '%', '€', 'unités']

    const module = faker.helpers.arrayElement(modules)
    const tagType = faker.helpers.arrayElement(tagTypesByModule[module])
    const dataType = faker.helpers.arrayElement(dataTypes)
    const nomBase = faker.word.noun().toUpperCase().replace(/[^A-Z]/g, '')

    return {
      tag_name: `${nomBase}_${faker.string.alphanumeric(4).toUpperCase()}`,
      column_name: faker.word.words(2) + ` (${dataType === 'NUMBER' || dataType === 'DECIMAL' ? faker.helpers.arrayElement(unites) : ''})`.trim(),
      module: module,
      tag_type: tagType,
      data_type: dataType,
      unit: dataType === 'NUMBER' || dataType === 'DECIMAL' ? faker.helpers.arrayElement(unites) : '',
      target_model: faker.helpers.arrayElement(['ProductionData', 'MaintenanceEvent', 'InventoryMove', 'WorkOrder']),
      target_field: `${nomBase.toLowerCase()}_${faker.word.noun()}`,
      calculation_rule: dataType === 'NUMBER' || dataType === 'DECIMAL' ? `value * ${faker.number.float({ min: 0.1, max: 10, fractionDigits: 2 })}` : '',
      context: {
        source: 'auto_generated',
        priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
        validation: faker.helpers.arrayElement(['required', 'optional'])
      },
      is_active: true
    }
  }

  /**
   * Génère des données pour un template de mapping
   */
  generateMappingTemplate() {
    const modules = ['MES', 'CHANTIER', 'STOCK', 'FINANCE']
    const fileTypes = ['EXCEL', 'CSV']
    const module = faker.helpers.arrayElement(modules)
    const fileType = faker.helpers.arrayElement(fileTypes)

    const sheetNames = ['Données', 'Production', 'Suivi', 'Import', 'Sheet1']

    return {
      name: `Template ${module} ${faker.company.name().substring(0, 15)} ${faker.string.alphanumeric(4).toUpperCase()}`,
      module: module,
      file_type: fileType,
      description: faker.lorem.sentence(),
      sheet_name: faker.helpers.arrayElement(sheetNames),
      header_row: faker.number.int({ min: 0, max: 2 }),
      is_active: true
    }
  }

  /**
   * Génère des données pour une évaluation d'équipe
   */
  generateTeamEvaluation() {
    const evaluationTypes = ['monthly', 'quarterly', 'annual', 'project', 'custom']
    const evaluationType = faker.helpers.arrayElement(evaluationTypes)

    // Calcul des dates en fonction du type
    let periodStart = faker.date.recent({ days: 30 })
    let periodEnd = new Date(periodStart)

    switch(evaluationType) {
      case 'monthly':
        periodEnd.setMonth(periodEnd.getMonth() + 1)
        break
      case 'quarterly':
        periodEnd.setMonth(periodEnd.getMonth() + 3)
        break
      case 'annual':
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        break
      default:
        periodEnd.setDate(periodEnd.getDate() + faker.number.int({ min: 7, max: 90 }))
    }

    return {
      evaluation_type: evaluationType,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      productivity_score: faker.number.int({ min: 5, max: 10 }),
      quality_score: faker.number.int({ min: 5, max: 10 }),
      efficiency_score: faker.number.int({ min: 5, max: 10 }),
      collaboration_score: faker.number.int({ min: 5, max: 10 }),
      innovation_score: faker.number.int({ min: 4, max: 10 }),
      timeliness_score: faker.number.int({ min: 5, max: 10 }),
      notes: faker.lorem.paragraph()
    }
  }
}

// Export a guarded instance: when demo data is disabled, methods return empty
// placeholders to avoid leaking fake/demo data in production.
const instance = new DataGeneratorService()

if (!ENABLE_DEMO_DATA) {
  // Proxy to short-circuit method calls and return sensible empty values
  const stubHandler = {
    get(target, prop) {
      const orig = target[prop]
      if (typeof orig === 'function') {
        return (...args) => {
          // Default safe returns: arrays -> [], objects -> {}, scalar -> null
          // Many callers expect objects; return {} by default, override heuristics below
          const name = String(prop).toLowerCase()
          if (name.startsWith('generate') || name.includes('data')) return {}
          return null
        }
      }
      return orig
    }
  }
  export default new Proxy(instance, stubHandler)
} else {
  export default instance
}
