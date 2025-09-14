"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.MemStorage = exports.PostgreSQLStorage = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("./db");
const schema_1 = require("../shared/schema");
// PostgreSQL Storage Implementation
class PostgreSQLStorage {
    // Profile operations
    async createProfile(profile) {
        try {
            const [result] = await db_1.db.insert(schema_1.profiles).values(profile).returning();
            if (!result) {
                throw new Error('Failed to create profile');
            }
            return result;
        }
        catch (error) {
            console.error('Error creating profile:', error);
            throw new Error(`Failed to create profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getProfile(userId) {
        try {
            const [result] = await db_1.db.select().from(schema_1.profiles).where((0, drizzle_orm_1.eq)(schema_1.profiles.userId, userId));
            return result || null;
        }
        catch (error) {
            console.error('Error getting profile:', error);
            throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getProfileById(id) {
        try {
            const [result] = await db_1.db.select().from(schema_1.profiles).where((0, drizzle_orm_1.eq)(schema_1.profiles.id, id));
            return result || null;
        }
        catch (error) {
            console.error('Error getting profile by id:', error);
            throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateProfile(id, updates) {
        try {
            const [result] = await db_1.db
                .update(schema_1.profiles)
                .set({ ...updates, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.profiles.id, id))
                .returning();
            if (!result) {
                throw new Error('Profile not found');
            }
            return result;
        }
        catch (error) {
            console.error('Error updating profile:', error);
            throw new Error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteProfile(id) {
        try {
            await db_1.db.delete(schema_1.profiles).where((0, drizzle_orm_1.eq)(schema_1.profiles.id, id));
        }
        catch (error) {
            console.error('Error deleting profile:', error);
            throw new Error(`Failed to delete profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAllProfiles() {
        try {
            return await db_1.db.select().from(schema_1.profiles);
        }
        catch (error) {
            console.error('Error getting all profiles:', error);
            throw new Error(`Failed to get profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Physician operations
    async createPhysician(physician) {
        try {
            const [result] = await db_1.db.insert(schema_1.physicians).values(physician).returning();
            if (!result) {
                throw new Error('Failed to create physician');
            }
            return result;
        }
        catch (error) {
            console.error('Error creating physician:', error);
            throw new Error(`Failed to create physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysician(id) {
        try {
            const [result] = await db_1.db.select().from(schema_1.physicians).where((0, drizzle_orm_1.eq)(schema_1.physicians.id, id));
            return result || null;
        }
        catch (error) {
            console.error('Error getting physician:', error);
            throw new Error(`Failed to get physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianByNpi(npi) {
        try {
            const [result] = await db_1.db.select().from(schema_1.physicians).where((0, drizzle_orm_1.eq)(schema_1.physicians.npi, npi));
            return result || null;
        }
        catch (error) {
            console.error('Error getting physician by NPI:', error);
            throw new Error(`Failed to get physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updatePhysician(id, updates) {
        try {
            const [result] = await db_1.db
                .update(schema_1.physicians)
                .set({ ...updates, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.physicians.id, id))
                .returning();
            if (!result) {
                throw new Error('Physician not found');
            }
            return result;
        }
        catch (error) {
            console.error('Error updating physician:', error);
            throw new Error(`Failed to update physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deletePhysician(id) {
        try {
            await db_1.db.delete(schema_1.physicians).where((0, drizzle_orm_1.eq)(schema_1.physicians.id, id));
        }
        catch (error) {
            console.error('Error deleting physician:', error);
            throw new Error(`Failed to delete physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAllPhysicians() {
        try {
            return await db_1.db.select().from(schema_1.physicians);
        }
        catch (error) {
            console.error('Error getting all physicians:', error);
            throw new Error(`Failed to get physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async searchPhysicians(query) {
        try {
            return await db_1.db
                .select()
                .from(schema_1.physicians)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.physicians.fullLegalName, `%${query}%`), (0, drizzle_orm_1.like)(schema_1.physicians.npi, `%${query}%`), (0, drizzle_orm_1.ilike)(schema_1.physicians.practiceName, `%${query}%`), (0, drizzle_orm_1.ilike)(schema_1.physicians.emailAddress, `%${query}%`)));
        }
        catch (error) {
            console.error('Error searching physicians:', error);
            throw new Error(`Failed to search physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysiciansByStatus(status) {
        try {
            return await db_1.db.select().from(schema_1.physicians).where((0, drizzle_orm_1.eq)(schema_1.physicians.status, status));
        }
        catch (error) {
            console.error('Error getting physicians by status:', error);
            throw new Error(`Failed to get physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Physician License operations
    async createPhysicianLicense(license) {
        try {
            const [result] = await db_1.db.insert(schema_1.physicianLicenses).values(license).returning();
            if (!result) {
                throw new Error('Failed to create physician license');
            }
            return result;
        }
        catch (error) {
            console.error('Error creating physician license:', error);
            throw new Error(`Failed to create physician license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianLicense(id) {
        try {
            const [result] = await db_1.db.select().from(schema_1.physicianLicenses).where((0, drizzle_orm_1.eq)(schema_1.physicianLicenses.id, id));
            return result || null;
        }
        catch (error) {
            console.error('Error getting physician license:', error);
            throw new Error(`Failed to get physician license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianLicenses(physicianId) {
        try {
            return await db_1.db.select().from(schema_1.physicianLicenses).where((0, drizzle_orm_1.eq)(schema_1.physicianLicenses.physicianId, physicianId));
        }
        catch (error) {
            console.error('Error getting physician licenses:', error);
            throw new Error(`Failed to get physician licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updatePhysicianLicense(id, updates) {
        try {
            const [result] = await db_1.db
                .update(schema_1.physicianLicenses)
                .set({ ...updates, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.physicianLicenses.id, id))
                .returning();
            if (!result) {
                throw new Error('Physician license not found');
            }
            return result;
        }
        catch (error) {
            console.error('Error updating physician license:', error);
            throw new Error(`Failed to update physician license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deletePhysicianLicense(id) {
        try {
            await db_1.db.delete(schema_1.physicianLicenses).where((0, drizzle_orm_1.eq)(schema_1.physicianLicenses.id, id));
        }
        catch (error) {
            console.error('Error deleting physician license:', error);
            throw new Error(`Failed to delete physician license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getExpiringLicenses(days) {
        try {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);
            return await db_1.db
                .select()
                .from(schema_1.physicianLicenses)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `${schema_1.physicianLicenses.expirationDate} <= ${futureDate.toISOString().split('T')[0]}`, (0, drizzle_orm_1.sql) `${schema_1.physicianLicenses.expirationDate} >= ${new Date().toISOString().split('T')[0]}`));
        }
        catch (error) {
            console.error('Error getting expiring licenses:', error);
            throw new Error(`Failed to get expiring licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Physician Certification operations
    async createPhysicianCertification(certification) {
        try {
            const [result] = await db_1.db.insert(schema_1.physicianCertifications).values(certification).returning();
            if (!result) {
                throw new Error('Failed to create physician certification');
            }
            return result;
        }
        catch (error) {
            console.error('Error creating physician certification:', error);
            throw new Error(`Failed to create physician certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianCertification(id) {
        try {
            const [result] = await db_1.db.select().from(schema_1.physicianCertifications).where((0, drizzle_orm_1.eq)(schema_1.physicianCertifications.id, id));
            return result || null;
        }
        catch (error) {
            console.error('Error getting physician certification:', error);
            throw new Error(`Failed to get physician certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianCertifications(physicianId) {
        try {
            return await db_1.db.select().from(schema_1.physicianCertifications).where((0, drizzle_orm_1.eq)(schema_1.physicianCertifications.physicianId, physicianId));
        }
        catch (error) {
            console.error('Error getting physician certifications:', error);
            throw new Error(`Failed to get physician certifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updatePhysicianCertification(id, updates) {
        try {
            const [result] = await db_1.db
                .update(schema_1.physicianCertifications)
                .set({ ...updates, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.physicianCertifications.id, id))
                .returning();
            if (!result) {
                throw new Error('Physician certification not found');
            }
            return result;
        }
        catch (error) {
            console.error('Error updating physician certification:', error);
            throw new Error(`Failed to update physician certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deletePhysicianCertification(id) {
        try {
            await db_1.db.delete(schema_1.physicianCertifications).where((0, drizzle_orm_1.eq)(schema_1.physicianCertifications.id, id));
        }
        catch (error) {
            console.error('Error deleting physician certification:', error);
            throw new Error(`Failed to delete physician certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getExpiringCertifications(days) {
        try {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);
            return await db_1.db
                .select()
                .from(schema_1.physicianCertifications)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `${schema_1.physicianCertifications.expirationDate} <= ${futureDate.toISOString().split('T')[0]}`, (0, drizzle_orm_1.sql) `${schema_1.physicianCertifications.expirationDate} >= ${new Date().toISOString().split('T')[0]}`));
        }
        catch (error) {
            console.error('Error getting expiring certifications:', error);
            throw new Error(`Failed to get expiring certifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Physician Education operations
    async createPhysicianEducation(education) {
        try {
            const [result] = await db_1.db.insert(schema_1.physicianEducation).values(education).returning();
            if (!result) {
                throw new Error('Failed to create physician education');
            }
            return result;
        }
        catch (error) {
            console.error('Error creating physician education:', error);
            throw new Error(`Failed to create physician education: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianEducation(id) {
        try {
            const [result] = await db_1.db.select().from(schema_1.physicianEducation).where((0, drizzle_orm_1.eq)(schema_1.physicianEducation.id, id));
            return result || null;
        }
        catch (error) {
            console.error('Error getting physician education:', error);
            throw new Error(`Failed to get physician education: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianEducations(physicianId) {
        try {
            return await db_1.db.select().from(schema_1.physicianEducation).where((0, drizzle_orm_1.eq)(schema_1.physicianEducation.physicianId, physicianId));
        }
        catch (error) {
            console.error('Error getting physician educations:', error);
            throw new Error(`Failed to get physician educations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updatePhysicianEducation(id, updates) {
        try {
            const [result] = await db_1.db
                .update(schema_1.physicianEducation)
                .set({ ...updates, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.physicianEducation.id, id))
                .returning();
            if (!result) {
                throw new Error('Physician education not found');
            }
            return result;
        }
        catch (error) {
            console.error('Error updating physician education:', error);
            throw new Error(`Failed to update physician education: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deletePhysicianEducation(id) {
        try {
            await db_1.db.delete(schema_1.physicianEducation).where((0, drizzle_orm_1.eq)(schema_1.physicianEducation.id, id));
        }
        catch (error) {
            console.error('Error deleting physician education:', error);
            throw new Error(`Failed to delete physician education: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Physician Work History operations
    async createPhysicianWorkHistory(workHistory) {
        try {
            const [result] = await db_1.db.insert(schema_1.physicianWorkHistory).values(workHistory).returning();
            if (!result) {
                throw new Error('Failed to create physician work history');
            }
            return result;
        }
        catch (error) {
            console.error('Error creating physician work history:', error);
            throw new Error(`Failed to create physician work history: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianWorkHistory(id) {
        try {
            const [result] = await db_1.db.select().from(schema_1.physicianWorkHistory).where((0, drizzle_orm_1.eq)(schema_1.physicianWorkHistory.id, id));
            return result || null;
        }
        catch (error) {
            console.error('Error getting physician work history:', error);
            throw new Error(`Failed to get physician work history: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianWorkHistories(physicianId) {
        try {
            return await db_1.db.select().from(schema_1.physicianWorkHistory).where((0, drizzle_orm_1.eq)(schema_1.physicianWorkHistory.physicianId, physicianId));
        }
        catch (error) {
            console.error('Error getting physician work histories:', error);
            throw new Error(`Failed to get physician work histories: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updatePhysicianWorkHistory(id, updates) {
        try {
            const [result] = await db_1.db
                .update(schema_1.physicianWorkHistory)
                .set({ ...updates, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.physicianWorkHistory.id, id))
                .returning();
            if (!result) {
                throw new Error('Physician work history not found');
            }
            return result;
        }
        catch (error) {
            console.error('Error updating physician work history:', error);
            throw new Error(`Failed to update physician work history: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deletePhysicianWorkHistory(id) {
        try {
            await db_1.db.delete(schema_1.physicianWorkHistory).where((0, drizzle_orm_1.eq)(schema_1.physicianWorkHistory.id, id));
        }
        catch (error) {
            console.error('Error deleting physician work history:', error);
            throw new Error(`Failed to delete physician work history: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Physician Hospital Affiliation operations
    async createPhysicianHospitalAffiliation(affiliation) {
        try {
            const [result] = await db_1.db.insert(schema_1.physicianHospitalAffiliations).values(affiliation).returning();
            if (!result) {
                throw new Error('Failed to create physician hospital affiliation');
            }
            return result;
        }
        catch (error) {
            console.error('Error creating physician hospital affiliation:', error);
            throw new Error(`Failed to create physician hospital affiliation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianHospitalAffiliation(id) {
        try {
            const [result] = await db_1.db.select().from(schema_1.physicianHospitalAffiliations).where((0, drizzle_orm_1.eq)(schema_1.physicianHospitalAffiliations.id, id));
            return result || null;
        }
        catch (error) {
            console.error('Error getting physician hospital affiliation:', error);
            throw new Error(`Failed to get physician hospital affiliation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianHospitalAffiliations(physicianId) {
        try {
            return await db_1.db.select().from(schema_1.physicianHospitalAffiliations).where((0, drizzle_orm_1.eq)(schema_1.physicianHospitalAffiliations.physicianId, physicianId));
        }
        catch (error) {
            console.error('Error getting physician hospital affiliations:', error);
            throw new Error(`Failed to get physician hospital affiliations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updatePhysicianHospitalAffiliation(id, updates) {
        try {
            const [result] = await db_1.db
                .update(schema_1.physicianHospitalAffiliations)
                .set({ ...updates, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.physicianHospitalAffiliations.id, id))
                .returning();
            if (!result) {
                throw new Error('Physician hospital affiliation not found');
            }
            return result;
        }
        catch (error) {
            console.error('Error updating physician hospital affiliation:', error);
            throw new Error(`Failed to update physician hospital affiliation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deletePhysicianHospitalAffiliation(id) {
        try {
            await db_1.db.delete(schema_1.physicianHospitalAffiliations).where((0, drizzle_orm_1.eq)(schema_1.physicianHospitalAffiliations.id, id));
        }
        catch (error) {
            console.error('Error deleting physician hospital affiliation:', error);
            throw new Error(`Failed to delete physician hospital affiliation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Physician Compliance operations
    async createPhysicianCompliance(compliance) {
        try {
            const [result] = await db_1.db.insert(schema_1.physicianCompliance).values(compliance).returning();
            if (!result) {
                throw new Error('Failed to create physician compliance');
            }
            return result;
        }
        catch (error) {
            console.error('Error creating physician compliance:', error);
            throw new Error(`Failed to create physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianCompliance(id) {
        try {
            const [result] = await db_1.db.select().from(schema_1.physicianCompliance).where((0, drizzle_orm_1.eq)(schema_1.physicianCompliance.id, id));
            return result || null;
        }
        catch (error) {
            console.error('Error getting physician compliance:', error);
            throw new Error(`Failed to get physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianComplianceByPhysicianId(physicianId) {
        try {
            const [result] = await db_1.db.select().from(schema_1.physicianCompliance).where((0, drizzle_orm_1.eq)(schema_1.physicianCompliance.physicianId, physicianId));
            return result || null;
        }
        catch (error) {
            console.error('Error getting physician compliance by physician id:', error);
            throw new Error(`Failed to get physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updatePhysicianCompliance(id, updates) {
        try {
            const [result] = await db_1.db
                .update(schema_1.physicianCompliance)
                .set({ ...updates, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.physicianCompliance.id, id))
                .returning();
            if (!result) {
                throw new Error('Physician compliance not found');
            }
            return result;
        }
        catch (error) {
            console.error('Error updating physician compliance:', error);
            throw new Error(`Failed to update physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deletePhysicianCompliance(id) {
        try {
            await db_1.db.delete(schema_1.physicianCompliance).where((0, drizzle_orm_1.eq)(schema_1.physicianCompliance.id, id));
        }
        catch (error) {
            console.error('Error deleting physician compliance:', error);
            throw new Error(`Failed to delete physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Physician Document operations
    async createPhysicianDocument(document) {
        try {
            const [result] = await db_1.db.insert(schema_1.physicianDocuments).values(document).returning();
            if (!result) {
                throw new Error('Failed to create physician document');
            }
            return result;
        }
        catch (error) {
            console.error('Error creating physician document:', error);
            throw new Error(`Failed to create physician document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianDocument(id) {
        try {
            const [result] = await db_1.db.select().from(schema_1.physicianDocuments).where((0, drizzle_orm_1.eq)(schema_1.physicianDocuments.id, id));
            return result || null;
        }
        catch (error) {
            console.error('Error getting physician document:', error);
            throw new Error(`Failed to get physician document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianDocuments(physicianId) {
        try {
            return await db_1.db.select().from(schema_1.physicianDocuments).where((0, drizzle_orm_1.eq)(schema_1.physicianDocuments.physicianId, physicianId));
        }
        catch (error) {
            console.error('Error getting physician documents:', error);
            throw new Error(`Failed to get physician documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPhysicianDocumentsByType(physicianId, documentType) {
        try {
            return await db_1.db
                .select()
                .from(schema_1.physicianDocuments)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.physicianDocuments.physicianId, physicianId), (0, drizzle_orm_1.sql) `${schema_1.physicianDocuments.documentType} = ${documentType}`));
        }
        catch (error) {
            console.error('Error getting physician documents by type:', error);
            throw new Error(`Failed to get physician documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updatePhysicianDocument(id, updates) {
        try {
            const [result] = await db_1.db
                .update(schema_1.physicianDocuments)
                .set({ ...updates, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.physicianDocuments.id, id))
                .returning();
            if (!result) {
                throw new Error('Physician document not found');
            }
            return result;
        }
        catch (error) {
            console.error('Error updating physician document:', error);
            throw new Error(`Failed to update physician document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deletePhysicianDocument(id) {
        try {
            await db_1.db.delete(schema_1.physicianDocuments).where((0, drizzle_orm_1.eq)(schema_1.physicianDocuments.id, id));
        }
        catch (error) {
            console.error('Error deleting physician document:', error);
            throw new Error(`Failed to delete physician document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Utility operations
    async getPhysicianFullProfile(physicianId) {
        try {
            const [physician, licenses, certifications, education, workHistory, hospitalAffiliations, compliance, documents] = await Promise.all([
                this.getPhysician(physicianId),
                this.getPhysicianLicenses(physicianId),
                this.getPhysicianCertifications(physicianId),
                this.getPhysicianEducations(physicianId),
                this.getPhysicianWorkHistories(physicianId),
                this.getPhysicianHospitalAffiliations(physicianId),
                this.getPhysicianComplianceByPhysicianId(physicianId),
                this.getPhysicianDocuments(physicianId)
            ]);
            return {
                physician,
                licenses,
                certifications,
                education,
                workHistory,
                hospitalAffiliations,
                compliance,
                documents
            };
        }
        catch (error) {
            console.error('Error getting physician full profile:', error);
            throw new Error(`Failed to get physician full profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.PostgreSQLStorage = PostgreSQLStorage;
// In-Memory Storage Implementation
class MemStorage {
    profiles = new Map();
    physicians = new Map();
    physicianLicenses = new Map();
    physicianCertifications = new Map();
    physicianEducations = new Map();
    physicianWorkHistories = new Map();
    physicianHospitalAffiliations = new Map();
    physicianCompliances = new Map();
    physicianDocuments = new Map();
    generateId() {
        return crypto.randomUUID();
    }
    // Profile operations
    async createProfile(profile) {
        const id = this.generateId();
        const now = new Date();
        const newProfile = {
            id,
            ...profile,
            createdAt: now,
            updatedAt: now
        };
        this.profiles.set(id, newProfile);
        return newProfile;
    }
    async getProfile(userId) {
        for (const profile of this.profiles.values()) {
            if (profile.userId === userId) {
                return profile;
            }
        }
        return null;
    }
    async getProfileById(id) {
        return this.profiles.get(id) || null;
    }
    async updateProfile(id, updates) {
        const profile = this.profiles.get(id);
        if (!profile) {
            throw new Error('Profile not found');
        }
        const updatedProfile = { ...profile, ...updates, updatedAt: new Date() };
        this.profiles.set(id, updatedProfile);
        return updatedProfile;
    }
    async deleteProfile(id) {
        this.profiles.delete(id);
    }
    async getAllProfiles() {
        return Array.from(this.profiles.values());
    }
    // Physician operations
    async createPhysician(physician) {
        const id = this.generateId();
        const now = new Date();
        const newPhysician = {
            id,
            ...physician,
            createdAt: now,
            updatedAt: now
        };
        this.physicians.set(id, newPhysician);
        return newPhysician;
    }
    async getPhysician(id) {
        return this.physicians.get(id) || null;
    }
    async getPhysicianByNpi(npi) {
        for (const physician of this.physicians.values()) {
            if (physician.npi === npi) {
                return physician;
            }
        }
        return null;
    }
    async updatePhysician(id, updates) {
        const physician = this.physicians.get(id);
        if (!physician) {
            throw new Error('Physician not found');
        }
        const updatedPhysician = { ...physician, ...updates, updatedAt: new Date() };
        this.physicians.set(id, updatedPhysician);
        return updatedPhysician;
    }
    async deletePhysician(id) {
        this.physicians.delete(id);
    }
    async getAllPhysicians() {
        return Array.from(this.physicians.values());
    }
    async searchPhysicians(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.physicians.values()).filter(physician => physician.fullLegalName?.toLowerCase().includes(lowerQuery) ||
            physician.npi?.includes(query) ||
            physician.practiceName?.toLowerCase().includes(lowerQuery) ||
            physician.emailAddress?.toLowerCase().includes(lowerQuery));
    }
    async getPhysiciansByStatus(status) {
        return Array.from(this.physicians.values()).filter(physician => physician.status === status);
    }
    // Physician License operations
    async createPhysicianLicense(license) {
        const id = this.generateId();
        const now = new Date();
        const newLicense = {
            id,
            ...license,
            createdAt: now,
            updatedAt: now
        };
        this.physicianLicenses.set(id, newLicense);
        return newLicense;
    }
    async getPhysicianLicense(id) {
        return this.physicianLicenses.get(id) || null;
    }
    async getPhysicianLicenses(physicianId) {
        return Array.from(this.physicianLicenses.values()).filter(license => license.physicianId === physicianId);
    }
    async updatePhysicianLicense(id, updates) {
        const license = this.physicianLicenses.get(id);
        if (!license) {
            throw new Error('Physician license not found');
        }
        const updatedLicense = { ...license, ...updates, updatedAt: new Date() };
        this.physicianLicenses.set(id, updatedLicense);
        return updatedLicense;
    }
    async deletePhysicianLicense(id) {
        this.physicianLicenses.delete(id);
    }
    async getExpiringLicenses(days) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        const today = new Date();
        return Array.from(this.physicianLicenses.values()).filter(license => {
            if (!license.expirationDate)
                return false;
            const expDate = new Date(license.expirationDate);
            return expDate <= futureDate && expDate >= today;
        });
    }
    // Physician Certification operations
    async createPhysicianCertification(certification) {
        const id = this.generateId();
        const now = new Date();
        const newCertification = {
            id,
            ...certification,
            createdAt: now,
            updatedAt: now
        };
        this.physicianCertifications.set(id, newCertification);
        return newCertification;
    }
    async getPhysicianCertification(id) {
        return this.physicianCertifications.get(id) || null;
    }
    async getPhysicianCertifications(physicianId) {
        return Array.from(this.physicianCertifications.values()).filter(cert => cert.physicianId === physicianId);
    }
    async updatePhysicianCertification(id, updates) {
        const certification = this.physicianCertifications.get(id);
        if (!certification) {
            throw new Error('Physician certification not found');
        }
        const updatedCertification = { ...certification, ...updates, updatedAt: new Date() };
        this.physicianCertifications.set(id, updatedCertification);
        return updatedCertification;
    }
    async deletePhysicianCertification(id) {
        this.physicianCertifications.delete(id);
    }
    async getExpiringCertifications(days) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        const today = new Date();
        return Array.from(this.physicianCertifications.values()).filter(cert => {
            if (!cert.expirationDate)
                return false;
            const expDate = new Date(cert.expirationDate);
            return expDate <= futureDate && expDate >= today;
        });
    }
    // Physician Education operations
    async createPhysicianEducation(education) {
        const id = this.generateId();
        const now = new Date();
        const newEducation = {
            id,
            ...education,
            createdAt: now,
            updatedAt: now
        };
        this.physicianEducations.set(id, newEducation);
        return newEducation;
    }
    async getPhysicianEducation(id) {
        return this.physicianEducations.get(id) || null;
    }
    async getPhysicianEducations(physicianId) {
        return Array.from(this.physicianEducations.values()).filter(edu => edu.physicianId === physicianId);
    }
    async updatePhysicianEducation(id, updates) {
        const education = this.physicianEducations.get(id);
        if (!education) {
            throw new Error('Physician education not found');
        }
        const updatedEducation = { ...education, ...updates, updatedAt: new Date() };
        this.physicianEducations.set(id, updatedEducation);
        return updatedEducation;
    }
    async deletePhysicianEducation(id) {
        this.physicianEducations.delete(id);
    }
    // Physician Work History operations
    async createPhysicianWorkHistory(workHistory) {
        const id = this.generateId();
        const now = new Date();
        const newWorkHistory = {
            id,
            ...workHistory,
            createdAt: now,
            updatedAt: now
        };
        this.physicianWorkHistories.set(id, newWorkHistory);
        return newWorkHistory;
    }
    async getPhysicianWorkHistory(id) {
        return this.physicianWorkHistories.get(id) || null;
    }
    async getPhysicianWorkHistories(physicianId) {
        return Array.from(this.physicianWorkHistories.values()).filter(wh => wh.physicianId === physicianId);
    }
    async updatePhysicianWorkHistory(id, updates) {
        const workHistory = this.physicianWorkHistories.get(id);
        if (!workHistory) {
            throw new Error('Physician work history not found');
        }
        const updatedWorkHistory = { ...workHistory, ...updates, updatedAt: new Date() };
        this.physicianWorkHistories.set(id, updatedWorkHistory);
        return updatedWorkHistory;
    }
    async deletePhysicianWorkHistory(id) {
        this.physicianWorkHistories.delete(id);
    }
    // Physician Hospital Affiliation operations
    async createPhysicianHospitalAffiliation(affiliation) {
        const id = this.generateId();
        const now = new Date();
        const newAffiliation = {
            id,
            ...affiliation,
            createdAt: now,
            updatedAt: now
        };
        this.physicianHospitalAffiliations.set(id, newAffiliation);
        return newAffiliation;
    }
    async getPhysicianHospitalAffiliation(id) {
        return this.physicianHospitalAffiliations.get(id) || null;
    }
    async getPhysicianHospitalAffiliations(physicianId) {
        return Array.from(this.physicianHospitalAffiliations.values()).filter(aff => aff.physicianId === physicianId);
    }
    async updatePhysicianHospitalAffiliation(id, updates) {
        const affiliation = this.physicianHospitalAffiliations.get(id);
        if (!affiliation) {
            throw new Error('Physician hospital affiliation not found');
        }
        const updatedAffiliation = { ...affiliation, ...updates, updatedAt: new Date() };
        this.physicianHospitalAffiliations.set(id, updatedAffiliation);
        return updatedAffiliation;
    }
    async deletePhysicianHospitalAffiliation(id) {
        this.physicianHospitalAffiliations.delete(id);
    }
    // Physician Compliance operations
    async createPhysicianCompliance(compliance) {
        const id = this.generateId();
        const now = new Date();
        const newCompliance = {
            id,
            ...compliance,
            createdAt: now,
            updatedAt: now
        };
        this.physicianCompliances.set(id, newCompliance);
        return newCompliance;
    }
    async getPhysicianCompliance(id) {
        return this.physicianCompliances.get(id) || null;
    }
    async getPhysicianComplianceByPhysicianId(physicianId) {
        for (const compliance of this.physicianCompliances.values()) {
            if (compliance.physicianId === physicianId) {
                return compliance;
            }
        }
        return null;
    }
    async updatePhysicianCompliance(id, updates) {
        const compliance = this.physicianCompliances.get(id);
        if (!compliance) {
            throw new Error('Physician compliance not found');
        }
        const updatedCompliance = { ...compliance, ...updates, updatedAt: new Date() };
        this.physicianCompliances.set(id, updatedCompliance);
        return updatedCompliance;
    }
    async deletePhysicianCompliance(id) {
        this.physicianCompliances.delete(id);
    }
    // Physician Document operations
    async createPhysicianDocument(document) {
        const id = this.generateId();
        const now = new Date();
        const newDocument = {
            id,
            ...document,
            createdAt: now,
            updatedAt: now
        };
        this.physicianDocuments.set(id, newDocument);
        return newDocument;
    }
    async getPhysicianDocument(id) {
        return this.physicianDocuments.get(id) || null;
    }
    async getPhysicianDocuments(physicianId) {
        return Array.from(this.physicianDocuments.values()).filter(doc => doc.physicianId === physicianId);
    }
    async getPhysicianDocumentsByType(physicianId, documentType) {
        return Array.from(this.physicianDocuments.values()).filter(doc => doc.physicianId === physicianId && doc.documentType === documentType);
    }
    async updatePhysicianDocument(id, updates) {
        const document = this.physicianDocuments.get(id);
        if (!document) {
            throw new Error('Physician document not found');
        }
        const updatedDocument = { ...document, ...updates, updatedAt: new Date() };
        this.physicianDocuments.set(id, updatedDocument);
        return updatedDocument;
    }
    async deletePhysicianDocument(id) {
        this.physicianDocuments.delete(id);
    }
    // Utility operations
    async getPhysicianFullProfile(physicianId) {
        const [physician, licenses, certifications, education, workHistory, hospitalAffiliations, compliance, documents] = await Promise.all([
            this.getPhysician(physicianId),
            this.getPhysicianLicenses(physicianId),
            this.getPhysicianCertifications(physicianId),
            this.getPhysicianEducations(physicianId),
            this.getPhysicianWorkHistories(physicianId),
            this.getPhysicianHospitalAffiliations(physicianId),
            this.getPhysicianComplianceByPhysicianId(physicianId),
            this.getPhysicianDocuments(physicianId)
        ]);
        return {
            physician,
            licenses,
            certifications,
            education,
            workHistory,
            hospitalAffiliations,
            compliance,
            documents
        };
    }
}
exports.MemStorage = MemStorage;
// Export storage instance - use PostgreSQL by default, fallback to MemStorage if needed
exports.storage = new PostgreSQLStorage();
