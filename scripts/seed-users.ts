import { auth } from '../lib/auth'

async function seedUsers() {
  console.log('🌱 Seeding users via Better Auth API...')

  try {
    // Create Admin
    const admin = await auth.api.signUpEmail({
      body: {
        email: 'admin@app-psi.com',
        password: 'admin123',
        name: 'Admin',
      },
    })
    console.log('✅ Admin created:', admin)

    // Create Patient
    const patient = await auth.api.signUpEmail({
      body: {
        email: 'miguel@app-psi.com',
        password: 'miguel123',
        name: 'Miguel',
      },
    })
    console.log('✅ Patient created:', patient)
  } catch (error) {
    console.error('❌ Error seeding users:', error)
  }
}

seedUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
