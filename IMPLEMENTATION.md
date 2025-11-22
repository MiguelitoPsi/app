# App PSI - Guerreiro da Mente 🧠

Aplicativo de bem-estar psicológico gamificado com IA, construído com Next.js 15, tRPC, Drizzle ORM, e Better Auth.

## 🚀 Tecnologias Implementadas

### Core Stack
- **Next.js 15** - App Router com Server Components
- **React 19** - Latest version com Server Actions support
- **TypeScript** - Type-safe desenvolvimento
- **Tailwind CSS** - Utility-first styling

### Backend & Database
- **tRPC** - End-to-end typesafe APIs
- **Drizzle ORM** - Lightweight TypeScript ORM
- **Better SQLite3** - Fast, reliable SQL database
- **Zod** - Runtime type validation

### Authentication
- **Better Auth** - Modern authentication library
- Role-based access control (Admin, Psychologist, Patient)
- Email/password authentication
- Session management com cookies

### AI & Optimization
- **Google Gemini 2.5 Flash-Lite** - Latest AI model
- **TOON Format** - Token-optimized data serialization (~40% token reduction)
- Structured AI prompts for CBT analysis, journal insights, meditation scripts

### Code Quality
- **Biome** - Fast linter and formatter (replaces ESLint + Prettier)
- **TypeScript Strict Mode** - Maximum type safety

## 📁 Estrutura do Projeto

```
app-psi/
├── app/
│   ├── (app)/                    # Protected app routes
│   │   ├── layout.tsx           # App layout with bottom navigation
│   │   ├── home/                # Dashboard
│   │   ├── journal/             # Journal entries (TODO)
│   │   ├── meditation/          # Meditation sessions (TODO)
│   │   ├── profile/             # User profile (TODO)
│   │   ├── rewards/             # Rewards system (TODO)
│   │   ├── routine/             # Task management (TODO)
│   │   └── therapist/           # AI therapist chat (TODO)
│   ├── auth/
│   │   ├── signin/              # Sign in page
│   │   └── signup/              # Sign up page
│   ├── api/
│   │   ├── auth/[...all]/       # Better Auth endpoints
│   │   └── trpc/[trpc]/         # tRPC API handler
│   ├── layout.tsx               # Root layout with tRPC provider
│   └── page.tsx                 # Landing page
├── lib/
│   ├── auth.ts                  # Better Auth configuration
│   ├── db/
│   │   ├── index.ts             # Database client
│   │   ├── schema.ts            # Drizzle schema definitions
│   │   └── seed.ts              # Database seeding script
│   └── trpc/
│       ├── Provider.tsx         # tRPC React client
│       ├── root.ts              # Root tRPC router
│       ├── trpc.ts              # tRPC configuration & middleware
│       └── routers/
│           ├── ai.ts            # AI operations (TOON-optimized)
│           ├── journal.ts       # Journal CRUD
│           ├── reward.ts        # Rewards system
│           ├── task.ts          # Task management
│           └── user.ts          # User profile & stats
├── components/
│   ├── Avatar.tsx               # User avatar component
│   └── BottomNav.tsx            # Bottom navigation (legacy - replaced by layout)
├── middleware.ts                # Route protection & auth
├── biome.json                   # Biome configuration
├── drizzle.config.ts            # Drizzle Kit configuration
└── package.json
```

## 🗄️ Database Schema

### Tables
- **users** - User accounts with gamification stats (level, XP, coins, streak)
- **sessions** - Better Auth sessions
- **accounts** - OAuth accounts (future: Google login)
- **tasks** - User tasks with priority, category, rewards
- **journal_entries** - Emotional journal with AI analysis
- **rewards** - Claimable rewards with coin costs
- **badges** - User achievement badges
- **meditation_sessions** - Meditation tracking
- **user_stats** - Aggregated user statistics

## 🔐 Authentication & Roles

### User Roles
1. **Admin** - Full system access, user management
2. **Psychologist** - View/manage patient data, analytics
3. **Patient** - Personal journal, routine, rewards

### Protected Routes
All `/home`, `/journal`, `/meditation`, etc. require authentication. Middleware redirects unauthenticated users to `/auth/signin`.

## 🤖 AI Integration com TOON

### Token Optimization
Todas as chamadas de IA usam o formato **TOON** para reduzir custos:

```typescript
// Antes (JSON): ~500 tokens
const data = { user_input: { emotion: "anxious", thought: "I can't do this" } }

// Depois (TOON): ~300 tokens
const toonData = encodeTOON(data)
```

### AI Routers Implementados
- `ai.analyzeThought` - CBT thought analysis
- `ai.analyzeJournalEntry` - Emotional insights
- `ai.generateMeditationScript` - Custom meditation scripts
- `ai.chatTherapist` - Conversational therapy

## 🚦 Como Rodar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie `.env.example` para `.env.local` e preencha:

```env
DATABASE_URL=./sqlite.db
GOOGLE_AI_API_KEY=your_api_key_here
BETTER_AUTH_SECRET=generate_random_32_char_secret
BETTER_AUTH_URL=http://localhost:3000
```

### 3. Criar Database
```bash
npm run db:push
npm run db:seed
```

### 4. Rodar Desenvolvimento
```bash
npm run dev
```

Acesse: http://localhost:3000

### Credenciais de Teste
- **Admin**: admin@app-psi.com / admin123
- **Paciente**: miguel@app-psi.com / miguel123

## 📝 Scripts Disponíveis

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Check code quality
npm run lint:fix      # Fix linting issues
npm run format        # Format code with Biome
npm run db:generate   # Generate Drizzle migrations
npm run db:migrate    # Run migrations
npm run db:push       # Push schema to database
npm run db:studio     # Open Drizzle Studio (DB GUI)
npm run db:seed       # Seed database with initial data
```

## 🎯 Próximas Etapas (Pendentes)

### Views para Migrar
As seguintes views ainda precisam ser convertidas para rotas do Next.js:

1. **JournalView** → `/journal/page.tsx`
   - Criar/editar entradas de diário
   - Integrar `trpc.journal.create` e `trpc.ai.analyzeJournalEntry`

2. **MeditationView** → `/meditation/page.tsx`
   - Temporizador de meditação
   - Integrar `trpc.ai.generateMeditationScript`

3. **ProfileView** → `/profile/page.tsx`
   - Editar perfil, avatar, preferências
   - Badges e conquistas
   - Integrar `trpc.user.updateProfile`

4. **RewardsView** → `/rewards/page.tsx`
   - Listar recompensas disponíveis
   - Resgatar com moedas
   - Integrar `trpc.reward.claim`

5. **RoutineView** → `/routine/page.tsx`
   - Gerenciar tarefas diárias
   - Completar tarefas e ganhar XP/moedas
   - Integrar `trpc.task.*` mutations

6. **TherapistView** → `/therapist/page.tsx`
   - Chat com IA terapeuta
   - Histórico de conversas
   - Integrar `trpc.ai.chatTherapist`

### Biome Linting
Executar `npm run lint` e resolver quaisquer problemas restantes nos componentes legados.

## 🔧 Troubleshooting

### Database Issues
```bash
# Reset database
rm sqlite.db sqlite.db-shm sqlite.db-wal
npm run db:push
npm run db:seed
```

### Auth Issues
- Verifique se `BETTER_AUTH_SECRET` tem pelo menos 32 caracteres
- Limpe cookies do navegador
- Verifique se `BETTER_AUTH_URL` corresponde à URL do servidor

### tRPC Issues
- Certifique-se de que o servidor está rodando
- Verifique o console do navegador para erros de rede
- Verifique se `superjson` está configurado corretamente

## 📚 Documentação Adicional

- [Next.js Docs](https://nextjs.org/docs)
- [tRPC Docs](https://trpc.io/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://www.better-auth.com/)
- [TOON Format](https://github.com/toon-format/toon)
- [Gemini API](https://ai.google.dev/gemini-api/docs)

## 🤝 Contribuindo

Este projeto foi migrado de uma SPA para uma aplicação full-stack. Contribuições são bem-vindas para completar as views pendentes!

## 📄 Licença

MIT
