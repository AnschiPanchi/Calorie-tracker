import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import SearchBar from './components/SearchBar';
import FoodResult from './components/FoodResult';
import HistoryLog from './components/HistoryLog';
import Auth from './components/Auth';

// Use the environment variable, fall back to localhost for your coding sessions
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('userData')) || null);
  const [results, setResults] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [goal, setGoal] = useState(() => Number(localStorage.getItem('dailyGoal')) || 2000);

  const [stats, setStats] = useState({
    weekTotal: 0,
    monthTotal: 0,
    yearTotal: 0,
    peakIntake: { calories: 0, date: 'No data' }
  });

  // Fetch daily logs using API_BASE_URL
  useEffect(() => {
    if (user?.email) {
      axios.get(`${API_BASE_URL}/api/logs?email=${user.email}`)
        .then(res => setLog(res.data))
        .catch(err => console.error(err));
    }
  }, [user]);

  // Fetch consumption highlights (stats)
  useEffect(() => {
    if (user?.email) {
      axios.get(`${API_BASE_URL}/api/logs/stats?email=${user.email}`)
        .then(res => setStats(res.data))
        .catch(err => console.error("Stats fetch error:", err));
    }
  }, [user, log]);

  useEffect(() => {
    localStorage.setItem('dailyGoal', goal);
  }, [goal]);

  const total = log.reduce((s, i) => s + (Number(i.calories) || 0), 0);
  const percentage = Math.min((total / goal) * 100, 100);
  const radius = 85; 
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  const handleLogin = (data) => {
    localStorage.setItem('userData', JSON.stringify(data));
    setUser(data);
  };

  const handleSearch = async (query) => {
    if (!query) return;
    setLoading(true);
    try {
      // Corrected to use the live Render URL via API_BASE_URL
      const res = await axios.get(`${API_BASE_URL}/api/search?foodName=${query}`);
      setResults(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="dashboard-root">
      {/* ... Rest of your component code is perfect ... */}
      <header className="top-nav">
        {/* ... (navigation content) ... */}
      </header>
      
      {activeTab === 'dashboard' && (
  <div className="app-wrapper"> {/* This creates the 3-column grid */}
    
    {/* COLUMN 1: Calorie Meter Sidebar */}
    <aside className="sidebar-sticky left-sidebar">
      <div className="summary-card">
         {/* ... Your Meter Code ... */}
      </div>
    </aside>

    {/* COLUMN 2: Search and Food Results */}
    <main className="main-content">
      <SearchBar onSearch={handleSearch} />
      {/* ... Food Results Grid ... */}
    </main>

    {/* COLUMN 3: History Bar (Today's Log) */}
    <aside className="sidebar-sticky right-sidebar">
      <HistoryLog log={log} onDelete={handleDelete} />
    </aside>

  </div>
)}
      {/* ... (stats and about tabs) ... */}
    </div>
  );
}

export default App;
