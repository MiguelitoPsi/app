import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications, psychologistPatients, users } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { therapistId } = await request.json();

    if (!therapistId) {
      return NextResponse.json(
        { error: "Therapist ID is required" },
        { status: 400 }
      );
    }

    // Create the relationship
    await db.insert(psychologistPatients).values({
      id: nanoid(),
      psychologistId: therapistId,
      patientId: session.user.id,
      isPrimary: true,
    });

    // Get patient name for notification
    const patient = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    // Create notification for the psychologist
    await db.insert(notifications).values({
      id: nanoid(),
      userId: therapistId,
      type: "patient_linked",
      title: "Novo Paciente Vinculado",
      message: `${patient?.name || "Um novo paciente"} aceitou seu convite e está vinculado ao seu perfil.`,
      metadata: {
        patientId: session.user.id,
        patientName: patient?.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error linking therapist:", error);
    return NextResponse.json(
      { error: "Failed to link therapist" },
      { status: 500 }
    );
  }
}
