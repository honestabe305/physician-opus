// Comprehensive Test Data Generator for PhysicianCRM
// Generates 171 physicians across 10 practices with full licensing data

import { Pool } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Clinician types from schema
const clinicianTypes = [
  'md', 'do', 'pa', 'np', 'cnm', 'crna', 'cns', 'rn', 'lpn', 'lvn', 'cna', 'na',
  'ma', 'admin_staff', 'receptionist', 'billing_specialist', 'medical_technician',
  'lab_technician', 'radiology_tech', 'pharmacist', 'dentist', 'optometrist',
  'podiatrist', 'chiropractor', 'physical_therapist', 'occupational_therapist',
  'speech_language_pathologist', 'respiratory_therapist', 'paramedic', 'emt',
  'radiation_therapist', 'sonographer', 'dietitian', 'social_worker', 'case_manager', 'other'
];

// Provider roles
const providerRoles = ['physician', 'pa', 'np'];

// Gender types
const genderTypes = ['male', 'female', 'other', 'prefer_not_to_say'];

// License types by clinician type
const licenseTypeMap = {
  'md': ['Medical License', 'Physician License'],
  'do': ['Osteopathic License', 'Medical License'],
  'pa': ['Physician Assistant License'],
  'np': ['Nurse Practitioner License', 'Advanced Practice Nursing License'],
  'cnm': ['Certified Nurse Midwife License'],
  'crna': ['Certified Registered Nurse Anesthetist License'],
  'cns': ['Clinical Nurse Specialist License'],
  'rn': ['Registered Nurse License'],
  'lpn': ['Licensed Practical Nurse License'],
  'lvn': ['Licensed Vocational Nurse License'],
  'pharmacist': ['Pharmacy License'],
  'dentist': ['Dental License'],
  'optometrist': ['Optometry License'],
  'podiatrist': ['Podiatry License'],
  'chiropractor': ['Chiropractic License'],
  'physical_therapist': ['Physical Therapy License'],
  'occupational_therapist': ['Occupational Therapy License'],
  'speech_language_pathologist': ['Speech-Language Pathology License'],
  'respiratory_therapist': ['Respiratory Therapy License'],
  'paramedic': ['Paramedic License'],
  'emt': ['Emergency Medical Technician License']
};

// US States for licensing
const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY'
];

// First and last names for realistic data
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
  'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra',
  'Donald', 'Donna', 'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Kenneth', 'Michelle',
  'Joshua', 'Laura', 'Kevin', 'Sarah', 'Brian', 'Kimberly', 'George', 'Deborah', 'Edward', 'Dorothy',
  'Ronald', 'Amy', 'Timothy', 'Angela', 'Jason', 'Ashley', 'Jeffrey', 'Brenda', 'Ryan', 'Emma'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNPI() {
  // Generate a 10-digit NPI number
  return '1' + Math.floor(Math.random() * 900000000 + 100000000).toString();
}

function generateLicenseNumber(state, type) {
  const prefixes = {
    'Medical License': 'MD',
    'Osteopathic License': 'DO',
    'Physician Assistant License': 'PA',
    'Nurse Practitioner License': 'NP',
    'Registered Nurse License': 'RN',
    'Pharmacy License': 'RPH'
  };
  const prefix = prefixes[type] || 'LIC';
  return `${state}${prefix}${randomInt(10000, 99999)}`;
}

function generateDEANumber() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const first = randomChoice(['A', 'B', 'F', 'M']); // Common DEA prefixes
  const second = randomChoice(letters);
  const numbers = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${first}${second}${numbers}`;
}

function generateCSRNumber(state) {
  return `${state}CSR${randomInt(1000, 9999)}`;
}

function generateRandomDate(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function generatePhoneNumber() {
  const area = randomInt(200, 999);
  const exchange = randomInt(200, 999);
  const number = randomInt(1000, 9999);
  return `(${area}) ${exchange}-${number}`;
}

function generateEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'medicenter.com', 'healthcare.net'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomChoice(domains)}`;
}

async function getPracticeIds() {
  const result = await pool.query('SELECT id FROM practices ORDER BY created_at');
  return result.rows.map(row => row.id);
}

async function generateTestData() {
  console.log('🚀 Starting test data generation...');
  
  try {
    // Get all practice IDs
    const practiceIds = await getPracticeIds();
    console.log(`📊 Found ${practiceIds.length} practices`);

    // Generate 171 physicians to reach 200 total
    const physiciansToCreate = 171;
    console.log(`👥 Creating ${physiciansToCreate} physicians...`);

    for (let i = 0; i < physiciansToCreate; i++) {
      // Generate basic physician data
      const firstName = randomChoice(firstNames);
      const lastName = randomChoice(lastNames);
      const fullName = `${firstName} ${lastName}`;
      const clinicianType = randomChoice(clinicianTypes);
      const gender = randomChoice(genderTypes);
      const practiceId = randomChoice(practiceIds);
      
      // Generate dates of birth (ages 25-70)
      const birthYear = 2024 - randomInt(25, 70);
      const dateOfBirth = formatDate(new Date(birthYear, randomInt(0, 11), randomInt(1, 28)));
      
      // Determine if this clinician needs DEA/prescribing authority
      const needsDEA = ['md', 'do', 'pa', 'np', 'cnm', 'crna'].includes(clinicianType);
      const needsCSR = needsDEA; // Same criteria for controlled substances

      // Generate physician record
      const physicianData = {
        id: randomUUID(),
        fullLegalName: fullName,
        dateOfBirth,
        gender,
        ssn: `${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(1000, 9999)}`,
        npi: generateNPI(),
        tin: `${randomInt(10, 99)}-${randomInt(1000000, 9999999)}`,
        deaNumber: needsDEA ? generateDEANumber() : null,
        caqhId: randomInt(100000, 999999).toString(),
        homeAddress: `${randomInt(100, 9999)} ${randomChoice(['Main', 'Oak', 'Pine', 'Elm', 'Cedar'])} St, ${randomChoice(['Anytown', 'Springfield', 'Madison', 'Franklin'])} ${randomChoice(states)} ${randomInt(10000, 99999)}`,
        mailingAddress: `PO Box ${randomInt(100, 9999)}, ${randomChoice(['Anytown', 'Springfield', 'Madison', 'Franklin'])} ${randomChoice(states)} ${randomInt(10000, 99999)}`,
        phoneNumbers: [generatePhoneNumber(), generatePhoneNumber()],
        emailAddress: generateEmail(firstName, lastName),
        emergencyContact: {
          name: `${randomChoice(firstNames)} ${randomChoice(lastNames)}`,
          relationship: randomChoice(['Spouse', 'Parent', 'Sibling', 'Child']),
          phone: generatePhoneNumber()
        },
        practiceName: `Practice for ${fullName}`,
        primaryPracticeAddress: `${randomInt(100, 9999)} Medical Center Dr, ${randomChoice(['Anytown', 'Springfield', 'Madison', 'Franklin'])} ${randomChoice(states)} ${randomInt(10000, 99999)}`,
        officePhone: generatePhoneNumber(),
        officeFax: generatePhoneNumber(),
        officeContactPerson: `${randomChoice(firstNames)} ${randomChoice(lastNames)}`,
        groupNpi: generateNPI(),
        groupTaxId: `${randomInt(10, 99)}-${randomInt(1000000, 9999999)}`,
        malpracticeCarrier: randomChoice(['Medical Protective', 'The Doctors Company', 'ProAssurance', 'NORCAL Mutual', 'CNA']),
        malpracticePolicyNumber: `MP${randomInt(1000000, 9999999)}`,
        coverageLimits: randomChoice(['$1M/$3M', '$2M/$6M', '$1M/$1M']),
        malpracticeExpirationDate: formatDate(generateRandomDate('2025-01-01', '2025-12-31')),
        status: randomChoice(['active', 'inactive', 'pending']),
        providerRole: ['md', 'do'].includes(clinicianType) ? 'physician' : ['pa'].includes(clinicianType) ? 'pa' : ['np', 'cnm', 'crna', 'cns'].includes(clinicianType) ? 'np' : null,
        clinicianType,
        practiceId
      };

      // Insert physician
      await pool.query(`
        INSERT INTO physicians (
          id, full_legal_name, date_of_birth, gender, ssn, npi, tin, dea_number, caqh_id,
          home_address, mailing_address, phone_numbers, email_address, emergency_contact,
          practice_name, primary_practice_address, office_phone, office_fax, office_contact_person,
          group_npi, group_tax_id, malpractice_carrier, malpractice_policy_number, coverage_limits,
          malpractice_expiration_date, status, provider_role, clinician_type, practice_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
        )
      `, [
        physicianData.id, physicianData.fullLegalName, physicianData.dateOfBirth, physicianData.gender,
        physicianData.ssn, physicianData.npi, physicianData.tin, physicianData.deaNumber, physicianData.caqhId,
        physicianData.homeAddress, physicianData.mailingAddress, physicianData.phoneNumbers, physicianData.emailAddress,
        JSON.stringify(physicianData.emergencyContact), physicianData.practiceName, physicianData.primaryPracticeAddress,
        physicianData.officePhone, physicianData.officeFax, physicianData.officeContactPerson, physicianData.groupNpi,
        physicianData.groupTaxId, physicianData.malpracticeCarrier, physicianData.malpracticePolicyNumber,
        physicianData.coverageLimits, physicianData.malpracticeExpirationDate, physicianData.status,
        physicianData.providerRole, physicianData.clinicianType, physicianData.practiceId
      ]);

      // Generate licenses for this physician
      const licenseTypes = licenseTypeMap[clinicianType] || ['Professional License'];
      const numLicenses = randomInt(1, Math.min(3, licenseTypes.length));
      
      for (let j = 0; j < numLicenses; j++) {
        const licenseType = licenseTypes[j % licenseTypes.length];
        const state = randomChoice(states);
        const licenseNumber = generateLicenseNumber(state, licenseType);
        
        // Generate expiration date between July 31, 2025 and December 31, 2025
        const expirationDate = formatDate(generateRandomDate('2025-07-31', '2025-12-31'));
        
        await pool.query(`
          INSERT INTO physician_licenses (
            id, physician_id, state, license_number, expiration_date, license_type
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          randomUUID(), physicianData.id, state, licenseNumber, expirationDate, licenseType
        ]);
      }

      // Generate DEA registration if needed
      if (needsDEA) {
        const deaNumber = generateDEANumber();
        const state = randomChoice(states);
        const issueDate = formatDate(generateRandomDate('2022-01-01', '2024-12-31'));
        const expireDate = formatDate(generateRandomDate('2025-07-31', '2025-12-31'));
        
        await pool.query(`
          INSERT INTO dea_registrations (
            id, physician_id, state, dea_number, issue_date, expire_date, mate_attested, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          randomUUID(), physicianData.id, state, deaNumber, issueDate, expireDate, 
          Math.random() > 0.3, 'active' // 70% chance of MATE attestation
        ]);
      }

      // Generate CSR license if needed
      if (needsCSR) {
        const csrNumber = generateCSRNumber(randomChoice(states));
        const state = randomChoice(states);
        const issueDate = formatDate(generateRandomDate('2022-01-01', '2024-12-31'));
        const expireDate = formatDate(generateRandomDate('2025-07-31', '2025-12-31'));
        
        await pool.query(`
          INSERT INTO csr_licenses (
            id, physician_id, state, csr_number, issue_date, expire_date, renewal_cycle, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          randomUUID(), physicianData.id, state, csrNumber, issueDate, expireDate,
          randomChoice(['annual', 'biennial']), 'active'
        ]);
      }

      // Progress indicator
      if ((i + 1) % 25 === 0) {
        console.log(`✅ Created ${i + 1}/${physiciansToCreate} physicians`);
      }
    }

    console.log('🎉 Test data generation completed successfully!');
    
    // Print summary
    const physicianCount = await pool.query('SELECT COUNT(*) FROM physicians');
    const licenseCount = await pool.query('SELECT COUNT(*) FROM physician_licenses');
    const deaCount = await pool.query('SELECT COUNT(*) FROM dea_registrations');
    const csrCount = await pool.query('SELECT COUNT(*) FROM csr_licenses');
    
    console.log(`📊 Summary:`);
    console.log(`   - Total Physicians: ${physicianCount.rows[0].count}`);
    console.log(`   - Total Licenses: ${licenseCount.rows[0].count}`);
    console.log(`   - Total DEA Registrations: ${deaCount.rows[0].count}`);
    console.log(`   - Total CSR Licenses: ${csrCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error generating test data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the data generation
generateTestData().catch(console.error);