const express = require('express');
const router = express.Router();
const Log = require('../models/Log'); 

// --- 1. STATISTICS ROUTE (FOR INSIGHTS PAGE) ---
router.get('/stats', async (req, res) => {
  // Use lowercase to match the login/signup logic
  const email = req.query.email?.toLowerCase(); 
  
  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required" });
  }

  try {
    const logs = await Log.find({ userEmail: email });

    if (!logs || logs.length === 0) {
      return res.json({
        weekTotal: 0,
        monthTotal: 0,
        yearTotal: 0,
        peakIntake: { calories: 0, date: 'No data' }
      });
    }

    // Helper to safely get date from log
    const getLogDate = (l) => new Date(l.createdAt || l.date || Date.now());

    // Peak Intake Calculation using a Map for daily totals
    const dayMap = {};
    logs.forEach(log => {
      const dateStr = getLogDate(log).toLocaleDateString();
      dayMap[dateStr] = (dayMap[dateStr] || 0) + (Number(log.calories) || 0);
    });

    const peakValue = Math.max(...Object.values(dayMap));
    const peakDate = Object.keys(dayMap).find(date => dayMap[date] === peakValue);

    // --- TIMEFRAME ANCHORS ---
    const now = new Date();
    
    // Start of Week (Sunday)
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of Month (1st)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Start of Year (Jan 1st)
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    startOfYear.setHours(0, 0, 0, 0);

    // Return calculated totals
    res.json({
      weekTotal: logs
        .filter(l => getLogDate(l) >= startOfWeek)
        .reduce((s, l) => s + (Number(l.calories) || 0), 0),
      monthTotal: logs
        .filter(l => getLogDate(l) >= startOfMonth)
        .reduce((s, l) => s + (Number(l.calories) || 0), 0),
      yearTotal: logs
        .filter(l => getLogDate(l) >= startOfYear)
        .reduce((s, l) => s + (Number(l.calories) || 0), 0),
      peakIntake: { calories: peakValue, date: peakDate || "No data" }
    });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// --- 2. DAILY LOG ROUTES (FOR DASHBOARD) ---
router.get('/', async (req, res) => {
  const email = req.query.email?.toLowerCase();
  try {
    const logs = await Log.find({ userEmail: email }).sort({ createdAt: -1, date: -1 });
    res.json(logs);
  } catch (err) { 
    res.status(500).send(err); 
  }
});

router.post('/', async (req, res) => {
  try {
    // Ensure email is saved in lowercase for consistency
    const logData = {
      ...req.body,
      userEmail: req.body.userEmail?.toLowerCase()
    };
    const log = new Log(logData);
    await log.save();
    res.json(log);
  } catch (err) { 
    res.status(500).send(err); 
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Log.findByIdAndDelete(req.params.id);
    res.send("Deleted");
  } catch (err) { 
    res.status(500).send(err); 
  }
});

module.exports = router;
