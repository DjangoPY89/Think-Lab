/**
 * Think Lab. - Automated Email Notification Service
 * Sends instant notifications to juanas89@gmail.com when leads are submitted
 */

const nodemailer = require('nodemailer');

const NOTIFICATION_RECIPIENT = process.env.NOTIFICATION_EMAIL || 'juanas89@gmail.com';

/**
 * Creates and returns a Nodemailer transporter based on .env config
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();

  if (!user || !pass) {
    return null;
  }

  // Use native Gmail service config for maximum reliability with App Passwords
  if (host === 'smtp.gmail.com' || user.endsWith('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass
      }
    });
  }

  const port = parseInt(process.env.SMTP_PORT, 10) || 465;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
}

/**
 * Builds a styled, modern HTML email template
 */
function generateLeadEmailHtml(data) {
  const { leadId, name, email, company, services, budget, timeline, details, date, ipAddress } = data;
  const companyDisplay = company && company.trim() ? company : 'No especificada';
  const detailsDisplay = details && details.trim() ? details : 'Sin observaciones adicionales';
  const dateFormatted = date || new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' });

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Lead - Think Lab.</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #070709; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f5f7;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #070709; padding: 30px 15px;">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0f0f13; border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
            
            <!-- Header with Accent Glow -->
            <tr>
              <td style="padding: 28px 32px; background: linear-gradient(180deg, rgba(163, 230, 53, 0.08) 0%, rgba(15, 15, 19, 0) 100%); border-bottom: 1px solid rgba(255,255,255,0.06);">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #a3e635; background-color: rgba(163, 230, 53, 0.12); padding: 4px 10px; border-radius: 999px; margin-bottom: 10px;">
                        ● NUEVO PROYECTO RECIBIDO
                      </span>
                      <h1 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                        Think Lab. <span style="color: #86868b; font-weight: 400;">| Lead #${leadId || 'N/A'}</span>
                      </h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Content Area -->
            <tr>
              <td style="padding: 28px 32px;">
                <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #a1a1a6;">
                  Se ha completado un nuevo formulario en <strong style="color: #ffffff;">"Inicia tu proyecto con Think Lab."</strong>. A continuación se presentan los detalles del cliente:
                </p>

                <!-- Lead Details Card -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #16161b; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="140" style="font-size: 12px; color: #86868b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Nombre:</td>
                          <td style="font-size: 15px; color: #ffffff; font-weight: 600;">${name}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="140" style="font-size: 12px; color: #86868b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Correo:</td>
                          <td style="font-size: 14px; color: #a3e635; font-weight: 500;">
                            <a href="mailto:${email}" style="color: #a3e635; text-decoration: none;">${email}</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="140" style="font-size: 12px; color: #86868b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Empresa / Web:</td>
                          <td style="font-size: 14px; color: #f5f5f7;">${companyDisplay}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="140" style="font-size: 12px; color: #86868b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Objetivo / Servicio:</td>
                          <td style="font-size: 14px; color: #f5f5f7; font-weight: 500;">${services || 'General'}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="140" style="font-size: 12px; color: #86868b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Presupuesto:</td>
                          <td style="font-size: 14px; color: #ffffff; font-weight: 600;">${budget || 'No especificado'}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="140" style="font-size: 12px; color: #86868b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Plazo Deseado:</td>
                          <td style="font-size: 14px; color: #f5f5f7;">${timeline || 'Estándar'}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 18px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="140" style="font-size: 12px; color: #86868b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; vertical-align: top; padding-top: 2px;">Detalles:</td>
                          <td style="font-size: 13px; color: #cccccc; line-height: 1.5;">${detailsDisplay}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Action Button -->
                <div style="text-align: center; margin: 28px 0 10px 0;">
                  <a href="mailto:${email}?subject=Think%20Lab.%20-%20Reuni%C3%B3n%20Estrat%C3%A9gica%20de%20Proyecto" style="display: inline-block; background-color: #ffffff; color: #000000; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 999px; box-shadow: 0 4px 12px rgba(255,255,255,0.15);">
                    ✉️ Responder a ${name} (${email})
                  </a>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 18px 32px; background-color: #0b0b0e; border-top: 1px solid rgba(255,255,255,0.05); font-size: 11px; color: #636366; text-align: center;">
                <p style="margin: 0 0 4px 0;">Fecha: ${dateFormatted} | IP: ${ipAddress || '127.0.0.1'}</p>
                <p style="margin: 0;">Think Lab. Digital Engineering & Architecture Platform</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Sends notification email when a new lead is created
 * @param {Object} leadData
 * @returns {Promise<Object>}
 */
async function sendLeadNotification(leadData) {
  const recipient = (process.env.NOTIFICATION_EMAIL || NOTIFICATION_RECIPIENT || 'juanas89@gmail.com').trim();
  const transporter = createTransporter();

  const subject = `🚀 Nuevo Proyecto Think Lab.: ${leadData.name} ${leadData.company ? `(${leadData.company})` : ''}`;
  const htmlContent = generateLeadEmailHtml(leadData);
  const textContent = `
=========================================
🚀 NUEVO PROYECTO RECIBIDO EN THINK LAB.
=========================================
Lead ID: #${leadData.leadId || 'N/A'}
Nombre: ${leadData.name}
Correo: ${leadData.email}
Empresa / Web: ${leadData.company || 'No especificada'}
Objetivo / Servicios: ${leadData.services || 'General'}
Presupuesto: ${leadData.budget || 'No especificado'}
Plazo: ${leadData.timeline || 'Estándar'}
Detalles: ${leadData.details || 'Sin observaciones'}
Fecha: ${new Date().toISOString()}
IP: ${leadData.ipAddress || '127.0.0.1'}
=========================================
Responder a: ${leadData.email}
  `;

  if (!transporter) {
    console.log('\n======================================================');
    console.log(`📧 [EMAIL NOTIFICACIÓN LISTA PARA ENVIAR A: ${recipient}]`);
    console.log(`ℹ️  Para envío real por SMTP/Gmail, configura en .env:`);
    console.log(`   SMTP_USER=tu_correo@gmail.com`);
    console.log(`   SMTP_PASS=tu_contraseña_de_aplicacion`);
    console.log(`   NOTIFICATION_EMAIL=${recipient}`);
    console.log('------------------------------------------------------');
    console.log(textContent.trim());
    console.log('======================================================\n');
    return {
      sent: false,
      simulated: true,
      recipient,
      message: 'Email simulado en consola. Configure SMTP_USER y SMTP_PASS en .env para entrega SMTP real.'
    };
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || `"Think Lab. Intake" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`;
    
    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      replyTo: leadData.email,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log(`✅ [EMAIL SENT] Notificación de Lead #${leadData.leadId} enviada exitosamente a ${recipient} (Message ID: ${info.messageId})`);
    return {
      sent: true,
      recipient,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ [EMAIL ERROR] No se pudo enviar el correo de notificación:', error.message);
    return {
      sent: false,
      error: error.message
    };
  }
}

module.exports = {
  sendLeadNotification,
  generateLeadEmailHtml,
  NOTIFICATION_RECIPIENT
};

