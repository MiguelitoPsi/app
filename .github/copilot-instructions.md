# Nepsis - Guia do Copilot

App de saúde mental gamificada com sistema de XP, suporte a terapeutas e pacientes.

## Arquitetura Principal

```
app/              → Next.js App Router (pages)
  (app)/          → Rotas de PACIENTE (home, journal, meditation, profile, rewards, routine, therapist)
  (specialist)/   → Rotas de TERAPEUTA (dashboard, achievements, financial, reports, therapist-routine)
  admin/          → Rotas de ADMIN
  api/            → API routes (auth, trpc, analyze-thought)
views/            → Componentes de página (HomeView, JournalView, etc.)
components/       → Componentes reutilizáveis
lib/
  trpc/routers/   → Endpoints tRPC (task, journal, user, therapist-*, etc.)
  db/schema.ts    → Schema Drizzle ORM (SQLite/Turso)
  xp/index.ts     → Sistema centralizado de XP e moedas
  auth/roles.ts   → Configuração de roles e rotas permitidas
context/          → GameContext (estado global de gamificação)
```

## Stack Técnica

- **Framework**: Next.js 15 + React 19 (App Router)
- **API**: tRPC com React Query
- **DB**: Drizzle ORM + Turso (SQLite)
- **Auth**: better-auth
- **AI**: Gemini API (análise de pensamentos CBT)
- **Linting**: Ultracite/Biome

## Roles e Autenticação

Três roles com rotas isoladas:
- `patient` → `/home`, `/journal`, `/meditation`, `/profile`, `/rewards`, `/routine`, `/therapist`
- `psychologist` → `/dashboard`, `/therapist-routine`, `/reports`, `/financial`, `/achievements`
- `admin` → `/admin`

Role-based access via `<RoleGuard allowedRoles={['patient']}>` em layouts e `middleware.ts`.
Cookie `user-role` usado no middleware para redirecionamento.

## Sistema de XP (lib/xp/index.ts)

```typescript
// Valores centralizados - NUNCA hardcode XP/coins
import { XP_REWARDS, COIN_REWARDS, awardXPAndCoins, getMeditationRewards } from '@/lib/xp'

// Conceder XP em routers tRPC
const result = await awardXPAndCoins(ctx.db, userId, 'task', { priority: 'high' })
// { xpAwarded, coinsAwarded, newLevel, levelUp }

// Meditação com duração (5 min = 1.5x, 10 min = 2x)
const result = await awardXPAndCoins(ctx.db, userId, 'meditation', { meditationDuration: 300 })
// { xpAwarded: 45, coinsAwarded: 45, ... }
```

| Ação | XP | Coins |
|------|-----|-------|
| Task baixa/média/alta | 5/10/30 | 5/10/30 |
| Journal | 30 | 30 |
| Meditation (1-3 min) | 30 | 30 |
| Meditation (5 min) | 45 | 45 |
| Meditation (10 min) | 60 | 60 |
| Mood | 10 | 0 |

**Penalidade para tarefas transferidas/atrasadas:**
| Prioridade | 1º dia de atraso | 2+ dias de atraso |
|------------|------------------|-------------------|
| Baixa | 0% (zero XP/coins) | 0% |
| Média/Alta | 50% | 0% |

Cooldown: 1x/dia por tipo (exceto tasks = sempre).

## Padrões tRPC

Procedures disponíveis em `lib/trpc/trpc.ts`:
- `publicProcedure` → Sem auth
- `protectedProcedure` → Requer sessão
- `psychologistProcedure` → Psicólogo ou admin
- `adminProcedure` → Admin apenas

```typescript
// Exemplo de router
export const exampleRouter = router({
  myEndpoint: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ctx.db, ctx.user, ctx.session disponíveis
      return { success: true }
    }),
})
```

## Database (Drizzle)

Schema em `lib/db/schema.ts`. Principais tabelas:
- `users` (com level, experience, coins, streak, role)
- `tasks`, `journalEntries`, `rewards`, `badges`
- `psychologistPatients` (relacionamento terapeuta-paciente)
- `therapistStats`, `therapistAchievements`, `therapistTasks`

Comandos:
```bash
npm run db:generate  # Gerar migrations
npm run db:migrate   # Aplicar migrations
npm run db:push      # Push direto (dev)
npm run db:studio    # Drizzle Studio UI
```

## Componentes Importantes

- `GameProvider` (`context/GameContext.tsx`) → Estado global de gamificação
- `RoleGuard` → Proteção de rotas por role
- `BottomNav` / `TherapistBottomNav` → Navegação por role
- `AchievementManager` / `LevelUpManager` → Modais de conquistas

## Convenções do Projeto

1. **IDs**: Usar `nanoid()` para gerar IDs
2. **Soft delete**: `deletedAt` timestamp (nunca DELETE direto)
3. **Timestamps**: `createdAt`, `updatedAt` em todas as tabelas
4. **JSON fields**: Usar `.$type<T>()` para tipagem
5. **Datas**: `integer({ mode: 'timestamp' })` no Drizzle

## Comandos de Dev

```bash
npm run dev          # Servidor de desenvolvimento
npm run lint:fix     # Fix com Biome
npm run format       # Formatar código
npx ultracite fix    # Fix completo Ultracite
```

## Variáveis de Ambiente

Requeridas em `.env.local`:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `GEMINI_API_KEY`
- `BETTER_AUTH_SECRET`

---

# Ultracite Code Standards

Este projeto usa **Ultracite** (preset Biome) para linting e formatação.

## Quick Reference

- `npx ultracite fix` - Corrigir issues
- `npx ultracite check` - Verificar código

## Regras Principais

- TypeScript strict, preferir `unknown` sobre `any`
- Arrow functions, `for...of`, optional chaining (`?.`), nullish coalescing (`??`)
- `async/await` (nunca promise chains)
- React: hooks no top-level, key com IDs únicos, semantic HTML + ARIA
- Early returns, evitar ternários aninhados
- Next.js: usar `<Image>`, Server Components para data fetching
