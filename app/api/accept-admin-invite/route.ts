import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { adminInvites, users } from '@/lib/db/schema'

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
    const invite = await db.query.adminInvites.findFirst({
      where: eq(adminInvites.token, token),
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite.status === 'accepted') {
      return NextResponse.json({ success: true, role: invite.role, message: 'Already accepted' })
    }

    if (invite.status === 'expired' || new Date() > invite.expiresAt) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 })
    }

    // Update user role
    await db
      .update(users)
      .set({ role: invite.role as 'admin' | 'psychologist' | 'patient', updatedAt: new Date() })
      .where(eq(users.id, session.user.id))

    // Mark invite as accepted
    await db
      .update(adminInvites)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: session.user.id,
      })
      .where(eq(adminInvites.id, invite.id))

    // Create response with cookie
    const response = NextResponse.json({ success: true, role: invite.role })

    // Set role cookie for middleware
    response.cookies.set('user-role', invite.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error) {
    console.error('Error accepting admin invite:', error)
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
  }
}
