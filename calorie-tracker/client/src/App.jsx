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

      {/* --- DASHBOARD TAB --- */}
      {activeTab === 'dashboard' && (
        <div className="app-wrapper"> 
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
               {total > goal && <div className="overdose-warning">Capacity Exceeded!</div>}
            </div>
          </aside>

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

          <aside className="sidebar-sticky right-sidebar">
            <HistoryLog log={log} onDelete={handleDelete} />
          </aside>
        </div>
      )}

      {/* --- INSIGHTS TAB --- */}
      {activeTab === 'stats' && (
        <div className="stats-page-container">
          <div className="stats-grid">
            <div className="stat-card highlight">
              <label>Peak Intake</label>
              <h2>{stats.peakIntake.calories}<span>kcal</span></h2>
              <p>Achieved on {stats.peakIntake.date !== 'No data' ? new Date(stats.peakIntake.date).toLocaleDateString() : 'No data'}</p>
            </div>
            <div className="stat-card">
              <label>This Week</label>
              <h2>{stats.weekTotal}<span>kcal</span></h2>
            </div>
            <div className="stat-card">
              <label>This Month</label>
              <h2>{stats.monthTotal}<span>kcal</span></h2>
            </div>
          </div>
        </div>
      )}

      {/* --- ABOUT TAB --- */}
      {activeTab === 'about' && (
        <div className="about-page-container">
          <div className="about-hero">
            <h1 className="about-title">About <span>NutriTrack</span></h1>
            <p className="about-subtitle">
              A premium health platform developed by <strong>Ansh Gupta</strong>, a B.Tech Computer Science student at KCCITM.
            </p>
          </div>

          <div className="about-main-grid">
            <section className="about-section">
              <div className="section-header">
                <span className="icon">🚀</span>
                <h2>Our Mission</h2>
              </div>
              <p>
                NutriTrack aims to simplify health management by providing real-time nutritional insights 
                and personalized tracking to help users reach their fitness goals.
              </p>
            </section>

            <section className="about-section">
              <div className="section-header">
                <span className="icon">💻</span>
                <h2>Technical Stack</h2>
              </div>
              <div className="tech-tags">
                <span className="tag">React.js</span>
                <span className="tag">Node.js</span>
                <span className="tag">MongoDB</span>
                <span className="tag">Express</span>
                <span className="tag">Nutrition API</span>
              </div>
            </section>
          </div>

          <div className="features-row">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Smart Tracker</h3>
              <p>Visual calorie ring with dynamic color-coding based on your limits.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🥗</div>
              <h3>USDA Verified</h3>
              <p>Reliable data sourced from global nutritional databases.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure History</h3>
              <p>Your logs are saved securely and can be managed instantly.</p>
            </div>
          </div>

          <div className="about-footer">
            <p>Interested in my work? Let's connect!</p>
            <div className="footer-links">
              <a href="#" className="social-btn linkedin">LinkedIn</a>
              <a href="#" className="social-btn github">GitHub</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
