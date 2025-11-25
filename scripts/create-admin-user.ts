import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import { users } from '../lib/db/schema'

async function createAdminUser() {
  console.log('🌱 Criando usuário admin...')

  const baseUrl = 'http://127.0.0.1:3000'
  const email = 'psijmrodrigues@gmail.com'
  const password = 'Mig123@el!'
  const name = 'Admin Miguel'

  try {
    // Verificar se o usuário já existe
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser) {
      // Se já existe, apenas atualizar para admin
      await db.update(users).set({ role: 'admin' }).where(eq(users.email, email))
      console.log('✅ Usuário já existia, role atualizado para admin:', email)
      return
    }

    // Criar usuário via API de signup
    const signupResponse = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    })

    if (!signupResponse.ok) {
      const error = await signupResponse.text()
      console.log('⚠️ Erro no signup:', error)

      // Se falhou, tentar encontrar o usuário mesmo assim (pode já existir)
      const userAfterFail = await db.query.users.findFirst({
        where: eq(users.email, email),
      })

      if (userAfterFail) {
        await db.update(users).set({ role: 'admin' }).where(eq(users.email, email))
        console.log('✅ Usuário encontrado após erro, role atualizado para admin:', email)
        return
      }

      throw new Error(`Falha ao criar usuário: ${error}`)
    }

    console.log('✅ Usuário criado com sucesso')

    // Atualizar role para admin
    await db.update(users).set({ role: 'admin' }).where(eq(users.email, email))

    console.log('✅ Role atualizado para admin')
    console.log('')
    console.log('📧 Email:', email)
    console.log('🔑 Senha:', password)
    console.log('👤 Role: admin')
    console.log('')
    console.log('🎉 Usuário admin criado com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error)
    throw error
  }
}

createAdminUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
