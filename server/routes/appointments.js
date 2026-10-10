/**
 * Think Lab. - Appointments & Strategy Calls Router
 * Handles booking, validation, listing of client appointments, and Supabase cloud sync
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { supabase } = require('../supabase');

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * POST /api/appointments
 * Book a new strategy call with Think Lab.
 */
router.post('/', async (req, res) => {
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

    // Supabase cloud sync
    if (supabase) {
      supabase.from('appointments').insert([{
        client_name: client_name.trim(),
        client_email: client_email.trim().toLowerCase(),
        client_phone: (client_phone || '').trim(),
        meeting_date: meeting_date.trim(),
        meeting_time: meeting_time.trim(),
        topic: (topic || 'Llamada de Negocios ThinkBot AI').trim(),
        notes: (notes || '').trim(),
        status: 'confirmed'
      }]).then(({ error }) => {
        if (!error) console.log('☁️ [SUPABASE SYNC] Appointment synced to cloud!');
      }).catch(() => {});
    }

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
 * List all scheduled appointments (Supabase with SQLite fallback)
 */
router.get('/', async (req, res) => {
  try {
    const { status, date } = req.query;

    if (supabase) {
      try {
        let query = supabase.from('appointments').select('*').order('meeting_date', { ascending: true });
        if (status) query = query.eq('status', status);
        if (date) query = query.eq('meeting_date', date);

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return res.json({
            success: true,
            source: 'supabase_cloud',
            total: data.length,
            appointments: data
          });
        }
      } catch (e) {}
    }

    let query = 'SELECT * FROM appointments';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (date) {
      conditions.push('meeting_date = ?');
      params.push(date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY meeting_date ASC, meeting_time ASC';

    const stmt = db.db.prepare(query);
    const appointments = stmt.all(...params);

    return res.json({
      success: true,
      source: 'sqlite_local',
      total: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar citas agendadas.' });
  }
});

/**
 * PATCH /api/appointments/:id/status
 */
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['confirmed', 'completed', 'rescheduled', 'cancelled'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado de cita inválido.' });
    }

    const stmt = db.db.prepare('UPDATE appointments SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);

    if (supabase) {
      supabase.from('appointments').update({ status }).eq('id', id).then(() => {}).catch(() => {});
    }

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Cita no encontrada.' });
    }

    return res.json({ success: true, message: 'Estado de cita actualizado.', status });
  } catch (error) {
    console.error('❌ Error updating appointment:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar la cita.' });
  }
});

module.exports = router;
