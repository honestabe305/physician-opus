import { NotificationService } from './notification-service';
import { createStorage, IStorage } from '../storage';

interface ScheduledJob {
  name: string;
  interval: number; // in milliseconds
  lastRun?: Date;
  isRunning: boolean;
  handler: () => Promise<void>;
}

export class NotificationScheduler {
  private notificationService: NotificationService;
  private storage: IStorage;
  private jobs: Map<string, ScheduledJob>;
  private intervals: Map<string, NodeJS.Timeout>;
  private isStarted: boolean = false;

  constructor(storage?: IStorage) {
    this.storage = storage || createStorage();
    this.notificationService = new NotificationService(this.storage);
    this.jobs = new Map();
    this.intervals = new Map();
    
    this.initializeJobs();
  }

  private initializeJobs(): void {
    // Daily job to check for upcoming expirations (runs every 24 hours)
    this.registerJob({
      name: 'checkExpirations',
      interval: 24 * 60 * 60 * 1000, // 24 hours
      isRunning: false,
      handler: async () => {
        console.log('📋 Running daily expiration check...');
        await this.notificationService.checkUpcomingExpirations();
        console.log('✅ Daily expiration check completed');
      }
    });

    // Process notification queue (runs every hour)
    this.registerJob({
      name: 'processQueue',
      interval: 60 * 60 * 1000, // 1 hour
      isRunning: false,
      handler: async () => {
        console.log('📬 Processing notification queue...');
        await this.notificationService.processNotificationQueue();
        console.log('✅ Notification queue processed');
      }
    });

    // Retry failed notifications (runs every 4 hours)
    this.registerJob({
      name: 'retryFailed',
      interval: 4 * 60 * 60 * 1000, // 4 hours
      isRunning: false,
      handler: async () => {
        console.log('🔄 Retrying failed notifications...');
        await this.notificationService.retryFailedNotifications();
        console.log('✅ Failed notifications retry completed');
      }
    });

    // Cleanup old notifications (runs weekly)
    this.registerJob({
      name: 'cleanupOld',
      interval: 7 * 24 * 60 * 60 * 1000, // 7 days
      isRunning: false,
      handler: async () => {
        console.log('🧹 Cleaning up old notifications...');
        await this.notificationService.cleanupOldNotifications(180); // Clean up notifications older than 180 days
        console.log('✅ Old notifications cleanup completed');
      }
    });

    // Auto-create renewal workflows for expiring licenses (runs every 6 hours)
    this.registerJob({
      name: 'autoCreateRenewalWorkflows',
      interval: 6 * 60 * 60 * 1000, // 6 hours
      isRunning: false,
      handler: async () => {
        console.log('🔄 Creating automatic renewal workflows for expiring licenses...');
        try {
          const { renewalService } = await import('./renewal-service');
          const results = await renewalService.createAutomaticRenewalWorkflows(90);
          console.log(`✅ Automatic renewal workflow creation completed: ${results.created} created, ${results.skipped} skipped, ${results.errors.length} errors`);
          
          if (results.errors.length > 0) {
            console.warn('⚠️ Errors during automatic workflow creation:', results.errors);
          }
        } catch (error) {
          console.error('❌ Failed to run automatic renewal workflow creation:', error);
        }
      }
    });
  }

  private registerJob(job: ScheduledJob): void {
    this.jobs.set(job.name, job);
    console.log(`📝 Registered job: ${job.name} (interval: ${this.formatInterval(job.interval)})`);
  }

  private formatInterval(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      console.warn('⚠️ Scheduler is already running');
      return;
    }

    console.log('🚀 Starting notification scheduler...');
    
    for (const [name, job] of this.jobs.entries()) {
      // Run job immediately on start
      await this.runJob(name);
      
      // Set up interval for future runs
      const interval = setInterval(async () => {
        await this.runJob(name);
      }, job.interval);
      
      this.intervals.set(name, interval);
    }
    
    this.isStarted = true;
    console.log('✅ Notification scheduler started successfully');
    this.logSchedule();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isStarted) {
      console.warn('⚠️ Scheduler is not running');
      return;
    }

    console.log('🛑 Stopping notification scheduler...');
    
    for (const [name, interval] of this.intervals.entries()) {
      clearInterval(interval);
      console.log(`  ⏹ Stopped job: ${name}`);
    }
    
    this.intervals.clear();
    this.isStarted = false;
    console.log('✅ Notification scheduler stopped');
  }

  /**
   * Run a specific job manually
   */
  async runJob(jobName: string): Promise<void> {
    const job = this.jobs.get(jobName);
    if (!job) {
      console.error(`❌ Job not found: ${jobName}`);
      return;
    }

    if (job.isRunning) {
      console.warn(`⚠️ Job ${jobName} is already running`);
      return;
    }

    try {
      job.isRunning = true;
      const startTime = new Date();
      console.log(`▶️ Running job: ${jobName} at ${startTime.toISOString()}`);
      
      await job.handler();
      
      job.lastRun = new Date();
      const duration = Date.now() - startTime.getTime();
      console.log(`⏱ Job ${jobName} completed in ${duration}ms`);
    } catch (error) {
      console.error(`❌ Error in job ${jobName}:`, error);
      this.logError(jobName, error);
    } finally {
      job.isRunning = false;
    }
  }

  /**
   * Get the status of all scheduled jobs
   */
  getStatus(): { name: string; isRunning: boolean; lastRun?: Date; nextRun: Date }[] {
    const status: { name: string; isRunning: boolean; lastRun?: Date; nextRun: Date }[] = [];
    const now = Date.now();
    
    for (const [name, job] of this.jobs.entries()) {
      const lastRunTime = job.lastRun ? job.lastRun.getTime() : now;
      const nextRun = new Date(lastRunTime + job.interval);
      
      status.push({
        name,
        isRunning: job.isRunning,
        lastRun: job.lastRun,
        nextRun
      });
    }
    
    return status;
  }

  /**
   * Log the current schedule
   */
  private logSchedule(): void {
    console.log('\n📅 Notification Schedule:');
    console.log('━'.repeat(60));
    
    const status = this.getStatus();
    for (const job of status) {
      console.log(`  📌 ${job.name}`);
      console.log(`     Last run: ${job.lastRun ? job.lastRun.toLocaleString() : 'Never'}`);
      console.log(`     Next run: ${job.nextRun.toLocaleString()}`);
      console.log(`     Status: ${job.isRunning ? '🔄 Running' : '✅ Idle'}`);
    }
    
    console.log('━'.repeat(60) + '\n');
  }

  /**
   * Log error for monitoring
   */
  private logError(jobName: string, error: any): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      job: jobName,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
    
    // In production, this would be sent to a monitoring service
    console.error('📊 Error Log:', JSON.stringify(errorLog, null, 2));
  }

  /**
   * Run expiration check immediately (for testing)
   */
  async runExpirationCheckNow(): Promise<void> {
    console.log('🔍 Running immediate expiration check...');
    await this.notificationService.checkUpcomingExpirations();
    console.log('✅ Immediate expiration check completed');
  }

  /**
   * Process notification queue immediately (for testing)
   */
  async processQueueNow(): Promise<void> {
    console.log('📬 Processing notification queue immediately...');
    await this.notificationService.processNotificationQueue();
    console.log('✅ Immediate queue processing completed');
  }

  /**
   * Test notification for a specific physician
   */
  async testPhysicianNotification(physicianId: string): Promise<void> {
    console.log(`🧪 Testing notification for physician: ${physicianId}`);
    
    try {
      // Get physician details
      const physician = await this.storage.getPhysician(physicianId);
      if (!physician) {
        throw new Error('Physician not found');
      }
      
      // Create a test notification
      const testNotification = await this.storage.createNotification({
        physicianId,
        type: 'license',
        entityId: 'test-entity-id',
        notificationDate: new Date().toISOString().split('T')[0],
        daysBeforeExpiry: 30,
        severity: 'warning',
        sentStatus: 'pending',
        providerName: physician.fullLegalName,
        licenseType: 'Test License',
        state: 'Test State',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      // Send the test notification
      await this.notificationService.sendExpirationNotification(testNotification);
      
      console.log('✅ Test notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      throw error;
    }
  }
}

// Export singleton instance for use in the application
let schedulerInstance: NotificationScheduler | null = null;

export function getScheduler(storage?: IStorage): NotificationScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new NotificationScheduler(storage);
  }
  return schedulerInstance;
}

export function startScheduler(storage?: IStorage): Promise<void> {
  const scheduler = getScheduler(storage);
  return scheduler.start();
}

export function stopScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
  }
}