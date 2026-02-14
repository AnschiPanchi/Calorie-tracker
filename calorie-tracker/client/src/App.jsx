import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import SearchBar from './components/SearchBar';
import FoodResult from './components/FoodResult';
import HistoryLog from './components/HistoryLog';
import Auth from './components/Auth';

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('userData')) || null);
  const [results, setResults] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Custom goal state with localStorage persistence
  const [goal, setGoal] = useState(() => Number(localStorage.getItem('dailyGoal')) || 2000);

  // NEW: State for consumption highlights
  const [stats, setStats] = useState({
    weekTotal: 0,
    monthTotal: 0,
    yearTotal: 0,
    peakIntake: { calories: 0, date: 'No data' }
  });

  // Fetch daily logs
  useEffect(() => {
    if (user?.email) {
      axios.get(`http://localhost:5000/api/logs?email=${user.email}`)
        .then(res => setLog(res.data))
        .catch(err => console.error(err));
    }
  }, [user]);

  // NEW: Fetch consumption highlights (stats)
  useEffect(() => {
    if (user?.email) {
      axios.get(`http://localhost:5000/api/logs/stats?email=${user.email}`)
        .then(res => setStats(res.data))
        .catch(err => console.error("Stats fetch error:", err));
    }
  }, [user, log]); // Refetch stats whenever logs are updated

  // Save custom goal whenever it changes
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
      const res = await axios.get(`http://localhost:5000/api/search?foodName=${query}`);
      setResults(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (!user) return <Auth onLogin={handleLogin} />;

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
                <label>Set Daily Goal</label>
                <div className="goal-input-wrapper">
                  <input 
                    type="number" 
                    value={goal} 
                    onChange={(e) => setGoal(Number(e.target.value))}
                    placeholder="2000"
                  />
                  <span>kcal</span>
                </div>
              </div>

              {total > goal && <div className="overdose-warning">⚠️ LIMIT EXCEEDED</div>}
            </div>
          </aside>

          <main className="main-content">
            <SearchBar onSearch={handleSearch} />
            {loading ? <div className="loader-container"><div className="spinner"></div></div> : <FoodResult results={results} onAdd={(f, c) => {
              axios.post('http://localhost:5000/api/logs', { userEmail: user.email, description: f.description, calories: c })
                .then(res => setLog([res.data, ...log]));
            }} />}
          </main>

          <aside className="sidebar-sticky right-sidebar">
            <HistoryLog log={log} onDelete={(id) => axios.delete(`http://localhost:5000/api/logs/${id}`).then(() => setLog(log.filter(l => l._id !== id)))} />
          </aside>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="stats-page-container">
          <div className="stats-grid">
            <div className="stat-card highlight">
              <h3>Peak Intake</h3>
              <div className="stat-value">{stats.peakIntake.calories}<span> kcal</span></div>
              <p>Achieved on {stats.peakIntake.date}</p>
            </div>
            <div className="stat-card">
              <h3>This Week</h3>
              <div className="stat-value">{stats.weekTotal}<span> kcal</span></div>
            </div>
            <div className="stat-card">
              <h3>This Month</h3>
              <div className="stat-value">{stats.monthTotal}<span> kcal</span></div>
            </div>
            <div className="stat-card">
              <h3>This Year</h3>
              <div className="stat-value">{stats.yearTotal}<span> kcal</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="about-page-container">
          <div className="about-card">
            <div className="about-header">
              <h1>About NutriTrack</h1>
              <p>A premium health platform developed by <strong>Ansh Gupta</strong>, a B.Tech Computer Science student at KCCITM.</p>
            </div>
            <div className="about-grid">
              <div className="about-section">
                <h3>🚀 Our Mission</h3>
                <p>NutriTrack aims to simplify health management by providing real-time nutritional insights and personalized tracking to help users reach their fitness goals.</p>
              </div>
              <div className="about-section">
                <h3>💻 Technical Stack</h3>
                <div className="tech-tags">
                  <span>React.js</span>
                  <span>Node.js</span>
                  <span>MongoDB</span>
                  <span>Express</span>
                  <span>Nutrition API</span>
                </div>
              </div>
            </div>
            <div className="features-showcase">
              <div className="feature-box">
                <div className="feature-icon">📊</div>
                <h4>Smart Tracker</h4>
                <p>Visual calorie ring with dynamic color-coding based on your limits.</p>
              </div>
              <div className="feature-box">
                <div className="feature-icon">🥗</div>
                <h4>USDA Verified</h4>
                <p>Reliable data sourced from global nutritional databases.</p>
              </div>
              <div className="feature-box">
                <div className="feature-icon">🔒</div>
                <h4>Secure History</h4>
                <p>Your logs are saved securely and can be managed instantly.</p>
              </div>
            </div>
            <div className="about-footer">
              <p>Interested in my work? Let's connect!</p>
              <div className="social-links">
                <a href="#" className="social-btn linkedin">LinkedIn</a>
                <a href="#" className="social-btn github">GitHub</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;