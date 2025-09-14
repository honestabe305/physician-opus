import { Router } from 'express';
import { PostgreSQLStorage } from './storage';
import {
  insertProfileSchema,
  insertPhysicianSchema,
  insertPhysicianLicenseSchema,
  insertPhysicianCertificationSchema,
  insertPhysicianEducationSchema,
  insertPhysicianWorkHistorySchema,
  insertPhysicianHospitalAffiliationSchema,
  insertPhysicianComplianceSchema,
  insertPhysicianDocumentSchema,
  type SelectPhysician,
  type SelectPhysicianLicense,
  type SelectPhysicianCertification,
  type SelectPhysicianEducation,
  type SelectPhysicianWorkHistory,
  type SelectPhysicianHospitalAffiliation,
  type SelectPhysicianCompliance,
  type SelectPhysicianDocument
} from '../shared/schema';
import { z } from 'zod';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage';

const router = Router();
const storage = new PostgreSQLStorage();

// Helper function for error handling
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Profile routes
router.post('/profiles', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertProfileSchema.parse(req.body);
  const profile = await storage.createProfile(validatedData);
  res.status(201).json(profile);
}));

router.get('/profiles', asyncHandler(async (req: any, res: any) => {
  const profiles = await storage.getAllProfiles();
  res.json(profiles);
}));

router.get('/profiles/:id', asyncHandler(async (req: any, res: any) => {
  const profile = await storage.getProfileById(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
}));

router.get('/profiles/user/:userId', asyncHandler(async (req: any, res: any) => {
  const profile = await storage.getProfile(req.params.userId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
}));

router.put('/profiles/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertProfileSchema.partial().parse(req.body);
  const profile = await storage.updateProfile(req.params.id, validatedData);
  res.json(profile);
}));

router.delete('/profiles/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deleteProfile(req.params.id);
  res.status(204).send();
}));

// Physician routes
router.post('/physicians', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianSchema.parse(req.body);
  const physician = await storage.createPhysician(validatedData);
  res.status(201).json(physician);
}));

router.get('/physicians', asyncHandler(async (req: any, res: any) => {
  const { search, status, limit, offset } = req.query;
  
  let physicians: SelectPhysician[];
  
  if (search) {
    physicians = await storage.searchPhysicians(search as string);
  } else if (status) {
    physicians = await storage.getPhysiciansByStatus(status as string);
  } else {
    physicians = await storage.getAllPhysicians();
  }
  
  // Apply pagination if specified
  if (limit || offset) {
    const startIndex = parseInt(offset as string) || 0;
    const endIndex = startIndex + (parseInt(limit as string) || physicians.length);
    physicians = physicians.slice(startIndex, endIndex);
  }
  
  res.json({
    physicians,
    total: physicians.length,
    pagination: {
      limit: parseInt(limit as string) || null,
      offset: parseInt(offset as string) || 0
    }
  });
}));

router.get('/physicians/:id', asyncHandler(async (req: any, res: any) => {
  const physician = await storage.getPhysician(req.params.id);
  if (!physician) {
    return res.status(404).json({ error: 'Physician not found' });
  }
  res.json(physician);
}));

router.get('/physicians/:id/full', asyncHandler(async (req: any, res: any) => {
  const fullProfile = await storage.getPhysicianFullProfile(req.params.id);
  if (!fullProfile.physician) {
    return res.status(404).json({ error: 'Physician not found' });
  }
  res.json(fullProfile);
}));

router.get('/physicians/npi/:npi', asyncHandler(async (req: any, res: any) => {
  const physician = await storage.getPhysicianByNpi(req.params.npi);
  if (!physician) {
    return res.status(404).json({ error: 'Physician not found' });
  }
  res.json(physician);
}));

router.put('/physicians/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianSchema.partial().parse(req.body);
  const physician = await storage.updatePhysician(req.params.id, validatedData);
  res.json(physician);
}));

router.delete('/physicians/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysician(req.params.id);
  res.status(204).send();
}));

// Physician License routes
router.post('/physicians/:physicianId/licenses', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianLicenseSchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const license = await storage.createPhysicianLicense(validatedData);
  res.status(201).json(license);
}));

router.get('/physicians/:physicianId/licenses', asyncHandler(async (req: any, res: any) => {
  const licenses = await storage.getPhysicianLicenses(req.params.physicianId);
  res.json(licenses);
}));

router.get('/licenses/:id', asyncHandler(async (req: any, res: any) => {
  const license = await storage.getPhysicianLicense(req.params.id);
  if (!license) {
    return res.status(404).json({ error: 'License not found' });
  }
  res.json(license);
}));

router.get('/licenses/expiring/:days', asyncHandler(async (req: any, res: any) => {
  const days = parseInt(req.params.days);
  if (isNaN(days) || days < 0) {
    return res.status(400).json({ error: 'Days must be a non-negative number' });
  }
  const licenses = await storage.getExpiringLicenses(days);
  res.json(licenses);
}));

router.put('/licenses/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianLicenseSchema.partial().parse(req.body);
  const license = await storage.updatePhysicianLicense(req.params.id, validatedData);
  res.json(license);
}));

router.delete('/licenses/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianLicense(req.params.id);
  res.status(204).send();
}));

// Physician Certification routes
router.post('/physicians/:physicianId/certifications', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianCertificationSchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const certification = await storage.createPhysicianCertification(validatedData);
  res.status(201).json(certification);
}));

router.get('/physicians/:physicianId/certifications', asyncHandler(async (req: any, res: any) => {
  const certifications = await storage.getPhysicianCertifications(req.params.physicianId);
  res.json(certifications);
}));

router.get('/certifications/:id', asyncHandler(async (req: any, res: any) => {
  const certification = await storage.getPhysicianCertification(req.params.id);
  if (!certification) {
    return res.status(404).json({ error: 'Certification not found' });
  }
  res.json(certification);
}));

router.get('/certifications/expiring/:days', asyncHandler(async (req: any, res: any) => {
  const days = parseInt(req.params.days);
  if (isNaN(days) || days < 0) {
    return res.status(400).json({ error: 'Days must be a non-negative number' });
  }
  const certifications = await storage.getExpiringCertifications(days);
  res.json(certifications);
}));

router.put('/certifications/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianCertificationSchema.partial().parse(req.body);
  const certification = await storage.updatePhysicianCertification(req.params.id, validatedData);
  res.json(certification);
}));

router.delete('/certifications/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianCertification(req.params.id);
  res.status(204).send();
}));

// Physician Education routes
router.post('/physicians/:physicianId/education', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianEducationSchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const education = await storage.createPhysicianEducation(validatedData);
  res.status(201).json(education);
}));

router.get('/physicians/:physicianId/education', asyncHandler(async (req: any, res: any) => {
  const education = await storage.getPhysicianEducations(req.params.physicianId);
  res.json(education);
}));

router.get('/education/:id', asyncHandler(async (req: any, res: any) => {
  const education = await storage.getPhysicianEducation(req.params.id);
  if (!education) {
    return res.status(404).json({ error: 'Education record not found' });
  }
  res.json(education);
}));

router.put('/education/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianEducationSchema.partial().parse(req.body);
  const education = await storage.updatePhysicianEducation(req.params.id, validatedData);
  res.json(education);
}));

router.delete('/education/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianEducation(req.params.id);
  res.status(204).send();
}));

// Physician Work History routes
router.post('/physicians/:physicianId/work-history', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianWorkHistorySchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const workHistory = await storage.createPhysicianWorkHistory(validatedData);
  res.status(201).json(workHistory);
}));

router.get('/physicians/:physicianId/work-history', asyncHandler(async (req: any, res: any) => {
  const workHistory = await storage.getPhysicianWorkHistories(req.params.physicianId);
  res.json(workHistory);
}));

router.get('/work-history/:id', asyncHandler(async (req: any, res: any) => {
  const workHistory = await storage.getPhysicianWorkHistory(req.params.id);
  if (!workHistory) {
    return res.status(404).json({ error: 'Work history not found' });
  }
  res.json(workHistory);
}));

router.put('/work-history/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianWorkHistorySchema.partial().parse(req.body);
  const workHistory = await storage.updatePhysicianWorkHistory(req.params.id, validatedData);
  res.json(workHistory);
}));

router.delete('/work-history/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianWorkHistory(req.params.id);
  res.status(204).send();
}));

// Physician Hospital Affiliation routes
router.post('/physicians/:physicianId/hospital-affiliations', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianHospitalAffiliationSchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const affiliation = await storage.createPhysicianHospitalAffiliation(validatedData);
  res.status(201).json(affiliation);
}));

router.get('/physicians/:physicianId/hospital-affiliations', asyncHandler(async (req: any, res: any) => {
  const affiliations = await storage.getPhysicianHospitalAffiliations(req.params.physicianId);
  res.json(affiliations);
}));

router.get('/hospital-affiliations/:id', asyncHandler(async (req: any, res: any) => {
  const affiliation = await storage.getPhysicianHospitalAffiliation(req.params.id);
  if (!affiliation) {
    return res.status(404).json({ error: 'Hospital affiliation not found' });
  }
  res.json(affiliation);
}));

router.put('/hospital-affiliations/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianHospitalAffiliationSchema.partial().parse(req.body);
  const affiliation = await storage.updatePhysicianHospitalAffiliation(req.params.id, validatedData);
  res.json(affiliation);
}));

router.delete('/hospital-affiliations/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianHospitalAffiliation(req.params.id);
  res.status(204).send();
}));

// Physician Compliance routes
router.post('/physicians/:physicianId/compliance', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianComplianceSchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const compliance = await storage.createPhysicianCompliance(validatedData);
  res.status(201).json(compliance);
}));

router.get('/physicians/:physicianId/compliance', asyncHandler(async (req: any, res: any) => {
  const compliance = await storage.getPhysicianComplianceByPhysicianId(req.params.physicianId);
  if (!compliance) {
    return res.status(404).json({ error: 'Compliance record not found' });
  }
  res.json(compliance);
}));

router.get('/compliance/:id', asyncHandler(async (req: any, res: any) => {
  const compliance = await storage.getPhysicianCompliance(req.params.id);
  if (!compliance) {
    return res.status(404).json({ error: 'Compliance record not found' });
  }
  res.json(compliance);
}));

router.put('/compliance/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianComplianceSchema.partial().parse(req.body);
  const compliance = await storage.updatePhysicianCompliance(req.params.id, validatedData);
  res.json(compliance);
}));

router.delete('/compliance/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianCompliance(req.params.id);
  res.status(204).send();
}));

// Physician Document routes
router.post('/physicians/:physicianId/documents', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianDocumentSchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const document = await storage.createPhysicianDocument(validatedData);
  res.status(201).json(document);
}));

router.get('/physicians/:physicianId/documents', asyncHandler(async (req: any, res: any) => {
  const { type } = req.query;
  let documents: SelectPhysicianDocument[];
  
  if (type) {
    documents = await storage.getPhysicianDocumentsByType(req.params.physicianId, type as string);
  } else {
    documents = await storage.getPhysicianDocuments(req.params.physicianId);
  }
  
  res.json(documents);
}));

router.get('/documents/:id', asyncHandler(async (req: any, res: any) => {
  const document = await storage.getPhysicianDocument(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(document);
}));

router.put('/documents/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianDocumentSchema.partial().parse(req.body);
  const document = await storage.updatePhysicianDocument(req.params.id, validatedData);
  res.json(document);
}));

router.delete('/documents/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianDocument(req.params.id);
  res.status(204).send();
}));

// Analytics and reporting routes
router.get('/analytics/physicians/status-summary', asyncHandler(async (req: any, res: any) => {
  const physicians = await storage.getAllPhysicians();
  const statusCounts = physicians.reduce((acc, physician) => {
    const status = physician.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  res.json({
    total: physicians.length,
    statusBreakdown: statusCounts
  });
}));

router.get('/analytics/licenses/expiration-report', asyncHandler(async (req: any, res: any) => {
  const { days = 30 } = req.query;
  const daysNum = parseInt(days as string);
  
  if (isNaN(daysNum) || daysNum < 0) {
    return res.status(400).json({ error: 'Days must be a non-negative number' });
  }
  
  const expiringLicenses = await storage.getExpiringLicenses(daysNum);
  const expiredLicenses = await storage.getExpiringLicenses(0);
  
  res.json({
    expiringWithinDays: expiringLicenses.length,
    alreadyExpired: expiredLicenses.length,
    licenses: expiringLicenses,
    reportGeneratedAt: new Date().toISOString()
  });
}));

router.get('/analytics/certifications/expiration-report', asyncHandler(async (req: any, res: any) => {
  const { days = 30 } = req.query;
  const daysNum = parseInt(days as string);
  
  if (isNaN(daysNum) || daysNum < 0) {
    return res.status(400).json({ error: 'Days must be a non-negative number' });
  }
  
  const expiringCertifications = await storage.getExpiringCertifications(daysNum);
  const expiredCertifications = await storage.getExpiringCertifications(0);
  
  res.json({
    expiringWithinDays: expiringCertifications.length,
    alreadyExpired: expiredCertifications.length,
    certifications: expiringCertifications,
    reportGeneratedAt: new Date().toISOString()
  });
}));

// Bulk operations
router.post('/physicians/bulk', asyncHandler(async (req: any, res: any) => {
  const { physicians } = req.body;
  
  if (!Array.isArray(physicians)) {
    return res.status(400).json({ error: 'Physicians must be an array' });
  }
  
  const results: Array<{index: number, success: true, data: SelectPhysician}> = [];
  const errors: Array<{index: number, success: false, error: string}> = [];
  
  for (let i = 0; i < physicians.length; i++) {
    try {
      const validatedData = insertPhysicianSchema.parse(physicians[i]);
      const physician = await storage.createPhysician(validatedData);
      results.push({ index: i, success: true, data: physician });
    } catch (error) {
      errors.push({ 
        index: i, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  res.json({
    totalProcessed: physicians.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors
  });
}));

// Document Upload routes
router.post('/documents/upload-url/:physicianId', asyncHandler(async (req: any, res: any) => {
  const { physicianId } = req.params;
  
  // Verify physician exists
  const physician = await storage.getPhysician(physicianId);
  if (!physician) {
    return res.status(404).json({ error: 'Physician not found' });
  }
  
  try {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getDocumentUploadURL(physicianId);
    res.json({ uploadURL });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}));

router.post('/documents', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianDocumentSchema.parse(req.body);
  const document = await storage.createPhysicianDocument(validatedData);
  res.status(201).json(document);
}));

router.get('/documents/:id/download', asyncHandler(async (req: any, res: any) => {
  try {
    const document = await storage.getPhysicianDocument(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const objectStorageService = new ObjectStorageService();
    const file = await objectStorageService.getDocumentFile(document.filePath);
    await objectStorageService.downloadDocument(file, res);
  } catch (error) {
    console.error('Error downloading document:', error);
    if (error instanceof ObjectNotFoundError) {
      return res.status(404).json({ error: 'Document file not found' });
    }
    return res.status(500).json({ error: 'Failed to download document' });
  }
}));

export { router };