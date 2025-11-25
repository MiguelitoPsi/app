import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('user-role')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao limpar cookie de role:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
