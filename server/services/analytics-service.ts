import { createStorage, type IStorage } from '../storage';
import {
  type SelectPhysician,
  type SelectPhysicianLicense,
  type SelectPhysicianCertification,
  type SelectDeaRegistration,
  type SelectCsrLicense,
  type SelectRenewalWorkflow,
  type SelectPhysicianDocument,
  type SelectLicenseDocument,
  type SelectPhysicianCompliance,
} from '../../shared/schema';
import { format, subDays, addDays, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';

export interface ComplianceRate {
  category: string;
  compliant: number;
  nonCompliant: number;
  complianceRate: number;
  details?: Record<string, any>;
}

export interface RenewalTrend {
  period: string;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
}

export interface ExpirationForecast {
  period: string;
  days: number;
  licenses: number;
  deaRegistrations: number;
  csrLicenses: number;
  certifications: number;
  total: number;
}

export interface LicenseDistribution {
  category: string;
  value: number;
  percentage: number;
  subcategories?: Record<string, number>;
}

export interface ProviderMetrics {
  role: 'physician' | 'pa' | 'np';
  total: number;
  compliant: number;
  nonCompliant: number;
  complianceRate: number;
  avgLicensesPerProvider: number;
  expiringWithin30Days: number;
}

export interface DEAMetrics {
  totalRegistrations: number;
  activeRegistrations: number;
  expiredRegistrations: number;
  expiringWithin30Days: number;
  mateTrainingCompliance: number;
  stateDistribution: Record<string, number>;
}

export interface CSRMetrics {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  expiringWithin30Days: number;
  renewalCycleBreakdown: {
    annual: number;
    biennial: number;
  };
  stateDistribution: Record<string, number>;
}

export interface DocumentCompleteness {
  category: string;
  required: number;
  uploaded: number;
  completenessRate: number;
  missingDocuments: string[];
}

export interface ComplianceReport {
  generatedAt: string;
  overallCompliance: number;
  complianceByDepartment: ComplianceRate[];
  complianceBySpecialty: ComplianceRate[];
  complianceByProviderRole: ComplianceRate[];
  documentCompliance: DocumentCompleteness[];
  expirationSummary: ExpirationForecast[];
  renewalPerformance: RenewalTrend[];
  recommendations: string[];
}

export class AnalyticsService {
  private storage: IStorage;

  constructor() {
    this.storage = createStorage();
  }

  // Calculate compliance rates by department/specialty/provider role
  async getComplianceRates(): Promise<{
    overall: number;
    byDepartment: ComplianceRate[];
    bySpecialty: ComplianceRate[];
    byProviderRole: ComplianceRate[];
  }> {
    const physicians = await this.storage.getAllPhysicians();
    const complianceRecords = await Promise.all(
      physicians.map(p => this.storage.getPhysicianComplianceByPhysicianId(p.id))
    );

    // Overall compliance - consider a physician compliant if they have no violations
    const compliant = complianceRecords.filter(c => 
      c && !c.licenseRevocations && !c.pendingInvestigations && 
      !c.malpracticeClaims && !c.medicareSanctions
    ).length;
    const overall = physicians.length > 0 ? (compliant / physicians.length) * 100 : 0;

    // By department - using practice name as department grouping
    const departmentGroups: Record<string, { compliant: number; total: number }> = {};
    physicians.forEach((physician, index) => {
      const dept = physician.practiceName || 'Unassigned';
      if (!departmentGroups[dept]) {
        departmentGroups[dept] = { compliant: 0, total: 0 };
      }
      departmentGroups[dept].total++;
      const compliance = complianceRecords[index];
      if (compliance && !compliance.licenseRevocations && !compliance.pendingInvestigations && 
          !compliance.malpracticeClaims && !compliance.medicareSanctions) {
        departmentGroups[dept].compliant++;
      }
    });

    const byDepartment: ComplianceRate[] = Object.entries(departmentGroups).map(([dept, data]) => ({
      category: dept,
      compliant: data.compliant,
      nonCompliant: data.total - data.compliant,
      complianceRate: data.total > 0 ? (data.compliant / data.total) * 100 : 0,
    }));

    // By specialty - we'll get certifications to determine specialty
    const specialtyGroups: Record<string, { compliant: number; total: number }> = {};
    for (let i = 0; i < physicians.length; i++) {
      const physician = physicians[i];
      const certifications = await this.storage.getPhysicianCertifications(physician.id);
      const specialty = certifications.length > 0 ? certifications[0].specialty : 'General Practice';
      
      if (!specialtyGroups[specialty]) {
        specialtyGroups[specialty] = { compliant: 0, total: 0 };
      }
      specialtyGroups[specialty].total++;
      const compliance = complianceRecords[i];
      if (compliance && !compliance.licenseRevocations && !compliance.pendingInvestigations && 
          !compliance.malpracticeClaims && !compliance.medicareSanctions) {
        specialtyGroups[specialty].compliant++;
      }
    }

    const bySpecialty: ComplianceRate[] = Object.entries(specialtyGroups).map(([specialty, data]) => ({
      category: specialty,
      compliant: data.compliant,
      nonCompliant: data.total - data.compliant,
      complianceRate: data.total > 0 ? (data.compliant / data.total) * 100 : 0,
    }));

    // By provider role
    const roleGroups: Record<string, { compliant: number; total: number }> = {};
    physicians.forEach((physician, index) => {
      const role = physician.providerRole || 'physician';
      if (!roleGroups[role]) {
        roleGroups[role] = { compliant: 0, total: 0 };
      }
      roleGroups[role].total++;
      const compliance = complianceRecords[index];
      if (compliance && !compliance.licenseRevocations && !compliance.pendingInvestigations && 
          !compliance.malpracticeClaims && !compliance.medicareSanctions) {
        roleGroups[role].compliant++;
      }
    });

    const byProviderRole: ComplianceRate[] = Object.entries(roleGroups).map(([role, data]) => ({
      category: role,
      compliant: data.compliant,
      nonCompliant: data.total - data.compliant,
      complianceRate: data.total > 0 ? (data.compliant / data.total) * 100 : 0,
    }));

    return {
      overall,
      byDepartment,
      bySpecialty,
      byProviderRole,
    };
  }

  // Analyze renewal success/failure trends over time
  async getRenewalTrends(): Promise<RenewalTrend[]> {
    const renewalWorkflows = await this.storage.getActiveRenewalWorkflows();
    const trends: RenewalTrend[] = [];

    // Group by month for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(new Date(), i * 30));
      const monthEnd = endOfMonth(monthStart);
      const period = format(monthStart, 'MMM yyyy');

      const monthWorkflows = renewalWorkflows.filter(w => {
        const createdDate = new Date(w.createdAt);
        return createdDate >= monthStart && createdDate <= monthEnd;
      });

      const successful = monthWorkflows.filter(w => w.renewalStatus === 'approved').length;
      const failed = monthWorkflows.filter(w => w.renewalStatus === 'rejected' || w.renewalStatus === 'expired').length;
      const pending = monthWorkflows.filter(w => 
        ['not_started', 'in_progress', 'filed', 'under_review'].includes(w.renewalStatus)
      ).length;

      trends.push({
        period,
        successful,
        failed,
        pending,
        successRate: monthWorkflows.length > 0 ? (successful / monthWorkflows.length) * 100 : 0,
      });
    }

    return trends;
  }

  // Predict upcoming expiration volumes
  async getExpirationForecast(): Promise<ExpirationForecast[]> {
    const forecasts: ExpirationForecast[] = [
      { period: '30 days', days: 30, licenses: 0, deaRegistrations: 0, csrLicenses: 0, certifications: 0, total: 0 },
      { period: '60 days', days: 60, licenses: 0, deaRegistrations: 0, csrLicenses: 0, certifications: 0, total: 0 },
      { period: '90 days', days: 90, licenses: 0, deaRegistrations: 0, csrLicenses: 0, certifications: 0, total: 0 },
    ];

    for (const forecast of forecasts) {
      const [licenses, deaRegs, csrLicenses, certifications] = await Promise.all([
        this.storage.getExpiringLicenses(forecast.days),
        this.storage.getExpiringDeaRegistrations(forecast.days),
        this.storage.getExpiringCsrLicenses(forecast.days),
        this.storage.getExpiringCertifications(forecast.days),
      ]);

      forecast.licenses = licenses.length;
      forecast.deaRegistrations = deaRegs.length;
      forecast.csrLicenses = csrLicenses.length;
      forecast.certifications = certifications.length;
      forecast.total = forecast.licenses + forecast.deaRegistrations + forecast.csrLicenses + forecast.certifications;
    }

    return forecasts;
  }

  // Distribution by state, type, status
  async getLicenseDistribution(): Promise<{
    byState: LicenseDistribution[];
    byType: LicenseDistribution[];
    byStatus: LicenseDistribution[];
  }> {
    const physicians = await this.storage.getAllPhysicians();
    const allLicenses = await Promise.all(
      physicians.map(p => this.storage.getPhysicianLicenses(p.id))
    );
    const flatLicenses = allLicenses.flat();
    const totalLicenses = flatLicenses.length;

    // By state
    const stateGroups: Record<string, number> = {};
    flatLicenses.forEach(license => {
      const state = license.state;
      stateGroups[state] = (stateGroups[state] || 0) + 1;
    });

    const byState: LicenseDistribution[] = Object.entries(stateGroups).map(([state, count]) => ({
      category: state,
      value: count,
      percentage: totalLicenses > 0 ? (count / totalLicenses) * 100 : 0,
    }));

    // By type
    const typeGroups: Record<string, number> = {};
    flatLicenses.forEach(license => {
      const type = license.licenseType || 'Medical';
      typeGroups[type] = (typeGroups[type] || 0) + 1;
    });

    const byType: LicenseDistribution[] = Object.entries(typeGroups).map(([type, count]) => ({
      category: type,
      value: count,
      percentage: totalLicenses > 0 ? (count / totalLicenses) * 100 : 0,
    }));

    // By status - calculate status based on expiration date
    const statusGroups: Record<string, number> = {};
    flatLicenses.forEach(license => {
      const expirationDate = new Date(license.expirationDate);
      const today = new Date();
      const status = expirationDate < today ? 'expired' : expirationDate < addDays(today, 90) ? 'pending_renewal' : 'active';
      statusGroups[status] = (statusGroups[status] || 0) + 1;
    });

    const byStatus: LicenseDistribution[] = Object.entries(statusGroups).map(([status, count]) => ({
      category: status,
      value: count,
      percentage: totalLicenses > 0 ? (count / totalLicenses) * 100 : 0,
    }));

    return {
      byState: byState.sort((a, b) => b.value - a.value),
      byType: byType.sort((a, b) => b.value - a.value),
      byStatus: byStatus.sort((a, b) => b.value - a.value),
    };
  }

  // Metrics by provider role (physician/PA/NP)
  async getProviderMetrics(): Promise<ProviderMetrics[]> {
    const physicians = await this.storage.getAllPhysicians();
    const metrics: ProviderMetrics[] = [];

    for (const role of ['physician', 'pa', 'np'] as const) {
      const rolePhysicians = physicians.filter(p => p.providerRole === role);
      
      if (rolePhysicians.length === 0) {
        metrics.push({
          role,
          total: 0,
          compliant: 0,
          nonCompliant: 0,
          complianceRate: 0,
          avgLicensesPerProvider: 0,
          expiringWithin30Days: 0,
        });
        continue;
      }

      const complianceRecords = await Promise.all(
        rolePhysicians.map(p => this.storage.getPhysicianComplianceByPhysicianId(p.id))
      );

      const compliant = complianceRecords.filter(c => 
        c && !c.licenseRevocations && !c.pendingInvestigations && 
        !c.malpracticeClaims && !c.medicareSanctions
      ).length;

      const allLicenses = await Promise.all(
        rolePhysicians.map(p => this.storage.getPhysicianLicenses(p.id))
      );
      const totalLicenses = allLicenses.reduce((sum, licenses) => sum + licenses.length, 0);

      const expiringLicenses = await this.storage.getExpiringLicenses(30);
      const expiringForRole = expiringLicenses.filter(l => 
        rolePhysicians.some(p => p.id === l.physicianId)
      ).length;

      metrics.push({
        role,
        total: rolePhysicians.length,
        compliant,
        nonCompliant: rolePhysicians.length - compliant,
        complianceRate: (compliant / rolePhysicians.length) * 100,
        avgLicensesPerProvider: totalLicenses / rolePhysicians.length,
        expiringWithin30Days: expiringForRole,
      });
    }

    return metrics;
  }

  // DEA registration compliance and MATE training stats
  async getDEAMetrics(): Promise<DEAMetrics> {
    const physicians = await this.storage.getAllPhysicians();
    const allDEARegistrations = await Promise.all(
      physicians.map(p => this.storage.getDeaRegistrationsByPhysician(p.id))
    );
    const flatDEARegistrations = allDEARegistrations.flat();

    const activeRegistrations = flatDEARegistrations.filter(d => d.status === 'active').length;
    const expiredRegistrations = flatDEARegistrations.filter(d => d.status === 'expired').length;
    const expiringDEA = await this.storage.getExpiringDeaRegistrations(30);

    // MATE training compliance
    const withMATETraining = flatDEARegistrations.filter(d => d.mateAttested).length;
    const mateTrainingCompliance = flatDEARegistrations.length > 0 
      ? (withMATETraining / flatDEARegistrations.length) * 100 
      : 0;

    // State distribution
    const stateDistribution: Record<string, number> = {};
    flatDEARegistrations.forEach(dea => {
      stateDistribution[dea.state] = (stateDistribution[dea.state] || 0) + 1;
    });

    return {
      totalRegistrations: flatDEARegistrations.length,
      activeRegistrations,
      expiredRegistrations,
      expiringWithin30Days: expiringDEA.length,
      mateTrainingCompliance,
      stateDistribution,
    };
  }

  // CSR license compliance by state
  async getCSRMetrics(): Promise<CSRMetrics> {
    const physicians = await this.storage.getAllPhysicians();
    const allCSRLicenses = await Promise.all(
      physicians.map(p => this.storage.getCsrLicensesByPhysician(p.id))
    );
    const flatCSRLicenses = allCSRLicenses.flat();

    const activeLicenses = flatCSRLicenses.filter(c => c.status === 'active').length;
    const expiredLicenses = flatCSRLicenses.filter(c => c.status === 'expired').length;
    const expiringCSR = await this.storage.getExpiringCsrLicenses(30);

    // Renewal cycle breakdown
    const annual = flatCSRLicenses.filter(c => c.renewalCycle === 'annual').length;
    const biennial = flatCSRLicenses.filter(c => c.renewalCycle === 'biennial').length;

    // State distribution
    const stateDistribution: Record<string, number> = {};
    flatCSRLicenses.forEach(csr => {
      stateDistribution[csr.state] = (stateDistribution[csr.state] || 0) + 1;
    });

    return {
      totalLicenses: flatCSRLicenses.length,
      activeLicenses,
      expiredLicenses,
      expiringWithin30Days: expiringCSR.length,
      renewalCycleBreakdown: {
        annual,
        biennial,
      },
      stateDistribution,
    };
  }

  // Document upload compliance rates
  async getDocumentCompleteness(): Promise<DocumentCompleteness[]> {
    const physicians = await this.storage.getAllPhysicians();
    const completeness: DocumentCompleteness[] = [];

    // Using the exact enum values from documentTypeEnum
    const requiredDocuments = [
      'medical_license' as const,
      'dea_certificate' as const,
      'board_certification' as const,
      'malpractice_insurance' as const,
      'cv' as const,
    ];

    for (const physician of physicians) {
      const documents = await this.storage.getPhysicianDocuments(physician.id);
      const uploadedTypes = new Set(documents.map(d => d.documentType));
      
      const missing = requiredDocuments.filter(doc => !uploadedTypes.has(doc as any));
      
      completeness.push({
        category: physician.fullLegalName,
        required: requiredDocuments.length,
        uploaded: requiredDocuments.filter(doc => uploadedTypes.has(doc as any)).length,
        completenessRate: ((requiredDocuments.length - missing.length) / requiredDocuments.length) * 100,
        missingDocuments: missing,
      });
    }

    return completeness;
  }

  // Comprehensive compliance report
  async generateComplianceReport(): Promise<ComplianceReport> {
    const [
      complianceRates,
      renewalTrends,
      expirationForecast,
      documentCompliance,
    ] = await Promise.all([
      this.getComplianceRates(),
      this.getRenewalTrends(),
      this.getExpirationForecast(),
      this.getDocumentCompleteness(),
    ]);

    const recommendations: string[] = [];

    // Generate recommendations based on data
    if (complianceRates.overall < 80) {
      recommendations.push('Overall compliance is below target. Focus on improving documentation and renewal processes.');
    }

    const highExpirations = expirationForecast.find(f => f.days === 30);
    if (highExpirations && highExpirations.total > 10) {
      recommendations.push(`${highExpirations.total} credentials expiring within 30 days. Initiate renewal processes immediately.`);
    }

    const recentTrend = renewalTrends[renewalTrends.length - 1];
    if (recentTrend && recentTrend.successRate < 90) {
      recommendations.push('Recent renewal success rate is below 90%. Review and streamline renewal workflows.');
    }

    const incompleteDocuments = documentCompliance.filter(d => d.completenessRate < 100);
    if (incompleteDocuments.length > 0) {
      recommendations.push(`${incompleteDocuments.length} providers have incomplete documentation. Follow up on missing documents.`);
    }

    return {
      generatedAt: new Date().toISOString(),
      overallCompliance: complianceRates.overall,
      complianceByDepartment: complianceRates.byDepartment,
      complianceBySpecialty: complianceRates.bySpecialty,
      complianceByProviderRole: complianceRates.byProviderRole,
      documentCompliance,
      expirationSummary: expirationForecast,
      renewalPerformance: renewalTrends,
      recommendations,
    };
  }

  // Export analytics data in CSV/JSON format
  async exportAnalyticsData(format: 'csv' | 'json' = 'json'): Promise<string> {
    const report = await this.generateComplianceReport();

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    // CSV format
    const csvRows: string[] = ['Category,Metric,Value'];

    // Overall compliance
    csvRows.push(`Overall,Compliance Rate,${report.overallCompliance.toFixed(2)}%`);

    // Department compliance
    report.complianceByDepartment.forEach(dept => {
      csvRows.push(`Department: ${dept.category},Compliance Rate,${dept.complianceRate.toFixed(2)}%`);
      csvRows.push(`Department: ${dept.category},Compliant,${dept.compliant}`);
      csvRows.push(`Department: ${dept.category},Non-Compliant,${dept.nonCompliant}`);
    });

    // Provider role compliance
    report.complianceByProviderRole.forEach(role => {
      csvRows.push(`Provider Role: ${role.category},Compliance Rate,${role.complianceRate.toFixed(2)}%`);
      csvRows.push(`Provider Role: ${role.category},Compliant,${role.compliant}`);
      csvRows.push(`Provider Role: ${role.category},Non-Compliant,${role.nonCompliant}`);
    });

    // Expiration summary
    report.expirationSummary.forEach(exp => {
      csvRows.push(`Expiring in ${exp.period},Total,${exp.total}`);
      csvRows.push(`Expiring in ${exp.period},Licenses,${exp.licenses}`);
      csvRows.push(`Expiring in ${exp.period},DEA Registrations,${exp.deaRegistrations}`);
      csvRows.push(`Expiring in ${exp.period},CSR Licenses,${exp.csrLicenses}`);
      csvRows.push(`Expiring in ${exp.period},Certifications,${exp.certifications}`);
    });

    // Renewal performance
    report.renewalPerformance.forEach(renewal => {
      csvRows.push(`Renewal ${renewal.period},Success Rate,${renewal.successRate.toFixed(2)}%`);
      csvRows.push(`Renewal ${renewal.period},Successful,${renewal.successful}`);
      csvRows.push(`Renewal ${renewal.period},Failed,${renewal.failed}`);
      csvRows.push(`Renewal ${renewal.period},Pending,${renewal.pending}`);
    });

    return csvRows.join('\n');
  }

  // Get compliance for a specific department
  async getDepartmentCompliance(department: string): Promise<ComplianceRate> {
    const physicians = await this.storage.getAllPhysicians();
    const deptPhysicians = physicians.filter(p => 
      p.practiceName?.toLowerCase() === department.toLowerCase()
    );

    if (deptPhysicians.length === 0) {
      return {
        category: department,
        compliant: 0,
        nonCompliant: 0,
        complianceRate: 0,
      };
    }

    const complianceRecords = await Promise.all(
      deptPhysicians.map(p => this.storage.getPhysicianComplianceByPhysicianId(p.id))
    );

    const compliant = complianceRecords.filter(c => 
      c && !c.licenseRevocations && !c.pendingInvestigations && 
      !c.malpracticeClaims && !c.medicareSanctions
    ).length;

    return {
      category: department,
      compliant,
      nonCompliant: deptPhysicians.length - compliant,
      complianceRate: (compliant / deptPhysicians.length) * 100,
    };
  }

  // Get physician status summary
  async getPhysicianStatusSummary(): Promise<{
    total: number;
    statusBreakdown: Record<string, number>;
  }> {
    const physicians = await this.storage.getAllPhysicians();
    
    const statusBreakdown: Record<string, number> = {
      active: 0,
      inactive: 0,
      pending: 0,
      suspended: 0
    };
    
    physicians.forEach(physician => {
      const status = physician.status || 'pending';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });
    
    return {
      total: physicians.length,
      statusBreakdown
    };
  }

  // Get license expiration report
  async getLicenseExpirationReport(days: number): Promise<{
    expiringWithinDays: number;
    alreadyExpired: number;
    licenses: any[];
    reportGeneratedAt: string;
  }> {
    const today = new Date();
    const futureDate = addDays(today, days);
    
    const physicians = await this.storage.getAllPhysicians();
    const allLicenses: any[] = [];
    let expiringCount = 0;
    let expiredCount = 0;
    
    for (const physician of physicians) {
      const licenses = await this.storage.getPhysicianLicenses(physician.id);
      
      for (const license of licenses) {
        if (license.expirationDate) {
          const expDate = new Date(license.expirationDate);
          const daysUntilExpiration = differenceInDays(expDate, today);
          
          if (daysUntilExpiration < 0) {
            expiredCount++;
          } else if (daysUntilExpiration <= days) {
            expiringCount++;
            allLicenses.push({
              ...license,
              physicianId: physician.id,
              physicianName: `${physician.firstName} ${physician.lastName}`,
              daysUntilExpiration
            });
          }
        }
      }
    }
    
    return {
      expiringWithinDays: expiringCount,
      alreadyExpired: expiredCount,
      licenses: allLicenses.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration),
      reportGeneratedAt: new Date().toISOString()
    };
  }

  // Get certification expiration report
  async getCertificationExpirationReport(days: number): Promise<{
    expiringWithinDays: number;
    alreadyExpired: number;
    certifications: any[];
    reportGeneratedAt: string;
  }> {
    const today = new Date();
    const futureDate = addDays(today, days);
    
    const physicians = await this.storage.getAllPhysicians();
    const allCertifications: any[] = [];
    let expiringCount = 0;
    let expiredCount = 0;
    
    for (const physician of physicians) {
      const certifications = await this.storage.getPhysicianCertifications(physician.id);
      
      for (const certification of certifications) {
        if (certification.expirationDate) {
          const expDate = new Date(certification.expirationDate);
          const daysUntilExpiration = differenceInDays(expDate, today);
          
          if (daysUntilExpiration < 0) {
            expiredCount++;
          } else if (daysUntilExpiration <= days) {
            expiringCount++;
            allCertifications.push({
              ...certification,
              physicianId: physician.id,
              physicianName: `${physician.firstName} ${physician.lastName}`,
              daysUntilExpiration
            });
          }
        }
      }
    }
    
    return {
      expiringWithinDays: expiringCount,
      alreadyExpired: expiredCount,
      certifications: allCertifications.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration),
      reportGeneratedAt: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();