const dns = require('node:dns/promises');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const logRoutes = require('./routes/logs.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ROUTE MOUNTING
app.use('/api/logs', logRoutes); 

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

// Models - Keep User here for now, but Log MUST be moved out
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String }
}));

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  const newUser = new User(req.body);
  await newUser.save();
  res.json(newUser);
});

app.post('/api/auth/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email, password: req.body.password });
  if (user) res.json(user);
  else res.status(401).send("Invalid credentials");
});

// USDA Search Route
app.get('/api/search', async (req, res) => {
  const { foodName } = req.query;
  const apiKey = process.env.USDA_API_KEY;

  if (!apiKey) {
    console.error("❌ ERROR: USDA_API_KEY is missing!");
    return res.status(500).json({ error: "Missing API Key" });
  }

  try {
    const response = await axios.get(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${foodName}`
    );
    res.json(response.data.foods || []);
  } catch (error) {
    res.status(500).json({ error: "USDA Fetch Failed" });
  }
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));