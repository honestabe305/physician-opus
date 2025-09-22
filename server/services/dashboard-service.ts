import { IStorage } from '../storage';
import { eq, sql, and, or, gte, lte, count, desc, asc } from 'drizzle-orm';
import { 
  payerEnrollments, 
  payers, 
  physicians, 
  practiceLocations,
  type SelectPayerEnrollment,
  type SelectPayer,
  type SelectPhysician,
  type SelectPracticeLocation
} from '../../shared/schema';
import { db } from '../db';

export interface EnrollmentStats {
  total: number;
  discovery: number;
  data_complete: number;
  submitted: number;
  payer_processing: number;
  approved: number;
  active: number;
  denied: number;
  stopped: number;
}

export interface PayerSummary {
  id: string;
  name: string;
  enrollmentCount: number;
  activeEnrollmentCount: number;
  linesOfBusiness: string[];
  isActive: boolean;
}

export interface RecentEnrollment extends SelectPayerEnrollment {
  physicianName: string;
  payerName: string;
  locationName: string;
}

export interface UpcomingDeadline {
  id: string;
  physicianName: string;
  payerName: string;
  locationName: string;
  enrollmentStatus: string;
  nextActionRequired: string | null;
  nextActionDueDate: Date | null;
  daysUntilDue: number | null;
}

export interface DashboardData {
  enrollmentStats: EnrollmentStats;
  recentEnrollments: RecentEnrollment[];
  upcomingDeadlines: UpcomingDeadline[];
  payerSummary: PayerSummary[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class DashboardService {
  private static cache = new Map<string, CacheEntry<any>>();
  
  /**
   * Generic cache getter with TTL support
   */
  private static getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * Generic cache setter with TTL support
   */
  private static setCached<T>(key: string, data: T, ttlMinutes: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000 // Convert minutes to milliseconds
    });
  }
  
  /**
   * Get comprehensive dashboard data with server-side aggregations and caching
   */
  static async getDashboardData(): Promise<DashboardData> {
    const cacheKey = 'dashboard-data';
    const cached = this.getCached<DashboardData>(cacheKey);
    if (cached) return cached;
    const [
      enrollmentStats,
      recentEnrollments,
      upcomingDeadlines,
      payerSummary
    ] = await Promise.all([
      this.getEnrollmentStats(),
      this.getRecentEnrollments(10),
      this.getUpcomingDeadlines(5),
      this.getPayerSummary()
    ]);

    const dashboardData = {
      enrollmentStats,
      recentEnrollments,
      upcomingDeadlines,
      payerSummary
    };
    
    // Cache dashboard data for 10 minutes
    this.setCached(cacheKey, dashboardData, 10);
    return dashboardData;
  }

  /**
   * Get enrollment statistics with server-side aggregation and caching
   */
  static async getEnrollmentStats(): Promise<EnrollmentStats> {
    const cacheKey = 'enrollment-stats';
    const cached = this.getCached<EnrollmentStats>(cacheKey);
    if (cached) return cached;
    const results = await db
      .select({
        enrollmentStatus: payerEnrollments.enrollmentStatus,
        count: count()
      })
      .from(payerEnrollments)
      .groupBy(payerEnrollments.enrollmentStatus);

    // Initialize all statuses to 0
    const stats: EnrollmentStats = {
      total: 0,
      discovery: 0,
      data_complete: 0,
      submitted: 0,
      payer_processing: 0,
      approved: 0,
      active: 0,
      denied: 0,
      stopped: 0
    };

    // Aggregate the results
    results.forEach(result => {
      const status = result.enrollmentStatus as keyof EnrollmentStats;
      if (status in stats) {
        (stats as any)[status] = result.count;
      }
      stats.total += result.count;
    });

    // Cache enrollment stats for 15 minutes
    this.setCached(cacheKey, stats, 15);
    return stats;
  }

  /**
   * Get recent enrollments with joins for related data and caching
   */
  static async getRecentEnrollments(limit: number = 10): Promise<RecentEnrollment[]> {
    const cacheKey = `recent-enrollments-${limit}`;
    const cached = this.getCached<RecentEnrollment[]>(cacheKey);
    if (cached) return cached;
    const results = await db
      .select({
        // Enrollment fields
        id: payerEnrollments.id,
        physicianId: payerEnrollments.physicianId,
        payerId: payerEnrollments.payerId,
        practiceLocationId: payerEnrollments.practiceLocationId,
        linesOfBusiness: payerEnrollments.linesOfBusiness,
        networkName: payerEnrollments.networkName,
        tinUsed: payerEnrollments.tinUsed,
        npiUsed: payerEnrollments.npiUsed,
        enrollmentStatus: payerEnrollments.enrollmentStatus,
        providerId: payerEnrollments.providerId,
        parStatus: payerEnrollments.parStatus,
        effectiveDate: payerEnrollments.effectiveDate,
        revalidationDate: payerEnrollments.revalidationDate,
        reCredentialingDate: payerEnrollments.reCredentialingDate,
        submittedDate: payerEnrollments.submittedDate,
        approvedDate: payerEnrollments.approvedDate,
        stoppedDate: payerEnrollments.stoppedDate,
        stoppedReason: payerEnrollments.stoppedReason,
        nextActionRequired: payerEnrollments.nextActionRequired,
        nextActionDueDate: payerEnrollments.nextActionDueDate,
        progressPercentage: payerEnrollments.progressPercentage,
        approvalLetterUrl: payerEnrollments.approvalLetterUrl,
        welcomeLetterUrl: payerEnrollments.welcomeLetterUrl,
        screenshotUrls: payerEnrollments.screenshotUrls,
        confirmationNumbers: payerEnrollments.confirmationNumbers,
        contacts: payerEnrollments.contacts,
        notes: payerEnrollments.notes,
        timeline: payerEnrollments.timeline,
        createdBy: payerEnrollments.createdBy,
        updatedBy: payerEnrollments.updatedBy,
        createdAt: payerEnrollments.createdAt,
        updatedAt: payerEnrollments.updatedAt,
        // Related data
        physicianName: physicians.fullLegalName,
        payerName: payers.name,
        locationName: practiceLocations.locationName
      })
      .from(payerEnrollments)
      .innerJoin(physicians, eq(payerEnrollments.physicianId, physicians.id))
      .innerJoin(payers, eq(payerEnrollments.payerId, payers.id))
      .innerJoin(practiceLocations, eq(payerEnrollments.practiceLocationId, practiceLocations.id))
      .orderBy(desc(payerEnrollments.createdAt))
      .limit(limit);

    // Cache recent enrollments for 5 minutes
    this.setCached(cacheKey, results, 5);
    return results;
  }

  /**
   * Get upcoming deadlines for enrollments needing action with caching
   */
  static async getUpcomingDeadlines(limit: number = 5): Promise<UpcomingDeadline[]> {
    const cacheKey = `upcoming-deadlines-${limit}`;
    const cached = this.getCached<UpcomingDeadline[]>(cacheKey);
    if (cached) return cached;
    const results = await db
      .select({
        id: payerEnrollments.id,
        physicianName: physicians.fullLegalName,
        payerName: payers.name,
        locationName: practiceLocations.locationName,
        enrollmentStatus: payerEnrollments.enrollmentStatus,
        nextActionRequired: payerEnrollments.nextActionRequired,
        nextActionDueDate: payerEnrollments.nextActionDueDate
      })
      .from(payerEnrollments)
      .innerJoin(physicians, eq(payerEnrollments.physicianId, physicians.id))
      .innerJoin(payers, eq(payerEnrollments.payerId, payers.id))
      .innerJoin(practiceLocations, eq(payerEnrollments.practiceLocationId, practiceLocations.id))
      .where(
        and(
          or(
            eq(payerEnrollments.enrollmentStatus, 'discovery'),
            eq(payerEnrollments.enrollmentStatus, 'data_complete'),
            eq(payerEnrollments.enrollmentStatus, 'submitted')
          ),
          // Only include enrollments with due dates or next actions
          or(
            sql`${payerEnrollments.nextActionDueDate} IS NOT NULL`,
            sql`${payerEnrollments.nextActionRequired} IS NOT NULL`
          )
        )
      )
      .orderBy(asc(payerEnrollments.nextActionDueDate))
      .limit(limit);

    // Calculate days until due
    const deadlines = results.map(result => ({
      ...result,
      daysUntilDue: result.nextActionDueDate 
        ? Math.ceil((new Date(result.nextActionDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null
    }));
    
    // Cache upcoming deadlines for 10 minutes
    this.setCached(cacheKey, deadlines, 10);
    return deadlines;
  }

  /**
   * Get payer summary with enrollment counts and caching
   */
  static async getPayerSummary(): Promise<PayerSummary[]> {
    const cacheKey = 'payer-summary';
    const cached = this.getCached<PayerSummary[]>(cacheKey);
    if (cached) return cached;
    const results = await db
      .select({
        id: payers.id,
        name: payers.name,
        linesOfBusiness: payers.linesOfBusiness,
        isActive: payers.isActive,
        totalEnrollments: count(payerEnrollments.id).as('totalEnrollments'),
        activeEnrollments: sql<number>`COUNT(CASE WHEN ${payerEnrollments.enrollmentStatus} = 'active' THEN 1 END)`.as('activeEnrollments')
      })
      .from(payers)
      .leftJoin(payerEnrollments, eq(payers.id, payerEnrollments.payerId))
      .where(eq(payers.isActive, true))
      .groupBy(payers.id, payers.name, payers.linesOfBusiness, payers.isActive)
      .orderBy(desc(sql`COUNT(${payerEnrollments.id})`));

    const payerSummary = results.map(result => ({
      id: result.id,
      name: result.name,
      enrollmentCount: result.totalEnrollments,
      activeEnrollmentCount: result.activeEnrollments,
      linesOfBusiness: result.linesOfBusiness,
      isActive: result.isActive
    }));
    
    // Cache payer summary for 15 minutes
    this.setCached(cacheKey, payerSummary, 15);
    return payerSummary;
  }

  /**
   * Get enrollment stats filtered by date range with caching
   */
  static async getEnrollmentStatsByDateRange(startDate: Date, endDate: Date): Promise<EnrollmentStats> {
    const cacheKey = `enrollment-stats-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
    const cached = this.getCached<EnrollmentStats>(cacheKey);
    if (cached) return cached;
    const results = await db
      .select({
        enrollmentStatus: payerEnrollments.enrollmentStatus,
        count: count()
      })
      .from(payerEnrollments)
      .where(
        and(
          gte(payerEnrollments.createdAt, startDate),
          lte(payerEnrollments.createdAt, endDate)
        )
      )
      .groupBy(payerEnrollments.enrollmentStatus);

    // Initialize all statuses to 0
    const stats: EnrollmentStats = {
      total: 0,
      discovery: 0,
      data_complete: 0,
      submitted: 0,
      payer_processing: 0,
      approved: 0,
      active: 0,
      denied: 0,
      stopped: 0
    };

    // Aggregate the results
    results.forEach(result => {
      const status = result.enrollmentStatus as keyof EnrollmentStats;
      if (status in stats) {
        (stats as any)[status] = result.count;
      }
      stats.total += result.count;
    });

    // Cache date range stats for 10 minutes
    this.setCached(cacheKey, stats, 10);
    return stats;
  }

  /**
   * Get enrollment trend data for analytics with caching
   */
  static async getEnrollmentTrends(days: number = 30): Promise<Array<{ date: string; count: number; status: string }>> {
    const cacheKey = `enrollment-trends-${days}`;
    const cached = this.getCached<Array<{ date: string; count: number; status: string }>>(cacheKey);
    if (cached) return cached;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await db
      .select({
        date: sql<string>`DATE(${payerEnrollments.createdAt})`,
        status: payerEnrollments.enrollmentStatus,
        count: count()
      })
      .from(payerEnrollments)
      .where(gte(payerEnrollments.createdAt, startDate))
      .groupBy(sql`DATE(${payerEnrollments.createdAt})`, payerEnrollments.enrollmentStatus)
      .orderBy(asc(sql`DATE(${payerEnrollments.createdAt})`));

    const trends = results.map(result => ({
      date: result.date,
      status: result.status,
      count: result.count
    }));
    
    // Cache enrollment trends for 15 minutes
    this.setCached(cacheKey, trends, 15);
    return trends;
  }

  /**
   * Get performance metrics for dashboard with caching
   */
  static async getPerformanceMetrics(): Promise<{
    completionRate: number;
    averageProcessingTime: number;
    enrollmentsThisMonth: number;
    enrollmentsLastMonth: number;
  }> {
    const cacheKey = 'performance-metrics';
    const cached = this.getCached<{
      completionRate: number;
      averageProcessingTime: number;
      enrollmentsThisMonth: number;
      enrollmentsLastMonth: number;
    }>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [completionStats, thisMonthCount, lastMonthCount] = await Promise.all([
      // Completion rate calculation
      db
        .select({
          total: count(),
          completed: sql<number>`COUNT(CASE WHEN ${payerEnrollments.enrollmentStatus} IN ('approved', 'active') THEN 1 END)`
        })
        .from(payerEnrollments),
      
      // This month's enrollments
      db
        .select({ count: count() })
        .from(payerEnrollments)
        .where(gte(payerEnrollments.createdAt, thisMonthStart)),
      
      // Last month's enrollments
      db
        .select({ count: count() })
        .from(payerEnrollments)
        .where(
          and(
            gte(payerEnrollments.createdAt, lastMonthStart),
            lte(payerEnrollments.createdAt, lastMonthEnd)
          )
        )
    ]);

    const completionRate = completionStats[0].total > 0 
      ? (completionStats[0].completed / completionStats[0].total) * 100 
      : 0;

    // Calculate average processing time for completed enrollments
    const processingTimeResult = await db
      .select({
        avgDays: sql<number>`AVG(EXTRACT(DAY FROM (${payerEnrollments.approvedDate} - ${payerEnrollments.createdAt})))`
      })
      .from(payerEnrollments)
      .where(
        and(
          sql`${payerEnrollments.approvedDate} IS NOT NULL`,
          eq(payerEnrollments.enrollmentStatus, 'approved')
        )
      );

    const averageProcessingTime = processingTimeResult[0]?.avgDays || 0;

    const performanceMetrics = {
      completionRate: Math.round(completionRate * 100) / 100,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      enrollmentsThisMonth: thisMonthCount[0].count,
      enrollmentsLastMonth: lastMonthCount[0].count
    };
    
    // Cache performance metrics for 15 minutes
    this.setCached(cacheKey, performanceMetrics, 15);
    return performanceMetrics;
  }
}