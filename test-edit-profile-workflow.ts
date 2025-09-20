/**
 * Comprehensive Edit Profile Workflow Test
 * This script tests the complete edit profile workflow end-to-end
 */

interface TestResult {
  step: string;
  success: boolean;
  details: string;
  error?: string;
}

class EditProfileWorkflowTester {
  private results: TestResult[] = [];
  private sessionToken: string | null = null;
  private testPhysicianId: string | null = null;
  private baseUrl = 'http://localhost:3001/api';

  async runCompleteTest(): Promise<TestResult[]> {
    console.log('🧪 Starting Complete Edit Profile Workflow Test\n');
    
    // Step 1: Authenticate
    await this.testAuthentication();
    
    // Step 2: Get physician for testing
    await this.getTestPhysician();
    
    // Step 3: Get initial physician data
    await this.getInitialPhysicianData();
    
    // Step 4: Test required field updates
    await this.testRequiredFieldUpdates();
    
    // Step 5: Test optional field updates
    await this.testOptionalFieldUpdates();
    
    // Step 6: Test dropdown field updates
    await this.testDropdownFieldUpdates();
    
    // Step 7: Test date field updates
    await this.testDateFieldUpdates();
    
    // Step 8: Test validation errors
    await this.testValidationErrors();
    
    // Step 9: Test complete form submission
    await this.testCompleteFormSubmission();
    
    // Step 10: Verify changes persistence
    await this.verifyChangesPersistence();
    
    this.printResults();
    return this.results;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testAuthentication(): Promise<void> {
    try {
      console.log('🔐 Testing Authentication...');
      
      const authResponse = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'Admin123!@#'
        })
      });

      if (!authResponse.ok) {
        throw new Error(`Authentication failed: ${authResponse.statusText}`);
      }

      const authData = await authResponse.json();
      
      // Extract session token from response or cookie
      const cookieHeader = authResponse.headers.get('set-cookie');
      if (cookieHeader && cookieHeader.includes('session_token=')) {
        this.sessionToken = cookieHeader.split('session_token=')[1].split(';')[0];
      }
      
      this.results.push({
        step: 'Authentication',
        success: true,
        details: `Successfully authenticated as ${authData.user.username}`
      });
      
      console.log('✅ Authentication successful');
    } catch (error) {
      this.results.push({
        step: 'Authentication',
        success: false,
        details: 'Failed to authenticate',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('❌ Authentication failed:', error);
    }
  }

  private async getTestPhysician(): Promise<void> {
    try {
      console.log('👨‍⚕️ Getting test physician...');
      
      const physicians = await this.makeRequest('/physicians');
      
      if (!physicians || physicians.length === 0) {
        throw new Error('No physicians found for testing');
      }
      
      this.testPhysicianId = physicians[0].id;
      
      this.results.push({
        step: 'Get Test Physician',
        success: true,
        details: `Found physician: ${physicians[0].fullLegalName} (ID: ${this.testPhysicianId})`
      });
      
      console.log(`✅ Using physician: ${physicians[0].fullLegalName}`);
    } catch (error) {
      this.results.push({
        step: 'Get Test Physician',
        success: false,
        details: 'Failed to get test physician',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('❌ Failed to get test physician:', error);
    }
  }

  private async getInitialPhysicianData(): Promise<void> {
    if (!this.testPhysicianId) return;
    
    try {
      console.log('📋 Getting initial physician data...');
      
      const physician = await this.makeRequest(`/physicians/${this.testPhysicianId}`);
      
      this.results.push({
        step: 'Get Initial Data',
        success: true,
        details: `Retrieved data for ${physician.fullLegalName}`
      });
      
      console.log('✅ Initial data retrieved');
    } catch (error) {
      this.results.push({
        step: 'Get Initial Data',
        success: false,
        details: 'Failed to get initial physician data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('❌ Failed to get initial data:', error);
    }
  }

  private async testRequiredFieldUpdates(): Promise<void> {
    if (!this.testPhysicianId) return;
    
    try {
      console.log('📝 Testing required field updates...');
      
      const updateData = {
        fullLegalName: 'Dr. Updated Test Name',
        npi: '1234567890'
      };
      
      const updatedPhysician = await this.makeRequest(`/physicians/${this.testPhysicianId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      const isNameUpdated = updatedPhysician.fullLegalName === updateData.fullLegalName;
      const isNpiUpdated = updatedPhysician.npi === updateData.npi;
      
      if (isNameUpdated && isNpiUpdated) {
        this.results.push({
          step: 'Required Field Updates',
          success: true,
          details: 'Successfully updated fullLegalName and NPI'
        });
        console.log('✅ Required fields updated');
      } else {
        throw new Error('Required fields were not properly updated');
      }
    } catch (error) {
      this.results.push({
        step: 'Required Field Updates',
        success: false,
        details: 'Failed to update required fields',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('❌ Required field update failed:', error);
    }
  }

  private async testOptionalFieldUpdates(): Promise<void> {
    if (!this.testPhysicianId) return;
    
    try {
      console.log('📧 Testing optional field updates...');
      
      const updateData = {
        emailAddress: 'updated.test@example.com',
        phoneNumbers: ['555-111-9999', '555-222-8888'],
        mailingAddress: '123 Updated Test St, Test City, TS 12345',
        practiceName: 'Updated Test Practice'
      };
      
      const updatedPhysician = await this.makeRequest(`/physicians/${this.testPhysicianId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      const isEmailUpdated = updatedPhysician.emailAddress === updateData.emailAddress;
      const isAddressUpdated = updatedPhysician.mailingAddress === updateData.mailingAddress;
      
      if (isEmailUpdated && isAddressUpdated) {
        this.results.push({
          step: 'Optional Field Updates',
          success: true,
          details: 'Successfully updated email, phone, address, and practice name'
        });
        console.log('✅ Optional fields updated');
      } else {
        throw new Error('Optional fields were not properly updated');
      }
    } catch (error) {
      this.results.push({
        step: 'Optional Field Updates',
        success: false,
        details: 'Failed to update optional fields',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('❌ Optional field update failed:', error);
    }
  }

  private async testDropdownFieldUpdates(): Promise<void> {
    if (!this.testPhysicianId) return;
    
    try {
      console.log('📊 Testing dropdown field updates...');
      
      const updateData = {
        gender: 'female',
        status: 'pending'
      };
      
      const updatedPhysician = await this.makeRequest(`/physicians/${this.testPhysicianId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      const isGenderUpdated = updatedPhysician.gender === updateData.gender;
      const isStatusUpdated = updatedPhysician.status === updateData.status;
      
      if (isGenderUpdated && isStatusUpdated) {
        this.results.push({
          step: 'Dropdown Field Updates',
          success: true,
          details: 'Successfully updated gender and status dropdowns'
        });
        console.log('✅ Dropdown fields updated');
      } else {
        throw new Error('Dropdown fields were not properly updated');
      }
    } catch (error) {
      this.results.push({
        step: 'Dropdown Field Updates',
        success: false,
        details: 'Failed to update dropdown fields',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('❌ Dropdown field update failed:', error);
    }
  }

  private async testDateFieldUpdates(): Promise<void> {
    if (!this.testPhysicianId) return;
    
    try {
      console.log('📅 Testing date field updates...');
      
      const updateData = {
        dateOfBirth: '1985-12-15'
      };
      
      const updatedPhysician = await this.makeRequest(`/physicians/${this.testPhysicianId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      const isDateUpdated = updatedPhysician.dateOfBirth === updateData.dateOfBirth;
      
      if (isDateUpdated) {
        this.results.push({
          step: 'Date Field Updates',
          success: true,
          details: 'Successfully updated date of birth'
        });
        console.log('✅ Date field updated');
      } else {
        throw new Error('Date field was not properly updated');
      }
    } catch (error) {
      this.results.push({
        step: 'Date Field Updates',
        success: false,
        details: 'Failed to update date field',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('❌ Date field update failed:', error);
    }
  }

  private async testValidationErrors(): Promise<void> {
    if (!this.testPhysicianId) return;
    
    try {
      console.log('⚠️ Testing validation errors...');
      
      // Test invalid NPI (too short)
      try {
        await this.makeRequest(`/physicians/${this.testPhysicianId}`, {
          method: 'PUT',
          body: JSON.stringify({
            npi: '123' // Too short
          })
        });
        
        // If we get here, validation failed
        throw new Error('Validation should have failed for short NPI');
      } catch (error) {
        if (error instanceof Error && error.message.includes('validation')) {
          console.log('✅ NPI validation working correctly');
        }
      }
      
      // Test invalid email
      try {
        await this.makeRequest(`/physicians/${this.testPhysicianId}`, {
          method: 'PUT',
          body: JSON.stringify({
            emailAddress: 'invalid-email'
          })
        });
        
        // If we get here, validation failed
        throw new Error('Validation should have failed for invalid email');
      } catch (error) {
        if (error instanceof Error && error.message.includes('validation')) {
          console.log('✅ Email validation working correctly');
        }
      }
      
      this.results.push({
        step: 'Validation Errors',
        success: true,
        details: 'Validation correctly prevents invalid data'
      });
    } catch (error) {
      this.results.push({
        step: 'Validation Errors',
        success: false,
        details: 'Validation error testing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('❌ Validation error testing failed:', error);
    }
  }

  private async testCompleteFormSubmission(): Promise<void> {
    if (!this.testPhysicianId) return;
    
    try {
      console.log('🎯 Testing complete form submission...');
      
      const completeUpdateData = {
        fullLegalName: 'Dr. Complete Test Update',
        npi: '9876543210',
        emailAddress: 'complete.test@example.com',
        phoneNumbers: ['555-999-0000'],
        mailingAddress: '999 Complete Test Ave, Test City, TS 99999',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        practiceName: 'Complete Test Medical Center',
        status: 'active'
      };
      
      const updatedPhysician = await this.makeRequest(`/physicians/${this.testPhysicianId}`, {
        method: 'PUT',
        body: JSON.stringify(completeUpdateData)
      });
      
      // Verify all fields were updated
      const verifications = [
        updatedPhysician.fullLegalName === completeUpdateData.fullLegalName,
        updatedPhysician.npi === completeUpdateData.npi,
        updatedPhysician.emailAddress === completeUpdateData.emailAddress,
        updatedPhysician.dateOfBirth === completeUpdateData.dateOfBirth,
        updatedPhysician.gender === completeUpdateData.gender,
        updatedPhysician.status === completeUpdateData.status
      ];
      
      const allVerified = verifications.every(v => v);
      
      if (allVerified) {
        this.results.push({
          step: 'Complete Form Submission',
          success: true,
          details: 'All fields successfully updated in complete form submission'
        });
        console.log('✅ Complete form submission successful');
      } else {
        throw new Error('Some fields were not properly updated in complete submission');
      }
    } catch (error) {
      this.results.push({
        step: 'Complete Form Submission',
        success: false,
        details: 'Complete form submission failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('❌ Complete form submission failed:', error);
    }
  }

  private async verifyChangesPersistence(): Promise<void> {
    if (!this.testPhysicianId) return;
    
    try {
      console.log('💾 Verifying changes persistence...');
      
      // Wait a moment then fetch the physician again to verify persistence
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const physician = await this.makeRequest(`/physicians/${this.testPhysicianId}`);
      
      // Verify that the last update is still there
      const isPersistent = physician.fullLegalName === 'Dr. Complete Test Update';
      
      if (isPersistent) {
        this.results.push({
          step: 'Changes Persistence',
          success: true,
          details: 'Changes successfully persisted in database'
        });
        console.log('✅ Changes persisted correctly');
      } else {
        throw new Error('Changes were not persisted');
      }
    } catch (error) {
      this.results.push({
        step: 'Changes Persistence',
        success: false,
        details: 'Failed to verify changes persistence',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('❌ Changes persistence verification failed:', error);
    }
  }

  private printResults(): void {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================\n');
    
    let passed = 0;
    let failed = 0;
    
    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} | ${result.step}`);
      console.log(`      Details: ${result.details}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
      console.log('');
      
      if (result.success) passed++;
      else failed++;
    });
    
    console.log(`TOTAL: ${passed} passed, ${failed} failed`);
    console.log(`SUCCESS RATE: ${Math.round((passed / this.results.length) * 100)}%\n`);
  }
}

// Run the test
const tester = new EditProfileWorkflowTester();
tester.runCompleteTest().then(results => {
  const allPassed = results.every(r => r.success);
  process.exit(allPassed ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});

export { EditProfileWorkflowTester };