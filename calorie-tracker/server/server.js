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
const allowedOrigins = [
  'http://localhost:5173', // Keep for local testing
  'https://your-nutri-app.vercel.app' // ADD YOUR LIVE VERCEL URL HERE
];

app.use(cors({
<<<<<<< HEAD
  origin: function (origin, callback) {
    // Allows requests with no origin (like mobile apps) or matching our list
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true
=======
    origin: ["https://calorie-tracker-dv42.vercel.app"], // <-- Put your live frontend link here
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
>>>>>>> db4419630956d5db205be3f2c1eec595b348c046
}));
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

  try {
    const response = await axios.get(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${foodName}`
    );

    // IMPORTANT: Access the .foods property from the response
    const foods = response.data.foods;

    if (!foods || foods.length === 0) {
      return res.json([]); // Return empty list if no results
    }

    res.json(foods); // Send the array of foods to your React frontend
  } catch (error) {
    console.error("❌ USDA API Error:", error.message);
    res.status(500).json({ error: "Failed to fetch from USDA" });
  }
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
