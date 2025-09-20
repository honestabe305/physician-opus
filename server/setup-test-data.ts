import { createStorage } from './storage';
import { hashPassword } from './auth';

async function setupTestData() {
  const storage = createStorage();
  
  try {
    // Create test admin user
    const hashedPassword = await hashPassword('Admin123!@#');
    
    const testUser = {
      email: 'admin@physiciancrm.com',
      username: 'admin',
      passwordHash: hashedPassword,
      role: 'admin',
      isActive: true,
      twoFactorEnabled: false
    };

    try {
      const user = await storage.createUser(testUser);
      console.log('✅ Test admin user created successfully');
      console.log('Email:', user.email);
      console.log('Username:', user.username);
      console.log('Role:', user.role);
    } catch (error: any) {
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        console.log('ℹ️ Test admin user already exists');
      } else {
        throw error;
      }
    }

    // Check if test physician exists
    try {
      const physicians = await storage.getAllPhysicians();
      if (physicians.length > 0) {
        console.log('✅ Test physicians available for testing:');
        physicians.slice(0, 3).forEach(p => {
          console.log(`- ${p.fullLegalName} (ID: ${p.id}, NPI: ${p.npi})`);
        });
      } else {
        // Create test physician if none exist
        const testPhysician = await storage.createPhysician({
          fullLegalName: "Dr. Jane Test Smith",
          npi: "9876543210",
          emailAddress: "jane.test@testclinic.com",
          phoneNumbers: ["555-111-2222", "555-333-4444"],
          mailingAddress: "456 Test Medical Dr, Suite 200, Testtown, ST 54321",
          dateOfBirth: "1975-08-20",
          gender: "female",
          practiceName: "Test Family Medical",
          officePhone: "555-555-1111",
          primaryPracticeAddress: "789 Healthcare Blvd, Testtown, ST 54321",
          groupNpi: "1111111111",
          status: "active",
          providerRole: "physician"
        });

        console.log('✅ Test physician created successfully');
        console.log('Physician ID:', testPhysician.id);
        console.log('Name:', testPhysician.fullLegalName);
      }
    } catch (error) {
      console.error('Error with physician setup:', error);
    }

    console.log('\n🎯 Ready for testing! Use these credentials:');
    console.log('Email: admin@physiciancrm.com');
    console.log('Password: Admin123!@#');
    
  } catch (error) {
    console.error('Error setting up test data:', error);
  }
}

setupTestData().then(() => {
  console.log('\nTest setup complete');
  process.exit(0);
}).catch(error => {
  console.error('Failed to setup test data:', error);
  process.exit(1);
});