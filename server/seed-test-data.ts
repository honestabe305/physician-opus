import { createStorage } from './storage';
import { addDays, subDays, addMonths, addYears, format } from 'date-fns';
import { NotificationService } from './services/notification-service';
import { renewalService } from './services/renewal-service';
import crypto from 'crypto';

async function seedTestData() {
  const storage = createStorage();
  const notificationService = new NotificationService(storage);
  
  console.log('🌱 Seeding test data with expiration dates...');
  
  try {
    const today = new Date();
    
    // Create test physicians
    const physicians = [
      {
        id: crypto.randomUUID(),
        fullLegalName: 'John Smith',
        emailAddress: 'john.smith@example.com',
        phoneNumbers: ['555-0101'],
        npi: '1234567890',
        status: 'active',
        providerRole: 'physician' as const,
        homeAddress: '123 Main St, New York, NY 10001',
        dateOfBirth: '1975-03-15',
        gender: 'male' as const,
        ssn: '123-45-6789',
        deaNumber: 'BS1234567'
      },
      {
        id: crypto.randomUUID(),
        fullLegalName: 'Sarah Johnson',
        emailAddress: 'sarah.johnson@example.com',
        phoneNumbers: ['555-0102'],
        npi: '2345678901',
        status: 'active',
        providerRole: 'physician' as const,
        homeAddress: '456 Elm St, Boston, MA 02101',
        dateOfBirth: '1980-07-22',
        gender: 'female' as const,
        ssn: '234-56-7890',
        deaNumber: 'JS2345678'
      },
      {
        id: crypto.randomUUID(),
        fullLegalName: 'Michael Williams',
        emailAddress: 'michael.williams@example.com',
        phoneNumbers: ['555-0103'],
        npi: '3456789012',
        status: 'active',
        providerRole: 'pa' as const,
        homeAddress: '789 Oak St, Chicago, IL 60601',
        dateOfBirth: '1982-11-08',
        gender: 'male' as const,
        ssn: '345-67-8901'
      },
      {
        id: crypto.randomUUID(),
        fullLegalName: 'Emily Davis',
        emailAddress: 'emily.davis@example.com',
        phoneNumbers: ['555-0104'],
        npi: '4567890123',
        status: 'active',
        providerRole: 'np' as const,
        homeAddress: '321 Pine St, Houston, TX 77001',
        dateOfBirth: '1985-05-30',
        gender: 'female' as const,
        ssn: '456-78-9012'
      },
      {
        id: crypto.randomUUID(),
        fullLegalName: 'Robert Brown',
        emailAddress: 'robert.brown@example.com',
        phoneNumbers: ['555-0105'],
        npi: '5678901234',
        status: 'inactive',
        providerRole: 'physician' as const,
        homeAddress: '654 Cedar St, Phoenix, AZ 85001',
        dateOfBirth: '1970-09-12',
        gender: 'male' as const,
        ssn: '567-89-0123',
        deaNumber: 'BB5678901'
      }
    ];
    
    // Create physicians
    const createdPhysicians = [];
    for (const physician of physicians) {
      const created = await storage.createPhysician(physician);
      createdPhysicians.push(created);
      console.log(`✅ Created physician: ${physician.fullLegalName}`);
    }
    
    // Create licenses with various expiration dates
    const licenseExpirationDates = [
      subDays(today, 10), // Already expired
      addDays(today, 5),   // Critical - expires in 5 days
      addDays(today, 15),  // Warning - expires in 15 days
      addDays(today, 25),  // Warning - expires in 25 days
      addDays(today, 45),  // Info - expires in 45 days
      addDays(today, 60),  // Info - expires in 60 days
      addDays(today, 85),  // Info - expires in 85 days
      addMonths(today, 4), // Expires in 4 months
      addMonths(today, 6), // Expires in 6 months
      addYears(today, 1),  // Expires in 1 year
    ];
    
    const states = ['NY', 'CA', 'TX', 'FL', 'MA', 'IL', 'PA', 'OH', 'GA', 'NC'];
    const licenseTypes = ['Medical', 'Surgical', 'DEA', 'State Medical', 'Controlled Substance'];
    
    // Create licenses for each physician
    let licenseIndex = 0;
    for (let i = 0; i < createdPhysicians.length; i++) {
      const physician = createdPhysicians[i];
      
      // Create 2-3 licenses per physician with different expiration dates
      const numLicenses = Math.min(2 + (i % 2), licenseExpirationDates.length - licenseIndex);
      
      for (let j = 0; j < numLicenses; j++) {
        const expirationDate = licenseExpirationDates[licenseIndex % licenseExpirationDates.length];
        const state = states[j % states.length];
        const licenseType = licenseTypes[j % licenseTypes.length];
        
        const license = await storage.createPhysicianLicense({
          physicianId: physician.id,
          state: state,
          licenseNumber: `${state}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          issueDate: format(subDays(expirationDate, 365), 'yyyy-MM-dd'),
          expirationDate: format(expirationDate, 'yyyy-MM-dd'),
          status: expirationDate < today ? 'expired' : 'active',
          licenseType: licenseType,
          verificationDate: format(subDays(today, 30), 'yyyy-MM-dd'),
          notes: `${licenseType} license for ${state}`
        });
        
        console.log(`✅ Created ${licenseType} license for ${physician.fullLegalName} expiring ${format(expirationDate, 'yyyy-MM-dd')}`);
        licenseIndex++;
      }
    }
    
    // Create DEA registrations with various expiration dates
    const deaExpirationDates = [
      addDays(today, 7),   // Critical - expires in 1 week
      addDays(today, 30),  // Warning - expires in 30 days
      addDays(today, 60),  // Info - expires in 60 days
      addMonths(today, 6), // Expires in 6 months
    ];
    
    for (let i = 0; i < Math.min(createdPhysicians.length - 1, deaExpirationDates.length); i++) {
      const physician = createdPhysicians[i];
      const expirationDate = deaExpirationDates[i];
      
      const deaRegistration = await storage.createDeaRegistration({
        physicianId: physician.id,
        deaNumber: `B${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        issueDate: format(subYears(expirationDate, 3), 'yyyy-MM-dd'),
        expireDate: format(expirationDate, 'yyyy-MM-dd'),
        state: states[i % states.length],
        status: 'active',
        schedules: ['II', 'III', 'IV', 'V'],
        mateTrainingComplete: i % 2 === 0,
        mateTrainingDate: i % 2 === 0 ? format(subDays(today, 90), 'yyyy-MM-dd') : null,
        businessActivityCode: 'B',
        additionalRegistrations: []
      });
      
      console.log(`✅ Created DEA registration for ${physician.fullLegalName} expiring ${format(expirationDate, 'yyyy-MM-dd')}`);
    }
    
    // Create CSR licenses with various expiration dates
    const csrExpirationDates = [
      addDays(today, 14),  // Critical - expires in 2 weeks
      addDays(today, 45),  // Warning - expires in 45 days
      addDays(today, 90),  // Info - expires in 90 days
    ];
    
    for (let i = 0; i < Math.min(createdPhysicians.length - 2, csrExpirationDates.length); i++) {
      const physician = createdPhysicians[i];
      const expirationDate = csrExpirationDates[i];
      const state = states[(i + 2) % states.length];
      
      const csrLicense = await storage.createCsrLicense({
        physicianId: physician.id,
        state: state,
        licenseNumber: `CSR-${state}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        issueDate: format(subYears(expirationDate, 2), 'yyyy-MM-dd'),
        expireDate: format(expirationDate, 'yyyy-MM-dd'),
        status: 'active',
        renewalCycle: i % 2 === 0 ? 'annual' : 'biennial',
        registrationFee: 150 + (i * 50),
        lastRenewalDate: format(subYears(today, 1), 'yyyy-MM-dd'),
        notes: `CSR license for ${state}`
      });
      
      console.log(`✅ Created CSR license for ${physician.fullLegalName} in ${state} expiring ${format(expirationDate, 'yyyy-MM-dd')}`);
    }
    
    // Create certifications with various expiration dates
    const certificationExpirationDates = [
      subDays(today, 5),   // Already expired
      addDays(today, 10),  // Critical - expires in 10 days
      addDays(today, 35),  // Warning - expires in 35 days
      addDays(today, 75),  // Info - expires in 75 days
      addMonths(today, 5), // Expires in 5 months
    ];
    
    const certificationTypes = ['Board Certification', 'ACLS', 'BLS', 'PALS', 'ATLS'];
    const certifyingBodies = ['ABIM', 'ABMS', 'AHA', 'AAP', 'ACS'];
    
    for (let i = 0; i < createdPhysicians.length; i++) {
      const physician = createdPhysicians[i];
      const numCerts = Math.min(2, certificationExpirationDates.length - i);
      
      for (let j = 0; j < numCerts; j++) {
        const certIndex = (i + j) % certificationExpirationDates.length;
        const expirationDate = certificationExpirationDates[certIndex];
        
        const certification = await storage.createPhysicianCertification({
          physicianId: physician.id,
          certificationType: certificationTypes[certIndex % certificationTypes.length],
          certifyingBody: certifyingBodies[certIndex % certifyingBodies.length],
          certificationNumber: `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          issueDate: format(subYears(expirationDate, 2), 'yyyy-MM-dd'),
          expirationDate: format(expirationDate, 'yyyy-MM-dd'),
          status: expirationDate < today ? 'expired' : 'active',
          notes: `Certification for ${physician.fullLegalName}`
        });
        
        console.log(`✅ Created ${certification.certificationType} certification for ${physician.fullLegalName} expiring ${format(expirationDate, 'yyyy-MM-dd')}`);
      }
    }
    
    // Create compliance records for each physician
    for (const physician of createdPhysicians) {
      const compliance = await storage.createPhysicianCompliance({
        physicianId: physician.id,
        backgroundCheckCompleted: true,
        backgroundCheckDate: format(subDays(today, 180), 'yyyy-MM-dd'),
        tbTestCompleted: true,
        tbTestDate: format(subDays(today, 90), 'yyyy-MM-dd'),
        vaccinationsCompleted: true,
        vaccinationRecords: ['COVID-19', 'Influenza', 'Hepatitis B'],
        continuingEducationHours: 30,
        lastEducationUpdate: format(subDays(today, 60), 'yyyy-MM-dd'),
        malpracticeInsuranceActive: true,
        malpracticeInsuranceExpiry: format(addMonths(today, 8), 'yyyy-MM-dd'),
        boardCertificationActive: physician.status === 'active',
        boardCertificationExpiry: format(addYears(today, 2), 'yyyy-MM-dd'),
        licenseRevocations: false,
        malpracticeClaims: false,
        pendingInvestigations: false,
        medicareSanctions: false,
        deaCertificateActive: true
      });
      
      console.log(`✅ Created compliance record for ${physician.fullLegalName}`);
    }
    
    // Generate notifications for upcoming expirations
    console.log('\n🔔 Generating notifications for upcoming expirations...');
    await notificationService.checkUpcomingExpirations();
    
    // Create some renewal workflows
    console.log('\n📋 Creating renewal workflows...');
    
    // Get licenses that expire soon
    const expiringLicenses = await storage.getExpiringLicenses(90);
    for (let i = 0; i < Math.min(3, expiringLicenses.length); i++) {
      const license = expiringLicenses[i];
      const workflow = await renewalService.initiateRenewal(
        license.physicianId,
        'license',
        license.id,
        'system'
      );
      
      // Update some workflows to different statuses
      if (i === 0) {
        await renewalService.updateRenewalStatus(workflow.id, 'in_progress', null, 'system');
      } else if (i === 1) {
        await renewalService.updateRenewalStatus(workflow.id, 'filed', null, 'system');
      }
      
      console.log(`✅ Created renewal workflow for license ${license.id}`);
    }
    
    // Get DEA registrations that expire soon
    const expiringDEAs = await storage.getExpiringDeaRegistrations(90);
    for (let i = 0; i < Math.min(2, expiringDEAs.length); i++) {
      const dea = expiringDEAs[i];
      const workflow = await renewalService.initiateRenewal(
        dea.physicianId,
        'dea',
        dea.id,
        'system'
      );
      
      if (i === 0) {
        await renewalService.updateRenewalStatus(workflow.id, 'under_review', null, 'system');
      }
      
      console.log(`✅ Created renewal workflow for DEA registration ${dea.id}`);
    }
    
    console.log('\n✅ Test data seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`  - ${createdPhysicians.length} physicians created`);
    console.log(`  - ${licenseExpirationDates.length} licenses with various expiration dates`);
    console.log(`  - ${deaExpirationDates.length} DEA registrations`);
    console.log(`  - ${csrExpirationDates.length} CSR licenses`);
    console.log(`  - ${certificationExpirationDates.length} certifications`);
    console.log(`  - Compliance records for all physicians`);
    console.log(`  - Notifications generated for upcoming expirations`);
    console.log(`  - Sample renewal workflows created`);
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

function subYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() - years);
  return result;
}

// Run the seed script
seedTestData()
  .then(() => {
    console.log('✅ Seed process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed process failed:', error);
    process.exit(1);
  });

export { seedTestData };