import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// MinIO configuration from environment variables
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: "us-east-1", // MinIO requires a region, but ignores it
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin123",
  },
  forcePathStyle: true, // Required for MinIO
})

const BUCKET_NAME = process.env.S3_BUCKET || "receipts"

/**
 * Upload a file to MinIO/S3
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

  // Return the URL to access the file
  // For MinIO, files are publicly accessible if bucket policy allows
  const endpoint = process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || "http://localhost:9000"
  return `${endpoint}/${BUCKET_NAME}/${key}`
}

/**
 * Generate a presigned URL for uploading (if needed for direct browser uploads)
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
 * Generate a presigned URL for downloading
 */
export async function getDownloadPresignedUrl(
  key: string,
  expiresIn = 3600
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
