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
        fullLegalName: 'Dr. Amanda Nicole Davis',
        emailAddress: 'amanda.davis@medicalpractice.com',
        phoneNumbers: ['555-0199', '555-0198'],
        npi: '1987654321',
        status: 'active',
        providerRole: 'physician' as const,
        clinicianType: 'md' as const,
        homeAddress: '456 Maple Drive, Austin, TX 78701',
        mailingAddress: '789 Professional Plaza, Suite 301, Austin, TX 78701',
        dateOfBirth: '1985-07-12',
        gender: 'female' as const,
        ssn: '987-65-4321',
        tin: '98-7654321',
        deaNumber: 'AD9876543',
        caqhId: 'CAQ987654',
        practiceName: 'Austin Family Medicine Center',
        primaryPracticeAddress: '1200 Medical Center Blvd, Austin, TX 78701',
        secondaryPracticeAddresses: '2400 North Lamar Blvd, Austin, TX 78705',
        officePhone: '512-555-0199',
        officeFax: '512-555-0200',
        officeContactPerson: 'Maria Rodriguez',
        groupNpi: '1122334455',
        groupTaxId: '12-3456789',
        malpracticeCarrier: 'Medical Protective Insurance',
        malpracticePolicyNumber: 'MP987654321',
        coverageLimits: '$1M/$3M',
        malpracticeExpirationDate: addYears(today, 1),
        emergencyContact: {
          name: 'Dr. Michael Davis',
          phone: '555-0301',
          relationship: 'Spouse'
        }
      },
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
    
    // Add comprehensive education records for Dr. Amanda Nicole Davis
    const amandaDavis = createdPhysicians.find(p => p.fullLegalName === 'Dr. Amanda Nicole Davis');
    if (amandaDavis) {
      // Medical School
      await storage.createPhysicianEducation({
        physicianId: amandaDavis.id,
        educationType: 'medical_school',
        institutionName: 'University of Texas Southwestern Medical School',
        specialty: 'Doctor of Medicine',
        location: 'Dallas, TX',
        startDate: '2003-08-15',
        completionDate: '2007-05-20',
        graduationYear: 2007
      });

      // Residency
      await storage.createPhysicianEducation({
        physicianId: amandaDavis.id,
        educationType: 'residency',
        institutionName: 'Baylor College of Medicine',
        specialty: 'Family Medicine',
        location: 'Houston, TX',
        startDate: '2007-07-01',
        completionDate: '2010-06-30'
      });

      // Fellowship
      await storage.createPhysicianEducation({
        physicianId: amandaDavis.id,
        educationType: 'fellowship',
        institutionName: 'Mayo Clinic',
        specialty: 'Sports Medicine',
        location: 'Rochester, MN',
        startDate: '2010-07-01',
        completionDate: '2011-06-30'
      });

      console.log(`✅ Created education records for ${amandaDavis.fullLegalName}`);

      // Add work history for Dr. Amanda Nicole Davis
      await storage.createPhysicianWorkHistory({
        physicianId: amandaDavis.id,
        employerName: 'Austin Sports Medicine Clinic',
        position: 'Sports Medicine Physician',
        startDate: '2011-07-01',
        endDate: '2015-12-31',
        address: '3400 Guadalupe St, Austin, TX 78705',
        supervisorName: 'Dr. Robert Johnson, MD',
        reasonForLeaving: 'Career advancement'
      });

      await storage.createPhysicianWorkHistory({
        physicianId: amandaDavis.id,
        employerName: 'Dell Seton Medical Center',
        position: 'Emergency Medicine Physician',
        startDate: '2016-01-01',
        endDate: '2019-06-30',
        address: '1501 Red River St, Austin, TX 78701',
        supervisorName: 'Dr. Sarah Wilson, MD',
        reasonForLeaving: 'Started private practice'
      });

      await storage.createPhysicianWorkHistory({
        physicianId: amandaDavis.id,
        employerName: 'Austin Family Medicine Center',
        position: 'Family Medicine Physician & Practice Owner',
        startDate: '2019-07-01',
        endDate: null,
        address: '1200 Medical Center Blvd, Austin, TX 78701',
        supervisorName: 'Self-employed',
        reasonForLeaving: null
      });

      console.log(`✅ Created work history for ${amandaDavis.fullLegalName}`);

      // Add hospital affiliations
      await storage.createPhysicianHospitalAffiliation({
        physicianId: amandaDavis.id,
        hospitalName: 'St. David\'s Medical Center',
        privileges: ['Admitting', 'Surgery', 'Emergency'],
        startDate: '2019-07-01',
        endDate: null,
        status: 'active'
      });

      await storage.createPhysicianHospitalAffiliation({
        physicianId: amandaDavis.id,
        hospitalName: 'Dell Children\'s Medical Center',
        privileges: ['Consulting', 'Admitting'],
        startDate: '2020-01-01',
        endDate: null,
        status: 'active'
      });

      console.log(`✅ Created hospital affiliations for ${amandaDavis.fullLegalName}`);

      // Add compliance record
      await storage.createPhysicianCompliance({
        physicianId: amandaDavis.id,
        backgroundCheckCompleted: true,
        backgroundCheckDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        tbTestCompleted: true,
        tbTestDate: format(subDays(today, 45), 'yyyy-MM-dd'),
        vaccinationsCompleted: true,
        vaccinationRecords: ['COVID-19', 'Influenza', 'Hepatitis B', 'MMR', 'Varicella'],
        continuingEducationHours: 50,
        lastEducationUpdate: format(subDays(today, 15), 'yyyy-MM-dd'),
        malpracticeInsuranceActive: true,
        malpracticeInsuranceExpiry: format(addMonths(today, 10), 'yyyy-MM-dd'),
        boardCertificationActive: true,
        boardCertificationExpiry: format(addYears(today, 3), 'yyyy-MM-dd'),
        licenseRevocations: false,
        licenseRevocationsExplanation: null,
        malpracticeClaims: false,
        malpracticeClaimsExplanation: null,
        pendingInvestigations: false,
        pendingInvestigationsExplanation: null,
        medicareSanctions: false,
        medicareSanctionsExplanation: null,
        deaCertificateActive: true
      });

      console.log(`✅ Created compliance record for ${amandaDavis.fullLegalName}`);

      // Add specific licenses for Dr. Amanda Nicole Davis
      await storage.createPhysicianLicense({
        physicianId: amandaDavis.id,
        state: 'TX',
        licenseNumber: 'TX-MD-987654',
        issueDate: format(subYears(today, 5), 'yyyy-MM-dd'),
        expirationDate: format(addYears(today, 2), 'yyyy-MM-dd'),
        status: 'active',
        licenseType: 'Medical License',
        verificationDate: format(subDays(today, 10), 'yyyy-MM-dd'),
        notes: 'Full unrestricted medical license'
      });

      await storage.createPhysicianLicense({
        physicianId: amandaDavis.id,
        state: 'CA',
        licenseNumber: 'CA-MD-123789',
        issueDate: format(subYears(today, 3), 'yyyy-MM-dd'),
        expirationDate: format(addMonths(today, 8), 'yyyy-MM-dd'),
        status: 'active',
        licenseType: 'Medical License',
        verificationDate: format(subDays(today, 20), 'yyyy-MM-dd'),
        notes: 'Interstate medical license'
      });

      console.log(`✅ Created medical licenses for ${amandaDavis.fullLegalName}`);

      // Add DEA registration for Dr. Amanda Nicole Davis
      await storage.createDeaRegistration({
        physicianId: amandaDavis.id,
        deaNumber: 'AD9876543',
        issueDate: format(subYears(today, 2), 'yyyy-MM-dd'),
        expireDate: format(addYears(today, 1), 'yyyy-MM-dd'),
        state: 'TX',
        status: 'active',
        schedules: ['II', 'III', 'IV', 'V'],
        mateTrainingComplete: true,
        mateTrainingDate: format(subMonths(today, 6), 'yyyy-MM-dd'),
        businessActivityCode: 'A',
        additionalRegistrations: ['Hospital privileges', 'Emergency prescribing']
      });

      console.log(`✅ Created DEA registration for ${amandaDavis.fullLegalName}`);

      // Add CSR license for Dr. Amanda Nicole Davis
      await storage.createCsrLicense({
        physicianId: amandaDavis.id,
        state: 'TX',
        licenseNumber: 'CSR-TX-987654',
        issueDate: format(subYears(today, 1), 'yyyy-MM-dd'),
        expireDate: format(addYears(today, 1), 'yyyy-MM-dd'),
        status: 'active',
        renewalCycle: 'biennial',
        registrationFee: 250,
        lastRenewalDate: format(subMonths(today, 12), 'yyyy-MM-dd'),
        notes: 'Controlled substance registration for Texas'
      });

      console.log(`✅ Created CSR license for ${amandaDavis.fullLegalName}`);

      // Add board certifications for Dr. Amanda Nicole Davis
      await storage.createPhysicianCertification({
        physicianId: amandaDavis.id,
        certificationType: 'Board Certification',
        certifyingBody: 'American Board of Family Medicine',
        certificationNumber: 'ABFM-987654',
        issueDate: format(subYears(today, 10), 'yyyy-MM-dd'),
        expirationDate: format(addYears(today, 2), 'yyyy-MM-dd'),
        status: 'active',
        notes: 'Family Medicine Board Certification'
      });

      await storage.createPhysicianCertification({
        physicianId: amandaDavis.id,
        certificationType: 'Sports Medicine Certificate',
        certifyingBody: 'American Board of Sports Medicine',
        certificationNumber: 'ABSM-456789',
        issueDate: format(subYears(today, 8), 'yyyy-MM-dd'),
        expirationDate: format(addYears(today, 1), 'yyyy-MM-dd'),
        status: 'active',
        notes: 'Sports Medicine Subspecialty Certification'
      });

      await storage.createPhysicianCertification({
        physicianId: amandaDavis.id,
        certificationType: 'ACLS',
        certifyingBody: 'American Heart Association',
        certificationNumber: 'AHA-ACLS-789123',
        issueDate: format(subYears(today, 1), 'yyyy-MM-dd'),
        expirationDate: format(addYears(today, 1), 'yyyy-MM-dd'),
        status: 'active',
        notes: 'Advanced Cardiac Life Support'
      });

      await storage.createPhysicianCertification({
        physicianId: amandaDavis.id,
        certificationType: 'BLS',
        certifyingBody: 'American Heart Association',
        certificationNumber: 'AHA-BLS-321654',
        issueDate: format(subYears(today, 1), 'yyyy-MM-dd'),
        expirationDate: format(addYears(today, 1), 'yyyy-MM-dd'),
        status: 'active',
        notes: 'Basic Life Support'
      });

      console.log(`✅ Created certifications for ${amandaDavis.fullLegalName}`);
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