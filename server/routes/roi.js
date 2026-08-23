/**
 * Think Lab. - ROI Assessment Router
 * Handles conversion growth calculations and user audit submissions
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /api/roi-assessment
 * Save ROI calculator assessment & audit request
 */
router.post('/', (req, res) => {
  try {
    const { traffic, ticket_gs, conversion_rate, contact_email } = req.body;

    const parsedTraffic = parseInt(traffic) || 10000;
    const parsedTicket = parseInt(ticket_gs) || 1500000;
    const parsedConv = parseFloat(conversion_rate) || 1.5;

    const currentMonthly = Math.round(parsedTraffic * (parsedConv / 100) * parsedTicket);
    const projectedConv = Math.min(parsedConv * 2.5, 9.5);
    const projectedMonthly = Math.round(parsedTraffic * (projectedConv / 100) * parsedTicket);
    const extraAnnual = (projectedMonthly - currentMonthly) * 12;
    const multiplier = parseFloat((projectedMonthly / (currentMonthly || 1)).toFixed(1));

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const stmt = db.db.prepare(`
      INSERT INTO roi_assessments (
        traffic, ticket_gs, conversion_rate, projected_conversion_rate,
        current_monthly_revenue_gs, projected_monthly_revenue_gs, extra_annual_revenue_gs,
        multiplier, contact_email, ip_address
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      parsedTraffic,
      parsedTicket,
      parsedConv,
      projectedConv,
      currentMonthly,
      projectedMonthly,
      extraAnnual,
      multiplier,
      contact_email || null,
      clientIp
    );

    console.log(`📊 [ROI AUDIT #${result.lastInsertRowid}] Tráfico: ${parsedTraffic} | Ticket: Gs. ${parsedTicket} | Extra Anual: +Gs. ${extraAnnual}`);

    return res.status(201).json({
      success: true,
      assessmentId: Number(result.lastInsertRowid),
      data: {
        traffic: parsedTraffic,
        ticket_gs: parsedTicket,
        conversion_rate: parsedConv,
        projected_conversion_rate: projectedConv,
        current_monthly_gs: currentMonthly,
        projected_monthly_gs: projectedMonthly,
        extra_annual_gs: extraAnnual,
        multiplier
      }
    });
  } catch (error) {
    console.error('❌ Error processing ROI assessment:', error);
    return res.status(500).json({ success: false, error: 'Error al procesar la proyección ROI.' });
  }
});

/**
 * GET /api/roi-assessments
 * List stored ROI assessments
 */
router.get('/', (req, res) => {
  try {
    const stmt = db.db.prepare('SELECT * FROM roi_assessments ORDER BY created_at DESC LIMIT 50');
    const assessments = stmt.all();
    return res.json({ success: true, total: assessments.length, assessments });
  } catch (error) {
    console.error('❌ Error fetching ROI assessments:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar evaluaciones.' });
  }
});

module.exports = router;
