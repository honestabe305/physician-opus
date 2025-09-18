import { createStorage, type IStorage } from '../storage';
import { 
  type SelectLicenseDocument, 
  type InsertLicenseDocument, 
  type SelectUser,
  type SelectPhysician 
} from '../../shared/schema';
import { ObjectStorageService } from '../objectStorage';
import * as path from 'path';

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  'pdf': 'application/pdf',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
} as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Document audit trail entry
export interface DocumentAuditEntry {
  id: string;
  documentId: string;
  action: 'upload' | 'update' | 'archive' | 'delete' | 'restore' | 'version_change';
  performedBy: string;
  performedByName?: string;
  timestamp: Date;
  details: Record<string, any>;
  previousVersion?: number;
  newVersion?: number;
}

export class DocumentService {
  private storage: IStorage;
  private objectStorage: ObjectStorageService;
  private auditLog: Map<string, DocumentAuditEntry[]> = new Map();

  constructor() {
    this.storage = createStorage();
    this.objectStorage = new ObjectStorageService();
  }

  /**
   * Upload a new document or create a new version of an existing document
   */
  async uploadDocument(
    physicianId: string,
    documentType: InsertLicenseDocument['documentType'],
    file: {
      filename: string;
      mimetype: string;
      buffer: Buffer;
    },
    uploadedBy: string,
    metadata?: {
      licenseId?: string;
      deaRegistrationId?: string;
      csrLicenseId?: string;
    }
  ): Promise<SelectLicenseDocument> {
    // Validate document
    const validation = await this.validateDocument(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get existing documents of this type for the physician
    const existingDocs = await this.storage.getLicenseDocumentsByType(physicianId, documentType);
    const currentDoc = existingDocs.find(doc => doc.isCurrent);
    
    // Calculate new version number
    const newVersion = currentDoc ? currentDoc.version + 1 : 1;
    
    // If there's a current document, archive it first
    if (currentDoc) {
      await this.archiveDocument(currentDoc.id);
    }

    // Upload file to object storage
    const fileExtension = path.extname(file.filename).toLowerCase();
    const timestamp = Date.now();
    const storagePath = `documents/${physicianId}/${documentType}/${timestamp}_v${newVersion}${fileExtension}`;
    
    const fileUrl = await this.objectStorage.uploadFile(
      storagePath,
      file.buffer,
      file.mimetype
    );

    // Create document record in database
    const document = await this.storage.createLicenseDocument({
      physicianId,
      documentType,
      fileName: file.filename,
      fileUrl,
      fileSize: file.buffer.length,
      version: newVersion,
      uploadedBy,
      isCurrent: true,
      licenseId: metadata?.licenseId || null,
      deaRegistrationId: metadata?.deaRegistrationId || null,
      csrLicenseId: metadata?.csrLicenseId || null
    });

    // Add audit log entry
    this.addAuditEntry({
      id: this.generateAuditId(),
      documentId: document.id,
      action: newVersion === 1 ? 'upload' : 'update',
      performedBy: uploadedBy,
      timestamp: new Date(),
      details: {
        fileName: file.filename,
        fileSize: file.buffer.length,
        documentType,
        physicianId
      },
      previousVersion: currentDoc?.version,
      newVersion: newVersion
    });

    return document;
  }

  /**
   * Get version history for a specific document type
   */
  async getDocumentHistory(physicianId: string, documentType: string): Promise<SelectLicenseDocument[]> {
    const documents = await this.storage.getLicenseDocumentsByType(physicianId, documentType);
    // Sort by version in descending order
    return documents.sort((a, b) => b.version - a.version);
  }

  /**
   * Set a specific version as the current version
   */
  async setCurrentVersion(documentId: string, userId: string): Promise<SelectLicenseDocument> {
    const document = await this.storage.getLicenseDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Get all documents of the same type for this physician
    const allDocs = await this.storage.getLicenseDocumentsByType(
      document.physicianId, 
      document.documentType
    );

    // Archive all current versions
    for (const doc of allDocs) {
      if (doc.isCurrent && doc.id !== documentId) {
        await this.storage.archiveLicenseDocument(doc.id);
      }
    }

    // Set this document as current
    const updated = await this.storage.updateLicenseDocument(documentId, {
      isCurrent: true
    });

    // Add audit log entry
    this.addAuditEntry({
      id: this.generateAuditId(),
      documentId,
      action: 'version_change',
      performedBy: userId,
      timestamp: new Date(),
      details: {
        madeCurrentVersion: document.version
      },
      newVersion: document.version
    });

    return updated;
  }

  /**
   * Validate document file type and size
   */
  async validateDocument(file: {
    filename: string;
    mimetype: string;
    buffer: Buffer;
  }): Promise<{ valid: boolean; error?: string }> {
    // Check file extension
    const fileExtension = path.extname(file.filename).toLowerCase().substring(1);
    
    if (!ALLOWED_FILE_TYPES[fileExtension as keyof typeof ALLOWED_FILE_TYPES]) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`
      };
    }

    // Check MIME type
    const expectedMimeType = ALLOWED_FILE_TYPES[fileExtension as keyof typeof ALLOWED_FILE_TYPES];
    if (file.mimetype !== expectedMimeType) {
      return {
        valid: false,
        error: `Invalid MIME type for ${fileExtension} file`
      };
    }

    // Check file size
    if (file.buffer.length > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Archive a document (mark as not current)
   */
  async archiveDocument(documentId: string): Promise<void> {
    await this.storage.archiveLicenseDocument(documentId);
    
    // Add audit log entry
    this.addAuditEntry({
      id: this.generateAuditId(),
      documentId,
      action: 'archive',
      performedBy: 'system',
      timestamp: new Date(),
      details: {
        reason: 'New version uploaded'
      }
    });
  }

  /**
   * Get audit trail for a specific document or all documents for a physician
   */
  async getAuditTrail(options: {
    documentId?: string;
    physicianId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<DocumentAuditEntry[]> {
    let auditEntries: DocumentAuditEntry[] = [];

    if (options.documentId) {
      // Get audit entries for specific document
      auditEntries = this.auditLog.get(options.documentId) || [];
    } else if (options.physicianId) {
      // Get all documents for physician and their audit trails
      const documents = await this.storage.getLicenseDocumentsByPhysician(options.physicianId);
      for (const doc of documents) {
        const docAudit = this.auditLog.get(doc.id) || [];
        auditEntries.push(...docAudit);
      }
    } else {
      // Get all audit entries
      for (const entries of this.auditLog.values()) {
        auditEntries.push(...entries);
      }
    }

    // Filter by date range if provided
    if (options.startDate || options.endDate) {
      auditEntries = auditEntries.filter(entry => {
        if (options.startDate && entry.timestamp < options.startDate) return false;
        if (options.endDate && entry.timestamp > options.endDate) return false;
        return true;
      });
    }

    // Sort by timestamp (newest first)
    return auditEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get all documents for a physician
   */
  async getPhysicianDocuments(physicianId: string): Promise<SelectLicenseDocument[]> {
    return await this.storage.getLicenseDocumentsByPhysician(physicianId);
  }

  /**
   * Get current documents for a physician (only the latest version of each type)
   */
  async getCurrentDocuments(physicianId: string): Promise<SelectLicenseDocument[]> {
    return await this.storage.getCurrentLicenseDocuments(physicianId);
  }

  /**
   * Delete a document (soft delete - archives it)
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.storage.getLicenseDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Archive instead of hard delete to maintain history
    await this.archiveDocument(documentId);

    // Add audit log entry
    this.addAuditEntry({
      id: this.generateAuditId(),
      documentId,
      action: 'delete',
      performedBy: userId,
      timestamp: new Date(),
      details: {
        documentType: document.documentType,
        fileName: document.fileName,
        version: document.version
      }
    });
  }

  /**
   * Get a signed URL for downloading a document
   */
  async getDocumentDownloadUrl(documentId: string): Promise<string> {
    const document = await this.storage.getLicenseDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Generate a signed URL for secure download
    return await this.objectStorage.getSignedUrl(document.fileUrl, 3600); // 1 hour expiry
  }

  /**
   * Check for documents that are expiring soon
   */
  async getExpiringDocuments(daysAhead: number = 30): Promise<{
    physician: SelectPhysician;
    documents: SelectLicenseDocument[];
  }[]> {
    // This would be enhanced to check document-related expiration dates
    // For now, returning empty array as placeholder
    return [];
  }

  /**
   * Get document statistics for a physician
   */
  async getDocumentStats(physicianId: string): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    totalSize: number;
    lastUploadDate: Date | null;
  }> {
    const documents = await this.storage.getLicenseDocumentsByPhysician(physicianId);
    
    const stats = {
      totalDocuments: documents.length,
      documentsByType: {} as Record<string, number>,
      totalSize: 0,
      lastUploadDate: null as Date | null
    };

    for (const doc of documents) {
      stats.documentsByType[doc.documentType] = (stats.documentsByType[doc.documentType] || 0) + 1;
      stats.totalSize += doc.fileSize || 0;
      
      const uploadDate = new Date(doc.uploadDate);
      if (!stats.lastUploadDate || uploadDate > stats.lastUploadDate) {
        stats.lastUploadDate = uploadDate;
      }
    }

    return stats;
  }

  /**
   * Helper to add audit entry
   */
  private addAuditEntry(entry: DocumentAuditEntry): void {
    if (!this.auditLog.has(entry.documentId)) {
      this.auditLog.set(entry.documentId, []);
    }
    this.auditLog.get(entry.documentId)!.push(entry);
  }

  /**
   * Generate unique audit ID
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

// Export singleton instance
export const documentService = new DocumentService();