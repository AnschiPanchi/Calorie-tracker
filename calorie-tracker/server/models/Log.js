const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  description: { type: String, required: true },
  calories: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true }); // Timestamps are vital for the Week/Year stats

module.exports = mongoose.model('Log', LogSchema);