/**
 * Think Lab. - Leads Router
 * Handles intake wizard submissions, lead tracking, and status updates
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// Validation helper
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * POST /api/leads
 * Submit project request from intake wizard
 */
router.post('/', (req, res) => {
  try {
    const { name, email, company, services, budget, timeline, details } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre es obligatorio.' });
    }

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Proporciona un correo electrónico válido.' });
    }

    const servicesStr = Array.isArray(services) ? services.join(', ') : (services || 'General');
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const insertStmt = db.db.prepare(`
      INSERT INTO leads (name, email, company, services, budget, timeline, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      name.trim(),
      email.trim().toLowerCase(),
      (company || '').trim(),
      servicesStr,
      budget || 'No especificado',
      timeline || 'Estándar',
      (details || '').trim(),
      clientIp
    );

    const leadId = result.lastInsertRowid;

    console.log(`📥 [NEW LEAD #${leadId}] ${name} (${email}) - ${servicesStr} - Presupuesto: ${budget}`);

    return res.status(201).json({
      success: true,
      message: 'Solicitud recibida exitosamente. Un Lead Architect de Think Lab. se pondrá en contacto en breve.',
      leadId: Number(leadId),
      data: {
        name,
        email,
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
 * Retrieve all registered leads
 */
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
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
router.patch('/:id', (req, res) => {
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

    const stmt = db.db.prepare('UPDATE leads SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);

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
