import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

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
  constructor() {}

  // Gets the bucket name from environment or default
  getBucketName(): string {
    // Try to get from environment variable first, then fall back to a default
    return process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID || "replit-objstore-default";
  }

  // Gets the upload URL for a physician document
  async getDocumentUploadURL(physicianId: string): Promise<string> {
    const bucketName = this.getBucketName();
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
  async getDocumentFile(filePath: string): Promise<File> {
    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(filePath);
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    
    return file;
  }

  // Upload a file to object storage
  async uploadFile(path: string, buffer: Buffer, mimeType: string): Promise<string> {
    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(path);
    
    await file.save(buffer, {
      contentType: mimeType,
      resumable: false,
    });
    
    // Return the file path for storage
    return `gs://${bucketName}/${path}`;
  }

  // Get a signed URL for downloading a file
  async getSignedUrl(filePath: string, expiresInSeconds: number = 3600): Promise<string> {
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
  async downloadDocument(file: File, res: Response) {
    try {
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

  // Parse the object path from upload URL
  parseObjectPath(uploadUrl: string): string {
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

  // Sign object URL for upload/download
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
        `Failed to sign object URL, error code: ${response.status}. ` +
        `Make sure you're running on Replit and have object storage configured.`
      );
    }

    const { signed_url: signedURL } = await response.json();
    return signedURL;
  }
}