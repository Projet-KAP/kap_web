// Template Excel pour les collectes de données KAP
export const collecteExcelTemplate = {
  // Structure du fichier Excel requis
  structure: {
    sheetName: 'Collecte_Donnees_KAP',
    headers: [
      // Informations générales
      'ID_Collecte',
      'Date_Collecte',
      'Heure_Collecte',
      'Type_Collecte',
      'Localisation',
      'Zone_Atelier',
      'Poste_Travail',
      'Operateur',
      'Equipe',
      'Shift',
      
      // Équipement
      'Equipement_ID',
      'Equipement_Nom',
      'Equipement_Type',
      'Equipement_Marque',
      'Equipement_Modele',
      'Numero_Serie',
      
      // Mesures principales
      'Valeur_Mesuree',
      'Unite_Mesure',
      'Valeur_Cible',
      'Tolerance_Min',
      'Tolerance_Max',
      'Statut_Conformite',
      
      // KPIs Production
      'Production_Reelle',
      'Production_Planifiee',
      'Temps_Cycle_Reel',
      'Temps_Cycle_Ideal',
      'Nombre_Pieces_Conformes',
      'Nombre_Pieces_Total',
      'Vitesse_Production',
      
      // KPIs Qualité
      'Taux_Rebuts',
      'Defauts_Detectes',
      'Type_Defaut',
      'Cause_Defaut',
      'Action_Corrective',
      
      // KPIs Disponibilité
      'Temps_Fonctionnement',
      'Temps_Planifie',
      'Temps_Arret_Total',
      'Temps_Arret_Planifie',
      'Temps_Arret_Non_Planifie',
      'Cause_Arret',
      'Nombre_Demarrages',
      
      // KPIs Maintenance
      'Derniere_Maintenance',
      'Prochaine_Maintenance',
      'Type_Maintenance',
      'Duree_Maintenance',
      'Cout_Maintenance',
      'Pieces_Remplacees',
      
      // KPIs Mode Dégradé
      'Nombre_Pannes',
      'Heures_Utilisation',
      'Ratio_Pannes_Utilisation',
      'Seuil_Mode_Degrade',
      'Statut_Mode_Degrade',
      
      // Conditions opérationnelles
      'Temperature',
      'Pression',
      'Vibration',
      'Bruit',
      'Consommation_Energie',
      'Consommation_Carburant',
      
      // Sécurité & Environnement
      'Niveau_Securite',
      'EPI_Utilises',
      'Incident_Securite',
      'Impact_Environnemental',
      
      // Traçabilité
      'Lot_Production',
      'Numero_Ordre_Fabrication',
      'Client_Final',
      'Certificat_Qualite',
      
      // Métadonnées
      'Observations',
      'Recommandations',
      'Photos_Jointes',
      'Documents_Associes',
      'Timestamp',
      'Validateur',
      'Date_Validation'
    ],
    requiredColumns: [
      'ID_Collecte',
      'Date_Collecte',
      'Type_Collecte',
      'Localisation',
      'Operateur',
      'Equipement_ID',
      'Valeur_Mesuree',
      'Unite_Mesure',
      'Statut_Conformite'
    ]
  },
  
  // Données d'exemple pour le modèle
  sampleData: [
    {
      // Informations générales
      ID_Collecte: 'COL_001',
      Date_Collecte: '2024-12-09',
      Heure_Collecte: '10:30:00',
      Type_Collecte: 'PRODUCTION',
      Localisation: 'Usine Nord - Bâtiment A',
      Zone_Atelier: 'Atelier Usinage',
      Poste_Travail: 'Poste 01',
      Operateur: 'Jean Dupont',
      Equipe: 'Equipe Matin',
      Shift: 'Matin (06h-14h)',
      
      // Équipement
      Equipement_ID: 'EQ_001',
      Equipement_Nom: 'Centre d\'usinage CNC',
      Equipement_Type: 'Machine-outil',
      Equipement_Marque: 'HAAS',
      Equipement_Modele: 'VF-2SS',
      Numero_Serie: 'HAS2024001',
      
      // Mesures principales
      Valeur_Mesuree: '95.5',
      Unite_Mesure: '%',
      Valeur_Cible: '90.0',
      Tolerance_Min: '85.0',
      Tolerance_Max: '100.0',
      Statut_Conformite: 'CONFORME',
      
      // KPIs Production
      Production_Reelle: '145',
      Production_Planifiee: '150',
      Temps_Cycle_Reel: '3.2',
      Temps_Cycle_Ideal: '3.0',
      Nombre_Pieces_Conformes: '142',
      Nombre_Pieces_Total: '145',
      Vitesse_Production: '45.3',
      
      // KPIs Qualité
      Taux_Rebuts: '2.1',
      Defauts_Detectes: '3',
      Type_Defaut: 'Dimension hors tolérance',
      Cause_Defaut: 'Usure outil',
      Action_Corrective: 'Changement outil prévu',
      
      // KPIs Disponibilité
      Temps_Fonctionnement: '7.5',
      Temps_Planifie: '8.0',
      Temps_Arret_Total: '0.5',
      Temps_Arret_Planifie: '0.2',
      Temps_Arret_Non_Planifie: '0.3',
      Cause_Arret: 'Changement outil',
      Nombre_Demarrages: '2',
      
      // KPIs Maintenance
      Derniere_Maintenance: '2024-12-01',
      Prochaine_Maintenance: '2024-12-15',
      Type_Maintenance: 'Préventive',
      Duree_Maintenance: '2.0',
      Cout_Maintenance: '450.00',
      Pieces_Remplacees: 'Outil carbure Ø12mm',
      
      // KPIs Mode Dégradé
      Nombre_Pannes: '2',
      Heures_Utilisation: '168',
      Ratio_Pannes_Utilisation: '0.012',
      Seuil_Mode_Degrade: '0.020',
      Statut_Mode_Degrade: 'NORMAL',
      
      // Conditions opérationnelles
      Temperature: '22.5',
      Pression: '6.2',
      Vibration: '0.8',
      Bruit: '68',
      Consommation_Energie: '12.5',
      Consommation_Carburant: '',
      
      // Sécurité & Environnement
      Niveau_Securite: 'VERT',
      EPI_Utilises: 'Lunettes, Gants, Chaussures sécurité',
      Incident_Securite: 'NON',
      Impact_Environnemental: 'FAIBLE',
      
      // Traçabilité
      Lot_Production: 'LOT_2024_349',
      Numero_Ordre_Fabrication: 'OF_24_1205',
      Client_Final: 'AUTOMOTIVE_PARTS_SA',
      Certificat_Qualite: 'CQ_24_1205_001',
      
      // Métadonnées
      Observations: 'Production dans les normes, légère dérive sur la cote Ø12h7',
      Recommandations: 'Surveiller usure outil, prévoir changement sous 50 pièces',
      Photos_Jointes: 'photo_piece_001.jpg, photo_outil_001.jpg',
      Documents_Associes: 'fiche_controle_001.pdf',
      Timestamp: '2024-12-09T10:30:00',
      Validateur: 'Marie Martin',
      Date_Validation: '2024-12-09T11:00:00'
    },
    {
      // Informations générales
      ID_Collecte: 'COL_002',
      Date_Collecte: '2024-12-09',
      Heure_Collecte: '14:15:00',
      Type_Collecte: 'QUALITE',
      Localisation: 'Usine Nord - Bâtiment B',
      Zone_Atelier: 'Atelier Assemblage',
      Poste_Travail: 'Poste 03',
      Operateur: 'Sophie Leroy',
      Equipe: 'Equipe Après-midi',
      Shift: 'Après-midi (14h-22h)',
      
      // Équipement
      Equipement_ID: 'EQ_015',
      Equipement_Nom: 'Robot de soudage',
      Equipement_Type: 'Robot industriel',
      Equipement_Marque: 'KUKA',
      Equipement_Modele: 'KR-16-2',
      Numero_Serie: 'KUK2024015',
      
      // Mesures principales
      Valeur_Mesuree: '98.2',
      Unite_Mesure: '%',
      Valeur_Cible: '95.0',
      Tolerance_Min: '90.0',
      Tolerance_Max: '100.0',
      Statut_Conformite: 'CONFORME',
      
      // KPIs Production
      Production_Reelle: '89',
      Production_Planifiee: '90',
      Temps_Cycle_Reel: '6.7',
      Temps_Cycle_Ideal: '6.5',
      Nombre_Pieces_Conformes: '87',
      Nombre_Pieces_Total: '89',
      Vitesse_Production: '13.3',
      
      // KPIs Qualité
      Taux_Rebuts: '2.2',
      Defauts_Detectes: '2',
      Type_Defaut: 'Soudure incomplète',
      Cause_Defaut: 'Paramètres soudage',
      Action_Corrective: 'Ajustement intensité soudage',
      
      // KPIs Disponibilité
      Temps_Fonctionnement: '7.8',
      Temps_Planifie: '8.0',
      Temps_Arret_Total: '0.2',
      Temps_Arret_Planifie: '0.1',
      Temps_Arret_Non_Planifie: '0.1',
      Cause_Arret: 'Nettoyage torche',
      Nombre_Demarrages: '1',
      
      // KPIs Maintenance
      Derniere_Maintenance: '2024-11-28',
      Prochaine_Maintenance: '2024-12-28',
      Type_Maintenance: 'Préventive',
      Duree_Maintenance: '1.5',
      Cout_Maintenance: '320.00',
      Pieces_Remplacees: 'Buse soudage, Fil soudure',
      
      // KPIs Mode Dégradé
      Nombre_Pannes: '1',
      Heures_Utilisation: '160',
      Ratio_Pannes_Utilisation: '0.006',
      Seuil_Mode_Degrade: '0.015',
      Statut_Mode_Degrade: 'NORMAL',
      
      // Conditions opérationnelles
      Temperature: '24.1',
      Pression: '8.5',
      Vibration: '0.3',
      Bruit: '72',
      Consommation_Energie: '18.7',
      Consommation_Carburant: '',
      
      // Sécurité & Environnement
      Niveau_Securite: 'VERT',
      EPI_Utilises: 'Masque soudage, Gants isolants, Tablier cuir',
      Incident_Securite: 'NON',
      Impact_Environnemental: 'MOYEN',
      
      // Traçabilité
      Lot_Production: 'LOT_2024_350',
      Numero_Ordre_Fabrication: 'OF_24_1206',
      Client_Final: 'INDUSTRIAL_SYSTEMS_CORP',
      Certificat_Qualite: 'CQ_24_1206_002',
      
      // Métadonnées
      Observations: 'Excellente qualité de soudure, paramètres optimaux',
      Recommandations: 'Maintenir paramètres actuels, contrôle visuel renforcé',
      Photos_Jointes: 'soudure_001.jpg, soudure_002.jpg',
      Documents_Associes: 'rapport_qualite_002.pdf',
      Timestamp: '2024-12-09T14:15:00',
      Validateur: 'Pierre Dubois',
      Date_Validation: '2024-12-09T14:45:00'
    },
    {
      // Informations générales
      ID_Collecte: 'COL_003',
      Date_Collecte: '2024-12-09',
      Heure_Collecte: '22:30:00',
      Type_Collecte: 'MAINTENANCE',
      Localisation: 'Usine Sud - Bâtiment C',
      Zone_Atelier: 'Atelier Logistique',
      Poste_Travail: 'Zone Stockage',
      Operateur: 'Ahmed Benali',
      Equipe: 'Equipe Nuit',
      Shift: 'Nuit (22h-06h)',
      
      // Équipement
      Equipement_ID: 'EQ_025',
      Equipement_Nom: 'Convoyeur automatisé',
      Equipement_Type: 'Système transport',
      Equipement_Marque: 'SIEMENS',
      Equipement_Modele: 'CONV-3000',
      Numero_Serie: 'SIE2024025',
      
      // Mesures principales
      Valeur_Mesuree: '92.8',
      Unite_Mesure: '%',
      Valeur_Cible: '95.0',
      Tolerance_Min: '90.0',
      Tolerance_Max: '100.0',
      Statut_Conformite: 'A_VERIFIER',
      
      // KPIs Production
      Production_Reelle: '320',
      Production_Planifiee: '350',
      Temps_Cycle_Reel: '1.8',
      Temps_Cycle_Ideal: '1.5',
      Nombre_Pieces_Conformes: '315',
      Nombre_Pieces_Total: '320',
      Vitesse_Production: '178.0',
      
      // KPIs Qualité
      Taux_Rebuts: '1.6',
      Defauts_Detectes: '5',
      Type_Defaut: 'Rayures surface',
      Cause_Defaut: 'Usure guide convoyeur',
      Action_Corrective: 'Remplacement guides programmé',
      
      // KPIs Disponibilité
      Temps_Fonctionnement: '7.2',
      Temps_Planifie: '8.0',
      Temps_Arret_Total: '0.8',
      Temps_Arret_Planifie: '0.3',
      Temps_Arret_Non_Planifie: '0.5',
      Cause_Arret: 'Bourrage produit',
      Nombre_Demarrages: '3',
      
      // KPIs Maintenance
      Derniere_Maintenance: '2024-12-05',
      Prochaine_Maintenance: '2024-12-12',
      Type_Maintenance: 'Corrective',
      Duree_Maintenance: '3.0',
      Cout_Maintenance: '680.00',
      Pieces_Remplacees: 'Guides latéraux, Courroie transport',
      
      // KPIs Mode Dégradé
      Nombre_Pannes: '5',
      Heures_Utilisation: '152',
      Ratio_Pannes_Utilisation: '0.033',
      Seuil_Mode_Degrade: '0.025',
      Statut_Mode_Degrade: 'DEGRADE',
      
      // Conditions opérationnelles
      Temperature: '20.8',
      Pression: '4.2',
      Vibration: '1.2',
      Bruit: '65',
      Consommation_Energie: '8.9',
      Consommation_Carburant: '',
      
      // Sécurité & Environnement
      Niveau_Securite: 'ORANGE',
      EPI_Utilises: 'Casque, Gilet haute visibilité, Gants',
      Incident_Securite: 'OUI - Bourrage mineur',
      Impact_Environnemental: 'FAIBLE',
      
      // Traçabilité
      Lot_Production: 'LOT_2024_351',
      Numero_Ordre_Fabrication: 'OF_24_1207',
      Client_Final: 'LOGISTICS_SOLUTIONS_LTD',
      Certificat_Qualite: 'CQ_24_1207_003',
      
      // Métadonnées
      Observations: 'Usure prématurée des guides, vibrations anormales détectées',
      Recommandations: 'Maintenance corrective urgente, vérification alignement',
      Photos_Jointes: 'usure_guides_001.jpg, vibration_mesure_001.jpg',
      Documents_Associes: 'rapport_maintenance_003.pdf, bon_commande_pieces.pdf',
      Timestamp: '2024-12-09T22:30:00',
      Validateur: 'Karim Hassani',
      Date_Validation: '2024-12-09T23:00:00'
    }
  ],

  // Règles de validation
  validation: {
    maxRows: 5000,
    allowedFileTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ],
    allowedExtensions: ['.xlsx', '.xls'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    
    // Types de collecte autorisés
    allowedCollectTypes: [
      'PRODUCTION', 'QUALITE', 'MAINTENANCE', 'SECURITE', 
      'INSPECTION', 'AUDIT', 'FORMATION', 'ESSAI'
    ],
    
    // Statuts de conformité autorisés
    allowedConformityStatus: ['CONFORME', 'NON_CONFORME', 'A_VERIFIER', 'EN_ATTENTE'],
    
    // Statuts de mode dégradé autorisés
    allowedDegradedModeStatus: ['NORMAL', 'DEGRADE', 'CRITIQUE'],
    
    // Types d'équipement autorisés
    allowedEquipmentTypes: [
      'Machine-outil', 'Robot industriel', 'Système transport', 'Presse',
      'Four', 'Compresseur', 'Pompe', 'Moteur', 'Générateur', 'Autre'
    ],
    
    // Shifts autorisés
    allowedShifts: [
      'Matin (06h-14h)', 'Après-midi (14h-22h)', 'Nuit (22h-06h)', 
      'Journée continue', 'Weekend', 'Autre'
    ],
    
    // Types de maintenance
    allowedMaintenanceTypes: [
      'Préventive', 'Corrective', 'Prédictive', 'Conditionnelle', 'Urgente'
    ],
    
    // Niveaux de sécurité
    allowedSecurityLevels: ['VERT', 'ORANGE', 'ROUGE'],
    
    // Impact environnemental
    allowedEnvironmentalImpact: ['FAIBLE', 'MOYEN', 'FORT'],
    
    // Formats de date et heure
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    timestampFormat: 'YYYY-MM-DDTHH:mm:ss',
    
    // Regex pour ID collecte
    collectIdPattern: /^COL_\d{3,}$/,
    
    // Regex pour ID équipement
    equipmentIdPattern: /^EQ_\d{3,}$/,
    
    // Regex pour numéro de série
    serialNumberPattern: /^[A-Z]{3}\d{7}$/,
    
    // Regex pour lot de production
    lotPattern: /^LOT_\d{4}_\d{3}$/,
    
    // Regex pour ordre de fabrication
    orderPattern: /^OF_\d{2}_\d{4}$/,
    
    // Plages de valeurs acceptables
    ranges: {
      temperature: { min: -50, max: 200 }, // °C
      pressure: { min: 0, max: 50 }, // bar
      vibration: { min: 0, max: 10 }, // mm/s
      noise: { min: 0, max: 120 }, // dB
      energy: { min: 0, max: 1000 }, // kWh
      fuel: { min: 0, max: 100 }, // L/h
      trs: { min: 0, max: 100 }, // %
      quality: { min: 0, max: 100 }, // %
      availability: { min: 0, max: 100 }, // %
      performance: { min: 0, max: 200 }, // %
      rejectRate: { min: 0, max: 100 }, // %
      cycleTime: { min: 0.1, max: 3600 }, // secondes
      maintenanceCost: { min: 0, max: 50000 }, // euros
      failureCount: { min: 0, max: 1000 }, // nombre de pannes
      utilizationHours: { min: 0, max: 8760 }, // heures par an
      failureRatio: { min: 0, max: 1 }, // ratio pannes/utilisation
      degradedThreshold: { min: 0, max: 1 } // seuil mode dégradé
    }
  },

  // Messages d'erreur
  errorMessages: {
    invalidFileType: 'Le fichier doit être au format Excel (.xlsx ou .xls)',
    fileTooLarge: 'Le fichier ne doit pas dépasser 10MB',
    tooManyRows: 'Le fichier ne doit pas contenir plus de 5000 lignes',
    missingRequiredColumns: 'Colonnes requises manquantes',
    invalidCollectType: 'Type de collecte invalide. Types autorisés: PRODUCTION, QUALITE, MAINTENANCE, SECURITE, INSPECTION, AUDIT, FORMATION, ESSAI',
    invalidConformityStatus: 'Statut de conformité invalide. Statuts autorisés: CONFORME, NON_CONFORME, A_VERIFIER, EN_ATTENTE',
    invalidEquipmentType: 'Type d\'équipement invalide',
    invalidShift: 'Shift invalide. Shifts autorisés: Matin (06h-14h), Après-midi (14h-22h), Nuit (22h-06h), Journée continue, Weekend, Autre',
    invalidMaintenanceType: 'Type de maintenance invalide. Types autorisés: Préventive, Corrective, Prédictive, Conditionnelle, Urgente',
    invalidSecurityLevel: 'Niveau de sécurité invalide. Niveaux autorisés: VERT, ORANGE, ROUGE',
    invalidEnvironmentalImpact: 'Impact environnemental invalide. Impacts autorisés: FAIBLE, MOYEN, FORT',
    invalidDateFormat: 'Format de date invalide (attendu: YYYY-MM-DD)',
    invalidTimeFormat: 'Format d\'heure invalide (attendu: HH:mm:ss)',
    invalidTimestampFormat: 'Format de timestamp invalide (attendu: YYYY-MM-DDTHH:mm:ss)',
    invalidCollectId: 'ID collecte invalide (format attendu: COL_XXX)',
    invalidEquipmentId: 'ID équipement invalide (format attendu: EQ_XXX)',
    invalidSerialNumber: 'Numéro de série invalide (format attendu: ABC1234567)',
    invalidLotNumber: 'Numéro de lot invalide (format attendu: LOT_YYYY_XXX)',
    invalidOrderNumber: 'Numéro d\'ordre invalide (format attendu: OF_YY_XXXX)',
    valueOutOfRange: 'Valeur hors plage acceptable',
    emptyFile: 'Le fichier ne contient aucune donnée',
    invalidNumericValue: 'Valeur numérique invalide',
    missingValidatorInfo: 'Informations de validation manquantes'
  },

  // Documentation des colonnes
  columnDocumentation: {
    'ID_Collecte': 'Identifiant unique de la collecte (format: COL_XXX)',
    'Date_Collecte': 'Date de la collecte (format: YYYY-MM-DD)',
    'Heure_Collecte': 'Heure de la collecte (format: HH:mm:ss)',
    'Type_Collecte': 'Type de collecte: PRODUCTION, QUALITE, MAINTENANCE, SECURITE, etc.',
    'Localisation': 'Localisation complète (Usine - Bâtiment)',
    'Zone_Atelier': 'Zone ou atelier spécifique',
    'Poste_Travail': 'Poste de travail ou zone précise',
    'Operateur': 'Nom complet de l\'opérateur',
    'Equipe': 'Équipe de travail',
    'Shift': 'Horaire de travail (Matin/Après-midi/Nuit)',
    'Equipement_ID': 'Identifiant unique de l\'équipement (format: EQ_XXX)',
    'Equipement_Nom': 'Nom descriptif de l\'équipement',
    'Equipement_Type': 'Type d\'équipement (Machine-outil, Robot, etc.)',
    'Equipement_Marque': 'Marque du fabricant',
    'Equipement_Modele': 'Modèle de l\'équipement',
    'Numero_Serie': 'Numéro de série (format: ABC1234567)',
    'Valeur_Mesuree': 'Valeur principale mesurée',
    'Unite_Mesure': 'Unité de mesure (%, kg, m/s, etc.)',
    'Valeur_Cible': 'Valeur cible ou objectif',
    'Tolerance_Min': 'Tolérance minimale acceptable',
    'Tolerance_Max': 'Tolérance maximale acceptable',
    'Statut_Conformite': 'Statut: CONFORME, NON_CONFORME, A_VERIFIER, EN_ATTENTE',
    'Production_Reelle': 'Nombre de pièces réellement produites',
    'Production_Planifiee': 'Nombre de pièces planifiées',
    'Temps_Cycle_Reel': 'Temps de cycle réel en minutes',
    'Temps_Cycle_Ideal': 'Temps de cycle idéal en minutes',
    'Nombre_Pieces_Conformes': 'Nombre de pièces conformes',
    'Nombre_Pieces_Total': 'Nombre total de pièces produites',
    'Vitesse_Production': 'Vitesse de production en pièces/heure',
    'Taux_Rebuts': 'Pourcentage de rebuts (%)',
    'Defauts_Detectes': 'Nombre de défauts détectés',
    'Type_Defaut': 'Description du type de défaut',
    'Cause_Defaut': 'Cause identifiée du défaut',
    'Action_Corrective': 'Action corrective mise en place',
    'Temps_Fonctionnement': 'Temps de fonctionnement effectif en heures',
    'Temps_Planifie': 'Temps planifié en heures',
    'Temps_Arret_Total': 'Temps d\'arrêt total en heures',
    'Temps_Arret_Planifie': 'Temps d\'arrêt planifié en heures',
    'Temps_Arret_Non_Planifie': 'Temps d\'arrêt non planifié en heures',
    'Cause_Arret': 'Cause principale de l\'arrêt',
    'Nombre_Demarrages': 'Nombre de démarrages dans la période',
    'Derniere_Maintenance': 'Date de la dernière maintenance (YYYY-MM-DD)',
    'Prochaine_Maintenance': 'Date de la prochaine maintenance (YYYY-MM-DD)',
    'Type_Maintenance': 'Type: Préventive, Corrective, Prédictive, etc.',
    'Duree_Maintenance': 'Durée de la maintenance en heures',
    'Cout_Maintenance': 'Coût de la maintenance en euros',
    'Pieces_Remplacees': 'Liste des pièces remplacées',
    'Nombre_Pannes': 'Nombre de pannes sur la période (0 à 1000)',
    'Heures_Utilisation': 'Heures d\'utilisation sur la période (0 à 8760)',
    'Ratio_Pannes_Utilisation': 'Ratio pannes/utilisation (0.000 à 1.000)',
    'Seuil_Mode_Degrade': 'Seuil configuré pour le mode dégradé (0.000 à 1.000)',
    'Statut_Mode_Degrade': 'Statut: NORMAL, DEGRADE, CRITIQUE',
    'Temperature': 'Température en °C (-50 à 200)',
    'Pression': 'Pression en bar (0 à 50)',
    'Vibration': 'Niveau de vibration en mm/s (0 à 10)',
    'Bruit': 'Niveau sonore en dB (0 à 120)',
    'Consommation_Energie': 'Consommation énergétique en kWh',
    'Consommation_Carburant': 'Consommation de carburant en L/h',
    'Niveau_Securite': 'Niveau de sécurité: VERT, ORANGE, ROUGE',
    'EPI_Utilises': 'Équipements de protection individuelle utilisés',
    'Incident_Securite': 'Incident de sécurité: OUI/NON + description',
    'Impact_Environnemental': 'Impact: FAIBLE, MOYEN, FORT',
    'Lot_Production': 'Numéro de lot (format: LOT_YYYY_XXX)',
    'Numero_Ordre_Fabrication': 'Numéro d\'ordre (format: OF_YY_XXXX)',
    'Client_Final': 'Nom du client final',
    'Certificat_Qualite': 'Référence du certificat qualité',
    'Observations': 'Observations générales',
    'Recommandations': 'Recommandations pour amélioration',
    'Photos_Jointes': 'Noms des fichiers photos joints',
    'Documents_Associes': 'Noms des documents associés',
    'Timestamp': 'Horodatage complet (YYYY-MM-DDTHH:mm:ss)',
    'Validateur': 'Nom du validateur',
    'Date_Validation': 'Date et heure de validation'
  }
}

// Fonction pour générer le modèle Excel
export const generateExcelTemplate = () => {
  const template = collecteExcelTemplate
  
  // Créer les données du template avec en-têtes et exemples
  const templateData = [
    template.structure.headers,
    ...template.sampleData.map(row => template.structure.headers.map(header => row[header] || ''))
  ]
  
  return {
    data: templateData,
    filename: 'Modele_Collecte_KAP_v2.0.xlsx',
    sheetName: template.structure.sheetName,
    metadata: {
      version: '2.0',
      createdDate: new Date().toISOString(),
      totalColumns: template.structure.headers.length,
      requiredColumns: template.structure.requiredColumns.length,
      sampleRows: template.sampleData.length
    }
  }
}

// Fonction pour générer la documentation Excel
export const generateExcelDocumentation = () => {
  const template = collecteExcelTemplate
  const docData = []
  
  // En-têtes de documentation
  docData.push(['Colonne', 'Obligatoire', 'Type', 'Description', 'Exemple'])
  
  // Ajouter chaque colonne avec sa documentation
  template.structure.headers.forEach(header => {
    const isRequired = template.structure.requiredColumns.includes(header)
    const description = template.columnDocumentation[header] || 'Description non disponible'
    const example = template.sampleData[0][header] || ''
    
    docData.push([
      header,
      isRequired ? 'OUI' : 'NON',
      getColumnType(header),
      description,
      example
    ])
  })
  
  return {
    data: docData,
    filename: 'Documentation_Template_KAP.xlsx',
    sheetName: 'Documentation_Colonnes'
  }
}

// Fonction pour déterminer le type de colonne
const getColumnType = (columnName) => {
  if (columnName.includes('Date') || columnName.includes('Timestamp')) return 'Date/Heure'
  if (columnName.includes('Nombre') || columnName.includes('Taux') || columnName.includes('Temps') || columnName.includes('Cout')) return 'Numérique'
  if (columnName.includes('ID') || columnName.includes('Numero')) return 'Identifiant'
  if (columnName.includes('Type') || columnName.includes('Statut') || columnName.includes('Niveau')) return 'Liste fermée'
  return 'Texte libre'
}

// Fonction pour valider la structure du fichier Excel
export const validateExcelStructure = (headers, data) => {
  const template = collecteExcelTemplate
  const errors = []
  const warnings = []
  
  // Vérifier les colonnes requises
  const missingRequired = template.structure.requiredColumns.filter(col => !headers.includes(col))
  if (missingRequired.length > 0) {
    errors.push(`Colonnes requises manquantes: ${missingRequired.join(', ')}`)
  }
  
  // Vérifier le nombre de lignes
  if (data.length > template.validation.maxRows) {
    errors.push(`Trop de lignes: ${data.length}/${template.validation.maxRows} maximum`)
  }
  
  // Vérifier les colonnes supplémentaires
  const extraColumns = headers.filter(col => !template.structure.headers.includes(col))
  if (extraColumns.length > 0) {
    warnings.push(`Colonnes non reconnues: ${extraColumns.join(', ')}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalRows: data.length,
      totalColumns: headers.length,
      requiredColumnsFound: template.structure.requiredColumns.filter(col => headers.includes(col)).length,
      requiredColumnsTotal: template.structure.requiredColumns.length
    }
  }
}

// Fonction pour valider les données d'une ligne
export const validateRowData = (rowData, headers) => {
  const errors = []
  const warnings = []
  
  headers.forEach((header, index) => {
    const value = rowData[index]
    const validation = validateCellValue(header, value)
    
    if (!validation.isValid) {
      errors.push(`${header}: ${validation.error}`)
    }
    
    if (validation.warning) {
      warnings.push(`${header}: ${validation.warning}`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Fonction pour valider une valeur de cellule
export const validateCellValue = (columnName, value) => {
  const template = collecteExcelTemplate
  
  // Vérifier si la colonne est requise et vide
  if (template.structure.requiredColumns.includes(columnName) && (!value || value.toString().trim() === '')) {
    return { isValid: false, error: 'Valeur requise manquante' }
  }
  
  // Si la valeur est vide pour une colonne non requise, c'est valide
  if (!value || value.toString().trim() === '') {
    return { isValid: true }
  }
  
  // Validations spécifiques par type de colonne
  switch (columnName) {
    case 'ID_Collecte':
      if (!template.validation.collectIdPattern.test(value)) {
        return { isValid: false, error: 'Format ID collecte invalide (attendu: COL_XXX)' }
      }
      break
      
    case 'Equipement_ID':
      if (!template.validation.equipmentIdPattern.test(value)) {
        return { isValid: false, error: 'Format ID équipement invalide (attendu: EQ_XXX)' }
      }
      break
      
    case 'Date_Collecte':
    case 'Derniere_Maintenance':
    case 'Prochaine_Maintenance':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { isValid: false, error: 'Format de date invalide (attendu: YYYY-MM-DD)' }
      }
      break
      
    case 'Heure_Collecte':
      if (!/^\d{2}:\d{2}:\d{2}$/.test(value)) {
        return { isValid: false, error: 'Format d\'heure invalide (attendu: HH:mm:ss)' }
      }
      break
      
    case 'Type_Collecte':
      if (!template.validation.allowedCollectTypes.includes(value)) {
        return { isValid: false, error: `Type invalide. Autorisés: ${template.validation.allowedCollectTypes.join(', ')}` }
      }
      break
      
    case 'Statut_Conformite':
      if (!template.validation.allowedConformityStatus.includes(value)) {
        return { isValid: false, error: `Statut invalide. Autorisés: ${template.validation.allowedConformityStatus.join(', ')}` }
      }
      break
      
    case 'Equipement_Type':
      if (!template.validation.allowedEquipmentTypes.includes(value)) {
        return { isValid: false, error: `Type équipement invalide. Autorisés: ${template.validation.allowedEquipmentTypes.join(', ')}` }
      }
      break
      
    case 'Shift':
      if (!template.validation.allowedShifts.includes(value)) {
        return { isValid: false, error: `Shift invalide. Autorisés: ${template.validation.allowedShifts.join(', ')}` }
      }
      break
      
    case 'Type_Maintenance':
      if (value && !template.validation.allowedMaintenanceTypes.includes(value)) {
        return { isValid: false, error: `Type maintenance invalide. Autorisés: ${template.validation.allowedMaintenanceTypes.join(', ')}` }
      }
      break
      
    case 'Niveau_Securite':
      if (value && !template.validation.allowedSecurityLevels.includes(value)) {
        return { isValid: false, error: `Niveau sécurité invalide. Autorisés: ${template.validation.allowedSecurityLevels.join(', ')}` }
      }
      break
      
    case 'Impact_Environnemental':
      if (value && !template.validation.allowedEnvironmentalImpact.includes(value)) {
        return { isValid: false, error: `Impact environnemental invalide. Autorisés: ${template.validation.allowedEnvironmentalImpact.join(', ')}` }
      }
      break
      
    case 'Numero_Serie':
      if (value && !template.validation.serialNumberPattern.test(value)) {
        return { isValid: false, error: 'Format numéro de série invalide (attendu: ABC1234567)' }
      }
      break
      
    case 'Lot_Production':
      if (value && !template.validation.lotPattern.test(value)) {
        return { isValid: false, error: 'Format lot invalide (attendu: LOT_YYYY_XXX)' }
      }
      break
      
    case 'Numero_Ordre_Fabrication':
      if (value && !template.validation.orderPattern.test(value)) {
        return { isValid: false, error: 'Format ordre invalide (attendu: OF_YY_XXXX)' }
      }
      break
      
    // Validations numériques avec plages
    case 'Temperature':
      return validateNumericRange(value, template.validation.ranges.temperature, '°C')
    case 'Pression':
      return validateNumericRange(value, template.validation.ranges.pressure, 'bar')
    case 'Vibration':
      return validateNumericRange(value, template.validation.ranges.vibration, 'mm/s')
    case 'Bruit':
      return validateNumericRange(value, template.validation.ranges.noise, 'dB')
    case 'Consommation_Energie':
      return validateNumericRange(value, template.validation.ranges.energy, 'kWh')
    case 'Consommation_Carburant':
      return validateNumericRange(value, template.validation.ranges.fuel, 'L/h')
    case 'Taux_Rebuts':
      return validateNumericRange(value, template.validation.ranges.rejectRate, '%')
    case 'Temps_Cycle_Reel':
    case 'Temps_Cycle_Ideal':
      return validateNumericRange(value, template.validation.ranges.cycleTime, 'min')
    case 'Cout_Maintenance':
      return validateNumericRange(value, template.validation.ranges.maintenanceCost, '€')
    case 'Nombre_Pannes':
      return validateNumericRange(value, template.validation.ranges.failureCount, 'pannes')
    case 'Heures_Utilisation':
      return validateNumericRange(value, template.validation.ranges.utilizationHours, 'heures')
    case 'Ratio_Pannes_Utilisation':
      return validateNumericRange(value, template.validation.ranges.failureRatio, 'ratio')
    case 'Seuil_Mode_Degrade':
      return validateNumericRange(value, template.validation.ranges.degradedThreshold, 'seuil')
    case 'Statut_Mode_Degrade':
      if (value && !template.validation.allowedDegradedModeStatus.includes(value)) {
        return { isValid: false, error: `Statut mode dégradé invalide. Autorisés: ${template.validation.allowedDegradedModeStatus.join(', ')}` }
      }
      break
  }
  
  return { isValid: true }
}

// Fonction utilitaire pour valider les plages numériques
const validateNumericRange = (value, range, unit) => {
  if (!value) return { isValid: true }
  
  const numValue = parseFloat(value)
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Valeur numérique attendue' }
  }
  
  if (numValue < range.min || numValue > range.max) {
    return { 
      isValid: false, 
      error: `Valeur hors plage (${range.min}-${range.max} ${unit})` 
    }
  }
  
  return { isValid: true }
}
