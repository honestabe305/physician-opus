import { createStorage, IStorage } from '../storage';
import { 
  SelectNotification,
  SelectPhysicianLicense,
  SelectDeaRegistration,
  SelectCsrLicense,
  SelectPhysician
} from '../../shared/schema';
import { addDays, differenceInDays } from 'date-fns';

// Notification intervals in days before expiration
const NOTIFICATION_INTERVALS = [90, 60, 30, 7, 1];

// Severity levels based on days until expiration
const getSeverityLevel = (daysBeforeExpiry: number): 'info' | 'warning' | 'critical' => {
  if (daysBeforeExpiry >= 60) return 'info';
  if (daysBeforeExpiry >= 7) return 'warning';
  return 'critical';
};

export class NotificationService {
  private storage: IStorage;

  constructor(storage?: IStorage) {
    this.storage = storage || createStorage();
  }

  /**
   * Check for upcoming expirations across all licenses, DEA registrations, and CSR licenses
   */
  async checkUpcomingExpirations(): Promise<void> {
    try {
      console.log('🔍 Checking for upcoming expirations...');
      
      const today = new Date();
      const maxFutureDate = addDays(today, Math.max(...NOTIFICATION_INTERVALS));
      
      // Get all physicians
      const physicians = await this.storage.getAllPhysicians();
      
      for (const physician of physicians) {
        // Check physician licenses
        await this.checkPhysicianLicenseExpirations(physician);
        
        // Check DEA registrations
        await this.checkDEAExpirations(physician);
        
        // Check CSR licenses
        await this.checkCSRExpirations(physician);
      }
      
      console.log('✅ Expiration check completed');
    } catch (error) {
      console.error('❌ Error checking upcoming expirations:', error);
      throw error;
    }
  }

  private async checkPhysicianLicenseExpirations(physician: SelectPhysician): Promise<void> {
    const licenses = await this.storage.getPhysicianLicenses(physician.id);
    const today = new Date();
    
    for (const license of licenses) {
      if (!license.expirationDate) continue;
      
      const expirationDate = new Date(license.expirationDate);
      const daysUntilExpiration = differenceInDays(expirationDate, today);
      
      // Check each notification interval
      for (const interval of NOTIFICATION_INTERVALS) {
        if (daysUntilExpiration <= interval && daysUntilExpiration >= 0) {
          await this.createNotificationIfNotExists(
            physician,
            'license',
            license.id,
            license.state,
            license.licenseType || 'Medical License',
            expirationDate,
            interval
          );
        }
      }
    }
  }

  private async checkDEAExpirations(physician: SelectPhysician): Promise<void> {
    const deaRegistrations = await this.storage.getDeaRegistrationsByPhysician(physician.id);
    const today = new Date();
    
    for (const dea of deaRegistrations) {
      if (!dea.expireDate) continue;
      
      const expirationDate = new Date(dea.expireDate);
      const daysUntilExpiration = differenceInDays(expirationDate, today);
      
      // Check each notification interval
      for (const interval of NOTIFICATION_INTERVALS) {
        if (daysUntilExpiration <= interval && daysUntilExpiration >= 0) {
          await this.createNotificationIfNotExists(
            physician,
            'dea',
            dea.id,
            dea.state,
            'DEA Registration',
            expirationDate,
            interval
          );
        }
      }
    }
  }

  private async checkCSRExpirations(physician: SelectPhysician): Promise<void> {
    const csrLicenses = await this.storage.getCsrLicensesByPhysician(physician.id);
    const today = new Date();
    
    for (const csr of csrLicenses) {
      if (!csr.expireDate) continue;
      
      const expirationDate = new Date(csr.expireDate);
      const daysUntilExpiration = differenceInDays(expirationDate, today);
      
      // Check each notification interval
      for (const interval of NOTIFICATION_INTERVALS) {
        if (daysUntilExpiration <= interval && daysUntilExpiration >= 0) {
          await this.createNotificationIfNotExists(
            physician,
            'csr',
            csr.id,
            csr.state,
            'CSR License',
            expirationDate,
            interval
          );
        }
      }
    }
  }

  private async createNotificationIfNotExists(
    physician: SelectPhysician,
    type: 'license' | 'dea' | 'csr',
    entityId: string,
    state: string,
    licenseType: string,
    expirationDate: Date,
    daysBeforeExpiry: number
  ): Promise<void> {
    // Check if notification already exists for this entity and interval
    const existingNotifications = await this.storage.getNotificationsByPhysician(physician.id);
    const exists = existingNotifications.some(n => 
      n.entityId === entityId && 
      n.type === type && 
      n.daysBeforeExpiry === daysBeforeExpiry
    );
    
    if (!exists) {
      const notificationDate = addDays(expirationDate, -daysBeforeExpiry);
      
      await this.storage.createNotification({
        physicianId: physician.id,
        type,
        entityId,
        notificationDate: notificationDate.toISOString().split('T')[0],
        daysBeforeExpiry,
        severity: getSeverityLevel(daysBeforeExpiry),
        sentStatus: 'pending',
        providerName: physician.fullLegalName,
        licenseType,
        state,
        expirationDate: expirationDate.toISOString().split('T')[0]
      });
      
      console.log(`📝 Created notification: ${physician.fullLegalName} - ${licenseType} (${state}) expires in ${daysBeforeExpiry} days`);
    }
  }

  /**
   * Creates notification schedule for all items needing alerts
   */
  async createNotificationSchedule(): Promise<void> {
    console.log('📅 Creating notification schedule...');
    await this.checkUpcomingExpirations();
    console.log('✅ Notification schedule created');
  }

  /**
   * Send an individual expiration notification (email stub for now)
   */
  async sendExpirationNotification(notification: SelectNotification): Promise<void> {
    try {
      // For now, just console.log the email
      console.log('📧 Sending email notification:');
      console.log('━'.repeat(50));
      console.log(`To: ${notification.providerName}`);
      console.log(`Subject: ${this.getEmailSubject(notification)}`);
      console.log('━'.repeat(50));
      console.log(this.getEmailBody(notification));
      console.log('━'.repeat(50));
      
      // Mark notification as sent
      await this.storage.markNotificationSent(notification.id, new Date());
      
      console.log('✅ Notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      await this.storage.markNotificationFailed(
        notification.id, 
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private getEmailSubject(notification: SelectNotification): string {
    const urgency = notification.severity === 'critical' ? '🚨 URGENT: ' : 
                    notification.severity === 'warning' ? '⚠️ ' : '';
    return `${urgency}${notification.licenseType} Expiration Reminder - ${notification.state}`;
  }

  private getEmailBody(notification: SelectNotification): string {
    const daysText = notification.daysBeforeExpiry === 1 ? 'tomorrow' : 
                     `in ${notification.daysBeforeExpiry} days`;
    
    return `
Dear ${notification.providerName},

This is a reminder that your ${notification.licenseType} in ${notification.state} will expire ${daysText} on ${notification.expirationDate}.

IMPORTANT ACTION REQUIRED:
${this.getActionItems(notification)}

Please take immediate action to ensure continuity of your practice and compliance with regulatory requirements.

If you have already renewed this credential, please log into the system to update your records.

Best regards,
Credential Management System
    `.trim();
  }

  private getActionItems(notification: SelectNotification): string {
    if (notification.type === 'license') {
      return `• Submit renewal application to the state medical board
• Ensure all CME requirements are met
• Pay renewal fees
• Update your records in our system once renewed`;
    } else if (notification.type === 'dea') {
      return `• Complete DEA renewal application online at deadiversion.usdoj.gov
• Verify MATE training compliance if required
• Submit renewal fee
• Update your DEA number in our system once renewed`;
    } else if (notification.type === 'csr') {
      return `• Submit CSR renewal application to the state controlled substance authority
• Complete any required continuing education
• Pay renewal fees
• Update your CSR information in our system once renewed`;
    }
    return '';
  }

  /**
   * Process all pending notifications in the queue
   */
  async processNotificationQueue(): Promise<void> {
    try {
      console.log('⚙️ Processing notification queue...');
      
      const pendingNotifications = await this.storage.getPendingNotifications();
      const today = new Date();
      
      for (const notification of pendingNotifications) {
        const notificationDate = new Date(notification.notificationDate);
        
        // Only send notifications that are due today or overdue
        if (notificationDate <= today) {
          await this.sendExpirationNotification(notification);
        }
      }
      
      console.log(`✅ Processed ${pendingNotifications.length} notifications`);
    } catch (error) {
      console.error('❌ Error processing notification queue:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as sent
   */
  async markNotificationSent(notificationId: string): Promise<void> {
    await this.storage.markNotificationSent(notificationId, new Date());
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(): Promise<void> {
    try {
      console.log('🔄 Retrying failed notifications...');
      
      const failedNotifications = await this.storage.getFailedNotifications();
      
      for (const notification of failedNotifications) {
        // Reset status to pending to retry
        await this.storage.updateNotification(notification.id, {
          sentStatus: 'pending',
          errorMessage: null
        });
        
        // Try sending again
        await this.sendExpirationNotification(notification);
      }
      
      console.log(`✅ Retried ${failedNotifications.length} failed notifications`);
    } catch (error) {
      console.error('❌ Error retrying failed notifications:', error);
      throw error;
    }
  }

  /**
   * Get upcoming notifications for a specific physician
   */
  async getPhysicianNotifications(physicianId: string): Promise<SelectNotification[]> {
    return await this.storage.getNotificationsByPhysician(physicianId);
  }

  /**
   * Get all upcoming notifications
   */
  async getUpcomingNotifications(days: number = 90): Promise<SelectNotification[]> {
    return await this.storage.getUpcomingNotifications(days);
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    await this.storage.markNotificationRead(notificationId);
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(daysOld: number = 180): Promise<void> {
    const cutoffDate = addDays(new Date(), -daysOld);
    await this.storage.deleteOldNotifications(cutoffDate);
    console.log(`🧹 Cleaned up notifications older than ${daysOld} days`);
  }
}