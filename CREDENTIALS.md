# 🔐 Credenciais de Teste

## Todos os usuários usam a mesma senha: `senha123`

### Psicóloga
- **Email:** ana.silva@clinica.com
- **Senha:** senha123
- **Role:** psychologist

### Pacientes

#### Miguel Santos
- **Email:** miguel@app-psi.com
- **Senha:** senha123
- **Role:** patient
- **Level:** 4
- **XP:** 320
- **Streak:** 8 dias
- **Moedas:** 285

#### Julia Oliveira
- **Email:** julia@app-psi.com
- **Senha:** senha123
- **Role:** patient
- **Level:** 2
- **XP:** 150
- **Streak:** 3 dias
- **Moedas:** 120

---

## Como popular o banco novamente

```bash
npx tsx lib/db/seed.ts
npx tsx scripts/add-passwords.ts
```

## Acessar Drizzle Studio

```bash
npx drizzle-kit studio
```

Acesse: https://local.drizzle.studio
