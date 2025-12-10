import { nanoid } from 'nanoid'
import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { adminInvites } from '@/lib/db/schema'

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se é admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { role } = await req.json()
    if (role !== 'psychologist' && role !== 'admin') {
      return NextResponse.json({ error: 'Role não suportada' }, { status: 400 })
    }

    // Cria token único
    const token = nanoid(32)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 dias

    // Salva no banco usando Drizzle ORM
    await db.insert(adminInvites).values({
      id: nanoid(),
      token,
      role,
      createdBy: session.user.id,
      createdAt: now,
      expiresAt,
    })

    return NextResponse.json({ token })
  } catch (e) {
    console.error('Erro ao criar convite:', e)
    return NextResponse.json({ error: 'Erro ao criar convite' }, { status: 500 })
  }
}
