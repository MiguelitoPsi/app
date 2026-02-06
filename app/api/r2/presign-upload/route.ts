import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadJobs, users } from "@/lib/db/schema";
import {
  generatePresignedUploadUrl,
  generateR2Key,
  getPublicUrl,
  R2_CONFIG,
} from "@/lib/r2/client";

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, filename, contentType, fileSize, purpose } = body as {
      patientId: string;
      filename: string;
      contentType: string;
      fileSize: number;
      purpose: "transcription" | "document";
    };

    // Validate required fields
    const hasRequiredFields =
      patientId && filename && contentType && fileSize && purpose;
    if (!hasRequiredFields) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: patientId, filename, contentType, fileSize, purpose",
        },
        { status: 400 },
      );
    }

    // Verify user is a psychologist
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user || (user.role !== "psychologist" && user.role !== "admin")) {
      return NextResponse.json(
        { error: "Apenas terapeutas podem fazer upload de arquivos" },
        { status: 403 },
      );
    }

    // Generate unique job ID and R2 key
    const jobId = nanoid();
    const r2Key = generateR2Key({
      purpose,
      therapistId: session.user.id,
      patientId,
      fileId: jobId,
      filename,
    });

    // Generate presigned URL for upload
    const presignedUrl = await generatePresignedUploadUrl({
      key: r2Key,
      contentType,
      expiresIn: 3600, // 1 hour
    });

    // Get public URL (if bucket is public)
    const publicUrl = getPublicUrl(r2Key);

    // Create upload job record
    const [uploadJob] = await db
      .insert(uploadJobs)
      .values({
        id: jobId,
        patientId,
        therapistId: session.user.id,
        r2Key,
        r2Url: publicUrl,
        originalFilename: filename,
        mimeType: contentType,
        fileSize,
        purpose,
        status: "pending",
        metadata: {},
      })
      .returning();

    return NextResponse.json({
      jobId: uploadJob.id,
      presignedUrl,
      r2Key,
      r2Url: publicUrl,
      bucket: R2_CONFIG.bucketName,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error generating presigned upload URL:", error);
    return NextResponse.json(
      { error: "Erro ao gerar URL de upload" },
      { status: 500 },
    );
  }
}
