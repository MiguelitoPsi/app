async function createTestUsers() {
  console.log('🌱 Criando usuários de teste...')

  const baseUrl = 'http://127.0.0.1:3000'

  try {
    // Criar admin
    const adminResponse = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin',
        email: 'admin@app-psi.com',
        password: 'admin123',
      }),
    })

    if (adminResponse.ok) {
      console.log('✅ Admin criado: admin@app-psi.com / admin123')
    } else {
      const error = await adminResponse.text()
      console.log('⚠️ Admin:', error)
    }

    // Criar paciente Miguel
    const miguelResponse = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Miguel',
        email: 'miguel@app-psi.com',
        password: 'miguel123',
      }),
    })

    if (miguelResponse.ok) {
      console.log('✅ Paciente criado: miguel@app-psi.com / miguel123')
    } else {
      const error = await miguelResponse.text()
      console.log('⚠️ Paciente:', error)
    }

    console.log('🎉 Processo concluído!')
  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error)
    throw error
  }
}

createTestUsers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
