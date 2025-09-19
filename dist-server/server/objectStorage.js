"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectStorageService = exports.ObjectNotFoundError = exports.objectStorageClient = void 0;
const storage_1 = require("@google-cloud/storage");
const crypto_1 = require("crypto");
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
// The object storage client is used to interact with the object storage service.
exports.objectStorageClient = new storage_1.Storage({
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
class ObjectNotFoundError extends Error {
    constructor() {
        super("Object not found");
        this.name = "ObjectNotFoundError";
        Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
    }
}
exports.ObjectNotFoundError = ObjectNotFoundError;
// The object storage service for PhysicianCRM documents
class ObjectStorageService {
    constructor() { }
    // Gets the bucket name from environment or default
    getBucketName() {
        // Try to get from environment variable first, then fall back to a default
        return process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID || "replit-objstore-default";
    }
    // Gets the upload URL for a physician document
    async getDocumentUploadURL(physicianId) {
        const bucketName = this.getBucketName();
        const documentId = (0, crypto_1.randomUUID)();
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
    async getDocumentFile(filePath) {
        const bucketName = this.getBucketName();
        const bucket = exports.objectStorageClient.bucket(bucketName);
        const file = bucket.file(filePath);
        const [exists] = await file.exists();
        if (!exists) {
            throw new ObjectNotFoundError();
        }
        return file;
    }
    // Downloads a document to the response
    async downloadDocument(file, res) {
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
        }
        catch (error) {
            console.error("Error downloading file:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: "Error downloading file" });
            }
        }
    }
    // Parse the object path from upload URL
    parseObjectPath(uploadUrl) {
        if (!uploadUrl.includes("googleapis.com")) {
            return uploadUrl;
        }
        try {
            const url = new URL(uploadUrl);
            return url.pathname.split('/').slice(2).join('/'); // Remove /storage/v1/b/bucket_name/o/ prefix
        }
        catch {
            return uploadUrl;
        }
    }
    // Sign object URL for upload/download
    async signObjectURL({ bucketName, objectName, method, ttlSec, }) {
        const request = {
            bucket_name: bucketName,
            object_name: objectName,
            method,
            expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
        };
        const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
        });
        if (!response.ok) {
            throw new Error(`Failed to sign object URL, error code: ${response.status}. ` +
                `Make sure you're running on Replit and have object storage configured.`);
        }
        const { signed_url: signedURL } = await response.json();
        return signedURL;
    }
}
exports.ObjectStorageService = ObjectStorageService;
