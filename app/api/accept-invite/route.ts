import { and, eq, ne } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifications, patientInvites, psychologistPatients, users } from '@/lib/db/schema'

export async function POST(request: Request) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find the invite
    const invite = await db.query.patientInvites.findFirst({
      where: eq(patientInvites.token, token),
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite.status === 'accepted') {
      return NextResponse.json({ success: true, message: 'Already accepted' })
    }

    if (invite.status === 'cancelled') {
      return NextResponse.json({ error: 'Invite was cancelled' }, { status: 400 })
    }

    if (new Date() > invite.expiresAt) {
      await db
        .update(patientInvites)
        .set({ status: 'expired' })
        .where(eq(patientInvites.id, invite.id))
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 })
    }

    // Check if relationship already exists with this therapist
    const existingRelationship = await db.query.psychologistPatients.findFirst({
      where: and(
        eq(psychologistPatients.psychologistId, invite.psychologistId),
        eq(psychologistPatients.patientId, session.user.id)
      ),
    })

    if (!existingRelationship) {
      // Check if patient has relationship with another therapist
      const existingOtherRelationship = await db.query.psychologistPatients.findFirst({
        where: and(
          eq(psychologistPatients.patientId, session.user.id),
          ne(psychologistPatients.psychologistId, invite.psychologistId)
        ),
      })

      // If patient has another therapist, remove that relationship first
      if (existingOtherRelationship) {
        await db
          .delete(psychologistPatients)
          .where(eq(psychologistPatients.id, existingOtherRelationship.id))
      }

      // Create the new relationship
      await db.insert(psychologistPatients).values({
        id: nanoid(),
        psychologistId: invite.psychologistId,
        patientId: session.user.id,
        isPrimary: true,
      })
    }

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

    // Update invite status
    await db
      .update(patientInvites)
      .set({ status: 'accepted' })
      .where(eq(patientInvites.id, invite.id))

    // Get patient name for notification
    const patient = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    })

    // Create notification for the psychologist
    await db.insert(notifications).values({
      id: nanoid(),
      userId: invite.psychologistId,
      type: 'patient_linked',
      title: 'Novo Paciente Vinculado',
      message: `${
        patient?.name || 'Um novo paciente'
      } aceitou seu convite e está vinculado ao seu perfil.`,
      metadata: {
        patientId: session.user.id,
        patientName: patient?.name,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error accepting invite:', error)
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
  }
}
