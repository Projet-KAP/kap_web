// Types pour Dashboard
export const DashboardStats = {
  collectes: {
    total: 0,
    actives: 0,
    terminees: 0,
    en_retard: 0
  },
  mes: {
    ordres_production: 0,
    machines_actives: 0,
    taux_performance: 0,
    taux_qualite: 0
  },
  engins: {
    total: 0,
    operationnels: 0,
    en_maintenance: 0,
    disponibilite: 0
  },
  utilisateurs: {
    total: 0,
    connectes: 0,
    derniere_activite: null
  }
}

// Types pour Collect
export const CollectStatus = {
  PLANIFIEE: 'planifiee',
  EN_COURS: 'en_cours',
  TERMINEE: 'terminee',
  ANNULEE: 'annulee'
}

export const CollectType = {
  MAINTENANCE: 'maintenance',
  PRODUCTION: 'production',
  QUALITE: 'qualite',
  SECURITE: 'securite'
}

// Types pour MES
export const ProductionOrderStatus = {
  PLANIFIE: 'planifie',
  EN_COURS: 'en_cours',
  TERMINE: 'termine',
  SUSPENDU: 'suspendu'
}

export const MachineStatus = {
  OPERATIONNELLE: 'operationnelle',
  EN_PANNE: 'en_panne',
  EN_MAINTENANCE: 'en_maintenance',
  ARRET_PROGRAMME: 'arret_programme'
}

// Types pour Engins
export const EquipmentStatus = {
  OPERATIONNEL: 'operationnel',
  EN_PANNE: 'en_panne',
  EN_MAINTENANCE: 'en_maintenance',
  HORS_SERVICE: 'hors_service'
}

export const MaintenanceType = {
  PREVENTIVE: 'preventive',
  CORRECTIVE: 'corrective',
  PREDICTIVE: 'predictive'
}

// Types pour Users
export const UserRole = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  SUPERVISOR: 'supervisor',
  VIEWER: 'viewer'
}

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
} 