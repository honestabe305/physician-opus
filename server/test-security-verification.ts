/**
 * Critical Security Verification Tests
 * 
 * These tests verify that all critical security requirements for banking data
 * encryption and access control have been properly implemented.
 */

import { storage } from './storage';
import { encrypt, decrypt, redactBankingData, validatePrivilegedAccess } from './utils/encryption';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

// Mock banking data for testing
const testBankingData = {
  id: 'test-banking-001',
  physicianId: 'test-physician-001',
  bankName: 'Test Bank',
  routingNumber: '123456789',
  accountNumber: '987654321',
  accountType: 'checking' as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

const privilegedUser = {
  userId: 'admin-001',
  role: 'admin'
};

const unprivilegedUser = {
  userId: 'user-001', 
  role: 'viewer'
};

async function runSecurityVerificationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  console.log('🔐 Starting Critical Security Verification Tests...\n');

  // Test 1: Verify banking data access is redacted by default
  try {
    console.log('Test 1: Verifying default redacted access...');
    
    // Create test banking data
    const created = await storage.createProviderBanking(testBankingData);
    
    // Get data using default method - should be redacted
    const defaultData = await storage.getProviderBanking(created.id);
    
    const isRedacted = defaultData?.routingNumber?.startsWith('****') && 
                      defaultData?.accountNumber?.startsWith('****');
    
    results.push({
      name: 'Default Access Returns Redacted Data',
      passed: isRedacted,
      details: isRedacted ? 'PASS: Default methods return redacted banking data' : 
               `FAIL: Expected redacted data but got: routing=${defaultData?.routingNumber}, account=${defaultData?.accountNumber}`
    });
    
  } catch (error) {
    results.push({
      name: 'Default Access Returns Redacted Data',
      passed: false,
      details: `FAIL: Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Test 2: Verify privileged access requires role validation
  try {
    console.log('Test 2: Verifying privileged access control...');
    
    // Test with privileged user
    const privilegedData = await storage.getProviderBankingDecrypted(
      testBankingData.id, 
      privilegedUser.userId, 
      privilegedUser.role
    );
    
    const privilegedAccessWorks = privilegedData?.routingNumber === testBankingData.routingNumber;
    
    // Test with unprivileged user - should throw error
    let unprivilegedAccessBlocked = false;
    try {
      await storage.getProviderBankingDecrypted(
        testBankingData.id,
        unprivilegedUser.userId,
        unprivilegedUser.role
      );
    } catch (error) {
      unprivilegedAccessBlocked = true;
    }
    
    const passed = privilegedAccessWorks && unprivilegedAccessBlocked;
    
    results.push({
      name: 'Privileged Access Role Validation',
      passed,
      details: passed ? 'PASS: Role validation correctly controls privileged access' : 
               `FAIL: Privileged access=${privilegedAccessWorks}, Blocked unprivileged=${unprivilegedAccessBlocked}`
    });
    
  } catch (error) {
    results.push({
      name: 'Privileged Access Role Validation',
      passed: false,
      details: `FAIL: Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Test 3: Verify key versioning works
  try {
    console.log('Test 3: Verifying key versioning...');
    
    // Test encryption produces versioned format
    const encrypted = encrypt('test-data', { dataType: 'banking' });
    const hasVersionPrefix = encrypted.startsWith('enc:v1:');
    
    // Test decryption works with versioned data
    const decrypted = decrypt(encrypted);
    const decryptionWorks = decrypted === 'test-data';
    
    const passed = hasVersionPrefix && decryptionWorks;
    
    results.push({
      name: 'Key Versioning Implementation',
      passed,
      details: passed ? 'PASS: Encryption uses version prefixes and decryption works' : 
               `FAIL: Version prefix=${hasVersionPrefix}, Decryption works=${decryptionWorks}`
    });
    
  } catch (error) {
    results.push({
      name: 'Key Versioning Implementation',
      passed: false,
      details: `FAIL: Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Test 4: Verify backward compatibility with legacy data
  try {
    console.log('Test 4: Verifying backward compatibility...');
    
    // Test with legacy plaintext data (no encryption prefix)
    const legacyData = {
      ...testBankingData,
      id: 'legacy-banking-001',
      routingNumber: 'plaintext-routing',
      accountNumber: 'plaintext-account'
    };
    
    // Simulate legacy data in storage (without encryption)
    const db = await storage.getDb();
    const { providerBanking } = await import('../shared/schema');
    await db.insert(providerBanking).values(legacyData);
    
    // Should handle legacy data gracefully
    const legacyResult = await storage.getProviderBankingDecrypted(
      legacyData.id,
      privilegedUser.userId,
      privilegedUser.role
    );
    
    const handlesLegacy = legacyResult?.routingNumber === 'plaintext-routing';
    
    results.push({
      name: 'Backward Compatibility with Legacy Data',
      passed: handlesLegacy,
      details: handlesLegacy ? 'PASS: Legacy plaintext data handled correctly' : 
               `FAIL: Could not handle legacy data properly`
    });
    
  } catch (error) {
    results.push({
      name: 'Backward Compatibility with Legacy Data',
      passed: false,
      details: `FAIL: Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Test 5: Verify no sensitive data in error messages
  try {
    console.log('Test 5: Verifying secure error handling...');
    
    let errorContainsSensitiveData = false;
    let errorMessage = '';
    
    try {
      // Force an error condition
      await storage.getProviderBankingDecrypted('nonexistent-id', 'bad-user', 'bad-role');
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Check if error message contains sensitive data
      errorContainsSensitiveData = errorMessage.includes(testBankingData.routingNumber) ||
                                   errorMessage.includes(testBankingData.accountNumber) ||
                                   errorMessage.includes('encryption') ||
                                   errorMessage.includes('decrypt');
    }
    
    const secureErrors = !errorContainsSensitiveData;
    
    results.push({
      name: 'Secure Error Handling',
      passed: secureErrors,
      details: secureErrors ? 'PASS: Error messages do not expose sensitive data' : 
               `FAIL: Error message may contain sensitive data: ${errorMessage}`
    });
    
  } catch (error) {
    results.push({
      name: 'Secure Error Handling',
      passed: false,
      details: `FAIL: Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  return results;
}

// Export for use in other test files
export { runSecurityVerificationTests };

// Run tests automatically when file is imported
runSecurityVerificationTests().then(results => {
  console.log('\n🔐 Security Verification Test Results:');
  console.log('=====================================\n');
  
  let allPassed = true;
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
    console.log(`   ${result.details}\n`);
    if (!result.passed) allPassed = false;
  });
  
  if (allPassed) {
    console.log('🎉 ALL SECURITY REQUIREMENTS VERIFIED!');
    console.log('✅ System is ready for production deployment.');
  } else {
    console.log('🚨 SECURITY VIOLATIONS DETECTED!');
    console.log('❌ System is NOT ready for production deployment.');
  }
  
  process.exit(allPassed ? 0 : 1);
}).catch(error => {
  console.error('🚨 Critical error running security tests:', error);
  process.exit(1);
});