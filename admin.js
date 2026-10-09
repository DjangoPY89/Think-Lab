/**
 * Think Lab. - Admin Dashboard Logic & Secure Authentication
 * Connects directly to backend API (/api/auth, /api/stats, /api/leads, /api/roi-assessments)
 */

document.addEventListener('DOMContentLoaded', () => {
  const AUTH_TOKEN_KEY = 'thinklab_admin_token';
  const AUTH_USER_KEY = 'thinklab_admin_user';

  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Views & Auth Elements
  const loginView = document.getElementById('admin-login-view');
  const dashboardView = document.getElementById('admin-dashboard-view');
  const loginForm = document.getElementById('admin-login-form');
  const loginUsernameInput = document.getElementById('login-username');
  const loginPasswordInput = document.getElementById('login-password');
  const loginSubmitBtn = document.getElementById('login-submit-btn');
  const loginError = document.getElementById('login-error');
  const loginErrorText = document.getElementById('login-error-text');
  const togglePasswordBtn = document.getElementById('toggle-password-btn');
  const passwordEyeIcon = document.getElementById('password-eye-icon');

  // Header Elements
  const adminUserBadge = document.getElementById('admin-user-badge');
  const adminUserName = document.getElementById('admin-user-name');
  const logoutBtn = document.getElementById('logout-btn');
  const refreshBtn = document.getElementById('refresh-btn');

  let allLeads = [];
  let currentFilter = 'all';

  // Visitor KPIs
  const kpiTotalVisits = document.getElementById('kpi-total-visits');
  const kpiUniqueVisitors = document.getElementById('kpi-unique-visitors');
  const kpiTodayVisits = document.getElementById('kpi-today-visits');

  // Business KPIs
  const kpiTotalLeads = document.getElementById('kpi-total-leads');
  const kpiNewLeads = document.getElementById('kpi-new-leads');
  const kpiTotalAudits = document.getElementById('kpi-total-audits');
  const kpiAvgTicket = document.getElementById('kpi-avg-ticket');
  const kpiAvgTraffic = document.getElementById('kpi-avg-traffic');

  const leadsTableBody = document.getElementById('leads-table-body');
  const leadsCountBadge = document.getElementById('leads-count-badge');
  const roiList = document.getElementById('roi-list');
  const liveVisitsList = document.getElementById('live-visits-list');

  const leadModal = document.getElementById('lead-modal');
  const leadModalClose = document.getElementById('lead-modal-close');
  const modalLeadTitle = document.getElementById('modal-lead-title');
  const modalLeadBody = document.getElementById('modal-lead-body');

  /* =========================================================================
     AUTHENTICATION HELPERS & LOGIC
     ========================================================================= */

  function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  function setAuthSession(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
  }

  function clearAuthSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  function getAuthHeaders() {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  function showDashboard(user) {
    if (loginView) loginView.classList.add('hidden');
    if (dashboardView) dashboardView.classList.remove('hidden');

    if (adminUserBadge) {
      adminUserBadge.classList.remove('hidden');
      adminUserBadge.classList.add('inline-flex');
    }
    if (adminUserName && user) {
      adminUserName.textContent = user.username || 'Juan Solalinde';
    }
    if (logoutBtn) {
      logoutBtn.classList.remove('hidden');
      logoutBtn.classList.add('inline-flex');
    }
    if (refreshBtn) {
      refreshBtn.classList.remove('hidden');
      refreshBtn.classList.add('inline-flex');
    }

    if (window.lucide) window.lucide.createIcons();
    loadDashboardData();
  }

  function showLogin() {
    if (dashboardView) dashboardView.classList.add('hidden');
    if (loginView) loginView.classList.remove('hidden');

    if (adminUserBadge) adminUserBadge.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (refreshBtn) refreshBtn.classList.add('hidden');

    if (loginError) loginError.classList.add('hidden');
    if (loginPasswordInput) loginPasswordInput.value = '';

    if (window.lucide) window.lucide.createIcons();
  }

  async function checkAuthSession() {
    const token = getAuthToken();
    if (!token) {
      showLogin();
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (res.ok && data.authenticated && data.user) {
        showDashboard(data.user);
      } else {
        clearAuthSession();
        showLogin();
      }
    } catch (err) {
      console.error('Error verifying session:', err);
      showLogin();
    }
  }

  // Handle Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = loginUsernameInput?.value?.trim();
      const password = loginPasswordInput?.value?.trim();

      if (!username || !password) {
        if (loginError && loginErrorText) {
          loginErrorText.textContent = 'Por favor ingresa usuario y contraseña.';
          loginError.classList.remove('hidden');
        }
        return;
      }

      if (loginSubmitBtn) {
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.innerHTML = `
          <div class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
          <span>Verificando...</span>
        `;
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success && data.token) {
          if (loginError) loginError.classList.add('hidden');
          setAuthSession(data.token, data.user);
          showDashboard(data.user);
          showToast(`¡Bienvenido, ${data.user.username}!`);
        } else {
          if (loginError && loginErrorText) {
            loginErrorText.textContent = data.error || 'Credenciales no válidas.';
            loginError.classList.remove('hidden');
          }
        }
      } catch (err) {
        console.error('Error during login:', err);
        if (loginError && loginErrorText) {
          loginErrorText.textContent = 'Error de conexión con el servidor.';
          loginError.classList.remove('hidden');
        }
      } finally {
        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.innerHTML = `
            <span>Acceder al Panel</span>
            <span class="group-hover:translate-x-1 transition-transform">→</span>
          `;
        }
      }
    });
  }

  // Toggle Password Visibility
  if (togglePasswordBtn && loginPasswordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = loginPasswordInput.type === 'password';
      loginPasswordInput.type = isPassword ? 'text' : 'password';
      if (passwordEyeIcon) {
        passwordEyeIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: getAuthHeaders()
        });
      } catch (e) {
        // Ignore network errors on logout
      }
      clearAuthSession();
      showLogin();
      showToast('Sesión cerrada correctamente.');
    });
  }

  /* =========================================================================
     DASHBOARD DATA & RENDERING
     ========================================================================= */

  function formatGs(amount) {
    return 'Gs. ' + new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(Math.round(amount || 0));
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `hace ${Math.max(diffSec, 1)}s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `hace ${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `hace ${diffHr}h`;
    return formatDate(dateStr);
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'new':
        return '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30">Nuevo</span>';
      case 'contacted':
        return '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30">Contactado</span>';
      case 'qualified':
        return '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/15 text-purple-400 border border-purple-500/30">Calificado</span>';
      case 'closed':
        return '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white border border-white/20">Cerrado</span>';
      default:
        return `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/5 text-[#86868b]">${status}</span>`;
    }
  }

  async function loadDashboardData() {
    try {
      // 1. Fetch Stats & Visitor counts
      const statsRes = await fetch('/api/stats', { headers: getAuthHeaders() });
      const statsData = await statsRes.json();
      if (statsData.success && statsData.stats) {
        const s = statsData.stats;
        
        // Render Visitor counters
        if (kpiTotalVisits) kpiTotalVisits.textContent = new Intl.NumberFormat('es-PY').format(s.totalVisits || 0);
        if (kpiUniqueVisitors) kpiUniqueVisitors.textContent = new Intl.NumberFormat('es-PY').format(s.uniqueVisitors || 0);
        if (kpiTodayVisits) kpiTodayVisits.textContent = `+${s.todayVisits || 0} visitas hoy`;

        // Render Business KPIs
        if (kpiTotalLeads) kpiTotalLeads.textContent = s.totalLeads;
        if (kpiNewLeads) kpiNewLeads.textContent = `${s.newLeads} nuevos`;
        if (kpiTotalAudits) kpiTotalAudits.textContent = s.totalRoiAudits;
        if (kpiAvgTicket) kpiAvgTicket.textContent = s.averageAuditTicketGs ? formatGs(s.averageAuditTicketGs) : 'Gs. 0';
        if (kpiAvgTraffic) kpiAvgTraffic.textContent = new Intl.NumberFormat('es-PY').format(s.averageAuditTraffic || 0);

        // Render Live visits stream
        if (liveVisitsList && s.recentVisits) {
          renderLiveVisits(s.recentVisits);
        }
      }

      // 2. Fetch Leads
      const leadsRes = await fetch('/api/leads', { headers: getAuthHeaders() });
      const leadsData = await leadsRes.json();
      if (leadsData.success) {
        allLeads = leadsData.leads || [];
        renderLeadsTable();
      }

      // 3. Fetch ROI Assessments
      const roiRes = await fetch('/api/roi-assessment', { headers: getAuthHeaders() });
      const roiData = await roiRes.json();
      if (roiData.success && roiList) {
        renderRoiList(roiData.assessments || []);
      }

      // 4. Fetch Appointments (Think Bot AI)
      const appRes = await fetch('/api/appointments', { headers: getAuthHeaders() });
      const appData = await appRes.json();
      if (appData.success) {
        renderAppointmentsTable(appData.appointments || []);
      }

      // 5. Fetch Chatbot Logs (Think Bot AI)
      const chatRes = await fetch('/api/chat-logs', { headers: getAuthHeaders() });
      const chatData = await chatRes.json();
      if (chatData.success) {
        renderChatLogsTable(chatData.logs || []);
      }

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Error loading dashboard:', err);
      showToast('Error al sincronizar datos con el servidor.');
    }
  }

  function renderChatLogsTable(logs) {
    const chatTableBody = document.getElementById('chat-table-body');
    const chatCountBadge = document.getElementById('chat-count-badge');
    if (!chatTableBody) return;
    if (chatCountBadge) chatCountBadge.textContent = logs.length;

    if (logs.length === 0) {
      chatTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="p-6 text-center text-xs text-[#86868b]">
            No hay mensajes registrados aún en el backend. Los mensajes de Think Bot AI aparecerán aquí en tiempo real.
          </td>
        </tr>
      `;
      return;
    }

    chatTableBody.innerHTML = logs
      .map(
        (log) => `
      <tr class="hover:bg-white/[0.02] transition-colors">
        <td class="p-4 font-mono text-[11px] text-white whitespace-nowrap">
          <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/80">
            ${(log.session_id || 'anon').substring(0, 14)}
          </span>
        </td>
        <td class="p-4 max-w-xs text-white font-medium">
          ${log.user_message}
        </td>
        <td class="p-4 whitespace-nowrap">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/20">
            ${log.intent || 'general'}
          </span>
        </td>
        <td class="p-4 max-w-sm text-[11px] text-[#86868b] truncate">
          ${log.bot_response ? log.bot_response.substring(0, 120) + '...' : '-'}
        </td>
        <td class="p-4 text-right font-mono text-[11px] whitespace-nowrap text-[#86868b]">
          ${formatDate(log.created_at)}
        </td>
      </tr>
    `
      )
      .join('');
  }

  function renderAppointmentsTable(appointments) {
    const appointmentsTableBody = document.getElementById('appointments-table-body');
    const appointmentsCountBadge = document.getElementById('appointments-count-badge');
    if (!appointmentsTableBody) return;
    if (appointmentsCountBadge) appointmentsCountBadge.textContent = appointments.length;

    if (appointments.length === 0) {
      appointmentsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="p-6 text-center text-xs text-[#86868b]">
            No hay citas agendadas aún. Las citas reservadas por Think Bot AI aparecerán aquí en tiempo real.
          </td>
        </tr>
      `;
      return;
    }

    appointmentsTableBody.innerHTML = appointments
      .map(
        (app) => `
      <tr class="hover:bg-white/[0.02] transition-colors">
        <td class="p-4 text-white font-semibold whitespace-nowrap">
          ${app.client_name}
        </td>
        <td class="p-4 text-[#a3e635] font-mono text-[11px] whitespace-nowrap">
          <a href="mailto:${app.client_email}" class="hover:underline">${app.client_email}</a>
        </td>
        <td class="p-4 text-[#86868b] font-mono text-[11px] whitespace-nowrap">
          ${app.client_phone || '-'}
        </td>
        <td class="p-4 font-mono text-white whitespace-nowrap">
          <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white font-semibold">
            📅 ${app.meeting_date} a las ${app.meeting_time}
          </span>
        </td>
        <td class="p-4 text-[#86868b] max-w-xs truncate">
          ${app.topic || 'Consulta General'}
        </td>
        <td class="p-4 whitespace-nowrap">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30">
            ${app.status || 'Confirmada'}
          </span>
        </td>
        <td class="p-4 text-right font-mono text-[11px] whitespace-nowrap text-[#86868b]">
          ${formatRelativeTime(app.created_at)}
        </td>
      </tr>
    `
      )
      .join('');
  }

  function renderLeadsTable() {
    if (!leadsTableBody) return;

    let filtered = allLeads;
    if (currentFilter !== 'all') {
      filtered = allLeads.filter((l) => l.status === currentFilter);
    }

    if (leadsCountBadge) {
      leadsCountBadge.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      leadsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-[#86868b]">
            No hay prospectos en la categoría seleccionada.
          </td>
        </tr>
      `;
      return;
    }

    leadsTableBody.innerHTML = filtered
      .map(
        (lead) => `
      <tr class="hover:bg-white/[0.02] transition-colors group cursor-pointer" data-id="${lead.id}">
        <!-- Client Name & Email -->
        <td class="py-3.5 pr-4">
          <div class="font-medium text-white group-hover:text-[#a3e635] transition-colors">${lead.name}</div>
          <div class="text-[#86868b] font-mono text-[11px]">${lead.email}</div>
        </td>

        <!-- Company / Website -->
        <td class="py-3.5 pr-4 text-[#86868b]">
          ${lead.company || '-'}
        </td>

        <!-- Services -->
        <td class="py-3.5 pr-4">
          <span class="line-clamp-1 max-w-[180px] text-white/90 font-mono text-[11px]">
            ${lead.services || 'General'}
          </span>
        </td>

        <!-- Budget -->
        <td class="py-3.5 pr-4 font-mono text-white text-[11px]">
          ${lead.budget || '-'}
        </td>

        <!-- Status -->
        <td class="py-3.5 pr-4">
          ${getStatusBadge(lead.status)}
        </td>

        <!-- Created At -->
        <td class="py-3.5 pr-4 font-mono text-[#86868b] text-[11px] whitespace-nowrap">
          ${formatDate(lead.created_at)}
        </td>

        <!-- Actions -->
        <td class="py-3.5 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5" onclick="event.stopPropagation()">
            <select class="status-select bg-black border border-white/10 text-[11px] rounded-lg px-2 py-1 text-[#f5f5f7] focus:border-white focus:outline-none" data-lead-id="${lead.id}">
              <option value="new" ${lead.status === 'new' ? 'selected' : ''}>Nuevo</option>
              <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contactado</option>
              <option value="qualified" ${lead.status === 'qualified' ? 'selected' : ''}>Calificado</option>
              <option value="closed" ${lead.status === 'closed' ? 'selected' : ''}>Cerrado</option>
            </select>
            <button class="view-lead-btn p-1 text-[#86868b] hover:text-white" data-lead-id="${lead.id}" title="Ver Detalles">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');

    // Attach row listeners
    document.querySelectorAll('#leads-table-body tr').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        const lead = allLeads.find((l) => l.id == id);
        if (lead) openLeadModal(lead);
      });
    });

    document.querySelectorAll('.view-lead-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-lead-id');
        const lead = allLeads.find((l) => l.id == id);
        if (lead) openLeadModal(lead);
      });
    });

    document.querySelectorAll('.status-select').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const id = sel.getAttribute('data-lead-id');
        const newStatus = sel.value;
        await updateLeadStatus(id, newStatus);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  async function updateLeadStatus(id, status) {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Estado del prospecto actualizado.');
        const idx = allLeads.findIndex((l) => l.id == id);
        if (idx !== -1) {
          allLeads[idx].status = status;
          renderLeadsTable();
        }
      } else {
        showToast(data.error || 'Error al actualizar estado.');
      }
    } catch (err) {
      showToast('Error de red al actualizar estado.');
    }
  }

  function openLeadModal(lead) {
    if (!leadModal || !modalLeadBody) return;
    modalLeadTitle.textContent = `Detalles de ${lead.name}`;
    modalLeadBody.innerHTML = `
      <div class="space-y-3 font-mono text-xs">
        <div class="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
          <div class="text-[#86868b] text-[10px]">CORREO ELECTRÓNICO</div>
          <div class="text-white font-sans text-sm font-medium">
            <a href="mailto:${lead.email}" class="hover:underline text-[#a3e635]">${lead.email}</a>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
            <div class="text-[#86868b] text-[10px]">EMPRESA / WEB</div>
            <div class="text-white font-sans text-xs">${lead.company || '-'}</div>
          </div>
          <div class="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
            <div class="text-[#86868b] text-[10px]">PRESUPUESTO</div>
            <div class="text-white font-sans text-xs">${lead.budget || '-'}</div>
          </div>
        </div>

        <div class="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
          <div class="text-[#86868b] text-[10px]">SERVICIOS REQUERIDOS</div>
          <div class="text-white font-sans text-xs">${lead.services || '-'}</div>
        </div>

        <div class="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
          <div class="text-[#86868b] text-[10px]">OBSERVACIONES / DETALLES</div>
          <div class="text-[#86868b] font-sans text-xs whitespace-pre-wrap">${lead.details || 'Sin observaciones adicionales.'}</div>
        </div>

        <div class="flex justify-between items-center text-[10px] text-[#86868b] pt-2 border-t border-white/10">
          <span>IP: ${lead.ip_address || '127.0.0.1'}</span>
          <span>Registrado: ${formatDate(lead.created_at)}</span>
        </div>

        <div class="pt-2">
          <a href="mailto:${lead.email}?subject=Think%20Lab.%20-%20Reuni%C3%B3n%20Estrat%C3%A9gica" class="btn-apple-primary w-full text-center block py-2.5 text-xs font-semibold">
            Enviar Correo a ${lead.name}
          </a>
        </div>
      </div>
    `;
    leadModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function renderLiveVisits(visits) {
    if (!liveVisitsList) return;
    if (visits.length === 0) {
      liveVisitsList.innerHTML = '<div class="text-xs text-[#86868b] text-center py-4">No hay visitas recientes.</div>';
      return;
    }

    liveVisitsList.innerHTML = visits
      .map(
        (v) => `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs">
        <div class="flex items-center gap-2.5">
          <span class="w-1.5 h-1.5 rounded-full bg-[#a3e635]"></span>
          <div>
            <div class="font-medium text-white">${v.device_type || 'Desktop'}</div>
            <div class="text-[10px] font-mono text-[#86868b] truncate max-w-[160px]">${v.referrer || 'Directo'}</div>
          </div>
        </div>
        <div class="text-[11px] font-mono text-[#86868b]">
          ${formatRelativeTime(v.created_at)}
        </div>
      </div>
    `
      )
      .join('');
  }

  function renderRoiList(assessments) {
    if (!roiList) return;
    if (assessments.length === 0) {
      roiList.innerHTML = '<div class="text-xs text-[#86868b] text-center py-4">No hay auditorías registradas.</div>';
      return;
    }

    roiList.innerHTML = assessments
      .slice(0, 5)
      .map(
        (a) => `
      <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1 text-xs">
        <div class="flex justify-between items-center text-[#86868b] font-mono text-[10px]">
          <span>Tráfico: ${new Intl.NumberFormat('es-PY').format(a.traffic)} visitas</span>
          <span class="text-[#a3e635] font-semibold">${a.multiplier}x Retorno</span>
        </div>
        <div class="text-sm font-semibold text-white font-mono">
          ${formatGs(a.projected_monthly_revenue_gs)}/mes
        </div>
        <div class="text-[11px] text-[#86868b]">
          +${formatGs(a.extra_annual_revenue_gs)} de incremento anual
        </div>
      </div>
    `
      )
      .join('');
  }

  // Filter Buttons
  ['all', 'new', 'contacted', 'closed'].forEach((f) => {
    const btn = document.getElementById(`filter-${f}`);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.apple-tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = f;
        renderLeadsTable();
      });
    }
  });

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      showToast('Actualizando datos en tiempo real...');
      loadDashboardData();
    });
  }

  if (leadModalClose && leadModal) {
    leadModalClose.addEventListener('click', () => leadModal.classList.add('hidden'));
    leadModal.addEventListener('click', (e) => {
      if (e.target === leadModal) leadModal.classList.add('hidden');
    });
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="text-[#a3e635]">✦</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Verify Session on Load
  checkAuthSession();
});
