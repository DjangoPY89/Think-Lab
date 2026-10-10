/**
 * Think Lab. - Leads Router
 * Handles intake wizard submissions, lead tracking, status updates, and Supabase cloud sync
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendLeadNotification } = require('../mailer');
const { supabase } = require('../supabase');

// Validation helper
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * POST /api/leads
 * Submit project request from intake wizard
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, services, budget, timeline, details } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre es obligatorio.' });
    }

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Proporciona un correo electrónico válido.' });
    }

    const servicesStr = Array.isArray(services) ? services.join(', ') : (services || 'General');
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // 1. Insert into local SQLite database
    const insertStmt = db.db.prepare(`
      INSERT INTO leads (name, email, phone, company, services, budget, timeline, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      name.trim(),
      email.trim().toLowerCase(),
      (phone || '').trim(),
      (company || '').trim(),
      servicesStr,
      budget || 'No especificado',
      timeline || 'Estándar',
      (details || '').trim(),
      clientIp
    );

    const leadId = result.lastInsertRowid;

    console.log(`📥 [NEW LEAD #${leadId}] ${name} (${email}) - Tel: ${phone || 'N/A'} - ${servicesStr} - Presupuesto: ${budget}`);

    // 2. Sync asynchronously with Supabase Cloud
    if (supabase) {
      supabase.from('leads').insert([{
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: (phone || '').trim(),
        company: (company || '').trim(),
        services: servicesStr,
        budget: budget || 'No especificado',
        timeline: timeline || 'Estándar',
        details: (details || '').trim(),
        ip_address: clientIp
      }]).then(({ error }) => {
        if (error) {
          console.warn('⚠️ [SUPABASE SYNC] Could not insert to Supabase (check if schema is applied):', error.message);
        } else {
          console.log('☁️ [SUPABASE SYNC] Lead synced to Supabase Cloud PostgreSQL!');
        }
      }).catch(err => {
        console.warn('⚠️ [SUPABASE ERROR]:', err.message);
      });
    }

    // 3. Send automated email notification to admin (juanas89@gmail.com)
    let emailResult = { sent: false };
    try {
      emailResult = await sendLeadNotification({
        leadId: Number(leadId),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: (phone || '').trim(),
        company: (company || '').trim(),
        services: servicesStr,
        budget: budget || 'No especificado',
        timeline: timeline || 'Estándar',
        details: (details || '').trim(),
        ipAddress: clientIp
      });
      console.log(`📬 [LEAD EMAIL RESULT] Sent to admin:`, emailResult.sent, emailResult.recipient || '');
    } catch (mailErr) {
      console.error('⚠️ [MAIL ERROR] Error dispatching notification email:', mailErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Solicitud recibida exitosamente. Un Lead Architect de Think Lab. se pondrá en contacto en breve.',
      leadId: Number(leadId),
      emailSent: emailResult.sent || false,
      data: {
        name,
        email,
        phone,
        company,
        services: servicesStr,
        budget
      }
    });
  } catch (error) {
    console.error('❌ Error saving lead:', error);
    return res.status(500).json({ success: false, error: 'Error interno al procesar la solicitud.' });
  }
});

/**
 * GET /api/leads
 * Retrieve all registered leads (Queries Supabase with SQLite fallback)
 */
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    if (supabase) {
      try {
        let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return res.json({
            success: true,
            source: 'supabase_cloud',
            total: data.length,
            leads: data
          });
        }
      } catch (cloudErr) {
        console.warn('⚠️ Supabase fetch fallback to SQLite:', cloudErr.message);
      }
    }

    let query = 'SELECT * FROM leads';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.db.prepare(query);
    const leads = stmt.all(...params);

    return res.json({
      success: true,
      source: 'sqlite_local',
      total: leads.length,
      leads
    });
  } catch (error) {
    console.error('❌ Error fetching leads:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar prospectos.' });
  }
});

/**
 * GET /api/leads/:id
 * Retrieve single lead by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.db.prepare('SELECT * FROM leads WHERE id = ?');
    const lead = stmt.get(id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Prospecto no encontrado.' });
    }

    return res.json({ success: true, lead });
  } catch (error) {
    console.error('❌ Error fetching lead:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar el prospecto.' });
  }
});

/**
 * PATCH /api/leads/:id
 * Update lead status
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['new', 'contacted', 'qualified', 'proposal_sent', 'closed', 'archived'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Estado inválido. Estados permitidos: ${allowedStatuses.join(', ')}`
      });
    }

    // Update SQLite
    const stmt = db.db.prepare('UPDATE leads SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);

    // Update Supabase
    if (supabase) {
      supabase.from('leads').update({ status }).eq('id', id).then(() => {}).catch(() => {});
    }

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Prospecto no encontrado.' });
    }

    return res.json({ success: true, message: 'Estado actualizado correctamente.', status });
  } catch (error) {
    console.error('❌ Error updating lead status:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar el prospecto.' });
  }
});

/**
 * DELETE /api/leads/:id
 * Remove lead
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.db.prepare('DELETE FROM leads WHERE id = ?');
    const result = stmt.run(id);

    if (supabase) {
      supabase.from('leads').delete().eq('id', id).then(() => {}).catch(() => {});
    }

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Prospecto no encontrado.' });
    }

    return res.json({ success: true, message: 'Prospecto eliminado correctamente.' });
  } catch (error) {
    console.error('❌ Error deleting lead:', error);
    return res.status(500).json({ success: false, error: 'Error al eliminar el prospecto.' });
  }
});

module.exports = router;
