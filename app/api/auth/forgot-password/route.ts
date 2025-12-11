import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { passwordResetTokens, users } from '@/lib/db/schema'
import { sendPasswordResetEmail } from '@/lib/email'

// Token válido por 1 hora (LGPD - minimização de dados e segurança)
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      // Resposta genérica para não revelar se o email existe (LGPD - segurança)
      return NextResponse.json(
        { message: 'Se o e-mail estiver cadastrado, você receberá instruções de recuperação.' },
        { status: 200 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Buscar usuário pelo email
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    })

    // Sempre retornar sucesso para não revelar se o email existe (LGPD - privacidade)
    if (!user || user.deletedAt) {
      // Log para auditoria (sem dados sensíveis)
      console.log('[AUDIT] Password reset requested for non-existent email')
      return NextResponse.json(
        { message: 'Se o e-mail estiver cadastrado, você receberá instruções de recuperação.' },
        { status: 200 }
      )
    }

    // Verificar se usuário está banido
    if (user.bannedAt) {
      console.log('[AUDIT] Password reset requested for banned user')
      return NextResponse.json(
        { message: 'Se o e-mail estiver cadastrado, você receberá instruções de recuperação.' },
        { status: 200 }
      )
    }

    // Gerar token seguro
    const token = nanoid(64)
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS)

    // Invalidar tokens anteriores do usuário (limpeza de dados - LGPD)
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.userId, user.id))

    // Criar novo token
    await db.insert(passwordResetTokens).values({
      id: nanoid(),
      userId: user.id,
      token,
      expiresAt,
    })

    // Enviar email
    const emailResult = await sendPasswordResetEmail(user.email, user.name, token)

    if (emailResult.success) {
      // Log de auditoria (LGPD - rastreabilidade)
      console.log(`[AUDIT] Password reset email sent to user ${user.id}`)
    } else {
      console.error('[ERROR] Failed to send password reset email:', emailResult.error)
      // Mesmo em caso de erro, retornamos sucesso para não revelar informações
    }

    return NextResponse.json(
      { message: 'Se o e-mail estiver cadastrado, você receberá instruções de recuperação.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[ERROR] Password reset request failed:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
