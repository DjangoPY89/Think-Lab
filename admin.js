/**
 * Think Lab. - Admin Dashboard Logic
 * Connects directly to backend API (/api/stats, /api/leads, /api/roi-assessments)
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

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
  const refreshBtn = document.getElementById('refresh-btn');

  const leadModal = document.getElementById('lead-modal');
  const leadModalClose = document.getElementById('lead-modal-close');
  const modalLeadTitle = document.getElementById('modal-lead-title');
  const modalLeadBody = document.getElementById('modal-lead-body');

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
      const statsRes = await fetch('/api/stats');
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
      const leadsRes = await fetch('/api/leads');
      const leadsData = await leadsRes.json();
      if (leadsData.success) {
        allLeads = leadsData.leads || [];
        renderLeadsTable();
      }

      // 3. Fetch ROI Assessments
      const roiRes = await fetch('/api/roi-assessment');
      const roiData = await roiRes.json();
      if (roiData.success && roiList) {
        renderRoiList(roiData.assessments || []);
      }

      // 4. Fetch Appointments (Think Bot AI)
      const appRes = await fetch('/api/appointments');
      const appData = await appRes.json();
      if (appData.success) {
        renderAppointmentsTable(appData.appointments || []);
      }

      // 5. Fetch Chatbot Logs (Think Bot AI)
      const chatRes = await fetch('/api/chat-logs');
      const chatData = await chatRes.json();
      if (chatData.success) {
        renderChatLogsTable(chatData.logs || []);
      }

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      console.error('Error loading dashboard:', err);
      showToast('Error al conectar con la API.');
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
        (a) => `
      <tr class="hover:bg-white/[0.02] transition-colors">
        <td class="p-4 font-mono font-semibold text-white">#${a.id}</td>
        <td class="p-4 font-medium text-white">${a.client_name}</td>
        <td class="p-4">
          <a href="mailto:${a.client_email}" class="text-white hover:text-[#a3e635] underline transition-colors block">
            ${a.client_email}
          </a>
        </td>
        <td class="p-4 font-mono text-white text-[11px] whitespace-nowrap">
          <span class="text-[#a3e635]">📅 ${a.meeting_date}</span> • ${a.meeting_time}
        </td>
        <td class="p-4 max-w-xs text-[11px] text-[#f5f5f7]">
          ${a.topic || 'Llamada Estratégica'}
        </td>
        <td class="p-4 whitespace-nowrap">
          <select data-appointment-status-id="${a.id}" class="bg-[#18181b] border border-white/10 text-[11px] rounded-lg px-2 py-1 text-white focus:outline-none focus:border-white/30 cursor-pointer">
            <option value="confirmed" ${a.status === 'confirmed' ? 'selected' : ''}>Confirmada</option>
            <option value="completed" ${a.status === 'completed' ? 'selected' : ''}>Completada</option>
            <option value="cancelled" ${a.status === 'cancelled' ? 'selected' : ''}>Cancelada</option>
          </select>
        </td>
        <td class="p-4 text-right whitespace-nowrap">
          <a href="https://wa.me/595983463553?text=Hola%20${encodeURIComponent(a.client_name)}%2C%20te%20escribimos%20de%20Think%20Lab.%20para%20coordinar%20nuestra%20llamada%20del%20${encodeURIComponent(a.meeting_date)}" target="_blank" class="btn-apple-secondary text-[11px] py-1 px-2.5">
            Contactar
          </a>
        </td>
      </tr>
    `
      )
      .join('');

    appointmentsTableBody.querySelectorAll('[data-appointment-status-id]').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const id = sel.getAttribute('data-appointment-status-id');
        const newStatus = e.target.value;
        try {
          const res = await fetch(`/api/appointments/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          const data = await res.json();
          if (data.success) {
            showToast(`Cita #${id} actualizada a ${newStatus}.`);
          }
        } catch (err) {
          showToast('Error al actualizar cita.');
        }
      });
    });
  }

  function renderLiveVisits(visits) {
    if (!liveVisitsList) return;
    if (visits.length === 0) {
      liveVisitsList.innerHTML = '<div class="text-xs text-[#86868b] text-center py-4">Sin visitas recientes registradas.</div>';
      return;
    }

    liveVisitsList.innerHTML = visits
      .map(
        (v) => `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md text-[10px] font-mono ${
            v.device_type === 'Mobile' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }">
            ${v.device_type || 'Desktop'}
          </span>
          <span class="text-white text-[11px] font-mono">/ (Landing Page)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-[#86868b]">${v.referrer !== 'Directo' ? v.referrer : 'Tráfico Directo'}</span>
          <span class="text-[10px] font-mono text-[#a3e635]">${formatRelativeTime(v.created_at)}</span>
        </div>
      </div>
    `
      )
      .join('');
  }

  function renderLeadsTable() {
    if (!leadsTableBody) return;

    const filtered = currentFilter === 'all'
      ? allLeads
      : allLeads.filter((l) => l.status === currentFilter);

    if (leadsCountBadge) {
      leadsCountBadge.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      leadsTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="p-8 text-center text-xs text-[#86868b]">
            No hay prospectos en este estado.
          </td>
        </tr>
      `;
      return;
    }

    leadsTableBody.innerHTML = filtered
      .map(
        (lead) => `
      <tr class="hover:bg-white/[0.02] transition-colors">
        <td class="p-4 font-mono font-semibold text-white">#${lead.id}</td>
        <td class="p-4">
          <div class="font-medium text-white">${lead.name}</div>
          <div class="text-[11px] text-[#86868b]">${lead.company || 'Sin Empresa'}</div>
        </td>
        <td class="p-4">
          <a href="mailto:${lead.email}" class="text-white hover:text-[#a3e635] underline transition-colors block">
            ${lead.email}
          </a>
        </td>
        <td class="p-4 max-w-xs">
          <span class="text-[11px] text-[#f5f5f7]">${lead.services || 'General'}</span>
        </td>
        <td class="p-4 font-mono text-white text-[11px] whitespace-nowrap">
          ${lead.budget || '-'}
        </td>
        <td class="p-4 whitespace-nowrap">
          <select data-lead-status-id="${lead.id}" class="bg-[#18181b] border border-white/10 text-[11px] rounded-lg px-2 py-1 text-white focus:outline-none focus:border-white/30 cursor-pointer">
            <option value="new" ${lead.status === 'new' ? 'selected' : ''}>Nuevo</option>
            <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contactado</option>
            <option value="qualified" ${lead.status === 'qualified' ? 'selected' : ''}>Calificado</option>
            <option value="closed" ${lead.status === 'closed' ? 'selected' : ''}>Cerrado</option>
          </select>
        </td>
        <td class="p-4 text-[11px] font-mono whitespace-nowrap text-[#86868b]">
          ${formatDate(lead.created_at)}
        </td>
        <td class="p-4 text-right whitespace-nowrap">
          <button data-view-lead="${lead.id}" class="btn-apple-secondary text-[11px] py-1 px-2.5">
            Ver Detalle
          </button>
        </td>
      </tr>
    `
      )
      .join('');

    // Attach status change listeners
    leadsTableBody.querySelectorAll('[data-lead-status-id]').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const id = sel.getAttribute('data-lead-status-id');
        const newStatus = e.target.value;
        await updateStatus(id, newStatus);
      });
    });

    // Attach view modal listeners
    leadsTableBody.querySelectorAll('[data-view-lead]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-view-lead'));
        openLeadModal(id);
      });
    });
  }

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Prospecto #${id} actualizado a ${status}.`);
        loadDashboardData();
      } else {
        showToast('Error al actualizar estado.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Error de red al actualizar.');
    }
  }

  function openLeadModal(id) {
    const lead = allLeads.find((l) => l.id === id);
    if (!lead || !leadModal || !modalLeadBody) return;

    modalLeadTitle.textContent = `Prospecto #${lead.id} • ${lead.name}`;
    modalLeadBody.innerHTML = `
      <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div><span class="text-[#86868b]">Nombre:</span> <strong class="text-white">${lead.name}</strong></div>
          <div><span class="text-[#86868b]">Empresa:</span> <strong class="text-white">${lead.company || '-'}</strong></div>
          <div><span class="text-[#86868b]">Email:</span> <a href="mailto:${lead.email}" class="text-[#a3e635] underline">${lead.email}</a></div>
          <div><span class="text-[#86868b]">Plazo:</span> <strong class="text-white">${lead.timeline || '-'}</strong></div>
        </div>
        <div class="border-t border-white/10 pt-2 text-xs">
          <span class="text-[#86868b] block mb-1">Servicios Requeridos:</span>
          <div class="text-white font-medium">${lead.services || '-'}</div>
        </div>
        <div class="border-t border-white/10 pt-2 text-xs">
          <span class="text-[#86868b] block mb-1">Rango de Inversión:</span>
          <div class="text-[#a3e635] font-mono font-semibold">${lead.budget || '-'}</div>
        </div>
        ${
          lead.details
            ? `
          <div class="border-t border-white/10 pt-2 text-xs">
            <span class="text-[#86868b] block mb-1">Detalles Adicionales:</span>
            <p class="text-[#f5f5f7] leading-relaxed bg-black/40 p-2.5 rounded-xl border border-white/5">${lead.details}</p>
          </div>
        `
            : ''
        }
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <a href="mailto:${lead.email}?subject=Think%20Lab.%20-%20Propuesta%20de%20Proyecto" class="btn-apple-primary text-xs py-1.5 px-4">
          Responder por Email
        </a>
      </div>
    `;

    leadModal.classList.remove('hidden');
  }

  function renderRoiList(assessments) {
    if (assessments.length === 0) {
      roiList.innerHTML = '<div class="text-xs text-[#86868b]">No hay evaluaciones registradas aún.</div>';
      return;
    }

    roiList.innerHTML = assessments
      .slice(0, 6)
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

  // Initial Load
  loadDashboardData();
});
