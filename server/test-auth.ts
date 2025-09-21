import { createStorage } from './storage';
import { hashPassword } from './auth';

// Create initial admin user for testing
async function createInitialAdmin() {
  const storage = createStorage();
  
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByEmail('admin@physiciancrm.com');
    if (existingAdmin) {
      console.log('Admin user already exists');
      return existingAdmin;
    }
    
    // Create admin user
    const passwordHash = await hashPassword('Admin123!@#');
    const adminUser = await storage.createUser({
      email: 'admin@physiciancrm.com',
      username: 'admin',
      passwordHash,
      role: 'admin',
      isActive: true,
      failedLoginAttempts: 0,
      twoFactorEnabled: false
    });
    
    // Create admin profile
    await storage.createProfile({
      userId: adminUser.id,
      email: adminUser.email,
      fullName: 'System Administrator',
      role: adminUser.role
    });
    
    console.log('✅ Admin user created successfully');
    console.log('Email: admin@physiciancrm.com');
    console.log('Password: Admin123!@#');
    
    return adminUser;
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createInitialAdmin().then(() => {
  console.log('Initial setup complete');
  process.exit(0);
}).catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});