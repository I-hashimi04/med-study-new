import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [analyticsResponse, usersResponse] = await Promise.all([
        axios.get('/admin/analytics'),
        axios.get('/admin/users')
      ]);
      
      setAnalytics(analyticsResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div>
      <div className="admin-grid">
        <div className="stat-card">
          <div className="stat-number">{analytics.total_users || 0}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{analytics.active_users || 0}</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{analytics.total_cards || 0}</div>
          <div className="stat-label">Study Cards</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{analytics.total_questions || 0}</div>
          <div className="stat-label">Generated Questions</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{analytics.total_feedback || 0}</div>
          <div className="stat-label">Feedback Entries</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📊 System Health</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', color: '#27ae60' }}>✅</div>
            <div style={{ fontWeight: '600' }}>Backend API</div>
            <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>Operational</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', color: '#27ae60' }}>✅</div>
            <div style={{ fontWeight: '600' }}>Python Worker</div>
            <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>Operational</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', color: '#27ae60' }}>✅</div>
            <div style={{ fontWeight: '600' }}>Database</div>
            <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>Operational</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🎯 Recent Activity</h3>
        </div>
        <p style={{ color: '#7f8c8d' }}>
          Real-time activity monitoring would be displayed here in a production environment.
        </p>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">👥 User Management</h3>
        <p>Total Users: {users.length}</p>
      </div>
      
      {users.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Cards</th>
              <th>Questions</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`tag ${user.role === 'admin' ? 'difficulty-difficult' : 'difficulty-easy'}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`tag ${user.is_active ? 'difficulty-easy' : 'difficulty-difficult'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{user.card_count || 0}</td>
                <td>{user.question_count || 0}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      Edit
                    </button>
                    <button 
                      className={`btn ${user.is_active ? 'btn-danger' : 'btn-success'}`}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
          No users found
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">⚙️ Application Settings</h3>
        </div>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Default LLM Model</label>
            <select className="form-input">
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-2">Claude 2</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Max Questions per Session</label>
            <input type="number" className="form-input" defaultValue="20" min="1" max="100" />
          </div>

          <div className="form-group">
            <label className="form-label">Enable Model Comparison</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" defaultChecked />
              Allow users to compare multiple models
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Feedback Collection</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" defaultChecked />
              Collect user feedback on generated questions
            </label>
          </div>

          <button className="btn btn-primary">
            Save Settings
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔒 Security Settings</h3>
        </div>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Session Timeout (minutes)</label>
            <input type="number" className="form-input" defaultValue="60" min="15" max="480" />
          </div>

          <div className="form-group">
            <label className="form-label">Rate Limiting</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Requests per minute</label>
                <input type="number" className="form-input" defaultValue="100" />
              </div>
              <div>
                <label className="form-label">Window (minutes)</label>
                <input type="number" className="form-input" defaultValue="15" />
              </div>
            </div>
          </div>

          <button className="btn btn-primary">
            Update Security Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📋 System Logs</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select className="form-input" style={{ width: 'auto' }}>
            <option value="all">All Logs</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
          </select>
          <button className="btn btn-outline">Refresh</button>
          <button className="btn btn-secondary">Export</button>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: '#1e1e1e', 
        color: '#f8f8f2', 
        padding: '1rem', 
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <div style={{ color: '#50fa7b' }}>[2024-01-15 10:30:15] INFO: Server started on port 5000</div>
        <div style={{ color: '#8be9fd' }}>[2024-01-15 10:30:16] INFO: Database connected successfully</div>
        <div style={{ color: '#50fa7b' }}>[2024-01-15 10:32:22] INFO: User admin logged in</div>
        <div style={{ color: '#8be9fd' }}>[2024-01-15 10:33:45] INFO: Question generation completed for user 1</div>
        <div style={{ color: '#ffb86c' }}>[2024-01-15 10:35:12] WARN: Rate limit approached for IP 192.168.1.100</div>
        <div style={{ color: '#50fa7b' }}>[2024-01-15 10:36:33] INFO: Feedback submitted for question 123</div>
        <div style={{ color: '#8be9fd' }}>[2024-01-15 10:38:44] INFO: Model comparison request processed</div>
        <div style={{ color: '#f8f8f2' }}>...</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
          Loading admin panel...
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card-header">
        <h1 className="card-title">⚙️ Admin Panel</h1>
        <p>System administration and monitoring</p>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e1e5e9',
          marginBottom: '0'
        }}>
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'users', label: '👥 Users', icon: '👥' },
            { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
            { id: 'logs', label: '📋 Logs', icon: '📋' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: activeTab === tab.id ? '#3498db' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#333',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #3498db' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'logs' && renderLogs()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;