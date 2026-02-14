import React from 'react';
import { Trash2, Clock } from 'lucide-react';

const HistoryLog = ({ log, onDelete }) => {
  return (
    <div className="history-container">
      <div className="history-header">
        <Clock size={20} color="#10b981" />
        <h3>Today's Log</h3>
      </div>
      
      {log.length === 0 ? (
        <div className="empty-state">
          <p>No food logged yet.</p>
        </div>
      ) : (
        <div className="log-list">
          {log.map((item) => (
            <div key={item._id} className="log-item">
              <div className="log-info">
                <span className="log-name">{item.description}</span>
                <span className="log-calories">{item.calories} kcal</span>
              </div>
              <button 
                className="delete-log-btn" 
                onClick={() => onDelete(item._id)}
                title="Delete entry"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryLog;