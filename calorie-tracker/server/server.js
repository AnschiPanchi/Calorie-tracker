const dns = require('node:dns/promises');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Keeps your local connection stable

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const logRoutes = require('./routes/logs.js');

const app = express();

// --- 1. FIXED CORS CONFIGURATION ---
const allowedOrigins = [
  'http://localhost:5173', 
  'https://calorie-tracker-dv42.vercel.app' // Your live Vercel URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allows requests from your Vercel site and local coding environment
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// --- 2. DATABASE & ROUTES ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

app.use('/api/logs', logRoutes); 

// --- 3. AUTH ROUTES ---
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
}));

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Check if user already exists to prevent crashes
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    const newUser = new User({ name, email, password });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Signup failed on server" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email, password: req.body.password });
    if (user) res.json(user);
    else res.status(401).json({ error: "Invalid email or password" });
  } catch (error) {
    res.status(500).json({ error: "Server error during login" });
  }
});

// --- 4. USDA SEARCH ROUTE ---
app.get('/api/search', async (req, res) => {
  const { foodName } = req.query;
  const apiKey = process.env.USDA_API_KEY;

  if (!foodName) return res.status(400).json({ error: "Search query required" });

  try {
    const response = await axios.get(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${foodName}`
    );
    const foods = response.data.foods || [];
    res.json(foods); 
  } catch (error) {
    console.error("❌ USDA API Error:", error.message);
    res.status(500).json({ error: "USDA Search failed" });
  }
});

// Use Render's dynamic port or default to 5000 for local
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
