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
 * High-Reasoning & Dynamic 5th-Message Milestone Closer Engine (Bilingual ES / EN)
 */
function evaluateExpertResponse(message, sessionId, lang = 'es') {
  const norm = normalize(message);
  const state = getSessionState(sessionId);
  const isEn = lang === 'en';

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
      'escribir por whatsapp', 'pasame el numero', 'pasame tu contacto',
      'phone', 'number', 'human', 'representative', 'real person', 'direct contact'
    ])
  ) {
    const waUrl = isEn
      ? 'https://wa.me/595983463553?text=Hello%20ThinkLab%2C%20I%20am%20on%20your%20website%20and%20would%20like%20dedicated%20consulting%20for%20a%20project'
      : 'https://wa.me/595983463553?text=Hola%20ThinkLab%2C%20estoy%20en%20su%20sitio%20web%20y%20deseo%20atenci%C3%B3n%20personalizada%20para%20un%20proyecto';

    if (isEn) {
      return {
        intent: 'whatsapp_direct_connection',
        text: 'With great pleasure! You can connect directly and immediately with our technical and commercial team via **WhatsApp**:\n\n' +
          `• 📱 **Direct WhatsApp**: [+595 983 463553](${waUrl})\n` +
          '• 👤 **Attention**: Lead Architects & ThinkLab Specialists\n' +
          '• ⚡ **Average Response**: Under 5 minutes\n\n' +
          'Click the link above or tap the WhatsApp button below to start the conversation with your request pre-loaded.\n\n' +
          'Would you like me to share any technical details here in the meantime?',
        action: 'none',
        suggestedChips: [
          '💬 Open WhatsApp (+595 983 463553)',
          '🗓️ Book a Strategy Call',
          '💰 View Investment Plans'
        ]
      };
    }

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
  // 2. SOLICITUD EXPLÍCITA DE LLAMADA O AGENDAMIENTO
  // --------------------------------------------------------------------------
  if (
    hasAny(norm, [
      'agendar', 'cita', 'llamada', 'reunion', 'reservar', 'hablar con', 'asesor',
      'demo', 'horario', 'videollamada', 'meet', 'zoom',
      'schedule', 'book', 'call', 'meeting', 'appointment', 'calendar', 'time slot'
    ])
  ) {
    if (isEn) {
      return {
        intent: 'booking_direct',
        text: 'We would be delighted to coordinate your **Strategy & Business Call (15 to 25 min)** with our architecture and engineering team to scope your solution and deliver a formal quote.\n\n' +
          'I have enabled the date and time picker below so you can choose the slot that best fits your schedule.\n\n' +
          'Do you prefer a morning time (09:00 / 11:00 AM) or an afternoon time (02:30 / 04:00 PM)?',
        action: 'show_booking_form',
        suggestedChips: [
          '🗓️ Confirm time below',
          '💬 Or message on WhatsApp (+595 983 463553)',
          '💰 View Pricing Plans'
        ]
      };
    }

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
      'donde pago', 'como pago', 'quiero trabajar con ustedes', 'siguiente paso',
      'interested', 'start project', 'hire you', 'get started', 'buy', 'purchase',
      'lets do this', 'sign up', 'next step'
    ])
  ) {
    const waUrl = isEn
      ? 'https://wa.me/595983463553?text=Hello%20ThinkLab%2C%20I%20want%20to%20finalize%20my%20project%20onboarding'
      : 'https://wa.me/595983463553?text=Hola%20ThinkLab%2C%20quiero%20cerrar%20la%20contrataci%C3%B3n%20de%20mi%20proyecto';

    if (isEn) {
      return {
        intent: 'close_sale_immediate',
        text: 'Outstanding decision! We will secure an immediate start for your project and reserve our team\'s engineering bandwidth for this month.\n\n' +
          'To formalize the requirements and hand you your finalized proposal:\n\n' +
          '• 🗓️ **Option 1 (15-min Business Call)**: I have opened the scheduler below. Pick your preferred slot to coordinate with our Lead Architect.\n' +
          `• 💬 **Option 2 (Direct WhatsApp)**: Or if you prefer to close the onboarding today with zero delay, text us at [WhatsApp (+595 983 463553)](${waUrl}).\n\n` +
          'Would you prefer to coordinate via call or move forward right now on WhatsApp?',
        action: 'show_booking_form',
        suggestedChips: [
          '🗓️ Book call now',
          '💬 Close via WhatsApp (+595 983 463553)',
          '💰 View Investment Plans'
        ]
      };
    }

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
    hasAny(norm, [
      'precio', 'precios', 'costo', 'costos', 'cuanto', 'tarifa', 'tarifas', 'presupuesto',
      'presupuestos', 'cotizacion', 'cuotas', 'inversion', 'guarani', 'guaranies', 'gs',
      'price', 'pricing', 'cost', 'costs', 'quote', 'rates', 'investment', 'budget'
    ])
  ) {
    if (isEn) {
      baseResponse = {
        intent: 'pricing_expert',
        text: 'With complete transparency, here are our guaranteed investment tiers in **Guaraníes (Gs.)**:\n\n' +
          '• 🚀 **Launch Plan**\n' +
          '  - Investment: **Gs. 5,500,000 / mo** (or Gs. 11,500,000 one-time).\n' +
          '  - High-performance corporate web platform in Next.js 14, 100/100 Core Web Vitals, and Apple-grade UI.\n\n' +
          '• ⚡ **Growth Plan (Recommended / Highest ROI)**\n' +
          '  - Investment: **Gs. 11,500,000 / mo** (or Gs. 24,500,000 one-time).\n' +
          '  - Includes **Autonomous AI Agent (RAG) for WhatsApp/Web**, Supabase PostgreSQL, Stripe payments, and CRM sync.\n\n' +
          '• 🏛️ **Enterprise / Custom Software**\n' +
          '  - Investment: **Gs. 21,000,000 / mo** (or Gs. 45,000,000 one-time).\n' +
          '  - Custom Full-Stack engineering, Mobile Apps (iOS/Android), ElevenLabs Voice Agents, and dedicated engineer.\n\n' +
          'Which of these tiers aligns best with your company\'s goals?',
        suggestedChips: ['⚡ Growth Plan with AI (Gs. 11.5M)', '🚀 Launch Plan (Gs. 5.5M)', '🏛️ Custom Enterprise Plan', '💬 Quote on WhatsApp']
      };
    } else {
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
  }

  // B. Chatbots & Agentes de IA
  else if (
    hasAny(norm, [
      'chatbot', 'chatbots', 'ia', 'ai', 'agente', 'agentes', 'rag', 'n8n', 'make',
      'automatizacion', 'automatizaciones', 'alucinacion', 'voz', 'bot', 'bots',
      'agent', 'agents', 'automation', 'hallucination', 'voice'
    ])
  ) {
    if (isEn) {
      baseResponse = {
        intent: 'ai_chatbots_expert',
        text: 'At **ThinkLab** we are specialists in state-of-the-art autonomous AI agents and automation. Here are our premier solutions:\n\n' +
          '1. 💬 **WhatsApp Business API Sales Agent**:\n' +
          '   • Engages leads, qualifies prospects (BANT), shares catalogs/photos, and schedules calls 24/7 in <2 seconds.\n\n' +
          '2. 🧠 **RAG Assistant with Zero Hallucinations**:\n' +
          '   • Bound strictly to your standard operating manuals, policies, and database via Supabase PostgreSQL vector embeddings (`pgvector`).\n\n' +
          '3. ⚡ **Autonomous Workflows with n8n / Make**:\n' +
          '   • Seamlessly syncs every lead into HubSpot CRM, Google Sheets, or Notion and alerts your sales team.\n\n' +
          '4. 🎙️ **Voice AI Agents (ElevenLabs)**:\n' +
          '   • Ultra-realistic inbound and outbound telephone calls with real-time bidirectional WebSockets.',
        suggestedChips: ['💬 Try WhatsApp Demo', '💰 View AI Agent Pricing', '📱 Mobile Apps with AI']
      };
    } else {
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
  }

  // C. Apps Móviles & UI/UX
  else if (
    hasAny(norm, [
      'app', 'apps', 'movil', 'moviles', 'ios', 'android', 'flutter', 'react native',
      'pwa', 'diseno', 'ux', 'ui', 'interfaz', 'figma', 'mobile', 'design', 'interface'
    ])
  ) {
    if (isEn) {
      baseResponse = {
        intent: 'app_design_expert',
        text: 'We are delighted to advise you on **UI/UX Design and Mobile Application Development**:\n\n' +
          '• 📱 **Native / Cross-Platform Apps (Flutter & React Native)**:\n' +
          '  - App Store & Google Play deployment with 60 FPS performance, push notifications, and biometric auth.\n\n' +
          '• ⚡ **Progressive Web Apps (PWA)**:\n' +
          '  - Installs right from the browser in seconds with no app store commissions and optimized time-to-market.\n\n' +
          '• 🎨 **Apple-Grade UI/UX Design (Figma 1:1)**:\n' +
          '  - High-fidelity interactive prototypes user-tested prior to code engineering to ensure peak conversion.',
        suggestedChips: ['💻 Full-Stack Web Development', '🤖 Add AI to Mobile App', '💰 View Pricing Plans']
      };
    } else {
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
  }

  // D. Casos de Éxito / Portafolio / Ejemplos
  else if (
    hasAny(norm, [
      'caso', 'casos', 'exito', 'portafolio', 'ejemplo', 'ejemplos', 'muestra', 'muestras',
      'trabajos', 'clientes', 'aqui estamos', 'portfolio', 'case', 'cases', 'work', 'works', 'projects'
    ])
  ) {
    if (isEn) {
      baseResponse = {
        intent: 'portfolio_expert',
        text: 'Here are some of our **Featured Success Stories & Platforms in Production**:\n\n' +
          '• 🏆 **[Aquí Estamos (https://aqui-estamos-v3.vercel.app/)](https://aqui-estamos-v3.vercel.app/)**:\n' +
          '  - On-demand professional home services platform in Asunción.\n' +
          '  - 60-second booking, real-time flat rates in Guaraníes (Gs.), 100/100 PageSpeed, and WhatsApp API integration.\n\n' +
          '• 🛍️ **Vespera Atelier**:\n' +
          '  - Luxury E-Commerce with interactive Three.js 3D and Stripe checkout (+380% mobile conversion).\n\n' +
          '• 🤖 **Aura Systems**:\n' +
          '  - Real-time AI agent orchestration platform with sub-200ms latency.\n\n' +
          'Would you like us to architect a platform with this level of performance and conversion for your company?',
        suggestedChips: ['🌐 Visit Aquí Estamos Live', '🚀 Next.js 14 Engineering', '🤖 AI Chatbot', '💰 View Investment Plans']
      };
    } else {
      baseResponse = {
        intent: 'portfolio_expert',
        text: 'Te comparto algunos de nuestros **Casos de Éxito y Desarrollos en Producción**:\n\n' +
          '• 🏆 **[Aquí Estamos (https://aqui-estamos-v3.vercel.app/)](https://aqui-estamos-v3.vercel.app/)**:\n' +
          '  - Plataforma de reservas y servicios profesionales en Asunción.\n' +
          '  - Agendamiento en 60s, cotizador en tiempo real en Guaraníes (Gs.), 100/100 PageSpeed y conexión con WhatsApp API.\n\n' +
          '• 🛍️ **Vespera Atelier**:\n' +
          '  - Luxury E-Commerce con Three.js 3D y pasarela de pago Stripe (+380% de conversión móvil).\n\n' +
          '• 🤖 **Aura Systems**:\n' +
          '  - Orquestación de Agentes de IA en tiempo real con latencia inferior a 200ms.\n\n' +
          '¿Te gustaría que desarrollemos una plataforma con este nivel de velocidad y conversión para tu empresa?',
        suggestedChips: ['🌐 Ver Aquí Estamos en Vivo', '🚀 Desarrollo Web Next.js 14', '🤖 Chatbot con IA', '💰 Ver Presupuestos']
      };
    }
  }

  // E. Programación Web & Software
  else if (
    hasAny(norm, [
      'web', 'programacion', 'desarrollo', 'software', 'saas', 'nextjs', 'next js', 'react',
      'supabase', 'ecommerce', 'tienda', 'tiendas', 'backend', 'frontend', 'sistema', 'crm', 'panel',
      'development', 'engineering', 'platform', 'database'
    ])
  ) {
    if (isEn) {
      baseResponse = {
        intent: 'web_dev_expert',
        text: 'At **ThinkLab** we build digital platforms and web systems under the industry\'s highest engineering benchmarks:\n\n' +
          '• 🚀 **Next.js 14 (App Router) + TypeScript**:\n' +
          '  - Instant load times (<0.4s) with **100/100 Google PageSpeed**, optimized for SEO and conversion.\n\n' +
          '• 🗄️ **Supabase PostgreSQL & Vercel Edge**:\n' +
          '  - Bank-grade Row-Level Security (RLS), encrypted authentication, and latency below 15ms.\n\n' +
          '• 🛍️ **E-Commerce & Payment Gateways**:\n' +
          '  - Global payment processing (Stripe) and Paraguayan domestic gateways (Bancard / Pagopar).\n\n' +
          '• 🏛️ **100% Intellectual Property Ownership**:\n' +
          '  - We transfer the full GitHub repository and database infrastructure to you with zero lock-in.',
        suggestedChips: ['🤖 Add AI Chatbot', '📱 Mobile Apps', '💰 View Investment Plans']
      };
    } else {
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
  }

  // F. Comparativas (WordPress / Shopify vs Código a Medida)
  else if (
    hasAny(norm, [
      'wordpress', 'wp', 'shopify', 'wix', 'elementor', 'diferencia', 'ventajas', 'por que',
      'difference', 'advantages', 'why custom'
    ])
  ) {
    if (isEn) {
      baseResponse = {
        intent: 'comparison_expert',
        text: 'The primary advantages of custom engineering at **ThinkLab** versus legacy CMS like WordPress or templates are:\n\n' +
          '1. ⚡ **Extreme Page Speed (<0.4s vs 3-6s)**: Increases conversions by 40%+ and dramatically boosts Google ranking.\n' +
          '2. 🛡️ **Total Security**: Zero vulnerable third-party plugins and no PHP security exploits.\n' +
          '3. 🤖 **Native AI Integration**: Autonomous AI agents and vector databases embedded on the Edge.\n' +
          '4. 👑 **No Recurring Licensing Fees**: All source code, database, and infrastructure remain under your complete control.',
        suggestedChips: ['💰 View Investment Plans', '🤖 AI Automation', '💬 WhatsApp']
      };
    } else {
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
  }

  // G. Saludos y Bienvenida
  else if (
    hasAny(norm, [
      'hola', 'buenas', 'buen dia', 'buenos dias', 'buenas tardes', 'que tal',
      'hi', 'hello', 'hey', 'saludos', 'inicio', 'start'
    ]) ||
    !norm
  ) {
    if (isEn) {
      baseResponse = {
        intent: 'greeting_expert',
        text: 'Hello! It is a pleasure to connect. I am the technical and commercial advisor at **ThinkLab** (https://thinklabpy.online/).\n\n' +
          'I specialize in **high-performance web engineering**, **UI/UX design & mobile apps**, and **autonomous AI chatbot automation**.\n\n' +
          'I am ready to evaluate your requirements and recommend the optimal solution for your business.\n\n' +
          'What project or initiative would you like to build today?',
        suggestedChips: ['🚀 Web & Software Engineering', '🤖 AI Chatbots & Agents', '📱 Mobile App Design', '💬 WhatsApp (+595 983 463553)']
      };
    } else {
      baseResponse = {
        intent: 'greeting_expert',
        text: '¡Hola! Es un gusto saludarte. Soy el asesor técnico y comercial de **ThinkLab** (https://thinklabpy.online/).\n\n' +
          'Soy experto en **programación web de alto rendimiento**, **diseño UI/UX y apps móviles**, y **automatización de chatbots con IA**.\n\n' +
          'Estoy listo para escuchar tus objetivos, evaluar las mejores alternativas para tu negocio y entregarte una propuesta técnica y comercial a medida.\n\n' +
          '¿Qué tipo de proyecto o solución buscas impulsar hoy?',
        suggestedChips: ['🚀 Desarrollo Web & Software', '🤖 Chatbots & Agentes de IA', '📱 Apps Móviles', '💬 WhatsApp (+595 983 463553)']
      };
    }
  }

  // H. Fallback General
  else {
    if (isEn) {
      baseResponse = {
        intent: 'consultative_reasoning',
        text: `Understood your inquiry regarding "${message}". At **ThinkLab** we tailor every project to deliver maximum return on investment:\n\n` +
          `• 🌐 **Web Engineering**: Next.js 14 and Supabase with 100/100 PageSpeed.\n` +
          `• 🤖 **AI Agents**: Official WhatsApp Business API, RAG, and automated n8n workflows.\n` +
          `• 📱 **Mobile Apps**: Flutter and React Native with Apple-grade aesthetics.`,
        suggestedChips: ['💰 View Plans & Pricing', '💬 Chat via WhatsApp', '⚡ View Featured Portfolio']
      };
    } else {
      baseResponse = {
        intent: 'consultative_reasoning',
        text: `Entendido tu requerimiento sobre "${message}". En **ThinkLab** evaluamos cada proyecto para ofrecerte la alternativa técnica con mayor retorno de inversión:\n\n` +
          `• 🌐 **Ingeniería Web**: Next.js 14 y Supabase con 100/100 PageSpeed.\n` +
          `• 🤖 **Chatbots & IA**: WhatsApp Business API oficial, RAG y workflows automáticos en n8n.\n` +
          `• 📱 **Apps Móviles**: Flutter y React Native con diseño Apple-grade.`,
        suggestedChips: ['💰 Ver Tarifas y Planes', '💬 Conversar por WhatsApp', '⚡ Ver Casos de Éxito']
      };
    }
  }

  // --------------------------------------------------------------------------
  // 5. EVALUAR SI CORRESPONDE OFRECER LA LLAMADA DE NEGOCIOS (5to mensaje o posterior)
  // --------------------------------------------------------------------------
  if (isFifthOrLater) {
    const waUrl = isEn
      ? 'https://wa.me/595983463553?text=Hello%20ThinkLab%2C%20I%20want%20to%20coordinate%20my%20project%20via%20WhatsApp'
      : 'https://wa.me/595983463553?text=Hola%20ThinkLab%2C%20deseo%20coordinar%20mi%20proyecto%20por%20WhatsApp';

    const closingCallOffer = isEn
      ? '\n\n' +
        '────────────────────────\n' +
        '🤝 **Recommended Next Step (Strategy Call)**:\n' +
        'We have explored the key parameters of your requirements. To finalize your **technical architecture**, exact delivery dates, and provide a **formal bespoke proposal**, let\'s schedule a **15 to 25-minute Strategy Call** with our Lead Architect.\n\n' +
        `I have deployed the interactive scheduler below so you can choose your preferred time slot, or if you prefer, text us directly on [WhatsApp (+595 983 463553)](${waUrl}):`
      : '\n\n' +
        '────────────────────────\n' +
        '🤝 **Siguiente Paso Recomendado (Llamada de Negocios)**:\n' +
        'Hemos revisado los puntos clave de tu requerimiento. Para definir la **arquitectura definitiva**, plazos exactos y entregarte una **propuesta formal con cotización a medida**, coordinemos una **Llamada de Negocios de 15 a 25 minutos** con nuestro Lead Architect.\n\n' +
        `He desplegado el agendador interactivo aquí abajo para que elijas el horario que mejor te convenga, o si lo prefieres, podemos conectar directamente por [WhatsApp (+595 983 463553)](${waUrl}):`;

    return {
      intent: baseResponse.intent,
      text: baseResponse.text + closingCallOffer,
      action: 'show_booking_form',
      suggestedChips: isEn
        ? [
            '🗓️ Select time below',
            '💬 Connect on WhatsApp (+595 983 463553)',
            '💰 View Investment Plans'
          ]
        : [
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
    const { message, sessionId, lang } = req.body;
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
      botResponse = evaluateExpertResponse(message, session, lang || 'es');
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

router.evaluateExpertResponse = evaluateExpertResponse;

module.exports = router;
