import { createHash } from 'node:crypto'
import { nanoid } from 'nanoid'
import { db } from './index'
import { badges, rewards, tasks, userStats, users } from './schema'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

async function seed() {
  console.log('🌱 Seeding database...')

  // Create initial admin user
  const adminId = nanoid()
  const _hashedPassword = hashPassword('admin123')

  await db.insert(users).values({
    id: adminId,
    name: 'Admin',
    email: 'admin@app-psi.com',
    emailVerified: true,
    role: 'admin',
    level: 10,
    experience: 1000,
    streak: 30,
    coins: 500,
  })

  // Create Miguel as a patient
  const miguelId = nanoid()
  const _miguelPassword = hashPassword('miguel123')

  await db.insert(users).values({
    id: miguelId,
    name: 'Miguel',
    email: 'miguel@app-psi.com',
    emailVerified: true,
    role: 'patient',
    level: 3,
    experience: 250,
    streak: 7,
    coins: 120,
    preferences: {
      notifications: true,
      theme: 'light',
      language: 'pt-BR',
    },
  })

  // Create user stats for both users
  await db.insert(userStats).values([
    {
      userId: adminId,
      totalTasks: 50,
      completedTasks: 48,
      totalMeditations: 30,
      totalJournalEntries: 25,
      longestStreak: 30,
    },
    {
      userId: miguelId,
      totalTasks: 15,
      completedTasks: 10,
      totalMeditations: 8,
      totalJournalEntries: 12,
      longestStreak: 7,
    },
  ])

  // Create sample tasks for Miguel
  const sampleTasks = [
    {
      id: nanoid(),
      userId: miguelId,
      title: 'Respiração Consciente - 5 minutos',
      description: 'Praticar respiração profunda pela manhã',
      category: 'mindfulness',
      completed: false,
      priority: 'high' as const,
      experience: 15,
      coins: 10,
      metadata: {
        icon: '🧘',
        color: '#4F46E5',
      },
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: 'Diário da Gratidão',
      description: 'Escrever 3 coisas pelas quais sou grato',
      category: 'journal',
      completed: true,
      priority: 'medium' as const,
      completedAt: new Date(),
      experience: 10,
      coins: 5,
      metadata: {
        icon: '📝',
        color: '#10B981',
      },
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: 'Caminhada de 20 minutos',
      description: 'Exercício leve ao ar livre',
      category: 'exercise',
      completed: false,
      priority: 'medium' as const,
      experience: 20,
      coins: 15,
      metadata: {
        icon: '🚶',
        color: '#F59E0B',
      },
    },
  ]

  await db.insert(tasks).values(sampleTasks)

  // Create sample rewards
  const sampleRewards = [
    {
      id: nanoid(),
      userId: miguelId,
      title: 'Assistir um episódio da série favorita',
      description: 'Recompensa relaxante após atingir metas',
      cost: 50,
      claimed: false,
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: 'Comprar um livro novo',
      description: 'Investir em autodesenvolvimento',
      cost: 150,
      claimed: false,
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: 'Dia de spa em casa',
      description: 'Autocuidado completo',
      cost: 200,
      claimed: false,
    },
  ]

  await db.insert(rewards).values(sampleRewards)

  // Create sample badges
  const sampleBadges = [
    {
      id: nanoid(),
      userId: miguelId,
      badgeId: 'first-journal',
      title: 'Primeira Entrada no Diário',
      description: 'Completou sua primeira entrada no diário',
      icon: '📔',
    },
    {
      id: nanoid(),
      userId: miguelId,
      badgeId: 'week-streak',
      title: 'Semana Dedicada',
      description: 'Manteve uma sequência de 7 dias',
      icon: '🔥',
    },
  ]

  await db.insert(badges).values(sampleBadges)

  console.log('✅ Database seeded successfully!')
  console.log('\n📝 Login credentials:')
  console.log('Admin: admin@app-psi.com / admin123')
  console.log('Patient (Miguel): miguel@app-psi.com / miguel123')

  process.exit(0)
}

seed().catch((error) => {
  console.error('❌ Error seeding database:', error)
  process.exit(1)
})
