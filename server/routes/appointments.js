/**
 * Think Lab. - Appointments & Strategy Calls Router
 * Handles booking, validation, and listing of client appointments
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * POST /api/appointments
 * Book a new strategy call with Think Lab.
 */
router.post('/', (req, res) => {
  try {
    const { client_name, client_email, client_phone, meeting_date, meeting_time, topic, notes } = req.body;

    if (!client_name || !client_name.trim()) {
      return res.status(400).json({ success: false, error: 'Por favor proporciona tu nombre completo.' });
    }

    if (!client_email || !validateEmail(client_email)) {
      return res.status(400).json({ success: false, error: 'Proporciona un correo electrónico válido para confirmar la reunión.' });
    }

    if (!meeting_date || !meeting_time) {
      return res.status(400).json({ success: false, error: 'Selecciona una fecha y hora válidas para la llamada.' });
    }

    const stmt = db.db.prepare(`
      INSERT INTO appointments (client_name, client_email, client_phone, meeting_date, meeting_time, topic, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `);

    const result = stmt.run(
      client_name.trim(),
      client_email.trim().toLowerCase(),
      (client_phone || '').trim(),
      meeting_date.trim(),
      meeting_time.trim(),
      (topic || 'Llamada de Negocios ThinkBot AI').trim(),
      (notes || '').trim()
    );

    const appointmentId = result.lastInsertRowid;

    // Also sync to leads table for unified visibility
    try {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const leadStmt = db.db.prepare(`
        INSERT INTO leads (name, email, company, services, budget, timeline, details, status, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)
      `);
      leadStmt.run(
        client_name.trim(),
        client_email.trim().toLowerCase(),
        'Think Bot AI Lead',
        'Llamada de Negocios',
        'A definir en llamada',
        `${meeting_date} (${meeting_time})`,
        `Cita agendada via Chatbot. Tema: ${topic || 'Consultoría Estratégica'}. Teléfono: ${client_phone || 'No especificado'}`,
        clientIp
      );
    } catch (leadSyncErr) {
      console.warn('⚠️ Could not mirror appointment to leads table:', leadSyncErr.message);
    }

    console.log(`📅 [NEW APPOINTMENT #${appointmentId}] ${client_name} (${client_email}) para el ${meeting_date} a las ${meeting_time}`);

    return res.status(201).json({
      success: true,
      message: `¡Cita confirmada con éxito para el ${meeting_date} a las ${meeting_time}!`,
      appointmentId: Number(appointmentId),
      data: {
        id: Number(appointmentId),
        client_name,
        client_email,
        client_phone,
        meeting_date,
        meeting_time,
        topic: topic || 'Evaluación de Proyecto Web / IA',
        status: 'confirmed'
      }
    });
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    return res.status(500).json({ success: false, error: 'Error interno al reservar la cita.' });
  }
});

/**
 * GET /api/appointments
 * List all scheduled appointments
 */
router.get('/', (req, res) => {
  try {
    const stmt = db.db.prepare(`
      SELECT * FROM appointments
      ORDER BY meeting_date ASC, meeting_time ASC
    `);
    const appointments = stmt.all();

    return res.json({
      success: true,
      total: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar las citas.' });
  }
});

/**
 * PATCH /api/appointments/:id
 * Update appointment status
 */
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['confirmed', 'completed', 'cancelled', 'rescheduled'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `Estado inválido. Válidos: ${allowed.join(', ')}` });
    }

    const stmt = db.db.prepare('UPDATE appointments SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Cita no encontrada.' });
    }

    return res.json({ success: true, message: 'Estado de la cita actualizado.', status });
  } catch (error) {
    console.error('❌ Error updating appointment:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar la cita.' });
  }
});

/**
 * DELETE /api/appointments/:id
 * Cancel/Delete appointment
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.db.prepare('DELETE FROM appointments WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Cita no encontrada.' });
    }

    return res.json({ success: true, message: 'Cita eliminada correctamente.' });
  } catch (error) {
    console.error('❌ Error deleting appointment:', error);
    return res.status(500).json({ success: false, error: 'Error al eliminar la cita.' });
  }
});

module.exports = router;
