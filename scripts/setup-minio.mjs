// Script to create the receipts bucket in MinIO
// Run this after MinIO is started: node scripts/setup-minio.mjs

import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin123",
  },
  forcePathStyle: true,
})

const BUCKET_NAME = process.env.S3_BUCKET || "receipts"

async function main() {
  try {
    // Check if bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }))
      console.log(`Bucket '${BUCKET_NAME}' already exists.`)
    } catch (error) {
      if (error?.name === "NotFound" || error?.$metadata?.httpStatusCode === 404) {
        // Create bucket
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }))
        console.log(`Bucket '${BUCKET_NAME}' created.`)
      } else {
        throw error
      }
    }

    // Set public read policy for the bucket
    const publicPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    }

    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify(publicPolicy),
      })
    )
    console.log(`Public read policy set for bucket '${BUCKET_NAME}'.`)

    console.log("\n✅ MinIO setup complete!")
    console.log(`   Bucket: ${BUCKET_NAME}`)
    console.log("   Console: http://localhost:9001")
    console.log("   Credentials: minioadmin / minioadmin123")
  } catch (error) {
    console.error("Error setting up MinIO:", error)
    process.exitCode = 1
  }
}

main()
