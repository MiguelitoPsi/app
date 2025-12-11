'use client'

import { ArrowLeft, Brain, FileText, Scale } from 'lucide-react'
import Link from 'next/link'

export default function TermsOfUsePage() {
  return (
    <div className='min-h-screen bg-slate-950 text-slate-200'>
      {/* Header */}
      <header className='fixed top-0 z-40 w-full border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl'>
        <div className='mx-auto flex max-w-4xl items-center justify-between px-4 py-3'>
          <Link
            className='flex items-center gap-2 text-slate-400 hover:text-white transition-colors'
            href='/'
          >
            <ArrowLeft className='h-5 w-5' />
            <span className='text-sm font-medium'>Voltar</span>
          </Link>
          <div className='flex items-center gap-2'>
            <div className='rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5'>
              <Brain className='h-5 w-5 text-white' />
            </div>
            <span className='font-bold text-lg text-white'>Nepsis</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className='mx-auto max-w-4xl px-4 pt-24 pb-16'>
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='rounded-xl bg-violet-600/20 p-3'>
              <FileText className='h-8 w-8 text-violet-400' />
            </div>
            <div>
              <h1 className='font-bold text-3xl text-white'>Termos de Uso</h1>
              <p className='text-slate-400 text-sm'>Última atualização: 11 de dezembro de 2025</p>
            </div>
          </div>
        </div>

        <div className='prose prose-invert prose-slate max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white'>
          {/* Introdução */}
          <section className='mb-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6'>
            <p className='text-slate-300 mt-0'>
              Bem-vindo ao <strong>Nepsis</strong>. Estes Termos de Uso estabelecem as condições
              para utilização do aplicativo Nepsis ("Aplicativo" ou "Serviço") por pacientes e
              profissionais de psicologia. Ao criar uma conta ou utilizar o Aplicativo, você
              concorda integralmente com estes termos.
            </p>
          </section>

          {/* Definições */}
          <section className='mb-10'>
            <h2 className='flex items-center gap-2 text-xl font-bold'>
              <Scale className='h-5 w-5 text-violet-400' />
              1. Definições
            </h2>
            <ul>
              <li>
                <strong>Nepsis</strong>: Aplicativo de saúde mental gamificada para acompanhamento
                terapêutico.
              </li>
              <li>
                <strong>Usuário</strong>: Qualquer pessoa que crie uma conta no Aplicativo.
              </li>
              <li>
                <strong>Paciente</strong>: Usuário que utiliza o Aplicativo para registro de
                atividades terapêuticas.
              </li>
              <li>
                <strong>Terapeuta</strong>: Profissional de psicologia inscrito em Conselho Regional
                de Psicologia (CRP).
              </li>
              <li>
                <strong>Vinculação</strong>: Processo pelo qual um paciente associa sua conta a um
                terapeuta.
              </li>
            </ul>
          </section>

          {/* Aceitação */}
          <section className='mb-10'>
            <h2 className='text-xl font-bold'>2. Aceitação dos Termos</h2>
            <p>Ao acessar ou utilizar o Nepsis, você declara que:</p>
            <ul>
              <li>Leu e compreendeu estes Termos de Uso;</li>
              <li>Concorda em cumprir todas as condições aqui estabelecidas;</li>
              <li>
                Tem capacidade legal para aceitar estes termos (ou está sob supervisão de
                responsável legal);
              </li>
              <li>
                Reconhece que o uso continuado do Aplicativo implica aceitação de eventuais
                atualizações destes Termos.
              </li>
            </ul>
          </section>

          {/* Descrição do Serviço */}
          <section className='mb-10'>
            <h2 className='text-xl font-bold'>3. Descrição do Serviço</h2>
            <p>O Nepsis é uma plataforma digital que oferece:</p>
            <h3 className='text-lg font-semibold'>3.1. Para Pacientes</h3>
            <ul>
              <li>Registro de humor e emoções</li>
              <li>Diário de pensamentos com análise assistida por IA</li>
              <li>Gestão de rotina e tarefas terapêuticas</li>
              <li>Meditações guiadas</li>
              <li>Sistema de gamificação (XP, níveis, conquistas, moedas)</li>
              <li>Compartilhamento de dados com terapeuta vinculado</li>
            </ul>

            <h3 className='text-lg font-semibold'>3.2. Para Terapeutas</h3>
            <ul>
              <li>Dashboard de acompanhamento de pacientes</li>
              <li>Visualização de registros clínicos (humor, diário, tarefas)</li>
              <li>Ferramentas de conceituação cognitiva assistidas por IA</li>
              <li>Gestão de rotina profissional</li>
              <li>Sistema de gamificação profissional</li>
            </ul>
          </section>

          {/* Importante */}
          <section className='mb-10 rounded-2xl border border-red-800/50 bg-red-900/20 p-6'>
            <h2 className='text-xl font-bold text-red-300 mt-0'>4. Limitações Importantes</h2>
            <p className='text-red-200'>
              <strong>O NEPSIS NÃO É:</strong>
            </p>
            <ul className='text-red-200'>
              <li>
                Um substituto para terapia psicológica, psiquiátrica ou qualquer tratamento de saúde
                mental
              </li>
              <li>Um serviço de emergência ou crise</li>
              <li>Uma ferramenta de diagnóstico médico ou psicológico</li>
              <li>Um serviço de aconselhamento ou orientação profissional</li>
            </ul>
            <div className='mt-4 rounded-xl bg-red-900/30 p-4'>
              <p className='text-red-200 font-semibold mb-2'>Em caso de crise ou emergência:</p>
              <ul className='text-red-200 text-sm'>
                <li>
                  Ligue para o <strong>CVV: 188</strong> (24 horas)
                </li>
                <li>Procure o pronto-socorro mais próximo</li>
                <li>
                  Ligue para o <strong>SAMU: 192</strong>
                </li>
              </ul>
            </div>
          </section>

          {/* Cadastro */}
          <section className='mb-10'>
            <h2 className='text-xl font-bold'>5. Cadastro e Conta</h2>
            <h3 className='text-lg font-semibold'>5.1. Requisitos</h3>
            <p>Para criar uma conta, você deve:</p>
            <ul>
              <li>Ter no mínimo 18 anos (ou autorização de responsável legal)</li>
              <li>Fornecer informações verdadeiras e atualizadas</li>
              <li>Manter a confidencialidade de sua senha</li>
              <li>Ser o único usuário de sua conta</li>
            </ul>

            <h3 className='text-lg font-semibold'>5.2. Pacientes</h3>
            <p>
              O acesso ao Aplicativo para pacientes é exclusivamente realizado através de convite
              enviado por um terapeuta cadastrado no Nepsis. Não é possível registrar-se ou acessar
              qualquer funcionalidade do Aplicativo sem o vínculo com um terapeuta. O terapeuta deve
              estar previamente registrado no Nepsis para poder convidar seus pacientes.
            </p>

            <h3 className='text-lg font-semibold'>5.3. Terapeutas</h3>
            <p>Para criar uma conta de terapeuta, é necessário:</p>
            <ul>
              <li>Possuir registro ativo em Conselho Regional de Psicologia (CRP)</li>
              <li>Aceitar o Termo de Responsabilidade do Terapeuta</li>
              <li>Receber convite de um administrador do sistema</li>
            </ul>
          </section>

          {/* Obrigações do Usuário */}
          <section className='mb-10'>
            <h2 className='text-xl font-bold'>6. Obrigações do Usuário</h2>
            <p>O usuário se compromete a:</p>
            <ul>
              <li>Utilizar o Aplicativo de forma ética e legal</li>
              <li>Não compartilhar sua conta com terceiros</li>
              <li>Não tentar acessar áreas restritas do sistema</li>
              <li>Não utilizar o Aplicativo para fins ilícitos ou prejudiciais</li>
              <li>Não publicar conteúdo ofensivo, discriminatório ou ilegal</li>
              <li>Fornecer informações verdadeiras nos registros</li>
              <li>Reportar vulnerabilidades de segurança identificadas</li>
            </ul>
          </section>

          {/* IA */}
          <section className='mb-10 rounded-2xl border border-amber-800/50 bg-amber-900/20 p-6'>
            <h2 className='text-xl font-bold text-amber-300 mt-0'>
              7. Uso de Inteligência Artificial
            </h2>
            <p>O Nepsis utiliza inteligência artificial para:</p>
            <ul>
              <li>Análise de padrões de pensamento (TCC)</li>
              <li>Sugestões de distorções cognitivas</li>
              <li>Auxílio na conceituação cognitiva (para terapeutas)</li>
              <li>Geração de insights sobre registros</li>
            </ul>
            <p className='mt-4'>
              <strong>IMPORTANTE:</strong> Os conteúdos gerados por IA são auxiliares e não
              substituem a avaliação profissional. Terapeutas são integralmente responsáveis por
              revisar, validar e aprovar qualquer informação gerada pela IA antes de utilizar em
              intervenções clínicas.
            </p>
          </section>

          {/* Propriedade Intelectual */}
          <section className='mb-10'>
            <h2 className='text-xl font-bold'>8. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo do Aplicativo (código, design, marca, textos, funcionalidades) é de
              propriedade exclusiva do Nepsis ou de seus licenciadores e está protegido por leis de
              propriedade intelectual.
            </p>
            <p>
              O usuário mantém a propriedade sobre os conteúdos que criar (diários, registros),
              concedendo ao Nepsis uma licença limitada para armazenamento, processamento e exibição
              conforme necessário para a prestação do serviço.
            </p>
          </section>

          {/* Privacidade */}
          <section className='mb-10'>
            <h2 className='text-xl font-bold'>9. Privacidade e Proteção de Dados</h2>
            <p>
              O tratamento de dados pessoais é regido pela nossa{' '}
              <Link className='text-violet-400 hover:underline' href='/privacy'>
                Política de Privacidade
              </Link>
              , que faz parte integrante destes Termos.
            </p>
            <p>Em resumo:</p>
            <ul>
              <li>Coletamos apenas dados necessários para a prestação do serviço</li>
              <li>Dados sensíveis são tratados com consentimento específico</li>
              <li>
                Você pode exercer seus direitos (acesso, correção, exclusão, portabilidade) a
                qualquer momento
              </li>
              <li>Dados compartilhados com terapeutas exigem vinculação e consentimento</li>
            </ul>
          </section>

          {/* Planos e Pagamento */}
          <section className='mb-10'>
            <h2 className='text-xl font-bold'>10. Planos e Pagamentos</h2>
            <h3 className='text-lg font-semibold'>10.1. Período de Teste</h3>
            <p>
              Novos usuários têm direito a 30 dias de acesso gratuito a todas as funcionalidades do
              Aplicativo.
            </p>

            <h3 className='text-lg font-semibold'>10.2. Assinatura</h3>
            <p>
              Após o período de teste, o acesso ao Aplicativo requer assinatura paga. Os valores e
              condições serão informados no momento da contratação.
            </p>

            <h3 className='text-lg font-semibold'>10.3. Cancelamento</h3>
            <p>
              O cancelamento da assinatura pode ser realizado a qualquer momento. O acesso permanece
              ativo até o fim do período já pago, sem reembolso proporcional.
            </p>
          </section>

          {/* Isenção de Responsabilidade */}
          <section className='mb-10'>
            <h2 className='text-xl font-bold'>11. Isenção de Responsabilidade</h2>
            <p>O Nepsis não se responsabiliza por:</p>
            <ul>
              <li>
                Decisões tomadas com base nas informações registradas ou geradas pelo Aplicativo
              </li>
              <li>Resultados terapêuticos obtidos ou não obtidos</li>
              <li>Condutas de terapeutas cadastrados na plataforma</li>
              <li>Indisponibilidade temporária do serviço por motivos técnicos</li>
              <li>Danos decorrentes do uso inadequado do Aplicativo</li>
              <li>Conteúdos gerados por IA não revisados pelo usuário</li>
            </ul>
          </section>

          {/* Suspensão e Encerramento */}
          <section className='mb-10'>
            <h2 className='text-xl font-bold'>12. Suspensão e Encerramento</h2>
            <h3 className='text-lg font-semibold'>12.1. Pelo Usuário</h3>
            <p>
              Você pode encerrar sua conta a qualquer momento através das configurações do perfil ou
              entrando em contato com o suporte. Seus dados serão tratados conforme a Política de
              Privacidade.
            </p>

            <h3 className='text-lg font-semibold'>12.2. Pelo Nepsis</h3>
            <p>Reservamo-nos o direito de suspender ou encerrar contas em caso de:</p>
            <ul>
              <li>Violação destes Termos de Uso</li>
              <li>Conduta antiética ou ilegal</li>
              <li>Não pagamento (para contas com assinatura)</li>
              <li>Uso fraudulento ou abusivo do serviço</li>
              <li>Solicitação de autoridade competente</li>
            </ul>
          </section>

          {/* Alterações */}
          <section className='mb-10'>
            <h2 className='text-xl font-bold'>13. Alterações nos Termos</h2>
            <p>
              Estes Termos podem ser atualizados periodicamente. Alterações significativas serão
              comunicadas por e-mail ou notificação no Aplicativo com antecedência mínima de 30
              dias. O uso continuado após as alterações implica aceitação dos novos termos.
            </p>
          </section>

          {/* Legislação */}
          <section className='mb-10'>
            <h2 className='text-xl font-bold'>14. Legislação Aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil, especialmente:
            </p>
            <ul>
              <li>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</li>
              <li>Marco Civil da Internet (Lei nº 12.965/2014)</li>
              <li>Código de Defesa do Consumidor (Lei nº 8.078/1990)</li>
              <li>Código de Ética do Psicólogo (Resolução CFP nº 010/2005)</li>
            </ul>
            <p>
              Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias
              decorrentes destes Termos.
            </p>
          </section>

          {/* Contato */}
          <section className='mb-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6'>
            <h2 className='text-xl font-bold text-white mt-0'>15. Contato</h2>
            <p>Para dúvidas sobre estes Termos de Uso:</p>
            <ul>
              <li>
                <strong>E-mail geral</strong>: psijmrodrigues@gmail.com
              </li>
              <li>
                <strong>Privacidade e dados</strong>: psijmrodrigues@gmail.com
              </li>
            </ul>
          </section>
        </div>

        {/* Links úteis */}
        <div className='mt-12 flex flex-col sm:flex-row gap-4 justify-center'>
          <Link
            className='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-6 py-3 font-medium text-slate-300 transition-all hover:bg-slate-800 hover:border-slate-600'
            href='/privacy'
          >
            Ver Política de Privacidade
          </Link>
          <Link
            className='inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition-all hover:bg-violet-500'
            href='/'
          >
            Voltar para Início
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className='border-t border-slate-800 bg-slate-950 px-4 py-8'>
        <div className='mx-auto max-w-4xl text-center text-slate-500 text-sm'>
          <p>© {new Date().getFullYear()} Nepsis. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
