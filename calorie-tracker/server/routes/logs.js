const express = require('express');
const router = express.Router();
// Ensure 'Log' matches the exact capitalization of your file in the models folder
const Log = require('../models/Log'); 

// --- 1. STATISTICS ROUTE (FOR INSIGHTS PAGE) ---
router.get('/stats', async (req, res) => {
  const { email } = req.query;
  try {
    const logs = await Log.find({ userEmail: email });

    // Peak Intake Calculation
    const dayMap = {};
    logs.forEach(log => {
      const date = new Date(log.createdAt || log.date).toLocaleDateString();
      dayMap[date] = (dayMap[date] || 0) + (Number(log.calories) || 0);
    });

    const peakValue = logs.length > 0 ? Math.max(...Object.values(dayMap)) : 0;
    const peakDate = Object.keys(dayMap).find(date => dayMap[date] === peakValue) || "No data";

    // --- TIMEFRAME CALCULATIONS (FIXED FOR "THIS WEEK") ---
    const now = new Date();
    
    // 1. Start of Week: Sunday at 00:00:00
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // 2. Start of Month: 1st of the month at 00:00:00
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 3. Start of Year: Jan 1st at 00:00:00
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    startOfYear.setHours(0, 0, 0, 0);

    res.json({
      weekTotal: logs.filter(l => new Date(l.createdAt || l.date) >= startOfWeek).reduce((s, l) => s + (Number(l.calories) || 0), 0),
      monthTotal: logs.filter(l => new Date(l.createdAt || l.date) >= startOfMonth).reduce((s, l) => s + (Number(l.calories) || 0), 0),
      yearTotal: logs.filter(l => new Date(l.createdAt || l.date) >= startOfYear).reduce((s, l) => s + (Number(l.calories) || 0), 0),
      peakIntake: { calories: peakValue, date: peakDate }
    });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// --- 2. DAILY LOG ROUTES (FOR DASHBOARD) ---
router.get('/', async (req, res) => {
  try {
    const logs = await Log.find({ userEmail: req.query.email }).sort({ date: -1 });
    res.json(logs);
  } catch (err) { res.status(500).send(err); }
});

router.post('/', async (req, res) => {
  try {
    const log = new Log(req.body);
    await log.save();
    res.json(log);
  } catch (err) { res.status(500).send(err); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Log.findByIdAndDelete(req.params.id);
    res.send("Deleted");
  } catch (err) { res.status(500).send(err); }
});

module.exports = router;