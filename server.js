/**
 * Think Lab. - Core Backend Server
 * Technology Stack: Node.js, Express, SQLite Native
 * Architecture: Clean, Secure, High-Performance
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./server/db');

const leadsRouter = require('./server/routes/leads');
const roiRouter = require('./server/routes/roi');
const chatRouter = require('./server/routes/chat');
const appointmentsRouter = require('./server/routes/appointments');
const { router: authRouter } = require('./server/routes/auth');

const app = express();
const PORT = process.env.PORT || 8000;

// Security & Parsing Middlewares
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Custom Minimalist Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      const statusColor = res.statusCode >= 400 ? '❌' : '⚡';
      console.log(`${statusColor} [${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

function getDeviceType(userAgent) {
  if (!userAgent) return 'Desktop';
  if (/mobile|iphone|android/i.test(userAgent)) return 'Mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

const { supabase } = require('./server/supabase');

// Track Landing Page Visitor Hits
app.use((req, res, next) => {
  if (req.method === 'GET' && (req.path === '/' || req.path === '/index.html')) {
    try {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || '';
      const referrer = req.headers['referer'] || req.headers['referrer'] || 'Directo';
      const device = getDeviceType(userAgent);

      const stmt = db.db.prepare(`
        INSERT INTO site_visits (ip_address, user_agent, referrer, path, device_type)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(clientIp, userAgent.substring(0, 200), referrer.substring(0, 150), req.path, device);

      // Supabase cloud sync
      if (supabase) {
        supabase.from('site_visits').insert([{
          ip_address: clientIp,
          user_agent: userAgent.substring(0, 200),
          referrer: referrer.substring(0, 150),
          path: req.path,
          device_type: device
        }]).then(() => {}).catch(() => {});
      }
    } catch (e) {
      console.error('Error logging visit:', e);
    }
  }
  next();
});

// Serve Static Frontend Assets
const publicPath = path.join(__dirname);
app.use(express.static(publicPath));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/roi-assessment', roiRouter);
app.use('/api/chat', chatRouter);
app.use('/api/appointments', appointmentsRouter);

/**
 * GET /api/health
 * System Health & Live Metrics
 */
app.get('/api/health', (req, res) => {
  try {
    const uptimeSeconds = Math.floor(process.uptime());
    const leadCountStmt = db.db.prepare('SELECT COUNT(*) as count FROM leads');
    const visitCountStmt = db.db.prepare('SELECT COUNT(*) as count FROM site_visits');
    const appointmentCountStmt = db.db.prepare('SELECT COUNT(*) as count FROM appointments');
    const leadCount = leadCountStmt.get().count;
    const visitCount = visitCountStmt.get().count;
    const appointmentCount = appointmentCountStmt.get().count;

    return res.json({
      status: 'operational',
      engine: 'Node.js Express + SQLite',
      uptime: `${uptimeSeconds}s`,
      totalLeads: leadCount,
      totalVisits: visitCount,
      totalAppointments: appointmentCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ status: 'degraded', error: error.message });
  }
});

/**
 * GET /api/stats
 * Aggregated Business & Platform Statistics with Visitor & Appointment Counters
 */
app.get('/api/stats', (req, res) => {
  try {
    const totalLeadsStmt = db.db.prepare('SELECT COUNT(*) as total FROM leads');
    const newLeadsStmt = db.db.prepare("SELECT COUNT(*) as newLeads FROM leads WHERE status = 'new'");
    const totalRoiStmt = db.db.prepare('SELECT COUNT(*) as totalAudits FROM roi_assessments');
    const avgTrafficStmt = db.db.prepare('SELECT AVG(traffic) as avgTraffic, AVG(ticket_gs) as avgTicket FROM roi_assessments');

    // Visitor counters
    const totalVisitsStmt = db.db.prepare('SELECT COUNT(*) as totalVisits FROM site_visits');
    const uniqueVisitorsStmt = db.db.prepare('SELECT COUNT(DISTINCT ip_address) as uniqueVisitors FROM site_visits');
    const todayVisitsStmt = db.db.prepare("SELECT COUNT(*) as todayVisits FROM site_visits WHERE DATE(created_at, 'localtime') = DATE('now', 'localtime')");
    const recentVisitsStmt = db.db.prepare("SELECT id, device_type, referrer, created_at FROM site_visits ORDER BY created_at DESC LIMIT 10");

    // Appointments counters
    const totalAppointmentsStmt = db.db.prepare('SELECT COUNT(*) as totalAppointments FROM appointments');
    const recentAppointmentsStmt = db.db.prepare("SELECT * FROM appointments ORDER BY meeting_date ASC, meeting_time ASC LIMIT 10");

    // Chatbot metrics
    const totalChatStmt = db.db.prepare('SELECT COUNT(*) as total FROM chat_logs');
    const recentChatStmt = db.db.prepare('SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT 15');

    const totalLeads = totalLeadsStmt.get().total;
    const newLeads = newLeadsStmt.get().newLeads;
    const totalAudits = totalRoiStmt.get().totalAudits;
    const avgData = avgTrafficStmt.get();

    const totalVisits = totalVisitsStmt.get().totalVisits;
    const uniqueVisitors = uniqueVisitorsStmt.get().uniqueVisitors;
    const todayVisits = todayVisitsStmt.get().todayVisits;
    const recentVisits = recentVisitsStmt.all();
    const totalAppointments = totalAppointmentsStmt.get().totalAppointments;
    const recentAppointments = recentAppointmentsStmt.all();
    const totalChatMessages = totalChatStmt.get().total;
    const recentChatLogs = recentChatStmt.all();

    return res.json({
      success: true,
      stats: {
        totalVisits,
        uniqueVisitors,
        todayVisits,
        totalLeads,
        newLeads,
        totalRoiAudits: totalAudits,
        totalAppointments,
        totalChatMessages,
        averageAuditTraffic: Math.round(avgData.avgTraffic || 0),
        averageAuditTicketGs: Math.round(avgData.avgTicket || 0),
        recentVisits,
        recentAppointments,
        recentChatLogs
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar estadísticas.' });
  }
});

/**
 * GET /api/chat-logs
 * Real-time conversation logs from Think Bot AI
 */
app.get('/api/chat-logs', (req, res) => {
  try {
    const stmt = db.db.prepare('SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT 50');
    const logs = stmt.all();
    return res.json({ success: true, total: logs.length, logs });
  } catch (err) {
    console.error('❌ Error fetching chat logs:', err);
    return res.status(500).json({ success: false, error: 'Error al consultar logs del chatbot.' });
  }
});

// Admin Dashboard UI
app.get(['/admin', '/dashboard'], (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});

// Fallback for Landing Page
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint no encontrado.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor. Intente nuevamente más tarde.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Think Lab. Backend Server running at http://localhost:${PORT}`);
  console.log(`📁 Static Frontend served from: ${publicPath}`);
  console.log(`🔌 API Endpoints:`);
  console.log(`   - POST /api/leads            (Submit contact lead)`);
  console.log(`   - GET  /api/leads            (List leads)`);
  console.log(`   - POST /api/roi-assessment   (Save ROI calculation)`);
  console.log(`   - GET  /api/health           (Health check)`);
  console.log(`   - GET  /api/stats            (Platform statistics)`);
  console.log(`======================================================\n`);
});
