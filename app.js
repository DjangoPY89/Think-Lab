/**
 * Think Lab. - Apple-Inspired Interactive Engine
 * Author: Think Lab. Development & AI Engineering
 * Style: Clean, Sober, Ultra-Refined
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initCanvasBackground();
  initNavbarScroll();
  initShowcaseTabs();
  initRoiCalculator();
  initProcessTimeline();
  initPortfolioFilters();
  initIntakeWizard();
  initPricingToggle();
  initFaqAccordion();
  initThinkBotAI();
});

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
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  }

  function updateCalculator() {
    const traffic = parseInt(trafficInput.value);
    const ticket = parseInt(ticketInput.value);
    const convRate = parseFloat(convInput.value);

    trafficVal.textContent = new Intl.NumberFormat('es-MX').format(traffic) + ' visitas';
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
    if (extraAnnualVal) extraAnnualVal.textContent = '+' + formatCurrency(extraAnnual) + '/año';
    if (multiplierVal) multiplierVal.textContent = multiplier + 'x';

    if (progressBar) {
      const percentage = Math.min(Math.round((projectedMonthly / (currentMonthly * 3 || 1)) * 100), 100);
      progressBar.style.width = `${Math.max(percentage, 25)}%`;
    }
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
  const steps = [
    {
      num: '01',
      title: 'Estrategia & Arquitectura de Información',
      desc: 'Definimos objetivos de negocio, embudos de conversión y requerimientos de IA. Establecemos la base de arquitectura de software y diseño.',
      deliverables: ['Estructura UX & User Flow', 'Auditoría de Conversión', 'Definición de Stack'],
      duration: 'Semana 1',
    },
    {
      num: '02',
      title: 'Diseño de Interfaz & Prototipado',
      desc: 'Desarrollo visual con estándares de clase mundial. Diseño sobrio, espaciado milimétrico y microinteracciones precisas en Figma.',
      deliverables: ['UI Kit & Tokens de Diseño', 'Diseño Mobile & Desktop', 'Prototipo Interactivo'],
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
  ];

  const stepList = document.getElementById('process-step-list');
  const stepDetailContainer = document.getElementById('process-step-detail');

  if (!stepList || !stepDetailContainer) return;

  function renderStepDetail(index) {
    const s = steps[index];
    stepDetailContainer.innerHTML = `
      <div class="apple-card p-8 border border-white/10">
        <div class="flex items-center justify-between mb-4">
          <span class="apple-pill-lime text-xs font-mono font-semibold">
            FASE ${s.num} • ${s.duration}
          </span>
          <span class="text-3xl font-bold text-white/20 font-mono">${s.num}</span>
        </div>
        <h3 class="text-2xl font-bold text-white mb-2">${s.title}</h3>
        <p class="text-[#86868b] leading-relaxed mb-6 text-sm">${s.desc}</p>
        
        <div class="border-t border-white/10 pt-5">
          <h4 class="text-xs font-mono uppercase text-[#86868b] tracking-wider mb-3">Entregables:</h4>
          <ul class="space-y-2">
            ${s.deliverables
              .map(
                (d) => `
              <li class="flex items-center gap-2 text-sm text-[#f5f5f7]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#a3e635]"></span>
                ${d}
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      </div>
    `;
  }

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
   6. Portfolio Filter & Modal
   ========================================================================== */
const portfolioItems = [
  {
    id: 1,
    category: 'saas',
    title: 'NexusAI Cloud Platform',
    desc: 'Plataforma SaaS para orquestación de agentes de IA en tiempo real.',
    tag: 'SaaS / AI Suite',
    metric: '+340% Conversión de Registro',
    speed: '0.4s Carga',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop',
    tech: ['Next.js 14', 'Tailwind CSS', 'Supabase', 'Claude API'],
  },
  {
    id: 2,
    category: 'ecommerce',
    title: 'Aura Luxury Apparel',
    desc: 'E-commerce interactivo de alta costura con visualizador 3D y checkout en 1 clic.',
    tag: 'E-Commerce',
    metric: '$1.4M Ventas en el 1er Mes',
    speed: '0.3s Carga',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop',
    tech: ['Shopify Headless', 'Three.js', 'Stripe Elements', 'Edge CDN'],
  },
  {
    id: 3,
    category: 'ai',
    title: 'Vocalis Intelligent Assistant',
    desc: 'Aplicación web de voz con integración de ElevenLabs y transcripción en tiempo real.',
    tag: 'Voice AI App',
    metric: '+58K Usuarios Activos',
    speed: '0.5s Carga',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop',
    tech: ['WebSockets', 'ElevenLabs MCP', 'FastAPI', 'Vercel'],
  },
  {
    id: 4,
    category: 'landing',
    title: 'Zenith Capital Hedge Fund',
    desc: 'Sitio institucional con analíticas financieras en vivo y portal privado de inversores.',
    tag: 'Fintech Landing',
    metric: '99.9% Uptime Global',
    speed: '0.2s Carga',
    image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=1000&auto=format&fit=crop',
    tech: ['Next.js', 'Chart.js', 'Auth0', 'Tailwind'],
  },
];

function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('[data-portfolio-filter]');
  const grid = document.getElementById('portfolio-grid');
  const modal = document.getElementById('portfolio-modal');
  const modalContent = document.getElementById('portfolio-modal-content');
  const modalClose = document.getElementById('portfolio-modal-close');

  if (!grid) return;

  function renderPortfolio(filter = 'all') {
    const filtered = filter === 'all' ? portfolioItems : portfolioItems.filter((item) => item.category === filter);

    grid.innerHTML = filtered
      .map(
        (item) => `
      <div class="apple-card group cursor-pointer" data-portfolio-id="${item.id}">
        <div class="relative h-64 overflow-hidden bg-[#0c0c0e]">
          <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
          <div class="absolute inset-0 bg-gradient-to-t from-[#101012] via-transparent to-transparent"></div>
          <div class="absolute top-4 left-4">
            <span class="apple-pill-lime">
              ${item.tag}
            </span>
          </div>
          <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono">
            <span class="text-[#86868b] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
              ⚡ ${item.speed}
            </span>
            <span class="text-[#a3e635] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
              ${item.metric}
            </span>
          </div>
        </div>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-white group-hover:text-[#a3e635] transition-colors mb-1.5 flex items-center justify-between">
            ${item.title}
            <span class="text-[#86868b] text-sm group-hover:translate-x-1 transition-transform">→</span>
          </h3>
          <p class="text-sm text-[#86868b] mb-4">${item.desc}</p>
          <div class="flex flex-wrap gap-1.5">
            ${item.tech
              .map(
                (t) => `
              <span class="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[#86868b] border border-white/5">
                ${t}
              </span>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `
      )
      .join('');

    grid.querySelectorAll('[data-portfolio-id]').forEach((card) => {
      card.addEventListener('click', () => {
        const id = parseInt(card.getAttribute('data-portfolio-id'));
        openPortfolioModal(id);
      });
    });
  }

  function openPortfolioModal(id) {
    const item = portfolioItems.find((p) => p.id === id);
    if (!item || !modal || !modalContent) return;

    modalContent.innerHTML = `
      <div class="relative">
        <img src="${item.image}" alt="${item.title}" class="w-full h-64 object-cover rounded-t-3xl" />
        <div class="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent"></div>
        <span class="absolute top-4 left-4 apple-pill-lime">
          ${item.tag}
        </span>
      </div>
      <div class="p-8">
        <h2 class="text-2xl font-bold text-white mb-2">${item.title}</h2>
        <p class="text-[#86868b] mb-6 leading-relaxed text-sm">${item.desc}</p>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <span class="text-xs font-mono text-[#86868b] uppercase">Impacto</span>
            <div class="text-base font-semibold text-[#a3e635] mt-1">${item.metric}</div>
          </div>
          <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <span class="text-xs font-mono text-[#86868b] uppercase">Velocidad</span>
            <div class="text-base font-semibold text-white mt-1">${item.speed}</div>
          </div>
        </div>

        <div class="mb-6">
          <h4 class="text-xs font-mono uppercase text-[#86868b] mb-2">Stack Tecnológico:</h4>
          <div class="flex flex-wrap gap-2">
            ${item.tech
              .map(
                (t) => `
              <span class="text-xs font-mono px-3 py-1 rounded-full bg-white/5 text-[#f5f5f7] border border-white/10">
                ${t}
              </span>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button id="modal-project-close-btn" class="btn-apple-secondary">
            Cerrar
          </button>
          <a href="#contacto" id="modal-project-cta" class="btn-apple-lime">
            Iniciar Proyecto
          </a>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');

    const closeBtn = document.getElementById('modal-project-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }
    const ctaBtn = document.getElementById('modal-project-cta');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-portfolio-filter');
      renderPortfolio(filter);
    });
  });

  renderPortfolio('all');
}

/* ==========================================================================
   7. Multi-Step Intake Wizard
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
  const submitBtn = document.getElementById('intake-submit');

  const progressBar = document.getElementById('intake-progress');
  const stepIndicator = document.getElementById('intake-indicator');

  function updateSteps() {
    if (progressBar) progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;
    if (stepIndicator) stepIndicator.textContent = `Paso ${currentStep} de ${totalSteps}`;

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

  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('intake-email')?.value;
      const name = document.getElementById('intake-name')?.value;

      if (!email || !name) {
        showToast('Por favor completa tu nombre y correo electrónico.');
        return;
      }

      step3.classList.add('hidden');
      if (resultPanel) {
        resultPanel.classList.remove('hidden');
        resultPanel.innerHTML = `
          <div class="text-center py-8">
            <div class="w-10 h-10 border-2 border-white/20 border-t-[#a3e635] rounded-full animate-spin mx-auto mb-4"></div>
            <h4 class="text-lg font-semibold text-white mb-1">Generando Propuesta Estratégica</h4>
            <p class="text-xs text-[#86868b] font-mono">Analizando requerimientos y arquitectura</p>
          </div>
        `;

        setTimeout(() => {
          resultPanel.innerHTML = `
            <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-left">
              <div class="flex items-center gap-3 mb-3">
                <span class="w-7 h-7 rounded-full bg-[#a3e635]/20 text-[#a3e635] flex items-center justify-center font-bold text-xs">✓</span>
                <div>
                  <h4 class="text-base font-semibold text-white">Solicitud Recibida</h4>
                  <p class="text-xs text-[#86868b]">Confirmación enviada a ${email}</p>
                </div>
              </div>
              <p class="text-sm text-[#86868b] mb-3 leading-relaxed">
                Gracias, <strong>${name}</strong>. Un Lead Architect de <strong>Think Lab.</strong> revisará tu proyecto y se pondrá en contacto en breve.
              </p>
            </div>
          `;
          showToast('Solicitud enviada correctamente.');
        }, 1200);
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

  toggleMonthly.addEventListener('click', () => {
    toggleMonthly.classList.add('bg-white', 'text-black');
    toggleMonthly.classList.remove('text-[#86868b]');
    toggleProject.classList.remove('bg-white', 'text-black');
    toggleProject.classList.add('text-[#86868b]');

    if (starterPrice) starterPrice.textContent = '$1,490';
    if (growthPrice) growthPrice.textContent = '$2,990';
    if (enterprisePrice) enterprisePrice.textContent = '$5,490';

    periodLabels.forEach((l) => (l.textContent = '/mes (Retainer Continuo)'));
  });

  toggleProject.addEventListener('click', () => {
    toggleProject.classList.add('bg-white', 'text-black');
    toggleProject.classList.remove('text-[#86868b]');
    toggleMonthly.classList.remove('bg-white', 'text-black');
    toggleMonthly.classList.add('text-[#86868b]');

    if (starterPrice) starterPrice.textContent = '$2,800';
    if (growthPrice) growthPrice.textContent = '$5,900';
    if (enterprisePrice) enterprisePrice.textContent = '$11,500';

    periodLabels.forEach((l) => (l.textContent = '/proyecto (Pago Único)'));
  });
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
   10. Interactive ThinkBot AI
   ========================================================================== */
function initThinkBotAI() {
  const toggleBtn = document.getElementById('chat-toggle-btn');
  const chatWindow = document.getElementById('chat-window');
  const closeBtn = document.getElementById('chat-close-btn');
  const messagesContainer = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const quickChips = document.querySelectorAll('[data-chat-prompt]');

  if (!toggleBtn || !chatWindow) return;

  toggleBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
    if (!chatWindow.classList.contains('hidden') && chatInput) {
      chatInput.focus();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      chatWindow.classList.add('hidden');
    });
  }

  function appendMessage(sender, text) {
    const isAi = sender === 'ai';
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex ${isAi ? 'justify-start' : 'justify-end'} mb-3`;
    msgDiv.innerHTML = `
      <div class="${
        isAi
          ? 'bg-[#1c1c1e] text-[#f5f5f7] border border-white/10'
          : 'bg-[#a3e635] text-black font-medium'
      } max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm">
        ${isAi ? `<div class="text-[10px] font-mono text-[#a3e635] font-semibold mb-1">THINKBOT AI</div>` : ''}
        ${text}
      </div>
    `;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function simulateAiResponse(userQuery) {
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'ai-typing';
    typingIndicator.className = 'flex justify-start mb-3';
    typingIndicator.innerHTML = `
      <div class="bg-[#1c1c1e] text-[#86868b] border border-white/10 rounded-2xl px-4 py-2 text-xs flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-[#86868b] animate-bounce"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-[#86868b] animate-bounce" style="animation-delay: 0.2s"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-[#86868b] animate-bounce" style="animation-delay: 0.4s"></span>
      </div>
    `;
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    setTimeout(() => {
      const typingEl = document.getElementById('ai-typing');
      if (typingEl) typingEl.remove();

      let answer = '';
      const query = userQuery.toLowerCase();

      if (query.includes('precio') || query.includes('costo') || query.includes('cuanto')) {
        answer =
          'Los planes de desarrollo inician en **$1,490/mes** para retainer continuo de producto o **$2,800** para desarrollo de proyecto completo. Puedes consultar proyecciones en nuestra calculadora de ROI.';
      } else if (query.includes('tiempo') || query.includes('cuanto tarda') || query.includes('plazo')) {
        answer =
          'Entregamos plataformas completas en **3 a 4 semanas** con arquitectura modular, diseño sobrio de alta gama y pruebas de rendimiento.';
      } else if (query.includes('agente') || query.includes('ia') || query.includes('chatbot')) {
        answer =
          'Integramos asistentes RAG con Supabase Vector y LLMs avanzados (Claude, Gemini), además de agentes de voz para automatización de consultas y reservas.';
      } else {
        answer =
          'En **Think Lab.** construimos ingeniería web con diseño sobrio y tecnología moderna. ¿En qué tipo de proyecto estás trabajando actualmente?';
      }

      appendMessage('ai', answer);
    }, 700);
  }

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';
    simulateAiResponse(text);
  }

  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', handleSend);
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  quickChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-chat-prompt');
      appendMessage('user', prompt);
      simulateAiResponse(prompt);
    });
  });
}

/* ==========================================================================
   11. Toast Helper
   ========================================================================== */
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
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
