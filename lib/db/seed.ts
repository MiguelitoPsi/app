import { subDays } from "date-fns";
import { nanoid } from "nanoid";
import { db } from "./index";
import {
  badges,
  journalEntries,
  meditationSessions,
  moodHistory,
  notifications,
  patientInvites,
  psychologistPatients,
  rewards,
  tasks,
  userStats,
  users,
} from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  console.log("🧹 Cleaning existing data...");
  await db.delete(notifications);
  await db.delete(patientInvites);
  await db.delete(psychologistPatients);
  await db.delete(badges);
  await db.delete(rewards);
  await db.delete(moodHistory);
  await db.delete(meditationSessions);
  await db.delete(journalEntries);
  await db.delete(tasks);
  await db.delete(userStats);
  await db.delete(users);

  // ===== USERS =====
  // Psychologist
  const psychologistId = nanoid();
  await db.insert(users).values({
    id: psychologistId,
    name: "Dra. Ana Silva",
    email: "ana.silva@clinica.com",
    emailVerified: true,
    role: "psychologist",
    level: 1,
    experience: 0,
    streak: 0,
    coins: 0,
    preferences: {
      notifications: true,
      theme: "light",
      language: "pt-BR",
    },
  });

  // Patient 1: Miguel
  const miguelId = nanoid();
  const now = new Date();
  const yesterday = subDays(now, 1);

  await db.insert(users).values({
    id: miguelId,
    name: "Miguel Santos",
    email: "miguel@app-psi.com",
    emailVerified: true,
    role: "patient",
    level: 4,
    experience: 320,
    streak: 8,
    coins: 285,
    lastTaskXpDate: yesterday,
    lastJournalXpDate: yesterday,
    lastMeditationXpDate: yesterday,
    lastMoodXpDate: yesterday,
    preferences: {
      notifications: true,
      theme: "light",
      language: "pt-BR",
      avatar_config: {
        skin: "light",
        hair: "short-brown",
        eyes: "brown",
        accessories: ["glasses"],
      },
    },
  });

  // Patient 2: Julia
  const juliaId = nanoid();
  await db.insert(users).values({
    id: juliaId,
    name: "Julia Oliveira",
    email: "julia@app-psi.com",
    emailVerified: true,
    role: "patient",
    level: 2,
    experience: 150,
    streak: 3,
    coins: 120,
    lastTaskXpDate: now,
    lastJournalXpDate: now,
    preferences: {
      notifications: true,
      theme: "dark",
      language: "pt-BR",
      avatar_config: {
        skin: "medium",
        hair: "long-black",
        eyes: "green",
        accessories: [],
      },
    },
  });

  // ===== USER STATS =====
  await db.insert(userStats).values([
    {
      userId: psychologistId,
      totalTasks: 0,
      completedTasks: 0,
      totalMeditations: 0,
      totalJournalEntries: 0,
      longestStreak: 0,
    },
    {
      userId: miguelId,
      totalTasks: 23,
      completedTasks: 18,
      totalMeditations: 12,
      totalJournalEntries: 15,
      longestStreak: 8,
    },
    {
      userId: juliaId,
      totalTasks: 10,
      completedTasks: 6,
      totalMeditations: 5,
      totalJournalEntries: 8,
      longestStreak: 3,
    },
  ]);

  // ===== PSYCHOLOGIST-PATIENT RELATIONSHIPS =====
  await db.insert(psychologistPatients).values([
    {
      id: nanoid(),
      psychologistId,
      patientId: miguelId,
      isPrimary: true,
    },
    {
      id: nanoid(),
      psychologistId,
      patientId: juliaId,
      isPrimary: true,
    },
  ]);

  // ===== TASKS =====
  const taskData = [
    // Miguel's tasks
    {
      id: nanoid(),
      userId: miguelId,
      title: "Meditação Matinal",
      description: "Praticar 10 minutos de meditação ao acordar",
      category: "mindfulness",
      completed: true,
      priority: "high" as const,
      completedAt: new Date(yesterday),
      experience: 30,
      coins: 20,
      frequency: "daily" as const,
      metadata: { icon: "🧘", color: "#4F46E5" },
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: "Respiração 4-7-8",
      description: "Técnica de respiração profunda antes de dormir",
      category: "mindfulness",
      completed: false,
      priority: "high" as const,
      experience: 30,
      coins: 20,
      frequency: "daily" as const,
      metadata: { icon: "🌙", color: "#6366F1" },
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: "Diário da Gratidão",
      description: "Escrever 3 coisas pelas quais sou grato",
      category: "journal",
      completed: true,
      priority: "medium" as const,
      completedAt: new Date(yesterday),
      experience: 20,
      coins: 15,
      frequency: "daily" as const,
      metadata: { icon: "📝", color: "#10B981" },
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: "Caminhada 20min",
      description: "Exercício leve ao ar livre",
      category: "exercise",
      completed: false,
      priority: "medium" as const,
      experience: 20,
      coins: 15,
      frequency: "daily" as const,
      metadata: { icon: "🚶", color: "#F59E0B" },
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: "Revisão Semanal",
      description: "Refletir sobre progresso da semana",
      category: "reflection",
      completed: false,
      priority: "low" as const,
      experience: 10,
      coins: 10,
      frequency: "weekly" as const,
      weekDays: [0], // Domingo
      metadata: { icon: "📊", color: "#8B5CF6" },
    },
    // Julia's tasks
    {
      id: nanoid(),
      userId: juliaId,
      title: "Yoga Matinal",
      description: "15 minutos de yoga ao acordar",
      category: "exercise",
      completed: true,
      priority: "high" as const,
      completedAt: new Date(),
      experience: 30,
      coins: 20,
      frequency: "daily" as const,
      metadata: { icon: "🧘‍♀️", color: "#EC4899" },
    },
    {
      id: nanoid(),
      userId: juliaId,
      title: "Leitura 30min",
      description: "Ler livro de desenvolvimento pessoal",
      category: "learning",
      completed: false,
      priority: "medium" as const,
      experience: 20,
      coins: 15,
      frequency: "daily" as const,
      metadata: { icon: "📚", color: "#3B82F6" },
    },
  ];
  await db.insert(tasks).values(taskData);

  // ===== JOURNAL ENTRIES =====
  await db.insert(journalEntries).values([
    {
      id: nanoid(),
      userId: miguelId,
      title: "Primeiro dia de progresso",
      content:
        "Hoje consegui completar todas as minhas tarefas. Me sinto motivado e ansioso para continuar essa jornada de autocuidado.",
      mood: "happy",
      aiAnalysis:
        "Análise: Sentimento predominantemente positivo. Motivação alta para mudança. Sugestão: Manter rotina consistente para consolidar hábitos.",
      createdAt: subDays(now, 7),
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: "Reflexão sobre ansiedade",
      content:
        "Percebi que a meditação matinal tem me ajudado a lidar melhor com momentos de ansiedade durante o dia. Quero explorar mais técnicas de respiração.",
      mood: "calm",
      aiAnalysis:
        "Análise: Autoconsciência em desenvolvimento. Identificação de estratégias eficazes. Sugestão: Incorporar técnicas de grounding para momentos de crise.",
      createdAt: subDays(now, 5),
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: "Gratidão pela jornada",
      content:
        "Uma semana inteira mantendo a sequência! Me sinto mais equilibrado e focado. As pequenas conquistas estão fazendo diferença.",
      mood: "grateful",
      aiAnalysis:
        "Análise: Reconhecimento de progresso. Gratidão como ferramenta terapêutica. Sugestão: Continuar registro de vitórias para reforço positivo.",
      createdAt: subDays(now, 1),
    },
    {
      id: nanoid(),
      userId: juliaId,
      title: "Começando minha jornada",
      content:
        "Primeira entrada no diário. Decidi que preciso cuidar melhor da minha saúde mental. Vou tentar ser consistente.",
      mood: "hopeful",
      createdAt: subDays(now, 3),
    },
  ]);

  // ===== MEDITATION SESSIONS =====
  await db.insert(meditationSessions).values([
    {
      id: nanoid(),
      userId: miguelId,
      duration: 600, // 10min
      type: "guided",
      createdAt: subDays(now, 7),
    },
    {
      id: nanoid(),
      userId: miguelId,
      duration: 900, // 15min
      type: "breathing",
      createdAt: subDays(now, 5),
    },
    {
      id: nanoid(),
      userId: miguelId,
      duration: 1200, // 20min
      type: "guided",
      createdAt: subDays(now, 2),
    },
    {
      id: nanoid(),
      userId: juliaId,
      duration: 300, // 5min
      type: "breathing",
      createdAt: subDays(now, 3),
    },
    {
      id: nanoid(),
      userId: juliaId,
      duration: 600, // 10min
      type: "guided",
      createdAt: subDays(now, 1),
    },
  ]);

  // ===== MOOD HISTORY =====
  const moods = [
    "happy",
    "calm",
    "anxious",
    "sad",
    "grateful",
    "stressed",
    "angry",
  ] as const;
  const moodData: Array<{
    id: string;
    userId: string;
    mood: (typeof moods)[number];
    xpAwarded: number;
    createdAt: Date;
  }> = [];
  for (let i = 7; i >= 0; i--) {
    // Miguel: trending positive
    moodData.push({
      id: nanoid(),
      userId: miguelId,
      mood: i > 3 ? moods[Math.floor(Math.random() * 3)] : moods[0], // More positive recently
      xpAwarded: i === 0 ? 0 : 20, // No XP today yet
      createdAt: subDays(now, i),
    });
    // Julia: mixed emotions
    if (i <= 3) {
      moodData.push({
        id: nanoid(),
        userId: juliaId,
        mood: moods[Math.floor(Math.random() * moods.length)],
        xpAwarded: i === 0 ? 0 : 20,
        createdAt: subDays(now, i),
      });
    }
  }
  await db.insert(moodHistory).values(moodData);

  // ===== REWARDS =====
  await db.insert(rewards).values([
    {
      id: nanoid(),
      userId: miguelId,
      title: "Assistir episódio da série favorita",
      description: "Recompensa relaxante após atingir metas",
      cost: 50,
      status: "approved",
      claimed: true,
      claimedAt: subDays(now, 3),
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: "Comprar um livro novo",
      description: "Investir em autodesenvolvimento",
      cost: 150,
      status: "approved",
      claimed: false,
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: "Dia de spa em casa",
      description: "Autocuidado completo",
      cost: 200,
      status: "pending",
      claimed: false,
    },
    {
      id: nanoid(),
      userId: miguelId,
      title: "Jantar no restaurante favorito",
      description: "Celebrar conquistas da semana",
      cost: 120,
      status: "approved",
      claimed: false,
    },
    {
      id: nanoid(),
      userId: juliaId,
      title: "Sessão de cinema",
      description: "Momento de lazer e descanso",
      cost: 80,
      status: "approved",
      claimed: false,
    },
  ]);

  // ===== BADGES =====
  await db.insert(badges).values([
    {
      id: nanoid(),
      userId: miguelId,
      badgeId: "apprentice",
      title: "Aprendiz",
      description: "Complete 5 tarefas",
      icon: "🌱",
      unlockedAt: subDays(now, 6),
    },
    {
      id: nanoid(),
      userId: miguelId,
      badgeId: "doer",
      title: "Realizador",
      description: "Complete 10 tarefas",
      icon: "⚡",
      unlockedAt: subDays(now, 3),
    },
    {
      id: nanoid(),
      userId: juliaId,
      badgeId: "apprentice",
      title: "Aprendiz",
      description: "Complete 5 tarefas",
      icon: "🌱",
      unlockedAt: subDays(now, 2),
    },
  ]);

  // ===== NOTIFICATIONS =====
  await db.insert(notifications).values([
    {
      id: nanoid(),
      userId: miguelId,
      type: "badge_unlocked",
      title: "Novo Badge Desbloqueado!",
      message: 'Você conquistou o badge "Realizador"',
      isRead: false,
      metadata: { badgeId: "doer" },
      createdAt: subDays(now, 3),
    },
    {
      id: nanoid(),
      userId: miguelId,
      type: "reward_approved",
      title: "Recompensa Aprovada",
      message: 'Sua recompensa "Jantar no restaurante favorito" foi aprovada',
      isRead: true,
      createdAt: subDays(now, 2),
    },
    {
      id: nanoid(),
      userId: miguelId,
      type: "streak_milestone",
      title: "Sequência de 7 Dias!",
      message: "Parabéns! Você manteve sua sequência por uma semana inteira",
      isRead: false,
      createdAt: subDays(now, 1),
    },
    {
      id: nanoid(),
      userId: juliaId,
      type: "badge_unlocked",
      title: "Primeiro Badge!",
      message: 'Você conquistou o badge "Aprendiz"',
      isRead: false,
      createdAt: subDays(now, 2),
    },
  ]);

  // ===== PATIENT INVITES =====
  await db.insert(patientInvites).values([
    {
      id: nanoid(),
      psychologistId,
      email: "carlos@example.com",
      name: "Carlos Pereira",
      phone: "11987654321",
      birthdate: "1990-05-15",
      gender: "male",
      address: {
        street: "Rua das Flores",
        number: "123",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
      },
      token: nanoid(32),
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      id: nanoid(),
      psychologistId,
      email: "maria@example.com",
      name: "Maria Costa",
      phone: "11912345678",
      birthdate: "1985-08-20",
      gender: "female",
      address: {
        street: "Av. Paulista",
        number: "500",
        city: "São Paulo",
        state: "SP",
        zipCode: "01310-100",
      },
      token: nanoid(32),
      status: "expired",
      expiresAt: subDays(now, 1), // Expired yesterday
    },
  ]);

  console.log("✅ Database seeded successfully!");
  console.log("\n📝 Login credentials:");
  console.log("Psychologist: ana.silva@clinica.com");
  console.log("Patient (Miguel): miguel@app-psi.com");
  console.log("Patient (Julia): julia@app-psi.com");
  console.log("\n📊 Seed summary:");
  console.log("- 3 users (1 psychologist, 2 patients)");
  console.log("- 2 psychologist-patient relationships");
  console.log("- 7 tasks (5 for Miguel, 2 for Julia)");
  console.log("- 4 journal entries");
  console.log("- 5 meditation sessions");
  console.log("- 16 mood history records (8 for Miguel, 4 for Julia)");
  console.log("- 5 rewards (4 for Miguel, 1 for Julia)");
  console.log("- 3 badges");
  console.log("- 4 notifications");
  console.log("- 2 patient invites (1 pending, 1 expired)");

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Error seeding database:", error);
  process.exit(1);
});
