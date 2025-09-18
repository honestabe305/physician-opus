import { 
  SelectPhysician,
  SelectPhysicianLicense,
  SelectDeaRegistration,
  SelectCsrLicense,
  SelectRolePolicy,
  InsertPhysicianLicense
} from '../../shared/schema';

// Types for validation results
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface RenewalDates {
  expireDate: Date;
  reminders: Array<{ days: number; date: Date }>;
}

interface ExpirationStatus {
  status: 'active' | 'expiring_soon' | 'expired';
  daysUntilExpiration: number | null;
  expirationDate: Date | null;
}

// State-specific requirements helper functions
export function stateRequiresNPCollaboration(state: string): boolean {
  // States that require NP collaboration agreements
  const collaborationStates = [
    'AL', 'AR', 'CA', 'FL', 'GA', 'IN', 'KY', 'LA', 'MI', 'MS',
    'MO', 'NC', 'OK', 'SC', 'TN', 'TX', 'VA', 'WV'
  ];
  return collaborationStates.includes(state.toUpperCase());
}

export function stateRequiresPASupervision(state: string): boolean {
  // All states require PA supervision except for these with more autonomous practice
  const autonomousStates = ['AK', 'AZ', 'CO', 'CT', 'HI', 'ME', 'MI', 'MT', 'ND', 'NM', 'OR', 'UT', 'VT', 'WA', 'WY'];
  return !autonomousStates.includes(state.toUpperCase());
}

export function getStateBoardType(role: 'physician' | 'pa' | 'np', state: string): string {
  // Return the appropriate board type based on role and state
  const boardMap: Record<string, Record<string, string>> = {
    physician: {
      default: 'State Medical Board'
    },
    pa: {
      default: 'State Board of Medicine',
      CA: 'Physician Assistant Board',
      IA: 'Board of Physician Assistant Examiners',
      MA: 'Board of Registration of Physician Assistants'
    },
    np: {
      default: 'State Board of Nursing',
      AZ: 'State Board of Nursing and State Board of Medicine',
      FL: 'Board of Nursing and Board of Medicine Joint Committee'
    }
  };

  const roleBoard = boardMap[role] || boardMap.physician;
  return roleBoard[state.toUpperCase()] || roleBoard.default;
}

export function isCompactEligible(role: 'physician' | 'pa' | 'np', state: string): boolean {
  // Check compact eligibility based on role and state
  const compactStates: Record<string, string[]> = {
    physician: [ // IMLC states
      'AL', 'AZ', 'CO', 'CT', 'DE', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
      'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'PA', 
      'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ],
    np: [ // NLC states (Nurse Licensure Compact)
      'AL', 'AZ', 'AR', 'CO', 'DE', 'FL', 'GA', 'ID', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MS', 'MO', 'MT', 'NE', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'PA', 'SC', 'SD', 'TN',
      'TX', 'UT', 'VT', 'VA', 'WV', 'WI', 'WY'
    ],
    pa: [] // PAs don't have an interstate compact yet
  };

  const eligibleStates = compactStates[role] || [];
  return eligibleStates.includes(state.toUpperCase());
}

/**
 * Validate new license creation based on provider role and state requirements
 */
export function validateNewLicense(
  licenseInput: Partial<InsertPhysicianLicense>,
  provider: SelectPhysician,
  rolePolicy: SelectRolePolicy | null
): ValidationResult {
  const errors: string[] = [];

  // Basic validation
  if (!licenseInput.state) {
    errors.push('License state is required');
  }

  if (!licenseInput.licenseNumber) {
    errors.push('License number is required');
  }

  // Note: Licenses don't have issueDate in the schema, only expirationDate

  if (!licenseInput.expirationDate) {
    errors.push('License expiration date is required');
  }

  // Validate dates (licenses don't have issueDate in schema, only expirationDate)
  if (licenseInput.expirationDate) {
    const expirationDate = new Date(licenseInput.expirationDate);
    const today = new Date();
    
    if (expirationDate <= today) {
      errors.push('Expiration date must be in the future');
    }
  }

  // Role-specific validation
  if (provider.providerRole === 'pa') {
    // PA-specific validation
    if (rolePolicy?.requiresSupervision && !provider.supervisingPhysicianId) {
      errors.push(`PA requires supervising physician agreement in ${licenseInput.state}`);
    }

    if (licenseInput.state && stateRequiresPASupervision(licenseInput.state) && !provider.supervisingPhysicianId) {
      errors.push(`PA requires supervising physician in ${licenseInput.state}`);
    }
  }

  if (provider.providerRole === 'np') {
    // NP-specific validation
    if (rolePolicy?.requiresCollaboration && !provider.collaborationPhysicianId) {
      errors.push(`NP requires collaboration agreement in ${licenseInput.state}`);
    }

    if (licenseInput.state && stateRequiresNPCollaboration(licenseInput.state) && !provider.collaborationPhysicianId) {
      errors.push(`NP requires collaboration physician in ${licenseInput.state}`);
    }

    // NPs require additional validation (RN license not tracked in main physician table)
  }

  if (provider.providerRole === 'physician') {
    // Physician-specific validation
    if (!provider.npi) {
      errors.push('Physician requires valid NPI number');
    }
  }

  // Compact license validation (if provider has a role)
  if (provider.providerRole && licenseInput.state) {
    const eligible = isCompactEligible(provider.providerRole, licenseInput.state);
    if (!eligible && rolePolicy?.compactEligible) {
      errors.push(`${provider.providerRole} is not eligible for compact license in ${licenseInput.state}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate DEA renewal dates (3-year cycle)
 */
export function computeDEARenewal(dea: SelectDeaRegistration): RenewalDates {
  const issueDate = new Date(dea.issueDate);
  const expireDate = new Date(dea.expireDate); // Use correct field name

  // DEA licenses are valid for 3 years
  if (!dea.expireDate) {
    expireDate.setFullYear(issueDate.getFullYear() + 3);
  }

  // Generate reminder dates at 90, 60, 30, 7, and 1 days before expiry
  const reminderDays = [90, 60, 30, 7, 1];
  const reminders = reminderDays.map(days => {
    const reminderDate = new Date(expireDate);
    reminderDate.setDate(reminderDate.getDate() - days);
    return { days, date: reminderDate };
  });

  return {
    expireDate,
    reminders
  };
}

/**
 * Calculate CSR renewal dates based on state-specific cycles
 */
export function computeCSRRenewal(csr: SelectCsrLicense, state: string): RenewalDates {
  const issueDate = new Date(csr.issueDate);
  let expireDate = new Date(csr.expireDate || issueDate); // Use correct field name

  // Determine renewal cycle based on state
  const annualStates = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
  const isAnnual = annualStates.includes(state.toUpperCase());

  // If no expiration date provided, calculate based on cycle
  if (!csr.expireDate) {
    const yearsToAdd = isAnnual ? 1 : 2;
    expireDate.setFullYear(issueDate.getFullYear() + yearsToAdd);
  }

  // Generate reminder dates
  const reminderDays = [90, 60, 30, 7, 1];
  const reminders = reminderDays.map(days => {
    const reminderDate = new Date(expireDate);
    reminderDate.setDate(reminderDate.getDate() - days);
    return { days, date: reminderDate };
  });

  return {
    expireDate,
    reminders
  };
}

/**
 * Validate provider role-specific requirements
 */
export function validateProviderRole(
  provider: SelectPhysician,
  state: string,
  rolePolicy: SelectRolePolicy | null
): ValidationResult {
  const errors: string[] = [];

  // Validate provider has the required role
  if (!provider.providerRole) {
    errors.push('Provider role is not defined');
    return { valid: false, errors };
  }

  switch (provider.providerRole) {
    case 'pa':
      // PA validation
      if (stateRequiresPASupervision(state) || rolePolicy?.requiresSupervision) {
        if (!provider.supervisingPhysicianId) {
          errors.push('PA requires supervising physician in this state');
        }
        
        // Supervision agreement validation would check document dates
        // (agreement dates not stored in main physician table)
      }

      // PA requirements
      // License numbers are stored in separate license tables
      break;

    case 'np':
      // NP validation
      if (stateRequiresNPCollaboration(state) || rolePolicy?.requiresCollaboration) {
        if (!provider.collaborationPhysicianId) {
          errors.push('NP requires collaboration agreement in this state');
        }
        
        // Collaboration agreement validation would check document dates
        // (agreement dates not stored in main physician table)
      }

      // NP requirements
      // License and certification numbers are stored in separate tables
      break;

    case 'physician':
      // Physician validation
      if (!provider.npi) {
        errors.push('Physician requires valid NPI number');
      }
      
      // Board certifications are tracked in separate certification table
      // Can be validated by checking physicianCertifications records
      break;
  }

  // Compact eligibility validation
  if (provider.providerRole) {
    const compactEligible = isCompactEligible(provider.providerRole, state);
    if (rolePolicy?.compactEligible && !compactEligible) {
      errors.push(`${provider.providerRole} is not eligible for compact license in ${state}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check license expiration status
 */
export function checkLicenseExpiration(
  expirationDate: string | Date | null
): ExpirationStatus {
  if (!expirationDate) {
    return {
      status: 'active',
      daysUntilExpiration: null,
      expirationDate: null
    };
  }

  const expDate = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status: 'active' | 'expiring_soon' | 'expired';
  
  if (daysUntilExpiration < 0) {
    status = 'expired';
  } else if (daysUntilExpiration <= 90) {
    status = 'expiring_soon';
  } else {
    status = 'active';
  }

  return {
    status,
    daysUntilExpiration,
    expirationDate: expDate
  };
}

/**
 * Validate required documents based on provider role and state
 */
export function validateRequiredDocuments(
  provider: SelectPhysician,
  state: string,
  documents: string[]
): ValidationResult {
  const errors: string[] = [];
  const requiredDocs: string[] = [];

  // Common documents for all providers
  requiredDocs.push('drivers_license', 'medical_diploma', 'cv', 'malpractice_insurance');

  // Role-specific documents
  switch (provider.providerRole) {
    case 'physician':
      requiredDocs.push(
        'medical_license',
        'dea_certificate',
        'board_certification',
        'residency_certificate'
      );
      break;

    case 'pa':
      requiredDocs.push(
        'medical_license',
        'dea_certificate',
        'supervision_agreement'
      );
      if (stateRequiresPASupervision(state)) {
        requiredDocs.push('supervision_agreement');
      }
      break;

    case 'np':
      requiredDocs.push(
        'medical_license',
        'dea_certificate',
        'controlled_substance_registration'
      );
      if (stateRequiresNPCollaboration(state)) {
        requiredDocs.push('collaboration_agreement');
      }
      break;
  }

  // Check for missing documents
  const missingDocs = requiredDocs.filter(doc => !documents.includes(doc));
  
  if (missingDocs.length > 0) {
    errors.push(`Missing required documents: ${missingDocs.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate renewal timeline with all important dates
 */
export function calculateRenewalTimeline(
  licenseDate: Date,
  cycleYears: number = 2
): Array<{ action: string; date: Date; daysFromNow: number }> {
  const timeline: Array<{ action: string; date: Date; daysFromNow: number }> = [];
  const today = new Date();
  const expiryDate = new Date(licenseDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + cycleYears);

  // Key milestone dates
  const milestones = [
    { days: 180, action: 'Begin renewal preparation' },
    { days: 120, action: 'Compile required documents' },
    { days: 90, action: 'Submit renewal application' },
    { days: 60, action: 'Follow up on application status' },
    { days: 30, action: 'Urgent: Renewal deadline approaching' },
    { days: 14, action: 'Critical: Contact licensing board' },
    { days: 7, action: 'Final reminder: License expires soon' },
    { days: 0, action: 'License expires' }
  ];

  milestones.forEach(milestone => {
    const actionDate = new Date(expiryDate);
    actionDate.setDate(actionDate.getDate() - milestone.days);
    
    const daysFromNow = Math.floor((actionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    timeline.push({
      action: milestone.action,
      date: actionDate,
      daysFromNow
    });
  });

  return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
}