/**
 * Think Lab. - Apple-Inspired Interactive Engine
 * Author: Think Lab. Development & AI Engineering
 * Style: Clean, Sober, Ultra-Refined
 */

let currentLang = localStorage.getItem('thinklab_lang') || 'es';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initLanguageSwitcher();
  initCanvasBackground();
  initNavbarScroll();
  initShowcaseTabs();
  initRoiCalculator();
  initProcessTimeline();
  initIntakeWizard();
  initPricingToggle();
  initFaqAccordion();
  initThinkBotAI();
  initAiChatbotShowcase();
});

/* ==========================================================================
   0. Apple-Grade Bilingual Language Switcher (ES / EN)
   ========================================================================== */
function setLanguage(lang) {
  if (lang !== 'es' && lang !== 'en') lang = 'es';
  currentLang = lang;
  localStorage.setItem('thinklab_lang', lang);
  document.documentElement.lang = lang;

  if (typeof translations !== 'undefined' && translations[lang]) {
    const dict = translations[lang];

    // Update text content with i18n
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        el.innerHTML = dict[key];
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) {
        el.placeholder = dict[key];
      }
    });

    // Update titles
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key] !== undefined) {
        el.title = dict[key];
      }
    });
  }

  // Update switcher button pill states across all instances
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const btnLang = btn.getAttribute('data-lang');
    if (btnLang === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Trigger dynamic component updates
  if (window._updateRoiCalculator) window._updateRoiCalculator();
  if (window._updateProcessTimeline) window._updateProcessTimeline();
  if (window._updateAiShowcase) window._updateAiShowcase();
  if (window._updatePricing) window._updatePricing();
  if (window._updateIntake) window._updateIntake();
  if (window._updateThinkBot) window._updateThinkBot();
}

function initLanguageSwitcher() {
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetLang = btn.getAttribute('data-lang');
      if (targetLang && targetLang !== currentLang) {
        setLanguage(targetLang);
      }
    });
  });

  // Apply initially stored language
  setLanguage(currentLang);
}

/* ==========================================================================
   1. Subtle Apple-grade Canvas Background
   ========================================================================== */
function initCanvasBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const particleCount = window.innerWidth < 768 ? 25 : 45;
  let mouse = { x: null, y: null, radius: 120 };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = (Math.random() - 0.5) * 0.25;
      this.radius = Math.random() * 1.5 + 0.8;
      this.color = Math.random() > 0.6 ? '#a3e635' : '#ffffff';
      this.alpha = Math.random() * 0.35 + 0.1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      if (mouse.x && mouse.y) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 1.2;
          this.y -= (dy / dist) * force * 1.2;
        }
      }
    }
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  function connectParticles() {
    const maxDist = 110;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const opacity = (1 - dist / maxDist) * 0.08;
          ctx.strokeStyle = '#ffffff';
          ctx.globalAlpha = opacity;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    connectParticles();
    requestAnimationFrame(animate);
  }

  resize();
  createParticles();
  animate();
}

/* ==========================================================================
   2. Navbar Scroll Behavior
   ========================================================================== */
function initNavbarScroll() {
  const navbar = document.getElementById('main-nav');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('apple-nav', 'py-3');
      navbar.classList.remove('py-4');
    } else {
      navbar.classList.remove('apple-nav', 'py-3');
      navbar.classList.add('py-4');
    }
  });

  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }
}

/* ==========================================================================
   3. Live Showcase Tabs
   ========================================================================== */
function initShowcaseTabs() {
  const tabBtns = document.querySelectorAll('[data-showcase-tab]');
  const tabPanels = document.querySelectorAll('[data-showcase-panel]');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-showcase-tab');

      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      tabPanels.forEach((panel) => {
        if (panel.getAttribute('data-showcase-panel') === target) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });
    });
  });
}

/* ==========================================================================
   4. ROI Growth Calculator
   ========================================================================== */
function initRoiCalculator() {
  const trafficInput = document.getElementById('roi-traffic');
  const ticketInput = document.getElementById('roi-ticket');
  const convInput = document.getElementById('roi-conversion');

  const trafficVal = document.getElementById('roi-traffic-val');
  const ticketVal = document.getElementById('roi-ticket-val');
  const convVal = document.getElementById('roi-conversion-val');

  const currRevenueVal = document.getElementById('roi-curr-revenue');
  const projRevenueVal = document.getElementById('roi-proj-revenue');
  const extraAnnualVal = document.getElementById('roi-extra-annual');
  const multiplierVal = document.getElementById('roi-multiplier');
  const progressBar = document.getElementById('roi-progress-bar');

  if (!trafficInput || !ticketInput || !convInput) return;

  function formatCurrency(num) {
    const locale = currentLang === 'en' ? 'en-US' : 'es-PY';
    return (
      'Gs. ' +
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(Math.round(num))
    );
  }

  function updateCalculator() {
    const traffic = parseInt(trafficInput.value);
    const ticket = parseInt(ticketInput.value);
    const convRate = parseFloat(convInput.value);
    const locale = currentLang === 'en' ? 'en-US' : 'es-PY';
    const visitsUnit = currentLang === 'en' ? ' visits' : ' visitas';
    const yearSuffix = currentLang === 'en' ? '/yr' : '/año';

    trafficVal.textContent = new Intl.NumberFormat(locale).format(traffic) + visitsUnit;
    ticketVal.textContent = formatCurrency(ticket);
    convVal.textContent = convRate.toFixed(1) + '%';

    const currentMonthly = traffic * (convRate / 100) * ticket;
    const projectedConvRate = Math.min(convRate * 2.5, 9.5);
    const projectedMonthly = traffic * (projectedConvRate / 100) * ticket;

    const extraMonthly = projectedMonthly - currentMonthly;
    const extraAnnual = extraMonthly * 12;
    const multiplier = (projectedMonthly / (currentMonthly || 1)).toFixed(1);

    if (currRevenueVal) currRevenueVal.textContent = formatCurrency(currentMonthly);
    if (projRevenueVal) projRevenueVal.textContent = formatCurrency(projectedMonthly);
    if (extraAnnualVal) extraAnnualVal.textContent = '+' + formatCurrency(extraAnnual) + yearSuffix;
    if (multiplierVal) multiplierVal.textContent = multiplier + 'x';

    if (progressBar) {
      const percentage = Math.min(Math.round((projectedMonthly / (currentMonthly * 3 || 1)) * 100), 100);
      progressBar.style.width = `${Math.max(percentage, 25)}%`;
    }
  }

  window._updateRoiCalculator = updateCalculator;

  const roiCtaBtn = document.getElementById('roi-audit-cta-btn');
  if (roiCtaBtn) {
    roiCtaBtn.addEventListener('click', () => {
      const traffic = parseInt(trafficInput.value);
      const ticket = parseInt(ticketInput.value);
      const convRate = parseFloat(convInput.value);

      fetch('/api/roi-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traffic,
          ticket_gs: ticket,
          conversion_rate: convRate,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const toastMsg = currentLang === 'en'
              ? 'ROI assessment registered for your conversion audit.'
              : 'Evaluación de ROI registrada para tu auditoría.';
            showToast(toastMsg);
          }
        })
        .catch((err) => console.log('Assessment saved:', err));
    });
  }

  [trafficInput, ticketInput, convInput].forEach((input) => {
    input.addEventListener('input', updateCalculator);
  });

  updateCalculator();
}

/* ==========================================================================
   5. The 5-Step Process Timeline
   ========================================================================== */
function initProcessTimeline() {
  const PROCESS_STEPS = {
    es: [
      {
        num: '01',
        title: 'Diagnóstico & Estrategia de Conversión',
        desc: 'Analizamos tu modelo de negocio, usuarios objetivo y competidores para definir la arquitectura técnica, wireframes y stack óptimo.',
        deliverables: ['Documento de Arquitectura', 'User Journey Maps', 'Matriz de Requerimientos'],
        duration: 'Semana 1',
      },
      {
        num: '02',
        title: 'Diseño de Interfaz Apple-grade (UI/UX)',
        desc: 'Prototipado interactivo en Figma con estética sobria, modo oscuro nativo, microinteracciones y estándares de diseño de clase mundial.',
        deliverables: ['Design System en Figma', 'Prototipo Interactivo 1:1', 'Assets Optimizados'],
        duration: 'Semana 2',
      },
      {
        num: '03',
        title: 'Desarrollo Frontend & Backend',
        desc: 'Ingeniería con Next.js 14, TypeScript y bases de datos Supabase. Código modular, tipado seguro y automatizaciones de IA.',
        deliverables: ['Código Fuente en GitHub', 'Integración Supabase/Auth', 'Agentes de IA Activos'],
        duration: 'Semana 3',
      },
      {
        num: '04',
        title: 'Rendimiento Extremo, Seguridad & SEO',
        desc: 'Pruebas de latencia, seguridad a nivel de base de datos (RLS) y optimización para puntuación 100/100 en Google Core Web Vitals.',
        deliverables: ['Optimización 100/100 PageSpeed', 'SEO Estructurado', 'Políticas RLS Activas'],
        duration: 'Semana 4',
      },
      {
        num: '05',
        title: 'Despliegue Global & Soporte Continuo',
        desc: 'Publicación en infraestructura Edge de Vercel con CDN mundial, SSL automático y monitoreo de rendimiento 24/7.',
        deliverables: ['Despliegue en Vercel Edge', 'Dashboard de Analíticas', 'Soporte y Garantía'],
        duration: 'Continuo',
      },
    ],
    en: [
      {
        num: '01',
        title: 'Diagnosis & Conversion Strategy',
        desc: 'We analyze your business model, target audiences, and competitors to establish technical architecture, wireframes, and the optimal tech stack.',
        deliverables: ['Architecture Blueprint', 'User Journey Maps', 'Requirements Matrix'],
        duration: 'Week 1',
      },
      {
        num: '02',
        title: 'Apple-Grade UI/UX Interface Design',
        desc: 'Interactive Figma prototyping with sober aesthetics, native dark mode, micro-interactions, and world-class design standards.',
        deliverables: ['Design System in Figma', '1:1 Interactive Prototype', 'Optimized Assets'],
        duration: 'Week 2',
      },
      {
        num: '03',
        title: 'Frontend & Backend Engineering',
        desc: 'High-performance engineering with Next.js 14, TypeScript, and Supabase. Modular, type-safe architecture with autonomous AI integrations.',
        deliverables: ['GitHub Source Code', 'Supabase/Auth Integration', 'Active AI Agents'],
        duration: 'Week 3',
      },
      {
        num: '04',
        title: 'Extreme Performance, Security & SEO',
        desc: 'Latency benchmarks, database-level Row Level Security (RLS), and rigorous 100/100 Google Core Web Vitals optimization.',
        deliverables: ['100/100 PageSpeed Score', 'Structured Schema SEO', 'Active RLS Policies'],
        duration: 'Week 4',
      },
      {
        num: '05',
        title: 'Global Edge Deployment & Ongoing Support',
        desc: 'Deployment to Vercel Global Edge CDN with automated SSL, continuous monitoring, and round-the-clock SLA guarantee.',
        deliverables: ['Vercel Edge Deployment', 'Analytics Dashboard', 'Warranty & Support'],
        duration: 'Ongoing',
      },
    ]
  };

  const stepList = document.getElementById('process-step-list');
  const stepDetailContainer = document.getElementById('process-step-detail');

  if (!stepList || !stepDetailContainer) return;

  let currentActiveStep = 0;

  function renderStepDetail(index) {
    currentActiveStep = index;
    const steps = PROCESS_STEPS[currentLang] || PROCESS_STEPS.es;
    const s = steps[index];
    const phaseLabel = currentLang === 'en' ? 'PHASE' : 'FASE';
    const deliverablesLabel = currentLang === 'en' ? 'Deliverables:' : 'Entregables:';

    stepDetailContainer.innerHTML = `
      <div class="apple-card p-5 sm:p-8 border border-white/10">
        <div class="flex items-center justify-between mb-4">
          <span class="apple-pill-lime text-xs font-mono font-semibold">
            ${phaseLabel} ${s.num} • ${s.duration}
          </span>
          <span class="text-2xl sm:text-3xl font-bold text-white/20 font-mono">${s.num}</span>
        </div>
        <h3 class="text-xl sm:text-2xl font-bold text-white mb-2">${s.title}</h3>
        <p class="text-[#86868b] leading-relaxed mb-5 sm:mb-6 text-xs sm:text-sm">${s.desc}</p>
        
        <div class="border-t border-white/10 pt-4 sm:pt-5">
          <h4 class="text-xs font-mono uppercase text-[#86868b] tracking-wider mb-2.5 sm:mb-3">${deliverablesLabel}</h4>
          <ul class="space-y-1.5 sm:space-y-2">
            ${s.deliverables
              .map(
                (d) => `
              <li class="flex items-center gap-2 text-xs sm:text-sm text-[#f5f5f7]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#a3e635] flex-shrink-0"></span>
                <span>${d}</span>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      </div>
    `;
  }

  window._updateProcessTimeline = () => renderStepDetail(currentActiveStep);

  stepList.querySelectorAll('[data-step-btn]').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      stepList.querySelectorAll('[data-step-btn]').forEach((b) => {
        b.classList.remove('border-white/30', 'bg-white/10', 'text-white');
        b.classList.add('border-white/5', 'bg-white/[0.02]', 'text-[#86868b]');
      });
      btn.classList.add('border-white/30', 'bg-white/10', 'text-white');
      btn.classList.remove('border-white/5', 'bg-white/[0.02]', 'text-[#86868b]');
      renderStepDetail(index);
    });
  });

  renderStepDetail(0);
}



/* ==========================================================================
   6. Multi-Step Intake Wizard
   ========================================================================== */
function initIntakeWizard() {
  let currentStep = 1;
  const totalSteps = 3;

  const step1 = document.getElementById('intake-step-1');
  const step2 = document.getElementById('intake-step-2');
  const step3 = document.getElementById('intake-step-3');
  const resultPanel = document.getElementById('intake-result');

  const next1 = document.getElementById('intake-next-1');
  const next2 = document.getElementById('intake-next-2');
  const back2 = document.getElementById('intake-back-2');
  const back3 = document.getElementById('intake-back-3');
  const submitBtn = document.getElementById('intake-submit');

  const progressBar = document.getElementById('intake-progress');
  const stepIndicator = document.getElementById('intake-indicator');

  function updateSteps() {
    if (progressBar) progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;
    if (stepIndicator) {
      stepIndicator.textContent = currentLang === 'en'
        ? `Step ${currentStep} of ${totalSteps}`
        : `Paso ${currentStep} de ${totalSteps}`;
    }

    [step1, step2, step3].forEach((s, idx) => {
      if (s) {
        if (idx + 1 === currentStep) {
          s.classList.remove('hidden');
        } else {
          s.classList.add('hidden');
        }
      }
    });
  }

  window._updateIntake = updateSteps;

  if (next1) {
    next1.addEventListener('click', () => {
      currentStep = 2;
      updateSteps();
    });
  }

  if (next2) {
    next2.addEventListener('click', () => {
      currentStep = 3;
      updateSteps();
    });
  }

  if (back2) {
    back2.addEventListener('click', () => {
      currentStep = 1;
      updateSteps();
    });
  }

  if (back3) {
    back3.addEventListener('click', () => {
      currentStep = 2;
      updateSteps();
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('intake-email')?.value?.trim();
      const name = document.getElementById('intake-name')?.value?.trim();
      const phone = document.getElementById('intake-phone')?.value?.trim() || '';
      const company = document.getElementById('intake-website')?.value?.trim() || document.getElementById('intake-company')?.value?.trim() || '';
      const details = document.getElementById('intake-details')?.value?.trim() || '';

      if (!email || !name) {
        const errorMsg = currentLang === 'en'
          ? 'Please complete your name and corporate email.'
          : 'Por favor completa tu nombre y correo electrónico.';
        showToast(errorMsg);
        return;
      }

      // Collect selected goal / services from step 1
      const selectedRadio = step1 ? step1.querySelector('input[name="goal"]:checked') : null;
      const selectedGoalText = selectedRadio ? (selectedRadio.nextElementSibling?.textContent?.trim() || selectedRadio.value) : null;
      const selectedServices = selectedGoalText ? [selectedGoalText] : ['Plataforma Web Completa'];

      // Collect selected budget & timeline from step 2
      const budgetSelect = step2 ? step2.querySelector('select') : null;
      const budgetText = budgetSelect ? budgetSelect.options[budgetSelect.selectedIndex]?.text : 'Gs. 25.000.000 - Gs. 50.000.000';
      const timelineSelect = step2 ? step2.querySelectorAll('select')[1] : null;
      const timelineText = timelineSelect ? timelineSelect.options[timelineSelect.selectedIndex]?.text : 'En el transcurso del mes';

      step3.classList.add('hidden');
      if (resultPanel) {
        resultPanel.classList.remove('hidden');
        const loadingTitle = currentLang === 'en'
          ? 'Registering Project in Think Lab.'
          : 'Registrando Propuesta en Think Lab.';
        const loadingSub = currentLang === 'en'
          ? 'Connecting to database and assigning Lead Architect...'
          : 'Conectando con base de datos y asignando Lead Architect...';

        resultPanel.innerHTML = `
          <div class="text-center py-8">
            <div class="w-10 h-10 border-2 border-white/20 border-t-[#a3e635] rounded-full animate-spin mx-auto mb-4"></div>
            <h4 class="text-lg font-semibold text-white mb-1">${loadingTitle}</h4>
            <p class="text-xs text-[#86868b] font-mono">${loadingSub}</p>
          </div>
        `;

        try {
          const response = await fetch('/api/leads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name,
              email,
              phone,
              company,
              services: selectedServices.length > 0 ? selectedServices : ['Plataforma Web Completa'],
              budget: budgetText,
              timeline: timelineText,
              details,
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            const successTitle = currentLang === 'en'
              ? `Application Received (Lead #${data.leadId})`
              : `Solicitud Recibida (Lead #${data.leadId})`;
            const confSub = currentLang === 'en'
              ? `Confirmation recorded for ${email}`
              : `Confirmación registrada para ${email}`;
            const bodyMsg = currentLang === 'en'
              ? `Thank you, <strong>${name}</strong>. Your requirement for <strong>${company || 'your company'}</strong> has been stored successfully in our database. A Think Lab. Lead Architect will be in touch shortly.`
              : `Gracias, <strong>${name}</strong>. Tu requerimiento para <strong>${company || 'tu empresa'}</strong> ha sido guardado exitosamente en nuestra base de datos. Un Lead Architect de <strong>Think Lab.</strong> se pondrá en contacto en breve.`;
            const statusLabel = currentLang === 'en' ? '● Status: Assigned to Lead Architect' : '● Estado: Asignado a Arquitectura';
            const servLabel = currentLang === 'en' ? 'Services:' : 'Servicios:';
            const budgetLabel = currentLang === 'en' ? 'Budget:' : 'Presupuesto:';

            resultPanel.innerHTML = `
              <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-left">
                <div class="flex items-center gap-3 mb-3">
                  <span class="w-7 h-7 rounded-full bg-[#a3e635]/20 text-[#a3e635] flex items-center justify-center font-bold text-xs">✓</span>
                  <div>
                    <h4 class="text-base font-semibold text-white">${successTitle}</h4>
                    <p class="text-xs text-[#86868b]">${confSub}</p>
                  </div>
                </div>
                <p class="text-sm text-[#86868b] mb-4 leading-relaxed">
                  ${bodyMsg}
                </p>
                <div class="p-3 rounded-xl bg-black/50 border border-white/[0.06] text-xs font-mono text-[#86868b] space-y-1">
                  <div class="text-[#a3e635]">${statusLabel}</div>
                  <div>${servLabel} ${data.data.services}</div>
                  <div>${budgetLabel} ${data.data.budget}</div>
                </div>
              </div>
            `;
            showToast(currentLang === 'en' ? 'Project application submitted successfully to Think Lab.!' : '¡Solicitud registrada con éxito en Think Lab.!');
          } else {
            throw new Error(data.error || 'Error al procesar la solicitud');
          }
        } catch (error) {
          console.error('Error submitting lead:', error);
          resultPanel.innerHTML = `
            <div class="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-left">
              <h4 class="text-sm font-semibold text-red-400 mb-1">${currentLang === 'en' ? 'Connection Error' : 'Hubo un problema al conectar con el servidor'}</h4>
              <p class="text-xs text-[#86868b] mb-3">${error.message || (currentLang === 'en' ? 'Could not save information.' : 'No se pudo guardar la información.')}</p>
              <button id="intake-retry-btn" class="btn-apple-secondary text-xs py-1.5 px-3">
                ${currentLang === 'en' ? 'Try Again' : 'Intentar Nuevamente'}
              </button>
            </div>
          `;
          document.getElementById('intake-retry-btn')?.addEventListener('click', () => {
            resultPanel.classList.add('hidden');
            step3.classList.remove('hidden');
          });
        }
      }
    });
  }
}

/* ==========================================================================
   8. Pricing Toggle
   ========================================================================== */
function initPricingToggle() {
  const toggleMonthly = document.getElementById('pricing-monthly-btn');
  const toggleProject = document.getElementById('pricing-project-btn');

  const starterPrice = document.getElementById('price-starter');
  const growthPrice = document.getElementById('price-growth');
  const enterprisePrice = document.getElementById('price-enterprise');

  const periodLabels = document.querySelectorAll('.price-period');

  if (!toggleMonthly || !toggleProject) return;

  let isMonthly = true;

  function updatePricingDisplay() {
    const locale = currentLang === 'en' ? 'en-US' : 'es-PY';
    if (isMonthly) {
      toggleMonthly.classList.add('bg-white', 'text-black');
      toggleMonthly.classList.remove('text-[#86868b]');
      toggleProject.classList.remove('bg-white', 'text-black');
      toggleProject.classList.add('text-[#86868b]');

      if (starterPrice) starterPrice.textContent = 'Gs. ' + new Intl.NumberFormat(locale).format(5500000);
      if (growthPrice) growthPrice.textContent = 'Gs. ' + new Intl.NumberFormat(locale).format(11500000);
      if (enterprisePrice) enterprisePrice.textContent = 'Gs. ' + new Intl.NumberFormat(locale).format(21000000);

      periodLabels.forEach((l) => (l.textContent = currentLang === 'en' ? '/mo (Ongoing Retainer)' : '/mes (Retainer Continuo)'));
    } else {
      toggleProject.classList.add('bg-white', 'text-black');
      toggleProject.classList.remove('text-[#86868b]');
      toggleMonthly.classList.remove('bg-white', 'text-black');
      toggleMonthly.classList.add('text-[#86868b]');

      if (starterPrice) starterPrice.textContent = 'Gs. ' + new Intl.NumberFormat(locale).format(11500000);
      if (growthPrice) growthPrice.textContent = 'Gs. ' + new Intl.NumberFormat(locale).format(24500000);
      if (enterprisePrice) enterprisePrice.textContent = 'Gs. ' + new Intl.NumberFormat(locale).format(45000000);

      periodLabels.forEach((l) => (l.textContent = currentLang === 'en' ? '/project (One-Time Payment)' : '/proyecto (Pago Único)'));
    }
  }

  window._updatePricing = updatePricingDisplay;

  toggleMonthly.addEventListener('click', () => {
    isMonthly = true;
    updatePricingDisplay();
  });

  toggleProject.addEventListener('click', () => {
    isMonthly = false;
    updatePricingDisplay();
  });

  updatePricingDisplay();
}

/* ==========================================================================
   9. FAQ Accordion
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach((other) => other.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   10. Think Bot AI - Intelligent Chat & Appointment Agent
   ========================================================================== */
function initThinkBotAI() {
  const toggleBtn = document.getElementById('thinkbot-toggle-btn');
  const closeBtn = document.getElementById('thinkbot-close-btn');
  const windowEl = document.getElementById('thinkbot-window');
  const form = document.getElementById('thinkbot-form');
  const input = document.getElementById('thinkbot-input');
  const messagesContainer = document.getElementById('thinkbot-messages');
  const chipsContainer = document.getElementById('thinkbot-chips');
  const bookingDrawer = document.getElementById('thinkbot-booking-drawer');
  const cancelBookingBtn = document.getElementById('thinkbot-cancel-booking');
  const bookingSubmitBtn = document.getElementById('booking-submit-btn');

  const bookingDateInput = document.getElementById('booking-date');
  const bookingNameInput = document.getElementById('booking-name');
  const bookingEmailInput = document.getElementById('booking-email');
  const bookingTimeInput = document.getElementById('booking-time');

  const resetBtn = document.getElementById('thinkbot-reset-btn');

  if (!toggleBtn || !windowEl) return;

  // Set min date to tomorrow
  if (bookingDateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    bookingDateInput.min = tomorrow.toISOString().split('T')[0];
    bookingDateInput.value = tomorrow.toISOString().split('T')[0];
  }

  let currentChatSessionId = localStorage.getItem('thinklab_chat_session_id');
  if (!currentChatSessionId) {
    currentChatSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('thinklab_chat_session_id', currentChatSessionId);
  }

  let isOpen = false;

  function toggleChat(open) {
    isOpen = typeof open === 'boolean' ? open : !isOpen;
    if (isOpen) {
      windowEl.classList.remove('hidden');
      requestAnimationFrame(() => {
        windowEl.classList.remove('scale-95', 'opacity-0');
        windowEl.classList.add('scale-100', 'opacity-100');
      });
      if (input) input.focus();
      scrollToBottom();
    } else {
      windowEl.classList.remove('scale-100', 'opacity-100');
      windowEl.classList.add('scale-95', 'opacity-0');
      setTimeout(() => {
        windowEl.classList.add('hidden');
      }, 300);
    }
  }

  toggleBtn.addEventListener('click', () => toggleChat());
  if (closeBtn) closeBtn.addEventListener('click', () => toggleChat(false));

  function renderInitialThinkBotMessages() {
    const dict = translations[currentLang] || translations.es;
    return `
      <div class="flex items-start gap-2.5" id="thinkbot-welcome-msg">
        <div class="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-[10px] text-[#a3e635] font-mono">
          ✦
        </div>
        <div class="max-w-[85%] bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-sm p-3 text-[#f5f5f7] leading-relaxed space-y-2">
          <p data-i18n="thinkbot_welcome_p1">${dict.thinkbot_welcome_p1}</p>
          <p class="text-[#86868b]" data-i18n="thinkbot_welcome_p2">${dict.thinkbot_welcome_p2}</p>
          <p class="text-white font-medium" data-i18n="thinkbot_welcome_p3">${dict.thinkbot_welcome_p3}</p>
        </div>
      </div>
      <div id="thinkbot-chips" class="flex flex-wrap gap-1.5 pt-1 pl-8">
        <button class="thinkbot-chip" data-chip="${dict.thinkbot_chip_web}" data-i18n="thinkbot_chip_web">${dict.thinkbot_chip_web}</button>
        <button class="thinkbot-chip" data-chip="${dict.thinkbot_chip_ai}" data-i18n="thinkbot_chip_ai">${dict.thinkbot_chip_ai}</button>
        <button class="thinkbot-chip" data-chip="${dict.thinkbot_chip_mobile}" data-i18n="thinkbot_chip_mobile">${dict.thinkbot_chip_mobile}</button>
        <button class="thinkbot-chip" data-chip="${dict.thinkbot_chip_book}" data-i18n="thinkbot_chip_book">${dict.thinkbot_chip_book}</button>
      </div>
    `;
  }

  function attachChipListeners() {
    const chipsEl = messagesContainer.querySelector('#thinkbot-chips');
    if (chipsEl) {
      chipsEl.querySelectorAll('[data-chip]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const query = btn.getAttribute('data-chip');
          sendMessage(query);
        });
      });
    }
  }

  window._updateThinkBot = () => {
    // Only update initial greeting if user hasn't started conversing
    const userMessages = messagesContainer ? messagesContainer.querySelectorAll('.justify-end') : [];
    if (userMessages.length === 0 && messagesContainer) {
      messagesContainer.innerHTML = renderInitialThinkBotMessages();
      attachChipListeners();
    }
  };

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentChatSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('thinklab_chat_session_id', currentChatSessionId);
      if (messagesContainer) {
        messagesContainer.innerHTML = renderInitialThinkBotMessages();
        attachChipListeners();
      }
      if (bookingDrawer) bookingDrawer.classList.add('hidden');
      showToast(currentLang === 'en' ? 'Conversation reset.' : 'Conversación reiniciada.');
    });
  }

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function appendUserMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'flex justify-end';
    bubble.innerHTML = `
      <div class="max-w-[85%] bg-[#a3e635] text-black font-medium rounded-2xl rounded-tr-sm p-3 text-xs leading-relaxed shadow-sm">
        ${escapeHtml(text)}
      </div>
    `;
    messagesContainer.appendChild(bubble);
    scrollToBottom();
  }

  function appendBotMessage(text, isHtml = false) {
    const bubble = document.createElement('div');
    bubble.className = 'flex items-start gap-2.5';
    const formatted = isHtml ? text : formatMarkdownText(text);
    bubble.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-[10px] text-[#a3e635] font-mono">
        ✦
      </div>
      <div class="max-w-[85%] bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-sm p-3 text-[#f5f5f7] leading-relaxed space-y-2">
        ${formatted}
      </div>
    `;
    messagesContainer.appendChild(bubble);
    scrollToBottom();
  }

  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'thinkbot-typing';
    indicator.className = 'flex items-start gap-2.5 animate-fade-in';
    const thinkingText = currentLang === 'en' ? 'Thinking...' : 'Pensando...';
    indicator.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-[10px] text-[#a3e635] font-mono animate-pulse">
        ✦
      </div>
      <div class="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2">
        <div class="flex items-center gap-1.5">
          <span class="thinkbot-typing-dot"></span>
          <span class="thinkbot-typing-dot"></span>
          <span class="thinkbot-typing-dot"></span>
        </div>
        <span class="text-[10px] text-[#86868b] font-mono tracking-wide">${thinkingText}</span>
      </div>
    `;
    messagesContainer.appendChild(indicator);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('thinkbot-typing');
    if (indicator) indicator.remove();
  }

  function formatMarkdownText(str) {
    if (!str) return '';
    return str
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-[#a3e635] underline hover:opacity-80 font-medium">$1</a>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n• /g, '<br/>• ')
      .replace(/\n(\d+\.\s)/g, '<br/>$1')
      .replace(/\n/g, '<br/>');
  }

  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  function updateChips(chips = []) {
    if (!chipsContainer) return;
    if (chips.length === 0) {
      chipsContainer.classList.add('hidden');
      return;
    }
    chipsContainer.classList.remove('hidden');
    chipsContainer.innerHTML = chips
      .map((c) => `<button class="thinkbot-chip animate-fade-in" data-chip="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
      .join('');
    
    chipsContainer.querySelectorAll('[data-chip]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-chip');
        sendMessage(query);
      });
    });
  }

  async function sendMessage(text) {
    if (!text || !text.trim()) return;
    appendUserMessage(text);
    if (input) input.value = '';
    showTypingIndicator();

    const startTimestamp = Date.now();
    // Simulate thinking delay between 1.2s and 2.6s
    const targetThinkingDuration = 1200 + Math.floor(Math.random() * 1400);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          sessionId: currentChatSessionId,
          lang: currentLang
        })
      });
      const data = await res.json();

      const elapsed = Date.now() - startTimestamp;
      const remainingDelay = Math.max(0, targetThinkingDuration - elapsed);

      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }

      removeTypingIndicator();

      if (data.success && data.data) {
        appendBotMessage(data.data.text);
        
        if (data.data.action === 'show_booking_form' && bookingDrawer) {
          bookingDrawer.classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();
          scrollToBottom();
          setTimeout(() => {
            const nameField = document.getElementById('booking-name');
            if (nameField && !nameField.value) {
              nameField.focus();
            }
          }, 300);
        }

        if (data.data.suggestedChips) {
          updateChips(data.data.suggestedChips);
        }
      } else {
        const fallbackMsg = currentLang === 'en'
          ? 'Sorry, a momentary error occurred. You can contact us directly on WhatsApp: +595 983 463553'
          : 'Disculpa, ocurrió un error momentáneo. Puedes contactarnos por WhatsApp directamente: +595 983 463553';
        appendBotMessage(fallbackMsg);
      }
    } catch (error) {
      const elapsed = Date.now() - startTimestamp;
      const remainingDelay = Math.max(0, 1000 - elapsed);
      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }
      removeTypingIndicator();
      console.error('Chat error:', error);
      const connErrorMsg = currentLang === 'en'
        ? 'Sorry, there was a connection error. You can reach us on <a href="https://wa.me/595983463553" target="_blank" class="text-[#a3e635] underline">WhatsApp (+595 983 463553)</a>.'
        : 'Disculpa, hubo un problema al conectar. Puedes escribirnos a <a href="https://wa.me/595983463553" target="_blank" class="text-[#a3e635] underline">WhatsApp (+595 983 463553)</a>.';
      appendBotMessage(connErrorMsg, true);
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input ? input.value.trim() : '';
      if (text) sendMessage(text);
    });
  }

  // Initial Chips Listener
  attachChipListeners();

  // Booking Drawer Handling
  if (cancelBookingBtn && bookingDrawer) {
    cancelBookingBtn.addEventListener('click', () => {
      bookingDrawer.classList.add('hidden');
    });
  }

  if (bookingSubmitBtn) {
    bookingSubmitBtn.addEventListener('click', async () => {
      const name = bookingNameInput?.value?.trim();
      const email = bookingEmailInput?.value?.trim();
      const date = bookingDateInput?.value;
      const time = bookingTimeInput?.value;

      if (!name || !email) {
        showToast(currentLang === 'en' ? 'Please complete your name and email.' : 'Por favor completa tu nombre y correo.');
        return;
      }

      bookingSubmitBtn.disabled = true;
      bookingSubmitBtn.innerHTML = `<span>${currentLang === 'en' ? 'Booking appointment...' : 'Registrando cita...'}</span>`;

      try {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_name: name,
            client_email: email,
            meeting_date: date,
            meeting_time: time,
            topic: currentLang === 'en' ? 'Strategic Call with Lead Architect' : 'Llamada Estratégica con Lead Architect'
          })
        });

        const data = await res.json();
        bookingSubmitBtn.disabled = false;
        bookingSubmitBtn.innerHTML = `<span>${currentLang === 'en' ? 'Confirm Appointment with Lead Architect' : 'Confirmar Cita con Lead Architect'}</span><span>→</span>`;

        if (res.ok && data.success) {
          bookingDrawer.classList.add('hidden');
          const botConfirm = currentLang === 'en'
            ? `🎉 **Appointment Booked Successfully!**\n\n• **Client**: ${name}\n• **Date**: ${date}\n• **Time**: ${time} (Asunción, GMT-4)\n\nWe sent confirmation details to **${email}**. A Lead Architect will join punctually.`
            : `🎉 **¡Cita Agendada con Éxito!**\n\n• **Cliente**: ${name}\n• **Fecha**: ${date}\n• **Horario**: ${time} (Asunción, GMT-4)\n\nTe hemos enviado los detalles a **${email}**. Un Lead Architect se conectará puntualmente.`;

          appendBotMessage(botConfirm);

          // Render direct WhatsApp confirmation button inside chat
          const waText = currentLang === 'en'
            ? `Hello Think Lab., I just booked a meeting for ${date} at ${time} under the name of ${name}`
            : `Hola Think Lab., acabo de agendar una reunión para el ${date} a las ${time} a nombre de ${name}`;
          const waUrl = `https://wa.me/595983463553?text=${encodeURIComponent(waText)}`;
          const waBtnText = currentLang === 'en' ? 'Send confirmation via WhatsApp' : 'Enviar confirmación por WhatsApp';

          appendBotMessage(
            `<div class="pt-1">` +
            `<a href="${waUrl}" target="_blank" class="btn-apple-lime text-black font-semibold text-xs py-2 px-3.5 inline-flex items-center gap-1.5 rounded-xl shadow">` +
            `<span>${waBtnText}</span><span>→</span>` +
            `</a></div>`,
            true
          );

          showToast(currentLang === 'en' ? 'Appointment scheduled successfully!' : '¡Cita agendada con éxito!');
        } else {
          showToast(data.error || (currentLang === 'en' ? 'Error scheduling appointment.' : 'Error al agendar la cita.'));
        }
      } catch (err) {
        bookingSubmitBtn.disabled = false;
        bookingSubmitBtn.innerHTML = `<span>${currentLang === 'en' ? 'Confirm Technical Session (15 min)' : 'Confirmar Sesión Técnica (15 min)'}</span><span>→</span>`;
        console.error('Error booking appointment:', err);
        showToast(currentLang === 'en' ? 'Connection error while booking.' : 'Error de conexión al agendar.');
      }
    });
  }
}

/* ==========================================================================
   10.1 AI Chatbot & Agent Studio Simulator
   ========================================================================== */
function initAiChatbotShowcase() {
  const tabs = document.querySelectorAll('[data-ai-tab]');
  const chatContainer = document.getElementById('ai-simulation-chat');
  const channelLabel = document.getElementById('ai-simulation-channel');
  const pillLabel = document.getElementById('ai-tab-pill');
  const titleLabel = document.getElementById('ai-tab-title');
  const descLabel = document.getElementById('ai-tab-desc');
  const featuresContainer = document.getElementById('ai-tab-features');
  const restartBtn = document.getElementById('ai-trigger-sample-btn');
  const openThinkbotBtn = document.getElementById('open-thinkbot-demo-btn');

  if (!chatContainer || tabs.length === 0) return;

  const SCENARIOS = {
    es: {
      whatsapp: {
        channel: 'WhatsApp Business API // +595 983 463553',
        pill: 'CAPACIDAD DESTACADA // WHATSAPP AGENT',
        title: 'Ventas y Calificación BANT Autónoma',
        desc: 'El agente atiende prospectos en WhatsApp o en tu web, evalúa presupuesto, necesidad y tiempos (BANT), y sincroniza automáticamente las reuniones en Google Calendar.',
        features: [
          'Integración directa con WhatsApp Business Cloud API oficial',
          'Sincronización instantánea con CRM (HubSpot / Notion / Sheets)',
          'Calificación BANT con derivación fluida a asesor humano'
        ],
        messages: [
          { sender: 'user', text: '¡Hola! Me interesa automatizar la atención de mi tienda en Asunción. ¿Cómo funciona?', time: '10:42' },
          { sender: 'bot', text: '¡Hola! 🚀 En ThinkLab integramos agentes que atienden consultas, muestran productos y toman pedidos 24/7 conectados a tu stock. ¿Qué volumen de mensajes manejan al día?', time: '10:42' },
          { sender: 'user', text: 'Recibimos unos 80 mensajes al día y nos cuesta responder rápido en horarios pico.', time: '10:43' },
          { sender: 'bot', text: 'Podemos reducir el tiempo de respuesta a <2 segundos y sincronizar los leads calificados en tu CRM. ¿Te gustaría coordinar una **demo técnica de 15 minutos** esta semana?', time: '10:43' }
        ]
      },
      rag: {
        channel: 'RAG Knowledge Core // Supabase pgvector',
        pill: 'ARQUITECTURA RAG // CERO ALUCINACIONES',
        title: 'Asistente Corporativo sobre tus Documentos',
        desc: 'Conecta tus PDFs, manuales operativos, bases de datos y políticas de empresa. El agente responde con precisión milimétrica citando fuentes exactas.',
        features: [
          'Búsqueda semántica con embeddings vectoriales en tiempo real',
          'Respuestas restringidas 100% a tus fuentes y políticas internas',
          'Seguridad de nivel bancario con encriptación y permisos por rol'
        ],
        messages: [
          { sender: 'user', text: '¿Cuál es la política de garantía y soporte en el Plan Growth de ThinkLab?', time: '14:15' },
          { sender: 'bot', text: '✦ **Búsqueda Vectorial (140ms)** en `sla_politicas_2026.pdf` (pág. 8):\n\nEl **Plan Growth** incluye garantía de soporte continuo 24/7, monitoreo de disponibilidad 99.9% y SLA de respuesta inferior a 4 horas.', time: '14:15' },
          { sender: 'user', text: '¿Y cómo se gestiona la propiedad del código fuente?', time: '14:16' },
          { sender: 'bot', text: '✦ **Cita Directa**: La propiedad es **100% del cliente**. Se transfiere el repositorio GitHub con todo el código, modelos y activos sin costos de licenciamiento ocultos.', time: '14:16' }
        ]
      },
      automation: {
        channel: 'Workflow Engine // n8n + Webhooks + CRM',
        pill: 'WORKFLOWS // AUTOMATIZACIÓN DE PROCESOS',
        title: 'Flujos de Trabajo Autónomos y Conexión Total',
        desc: 'Dispara acciones complejas ante eventos de usuario: facturación automática con pasarelas de pago, creación de tickets y alertas en tiempo real al equipo.',
        features: [
          'Conexión nativa con n8n, Make, Zapier y Webhooks REST',
          'Creación y actualización automática de contactos en HubSpot',
          'Envío de confirmaciones instantáneas por WhatsApp y Email'
        ],
        messages: [
          { sender: 'system', text: '⚡ **Evento Detectado**: Solicitud de Cotización recibida desde Formulario Web (Carlos Duarte • Gs. 24.500.000)', time: '16:30' },
          { sender: 'bot', text: '✓ **Paso 1**: Contacto creado en HubSpot CRM con tag `#Lead-Calificado`\n✓ **Paso 2**: Registro guardado en Supabase PostgreSQL\n✓ **Paso 3**: Cita reservada en Google Calendar para el Jueves 15:00', time: '16:30' },
          { sender: 'bot', text: '✓ **Paso 4**: WhatsApp de bienvenida enviado al cliente (+595 981 *** ***)\n✓ **Paso 5**: Notificación enviada al canal privado de Slack de los Lead Architects.', time: '16:30' }
        ]
      }
    },
    en: {
      whatsapp: {
        channel: 'WhatsApp Business API // +595 983 463553',
        pill: 'FEATURED CAPABILITY // WHATSAPP AGENT',
        title: 'Autonomous Sales & BANT Lead Qualification',
        desc: 'The agent answers prospects on WhatsApp or your website, evaluates budget, authority, need, and timeline (BANT), and automatically syncs discovery calls on Google Calendar.',
        features: [
          'Direct integration with official Meta WhatsApp Business Cloud API',
          'Instant bidirectional synchronization with CRM (HubSpot / Notion / Sheets)',
          'BANT qualification with smooth escalation to human account executives'
        ],
        messages: [
          { sender: 'user', text: 'Hi! I want to automate customer inquiries for my retail brand in Asunción. How does it work?', time: '10:42' },
          { sender: 'bot', text: 'Hello! 🚀 At ThinkLab we integrate agents that answer FAQs, show products, and capture orders 24/7 connected to your stock. What daily message volume do you handle?', time: '10:42' },
          { sender: 'user', text: 'Around 80 messages per day, and our team struggles to respond fast during peak hours.', time: '10:43' },
          { sender: 'bot', text: 'We can slash your response latency to <2 seconds and sync qualified leads directly to your CRM. Would you like to schedule a **15-minute technical demo** this week?', time: '10:43' }
        ]
      },
      rag: {
        channel: 'RAG Knowledge Core // Supabase pgvector',
        pill: 'RAG ARCHITECTURE // ZERO HALLUCINATIONS',
        title: 'Enterprise Assistant Grounded on Your Knowledge Base',
        desc: 'Connect your PDFs, standard operating procedures, databases, and company policies. The agent answers with pinpoint accuracy citing exact sources.',
        features: [
          'Real-time semantic vector search with pgvector embeddings',
          'Answers 100% strictly bound to your corporate source documents',
          'Bank-grade data security with encryption and role-based access control'
        ],
        messages: [
          { sender: 'user', text: 'What is the SLA and warranty policy included with ThinkLab\'s Growth Plan?', time: '14:15' },
          { sender: 'bot', text: '✦ **Vector Retrieval (140ms)** in `sla_policies_2026.pdf` (page 8):\n\nThe **Growth Plan** includes continuous 24/7 support warranty, 99.9% uptime monitoring, and an emergency response SLA under 4 hours.', time: '14:15' },
          { sender: 'user', text: 'And how is source code ownership handled?', time: '14:16' },
          { sender: 'bot', text: '✦ **Direct Quote**: Ownership is **100% transferred to the client**. We hand over the GitHub repository with all source code, models, and assets without recurring licensing fees.', time: '14:16' }
        ]
      },
      automation: {
        channel: 'Workflow Engine // n8n + Webhooks + CRM',
        pill: 'WORKFLOWS // END-TO-END PROCESS AUTOMATION',
        title: 'Autonomous Workflows & Seamless Tool Connectivity',
        desc: 'Trigger complex actions based on user actions: automatic invoicing via payment gateways, ticket provisioning, and real-time alerts to your team.',
        features: [
          'Native integrations with n8n, Make, Zapier, and REST Webhooks',
          'Automated creation and updates of deals & contacts in HubSpot',
          'Instant multi-channel notifications via WhatsApp, Email, and Slack'
        ],
        messages: [
          { sender: 'system', text: '⚡ **Event Detected**: Project Proposal Request received via Web Form (Carlos Duarte • Gs. 24,500,000)', time: '16:30' },
          { sender: 'bot', text: '✓ **Step 1**: Contact created in HubSpot CRM with tag `#Qualified-Lead`\n✓ **Step 2**: Transaction record saved in Supabase PostgreSQL\n✓ **Step 3**: Strategy call scheduled on Google Calendar for Thursday 3:00 PM', time: '16:30' },
          { sender: 'bot', text: '✓ **Step 4**: WhatsApp onboarding message dispatched to client (+595 981 *** ***)\n✓ **Step 5**: Real-time notification delivered to Lead Architects\' private Slack channel.', time: '16:30' }
        ]
      }
    }
  };

  let activeTab = 'whatsapp';

  function renderScenario(scenarioKey) {
    activeTab = scenarioKey;
    const scenarios = SCENARIOS[currentLang] || SCENARIOS.es;
    const data = scenarios[scenarioKey];
    if (!data) return;

    if (channelLabel) channelLabel.textContent = data.channel;
    if (pillLabel) pillLabel.textContent = data.pill;
    if (titleLabel) titleLabel.textContent = data.title;
    if (descLabel) descLabel.textContent = data.desc;

    if (featuresContainer) {
      featuresContainer.innerHTML = data.features
        .map((f) => `<div class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#a3e635] flex-shrink-0"></span><span>${f}</span></div>`)
        .join('');
    }

    // Render Chat Messages with animation
    chatContainer.innerHTML = '';
    data.messages.forEach((msg, idx) => {
      setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className = msg.sender === 'user' ? 'flex justify-end' : 'flex items-start gap-2.5';
        
        if (msg.sender === 'user') {
          bubble.innerHTML = `
            <div class="max-w-[85%] bg-[#a3e635] text-black font-medium rounded-2xl rounded-tr-sm p-3 text-xs leading-relaxed shadow-sm">
              <p>${msg.text}</p>
              <div class="text-[9px] text-black/60 text-right mt-1 font-mono">${msg.time} ✓✓</div>
            </div>
          `;
        } else if (msg.sender === 'system') {
          bubble.innerHTML = `
            <div class="w-full bg-purple-500/10 border border-purple-500/20 text-purple-300 p-2.5 rounded-xl text-[11px] font-mono">
              ${msg.text}
            </div>
          `;
        } else {
          bubble.innerHTML = `
            <div class="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-[10px] text-[#a3e635] font-mono">
              ✦
            </div>
            <div class="max-w-[85%] bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm p-3 text-[#f5f5f7] leading-relaxed space-y-1">
              <div class="text-xs">${formatMarkdownText(msg.text)}</div>
              <div class="text-[9px] text-[#86868b] text-right mt-1 font-mono">${msg.time}</div>
            </div>
          `;
        }
        chatContainer.appendChild(bubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, idx * 250);
    });
  }

  window._updateAiShowcase = () => renderScenario(activeTab);

  // Tab click listeners
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-ai-tab');
      tabs.forEach((t) => {
        t.classList.remove('ai-tab-active', 'text-white');
        t.classList.add('text-[#86868b]');
      });
      tab.classList.add('ai-tab-active', 'text-white');
      tab.classList.remove('text-[#86868b]');
      renderScenario(key);
    });
  });

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      renderScenario(activeTab);
    });
  }

  // Open Think Bot AI widget from section
  if (openThinkbotBtn) {
    openThinkbotBtn.addEventListener('click', () => {
      const toggleBtn = document.getElementById('thinkbot-toggle-btn');
      if (toggleBtn) {
        toggleBtn.click();
      }
    });
  }

  // Initial render
  renderScenario('whatsapp');
}

/* ==========================================================================
   11. Global Toast Helper
   ========================================================================== */
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="text-[#a3e635]">✦</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

window.showToast = showToast;

