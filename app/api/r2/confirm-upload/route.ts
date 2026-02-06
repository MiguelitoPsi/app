import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadJobs, users } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId } = body as { jobId: string };

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId é obrigatório" },
        { status: 400 },
      );
    }

    // Verify user is a psychologist
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user || (user.role !== "psychologist" && user.role !== "admin")) {
      return NextResponse.json(
        { error: "Apenas terapeutas podem confirmar uploads" },
        { status: 403 },
      );
    }

    // Find the upload job
    const uploadJob = await db.query.uploadJobs.findFirst({
      where: and(
        eq(uploadJobs.id, jobId),
        eq(uploadJobs.therapistId, session.user.id),
      ),
    });

    if (!uploadJob) {
      return NextResponse.json(
        { error: "Job de upload não encontrado" },
        { status: 404 },
      );
    }

    if (uploadJob.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Upload já confirmado",
        uploadJob,
      });
    }

    // Update job status to completed
    const [updatedJob] = await db
      .update(uploadJobs)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(uploadJobs.id, jobId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Upload confirmado com sucesso",
      uploadJob: updatedJob,
    });
  } catch (error) {
    console.error("Error confirming upload:", error);
    return NextResponse.json(
      { error: "Erro ao confirmar upload" },
      { status: 500 },
    );
  }
}
