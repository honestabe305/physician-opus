import { createStorage } from '../storage';
import type { 
  SelectRenewalWorkflow, 
  InsertRenewalWorkflow,
  SelectPhysicianLicense,
  SelectDeaRegistration,
  SelectCsrLicense
} from '../../shared/schema';

interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  required: boolean;
  dueDate?: string;
}

interface RenewalChecklist {
  items: ChecklistItem[];
  totalItems: number;
  completedItems: number;
  progressPercentage: number;
}

interface RenewalTimeline {
  status: string;
  date: Date | null;
  description: string;
  completed: boolean;
}

export class RenewalService {
  private storage = createStorage();

  /**
   * Initiate renewal process for a license/DEA/CSR
   */
  async initiateRenewal(
    physicianId: string, 
    entityType: 'license' | 'dea' | 'csr', 
    entityId: string,
    userId?: string
  ): Promise<SelectRenewalWorkflow> {
    // Check if renewal already exists for this entity
    const existingWorkflows = await this.storage.getRenewalWorkflowsByEntity(entityType, entityId);
    
    // Filter out completed or rejected workflows
    const activeWorkflow = existingWorkflows.find(w => 
      !['approved', 'rejected', 'expired'].includes(w.renewalStatus)
    );
    
    if (activeWorkflow) {
      throw new Error(`Active renewal workflow already exists for this ${entityType}`);
    }

    // Get entity details to determine renewal timeline
    let expirationDate: Date | null = null;
    let entityDetails: string = '';
    
    if (entityType === 'license') {
      const license = await this.storage.getPhysicianLicense(entityId);
      if (license) {
        expirationDate = license.expirationDate ? new Date(license.expirationDate) : null;
        entityDetails = `${license.state} Medical License`;
      }
    } else if (entityType === 'dea') {
      const dea = await this.storage.getDeaRegistration(entityId);
      if (dea) {
        expirationDate = dea.expireDate ? new Date(dea.expireDate) : null;
        entityDetails = `DEA Registration - ${dea.state}`;
      }
    } else if (entityType === 'csr') {
      const csr = await this.storage.getCsrLicense(entityId);
      if (csr) {
        expirationDate = csr.expireDate ? new Date(csr.expireDate) : null;
        entityDetails = `CSR License - ${csr.state}`;
      }
    }

    // Calculate next action due date (90 days before expiration or 30 days from now)
    const nextActionDueDate = expirationDate 
      ? new Date(expirationDate.getTime() - 90 * 24 * 60 * 60 * 1000) 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // Generate initial checklist
    const checklist = await this.generateRenewalChecklist(entityType, '', physicianId);
    
    // Create renewal workflow
    const workflow = await this.storage.createRenewalWorkflow({
      physicianId,
      entityType,
      entityId,
      renewalStatus: 'not_started',
      nextActionRequired: 'Begin renewal application',
      nextActionDueDate: nextActionDueDate.toISOString().split('T')[0],
      progressPercentage: 0,
      checklist: checklist,
      notes: `Renewal initiated for ${entityDetails}`,
      createdBy: userId || null,
      updatedBy: userId || null
    });

    return workflow;
  }

  /**
   * Update renewal workflow status
   */
  async updateRenewalStatus(
    workflowId: string, 
    status: 'not_started' | 'in_progress' | 'filed' | 'under_review' | 'approved' | 'rejected' | 'expired',
    rejectionReason?: string,
    userId?: string
  ): Promise<SelectRenewalWorkflow> {
    const workflow = await this.storage.getRenewalWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Renewal workflow not found');
    }

    // Update status with appropriate metadata
    const updates: Partial<InsertRenewalWorkflow> = {
      renewalStatus: status,
      updatedBy: userId || null
    };

    // Add status-specific updates
    switch (status) {
      case 'in_progress':
        updates.applicationDate = new Date();
        updates.nextActionRequired = 'Complete renewal application';
        break;
      case 'filed':
        updates.filedDate = new Date();
        updates.nextActionRequired = 'Await state board review';
        break;
      case 'under_review':
        updates.nextActionRequired = 'Respond to any board inquiries';
        break;
      case 'approved':
        updates.approvalDate = new Date();
        updates.nextActionRequired = null;
        updates.progressPercentage = 100;
        break;
      case 'rejected':
        updates.rejectionDate = new Date();
        updates.rejectionReason = rejectionReason || 'No reason provided';
        updates.nextActionRequired = 'Review rejection and resubmit';
        break;
      case 'expired':
        updates.nextActionRequired = 'License has expired - immediate action required';
        break;
    }

    return await this.storage.updateRenewalWorkflow(workflowId, updates);
  }

  /**
   * Get upcoming renewals needing attention
   */
  async getUpcomingRenewals(days: number = 90): Promise<SelectRenewalWorkflow[]> {
    return await this.storage.getUpcomingRenewals(days);
  }

  /**
   * Get renewal timeline for an entity
   */
  async getRenewalTimeline(workflowId: string): Promise<RenewalTimeline[]> {
    const workflow = await this.storage.getRenewalWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Renewal workflow not found');
    }

    const timeline: RenewalTimeline[] = [
      {
        status: 'not_started',
        date: workflow.createdAt,
        description: 'Renewal workflow initiated',
        completed: true
      },
      {
        status: 'in_progress',
        date: workflow.applicationDate,
        description: 'Application started',
        completed: workflow.applicationDate !== null
      },
      {
        status: 'filed',
        date: workflow.filedDate,
        description: 'Application submitted to state board',
        completed: workflow.filedDate !== null
      },
      {
        status: 'under_review',
        date: workflow.filedDate ? new Date(workflow.filedDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
        description: 'Under state board review',
        completed: ['under_review', 'approved', 'rejected'].includes(workflow.renewalStatus)
      },
      {
        status: workflow.renewalStatus === 'approved' ? 'approved' : 'pending',
        date: workflow.approvalDate || workflow.rejectionDate,
        description: workflow.renewalStatus === 'approved' 
          ? 'Renewal approved' 
          : workflow.renewalStatus === 'rejected'
          ? `Renewal rejected: ${workflow.rejectionReason}`
          : 'Awaiting decision',
        completed: workflow.approvalDate !== null || workflow.rejectionDate !== null
      }
    ];

    return timeline;
  }

  /**
   * Calculate next required actions
   */
  async calculateNextActions(workflowId: string): Promise<string[]> {
    const workflow = await this.storage.getRenewalWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Renewal workflow not found');
    }

    const actions: string[] = [];

    switch (workflow.renewalStatus) {
      case 'not_started':
        actions.push('Begin renewal application');
        actions.push('Gather required documents');
        actions.push('Review state-specific requirements');
        break;
      case 'in_progress':
        actions.push('Complete all application sections');
        actions.push('Upload required documents');
        actions.push('Pay renewal fees');
        actions.push('Submit application');
        break;
      case 'filed':
        actions.push('Monitor application status');
        actions.push('Prepare for potential board inquiries');
        actions.push('Keep documents ready for verification');
        break;
      case 'under_review':
        actions.push('Respond promptly to board requests');
        actions.push('Provide additional documentation if requested');
        actions.push('Monitor review progress');
        break;
      case 'rejected':
        actions.push('Review rejection reasons');
        actions.push('Address deficiencies');
        actions.push('Prepare resubmission');
        actions.push('Consider legal consultation if needed');
        break;
      case 'approved':
        actions.push('Download new license/certificate');
        actions.push('Update records');
        actions.push('Set reminder for next renewal');
        break;
      case 'expired':
        actions.push('URGENT: Contact state board immediately');
        actions.push('Cease practice if required by state');
        actions.push('Apply for reinstatement');
        actions.push('Document lapse for compliance records');
        break;
    }

    return actions;
  }

  /**
   * Generate renewal checklist based on entity type and state
   */
  async generateRenewalChecklist(
    entityType: 'license' | 'dea' | 'csr', 
    state: string,
    physicianId: string
  ): Promise<RenewalChecklist> {
    const items: ChecklistItem[] = [];
    
    // Common items for all renewal types
    items.push(
      {
        id: 'review-expiration',
        task: 'Review expiration date and renewal requirements',
        completed: false,
        required: true
      },
      {
        id: 'gather-documents',
        task: 'Gather all required documents',
        completed: false,
        required: true
      }
    );

    // Entity-specific checklist items
    if (entityType === 'license') {
      items.push(
        {
          id: 'cme-requirements',
          task: 'Complete CME requirements',
          completed: false,
          required: true,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          id: 'license-application',
          task: 'Complete license renewal application',
          completed: false,
          required: true
        },
        {
          id: 'background-check',
          task: 'Submit to background check if required',
          completed: false,
          required: state === 'CA' || state === 'NY' // Example state-specific requirement
        },
        {
          id: 'malpractice-insurance',
          task: 'Provide proof of malpractice insurance',
          completed: false,
          required: true
        },
        {
          id: 'renewal-fee',
          task: 'Pay license renewal fee',
          completed: false,
          required: true
        }
      );
    } else if (entityType === 'dea') {
      items.push(
        {
          id: 'dea-form',
          task: 'Complete DEA Form 224a',
          completed: false,
          required: true
        },
        {
          id: 'state-license-valid',
          task: 'Ensure state medical license is active',
          completed: false,
          required: true
        },
        {
          id: 'csr-valid',
          task: 'Verify state CSR is current (if applicable)',
          completed: false,
          required: state !== 'AK' && state !== 'MT' // States without CSR requirement
        },
        {
          id: 'dea-fee',
          task: 'Pay DEA renewal fee ($888)',
          completed: false,
          required: true
        },
        {
          id: 'dea-submit',
          task: 'Submit renewal online via DEA website',
          completed: false,
          required: true
        }
      );
    } else if (entityType === 'csr') {
      items.push(
        {
          id: 'csr-application',
          task: 'Complete state CSR renewal application',
          completed: false,
          required: true
        },
        {
          id: 'mate-training',
          task: 'Complete MATE Act training (if required)',
          completed: false,
          required: true,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          id: 'prescribing-course',
          task: 'Complete controlled substance prescribing course',
          completed: false,
          required: state === 'CA' || state === 'FL' // Example state-specific
        },
        {
          id: 'csr-fee',
          task: 'Pay CSR renewal fee',
          completed: false,
          required: true
        },
        {
          id: 'csr-attestation',
          task: 'Sign renewal attestation',
          completed: false,
          required: true
        }
      );
    }

    // Add final submission step
    items.push({
      id: 'submit-renewal',
      task: 'Submit renewal application',
      completed: false,
      required: true
    });

    const totalItems = items.length;
    const completedItems = items.filter(item => item.completed).length;
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      items,
      totalItems,
      completedItems,
      progressPercentage
    };
  }

  /**
   * Track renewal progress
   */
  async trackRenewalProgress(
    workflowId: string, 
    checklistItemId: string, 
    completed: boolean
  ): Promise<SelectRenewalWorkflow> {
    const workflow = await this.storage.getRenewalWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Renewal workflow not found');
    }

    // Parse existing checklist
    let checklist: RenewalChecklist = workflow.checklist as RenewalChecklist || 
      await this.generateRenewalChecklist(workflow.entityType as any, '', workflow.physicianId);
    
    // Update checklist item
    const item = checklist.items.find(i => i.id === checklistItemId);
    if (item) {
      item.completed = completed;
      
      // Recalculate progress
      checklist.completedItems = checklist.items.filter(i => i.completed).length;
      checklist.progressPercentage = checklist.totalItems > 0 
        ? Math.round((checklist.completedItems / checklist.totalItems) * 100) 
        : 0;
    }

    // Update workflow with new progress
    return await this.storage.updateRenewalProgress(
      workflowId, 
      checklist.progressPercentage, 
      checklist
    );
  }

  /**
   * Auto-expire workflows past due date
   */
  async checkAndExpireWorkflows(): Promise<void> {
    const activeWorkflows = await this.storage.getActiveRenewalWorkflows();
    const today = new Date();
    
    for (const workflow of activeWorkflows) {
      // Get entity expiration date
      let expirationDate: Date | null = null;
      
      if (workflow.entityType === 'license') {
        const license = await this.storage.getPhysicianLicense(workflow.entityId);
        expirationDate = license?.expirationDate ? new Date(license.expirationDate) : null;
      } else if (workflow.entityType === 'dea') {
        const dea = await this.storage.getDeaRegistration(workflow.entityId);
        expirationDate = dea?.expireDate ? new Date(dea.expireDate) : null;
      } else if (workflow.entityType === 'csr') {
        const csr = await this.storage.getCsrLicense(workflow.entityId);
        expirationDate = csr?.expireDate ? new Date(csr.expireDate) : null;
      }
      
      // If expired and workflow not completed, mark as expired
      if (expirationDate && expirationDate < today && 
          !['approved', 'rejected', 'expired'].includes(workflow.renewalStatus)) {
        await this.updateRenewalStatus(workflow.id, 'expired');
      }
    }
  }

  /**
   * Get all renewal workflows for a physician
   */
  async getPhysicianRenewals(physicianId: string): Promise<SelectRenewalWorkflow[]> {
    return await this.storage.getRenewalWorkflowsByPhysician(physicianId);
  }

  /**
   * Get renewal statistics for dashboard
   */
  async getRenewalStatistics(): Promise<{
    total: number;
    inProgress: number;
    pending: number;
    completed: number;
    expired: number;
    upcomingIn30Days: number;
    upcomingIn60Days: number;
    upcomingIn90Days: number;
  }> {
    const allWorkflows = await this.storage.getActiveRenewalWorkflows();
    const upcoming30 = await this.storage.getUpcomingRenewals(30);
    const upcoming60 = await this.storage.getUpcomingRenewals(60);
    const upcoming90 = await this.storage.getUpcomingRenewals(90);
    
    const stats = {
      total: allWorkflows.length,
      inProgress: allWorkflows.filter(w => w.renewalStatus === 'in_progress').length,
      pending: allWorkflows.filter(w => ['filed', 'under_review'].includes(w.renewalStatus)).length,
      completed: allWorkflows.filter(w => w.renewalStatus === 'approved').length,
      expired: allWorkflows.filter(w => w.renewalStatus === 'expired').length,
      upcomingIn30Days: upcoming30.length,
      upcomingIn60Days: upcoming60.length,
      upcomingIn90Days: upcoming90.length
    };
    
    return stats;
  }
}

// Export singleton instance
export const renewalService = new RenewalService();