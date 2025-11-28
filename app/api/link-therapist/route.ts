import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifications, psychologistPatients, users } from '@/lib/db/schema'

export async function POST(request: Request) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { therapistId } = await request.json()

    if (!therapistId) {
      return NextResponse.json({ error: 'Therapist ID is required' }, { status: 400 })
    }

    // Verify the therapist exists and is a psychologist
    const therapist = await db.query.users.findFirst({
      where: and(eq(users.id, therapistId), eq(users.role, 'psychologist')),
    })

    if (!therapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    // Check if relationship already exists
    const existingRelationship = await db.query.psychologistPatients.findFirst({
      where: and(
        eq(psychologistPatients.psychologistId, therapistId),
        eq(psychologistPatients.patientId, session.user.id)
      ),
    })

    if (existingRelationship) {
      // Relationship already exists, return success
      return NextResponse.json({ success: true, message: 'Already linked' })
    }

    // Create the relationship
    await db.insert(psychologistPatients).values({
      id: nanoid(),
      psychologistId: therapistId,
      patientId: session.user.id,
      isPrimary: true,
    })

    // Limpar suspensão se o paciente estava desvinculado
    await db
      .update(users)
      .set({
        bannedAt: null,
        banReason: null,
        unlinkReason: null,
        unlinkedByTherapistId: null,
        unlinkedByTherapistName: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    // Get patient name for notification
    const patient = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    })

    // Create notification for the psychologist
    await db.insert(notifications).values({
      id: nanoid(),
      userId: therapistId,
      type: 'patient_linked',
      title: 'Novo Paciente Vinculado',
      message: `${patient?.name || 'Um novo paciente'} aceitou seu convite e está vinculado ao seu perfil.`,
      metadata: {
        patientId: session.user.id,
        patientName: patient?.name,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error linking therapist:', error)
    return NextResponse.json({ error: 'Failed to link therapist' }, { status: 500 })
  }
}
