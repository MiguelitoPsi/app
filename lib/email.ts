import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(
  to: string,
  patientName: string,
  psychologistName: string,
  inviteToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const inviteUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/invite/${inviteToken}`;

    await resend.emails.send({
      from: "MiguelitoPsi <noreply@miguelitopsi.com>",
      to,
      subject: "Convite MiguelitoPsi - Inicie sua jornada de bem-estar",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 10px;
                margin-top: 20px;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important;
                padding: 14px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🧠 MiguelitoPsi</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Sua jornada de bem-estar mental começa aqui</p>
            </div>
            
            <div class="content">
              <h2 style="color: #667eea; margin-top: 0;">Olá, ${patientName}!</h2>
              
              <p>Você foi convidado(a) por <strong>${psychologistName}</strong> para participar do <strong>MiguelitoPsi</strong>, uma plataforma inovadora de acompanhamento terapêutico gamificado.</p>
              
              <p>Com o MiguelitoPsi, você poderá:</p>
              <ul>
                <li>📝 Registrar seus pensamentos e emoções no diário terapêutico</li>
                <li>🧘 Praticar meditações guiadas</li>
                <li>✅ Estabelecer e completar tarefas de autocuidado</li>
                <li>🏆 Conquistar badges e acompanhar seu progresso</li>
                <li>💎 Ganhar recompensas personalizadas</li>
              </ul>
              
              <p><strong>Este convite é válido por 7 dias.</strong></p>
              
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">
                  Aceitar Convite e Criar Conta
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                Ou copie e cole este link no seu navegador:<br>
                <code style="background: #e5e7eb; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">${inviteUrl}</code>
              </p>
            </div>
            
            <div class="footer">
              <p>© 2025 MiguelitoPsi. Todos os direitos reservados.</p>
              <p>Se você não solicitou este convite, pode ignorar este email.</p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending invite email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
