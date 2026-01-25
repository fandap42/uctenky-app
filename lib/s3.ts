import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/**
 * MinIO/S3 configuration from environment variables.
 * Falls back to local development defaults if not provided.
 */
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: "us-east-1", // MinIO requires a region, but ignores it
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin123",
  },
  forcePathStyle: true, // Required for MinIO
})

/** Bucket name for storing receipts */
const BUCKET_NAME = process.env.S3_BUCKET || "receipts"

/**
 * Upload a file to MinIO/S3 storage.
 * 
 * @param buffer - File content as a Buffer
 * @param key - Storage key (path) for the file, e.g., "receipts/2024/01/tx-123.jpg"
 * @param contentType - MIME type of the file, e.g., "image/jpeg"
 * @returns Signed URL for accessing the uploaded file (7-day expiry)
 * @throws S3ServiceException on upload failure
 * 
 * @example
 * ```typescript
 * const buffer = Buffer.from(await file.arrayBuffer())
 * const url = await uploadFile(buffer, "receipts/2024/01/tx-123.jpg", "image/jpeg")
 * ```
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await s3Client.send(command)

  // Return the key instead of a signed URL for secure storage in DB
  return key
}

/**
 * Generate a presigned URL for uploading files directly from the browser.
 * Useful for large file uploads to bypass server memory limitations.
 * 
 * @param key - Storage key (path) for the file
 * @param contentType - Expected MIME type of the file
 * @param expiresIn - URL expiry time in seconds (default: 3600)
 * @returns Presigned URL for PUT request
 * 
 * @example
 * ```typescript
 * const uploadUrl = await getUploadPresignedUrl("receipts/2024/01/tx-123.jpg", "image/jpeg")
 * // Use with fetch: await fetch(uploadUrl, { method: 'PUT', body: file })
 * ```
 */
export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Generate a presigned URL for downloading/viewing a file.
 * 
 * @param key - Storage key (path) of the file
 * @param expiresIn - URL expiry time in seconds (default: 3600)
 * @returns Presigned URL for GET request
 * 
 * @example
 * ```typescript
 * const viewUrl = await getDownloadPresignedUrl("receipts/2024/01/tx-123.jpg", 86400)
 * // URL is valid for 24 hours
 * ```
 */
export async function getDownloadPresignedUrl(
  key: string,
  expiresIn = 60 // Default to 60 seconds for redirect proxy
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Delete a file from MinIO/S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Extract key from full URL
 */
export function getKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // URL format: http://host:port/bucket/key
    const pathParts = urlObj.pathname.split("/").filter(Boolean)
    if (pathParts.length >= 2) {
      // Remove bucket name, return the rest as key
      return pathParts.slice(1).join("/")
    }
    return null
  } catch {
    return null
  }
}

export { s3Client, BUCKET_NAME }
