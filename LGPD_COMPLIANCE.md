# Conformidade LGPD - Nepsis

Este documento descreve como o aplicativo **Nepsis** está em conformidade com a **Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)**.

---

## 📋 Visão Geral

O Nepsis é uma plataforma de saúde mental gamificada que conecta pacientes e terapeutas. Por lidar com **dados sensíveis de saúde** (Art. 5º, II da LGPD), implementamos controles rigorosos para garantir a privacidade e segurança dos usuários.

---

## ✅ Princípios da LGPD Atendidos

### 1. Finalidade (Art. 6º, I)
Os dados são coletados exclusivamente para:
- Acompanhamento terapêutico entre paciente e psicólogo
- Registro de humor, tarefas, diário e meditações
- Gamificação do processo terapêutico (XP, níveis, conquistas)
- Geração de relatórios clínicos para o terapeuta

### 2. Adequação (Art. 6º, II)
Coletamos apenas dados necessários para o funcionamento da plataforma:
- Dados de identificação (nome, e-mail)
- Dados de saúde (registros de humor, diário de pensamentos)
- Dados de uso (tarefas, meditações, progresso)

### 3. Necessidade (Art. 6º, III)
Minimizamos a coleta ao estritamente necessário. Não solicitamos:
- Documentos de identidade
- Dados financeiros dos pacientes
- Localização em tempo real
- Acesso a contatos ou fotos

### 4. Livre Acesso (Art. 6º, IV)
Implementado através de:
- **Exportação de dados** (`/profile` → Exportar Meus Dados)
- Visualização completa do histórico na plataforma
- Acesso a todos os registros (humor, diário, tarefas, meditações)

### 5. Qualidade dos Dados (Art. 6º, V)
- Usuários podem editar seus dados a qualquer momento
- Sistema de soft delete preserva integridade dos dados
- Timestamps de criação e atualização em todos os registros

### 6. Transparência (Art. 6º, VI)
Disponibilizamos publicamente:
- **Política de Privacidade** (`/privacy`)
- **Termos de Uso** (`/terms`)
- Links acessíveis no rodapé e nos modais de consentimento

### 7. Segurança (Art. 6º, VII)
- Autenticação segura via better-auth
- Senhas criptografadas (hash + salt)
- Conexão HTTPS obrigatória
- Banco de dados com acesso restrito (Turso/SQLite)
- Isolamento de dados por role (paciente/terapeuta/admin)

### 8. Prevenção (Art. 6º, VIII)
- Middleware de proteção de rotas por role
- Validação de inputs com Zod
- Rate limiting em endpoints sensíveis
- Logs de auditoria para ações críticas

### 9. Não Discriminação (Art. 6º, IX)
- Dados de saúde mental não são usados para decisões automatizadas
- IA (Gemini) apenas sugere; terapeuta sempre valida
- Sem compartilhamento de dados com terceiros para fins discriminatórios

### 10. Responsabilização (Art. 6º, X)
- Termos de Responsabilidade específicos para terapeutas
- Documentação de conformidade (este documento)
- Identificação clara do controlador na Política de Privacidade

---

## 🔐 Direitos do Titular Implementados (Art. 18)

| Direito | Implementação | Local |
|---------|---------------|-------|
| **Confirmação de tratamento** | Política de Privacidade detalhada | `/privacy` |
| **Acesso aos dados** | Visualização completa na plataforma | `/profile`, `/journal`, etc. |
| **Correção de dados** | Edição de perfil e registros | `/profile` |
| **Anonimização/bloqueio** | Soft delete com `deletedAt` | Sistema interno |
| **Portabilidade** | Exportação em JSON | `/profile` → "Exportar Meus Dados" |
| **Eliminação** | Exclusão de conta self-service | `/profile` → "Excluir Minha Conta" |
| **Informação sobre compartilhamento** | Detalhado na Política de Privacidade | `/privacy` |
| **Revogação do consentimento** | Desvinculação de terapeuta + exclusão de conta | `/profile` |

---

## 📄 Bases Legais Utilizadas (Art. 7º e 11)

### Para Pacientes:
- **Consentimento** (Art. 7º, I / Art. 11, I): Aceite explícito do Termo de Consentimento
- **Execução de contrato** (Art. 7º, V): Prestação do serviço de acompanhamento

### Para Terapeutas:
- **Consentimento** (Art. 7º, I): Aceite do Termo de Responsabilidade
- **Exercício regular de direitos** (Art. 7º, VI): Registro profissional (CRP)
- **Legítimo interesse** (Art. 7º, IX): Melhoria contínua da plataforma

### Para Dados de Saúde (Art. 11):
- **Consentimento específico** (Art. 11, I): Consentimento destacado para dados sensíveis
- **Tutela da saúde** (Art. 11, II, f): Acompanhamento terapêutico por profissional habilitado

---

## 🗂️ Retenção e Eliminação de Dados

| Tipo de Dado | Período de Retenção | Justificativa |
|--------------|---------------------|---------------|
| Dados de conta | Enquanto ativa + 6 meses após exclusão | Período de carência para recuperação |
| Registros terapêuticos | 5 anos após último uso | Resolução CFP nº 001/2009 |
| Logs de acesso | 6 meses | Segurança e auditoria |
| Dados de pagamento | Conforme legislação fiscal | Obrigação legal |

### Processo de Exclusão:
1. Usuário solicita exclusão em `/profile`
2. Sistema verifica vínculos ativos (terapeuta-paciente)
3. Soft delete imediato (`deletedAt` preenchido)
4. Dados anonimizados após período de retenção
5. Exclusão física após prazo legal

---

## 🤖 Uso de Inteligência Artificial

O Nepsis utiliza a API Gemini (Google) para:
- Análise de pensamentos com base em TCC (Terapia Cognitivo-Comportamental)
- Identificação de distorções cognitivas
- Sugestões de reestruturação de pensamentos

### Salvaguardas LGPD para IA:
- ✅ Dados enviados são anonimizados (sem identificação do usuário)
- ✅ Resultados são sugestões, nunca decisões automatizadas
- ✅ Terapeuta sempre revisa e valida antes de usar clinicamente
- ✅ Usuário informado sobre uso de IA nos Termos de Uso
- ✅ Direito de solicitar revisão humana (Art. 20)

---

## 👥 Compartilhamento de Dados

### Interno:
- **Paciente ↔ Terapeuta vinculado**: Acesso aos registros do paciente
- **Admin**: Acesso para suporte e moderação

### Externo:
- **Google (Gemini API)**: Apenas texto anonimizado para análise
- **Turso**: Armazenamento de banco de dados (contrato de processamento)
- **Vercel**: Hospedagem (infraestrutura)

Não compartilhamos dados com:
- ❌ Anunciantes
- ❌ Planos de saúde
- ❌ Empregadores
- ❌ Corretores de dados

---

## 📞 Contato e DPO

**Controlador dos Dados:**
Nepsis Tecnologia em Saúde Mental LTDA

**Encarregado de Dados (DPO):**
- E-mail: psijmrodrigues@gmail.com
- Prazo de resposta: até 15 dias úteis

---

## 📁 Documentos Disponíveis

| Documento | URL | Descrição |
|-----------|-----|-----------|
| Política de Privacidade | `/privacy` | Como coletamos e usamos dados |
| Termos de Uso | `/terms` | Condições de uso da plataforma |
| Termo de Consentimento (Paciente) | Modal no primeiro acesso | Consentimento para tratamento |
| Termo de Responsabilidade (Terapeuta) | Modal no primeiro acesso | Obrigações do profissional |

---

## 🛠️ Funcionalidades LGPD Implementadas

### Para Usuários:
```
/profile → Configurações
├── 📥 Exportar Meus Dados (JSON completo)
├── 🗑️ Excluir Minha Conta (com confirmação)
└── ✏️ Editar dados pessoais
```

### Para Desenvolvedores:
```typescript
// Endpoints tRPC disponíveis
user.exportMyData      // Exportação de dados (portabilidade)
user.requestAccountDeletion  // Exclusão de conta
user.updateProfile     // Correção de dados
user.acceptTerms       // Registro de consentimento
```

---

## ✅ Checklist de Conformidade

- [x] Política de Privacidade publicada e acessível
- [x] Termos de Uso publicados e acessíveis
- [x] Consentimento explícito antes do uso
- [x] Exportação de dados disponível (portabilidade)
- [x] Exclusão de conta self-service
- [x] Dados de saúde tratados com base legal adequada
- [x] Compartilhamento limitado e documentado
- [x] Medidas de segurança implementadas
- [x] DPO designado e canal de contato disponível
- [x] Registro de atividades de tratamento documentado

---

## 📅 Histórico de Atualizações

| Data | Versão | Alterações |
|------|--------|------------|
| Dezembro/2024 | 1.0 | Documento inicial de conformidade LGPD |

---

*Este documento é parte integrante do programa de conformidade LGPD do Nepsis e deve ser revisado periodicamente.*
