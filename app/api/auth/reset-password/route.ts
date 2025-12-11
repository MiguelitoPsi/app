import bcrypt from 'bcrypt'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { accounts, passwordResetTokens, sessions, users } from '@/lib/db/schema'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    // Validação de entrada
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token inválido ou ausente' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Buscar token válido (não usado e não expirado)
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      ),
      with: {
        user: true,
      },
    })

    if (!resetToken) {
      // Log de auditoria para tentativa inválida (LGPD - segurança)
      console.log('[AUDIT] Invalid or expired password reset token attempted')
      return NextResponse.json(
        { error: 'Link de recuperação inválido ou expirado. Solicite um novo.' },
        { status: 400 }
      )
    }

    // Verificar se usuário existe e não está deletado/banido
    const user = resetToken.user
    if (!user || user.deletedAt || user.bannedAt) {
      console.log('[AUDIT] Password reset attempted for invalid user state')
      return NextResponse.json(
        { error: 'Não foi possível redefinir a senha. Entre em contato com o suporte.' },
        { status: 400 }
      )
    }

    // Hash da nova senha (salt automático pelo bcryptjs)
    const hashedPassword = await bcrypt.hash(password, 12)

    // Atualizar senha na tabela accounts
    const userAccount = await db.query.accounts.findFirst({
      where: and(eq(accounts.userId, user.id), eq(accounts.providerId, 'credential')),
    })

    if (userAccount) {
      await db
        .update(accounts)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, userAccount.id))
    } else {
      // Criar account se não existir (caso raro)
      const { nanoid } = await import('nanoid')
      await db.insert(accounts).values({
        id: nanoid(),
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
      })
    }

    // Marcar token como usado (LGPD - minimização de dados ativos)
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id))

    // Revogar todas as sessões do usuário por segurança
    await db.delete(sessions).where(eq(sessions.userId, user.id))

    // Atualizar timestamp do usuário
    await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, user.id))

    // Log de auditoria (LGPD - rastreabilidade)
    console.log(`[AUDIT] Password successfully reset for user ${user.id}`)

    return NextResponse.json(
      { message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[ERROR] Password reset failed:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Endpoint para verificar se um token é válido (usado pela página de reset)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token não fornecido' }, { status: 400 })
    }

    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      ),
    })

    if (!resetToken) {
      return NextResponse.json(
        { valid: false, error: 'Link expirado ou inválido' },
        { status: 200 }
      )
    }

    return NextResponse.json({ valid: true }, { status: 200 })
  } catch (error) {
    console.error('[ERROR] Token validation failed:', error)
    return NextResponse.json({ valid: false, error: 'Erro interno' }, { status: 500 })
  }
}
