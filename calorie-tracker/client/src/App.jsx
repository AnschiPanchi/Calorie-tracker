import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import SearchBar from './components/SearchBar';
import FoodResult from './components/FoodResult';
import HistoryLog from './components/HistoryLog';
import Auth from './components/Auth';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('userData')) || null);
  const [results, setResults] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [goal, setGoal] = useState(() => Number(localStorage.getItem('dailyGoal')) || 2000);

  const [stats, setStats] = useState({
    weekTotal: 0, monthTotal: 0, yearTotal: 0,
    peakIntake: { calories: 0, date: 'No data' }
  });

  // --- LOGIC FUNCTIONS ---
  useEffect(() => {
    if (user?.email) {
      axios.get(`${API_BASE_URL}/api/logs?email=${user.email}`)
        .then(res => setLog(res.data))
        .catch(err => console.error(err));
    }
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      axios.get(`${API_BASE_URL}/api/logs/stats?email=${user.email}`)
        .then(res => setStats(res.data))
        .catch(err => console.error("Stats fetch error:", err));
    }
  }, [user, log]);

  // FIXED: Added the missing handleDelete function
  const handleDelete = (id) => {
    axios.delete(`${API_BASE_URL}/api/logs/${id}`)
      .then(() => setLog(log.filter(l => l._id !== id)))
      .catch(err => console.error("Delete error:", err));
  };

  const handleSearch = async (query) => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/search?foodName=${query}`);
      setResults(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLogin = (data) => {
    localStorage.setItem('userData', JSON.stringify(data));
    setUser(data);
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  // --- UI CALCULATION ---
  const total = log.reduce((s, i) => s + (Number(i.calories) || 0), 0);
  const percentage = Math.min((total / goal) * 100, 100);
  const radius = 85; 
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <div className="dashboard-root">
      <header className="top-nav">
        <div className="nav-left">
          <div className="nav-logo" onClick={() => setActiveTab('dashboard')}>NutriTrack</div>
          <nav className="nav-links">
            <button className={`nav-link-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
            <button className={`nav-link-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>Insights</button>
            <button className={`nav-link-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>About</button>
          </nav>
        </div>
        <div className="user-section">
          <span className="user-name">Hello, {user.name}</span>
          <button className="logout-btn" onClick={() => { localStorage.removeItem('userData'); setUser(null); }}>Logout</button>
        </div>
      </header>

      {activeTab === 'dashboard' && (
        <div className="app-wrapper"> 
          {/* COLUMN 1: Meter */}
          <aside className="sidebar-sticky left-sidebar">
            <div className="summary-card">
               <div className="meter-container">
                  <svg width="200" height="200">
                    <circle stroke="#f1f5f9" strokeWidth="14" fill="transparent" r={radius} cx="100" cy="100"/>
                    <circle 
                      stroke={total > goal ? '#ef4444' : '#10b981'} 
                      strokeWidth="14" 
                      strokeDasharray={strokeDasharray} 
                      style={{ strokeDashoffset, transition: '0.6s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }} 
                      fill="transparent" r={radius} cx="100" cy="100" 
                    />
                  </svg>
                  <div className="total-display">
                    <h2>{total}</h2>
                    <span>/ {goal} kcal</span>
                  </div>
               </div>
               <div className="goal-setting-area">
                  <label>Daily Goal</label>
                  <div className="goal-input-wrapper">
                    <input type="number" value={goal} onChange={(e) => setGoal(Number(e.target.value))} />
                    <span>kcal</span>
                  </div>
               </div>
            </div>
          </aside>

          {/* COLUMN 2: Middle (Search) */}
          <main className="main-content">
            <div className="search-container">
              <SearchBar onSearch={handleSearch} />
            </div>
            {loading ? (
              <div className="loader-container"><div className="spinner"></div></div>
            ) : (
              <div className="results-grid">
                <FoodResult results={results} onAdd={(f, c) => {
                  axios.post(`${API_BASE_URL}/api/logs`, { userEmail: user.email, description: f.description, calories: c })
                    .then(res => setLog([res.data, ...log]));
                }} />
              </div>
            )}
          </main>

          {/* COLUMN 3: Right (History) */}
          <aside className="sidebar-sticky right-sidebar">
            <HistoryLog log={log} onDelete={handleDelete} />
          </aside>
        </div>
      )}
      
      {/* (Keep your existing Stats/About Tab code here) */}
    </div>
  );
}

export default App;
