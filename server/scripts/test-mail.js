require('dotenv').config();
const { sendLeadNotification } = require('../mailer');
const nodemailer = require('nodemailer');

async function runTest() {
  console.log('🧪 Iniciando prueba de envío de correo para Think Lab...\n');

  const leadMock = {
    leadId: 102,
    name: 'Juan Solalinde (Test)',
    email: 'juanas89@gmail.com',
    phone: '+595 981 123 456',
    company: 'Think Lab. Digital',
    services: 'Integración de Agentes de IA & Plataforma Web',
    budget: 'A definir en llamada',
    timeline: 'Prioritario (2 a 3 semanas)',
    details: 'Verificando nuevo campo de teléfono y opción de presupuesto a definir en llamada con aviso por mail.',
    ipAddress: '127.0.0.1',
    date: new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' })
  };

  const hasCredentials = Boolean(
    (process.env.SMTP_USER || process.env.EMAIL_USER) && 
    (process.env.SMTP_PASS || process.env.EMAIL_PASS)
  );

  if (hasCredentials) {
    console.log('📡 Credenciales SMTP detectadas en .env. Enviando a bandeja de entrada...');
    const result = await sendLeadNotification(leadMock);
    if (result.sent) {
      console.log(`\n🎉 ¡Correo de prueba enviado con éxito a ${result.recipient}! Revisa tu bandeja de entrada.`);
    } else {
      console.error(`\n❌ Error al enviar el correo:`, result.error);
    }
  } else {
    console.log('⚠️  No se detectaron credenciales SMTP (SMTP_USER / SMTP_PASS) en el archivo .env.');
    console.log('📬 Generando previsualización en vivo mediante Ethereal Test Server...\n');

    const testAccount = await nodemailer.createTestAccount();
    const tempTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    const { sendLeadNotification: sendFn } = require('../mailer');
    // Send simulated email through ethereal
    const info = await tempTransporter.sendMail({
      from: '"Think Lab. Leads" <notificaciones@thinklab.agency>',
      to: 'juanas89@gmail.com',
      subject: `🚀 [PRUEBA] Nuevo Proyecto Think Lab.: ${leadMock.name} (${leadMock.company})`,
      html: require('../mailer').generateLeadEmailHtml ? require('../mailer').generateLeadEmailHtml(leadMock) : `<p>Prueba para ${leadMock.email}</p>`
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('✅ Correo de prueba generado y formateado exitosamente.');
    console.log(`🔗 Puedes ver cómo se ve el correo aquí:\n👉 ${previewUrl}\n`);
    console.log('👉 Para que llegue directamente a tu Gmail (juanas89@gmail.com), completa SMTP_USER y SMTP_PASS en tu archivo .env');
  }
}

runTest();
