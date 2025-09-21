import { createStorage } from './storage';

async function createTestPhysician() {
  const storage = createStorage();
  
  try {
    // Create a test physician with comprehensive data
    const testPhysician = await storage.createPhysician({
      fullLegalName: "Dr. John Samuel Smith",
      npi: "1234567890",
      emailAddress: "john.smith@testclinic.com",
      phoneNumbers: ["555-123-4567", "555-987-6543"],
      mailingAddress: "123 Medical Center Dr, Suite 100, Anytown, ST 12345",
      dateOfBirth: "1980-05-15",
      gender: "male",
      practiceName: "Test Medical Clinic",
      officePhone: "555-456-7890",
      primaryPracticeAddress: "456 Health Plaza, Anytown, ST 12345",
      groupNpi: "9876543210",
      status: "active",
      providerRole: "physician"
    });

    console.log('✅ Test physician created successfully');
    console.log('Physician ID:', testPhysician.id);
    console.log('Name:', testPhysician.fullLegalName);
    console.log('NPI:', testPhysician.npi);
    
    return testPhysician;
  } catch (error) {
    console.error('Error creating test physician:', error);
  }
}

createTestPhysician().then(() => {
  console.log('Test physician setup complete');
  process.exit(0);
}).catch(error => {
  console.error('Failed to create test physician:', error);
  process.exit(1);
});