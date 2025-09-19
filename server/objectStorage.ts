import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const LOCAL_STORAGE_DIR = path.join(process.cwd(), "uploads");

// The object storage client is used to interact with the object storage service.
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service for PhysicianCRM documents
export class ObjectStorageService {
  private useLocalStorage = false;

  constructor() {
    // Ensure local storage directory exists
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
  }

  // Check if cloud storage is available, fallback to local storage
  private async isCloudStorageAvailable(): Promise<boolean> {
    if (this.useLocalStorage) return false;

    try {
      const bucketName = this.getBucketName();
      const bucket = objectStorageClient.bucket(bucketName);
      await bucket.exists();
      return true;
    } catch (error) {
      console.log("🔄 Cloud storage not available, using local storage fallback");
      this.useLocalStorage = true;
      return false;
    }
  }

  // Gets the bucket name from environment or default
  getBucketName(): string {
    // Use the bucket ID from .replit file via environment variable
    return process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID || "replit-objstore-eff1b6bc-faa1-48ef-ba40-694ef25d01d6";
  }

  // Gets the upload URL for a physician document
  async getDocumentUploadURL(physicianId: string): Promise<string> {
    const cloudAvailable = await this.isCloudStorageAvailable();
    
    if (!cloudAvailable) {
      // Return a local upload identifier
      const documentId = randomUUID();
      return `local://${physicianId}/documents/${documentId}`;
    }

    const bucketName = this.getBucketName();
    console.log('Using bucket name:', bucketName);
    const documentId = randomUUID();
    const objectName = `physicians/${physicianId}/documents/${documentId}`;

    // Sign URL for PUT method with TTL
    return this.signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900, // 15 minutes
    });
  }

  // Gets a physician document file
  async getDocumentFile(filePath: string): Promise<File | LocalFile> {
    if (filePath.startsWith("local://")) {
      return this.getLocalFile(filePath);
    }

    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(filePath);
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    
    return file;
  }

  // Get a local file (fallback implementation)
  private getLocalFile(filePath: string): LocalFile {
    const localPath = filePath.replace("local://", "");
    const fullPath = path.join(LOCAL_STORAGE_DIR, localPath);
    
    if (!fs.existsSync(fullPath)) {
      throw new ObjectNotFoundError();
    }
    
    return new LocalFile(fullPath, localPath);
  }

  // Upload a file to object storage
  async uploadFile(uploadPath: string, buffer: Buffer, mimeType: string): Promise<string> {
    // Check if this is a local upload
    if (uploadPath.startsWith("local://")) {
      return this.uploadFileLocally(uploadPath, buffer, mimeType);
    }

    const cloudAvailable = await this.isCloudStorageAvailable();
    
    if (!cloudAvailable) {
      return this.uploadFileLocally(uploadPath, buffer, mimeType);
    }

    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(uploadPath);
    
    await file.save(buffer, {
      contentType: mimeType,
      resumable: false,
    });
    
    // Return the file path for storage
    return `gs://${bucketName}/${uploadPath}`;
  }

  // Upload file to local storage (fallback)
  private async uploadFileLocally(uploadPath: string, buffer: Buffer, mimeType: string): Promise<string> {
    const localPath = uploadPath.replace("local://", "");
    const fullPath = path.join(LOCAL_STORAGE_DIR, localPath);
    
    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(fullPath, buffer);
    
    // Return local storage path
    return `local://${localPath}`;
  }

  // Get a signed URL for downloading a file
  async getSignedUrl(filePath: string, expiresInSeconds: number = 3600): Promise<string> {
    if (filePath.startsWith("local://")) {
      // For local files, return a direct download URL
      const localPath = filePath.replace("local://", "");
      // Parse the path: physicianId/documents/documentId
      const pathParts = localPath.split('/');
      if (pathParts.length >= 3) {
        const physicianId = pathParts[0];
        const folder = pathParts[1]; // "documents"
        const documentId = pathParts[2];
        return `/api/documents/download/local/${physicianId}/${folder}/${documentId}`;
      }
      // Fallback if path doesn't match expected structure
      return `/api/documents/download/local/unknown/documents/${Date.now()}`;
    }

    const bucketName = this.getBucketName();
    // Remove the gs:// prefix if present
    const cleanPath = filePath.replace(`gs://${bucketName}/`, '');
    
    return this.signObjectURL({
      bucketName,
      objectName: cleanPath,
      method: "GET",
      ttlSec: expiresInSeconds,
    });
  }

  // Downloads a document to the response
  async downloadDocument(file: File | LocalFile, res: Response) {
    try {
      if (file instanceof LocalFile) {
        return this.downloadLocalFile(file, res);
      }

      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `attachment; filename="${file.name.split('/').pop()}"`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Download local file
  private downloadLocalFile(file: LocalFile, res: Response) {
    try {
      const stats = fs.statSync(file.fullPath);
      const mimeType = this.getMimeTypeFromExtension(file.fullPath);
      
      res.set({
        "Content-Type": mimeType,
        "Content-Length": stats.size.toString(),
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `attachment; filename="${path.basename(file.fullPath)}"`,
      });

      const stream = fs.createReadStream(file.fullPath);
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading local file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Get MIME type from file extension
  private getMimeTypeFromExtension(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Parse the object path from upload URL
  parseObjectPath(uploadUrl: string): string {
    if (uploadUrl.startsWith("local://")) {
      return uploadUrl;
    }

    if (!uploadUrl.includes("googleapis.com")) {
      return uploadUrl;
    }
    
    try {
      const url = new URL(uploadUrl);
      return url.pathname.split('/').slice(2).join('/'); // Remove /storage/v1/b/bucket_name/o/ prefix
    } catch {
      return uploadUrl;
    }
  }

  // Sign object URL for cloud storage
  private async signObjectURL({
    bucketName,
    objectName,
    method,
    ttlSec,
  }: {
    bucketName: string;
    objectName: string;
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    ttlSec: number;
  }): Promise<string> {
    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to sign object URL, errorcode: ${response.status}, ` +
          `make sure you're running on Replit`
      );
    }

    const { signed_url: signedURL } = await response.json();
    return signedURL;
  }
}

// Local file implementation for fallback storage
class LocalFile {
  constructor(public fullPath: string, public name: string) {}

  createReadStream() {
    return fs.createReadStream(this.fullPath);
  }

  async getMetadata() {
    const stats = fs.statSync(this.fullPath);
    return [{
      contentType: this.getMimeType(),
      size: stats.size,
    }];
  }

  private getMimeType(): string {
    const ext = path.extname(this.fullPath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}