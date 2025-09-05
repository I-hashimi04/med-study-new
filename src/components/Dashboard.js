import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCards: 0,
    totalQuestions: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user's cards
        const cardsResponse = await axios.get('/cards');
        
        // Simulate additional stats (in a real app, these would come from the API)
        setStats({
          totalCards: cardsResponse.data.length,
          totalQuestions: cardsResponse.data.length, // Placeholder
          recentActivity: cardsResponse.data.slice(0, 5)
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card-header">
        <h1 className="card-title">Welcome back, {user?.username}!</h1>
        <p>Here's your medical study progress overview.</p>
      </div>

      {/* Quick Stats */}
      <div className="admin-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-number">{stats.totalCards}</div>
          <div className="stat-label">Study Cards</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalQuestions}</div>
          <div className="stat-label">Generated Questions</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {user?.role === 'admin' ? 'Admin' : 'Student'}
          </div>
          <div className="stat-label">Role</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <Link to="/generate" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
            📝 Generate New Questions
          </Link>
          <Link to="/questions" className="btn btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>
            📚 View My Questions
          </Link>
          <Link to="/compare" className="btn btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}>
            🔄 Compare Models
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="btn btn-danger" style={{ textDecoration: 'none', textAlign: 'center' }}>
              ⚙️ Admin Panel
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Activity</h2>
        </div>
        {stats.recentActivity.length > 0 ? (
          <div>
            {stats.recentActivity.map((item, index) => (
              <div key={index} className="question-item" style={{ margin: '0.5rem 0' }}>
                <strong>Q:</strong> {item.question?.substring(0, 100)}...
                <br />
                <small style={{ color: '#7f8c8d' }}>
                  Created: {new Date(item.created_at).toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            <p>No recent activity found.</p>
            <p>
              <Link to="/generate" style={{ color: '#3498db' }}>
                Generate your first questions
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Study Tips */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">💡 Study Tips</h2>
        </div>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>Use the question generator to create targeted study materials from your lecture content</li>
          <li>Try different AI models to compare question quality and style</li>
          <li>Provide feedback on generated questions to help improve the system</li>
          <li>Regular practice with varied question types improves retention</li>
          <li>Focus on understanding concepts rather than memorizing answers</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;