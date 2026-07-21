import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const resendKey = process.env.RESEND_API_KEY;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (resendKey) {
      // Suporte nativo ao Resend via SMTP (smtp.resend.com)
      transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: resendKey
        }
      });
      console.log('✅ Nodemailer configurado com Resend SMTP!');
    } else if (user && pass) {
      // Suporte ao Gmail SMTP
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: { user, pass }
      });
      console.log('✅ Nodemailer configurado com Gmail SMTP!');
    } else {
      console.log('ℹ️ Nenhuma chave de e-mail configurada (RESEND_API_KEY ou EMAIL_USER). Modo Simulação de Envio de E-mail ativo no console.');
    }
  }
  return transporter;
}

export async function sendPriceAlertEmail({ recipientEmail, userName, alertDetails, flightMatch }) {
  const mailer = getTransporter();

  const isFlyTogether = alertDetails.mode === 'flytogether';
  const title = isFlyTogether
    ? `✈️ Alerta de Voo Combinado: Encontro em ${alertDetails.destination}!`
    : `✈️ Alerta de Voo: Passagem para ${alertDetails.destination} com preço reduzido!`;

  const senderEmail = process.env.RESEND_API_KEY 
    ? 'onboarding@resend.dev' // Remetente padrão gratuito do Resend para testes
    : (process.env.EMAIL_USER ? `"Fly2Gether Alertas" <${process.env.EMAIL_USER}>` : '"Fly2Gether Alertas" <alertas@fly2gether.com>');

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b192c; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0066ff; margin: 0;">Fly2Gether ✈️</h1>
        <p style="color: #94a3b8; font-size: 14px;">Encontre as melhores datas para viajar junto</p>
      </div>

      <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0066ff;">
        <h2 style="color: #38bdf8; font-size: 18px; margin-top: 0;">Olá, ${userName || 'Viajante'}!</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">
          Encontramos uma oportunidade imperdível para sua busca monitorada!
        </p>

        ${isFlyTogether ? `
          <div style="background-color: #0f172a; padding: 14px; border-radius: 6px; margin: 12px 0;">
            <p style="margin: 4px 0; color: #a855f7; font-weight: bold;">🤝 Voo Combinado Encontrado:</p>
            <p style="margin: 4px 0;">Pessoa 1 (${flightMatch.person1.origin}) ➔ ${alertDetails.destination}: <b>R$ ${flightMatch.person1.price}</b> (${flightMatch.person1.airline.name})</p>
            <p style="margin: 4px 0;">Pessoa 2 (${flightMatch.person2.origin}) ➔ ${alertDetails.destination}: <b>R$ ${flightMatch.person2.price}</b> (${flightMatch.person2.airline.name})</p>
            <p style="margin: 8px 0 0 0; color: #22c55e; font-size: 18px; font-weight: bold;">Preço Total Combinado: R$ ${flightMatch.combinedPrice}</p>
            <p style="margin: 4px 0; color: #cbd5e1; font-size: 13px;">⏱️ Intervalo na chegada: apenas ${flightMatch.arrivalDeltaMinutes} minutos!</p>
          </div>
        ` : `
          <div style="background-color: #0f172a; padding: 14px; border-radius: 6px; margin: 12px 0;">
            <p style="margin: 4px 0; color: #38bdf8; font-weight: bold;">Voo ${flightMatch.origin} ➔ ${alertDetails.destination}:</p>
            <p style="margin: 4px 0;">Companhia: ${flightMatch.airline.name}</p>
            <p style="margin: 4px 0;">Data de Ida: ${flightMatch.departureDate} (${flightMatch.departureTime})</p>
            ${flightMatch.returnDate ? `<p style="margin: 4px 0;">Data de Volta: ${flightMatch.returnDate} (${flightMatch.returnDepartureTime})</p>` : ''}
            <p style="margin: 8px 0 0 0; color: #22c55e; font-size: 18px; font-weight: bold;">Preço Total: R$ ${flightMatch.totalPrice}</p>
          </div>
        `}

        ${flightMatch.hasPromo || flightMatch.isMegaPromo ? `
          <div style="background-color: #7f1d1d; color: #fca5a5; padding: 8px 12px; border-radius: 4px; font-weight: bold; text-align: center; margin-top: 10px;">
            🔥 MEGA PROMOÇÃO DA COMPANHIA AÉREA DETECTADA!
          </div>
        ` : ''}
      </div>

      <div style="text-align: center; font-size: 12px; color: #64748b;">
        <p>Você recebeu este e-mail porque cadastrou um alerta no Fly2Gether.</p>
      </div>
    </div>
  `;

  if (mailer) {
    try {
      await mailer.sendMail({
        from: senderEmail,
        to: recipientEmail,
        subject: title,
        html: htmlContent
      });
      console.log(`✉️ E-mail enviado com sucesso para ${recipientEmail}`);
      return true;
    } catch (err) {
      console.error('❌ Erro ao enviar e-mail via Nodemailer/Resend:', err.message);
      return false;
    }
  } else {
    console.log(`[SIMULAÇÃO E-MAIL PARA ${recipientEmail}]: ${title} - R$ ${isFlyTogether ? flightMatch.combinedPrice : flightMatch.totalPrice}`);
    return true;
  }
}
