# Sistema de XP Centralizado

## 📍 Localização

Toda a lógica de XP, coins, níveis e condições de ganho foi centralizada no arquivo:

**`lib/xp/index.ts`**

## 🎯 O que foi centralizado

### 1. Constantes de Recompensa

```typescript
// Valores de XP por ação
XP_REWARDS = {
  task: { low: 10, medium: 20, high: 30 },
  journal: 50,
  meditation: 50,
  mood: 20,
}

// Valores de moedas por ação
COIN_REWARDS = {
  task: { low: 10, medium: 20, high: 40 },
  journal: 50,
  meditation: 30,
  mood: 0,
}
```

### 2. Cálculos de Nível

- `getLevelFromXP(xp)` - Calcula nível baseado no XP total
- `getXPForLevel(level)` - XP mínimo necessário para um nível
- `getXPToNextLevel(currentXP)` - XP restante para próximo nível
- `getLevelProgress(currentXP)` - Progresso percentual no nível atual (0-100%)

### 3. Verificações de Cooldown

- `canAwardXP(user, action)` - Verifica se pode ganhar XP (1x por dia por tipo)
- Suporta ações: `"task"`, `"journal"`, `"meditation"`, `"mood"`

### 4. Lógica de Ganho de XP

```typescript
// Função principal para ganho de XP e coins
awardXPAndCoins(db, userId, action, priority?)
// Retorna: { xpAwarded, coinsAwarded, newExperience, newCoins, newLevel, levelUp }

// Adicionar XP direto (sem cooldown)
addRawXP(db, userId, amount)

// Adicionar coins direto
addCoins(db, userId, amount)
```

### 5. Informações de Progresso

```typescript
// Informações completas sobre progresso do usuário
getXPInfo(currentXP)
// Retorna: { currentXP, currentLevel, xpForCurrentLevel, xpForNextLevel, 
//           xpInCurrentLevel, xpToNextLevel, progressPercent }
```

## 📝 Regras do Sistema

### Cooldown de XP
- **1 ganho por dia** por tipo de ação
- Tipos independentes: completar tarefa, criar diário, meditar, registrar humor
- Coins são **sempre** concedidos (sem cooldown)

### Progressão de Nível
- **100 XP por nível**
- Nível inicial: 1
- Fórmula: `level = floor(xp / 100) + 1`

### Valores de Recompensa

| Ação | XP | Coins |
|------|-----|-------|
| Tarefa Baixa | 10 | 10 |
| Tarefa Média | 20 | 20 |
| Tarefa Alta | 30 | 40 |
| Diário | 50 | 50 |
| Meditação | 50 | 30 |
| Humor | 20 | 0 |

## 🔧 Como Usar

### No Backend (routers tRPC)

```typescript
import { awardXPAndCoins } from "@/lib/xp";

// Conceder XP por completar tarefa
const result = await awardXPAndCoins(ctx.db, userId, "task", "high");
// result = { xpAwarded: 30, coinsAwarded: 40, levelUp: false, ... }

// Conceder XP por criar diário
const result = await awardXPAndCoins(ctx.db, userId, "journal");
// result = { xpAwarded: 50, coinsAwarded: 50, levelUp: true, ... }
```

### No Frontend (Views)

```typescript
import { XP_REWARDS, COIN_REWARDS } from "@/lib/xp";

// Exibir valores de recompensa
<div>+{XP_REWARDS.meditation} XP & {COIN_REWARDS.meditation} Pts</div>
// Renderiza: +50 XP & 30 Pts

// Calcular progresso
import { getXPInfo } from "@/lib/xp";
const xpInfo = getXPInfo(stats.xp);
// xpInfo.progressPercent = progresso no nível atual (0-100%)
```

## 📂 Arquivos Atualizados

### Backend (routers)
- ✅ `lib/trpc/routers/task.ts` - Usa `awardXPAndCoins`
- ✅ `lib/trpc/routers/journal.ts` - Usa `awardXPAndCoins`
- ✅ `lib/trpc/routers/meditation.ts` - Usa `awardXPAndCoins`
- ✅ `lib/trpc/routers/user.ts` - Usa `awardXPAndCoins`, `addRawXP`, `addCoins`

### Frontend (views)
- ✅ `views/HomeView.tsx` - Usa `XP_REWARDS` e `COIN_REWARDS`
- ✅ `views/JournalView.tsx` - Usa `XP_REWARDS`
- ✅ `views/MeditationView.tsx` - Usa `XP_REWARDS` e `COIN_REWARDS`
- ✅ `views/ProfileView.tsx` - Usa `getXPInfo`
- ✅ `views/RoutineView.tsx` - Usa `XP_REWARDS` e `COIN_REWARDS`

### Configuração
- ✅ `lib/constants.ts` - Mantém `getLevelFromXP` por compatibilidade
- ✅ `lib/xp/index.ts` - **Fonte única da verdade** para lógica de XP

## ✨ Benefícios da Centralização

1. **Manutenção Fácil**: Alterar valores de XP em um único lugar
2. **Consistência**: Mesmas regras aplicadas em todo o sistema
3. **Reutilização**: Funções disponíveis para todo o código
4. **Testabilidade**: Lógica isolada e fácil de testar
5. **Documentação**: Código autodocumentado com JSDoc

## 🔄 Próximos Passos (Sugestões)

- [ ] Adicionar testes unitários para `lib/xp/index.ts`
- [ ] Criar painel admin para ajustar valores de XP sem deploy
- [ ] Implementar eventos de XP para analytics
- [ ] Adicionar multiplicadores de XP (eventos especiais, streaks, etc)
- [ ] Sistema de boost temporário de XP
