import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "nepsis-uploads";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://uploads.nepsisapp.com.br

const hasR2Credentials =
  CLOUDFLARE_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY;
if (!hasR2Credentials) {
  console.warn(
    "R2 credentials not configured. Upload functionality will not work.",
  );
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: CLOUDFLARE_ACCOUNT_ID
    ? `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

export const R2_CONFIG = {
  bucketName: R2_BUCKET_NAME,
  publicUrl: R2_PUBLIC_URL,
};

type PresignedUploadOptions = {
  key: string;
  contentType: string;
  expiresIn?: number; // seconds, default 1 hour
};

type PresignedDownloadOptions = {
  key: string;
  expiresIn?: number; // seconds, default 1 hour
};

/**
 * Generate a presigned URL for uploading a file directly to R2
 */
export async function generatePresignedUploadUrl({
  key,
  contentType,
  expiresIn = 3600,
}: PresignedUploadOptions): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(r2Client, command, {
    expiresIn,
    signableHeaders: new Set(["content-type"]),
  });

  return signedUrl;
}

/**
 * Generate a presigned URL for downloading a file from R2
 */
export async function generatePresignedDownloadUrl({
  key,
  expiresIn = 3600,
}: PresignedDownloadOptions): Promise<string> {
  // If bucket is public, return public URL directly
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`;
  }

  // Otherwise generate presigned URL
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Get the public URL for a file in R2 (for public buckets)
 */
export function getPublicUrl(key: string): string | null {
  if (!R2_PUBLIC_URL) return null;
  return `${R2_PUBLIC_URL}/${key}`;
}

type GenerateR2KeyParams = {
  purpose: "transcription" | "document";
  therapistId: string;
  patientId: string;
  fileId: string;
  filename: string;
};

/**
 * Generate a unique key for storing files in R2
 */
export function generateR2Key(params: GenerateR2KeyParams): string {
  const { purpose, therapistId, patientId, fileId, filename } = params;
  const ext = filename.split(".").pop() || "bin";
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");

  if (purpose === "transcription") {
    return `transcriptions/${therapistId}/${patientId}/${fileId}_${sanitizedFilename}`;
  }

  return `documents/${therapistId}/${patientId}/${fileId}.${ext}`;
}
