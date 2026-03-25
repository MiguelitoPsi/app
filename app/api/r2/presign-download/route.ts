import { and, eq, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sessionDocuments, uploadJobs, users } from '@/lib/db/schema'
import { generatePresignedDownloadUrl } from '@/lib/r2/client'

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { r2Key, type } = body as {
      r2Key: string
      type?: 'upload-job' | 'document'
    }

    if (!r2Key) {
      return NextResponse.json({ error: 'r2Key é obrigatório' }, { status: 400 })
    }

    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verify user has access to this file
    let hasAccess = false

    if (type === 'document' || !type) {
      // Check in sessionDocuments
      const document = await db.query.sessionDocuments.findFirst({
        where: and(
          eq(sessionDocuments.r2Key, r2Key),
          or(
            eq(sessionDocuments.therapistId, session.user.id),
            eq(sessionDocuments.patientId, session.user.id)
          )
        ),
      })
      if (document) hasAccess = true
    }

    if ((type === 'upload-job' || !type) && !hasAccess) {
      // Check in uploadJobs
      const job = await db.query.uploadJobs.findFirst({
        where: and(
          eq(uploadJobs.r2Key, r2Key),
          or(eq(uploadJobs.therapistId, session.user.id), eq(uploadJobs.patientId, session.user.id))
        ),
      })
      if (job) hasAccess = true
    }

    // Admin has access to all files
    if (user.role === 'admin') {
      hasAccess = true
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado a este arquivo' }, { status: 403 })
    }

    // Generate presigned download URL
    const downloadUrl = await generatePresignedDownloadUrl({
      key: r2Key,
      expiresIn: 3600, // 1 hour
    })

    return NextResponse.json({
      downloadUrl,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error('Error generating presigned download URL:', error)
    return NextResponse.json({ error: 'Erro ao gerar URL de download' }, { status: 500 })
  }
}
