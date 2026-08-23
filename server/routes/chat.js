/**
 * Think Lab. - High-Conversion Sales Closer & Technical Advisor Engine
 * - Offers business call after the 4th message (or earlier if requested by the client)
 * - Directly connects to WhatsApp (+595 983 463553) whenever required by the client
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// In-memory conversation state store per session
const sessionStates = new Map();

function getSessionState(sessionId) {
  if (!sessionStates.has(sessionId)) {
    sessionStates.set(sessionId, {
      messageCount: 0,
      history: []
    });
  }
  return sessionStates.get(sessionId);
}

// String normalizer helper
function normalize(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasWord(normText, word) {
  const padded = ' ' + normText + ' ';
  return padded.includes(' ' + word + ' ');
}

function hasAny(normText, words) {
  return words.some((w) => {
    if (w.includes(' ')) return normText.includes(w);
    return hasWord(normText, w);
  });
}

const SYSTEM_PROMPT_DOC = `
Eres un agente experto de atención técnica y comercial de ThinkLab (https://thinklabpy.online/).
Tus directivas principales son:
1. Atender con cordialidad, empatía y conocimiento técnico experto en Programación Web (Next.js 14, Supabase), Diseño UI/UX y Apps Móviles (Flutter, React Native, PWA) y Chatbots con IA (WhatsApp API, RAG, n8n, ElevenLabs).
2. Si el usuario solicita hablar por WhatsApp o pide un número/contacto directo, conéctalo cordialmente con el WhatsApp oficial (+595 983 463553).
3. Responder con profundidad y resolver de 4 a 5 consultas del cliente antes de proponer proactivamente agendar una llamada de negocios (salvo que el cliente lo pida expresamente antes).
4. No limitarte en la cantidad de preguntas: responde con claridad y detalle a todo lo que el cliente consulte.
`;

/**
 * High-Reasoning & Dynamic 5th-Message Milestone Closer Engine
 */
function evaluateExpertResponse(message, sessionId) {
  const norm = normalize(message);
  const state = getSessionState(sessionId);

  // Increment message count for this session
  state.messageCount += 1;
  const isFifthOrLater = state.messageCount >= 5;

  // --------------------------------------------------------------------------
  // 1. REQUERIMIENTO DIRECTO DE WHATSAPP / CONTACTO PERSONAL
  // --------------------------------------------------------------------------
  if (
    hasAny(norm, [
      'whatsapp', 'wpp', 'wa', 'numero', 'telefono', 'celular', 'humano', 'persona',
      'asesor humano', 'persona real', 'contacto directo', 'hablar con alguien',
      'escribir por whatsapp', 'pasame el numero', 'pasame tu contacto'
    ])
  ) {
    const waUrl = 'https://wa.me/595983463553?text=Hola%20ThinkLab%2C%20estoy%20en%20su%20sitio%20web%20y%20deseo%20atenci%C3%B3n%20personalizada%20para%20un%20proyecto';
    return {
      intent: 'whatsapp_direct_connection',
      text: '¡Con el mayor gusto! Puedes conectarte de forma directa e inmediata con nuestros asesores técnicos y comerciales a través de **WhatsApp**:\n\n' +
        `• 📱 **WhatsApp Directo**: [+595 983 463553](${waUrl})\n` +
        '• 👤 **Atención**: Lead Architects & Especialistas de ThinkLab\n' +
        '• ⚡ **Respuesta promedio**: Menos de 5 minutos\n\n' +
        'Haz clic en el enlace de arriba o pulsa el botón de WhatsApp abajo para iniciar la conversación ahora mismo con tu requerimiento precargado.\n\n' +
        '¿Deseas que te adelante alguna información técnica por aquí mientras te comunicas?',
      action: 'none',
      suggestedChips: [
        '💬 Abrir WhatsApp (+595 983 463553)',
        '🗓️ Agendar llamada de negocios',
        '💰 Ver Paquetes de Inversión'
      ]
    };
  }

  // --------------------------------------------------------------------------
  // 2. SOLICITUD EXPLÍCITA DE LLAMADA O AGENDAMIENTO (Antes o durante el 4to mensaje)
  // --------------------------------------------------------------------------
  if (
    hasAny(norm, [
      'agendar', 'cita', 'llamada', 'reunion', 'reservar', 'hablar con', 'asesor',
      'demo', 'horario', 'videollamada', 'meet', 'zoom'
    ])
  ) {
    return {
      intent: 'booking_direct',
      text: 'Con el mayor gusto coordinamos tu **Llamada de Negocios (15 a 25 min)** con nuestro equipo de arquitectura y desarrollo para estructurar tu solución y cotización formal.\n\n' +
        'He habilitado el selector de fecha y horario aquí abajo para que elijas el momento que mejor te convenga.\n\n' +
        '¿Te queda más cómodo un horario por la mañana (09:00 / 11:00) o por la tarde (14:30 / 16:00)?',
      action: 'show_booking_form',
      suggestedChips: [
        '🗓️ Confirmar horario abajo',
        '💬 O escribir por WhatsApp (+595 983 463553)',
        '💰 Ver Tarifas'
      ]
    };
  }

  // --------------------------------------------------------------------------
  // 3. SEÑALES DE COMPRA DIRECTA (High Intent Buying Signals)
  // --------------------------------------------------------------------------
  if (
    hasAny(norm, [
      'me interesa', 'quiero contratar', 'quiero empezar', 'como empezamos', 'como contrato',
      'como compro', 'quiero comprar', 'quiero el plan', 'avancemos', 'dale', 'hacemos',
      'arranquemos', 'empecemos', 'haganmelo', 'contratemos', 'me convence', 'me gusta',
      'lo quiero', 'quiero el growth', 'quiero el launch', 'quiero el enterprise', 'cerrar',
      'donde pago', 'como pago', 'quiero trabajar con ustedes', 'siguiente paso'
    ])
  ) {
    const waUrl = 'https://wa.me/595983463553?text=Hola%20ThinkLab%2C%20quiero%20cerrar%20la%20contrataci%C3%B3n%20de%20mi%20proyecto';
    return {
      intent: 'close_sale_immediate',
      text: '¡Excelente decisión! Vamos a asegurar el inicio inmediato de tu proyecto y reservar la disponibilidad técnica de nuestro equipo para este mes.\n\n' +
        'Para formalizar los requerimientos y entregarte la propuesta definitiva:\n\n' +
        '• 🗓️ **Opción 1 (Llamada de Negocios 15 min)**: He abierto el agendador aquí abajo. Elige el horario que prefieras para coordinar con nuestro Lead Architect.\n' +
        `• 💬 **Opción 2 (WhatsApp Directo)**: O si prefieres cerrar la contratación hoy mismo sin demoras, escríbenos a [WhatsApp (+595 983 463553)](${waUrl}).\n\n` +
        '¿Prefieres que coordinemos por llamada o avanzamos de inmediato por WhatsApp?',
      action: 'show_booking_form',
      suggestedChips: [
        '🗓️ Agendar llamada ahora',
        '💬 Cerrar por WhatsApp (+595 983 463553)',
        '💰 Ver Planes de Inversión'
      ]
    };
  }

  // --------------------------------------------------------------------------
  // 4. GENERACIÓN DE RESPUESTA TEMÁTICA (Web, Apps, Chatbots, Precios, etc.)
  // --------------------------------------------------------------------------
  let baseResponse = null;

  // A. Precios / Presupuestos
  if (
    hasAny(norm, ['precio', 'precios', 'costo', 'costos', 'cuanto', 'tarifa', 'tarifas', 'presupuesto', 'presupuestos', 'cotizacion', 'cuotas', 'inversion', 'guarani', 'guaranies', 'gs'])
  ) {
    baseResponse = {
      intent: 'pricing_expert',
      text: 'Con total cordialidad y transparencia, te presento nuestros paquetes de inversión garantizados en **Guaraníes (Gs.)**:\n\n' +
        '• 🚀 **Plan Launch**\n' +
        '  - Inversión: **Gs. 5.500.000 / mes** (o Gs. 11.500.000 pago único).\n' +
        '  - Plataforma web corporativa en Next.js 14, 100/100 Core Web Vitals y diseño Apple-grade.\n\n' +
        '• ⚡ **Plan Growth (Recomendado / Mayor Retorno)**\n' +
        '  - Inversión: **Gs. 11.500.000 / mes** (o Gs. 24.500.000 pago único).\n' +
        '  - Incluye **Agente de IA (RAG) para WhatsApp/Web**, base de datos Supabase, pasarela de pagos y CRM.\n\n' +
        '• 🏛️ **Plan Enterprise / Software a Medida**\n' +
        '  - Inversión: **Gs. 21.000.000 / mes** (o Gs. 45.000.000 pago único).\n' +
        '  - Desarrollo Full-Stack a medida, Apps móviles (iOS/Android), Agentes de Voz e Ingeniero dedicado.\n\n' +
        '¿Cuál de estos tres planes se adapta mejor al objetivo de tu empresa?',
      suggestedChips: ['⚡ Plan Growth con IA (Gs. 11.5M)', '🚀 Plan Launch (Gs. 5.5M)', '🏛️ Plan Enterprise a Medida', '💬 Cotizar por WhatsApp']
    };
  }

  // B. Chatbots & Agentes de IA
  else if (
    hasAny(norm, ['chatbot', 'chatbots', 'ia', 'ai', 'agente', 'agentes', 'rag', 'n8n', 'make', 'automatizacion', 'automatizaciones', 'alucinacion', 'voz'])
  ) {
    baseResponse = {
      intent: 'ai_chatbots_expert',
      text: 'En **ThinkLab** somos especialistas en automatización y chatbots con IA de última generación. Te comparto las mejores alternativas:\n\n' +
        '1. 💬 **Agente de Ventas en WhatsApp Business API**:\n' +
        '   • Atiende clientes, califica prospectos (BANT), envía fotos/catálogos y agenda citas 24/7 en <2 segundos.\n\n' +
        '2. 🧠 **Asistente RAG con Cero Alucinaciones**:\n' +
        '   • Conectado a tus manuales, políticas y base de datos con embeddings vectoriales en Supabase PostgreSQL (`pgvector`).\n\n' +
        '3. ⚡ **Workflows Autónomos con n8n / Make**:\n' +
        '   • Sincroniza cada interacción con tu CRM (HubSpot / Notion / Sheets) y alerta a tu equipo de ventas.\n\n' +
        '4. 🎙️ **Agentes de Voz AI (ElevenLabs)**:\n' +
        '   • Llamadas entrantes y salientes hiperrealistas con síntesis de voz natural.',
      suggestedChips: ['💬 Probar Demo por WhatsApp', '💰 Ver Costos de Agentes IA', '📱 Apps Móviles con IA']
    };
  }

  // C. Apps Móviles & UI/UX
  else if (
    hasAny(norm, ['app', 'apps', 'movil', 'moviles', 'ios', 'android', 'flutter', 'react native', 'pwa', 'diseno', 'ux', 'ui', 'interfaz', 'figma'])
  ) {
    baseResponse = {
      intent: 'app_design_expert',
      text: 'Con gusto te oriento en **Diseño UI/UX y Desarrollo de Aplicaciones Móviles**. Disponemos de las siguientes alternativas:\n\n' +
        '• 📱 **Apps Nativas / Multiplataforma (Flutter & React Native)**:\n' +
        '  - Publicación en App Store y Google Play con rendimiento fluido a 60 FPS, notificaciones push y biometría.\n\n' +
        '• ⚡ **Progressive Web Apps (PWA)**:\n' +
        '  - Instalables desde el navegador en segundos, sin comisiones de tiendas y con costo optimizado.\n\n' +
        '• 🎨 **Diseño UI/UX Apple-Grade (Figma 1:1)**:\n' +
        '  - Prototipos interactivos testeados con usuarios reales antes de programar para asegurar máxima retención.',
      suggestedChips: ['💻 Desarrollo Web Full-Stack', '🤖 Integrar IA en la App', '💰 Ver Presupuestos']
    };
  }

  // D. Programación Web & Software
  else if (
    hasAny(norm, ['web', 'programacion', 'desarrollo', 'software', 'saas', 'nextjs', 'next js', 'react', 'supabase', 'ecommerce', 'tienda', 'tiendas', 'backend', 'frontend', 'sistema', 'crm', 'panel'])
  ) {
    baseResponse = {
      intent: 'web_dev_expert',
      text: 'En **ThinkLab** construimos plataformas web y software con los más altos estándares tecnológicos de la industria:\n\n' +
        '• 🚀 **Next.js 14 (App Router) + TypeScript**:\n' +
        '  - Carga instantánea (<0.4s) con **100/100 en Google PageSpeed**, optimizada para SEO y conversión.\n\n' +
        '• 🗄️ **Supabase PostgreSQL & Vercel Edge**:\n' +
        '  - Seguridad bancaria con Row-Level Security (RLS), autenticación segura y latencia inferior a 15ms.\n\n' +
        '• 🛍️ **E-Commerce & Pasarelas de Pago**:\n' +
        '  - Pasarelas globales (Stripe) y locales de Paraguay (Bancard / Pagopar).\n\n' +
        '• 🏛️ **Propiedad 100% Tuya**:\n' +
        '  - Te transferimos el repositorio completo de GitHub con todo el código fuente sin ataduras.',
      suggestedChips: ['🤖 Añadir Chatbot con IA', '📱 Apps Móviles', '💰 Ver Planes de Inversión']
    };
  }

  // E. Comparativas (WordPress / Shopify vs Código a Medida)
  else if (
    hasAny(norm, ['wordpress', 'wp', 'shopify', 'wix', 'elementor', 'diferencia', 'ventajas', 'por que'])
  ) {
    baseResponse = {
      intent: 'comparison_expert',
      text: 'Las principales ventajas de desarrollar a medida en **ThinkLab** frente a WordPress o plantillas tradicionales son:\n\n' +
        '1. ⚡ **Velocidad Extrema (<0.4s vs 3-6s)**: Aumenta la conversión un 40%+ y mejora el ranking en Google.\n' +
        '2. 🛡️ **Seguridad Total**: Cero plugins vulnerables ni brechas de seguridad PHP.\n' +
        '3. 🤖 **IA Nativa**: Agentes de IA y bases vectoriales integradas en el Edge.\n' +
        '4. 👑 **Sin Comisiones Ocultas**: Todo el código y hosting bajo tu control total.',
      suggestedChips: ['💰 Ver Planes de Inversión', '🤖 Automatización con IA', '💬 WhatsApp']
    };
  }

  // F. Saludos y Bienvenida
  else if (
    hasAny(norm, ['hola', 'buenas', 'buen dia', 'buenos dias', 'buenas tardes', 'que tal', 'hi', 'hello', 'hey', 'saludos', 'inicio']) ||
    !norm
  ) {
    baseResponse = {
      intent: 'greeting_expert',
      text: '¡Hola! Es un gusto saludarte. Soy el asesor técnico y comercial de **ThinkLab** (https://thinklabpy.online/).\n\n' +
        'Soy experto en **programación web de alto rendimiento**, **diseño UI/UX y apps móviles**, y **automatización de chatbots con IA**.\n\n' +
        'Estoy listo para escuchar tus objetivos, evaluar las mejores alternativas para tu negocio y entregarte una propuesta técnica y comercial a medida.\n\n' +
        '¿Qué tipo de proyecto o solución buscas impulsar hoy?',
      suggestedChips: ['🚀 Desarrollo Web & Software', '🤖 Chatbots & Agentes de IA', '📱 Apps Móviles', '💬 WhatsApp (+595 983 463553)']
    };
  }

  // G. Fallback General
  else {
    baseResponse = {
      intent: 'consultative_reasoning',
      text: `Entendido tu requerimiento sobre "${message}". En **ThinkLab** evaluamos cada proyecto para ofrecerte la alternativa técnica con mayor retorno de inversión:\n\n` +
        `• 🌐 **Ingeniería Web**: Next.js 14 y Supabase con 100/100 PageSpeed.\n` +
        `• 🤖 **Chatbots & IA**: WhatsApp Business API oficial, RAG y workflows automáticos en n8n.\n` +
        `• 📱 **Apps Móviles**: Flutter y React Native con diseño Apple-grade.`,
      suggestedChips: ['💰 Ver Tarifas y Planes', '💬 Conversar por WhatsApp', '⚡ Ver Casos de Éxito']
    };
  }

  // --------------------------------------------------------------------------
  // 5. EVALUAR SI CORRESPONDE OFRECER LA LLAMADA DE NEGOCIOS (5to mensaje o posterior)
  // --------------------------------------------------------------------------
  if (isFifthOrLater) {
    const waUrl = 'https://wa.me/595983463553?text=Hola%20ThinkLab%2C%20deseo%20coordinar%20mi%20proyecto%20por%20WhatsApp';
    const closingCallOffer = '\n\n' +
      '────────────────────────\n' +
      '🤝 **Siguiente Paso Recomendado (Llamada de Negocios)**:\n' +
      'Hemos revisado los puntos clave de tu requerimiento. Para definir la **arquitectura definitiva**, plazos exactos y entregarte una **propuesta formal con cotización a medida**, coordinemos una **Llamada de Negocios de 15 a 25 minutos** con nuestro Lead Architect.\n\n' +
      `He desplegado el agendador interactivo aquí abajo para que elijas el horario que mejor te convenga, o si lo prefieres, podemos conectar directamente por [WhatsApp (+595 983 463553)](${waUrl}):`;

    return {
      intent: baseResponse.intent,
      text: baseResponse.text + closingCallOffer,
      action: 'show_booking_form',
      suggestedChips: [
        '🗓️ Seleccionar horario abajo',
        '💬 Conectar por WhatsApp (+595 983 463553)',
        '💰 Ver Planes de Inversión'
      ]
    };
  }

  // For messages 1, 2, 3, 4: Return the expert response smoothly without popping booking form
  return {
    intent: baseResponse.intent,
    text: baseResponse.text,
    action: 'none',
    suggestedChips: baseResponse.suggestedChips
  };
}

/**
 * Optional LLM Forwarder (OpenAI / Anthropic)
 */
async function callExternalLLM(message, history, systemPrompt, isFifthOrLater) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map((m) => ({ role: m.role, content: m.text })),
      { role: 'user', content: message }
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.4,
        max_tokens: 600
      })
    });

    const data = await res.json();
    if (data.choices && data.choices[0]) {
      const reply = data.choices[0].message.content;
      return {
        text: reply,
        intent: 'llm_generated',
        action: isFifthOrLater || reply.toLowerCase().includes('agendar') || reply.toLowerCase().includes('llamada de negocios') ? 'show_booking_form' : 'none',
        suggestedChips: ['🗓️ Agendar llamada de negocios', '💬 WhatsApp (+595 983 463553)', '💰 Ver Planes']
      };
    }
  }
  return null;
}

/**
 * POST /api/chat
 */
router.post('/', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const session = sessionId || 'session_' + (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'default');

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'El mensaje no puede estar vacío.' });
    }

    const state = getSessionState(session);
    const isFifthOrLater = state.messageCount >= 4; // next will be 5

    let botResponse = null;
    if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
      try {
        botResponse = await callExternalLLM(message, state.history, SYSTEM_PROMPT_DOC, isFifthOrLater);
      } catch (e) {
        console.warn('External LLM error, using native expert closer engine:', e.message);
      }
    }

    if (!botResponse) {
      botResponse = evaluateExpertResponse(message, session);
    }

    // Auto-detect contact info (email or phone) in chat messages
    const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = message.match(/(?:\+?595|0)[\d\s-]{7,13}/);

    if (emailMatch || phoneMatch) {
      try {
        const contactEmail = emailMatch ? emailMatch[0].toLowerCase() : `lead_${Date.now()}@thinklab.chat`;
        const contactPhone = phoneMatch ? phoneMatch[0].trim() : 'No especificado';
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

        const leadStmt = db.db.prepare(`
          INSERT INTO leads (name, email, company, services, budget, timeline, details, status, ip_address)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)
        `);
        leadStmt.run(
          'Prospecto Chatbot',
          contactEmail,
          'Think Bot AI Interaction',
          'Consulta / Lead Chatbot',
          'A evaluar en llamada',
          'Inmediato',
          `Contacto detectado en el chat. Tel: ${contactPhone}. Mensaje: "${message.substring(0, 300)}"`,
          clientIp
        );
        console.log(`🎯 [AUTO-LEAD CAPTURED FROM CHAT] Email: ${contactEmail} | Phone: ${contactPhone}`);
      } catch (autoLeadErr) {
        console.warn('⚠️ Could not auto-record lead from chat:', autoLeadErr.message);
      }
    }

    // Save in history & chat_logs
    state.history.push({ role: 'user', text: message });
    state.history.push({ role: 'assistant', text: botResponse.text });

    try {
      const stmt = db.db.prepare(`
        INSERT INTO chat_logs (session_id, user_message, bot_response, intent)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(session, message.substring(0, 500), botResponse.text, botResponse.intent);
      console.log(`💬 [CHAT LOGGED // ${session}] Msg #${state.messageCount} -> Intent: ${botResponse.intent}`);
    } catch (dbErr) {
      console.error('Error logging chat message:', dbErr);
    }

    return res.json({
      success: true,
      data: {
        text: botResponse.text,
        intent: botResponse.intent,
        action: botResponse.action,
        suggestedChips: botResponse.suggestedChips,
        messageCount: state.messageCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error in chat router:', error);
    return res.status(500).json({ success: false, error: 'Error interno del agente de ventas.' });
  }
});

module.exports = router;
