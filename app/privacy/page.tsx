"use client";

import { ArrowLeft, Brain, Mail, MapPin, Shield, User } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="fixed top-0 z-40 w-full border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            href="/"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">Nepsis</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 pt-24 pb-16">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-violet-600/20 p-3">
              <Shield className="h-8 w-8 text-violet-400" />
            </div>
            <div>
              <h1 className="font-bold text-3xl text-white">
                Política de Privacidade
              </h1>
              <p className="text-slate-400 text-sm">
                Última atualização: 11 de dezembro de 2025
              </p>
            </div>
          </div>
        </div>

        <div className="prose prose-invert prose-slate max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white">
          {/* Identificação do Controlador */}
          <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white mt-0">
              <User className="h-5 w-5 text-violet-400" />
              1. Identificação do Controlador
            </h2>
            <p>
              O controlador dos dados pessoais tratados por meio do aplicativo
              Nepsis é:
            </p>
            <div className="rounded-xl bg-slate-800/50 p-4 not-prose">
              <p className="text-white font-semibold mb-2">
                Nepsis Tecnologia em Saúde Mental LTDA
              </p>
              <p className="flex items-center gap-2 text-slate-300 text-sm mb-1">
                <MapPin className="h-4 w-4 text-slate-400" />
                São Paulo, SP - Brasil
              </p>
              <p className="flex items-center gap-2 text-slate-300 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                privacidade@nepsis.app
              </p>
            </div>
          </section>

          {/* Dados Coletados */}
          <section className="mb-10">
            <h2 className="text-xl font-bold">2. Dados Pessoais Coletados</h2>
            <p>
              O Nepsis coleta os seguintes dados pessoais, de acordo com a
              finalidade de cada funcionalidade:
            </p>

            <h3 className="text-lg font-semibold">2.1. Dados de Cadastro</h3>
            <ul>
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Senha (armazenada de forma criptografada)</li>
              <li>Foto de perfil (opcional)</li>
            </ul>

            <h3 className="text-lg font-semibold">
              2.2. Dados de Uso do Aplicativo (Pacientes)
            </h3>
            <ul>
              <li>Registros de humor e emoções</li>
              <li>Diários de pensamento (registros escritos)</li>
              <li>Tarefas e rotinas criadas</li>
              <li>Histórico de meditações realizadas</li>
              <li>Dados de gamificação (XP, níveis, conquistas, moedas)</li>
              <li>Preferências do aplicativo</li>
            </ul>

            <h3 className="text-lg font-semibold">
              2.3. Dados Profissionais (Terapeutas)
            </h3>
            <ul>
              <li>
                Número de registro no CRP (Conselho Regional de Psicologia)
              </li>
              <li>Especialidades e áreas de atuação</li>
              <li>Dados de vínculos com pacientes</li>
              <li>
                Registros clínicos e anotações (conceituações cognitivas, planos
                terapêuticos)
              </li>
            </ul>

            <h3 className="text-lg font-semibold">2.4. Dados Técnicos</h3>
            <ul>
              <li>Endereço IP</li>
              <li>Informações do dispositivo (user agent)</li>
              <li>Data e hora de acesso</li>
              <li>Tokens de notificação push (quando autorizados)</li>
            </ul>
          </section>

          {/* Finalidades */}
          <section className="mb-10">
            <h2 className="text-xl font-bold">3. Finalidades do Tratamento</h2>
            <p>Os dados pessoais são tratados para as seguintes finalidades:</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-white">
                      Finalidade
                    </th>
                    <th className="text-left py-3 px-4 text-white">
                      Base Legal (LGPD)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">
                      Criar e gerenciar conta de usuário
                    </td>
                    <td className="py-3 px-4">
                      Execução de contrato (Art. 7º, V)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">
                      Disponibilizar funcionalidades do app (registro de humor,
                      diário, tarefas)
                    </td>
                    <td className="py-3 px-4">
                      Execução de contrato (Art. 7º, V)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">
                      Compartilhar dados clínicos com terapeuta vinculado
                    </td>
                    <td className="py-3 px-4">Consentimento (Art. 7º, I)</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">
                      Processamento de dados por IA para análise de pensamentos
                    </td>
                    <td className="py-3 px-4">Consentimento (Art. 7º, I)</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">
                      Envio de notificações (lembretes, alertas)
                    </td>
                    <td className="py-3 px-4">Consentimento (Art. 7º, I)</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">
                      Melhoria dos serviços (dados anonimizados)
                    </td>
                    <td className="py-3 px-4">
                      Legítimo interesse (Art. 7º, IX)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">
                      Cumprimento de obrigações legais
                    </td>
                    <td className="py-3 px-4">Obrigação legal (Art. 7º, II)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Dados Sensíveis */}
          <section className="mb-10 rounded-2xl border border-amber-800/50 bg-amber-900/20 p-6">
            <h2 className="text-xl font-bold text-amber-300 mt-0">
              4. Tratamento de Dados Sensíveis
            </h2>
            <p>
              O Nepsis pode tratar dados pessoais sensíveis relacionados à saúde
              mental dos usuários, como registros de humor, pensamentos e
              sentimentos. Esses dados são tratados exclusivamente com base no{" "}
              <strong>consentimento específico e destacado do titular</strong>{" "}
              (Art. 11, I da LGPD), conforme aceito no Termo de Consentimento
              apresentado no primeiro acesso ao aplicativo.
            </p>
            <p>
              Os dados sensíveis são utilizados apenas para fins de
              acompanhamento terapêutico e nunca para finalidades comerciais,
              publicitárias ou de perfilamento.
            </p>
          </section>

          {/* Compartilhamento */}
          <section className="mb-10">
            <h2 className="text-xl font-bold">5. Compartilhamento de Dados</h2>
            <p>Os dados pessoais podem ser compartilhados com:</p>

            <h3 className="text-lg font-semibold">5.1. Terapeuta Vinculado</h3>
            <p>
              Quando o paciente aceita a vinculação com um profissional de
              psicologia, seus dados clínicos (humor, diário, tarefas,
              meditações) ficam acessíveis ao terapeuta para fins de
              acompanhamento terapêutico.
            </p>

            <h3 className="text-lg font-semibold">
              5.2. Prestadores de Serviço
            </h3>
            <ul>
              <li>
                <strong>Turso (banco de dados)</strong>: Armazenamento seguro de
                dados
              </li>
              <li>
                <strong>Google Gemini API</strong>: Processamento de análises de
                pensamentos (dados anonimizados)
              </li>
              <li>
                <strong>Resend</strong>: Envio de e-mails transacionais
              </li>
            </ul>
            <p>
              Todos os prestadores estão sujeitos a obrigações contratuais de
              confidencialidade e segurança.
            </p>

            <h3 className="text-lg font-semibold">
              5.3. Autoridades Competentes
            </h3>
            <p>
              Dados poderão ser compartilhados com autoridades públicas quando
              exigido por lei ou ordem judicial.
            </p>
          </section>

          {/* Retenção */}
          <section className="mb-10">
            <h2 className="text-xl font-bold">
              6. Prazo de Retenção dos Dados
            </h2>
            <p>Os dados pessoais são retidos pelos seguintes períodos:</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-white">
                      Tipo de Dado
                    </th>
                    <th className="text-left py-3 px-4 text-white">
                      Prazo de Retenção
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">Dados de cadastro</td>
                    <td className="py-3 px-4">
                      Enquanto a conta estiver ativa + 5 anos após exclusão
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">
                      Registros clínicos (humor, diário, etc.)
                    </td>
                    <td className="py-3 px-4">
                      Enquanto a conta estiver ativa + 20 anos (CFP)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">Logs de acesso</td>
                    <td className="py-3 px-4">
                      6 meses (Marco Civil da Internet)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">Dados anonimizados</td>
                    <td className="py-3 px-4">
                      Tempo indeterminado (não são dados pessoais)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Direitos do Titular */}
          <section className="mb-10 rounded-2xl border border-violet-800/50 bg-violet-900/20 p-6">
            <h2 className="text-xl font-bold text-violet-300 mt-0">
              7. Direitos do Titular dos Dados
            </h2>
            <p>
              Conforme a LGPD (Lei nº 13.709/2018), você possui os seguintes
              direitos:
            </p>
            <ul>
              <li>
                <strong>Confirmação e Acesso</strong>: Confirmar a existência de
                tratamento e acessar seus dados
              </li>
              <li>
                <strong>Correção</strong>: Solicitar a correção de dados
                incompletos, inexatos ou desatualizados
              </li>
              <li>
                <strong>Anonimização, bloqueio ou eliminação</strong>: Solicitar
                a anonimização, bloqueio ou eliminação de dados desnecessários
                ou excessivos
              </li>
              <li>
                <strong>Portabilidade</strong>: Solicitar a portabilidade dos
                dados para outro serviço (exportação em formato estruturado)
              </li>
              <li>
                <strong>Eliminação</strong>: Solicitar a eliminação dos dados
                tratados com base no consentimento
              </li>
              <li>
                <strong>Informação sobre compartilhamento</strong>: Saber com
                quais entidades seus dados foram compartilhados
              </li>
              <li>
                <strong>Revogação do consentimento</strong>: Revogar o
                consentimento a qualquer momento
              </li>
            </ul>

            <div className="mt-4 rounded-xl bg-slate-800/50 p-4 not-prose">
              <p className="text-white font-semibold mb-2">
                Como exercer seus direitos:
              </p>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>
                  • <strong>No aplicativo</strong>: Acesse Perfil →
                  Configurações → Meus Dados
                </li>
                <li>
                  • <strong>Por e-mail</strong>: Envie sua solicitação para{" "}
                  <a
                    className="text-violet-400 hover:underline"
                    href="mailto:privacidade@nepsis.app"
                  >
                    privacidade@nepsis.app
                  </a>
                </li>
              </ul>
              <p className="text-slate-400 text-xs mt-2">
                Prazo de resposta: até 15 dias úteis, conforme Art. 18, § 5º da
                LGPD.
              </p>
            </div>
          </section>

          {/* Segurança */}
          <section className="mb-10">
            <h2 className="text-xl font-bold">8. Segurança dos Dados</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus
              dados pessoais, incluindo:
            </p>
            <ul>
              <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
              <li>Criptografia de senhas (hashing seguro)</li>
              <li>Controle de acesso baseado em funções (RBAC)</li>
              <li>Autenticação segura com tokens de sessão</li>
              <li>Monitoramento e logs de segurança</li>
              <li>Backup regular dos dados</li>
              <li>
                Soft delete para recuperação de dados excluídos acidentalmente
              </li>
            </ul>
          </section>

          {/* Transferência Internacional */}
          <section className="mb-10">
            <h2 className="text-xl font-bold">
              9. Transferência Internacional de Dados
            </h2>
            <p>
              Alguns de nossos prestadores de serviço podem armazenar dados fora
              do Brasil. Nesses casos, garantimos que a transferência
              internacional ocorra apenas para países que proporcionem grau de
              proteção adequado ou mediante cláusulas contratuais padrão,
              conforme Art. 33 da LGPD.
            </p>
          </section>

          {/* Cookies */}
          <section className="mb-10">
            <h2 className="text-xl font-bold">
              10. Cookies e Tecnologias Similares
            </h2>
            <p>O Nepsis utiliza cookies e tecnologias similares para:</p>
            <ul>
              <li>Manter a sessão do usuário autenticado</li>
              <li>Armazenar preferências (tema, idioma)</li>
              <li>Análise de uso agregado e anonimizado</li>
            </ul>
            <p>
              Não utilizamos cookies para rastreamento publicitário ou
              perfilamento comercial.
            </p>
          </section>

          {/* Menores */}
          <section className="mb-10">
            <h2 className="text-xl font-bold">
              11. Dados de Crianças e Adolescentes
            </h2>
            <p>
              O Nepsis não é destinado a menores de 18 anos. Caso um menor
              utilize o aplicativo, isso deve ocorrer sob supervisão e
              responsabilidade de um responsável legal e de um profissional de
              psicologia habilitado.
            </p>
          </section>

          {/* Alterações */}
          <section className="mb-10">
            <h2 className="text-xl font-bold">12. Alterações nesta Política</h2>
            <p>
              Esta Política de Privacidade pode ser atualizada periodicamente.
              Em caso de alterações significativas, notificaremos os usuários
              por meio do aplicativo ou e-mail. A data da última atualização
              está indicada no topo deste documento.
            </p>
          </section>

          {/* Contato */}
          <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-xl font-bold text-white mt-0">
              13. Contato e Encarregado (DPO)
            </h2>
            <p>
              Para dúvidas, solicitações ou reclamações relacionadas ao
              tratamento de dados pessoais, entre em contato:
            </p>
            <div className="rounded-xl bg-slate-800/50 p-4 not-prose">
              <p className="text-white font-semibold mb-2">
                Encarregado de Proteção de Dados (DPO)
              </p>
              <p className="flex items-center gap-2 text-slate-300 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                <a
                  className="text-violet-400 hover:underline"
                  href="mailto:privacidade@nepsis.app"
                >
                  privacidade@nepsis.app
                </a>
              </p>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              Você também pode registrar uma reclamação junto à Autoridade
              Nacional de Proteção de Dados (ANPD) em{" "}
              <a
                className="text-violet-400 hover:underline"
                href="https://www.gov.br/anpd"
                rel="noopener noreferrer"
                target="_blank"
              >
                www.gov.br/anpd
              </a>
              .
            </p>
          </section>
        </div>

        {/* Links úteis */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-6 py-3 font-medium text-slate-300 transition-all hover:bg-slate-800 hover:border-slate-600"
            href="/terms"
          >
            Ver Termos de Uso
          </Link>
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition-all hover:bg-violet-500"
            href="/"
          >
            Voltar para Início
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-8">
        <div className="mx-auto max-w-4xl text-center text-slate-500 text-sm">
          <p>
            © {new Date().getFullYear()} Nepsis. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
